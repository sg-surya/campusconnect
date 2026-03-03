/**
 * CampusConnect E2E Chat Encryption (AES-256-GCM)
 * 
 * Uses the Web Crypto API for client-side encryption.
 * Key is derived from the shared callId using PBKDF2.
 * Both peers derive the same key since they both know the callId.
 * Firestore only ever sees cipher-text — not even admins can read messages.
 */

const SALT = "CC_E2E_SALT_2026"; // Static salt for PBKDF2 derivation
const ITERATIONS = 100000;

/**
 * Derives an AES-256-GCM key from the shared callId.
 * Both peers call this with the same callId, so they get the same key.
 */
export async function deriveKey(callId) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(callId),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: encoder.encode(SALT),
            iterations: ITERATIONS,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

/**
 * Encrypts a plain-text message using AES-256-GCM.
 * Returns a base64 string containing the IV + ciphertext.
 */
export async function encryptMessage(plainText, key) {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM

    const cipherBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encoder.encode(plainText)
    );

    // Combine IV + ciphertext into one buffer, then base64 encode
    const combined = new Uint8Array(iv.length + new Uint8Array(cipherBuffer).length);
    combined.set(iv, 0);
    combined.set(new Uint8Array(cipherBuffer), iv.length);

    return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts a base64 cipher-text string back to plain text.
 * Extracts the IV from the first 12 bytes of the decoded data.
 */
export async function decryptMessage(cipherBase64, key) {
    try {
        const combined = Uint8Array.from(atob(cipherBase64), c => c.charCodeAt(0));
        const iv = combined.slice(0, 12);
        const ciphertext = combined.slice(12);

        const plainBuffer = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            key,
            ciphertext
        );

        return new TextDecoder().decode(plainBuffer);
    } catch (err) {
        console.warn("E2E: Decryption failed — message may be corrupted or unencrypted");
        return "[Encrypted Message]";
    }
}
