begin;
create table public.portal_instruction_versions (
 id uuid primary key default gen_random_uuid(), case_id uuid not null references public.portal_cases(id),
 version text not null, category text, snapshot jsonb not null check(jsonb_typeof(snapshot)='object'),
 sha256 text not null check(sha256 ~ '^[a-f0-9]{64}$'), issued_by uuid references public.portal_accounts(user_id),
 created_at timestamptz not null default now(), unique(case_id,id)
);
create index portal_instruction_versions_case_idx on public.portal_instruction_versions(case_id);
create index portal_instruction_versions_issuer_idx on public.portal_instruction_versions(issued_by);
create table public.portal_document_intake (
 case_id uuid primary key references public.portal_cases(id), instruction_version_id uuid,
 category text, firpta jsonb, responses jsonb not null default '{}'::jsonb, applicability jsonb not null default '{}'::jsonb,
 revision integer not null default 0 check(revision>=0), updated_at timestamptz not null default now(),
 foreign key(case_id,instruction_version_id) references public.portal_instruction_versions(case_id,id),
 check(jsonb_typeof(responses)='object' and jsonb_typeof(applicability)='object')
);
create index portal_document_intake_version_idx on public.portal_document_intake(case_id,instruction_version_id);
alter table public.portal_instruction_versions enable row level security;
alter table public.portal_document_intake enable row level security;
revoke all on public.portal_instruction_versions,public.portal_document_intake from public,anon,authenticated,service_role;
grant select on public.portal_instruction_versions,public.portal_document_intake to authenticated;
grant select,insert on public.portal_instruction_versions to service_role;
grant select,insert,update on public.portal_document_intake to service_role;
create policy portal_instruction_read on public.portal_instruction_versions for select to authenticated using(portal_private.can_read_case(case_id));
create policy portal_document_intake_read on public.portal_document_intake for select to authenticated using(portal_private.can_read_case(case_id));
-- Previously stored document choices are copied out of eligibility screening.
insert into public.portal_document_intake(case_id,category,responses)
select id,screening->>'instructionCategory',coalesce(screening->'documentResponses','{}'::jsonb) from public.portal_cases
where screening ? 'instructionCategory' or screening ? 'documentResponses';
update public.portal_cases set screening=screening-'instructionCategory'-'documentResponses'
where screening ? 'instructionCategory' or screening ? 'documentResponses';

create function public.portal_save_document_intake(p_case uuid,p_actor uuid,p_revision integer,p_value jsonb,p_snapshot jsonb,p_hash text,p_action text)
returns integer language plpgsql security invoker set search_path='' as $$
declare c public.portal_cases%rowtype; d public.portal_document_intake%rowtype; v uuid; is_staff boolean;
begin
 select * into c from public.portal_cases where id=p_case for update;
 if not found or not c.test_only then raise exception 'CASE_ACCESS_DENIED'; end if;
 select exists(select 1 from public.portal_accounts where user_id=p_actor and active and role='staff') into is_staff;
 if not is_staff and (c.owner_id<>p_actor or not exists(select 1 from public.portal_accounts where user_id=p_actor and active and role='client')) then raise exception 'CASE_ACCESS_DENIED'; end if;
 select * into d from public.portal_document_intake where case_id=p_case;
 if p_action='initialize' and d.instruction_version_id is not null then return d.revision; end if;
 if coalesce(d.revision,0)<>p_revision then raise exception 'DOCUMENT_VERSION_MISMATCH'; end if;
 if p_action<>'initialize' then
  if c.status not in ('collecting','awaiting_payment','review','missing_information') or not exists(select 1 from public.portal_agreements where case_id=c.id and accepted_at is not null) then raise exception 'AGREEMENT_REQUIRED'; end if;
  if p_action in ('review-applicability','revise-instructions') and not is_staff then raise exception 'STAFF_REQUIRED'; end if;
  if p_action in ('instruction-category','firpta-selection') and c.intake_submitted_at is not null then raise exception 'INTAKE_LOCKED'; end if;
  if p_action not in ('instruction-category','firpta-selection','document-status','review-applicability','revise-instructions') then raise exception 'INVALID_ACTION'; end if;
 end if;
 if jsonb_typeof(p_value)<>'object' or jsonb_typeof(p_value->'responses')<>'object' or jsonb_typeof(p_value->'applicability')<>'object' then raise exception 'INVALID_INPUT'; end if;
 if p_action='review-applicability' and (not exists(select 1 from public.payment_orders where id=c.payment_order_id and status='paid' and amount=c.fee and currency='gbp') or not exists(select 1 from public.portal_agreements where case_id=c.id and accepted_at is not null and work_may_start_at<=now())) then raise exception 'WORK_START_NOT_AUTHORISED'; end if;
 v:=d.instruction_version_id;
 if p_snapshot is not null then
  if p_action not in ('initialize','instruction-category','firpta-selection','revise-instructions') or p_hash !~ '^[a-f0-9]{64}$' or jsonb_typeof(p_snapshot->'requirements')<>'array' or p_snapshot->>'routeId' is distinct from c.route_id then raise exception 'INVALID_SNAPSHOT'; end if;
  insert into public.portal_instruction_versions(case_id,version,category,snapshot,sha256,issued_by)
  values(c.id,p_snapshot->>'version',p_snapshot->>'category',p_snapshot,p_hash,p_actor) returning id into v;
 end if;
 if p_action='revise-instructions' then
  if length(trim(coalesce(p_value->>'revisionReason','')))<10 then raise exception 'REVISION_REASON_REQUIRED'; end if;
  update public.portal_documents set state='stored',original_checked=false where case_id=c.id and kind='upload';
  update public.portal_cases set status='missing_information' where id=c.id;
  insert into public.portal_requests(case_id,item_id,message,created_by) values(c.id,'additional-information','Your instructions have been updated: '||(p_value->>'revisionReason')||'. Please review the new version. Your earlier instructions remain in the case history.',p_actor);
 end if;
 if p_snapshot is not null then update public.portal_cases set checklist_version=p_snapshot->>'version' where id=c.id; end if;
 if v is null then raise exception 'INSTRUCTIONS_REQUIRED'; end if;
 insert into public.portal_document_intake(case_id,instruction_version_id,category,firpta,responses,applicability,revision)
 values(c.id,v,p_value->>'category',nullif(p_value->'firpta','null'::jsonb),p_value->'responses',p_value->'applicability',coalesce(d.revision,0)+1)
 on conflict(case_id) do update set instruction_version_id=excluded.instruction_version_id,category=excluded.category,firpta=excluded.firpta,responses=excluded.responses,applicability=excluded.applicability,revision=excluded.revision,updated_at=now();
 insert into public.portal_audit(case_id,actor_id,action,detail) values(c.id,p_actor,p_action,jsonb_build_object('instruction_version_id',v,'revision',coalesce(d.revision,0)+1,'value',p_value));
 return coalesce(d.revision,0)+1;
end; $$;

create function public.portal_review_document(p_case uuid,p_actor uuid,p_document uuid,p_state text,p_original_source text,p_note text)
returns text language plpgsql security invoker set search_path='' as $$
declare c public.portal_cases%rowtype; d public.portal_documents%rowtype;
begin
 select * into c from public.portal_cases where id=p_case for update;
 if not found or not c.test_only or not exists(select 1 from public.portal_accounts where user_id=p_actor and active and role='staff') then raise exception 'STAFF_REQUIRED'; end if;
 if not exists(select 1 from public.payment_orders where id=c.payment_order_id and status='paid' and amount=c.fee and currency='gbp' and service_category=c.price_category and kind in ('invoice','checkout')) then raise exception 'PAYMENT_REQUIRED'; end if;
 if not exists(select 1 from public.portal_agreements where case_id=c.id and accepted_at is not null and work_may_start_at<=now()) then raise exception 'WORK_START_NOT_AUTHORISED'; end if;
 select * into d from public.portal_documents where id=p_document and case_id=c.id and kind='upload' for update;
 if not found or p_state not in ('accepted','replace_requested') or p_original_source not in ('not-received','wet-original','issuer-original-reviewed') or length(trim(coalesce(p_note,'')))<3 then raise exception 'INVALID_REVIEW'; end if;
 update public.portal_documents set state=p_state,original_checked=(p_state='accepted' and p_original_source<>'not-received') where id=d.id;
 insert into public.portal_audit(case_id,actor_id,action,detail) values(c.id,p_actor,'document_reviewed',jsonb_build_object('document_id',d.id,'sha256',d.sha256,'state',p_state,'original_source',p_original_source,'note',p_note));
 return 'reviewed';
end; $$;
revoke all on function public.portal_save_document_intake(uuid,uuid,integer,jsonb,jsonb,text,text),public.portal_review_document(uuid,uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.portal_save_document_intake(uuid,uuid,integer,jsonb,jsonb,text,text),public.portal_review_document(uuid,uuid,uuid,text,text,text) to service_role;
create or replace function public.portal_record_stage(p_case uuid,p_actor uuid,p_stage text,p_details jsonb) returns text language plpgsql security invoker set search_path = '' as $$
declare c public.portal_cases%rowtype; intake public.portal_document_intake%rowtype; snap jsonb; requirement jsonb; need boolean; decision jsonb;
begin
  if not exists(select 1 from public.portal_accounts where user_id=p_actor and role='staff' and active) then raise exception 'STAFF_REQUIRED'; end if;
  select * into c from public.portal_cases where id=p_case for update;
  if not found or c.status in ('cancelled','complete') then raise exception 'CASE_ACCESS_DENIED'; end if;
  if not exists(select 1 from public.portal_agreements where case_id=p_case and accepted_at is not null and work_may_start_at<=now()) then raise exception 'WORK_START_NOT_AUTHORISED'; end if;
  if not exists(select 1 from public.payment_orders where id=c.payment_order_id and status='paid' and amount=c.fee and currency='gbp') then raise exception 'PAYMENT_REQUIRED'; end if;
  if p_stage in ('verification','submitted') then
    select * into intake from public.portal_document_intake where case_id=c.id;
    if found then
      select snapshot into snap from public.portal_instruction_versions where id=intake.instruction_version_id and case_id=c.id;
      if snap is null or snap->>'firptaPath'='review-required' or (c.route_id='firpta' and snap->'firpta'='null'::jsonb) then raise exception 'INSTRUCTIONS_REQUIRED'; end if;
      for requirement in select value from jsonb_array_elements(snap->'requirements') loop
        decision:=intake.applicability->(requirement->>'id');
        if requirement->>'level'='conditional' and decision is null then raise exception 'APPLICABILITY_REVIEW_REQUIRED'; end if;
        need:=requirement->>'level'='mandatory' or coalesce((decision->>'required')::boolean,false);
        if need and not exists(select 1 from public.portal_documents where case_id=c.id and item_id=requirement->>'id' and kind='upload' and state='accepted') then raise exception 'DOCUMENT_REVIEW_REQUIRED'; end if;
        if need and coalesce((requirement->>'original')::boolean,false) and not exists(select 1 from public.portal_documents where case_id=c.id and item_id=requirement->>'id' and kind='upload' and state='accepted' and original_checked) then raise exception 'ORIGINAL_SUPPORT_REQUIRED'; end if;
      end loop;
    end if;
  end if;
  if p_stage='verification' then
    if c.status<>'draft_approved' or not exists(select 1 from public.portal_approvals where document_id=c.current_draft_id and decision='approved') then raise exception 'DRAFT_APPROVAL_REQUIRED'; end if;
    if coalesce(p_details->>'originalDocumentHeld','')<>'true' or coalesce(p_details->>'interviewConducted','')<>'true' or coalesce(p_details->>'originalW7Signature','')<>'true' or length(trim(coalesce(p_details->>'verifier','')))<2 then raise exception 'ORIGINAL_CHECKS_REQUIRED'; end if;
    update public.portal_cases set caa_verification=p_details||jsonb_build_object('recorded_at',now(),'sandbox_simulation',true),original_w7_received_at=now(),status='verification' where id=p_case;
  elsif p_stage='submitted' then
    if c.status<>'verification' or c.caa_verification is null or c.original_w7_received_at is null or exists(select 1 from public.portal_requests where case_id=p_case and not resolved) then raise exception 'VERIFICATION_OR_INFORMATION_REQUIRED'; end if;
    if length(trim(coalesce(p_details->>'reference','')))<3 then raise exception 'SUBMISSION_REFERENCE_REQUIRED'; end if;
    update public.portal_cases set submitted_at=now(),submission_reference=p_details->>'reference',status='submitted' where id=p_case;
  elsif p_stage='complete' then
    if c.status<>'submitted' then raise exception 'SUBMISSION_REQUIRED'; end if;
    update public.portal_cases set status='complete' where id=p_case;
  else raise exception 'INVALID_STAGE'; end if;
  insert into public.portal_audit(case_id,actor_id,action,detail) values(p_case,p_actor,'sandbox_stage_recorded',jsonb_build_object('stage',p_stage));
  return 'recorded';
end;
$$;
commit;
