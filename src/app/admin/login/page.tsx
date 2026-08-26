"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/actions/auth";

const initialState: LoginState = {};

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-14">
      <div className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-extrabold text-emerald-950">
          כניסת מנהל
        </h1>
        <form action={formAction} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-emerald-900">
              סיסמה
            </span>
            <input
              name="password"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              className="w-full rounded-xl border border-emerald-200 px-4 py-2"
            />
          </label>

          {state.error && (
            <p className="text-sm font-medium text-red-600">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-emerald-600 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {pending ? "מתחבר..." : "כניסה"}
          </button>
        </form>
      </div>
    </div>
  );
}
