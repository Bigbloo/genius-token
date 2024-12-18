const { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');
const { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createMintToInstruction, getAccount, getMint } = require('@solana/spl-token');
const fs = require('fs');

async function initializeTokenAccount() {
    try {
        // Connect to mainnet using Helius RPC with custom fetch configuration
        const connection = new Connection('https://rpc.helius.xyz/?api-key=31c21828-ae62-4e5b-be17-7d4a6e5cc894', {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 30000,
            fetch: (url, options) => {
                return fetch(url, {
                    ...options,
                    timeout: 30000,
                });
            }
        });

        // Load the wallet (token owner)
        const secretKey = JSON.parse(fs.readFileSync('./mainnet-wallet.json'));
        const owner = Keypair.fromSecretKey(new Uint8Array(secretKey));

        // Load the mint address
        const { mintAddress } = JSON.parse(fs.readFileSync('./mint-address.json'));
        const mintPublicKey = new PublicKey(mintAddress);

        console.log('Initializing token account...');
        console.log('Owner address:', owner.publicKey.toBase58());
        console.log('Mint address:', mintAddress);

        // Get the owner's ATA
        const ownerATA = await getAssociatedTokenAddress(
            mintPublicKey,
            owner.publicKey
        );

        // Create transaction
        const transaction = new Transaction();

        // Check if owner's ATA exists
        try {
            await getAccount(connection, ownerATA);
            console.log('Owner ATA already exists');
        } catch (error) {
            console.log('Creating Associated Token Account for owner...');
            transaction.add(
                createAssociatedTokenAccountInstruction(
                    owner.publicKey,
                    ownerATA,
                    owner.publicKey,
                    mintPublicKey
                )
            );
        }

        // Get mint info to verify authority
        const mintInfo = await getMint(connection, mintPublicKey);
        console.log('\nMint Info:');
        console.log('Mint authority:', mintInfo.mintAuthority?.toBase58() || 'None');
        console.log('Freeze authority:', mintInfo.freezeAuthority?.toBase58() || 'None');
        console.log('Current supply:', mintInfo.supply.toString());
        console.log('Is initialized:', mintInfo.isInitialized);
        console.log('Decimals:', mintInfo.decimals);

        // Check if owner is mint authority
        if (!mintInfo.mintAuthority?.equals(owner.publicKey)) {
            throw new Error('Your wallet does not have mint authority');
        }

        // Add mint instruction (mint 1000 tokens)
        const mintAmount = BigInt('1000000000000'); // 1000 tokens with 9 decimals
        transaction.add(
            createMintToInstruction(
                mintPublicKey,
                ownerATA,
                owner.publicKey,
                mintAmount
            )
        );

        // Get recent blockhash with retry
        let blockhash, lastValidBlockHeight;
        for (let i = 0; i < 3; i++) {
            try {
                ({ blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized'));
                break;
            } catch (error) {
                console.log(`Retrying to get blockhash (attempt ${i + 1}/3)...`);
                if (i === 2) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        transaction.recentBlockhash = blockhash;
        transaction.lastValidBlockHeight = lastValidBlockHeight;
        transaction.feePayer = owner.publicKey;

        // Sign transaction
        transaction.sign(owner);

        console.log('\nSending transaction...');

        // Send transaction with retry
        let signature;
        for (let i = 0; i < 3; i++) {
            try {
                signature = await connection.sendRawTransaction(transaction.serialize(), {
                    skipPreflight: false,
                    preflightCommitment: 'finalized',
                    maxRetries: 5,
                });
                break;
            } catch (error) {
                console.log(`Retrying to send transaction (attempt ${i + 1}/3)...`);
                if (i === 2) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log('Transaction sent:', signature);
        console.log('Waiting for confirmation...');

        // Wait for confirmation with retry
        for (let i = 0; i < 3; i++) {
            try {
                await connection.confirmTransaction({
                    signature,
                    blockhash,
                    lastValidBlockHeight,
                }, 'finalized');
                break;
            } catch (error) {
                console.log(`Retrying to confirm transaction (attempt ${i + 1}/3)...`);
                if (i === 2) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log('Token account initialized and tokens minted successfully!');
        console.log('Transaction signature:', signature);

        // Get final token account info
        try {
            const accountInfo = await getAccount(connection, ownerATA);
            console.log('\nFinal Token Account Info:');
            console.log('Owner:', accountInfo.owner.toBase58());
            console.log('Mint:', accountInfo.mint.toBase58());
            console.log('Balance:', accountInfo.amount.toString());
        } catch (error) {
            console.error('Error getting final token account info:', error);
        }

        return signature;
    } catch (error) {
        console.error('Error initializing token account:', error);
        throw error;
    }
}

// Initialize token account and mint tokens
initializeTokenAccount().catch(console.error);
