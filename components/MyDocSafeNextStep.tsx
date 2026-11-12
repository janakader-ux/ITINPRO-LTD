import { myDocSafeSignupUrl } from '@/lib/mydocsafe';

export function MyDocSafeNextStep(){
  return <div className="mt-5 grid gap-4 rounded-xl border border-white/15 p-5">
    <h3 className="font-semibold">Next: your secure document portal</h3>
    <p className="text-silver">Continue to MyDocSafe and verify the same email address you used for this enquiry. Once signed in, open Documents to upload the files our team requests. We will match your documents to your website enquiry by email.</p>
    <a href={myDocSafeSignupUrl} target="_blank" rel="noopener noreferrer" className="gold-button justify-self-start">Continue to secure document upload</a>
    <p className="text-sm text-silver">Opens MyDocSafe in a new tab. Your website answers are saved separately; they are not automatically copied into MyDocSafe. Please do not email passport copies.</p>
  </div>;
}
