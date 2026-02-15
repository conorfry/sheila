import type { ValidationFlag } from "./common.js";
import type { PayslipFields } from "../schemas.js";

/**
 * Validates extracted payslip fields.
 * Returns flags with specific codes for each issue detected.
 */
export function validatePayslip(fields: PayslipFields): ValidationFlag[] {
  const flags: ValidationFlag[] = [];

  // Pay period end must be after start
  const start = new Date(fields.pay_period_start);
  const end = new Date(fields.pay_period_end);
  if (end <= start) {
    flags.push({
      code: "PAYSLIP_PERIOD_INVALID",
      field: "pay_period_end",
      message: "Pay period end date is not after start date.",
      severity: "PotentialBlocker",
    });
  }

  // Check for very old payslips (more than 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  if (end < sixMonthsAgo) {
    flags.push({
      code: "PAYSLIP_STALE",
      field: "pay_period_end",
      message: `Payslip is older than 6 months (${fields.pay_period_end}). A recent payslip may be required.`,
      severity: "Review",
    });
  }

  // Gross amount sanity
  if (fields.gross_amount < 100) {
    flags.push({
      code: "PAYSLIP_LOW_AMOUNT",
      field: "gross_amount",
      message: `Gross amount (${fields.gross_amount}) appears unusually low. Please verify.`,
      severity: "Review",
    });
  }

  return flags;
}
