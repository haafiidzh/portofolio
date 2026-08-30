const LINKS = [
  { label: "Email", value: "wishuwerecoder@gmail.com", href: "mailto:wishuwerecoder@gmail.com" },
  { label: "LinkedIn", value: "/in/yourname", href: "https://linkedin.com" },
  { label: "GitHub", value: "@haafiidzh", href: "https://github.com" },
  { label: "Threads", value: "@yourname", href: "https://threads.net" },
];

export default function ContactInfo() {
  return (
    <div className="flex flex-col">
      <p data-reveal className="text-sm leading-relaxed text-muted-foreground">
        Prefer a faster path? Reach out directly — anything from a one-line
        question to a full brief is fine.
      </p>

      <ul data-reveal className="mt-8 flex flex-col">
        {LINKS.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="hairline-t group flex items-center justify-between gap-4 py-4 transition-colors duration-300 hover:text-accent-bright"
            >
              <span className="eyebrow">{link.label}</span>
              <span className="flex items-center gap-2 text-sm text-foreground transition-colors duration-300 group-hover:text-accent-bright">
                {link.value}
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  ↗
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      <p data-reveal className="hairline-t mt-8 pt-6 text-xs text-muted-foreground">
        Based in Jakarta, Indonesia · GMT+7
      </p>
    </div>
  );
}
