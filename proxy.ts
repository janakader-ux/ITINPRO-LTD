import { createServerClient } from '@supabase/ssr';
import { NextResponse,type NextRequest } from 'next/server';
export async function proxy(request:NextRequest) {
  let response=NextResponse.next({request});
  const url=process.env.SUPABASE_URL?.trim(),key=process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
  if(process.env.PORTAL_MODE==='sandbox' && url && key) {
    const supabase=createServerClient(url,key,{cookies:{getAll:()=>request.cookies.getAll(),setAll:values=>{
      values.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});
      values.forEach(({name,value,options})=>response.cookies.set(name,value,{...options,httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/'}));
    }}});
    await supabase.auth.getUser();
  }
  response.headers.set('Cache-Control','private, no-store');
  response.headers.set('Referrer-Policy','no-referrer');
  response.headers.set('X-Robots-Tag','noindex, nofollow');
  response.headers.set('X-Content-Type-Options','nosniff');
  response.headers.set('X-Frame-Options','DENY');
  response.headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self'");
  return response;
}
export const config={matcher:['/portal/:path*','/api/portal/:path*']};
