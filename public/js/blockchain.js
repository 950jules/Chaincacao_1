const blockchain = {
    async simulateHash(data) {
        const str = JSON.stringify(data);
        // Simulation rapide SHA-256
        const encoder = new TextEncoder();
        const msgUint8 = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    async simulateTransaction(data, actorId) {
        const hash = await this.simulateHash(data);
        const blockNumber = Math.floor(135000000 + Math.random() * 1000000);
        return {
            hash: '0x' + hash,
            actorId: actorId,
            network: 'Polygon Mainnet',
            blockNumber: blockNumber,
            timestamp: new Date(),
            explorerUrl: `https://polygonscan.com/tx/0x${hash}`
        };
    }
};
