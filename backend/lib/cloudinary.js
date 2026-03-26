import { v2 as cloudinary } from "cloudinary";

const isConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

/* Lazy-configure on first use so the app boots even without creds */
let configured = false;

const ensureConfigured = () => {
  if (configured) return;
  if (!isConfigured()) return;

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  configured = true;
};

/**
 * Upload a base64 data URL to Cloudinary.
 * Returns { url, publicId } on success.
 * Falls back to returning the original base64 if Cloudinary isn't configured.
 */
export const uploadImage = async (base64DataUrl) => {
  ensureConfigured();

  if (!configured) {
    /* Graceful fallback — store base64 directly (old behaviour) */
    return { url: base64DataUrl, publicId: null };
  }

  const result = await cloudinary.uploader.upload(base64DataUrl, {
    folder: "chat-mvp/messages",
    resource_type: "image",
    quality: "auto",
    fetch_format: "auto",
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};

/**
 * Upload a base64 audio data URL to Cloudinary.
 */
export const uploadAudio = async (base64DataUrl) => {
  ensureConfigured();

  if (!configured) {
    return { url: base64DataUrl, publicId: null };
  }

  const result = await cloudinary.uploader.upload(base64DataUrl, {
    folder: "chat-mvp/audio",
    resource_type: "video", // Cloudinary treats audio as "video"
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};

export default cloudinary;
