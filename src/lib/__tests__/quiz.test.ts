import { describe, it, expect } from "vitest";
import { scoreQuiz, QUIZ_QUESTIONS, CLASS_INFO, type QuizKey } from "../quiz";

describe("scoreQuiz — class recommendation", () => {
  it("all 'a' → reformer", () => {
    expect(scoreQuiz(Array(7).fill("a") as QuizKey[])).toEqual({ primary: "reformer", secondary: null });
  });
  it("all 'b' → sculpt", () => {
    expect(scoreQuiz(Array(7).fill("b") as QuizKey[]).primary).toBe("sculpt");
  });
  it("all 'c' → center", () => {
    expect(scoreQuiz(Array(7).fill("c") as QuizKey[]).primary).toBe("center");
  });
  it("all 'd' → cardio_power", () => {
    expect(scoreQuiz(Array(7).fill("d") as QuizKey[]).primary).toBe("cardio_power");
  });
  it("majority wins", () => {
    expect(scoreQuiz(["a", "a", "a", "a", "b", "c", "d"]).primary).toBe("reformer");
  });
  it("tie surfaces a secondary", () => {
    const r = scoreQuiz(["a", "a", "a", "b", "b", "b", "c"]);
    expect(r.primary).toBe("reformer");
    expect(r.secondary).toBe("sculpt");
  });
});

describe("quiz content", () => {
  it("has 7 questions, each with 4 options", () => {
    expect(QUIZ_QUESTIONS).toHaveLength(7);
    for (const q of QUIZ_QUESTIONS) expect(Object.keys(q.options)).toEqual(["a", "b", "c", "d"]);
  });
  it("has advice for every class", () => {
    for (const k of ["reformer", "sculpt", "center", "cardio_power"] as const) {
      expect(CLASS_INFO[k].advice_ar.length).toBeGreaterThan(20);
    }
  });
});
