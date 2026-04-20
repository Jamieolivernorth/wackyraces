import { Contender, ContenderId } from '../types/game';
import { GAME_CONFIG } from './gameConfig';

// Base speeds and constraints for Crypto
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

    if (maxPerf === minPerf) {
        maxPerf = minPerf + 0.0001;
    }

    Object.keys(updatedContenders).forEach((key) => {
        const contenderId = key as ContenderId;
        const contender = updatedContenders[contenderId];

        const normalizedPerf = (contender.performance - minPerf) / (maxPerf - minPerf);
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
 * Uses the Rolling Window, Combos, Hurdles, and Anti-bias.
 */
export const calculateFootballMovement = (contenders: Record<ContenderId, Contender>, racingTimePassed: number): Record<ContenderId, Contender> => {
    const updatedContenders = { ...contenders };
    const { raceConfig, antiBias, positions, hurdles, finalPhaseBoosts } = GAME_CONFIG;

    // Drama Multipliers from race duration
    let timeBoostMultiplier = 1;
    const timeRemaining = raceConfig.durationSeconds - racingTimePassed;
    if (timeRemaining <= 30) {
        timeBoostMultiplier = raceConfig.finalPhaseBoosts.last30sMultiplier;
    } else if (timeRemaining <= 60) {
        timeBoostMultiplier = raceConfig.finalPhaseBoosts.last60sMultiplier;
    }

    Object.keys(updatedContenders).forEach((key) => {
        const contenderId = key as ContenderId;
        const contender = updatedContenders[contenderId];

        // Ensure we don't mutate the original
        const updatedContender = { ...contender };

        // 1. Process Negative State & Freezes
        if (updatedContender.isFrozen) {
            if (updatedContender.frozenUntil && racingTimePassed < updatedContender.frozenUntil) {
                // Still frozen, no movement
                updatedContenders[contenderId] = updatedContender;
                return;
            } else {
                // Freeze expired
                updatedContender.isFrozen = false;
                updatedContender.frozenUntil = undefined;
            }
        }

        // 2. Filter valid events in the rolling window
        const recentEvents = updatedContender.recentEvents || [];
        const validEvents = recentEvents.filter(e => {
            return (racingTimePassed - e.timestamp) <= antiBias.rollingWindowSeconds;
        });

        // Track and process new mechanical events since last tick
        // (We assume one tick = 1 second based on tickRateMs)
        const newEventsThisTick = validEvents.filter(e => e.timestamp === racingTimePassed);
        
        let shouldFreeze = false;
        let freezeDuration = 0;
        let backwardMove = 0;

        newEventsThisTick.forEach(e => {
            if (e.type === 'lost_possession') {
                shouldFreeze = true;
                freezeDuration = Math.max(freezeDuration, GAME_CONFIG.events.negative.lost_possession.durationMs / 1000);
            } else if (e.type === 'foul_committed') {
                shouldFreeze = true;
                freezeDuration = Math.max(freezeDuration, GAME_CONFIG.events.negative.foul_committed.durationMs / 1000);
            } else if (e.type === 'yellow_card') {
                shouldFreeze = true;
                freezeDuration = Math.max(freezeDuration, GAME_CONFIG.events.negative.yellow_card.freezeMs / 1000);
                backwardMove = Math.abs(GAME_CONFIG.events.negative.yellow_card.penalty);
            } else if (e.type === 'red_card') {
                updatedContender.terminalPenaltyState = true;
            }
        });

        // 3. Process Hurdles based on expected position crosses this tick
        // (Wait, we need previous position to see if they crossed a hurdle)
        const oldPos = updatedContender.position;
        // We will check hurdle collision AFTER movement calculation

        // 4. Calculate Base Points & Combos
        let totalPoints = 0;
        
        // Anti-bias: cap event contributions
        validEvents.forEach(e => {
            // we will let the actual mechanics dictate base movement, points just fuel speed
            totalPoints += e.points > 0 ? e.points : 0; 
        });

        if (antiBias.diminishingReturns.enabled && totalPoints > antiBias.diminishingReturns.threshold) {
             const excess = totalPoints - antiBias.diminishingReturns.threshold;
             totalPoints = antiBias.diminishingReturns.threshold + (excess * antiBias.diminishingReturns.multiplierAfterThreshold);
        }

        // Cap total points per window
        totalPoints = Math.min(totalPoints, antiBias.maxEventContributionPerWindow);

        // Map role parameters
        const role = updatedContender.position_type as keyof typeof positions || 'MID';
        const roleMultiplier = positions[role]?.multiplier || 1.0;
        
        // Combos logic
        const validComboEvents = validEvents.filter(e => e.comboEligible);
        let comboBonus = 0;
        let hasHotStreak = false;

        const comboEventsInWindow = validComboEvents.filter(e => (racingTimePassed - e.timestamp) <= GAME_CONFIG.comboSystem.windowSeconds);
        
        if (comboEventsInWindow.length > 0) {
            let maxTier = { eventsRequired: 0, bonus: 0, effect: '' };
            GAME_CONFIG.comboSystem.tiers.forEach(tier => {
                if (comboEventsInWindow.length >= tier.eventsRequired && tier.eventsRequired >= maxTier.eventsRequired) {
                    maxTier = { effect: '', ...tier };
                }
            });

            if (maxTier.bonus > 0) {
                comboBonus = maxTier.bonus;
                if (maxTier.effect === 'hot_streak') {
                    hasHotStreak = true;
                }
            }
        }

        // Calculate Final Movement for this tick
        // Convert point mass to speed. 0.3 is base tick movement.
        let moveSpeed = raceConfig.baseMovementPerTick + (totalPoints * 0.1); 
        
        // Multipliers
        moveSpeed *= roleMultiplier;
        moveSpeed *= timeBoostMultiplier;

        if (comboBonus > 0) {
            moveSpeed *= positions[role]?.comboMultiplier || 1.0;
            moveSpeed += (comboBonus * 0.1);
        }

        if (updatedContender.terminalPenaltyState) {
            moveSpeed *= GAME_CONFIG.events.negative.red_card.movementMultiplier;
        }

        let newPos = oldPos + moveSpeed - backwardMove;

        // Apply Hurdles checks
        hurdles.positions.forEach(hPos => {
            if (oldPos < hPos && newPos >= hPos) {
                // Hit hurdle
                shouldFreeze = true;
                freezeDuration = Math.max(freezeDuration, hurdles.penaltyOnHit.freezeMs / 1000);
                newPos -= hurdles.penaltyOnHit.backwardMovement;
            }
        });

        // Apply Freezing
        if (shouldFreeze) {
            updatedContender.isFrozen = true;
            updatedContender.frozenUntil = racingTimePassed + freezeDuration;
        }

        updatedContender.recentEvents = validEvents;
        updatedContender.position = Math.min(Math.max(newPos, 0), 110);
        
        // Clean up visual combo streak state for UI
        updatedContender.comboScore = hasHotStreak ? comboEventsInWindow.length : 0;

        updatedContenders[contenderId] = updatedContender;
    });

    return updatedContenders;
};

export const getWinner = (contenders: Record<ContenderId, Contender>): ContenderId => {
    return Object.values(contenders).reduce((prev, current) =>
        (current.position > prev.position ? current : prev)
    ).id;
};
