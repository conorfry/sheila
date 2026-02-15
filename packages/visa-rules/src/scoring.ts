import type { VisaType } from "@sheila/shared/types";

export interface ScoringResult {
  primaryVisa: VisaType;
  fallbackVisa: VisaType;
  rationale: string[];
  pointsTotal: number;
}

interface QuizAnswer {
  question_id: string;
  answer_json: unknown;
}

// -- Points tables --

function agePoints(age: number): number {
  if (age >= 45) return 0;
  if (age >= 40) return 15;
  if (age >= 33) return 25;
  if (age >= 25) return 30;
  if (age >= 18) return 25;
  return 0;
}

function experiencePoints(years: number): number {
  if (years >= 11) return 20;
  if (years >= 8) return 15;
  if (years >= 5) return 10;
  if (years >= 3) return 5;
  return 0;
}

function englishPoints(level: string): number {
  if (level === "superior") return 20;
  if (level === "proficient") return 10;
  return 0;
}

function qualificationPoints(qualification: string): number {
  if (qualification === "masters" || qualification === "phd") return 15;
  if (qualification === "bachelor") return 10;
  return 0;
}

function partnerPoints(hasPartnerSkills: boolean): number {
  return hasPartnerSkills ? 5 : 0;
}

// Helper to pull a typed value from quiz responses by question_id
function findAnswer(responses: QuizAnswer[], questionId: string): unknown {
  const entry = responses.find((r) => r.question_id === questionId);
  return entry?.answer_json ?? null;
}

export function scoreCase(quizResponses: QuizAnswer[]): ScoringResult {
  const rationale: string[] = [];

  // Check for employer sponsorship first (482 pathway)
  const employerSponsor = findAnswer(quizResponses, "employer_sponsor");
  if (employerSponsor === true) {
    rationale.push("Applicant has employer sponsorship -- 482 pathway.");
    rationale.push("190 is the fallback if nomination is available.");
    return {
      primaryVisa: "Subclass482",
      fallbackVisa: "Subclass190",
      rationale,
      pointsTotal: 0,
    };
  }

  // Calculate points
  const age = Number(findAnswer(quizResponses, "age")) || 0;
  const expYears = Number(findAnswer(quizResponses, "experience_years")) || 0;
  const english = String(findAnswer(quizResponses, "english_level") ?? "");
  const qualification = String(
    findAnswer(quizResponses, "qualification") ?? "",
  );
  const partner = findAnswer(quizResponses, "partner_skills") === true;

  const aPts = agePoints(age);
  const ePts = experiencePoints(expYears);
  const enPts = englishPoints(english);
  const qPts = qualificationPoints(qualification);
  const pPts = partnerPoints(partner);
  const total = aPts + ePts + enPts + qPts + pPts;

  rationale.push(`Age ${age}: ${aPts} points.`);
  rationale.push(`Experience ${expYears} years: ${ePts} points.`);
  rationale.push(`English "${english || "unknown"}": ${enPts} points.`);
  rationale.push(`Qualification "${qualification || "unknown"}": ${qPts} points.`);
  rationale.push(`Partner skills: ${pPts} points.`);
  rationale.push(`Total: ${total} points.`);

  if (total >= 65) {
    rationale.push(
      "Meets 65-point threshold for Skilled Independent (189).",
    );
    return {
      primaryVisa: "Subclass189",
      fallbackVisa: "Subclass190",
      rationale,
      pointsTotal: total,
    };
  }

  if (total >= 60) {
    rationale.push(
      "Meets 60-point threshold for Skilled Nominated (190) but not 65 for 189.",
    );
    return {
      primaryVisa: "Subclass190",
      fallbackVisa: "Subclass491",
      rationale,
      pointsTotal: total,
    };
  }

  rationale.push(
    "Below 60 points -- no points-tested visa is available without additional claims.",
  );
  return {
    primaryVisa: "Subclass482",
    fallbackVisa: "Subclass190",
    rationale,
    pointsTotal: total,
  };
}
