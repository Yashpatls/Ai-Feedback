"use client";

import { useState, useEffect, useCallback } from "react";
import { AddFeedbackModal } from "@/components/feedback/AddFeedbackModal";
import { CsvUploadModal } from "@/components/feedback/CsvUploadModal";
import { ChannelImportModal } from "@/components/feedback/ChannelImportModal";

type Sentiment = "POSITIVE" | "NEUTRAL" | "NEGATIVE";
type FeedbackStatus = "NEW" | "REVIEWED" | "ACTIONED";

interface FeedbackItem {
  id: string;
  content: string;
  channel: string;
  sentiment: Sentiment | null;
  sentimentScore: number | null;
  status: FeedbackStatus;
  featureArea: string | null;
  customerLabel: string | null;
  createdAt: string;
  themes: { theme: { id: string; name: string; color: string } }[];
}

interface PaginatedResponse {
  items: FeedbackItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

const CHANNEL_OPTIONS = [
  { value: "", label: "All Channels" },
  { value: "SUPPORT_TICKET", label: "Support Ticket" },
  { value: "APP_STORE_REVIEW", label: "App Store Review" },
  { value: "NPS_SURVEY", label: "NPS Survey" },
  { value: "SALES_CALL_NOTE", label: "Sales Call Note" },
  { value: "SOCIAL_MENTION", label: "Social Mention" },
  { value: "COMMUNITY_POST", label: "Community Post" },
  { value: "MANUAL", label: "Manual Entry" },
];

const SENTIMENT_OPTIONS = [
  { value: "", label: "All Sentiments" },
  { value: "POSITIVE", label: "Positive" },
  { value: "NEUTRAL", label: "Neutral" },
  { value: "NEGATIVE", label: "Negative" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "NEW", label: "New" },
  { value: "REVIEWED", label: "Reviewed" },
  { value: "ACTIONED", label: "Actioned" },
];

export function InboxClient({
  user,
}: {
  user: { role: string; workspaceId: string };
}) {
  const canWrite = ["ADMIN", "ANALYST"].includes(user.role);

  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [channel, setChannel] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [status, setStatus] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [showCsv, setShowCsv] = useState(false);
  const [showChannel, setShowChannel] = useState(false);

  const fetchFeedback = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (channel) params.set("channel", channel);
    if (sentiment) params.set("sentiment", sentiment);
    if (status) params.set("status", status);

    fetch(`/api/feedback?${params}`, { cache: "no-store" })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [page, search, channel, sentiment, status]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  function applySearch() {
    setSearch(searchInput);
    setPage(1);
  }

  async function updateStatus(id: string, newStatus: FeedbackStatus) {
    await fetch(`/api/feedback/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchFeedback();
  }

  async function reclassify(id: string) {
    await fetch(`/api/feedback/${id}/classify`, { method: "POST" });
    setTimeout(fetchFeedback, 1500);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {data?.pagination.total ?? "—"} total feedback items
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {user.role === "ADMIN" && (
            <button 
              onClick={() => {
                const params = new URLSearchParams();
                if (search) params.set("search", search);
                if (channel) params.set("channel", channel);
                if (sentiment) params.set("sentiment", sentiment);
                if (status) params.set("status", status);
                window.location.href = `/api/feedback/export?${params.toString()}`;
              }}
              className="btn-secondary text-xs px-3 py-2 bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
            >
              📥 Export CSV
            </button>
          )}
          <button onClick={() => setShowChannel(true)} className="btn-secondary text-xs px-3 py-2">
            📡 Import Channel
          </button>
          <button onClick={() => setShowCsv(true)} className="btn-secondary text-xs px-3 py-2">
            📂 Upload CSV
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary text-xs px-3 py-2">
            + Add Feedback
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex gap-2 flex-1 min-w-56">
            <input
              className="input flex-1"
              placeholder="Search feedback…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applySearch()}
            />
            <button onClick={applySearch} className="btn-secondary px-3">
              🔍
            </button>
          </div>
          <select className="input w-auto" value={channel} onChange={(e) => { setChannel(e.target.value); setPage(1); }}>
            {CHANNEL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select className="input w-auto" value={sentiment} onChange={(e) => { setSentiment(e.target.value); setPage(1); }}>
            {SENTIMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select className="input w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {(search || channel || sentiment || status) && (
            <button
              className="btn-secondary text-xs px-3"
              onClick={() => { setSearch(""); setSearchInput(""); setChannel(""); setSentiment(""); setStatus(""); setPage(1); }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading…</div>
        ) : !data?.items.length ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-base">No feedback found</p>
            <p className="text-gray-300 text-sm mt-1">
              {canWrite ? "Add some feedback to get started." : "No feedback matches your filters."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.items.map((item) => (
              <FeedbackRow
                key={item.id}
                item={item}
                canWrite={canWrite}
                onStatusChange={updateStatus}
                onReclassify={reclassify}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <p>
            Page {data.pagination.page} of {data.pagination.pages} ({data.pagination.total} items)
          </p>
          <div className="flex gap-2">
            <button
              className="btn-secondary px-3 py-1.5 text-xs"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Prev
            </button>
            <button
              className="btn-secondary px-3 py-1.5 text-xs"
              disabled={page >= data.pagination.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAdd && (
        <AddFeedbackModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); fetchFeedback(); }}
        />
      )}
      {showCsv && (
        <CsvUploadModal
          onClose={() => setShowCsv(false)}
          onSuccess={() => { setShowCsv(false); fetchFeedback(); }}
        />
      )}
      {showChannel && (
        <ChannelImportModal
          onClose={() => setShowChannel(false)}
          onSuccess={() => { setShowChannel(false); fetchFeedback(); }}
        />
      )}
    </div>
  );
}

function FeedbackRow({
  item,
  canWrite,
  onStatusChange,
  onReclassify,
}: {
  item: FeedbackItem;
  canWrite: boolean;
  onStatusChange: (id: string, status: FeedbackStatus) => void;
  onReclassify: (id: string) => void;
}) {
  const statusCycle: Record<FeedbackStatus, FeedbackStatus> = {
    NEW: "REVIEWED",
    REVIEWED: "ACTIONED",
    ACTIONED: "NEW",
  };

  const sentimentBadge = {
    POSITIVE: "badge-positive",
    NEUTRAL: "badge-neutral",
    NEGATIVE: "badge-negative",
  };

  const statusBadge: Record<FeedbackStatus, string> = {
    NEW: "badge-new",
    REVIEWED: "badge-reviewed",
    ACTIONED: "badge-actioned",
  };

  const channelLabel = item.channel.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 leading-relaxed line-clamp-2">{item.content}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-xs text-gray-400">{channelLabel}</span>
            {item.customerLabel && (
              <span className="text-xs text-gray-400">· {item.customerLabel}</span>
            )}
            {item.featureArea && (
              <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                {item.featureArea}
              </span>
            )}
            {item.themes.map((ft) => (
              <span
                key={ft.theme.id}
                className="text-xs px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: ft.theme.color }}
              >
                {ft.theme.name}
              </span>
            ))}
            {!item.sentiment && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                Classifying…
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(item.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {item.sentiment && (
            <span className={sentimentBadge[item.sentiment]}>
              {item.sentiment === "POSITIVE" ? "😊" : item.sentiment === "NEGATIVE" ? "😞" : "😐"}{" "}
              {item.sentiment.charAt(0) + item.sentiment.slice(1).toLowerCase()}
            </span>
          )}

          {canWrite && (
            <>
              <button
                className={statusBadge[item.status]}
                onClick={() => onStatusChange(item.id, statusCycle[item.status])}
                title="Click to advance status"
              >
                {item.status}
              </button>
              <button
                onClick={() => onReclassify(item.id)}
                className="text-xs text-gray-400 hover:text-indigo-600 transition-colors"
                title="Re-classify with AI"
              >
                🤖
              </button>
            </>
          )}
          {!canWrite && (
            <span className={statusBadge[item.status]}>{item.status}</span>
          )}
        </div>
      </div>
    </div>
  );
}
