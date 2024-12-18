require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function uploadToIPFS() {
    try {
        const JWT = process.env.PINATA_JWT;
        if (!JWT) {
            throw new Error('PINATA_JWT not found in environment variables');
        }

        const formData = new FormData();
        
        const file = fs.readFileSync(path.join(__dirname, 'assets', 'genius.png'));
        formData.append('file', file, 'genius.png');

        const metadata = JSON.stringify({
            name: 'GENIUS Token Image',
            keyvalues: {
                description: 'Image for GENIUS token on Solana'
            }
        });
        formData.append('pinataMetadata', metadata);

        console.log('Uploading image to IPFS...');
        const response = await axios.post(
            "https://api.pinata.cloud/pinning/pinFileToIPFS",
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${JWT}`,
                    ...formData.getHeaders()
                }
            }
        );

        console.log('Image uploaded successfully to IPFS!');
        console.log('IPFS Hash:', response.data.IpfsHash);
        console.log('Pinata Gateway URL:', `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`);
        console.log('IPFS Gateway URL:', `https://ipfs.io/ipfs/${response.data.IpfsHash}`);
        
        // Save the IPFS hash and URLs for later use
        const ipfsData = {
            hash: response.data.IpfsHash,
            pinataUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`,
            ipfsUrl: `https://ipfs.io/ipfs/${response.data.IpfsHash}`
        };
        
        fs.writeFileSync('ipfs-hash.json', JSON.stringify(ipfsData, null, 2));
        console.log('\nIPFS data saved to ipfs-hash.json');

        return response.data.IpfsHash;
    } catch (error) {
        console.error('Error uploading to IPFS:', error.response ? error.response.data : error.message);
        throw error;
    }
}

uploadToIPFS().catch(console.error);
