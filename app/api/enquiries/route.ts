import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { z } from 'zod';

const schema=z.object({name:z.string().min(2).max(100),email:z.email(),phone:z.string().max(40).optional(),reason:z.string().min(2).max(120),location:z.string().min(2).max(120),appointment:z.string().max(120).optional(),message:z.string().min(10).max(3000),consent:z.literal('yes'),website:z.string().max(0).optional()});

export async function POST(request:Request){
  try{
    const input=schema.parse(await request.json());
    const url=process.env.SUPABASE_URL;const key=process.env.SUPABASE_SERVICE_ROLE_KEY;const resendKey=process.env.RESEND_API_KEY;
    if(!url||!key||!resendKey)return NextResponse.json({error:'Form service not configured'},{status:503});
    const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
    const {error}=await supabase.from('enquiries').insert({name:input.name,email:input.email,phone:input.phone||null,reason:input.reason,location:input.location,appointment:input.appointment||null,message:input.message,consented_at:new Date().toISOString()});
    if(error)throw error;
    const resend=new Resend(resendKey);const to=(process.env.ENQUIRY_RECIPIENTS||'Shan@itinpro.uk,Taz@itinpro.uk').split(',').map(x=>x.trim());
    await resend.emails.send({from:process.env.RESEND_FROM_EMAIL||'enquiries@itinpro.uk',to,replyTo:input.email,subject:`New ITIN Pro enquiry — ${input.reason}`,text:`Name: ${input.name}\nEmail: ${input.email}\nPhone: ${input.phone||'Not provided'}\nLocation: ${input.location}\nAppointment: ${input.appointment||'Not specified'}\nReason: ${input.reason}\n\n${input.message}`});
    return NextResponse.json({ok:true},{status:201});
  }catch(error){return NextResponse.json({error:'Unable to submit enquiry'},{status:400});}
}
