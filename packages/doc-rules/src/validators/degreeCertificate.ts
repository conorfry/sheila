import type { ValidationFlag } from "./common.js";
import type { DegreeCertificateFields } from "../schemas.js";

export function validateDegreeCertificate(fields: DegreeCertificateFields): ValidationFlag[] {
  const flags: ValidationFlag[] = [];

  if (!fields.institution_name || fields.institution_name.trim().length === 0) {
    flags.push({
      code: "DEGREE_INSTITUTION_MISSING",
      field: "institution_name",
      message: "Institution name could not be extracted from the degree certificate.",
      severity: "PotentialBlocker",
    });
  }

  const completionDate = new Date(fields.completion_date);
  const now = new Date();
  if (completionDate > now) {
    flags.push({
      code: "DEGREE_COMPLETION_FUTURE",
      field: "completion_date",
      message: "Completion date is in the future. The degree may not have been conferred yet.",
      severity: "Review",
    });
  }

  if (!fields.degree_title || fields.degree_title.trim().length === 0) {
    flags.push({
      code: "DEGREE_TITLE_MISSING",
      field: "degree_title",
      message: "Degree title could not be extracted from the certificate.",
      severity: "PotentialBlocker",
    });
  }

  return flags;
}
