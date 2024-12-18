require('dotenv').config();
const { 
    Connection, 
    Keypair, 
    PublicKey,
    Transaction,
    sendAndConfirmTransaction,
    clusterApiUrl
} = require('@solana/web3.js');
const { 
    createCreateMetadataAccountV3Instruction,
    PROGRAM_ID
} = require('@metaplex-foundation/mpl-token-metadata');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

async function updateMetadata() {
    try {
        // Connect to devnet
        const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
        
        // Load the wallet keypair from file
        const payerSecretKey = JSON.parse(fs.readFileSync('./dev-wallet.json'));
        const payer = Keypair.fromSecretKey(new Uint8Array(payerSecretKey));
        
        // Get the mint address
        const { mintAddress } = JSON.parse(fs.readFileSync('./mint-address.json'));
        const mint = new PublicKey(mintAddress);

        // Get the IPFS URL
        const { ipfsUrl } = JSON.parse(fs.readFileSync('./ipfs-hash.json'));

        // Create the metadata JSON
        const metadata = {
            name: "GENIUS",
            symbol: "GENIUS",
            description: "GENIUS Token - A magical genie token on Solana blockchain",
            image: ipfsUrl,
            attributes: [
                {
                    trait_type: "Type",
                    value: "Magical"
                }
            ],
            properties: {
                files: [
                    {
                        uri: ipfsUrl,
                        type: "image/png"
                    }
                ]
            }
        };

        // Upload metadata to IPFS
        console.log('Uploading metadata to IPFS...');
        const formData = new FormData();
        formData.append('file', Buffer.from(JSON.stringify(metadata)), {
            filename: 'metadata.json',
            contentType: 'application/json',
        });

        const JWT = process.env.PINATA_JWT;
        if (!JWT) {
            throw new Error('PINATA_JWT not found in environment variables');
        }
        
        const pinataResponse = await axios.post(
            "https://api.pinata.cloud/pinning/pinFileToIPFS",
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${JWT}`,
                    ...formData.getHeaders()
                }
            }
        );

        const metadataUrl = `https://ipfs.io/ipfs/${pinataResponse.data.IpfsHash}`;
        console.log('Metadata uploaded to:', metadataUrl);

        // Derive the metadata account PDA
        const [metadataAccount] = PublicKey.findProgramAddressSync(
            [
                Buffer.from('metadata'),
                PROGRAM_ID.toBuffer(),
                mint.toBuffer(),
            ],
            PROGRAM_ID
        );

        // Create on-chain metadata
        console.log('Creating on-chain metadata...');
        const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
            {
                metadata: metadataAccount,
                mint: mint,
                mintAuthority: payer.publicKey,
                payer: payer.publicKey,
                updateAuthority: payer.publicKey,
            },
            {
                createMetadataAccountArgsV3: {
                    data: {
                        name: "GENIUS",
                        symbol: "GENIUS",
                        uri: metadataUrl,
                        sellerFeeBasisPoints: 0,
                        creators: null,
                        collection: null,
                        uses: null,
                    },
                    isMutable: true,
                    collectionDetails: null,
                },
            }
        );

        // Create and send transaction
        const transaction = new Transaction().add(createMetadataInstruction);
        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [payer]
        );

        console.log(' Token metadata created successfully!');
        console.log('Transaction signature:', signature);
        console.log('Metadata URL:', metadataUrl);
    } catch (error) {
        if (error.response) {
            console.error('Error response:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

updateMetadata().catch(console.error);
