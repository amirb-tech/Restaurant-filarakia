"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";

interface Message {
  id: string;
  direction: string;
  channel: string;
  body: string;
  createdAt: string;
}

export function ConversationThread({ leadId, initialMessages }: { leadId: string; initialMessages: Message[] }) {
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function send() {
    if (!draft.trim()) return;
    const body = draft;
    setDraft("");
    await fetch(`/api/leads/${leadId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-900">Conversation</h2>
      </div>
      <div className="flex max-h-[520px] min-h-[300px] flex-col gap-3 overflow-y-auto p-5">
        {initialMessages.length === 0 && <p className="text-sm text-slate-400">No messages yet.</p>}
        {initialMessages.map((m) => (
          <div key={m.id} className={clsx("flex", m.direction === "OUTBOUND" ? "justify-end" : "justify-start")}>
            <div
              className={clsx(
                "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                m.direction === "OUTBOUND" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-800"
              )}
            >
              {m.body}
              <div className={clsx("mt-1 text-[10px]", m.direction === "OUTBOUND" ? "text-blue-100" : "text-slate-400")}>
                {new Date(m.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                {" · "}
                {m.channel}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-t border-slate-200 p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Send a text..."
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <button
          onClick={send}
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
