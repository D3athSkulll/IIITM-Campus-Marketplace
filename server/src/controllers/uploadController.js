/**
 * Image Upload Controller
 * Uses ImgBB free API (https://api.imgbb.com/) — free, no credit card required.
 *
 * To get a free API key:
 *   1. Go to https://api.imgbb.com/
 *   2. Sign in with email (free account)
 *   3. Copy your API key and set IMGBB_API_KEY in server/.env
 */

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_UPLOADS_PER_WINDOW = Number(process.env.MAX_UPLOADS_PER_HOUR || 30);
const uploadRateMap = new Map();

function isValidBase64(value) {
  return /^[A-Za-z0-9+/=]+$/.test(value);
}

function checkAndTrackUploadRate(key) {
  const now = Date.now();
  const bucket = uploadRateMap.get(key);

  if (!bucket || now - bucket.windowStart >= RATE_LIMIT_WINDOW_MS) {
    uploadRateMap.set(key, { windowStart: now, count: 1 });
    return { blocked: false, remaining: MAX_UPLOADS_PER_WINDOW - 1 };
  }

  if (bucket.count >= MAX_UPLOADS_PER_WINDOW) {
    const retryAfterSeconds = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - bucket.windowStart)) / 1000);
    return { blocked: true, retryAfterSeconds };
  }

  bucket.count += 1;
  uploadRateMap.set(key, bucket);
  return { blocked: false, remaining: MAX_UPLOADS_PER_WINDOW - bucket.count };
}

/**
 * POST /api/upload
 * Body: { image: "<base64 string>", name?: "filename" }
 * Returns: { url: "https://..." }
 */
async function uploadImage(req, res) {
  const { image, name } = req.body;

  if (!image || typeof image !== 'string') {
    return res.status(400).json({ error: 'No image provided' });
  }

  const rateKey = req.user?._id?.toString() || req.ip || 'anonymous';
  const rateStatus = checkAndTrackUploadRate(rateKey);
  if (rateStatus.blocked) {
    return res.status(429).json({
      error: `Upload limit reached. Try again in ${rateStatus.retryAfterSeconds} seconds.`,
    });
  }

  // Strip data URI prefix if present (e.g. "data:image/jpeg;base64,...")
  const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

  if (!base64Data || !isValidBase64(base64Data)) {
    return res.status(400).json({ error: 'Invalid image payload.' });
  }

  // Validate size (base64 is ~1.37x the original, so check raw byte estimate)
  const estimatedBytes = Math.ceil((base64Data.length * 3) / 4);
  if (estimatedBytes > MAX_SIZE_BYTES) {
    return res.status(413).json({
      error: `Image too large. Maximum size is 2 MB. Your image is ~${(estimatedBytes / 1024 / 1024).toFixed(1)} MB.`,
    });
  }

  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'Image upload service not configured. Add IMGBB_API_KEY to server/.env (free at https://api.imgbb.com/)',
    });
  }

  try {
    const params = new URLSearchParams();
    params.append('key', apiKey);
    params.append('image', base64Data);
    if (name) params.append('name', name.slice(0, 50));

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: params,
    });

    const result = await response.json();

    if (!result.success) {
      console.error('ImgBB error:', result);
      return res.status(502).json({ error: 'Image host returned an error. Please try again.' });
    }

    return res.json({
      url: result.data.url,
      deleteUrl: result.data.delete_url,
    });
  } catch (err) {
    console.error('Upload error:', err.message);
    return res.status(500).json({ error: 'Failed to upload image. Check your internet connection.' });
  }
}

module.exports = { uploadImage };
