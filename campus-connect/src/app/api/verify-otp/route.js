import { db } from "@/lib/firebase";
import { doc, getDoc, deleteDoc } from "firebase/firestore";

export async function POST(request) {
    try {
        const { email, otp } = await request.json();

        if (!email || !otp) {
            return Response.json(
                { error: "Email and OTP are required" },
                { status: 400 }
            );
        }

        const docRef = doc(db, "otps", email);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return Response.json(
                { error: "No OTP found for this email. Please request a new one." },
                { status: 400 }
            );
        }

        const stored = docSnap.data();

        if (Date.now() > stored.expiresAt) {
            await deleteDoc(docRef);
            return Response.json(
                { error: "OTP has expired. Please request a new one." },
                { status: 400 }
            );
        }

        if (stored.code !== otp) {
            return Response.json({ error: "Invalid OTP. Try again." }, { status: 400 });
        }

        // OTP is valid — clean up
        await deleteDoc(docRef);

        return Response.json({ success: true, message: "Email verified successfully" });
    } catch (error) {
        console.error("OTP Verify Error:", error);
        return Response.json(
            { error: "Verification failed" },
            { status: 500 }
        );
    }
}
