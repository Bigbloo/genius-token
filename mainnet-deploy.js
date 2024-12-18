const { Connection, Keypair, Transaction, PublicKey, SystemProgram, ComputeBudgetProgram } = require('@solana/web3.js');
const { createMint, getOrCreateAssociatedTokenAccount, createMintToInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getMint } = require('@solana/spl-token');
const fs = require('fs');
require('dotenv').config();

// Configuration
const CONFIRMATION_TIMEOUT = 180000; // 3 minutes
const MAX_RETRIES = 5;
const INITIAL_BACKOFF = 5000; // 5 seconds
const TOTAL_SUPPLY = 1000000; // 1 million tokens
const DECIMALS = 9;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function confirmTransaction(connection, signature, description = '') {
    console.log(`Confirming ${description} transaction:`, signature);
    
    const startTime = Date.now();
    while (Date.now() - startTime < CONFIRMATION_TIMEOUT) {
        const status = await connection.getSignatureStatus(signature);
        
        if (status?.value?.err) {
            throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
        }
        
        if (status?.value?.confirmationStatus === 'confirmed' || status?.value?.confirmationStatus === 'finalized') {
            console.log(`Transaction ${status.value.confirmationStatus}!`);
            return true;
        }
        
        await sleep(2000);
    }
    throw new Error('Transaction confirmation timeout');
}

async function deployToMainnet() {
    try {
        console.log('\n=== Starting GENIUS Token Mainnet Deployment ===\n');
        
        // Connect to mainnet
        console.log('Connecting to Solana mainnet...');
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

        // Load wallet
        console.log('\nLoading wallet...');
        const owner = Keypair.fromSecretKey(
            new Uint8Array(JSON.parse(fs.readFileSync('mainnet-wallet.json')))
        );
        console.log('Wallet public key:', owner.publicKey.toBase58());
        
        // Check wallet balance
        const balance = await connection.getBalance(owner.publicKey);
        const solBalance = balance / 1e9;
        console.log(`Wallet balance: ${solBalance} SOL`);
        
        if (solBalance < 1) {
            throw new Error('Insufficient SOL balance. Please ensure you have at least 1 SOL for deployment.');
        }

        // Create mint account
        console.log('\nCreating mint account...');
        const mint = await createMint(
            connection,
            owner,
            owner.publicKey,
            owner.publicKey,
            DECIMALS,
            undefined,
            { commitment: 'confirmed' },
            TOKEN_PROGRAM_ID
        );
        console.log('Mint address:', mint.toBase58());
        
        // Save mint address
        fs.writeFileSync('mainnet-mint-address.json', JSON.stringify({
            address: mint.toBase58(),
            network: 'mainnet-beta'
        }, null, 2));
        
        // Create token account
        console.log('\nCreating token account...');
        const tokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            owner,
            mint,
            owner.publicKey,
            false,
            'confirmed',
            { commitment: 'confirmed' },
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
        );
        console.log('Token account:', tokenAccount.address.toBase58());
        
        // Mint initial supply
        console.log('\nMinting initial supply...');
        const mintAmount = TOTAL_SUPPLY * Math.pow(10, DECIMALS);
        
        const transaction = new Transaction();
        
        // Add compute budget instruction for complex transactions
        transaction.add(
            ComputeBudgetProgram.setComputeUnitLimit({
                units: 300000
            })
        );
        
        // Add priority fee instruction
        transaction.add(
            ComputeBudgetProgram.setComputeUnitPrice({
                microLamports: 1
            })
        );
        
        // Add mint instruction
        transaction.add(
            createMintToInstruction(
                mint,
                tokenAccount.address,
                owner.publicKey,
                mintAmount
            )
        );
        
        // Get recent blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.lastValidBlockHeight = lastValidBlockHeight;
        transaction.feePayer = owner.publicKey;
        
        // Sign and send transaction
        transaction.sign(owner);
        const signature = await connection.sendRawTransaction(transaction.serialize(), {
            skipPreflight: true,
            maxRetries: 5,
            preflightCommitment: 'confirmed'
        });
        
        await confirmTransaction(connection, signature, 'mint');
        
        // Verify final supply
        const mintInfo = await getMint(connection, mint);
        console.log('\nDeployment completed successfully!');
        console.log('Final supply:', Number(mintInfo.supply) / Math.pow(10, DECIMALS), 'GENIUS');
        console.log('\nToken details:');
        console.log('- Network: Mainnet');
        console.log(`- Mint address: ${mint.toBase58()}`);
        console.log(`- Decimals: ${DECIMALS}`);
        console.log(`- Total supply: ${TOTAL_SUPPLY}`);
        console.log(`- Owner: ${owner.publicKey.toBase58()}`);
        
    } catch (error) {
        console.error('\nError during mainnet deployment:', error.message);
        process.exit(1);
    }
}

deployToMainnet();
