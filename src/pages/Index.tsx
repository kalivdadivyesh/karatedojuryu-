import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import PortfolioSection from "@/components/PortfolioSection";
import AboutSection from "@/components/AboutSection";
import KatanaSection from "@/components/KatanaSection";
import Footer from "@/components/Footer";
import HeroCanvas from "@/components/HeroCanvas";
import SlashOverlay from "@/components/SlashOverlay";

export default function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Fixed 3D canvas behind everything */}
      <div className="fixed inset-0 z-0">
        <HeroCanvas />
      </div>
      {/* Slash overlay */}
      <SlashOverlay />
      <div className="relative z-10">
        <Navbar />
        <HeroSection />
        <ServicesSection />
        <PortfolioSection />
        <AboutSection />
        <KatanaSection />
        <Footer />
      </div>
    </div>
  );
}
