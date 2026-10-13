import Watu from "@/components/sections/motto/Watu";

// Marquee band. Pure CSS loop (see .motto* in globals.css). Each group repeats the
// motto twice (so one group is wider than any viewport) and the track holds two
// groups (translate -50% = seamless). Only the very first text is readable; every
// other repeat is aria-hidden. Without html.motion-ok (reduced motion / no-JS)
// only that first text shows, static and centered.
function Unit({ readable = false }: { readable?: boolean }) {
  return (
    <div className={readable ? "motto-unit" : "motto-unit motto-dup"} aria-hidden={readable ? undefined : true}>
      <p className="motto-text">
        <span className="motto-line">Build calm.</span> <span className="motto-line">Ship durable.</span>
      </p>
      <span className="motto-sep" aria-hidden>
        ✦
      </span>
    </div>
  );
}

function Group({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <div className={duplicate ? "motto-group motto-dup" : "motto-group"} aria-hidden={duplicate || undefined}>
      <Unit readable={!duplicate} />
      <Unit />
    </div>
  );
}

export default function Motto() {
  return (
    <section aria-label="Motto" className="motto">
      <Watu />
      <div className="motto-track" data-ambient>
        <Group />
        <Group duplicate />
      </div>
    </section>
  );
}
