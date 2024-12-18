const web3 = require('@solana/web3.js');
const { getMint } = require('@solana/spl-token');

async function checkMintSupply() {
    try {
        // Connect to cluster with API key
        const connection = new web3.Connection(
            'https://api.quicknode.com/endpoints/solana/devnet?api-key=QN_f7e3eb76be934e87a3e99e37933bc89e',
            'confirmed'
        );

        // Load the mint address
        const mintPublicKey = new web3.PublicKey('CF52hRXaZmjBLQMvEPoG6XDZr2rDeiCsm8CxQsvs7LEL');

        // Get mint info
        const mintInfo = await getMint(connection, mintPublicKey);
        
        console.log('Current supply:', Number(mintInfo.supply) / 1e9, 'GENIUS');
        console.log('Decimals:', mintInfo.decimals);
        console.log('Freeze authority:', mintInfo.freezeAuthority?.toBase58() || 'None');
        console.log('Mint authority:', mintInfo.mintAuthority?.toBase58() || 'None');
    } catch (error) {
        console.error('Error:', error);
    }
}

checkMintSupply();
