import { FootballEvent, FootballEventType } from '../types/game';
import { GAME_CONFIG } from './gameConfig';

// Extract points from GAME_CONFIG for easier internal lookup
export const EVENT_POINTS: Record<FootballEventType, number> = {
    touch: GAME_CONFIG.events.positive.touch.value,
    forward_pass: GAME_CONFIG.events.positive.forward_pass.value,
    key_pass: GAME_CONFIG.events.positive.key_pass.value,
    shot_on_target: GAME_CONFIG.events.positive.shot_on_target.value,
    assist: GAME_CONFIG.events.positive.assist.value,
    goal: GAME_CONFIG.events.positive.goal.value,
    lost_possession: 0, // Points are 0 because negative events apply mechanical effects instead
    foul_committed: 0,
    yellow_card: GAME_CONFIG.events.negative.yellow_card.penalty,
    red_card: 0,
};

// Roles dictate the frequency of certain events
type Role = 'GK' | 'DEF' | 'MID' | 'FWD';

export const getRoleFromIndex = (index: number): Role => {
    if (index === 0) return 'GK';
    if (index % 4 === 1) return 'DEF';
    if (index % 4 === 2) return 'MID';
    return 'FWD';
};

export class FootballEventSimulator {
    private generatedEventId = 0;

    // Simulate an event for a specific role
    public generateEvent(role: Role, racingTimePassed: number): FootballEvent | null {
        const rand = Math.random();

        // Adjust probabilities based on role to make it realistic
        let eventType: FootballEventType | null = null;
        let isComboEligible = false;

        if (role === 'GK') {
            if (rand < 0.4) eventType = 'touch';
            else if (rand < 0.6) eventType = 'forward_pass';
            else if (rand < 0.65) eventType = 'lost_possession';
            else if (rand < 0.66) eventType = 'yellow_card';
        } else if (role === 'DEF') {
            if (rand < 0.3) eventType = 'touch';
            else if (rand < 0.5) eventType = 'forward_pass';
            else if (rand < 0.6) eventType = 'lost_possession';
            else if (rand < 0.65) eventType = 'foul_committed';
            else if (rand < 0.67) eventType = 'yellow_card';
            else if (rand < 0.68) eventType = 'red_card';
        } else if (role === 'MID') {
            if (rand < 0.3) eventType = 'touch';
            else if (rand < 0.6) eventType = 'forward_pass';
            else if (rand < 0.7) eventType = 'key_pass';
            else if (rand < 0.8) eventType = 'lost_possession';
            else if (rand < 0.83) eventType = 'assist';
            else if (rand < 0.86) eventType = 'foul_committed';
        } else if (role === 'FWD') {
            if (rand < 0.2) eventType = 'touch';
            else if (rand < 0.35) eventType = 'forward_pass';
            else if (rand < 0.5) eventType = 'shot_on_target';
            else if (rand < 0.6) eventType = 'goal';
            else if (rand < 0.75) eventType = 'lost_possession';
            else if (rand < 0.8) eventType = 'foul_committed';
        }

        if (!eventType) return null;

        // Check if combo eligible
        if (Object.keys(GAME_CONFIG.events.positive).includes(eventType)) {
            // @ts-ignore
            isComboEligible = GAME_CONFIG.events.positive[eventType].comboEligible || false;
        }

        return {
            id: `evt_${this.generatedEventId++}`,
            type: eventType,
            points: EVENT_POINTS[eventType],
            timestamp: racingTimePassed,
            comboEligible: isComboEligible
        };
    }
}

export const footballSimulator = new FootballEventSimulator();
