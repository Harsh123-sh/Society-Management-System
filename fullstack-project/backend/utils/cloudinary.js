const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadVisitorPhoto(base64Image) {
  try {
    // Convert base64 to data URI format if it's not already
    const dataURI = base64Image.startsWith("data:") 
      ? base64Image 
      : `data:image/jpeg;base64,${base64Image}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "visitor_photos",
      resource_type: "auto",
      quality: "auto",
      fetch_format: "auto",
    });

    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload visitor photo");
  }
}

module.exports = { uploadVisitorPhoto };
