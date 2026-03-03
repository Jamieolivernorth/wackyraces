import { Contender, ContenderId } from '../types/game';

// Base speeds and constraints
const BASE_SPEED = 3.0; // Constant forward movement
const PERFORMANCE_WEIGHT = 1.5; // Multiplier for how much performance matters
const MAX_JITTER = 0.3; // Maximum added random variation per tick


/**
 * Applies the movement formula based on the masterplan for Crypto.
 */
export const calculateMovement = (contenders: Record<ContenderId, Contender>, speedMultiplier: number = 1): Record<ContenderId, Contender> => {
    const updatedContenders = { ...contenders };

    // Find min and max performance to normalize
    let minPerf = Infinity;
    let maxPerf = -Infinity;

    Object.values(updatedContenders).forEach(c => {
        if (c.performance < minPerf) minPerf = c.performance;
        if (c.performance > maxPerf) maxPerf = c.performance;
    });

    // Prevent division by zero if all performances are equal
    if (maxPerf === minPerf) {
        maxPerf = minPerf + 0.0001;
    }

    Object.keys(updatedContenders).forEach((key) => {
        const contenderId = key as ContenderId;
        const contender = updatedContenders[contenderId];

        // Normalize performance between 0 and 1
        const normalizedPerf = (contender.performance - minPerf) / (maxPerf - minPerf);

        // Calculate speed
        const jitter = (Math.random() * MAX_JITTER * 2) - MAX_JITTER;
        const speed = BASE_SPEED + (normalizedPerf * PERFORMANCE_WEIGHT) + jitter;

        const speedScaling = 100 / (65 * (BASE_SPEED + PERFORMANCE_WEIGHT));

        const tickMove = speed * Math.max(speedScaling, 0.1) * speedMultiplier;

        updatedContenders[contenderId] = {
            ...contender,
            position: Math.min(contender.position + tickMove, 110)
        };
    });

    return updatedContenders;
};

/**
 * Applies movement for Football.
 * Uses the Rolling 30-Second Window.
 */
export const calculateFootballMovement = (contenders: Record<ContenderId, Contender>, racingTimePassed: number): Record<ContenderId, Contender> => {
    const updatedContenders = { ...contenders };

    // Drama Multipliers
    let dramaMultiplier = 1;
    if (racingTimePassed >= 180 && racingTimePassed < 240) {
        dramaMultiplier = 1.5; // Minute 3-4
    } else if (racingTimePassed >= 240 && racingTimePassed < 270) {
        dramaMultiplier = 2.0; // Minute 4-4:30
    } else if (racingTimePassed >= 270) {
        dramaMultiplier = 3.0; // Final 30 seconds
    }

    Object.keys(updatedContenders).forEach((key) => {
        const contenderId = key as ContenderId;
        const contender = updatedContenders[contenderId];

        const recentEvents = contender.recentEvents || [];
        // Only keep events from the last 30 seconds
        const validEvents = recentEvents.filter(e => (racingTimePassed - e.timestamp) <= 30);

        // Sum points
        const pointsLast30s = validEvents.reduce((sum, e) => sum + e.points, 0);

        // Formula: points * 0.8 * dramaMultiplier.
        // Since updateRaceTick is called every 1 second, we divide by 5 to smooth a "5-second" metric over 1-second ticks.
        const movement = (pointsLast30s * 0.8 * dramaMultiplier) / 5;

        updatedContenders[contenderId] = {
            ...contender,
            recentEvents: validEvents, // clean up old events
            position: Math.min(contender.position + movement, 110)
        };
    });

    return updatedContenders;
};

export const getWinner = (contenders: Record<ContenderId, Contender>): ContenderId => {
    return Object.values(contenders).reduce((prev, current) =>
        (current.position > prev.position ? current : prev)
    ).id;
};
