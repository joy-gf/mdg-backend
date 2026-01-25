import crypto from "crypto";

/**
 * Utility for encrypting/decrypting sensitive data
 * Uses AES-256-GCM for secure encryption
 * Compatible with frontend crypto implementation
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

interface EncryptedPayload {
  iv: string;
  ciphertext: string;
}

/**
 * Derives encryption key from password/secret
 * Must match frontend derivation for compatibility
 */
export function deriveKey(secret: string, salt = "consultorio-app-salt"): Buffer {
  return crypto.pbkdf2Sync(secret, salt, 200_000, 32, "sha256");
}

/**
 * Encrypts text using AES-GCM
 * Returns base64-encoded IV and ciphertext
 */
export function encryptText(plaintext: string, key: Buffer): EncryptedPayload {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag();

  // Combine ciphertext + authTag for compatibility with Web Crypto API
  const ciphertextWithTag = Buffer.concat([
    Buffer.from(encrypted, "base64"),
    authTag,
  ]).toString("base64");

  return {
    iv: iv.toString("base64"),
    ciphertext: ciphertextWithTag,
  };
}

/**
 * Decrypts AES-GCM encrypted text
 * Expects base64-encoded IV and ciphertext
 */
export function decryptText(payload: EncryptedPayload, key: Buffer): string {
  const ivBuffer = Buffer.from(payload.iv, "base64");
  const encryptedData = Buffer.from(payload.ciphertext, "base64");

  // Split ciphertext and authTag (last 16 bytes)
  const ciphertext = encryptedData.subarray(0, -AUTH_TAG_LENGTH);
  const authTag = encryptedData.subarray(-AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString("utf8");
}

/**
 * Encrypts JSON object
 */
export function encryptJson(data: any, key: Buffer): EncryptedPayload {
  const jsonString = JSON.stringify(data);
  return encryptText(jsonString, key);
}

/**
 * Decrypts JSON object
 */
export function decryptJson(payload: EncryptedPayload, key: Buffer): any {
  const jsonString = decryptText(payload, key);
  return JSON.parse(jsonString);
}

/**
 * Get encryption key from environment variable
 */
export function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || "default-dev-secret-change-in-production";
  return deriveKey(secret);
}
