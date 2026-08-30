export default function HeroFallback() {
  return (
    <div
      className="hero-fallback-blob absolute inset-0 -z-10"
      style={{
        background:
          "radial-gradient(closest-side, color-mix(in srgb, var(--accent) 55%, transparent), transparent 70%)",
        filter: "blur(40px)",
      }}
      aria-hidden
    />
  );
}
