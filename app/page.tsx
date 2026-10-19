import Hero from "@/components/Hero";
import HoverPreview from "@/components/HoverPreview";
import Skills from "@/components/Skills";
import { Certifications, Education, Experience, Footer, Projects } from "@/components/Sections";

export default function Home() {
  return (
    <>
      <Hero />
      <main className="column">
        <Education />
        <Experience />
        <Projects />
        <Skills />
        <Certifications />
      </main>
      <div className="column">
        <Footer />
      </div>
      <HoverPreview />
    </>
  );
}
