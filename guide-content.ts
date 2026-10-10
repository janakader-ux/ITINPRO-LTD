export type GuideFaq = { question: string; answer: string };

const complianceFaq: GuideFaq = {
  question: 'Can a video call alone verify my passport for an ITIN?',
  answer: 'No. IRS guidance permits video conferencing for the applicant interview, but the Certifying Acceptance Agent must have the original identification document or an issuing-agency certified copy in their possession during the interview.'
};

const specific: Record<string, GuideFaq[]> = {
  'itin-for-us-gambling-winnings-refund': [
    { question: 'Can a UK resident reclaim US casino tax withholding?', answer: 'Possibly, depending on the gambling type, treaty position, residence and evidence. If no gaming official handled Exception 2(d), the usual route is Form W-7 with Form 1040-NR and Form 1042-S.' },
    { question: 'Does an ITIN guarantee a gambling tax refund?', answer: 'No. The ITIN is only the tax identifier. The return must establish the income, withholding and any treaty position.' }
  ],
  'itin-for-us-inheritance-estate-distribution': [
    { question: 'Does every UK beneficiary of a US estate need an ITIN?', answer: 'No. There must be a US federal tax purpose, such as current-year withholding or information reporting on a distribution, or a requirement to file a US return.' },
    { question: 'What can support Exception 1(d) for an estate distribution?', answer: 'An original document or signed letter from the fiduciary or withholding agent on official letterhead should identify the beneficiary and the current-year US reporting or withholding need.' }
  ],
  'itin-for-amazon-kdp-authors-uk': [
    { question: 'Do all UK Amazon KDP authors need an ITIN?', answer: 'No. Confirm the payer’s reporting or withholding requirement and whether a valid W-7 tax purpose exists. A platform prompt alone may not be sufficient.' },
    { question: 'What evidence supports a royalty ITIN application?', answer: 'Exception 1(d) generally needs an original payer document or signed withholding-agent letter showing a current-year royalty distribution subject to US reporting or withholding, supported by the contract where necessary.' }
  ],
  'what-is-an-itin': [
    { question: 'What is an ITIN used for in the UK?', answer: 'An ITIN is a US federal tax-processing number for an individual who has a US tax purpose but is not eligible for a Social Security Number. It does not provide work rights or immigration status.' },
    { question: 'Can a UK resident apply for an ITIN?', answer: 'Yes, if the person has a valid US federal tax purpose and is not eligible for an SSN. Form W-7 is normally filed with a US return unless an IRS exception applies.' }
  ],
  'why-do-i-need-an-itin': [
    { question: 'What are common reasons a UK resident needs an ITIN?', answer: 'Common reasons include filing Form 1040-NR, a US partnership interest, US property sale, pension or royalty withholding, a qualifying spouse or dependent claim, and certain mortgage or banking reporting situations.' },
    { question: 'Can I get an ITIN just to have one?', answer: 'No. The IRS requires a current federal tax purpose supported by a return or by the documents for a listed exception.' }
  ],
  'itin-vs-ssn': [
    { question: 'Should I apply for an ITIN if I can get an SSN?', answer: 'No. A person eligible for an SSN must apply for the SSN instead. An ITIN is for applicants who have a US tax purpose but are not eligible for an SSN.' },
    { question: 'Does an ITIN allow me to work in the United States?', answer: 'No. An ITIN is for federal tax administration and does not authorise employment or change immigration status.' }
  ],
  'how-to-apply-for-itin-from-uk': [
    { question: 'How do I apply for an ITIN from the UK?', answer: 'Choose the correct Form W-7 reason, prepare the attached US return or exception evidence, provide acceptable identity and foreign-status documents, and submit through the IRS, a suitable US Taxpayer Assistance Center, or an Acceptance Agent.' },
    { question: 'Can a CAA stop my passport being mailed to the IRS?', answer: 'For eligible documents, a CAA can inspect the original or issuing-agency certified copy and send a Certificate of Accuracy and copies to the IRS. A remote client may still need to send the original securely to the CAA for possession during the interview.' }
  ],
  'certifying-acceptance-agent-itin': [
    { question: 'What does a Certifying Acceptance Agent do?', answer: 'A CAA reviews acceptable original documents or issuing-agency certified copies, completes Form W-7 (COA), and submits the ITIN package. The CAA is independent and does not decide whether the IRS issues the ITIN.' },
    { question: 'Do CAAs certify every dependent document?', answer: 'No. For dependents, CAAs can authenticate passports and birth certificates. Other required dependent records may need to be submitted under the applicable IRS rules.' }
  ],
  'itin-for-form-1040nr': [
    { question: 'Do I need an ITIN to file Form 1040-NR?', answer: 'A nonresident alien who must file Form 1040-NR and is not eligible for an SSN generally applies for an ITIN by attaching Form W-7 to the return.' },
    { question: 'Can Form 1040-NR be filed only to claim a refund?', answer: 'Yes. A genuine refund claim can be a federal tax purpose, including a claim for eligible US tax withheld, provided the return and supporting information are complete.' }
  ],
  'itin-for-llc-owner': [
    { question: 'Does every foreign US LLC owner need an ITIN?', answer: 'Not automatically. The need and route depend on the LLC tax classification, the owner’s US filing or reporting obligations, and whether a documented W-7 exception applies.' },
    { question: 'When can an LLC member use Exception 1(a)?', answer: 'A member of an LLC taxed as a partnership may qualify when current-year US reporting or withholding applies and the supporting agreement identifies the entity, EIN and applicant as a partner.' }
  ],
  'itin-for-partnership-interest': [
    { question: 'Is Form 8805 the same as Schedule K-1?', answer: 'No. Form 8805 reports a foreign partner’s share of section 1446 withholding, while Schedule K-1 reports the partner’s share of partnership items. Either can explain why a partnership requests a US tax number.' },
    { question: 'What supports W-7 Exception 1(a)?', answer: 'The IRS guide calls for the relevant portion of the partnership or LLC agreement showing the entity EIN and that the applicant is a partner in a partnership conducting business in the United States.' }
  ],
  'itin-for-us-bank-account': [
    { question: 'Is an ITIN always required to open a US bank account?', answer: 'No. Bank onboarding rules vary. W-7 Exception 1(b) or 1(c) is narrower and generally requires current-year IRS reporting or withholding on interest plus an original signed bank letter.' },
    { question: 'What should the US bank letter say?', answer: 'The exact wording depends on the exception, but it should be on official letterhead, identify the applicant and confirm the account and relevant current-year US information-reporting or withholding requirement.' }
  ],
  'itin-for-spouse-of-us-citizen': [
    { question: 'Can the foreign spouse of a US citizen get an ITIN?', answer: 'Potentially, where the spouse is not eligible for an SSN and the ITIN is needed for a valid US federal tax filing position, such as an eligible joint return.' },
    { question: 'Does marriage alone qualify a spouse for an ITIN?', answer: 'No. Marriage identifies the relationship, but the application still needs a current US federal tax purpose and the required return or supporting evidence.' }
  ],
  'how-to-renew-itin': [
    { question: 'How do I renew an expired ITIN from the UK?', answer: 'Use the current Form W-7, select renewal, include acceptable identification, and provide the previous ITIN details. A return is generally not attached solely to renew, but the timing should match an upcoming filing need.' },
    { question: 'Will renewing an ITIN change the number?', answer: 'Normally the IRS renews the existing ITIN rather than issuing a different one.' }
  ],
  'itin-expired-how-to-check': [
    { question: 'When does an ITIN expire?', answer: 'An ITIN generally expires if it is not used on a US federal tax return for three consecutive tax years. Some older number ranges have also been subject to phased expiration rules.' },
    { question: 'Should I renew before I have a tax filing need?', answer: 'Usually not. Renewal is best tied to a current or upcoming federal tax filing need; check the latest IRS renewal guidance before applying.' }
  ],
  'itin-for-401k-pension-annuity': [
    { question: 'Why would a UK resident need an ITIN for a 401(k)?', answer: 'A US plan administrator may need a US taxpayer identification number for federal withholding and reporting on a pension, annuity, IRA, profit-sharing or 401(k) distribution.' },
    { question: 'What supports W-7 Exception 1(d) for a pension?', answer: 'An original document or signed letter from the withholding agent on official letterhead should identify the person and show that an ITIN is needed for a current-year distribution subject to US reporting or withholding.' }
  ],
  'itin-for-sale-of-us-property': [
    { question: 'Can a foreign seller apply for an ITIN before a US property closes?', answer: 'Yes. Once there is a legally binding sale contract, a foreign seller may be eligible to apply under W-7 Exception 4 with the required FIRPTA forms and transaction evidence.' },
    { question: 'Which documents support FIRPTA Exception 4?', answer: 'The IRS guide lists a completed Form 8288, 8288-A or 8288-B plus the real-estate sale contract or settlement statement. The exact package depends on the transaction.' }
  ],
  'itin-for-royalty-rental-income-uk-treaty': [
    { question: 'Can a UK author need an ITIN for US royalties?', answer: 'Yes, where a payer requires an ITIN for current-year US withholding or information reporting. Exception 1(d) normally needs a payer or withholding-agent document, not a self-created statement alone.' },
    { question: 'Does an ITIN automatically reduce US withholding?', answer: 'No. The income type, treaty article, beneficial ownership, payer forms and tax residence all matter. An ITIN is an identifier, not a guarantee of a treaty rate.' }
  ],
  'itin-for-dependents': [
    { question: 'Can every child living abroad receive an ITIN?', answer: 'No. The dependent must meet the relevant relationship and tax-benefit rules, and spouses and dependents should not apply unless they qualify for an allowable tax benefit or file their own US return.' },
    { question: 'Is a passport always enough for a dependent?', answer: 'Not always. For certain dependents, a passport without a US entry date is not stand-alone evidence and additional US residency documentation is required.' }
  ],
  'allowable-tax-benefit-itin': [
    { question: 'Why does an allowable tax benefit matter for a dependent ITIN?', answer: 'Current rules do not permit a spouse or dependent to apply merely to be listed. The person must be connected to an allowable federal tax benefit or be filing their own return.' },
    { question: 'Is eligibility for a tax benefit automatic?', answer: 'No. Filing status, relationship, residence, age and other rules must be checked for the relevant tax year.' }
  ],
  'itin-for-children-documents': [
    { question: 'What documents can a child use for an ITIN?', answer: 'A valid passport may be stand-alone in many cases. Without one, a dependent under 18 generally needs a civil birth certificate, and medical or school records are limited by age and purpose.' },
    { question: 'Can a CAA certify a child’s school or medical records?', answer: 'No. The IRS guide limits a CAA’s authentication for dependents to passports and birth certificates. Other required dependent records follow the IRS submission rules.' }
  ],
  'itin-for-students-f1-j1-m1': [
    { question: 'What is the SEVIS certification letter for an ITIN?', answer: 'It is a letter from an authorised school or exchange-program official confirming the applicant’s SEVIS status and the identity documents reviewed, with the other details required by the W-7 exception procedure.' },
    { question: 'Does every international student need an ITIN?', answer: 'No. The student needs a federal tax purpose and must not be eligible for an SSN. Scholarship, fellowship, treaty and employment facts determine the correct route.' }
  ],
  'itin-for-professors-researchers-honoraria': [
    { question: 'Can a visiting professor get an ITIN for an honorarium?', answer: 'Potentially. Exception 2(a) may apply where current-year compensation or honoraria is subject to reporting or withholding and the required invitation, payer and treaty documents are supplied.' },
    { question: 'Is Form 8233 relevant?', answer: 'It can be. Where treaty benefits are claimed for compensation, the W-7 package may include a completed Form 8233 and evidence of the engagement.' }
  ],
  'itin-for-us-mortgage-interest': [
    { question: 'Can a foreign buyer get an ITIN for a US mortgage?', answer: 'Exception 3 may apply where a lender needs the ITIN for current-year mortgage-interest reporting on US real property.' },
    { question: 'What evidence supports Exception 3?', answer: 'The IRS guide lists evidence of a home mortgage loan, such as a contract of sale or similar documentation for real property located in the United States.' }
  ],
  'itin-acceptable-documents-passport': [
    { question: 'What are the 13 acceptable ITIN document types?', answer: 'They are passport; USCIS photo ID; US visa; US driver licence; US military ID; foreign driver licence; foreign military ID; qualifying national ID card; US state ID; foreign voter registration card; civil birth certificate; qualifying medical records; and qualifying school records.' },
    { question: 'Are ordinary photocopies or notarised copies accepted?', answer: 'Generally no. Identification must be original or a copy certified by the agency that issued it. A notarised copy is not the same as an issuing-agency certified copy, subject to the narrow military-family rule.' },
    { question: 'What happens if I do not use a passport?', answer: 'You generally need at least two current documents that collectively prove identity and foreign status, with a recent photograph required except for the specified child exceptions.' }
  ],
  'itin-processing-time': [
    { question: 'How long does an ITIN application take from the UK?', answer: 'IRS timeframes vary by season, completeness and overseas processing. Do not promise a fixed date; allow extra time for peak filing season and correspondence.' },
    { question: 'Can a CAA guarantee faster IRS processing?', answer: 'No. A CAA can help avoid preventable errors and reduce the need to send eligible originals to the IRS, but cannot control approval or IRS processing time.' }
  ],
  'itin-and-e-filing-rules': [
    { question: 'Can the return attached to Form W-7 be e-filed?', answer: 'No. The original return is normally submitted on paper with Form W-7 to the IRS ITIN operation, unless an exception route means no return is attached.' },
    { question: 'Can I e-file later using my ITIN?', answer: 'Generally yes once the ITIN has been issued and the return and year are eligible for IRS e-file. Confirm current e-file rules for the filing year.' }
  ],
  'form-w7-mistakes-line-by-line': [
    { question: 'What is the most common Form W-7 mistake?', answer: 'Frequent problems include the wrong reason box, missing exception evidence, a name mismatch, incomplete foreign address, expired ID, or missing date-of-entry and visa information where required.' },
    { question: 'Should I submit another W-7 if I notice an error?', answer: 'Usually you should follow the IRS notice or correction instructions rather than create a duplicate application. Keep a full copy of the submitted package.' }
  ],
  'itin-for-deceased-taxpayer': [
    { question: 'Can an ITIN be requested for someone who has died?', answer: 'Yes, in certain filing or refund situations. Form W-7 is marked “Deceased” with the date of death and the representative provides the required return, identity and authority documents.' },
    { question: 'What must an executor provide?', answer: 'A court-appointed executor or administrator generally supplies evidence of appointment along with the return, Form W-7 and the deceased person’s identity and foreign-status documents.' }
  ],
  'itin-does-not-give-work-rights': [
    { question: 'Does an ITIN prove permission to work in the US?', answer: 'No. It is a tax-processing number and does not provide employment authorisation, Social Security benefits or immigration status.' },
    { question: 'What if I am eligible for an SSN?', answer: 'Apply for an SSN instead. The IRS does not issue an ITIN to a person who is eligible for an SSN.' }
  ],
  'itin-help-london-luton-heathrow-bedford-milton-keynes': [
    { question: 'Where can I meet an ITIN CAA near Bedford?', answer: 'Appointments can be arranged in Bedford, with home or office visits across nearby counties and wider UK travel by prior agreement. Selected St Pancras, Heathrow and Luton meeting options may be available.' },
    { question: 'How can an applicant outside the UK complete verification?', answer: 'Depending on the case, the applicant may travel to an in-person appointment or send the original document or issuing-agency certified copy securely to the CAA. A video interview does not remove the CAA possession requirement.' }
  ]
};

export function guideFaqs(slug: string, title: string): GuideFaq[] {
  const topicFaqs = specific[slug] ?? [
    { question: `Who should read this guide about ${title}?`, answer: 'UK and European residents with a genuine US federal tax purpose who are not eligible for a Social Security Number should review the relevant facts and evidence before applying.' },
    { question: 'Does an ITIN application guarantee a tax result?', answer: 'No. The ITIN identifies a taxpayer for federal tax purposes; eligibility for a refund, treaty rate, filing status or other tax result must be assessed separately.' }
  ];
  return [...topicFaqs, complianceFaq];
}

const keywordMap: Record<string, string[]> = {
  'itin-for-us-gambling-winnings-refund': ['US gambling tax refund UK', 'ITIN casino winnings UK', '1040NR gambling withholding refund'],
  'itin-for-us-inheritance-estate-distribution': ['ITIN US inheritance UK', 'US estate distribution ITIN', 'Form 1042-S inheritance UK'],
  'itin-for-amazon-kdp-authors-uk': ['ITIN Amazon KDP UK', 'ITIN for authors UK', 'W-8BEN royalties ITIN'],
  'itin-for-sale-of-us-property': ['ITIN for US property sale UK', 'FIRPTA ITIN UK', 'Form 8288-A foreign seller'],
  'itin-for-partnership-interest': ['ITIN Schedule K-1 UK', 'ITIN Form 8805 foreign partner', 'W-7 Exception 1(a)'],
  'itin-for-401k-pension-annuity': ['ITIN for 401k withdrawal UK', 'US pension ITIN UK', 'W-7 Exception 1(d) pension'],
  'itin-for-spouse-of-us-citizen': ['ITIN spouse of US citizen UK', 'Form W-7 box e', 'foreign spouse joint US tax return'],
  'itin-for-dependents': ['ITIN dependent child UK', 'ITIN dependent documents', 'Form W-7 dependent'],
  'itin-for-us-bank-account': ['ITIN for US bank account UK', 'W-7 bank letter', 'ITIN Exception 1(b)'],
  'itin-for-form-1040nr': ['1040NR filing UK', 'ITIN for 1040-NR', 'US nonresident tax return UK'],
  'itin-acceptable-documents-passport': ['acceptable ITIN documents UK', 'ITIN passport verification UK', '13 IRS ITIN documents'],
  'certifying-acceptance-agent-itin': ['IRS Certifying Acceptance Agent UK', 'CAA ITIN UK', 'ITIN without mailing passport to IRS']
};

export function guideKeywords(slug: string, title: string) {
  return keywordMap[slug] ?? [title, 'ITIN application UK', 'Form W-7 UK', 'Certifying Acceptance Agent UK'];
}

export function normaliseGuideHtml(html: string) {
  return html
    .replaceAll('href="smart-itin-form.html"', 'href="/#enquiry"')
    .replace(/href="([a-z0-9-]+)\.html"/g, 'href="/guides/$1"')
    .replace('A certifying acceptance agent can check your original and return it immediately.', 'At an in-person CAA appointment an eligible original can be returned after inspection. For a video interview, the CAA must first receive and possess the original or issuing-agency certified copy, then return it through the agreed secure route.')
    .replace('If you used a CAA, your originals are back with you the same day.', 'With a CAA, an eligible original can be returned at an in-person appointment or through the agreed secure-return service after a remote review. A CAA does not control IRS processing time.')
    .replace('passport (stand-alone);', 'passport (stand-alone in many cases);')
    .replace('school records (dependants under 24).</p><h2>Passport = stand-alone</h2>', 'school records (dependants under 24). A CAA cannot authenticate a foreign military ID, and for dependants a CAA can authenticate only passports and birth certificates.</p><h2>Passport = stand-alone</h2>')
    .replace('Because the CAA reviews your originals, you can keep them.', 'At an in-person appointment, eligible originals can be returned after inspection. For a remote video interview, the CAA must have the original or issuing-agency certified copy in their possession and return it through the agreed secure route.');
}
