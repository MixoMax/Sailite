// Logic for the Port screen - selecting missions, viewing upgrades, etc.
console.log("Port screen loaded.");

// --- Port State ---
let selectedRouteIndex = 0;
let portButtons = []; // Array to hold button definitions { id, text, x, y, width, height, action }

// --- Route Data (with NEW Map Data) ---
const routes = [
    {
        name: "Coastal Dash",
        difficulty: 1,
        rewardMultiplier: 1.2,
        enemySpawnInterval: 4000, // Slower spawn for easier route (milliseconds)
        description: "A quick trip along the coast. Watch out for shallows!",
        map: {
            width: 1600,
            height: 1200,
            start: { x: 100, y: 100 },
            end: { x: 1400, y: 1000 },
            land: [
                { x: 0, y: 0, width: 50, height: 1200 }, // Left border
                { x: 1550, y: 0, width: 50, height: 1200 }, // Right border
                { x: 0, y: 0, width: 1600, height: 50 }, // Top border
                { x: 0, y: 1150, width: 1600, height: 50 }, // Bottom border
                { x: 400, y: 300, width: 150, height: 400 }, // Central island 1
                { x: 900, y: 600, width: 250, height: 150 }  // Central island 2
            ]
        }
    },
    {
        name: "Island Hopper",
        difficulty: 2,
        rewardMultiplier: 1.8,
        enemySpawnInterval: 3000, // Standard spawn rate
        description: "Navigate between several small islands. Pirates likely.",
        map: {
            width: 2000,
            height: 1500,
            start: { x: 150, y: 750 },
            end: { x: 1850, y: 750 },
            land: [
                { x: 0, y: 0, width: 50, height: 1500 }, // Left
                { x: 1950, y: 0, width: 50, height: 1500 }, // Right
                { x: 0, y: 0, width: 2000, height: 50 }, // Top
                { x: 0, y: 1450, width: 2000, height: 50 }, // Bottom
                { x: 500, y: 200, width: 100, height: 300 }, // Island NW
                { x: 1400, y: 200, width: 100, height: 300 }, // Island NE
                { x: 500, y: 1000, width: 100, height: 300 }, // Island SW
                { x: 1400, y: 1000, width: 100, height: 300 }, // Island SE
                { x: 900, y: 650, width: 200, height: 200 }  // Central Island
            ]
        }
    },
    {
        name: "The Serpent's Pass",
        difficulty: 3,
        rewardMultiplier: 2.5,
        enemySpawnInterval: 2200, // Faster spawn for harder route
        description: "A treacherous route through narrow channels. High risk, high reward.",
        map: {
            width: 2400,
            height: 1000,
            start: { x: 100, y: 500 },
            end: { x: 2300, y: 500 },
            land: [
                { x: 0, y: 0, width: 50, height: 1000 }, // Left
                { x: 2350, y: 0, width: 50, height: 1000 }, // Right
                { x: 0, y: 0, width: 2400, height: 50 }, // Top
                { x: 0, y: 950, width: 2400, height: 50 }, // Bottom
                { x: 400, y: 0, width: 100, height: 400 }, // Upper barrier 1
                { x: 400, y: 600, width: 100, height: 400 }, // Lower barrier 1
                { x: 900, y: 0, width: 100, height: 400 }, // Upper barrier 2
                { x: 900, y: 600, width: 100, height: 400 }, // Lower barrier 2
                { x: 1400, y: 0, width: 100, height: 400 }, // Upper barrier 3
                { x: 1400, y: 600, width: 100, height: 400 }, // Lower barrier 3
                { x: 1900, y: 0, width: 100, height: 400 }, // Upper barrier 4
                { x: 1900, y: 600, width: 100, height: 400 }  // Lower barrier 4
            ]
        }
    },
    {
        name: "Whispering Straits",
        difficulty: 3, // Higher difficulty due to navigation challenges
        rewardMultiplier: 2.2,
        enemySpawnInterval: 2500, // Moderately fast spawn
        description: "Navigate a winding strait between two large landmasses. Shifting winds and hidden reefs demand careful sailing.",
        map: {
            width: 2200,
            height: 1600,
            start: { x: 100, y: 1300 }, // Start bottom-leftish
            end: { x: 2100, y: 200 },   // End top-rightish
            land: [
                // --- Borders ---
                { x: 0, y: 0, width: 50, height: 1600 }, // Left border
                { x: 2150, y: 0, width: 50, height: 1600 }, // Right border
                // --- Top Landmass (composed of multiple parts) ---
                { x: 0, y: 0, width: 2200, height: 200 }, // Main top land strip
                { x: 300, y: 200, width: 400, height: 150 }, // Peninsula A1
                { x: 500, y: 350, width: 150, height: 100 }, // Peninsula A2 (extends A1)
                { x: 1000, y: 200, width: 600, height: 250 }, // Peninsula B1 (wider)
                { x: 1750, y: 200, width: 300, height: 100 }, // Peninsula C1
                // --- Bottom Landmass (composed of multiple parts) ---
                { x: 0, y: 1400, width: 2200, height: 200 }, // Main bottom land strip
                { x: 150, y: 1200, width: 350, height: 200 }, // Peninsula D1
                { x: 800, y: 1150, width: 700, height: 250 }, // Peninsula E1 (large central)
                { x: 1000, y: 1050, width: 300, height: 100 }, // Peninsula E2 (extends E1)
                { x: 1600, y: 1250, width: 400, height: 150 }, // Peninsula F1
                 // --- Obstacles within the strait ---
                { x: 700, y: 700, width: 100, height: 80 },  // Small island/reef 1
                { x: 1450, y: 850, width: 150, height: 120 }, // Small island/reef 2
                { x: 1100, y: 550, width: 70, height: 70 }    // Small island/reef 3 (near top land)
            ]
        }
    }
];

// --- UI Rendering ---
function renderPort(ctx) {
    // Background
    ctx.fillStyle = '#a0522d'; // Sienna brown, like a dock
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = 'white';
    ctx.font = '36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Port', canvas.width / 2, 60);

    // Currency Display
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Gold: ${playerCurrency} G`, canvas.width - 30, 40);

    // Selected Vessel Display (if applicable)
    if (selectedVesselId) {
        const vesselData = getVesselData(selectedVesselId);
        ctx.textAlign = 'left';
        ctx.fillText(`Vessel: ${vesselData.name}`, 30, 40);
    }

    // --- Route Selection Area ---
    const routeArea = { x: 50, y: 100, width: canvas.width / 2 - 75, height: canvas.height - 200 };
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(routeArea.x, routeArea.y, routeArea.width, routeArea.height);
    ctx.fillStyle = 'white';
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Available Routes', routeArea.x + routeArea.width / 2, routeArea.y + 40);

    // Display selected route details
    const selectedRoute = routes[selectedRouteIndex];
    ctx.font = '20px sans-serif';
    ctx.fillText(`Route: ${selectedRoute.name}`, routeArea.x + routeArea.width / 2, routeArea.y + 90);
    ctx.font = '16px sans-serif';
    ctx.fillText(`Difficulty: ${selectedRoute.difficulty}`, routeArea.x + routeArea.width / 2, routeArea.y + 120);
    ctx.fillText(`Reward Multiplier: x${selectedRoute.rewardMultiplier}`, routeArea.x + routeArea.width / 2, routeArea.y + 145);
    // Wrap description text
    wrapText(ctx, selectedRoute.description, routeArea.x + 20, routeArea.y + 180, routeArea.width - 40, 20);

    // --- Upgrade Area ---
    const upgradeArea = { x: canvas.width / 2 + 25, y: 100, width: canvas.width / 2 - 75, height: canvas.height - 200 };
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(upgradeArea.x, upgradeArea.y, upgradeArea.width, upgradeArea.height);
    ctx.fillStyle = 'white';
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Upgrades', upgradeArea.x + upgradeArea.width / 2, upgradeArea.y + 40);

    // Display Upgrades
    let upgradeY = upgradeArea.y + 80;
    const upgradeButtonHeight = 35;
    const upgradeSpacing = 15;
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';

    // Clear only upgrade buttons before re-adding them
    portButtons = portButtons.filter(b => !b.id.startsWith('upgrade_'));

    Object.entries(upgrades).forEach(([id, upgrade]) => {
        let costText = "Max Level";
        let cost = Infinity; // Set cost high if max level
        let canAfford = false;

        // Check if there is a next level
        if (upgrade.currentLevel < upgrade.levels.length) {
            cost = upgrade.levels[upgrade.currentLevel].cost;
            costText = `Cost: ${cost} G`;
            canAfford = playerCurrency >= cost;
        }

        const text = `${upgrade.name} (Lvl ${upgrade.currentLevel}) - ${costText}`;
        const buttonX = upgradeArea.x + 20;
        const buttonWidth = upgradeArea.width - 40;

        // Draw button background
        ctx.fillStyle = canAfford ? 'darkgreen' : 'gray'; // Green if affordable, gray otherwise
        ctx.fillRect(buttonX, upgradeY, buttonWidth, upgradeButtonHeight);

        // Draw button text
        ctx.fillStyle = 'white';
        ctx.fillText(text, buttonX + 10, upgradeY + upgradeButtonHeight / 2 + 5); // Adjust text position

        // Store button data for click handling ONLY if not max level
        if (upgrade.currentLevel < upgrade.levels.length) {
            const buttonData = {
                id: `upgrade_${id}`,
                text: text, // Store text for potential redraw/hover
                x: buttonX,
                y: upgradeY,
                width: buttonWidth,
                height: upgradeButtonHeight,
                action: () => attemptPurchaseUpgrade(id) // Pass the ID
            };
            portButtons.push(buttonData); // Add button to the list
        }


        upgradeY += upgradeButtonHeight + upgradeSpacing;
    });

    // --- Buttons (Static ones - add them after dynamic ones) ---
    const buttonWidth = 150;
    const buttonHeight = 40;
    const buttonY = canvas.height - 80;

    // Previous Route Button
    const prevButtonX = routeArea.x + routeArea.width / 2 - buttonWidth - 10;
    ctx.fillStyle = 'lightblue';
    ctx.fillRect(prevButtonX, buttonY, buttonWidth, buttonHeight);
    ctx.fillStyle = 'black';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Previous', prevButtonX + buttonWidth / 2, buttonY + buttonHeight / 2 + 5);
    // Add only if not already present (or manage updates better)
    if (!portButtons.some(b => b.id === 'prev_route')) {
        portButtons.push({ id: 'prev_route', text: 'Previous', x: prevButtonX, y: buttonY, width: buttonWidth, height: buttonHeight, action: selectPreviousRoute });
    }


    // Next Route Button
    const nextButtonX = routeArea.x + routeArea.width / 2 + 10;
    ctx.fillStyle = 'lightblue';
    ctx.fillRect(nextButtonX, buttonY, buttonWidth, buttonHeight);
    ctx.fillStyle = 'black';
    ctx.fillText('Next', nextButtonX + buttonWidth / 2, buttonY + buttonHeight / 2 + 5);
    if (!portButtons.some(b => b.id === 'next_route')) {
        portButtons.push({ id: 'next_route', text: 'Next', x: nextButtonX, y: buttonY, width: buttonWidth, height: buttonHeight, action: selectNextRoute });
    }

    // Start Mission Button
    const startButtonX = canvas.width / 2 - buttonWidth / 2; // Centered below both areas
    ctx.fillStyle = selectedVesselId ? 'lightgreen' : 'gray'; // Enable only if vessel selected
    ctx.fillRect(startButtonX, buttonY, buttonWidth, buttonHeight);
    ctx.fillStyle = 'black';
    ctx.fillText('Start Mission', startButtonX + buttonWidth / 2, buttonY + buttonHeight / 2 + 5);
     if (!portButtons.some(b => b.id === 'start_mission')) {
        portButtons.push({ id: 'start_mission', text: 'Start Mission', x: startButtonX, y: buttonY, width: buttonWidth, height: buttonHeight, action: startSelectedMission });
    }

    // Back to Vessel Selection Button
    const backButtonX = 30;
    const backButtonY = canvas.height - 60;
    ctx.fillStyle = 'orange';
    ctx.fillRect(backButtonX, backButtonY, buttonWidth, buttonHeight);
    ctx.fillStyle = 'black';
    ctx.fillText('Change Vessel', backButtonX + buttonWidth / 2, backButtonY + buttonHeight / 2 + 5);
    if (!portButtons.some(b => b.id === 'back_vessel')) {
        portButtons.push({ id: 'back_vessel', text: 'Change Vessel', x: backButtonX, y: backButtonY, width: buttonWidth, height: buttonHeight, action: () => changeState('VesselSelection') });
    }

    // Setup input handlers for this screen
    setupPortInput();
}

// --- Input Handling ---
function setupPortInput() {
    // Assign onclick only once per state entry if possible, or ensure it's idempotent
    if (canvas.onclick?.toString() !== portClickHandler.toString()) {
         canvas.onclick = portClickHandler;
    }
}

// Define the handler separately to avoid redefinition issues
const portClickHandler = (event) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Check click against all current buttons
    // Note: Button positions are based on the *last* render.
    // This is generally fine unless the layout changes drastically without a re-render cycle.
    for (const button of portButtons) {
        if (clickX >= button.x && clickX <= button.x + button.width &&
            clickY >= button.y && clickY <= button.y + button.height) {
            button.action();
            // Re-render immediately after action to reflect changes (like currency, upgrade level)
            // This might cause a flicker if the action itself triggers a state change.
            // Consider if re-rendering should happen in the game loop instead.
            // For now, immediate re-render for visual feedback on upgrade purchase.
            if (button.id.startsWith('upgrade_')) {
                 renderPort(ctx); // Re-render to show updated cost/level/currency
            }
            break; // Only activate one button per click
        }
    }
};


// --- Button Actions ---
function selectPreviousRoute() {
    selectedRouteIndex = (selectedRouteIndex - 1 + routes.length) % routes.length;
    console.log("Selected route:", routes[selectedRouteIndex].name);
    // No need to redraw here, the main loop handles it
}

function selectNextRoute() {
    selectedRouteIndex = (selectedRouteIndex + 1) % routes.length;
    console.log("Selected route:", routes[selectedRouteIndex].name);
    // No need to redraw here
}

function startSelectedMission() {
    if (!selectedVesselId) {
        console.log("No vessel selected!");
        // Optionally show a message to the player
        return;
    }
    const selectedRoute = routes[selectedRouteIndex];
    console.log(`Attempting to start mission: ${selectedRoute.name} with vessel ${selectedVesselId}`);
    // Pass the entire route object and the vessel ID
    changeState('Mission', { route: selectedRoute, vesselId: selectedVesselId });
}

function attemptPurchaseUpgrade(upgradeId) {
    const upgrade = upgrades[upgradeId];
    if (!upgrade) {
        console.error("Invalid upgrade ID:", upgradeId);
        return;
    }
    // Check if max level
    if (upgrade.currentLevel >= upgrade.levels.length) {
        console.log(`${upgrade.name} is already at max level.`);
        return;
    }

    const cost = upgrade.levels[upgrade.currentLevel].cost; // Get cost of the NEXT level

    if (playerCurrency >= cost) {
        playerCurrency -= cost;
        upgrade.currentLevel++;
        console.log(`Purchased ${upgrade.name}. New level: ${upgrade.currentLevel}. Currency left: ${playerCurrency}`);
        // The re-render is now handled in the click handler
    } else {
        console.log(`Not enough currency to purchase ${upgrade.name}. Need ${cost}, have ${playerCurrency}`);
        // Optionally show a message to the player
    }
}

// --- Helper Functions ---
function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    context.textAlign = 'center'; // Ensure text is centered within the area

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x + maxWidth / 2, currentY); // Draw the previous line centered
            line = words[n] + ' '; // Start new line
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    context.fillText(line, x + maxWidth / 2, currentY); // Draw the last line centered
    context.textAlign = 'left'; // Reset alignment if needed elsewhere
}
