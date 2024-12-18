const { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');
const { createCreateMetadataAccountV3Instruction, PROGRAM_ID } = require('@metaplex-foundation/mpl-token-metadata');
const fs = require('fs');

async function setupMetadata() {
    try {
        // Connect to mainnet
        const connection = new Connection('https://api.mainnet-beta.solana.com', {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 60000
        });

        // Load the wallet
        const secretKey = JSON.parse(fs.readFileSync('./mainnet-wallet.json'));
        const payer = Keypair.fromSecretKey(new Uint8Array(secretKey));

        // Load the mint address
        const { mintAddress } = JSON.parse(fs.readFileSync('./mint-address.json'));
        const mintPublicKey = new PublicKey(mintAddress);

        // Load IPFS metadata URL
        const { ipfsUrl } = JSON.parse(fs.readFileSync('./ipfs-hash.json'));

        console.log('Setting up metadata...');
        console.log('Using wallet:', payer.publicKey.toBase58());
        console.log('Mint address:', mintAddress);
        console.log('Metadata URI:', ipfsUrl);

        // Get metadata account address
        const [metadataAddress] = PublicKey.findProgramAddressSync(
            [
                Buffer.from('metadata'),
                PROGRAM_ID.toBuffer(),
                mintPublicKey.toBuffer(),
            ],
            PROGRAM_ID
        );

        console.log('Metadata address:', metadataAddress.toBase58());

        // Create metadata data structure
        const data = {
            name: "GENIUS",
            symbol: "GENIUS",
            uri: ipfsUrl,
            sellerFeeBasisPoints: 0,
            creators: null,
            collection: null,
            uses: null
        };

        // Create metadata instruction
        const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
            {
                metadata: metadataAddress,
                mint: mintPublicKey,
                mintAuthority: payer.publicKey,
                payer: payer.publicKey,
                updateAuthority: payer.publicKey,
            },
            {
                createMetadataAccountArgsV3: {
                    data,
                    isMutable: true,
                    collectionDetails: null,
                },
            }
        );

        // Create transaction
        const transaction = new Transaction().add(createMetadataInstruction);

        console.log('Sending transaction...');
        
        // Send and confirm transaction
        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [payer],
            {
                commitment: 'confirmed',
                preflightCommitment: 'confirmed',
                skipPreflight: false,
                maxRetries: 5,
            }
        );

        console.log('Transaction confirmed!');
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
