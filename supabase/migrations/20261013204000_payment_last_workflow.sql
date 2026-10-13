-- Client intake before payment; professional work remains payment-gated.
begin;
alter table public.portal_cases drop constraint portal_cases_workflow_check;
alter table public.portal_cases add constraint portal_cases_workflow_check check(workflow in ('legacy-paid-first','engagement-first','payment-last'));
alter table public.portal_cases add column intake_submitted_at timestamptz;
alter table public.portal_cases add column intake_missing jsonb;
alter table public.payment_orders add column invoice_started_at timestamptz;
-- Preserve accepted letters and issued payment requests.
update public.portal_cases c set workflow='payment-last' where workflow='engagement-first' and status='awaiting_agreement'
and exists(select 1 from public.portal_agreements a where a.case_id=c.id and a.accepted_at is null)
and exists(select 1 from public.payment_orders o where o.id=c.payment_order_id and o.status='pending' and o.stripe_invoice_id is null and o.stripe_checkout_session_id is null);
create or replace function public.portal_create_engagement_case(p_case jsonb,p_agreement jsonb,p_hash text,p_actor uuid)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare e public.enquiries%rowtype; o public.payment_orders%rowtype; c public.portal_cases%rowtype;
  review jsonb := p_case->'screening'; owner uuid := (p_case->>'owner_id')::uuid;
begin
  if p_actor is not null and not exists(select 1 from public.portal_accounts where user_id=p_actor and role='staff' and active) then raise exception 'STAFF_REQUIRED'; end if;
  select * into e from public.enquiries where id=(p_case->>'enquiry_id')::uuid for update;
  if not found or e.email not like '%@example.com' or e.message not like 'AUTOMATED TEST ONLY%'
     or coalesce(e.intake->>'testOnly','')<>'true' or e.intake->>'service'<>'itin'
     or upper(p_case->>'legal_name') not like '%TEST%' then raise exception 'SANDBOX_ONLY'; end if;
  if p_actor is null then
    if coalesce(review->>'mode','')<>'self-service'
      or coalesce(e.intake->>'preference','')<>'online' or coalesce(e.intake->>'readiness','')<>'yes'
      or coalesce(e.intake->'basic'->>'ssnEligibility','')<>'No'
      or coalesce(e.intake->'basic'->>'passportReady','')<>'Yes'
      or coalesce(e.intake->'basic'->>'previousItinApplication','')<>(case when p_case->>'route_id'='renewal' then 'Yes' else 'No' end)
      or coalesce(e.intake->'basic'->>'returnReady','')<>(case when p_case->>'route_id' in ('spouse','prepared-1040nr','renewal') then 'Yes' else 'Not needed / applying with supporting evidence' end)
      or coalesce(e.intake->'onboarding'->>'documentsReady','')<>'true'
      or coalesce(e.intake->'onboarding'->>'taxPurposeUnderstood','')<>'true'
      or coalesce(e.intake->'onboarding'->>'originalsUnderstood','')<>'true'
      or e.intake->>'applicationRoute' is distinct from p_case->>'route_id'
      or e.intake->'onboarding'->>'address' is distinct from p_case->>'address'
      or e.intake->'onboarding'->>'taxYear' is distinct from p_case->>'tax_year'
      or p_case->>'route_id' not in ('spouse','prepared-1040nr','renewal','llc-dividend','llc-bank-account','partnership','firpta','pension','estate')
      or p_case->>'price_category' in ('other','complex-compensation') then raise exception 'SCREENING_REQUIRED'; end if;
  elsif coalesce(review->>'mode','assisted')<>'assisted' then raise exception 'SCREENING_REQUIRED'; end if;
  if not exists(select 1 from public.portal_accounts where user_id=owner and role='client' and active) then raise exception 'CLIENT_REQUIRED'; end if;
  if coalesce(review->>'ssnIneligible','')<>'true' or coalesce(review->>'federalTaxPurpose','')<>'true'
    or coalesce(review->>'originalsExplained','')<>'true' or coalesce(review->>'feesExplained','')<>'true'
    or coalesce(review->>'evidenceRoute','') not in ('tax-return','exception')
    or length(trim(coalesce(review->>'evidenceNotes','')))<10 then raise exception 'SCREENING_REQUIRED'; end if;
  if p_hash !~ '^[a-f0-9]{64}$' or coalesce(p_agreement->>'version','')='' then raise exception 'AGREEMENT_REQUIRED'; end if;
  select * into o from public.payment_orders where enquiry_id=e.id;
  if found then
    select * into c from public.portal_cases where payment_order_id=o.id;
    if found then
      if c.workflow not in ('engagement-first','payment-last') or c.owner_id<>owner or c.route_id<>p_case->>'route_id'
        or c.legal_name<>p_case->>'legal_name' or c.address<>p_case->>'address'
        or c.tax_year<>(p_case->>'tax_year')::integer or c.fee<>(p_case->>'fee')::bigint
        or c.screening is distinct from review then raise exception 'ENQUIRY_ALREADY_REVIEWED'; end if;
      return c.id;
    end if;
    if o.status<>'pending' or o.stripe_checkout_session_id is not null or o.kind not in ('checkout','invoice')
      or o.amount<>(p_case->>'fee')::bigint or o.service_category<>p_case->>'price_category' then raise exception 'ORDER_MISMATCH'; end if;
  else
    insert into public.payment_orders(enquiry_id,kind,service_category,amount,currency)
      values(e.id,'invoice',p_case->>'price_category',(p_case->>'fee')::bigint,'gbp') returning * into o;
  end if;
  insert into public.portal_cases(id,owner_id,payment_order_id,legal_name,address,route_id,price_category,fee,tax_year,checklist_version,workflow,screening,status)
    values((p_case->>'id')::uuid,owner,o.id,p_case->>'legal_name',p_case->>'address',p_case->>'route_id',p_case->>'price_category',o.amount,
      (p_case->>'tax_year')::integer,p_case->>'checklist_version','payment-last',review,'awaiting_agreement') returning * into c;
  insert into public.portal_agreements(case_id,version,snapshot,sha256) values(c.id,p_agreement->>'version',p_agreement,p_hash);
  insert into public.portal_audit(case_id,actor_id,action,detail) values(c.id,p_actor,case when p_actor is null then 'automatic_onboarding_screened' else 'eligibility_reviewed' end,review),
    (c.id,p_actor,'engagement_issued',jsonb_build_object('sha256',p_hash,'enquiry_id',e.id));
  return c.id;
end;
$$;

create or replace function public.portal_accept_agreement(p_case uuid,p_actor uuid,p_hash text,p_signature text,p_early boolean)
returns text language plpgsql security invoker set search_path = '' as $$
declare c public.portal_cases%rowtype; a public.portal_agreements%rowtype;
begin
  select * into c from public.portal_cases where id=p_case for update;
  if not found or c.owner_id<>p_actor or c.status='cancelled'
    or not exists(select 1 from public.portal_accounts where user_id=p_actor and active and role='client') then raise exception 'CASE_ACCESS_DENIED'; end if;
  if c.workflow='legacy-paid-first' and not exists(select 1 from public.payment_orders where id=c.payment_order_id and status='paid' and amount=c.fee and currency='gbp') then raise exception 'PAYMENT_REQUIRED'; end if;
  select * into a from public.portal_agreements where case_id=p_case for update;
  if not found or a.sha256<>p_hash then raise exception 'AGREEMENT_VERSION_MISMATCH'; end if;
  if a.accepted_at is not null then return 'already_accepted'; end if;
  if c.workflow in ('engagement-first','payment-last') and c.status<>'awaiting_agreement' then raise exception 'CASE_ACCESS_DENIED'; end if;
  if length(trim(p_signature))<2 or length(p_signature)>100 then raise exception 'SIGNATURE_REQUIRED'; end if;
  update public.portal_agreements set accepted_at=now(),signer_id=p_actor,
    signer_email=(select email from public.portal_accounts where user_id=p_actor),typed_signature=trim(p_signature),start_early=p_early,
    work_may_start_at=case when p_early then now() else now()+interval '14 days' end where case_id=p_case;
  if c.workflow='payment-last' then update public.portal_cases set status='collecting' where id=p_case; end if;
  if c.workflow='engagement-first' then update public.portal_cases set status='awaiting_payment' where id=p_case; end if;
  insert into public.portal_audit(case_id,actor_id,action,detail) values(p_case,p_actor,'agreement_accepted',jsonb_build_object('sha256',p_hash,'start_early',p_early));
  return 'accepted';
end;
$$;

create or replace function public.portal_save_answers(p_case uuid,p_actor uuid,p_answers jsonb,p_revision integer)
returns integer language plpgsql security invoker set search_path = '' as $$
declare c public.portal_cases%rowtype; a public.portal_answers%rowtype;
begin
  select * into c from public.portal_cases where id=p_case for update;
  if not found or c.owner_id<>p_actor or c.status not in ('collecting','review','missing_information','awaiting_payment')
    or not exists(select 1 from public.portal_accounts where user_id=p_actor and active and role='client') then raise exception 'CASE_ACCESS_DENIED'; end if;
  if not exists(select 1 from public.portal_agreements where case_id=p_case and accepted_at is not null) then raise exception 'AGREEMENT_REQUIRED'; end if;
  if c.workflow<>'payment-last' and not exists(select 1 from public.payment_orders where id=c.payment_order_id and status='paid' and amount=c.fee and currency='gbp' and kind in ('checkout','invoice') and service_category=c.price_category) then raise exception 'PAYMENT_REQUIRED'; end if;
  if jsonb_typeof(p_answers)<>'object' or length(p_answers::text)>100000 then raise exception 'INVALID_INPUT'; end if;
  select * into a from public.portal_answers where case_id=p_case;
  if coalesce(a.revision,0)<>p_revision then raise exception 'ANSWERS_VERSION_MISMATCH'; end if;
  insert into public.portal_answers(case_id,answers,revision) values(p_case,p_answers,p_revision+1)
    on conflict(case_id) do update set answers=excluded.answers,revision=excluded.revision,updated_at=now();
  return p_revision+1;
end;
$$;

create or replace function public.portal_guard_payment() returns trigger language plpgsql security invoker set search_path = '' as $$
declare c public.portal_cases%rowtype;
begin
  select * into c from public.portal_cases where payment_order_id=new.id and workflow in ('engagement-first','payment-last');
  if found and new.status='paid' then
    if new.amount<>c.fee or new.currency<>'gbp' or new.service_category<>c.price_category or new.kind not in ('checkout','invoice') then raise exception 'ORDER_MISMATCH'; end if;
    if not exists(select 1 from public.portal_agreements where case_id=c.id and accepted_at is not null) then raise exception 'AGREEMENT_REQUIRED'; end if;
    if c.workflow='payment-last' and c.intake_submitted_at is null then raise exception 'INTAKE_REQUIRED'; end if;
  end if;
  return new;
end;
$$;
create or replace function public.portal_prepare_payment(p_case uuid,p_actor uuid,p_missing jsonb)
returns text language plpgsql security invoker set search_path='' as $$
declare c public.portal_cases%rowtype;
begin
 select * into c from public.portal_cases where id=p_case for update;
 if not found or not c.test_only or c.workflow<>'payment-last' or c.owner_id<>p_actor
 or c.status not in ('collecting','missing_information','awaiting_payment')
 or not exists(select 1 from public.portal_accounts where user_id=p_actor and active and role='client') then raise exception 'CASE_ACCESS_DENIED'; end if;
 if not exists(select 1 from public.portal_agreements where case_id=p_case and accepted_at is not null) then raise exception 'AGREEMENT_REQUIRED'; end if;
 if jsonb_typeof(p_missing)<>'array' or length(p_missing::text)>10000 then raise exception 'INVALID_INPUT'; end if;
 if exists(select 1 from public.payment_orders where id=c.payment_order_id and status='paid') then raise exception 'ALREADY_PAID'; end if;
 update public.portal_cases set status='awaiting_payment',intake_submitted_at=coalesce(intake_submitted_at,now()),intake_missing=p_missing where id=p_case;
 if c.intake_submitted_at is null then insert into public.portal_audit(case_id,actor_id,action,detail) values(p_case,p_actor,'intake_ready_for_payment',jsonb_build_object('missing',p_missing)); end if;
 return 'awaiting_payment';
end; $$;
create or replace function public.portal_unlock_paid_case() returns trigger language plpgsql security invoker set search_path='' as $$
declare c public.portal_cases%rowtype;
begin
 if new.status='paid' then
  update public.portal_cases set status='collecting' where payment_order_id=new.id and workflow='engagement-first' and status='awaiting_payment';
  update public.portal_cases set status='review' where payment_order_id=new.id and workflow='payment-last' and status='awaiting_payment' returning * into c;
  if found then
   insert into public.portal_notifications(event_key,case_id,recipient) values('paid-review-'||c.id,c.id,'staff') on conflict(event_key) do nothing;
   insert into public.portal_audit(case_id,actor_id,action,detail) values(c.id,null,'paid_review_requested',jsonb_build_object('order_id',new.id));
  end if;
 end if;
 return new;
end; $$;
create function public.portal_claim_invoice_start(p_order uuid) returns timestamptz language plpgsql security invoker set search_path='' as $$
declare o public.payment_orders%rowtype; c public.portal_cases%rowtype;
begin
 select * into o from public.payment_orders where id=p_order for update;
 select * into c from public.portal_cases where payment_order_id=p_order;
 if c.id is null or not c.test_only or c.status<>'awaiting_payment' or o.kind<>'invoice' or o.status='paid' then raise exception 'CASE_ACCESS_DENIED'; end if;
 if not exists(select 1 from public.portal_agreements where case_id=c.id and accepted_at is not null) then raise exception 'AGREEMENT_REQUIRED'; end if;
 if c.workflow='payment-last' and c.intake_submitted_at is null then raise exception 'INTAKE_REQUIRED'; end if;
 update public.payment_orders set invoice_started_at=coalesce(invoice_started_at,case when stripe_customer_id is not null or stripe_invoice_id is not null then created_at else now() end) where id=p_order returning * into o;
 return o.invoice_started_at;
end; $$;
revoke all on function public.portal_prepare_payment(uuid,uuid,jsonb),public.portal_claim_invoice_start(uuid) from public,anon,authenticated;
grant execute on function public.portal_prepare_payment(uuid,uuid,jsonb),public.portal_claim_invoice_start(uuid) to service_role;
commit;
