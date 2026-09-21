"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface ThemeDetail {
  id: string;
  name: string;
  color: string;
  description: string | null;
  _count: { feedback: number };
  feedback: {
    feedback: {
      id: string;
      content: string;
      channel: string;
      sentiment: string | null;
      status: string;
      createdAt: string;
    };
  }[];
}

export default function ThemeDetailPage() {
  const { id } = useParams() as { id: string };
  const [theme, setTheme] = useState<ThemeDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/themes/${id}`)
      .then((r) => r.json())
      .then(setTheme)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!theme) return <div className="p-8 text-gray-500">Theme not found.</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/trends" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Themes
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-4 h-4 rounded-full"
          style={{ background: theme.color }}
        />
        <h1 className="text-2xl font-bold text-gray-900">{theme.name}</h1>
        <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
          {theme._count.feedback} mentions
        </span>
      </div>

      {theme.description && (
        <p className="text-gray-600 mb-6">{theme.description}</p>
      )}

      <div className="card divide-y divide-gray-100">
        {theme.feedback.length === 0 ? (
          <p className="p-8 text-center text-gray-400">No feedback in this theme yet.</p>
        ) : (
          theme.feedback.map(({ feedback: f }) => (
            <div key={f.id} className="p-4 hover:bg-gray-50">
              <p className="text-sm text-gray-900 leading-relaxed">{f.content}</p>
              <div className="flex gap-3 mt-2 text-xs text-gray-400">
                <span>{f.channel.replace(/_/g, " ").toLowerCase()}</span>
                {f.sentiment && (
                  <span className={
                    f.sentiment === "POSITIVE" ? "text-green-600" :
                    f.sentiment === "NEGATIVE" ? "text-red-600" : "text-gray-500"
                  }>
                    {f.sentiment.toLowerCase()}
                  </span>
                )}
                <span>{new Date(f.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
