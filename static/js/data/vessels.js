// Definitions for different vessel types
console.log("Vessels data loaded.");

const vessels = {
    sloop: {
        id: "sloop",
        name: "Sloop",
        description: "Balanced speed, average cargo, medium hitbox. Good all-rounder.",
        baseSpeed: 3,
        baseCargoCapacity: 100,
        hitboxWidth: 30,
        hitboxHeight: 50,
        // Add other specific stats like turning rate, wind efficiency modifier, etc.
        unlocked: true // Starts unlocked
    },
    brigantine: {
        id: "brigantine",
        name: "Brigantine",
        description: "Faster, more agile, smaller hitbox, but lower cargo capacity.",
        baseSpeed: 3.5,
        baseCargoCapacity: 80,
        hitboxWidth: 25,
        hitboxHeight: 45,
        unlocked: false
    },
    galleon: {
        id: "galleon",
        name: "Galleon",
        description: "Slow, poor turning, large hitbox, but massive cargo capacity.",
        baseSpeed: 2,
        baseCargoCapacity: 150,
        hitboxWidth: 45,
        hitboxHeight: 65,
        unlocked: false
    },
    cutter: {
        id: "cutter",
        name: "Cutter",
        description: "Very fast with the wind, excellent upwind performance, but fragile.",
        baseSpeed: 3.2,
        baseCargoCapacity: 90,
        hitboxWidth: 28,
        hitboxHeight: 48,
        // Add specific wind performance modifiers here
        unlocked: false
    }
    // Add more vessel types as needed
};

function getVesselData(vesselId) {
    return vessels[vesselId] || null;
}

function getUnlockedVessels() {
    return Object.values(vessels).filter(v => v.unlocked);
}

// Function to potentially unlock vessels based on game progress (call this from game logic)
function checkVesselUnlocks(gameProgress) {
    // Example unlock condition
    if (gameProgress.totalCargoDelivered >= 1000 && !vessels.brigantine.unlocked) {
        vessels.brigantine.unlocked = true;
        console.log("Unlocked Brigantine!");
        // Add feedback to the player
    }
    // Add more unlock conditions for other vessels
}
