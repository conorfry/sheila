import { z } from "zod";

// Extracted fields schema for passport documents
export const passportSchema = z.object({
  full_name: z.string().min(1),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  passport_number: z.string().min(5),
  nationality: z.string().min(2),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type PassportFields = z.infer<typeof passportSchema>;

// Extracted fields schema for payslip documents
export const payslipSchema = z.object({
  employee_name: z.string().min(1),
  employer_name: z.string().min(1),
  pay_period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pay_period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gross_amount: z.number().positive(),
  currency: z.string().length(3),
});

export type PayslipFields = z.infer<typeof payslipSchema>;

// Registry of schemas by slot key
export const EXTRACTION_SCHEMAS: Record<string, z.ZodSchema> = {
  passport: passportSchema,
  payslip: payslipSchema,
};
