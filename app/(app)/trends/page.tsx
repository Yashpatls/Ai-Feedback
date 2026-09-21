"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ThemeTrend {
  id: string;
  name: string;
  color: string;
  description: string | null;
  totalCount: number;
  thisWeekCount: number;
  prevWeekCount: number;
  spikePercent: number;
  isSpiking: boolean;
}

export default function TrendsPage() {
  const [themes, setThemes] = useState<ThemeTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/themes?trends=true")
      .then((r) => r.json())
      .then(setThemes)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Theme Trends</h1>
        <p className="text-gray-500 mt-1">
          See which topics are growing and what needs attention
        </p>
      </div>

      {themes.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-gray-600 font-medium">No themes yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Themes appear after feedback is classified by AI.
          </p>
          <Link href="/inbox" className="btn-primary mt-4 inline-flex">
            Go to Inbox
          </Link>
        </div>
      ) : (
        <>
          {/* Spiking alert */}
          {themes.some((t) => t.isSpiking) && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-amber-900">Spiking themes detected</p>
                <p className="text-sm text-amber-700 mt-0.5">
                  {themes.filter((t) => t.isSpiking).map((t) => t.name).join(", ")} —
                  significantly more mentions this week vs last week.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {themes.map((theme) => (
              <Link
                key={theme.id}
                href={`/trends/${theme.id}`}
                className="card p-5 hover:shadow-md transition-shadow block"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ background: theme.color }}
                    />
                    <h3 className="text-sm font-semibold text-gray-900">
                      {theme.name}
                    </h3>
                  </div>
                  {theme.isSpiking && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      ↑ Spiking
                    </span>
                  )}
                </div>

                {theme.description && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                    {theme.description}
                  </p>
                )}

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {theme.totalCount}
                    </p>
                    <p className="text-xs text-gray-400">total mentions</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">
                      {theme.thisWeekCount}{" "}
                      <span className="text-xs text-gray-400">this week</span>
                    </p>
                    {theme.spikePercent !== 0 && (
                      <p
                        className={`text-xs font-medium ${
                          theme.spikePercent > 0
                            ? "text-red-500"
                            : "text-green-500"
                        }`}
                      >
                        {theme.spikePercent > 0 ? "↑" : "↓"}{" "}
                        {Math.abs(theme.spikePercent)}% vs last week
                      </p>
                    )}
                  </div>
                </div>

                {/* Mini bar */}
                <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (theme.thisWeekCount / Math.max(theme.totalCount, 1)) * 100 * 3)}%`,
                      background: theme.color,
                    }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
