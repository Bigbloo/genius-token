const { Connection, Keypair, PublicKey, Transaction, SystemProgram } = require('@solana/web3.js');
const { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, getAccount, ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const fs = require('fs');
require('dotenv').config();

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function createTokenAccount() {
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
        
        // Get the associated token account address
        console.log('Getting associated token account address...');
        const tokenAccount = await getAssociatedTokenAddress(
            mintPublicKey,
            owner.publicKey,
            false,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
        );
        console.log('Token account address:', tokenAccount.toBase58());
        
        try {
            // Check if the account already exists
            await getAccount(connection, tokenAccount);
            console.log('Token account already exists');
            return;
        } catch (error) {
            // Account doesn't exist, create it
            console.log('Token account does not exist, creating...');
            
            const transaction = new Transaction();
            
            transaction.add(
                createAssociatedTokenAccountInstruction(
                    owner.publicKey,
                    tokenAccount,
                    owner.publicKey,
                    mintPublicKey,
                    TOKEN_PROGRAM_ID,
                    ASSOCIATED_TOKEN_PROGRAM_ID
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
            
            console.log('Token account created successfully!');
        }
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createTokenAccount();
