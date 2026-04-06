/**
 * Upload an image file to the server (which forwards to ImgBB free hosting).
 * - Validates file type (JPEG/PNG/GIF/WebP)
 * - Validates file size (max 2 MB)
 * - Converts to base64 and POSTs to /api/upload
 * - Returns the hosted image URL
 *
 * ImgBB setup: Get a free API key at https://api.imgbb.com/
 * and add IMGBB_API_KEY=... to server/.env
 */

import { api } from "./api";

const MAX_SIZE_MB = 2;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new UploadError("Failed to read file"));
  });
}

export async function uploadImage(file: File, token: string | null): Promise<string> {
  // Validate type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new UploadError("Only JPEG, PNG, GIF, and WebP images are supported.");
  }

  // Validate size
  if (file.size > MAX_SIZE_BYTES) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    throw new UploadError(
      `Image is too large (${sizeMB} MB). Maximum size is ${MAX_SIZE_MB} MB.`
    );
  }

  // Convert to base64
  const base64 = await fileToBase64(file);

  // Upload via server
  const result = await api<{ url: string }>("/upload", {
    method: "POST",
    body: { image: base64, name: file.name },
    token,
  });

  return result.url;
}
