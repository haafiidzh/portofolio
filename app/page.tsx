import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Services from "@/components/sections/Services";
import Portfolio from "@/components/sections/Portfolio";
import Experience from "@/components/sections/Experience";
import Skills from "@/components/sections/Skills";
import Contact from "@/components/sections/Contact";

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <About />
      <Services />
      <Portfolio />
      <Experience />
      <Skills />
      <Contact />
    </main>
  );
}
