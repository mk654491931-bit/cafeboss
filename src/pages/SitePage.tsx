import Header from "../components/site/Header";
import Hero from "../components/site/Hero";
import About from "../components/site/About";
import MenuSection from "../components/site/MenuSection";
import Gallery from "../components/site/Gallery";
import OkeySalonu from "../components/site/OkeySalonu";
import ContactFooter from "../components/site/ContactFooter";

export default function SitePage() {
  return (
    <div className="min-h-screen bg-cream-100">
      <Header />
      <main>
        <Hero />
        <About />
        <MenuSection />
        <Gallery />
        <OkeySalonu />
      </main>
      <ContactFooter />
    </div>
  );
}
