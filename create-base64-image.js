const fs = require('fs');
const path = require('path');

function updateMetadataWithBase64() {
    try {
        const imagePath = path.join(__dirname, 'assets', 'genius.png');
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;
        
        const metadataPath = path.join(__dirname, 'assets', 'metadata.json');
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        
        metadata.image = base64Image;
        metadata.properties.files[0].uri = base64Image;
        
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 4));
        console.log('Metadata updated with base64 image successfully!');
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

updateMetadataWithBase64();
