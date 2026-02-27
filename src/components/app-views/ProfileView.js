"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ProfileView({ user, profile }) {
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: profile?.name || "",
        bio: profile?.bio || "",
        interests: profile?.interests?.join(", ") || "",
    });

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateDoc(doc(db, "users", user.uid), {
                name: formData.name,
                bio: formData.bio,
                interests: formData.interests.split(",").map(i => i.trim()).filter(i => i),
            });
            alert("Profile updated successfully");
        } catch (err) {
            console.error(err);
        }
        setIsSaving(false);
    };

    return (
        <div style={{ padding: "60px", maxWidth: "800px", margin: "0 auto" }}>
            <h1 style={{ fontSize: "3rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-3px", marginBottom: "40px" }}>Your Profile.</h1>

            <form onSubmit={handleSave} style={{ background: "#0a0a0b", border: "1px solid #1a1a1a", padding: "40px" }}>
                <div style={{ marginBottom: "24px" }}>
                    <label style={{ display: "block", fontSize: "10px", color: "#666", textTransform: "uppercase", marginBottom: "8px" }}>Full Name</label>
                    <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: "100%", background: "#111", border: "1px solid #222", color: "#fff", padding: "12px", outline: "none" }} />
                </div>

                <div style={{ marginBottom: "24px" }}>
                    <label style={{ display: "block", fontSize: "10px", color: "#666", textTransform: "uppercase", marginBottom: "8px" }}>Bio</label>
                    <textarea value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} style={{ width: "100%", height: "100px", background: "#111", border: "1px solid #222", color: "#fff", padding: "12px", outline: "none", resize: "none" }} />
                </div>

                <div style={{ marginBottom: "40px" }}>
                    <label style={{ display: "block", fontSize: "10px", color: "#666", textTransform: "uppercase", marginBottom: "8px" }}>Interests (comma separated)</label>
                    <input value={formData.interests} onChange={e => setFormData({ ...formData, interests: e.target.value })} style={{ width: "100%", background: "#111", border: "1px solid #222", color: "#fff", padding: "12px", outline: "none" }} />
                </div>

                <button type="submit" disabled={isSaving} style={{ width: "100%", padding: "18px", background: "#fff", color: "#000", fontWeight: 900, textTransform: "uppercase", cursor: isSaving ? "not-allowed" : "pointer", border: "none" }}>
                    {isSaving ? "Saving..." : "Update Identity"}
                </button>
            </form>
        </div>
    );
}
