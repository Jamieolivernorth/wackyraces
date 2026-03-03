import { Contender, ContenderId, FootballEvent, FootballEventType } from '../types/game';

// ⚙️ SCORING SYSTEM (POINT MODEL)
export const EVENT_POINTS: Record<FootballEventType, number> = {
    Touch: 1,
    Pass: 2,
    ForwardPass: 3,
    KeyPass: 5,
    Shot: 4,
    ShotOnTarget: 6,
    Assist: 8,
    Goal: 12,
    Dispossessed: -1,
    YellowCard: -3,
    RedCard: -6
};

// Roles dictate the frequency of certain events
type Role = 'DEF' | 'MID' | 'STR';

export const getRoleFromIndex = (index: number): Role => {
    if (index % 3 === 0) return 'DEF';
    if (index % 3 === 1) return 'MID';
    return 'STR';
};

export class FootballEventSimulator {
    private generatedEventId = 0;

    // Simulate an event for a specific role
    public generateEvent(role: Role, racingTimePassed: number): FootballEvent | null {
        const rand = Math.random();

        // Adjust probabilities based on role to make it realistic
        let eventType: FootballEventType | null = null;

        if (role === 'DEF') {
            if (rand < 0.3) eventType = 'Pass';
            else if (rand < 0.5) eventType = 'Touch';
            else if (rand < 0.6) eventType = 'ForwardPass';
            else if (rand < 0.65) eventType = 'Dispossessed';
            else if (rand < 0.67) eventType = 'YellowCard';
        } else if (role === 'MID') {
            if (rand < 0.3) eventType = 'Pass';
            else if (rand < 0.45) eventType = 'Touch';
            else if (rand < 0.65) eventType = 'ForwardPass';
            else if (rand < 0.75) eventType = 'KeyPass';
            else if (rand < 0.8) eventType = 'Dispossessed';
            else if (rand < 0.83) eventType = 'Assist';
        } else if (role === 'STR') {
            if (rand < 0.2) eventType = 'Touch';
            else if (rand < 0.35) eventType = 'Pass';
            else if (rand < 0.5) eventType = 'Shot';
            else if (rand < 0.6) eventType = 'ShotOnTarget';
            else if (rand < 0.65) eventType = 'Goal';
            else if (rand < 0.8) eventType = 'Dispossessed';
        }

        if (!eventType) return null;

        return {
            id: `evt_${this.generatedEventId++}`,
            type: eventType,
            points: EVENT_POINTS[eventType],
            timestamp: racingTimePassed
        };
    }
}

export const footballSimulator = new FootballEventSimulator();
