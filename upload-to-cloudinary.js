const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configuration
cloudinary.config({
    cloud_name: 'dqxpuaxjb',
    api_key: '271159482483276',
    api_secret: 'Ry2cXvPvAqfMYOzPNrHJEtqYyGE'
});

async function uploadToCloudinary() {
    try {
        const imagePath = path.join(__dirname, 'assets', 'genius.png');
        
        // Upload the image
        const result = await cloudinary.uploader.upload(imagePath, {
            public_id: 'genius-token-logo',
            folder: 'genius-token',
            overwrite: true,
            resource_type: 'image'
        });

        console.log('Upload successful!');
        console.log('Image URL:', result.secure_url);

        // Update metadata.json
        const metadataPath = path.join(__dirname, 'assets', 'metadata.json');
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        
        metadata.image = result.secure_url;
        metadata.properties.files[0].uri = result.secure_url;
        metadata.properties.files[0].type = 'image/png';
        
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 4));
        console.log('Metadata updated successfully!');
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

uploadToCloudinary();
