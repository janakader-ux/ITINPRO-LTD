import approvedSlugs from './blog-approvals.json';

// Preserve articles already live when approval became mandatory (12 Nov 2026).
// Add a queued/new slug only after the owner approves its specific draft.
const approved = new Set(approvedSlugs);
export function isBlogPublished(post: { slug: string; date_published: string }, today = new Date().toISOString().slice(0, 10)) {
  return approved.has(post.slug) && post.date_published <= today;
}
