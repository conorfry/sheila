import type { FlagSeverity } from "@sheila/shared/types";
import {
  passportSchema,
  payslipSchema,
  birthCertificateSchema,
  englishTestResultSchema,
  referenceLetterSchema,
  employmentContractSchema,
  degreeCertificateSchema,
  transcriptsSchema,
  sponsorApprovalLetterSchema,
} from "../schemas.js";
import { validatePassport } from "./passport.js";
import { validatePayslip } from "./payslip.js";
import { validateBirthCertificate } from "./birthCertificate.js";
import { validateEnglishTest } from "./englishTest.js";
import { validateReferenceLetter } from "./referenceLetter.js";
import { validateEmploymentContract } from "./employmentContract.js";
import { validateDegreeCertificate } from "./degreeCertificate.js";
import { validateTranscripts } from "./transcripts.js";
import { validateSponsorApprovalLetter } from "./sponsorApprovalLetter.js";

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
    case "birth_certificate": {
      const parsed = birthCertificateSchema.safeParse(fields);
      if (!parsed.success) return [];
      return validateBirthCertificate(parsed.data);
    }
    case "english_test_result": {
      const parsed = englishTestResultSchema.safeParse(fields);
      if (!parsed.success) return [];
      return validateEnglishTest(parsed.data);
    }
    case "reference_letter": {
      const parsed = referenceLetterSchema.safeParse(fields);
      if (!parsed.success) return [];
      return validateReferenceLetter(parsed.data);
    }
    case "employment_contract": {
      const parsed = employmentContractSchema.safeParse(fields);
      if (!parsed.success) return [];
      return validateEmploymentContract(parsed.data);
    }
    case "degree_certificate": {
      const parsed = degreeCertificateSchema.safeParse(fields);
      if (!parsed.success) return [];
      return validateDegreeCertificate(parsed.data);
    }
    case "transcripts": {
      const parsed = transcriptsSchema.safeParse(fields);
      if (!parsed.success) return [];
      return validateTranscripts(parsed.data);
    }
    case "sponsor_approval_letter": {
      const parsed = sponsorApprovalLetterSchema.safeParse(fields);
      if (!parsed.success) return [];
      return validateSponsorApprovalLetter(parsed.data);
    }
    default:
      return [];
  }
}

/** @deprecated Use validateDocument instead */
export const validateExtraction = validateDocument;
