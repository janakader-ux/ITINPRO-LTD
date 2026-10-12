import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('real Postgres migration atomically reconciles events, rejects mismatches and protects paid status', async () => {
  const db=new PGlite();
  try {
    await db.exec('create role anon; create role authenticated; create role service_role; create table public.enquiries(id uuid primary key);');
    await db.exec(await readFile(new URL('../supabase-payments.sql',import.meta.url),'utf8'));
    const order='11111111-1111-4111-8111-111111111111';
    await db.query("insert into payment_orders(id,kind,amount,stripe_checkout_session_id) values($1,'checkout',39500,'cs_test_example')",[order]);
    const apply=(event:string,amount=39500,status='paid',reference='cs_test_example')=>db.query<{result:string}>(
      "select apply_payment_event($1,$2,$3,$4,'gbp','checkout',$5) as result",[event,order,reference,amount,status]);
    assert.equal((await apply('evt_paid')).rows[0].result,'applied');
    assert.equal((await apply('evt_paid')).rows[0].result,'duplicate');
    await apply('evt_late_failure',39500,'failed');
    assert.equal((await db.query<{status:string}>('select status from payment_orders where id=$1',[order])).rows[0].status,'paid');
    await assert.rejects(apply('evt_wrong_amount',42500),/PAYMENT_AMOUNT_OR_KIND_MISMATCH/);
    await assert.rejects(apply('evt_wrong_resource',39500,'paid','cs_test_wrong'),/PAYMENT_REFERENCE_MISMATCH/);
    const count=(await db.query<{count:number}>('select count(*)::int as count from payment_events')).rows[0].count;
    assert.equal(count,2,'failed reconciliation must not consume an event ID');
    const policies=await db.query<{allowed:boolean}>("select has_table_privilege('anon','public.payment_orders','select') as allowed");
    assert.equal(policies.rows[0].allowed,false);
    const execute=await db.query<{allowed:boolean}>("select has_function_privilege('authenticated','public.apply_payment_event(text,uuid,text,bigint,text,text,text)','execute') as allowed");
    assert.equal(execute.rows[0].allowed,false);
  } finally {await db.close();}
});
