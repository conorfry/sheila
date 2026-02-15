import type { ValidationFlag } from "./common.js";
import type { PassportFields } from "../schemas.js";

/**
 * Validates extracted passport fields.
 * Returns flags with specific codes for each issue detected.
 */
export function validatePassport(fields: PassportFields): ValidationFlag[] {
  const flags: ValidationFlag[] = [];

  // Check if passport is expired
  const expiry = new Date(fields.expiry_date);
  const now = new Date();
  if (expiry < now) {
    flags.push({
      code: "PASSPORT_EXPIRED",
      field: "expiry_date",
      message: `Passport expired on ${fields.expiry_date}. A valid passport is required.`,
      severity: "PotentialBlocker",
    });
  }

  // Check if passport expires within 6 months
  const sixMonths = new Date();
  sixMonths.setMonth(sixMonths.getMonth() + 6);
  if (expiry < sixMonths && expiry >= now) {
    flags.push({
      code: "PASSPORT_EXPIRING_SOON",
      field: "expiry_date",
      message: `Passport expires within 6 months (${fields.expiry_date}). Consider renewing before application.`,
      severity: "Review",
    });
  }

  // Passport number sanity check
  if (fields.passport_number.length < 6) {
    flags.push({
      code: "PASSPORT_NUMBER_SHORT",
      field: "passport_number",
      message: "Passport number appears unusually short. Please verify.",
      severity: "Review",
    });
  }

  // Missing full name
  if (!fields.full_name || fields.full_name.trim().length === 0) {
    flags.push({
      code: "NAME_MISSING",
      field: "full_name",
      message: "Full name could not be extracted from passport.",
      severity: "PotentialBlocker",
    });
  }

  return flags;
}
