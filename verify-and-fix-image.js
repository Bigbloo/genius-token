const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function verifyAndFixImage() {
    const imagePath = path.join(__dirname, 'assets', 'genius.png');
    
    try {
        // Read the current image metadata
        console.log('Analyzing current image...');
        const metadata = await sharp(imagePath).metadata();
        console.log('Current image details:', metadata);
        
        // Check if the image is valid
        if (metadata.width === 0 || metadata.height === 0) {
            throw new Error('Invalid image dimensions');
        }
        
        // Create a new optimized version
        console.log('\nCreating optimized version...');
        await sharp({
            create: {
                width: 512,
                height: 512,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 0 }
            }
        })
        .composite([
            {
                input: Buffer.from(`
                    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color:#4A90E2;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#9B51E0;stop-opacity:1" />
                            </linearGradient>
                        </defs>
                        <circle cx="256" cy="256" r="240" fill="url(#grad)"/>
                        <text x="256" y="300" font-family="Arial" font-size="160" font-weight="bold" 
                              text-anchor="middle" fill="white">G</text>
                    </svg>`
                ),
                top: 0,
                left: 0
            }
        ])
        .png()
        .toFile(path.join(__dirname, 'assets', 'genius_new.png'));
        
        // Backup old image
        if (fs.existsSync(imagePath)) {
            fs.renameSync(imagePath, path.join(__dirname, 'assets', 'genius_backup.png'));
        }
        
        // Move new image to original location
        fs.renameSync(
            path.join(__dirname, 'assets', 'genius_new.png'),
            imagePath
        );
        
        console.log('\nNew image created successfully!');
        console.log('Original image backed up as genius_backup.png');
        console.log('Location:', imagePath);
        
        // Verify the new image
        const newMetadata = await sharp(imagePath).metadata();
        console.log('\nNew image details:', newMetadata);
        
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

verifyAndFixImage();
