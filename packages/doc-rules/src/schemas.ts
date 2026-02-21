import { z } from "zod";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

// Extracted fields schema for passport documents
export const passportSchema = z.object({
  full_name: z.string().min(1),
  date_of_birth: z.string().regex(datePattern),
  passport_number: z.string().min(5),
  nationality: z.string().min(2),
  expiry_date: z.string().regex(datePattern),
});

export type PassportFields = z.infer<typeof passportSchema>;

// Extracted fields schema for payslip documents
export const payslipSchema = z.object({
  employee_name: z.string().min(1),
  employer_name: z.string().min(1),
  pay_period_start: z.string().regex(datePattern),
  pay_period_end: z.string().regex(datePattern),
  gross_amount: z.number().positive(),
  currency: z.string().length(3),
});

export type PayslipFields = z.infer<typeof payslipSchema>;

// Extracted fields schema for birth certificate documents
export const birthCertificateSchema = z.object({
  full_name: z.string().min(1),
  date_of_birth: z.string().regex(datePattern),
  place_of_birth: z.string().min(1),
  parent_names: z.string().min(1),
  registration_number: z.string().min(1),
});

export type BirthCertificateFields = z.infer<typeof birthCertificateSchema>;

// Extracted fields schema for English test result documents
export const englishTestResultSchema = z.object({
  candidate_name: z.string().min(1),
  test_type: z.enum(["IELTS", "PTE", "TOEFL"]),
  overall_score: z.number(),
  test_date: z.string().regex(datePattern),
  expiry_date: z.string().regex(datePattern),
  component_scores: z.object({
    listening: z.number(),
    reading: z.number(),
    writing: z.number(),
    speaking: z.number(),
  }),
});

export type EnglishTestResultFields = z.infer<typeof englishTestResultSchema>;

// Extracted fields schema for reference letter documents
export const referenceLetterSchema = z.object({
  employee_name: z.string().min(1),
  employer_name: z.string().min(1),
  job_title: z.string().min(1),
  employment_start: z.string().regex(datePattern),
  employment_end: z.string().regex(datePattern),
  duties_description: z.string().min(1),
});

export type ReferenceLetterFields = z.infer<typeof referenceLetterSchema>;

// Extracted fields schema for employment contract documents
export const employmentContractSchema = z.object({
  employee_name: z.string().min(1),
  employer_name: z.string().min(1),
  job_title: z.string().min(1),
  start_date: z.string().regex(datePattern),
  salary: z.number().positive(),
  currency: z.string().length(3),
  employment_type: z.enum(["full-time", "part-time", "contract"]),
});

export type EmploymentContractFields = z.infer<typeof employmentContractSchema>;

// Extracted fields schema for degree certificate documents
export const degreeCertificateSchema = z.object({
  graduate_name: z.string().min(1),
  institution_name: z.string().min(1),
  degree_title: z.string().min(1),
  field_of_study: z.string().min(1),
  completion_date: z.string().regex(datePattern),
  country: z.string().min(1),
});

export type DegreeCertificateFields = z.infer<typeof degreeCertificateSchema>;

// Extracted fields schema for transcript documents
export const transcriptsSchema = z.object({
  student_name: z.string().min(1),
  institution_name: z.string().min(1),
  program_name: z.string().min(1),
  gpa: z.number(),
  enrollment_date: z.string().regex(datePattern),
  completion_date: z.string().regex(datePattern),
  country: z.string().min(1),
});

export type TranscriptsFields = z.infer<typeof transcriptsSchema>;

// Extracted fields schema for sponsor approval letter documents
export const sponsorApprovalLetterSchema = z.object({
  sponsor_name: z.string().min(1),
  sponsor_abn: z.string().min(1),
  nominee_name: z.string().min(1),
  position_title: z.string().min(1),
  approval_date: z.string().regex(datePattern),
  occupation_code: z.string().min(1),
});

export type SponsorApprovalLetterFields = z.infer<typeof sponsorApprovalLetterSchema>;

// Registry of schemas by slot key
export const EXTRACTION_SCHEMAS: Record<string, z.ZodSchema> = {
  passport: passportSchema,
  payslip: payslipSchema,
  birth_certificate: birthCertificateSchema,
  english_test_result: englishTestResultSchema,
  reference_letter: referenceLetterSchema,
  employment_contract: employmentContractSchema,
  degree_certificate: degreeCertificateSchema,
  transcripts: transcriptsSchema,
  sponsor_approval_letter: sponsorApprovalLetterSchema,
};
