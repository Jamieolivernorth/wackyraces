import { Contender } from '../types/game';

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

export const generateAlphaLeaks = (contenders: Contender[]): { contender: Contender, text: string }[] => {
    // Pick 3 random contenders to have alpha
    const shuffledContenders = [...contenders].sort(() => 0.5 - Math.random());
    const selectedContenders = shuffledContenders.slice(0, 3);

    return selectedContenders.map(contender => {
        const randomAlphaTemplate = ALPHAS[Math.floor(Math.random() * ALPHAS.length)];
        const text = randomAlphaTemplate
            .replace('{{SYMBOL}}', contender.symbol)
            .replace('{{NAME}}', contender.name);
        return { contender, text };
    });
};
