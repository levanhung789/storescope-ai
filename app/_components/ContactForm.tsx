"use client";

import { useState } from "react";
import { useInView } from "../_hooks/useInView";

interface Fields {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
  message?: string;
}

type Status = "idle" | "submitting" | "success" | "error";

const inputStyle = (hasError: boolean): React.CSSProperties => ({
  width: "100%",
  background: "#111",
  border: `1px solid ${hasError ? "#ef4444" : "#2a2a2a"}`,
  borderRadius: 8,
  padding: "12px 16px",
  fontSize: 14,
  color: "#f0f0f0",
  outline: "none",
  transition: "border-color 0.2s",
  boxSizing: "border-box",
});

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 500,
  color: "#888",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  marginBottom: 8,
};

const errorStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#ef4444",
  marginTop: 6,
};

export default function ContactForm() {
  const { ref, inView } = useInView({ threshold: 0.1 });
  const [fields, setFields] = useState<Fields>({ name: "", email: "", phone: "", message: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState("");

  function update(field: keyof Fields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFields((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field as keyof FieldErrors]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };
  }

  function validate(): boolean {
    const e: FieldErrors = {};
    if (!fields.name.trim()) e.name = "Vui lòng nhập họ và tên.";
    if (!fields.email.trim()) {
      e.email = "Vui lòng nhập địa chỉ email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      e.email = "Địa chỉ email không hợp lệ.";
    }
    if (!fields.message.trim()) e.message = "Vui lòng nhập nội dung tin nhắn.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setStatus("submitting");
    setServerError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (res.ok && data.success) {
        setStatus("success");
      } else {
        setServerError(data.error ?? "Đã xảy ra lỗi. Vui lòng thử lại.");
        setStatus("error");
      }
    } catch {
      setServerError("Không thể kết nối. Vui lòng thử lại sau.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        style={{
          background: "#111",
          border: "1px solid #2a2a2a",
          borderRadius: 16,
          padding: "56px 40px",
          textAlign: "center",
          maxWidth: 560,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "rgba(124,58,237,0.15)",
            border: "1px solid rgba(124,58,237,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 style={{ fontSize: 22, fontWeight: 600, color: "#f0f0f0", marginBottom: 12, letterSpacing: "-0.02em" }}>
          Gửi thành công!
        </h3>
        <p style={{ fontSize: 14, color: "#888", lineHeight: 1.7, marginBottom: 32 }}>
          Chúng tôi đã nhận được tin nhắn của bạn và sẽ phản hồi trong vòng 1–2 ngày làm việc.
        </p>
        <a
          href="/"
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            background: "#7c3aed",
            padding: "10px 24px",
            borderRadius: 999,
            textDecoration: "none",
            display: "inline-block",
            transition: "background 0.25s, transform 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#6d28d9";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#7c3aed";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Quay về trang chủ
        </a>
      </div>
    );
  }

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
        maxWidth: 640,
        margin: "0 auto",
      }}
    >
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }} className="contact-grid">
          {/* Họ và tên */}
          <div>
            <label style={labelStyle}>Họ và tên *</label>
            <input
              type="text"
              value={fields.name}
              onChange={update("name")}
              placeholder="Nguyễn Văn A"
              style={inputStyle(!!errors.name)}
              onFocus={(e) => { e.currentTarget.style.borderColor = errors.name ? "#ef4444" : "#7c3aed"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = errors.name ? "#ef4444" : "#2a2a2a"; }}
            />
            {errors.name && <p style={errorStyle}>{errors.name}</p>}
          </div>

          {/* Số điện thoại */}
          <div>
            <label style={labelStyle}>Số điện thoại</label>
            <input
              type="tel"
              value={fields.phone}
              onChange={update("phone")}
              placeholder="0901 234 567"
              style={inputStyle(false)}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#7c3aed"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#2a2a2a"; }}
            />
          </div>
        </div>

        {/* Email */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Địa chỉ email *</label>
          <input
            type="email"
            value={fields.email}
            onChange={update("email")}
            placeholder="ban@congty.com"
            style={inputStyle(!!errors.email)}
            onFocus={(e) => { e.currentTarget.style.borderColor = errors.email ? "#ef4444" : "#7c3aed"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = errors.email ? "#ef4444" : "#2a2a2a"; }}
          />
          {errors.email && <p style={errorStyle}>{errors.email}</p>}
        </div>

        {/* Nội dung */}
        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>Nội dung tin nhắn *</label>
          <textarea
            value={fields.message}
            onChange={update("message")}
            placeholder="Mô tả nhu cầu của bạn..."
            rows={5}
            style={{
              ...inputStyle(!!errors.message),
              resize: "vertical",
              minHeight: 120,
              fontFamily: "inherit",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = errors.message ? "#ef4444" : "#7c3aed"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = errors.message ? "#ef4444" : "#2a2a2a"; }}
          />
          {errors.message && <p style={errorStyle}>{errors.message}</p>}
        </div>

        {serverError && (
          <p style={{ ...errorStyle, marginBottom: 16, fontSize: 13 }}>{serverError}</p>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 999,
            border: "none",
            background: status === "submitting" ? "#4c1d95" : "#7c3aed",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: status === "submitting" ? "not-allowed" : "pointer",
            transition: "background 0.25s, transform 0.2s, box-shadow 0.25s",
            letterSpacing: "0.01em",
          }}
          onMouseEnter={(e) => {
            if (status !== "submitting") {
              e.currentTarget.style.background = "#6d28d9";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(124,58,237,0.35)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = status === "submitting" ? "#4c1d95" : "#7c3aed";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {status === "submitting" ? "Đang gửi..." : "Gửi tin nhắn"}
        </button>
      </form>

      <style>{`
        @media (max-width: 560px) {
          .contact-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
