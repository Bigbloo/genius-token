const { Connection, Keypair, Transaction, PublicKey, ComputeBudgetProgram } = require('@solana/web3.js');
const { getAssociatedTokenAddress, createMintToInstruction, getMint } = require('@solana/spl-token');
const fs = require('fs');
require('dotenv').config();

// Configuration
const CONFIRMATION_TIMEOUT = 180000; // 3 minutes
const MAX_RETRIES = 5;
const INITIAL_BACKOFF = 5000; // 5 seconds
const BATCH_SIZE = 100000; // 100k tokens per batch
const TOTAL_BATCHES = 10;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function mintTokensBatch(connection, owner, mintPublicKey, tokenAccount, amount, batchNumber) {
    console.log(`\nStarting batch ${batchNumber}/${TOTAL_BATCHES}`);
    console.log(`Amount to mint: ${amount} (${amount / 1e9} GENIUS)`);
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`\nAttempt ${attempt}/${MAX_RETRIES}`);
            
            const transaction = new Transaction();
            
            // Add compute budget instruction
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
                    mintPublicKey,
                    tokenAccount,
                    owner.publicKey,
                    amount
                )
            );

            console.log('Getting recent blockhash...');
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.lastValidBlockHeight = lastValidBlockHeight;
            transaction.feePayer = owner.publicKey;

            console.log('Signing transaction...');
            transaction.sign(owner);
            
            console.log('Sending transaction...');
            const signature = await connection.sendRawTransaction(transaction.serialize(), {
                skipPreflight: true,
                maxRetries: 5,
                preflightCommitment: 'confirmed'
            });
            console.log('Transaction sent:', signature);
            
            console.log('Waiting for confirmation...');
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
                
                console.log(`Status: ${status?.value?.confirmationStatus || 'unknown'}`);
                await sleep(2000);
            }
            
            throw new Error('Transaction confirmation timeout');
        } catch (error) {
            console.error(`Error in batch ${batchNumber}, attempt ${attempt}:`, error.message);
            
            if (attempt === MAX_RETRIES) {
                throw new Error(`Failed to process batch ${batchNumber} after ${MAX_RETRIES} attempts: ${error.message}`);
            }
            
            // Exponential backoff
            const backoffTime = INITIAL_BACKOFF * Math.pow(2, attempt - 1);
            console.log(`Waiting ${backoffTime/1000} seconds before retry...`);
            await sleep(backoffTime);
        }
    }
    return false;
}

async function mintTokens() {
    try {
        console.log('Connecting to Solana...');
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
        const owner = Keypair.fromSecretKey(
            new Uint8Array(JSON.parse(fs.readFileSync('dev-wallet.json')))
        );
        console.log('Wallet public key:', owner.publicKey.toBase58());
        
        console.log('Loading mint...');
        const mintPublicKey = new PublicKey('4uELaFaT76V9peDXEmmrceTPFcFNziWm5GaCXbNp8TGA');
        console.log('Mint address:', mintPublicKey.toBase58());
        
        // Get the token account
        console.log('Getting token account...');
        const tokenAccount = await getAssociatedTokenAddress(
            mintPublicKey,
            owner.publicKey
        );
        console.log('Token account:', tokenAccount.toBase58());
        
        // Check current supply
        console.log('Checking current supply...');
        try {
            const mintInfo = await getMint(connection, mintPublicKey);
            console.log('Current supply:', Number(mintInfo.supply) / 1e9, 'GENIUS');
        } catch (error) {
            console.log('Could not get current supply:', error.message);
        }

        const batchAmount = BATCH_SIZE * 1e9; // Convert to smallest units
        
        console.log(`\nStarting to mint tokens in ${TOTAL_BATCHES} batches of ${BATCH_SIZE} GENIUS each...`);
        
        for (let i = 0; i < TOTAL_BATCHES; i++) {
            const success = await mintTokensBatch(connection, owner, mintPublicKey, tokenAccount, batchAmount, i + 1);
            
            if (!success) {
                throw new Error(`Failed to mint batch ${i + 1}`);
            }

            if (i < TOTAL_BATCHES - 1) {
                console.log('\nWaiting 10 seconds before next batch...');
                await sleep(10000);
            }
        }

        console.log('\nMinting completed successfully!');
        
        // Check final supply
        try {
            const mintInfo = await getMint(connection, mintPublicKey);
            console.log('Final supply:', Number(mintInfo.supply) / 1e9, 'GENIUS');
        } catch (error) {
            console.log('Could not get final supply:', error.message);
        }
        
    } catch (error) {
        console.error('\nError minting tokens:', error.message);
        process.exit(1);
    }
}

mintTokens();
