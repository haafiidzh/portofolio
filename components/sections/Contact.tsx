import ContactForm from "./contact/ContactForm";
import ContactInfo from "./contact/ContactInfo";

export default function Contact() {
  return (
    <section id="contact" className="px-6 py-24 md:px-16 md:py-32">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-16 lg:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-3xl font-semibold text-foreground md:text-5xl">
              Let&apos;s work together
            </h2>
            <p className="max-w-xl text-muted-foreground">
              Tell me a bit about what you&apos;re building — I&apos;ll follow
              up with next steps.
            </p>
          </div>
          <ContactForm />
        </div>
        <ContactInfo />
      </div>
    </section>
  );
}
