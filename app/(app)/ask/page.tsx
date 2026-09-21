"use client";

import { useState } from "react";

interface FeedbackCited {
  id: string;
  content: string;
  channel: string;
  sentiment: string | null;
  createdAt: string;
  themes: { theme: { name: string; color: string } }[];
}

interface AskResult {
  answer: string;
  cited: FeedbackCited[];
  question: string;
}

const SUGGESTED_QUESTIONS = [
  "What are users saying about onboarding?",
  "What are the most common complaints?",
  "What features are customers requesting most?",
  "How do customers feel about performance?",
  "What are customers saying about pricing?",
];

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskResult | null>(null);
  const [history, setHistory] = useState<AskResult[]>([]);
  const [error, setError] = useState("");

  async function handleAsk(q?: string) {
    const text = q ?? question;
    if (!text.trim()) return;

    setError("");
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: text }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Failed to get answer. Make sure you have feedback in your workspace.");
      return;
    }

    const data: AskResult = await res.json();
    setResult(data);
    setHistory((prev) => [data, ...prev.slice(0, 4)]);
    setQuestion("");
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Ask LOOP</h1>
        <p className="text-gray-500 mt-1">
          Ask questions about your customer feedback. Answers are grounded in your actual data.
        </p>
      </div>

      {/* Input */}
      <div className="card p-4 mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            className="input flex-1"
            placeholder="What are customers saying about…"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            disabled={loading}
          />
          <button
            onClick={() => handleAsk()}
            className="btn-primary px-6"
            disabled={!question.trim() || loading}
          >
            {loading ? "…" : "Ask"}
          </button>
        </div>

        {/* Suggested questions */}
        <div className="flex flex-wrap gap-2 mt-3">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => handleAsk(q)}
              disabled={loading}
              className="text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="card p-8 text-center">
          <div className="flex items-center justify-center gap-3 text-gray-500">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span>Searching feedback and generating answer…</span>
          </div>
        </div>
      )}

      {/* Current result */}
      {result && !loading && (
        <div className="card p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1">Q: {result.question}</p>
              <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">{result.answer}</p>
            </div>
          </div>

          {result.cited.length > 0 && (
            <>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Based on {result.cited.length} feedback item{result.cited.length !== 1 ? "s" : ""}
              </p>
              <div className="space-y-2">
                {result.cited.map((f) => (
                  <div key={f.id} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700 leading-relaxed">{f.content}</p>
                    <div className="flex gap-2 mt-1.5 text-xs text-gray-400">
                      <span>{f.channel.replace(/_/g, " ").toLowerCase()}</span>
                      {f.sentiment && (
                        <span className={
                          f.sentiment === "POSITIVE" ? "text-green-600" :
                          f.sentiment === "NEGATIVE" ? "text-red-500" : ""
                        }>
                          · {f.sentiment.toLowerCase()}
                        </span>
                      )}
                      <span>· {new Date(f.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 1 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Previous questions
          </h2>
          <div className="space-y-3">
            {history.slice(1).map((h, i) => (
              <div key={i} className="card p-4">
                <p className="text-xs text-indigo-600 font-medium mb-1">Q: {h.question}</p>
                <p className="text-sm text-gray-700 line-clamp-3">{h.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && history.length === 0 && (
        <div className="card p-16 text-center">
          <p className="text-4xl mb-3">💬</p>
          <p className="text-gray-600 font-medium">Ask anything about your feedback</p>
          <p className="text-gray-400 text-sm mt-1">
            Answers are grounded in your actual customer data — no hallucinations.
          </p>
        </div>
      )}
    </div>
  );
}
