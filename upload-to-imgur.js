const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const IMGUR_CLIENT_ID = '3e7a4deb7ac6dc4'; // Public client ID for demo purposes

async function uploadToImgur() {
    try {
        const imagePath = path.join(__dirname, 'assets', 'genius.png');
        const imageData = fs.readFileSync(imagePath);
        const base64Image = imageData.toString('base64');

        const response = await axios.post('https://api.imgur.com/3/image', {
            image: base64Image,
            type: 'base64',
            name: 'genius.png',
            title: 'GENIUS Token Logo'
        }, {
            headers: {
                'Authorization': `Client-ID ${IMGUR_CLIENT_ID}`
            }
        });

        const imageUrl = response.data.data.link;
        console.log('Image uploaded successfully!');
        console.log('URL:', imageUrl);

        // Update metadata.json with new URL
        const metadataPath = path.join(__dirname, 'assets', 'metadata.json');
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        metadata.image = imageUrl;
        metadata.properties.files[0].uri = imageUrl;
        
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 4));
        console.log('Metadata updated successfully!');

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

uploadToImgur();
