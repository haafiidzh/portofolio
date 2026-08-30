import ContactForm from "./contact/ContactForm";
import ContactInfo from "./contact/ContactInfo";
import Reveal from "@/components/ui/Reveal";
import SectionHeader from "@/components/ui/SectionHeader";

export default function Contact() {
  return (
    <section id="contact" className="px-6 py-28 md:px-10 md:py-40">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          index="06"
          eyebrow="Contact"
          title="Tell me what you're building."
          lede="A short note is enough. I reply within a day or two with next steps or an honest no."
        />

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-24">
          <Reveal staggerMs={90}>
            <ContactForm />
          </Reveal>
          <Reveal staggerMs={90} delay={120}>
            <ContactInfo />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
