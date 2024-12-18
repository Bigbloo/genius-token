const { Keypair } = require('@solana/web3.js');
const fs = require('fs');

// Generate a new keypair
const keypair = Keypair.generate();

// Save the secret key
fs.writeFileSync(
    './metadata-wallet.json',
    JSON.stringify(Array.from(keypair.secretKey))
);

console.log('New wallet created!');
console.log('Public key:', keypair.publicKey.toBase58());
console.log('Secret key saved to metadata-wallet.json');
