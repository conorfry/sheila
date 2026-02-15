import type { FlagSeverity } from "@sheila/shared/types";
import { passportSchema, payslipSchema } from "../schemas.js";
import { validatePassport } from "./passport.js";
import { validatePayslip } from "./payslip.js";

export interface ValidationFlag {
  code: string;
  field: string;
  message: string;
  severity: FlagSeverity;
}

/**
 * Validates extracted fields for a given document type (or slot key).
 * Dispatches to the appropriate validator.
 * Returns a list of flags (empty if no issues found).
 */
export function validateDocument(
  fields: Record<string, unknown>,
  documentType: string,
): ValidationFlag[] {
  switch (documentType) {
    case "passport": {
      const parsed = passportSchema.safeParse(fields);
      if (!parsed.success) return [];
      return validatePassport(parsed.data);
    }
    case "payslips":
    case "payslip": {
      const parsed = payslipSchema.safeParse(fields);
      if (!parsed.success) return [];
      return validatePayslip(parsed.data);
    }
    default:
      return [];
  }
}

/** @deprecated Use validateDocument instead */
export const validateExtraction = validateDocument;
