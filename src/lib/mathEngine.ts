import { Token, TokenId } from '../types/game';

// Base speeds and constraints
const BASE_SPEED = 0.5; // Constant forward movement
const PERFORMANCE_WEIGHT = 5.0; // Multiplier for how much performance matters
const MAX_JITTER = 0.3; // Maximum added random variation per tick


/**
 * Applies the movement formula based on the masterplan.
 */
export const calculateMovement = (tokens: Record<TokenId, Token>): Record<TokenId, Token> => {
    const updatedTokens = { ...tokens };

    // Find min and max performance to normalize
    let minPerf = Infinity;
    let maxPerf = -Infinity;

    Object.values(updatedTokens).forEach(t => {
        if (t.performance < minPerf) minPerf = t.performance;
        if (t.performance > maxPerf) maxPerf = t.performance;
    });

    // Prevent division by zero if all performances are equal
    if (maxPerf === minPerf) {
        maxPerf = minPerf + 0.0001;
    }

    Object.keys(updatedTokens).forEach((key) => {
        const tokenId = key as TokenId;
        const token = updatedTokens[tokenId];

        // Normalize performance between 0 and 1
        const normalizedPerf = (token.performance - minPerf) / (maxPerf - minPerf);

        // Calculate speed
        const jitter = (Math.random() * MAX_JITTER * 2) - MAX_JITTER;
        const speed = BASE_SPEED + (normalizedPerf * PERFORMANCE_WEIGHT) + jitter;

        // Update position. Since a race is 60s, and we tick every 1s, we need to map speed 
        // so that average speed (e.g. 3.0) adds up to ~100 over 60 ticks.
        // Let's assume an average speed of (0.5 base + 0.5 norm * 5) = 3.0 per tick.
        // 3.0 * 60 = 180 (too high, we want 100 max or just let them go past 100).
        // If we want the winner to roughly hit 100 at 60s, speed scaling:
        const speedScaling = 100 / (60 * (BASE_SPEED + 0.8 * PERFORMANCE_WEIGHT));

        const tickMove = speed * Math.max(speedScaling, 0.1);

        updatedTokens[tokenId] = {
            ...token,
            position: Math.min(token.position + tickMove, 100)
        };
    });

    return updatedTokens;
};

export const getWinner = (tokens: Record<TokenId, Token>): TokenId => {
    return Object.values(tokens).reduce((prev, current) =>
        (current.position > prev.position ? current : prev)
    ).id;
};
