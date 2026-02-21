export {
  passportSchema,
  payslipSchema,
  birthCertificateSchema,
  englishTestResultSchema,
  referenceLetterSchema,
  employmentContractSchema,
  degreeCertificateSchema,
  transcriptsSchema,
  sponsorApprovalLetterSchema,
  EXTRACTION_SCHEMAS,
} from "./schemas.js";
export { validateDocument, validateExtraction } from "./validators/common.js";
export { validatePassport } from "./validators/passport.js";
export { validatePayslip } from "./validators/payslip.js";
export { validateBirthCertificate } from "./validators/birthCertificate.js";
export { validateEnglishTest } from "./validators/englishTest.js";
export { validateReferenceLetter } from "./validators/referenceLetter.js";
export { validateEmploymentContract } from "./validators/employmentContract.js";
export { validateDegreeCertificate } from "./validators/degreeCertificate.js";
export { validateTranscripts } from "./validators/transcripts.js";
export { validateSponsorApprovalLetter } from "./validators/sponsorApprovalLetter.js";
export type { ValidationFlag } from "./validators/common.js";
export type {
  PassportFields,
  PayslipFields,
  BirthCertificateFields,
  EnglishTestResultFields,
  ReferenceLetterFields,
  EmploymentContractFields,
  DegreeCertificateFields,
  TranscriptsFields,
  SponsorApprovalLetterFields,
} from "./schemas.js";
