const { Connection, PublicKey } = require('@solana/web3.js');
const { getAssociatedTokenAddress, getAccount } = require('@solana/spl-token');
const fs = require('fs');

async function checkBalance(address) {
    try {
        // Connect to Solana mainnet
        const connection = new Connection('https://api.mainnet-beta.solana.com', {
            commitment: 'finalized',
            confirmTransactionInitialTimeout: 60000,
        });

        // Load the mint address
        const { mintAddress } = JSON.parse(fs.readFileSync('./mint-address.json'));
        const mintPublicKey = new PublicKey(mintAddress);

        // Get the recipient's public key
        const recipientPublicKey = new PublicKey(address);

        // Get the associated token account
        const tokenAccount = await getAssociatedTokenAddress(
            mintPublicKey,
            recipientPublicKey
        );

        console.log('\nChecking balance for address:', address);
        console.log('Associated Token Account:', tokenAccount.toString());

        // Get account info
        const accountInfo = await getAccount(connection, tokenAccount);
        
        console.log('\nAccount Info:');
        console.log('Owner:', accountInfo.owner.toString());
        console.log('Mint:', accountInfo.mint.toString());
        console.log('Balance:', accountInfo.amount.toString());
        
        // Calculate balance with decimals
        const balance = Number(accountInfo.amount) / Math.pow(10, 9); // 9 decimals for GENIUS token
        console.log('Balance (with decimals):', balance.toString(), 'GENIUS');

    } catch (error) {
        console.error('Error checking balance:', error);
    }
}

// Check balance for the recipient address
const recipientAddress = '5GacfYKHQeQLC3KtKwizgPJwvNfnWTjssUfVduf4QBMX';
checkBalance(recipientAddress).catch(console.error);
