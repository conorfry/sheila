import type { ValidationFlag } from "./common.js";
import type { SponsorApprovalLetterFields } from "../schemas.js";

export function validateSponsorApprovalLetter(fields: SponsorApprovalLetterFields): ValidationFlag[] {
  const flags: ValidationFlag[] = [];

  // ABN must be exactly 11 digits
  const abnDigits = fields.sponsor_abn.replace(/\s/g, "");
  if (!/^\d{11}$/.test(abnDigits)) {
    flags.push({
      code: "SPONSOR_ABN_INVALID",
      field: "sponsor_abn",
      message: "Sponsor ABN must be exactly 11 digits.",
      severity: "PotentialBlocker",
    });
  }

  const approvalDate = new Date(fields.approval_date);
  const now = new Date();
  if (approvalDate > now) {
    flags.push({
      code: "SPONSOR_APPROVAL_FUTURE",
      field: "approval_date",
      message: "Approval date is in the future.",
      severity: "Review",
    });
  }

  if (!fields.occupation_code || fields.occupation_code.trim().length === 0) {
    flags.push({
      code: "SPONSOR_OCCUPATION_MISSING",
      field: "occupation_code",
      message: "Occupation code is missing from the sponsor approval letter.",
      severity: "PotentialBlocker",
    });
  }

  return flags;
}
