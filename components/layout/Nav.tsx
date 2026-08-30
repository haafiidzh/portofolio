"use client";

import { useEffect, useState } from "react";

const LINKS = [
  { href: "#about", label: "About" },
  { href: "#services", label: "Services" },
  { href: "#projects", label: "Projects" },
  { href: "#skills", label: "Skills" },
  { href: "#contact", label: "Contact" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScrollEvent = () => setScrolled(window.scrollY > 24);
    onScrollEvent();
    window.addEventListener("scroll", onScrollEvent, { passive: true });
    return () => window.removeEventListener("scroll", onScrollEvent);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        scrolled
          ? "border-b border-[var(--hairline)] bg-background/70 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
      style={{ height: "var(--nav-h)" }}
    >
      <nav className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 md:px-10">
        <a
          href="#hero"
          className="text-sm tracking-tight text-foreground"
        >
          <span className="font-semibold">Hafidz</span>
          <span className="text-accent-bright">.</span>
        </a>

        <ul className="hidden items-center gap-9 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#contact"
          className="hidden rounded-full border border-[var(--hairline)] px-5 py-2 text-sm font-medium text-foreground transition-colors duration-300 hover:border-accent-bright/50 hover:bg-accent/25 md:inline-block"
        >
          Let&apos;s talk
        </a>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
        >
          <span
            className={`h-px w-5 bg-foreground transition-transform duration-300 ${
              open ? "translate-y-[3px] rotate-45" : ""
            }`}
          />
          <span
            className={`h-px w-5 bg-foreground transition-transform duration-300 ${
              open ? "-translate-y-[3px] -rotate-45" : ""
            }`}
          />
        </button>
      </nav>

      {open && (
        <div className="border-t border-[var(--hairline)] bg-background/95 backdrop-blur-xl md:hidden">
          <ul className="flex flex-col px-6 py-4">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 text-base text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
