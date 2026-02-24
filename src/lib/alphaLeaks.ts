import { Token } from '../types/game';

const ALPHAS = [
    "Whale Alert: 50,000 {{SYMBOL}} just transferred to an unknown wallet.",
    "Rumors circulating that {{NAME}} might announce a major CEX listing today.",
    "Justin Sun apparently tweeted an eye emoji about {{SYMBOL}} then deleted it.",
    "On-chain data shows aggressive accumulation of it by smart money.",
    "A top crypto influencer is allegedly preparing a video on {{NAME}}.",
    "Developer commits on {{NAME}} just hit an all-time monthly high.",
    "Word on the street is a huge partnership for {{SYMBOL}} dropping this week.",
    "Snoop Dogg purportedly asked his team how to buy {{SYMBOL}}.",
    "Major short squeeze incoming for {{NAME}} according to order book depth.",
    "The CEO of a Fortune 500 company was seen wearing a {{SYMBOL}} hat.",
    "Breaking: Anonymous hedge fund increases their position in {{NAME}} by 400%.",
    "A massive exploit was just averted on {{SYMBOL}}'s network. Devs bullish.",
    "Elon Musk simply replied 'Interesting' to a thread about {{NAME}}."
];

export const generateAlphaLeaks = (tokens: Token[]): { token: Token, text: string }[] => {
    // Pick 3 random tokens to have alpha
    const shuffledTokens = [...tokens].sort(() => 0.5 - Math.random());
    const selectedTokens = shuffledTokens.slice(0, 3);

    return selectedTokens.map(token => {
        const randomAlphaTemplate = ALPHAS[Math.floor(Math.random() * ALPHAS.length)];
        const text = randomAlphaTemplate
            .replace('{{SYMBOL}}', token.symbol)
            .replace('{{NAME}}', token.name);
        return { token, text };
    });
};
