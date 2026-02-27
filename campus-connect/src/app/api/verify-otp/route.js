// Shared OTP store with send-otp route
const otpStore = globalThis.__otpStore || (globalThis.__otpStore = {});

export async function POST(request) {
    try {
        const { email, otp } = await request.json();

        if (!email || !otp) {
            return Response.json(
                { error: "Email and OTP are required" },
                { status: 400 }
            );
        }

        const stored = otpStore[email];

        if (!stored) {
            return Response.json(
                { error: "No OTP found for this email. Please request a new one." },
                { status: 400 }
            );
        }

        if (Date.now() > stored.expiresAt) {
            delete otpStore[email];
            return Response.json(
                { error: "OTP has expired. Please request a new one." },
                { status: 400 }
            );
        }

        if (stored.code !== otp) {
            return Response.json({ error: "Invalid OTP. Try again." }, { status: 400 });
        }

        // OTP is valid — clean up
        delete otpStore[email];

        return Response.json({ success: true, message: "Email verified successfully" });
    } catch (error) {
        console.error("OTP Verify Error:", error);
        return Response.json(
            { error: "Verification failed" },
            { status: 500 }
        );
    }
}
