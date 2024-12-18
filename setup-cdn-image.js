const fs = require('fs');
const path = require('path');

function setupCdnImage() {
    try {
        // Use GitHub raw content URL with statically.io CDN
        const imageUrl = 'https://raw.githubusercontent.com/athomeproject/genius-token/main/assets/genius.png';
        const cdnUrl = `https://cdn.statically.io/gh/athomeproject/genius-token/main/assets/genius.png`;
        
        const metadataPath = path.join(__dirname, 'assets', 'metadata.json');
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        
        metadata.image = cdnUrl;
        metadata.properties.files[0].uri = cdnUrl;
        metadata.properties.files[0].type = 'image/png';
        
        // Add fallback URLs
        metadata.properties.files.push({
            uri: imageUrl,
            type: 'image/png',
            cdn: false
        });
        
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 4));
        console.log('Metadata updated with CDN URLs!');
        console.log('\nImage URLs:');
        console.log('Primary (CDN):', cdnUrl);
        console.log('Fallback:', imageUrl);
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

setupCdnImage();
