const fs = require('fs');
const path = require('path');

function setupSvgImage() {
    try {
        const svg = `data:image/svg+xml;base64,${Buffer.from(`
            <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#4A90E2;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#9B51E0;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <circle cx="256" cy="256" r="240" fill="url(#grad)"/>
                <text x="256" y="320" 
                      font-family="Arial, sans-serif" 
                      font-size="240" 
                      font-weight="bold" 
                      text-anchor="middle" 
                      fill="white">G</text>
            </svg>
        `).toString('base64')}`;

        const metadataPath = path.join(__dirname, 'assets', 'metadata.json');
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        
        metadata.image = svg;
        metadata.properties.files[0] = {
            uri: svg,
            type: "image/svg+xml"
        };
        
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 4));
        console.log('Metadata updated with inline SVG image!');
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

setupSvgImage();
