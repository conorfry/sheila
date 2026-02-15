import type { VisaType } from "@sheila/shared/types";

export interface ChecklistSlot {
  category: string;
  slot_key: string;
  required: boolean;
  description: string;
  accepted_mime: string[];
}

const PDF = "application/pdf";
const JPEG = "image/jpeg";
const PNG = "image/png";
const DOC_MIMES = [PDF, JPEG, PNG];

const COMMON_SLOTS: ChecklistSlot[] = [
  // Identity
  {
    category: "Identity",
    slot_key: "passport",
    required: true,
    description: "Certified copy of passport bio page.",
    accepted_mime: DOC_MIMES,
  },
  {
    category: "Identity",
    slot_key: "birth_certificate",
    required: true,
    description: "Birth certificate or certified translation.",
    accepted_mime: DOC_MIMES,
  },
  // English
  {
    category: "English",
    slot_key: "english_test_result",
    required: true,
    description: "IELTS, PTE, or equivalent English test result.",
    accepted_mime: [PDF],
  },
  // Employment
  {
    category: "Employment",
    slot_key: "reference_letter",
    required: true,
    description: "Reference letter from current or previous employer.",
    accepted_mime: [PDF],
  },
  {
    category: "Employment",
    slot_key: "payslips",
    required: true,
    description: "Recent payslips covering at least 3 months.",
    accepted_mime: DOC_MIMES,
  },
  {
    category: "Employment",
    slot_key: "employment_contract",
    required: true,
    description: "Signed employment contract.",
    accepted_mime: [PDF],
  },
  // Education
  {
    category: "Education",
    slot_key: "degree_certificate",
    required: true,
    description: "Degree certificate or completion letter from the institution.",
    accepted_mime: DOC_MIMES,
  },
  {
    category: "Education",
    slot_key: "transcripts",
    required: true,
    description: "Academic transcripts for the claimed qualification.",
    accepted_mime: [PDF],
  },
];

const SPONSOR_SLOTS: ChecklistSlot[] = [
  {
    category: "Sponsorship",
    slot_key: "sponsor_approval_letter",
    required: true,
    description: "Sponsor approval letter from the nominating employer.",
    accepted_mime: [PDF],
  },
];

export function getChecklist(visaType: VisaType): ChecklistSlot[] {
  switch (visaType) {
    case "Subclass482":
      return [...COMMON_SLOTS, ...SPONSOR_SLOTS];
    case "Subclass189":
    case "Subclass190":
    case "Subclass491":
    default:
      return [...COMMON_SLOTS];
  }
}
