"use client";
import React, { useState } from 'react';

export default function ATCQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const questions = [
    { q: "當航機要求『Direct to APU』時，代表什麼意思？", a: ["直接飛往 APU 導航點", "要求開啟輔助動力單元", "請求直接進場"] },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-green-400 p-8 font-mono">
      <div className="border-2 border-green-500 p-6 rounded-lg max-w-2xl mx-auto shadow-[0_0_15px_rgba(34,197,94,0.5)]">
        <h1 className="text-2xl mb-4 text-center underline">VSJX ATC 課後測驗系統</h1>
        <div className="mb-6">
          <p className="text-xl mb-4">{questions[currentQuestion].q}</p>
          {questions[currentQuestion].a.map((opt, i) => (
            <button key={i} className="block w-full text-left p-2 border border-green-800 hover:bg-green-900 mb-2 transition">
              {i + 1}. {opt}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-sm">
          <span>STATUS: EVALUATING...</span>
          <span>PAGE: {currentQuestion + 1} / {questions.length}</span>
        </div>
      </div>
    </div>
  );
}