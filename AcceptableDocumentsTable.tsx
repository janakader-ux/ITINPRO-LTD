const documents = [
  ['Passport', 'Yes', 'Yes', 'Only stand-alone document in many cases; dependent rules can require US residency evidence.'],
  ['USCIS photo identification', 'Yes', 'Yes', 'Must be current and unaltered.'],
  ['US Department of State visa', 'Yes', 'Yes', 'Provide required visa pages.'],
  ['US driver licence', 'No', 'Yes', 'Identity evidence.'],
  ['US military identification card', 'No', 'Yes', 'Identity evidence.'],
  ['Foreign driver licence', 'No', 'Yes', 'Identity evidence.'],
  ['Foreign military identification card', 'Yes', 'Yes', 'IRS-listed, but a CAA cannot authenticate this document.'],
  ['National identification card', 'Yes', 'Yes', 'Must show name, address, photo, date of birth and expiry.'],
  ['US state identification card', 'No', 'Yes', 'Identity evidence.'],
  ['Foreign voter registration card', 'Yes', 'Yes', 'Must be current.'],
  ['Civil birth certificate', 'Foreign document only', 'Yes', 'Required for an applicant under 18 if no passport is presented.'],
  ['Medical record', 'Foreign record only', 'Yes', 'Dependents under age 6 only.'],
  ['School record', 'Foreign record only', 'Yes', 'Dependents under age 24 only.']
];

export function AcceptableDocumentsTable() {
  return <section className="container-premium pb-8" aria-labelledby="accepted-documents-title">
    <div className="mx-auto max-w-5xl rounded-3xl border border-gold/20 bg-card/70 p-5 sm:p-8">
      <p className="eyebrow">IRS supporting-document matrix</p>
      <h2 id="accepted-documents-title" className="mt-3 font-display text-3xl">The 13 acceptable document types</h2>
      <p className="mt-4 max-w-3xl leading-7 text-silver">Documents must be valid originals or copies certified by the issuing agency. Without a passport, applicants generally need at least two current documents that together establish identity and foreign status.</p>
      <div className="mt-7 overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-[760px] w-full border-collapse text-left text-sm">
          <thead className="bg-midnight text-white"><tr><th className="p-4">Document</th><th className="p-4">Foreign status</th><th className="p-4">Identity</th><th className="p-4">Important limit</th></tr></thead>
          <tbody>{documents.map(([name, foreignStatus, identity, note])=><tr key={name} className="border-t border-white/10 align-top"><th scope="row" className="p-4 font-semibold text-white">{name}</th><td className="p-4 text-slate-200">{foreignStatus}</td><td className="p-4 text-slate-200">{identity}</td><td className="p-4 leading-6 text-silver">{note}</td></tr>)}</tbody>
        </table>
      </div>
      <p className="mt-5 text-sm leading-6 text-silver">Dependent applications have additional age, relationship and US-residency rules. CAA authentication for dependents is limited to passports and civil birth certificates.</p>
    </div>
  </section>;
}
