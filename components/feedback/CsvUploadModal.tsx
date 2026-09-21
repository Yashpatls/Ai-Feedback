"use client";

import { useState, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import Papa from "papaparse";

export function CsvUploadModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Record<string, string>[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<{ imported: number; failed: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError("");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setRows(results.data as Record<string, string>[]);
      },
      error: () => setError("Failed to parse CSV"),
    });
  }

  async function handleUpload() {
    if (!rows?.length) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/feedback/csv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Upload failed");
      return;
    }

    const data = await res.json();
    setResult(data);
  }

  return (
    <Modal title="Upload CSV" onClose={onClose}>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {!result ? (
        <>
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <div className="text-3xl mb-2">📂</div>
            <p className="text-sm font-medium text-gray-700">
              {fileName || "Click to select a CSV file"}
            </p>
            {rows && (
              <p className="text-sm text-indigo-600 mt-1">{rows.length} rows ready</p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Required column: <code className="bg-gray-100 px-1 rounded">content</code>
              &nbsp;— optional: channel, customer_label, created_at
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFile}
          />

          <div className="flex gap-3 mt-4">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={handleUpload}
              className="btn-primary flex-1"
              disabled={!rows?.length || loading}
            >
              {loading ? "Importing…" : `Import ${rows?.length ?? 0} rows`}
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-4">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="text-lg font-semibold text-gray-900">Import complete</h3>
          <p className="text-sm text-gray-600 mt-2">
            <span className="text-green-600 font-medium">{result.imported} imported</span>
            {result.failed > 0 && (
              <> · <span className="text-red-600 font-medium">{result.failed} failed</span></>
            )}
          </p>
          <p className="text-xs text-gray-400 mt-1">AI classification running in the background.</p>
          <button onClick={onSuccess} className="btn-primary mt-4 px-8">Done</button>
        </div>
      )}
    </Modal>
  );
}
