import { describe, it, expect } from "vitest";
import {
  passportSchema,
  payslipSchema,
  birthCertificateSchema,
  englishTestResultSchema,
  referenceLetterSchema,
  employmentContractSchema,
  degreeCertificateSchema,
  transcriptsSchema,
  sponsorApprovalLetterSchema,
  EXTRACTION_SCHEMAS,
} from "../schemas.js";

describe("passportSchema", () => {
  const valid = {
    full_name: "John Doe",
    date_of_birth: "1990-01-15",
    passport_number: "AB123456",
    nationality: "Australian",
    expiry_date: "2030-06-01",
  };

  it("parses valid passport data", () => {
    expect(passportSchema.parse(valid)).toEqual(valid);
  });

  it("rejects missing full_name", () => {
    expect(passportSchema.safeParse({ ...valid, full_name: "" }).success).toBe(false);
  });

  it("rejects invalid date format", () => {
    expect(passportSchema.safeParse({ ...valid, date_of_birth: "15/01/1990" }).success).toBe(false);
  });

  it("rejects short passport number", () => {
    expect(passportSchema.safeParse({ ...valid, passport_number: "AB1" }).success).toBe(false);
  });
});

describe("payslipSchema", () => {
  const valid = {
    employee_name: "Jane Doe",
    employer_name: "Acme Corp",
    pay_period_start: "2025-01-01",
    pay_period_end: "2025-01-31",
    gross_amount: 5000,
    currency: "AUD",
  };

  it("parses valid payslip data", () => {
    expect(payslipSchema.parse(valid)).toEqual(valid);
  });

  it("rejects zero gross_amount", () => {
    expect(payslipSchema.safeParse({ ...valid, gross_amount: 0 }).success).toBe(false);
  });

  it("rejects wrong currency length", () => {
    expect(payslipSchema.safeParse({ ...valid, currency: "AU" }).success).toBe(false);
  });
});

describe("birthCertificateSchema", () => {
  const valid = {
    full_name: "Alice Smith",
    date_of_birth: "1995-03-20",
    place_of_birth: "Sydney",
    parent_names: "Bob Smith, Carol Smith",
    registration_number: "REG12345",
  };

  it("parses valid data", () => {
    expect(birthCertificateSchema.parse(valid)).toEqual(valid);
  });

  it("rejects empty full_name", () => {
    expect(birthCertificateSchema.safeParse({ ...valid, full_name: "" }).success).toBe(false);
  });

  it("rejects invalid date_of_birth", () => {
    expect(birthCertificateSchema.safeParse({ ...valid, date_of_birth: "March 20" }).success).toBe(false);
  });
});

describe("englishTestResultSchema", () => {
  const valid = {
    candidate_name: "Test User",
    test_type: "IELTS" as const,
    overall_score: 7.5,
    test_date: "2025-01-10",
    expiry_date: "2027-01-10",
    component_scores: { listening: 7, reading: 8, writing: 7, speaking: 7.5 },
  };

  it("parses valid data", () => {
    expect(englishTestResultSchema.parse(valid)).toEqual(valid);
  });

  it("rejects invalid test_type", () => {
    expect(englishTestResultSchema.safeParse({ ...valid, test_type: "DUOLINGO" }).success).toBe(false);
  });

  it("rejects missing component scores", () => {
    expect(englishTestResultSchema.safeParse({ ...valid, component_scores: { listening: 7 } }).success).toBe(false);
  });
});

describe("referenceLetterSchema", () => {
  const valid = {
    employee_name: "John Doe",
    employer_name: "Tech Corp",
    job_title: "Software Engineer",
    employment_start: "2020-01-01",
    employment_end: "2024-12-31",
    duties_description: "Developed and maintained web applications.",
  };

  it("parses valid data", () => {
    expect(referenceLetterSchema.parse(valid)).toEqual(valid);
  });

  it("rejects empty duties_description", () => {
    expect(referenceLetterSchema.safeParse({ ...valid, duties_description: "" }).success).toBe(false);
  });
});

describe("employmentContractSchema", () => {
  const valid = {
    employee_name: "Jane Doe",
    employer_name: "Startup Inc",
    job_title: "Product Manager",
    start_date: "2025-03-01",
    salary: 120000,
    currency: "AUD",
    employment_type: "full-time" as const,
  };

  it("parses valid data", () => {
    expect(employmentContractSchema.parse(valid)).toEqual(valid);
  });

  it("rejects negative salary", () => {
    expect(employmentContractSchema.safeParse({ ...valid, salary: -1 }).success).toBe(false);
  });

  it("rejects invalid employment_type", () => {
    expect(employmentContractSchema.safeParse({ ...valid, employment_type: "casual" }).success).toBe(false);
  });
});

describe("degreeCertificateSchema", () => {
  const valid = {
    graduate_name: "Alice Smith",
    institution_name: "University of Sydney",
    degree_title: "Bachelor of Science",
    field_of_study: "Computer Science",
    completion_date: "2020-12-15",
    country: "Australia",
  };

  it("parses valid data", () => {
    expect(degreeCertificateSchema.parse(valid)).toEqual(valid);
  });

  it("rejects empty institution_name", () => {
    expect(degreeCertificateSchema.safeParse({ ...valid, institution_name: "" }).success).toBe(false);
  });
});

describe("transcriptsSchema", () => {
  const valid = {
    student_name: "Bob Jones",
    institution_name: "UNSW",
    program_name: "Master of IT",
    gpa: 3.8,
    enrollment_date: "2018-02-01",
    completion_date: "2020-12-01",
    country: "Australia",
  };

  it("parses valid data", () => {
    expect(transcriptsSchema.parse(valid)).toEqual(valid);
  });

  it("rejects missing student_name", () => {
    expect(transcriptsSchema.safeParse({ ...valid, student_name: "" }).success).toBe(false);
  });
});

describe("sponsorApprovalLetterSchema", () => {
  const valid = {
    sponsor_name: "BigCo Pty Ltd",
    sponsor_abn: "12345678901",
    nominee_name: "John Doe",
    position_title: "Software Developer",
    approval_date: "2025-06-01",
    occupation_code: "261312",
  };

  it("parses valid data", () => {
    expect(sponsorApprovalLetterSchema.parse(valid)).toEqual(valid);
  });

  it("rejects empty occupation_code", () => {
    expect(sponsorApprovalLetterSchema.safeParse({ ...valid, occupation_code: "" }).success).toBe(false);
  });
});

describe("EXTRACTION_SCHEMAS", () => {
  it("has all 9 document types registered", () => {
    expect(Object.keys(EXTRACTION_SCHEMAS)).toHaveLength(9);
    expect(Object.keys(EXTRACTION_SCHEMAS).sort()).toEqual([
      "birth_certificate",
      "degree_certificate",
      "employment_contract",
      "english_test_result",
      "passport",
      "payslip",
      "reference_letter",
      "sponsor_approval_letter",
      "transcripts",
    ]);
  });
});
