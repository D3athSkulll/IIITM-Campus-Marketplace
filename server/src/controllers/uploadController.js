/**
 * Image Upload Controller
 * Uses ImgBB free API (https://api.imgbb.com/) — free, no credit card required.
 *
 * To get a free API key:
 *   1. Go to https://api.imgbb.com/
 *   2. Sign in with email (free account)
 *   3. Copy your API key → paste into server/.env as IMGBB_API_KEY=your_key_here
 */

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * POST /api/upload
 * Body: { image: "<base64 string>", name?: "filename" }
 * Returns: { url: "https://..." }
 */
async function uploadImage(req, res) {
  const { image, name } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'No image provided' });
  }

  // Strip data URI prefix if present (e.g. "data:image/jpeg;base64,...")
  const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

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
