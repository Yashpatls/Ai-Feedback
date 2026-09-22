"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

interface DashboardData {
  stats: {
    total: number;
    thisWeek: number;
    negativePercent: number;
    positivePercent: number;
  };
  volumeData: { date: string; count: number; positive: number; negative: number; neutral: number }[];
  sentimentData: { name: string; value: number; color: string }[];
  topThemes: { name: string; count: number; color: string }[];
}

export function DashboardClient({ user }: { user: { name?: string | null; workspaceName: string } }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/summary?days=${days}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) {
          const text = await r.text();
          throw new Error(`API error ${r.status}: ${text}`);
        }
        return r.json();
      })
      .then(setData)
      .catch((err) => {
        console.error("Dashboard fetch error:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 h-72 bg-gray-200 rounded-xl" />
            <div className="h-72 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          <h2 className="font-bold mb-2">Failed to load dashboard data</h2>
          <pre className="text-xs overflow-auto">{error}</pre>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome back, {user.name?.split(" ")[0]}
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="input w-auto"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Feedback"
          value={data.stats.total.toLocaleString()}
          sub="all time"
          icon="📥"
          color="indigo"
        />
        <StatCard
          label="This Week"
          value={`+${data.stats.thisWeek}`}
          sub="new items"
          icon="📈"
          color="blue"
        />
        <StatCard
          label="Negative"
          value={`${data.stats.negativePercent}%`}
          sub="of recent feedback"
          icon="⚠️"
          color={data.stats.negativePercent > 30 ? "red" : "green"}
        />
        <StatCard
          label="Positive"
          value={`${data.stats.positivePercent}%`}
          sub="of recent feedback"
          icon="✅"
          color="green"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Volume over time */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Feedback Volume
          </h2>
          {data.volumeData.length === 0 ? (
            <EmptyState message="No feedback yet. Add some from the Inbox." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data.volumeData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={Math.floor(data.volumeData.length / 6)} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fill="url(#colorCount)" name="Total" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Sentiment pie */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Sentiment Breakdown
          </h2>
          {data.sentimentData.length === 0 ? (
            <EmptyState message="No classified feedback yet." />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={data.sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.sentimentData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [v, ""]} contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {data.sentimentData.map((s) => (
                  <div key={s.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                    {s.name} ({s.value})
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top themes */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Top Themes
        </h2>
        {data.topThemes.length === 0 ? (
          <EmptyState message="Themes will appear after feedback is classified." />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.topThemes} layout="vertical" margin={{ left: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={110} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Mentions">
                {data.topThemes.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  icon: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <span className={`text-lg w-8 h-8 rounded-lg flex items-center justify-center ${colors[color] ?? colors.indigo}`}>
          {icon}
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-40 flex items-center justify-center">
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}
