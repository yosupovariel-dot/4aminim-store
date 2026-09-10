"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="text-4xl mb-3" aria-hidden>
        ⚠️
      </div>
      <h1 className="mb-2 text-xl font-bold text-emerald-950">משהו השתבש</h1>
      <p className="mb-6 text-emerald-700">{error.message || "אירעה שגיאה בלתי צפויה."}</p>
      <button
        onClick={reset}
        className="rounded-full bg-emerald-600 px-5 py-2 font-semibold text-white hover:bg-emerald-700"
      >
        ניסיון חוזר
      </button>
    </div>
  );
}
