"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-accent/30 bg-accent/10 p-8 text-foreground"
      >
        <p className="font-display text-xl font-semibold">Thanks — got it.</p>
        <p className="mt-2 text-muted-foreground">
          I&apos;ll get back to you within a couple of days.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm text-muted-foreground">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="rounded-xl border border-muted-foreground/20 bg-muted/40 px-4 py-3 text-foreground outline-none focus:border-accent"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm text-muted-foreground">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="rounded-xl border border-muted-foreground/20 bg-muted/40 px-4 py-3 text-foreground outline-none focus:border-accent"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="message" className="text-sm text-muted-foreground">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          required
          className="rounded-xl border border-muted-foreground/20 bg-muted/40 px-4 py-3 text-foreground outline-none focus:border-accent"
        />
      </div>
      <motion.button
        type="submit"
        whileTap={{ scale: 0.97 }}
        className="mt-2 self-start rounded-full bg-accent px-6 py-3 font-medium text-accent-foreground hover:opacity-90"
      >
        Send message
      </motion.button>
    </form>
  );
}
