// Strict list of coins guaranteed to have a perpetual or spot USDT pair on Binance
export const TOP_TOKENS = [
    { id: 'btc', name: 'Bitcoin', symbol: 'BTC', color: '#F7931A', startPrice: 65000 },
    { id: 'eth', name: 'Ethereum', symbol: 'ETH', color: '#627EEA', startPrice: 3500 },
    { id: 'bnb', name: 'BNB', symbol: 'BNB', color: '#F3BA2F', startPrice: 600 },
    { id: 'sol', name: 'Solana', symbol: 'SOL', color: '#14F195', startPrice: 150 },
    { id: 'xrp', name: 'XRP', symbol: 'XRP', color: '#23292F', startPrice: 0.60 },
    { id: 'ada', name: 'Cardano', symbol: 'ADA', color: '#0033AD', startPrice: 0.45 },
    { id: 'avax', name: 'Avalanche', symbol: 'AVAX', color: '#E84142', startPrice: 35 },
    { id: 'doge', name: 'Dogecoin', symbol: 'DOGE', color: '#C2A633', startPrice: 0.15 },
    { id: 'shib', name: 'Shiba Inu', symbol: 'SHIB', color: '#FFA409', startPrice: 0.00002 },
    { id: 'dot', name: 'Polkadot', symbol: 'DOT', color: '#E6007A', startPrice: 7.00 },
    { id: 'link', name: 'Chainlink', symbol: 'LINK', color: '#2A5ADA', startPrice: 18.00 },
    { id: 'trx', name: 'TRON', symbol: 'TRX', color: '#FF0013', startPrice: 0.12 },
    { id: 'matic', name: 'Polygon', symbol: 'MATIC', color: '#8247E5', startPrice: 0.70 },
    { id: 'bch', name: 'Bitcoin Cash', symbol: 'BCH', color: '#8DC351', startPrice: 450 },
    { id: 'icp', name: 'Internet Computer', symbol: 'ICP', color: '#29ABE2', startPrice: 12.00 },
    { id: 'near', name: 'NEAR Protocol', symbol: 'NEAR', color: '#000000', startPrice: 7.50 },
    { id: 'uni', name: 'Uniswap', symbol: 'UNI', color: '#FF007A', startPrice: 10.00 },
    { id: 'apt', name: 'Aptos', symbol: 'APT', color: '#262626', startPrice: 9.00 },
    { id: 'ltc', name: 'Litecoin', symbol: 'LTC', color: '#345D9D', startPrice: 85 },
    { id: 'fil', name: 'Filecoin', symbol: 'FIL', color: '#0090FF', startPrice: 6.00 },
    { id: 'atom', name: 'Cosmos', symbol: 'ATOM', color: '#2E3148', startPrice: 8.50 },
    { id: 'arb', name: 'Arbitrum', symbol: 'ARB', color: '#28A0F0', startPrice: 1.20 },
    { id: 'rndr', name: 'Render', symbol: 'RNDR', color: '#D42127', startPrice: 10.50 },
    { id: 'op', name: 'Optimism', symbol: 'OP', color: '#FF0420', startPrice: 2.80 },
    { id: 'grt', name: 'The Graph', symbol: 'GRT', color: '#6742FF', startPrice: 0.30 },
    { id: 'fet', name: 'Fetch.ai', symbol: 'FET', color: '#101010', startPrice: 2.60 },
    { id: 'ldo', name: 'Lido DAO', symbol: 'LDO', color: '#00A3FF', startPrice: 2.00 },
    { id: 'ar', name: 'Arweave', symbol: 'AR', color: '#000000', startPrice: 35.00 },
    { id: 'pepe', name: 'Pepe', symbol: 'PEPE', color: '#4CAF50', startPrice: 0.000007 },
    { id: 'wif', name: 'dogwifhat', symbol: 'WIF', color: '#B39169', startPrice: 3.50 },
    { id: 'bonk', name: 'Bonk', symbol: 'BONK', color: '#F2A900', startPrice: 0.000025 },
    { id: 'tia', name: 'Celestia', symbol: 'TIA', color: '#7B2BF9', startPrice: 12.00 },
    { id: 'snx', name: 'Synthetix', symbol: 'SNX', color: '#00D1FF', startPrice: 3.50 },
    { id: 'aave', name: 'Aave', symbol: 'AAVE', color: '#B6509E', startPrice: 90.00 },
    { id: 'floki', name: 'FLOKI', symbol: 'FLOKI', color: '#C8A2C8', startPrice: 0.0002 },
    { id: 'gala', name: 'Gala', symbol: 'GALA', color: '#000000', startPrice: 0.06 }
];

// Helper to get 6 random tokens
export const getRandomTokens = () => {
    const shuffled = [...TOP_TOKENS].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 6);

    const tokensObj: Record<string, any> = {};
    selected.forEach(t => {
        tokensObj[t.id] = {
            ...t,
            currentPrice: t.startPrice,
            performance: 0,
            position: 0
        };
    });

    return tokensObj;
};  
