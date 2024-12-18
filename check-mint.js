const { Connection, PublicKey } = require('@solana/web3.js');
const { getMint } = require('@solana/spl-token');
require('dotenv').config();

async function checkMint() {
    try {
        console.log('Connecting to Solana...');
        const connection = new Connection(process.env.QUICKNODE_URL, 'confirmed');
        
        console.log('Loading mint...');
        const mintPublicKey = new PublicKey('CF52hRXaZmjBLQMvEPoG6XDZr2rDeiCsm8CxQsvs7LEL');
        
        console.log('Checking mint account...');
        const accountInfo = await connection.getAccountInfo(mintPublicKey);
        
        if (!accountInfo) {
            console.log('Mint account does not exist');
            return;
        }
        
        console.log('Mint account exists');
        console.log('Owner:', accountInfo.owner.toBase58());
        console.log('Data length:', accountInfo.data.length);
        console.log('Executable:', accountInfo.executable);
        
        try {
            const mintInfo = await getMint(connection, mintPublicKey);
            console.log('\nMint info:');
            console.log('Supply:', Number(mintInfo.supply) / 1e9);
            console.log('Decimals:', mintInfo.decimals);
            console.log('Freeze authority:', mintInfo.freezeAuthority?.toBase58() || 'None');
            console.log('Mint authority:', mintInfo.mintAuthority?.toBase58() || 'None');
        } catch (error) {
            console.log('\nFailed to get mint info:', error.message);
        }
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkMint();
