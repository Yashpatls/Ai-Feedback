"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";

const CHANNELS = [
  { value: "APP_STORE_REVIEW", label: "App Store Reviews", icon: "📱" },
  { value: "SUPPORT_TICKET", label: "Support Tickets", icon: "🎫" },
  { value: "NPS_SURVEY", label: "NPS Survey Responses", icon: "📊" },
  { value: "SALES_CALL_NOTE", label: "Sales Call Notes", icon: "📞" },
  { value: "COMMUNITY_POST", label: "Community Posts", icon: "💬" },
  { value: "SOCIAL_MENTION", label: "Social Mentions", icon: "🐦" },
];

export function ChannelImportModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [channel, setChannel] = useState("APP_STORE_REVIEW");
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; channel: string } | null>(null);

  async function handleImport() {
    setLoading(true);

    const res = await fetch("/api/feedback/channel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, count }),
    });

    setLoading(false);

    if (res.ok) {
      setResult(await res.json());
    }
  }

  const selected = CHANNELS.find((c) => c.value === channel);

  return (
    <Modal title="Import from Channel" onClose={onClose}>
      <p className="text-sm text-gray-600 mb-4">
        Simulate pulling feedback from a connected channel. This seeds realistic sample data.
      </p>

      {!result ? (
        <>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {CHANNELS.map((c) => (
              <button
                key={c.value}
                onClick={() => setChannel(c.value)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  channel === c.value
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="text-lg">{c.icon}</span>
                <p className="text-xs font-medium text-gray-700 mt-1">{c.label}</p>
              </button>
            ))}
          </div>

          <div className="mb-4">
            <label className="label">Number of items to import</label>
            <input
              type="range"
              min={3}
              max={15}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>3</span>
              <span className="font-medium text-indigo-600">{count} items</span>
              <span>15</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleImport} className="btn-primary flex-1" disabled={loading}>
              {loading ? "Importing…" : `Import ${count} items`}
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-4">
          <div className="text-4xl mb-3">{selected?.icon}</div>
          <h3 className="text-lg font-semibold text-gray-900">
            {result.imported} items imported
          </h3>
          <p className="text-sm text-gray-500 mt-1">from {selected?.label}</p>
          <p className="text-xs text-gray-400 mt-2">AI classification running in background.</p>
          <button onClick={onSuccess} className="btn-primary mt-4 px-8">Done</button>
        </div>
      )}
    </Modal>
  );
}
