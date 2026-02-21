import { describe, it, expect } from "vitest";
import { getChecklist } from "../checklist.js";

describe("getChecklist", () => {
  it("returns common slots for Subclass189", () => {
    const slots = getChecklist("Subclass189");
    const keys = slots.map((s) => s.slot_key);
    expect(keys).toContain("passport");
    expect(keys).toContain("birth_certificate");
    expect(keys).toContain("english_test_result");
    expect(keys).toContain("reference_letter");
    expect(keys).toContain("payslips");
    expect(keys).toContain("employment_contract");
    expect(keys).toContain("degree_certificate");
    expect(keys).toContain("transcripts");
    expect(keys).not.toContain("sponsor_approval_letter");
  });

  it("returns common slots for Subclass190", () => {
    const slots = getChecklist("Subclass190");
    const keys = slots.map((s) => s.slot_key);
    expect(keys).toContain("passport");
    expect(keys).not.toContain("sponsor_approval_letter");
  });

  it("includes sponsor slot for Subclass482", () => {
    const slots = getChecklist("Subclass482");
    const keys = slots.map((s) => s.slot_key);
    expect(keys).toContain("passport");
    expect(keys).toContain("sponsor_approval_letter");
  });

  it("assigns correct categories", () => {
    const slots = getChecklist("Subclass189");
    const passport = slots.find((s) => s.slot_key === "passport");
    expect(passport?.category).toBe("Identity");
    const english = slots.find((s) => s.slot_key === "english_test_result");
    expect(english?.category).toBe("English");
    const ref = slots.find((s) => s.slot_key === "reference_letter");
    expect(ref?.category).toBe("Employment");
    const degree = slots.find((s) => s.slot_key === "degree_certificate");
    expect(degree?.category).toBe("Education");
  });

  it("marks all common slots as required", () => {
    const slots = getChecklist("Subclass189");
    expect(slots.every((s) => s.required)).toBe(true);
  });

  it("includes accepted mime types", () => {
    const slots = getChecklist("Subclass189");
    const passport = slots.find((s) => s.slot_key === "passport");
    expect(passport?.accepted_mime).toContain("application/pdf");
    expect(passport?.accepted_mime).toContain("image/jpeg");
  });
});
