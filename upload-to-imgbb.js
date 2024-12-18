const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const IMGBB_API_KEY = '26207aa2eb6ce8664eef4c8fcd2c58c4';  // Free API key for testing

async function uploadToImgBB() {
    try {
        const imagePath = path.join(__dirname, 'assets', 'genius.png');
        const imageData = fs.readFileSync(imagePath);
        const base64Image = imageData.toString('base64');

        const formData = new FormData();
        formData.append('key', IMGBB_API_KEY);
        formData.append('image', base64Image);

        const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
            headers: formData.getHeaders()
        });

        if (response.data.success) {
            console.log('Upload successful!');
            console.log('Image URL:', response.data.data.url);
            
            // Update metadata.json
            const metadataPath = path.join(__dirname, 'assets', 'metadata.json');
            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            
            metadata.image = response.data.data.url;
            metadata.properties.files[0].uri = response.data.data.url;
            metadata.properties.files[0].type = 'image/png';
            
            fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 4));
            console.log('Metadata updated successfully!');
        } else {
            throw new Error('Upload failed');
        }
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

uploadToImgBB();
