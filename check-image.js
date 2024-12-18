const axios = require('axios');
const fs = require('fs');
const path = require('path');

const IPFS_GATEWAYS = [
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/'
];

async function checkImageAvailability() {
    try {
        // Read metadata to get image hash
        const metadata = JSON.parse(fs.readFileSync(path.join(__dirname, 'assets', 'metadata.json')));
        const imageUrl = metadata.image;
        const ipfsHash = imageUrl.split('/ipfs/')[1];

        console.log('Checking image availability...');
        console.log('IPFS Hash:', ipfsHash);
        console.log('\nTesting different IPFS gateways:');

        for (const gateway of IPFS_GATEWAYS) {
            const url = `${gateway}${ipfsHash}`;
            try {
                const response = await axios.head(url);
                console.log(`\n✅ ${gateway}`);
                console.log(`Status: ${response.status}`);
                console.log(`Content-Type: ${response.headers['content-type']}`);
                console.log(`Content-Length: ${response.headers['content-length']} bytes`);
            } catch (error) {
                console.log(`\n❌ ${gateway}`);
                console.log(`Error: ${error.message}`);
            }
        }

        console.log('\nAlternative URLs to access your image:');
        IPFS_GATEWAYS.forEach(gateway => {
            console.log(`${gateway}${ipfsHash}`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkImageAvailability();
