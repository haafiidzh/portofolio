/**
 * Placeholder portrait: a framed abstract illustration in the accent hue.
 * Swap the <svg> for <Image src="/portrait.jpg" .../> once a real photo exists —
 * keep the wrapper so the frame and aspect ratio stay consistent.
 */
export default function AboutPortrait() {
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-[var(--hairline)] bg-[var(--surface)]">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 30% 10%, color-mix(in srgb, var(--accent) 55%, transparent), transparent 65%)",
        }}
      />
      <svg
        viewBox="0 0 320 400"
        className="absolute inset-0 h-full w-full"
        aria-label="Portrait illustration"
        role="img"
      >
        {Array.from({ length: 14 }).map((_, i) => (
          <circle
            key={i}
            cx="160"
            cy="215"
            r={40 + i * 11}
            fill="none"
            stroke="var(--accent-bright)"
            strokeOpacity={0.06 + (14 - i) * 0.015}
            strokeWidth="1"
          />
        ))}
        <circle
          cx="160"
          cy="150"
          r="46"
          fill="none"
          stroke="var(--foreground)"
          strokeOpacity="0.65"
          strokeWidth="2"
        />
        <path
          d="M92 300 C92 248 122 218 160 218 C198 218 228 248 228 300"
          fill="none"
          stroke="var(--foreground)"
          strokeOpacity="0.65"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-[var(--hairline)] bg-background/60 px-5 py-4 backdrop-blur-md">
        <span className="text-sm font-medium text-foreground">Hafidz</span>
        <span className="text-xs text-muted-foreground">Semarang, ID</span>
      </div>
    </div>
  );
}
