"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Report {
  id: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  generatedBy: { name: string; email: string };
  contentJson: {
    narrative: string;
    stats: {
      totalItems: number;
      sentimentBreakdown: { POSITIVE: number; NEUTRAL: number; NEGATIVE: number };
      topThemes: { name: string; count: number }[];
    };
  };
}

export default function ReportsPage() {
  const { data: session } = useSession();
  const canWrite = true;

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    title: `VoC Report — ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
    periodStart: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
    periodEnd: new Date().toISOString().split("T")[0],
  });

  function fetchReports() {
    setLoading(true);
    fetch("/api/reports")
      .then((r) => r.json())
      .then(setReports)
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchReports(); }, []);

  async function generateReport(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);

    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setGenerating(false);
    setShowForm(false);

    if (res.ok) fetchReports();
  }

  if (loading) {
    return (
      <div className="p-8 animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-28 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1">AI-generated Voice-of-Customer reports</p>
        </div>
        {canWrite && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            + Generate Report
          </button>
        )}
      </div>

      {/* Generate form */}
      {showForm && (
        <div className="card p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">New VoC Report</h2>
          <form onSubmit={generateReport} className="space-y-4">
            <div>
              <label className="label">Report title</label>
              <input
                type="text"
                className="input"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Period start</label>
                <input
                  type="date"
                  className="input"
                  value={form.periodStart}
                  onChange={(e) => setForm((f) => ({ ...f, periodStart: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label">Period end</label>
                <input
                  type="date"
                  className="input"
                  value={form.periodEnd}
                  onChange={(e) => setForm((f) => ({ ...f, periodEnd: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={generating}>
                {generating ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating…
                  </span>
                ) : (
                  "Generate with AI"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {reports.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-4xl mb-3">📄</p>
          <p className="text-gray-600 font-medium">No reports yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Generate a VoC report to summarise feedback for leadership.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Link key={report.id} href={`/reports/${report.id}`} className="card p-5 block hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{report.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {new Date(report.periodStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {" — "}
                    {new Date(report.periodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Generated by {report.generatedBy.name} · {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {report.contentJson?.stats?.totalItems ?? "—"}
                  </p>
                  <p className="text-xs text-gray-400">items</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                {report.contentJson?.narrative?.slice(0, 180)}…
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
