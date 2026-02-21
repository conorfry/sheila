import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { validateDocument } from "../validators/common.js";
import { validatePassport } from "../validators/passport.js";
import { validatePayslip } from "../validators/payslip.js";
import { validateBirthCertificate } from "../validators/birthCertificate.js";
import { validateEnglishTest } from "../validators/englishTest.js";
import { validateReferenceLetter } from "../validators/referenceLetter.js";
import { validateEmploymentContract } from "../validators/employmentContract.js";
import { validateDegreeCertificate } from "../validators/degreeCertificate.js";
import { validateTranscripts } from "../validators/transcripts.js";
import { validateSponsorApprovalLetter } from "../validators/sponsorApprovalLetter.js";

// -- Passport --

describe("validatePassport", () => {
  it("returns no flags for valid passport", () => {
    const flags = validatePassport({
      full_name: "John Doe",
      date_of_birth: "1990-01-15",
      passport_number: "AB123456",
      nationality: "Australian",
      expiry_date: "2030-06-01",
    });
    expect(flags).toHaveLength(0);
  });

  it("flags expired passport", () => {
    const flags = validatePassport({
      full_name: "John Doe",
      date_of_birth: "1990-01-15",
      passport_number: "AB123456",
      nationality: "Australian",
      expiry_date: "2020-01-01",
    });
    expect(flags).toContainEqual(expect.objectContaining({ code: "PASSPORT_EXPIRED" }));
  });

  it("flags short passport number", () => {
    const flags = validatePassport({
      full_name: "John Doe",
      date_of_birth: "1990-01-15",
      passport_number: "AB1",
      nationality: "Australian",
      expiry_date: "2030-06-01",
    });
    expect(flags).toContainEqual(expect.objectContaining({ code: "PASSPORT_NUMBER_SHORT" }));
  });
});

// -- Payslip --

describe("validatePayslip", () => {
  it("returns no flags for valid payslip", () => {
    const flags = validatePayslip({
      employee_name: "Jane Doe",
      employer_name: "Acme Corp",
      pay_period_start: "2025-12-01",
      pay_period_end: "2025-12-31",
      gross_amount: 5000,
      currency: "AUD",
    });
    expect(flags).toHaveLength(0);
  });

  it("flags invalid period (end before start)", () => {
    const flags = validatePayslip({
      employee_name: "Jane Doe",
      employer_name: "Acme Corp",
      pay_period_start: "2025-12-31",
      pay_period_end: "2025-12-01",
      gross_amount: 5000,
      currency: "AUD",
    });
    expect(flags).toContainEqual(expect.objectContaining({ code: "PAYSLIP_PERIOD_INVALID" }));
  });

  it("flags low gross amount", () => {
    const flags = validatePayslip({
      employee_name: "Jane Doe",
      employer_name: "Acme Corp",
      pay_period_start: "2025-12-01",
      pay_period_end: "2025-12-31",
      gross_amount: 50,
      currency: "AUD",
    });
    expect(flags).toContainEqual(expect.objectContaining({ code: "PAYSLIP_LOW_AMOUNT" }));
  });
});

// -- Birth Certificate --

describe("validateBirthCertificate", () => {
  it("returns no flags for valid data", () => {
    const flags = validateBirthCertificate({
      full_name: "Alice Smith",
      date_of_birth: "1995-03-20",
      place_of_birth: "Sydney",
      parent_names: "Bob Smith, Carol Smith",
      registration_number: "REG12345",
    });
    expect(flags).toHaveLength(0);
  });

  it("flags short registration number", () => {
    const flags = validateBirthCertificate({
      full_name: "Alice Smith",
      date_of_birth: "1995-03-20",
      place_of_birth: "Sydney",
      parent_names: "Bob Smith, Carol Smith",
      registration_number: "AB",
    });
    expect(flags).toContainEqual(expect.objectContaining({ code: "BIRTH_CERT_REG_SHORT" }));
  });

  it("flags invalid date of birth", () => {
    const flags = validateBirthCertificate({
      full_name: "Alice Smith",
      date_of_birth: "9999-99-99",
      place_of_birth: "Sydney",
      parent_names: "Bob Smith, Carol Smith",
      registration_number: "REG12345",
    });
    expect(flags).toContainEqual(expect.objectContaining({ code: "BIRTH_CERT_DOB_INVALID" }));
  });
});

// -- English Test --

describe("validateEnglishTest", () => {
  it("returns no flags for valid recent IELTS", () => {
    const flags = validateEnglishTest({
      candidate_name: "Test User",
      test_type: "IELTS",
      overall_score: 7.5,
      test_date: "2025-06-01",
      expiry_date: "2027-06-01",
      component_scores: { listening: 7, reading: 8, writing: 7, speaking: 7.5 },
    });
    expect(flags).toHaveLength(0);
  });

  it("flags expired test (older than 2 years)", () => {
    const flags = validateEnglishTest({
      candidate_name: "Test User",
      test_type: "IELTS",
      overall_score: 7.5,
      test_date: "2020-01-01",
      expiry_date: "2022-01-01",
      component_scores: { listening: 7, reading: 8, writing: 7, speaking: 7.5 },
    });
    expect(flags).toContainEqual(expect.objectContaining({ code: "ENGLISH_TEST_EXPIRED" }));
  });

  it("flags low IELTS score", () => {
    const flags = validateEnglishTest({
      candidate_name: "Test User",
      test_type: "IELTS",
      overall_score: 5,
      test_date: "2025-06-01",
      expiry_date: "2027-06-01",
      component_scores: { listening: 5, reading: 5, writing: 5, speaking: 5 },
    });
    expect(flags).toContainEqual(expect.objectContaining({ code: "ENGLISH_SCORE_LOW" }));
  });
});

// -- Reference Letter --

describe("validateReferenceLetter", () => {
  it("returns no flags for valid reference", () => {
    const flags = validateReferenceLetter({
      employee_name: "John Doe",
      employer_name: "Tech Corp",
      job_title: "Software Engineer",
      employment_start: "2020-01-01",
      employment_end: "2024-12-31",
      duties_description: "Developed web apps.",
    });
    expect(flags).toHaveLength(0);
  });

  it("flags invalid period (end before start)", () => {
    const flags = validateReferenceLetter({
      employee_name: "John Doe",
      employer_name: "Tech Corp",
      job_title: "Software Engineer",
      employment_start: "2024-12-31",
      employment_end: "2020-01-01",
      duties_description: "Developed web apps.",
    });
    expect(flags).toContainEqual(expect.objectContaining({ code: "REFERENCE_PERIOD_INVALID" }));
  });

  it("flags future end date", () => {
    const flags = validateReferenceLetter({
      employee_name: "John Doe",
      employer_name: "Tech Corp",
      job_title: "Software Engineer",
      employment_start: "2020-01-01",
      employment_end: "2099-12-31",
      duties_description: "Developed web apps.",
    });
    expect(flags).toContainEqual(expect.objectContaining({ code: "REFERENCE_END_FUTURE" }));
  });
});

// -- Employment Contract --

describe("validateEmploymentContract", () => {
  it("returns no flags for valid contract", () => {
    const flags = validateEmploymentContract({
      employee_name: "Jane Doe",
      employer_name: "Startup Inc",
      job_title: "Product Manager",
      start_date: "2025-03-01",
      salary: 120000,
      currency: "AUD",
      employment_type: "full-time",
    });
    expect(flags).toHaveLength(0);
  });

  it("flags invalid start date", () => {
    const flags = validateEmploymentContract({
      employee_name: "Jane Doe",
      employer_name: "Startup Inc",
      job_title: "Product Manager",
      start_date: "not-a-date",
      salary: 120000,
      currency: "AUD",
      employment_type: "full-time",
    });
    expect(flags).toContainEqual(expect.objectContaining({ code: "CONTRACT_START_INVALID" }));
  });
});

// -- Degree Certificate --

describe("validateDegreeCertificate", () => {
  it("returns no flags for valid degree", () => {
    const flags = validateDegreeCertificate({
      graduate_name: "Alice Smith",
      institution_name: "University of Sydney",
      degree_title: "Bachelor of Science",
      field_of_study: "Computer Science",
      completion_date: "2020-12-15",
      country: "Australia",
    });
    expect(flags).toHaveLength(0);
  });

  it("flags future completion date", () => {
    const flags = validateDegreeCertificate({
      graduate_name: "Alice Smith",
      institution_name: "University of Sydney",
      degree_title: "Bachelor of Science",
      field_of_study: "Computer Science",
      completion_date: "2099-12-15",
      country: "Australia",
    });
    expect(flags).toContainEqual(expect.objectContaining({ code: "DEGREE_COMPLETION_FUTURE" }));
  });
});

// -- Transcripts --

describe("validateTranscripts", () => {
  it("returns no flags for valid transcripts", () => {
    const flags = validateTranscripts({
      student_name: "Bob Jones",
      institution_name: "UNSW",
      program_name: "Master of IT",
      gpa: 3.8,
      enrollment_date: "2018-02-01",
      completion_date: "2020-12-01",
      country: "Australia",
    });
    expect(flags).toHaveLength(0);
  });

  it("flags GPA out of range", () => {
    const flags = validateTranscripts({
      student_name: "Bob Jones",
      institution_name: "UNSW",
      program_name: "Master of IT",
      gpa: 15,
      enrollment_date: "2018-02-01",
      completion_date: "2020-12-01",
      country: "Australia",
    });
    expect(flags).toContainEqual(expect.objectContaining({ code: "TRANSCRIPT_GPA_INVALID" }));
  });

  it("flags completion before enrollment", () => {
    const flags = validateTranscripts({
      student_name: "Bob Jones",
      institution_name: "UNSW",
      program_name: "Master of IT",
      gpa: 3.8,
      enrollment_date: "2020-12-01",
      completion_date: "2018-02-01",
      country: "Australia",
    });
    expect(flags).toContainEqual(expect.objectContaining({ code: "TRANSCRIPT_DATES_INVALID" }));
  });
});

// -- Sponsor Approval Letter --

describe("validateSponsorApprovalLetter", () => {
  it("returns no flags for valid letter", () => {
    const flags = validateSponsorApprovalLetter({
      sponsor_name: "BigCo Pty Ltd",
      sponsor_abn: "12345678901",
      nominee_name: "John Doe",
      position_title: "Software Developer",
      approval_date: "2025-06-01",
      occupation_code: "261312",
    });
    expect(flags).toHaveLength(0);
  });

  it("flags invalid ABN (not 11 digits)", () => {
    const flags = validateSponsorApprovalLetter({
      sponsor_name: "BigCo Pty Ltd",
      sponsor_abn: "1234",
      nominee_name: "John Doe",
      position_title: "Software Developer",
      approval_date: "2025-06-01",
      occupation_code: "261312",
    });
    expect(flags).toContainEqual(expect.objectContaining({ code: "SPONSOR_ABN_INVALID" }));
  });

  it("flags future approval date", () => {
    const flags = validateSponsorApprovalLetter({
      sponsor_name: "BigCo Pty Ltd",
      sponsor_abn: "12345678901",
      nominee_name: "John Doe",
      position_title: "Software Developer",
      approval_date: "2099-06-01",
      occupation_code: "261312",
    });
    expect(flags).toContainEqual(expect.objectContaining({ code: "SPONSOR_APPROVAL_FUTURE" }));
  });
});

// -- validateDocument dispatcher --

describe("validateDocument", () => {
  it("dispatches to passport validator", () => {
    const flags = validateDocument(
      {
        full_name: "John Doe",
        date_of_birth: "1990-01-15",
        passport_number: "AB123456",
        nationality: "Australian",
        expiry_date: "2020-01-01",
      },
      "passport",
    );
    expect(flags).toContainEqual(expect.objectContaining({ code: "PASSPORT_EXPIRED" }));
  });

  it("dispatches to birth_certificate validator", () => {
    const flags = validateDocument(
      {
        full_name: "Alice",
        date_of_birth: "9999-99-99",
        place_of_birth: "Sydney",
        parent_names: "Parents",
        registration_number: "REG12345",
      },
      "birth_certificate",
    );
    expect(flags).toContainEqual(expect.objectContaining({ code: "BIRTH_CERT_DOB_INVALID" }));
  });

  it("returns empty array for unknown document type", () => {
    expect(validateDocument({}, "unknown_type")).toEqual([]);
  });

  it("returns empty array when fields fail schema parse", () => {
    expect(validateDocument({ bad: "data" }, "passport")).toEqual([]);
  });
});
