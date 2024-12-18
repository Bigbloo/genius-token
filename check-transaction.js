const { Connection } = require('@solana/web3.js');

async function checkTransaction(signature) {
    try {
        // Connect to Solana mainnet
        const connection = new Connection('https://api.mainnet-beta.solana.com', {
            commitment: 'finalized'
        });

        console.log('Checking transaction:', signature);
        
        // Get transaction status
        const status = await connection.getSignatureStatus(signature, {
            searchTransactionHistory: true
        });

        console.log('\nTransaction Status:', status?.value ? {
            slot: status.value.slot,
            confirmationStatus: status.value.confirmationStatus,
            confirmations: status.value.confirmations,
            error: status.value.err
        } : 'Not found');

    } catch (error) {
        console.error('Error checking transaction:', error);
    }
}

// Check the most recent transaction status
const signature = '2TEPjFGSGCAc85kNQnNwwWr43EBBz3Uhjdo1WZuLE7yy8tbqVaEjDx6vKx1nNahXNH6hjbogbtMFL6VED395iPkD';
checkTransaction(signature).catch(console.error);
