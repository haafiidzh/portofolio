"use client";

import { useState, type FormEvent } from "react";

const FIELD_CLASS =
  "w-full rounded-xl border border-[var(--hairline)] bg-[var(--surface)]/70 px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors duration-300 focus:border-accent-bright/60";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "Something went wrong.");
      }
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setSending(false);
    }
  }

  if (submitted) {
    return (
      <div
        data-reveal
        className="rounded-2xl border border-accent-bright/30 bg-accent/20 p-8"
      >
        <p className="display-md text-foreground">Got it.</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Thanks for reaching out — I&apos;ll come back to you within a couple
          of days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div data-reveal className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="eyebrow">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Your name"
            className={FIELD_CLASS}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="eyebrow">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@company.com"
            className={FIELD_CLASS}
          />
        </div>
      </div>

      <div data-reveal className="flex flex-col gap-2">
        <label htmlFor="message" className="eyebrow">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          placeholder="What are you building, and where are you stuck?"
          className={FIELD_CLASS}
        />
      </div>

      {/* Honeypot — hidden from users and assistive tech, bots fill it. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        data-reveal
        type="submit"
        disabled={sending}
        className="mt-2 self-start rounded-full bg-accent px-7 py-3.5 text-sm font-medium text-accent-foreground transition-colors duration-300 hover:bg-accent-mid active:scale-[0.98] disabled:opacity-60"
      >
        {sending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
