import type { ValidationFlag } from "./common.js";
import type { TranscriptsFields } from "../schemas.js";

export function validateTranscripts(fields: TranscriptsFields): ValidationFlag[] {
  const flags: ValidationFlag[] = [];

  if (!fields.institution_name || fields.institution_name.trim().length === 0) {
    flags.push({
      code: "TRANSCRIPT_INSTITUTION_MISSING",
      field: "institution_name",
      message: "Institution name could not be extracted from the transcript.",
      severity: "PotentialBlocker",
    });
  }

  if (fields.gpa < 0 || fields.gpa > 10) {
    flags.push({
      code: "TRANSCRIPT_GPA_INVALID",
      field: "gpa",
      message: `GPA value ${fields.gpa} is outside the expected range (0-10).`,
      severity: "Review",
    });
  }

  const enrollment = new Date(fields.enrollment_date);
  const completion = new Date(fields.completion_date);
  if (completion <= enrollment) {
    flags.push({
      code: "TRANSCRIPT_DATES_INVALID",
      field: "completion_date",
      message: "Completion date is not after enrollment date.",
      severity: "PotentialBlocker",
    });
  }

  return flags;
}
