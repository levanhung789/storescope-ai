import Navbar from "./_components/Navbar";
import Hero from "./_components/Hero";
import Stats from "./_components/Stats";
import HowItWorks from "./_components/HowItWorks";
import Services from "./_components/Services";
import UseCases from "./_components/UseCases";
import Pricing from "./_components/Pricing";
import CtaBanner from "./_components/CtaBanner";
import Footer from "./_components/Footer";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <HowItWorks />
        <Services />
        <UseCases />
        <Pricing />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
