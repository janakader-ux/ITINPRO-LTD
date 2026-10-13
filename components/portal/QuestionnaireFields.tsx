'use client';
import { basicFields } from '@/lib/portal/fields';
import { selectOptions,dateFields,multilineFields,type QuestionnaireField } from '@/lib/portal/questionnaire';
const labels:Partial<Record<typeof basicFields[number],string>>={dateOfBirth:'Date of birth (YYYY-MM-DD)',sex:'Sex for Form W-7',passportNumber:'Passport number (test value only)',passportExpiry:'Passport expiry (YYYY-MM-DD)',previousItin:'Previous ITIN / IRSN (if held)',priorItinName:'Name under prior ITIN',spouseTaxId:'US spouse / parent SSN or ITIN (test value only)',lastUsEntry:'Last US entry date or “never entered”',filingStatus:'Tax-return filing status',taxPurpose:'Federal tax purpose / income details',ssnEligibility:'SSN eligibility / pending application (explain)',signerAuthority:'Who will sign W-7 and their authority?',institutionCityState:'Educational institution city and state',durationOfStay:'Length of stay in the US',paymentYear:'Year of payment / distribution',taxBenefit:'Tax benefit claimed for the spouse or dependent',closingDate:'Property closing date (YYYY-MM-DD)'};
export function QuestionnaireFields({fields,answers,clientEmail,readOnly,allowIncomplete=false,onChange}:{fields:QuestionnaireField[];answers:Record<string,string>;clientEmail:string;readOnly:boolean;allowIncomplete?:boolean;onChange:(field:QuestionnaireField,value:string)=>void}){return <div className="portal-fields">{fields.map(x=>{
        const saved=answers[x]||'';
        const mailingChoice=answers.mailingAddressChoice||'Different mailing address';
        const emailChoice=answers.contactEmailChoice||'Use my portal email';
        const sameAddress=mailingChoice==='Same as foreign address'&&['mailingAddress','mailingCountry'].includes(x);
        const portalContact=x==='contactEmail'&&emailChoice==='Use my portal email';
        const disabled=readOnly||sameAddress||portalContact;
        const mirrored=sameAddress?(x==='mailingCountry'?(answers.foreignCountry||''):(answers.foreignAddress||'')):portalContact?clientEmail:saved;
        const value=x==='mailingAddressChoice'?mailingChoice:x==='contactEmailChoice'?emailChoice:mirrored;
        const change=(next:string)=>onChange(x,next);
        const options=selectOptions[x];
        const required=['foreignCountry','foreignAddress'].includes(x)||(x==='contactEmail'&&emailChoice==='Use another contact email');
        return <label key={x}>{labels[x]||x.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase())}{required?(allowIncomplete?' — needed for the final application':' — mandatory'):''}
          {options?<select name={x} value={value} disabled={disabled} required={required&&!allowIncomplete} onChange={e=>change(e.target.value)}><option value="">Please select</option>{value&&!options.includes(value)&&<option value={value}>Saved answer: {value}</option>}{options.map(option=><option key={option} value={option}>{option}</option>)}</select>:
          multilineFields.has(x)?<textarea name={x} rows={3} value={value} onChange={e=>change(e.target.value)} disabled={disabled} required={required&&!allowIncomplete} minLength={x==='foreignAddress'?10:undefined} maxLength={1500}/>:
          <input name={x} type={x==='contactEmail'?'email':dateFields.has(x)&&(!saved||/^\d{4}-\d{2}-\d{2}$/.test(saved))?'date':'text'} value={value} onChange={e=>change(e.target.value)} disabled={disabled} required={required&&!allowIncomplete} maxLength={200}/>}
          {sameAddress&&<small>Your foreign address and country will be used for mailing.</small>}
          {portalContact&&<small>{clientEmail} — your sign-in email stays the same.</small>}
          {x==='contactEmail'&&emailChoice==='Use another contact email'&&<small>This contact address is for staff review. Portal sign-in continues to use {clientEmail}.</small>}
        </label>;
      })}</div>;}
