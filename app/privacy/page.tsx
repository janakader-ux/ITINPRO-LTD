import type { Metadata } from 'next';
import { company, contact } from '@/lib/site';

export const metadata:Metadata={title:'Privacy & Cookie Notice',description:'How ITIN Pro handles enquiries, MyDocSafe client documents and cookie preferences, including where information is processed.',alternates:{canonical:'/privacy'}};

export default function Privacy(){return <section className="py-20"><div className="container-premium max-w-3xl">
  <p className="eyebrow">Privacy &amp; cookies</p>
  <h1 className="section-title mt-4">How we handle your information.</h1>
  <p className="mt-4 text-silver">Last updated: 12 November 2026</p>
  <div className="guide-body mt-10">
    <h2>Who is responsible</h2>
    <p>{company.legalName} is the controller of information collected through itinpro.uk and our client service. Our UK company number is {company.companyNumber} and our registered office is {company.registeredOffice}. Our ICO registration reference is ZC273975.</p>
    <h2>Information we collect and why</h2>
    <p>Our enquiry form collects your name, email, phone number, location, service requirements, appointment preference and information about your circumstances. We use these details to respond, assess the appropriate service and arrange next steps. Please do not enter passport numbers, taxpayer identification numbers or bank details, or send identity documents through the general website form or ordinary email.</p>
    <p>If you engage us, we may need identity documents, including your passport, tax information, engagement records and correspondence to prepare your application and carry out identity checks. We are preparing a separate secure document process. Our team will explain how to provide documents when your case is ready; please wait for those instructions.</p>
    <h2>Our lawful bases</h2>
    <p>We process information to take steps you request before entering a contract and to perform our agreed services. We also rely on legitimate interests to answer general enquiries, maintain appropriate business records and protect our systems, and on legal obligations where applicable. Optional analytics uses your consent, which you can withdraw using Cookie settings. Providing information is your choice, but we may be unable to assess or provide a service without the necessary details and evidence.</p>
    <h2>Providers, sharing and storage locations</h2>
    <p>Authorised ITIN Pro staff use your information to deal with your enquiry or engagement. Providers supporting our service include:</p>
    <ul>
      <li><strong>Supabase:</strong> our website enquiry database is hosted in Ireland (European Union). We are not using this database to collect client passport uploads.</li>
      <li><strong>MyDocSafe (trial):</strong> we are testing MyDocSafe for client document storage, secure exchange and electronic signatures. Our account is configured for United Kingdom storage. We are confirming the applicable data processing agreement before accepting real client identity and tax documents.</li>
      <li><strong>Render:</strong> our website server is hosted in Oregon, United States. Information submitted through the website is processed by this server before being saved to the enquiry database.</li>
      <li><strong>Cloudflare:</strong> supports website delivery and security.</li>
      <li><strong>Resend:</strong> sends enquiry notifications to our team. These notifications contain enquiry information.</li>
    </ul>
    <p>UK document storage does not mean all information is processed only in the UK. Website hosting, email delivery and provider support may involve processing outside the UK. Contact us for information about the arrangements and safeguards applicable to your information.</p>
    <p>Where required for your agreed service, application information is also provided to the IRS in the United States and to advisers or delivery providers involved in your case. We explain the document and submission route as part of your engagement.</p>
    <h2>Security</h2>
    <p>We use HTTPS to protect information in transit and encrypted storage to protect information at rest. Access to client information is restricted to authorised staff and the providers needed to deliver the service. Please wait for our secure document instructions before supplying identity or tax documents.</p>
    <h2>Cookies and analytics</h2>
    <p>Necessary browser storage records your cookie preference and supports secure sign-in where used. If Google Analytics is configured, its optional cookies help us understand website use and load only after you select “Accept all” or enable optional analytics in “Manage preferences”. “Reject optional cookies” keeps analytics off. Analytics is disabled inside the website's sign-in area. You can change or withdraw consent at any time using “Cookie settings” in the footer; choose “Reject optional cookies” or turn analytics off and save. This stops further analytics collection and removes accessible first-party Google Analytics cookies. Any future MyDocSafe portal will have its own cookie information.</p>
    <h2>Retention</h2>
    <p>The retention period depends on whether your enquiry becomes a client engagement, whether follow-up is still needed, and any applicable record-keeping, regulatory or dispute requirements. You can contact us to ask how these criteria apply to your enquiry, passport copies or other client records.</p>
    <h2>Your rights and complaints</h2>
    <p>Depending on the circumstances, your UK data protection rights include access, correction, erasure, restriction, portability and objection. Where processing relies on consent, you can withdraw it without affecting earlier lawful processing. Contact us to exercise your rights or raise a privacy concern. You can also complain to the <a href="https://ico.org.uk/make-a-complaint/">Information Commissioner’s Office</a>.</p>
    <h2>Contact</h2>
    <p>For privacy questions, email <a href={`mailto:${contact.taz.email}`}>{contact.taz.email}</a> or <a href={`mailto:${contact.shan.email}`}>{contact.shan.email}</a>, or write to our registered office above.</p>
  </div>
</div></section>}
