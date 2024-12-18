const https = require('https');
const fs = require('fs');
const path = require('path');

const imageUrl = 'https://raw.githubusercontent.com/yourusername/genius-token/main/assets/genius.png';
const imagePath = path.join(__dirname, 'assets', 'genius.png');

// Ensure the assets directory exists
if (!fs.existsSync(path.join(__dirname, 'assets'))) {
    fs.mkdirSync(path.join(__dirname, 'assets'));
}

// Download and save the image
https.get(imageUrl, (response) => {
    if (response.statusCode === 200) {
        const file = fs.createWriteStream(imagePath);
        response.pipe(file);
        
        file.on('finish', () => {
            file.close();
            console.log('Image downloaded and saved successfully!');
        });
    } else {
        console.error('Failed to download image:', response.statusCode);
    }
}).on('error', (err) => {
    console.error('Error downloading image:', err.message);
});
