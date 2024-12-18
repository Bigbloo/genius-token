const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createSimpleLogo() {
    try {
        // Create a simple SVG
        const svg = `
            <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#4A90E2;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#9B51E0;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <circle cx="256" cy="256" r="240" fill="url(#grad)"/>
                <text x="256" y="300" 
                      font-family="Arial" 
                      font-size="200" 
                      font-weight="bold" 
                      text-anchor="middle" 
                      fill="white">G</text>
            </svg>
        `;

        // Convert SVG to PNG
        await sharp(Buffer.from(svg))
            .resize(512, 512)
            .png()
            .toFile(path.join(__dirname, 'assets', 'genius_simple.png'));

        // Backup old image if it exists
        const originalPath = path.join(__dirname, 'assets', 'genius.png');
        if (fs.existsSync(originalPath)) {
            fs.renameSync(originalPath, path.join(__dirname, 'assets', 'genius_original.png'));
        }

        // Move new image to be the main logo
        fs.renameSync(
            path.join(__dirname, 'assets', 'genius_simple.png'),
            originalPath
        );

        console.log('Simple logo created successfully!');
        console.log('Original logo backed up as genius_original.png');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

createSimpleLogo();
