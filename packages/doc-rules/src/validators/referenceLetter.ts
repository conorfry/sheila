import type { ValidationFlag } from "./common.js";
import type { ReferenceLetterFields } from "../schemas.js";

export function validateReferenceLetter(fields: ReferenceLetterFields): ValidationFlag[] {
  const flags: ValidationFlag[] = [];

  const start = new Date(fields.employment_start);
  const end = new Date(fields.employment_end);

  if (end <= start) {
    flags.push({
      code: "REFERENCE_PERIOD_INVALID",
      field: "employment_end",
      message: "Employment end date is not after start date.",
      severity: "PotentialBlocker",
    });
  }

  const now = new Date();
  if (end > now) {
    flags.push({
      code: "REFERENCE_END_FUTURE",
      field: "employment_end",
      message: "Employment end date is in the future. Reference letters should cover past employment.",
      severity: "Review",
    });
  }

  if (!fields.duties_description || fields.duties_description.trim().length === 0) {
    flags.push({
      code: "REFERENCE_DUTIES_MISSING",
      field: "duties_description",
      message: "Duties description is missing. This is required for skills assessment.",
      severity: "PotentialBlocker",
    });
  }

  return flags;
}
