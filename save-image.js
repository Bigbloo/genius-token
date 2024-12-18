const fs = require('fs');
const path = require('path');

// Base64 encoded image data (remplacez ceci par les données de votre image)
const imageData = `
[Votre image en base64]
`;

const imagePath = path.join(__dirname, 'assets', 'genius.png');

// Decode and save the image
const imageBuffer = Buffer.from(imageData, 'base64');
fs.writeFileSync(imagePath, imageBuffer);

console.log('Image saved successfully to:', imagePath);
