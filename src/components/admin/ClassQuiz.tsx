"use client";

import { useState } from "react";
import { QUIZ_QUESTIONS, CLASS_INFO, scoreQuiz, type QuizKey, type ClassRec } from "@/lib/quiz";

const KEYS: QuizKey[] = ["a", "b", "c", "d"];
const KEY_LABEL: Record<QuizKey, string> = { a: "أ", b: "ب", c: "ج", d: "د" };

/** 7-question class-fit quiz. Reports the recommended class up via onResult. */
export function ClassQuiz({ onResult }: { onResult: (rec: ClassRec) => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizKey[]>([]);
  const done = answers.length === QUIZ_QUESTIONS.length;
  const result = done ? scoreQuiz(answers) : null;

  const pick = (k: QuizKey) => {
    const next = [...answers.slice(0, step), k];
    setAnswers(next);
    if (next.length === QUIZ_QUESTIONS.length) {
      onResult(scoreQuiz(next).primary);
    } else {
      setStep(step + 1);
    }
  };

  const restart = () => {
    setAnswers([]);
    setStep(0);
  };

  if (result) {
    const primary = CLASS_INFO[result.primary];
    const secondary = result.secondary ? CLASS_INFO[result.secondary] : null;
    return (
      <div className="space-y-3 rounded-md border border-accent/40 bg-surface-variant/40 p-4">
        <p className="text-caption text-status-full">الكلاس المنصوح به</p>
        <h3 className="font-display text-title text-primary-900">{primary.name_ar}</h3>
        <p className="text-body text-primary-900/90">{primary.advice_ar}</p>
        {secondary ? (
          <p className="text-meta text-status-full">خيار ثانٍ مقترح (تعادل): <span className="text-primary-900">{secondary.name_ar}</span></p>
        ) : null}
        <button type="button" onClick={restart} className="text-meta text-primary-700 underline">إعادة الاختبار</button>
      </div>
    );
  }

  const cur = QUIZ_QUESTIONS[step];
  return (
    <div className="space-y-3 rounded-md border border-outline bg-surface-variant/30 p-4">
      <div className="flex items-center justify-between">
        <span className="text-caption text-status-full">اختبار الكلاس المناسب</span>
        <span className="font-number text-caption text-primary-700">{step + 1} / {QUIZ_QUESTIONS.length}</span>
      </div>
      <p className="text-body font-medium text-primary-900">{cur.q}</p>
      <div className="space-y-2">
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => pick(k)}
            className="flex w-full items-start gap-2 rounded-md border border-outline bg-surface-elevated px-3 py-2.5 text-start text-body text-primary-900 hover:border-accent"
          >
            <span className="font-display text-primary-700">{KEY_LABEL[k]}</span>
            <span className="flex-1">{cur.options[k]}</span>
          </button>
        ))}
      </div>
      {step > 0 ? (
        <button type="button" onClick={() => setStep(step - 1)} className="text-meta text-status-full">‹ رجوع</button>
      ) : null}
    </div>
  );
}
