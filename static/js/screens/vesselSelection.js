// Logic for the vessel selection screen
console.log("Vessel Selection screen loaded.");

let vesselButtons = []; // To store clickable areas for vessels

function renderVesselSelection(ctx) {
    ctx.fillStyle = 'lightblue';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = 'black';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Select Your Vessel', ctx.canvas.width / 2, 80);

    const unlockedVessels = getUnlockedVessels(); // From vessels.js
    vesselButtons = []; // Clear previous buttons
    const buttonWidth = 200;
    const buttonHeight = 120;
    const spacing = 40;
    const totalWidth = (buttonWidth + spacing) * unlockedVessels.length - spacing;
    let startX = (ctx.canvas.width - totalWidth) / 2;
    const startY = 150;

    unlockedVessels.forEach((vessel, index) => {
        const buttonX = startX + index * (buttonWidth + spacing);
        const button = {
            x: buttonX,
            y: startY,
            width: buttonWidth,
            height: buttonHeight,
            vesselId: vessel.id
        };
        vesselButtons.push(button);

        // Draw button background
        ctx.fillStyle = 'gray';
        ctx.fillRect(button.x, button.y, button.width, button.height);
        ctx.strokeStyle = 'black';
        ctx.strokeRect(button.x, button.y, button.width, button.height);

        // Draw vessel info
        ctx.fillStyle = 'white';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(vessel.name, button.x + button.width / 2, button.y + 30);

        ctx.font = '14px sans-serif';
        ctx.fillText(`Spd: ${vessel.baseSpeed}`, button.x + button.width / 2, button.y + 60);
        ctx.fillText(`Cargo: ${vessel.baseCargoCapacity}`, button.x + button.width / 2, button.y + 80);
        ctx.fillText(`Size: ${vessel.hitboxWidth}x${vessel.hitboxHeight}`, button.x + button.width / 2, button.y + 100);
    });

    // Setup click listener for this screen
    canvas.onclick = handleVesselSelectionClick;
}

function handleVesselSelectionClick(event) {
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    for (const button of vesselButtons) {
        if (clickX >= button.x && clickX <= button.x + button.width &&
            clickY >= button.y && clickY <= button.y + button.height) {
            console.log(`Selected vessel: ${button.vesselId}`);
            changeState('Port', { vesselId: button.vesselId }); // Pass selected vessel to Port state
            break;
        }
    }
}
