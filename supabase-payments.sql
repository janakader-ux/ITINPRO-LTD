-- Run after supabase.sql in the ITIN PRO project's Supabase SQL Editor.
-- This migration is additive. It does not delete existing enquiries.
begin;
create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid unique references public.enquiries(id),
  kind text not null check (kind in ('checkout','invoice')),
  service_category text,
  amount bigint not null check (amount > 0),
  currency text not null default 'gbp' check (currency = 'gbp'),
  status text not null default 'pending' check (status in ('pending','paid','failed','expired','void')),
  request_hash text,
  stripe_checkout_session_id text unique,
  stripe_invoice_id text unique,
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create table if not exists public.payment_events (
  event_id text primary key,
  order_id uuid not null references public.payment_orders(id),
  received_at timestamptz not null default now()
);
alter table public.payment_orders enable row level security;
alter table public.payment_events enable row level security;
revoke all on public.payment_orders, public.payment_events from anon, authenticated;
grant all on public.payment_orders, public.payment_events to service_role;

-- Row lock, event de-duplication and status update form one transaction.
-- Amount, currency and Stripe resource ID must match the stored order.
create or replace function public.apply_payment_event(
  p_event_id text, p_order_id uuid, p_reference text, p_amount bigint,
  p_currency text, p_kind text, p_status text
) returns text language plpgsql security invoker set search_path = public as $$
declare
  payment public.payment_orders%rowtype;
  event_inserted integer;
begin
  select * into payment from public.payment_orders where id = p_order_id for update;
  if not found then raise exception 'PAYMENT_ORDER_NOT_FOUND'; end if;
  if payment.kind <> p_kind or payment.amount <> p_amount or payment.currency <> p_currency then
    raise exception 'PAYMENT_AMOUNT_OR_KIND_MISMATCH';
  end if;
  if (p_kind = 'checkout' and payment.stripe_checkout_session_id is distinct from p_reference)
    or (p_kind = 'invoice' and payment.stripe_invoice_id is distinct from p_reference) then
    raise exception 'PAYMENT_REFERENCE_MISMATCH';
  end if;
  if p_status not in ('paid','failed','expired','void') then raise exception 'INVALID_PAYMENT_STATUS'; end if;
  insert into public.payment_events(event_id, order_id) values (p_event_id, p_order_id)
    on conflict (event_id) do nothing;
  get diagnostics event_inserted = row_count;
  if event_inserted = 0 then return 'duplicate'; end if;
  -- Older failure/expiry events can never overwrite a successful payment.
  if payment.status <> 'paid' then
    update public.payment_orders set status = p_status,
      paid_at = case when p_status = 'paid' then now() else paid_at end where id = p_order_id;
  end if;
  return 'applied';
end;
$$;
revoke execute on function public.apply_payment_event(text,uuid,text,bigint,text,text,text) from public, anon, authenticated;
grant execute on function public.apply_payment_event(text,uuid,text,bigint,text,text,text) to service_role;
commit;
