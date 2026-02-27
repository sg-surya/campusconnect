import nodemailer from "nodemailer";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP in Firestore
    await setDoc(doc(db, "otps", email), {
      code: otp,
      expiresAt: expiresAt
    });

    // Configure transporter for Zoho
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.zoho.in",
      port: parseInt(process.env.EMAIL_PORT || "465"),
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send email
    await transporter.sendMail({
      from: `"CampusConnect" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔐 Your CampusConnect Verification Code",
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0a; color: #e0e0e0; padding: 40px; border: 1px solid #242424;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; font-weight: 900; font-size: 24px; letter-spacing: -2px; border: 2px solid #e0e0e0; padding: 5px 8px; transform: rotate(-5deg);">CC</div>
          </div>
          <h2 style="text-align: center; font-size: 22px; font-weight: 700; text-transform: uppercase; letter-spacing: -1px; margin-bottom: 8px;">Verification Code</h2>
          <p style="text-align: center; color: #888; font-size: 13px; margin-bottom: 30px;">Enter this code to verify your email</p>
          <div style="text-align: center; background: #111; border: 1px solid #333; padding: 20px; margin-bottom: 30px;">
            <span style="font-family: monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #8b5cf6;">${otp}</span>
          </div>
          <p style="text-align: center; color: #555; font-size: 11px;">This code expires in 10 minutes.<br/>If you didn't request this, ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #242424; margin: 25px 0;" />
          <p style="text-align: center; color: #333; font-size: 10px; font-family: monospace;">CampusConnect v1.0 · Secure · Verified</p>
        </div>
      `,
    });

    return Response.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("OTP Send Error:", error);
    return Response.json(
      { error: "Failed to send OTP. Check email configuration." },
      { status: 500 }
    );
  }
}
