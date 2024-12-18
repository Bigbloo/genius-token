const { Connection, Keypair, Transaction, SystemProgram } = require('@solana/web3.js');
const { createInitializeMintInstruction, TOKEN_PROGRAM_ID, MINT_SIZE, getMinimumBalanceForRentExemptMint } = require('@solana/spl-token');
const fs = require('fs');
require('dotenv').config();

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function createToken() {
    try {
        console.log('Connecting to Solana devnet...');
        const connection = new Connection(process.env.QUICKNODE_URL, {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 60000
        });

        // Test connection
        try {
            const version = await connection.getVersion();
            console.log('Connected to Solana node version:', version);
        } catch (error) {
            throw new Error(`Failed to connect to Solana: ${error.message}`);
        }

        console.log('Loading wallet...');
        const payer = Keypair.fromSecretKey(
            new Uint8Array(JSON.parse(fs.readFileSync('dev-wallet.json')))
        );
        console.log('Wallet public key:', payer.publicKey.toBase58());
        
        console.log('Creating mint account...');
        const mint = Keypair.generate();
        console.log('Mint public key:', mint.publicKey.toBase58());
        
        // Get the minimum lamports required for the mint
        console.log('Calculating minimum balance for rent exemption...');
        const lamports = await getMinimumBalanceForRentExemptMint(connection);
        console.log('Required lamports:', lamports);
        
        // Create a transaction to create the mint account
        console.log('Building transaction...');
        const transaction = new Transaction();
        
        // Add instruction to create account
        transaction.add(
            SystemProgram.createAccount({
                fromPubkey: payer.publicKey,
                newAccountPubkey: mint.publicKey,
                space: MINT_SIZE,
                lamports,
                programId: TOKEN_PROGRAM_ID,
            })
        );
        
        // Add instruction to initialize the mint
        transaction.add(
            createInitializeMintInstruction(
                mint.publicKey,
                9, // 9 decimals
                payer.publicKey,
                payer.publicKey, // Freeze authority (optional)
                TOKEN_PROGRAM_ID
            )
        );
        
        console.log('Getting recent blockhash...');
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.lastValidBlockHeight = lastValidBlockHeight;
        transaction.feePayer = payer.publicKey;
        
        console.log('Signing transaction...');
        transaction.sign(mint, payer);
        
        console.log('Sending transaction...');
        const rawTransaction = transaction.serialize();
        const signature = await connection.sendRawTransaction(rawTransaction, {
            skipPreflight: true,
            maxRetries: 5,
            preflightCommitment: 'confirmed'
        });
        console.log('Transaction sent:', signature);
        
        console.log('Waiting for confirmation...');
        const startTime = Date.now();
        const timeout = 60000; // 60 seconds
        
        while (Date.now() - startTime < timeout) {
            const status = await connection.getSignatureStatus(signature);
            
            if (status?.value?.err) {
                throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
            }
            
            if (status?.value?.confirmationStatus === 'confirmed' || status?.value?.confirmationStatus === 'finalized') {
                console.log(`Transaction ${status.value.confirmationStatus}!`);
                break;
            }
            
            console.log('Waiting for confirmation...');
            await sleep(2000);
        }
        
        if (Date.now() - startTime >= timeout) {
            throw new Error('Transaction confirmation timeout');
        }
        
        console.log('Token created successfully!');
        console.log('Mint address:', mint.publicKey.toBase58());
        
        // Save mint address to file
        fs.writeFileSync(
            'mint-address.json',
            JSON.stringify({
                mintAddress: mint.publicKey.toBase58()
            }, null, 4)
        );
        console.log('Mint address saved to mint-address.json');
        
    } catch (error) {
        console.error('Error creating token:', error);
        process.exit(1);
    }
}

createToken();
