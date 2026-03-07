/**
 * Cloudinary config — Shining Stars
 * Cloud: dg9m3ktno
 */

export const CLOUDINARY_CLOUD = "dg9m3ktno";
export const CLOUDINARY_PRESET = "shining-stars"; // Upload preset name

/**
 * Google Drive URL → Cloudinary optimized URL ပြောင်းပေးသည်
 * Sheet ထဲမှာ Drive link ရှိနေသေးရင် auto-convert လုပ်ပေးသည်
 */
export function getPhotoUrl(url, size = 200) {
  if (!url || typeof url !== "string") return null;

  // Already a Cloudinary URL
  if (url.includes("cloudinary.com")) {
    return url.replace(/\/upload\//, `/upload/f_auto,q_auto,w_${size},h_${size},c_fill/`);
  }

  // Local /public path (e.g. /students/aung.jpg)
  if (url.startsWith("/")) return url;

  // Google Drive → thumbnail fallback (slower but works)
  if (url.includes("drive.google.com")) {
    let fileId = "";
    if (url.includes("/d/")) fileId = url.split("/d/")[1]?.split("/")[0];
    else if (url.includes("id=")) fileId = url.split("id=")[1]?.split("&")[0];
    if (fileId) return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
  }

  return url;
}

/**
 * File တစ်ခုကို Cloudinary သို့ upload လုပ်သည်
 * @param {File} file — input[type=file] မှ ရသော File object
 * @param {string} folder — "students" | "staff"
 * @returns {Promise<string>} — Cloudinary secure_url
 */
export async function uploadToCloudinary(file, folder = "students") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_PRESET);
  formData.append("folder", `shining-stars/${folder}`);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.secure_url;
}
