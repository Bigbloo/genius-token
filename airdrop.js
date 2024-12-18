const { Connection, Keypair, PublicKey, Transaction, ComputeBudgetProgram } = require('@solana/web3.js');
const { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferInstruction, getAccount } = require('@solana/spl-token');
const fs = require('fs');

async function checkTokenAccount(connection, mintPublicKey, ownerPublicKey) {
    try {
        const tokenAccount = await getAssociatedTokenAddress(
            mintPublicKey,
            ownerPublicKey
        );

        const accountInfo = await getAccount(connection, tokenAccount);
        console.log('Token Account Info:');
        console.log('Owner:', accountInfo.owner.toBase58());
        console.log('Mint:', accountInfo.mint.toBase58());
        console.log('Balance:', accountInfo.amount.toString());
        
        return accountInfo;
    } catch (error) {
        console.error('Error checking token account:', error);
        throw error;
    }
}

async function performAirdrop(connection, owner, mintPublicKey, recipientAddress, amount) {
    try {
        // Get the recipient's public key
        const recipientPublicKey = new PublicKey(recipientAddress);

        // Get the token accounts for owner and recipient
        const ownerATA = await getAssociatedTokenAddress(
            mintPublicKey,
            owner.publicKey
        );

        const recipientATA = await getAssociatedTokenAddress(
            mintPublicKey,
            recipientPublicKey
        );

        // Create transaction
        const transaction = new Transaction();

        // Add compute unit increase instruction (following QuickNode best practices)
        const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({ 
            units: 300000 
        });
        transaction.add(modifyComputeUnits);

        // Add priority fee instruction (following QuickNode best practices)
        const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({ 
            microLamports: 1 
        });
        transaction.add(addPriorityFee);

        // Check if recipient's ATA exists
        try {
            await getAccount(connection, recipientATA);
            console.log('Recipient ATA exists');
        } catch (error) {
            // If recipient's ATA doesn't exist, create it
            console.log('Creating Associated Token Account for recipient...');
            transaction.add(
                createAssociatedTokenAccountInstruction(
                    owner.publicKey,
                    recipientATA,
                    recipientPublicKey,
                    mintPublicKey
                )
            );
        }

        // Add transfer instruction
        transaction.add(
            createTransferInstruction(
                ownerATA,
                recipientATA,
                owner.publicKey,
                BigInt(amount)
            )
        );

        // Get recent blockhash with retry
        let blockhash, lastValidBlockHeight;
        for (let i = 0; i < 3; i++) {
            try {
                ({ blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash({
                    commitment: 'processed'
                }));
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

        console.log('Sending transaction...');

        // Send transaction with retry
        let signature;
        for (let i = 0; i < 3; i++) {
            try {
                signature = await connection.sendRawTransaction(transaction.serialize(), {
                    skipPreflight: false, // Changed to false for better error checking
                    maxRetries: 5,
                    preflightCommitment: 'confirmed'
                });
                break;
            } catch (error) {
                console.log(`Retrying to send transaction (attempt ${i + 1}/3)...`);
                if (i === 2) throw error;
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        console.log('Transaction sent:', signature);
        console.log('Waiting for confirmation...');

        // New approach to confirmation
        let status = null;
        const timeoutMs = 60000; // 60 seconds
        const startTime = Date.now();

        while (Date.now() - startTime < timeoutMs) {
            try {
                status = await connection.getSignatureStatus(signature, {
                    searchTransactionHistory: true
                });

                if (status === null) {
                    console.log('Transaction not found yet, waiting...');
                } else if (status.value === null) {
                    console.log('Waiting for transaction to be processed...');
                } else if (status.value.err) {
                    throw new Error(`Transaction failed: ${status.value.err}`);
                } else if (status.value.confirmationStatus === 'confirmed' || status.value.confirmationStatus === 'finalized') {
                    console.log(`Transaction ${status.value.confirmationStatus}!`);
                    break;
                }

                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                if (error.message.includes('block height exceeded')) {
                    throw error;
                }
                console.log('Error checking status:', error.message);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        if (!status || !status.value || (!status.value.confirmationStatus === 'confirmed' && !status.value.confirmationStatus === 'finalized')) {
            throw new Error('Transaction confirmation timeout');
        }

        console.log('Tokens transferred successfully!');
        console.log('Transaction signature:', signature);
        
        return signature;
    } catch (error) {
        console.error('Error transferring tokens:', error);
        throw error;
    }
}

async function airdropToRecipients() {
    try {
        // Connect to Solana mainnet using public RPC with very conservative settings
        const connection = new Connection('https://api.mainnet-beta.solana.com', {
            commitment: 'finalized',
            confirmTransactionInitialTimeout: 180000, // 3 minutes
            disableRetryOnRateLimit: false,
            httpHeaders: {
                'Content-Type': 'application/json',
            }
        });

        // Add some initial delay to ensure connection is stable
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Load the wallet (token owner)
        const secretKey = JSON.parse(fs.readFileSync('./mainnet-wallet.json'));
        const owner = Keypair.fromSecretKey(new Uint8Array(secretKey));

        // Load the mint address
        const { mintAddress } = JSON.parse(fs.readFileSync('./mint-address.json'));
        const mintPublicKey = new PublicKey(mintAddress);

        console.log('Checking initial token account state...');
        await checkTokenAccount(connection, mintPublicKey, owner.publicKey);

        // Load recipients from JSON file
        const recipients = JSON.parse(fs.readFileSync('./airdrop-recipients.json'));

        console.log(`Starting airdrop to ${recipients.length} recipients...`);

        // Process each recipient
        for (const recipient of recipients) {
            console.log(`\nProcessing airdrop to ${recipient.address}...`);
            console.log('Amount:', recipient.amount);

            try {
                await performAirdrop(connection, owner, mintPublicKey, recipient.address, recipient.amount);
                console.log('Successfully sent tokens to', recipient.address);
                // Add delay between transactions to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error('Failed to send tokens to', recipient.address, ':', error.message);
            }
        }

        console.log('\nAirdrop completed!');
    } catch (error) {
        console.error('Error performing airdrop:', error);
        throw error;
    }
}

// Start the airdrop
airdropToRecipients().catch(console.error);
