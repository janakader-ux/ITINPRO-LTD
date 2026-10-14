import { readFileSync } from 'node:fs';
import { join } from 'node:path';
export function GET() { return new Response(readFileSync(join(process.cwd(), 'lib/blog-llms.txt'), 'utf8'), { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } }); }
