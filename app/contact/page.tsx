import type { Metadata } from "next";
import Navbar from "../_components/Navbar";
import Footer from "../_components/Footer";
import ContactForm from "../_components/ContactForm";

export const metadata: Metadata = {
  title: "Liên hệ — StoreScope AI",
  description: "Liên hệ với đội ngũ StoreScope AI để tìm hiểu thêm về giải pháp phân tích kệ hàng bán lẻ FMCG.",
};

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main style={{ background: "#000", minHeight: "100vh", paddingTop: 56 }}>
        <section style={{ maxWidth: 1152, margin: "0 auto", padding: "96px 24px 128px" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#7c3aed",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                marginBottom: 20,
              }}
            >
              Liên hệ
            </p>
            <h1
              style={{
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 700,
                color: "#f0f0f0",
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
                marginBottom: 20,
              }}
            >
              Kết nối với chúng tôi
            </h1>
            <p
              style={{
                fontSize: 15,
                color: "#888",
                lineHeight: 1.7,
                maxWidth: 480,
                margin: "0 auto",
              }}
            >
              Đội ngũ StoreScope AI sẵn sàng hỗ trợ bạn triển khai giải pháp phân tích kệ hàng cho doanh nghiệp FMCG.
            </p>
          </div>

          {/* Form */}
          <ContactForm />

          {/* Footer note */}
          <p
            style={{
              textAlign: "center",
              fontSize: 13,
              color: "#555",
              marginTop: 40,
            }}
          >
            Hoặc email trực tiếp:{" "}
            <a
              href="mailto:hello@storescope.ai"
              style={{ color: "#7c3aed", textDecoration: "none" }}
            >
              hello@storescope.ai
            </a>
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
