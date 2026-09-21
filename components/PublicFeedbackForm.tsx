"use client";

import { useRef, useState } from "react";
import { submitPublicFeedback } from "@/app/actions";

export function PublicFeedbackForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      await submitPublicFeedback(formData);
      setSuccess(true);
      formRef.current?.reset();
    } catch (err: any) {
      setError(err.message || "Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-12">
      <h3 className="text-xl font-semibold text-white mb-4">Add Feedback</h3>
      {success && (
        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
          Feedback submitted successfully!
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}
      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <textarea
          name="content"
          className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-3 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 min-h-[100px]"
          placeholder="What would you like to see improved or added?"
          required
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
