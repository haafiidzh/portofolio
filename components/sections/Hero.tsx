import HeroBackground from "./hero/HeroBackground";
import HeroCopy from "./hero/HeroCopy";
import HeroPortrait from "./hero/HeroPortrait";

export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden px-6 md:px-16">
      <div className="pointer-events-none absolute inset-0">
        <HeroBackground />
      </div>
      <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 md:grid-cols-[1.2fr_1fr]">
        <HeroCopy />
        <HeroPortrait />
      </div>
    </section>
  );
}
