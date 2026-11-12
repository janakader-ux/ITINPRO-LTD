import test from 'node:test';
import assert from 'node:assert/strict';
import posts from '../lib/blog-posts.json';
import { isBlogPublished } from '../lib/blog-publication';
import { getStaticProps as articleProps } from '../pages/blog/[slug]';
import { getStaticProps as indexProps } from '../pages/blog/index';
import sitemap from '../app/sitemap';
import { GET } from '../app/llms.txt/route';

test('a scheduled date never publishes an unapproved blog, even after the entire queue expires', () => {
  for (const post of posts.filter(p => p.date_published > '2026-11-12')) {
    assert.equal(isBlogPublished(post, '2030-01-01'), false, post.slug);
  }
  assert.equal(isBlogPublished(posts[0], '2026-11-12'), true);
  assert.equal(isBlogPublished(posts[0], '2020-01-01'), false);
});

test('unapproved articles cannot expose body, metadata or schema through their direct URL', async () => {
  const post = posts.find(p => p.date_published > '2026-11-12')!;
  const result = await articleProps({ params: { slug: post.slug } });
  assert.ok('notFound' in result && result.notFound);
  assert.equal('props' in result, false);
});

test('index, sitemap and LLM discovery all exclude unapproved articles', async () => {
  const result = await indexProps({});
  assert.ok('props' in result);
  if (!('props' in result)) return;
  const props = await result.props;
  const urls = sitemap().map(p => p.url);
  const llms = await GET().text();
  for (const post of posts.filter(p => !isBlogPublished(p))) {
    assert.equal(props.posts.some(p => p.slug === post.slug), false);
    assert.equal(urls.includes(`https://itinpro.uk/blog/${post.slug}`), false);
    assert.equal(llms.includes(`/blog/${post.slug}`), false);
  }
});
