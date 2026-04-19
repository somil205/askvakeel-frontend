/**
 * AskVakeel client-side PII anonymizer
 *
 * Strips personally identifiable information (PII) from queries BEFORE they leave the browser.
 * This is the first layer of privacy defense. Backend has a second layer.
 *
 * Replaces PII with semantic placeholders (PERSON_1, AADHAAR_1, PHONE_1, etc.)
 * so the LLM can still reason about the query structure.
 */

type PIICounts = {
  person: number;
  phone: number;
  email: number;
  aadhaar: number;
  pan: number;
  pincode: number;
  amount: number;
  caseNum: number;
  date: number;
  address: number;
};

/**
 * Anonymize a user query. Returns the safe version to send to backend.
 */
export function anonymize(text: string): string {
  if (!text || typeof text !== "string") return text;

  let result = text;
  const counts: PIICounts = {
    person: 0, phone: 0, email: 0, aadhaar: 0, pan: 0,
    pincode: 0, amount: 0, caseNum: 0, date: 0, address: 0
  };

  // Aadhaar (12 digits, with or without spaces/hyphens)
  result = result.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, () => {
    counts.aadhaar++;
    return `[AADHAAR_${counts.aadhaar}]`;
  });

  // PAN (AAAAA9999A format)
  result = result.replace(/\b[A-Z]{5}\d{4}[A-Z]\b/g, () => {
    counts.pan++;
    return `[PAN_${counts.pan}]`;
  });

  // Indian phone numbers
  result = result.replace(/(?:\+?91[\s-]?)?[6-9]\d{9}\b/g, () => {
    counts.phone++;
    return `[PHONE_${counts.phone}]`;
  });

  // Email addresses
  result = result.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, () => {
    counts.email++;
    return `[EMAIL_${counts.email}]`;
  });

  // Pincodes (6 digits, standalone)
  result = result.replace(/\b[1-9]\d{5}\b/g, () => {
    counts.pincode++;
    return `[PINCODE_${counts.pincode}]`;
  });

  // CNR numbers (16-char alphanumeric)
  result = result.replace(/\b[A-Z]{4}\d{2}\d{6}\d{4}\b/g, () => {
    counts.caseNum++;
    return `[CNR_${counts.caseNum}]`;
  });

  // FIR numbers
  result = result.replace(/\bFIR\s*(?:No\.?|Number|#)?\s*\d+\s*(?:of|\/)\s*\d{2,4}/gi, () => {
    counts.caseNum++;
    return `[FIR_${counts.caseNum}]`;
  });

  // Case numbers
  result = result.replace(/\b(?:Case|Suit|Petition|CS|CR|MC|MACT)\s*(?:No\.?|Number|#)?\s*\d+\s*(?:of|\/)\s*\d{2,4}/gi, () => {
    counts.caseNum++;
    return `[CASE_${counts.caseNum}]`;
  });

  // Rupee amounts
  result = result.replace(/(?:₹|Rs\.?|INR)\s*[\d,]+(?:\.\d+)?(?:\s*(?:lakh|lakhs|crore|crores|thousand|k))?/gi, () => {
    counts.amount++;
    return `[AMOUNT_${counts.amount}]`;
  });

  // Plain amounts (50 lakh, 2 crore, 50000 rupees)
  result = result.replace(/\b\d+[\d,]*\s*(?:lakh|lakhs|crore|crores|rupees)\b/gi, () => {
    counts.amount++;
    return `[AMOUNT_${counts.amount}]`;
  });

  // Dates DD/MM/YYYY or DD-MM-YYYY
  result = result.replace(/\b(?:0?[1-9]|[12]\d|3[01])[\/\-](?:0?[1-9]|1[0-2])[\/\-](?:19|20)\d{2}\b/g, () => {
    counts.date++;
    return `[DATE_${counts.date}]`;
  });

  // Honorifics + Names (Mr./Mrs./Shri/Smt./Dr./Adv./Advocate etc)
  const honorificPattern = /\b(?:Mr\.?|Mrs\.?|Ms\.?|Miss|Shri|Smt\.?|Sri|Dr\.?|Adv\.?|Advocate|Prof\.?|Hon(?:'ble)?|Justice)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}/g;
  result = result.replace(honorificPattern, () => {
    counts.person++;
    return `[PERSON_${counts.person}]`;
  });

  // Relationship-identified names
  result = result.replace(/\b(my name is|i am|i'm|accused is|complainant is|petitioner is|respondent is|applicant is|plaintiff is|defendant is|witness is|victim is|client is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/gi, (match, prefix, name) => {
    counts.person++;
    return `${prefix} [PERSON_${counts.person}]`;
  });

  // vs/versus NAME
  result = result.replace(/\b(vs?\.?|versus)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/gi, (match, v) => {
    counts.person++;
    return `${v} [PERSON_${counts.person}]`;
  });

  // Addresses
  result = result.replace(/\b(?:resident of|r\/?o|lives? at|residing at|address[:\s])\s+[^.\n,]{5,80}/gi, () => {
    counts.address++;
    return `[ADDRESS_${counts.address}]`;
  });

  return result;
}

/**
 * Check if a query appears to contain PII (for UI warnings).
 */
export function containsPII(text: string): boolean {
  if (!text) return false;
  const patterns = [
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,
    /\b[A-Z]{5}\d{4}[A-Z]\b/,
    /\b[6-9]\d{9}\b/,
    /[\w.+-]+@[\w-]+\.[\w.-]+/,
    /\b(?:Mr|Mrs|Ms|Shri|Smt|Dr|Adv)\.?\s+[A-Z][a-z]+/,
  ];
  return patterns.some(p => p.test(text));
}

/**
 * Preview what will be anonymized.
 */
export function anonymizationSummary(text: string): { anonymized: string; changes: string[] } {
  const after = anonymize(text);
  const changes: string[] = [];
  if (text !== after) {
    const placeholderMatches = after.match(/\[(PERSON|AADHAAR|PAN|PHONE|EMAIL|PINCODE|CNR|FIR|CASE|AMOUNT|DATE|ADDRESS)_\d+\]/g) || [];
    const unique = [...new Set(placeholderMatches.map(m => m.match(/\[(\w+)_/)?.[1] || ""))];
    const label: Record<string, string> = {
      PERSON: "Name(s)", AADHAAR: "Aadhaar", PAN: "PAN", PHONE: "Phone", EMAIL: "Email",
      PINCODE: "Pincode", CNR: "CNR", FIR: "FIR number", CASE: "Case number",
      AMOUNT: "Rupee amount", DATE: "Date", ADDRESS: "Address",
    };
    unique.forEach(type => { if (label[type]) changes.push(label[type]); });
  }
  return { anonymized: after, changes };
}
