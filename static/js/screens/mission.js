// Logic for the core gameplay mission screen
console.log("Mission screen loaded.");

// --- Mission State ---
let missionActive = false;
let currentMap = null; // Holds the map data for the current mission {width, height, start, end, land}
let currentRouteInfo = null; // Store route name, multiplier etc.
let enemySpawnTimer = 0; // Timer for spawning new enemies
let currentEnemySpawnInterval = 3000; // Default spawn interval, will be overridden by mission
const MAX_ENEMIES = 12;

// --- Game Objects ---
let player = {}; // Will be initialized in startMission { x, y, vx, vy, angle, targetAngle, turnRate, acceleration, friction, maxSpeed, ... }
let projectiles = []; // Array to hold projectile objects {x, y, vx, vy, radius, owner: 'player' | 'enemy'}
let enemies = []; // Array for pirate ship enemies {x, y, width, height, speed, angle, cargo(hp), shootTimer, shootCooldown, ...}
let hazards = []; // Keep for potential reefs/storms later
let wind = { direction: Math.PI / 4, speed: 1.5 }; // Example: wind blowing down-right, increased speed for effect

// --- Physics Constants ---
const PLAYER_ACCELERATION = 0.05; // How fast the player speeds up
const PLAYER_FRICTION = 0.98; // Multiplier for velocity decay (closer to 1 = less friction)
const PLAYER_TURN_RATE = 0.04; // Radians per update step
const PLAYER_MAX_SPEED = 4; // Maximum speed magnitude
const WIND_FORCE_FACTOR = 0.02; // How much wind pushes the ship

// --- Camera ---
let camera = {
    x: 0,
    y: 0,
    width: 0, // Set dynamically based on canvas size
    height: 0, // Set dynamically based on canvas size
    target: null, // Usually the player
    lag: 0.1 // How quickly the camera follows the target (0=instant, 1=never)
};

// --- Input Handling (Remains the same) ---
const keys = {
    ArrowUp: false,
    ArrowDown: false, // Could be used for braking/reverse later
    ArrowLeft: false,
    ArrowRight: false
};

window.addEventListener('keydown', (e) => {
    if (gameState === 'Mission' && keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (gameState === 'Mission' && keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
});

// Function to reset state variables before a new mission starts
function resetMissionState() {
    missionActive = false;
    currentMap = null;
    currentRouteInfo = null;
    projectileSpawnTimer = 0;
    enemySpawnTimer = 0;
    projectiles = [];
    enemies = [];
    hazards = [];
    player = {}; // Reset player object completely
    camera = { x: 0, y: 0, width: camera.width, height: camera.height, target: null, lag: 0.1 };
    console.log("Mission state reset.");
}

// --- Game Logic Update ---
function updateMission(canvas) {
    const deltaTime = 1 / 60; // Assuming 60 FPS for physics step time

    if (!missionActive || !player.x || !currentMap) {
        return;
    }

    // --- Player Control Input ---
    let turnDirection = 0;
    if (keys.ArrowLeft) turnDirection -= 1;
    if (keys.ArrowRight) turnDirection += 1;

    let accelerationInput = 0;
    if (keys.ArrowUp) accelerationInput = 1;
    // if (keys.ArrowDown) accelerationInput = -0.5; // Optional braking/reverse

    // --- Player Turning ---
    // Adjust target angle based on input
    player.targetAngle += turnDirection * player.turnRate; // Adjust target angle directly

    // Smoothly interpolate current angle towards target angle
    let angleDiff = player.targetAngle - player.angle;
    // Normalize angle difference to be between -PI and PI
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    // Apply turn, but don't overshoot the target
    const turnAmount = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), player.turnRate * getUpgradeEffect('maneuverability')); // Use maneuverability upgrade
    player.angle += turnAmount;
    // Keep angle within 0 to 2*PI range (optional, atan2 handles it)
    // player.angle = (player.angle + 2 * Math.PI) % (2 * Math.PI);

    // --- Player Acceleration & Forces ---
    let currentAcceleration = accelerationInput * player.acceleration * getUpgradeEffect('maneuverability'); // Use maneuverability

    // Calculate acceleration vector based on player angle (direction ship is pointing)
    let accX = Math.cos(player.angle) * currentAcceleration;
    let accY = Math.sin(player.angle) * currentAcceleration;

    // Apply Wind Force
    const windAngle = wind.direction;
    const windSpeed = wind.speed;
    // Calculate angle difference between wind and ship's facing direction
    const windShipAngleDiff = Math.atan2(Math.sin(windAngle - player.angle), Math.cos(windAngle - player.angle));
    // Effectiveness based on angle (max sideways/behind, min headwind) - cosine is simple approx
    const windEffectiveness = (1 + Math.cos(windShipAngleDiff)) / 2; // 0 to 1
    const effectiveWindForce = windSpeed * windEffectiveness * WIND_FORCE_FACTOR * player.windEfficiencyFactor; // Use wind upgrade

    const windForceX = Math.cos(windAngle) * effectiveWindForce;
    const windForceY = Math.sin(windAngle) * effectiveWindForce;

    // --- Update Velocity ---
    player.vx += accX + windForceX;
    player.vy += accY + windForceY;

    // Apply Friction (acts against current velocity)
    player.vx *= player.friction;
    player.vy *= player.friction;

    // Cap Speed
    const currentSpeed = Math.hypot(player.vx, player.vy);
    if (currentSpeed > player.maxSpeed) {
        const capFactor = player.maxSpeed / currentSpeed;
        player.vx *= capFactor;
        player.vy *= capFactor;
    }

    // --- Update Position ---
    let nextX = player.x + player.vx;
    let nextY = player.y + player.vy;

    // --- Collision with Map Boundaries ---
    if (nextX - player.width / 2 < 0 || nextX + player.width / 2 > currentMap.width) {
        player.vx *= -0.5; // Lose some speed on impact
        nextX = Math.max(player.width / 2, Math.min(currentMap.width - player.width / 2, nextX)); // Clamp position
    }
    if (nextY - player.height / 2 < 0 || nextY + player.height / 2 > currentMap.height) {
        player.vy *= -0.5; // Lose some speed on impact
        nextY = Math.max(player.height / 2, Math.min(currentMap.height - player.height / 2, nextY)); // Clamp position
    }

    // --- Collision with Land (Simplified: Stop and Dampen Velocity) ---
    let collidedWithLand = false;
    const playerNextRect = {
        left: nextX - player.width / 2, right: nextX + player.width / 2,
        top: nextY - player.height / 2, bottom: nextY + player.height / 2
    };
    for (const landRect of currentMap.land) {
        const land = { left: landRect.x, right: landRect.x + landRect.width, top: landRect.y, bottom: landRect.y + landRect.height };
        if (playerNextRect.right > land.left && playerNextRect.left < land.right &&
            playerNextRect.bottom > land.top && playerNextRect.top < land.bottom) {
            collidedWithLand = true;
            break;
        }
    }

    if (collidedWithLand) {
        // Simple response: Stop movement for this frame, drastically reduce velocity
        player.vx *= 0.5;
        player.vy *= 0.5;
        // Keep player at current position instead of nextX/nextY
    } else {
        // Apply position update if no collision
        player.x = nextX;
        player.y = nextY;
    }

    // --- Projectile Movement & Removal ---
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.vx;
        p.y += p.vy;
        const margin = 100;
        if (p.x < -margin || p.x > currentMap.width + margin || p.y < -margin || p.y > currentMap.height + margin) {
            projectiles.splice(i, 1);
        }
    }

    // --- Enemy Spawning ---
    enemySpawnTimer -= (deltaTime * 1000); // Convert deltaTime seconds to ms for timer
    if (enemies.length < MAX_ENEMIES && enemySpawnTimer <= 0) {
        spawnEnemy(canvas);
        enemySpawnTimer = currentEnemySpawnInterval; // Use mission-specific interval
    }

    // --- Enemy Update (Still uses simple movement for now) ---
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        const dxToPlayer = player.x - enemy.x;
        const dyToPlayer = player.y - enemy.y;
        const distToPlayer = Math.hypot(dxToPlayer, dyToPlayer);
        const enemyMoveSpeed = enemy.speed;

        let enemyMoveX = 0;
        let enemyMoveY = 0;

        if (distToPlayer > 5) {
             enemyMoveX = (dxToPlayer / distToPlayer) * enemyMoveSpeed;
             enemyMoveY = (dyToPlayer / distToPlayer) * enemyMoveSpeed;
             enemy.angle = Math.atan2(enemyMoveY, enemyMoveX); // Update angle based on movement
        }

        let enemyNextX = enemy.x + enemyMoveX;
        let enemyNextY = enemy.y + enemyMoveY;

        // Enemy Collision with Map Boundaries
        enemyNextX = Math.max(enemy.width / 2, Math.min(currentMap.width - enemy.width / 2, enemyNextX));
        enemyNextY = Math.max(enemy.height / 2, Math.min(currentMap.height - enemy.height / 2, enemyNextY));

        // --- Enemy Collision with Land (Restored Correct Logic) ---
        let enemyCollidedX = false;
        let enemyCollidedY = false;

        // Check X-axis collision for enemy
        const enemyNextRectX = {
            left: enemyNextX - enemy.width / 2, right: enemyNextX + enemy.width / 2,
            top: enemy.y - enemy.height / 2, bottom: enemy.y + enemy.height / 2
        };
        for (const landRect of currentMap.land) {
            const land = { left: landRect.x, right: landRect.x + landRect.width, top: landRect.y, bottom: landRect.y + landRect.height };
            if (enemyNextRectX.right > land.left && enemyNextRectX.left < land.right &&
                enemyNextRectX.bottom > land.top && enemyNextRectX.top < land.bottom) {
                enemyCollidedX = true;
                break;
            }
        }

        // Check Y-axis collision for enemy
        const enemyNextRectY = {
            left: enemy.x - enemy.width / 2, right: enemy.x + enemy.width / 2,
            top: enemyNextY - enemy.height / 2, bottom: enemyNextY + enemy.height / 2
        };
        for (const landRect of currentMap.land) {
            const land = { left: landRect.x, right: landRect.x + landRect.width, top: landRect.y, bottom: landRect.y + landRect.height };
            if (enemyNextRectY.right > land.left && enemyNextRectY.left < land.right &&
                enemyNextRectY.bottom > land.top && enemyNextRectY.top < land.bottom) {
                enemyCollidedY = true;
                break;
            }
        }

        // Apply final enemy position with basic avoidance
        if (enemyCollidedX && !enemyCollidedY) {
            // Hit land horizontally, allow vertical movement if possible
            enemy.y = enemyNextY;
        } else if (!enemyCollidedX && enemyCollidedY) {
            // Hit land vertically, allow horizontal movement if possible
            enemy.x = enemyNextX;
        } else if (!enemyCollidedX && !enemyCollidedY) {
            // No collision, move normally
            enemy.x = enemyNextX;
            enemy.y = enemyNextY;
        }
        // If both collided, enemy doesn't move this frame.

        // Shooting
        enemy.shootTimer -= (deltaTime * 1000); // Convert deltaTime seconds to ms
        if (enemy.shootTimer <= 0) {
            if (distToPlayer < 600) {
                 spawnEnemyProjectile(enemy);
                 enemy.shootTimer = enemy.shootCooldown;
            } else {
                 enemy.shootTimer = 500; // Wait a bit longer if player is far
            }
        }
    }

    // --- Camera Update ---
    updateCamera(canvas);

    // --- Collision Detection ---
    checkCollisions();

}

// --- Rendering (Rotation already implemented) ---
function renderMission(ctx) {
    if (!missionActive || !player.x || !currentMap) return;

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Draw Map Elements (Ocean, Land, End Zone)
    ctx.fillStyle = '#0077be';
    ctx.fillRect(0, 0, currentMap.width, currentMap.height);
    ctx.fillStyle = '#8B4513';
    currentMap.land.forEach(rect => ctx.fillRect(rect.x, rect.y, rect.width, rect.height));
    ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.beginPath(); ctx.arc(currentMap.end.x, currentMap.end.y, 50, 0, Math.PI * 2); ctx.fill();

    // Draw Player Ship (Rotated)
    ctx.save();
    ctx.translate(player.x, player.y);
    // Rotate based on player.angle (pointing direction), add PI/2 if sprite faces up
    ctx.rotate(player.angle + Math.PI / 2);
    ctx.fillStyle = 'brown'; // Hull
    ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
    ctx.fillStyle = 'white'; // Sail
    ctx.beginPath(); ctx.moveTo(0, -player.height / 2); ctx.lineTo(-player.width / 2, player.height / 4); ctx.lineTo(player.width / 2, player.height / 4); ctx.closePath(); ctx.fill();
    ctx.restore();

    // Draw Enemies (Rotated)
    ctx.fillStyle = 'darkred';
    enemies.forEach(enemy => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.angle + Math.PI / 2); // Rotate based on enemy.angle
        ctx.fillRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);
        // TODO: Add a simple sail/indicator for enemies too?
        ctx.restore();
    });

    // Draw Projectiles
    projectiles.forEach(p => {
        ctx.fillStyle = p.owner === 'player' ? 'yellow' : 'red';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // Restore Context for UI
    ctx.restore();

    // Draw UI (Fixed Position)
    ctx.fillStyle = 'white';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Cargo: ${player.cargo}/${player.maxCargo}`, 20, 30);
    ctx.fillText(`Route: ${currentRouteInfo?.name || 'Unknown'}`, 20, 60);
    const dist = player.x && currentMap.end.x ? Math.hypot(currentMap.end.x - player.x, currentMap.end.y - player.y) : 0;
    ctx.fillText(`Distance: ${Math.round(dist)}`, 20, 90);
    ctx.fillText(`Enemies: ${enemies.length}`, 20, 120);
    // Display Speed (for debugging/interest)
    const playerSpeed = Math.hypot(player.vx, player.vy);
    ctx.fillText(`Speed: ${playerSpeed.toFixed(1)}`, 20, 150);


    // Draw Wind Indicator
    ctx.save();
    ctx.translate(ctx.canvas.width - 50, 50);
    ctx.rotate(wind.direction);
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(20, 0); ctx.lineTo(0, 15); ctx.closePath(); ctx.fill();
    ctx.restore();

    // Draw Target Indicator
    if (currentMap && currentMap.end && player.x) {
        const targetAngle = Math.atan2(currentMap.end.y - player.y, currentMap.end.x - player.x);
        const canvasCenterX = ctx.canvas.width / 2;
        const canvasCenterY = ctx.canvas.height / 2;
        const targetScreenX = currentMap.end.x - camera.x;
        const targetScreenY = currentMap.end.y - camera.y;
        if (targetScreenX < 0 || targetScreenX > camera.width || targetScreenY < 0 || targetScreenY > camera.height) {
            const indicatorDist = Math.min(canvasCenterX, canvasCenterY) - 30;
            const indicatorX = canvasCenterX + Math.cos(targetAngle) * indicatorDist;
            const indicatorY = canvasCenterY + Math.sin(targetAngle) * indicatorDist;
            ctx.save();
            ctx.translate(indicatorX, indicatorY);
            ctx.rotate(targetAngle);
            ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
            ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(-10, -8); ctx.lineTo(-10, 8); ctx.closePath(); ctx.fill();
            ctx.restore();
        }
    }
}

// --- Camera Update Function ---
function updateCamera(canvas) {
    if (!camera.target || !currentMap) return;

    const targetX = camera.target.x - canvas.width / 2;
    const targetY = camera.target.y - canvas.height / 2;

    camera.x += (targetX - camera.x) * camera.lag;
    camera.y += (targetY - camera.y) * camera.lag;

    const camMaxX = Math.max(0, currentMap.width - canvas.width);
    const camMaxY = Math.max(0, currentMap.height - canvas.height);
    camera.x = Math.max(0, Math.min(camMaxX, camera.x));
    camera.y = Math.max(0, Math.min(camMaxY, camera.y));

    camera.width = canvas.width;
    camera.height = canvas.height;
}

// --- Projectile Add Function ---
function addProjectile(x, y, vx, vy, radius = 5, owner = 'enemy') {
    projectiles.push({ x, y, vx, vy, radius, owner });
}

// --- Mission Initialization ---
function startMission(vesselId, route) {
    console.log(`Starting mission: ${route.name} with ${vesselId}`);
    if (!route.map || !route.map.start || !route.map.end || !route.map.land) {
        console.error("Route is missing map data (width, height, start, end, land):", route);
        changeState('Port');
        return;
    }
    resetMissionState();

    currentMap = route.map;
    currentRouteInfo = { name: route.name, difficulty: route.difficulty, rewardMultiplier: route.rewardMultiplier };
    // Set the spawn interval for this mission, use route data or default
    currentEnemySpawnInterval = route.enemySpawnInterval || 3000; // Default to 3000ms if not specified
    enemySpawnTimer = currentEnemySpawnInterval / 2; // Start the first spawn timer

    const vesselData = getVesselData(vesselId);
    const cargoCapacityUpgrade = getUpgradeEffect('cargoCapacity');
    const maneuverabilityUpgrade = getUpgradeEffect('maneuverability') || 1; // Default to 1
    const hitboxUpgrade = getUpgradeEffect('hitboxReduction');
    const hullIntegrityUpgrade = getUpgradeEffect('hullIntegrity');
    const windEfficiencyUpgrade = getUpgradeEffect('windEfficiency');

    player = {
        x: currentMap.start.x,
        y: currentMap.start.y,
        vx: 0, // Initial velocity X
        vy: 0, // Initial velocity Y
        angle: -Math.PI / 2, // Initial angle (e.g., facing up)
        targetAngle: -Math.PI / 2, // Initial target angle matches initial angle
        width: vesselData.hitboxWidth * hitboxUpgrade,
        height: vesselData.hitboxHeight * hitboxUpgrade,
        // Base stats from constants, modified by upgrades/vesselData
        acceleration: PLAYER_ACCELERATION * maneuverabilityUpgrade, // Acceleration affected by maneuverability
        friction: PLAYER_FRICTION, // Base friction (could be vessel specific later)
        turnRate: PLAYER_TURN_RATE * maneuverabilityUpgrade, // Turn rate affected by maneuverability
        maxSpeed: PLAYER_MAX_SPEED * maneuverabilityUpgrade, // Max speed affected by maneuverability
        // Other stats
        maxCargo: cargoCapacityUpgrade ? cargoCapacityUpgrade : vesselData.baseCargoCapacity,
        cargo: cargoCapacityUpgrade ? cargoCapacityUpgrade : vesselData.baseCargoCapacity,
        hullIntegrityFactor: hullIntegrityUpgrade || 1,
        windEfficiencyFactor: windEfficiencyUpgrade || 1,
    };
    // TODO: Potentially modify friction based on vesselData?

    camera.target = player;
    const currentCanvas = typeof canvas !== 'undefined' ? canvas : { width: 800, height: 600 };
    camera.width = currentCanvas.width;
    camera.height = currentCanvas.height;
    const camMaxX = Math.max(0, currentMap.width - camera.width);
    const camMaxY = Math.max(0, currentMap.height - camera.height);
    camera.x = Math.max(0, Math.min(camMaxX, player.x - camera.width / 2));
    camera.y = Math.max(0, Math.min(camMaxY, player.y - camera.height / 2));

    missionActive = true;
    Object.keys(keys).forEach(key => keys[key] = false);
    console.log("Mission started with physics model. Player:", player);
}

// --- Collision Detection ---
function checkCollisions() {
    if (!player.x || !currentMap) return;

    // AABB approximation for player collision checks
    const playerRect = {
        left: player.x - player.width / 2, right: player.x + player.width / 2,
        top: player.y - player.height / 2, bottom: player.y + player.height / 2
    };

    // 1. Player vs Enemy Projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        if (p.owner === 'enemy') {
            const closestX = Math.max(playerRect.left, Math.min(p.x, playerRect.right));
            const closestY = Math.max(playerRect.top, Math.min(p.y, playerRect.bottom));
            const distanceX = p.x - closestX;
            const distanceY = p.y - closestY;
            const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

            if (distanceSquared < (p.radius * p.radius)) {
                projectiles.splice(i, 1);
                const cargoLoss = 10 / player.hullIntegrityFactor;
                player.cargo -= Math.round(cargoLoss);
                console.log(`Hit by enemy! Cargo left: ${player.cargo}`);
                // Small nudge from projectile
                player.vx += (p.vx * 0.05);
                player.vy += (p.vy * 0.05);
                if (player.cargo <= 0) {
                    player.cargo = 0;
                    endMission(false);
                    return;
                }
            }
        }
    }

    // 4. Player vs End Zone
    const endZoneRadius = 50;
    const distToEndSq = Math.pow(currentMap.end.x - player.x, 2) + Math.pow(currentMap.end.y - player.y, 2);
    if (distToEndSq < Math.pow(endZoneRadius + Math.max(player.width, player.height) / 2, 2)) {
        console.log("Reached Destination!");
        endMission(true);
        return;
    }

    // 6. Player vs Enemy Ship (AABB approximation)
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        // Define enemyRect for the check
        const enemyRect = {
            left: enemy.x - enemy.width / 2, right: enemy.x + enemy.width / 2,
            top: enemy.y - enemy.height / 2, bottom: enemy.y + enemy.height / 2
        };

        // Perform AABB collision check
        if (playerRect.right > enemyRect.left && playerRect.left < enemyRect.right &&
            playerRect.bottom > enemyRect.top && playerRect.top < enemyRect.bottom) {
            console.log("Player collided with enemy ship!");
            const cargoLoss = 5 / player.hullIntegrityFactor;
            player.cargo -= Math.round(cargoLoss);

            // Physics-based response: Apply impulse away from collision point
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const dist = Math.hypot(dx, dy) || 1; // Avoid division by zero
            const impulseStrength = 0.5; // How hard they bounce off
            player.vx += (dx / dist) * impulseStrength;
            player.vy += (dy / dist) * impulseStrength;
            // Optionally apply impulse to enemy too if they have physics (they don't currently)
            // enemy.vx -= (dx / dist) * impulseStrength;
            // enemy.vy -= (dy / dist) * impulseStrength;

            if (player.cargo <= 0) {
                player.cargo = 0;
                endMission(false);
                return;
            }
        }
    }
}

// --- Projectile Spawning ---
function spawnEnemyProjectile(enemy) {
    if (!player.x) return;

    const projectileSpeed = 4;
    // Aiming logic remains the same (towards player)
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const aimAngle = Math.atan2(dy, dx);
    const vx = Math.cos(aimAngle) * projectileSpeed;
    const vy = Math.sin(aimAngle) * projectileSpeed;

    // Spawn projectile slightly ahead based on enemy's *current* angle
    const spawnDist = enemy.height / 2 + 5; // Distance from center
    // Use enemy.angle (facing direction) + PI/2 (since sprite faces up)
    const spawnAngle = enemy.angle + Math.PI / 2;
    const spawnX = enemy.x + Math.cos(spawnAngle) * spawnDist;
    const spawnY = enemy.y + Math.sin(spawnAngle) * spawnDist;

    addProjectile(spawnX, spawnY, vx, vy, 5, 'enemy');
}

// --- Enemy Spawning ---
function spawnEnemy(canvas) {
    if (!currentMap || !camera.width) return;
    // Spawn location logic
    const spawnMargin = 100;
    let spawnX, spawnY;
    const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left

    switch (edge) {
        case 0: // Top
            spawnX = camera.x + Math.random() * camera.width;
            spawnY = camera.y - spawnMargin;
            break;
        case 1: // Right
            spawnX = camera.x + camera.width + spawnMargin;
            spawnY = camera.y + Math.random() * camera.height;
            break;
        case 2: // Bottom
            spawnX = camera.x + Math.random() * camera.width;
            spawnY = camera.y + camera.height + spawnMargin;
            break;
        case 3: // Left
            spawnX = camera.x - spawnMargin;
            spawnY = camera.y + Math.random() * camera.height;
            break;
    }

    spawnX = Math.max(50, Math.min(currentMap.width - 50, spawnX));
    spawnY = Math.max(50, Math.min(currentMap.height - 50, spawnY));

    const enemy = {
        x: spawnX, y: spawnY,
        width: 35, height: 50,
        speed: 1 + Math.random() * 0.5, // Speed for simple AI model
        cargo: 50, // Enemy health
        shootTimer: 2000 + Math.random() * 1000,
        shootCooldown: 2500 + Math.random() * 1500,
        angle: Math.random() * 2 * Math.PI // Random initial angle
    };
    enemies.push(enemy);
    console.log("Spawned enemy:", enemy);
}

// --- Mission End ---
function endMission(success) {
    missionActive = false;
    const currencyEarned = success ? Math.round(player.cargo * (currentRouteInfo?.rewardMultiplier || 1)) : 0;
    const message = success ? `Mission Complete! Earned ${currencyEarned} G` : "Mission Failed - Out of Cargo!";
    console.log(message);

    const resultData = {
        currencyEarned: currencyEarned,
        message: message
    };

    // Reset state AFTER calculating rewards etc.
    resetMissionState();

    if (success) {
        changeState('Port', { missionResult: resultData });
    } else {
        changeState('GameOver', { missionResult: resultData });
    }
}
