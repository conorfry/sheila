import type { ValidationFlag } from "./common.js";
import type { EmploymentContractFields } from "../schemas.js";

export function validateEmploymentContract(fields: EmploymentContractFields): ValidationFlag[] {
  const flags: ValidationFlag[] = [];

  const startDate = new Date(fields.start_date);
  if (isNaN(startDate.getTime())) {
    flags.push({
      code: "CONTRACT_START_INVALID",
      field: "start_date",
      message: "Start date is not a valid date.",
      severity: "PotentialBlocker",
    });
  }

  if (fields.salary <= 0) {
    flags.push({
      code: "CONTRACT_SALARY_INVALID",
      field: "salary",
      message: "Salary must be greater than zero.",
      severity: "PotentialBlocker",
    });
  }

  if (!fields.employer_name || fields.employer_name.trim().length === 0) {
    flags.push({
      code: "CONTRACT_EMPLOYER_MISSING",
      field: "employer_name",
      message: "Employer name could not be extracted from the contract.",
      severity: "PotentialBlocker",
    });
  }

  return flags;
}
