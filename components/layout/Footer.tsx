const COLUMNS = [
  {
    title: "Navigate",
    links: [
      { label: "About", href: "#about" },
      { label: "Services", href: "#services" },
      { label: "Projects", href: "#projects" },
      { label: "Skills", href: "#skills" },
    ],
  },
  {
    title: "Elsewhere",
    links: [
      { label: "GitHub", href: "https://github.com/haafiidzh" },
      { label: "LinkedIn", href: "https://linkedin.com" },
      // { label: "Threads", href: "https://threads.net" },
      { label: "Email", href: "mailto:kusumahaafiidzh@gmail.com" },
    ],
  },
  {
    title: "Availability",
    links: [
      { label: "AI Full-Stack Engineer retainer", href: "#contact" },
      { label: "Project-based build", href: "#contact" },
      { label: "Architecture audit", href: "#contact" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="hairline-t px-6 py-16 md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <p className="text-lg font-semibold tracking-tight">
              Hafidz<span className="text-accent-bright">.</span>
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              AI full-stack engineer. Building calm, durable
              software from Semarang.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="eyebrow">{column.title}</p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors duration-300 hover:text-accent-bright"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="hairline-t mt-14 flex flex-col gap-2 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Hafidz. All rights reserved.</p>
          {/* <p>Built with Next.js, Tailwind, and anime.js.</p> */}
        </div>
      </div>
    </footer>
  );
}
