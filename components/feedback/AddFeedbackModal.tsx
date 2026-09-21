"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";

const CHANNELS = [
  { value: "MANUAL", label: "Manual Entry" },
  { value: "SUPPORT_TICKET", label: "Support Ticket" },
  { value: "APP_STORE_REVIEW", label: "App Store Review" },
  { value: "NPS_SURVEY", label: "NPS Survey" },
  { value: "SALES_CALL_NOTE", label: "Sales Call Note" },
  { value: "SOCIAL_MENTION", label: "Social Mention" },
  { value: "COMMUNITY_POST", label: "Community Post" },
];

export function AddFeedbackModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [content, setContent] = useState("");
  const [channel, setChannel] = useState("MANUAL");
  const [customerLabel, setCustomerLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setError("");
    setLoading(true);

    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, channel, customerLabel }),
    });

    setLoading(false);

    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Failed to add feedback");
      return;
    }

    onSuccess();
  }

  return (
    <Modal title="Add Feedback" onClose={onClose}>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Feedback content *</label>
          <textarea
            className="input h-32 resize-none"
            placeholder="Enter the customer feedback text…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Channel *</label>
          <select
            className="input"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
          >
            {CHANNELS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Customer label (optional)</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Enterprise, Free tier, Power user"
            value={customerLabel}
            onChange={(e) => setCustomerLabel(e.target.value)}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1" disabled={loading || !content.trim()}>
            {loading ? "Adding…" : "Add Feedback"}
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center">
          AI will auto-classify this item after saving.
        </p>
      </form>
    </Modal>
  );
}
