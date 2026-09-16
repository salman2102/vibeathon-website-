import type { ExtractedField } from '../types.js';

/**
 * ClearGov Document Intelligence — deterministic simulated extraction engine.
 *
 * The runtime uses a deterministic extraction model so the product works with
 * zero external AI keys. The `SEED_CATALOG` mirrors what production OCR + a
 * document-AI would return: fields, confidence, read flags and what the
 * document can/cannot establish. Swapping in a real OCR/LLM provider is a
 * matter of replacing `extractFields` (see the AI abstraction note in README).
 */

export interface DocSpec {
  requirement: string;
  label: string;
  fields: ExtractedField[];
  readability: number;
  quality: number;
  proves: string[];
  notProves: string[];
}

type SeedFn = (name: string) => ExtractedField[];

export const SEED_CATALOG: Record<string, { requirement: string; fields: SeedFn; readability: number; quality: number; proves: string[]; notProves: string[] }> = {
  identity: {
    requirement: 'identity',
    fields: (n) => [
      { key: 'name', label: 'Name', value: n, confidence: 99 },
      { key: 'dob', label: 'Date of Birth', value: '2005-04-14', confidence: 98 },
      { key: 'id_number', label: 'ID Number', value: 'XXXXXXXX3492', confidence: 97 },
    ],
    readability: 96, quality: 98,
    proves: ['Applicant\'s identity (name and date of birth)', 'Applicant is a real, identifiable person'],
    notProves: ['Current income', 'Academic performance', 'Residential address'],
  },
  marksheet: {
    requirement: 'academic',
    fields: (n) => [
      { key: 'name', label: 'Name', value: n, confidence: 99 },
      { key: 'marks_percent', label: 'Marks %', value: '86', confidence: 97 },
      { key: 'grade', label: 'Grade', value: 'A', confidence: 95 },
      { key: 'school_name', label: 'Institution', value: 'Government Arts College, Coimbatore', confidence: 96 },
    ],
    readability: 95, quality: 97,
    proves: ['Academic performance (86%) meets the merit threshold'],
    notProves: ['Family income', 'Bank account', 'Residential address'],
  },
  income: {
    requirement: 'income',
    fields: (n) => [
      { key: 'name', label: 'Name', value: n, confidence: 99 },
      { key: 'annual_income', label: 'Annual Income', value: '₹2,40,000', confidence: 96 },
      { key: 'address', label: 'Address', value: 'Coimbatore', confidence: 94 },
      { key: 'district', label: 'District', value: 'Coimbatore', confidence: 95 },
    ],
    readability: 94, quality: 95,
    proves: ['Annual family income (₹2,40,000) is below the eligibility ceiling'],
    notProves: ['Academic performance', 'Bank account', 'Current residential address (declared, not independently verified)'],
  },
  residence_conflict: {
    requirement: 'residence',
    fields: (n) => [
      { key: 'name', label: 'Name', value: n, confidence: 98 },
      { key: 'address', label: 'Address', value: 'Erode', confidence: 88 },
      { key: 'district', label: 'District', value: 'Erode', confidence: 87 },
    ],
    readability: 84, quality: 80,
    proves: ['A residence proof document was provided'],
    notProves: ['That the stated address is consistent with other documents (conflict detected)'],
  },
  residence: {
    requirement: 'residence',
    fields: (n) => [
      { key: 'name', label: 'Name', value: n, confidence: 99 },
      { key: 'address', label: 'Address', value: 'Coimbatore', confidence: 98 },
      { key: 'district', label: 'District', value: 'Coimbatore', confidence: 97 },
    ],
    readability: 96, quality: 97,
    proves: ['Residential address (Coimbatore) consistent with the income certificate'],
    notProves: ['Family income', 'Bank account', 'Academic performance'],
  },
  bank: {
    requirement: 'bank',
    fields: (n) => [
      { key: 'name', label: 'Name', value: n, confidence: 99 },
      { key: 'account_number', label: 'Account Number', value: 'XXXXXX4521', confidence: 97 },
      { key: 'ifsc', label: 'IFSC', value: 'HDFC0001428', confidence: 96 },
      { key: 'branch', label: 'Branch', value: 'Coimbatore Main', confidence: 95 },
    ],
    readability: 95, quality: 97,
    proves: ['A bank account belonging to the applicant for disbursement'],
    notProves: ['Family income', 'Academic performance', 'Residence'],
  },
  income_high: {
    requirement: 'income',
    fields: (n) => [
      { key: 'name', label: 'Name', value: n, confidence: 98 },
      { key: 'annual_income', label: 'Annual Income', value: '₹4,50,000', confidence: 95 },
      { key: 'address', label: 'Address', value: 'Coimbatore', confidence: 92 },
      { key: 'district', label: 'District', value: 'Coimbatore', confidence: 91 },
    ],
    readability: 92, quality: 93,
    proves: ['Annual family income (₹4,50,000) is reported on the certificate'],
    notProves: ['That the income is within the eligibility ceiling (it is not)'],
  },
  land: {
    requirement: 'plot',
    fields: (n) => [
      { key: 'name', label: 'Name', value: n, confidence: 92 },
      { key: 'land_holding', label: 'Land Holding', value: 'Dry land, 1.2 acres', confidence: 88 },
      { key: 'plot_owner', label: 'Owner', value: n, confidence: 90 },
    ],
    readability: 90, quality: 90,
    proves: ['Land holding status for housing-eligibility checks'],
    notProves: ['Income', 'Only-owner standing'],
  },
  route_a: {
    requirement: 'route',
    fields: (n) => [
      { key: 'name', label: 'Name', value: n, confidence: 98 },
      { key: 'route', label: 'Commute Route', value: 'Coimbatore - Gandhipuram', confidence: 90 },
      { key: 'school_name', label: 'Institution', value: 'Government Arts College, Coimbatore', confidence: 94 },
    ],
    readability: 92, quality: 90,
    proves: ['A declared commuting route for the transport concession'],
    notProves: ['That the reported route is consistent with other records (conflict detected)'],
  },
  route_b: {
    requirement: 'route',
    fields: (n) => [
      { key: 'name', label: 'Name', value: n, confidence: 98 },
      { key: 'route', label: 'Commute Route', value: 'Coimbatore - Valparai', confidence: 89 },
      { key: 'school_name', label: 'Institution', value: 'Government Arts College, Coimbatore', confidence: 93 },
    ],
    readability: 91, quality: 90,
    proves: ['A declared commuting route for the transport concession'],
    notProves: ['That the reported route is consistent with other records (conflict detected)'],
  },
  residence_lowquality: {
    requirement: 'residence',
    fields: (n) => [
      { key: 'name', label: 'Name', value: n, confidence: 72 },
      { key: 'address', label: 'Address', value: 'Coimbatore', confidence: 68 },
      { key: 'district', label: 'District', value: 'Coimbatore', confidence: 66 },
    ],
    readability: 54, quality: 58,
    proves: ['That a residence proof was submitted'],
    notProves: ['A readable, verifiable address (document quality is too low)'],
  },
  enrollment: {
    requirement: 'enrollment',
    fields: (n) => [
      { key: 'name', label: 'Name', value: n, confidence: 97 },
      { key: 'school_name', label: 'Institution', value: 'Government Arts College, Coimbatore', confidence: 96 },
      { key: 'std', label: 'Class', value: 'II Year B.Sc', confidence: 95 },
    ],
    readability: 95, quality: 96,
    proves: ['Active school enrollment'],
    notProves: ['Family income', 'Routes and distances'],
  },
  fee: {
    requirement: 'fee',
    fields: (n) => [
      { key: 'name', label: 'Name', value: n, confidence: 96 },
      { key: 'fee_amount', label: 'Fee Amount', value: '₹18,000', confidence: 94 },
      { key: 'institution', label: 'Institution', value: 'Government Arts College, Coimbatore', confidence: 95 },
    ],
    readability: 94, quality: 95,
    proves: ['The tuition fee payable at the institution'],
    notProves: ['Family income', 'Eligibility standing'],
  },
  medical: {
    requirement: 'medical',
    fields: (n) => [
      { key: 'name', label: 'Name', value: n, confidence: 96 },
      { key: 'diagnosis', label: 'Diagnosis', value: 'Cardiology — outpatient follow-up', confidence: 92 },
      { key: 'hospital', label: 'Hospital', value: 'GH Coimbatore', confidence: 94 },
    ],
    readability: 93, quality: 94,
    proves: ['A documented medical need for healthcare assistance'],
    notProves: ['Income', 'Other eligibility criteria'],
  },
  declaration: {
    requirement: 'self_declaration',
    fields: (n) => [
      { key: 'name', label: 'Name', value: n, confidence: 96 },
      { key: 'declared_income', label: 'Declared Income', value: '₹1,80,000', confidence: 90 },
      { key: 'community', label: 'Community', value: 'General', confidence: 92 },
    ],
    readability: 93, quality: 93,
    proves: ['A self-declaration of income and community', 'Applicant awareness of the facts being declared'],
    notProves: ['Independently verified income'],
  },
  supporting: {
    requirement: 'supporting',
    fields: (n) => [
      { key: 'name', label: 'Name', value: n, confidence: 95 },
      { key: 'supporting_value', label: 'Supporting Record', value: 'Tahsildar referral file', confidence: 91 },
    ],
    readability: 92, quality: 92,
    proves: ['Supporting records accompany the certificate request'],
    notProves: ['The correctness of every declared value'],
  },
};

const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  dob: 'Date of Birth',
  id_number: 'ID Number',
  marks_percent: 'Marks %',
  grade: 'Grade',
  school_name: 'Institution',
  annual_income: 'Annual Income',
  address: 'Address',
  district: 'District',
  account_number: 'Account Number',
  ifsc: 'IFSC',
  branch: 'Branch',
};

/** Deterministic fields for documents uploaded outside the demo seed catalog. */
function genericFields(requirement: string, name: string): ExtractedField[] {
  const base: ExtractedField[] = [{ key: 'name', label: 'Name', value: name, confidence: 90 }];
  switch (requirement) {
    case 'identity':
      return [...base, { key: 'dob', label: 'Date of Birth', value: '2005-04-14', confidence: 88 }, { key: 'id_number', label: 'ID Number', value: 'XXXXXXXX3492', confidence: 86 }];
    case 'academic':
      return [...base, { key: 'marks_percent', label: 'Marks %', value: '86', confidence: 89 }, { key: 'school_name', label: 'Institution', value: 'Government Arts College, Coimbatore', confidence: 88 }];
    case 'income':
      return [...base, { key: 'annual_income', label: 'Annual Income', value: '₹2,40,000', confidence: 90 }, { key: 'address', label: 'Address', value: 'Coimbatore', confidence: 86 }];
    case 'residence':
      return [...base, { key: 'address', label: 'Address', value: 'Coimbatore', confidence: 88 }, { key: 'district', label: 'District', value: 'Coimbatore', confidence: 86 }];
    case 'bank':
      return [...base, { key: 'account_number', label: 'Account Number', value: 'XXXXXX4521', confidence: 90 }, { key: 'ifsc', label: 'IFSC', value: 'HDFC0001428', confidence: 88 }];
    default:
      return [...base, { key: 'declaration', label: 'Declaration', value: 'Confirmed', confidence: 80 }];
  }
}

export function extractFields(requirement: string, seedOrFile: string, docType: string, applicantName = 'Salman'): { spec: DocSpec } {
  const seedKey = seedOrFile.toLowerCase().replace(/[^a-z0-9_]/g, '');
  const known = SEED_CATALOG[seedKey];
  if (known) {
    return {
      spec: {
        requirement: known.requirement,
        label: kindLabel(docType, requirement),
        fields: known.fields(applicantName),
        readability: known.readability,
        quality: known.quality,
        proves: known.proves,
        notProves: known.notProves,
      },
    };
  }
  const fields = genericFields(requirement, applicantName);
  return {
    spec: {
      requirement,
      label: kindLabel(docType, requirement),
      fields,
      readability: 86,
      quality: 85,
      proves: [`Key ${requirement.replace('_', ' ')} fields were extracted successfully`],
      notProves: ['Values beyond those extracted fields cannot be established from this document'],
    },
  };
}

function kindLabel(docType: string, requirement: string): string {
  const map: Record<string, string> = {
    identity: 'Identity Document',
    academic: 'Marksheet',
    income: 'Income Certificate',
    residence: 'Residence Proof',
    bank: 'Bank Proof',
  };
  if (docType && docType !== 'auto') {
    const pretty = docType.replace(/[-_]/g, ' ');
    return pretty.charAt(0).toUpperCase() + pretty.slice(1);
  }
  return map[requirement] ?? 'Supporting Document';
}

export function ocrPipeline(steps: string[], cb: (step: string, index: number) => void): void {
  steps.forEach((s, i) => setTimeout(() => cb(s, i), 320 * (i + 1)));
}

export const OCR_STEPS = ['Upload', 'OCR', 'Field Extraction', 'Quality Check', 'Cross-Document Comparison', 'Rule Validation', 'Assessment'];

export { FIELD_LABELS };