# Payment-last sandbox workflow

Client steps: **Engagement → Your details → Documents → Payment**. One screen at a time, with saved progress and bottom navigation.

Clients sign a service-specific, priced engagement before providing detailed information. Signed clients can save partial answers and upload dummy documents before payment. They can continue with missing items; the server records those items for follow-up. Finishing Documents prepares the payment request. The invoice is not created merely by signing. Professional review and preparation remain payment-gated, and existing early-work/cancellation terms still apply. Accepted older engagements keep their original payment controls; only unsigned, unissued cases move to the new order.

The invoice retry window starts at the first invoice attempt rather than enquiry creation. Persisted invoices reopen rather than creating another charge. Confirmed payment moves the new case to review and creates one durable staff notification. Individual pre-payment uploads do not trigger staff notifications.

## Manual acceptance test

1. Create a synthetic ready case, or have Shaan issue an engagement for a synthetic short enquiry. Use a TEST name and an @example.com source address. Invitation recipient remains janakader@gmail.com.
2. Read the fee and engagement. Sign as the TEST applicant. Confirm no invoice is requested yet.
3. Fill some dummy details, leave one answer unknown, and save. Navigate forward/back and sign out/in to verify saved answers.
4. Upload a dummy file and leave one required document missing. Confirm you can continue to Payment and the missing items are recorded.
5. Open the Stripe test invoice; check the agreed GBP fee and the same invoice when reopening or staff resending. Use a Stripe test card only. Returning without payment must not begin professional review.
6. Wait for the signed webhook confirmation. Confirm the case moves to review, the receipt appears, and one review notification is queued. Check correct-case download permissions and mobile navigation.
7. Staff request missing information, review dummy scans, and release a dummy draft only after confirmed payment and the engagement work-start gate. Final foreign-address checks and original-document/signature checks remain required before simulated submission.

No real payment, document or IRS submission is authorized by these tests. Sandbox keys, dummy-only upload declarations and staff MFA stay enabled. Full authenticated signing, card payment, uploads, inbox receipt and mobile interaction still require the owner's manual acceptance test before production.
