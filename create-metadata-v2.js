const { Connection, clusterApiUrl, Keypair, PublicKey, Transaction } = require('@solana/web3.js');
const { createCreateMetadataAccountV2Instruction, PROGRAM_ID } = require('@metaplex-foundation/mpl-token-metadata');
const fs = require('fs');

async function setupMetadata() {
    try {
        // Connect to mainnet
        const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

        // Load the wallet
        const secretKey = JSON.parse(fs.readFileSync('./metadata-wallet.json'));
        const payer = Keypair.fromSecretKey(new Uint8Array(secretKey));

        console.log('Setting up metadata on mainnet...');
        console.log('Using wallet:', payer.publicKey.toBase58());

        // Load the mint address
        const { mintAddress } = JSON.parse(fs.readFileSync('./mint-address.json'));
        const mintPublicKey = new PublicKey(mintAddress);
        console.log('Mint address:', mintAddress);

        // Load IPFS metadata URL
        const { ipfsUrl } = JSON.parse(fs.readFileSync('./ipfs-hash.json'));
        console.log('Metadata URI:', ipfsUrl);

        // Get the metadata account address
        const [metadataAddress] = await PublicKey.findProgramAddress(
            [
                Buffer.from('metadata'),
                PROGRAM_ID.toBuffer(),
                mintPublicKey.toBuffer(),
            ],
            PROGRAM_ID
        );

        console.log('Metadata address:', metadataAddress.toBase58());

        // Prepare the metadata
        const data = {
            name: "GENIUS",
            symbol: "GENIUS",
            uri: ipfsUrl,
            sellerFeeBasisPoints: 0,
            creators: null,
            collection: null,
            uses: null
        };

        // Create the metadata instruction
        const instruction = createCreateMetadataAccountV2Instruction(
            {
                metadata: metadataAddress,
                mint: mintPublicKey,
                mintAuthority: payer.publicKey,
                payer: payer.publicKey,
                updateAuthority: payer.publicKey,
            },
            {
                createMetadataAccountArgsV2: {
                    data,
                    isMutable: true
                }
            }
        );

        // Create transaction
        const transaction = new Transaction();
        transaction.add(instruction);

        // Get recent blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = payer.publicKey;

        // Sign transaction
        transaction.sign(payer);

        // Send transaction
        const signature = await connection.sendTransaction(transaction, [payer], {
            preflightCommitment: 'confirmed',
        });

        // Confirm transaction
        await connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight,
        });

        console.log('Metadata setup successful!');
        console.log('Transaction signature:', signature);
        
        // Save the metadata information
        fs.writeFileSync('./metadata-address.json', JSON.stringify({
            mintAddress: mintAddress,
            metadataAddress: metadataAddress.toBase58(),
            transactionSignature: signature
        }, null, 2));
        
        console.log('\nMetadata information saved to metadata-address.json');
    } catch (error) {
        console.error('Error setting up metadata:', error);
        throw error;
    }
}

setupMetadata().catch(console.error);
