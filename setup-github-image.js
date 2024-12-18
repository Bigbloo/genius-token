const fs = require('fs');
const path = require('path');

function setupGithubImage() {
    try {
        const metadataPath = path.join(__dirname, 'assets', 'metadata.json');
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        
        // Use raw.githubusercontent.com URL
        const imageUrl = 'https://raw.githubusercontent.com/yourusername/genius-token/main/assets/genius.png';
        
        metadata.image = imageUrl;
        metadata.properties.files[0].uri = imageUrl;
        
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 4));
        console.log('Metadata updated with GitHub URL!');
        console.log('Next steps:');
        console.log('1. Create a GitHub repository named "genius-token"');
        console.log('2. Push your code to the repository');
        console.log('3. The image will be accessible at:', imageUrl);
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

setupGithubImage();
