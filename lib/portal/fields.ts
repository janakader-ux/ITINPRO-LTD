export const basicFields = [
  // W-7 application type and reason
  'applicationType','w7Reason','boxHException','treatyClaimStatus','treatyCountry','treatyArticle','taxReturnStatus',
  // Lines 1a, 1b, 4 and 5
  'firstName','middleName','lastName','birthNameDifferent','birthFirstName','birthMiddleName','birthLastName','birthName',
  'dateOfBirth','sex','birthCountry','birthCity','citizenship','additionalCitizenships',
  // Lines 2 and 3
  'foreignAddressStatus','foreignCountry','foreignStreetAddress','foreignCity','foreignRegion','foreignPostalCode','foreignAddress',
  'mailingAddressChoice','mailingAddressHelp','mailingCountry','mailingStreetAddress','mailingCity','mailingRegion','mailingPostalCode','mailingAddress',
  // Contact details (the email is also the portal sign-in address; phone maps to Form W-7 signature line)
  'contactEmailChoice','contactEmail','phoneNumber',
  // Lines 6a–6g
  'passportIssuer','passportNumber','passportExpiry','foreignTaxId','visaType','visaNumber','visaExpiry','lastUsEntry',
  'previousItinStatus','previousItinType','previousItin','previousIrsn','irsNoticeType','priorItinFirstName','priorItinMiddleName','priorItinLastName','priorItinName',
  'relationship','usPersonFirstName','usPersonMiddleName','usPersonLastName','usPersonTaxId',
  'spouseName','spouseTaxId','institutionName','institutionCityState','durationOfStay','companyName','companyEin',
  // Tax return / supporting evidence context and route-specific notes
  'filingStatus','taxPurpose','ssnEligibility','signerAuthority','payerName','paymentYear','taxBenefit','propertyAddress','closingDate','notes'
] as const;
