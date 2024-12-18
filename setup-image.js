const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
require('dotenv').config();

const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';

async function uploadToPinata(filePath) {
    try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath));

        const response = await axios.post(PINATA_API_URL, formData, {
            maxBodyLength: 'Infinity',
            headers: {
                'Authorization': `Bearer ${PINATA_JWT}`,
                ...formData.getHeaders()
            }
        });

        return response.data.IpfsHash;
    } catch (error) {
        console.error('Error uploading to Pinata:', error.message);
        throw error;
    }
}

async function updateMetadata(ipfsHash) {
    const metadataPath = path.join(__dirname, 'assets', 'metadata.json');
    const imageUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
    
    try {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        metadata.image = imageUrl;
        metadata.properties.files[0].uri = imageUrl;
        
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 4));
        console.log('Metadata updated successfully!');
    } catch (error) {
        console.error('Error updating metadata:', error.message);
        throw error;
    }
}

async function setup() {
    try {
        // Verify image exists
        const imagePath = path.join(__dirname, 'assets', 'genius.png');
        if (!fs.existsSync(imagePath)) {
            throw new Error('Image file not found! Please ensure genius.png exists in the assets folder.');
        }

        console.log('Uploading image to IPFS via Pinata...');
        const ipfsHash = await uploadToPinata(imagePath);
        console.log('Image uploaded successfully!');
        console.log('IPFS Hash:', ipfsHash);
        console.log('IPFS URL:', `https://ipfs.io/ipfs/${ipfsHash}`);

        console.log('\nUpdating metadata.json...');
        await updateMetadata(ipfsHash);

        console.log('\nSetup completed successfully!');
        console.log('You can verify the image at:', `https://ipfs.io/ipfs/${ipfsHash}`);
    } catch (error) {
        console.error('\nSetup failed:', error.message);
        process.exit(1);
    }
}

setup();
