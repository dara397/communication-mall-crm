"use client";

import { useState } from "react";

export default function EmailTest({ defaultTo }: { defaultTo?: string }) {
  const [to, setTo] = useState(defaultTo || "");
  const [status, setStatus] = useState<null | "sending" | "ok" | "error">(null);
  const [message, setMessage] = useState("");

  async function send() {
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/diagnostics/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Failed to send.");
        return;
      }
      setStatus("ok");
      setMessage(`Test email sent to ${to} (id: ${data.id}).`);
    } catch (e) {
      setStatus("error");
      setMessage((e as Error).message);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="label">Send a test email to</label>
          <input
            type="email"
            className="input w-72"
            value={to}
            placeholder="you@example.com"
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <button
          className="btn-primary"
          onClick={send}
          disabled={status === "sending" || !to}
        >
          {status === "sending" ? "Sending…" : "Send test"}
        </button>
      </div>
      {message && (
        <p className={`text-sm ${status === "error" ? "text-red-600" : "text-green-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
