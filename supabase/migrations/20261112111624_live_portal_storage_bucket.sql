-- Phase 2, step A: allow the live portal bucket alongside the sandbox one.
--
-- Behaviour-preserving for the sandbox portal: the sandbox bucket keeps exactly
-- the access it had. This only adds the live bucket name so that a future,
-- separately reviewed commit can turn live mode on without a schema change.
--
-- Both halves of the USING clause are load-bearing security checks:
--   * bucket_id IN (...) keeps the policy restricted to these two named buckets.
--     Never widen it to all buckets.
--   * the portal_documents EXISTS subquery keeps an object readable only while a
--     portal_documents row points at it, which is what stops a signed-in client
--     from reading arbitrary object names.
-- Keep both. Dropping or loosening either one exposes client documents.

drop policy if exists portal_storage_read on storage.objects;

create policy portal_storage_read on storage.objects for select to authenticated using
  (bucket_id in ('itinpro-case-files-sandbox','itinpro-case-files')
   and exists(select 1 from public.portal_documents d where d.path = storage.objects.name));
