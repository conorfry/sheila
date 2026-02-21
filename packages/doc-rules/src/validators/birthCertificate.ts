import type { ValidationFlag } from "./common.js";
import type { BirthCertificateFields } from "../schemas.js";

export function validateBirthCertificate(fields: BirthCertificateFields): ValidationFlag[] {
  const flags: ValidationFlag[] = [];

  if (!fields.full_name || fields.full_name.trim().length === 0) {
    flags.push({
      code: "BIRTH_CERT_NAME_MISSING",
      field: "full_name",
      message: "Full name could not be extracted from birth certificate.",
      severity: "PotentialBlocker",
    });
  }

  const dob = new Date(fields.date_of_birth);
  if (isNaN(dob.getTime())) {
    flags.push({
      code: "BIRTH_CERT_DOB_INVALID",
      field: "date_of_birth",
      message: "Date of birth is not a valid date.",
      severity: "PotentialBlocker",
    });
  }

  if (fields.registration_number.length < 4) {
    flags.push({
      code: "BIRTH_CERT_REG_SHORT",
      field: "registration_number",
      message: "Registration number appears unusually short. Please verify.",
      severity: "Review",
    });
  }

  return flags;
}
