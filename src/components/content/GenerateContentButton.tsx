"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GenerateContentButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function generate() {
    setLoading(true);
    await fetch("/api/content/generate", { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={generate}
      disabled={loading}
      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? "Generating..." : "Generate this week's ideas"}
    </button>
  );
}
