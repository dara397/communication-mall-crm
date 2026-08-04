"use client";

import { useState } from "react";

export default function EmailButton({
  type,
  id,
  defaultEmail,
}: {
  type: "quote" | "invoice";
  id: string;
  defaultEmail?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(defaultEmail || "");
  const [status, setStatus] = useState<null | "sending" | "ok" | "error">(null);
  const [message, setMessage] = useState("");

  async function send() {
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id, to: email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Failed to send.");
        return;
      }
      setStatus("ok");
      setMessage(`Sent to ${email}`);
    } catch (e) {
      setStatus("error");
      setMessage((e as Error).message);
    }
  }

  if (!open) {
    return (
      <button className="btn-secondary" onClick={() => setOpen(true)}>
        Email {type}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2">
        <input
          type="email"
          className="input h-9 w-56 py-1"
          value={email}
          placeholder="recipient@example.com"
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          className="btn-primary h-9 py-1"
          onClick={send}
          disabled={status === "sending" || !email}
        >
          {status === "sending" ? "Sending…" : "Send"}
        </button>
        <button className="btn-ghost h-9 py-1" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
      {message && (
        <p className={`text-xs ${status === "error" ? "text-red-600" : "text-green-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
