import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import posts from '@/lib/blog-posts.json';
import { isBlogPublished } from '@/lib/blog-publication';
export function GET() {
  const intro = readFileSync(join(process.cwd(), 'lib/blog-llms.txt'), 'utf8').split('## ')[0];
  const articles = posts.filter(p => isBlogPublished(p)).map(p => `- [${p.title}](https://itinpro.uk/blog/${p.slug}): ${p.quick_answer}`).join('\n');
  return new Response(`${intro}## Published articles\n${articles}\n`, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}
