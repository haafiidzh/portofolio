const LINKS = [
  { label: "Email", value: "hello@yourdomain.com", href: "mailto:hello@yourdomain.com" },
  { label: "LinkedIn", value: "linkedin.com/in/yourname", href: "https://linkedin.com" },
  { label: "Threads", value: "@yourname", href: "https://threads.net" },
];

export default function ContactInfo() {
  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-sm text-muted-foreground">
        Prefer a quicker path? Reach out directly — I usually reply within a
        day or two.
      </p>
      <ul className="flex flex-col gap-3">
        {LINKS.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="group flex items-baseline gap-2 text-foreground"
            >
              <span className="text-sm text-muted-foreground">
                {link.label}
              </span>
              <span className="border-b border-transparent group-hover:border-accent group-hover:text-accent">
                {link.value}
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">Based in Jakarta, Indonesia</p>
    </div>
  );
}
