// Definitions for permanent upgrades
console.log("Upgrades data loaded.");

const upgrades = {
    hullIntegrity: {
        id: "hullIntegrity",
        name: "Hull Integrity",
        description: "Reduces amount of cargo lost per hit.",
        levels: [
            { level: 1, cost: 100, effect: 0.95 }, // 5% reduction
            { level: 2, cost: 250, effect: 0.90 }, // 10% reduction
            { level: 3, cost: 500, effect: 0.85 }, // 15% reduction
            // Add more levels as needed
        ],
        currentLevel: 0 // Player starts with level 0
    },
    maneuverability: {
        id: "maneuverability",
        name: "Maneuverability",
        description: "Faster base speed, quicker turning rate.",
        levels: [
            { level: 1, cost: 150, effect: 1.1 }, // 10% faster
            { level: 2, cost: 350, effect: 1.2 }, // 20% faster
            // Add more levels
        ],
        currentLevel: 0
    },
    hitboxReduction: {
        id: "hitboxReduction",
        name: "Hitbox Reduction",
        description: "Makes the ship physically slightly smaller.",
        levels: [
            { level: 1, cost: 200, effect: 0.95 }, // 5% smaller
            { level: 2, cost: 450, effect: 0.90 }, // 10% smaller
            // Add more levels
        ],
        currentLevel: 0
    },
    cargoCapacity: {
        id: "cargoCapacity",
        name: "Cargo Capacity",
        description: "Increases maximum cargo.",
        levels: [
            { level: 1, cost: 100, effect: 120 }, // Max cargo 120
            { level: 2, cost: 250, effect: 150 }, // Max cargo 150
            // Add more levels
        ],
        currentLevel: 0 // Base capacity defined by vessel
    },
    windEfficiency: {
        id: "windEfficiency",
        name: "Wind Efficiency",
        description: "Improves speed bonus downwind / reduces penalty upwind.",
        levels: [
            { level: 1, cost: 120, effect: 1.1 }, // 10% improvement
            { level: 2, cost: 300, effect: 1.2 }, // 20% improvement
            // Add more levels
        ],
        currentLevel: 0
    },
    // Add modifier enhancements later if needed
};

function getUpgradeEffect(upgradeId) {
    const upgrade = upgrades[upgradeId];
    if (!upgrade || upgrade.currentLevel === 0) {
        // Return base effect or handle appropriately
        if (upgradeId === 'hullIntegrity' || upgradeId === 'hitboxReduction') return 1; // No reduction
        if (upgradeId === 'maneuverability' || upgradeId === 'windEfficiency') return 1; // Base speed/efficiency
        if (upgradeId === 'cargoCapacity') return null; // Base capacity comes from vessel
        return 1; // Default base effect
    }
    return upgrade.levels[upgrade.currentLevel - 1].effect;
}

function canAffordUpgrade(upgradeId, currentCurrency) {
    const upgrade = upgrades[upgradeId];
    if (!upgrade || upgrade.currentLevel >= upgrade.levels.length) {
        return false; // Max level reached or invalid ID
    }
    return currentCurrency >= upgrade.levels[upgrade.currentLevel].cost;
}

function purchaseUpgrade(upgradeId, currentCurrency) {
    if (canAffordUpgrade(upgradeId, currentCurrency)) {
        const upgrade = upgrades[upgradeId];
        const cost = upgrade.levels[upgrade.currentLevel].cost;
        upgrade.currentLevel++;
        console.log(`Purchased ${upgrade.name} level ${upgrade.currentLevel}`);
        return cost; // Return cost to deduct from currency
    }
    return 0; // Purchase failed
}
