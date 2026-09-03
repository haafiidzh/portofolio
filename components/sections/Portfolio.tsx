import PortfolioGrid from "./portfolio/PortfolioGrid";
import type { PortfolioProject } from "./portfolio/PortfolioCard";
import SectionHeader from "@/components/ui/SectionHeader";

const PROJECTS: PortfolioProject[] = [
  {
    slug: "notion-property-automation",
    title: "Chat Based Notion Property Automation",
    year: "2026",
    category: "Automation Workflow",
    stack: ["NextJS","N8N", "Notion API Integration"],
    impact: "Automated property data updates and reduced manual effort.",
    problem:
      "Manual property data updates were time-consuming and prone to errors.",
    solution:
      "An automation designed to monitor Notion tickets. This workflow is triggered by a webhook integrated with a Notion API token, executing a pre-configured flow to update property data as needed.",
    result: "Property data is updated automatically, reducing manual effort and improving efficiency.",
    images: [
      "/images/Image Porto - 4.jpeg", 
      "/images/Image Porto - 1.jpeg", 
      "/images/Image Porto - 2.jpeg",
      "/images/Image Porto - 3.jpeg", 
    ],
  },
  {
    slug: "invoice-automation",
    title: "Invoice Automation",
    year: "2026",
    category: "Health platform",
    stack: ["N8N", "Telegram API Integration", "Spreadsheet API Integration"],
    impact: "Automated invoice data recording and reduced manual effort.",
    problem:
      "Manual invoice data recording was time-consuming and prone to errors.",
    solution:
      "An automation system designed to record invoice data from photo inputs. The workflow integrates with Telegram, which serves as the channel for submitting invoices. It utilizes a free AI model from Gemini (Gemini-Flash-3) for analysis, and the recorded data is subsequently saved to a spreadsheet.",
    result: "Invoice data is recorded automatically, reducing manual effort and improving efficiency. Free AI model from Gemini (Gemini-Flash-3) for analysis.",
    images: ["/images/Image Porto - Invoice.jpeg"],
  },
  {
    slug: "rag-chatbot",
    title: "RAG Chatbot",
    year: "2026",
    category: "Chatbot",
    stack: ["Next.js", "FastAPI", "LLM", "Vector DB", "RAG"],
    impact: "Chat with a podcast/lecture library, every answer comes with a clickable timestamp you can jump straight to.",
    problem:
      "Student researching neural networks. Needs specific explanation from 100+ hours of lectures. Manual searching takes hours.",
    solution:
      "Type question. System finds matching segments across library. Tap timestamp, video plays from exact moment.",
    result: "Find answer in 2 minutes instead of 2 hours. No scrubbing through videos.",
    images: [
      "/images/web-portfolio-mockup_11.png",
      "/images/web-portfolio-mockup_10.png",
    ],
  },
];

export default function Portfolio() {
  return (
    <section id="projects" className="px-6 py-28 md:px-10 md:py-40">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          index="03"
          eyebrow="Projects"
          title="Selected work."
          lede="Open any case study for the full problem → solution → result breakdown."
        />
        <PortfolioGrid projects={PROJECTS} />
      </div>
    </section>
  );
}
