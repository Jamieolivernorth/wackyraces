export const GAME_CONFIG = {
  "raceConfig": {
    "durationSeconds": 300,
    "tickRateMs": 1000,
    "trackLength": 100,
    "baseMovementPerTick": 0.3,
    "finalPhaseBoosts": {
      "last60sMultiplier": 1.5,
      "last30sMultiplier": 2.0
    }
  },

  "positions": {
    "GK": {
      "multiplier": 1.6,
      "comboMultiplier": 1.5
    },
    "DEF": {
      "multiplier": 1.3,
      "comboMultiplier": 1.3
    },
    "MID": {
      "multiplier": 1.0,
      "comboMultiplier": 1.0
    },
    "FWD": {
      "multiplier": 1.2,
      "comboMultiplier": 1.2
    }
  },

  "events": {
    "positive": {
      "touch": {
        "value": 0.5,
        "comboEligible": true
      },
      "forward_pass": {
        "value": 1.5,
        "comboEligible": true
      },
      "key_pass": {
        "value": 3,
        "comboEligible": true
      },
      "shot_on_target": {
        "value": 4,
        "comboEligible": true
      },
      "assist": {
        "value": 6,
        "comboEligible": true
      },
      "goal": {
        "value": 10,
        "comboEligible": true
      }
    },

    "negative": {
      "lost_possession": {
        "type": "freeze",
        "durationMs": 2000
      },
      "foul_committed": {
        "type": "freeze",
        "durationMs": 3000
      },
      "yellow_card": {
        "type": "hurdle",
        "penalty": -3,
        "freezeMs": 1000
      },
      "red_card": {
        "type": "terminal",
        "movementMultiplier": 0.5
      }
    }
  },

  "comboSystem": {
    "windowSeconds": 10,
    "tiers": [
      {
        "eventsRequired": 2,
        "bonus": 1
      },
      {
        "eventsRequired": 3,
        "bonus": 3
      },
      {
        "eventsRequired": 4,
        "bonus": 6,
        "effect": "hot_streak"
      }
    ]
  },

  "hurdles": {
    "positions": [20, 40, 60, 80, 95],
    "penaltyOnHit": {
      "backwardMovement": 2,
      "freezeMs": 1000
    }
  },

  "antiBias": {
    "rollingWindowSeconds": 30,
    "maxEventContributionPerWindow": 15,
    "diminishingReturns": {
      "enabled": true,
      "threshold": 10,
      "multiplierAfterThreshold": 0.5
    }
  },

  "winCondition": {
    "type": "maxDistance",
    "tiebreaker": "latestEventTime"
  }
} as const;
