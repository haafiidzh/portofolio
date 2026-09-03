import Reveal from "@/components/ui/Reveal";
import SectionHeader from "@/components/ui/SectionHeader";
import AboutPortrait from "./about/AboutPortrait";

const FACTS = [
  ["Expertise", "AI Powered SaaS, RAG systems, LLMs, chatbots, automations, web scraping."],
  ["Built with", "Laravel, Node.js, Python, React, Next.js, TypeScript, N8N."],
  ["Currently", "Freelancing, building AI solutions and automations."],
];

export default function About() {
  return (
    <section id="about" className="px-6 py-28 md:px-10 md:py-40">
      <div className="mx-auto max-w-7xl">
        <SectionHeader index="01" eyebrow="About" title="Fullstack AI Developer building RAG, chatbots, and automations." />

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <Reveal>
            <div data-reveal>
              <AboutPortrait />
            </div>
          </Reveal>

          <Reveal staggerMs={110}>
            <p data-reveal className="lede text-foreground">
              Hey! 👋 I'm a fullstack AI dev who loves shipping end-to-end solutions : smart chatbots, RAG systems, web scrapers, and automations that handle the boring stuff so you don't have to.
              <br />
              <br />
              Clean code, practical vibes, no fluff. Whether it's training LLMs, integrating APIs, or building something that actually works in production, I'm all in. Got a project or a wild AI idea? Let's cook something cool.
            </p>
            {/* <p data-reveal className="lede text-foreground">
              I&apos;ve spent the last eight years on the same problem from
              different angles: how do small teams ship serious software without
              burning out or accumulating debt they can&apos;t pay back?
            </p>
            <p data-reveal className="lede mt-6">
              I work as a fractional CTO and hands-on full-stack engineer. That
              means I own the technical strategy — architecture, hiring,
              roadmap, risk — and I stay close enough to the code to write the
              hard parts myself. No slide decks handed off to someone else to
              implement.
            </p>
            <p data-reveal className="lede mt-6">
              Typescript end-to-end, boring infrastructure, and interfaces that
              feel considered. Everything I build is meant to be handed over and
              maintained by someone who isn&apos;t me.
            </p> */}

            <dl data-reveal className="mt-12 flex flex-col">
              {FACTS.map(([label, value]) => (
                <div
                  key={label}
                  className="hairline-t grid grid-cols-1 gap-1 py-5 sm:grid-cols-[160px_1fr] sm:gap-6"
                >
                  <dt className="eyebrow">{label}</dt>
                  <dd className="text-sm leading-relaxed text-foreground">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
