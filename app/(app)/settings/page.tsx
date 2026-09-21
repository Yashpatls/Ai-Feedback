"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Modal } from "@/components/ui/Modal";

interface Member {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "ANALYST" | "VIEWER";
  createdAt: string;
}

const ROLE_COLORS = {
  ADMIN: "bg-red-100 text-red-700",
  ANALYST: "bg-blue-100 text-blue-700",
  VIEWER: "bg-gray-100 text-gray-600",
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
    role: "ANALYST" as "ADMIN" | "ANALYST" | "VIEWER",
    password: "",
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");

  function fetchMembers() {
    fetch("/api/workspace/members")
      .then((r) => r.json())
      .then(setMembers)
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchMembers(); }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError("");
    setInviteLoading(true);

    const res = await fetch("/api/workspace/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inviteForm),
    });

    setInviteLoading(false);

    if (!res.ok) {
      const d = await res.json();
      setInviteError(d.error || "Failed to invite member");
      return;
    }

    setShowInvite(false);
    setInviteForm({ name: "", email: "", role: "ANALYST", password: "" });
    fetchMembers();
  }

  async function changeRole(id: string, role: "ADMIN" | "ANALYST" | "VIEWER") {
    await fetch(`/api/workspace/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    fetchMembers();
  }

  async function removeMember(id: string) {
    if (!confirm("Remove this member?")) return;
    await fetch(`/api/workspace/members/${id}`, { method: "DELETE" });
    fetchMembers();
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your workspace and team members</p>
      </div>

      {/* Workspace info */}
      <div className="card p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Workspace</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">{session?.user?.workspaceName}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {members.length} member{members.length !== 1 ? "s" : ""}
            </p>
          </div>
          <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">Active</span>
        </div>
      </div>

      {/* Members */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Team Members</h2>
          {isAdmin && (
            <button onClick={() => setShowInvite(true)} className="btn-primary text-xs px-3 py-1.5">
              + Add Member
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading…</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-4 p-4">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-indigo-700">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {member.name}
                    {member.id === session?.user?.id && (
                      <span className="ml-2 text-xs text-gray-400">(you)</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </div>

                {isAdmin && member.id !== session?.user?.id ? (
                  <select
                    value={member.role}
                    onChange={(e) => changeRole(member.id, e.target.value as "ADMIN" | "ANALYST" | "VIEWER")}
                    className="input w-auto text-xs py-1"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="ANALYST">Analyst</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                ) : (
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLORS[member.role]}`}>
                    {member.role}
                  </span>
                )}

                {isAdmin && member.id !== session?.user?.id && (
                  <button
                    onClick={() => removeMember(member.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove member"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role legend */}
      <div className="card p-5 mt-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Role permissions</h3>
        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex gap-2">
            <span className={`${ROLE_COLORS.ADMIN} px-2 py-0.5 rounded-full font-medium`}>Admin</span>
            <span className="text-gray-500">— Full access: manage members, all data, delete anything</span>
          </div>
          <div className="flex gap-2">
            <span className={`${ROLE_COLORS.ANALYST} px-2 py-0.5 rounded-full font-medium`}>Analyst</span>
            <span className="text-gray-500">— Can ingest and manage feedback, generate reports, use AI</span>
          </div>
          <div className="flex gap-2">
            <span className={`${ROLE_COLORS.VIEWER} px-2 py-0.5 rounded-full font-medium`}>Viewer</span>
            <span className="text-gray-500">— Read-only access to all data and reports</span>
          </div>
        </div>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <Modal title="Add Team Member" onClose={() => setShowInvite(false)}>
          {inviteError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {inviteError}
            </div>
          )}
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="label">Name</label>
              <input type="text" className="input" value={inviteForm.name}
                onChange={(e) => setInviteForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={inviteForm.email}
                onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={inviteForm.role}
                onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value as "ADMIN" | "ANALYST" | "VIEWER" }))}>
                <option value="ADMIN">Admin</option>
                <option value="ANALYST">Analyst</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>
            <div>
              <label className="label">Temporary password</label>
              <input type="password" className="input" placeholder="8+ characters" minLength={8}
                value={inviteForm.password}
                onChange={(e) => setInviteForm((f) => ({ ...f, password: e.target.value }))} required />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowInvite(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1" disabled={inviteLoading}>
                {inviteLoading ? "Adding…" : "Add Member"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
