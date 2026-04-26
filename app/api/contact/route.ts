import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, phone, message } = body as {
    name: string;
    email: string;
    phone?: string;
    message: string;
  };

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json(
      { error: "Vui lòng điền đầy đủ thông tin bắt buộc." },
      { status: 400 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email không hợp lệ." }, { status: 400 });
  }

  // Placeholder — extend with Resend/Nodemailer for actual email delivery
  console.log("[Contact Form]", {
    name,
    email,
    phone,
    message,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({ success: true });
}
