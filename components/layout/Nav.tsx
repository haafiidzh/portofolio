"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { CTA_PILL_CLASS } from "@/components/ui/ctaPill";

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
  // Visual-only wayfinding (PRD 07 §13.1 Q8): no aria-current, no DOM added.
  const [activeHref, setActiveHref] = useState<string | null>(null);

  useEffect(() => {
    const targets = LINKS.map((l) => document.querySelector(l.href)).filter(
      (el): el is Element => el !== null
    );
    if (!("IntersectionObserver" in window) || targets.length === 0) return;
    // Root shrunk to a 1px band at 40% of the viewport height: a section is
    // active while it covers that line. Hero/Experience/Footer match no link.
    const io = new IntersectionObserver(
      (entries) => {
        setActiveHref((current) => {
          let next = current;
          for (const e of entries) {
            if (!e.isIntersecting && next === `#${e.target.id}`) next = null;
          }
          for (const e of entries) {
            if (e.isIntersecting) next = `#${e.target.id}`;
          }
          return next;
        });
      },
      { rootMargin: "-40% 0px -60% 0px" }
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

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
          className="flex items-center gap-2.5 text-sm tracking-tight text-foreground"
        >
          <Image
            src="/images/logo-mark.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-full border border-[var(--hairline)] object-cover"
          />
          <span>
            <span className="font-semibold">Hafidz</span>
            <span className="text-accent-bright">.</span>
          </span>
        </a>

        <ul className="hidden items-center gap-9 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className={`nav-link relative text-sm transition-colors duration-300 hover:text-foreground motion-reduce:transition-none ${
                  activeHref === link.href
                    ? "nav-link--active text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#contact"
          className={`hidden ${CTA_PILL_CLASS} md:inline-block`}
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
                  className={`block py-3 text-base transition-colors hover:text-foreground motion-reduce:transition-none ${
                    activeHref === link.href
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
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
