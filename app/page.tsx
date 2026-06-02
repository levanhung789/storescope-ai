import AnnouncementBar from "./_components/AnnouncementBar";
import Navbar from "./_components/Navbar";
import Hero from "./_components/Hero";
import PartnerLogos from "./_components/PartnerLogos";
import Stats from "./_components/Stats";
import FeaturesGrid from "./_components/FeaturesGrid";
import HowItWorks from "./_components/HowItWorks";
import FAQ from "./_components/FAQ";
import CtaBanner from "./_components/CtaBanner";
import Footer from "./_components/Footer";

export default function LandingPage() {
  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <main>
        <Hero />
        <PartnerLogos />
        <Stats />
        <FeaturesGrid />
        <HowItWorks />
        <FAQ />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
