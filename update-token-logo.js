const { Connection, Keypair, PublicKey, Transaction } = require('@solana/web3.js');
const { createUpdateMetadataAccountV2Instruction } = require('@metaplex-foundation/mpl-token-metadata');
const { readFileSync } = require('fs');

const MINT_ADDRESS = 'CF52hRXaZmjBLQMvEPoG6XDZr2rDeiCsm8CxQsvs7LEL';
const WALLET_PRIVATE_KEY = new Uint8Array([121, 236, 129, 244, 242, 237, 158, 108, 210, 117, 7, 147, 134, 81, 217, 109, 246, 52, 55, 177, 188, 93, 65, 196, 3, 243, 184, 56, 101, 105, 112, 179, 63, 108, 119, 228, 215, 231, 147, 246, 226, 181, 14, 21, 11, 10, 74, 104, 202, 227, 162, 110, 48, 30, 68, 152, 154, 6, 60, 203, 157, 229, 241, 150]);

async function updateTokenLogo() {
    try {
        // Lire le metadata.json
        const metadata = JSON.parse(readFileSync('./assets/metadata.json'));
        
        // Créer une connexion à Solana
        const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
        
        // Créer un keypair à partir de la clé privée
        const wallet = Keypair.fromSecretKey(WALLET_PRIVATE_KEY);
        
        // Dériver l'adresse du compte metadata
        const [metadataAccount] = PublicKey.findProgramAddressSync(
            [
                Buffer.from('metadata'),
                new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s').toBuffer(),
                new PublicKey(MINT_ADDRESS).toBuffer(),
            ],
            new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
        );
        
        console.log('Mise à jour du logo pour le token:', MINT_ADDRESS);
        console.log('Compte metadata:', metadataAccount.toString());
        
        const updateInstruction = createUpdateMetadataAccountV2Instruction(
            {
                metadata: metadataAccount,
                updateAuthority: wallet.publicKey,
            },
            {
                updateMetadataAccountArgsV2: {
                    data: {
                        name: metadata.name,
                        symbol: metadata.symbol,
                        uri: metadata.logoURI,
                        sellerFeeBasisPoints: 0,
                        creators: null,
                        collection: null,
                        uses: null,
                    },
                    updateAuthority: wallet.publicKey,
                    primarySaleHappened: true,
                    isMutable: true,
                },
            }
        );
        
        // Créer et envoyer la transaction
        const transaction = new Transaction().add(updateInstruction);
        const signature = await connection.sendTransaction(transaction, [wallet]);
        
        // Attendre la confirmation
        await connection.confirmTransaction(signature);
        
        console.log('Logo du token mis à jour avec succès!');
        console.log('Signature de la transaction:', signature);
        
    } catch (error) {
        console.error('Erreur lors de la mise à jour du logo:', error);
        if (error.logs) {
            console.error('Logs de la transaction:', error.logs);
        }
    }
}

updateTokenLogo();
