// Main game logic, canvas setup, game loop, state management
console.log("Game script loaded.");

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);

// Initial setup
resizeCanvas();

// --- Game State ---
let gameState = 'MainMenu'; // MainMenu, VesselSelection, Port, Mission, GameOver
let selectedVesselId = null;
let playerCurrency = 50; // Starting currency
let missionResult = null; // To pass data back from mission

// --- State Management ---
function changeState(newState, data = {}) {
    console.log(`Changing state from ${gameState} to ${newState}`);
    gameState = newState;

    // Store data needed by the new state *before* changing gameState
    let missionDataToPass = null;
    if (newState === 'Mission') {
        // Ensure data contains the selected route object and vessel ID BEFORE proceeding
        if (!data || !data.route || !data.vesselId) {
            console.error("Cannot start mission: Route or Vessel ID missing in data.", data);
            // Don't change state, effectively cancelling the transition.
            // The calling code (e.g., in port.js) should handle this failure if needed.
            return; // Stop the state change process here
        }
        missionDataToPass = { route: data.route, vesselId: data.vesselId };
        // Reset mission-specific data *before* starting
        missionResult = null;
        // Clear potentially stale mission state in mission.js
        if (typeof resetMissionState === 'function') {
            resetMissionState();
        }
    }

    // Change the state
    gameState = newState;

    // Handle data passing *after* state change
    if (gameState === 'Port') {
        selectedVesselId = data.vesselId || selectedVesselId; // Keep vessel if returning from mission
        if (data.missionResult) {
            playerCurrency += data.missionResult.currencyEarned || 0;
            console.log(`Mission ended. Currency: ${playerCurrency}`);
            // Potentially check for vessel unlocks here
            // checkVesselUnlocks({ totalCargoDelivered: playerCurrency }); // Example progress metric
        }
    } else if (gameState === 'Mission' && missionDataToPass) {
        // Call startMission directly with the prepared data
        if (typeof startMission === 'function') {
            startMission(missionDataToPass.vesselId, missionDataToPass.route);
        } else {
            console.error("startMission function not found!");
            changeState('Port'); // Fail back to port
        }
    } else if (gameState === 'GameOver') {
        missionResult = data.missionResult || { message: "Unknown Failure" };
    } else if (gameState === 'MainMenu') {
        // Reset for a new game run
        selectedVesselId = null;
        playerCurrency = 50;
        // Reset upgrades? Or keep persistence? For now, keep upgrades persistent.
        // Object.values(upgrades).forEach(u => u.currentLevel = 0);
    }

    // Reset click handlers specific to the previous state if necessary
    canvas.onclick = null;
}

// --- Main Menu ---
function renderMainMenu(ctx) {
    ctx.fillStyle = '#005080'; // Darker blue
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sailite', canvas.width / 2, canvas.height / 2 - 50);
    ctx.font = '24px sans-serif';
    // Simple clickable area
    const startButton = { x: canvas.width / 2 - 100, y: canvas.height / 2 + 10, width: 200, height: 40 };
    ctx.fillStyle = 'lightgray';
    ctx.fillRect(startButton.x, startButton.y, startButton.width, startButton.height);
    ctx.fillStyle = 'black';
    ctx.fillText('Click to Start', canvas.width / 2, canvas.height / 2 + 35);

    // Add click listener for this state
    canvas.onclick = (event) => {
        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        if (clickX >= startButton.x && clickX <= startButton.x + startButton.width &&
            clickY >= startButton.y && clickY <= startButton.y + startButton.height) {
            changeState('VesselSelection');
        }
    };
}

// --- Game Over Screen ---
function renderGameOver(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'red';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 50);
    ctx.fillStyle = 'white';
    ctx.font = '24px sans-serif';
    ctx.fillText(missionResult?.message || "You lost your cargo!", canvas.width / 2, canvas.height / 2);
    ctx.fillText('Click to return to Main Menu', canvas.width / 2, canvas.height / 2 + 50);

    canvas.onclick = () => {
        changeState('MainMenu');
    };
}


// --- Game Loop ---
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and render based on gameState
    switch (gameState) {
        case 'MainMenu':
            renderMainMenu(ctx);
            break;
        case 'VesselSelection':
            // Assumes renderVesselSelection handles its own input or calls setupVesselSelectionInput
            renderVesselSelection(ctx);
            break;
        case 'Port':
            // Assumes renderPort handles its own input or calls setupPortInput
            renderPort(ctx);
            break;
        case 'Mission':
            // Mission state handles its own input via event listeners added in mission.js
            updateMission(canvas); // Pass canvas for bounds checking etc.
            renderMission(ctx);
            break;
        case 'GameOver':
            renderGameOver(ctx);
            break;
    }

    requestAnimationFrame(gameLoop);
}

// --- Initial Setup ---
resizeCanvas(); // Initial size
// Start the game loop
requestAnimationFrame(gameLoop);
