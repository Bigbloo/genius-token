const Arweave = require('arweave');
const fs = require('fs');
const path = require('path');

// Initialize Arweave
const arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https'
});

// Generate a new wallet key
async function generateWallet() {
    const key = await arweave.wallets.generate();
    fs.writeFileSync('arweave-key.json', JSON.stringify(key));
    return key;
}

async function uploadImage() {
    try {
        console.log('Reading image file...');
        const imagePath = path.join(__dirname, 'assets', 'genius.png');
        const imageData = fs.readFileSync(imagePath);

        // Get or generate wallet
        let key;
        if (fs.existsSync('arweave-key.json')) {
            console.log('Loading existing wallet...');
            key = JSON.parse(fs.readFileSync('arweave-key.json'));
        } else {
            console.log('Generating new wallet...');
            key = await generateWallet();
        }

        // Get wallet address
        const address = await arweave.wallets.jwkToAddress(key);
        console.log('Wallet address:', address);

        // Create transaction
        console.log('Creating transaction...');
        const transaction = await arweave.createTransaction({
            data: imageData
        }, key);

        // Add tags for content type
        transaction.addTag('Content-Type', 'image/png');
        transaction.addTag('App-Name', 'GENIUS-Token');
        transaction.addTag('Type', 'logo');

        // Sign transaction
        console.log('Signing transaction...');
        await arweave.transactions.sign(transaction, key);

        // Submit transaction
        console.log('Submitting transaction...');
        const response = await arweave.transactions.post(transaction);

        if (response.status === 200) {
            console.log('Upload successful!');
            const imageUrl = `https://arweave.net/${transaction.id}`;
            console.log('Image URL:', imageUrl);

            // Update metadata.json
            const metadataPath = path.join(__dirname, 'assets', 'metadata.json');
            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            metadata.image = imageUrl;
            metadata.properties.files[0].uri = imageUrl;
            
            fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 4));
            console.log('Metadata updated successfully!');
        } else {
            throw new Error('Upload failed with status: ' + response.status);
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

uploadImage();
