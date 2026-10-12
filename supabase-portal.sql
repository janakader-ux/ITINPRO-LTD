-- Additive sandbox portal schema. No existing enquiry/payment records are changed.
-- Storage buckets and objects must be created through the Storage API, not SQL.
begin;
create schema if not exists portal_private;
revoke all on schema portal_private from public, anon;
grant usage on schema portal_private to authenticated, service_role;
create table public.portal_accounts (
  user_id uuid primary key references auth.users(id),
  email text not null unique check (email = lower(email)),
  role text not null default 'client' check (role in ('client','staff')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.portal_accounts enable row level security;
revoke all on public.portal_accounts from public, anon, authenticated;
grant select on public.portal_accounts to authenticated;
grant all on public.portal_accounts to service_role;
create policy portal_account_self on public.portal_accounts for select to authenticated
  using (user_id = (select auth.uid()));
-- Uses a server-owned role table, never user-editable JWT user_metadata.
-- Invoker function reads only the caller's account under RLS, no privilege bypass.
create function portal_private.is_staff() returns boolean language sql stable security invoker set search_path = '' as $$
  select (select auth.uid()) is not null and (select auth.jwt()->>'aal') = 'aal2'
    and exists(select 1 from public.portal_accounts where user_id = (select auth.uid()) and active and role = 'staff');
$$;
create function portal_private.is_client() returns boolean language sql stable security invoker set search_path = '' as $$
  select (select auth.uid()) is not null and exists(select 1 from public.portal_accounts where user_id = (select auth.uid()) and active and role = 'client');
$$;
revoke all on function portal_private.is_staff(), portal_private.is_client() from public, anon;
grant execute on function portal_private.is_staff(), portal_private.is_client() to authenticated, service_role;
create table public.portal_cases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.portal_accounts(user_id),
  payment_order_id uuid not null unique references public.payment_orders(id),
  legal_name text not null,
  address text not null,
  route_id text not null,
  price_category text not null,
  fee bigint not null check (fee > 0),
  tax_year integer not null check(tax_year between 2000 and 2100),
  checklist_version text not null,
  test_only boolean not null default true check(test_only = true),
  status text not null default 'collecting' check(status in ('collecting','review','missing_information','draft_shared','draft_approved','verification','submitted','complete','cancelled')),
  current_draft_id uuid,
  caa_verification jsonb,
  original_w7_received_at timestamptz,
  submitted_at timestamptz,
  submission_reference text,
  created_at timestamptz not null default now()
);
create index portal_cases_owner_idx on public.portal_cases(owner_id);
create table public.portal_answers (
  case_id uuid primary key references public.portal_cases(id),
  answers jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table public.portal_agreements (
  case_id uuid primary key references public.portal_cases(id),
  version text not null,
  snapshot jsonb not null,
  sha256 text not null check(sha256 ~ '^[a-f0-9]{64}$'),
  presented_at timestamptz not null default now(),
  accepted_at timestamptz,
  signer_id uuid references public.portal_accounts(user_id),
  signer_email text,
  typed_signature text,
  start_early boolean,
  work_may_start_at timestamptz
);
create index portal_agreements_signer_idx on public.portal_agreements(signer_id);
create table public.portal_documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.portal_cases(id),
  uploaded_by uuid not null references public.portal_accounts(user_id),
  item_id text not null,
  name text not null,
  path text not null unique,
  mime text not null check(mime in ('application/pdf','image/jpeg','image/png')),
  byte_size integer not null check(byte_size > 0 and byte_size <= 10485760),
  sha256 text not null check(sha256 ~ '^[a-f0-9]{64}$'),
  kind text not null default 'upload' check(kind in ('upload','draft','submission','outcome','internal')),
  visibility text not null default 'client' check(visibility in ('client','staff')),
  state text not null default 'stored' check(state in ('stored','accepted','replace_requested')),
  original_checked boolean not null default false,
  created_at timestamptz not null default now()
);
create index portal_documents_case_idx on public.portal_documents(case_id);
create index portal_documents_uploader_idx on public.portal_documents(uploaded_by);
alter table public.portal_cases add constraint portal_current_draft_fk foreign key(current_draft_id) references public.portal_documents(id);
create index portal_cases_draft_idx on public.portal_cases(current_draft_id);
create table public.portal_requests (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.portal_cases(id),
  item_id text not null,
  message text not null,
  created_by uuid not null references public.portal_accounts(user_id),
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
create index portal_requests_case_idx on public.portal_requests(case_id);
create index portal_requests_creator_idx on public.portal_requests(created_by);
create table public.portal_approvals (
  document_id uuid primary key references public.portal_documents(id),
  case_id uuid not null references public.portal_cases(id),
  actor_id uuid not null references public.portal_accounts(user_id),
  document_sha256 text not null,
  decision text not null check(decision in ('approved','changes_requested')),
  comment text not null default '',
  created_at timestamptz not null default now()
);
create index portal_approvals_case_idx on public.portal_approvals(case_id);
create index portal_approvals_actor_idx on public.portal_approvals(actor_id);
create table public.portal_audit (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.portal_cases(id),
  actor_id uuid not null references public.portal_accounts(user_id),
  action text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index portal_audit_case_idx on public.portal_audit(case_id);
create index portal_audit_actor_idx on public.portal_audit(actor_id);
create table public.portal_login_limits (
  key_hash text primary key,
  last_sent_at timestamptz not null default '-infinity',
  window_start timestamptz not null default now(),
  attempts integer not null default 0
);
create table public.portal_notifications (
  event_key text primary key,
  case_id uuid not null references public.portal_cases(id),
  recipient text not null check(recipient in ('client','staff')),
  state text not null default 'pending' check(state in ('pending','accepted')),
  provider_email_id text,
  created_at timestamptz not null default now()
);
create index portal_notifications_case_idx on public.portal_notifications(case_id);
alter table public.portal_notifications enable row level security;
revoke all on public.portal_notifications from public,anon,authenticated;
grant select on public.portal_notifications to authenticated;
grant all on public.portal_notifications to service_role;
create policy portal_notification_staff on public.portal_notifications for select to authenticated using((select portal_private.is_staff()));
alter table public.portal_cases enable row level security;
alter table public.portal_answers enable row level security;
alter table public.portal_agreements enable row level security;
alter table public.portal_documents enable row level security;
alter table public.portal_requests enable row level security;
alter table public.portal_approvals enable row level security;
alter table public.portal_audit enable row level security;
alter table public.portal_login_limits enable row level security;
revoke all on public.portal_cases, public.portal_answers, public.portal_agreements, public.portal_documents, public.portal_requests, public.portal_approvals, public.portal_audit, public.portal_login_limits from public, anon, authenticated;
grant select on public.portal_cases, public.portal_answers, public.portal_agreements, public.portal_documents, public.portal_requests, public.portal_approvals, public.portal_audit to authenticated;
grant all on public.portal_cases, public.portal_answers, public.portal_agreements, public.portal_documents, public.portal_requests, public.portal_approvals, public.portal_audit, public.portal_login_limits to service_role;
create policy portal_case_access on public.portal_cases for select to authenticated using
  ((owner_id = (select auth.uid()) and (select portal_private.is_client())) or (select portal_private.is_staff()));
create function portal_private.can_read_case(p_id uuid) returns boolean language sql stable security invoker set search_path = '' as $$
  select exists(select 1 from public.portal_cases where id = p_id);
$$;
revoke all on function portal_private.can_read_case(uuid) from public, anon;
grant execute on function portal_private.can_read_case(uuid) to authenticated, service_role;
create policy portal_answers_access on public.portal_answers for select to authenticated using(portal_private.can_read_case(case_id));
create policy portal_agreements_access on public.portal_agreements for select to authenticated using(portal_private.can_read_case(case_id));
create policy portal_documents_access on public.portal_documents for select to authenticated using
  (portal_private.can_read_case(case_id) and (visibility = 'client' or (select portal_private.is_staff())));
create policy portal_requests_access on public.portal_requests for select to authenticated using(portal_private.can_read_case(case_id));
create policy portal_approvals_access on public.portal_approvals for select to authenticated using(portal_private.can_read_case(case_id));
create policy portal_audit_staff on public.portal_audit for select to authenticated using((select portal_private.is_staff()));
-- No direct authenticated writes, including Storage INSERT/UPDATE/DELETE.
-- Server operations authenticate the session and check ownership before using service_role.
create policy portal_storage_read on storage.objects for select to authenticated using
  (bucket_id = 'itinpro-case-files-sandbox' and exists(select 1 from public.portal_documents d where d.path = storage.objects.name));
create function public.portal_claim_login(p_key text) returns boolean language plpgsql security invoker set search_path = '' as $$
declare r public.portal_login_limits%rowtype;
begin
  if p_key !~ '^[a-f0-9]{64}$' then raise exception 'INVALID_RATE_KEY'; end if;
  insert into public.portal_login_limits(key_hash) values(p_key) on conflict do nothing;
  select * into r from public.portal_login_limits where key_hash=p_key for update;
  if r.last_sent_at > now()-interval '60 seconds' or (r.window_start > now()-interval '1 hour' and r.attempts >= 5) then return false; end if;
  update public.portal_login_limits set last_sent_at=now(),
    attempts=case when window_start <= now()-interval '1 hour' then 1 else attempts+1 end,
    window_start=case when window_start <= now()-interval '1 hour' then now() else window_start end where key_hash=p_key;
  return true;
end;
$$;
create function public.portal_accept_agreement(p_case uuid,p_actor uuid,p_hash text,p_signature text,p_early boolean) returns text language plpgsql security invoker set search_path = '' as $$
declare c public.portal_cases%rowtype; a public.portal_agreements%rowtype;
begin
  select * into c from public.portal_cases where id=p_case for update;
  if not found or c.owner_id<>p_actor or c.status='cancelled' then raise exception 'CASE_ACCESS_DENIED'; end if;
  if not exists(select 1 from public.payment_orders where id=c.payment_order_id and status='paid' and amount=c.fee and currency='gbp') then raise exception 'PAYMENT_REQUIRED'; end if;
  select * into a from public.portal_agreements where case_id=p_case for update;
  if not found or a.sha256<>p_hash then raise exception 'AGREEMENT_VERSION_MISMATCH'; end if;
  if a.accepted_at is not null then return 'already_accepted'; end if;
  if length(trim(p_signature))<2 or length(p_signature)>100 then raise exception 'SIGNATURE_REQUIRED'; end if;
  update public.portal_agreements set accepted_at=now(),signer_id=p_actor,signer_email=(select email from public.portal_accounts where user_id=p_actor),typed_signature=trim(p_signature),start_early=p_early,
    work_may_start_at=case when p_early then now() else now()+interval '14 days' end where case_id=p_case;
  insert into public.portal_audit(case_id,actor_id,action,detail) values(p_case,p_actor,'agreement_accepted',jsonb_build_object('sha256',p_hash,'start_early',p_early));
  return 'accepted';
end;
$$;
create function public.portal_decide_draft(p_case uuid,p_actor uuid,p_document uuid,p_hash text,p_decision text,p_comment text) returns text language plpgsql security invoker set search_path = '' as $$
declare c public.portal_cases%rowtype; d public.portal_documents%rowtype;
begin
  select * into c from public.portal_cases where id=p_case for update;
  if not found or c.owner_id<>p_actor or c.status not in ('draft_shared','draft_approved') then raise exception 'CASE_ACCESS_DENIED'; end if;
  if c.current_draft_id is distinct from p_document then raise exception 'DRAFT_VERSION_MISMATCH'; end if;
  select * into d from public.portal_documents where id=p_document and case_id=p_case and kind='draft' and visibility='client';
  if not found or d.sha256<>p_hash then raise exception 'DRAFT_VERSION_MISMATCH'; end if;
  if p_decision not in ('approved','changes_requested') or length(p_comment)>1500 then raise exception 'INVALID_DECISION'; end if;
  if exists(select 1 from public.portal_approvals where document_id=p_document) then return 'already_recorded'; end if;
  insert into public.portal_approvals(document_id,case_id,actor_id,document_sha256,decision,comment) values(p_document,p_case,p_actor,p_hash,p_decision,p_comment);
  update public.portal_cases set status=case when p_decision='approved' then 'draft_approved' else 'review' end where id=p_case;
  insert into public.portal_audit(case_id,actor_id,action,detail) values(p_case,p_actor,'draft_decision',jsonb_build_object('document_id',p_document,'sha256',p_hash,'decision',p_decision));
  return 'recorded';
end;
$$;
create function public.portal_release_draft(p_case uuid,p_actor uuid,p_document uuid) returns text language plpgsql security invoker set search_path = '' as $$
declare c public.portal_cases%rowtype;
begin
  if not exists(select 1 from public.portal_accounts where user_id=p_actor and role='staff' and active) then raise exception 'STAFF_REQUIRED'; end if;
  select * into c from public.portal_cases where id=p_case for update;
  if not found or c.status in ('cancelled','submitted','complete') then raise exception 'CASE_ACCESS_DENIED'; end if;
  if not exists(select 1 from public.portal_agreements where case_id=p_case and accepted_at is not null and work_may_start_at<=now()) then raise exception 'WORK_START_NOT_AUTHORISED'; end if;
  if not exists(select 1 from public.portal_documents where id=p_document and case_id=p_case and kind='draft') then raise exception 'DRAFT_VERSION_MISMATCH'; end if;
  if c.current_draft_id=p_document then return 'already_shared'; end if;
  update public.portal_documents set visibility='client' where id=p_document;
  update public.portal_cases set current_draft_id=p_document,status='draft_shared' where id=p_case;
  insert into public.portal_audit(case_id,actor_id,action,detail) values(p_case,p_actor,'draft_shared',jsonb_build_object('document_id',p_document));
  return 'shared';
end;
$$;
create function public.portal_record_stage(p_case uuid,p_actor uuid,p_stage text,p_details jsonb) returns text language plpgsql security invoker set search_path = '' as $$
declare c public.portal_cases%rowtype;
begin
  if not exists(select 1 from public.portal_accounts where user_id=p_actor and role='staff' and active) then raise exception 'STAFF_REQUIRED'; end if;
  select * into c from public.portal_cases where id=p_case for update;
  if not found or c.status in ('cancelled','complete') then raise exception 'CASE_ACCESS_DENIED'; end if;
  if not exists(select 1 from public.portal_agreements where case_id=p_case and accepted_at is not null and work_may_start_at<=now()) then raise exception 'WORK_START_NOT_AUTHORISED'; end if;
  if not exists(select 1 from public.payment_orders where id=c.payment_order_id and status='paid' and amount=c.fee and currency='gbp') then raise exception 'PAYMENT_REQUIRED'; end if;
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
revoke all on function public.portal_claim_login(text), public.portal_accept_agreement(uuid,uuid,text,text,boolean), public.portal_decide_draft(uuid,uuid,uuid,text,text,text), public.portal_release_draft(uuid,uuid,uuid), public.portal_record_stage(uuid,uuid,text,jsonb) from public, anon, authenticated;
grant execute on function public.portal_claim_login(text), public.portal_accept_agreement(uuid,uuid,text,text,boolean), public.portal_decide_draft(uuid,uuid,uuid,text,text,text), public.portal_release_draft(uuid,uuid,uuid), public.portal_record_stage(uuid,uuid,text,jsonb) to service_role;
commit;
