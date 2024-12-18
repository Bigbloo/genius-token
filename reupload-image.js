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
        
        // Add the file
        formData.append('file', fs.createReadStream(filePath));
        
        // Add pinata metadata
        const metadata = JSON.stringify({
            name: "GENIUS Token Logo",
            keyvalues: {
                type: "logo",
                token: "GENIUS"
            }
        });
        formData.append('pinataMetadata', metadata);

        // Add pinata options
        const options = JSON.stringify({
            cidVersion: 1,
            customPinPolicy: {
                regions: [
                    {
                        id: 'FRA1',
                        desiredReplicationCount: 2
                    },
                    {
                        id: 'NYC1',
                        desiredReplicationCount: 2
                    }
                ]
            }
        });
        formData.append('pinataOptions', options);

        const response = await axios.post(PINATA_API_URL, formData, {
            maxBodyLength: 'Infinity',
            headers: {
                'Authorization': `Bearer ${PINATA_JWT}`,
                ...formData.getHeaders()
            }
        });

        return response.data.IpfsHash;
    } catch (error) {
        console.error('Error uploading to Pinata:', error.response?.data || error.message);
        throw error;
    }
}

async function updateMetadata(ipfsHash) {
    const metadataPath = path.join(__dirname, 'assets', 'metadata.json');
    const imageUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    
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

async function verifyImage(ipfsHash) {
    const gateways = [
        'https://gateway.pinata.cloud/ipfs/',
        'https://ipfs.io/ipfs/',
        'https://cloudflare-ipfs.com/ipfs/'
    ];

    console.log('\nVerifying image accessibility...');
    
    for (const gateway of gateways) {
        const url = `${gateway}${ipfsHash}`;
        try {
            const response = await axios.head(url);
            if (response.status === 200) {
                console.log(`\n✅ Image accessible via ${gateway}`);
                console.log(`Content-Type: ${response.headers['content-type']}`);
                console.log(`Size: ${response.headers['content-length']} bytes`);
            }
        } catch (error) {
            console.log(`\n❌ Failed to access via ${gateway}: ${error.message}`);
        }
    }
}

async function reupload() {
    try {
        const imagePath = path.join(__dirname, 'assets', 'genius.png');
        
        // Verify image exists
        if (!fs.existsSync(imagePath)) {
            throw new Error('Image file not found in assets directory!');
        }

        // Get image info
        const stats = fs.statSync(imagePath);
        console.log('\nImage details:');
        console.log(`Size: ${stats.size} bytes`);
        console.log(`Last modified: ${stats.mtime}`);

        console.log('\nUploading image to IPFS via Pinata...');
        const ipfsHash = await uploadToPinata(imagePath);
        console.log('Upload successful!');
        console.log('IPFS Hash:', ipfsHash);

        // Verify the upload
        await verifyImage(ipfsHash);

        // Update metadata
        console.log('\nUpdating metadata.json...');
        await updateMetadata(ipfsHash);

        console.log('\nReupload completed successfully!');
        console.log('You can view your image at these URLs:');
        console.log(`1. https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
        console.log(`2. https://ipfs.io/ipfs/${ipfsHash}`);
        console.log(`3. https://cloudflare-ipfs.com/ipfs/${ipfsHash}`);
        
    } catch (error) {
        console.error('\nReupload failed:', error.message);
        process.exit(1);
    }
}

reupload();
