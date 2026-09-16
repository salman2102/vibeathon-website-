export const SCENARIO_DEFS = [
    { key: 'scholarship', name: 'Student Scholarship', description: 'Merit-cum-means scholarship for undergraduate students across Tamil Nadu.', accent: '#0ea5e9' },
    { key: 'housing', name: 'Housing Assistance', description: 'Subsidised housing support for low-income households.', accent: '#8b5cf6' },
    { key: 'income_benefit', name: 'Income-Based Benefit', description: 'Monthly financial benefit linked to certified family income.', accent: '#10b981' },
    { key: 'education_support', name: 'Education Support', description: 'School supplies, fee reimbursement and transport aid for students.', accent: '#f59e0b' },
    { key: 'healthcare', name: 'Public Healthcare Assistance', description: 'Cashless treatment and medical aid for eligible families.', accent: '#ef4444' },
    { key: 'transport', name: 'Student Transport Benefit', description: 'Concession passes for students commuting to educational institutions.', accent: '#14b8a6' },
    { key: 'certificate', name: 'Government Certificate Request', description: 'Issuance of income, residence and community certificates.', accent: '#64748b' },
];
const scholarshipRequirements = [
    {
        key: 'identity',
        label: 'Identity',
        description: 'Prove the applicant\'s identity with an official identity document (Aadhaar / Passport / ID).',
        evidenceLabel: 'Identity Document',
        minConfidence: 85,
        helpText: 'Why am I being asked for this document? ClearGov must confirm that the claim is made by a real, identifiable citizen before any benefit is considered.',
        rule: {
            type: 'field',
            field: 'name',
            label: 'Name',
            operator: 'match',
            test: (facts) => Boolean(facts['name']?.value),
            explain: (facts) => ({
                passed: Boolean(facts['name']?.value),
                humanCheck: 'The identity document must show the applicant\'s full legal name.',
            }),
        },
    },
    {
        key: 'academic',
        label: 'Academic Eligibility',
        description: 'Previous examination marksheet confirming the applicant meets the academic threshold.',
        evidenceLabel: 'Marksheet',
        minConfidence: 85,
        helpText: 'Why am I being asked for this document? This scholarship covers students above a defined academic threshold.',
        rule: {
            type: 'threshold',
            field: 'marks_percent',
            label: 'Marks %',
            operator: '>=',
            threshold: 60,
            test: (facts) => Number(facts['marks_percent']?.value ?? 0) >= 60,
            explain: (facts) => {
                const v = Number(facts['marks_percent']?.value ?? 0);
                return {
                    passed: v >= 60,
                    comparison: `${v}% >= 60%`,
                    humanCheck: 'Marksheet aggregate must be at least 60%.',
                };
            },
        },
    },
    {
        key: 'income',
        label: 'Family Income',
        description: 'Income certificate establishing annual family income within the ceiling.',
        evidenceLabel: 'Income Certificate',
        minConfidence: 85,
        helpText: 'Why am I being asked for this document? Eligibility is means-tested — the benefit is reserved for families below the annual income ceiling.',
        rule: {
            type: 'threshold',
            field: 'annual_income',
            label: 'Annual Income',
            operator: '<=',
            threshold: 300000,
            test: (facts) => {
                const v = Number(String(facts['annual_income']?.value ?? '0').replace(/[^\d]/g, ''));
                return v <= 300000;
            },
            explain: (facts) => {
                const v = Number(String(facts['annual_income']?.value ?? '0').replace(/[^\d]/g, ''));
                return {
                    passed: v <= 300000,
                    comparison: `₹${v.toLocaleString('en-IN')} < ₹3,00,000`,
                    humanCheck: 'Annual family income must be at or below ₹3,00,000.',
                };
            },
        },
    },
    {
        key: 'residence',
        label: 'Residence',
        description: 'Residence proof confirming the applicant lives within the service area.',
        evidenceLabel: 'Residence Proof',
        minConfidence: 80,
        helpText: 'Why am I being asked for this document? The scholarship is administered by the district the applicant resides in.',
        rule: {
            type: 'field',
            field: 'address',
            label: 'Address',
            operator: 'consistency',
            test: () => true,
            explain: () => ({
                passed: true,
                humanCheck: 'The address on the residence proof must be consistent across all submitted documents.',
            }),
        },
    },
    {
        key: 'bank',
        label: 'Bank Proof',
        description: 'Passbook or account statement with the applicant\'s account and branch details for disbursement.',
        evidenceLabel: 'Bank Proof',
        minConfidence: 80,
        helpText: 'Why am I being asked for this document? The scholarship amount is disbursed only to a verified bank account in the applicant\'s name.',
        rule: {
            type: 'field',
            field: 'account_number',
            label: 'Account Number',
            operator: 'present',
            test: (facts) => Boolean(facts['account_number']?.value),
            explain: (facts) => ({
                passed: Boolean(facts['account_number']?.value),
                humanCheck: 'A valid bank account belonging to the applicant must be on record.',
            }),
        },
    },
];
function genericRequirements(keys) {
    return keys.map((k) => ({
        key: k.key,
        label: k.label,
        description: `${k.evidence} is required to establish ${k.label.toLowerCase()}.`,
        evidenceLabel: k.evidence,
        minConfidence: k.min,
        helpText: `Why am I being asked for this document? ${k.evidence} is mandatory to verify ${k.label.toLowerCase()}.`,
        rule: {
            type: 'field',
            field: k.field,
            label: k.label,
            operator: 'present',
            test: (facts) => Boolean(facts[k.field]?.value),
            explain: (facts) => ({
                passed: Boolean(facts[k.field]?.value),
                humanCheck: `${k.evidence} must be present and legible.`,
            }),
        },
    }));
}
export const SCENARIOS = [
    {
        key: 'scholarship',
        name: 'Student Scholarship',
        description: 'Merit-cum-means scholarship for undergraduate students across Tamil Nadu.',
        accent: '#0ea5e9',
        requirements: scholarshipRequirements,
    },
    {
        key: 'housing',
        name: 'Housing Assistance',
        description: 'Subsidised housing support for low-income households.',
        accent: '#8b5cf6',
        requirements: genericRequirements([
            { key: 'identity', label: 'Identity', evidence: 'Identity Document', field: 'name', min: 85 },
            { key: 'income', label: 'Family Income', evidence: 'Income Certificate', field: 'annual_income', min: 85 },
            { key: 'residence', label: 'Residence', evidence: 'Residence Proof', field: 'address', min: 80 },
            { key: 'plot', label: 'Land Holding', evidence: 'Land Records', field: 'land_holding', min: 75 },
        ]),
    },
    {
        key: 'income_benefit',
        name: 'Income-Based Benefit',
        description: 'Monthly financial benefit linked to certified family income.',
        accent: '#10b981',
        requirements: genericRequirements([
            { key: 'identity', label: 'Identity', evidence: 'Identity Document', field: 'name', min: 85 },
            { key: 'income', label: 'Family Income', evidence: 'Income Certificate', field: 'annual_income', min: 85 },
            { key: 'bank', label: 'Bank Proof', evidence: 'Bank Proof', field: 'account_number', min: 80 },
        ]),
    },
    {
        key: 'education_support',
        name: 'Education Support',
        description: 'School supplies, fee reimbursement and transport aid for students.',
        accent: '#f59e0b',
        requirements: genericRequirements([
            { key: 'identity', label: 'Identity', evidence: 'Identity Document', field: 'name', min: 85 },
            { key: 'enrollment', label: 'School Enrollment', evidence: 'Enrollment Certificate', field: 'school_name', min: 80 },
            { key: 'fee', label: 'Fee Structure', evidence: 'Fee Receipt', field: 'fee_amount', min: 75 },
        ]),
    },
    {
        key: 'healthcare',
        name: 'Public Healthcare Assistance',
        description: 'Cashless treatment and medical aid for eligible families.',
        accent: '#ef4444',
        requirements: genericRequirements([
            { key: 'identity', label: 'Identity', evidence: 'Identity Document', field: 'name', min: 85 },
            { key: 'income', label: 'Family Income', evidence: 'Income Certificate', field: 'annual_income', min: 85 },
            { key: 'medical', label: 'Medical Report', evidence: 'Medical Report', field: 'diagnosis', min: 75 },
        ]),
    },
    {
        key: 'transport',
        name: 'Student Transport Benefit',
        description: 'Concession passes for students commuting to educational institutions.',
        accent: '#14b8a6',
        requirements: genericRequirements([
            { key: 'identity', label: 'Identity', evidence: 'Identity Document', field: 'name', min: 85 },
            { key: 'enrollment', label: 'School Enrollment', evidence: 'Enrollment Certificate', field: 'school_name', min: 80 },
            { key: 'route', label: 'Commute Route', evidence: 'Route Declaration', field: 'route', min: 75 },
        ]),
    },
    {
        key: 'certificate',
        name: 'Government Certificate Request',
        description: 'Issuance of income, residence and community certificates.',
        accent: '#64748b',
        requirements: genericRequirements([
            { key: 'identity', label: 'Identity', evidence: 'Identity Document', field: 'name', min: 85 },
            { key: 'self_declaration', label: 'Self Declaration', evidence: 'Self Declaration Form', field: 'declared_income', min: 70 },
            { key: 'supporting', label: 'Supporting Record', evidence: 'Supporting Record', field: 'supporting_value', min: 70 },
        ]),
    },
];
