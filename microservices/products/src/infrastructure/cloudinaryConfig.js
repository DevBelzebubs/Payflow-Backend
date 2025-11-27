const cloudinary = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
async function uploadImage(filePath, folder, public_id = null) {
    return cloudinary.v2.uploader.upload(filePath, {
        folder: `payflow/${folder}`,
        public_id: public_id,
        resource_type: "auto"
    });
}
module.exports = { cloudinary, uploadImage };