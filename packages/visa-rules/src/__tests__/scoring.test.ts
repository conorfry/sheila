import { describe, it, expect } from "vitest";
import { scoreCase } from "../scoring.js";

function makeQuiz(answers: Record<string, unknown>) {
  return Object.entries(answers).map(([question_id, answer_json]) => ({
    question_id,
    answer_json,
  }));
}

describe("scoreCase", () => {
  it("returns 482 pathway for employer-sponsored applicant", () => {
    const result = scoreCase(makeQuiz({ employer_sponsor: true }));
    expect(result.primaryVisa).toBe("Subclass482");
    expect(result.fallbackVisa).toBe("Subclass190");
    expect(result.pointsTotal).toBe(0);
  });

  it("returns 189 for high-scoring applicant (65+ points)", () => {
    const result = scoreCase(
      makeQuiz({
        age: 28,            // 30 pts
        experience_years: 8, // 15 pts
        english_level: "superior", // 20 pts
        qualification: "bachelor", // 10 pts
      }),
    );
    expect(result.primaryVisa).toBe("Subclass189");
    expect(result.pointsTotal).toBe(75);
  });

  it("returns 190 for applicant with 60-64 points", () => {
    const result = scoreCase(
      makeQuiz({
        age: 28,            // 30 pts
        experience_years: 5, // 10 pts
        english_level: "superior", // 20 pts
        qualification: "",   // 0 pts
      }),
    );
    expect(result.primaryVisa).toBe("Subclass190");
    expect(result.fallbackVisa).toBe("Subclass491");
    expect(result.pointsTotal).toBe(60);
  });

  it("returns 482 fallback for low-scoring applicant (<60 points)", () => {
    const result = scoreCase(
      makeQuiz({
        age: 50,            // 0 pts
        experience_years: 1, // 0 pts
        english_level: "",   // 0 pts
        qualification: "",   // 0 pts
      }),
    );
    expect(result.primaryVisa).toBe("Subclass482");
    expect(result.pointsTotal).toBe(0);
  });

  it("adds partner points correctly", () => {
    const without = scoreCase(
      makeQuiz({
        age: 28,
        experience_years: 3,
        english_level: "proficient",
        qualification: "bachelor",
        partner_skills: false,
      }),
    );
    const with_ = scoreCase(
      makeQuiz({
        age: 28,
        experience_years: 3,
        english_level: "proficient",
        qualification: "bachelor",
        partner_skills: true,
      }),
    );
    expect(with_.pointsTotal - without.pointsTotal).toBe(5);
  });

  it("calculates age points for different brackets", () => {
    // age 18-24: 25 pts
    const r1 = scoreCase(makeQuiz({ age: 20 }));
    expect(r1.pointsTotal).toBe(25);

    // age 25-32: 30 pts
    const r2 = scoreCase(makeQuiz({ age: 30 }));
    expect(r2.pointsTotal).toBe(30);

    // age 33-39: 25 pts
    const r3 = scoreCase(makeQuiz({ age: 35 }));
    expect(r3.pointsTotal).toBe(25);

    // age 40-44: 15 pts
    const r4 = scoreCase(makeQuiz({ age: 42 }));
    expect(r4.pointsTotal).toBe(15);

    // age 45+: 0 pts
    const r5 = scoreCase(makeQuiz({ age: 50 }));
    expect(r5.pointsTotal).toBe(0);
  });

  it("includes rationale strings", () => {
    const result = scoreCase(makeQuiz({ age: 28 }));
    expect(result.rationale.length).toBeGreaterThan(0);
    expect(result.rationale.some((r) => r.includes("Age"))).toBe(true);
  });
});
