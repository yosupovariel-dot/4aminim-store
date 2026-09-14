"use client";

import { useState } from "react";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — the value is already shown as plain
      // text nearby, so there's nothing further to do.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-300 hover:bg-amber-100"
    >
      {copied ? "הועתק ✓" : label}
    </button>
  );
}
