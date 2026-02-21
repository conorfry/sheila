import type { ValidationFlag } from "./common.js";
import type { EnglishTestResultFields } from "../schemas.js";

const VALID_TEST_TYPES = ["IELTS", "PTE", "TOEFL"];

// Minimum overall scores typically required for skilled visas
const MIN_SCORES: Record<string, number> = {
  IELTS: 6,
  PTE: 50,
  TOEFL: 60,
};

export function validateEnglishTest(fields: EnglishTestResultFields): ValidationFlag[] {
  const flags: ValidationFlag[] = [];

  if (!VALID_TEST_TYPES.includes(fields.test_type)) {
    flags.push({
      code: "ENGLISH_TEST_TYPE_INVALID",
      field: "test_type",
      message: `Test type "${fields.test_type}" is not recognised. Expected IELTS, PTE, or TOEFL.`,
      severity: "PotentialBlocker",
    });
  }

  // Check if test is expired (valid for 2 years from test date)
  const testDate = new Date(fields.test_date);
  const twoYearsLater = new Date(testDate);
  twoYearsLater.setFullYear(twoYearsLater.getFullYear() + 2);
  const now = new Date();

  if (twoYearsLater < now) {
    flags.push({
      code: "ENGLISH_TEST_EXPIRED",
      field: "test_date",
      message: `English test taken on ${fields.test_date} has expired (valid for 2 years).`,
      severity: "PotentialBlocker",
    });
  }

  // Check minimum score for visa eligibility
  const minScore = MIN_SCORES[fields.test_type];
  if (minScore && fields.overall_score < minScore) {
    flags.push({
      code: "ENGLISH_SCORE_LOW",
      field: "overall_score",
      message: `Overall score ${fields.overall_score} is below the minimum ${minScore} for ${fields.test_type}.`,
      severity: "Review",
    });
  }

  return flags;
}
