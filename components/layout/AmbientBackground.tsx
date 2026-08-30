export default function AmbientBackground() {
  return (
    <div className="ambient-bg pointer-events-none fixed inset-0 -z-50" aria-hidden>
      <div className="ambient-bg__grid absolute inset-0" />
      <div className="ambient-bg__glow ambient-bg__glow--a absolute" />
      <div className="ambient-bg__glow ambient-bg__glow--b absolute" />
    </div>
  );
}
