import * as dom from './domElements.js';
import {
    state, setPlayerMoney, setActiveJokers, setShopItems,
    setPurchasedVouchers, setRerollCost, setFreeRerollUsedThisShop,
    setActiveConsumables, // Needed if Buffoon pack gives Tarot
    generateUniqueId // Import the ID generator
} from './state.js';
import {
    JOKER_POOL, MAX_JOKERS, PACKS, PROB_BUFFOON_PACK, JOKER_SELL_PRICE
} from './constants.js';
import {
    renderJokers, updateUI, renderConsumables, updatePurchasedVouchersDisplay,
    renderHand, updateDeckCount, showTooltip, showPackOpeningScreen // Needed for pack opening & tooltip
} from './ui.js';
import {
    getAvailableVoucher, applyVoucherEffects, usePlanetCard, getRandomPlanetCard,
    addConsumable, getRandomTarotCard, openStandardPack, hasVoucher, canBuyJoker
} from './items.js';

/**
 * Gets a random Joker definition that is not currently active.
 * @returns {object | null} A copy of a random available Joker object, or null if none are left.
 */
export function getRandomJoker() {
    // Filter out jokers that are already active (checking for null in activeJokers)
    const availableJokers = JOKER_POOL.filter(j =>
        !state.activeJokers.some(aj => aj && aj.id === j.id) // Add null check for aj
    );
    if (availableJokers.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * availableJokers.length);
    return { ...availableJokers[randomIndex] }; // Return a copy
}

/**
 * Populates the shop slots with new items (Jokers, Voucher, Packs).
 * Updates the display and enables/disables buy buttons based on cost and availability.
 * This function now handles the complete rendering and listener setup for shop slots.
 */
export function populateShop() {
    console.log("Populating shop...");
    const currentShopItems = { jokers: [null, null, null], voucher: null, packs: [null, null] };

    // --- Fetch New Items ---
    // Jokers
    for (let i = 0; i < 2; i++) { // Assuming first 2 slots are Jokers
        currentShopItems.jokers[i] = getRandomJoker();
    }
    // Packs
    currentShopItems.packs[0] = { ...PACKS.celestial }; // Slot 1: Celestial
    currentShopItems.packs[1] = Math.random() < PROB_BUFFOON_PACK ? { ...PACKS.buffoon } : { ...PACKS.standard }; // Slot 2: Buffoon/Standard
    // Voucher
    currentShopItems.voucher = getAvailableVoucher();

    // Store the newly fetched items in state
    setShopItems(currentShopItems);

    // --- Render All Slots Based on New State ---
    // Render Joker Slots
    dom.shopJokerSlots.forEach((slot, index) => {
        const item = state.shopItems.jokers[index];
        renderShopSlot(slot, item, "joker", index);
    });

    // Render Pack Slots
    dom.shopPackSlots.forEach((slot, index) => {
        const pack = state.shopItems.packs[index];
        renderShopSlot(slot, pack, "pack", index);
    });

    // Render Voucher Slot
    renderShopSlot(dom.shopVoucherSlot, state.shopItems.voucher, "voucher", -1);

    // --- Update Reroll Button and Money Display ---
    updateRerollButtonState();
    dom.shopPlayerMoneyEl.textContent = state.playerMoney;
}

/**
 * Renders a single shop slot (Joker, Pack, or Voucher).
 * Handles clearing, content, tooltip, click listener, and disabled state.
 * @param {HTMLElement} slot - The DOM element for the shop slot.
 * @param {object | null} item - The item object (Joker, Pack, Voucher) or null.
 * @param {string} type - The type of item ('joker', 'pack', 'voucher').
 * @param {number} index - The index within its category (for jokers/packs, -1 for voucher).
 */
function renderShopSlot(slot, item, type, index) {
    // --- Manage Listeners ---
    // Remove existing tooltip listener if we stored one previously
    if (slot._tooltipListener) {
        slot.removeEventListener("mouseover", slot._tooltipListener);
        slot._tooltipListener = null; // Clear the stored listener reference
    }

    // --- Clear Content & Reset ---
    slot.innerHTML = ""; // Clear content
    slot.onclick = null; // Clear click listener
    slot.classList.remove("disabled"); // Reset disabled state

    // --- Render Item ---
    if (item) {
        slot.textContent = `${item.name} ($${item.cost})`;
        let tooltipText = `<strong>${item.name}</strong>\n${item.description}`;
        let canBuy = true;

        // Specific checks based on type
        console.log(state.activeJokers);
        if (type === "joker" && !canBuyJoker()) {
            tooltipText += "\n\n<em>Cannot buy: Joker slots full</em>";
            canBuy = false;
        }
        if (state.playerMoney < item.cost) {
            tooltipText += `\n\n<em>Cannot buy: Need $${item.cost}</em>`;
            canBuy = false;
        }
        if (canBuy) {
            tooltipText += "\n\n<em>Click to buy</em>";
        }

        // Define the new listener function
        const tooltipListener = (event) => {
            showTooltip(tooltipText, event, slot);
        };

        // Add new tooltip listener and store a reference to it on the element
        slot.addEventListener("mouseover", tooltipListener);
        slot._tooltipListener = tooltipListener;

        if (canBuy) {
            slot.onclick = () => buyItem(item, type, index, slot);
        } else {
            slot.classList.add("disabled");
        }
    } else {
        // Set placeholder text based on type/index
        if (type === 'joker') {
            slot.textContent = index < 2 ? "[No Jokers Left]" : "[Shop Slot]";
        } else if (type === 'pack') {
            slot.textContent = "[Pack Slot]";
        } else if (type === 'voucher') {
            slot.textContent = "[No Vouchers Left]";
        } else {
            slot.textContent = "[Empty]";
        }
        slot.classList.add("disabled");
    }
}

/**
 * Updates the display and availability (onclick, disabled class, tooltip) of shop items
 * based on the current state.shopItems and state.playerMoney, without fetching new items.
 * This is called after buying an item or selling a joker.
 */
function updateShopAvailability() {
    // Re-render all slots based on the *current* state.shopItems
    // This ensures availability checks (money, joker slots) are re-evaluated

    // Update Joker Slots
    dom.shopJokerSlots.forEach((slot, index) => {
        const item = state.shopItems.jokers[index];
        // Only re-render if the slot wasn't marked as purchased
        if (slot.textContent !== "[Purchased]") {
            renderShopSlot(slot, item, "joker", index);
        }
    });

    // Update Pack Slots
    dom.shopPackSlots.forEach((slot, index) => {
        const pack = state.shopItems.packs[index];
        if (slot.textContent !== "[Purchased]") {
            renderShopSlot(slot, pack, "pack", index);
        }
    });

    // Update Voucher Slot
    const voucher = state.shopItems.voucher;
    const voucherSlot = dom.shopVoucherSlot;
    if (voucherSlot.textContent !== "[Purchased]") {
        renderShopSlot(voucherSlot, voucher, "voucher", -1);
    }

    // Update Reroll Button State
    updateRerollButtonState();

    // Update shop money display
    dom.shopPlayerMoneyEl.textContent = state.playerMoney;
}

/**
 * Updates the state and text of the reroll button.
 */
function updateRerollButtonState() {
    const freeRerollAvailable = hasVoucher("v_reroll") && !state.freeRerollUsedThisShop;
    if (freeRerollAvailable) {
        dom.rerollCostEl.textContent = "0"; // Show cost as 0
        dom.rerollBtn.disabled = false;
        dom.rerollBtn.textContent = "Reroll (Free)";
    } else {
        dom.rerollCostEl.textContent = state.rerollCost;
        dom.rerollBtn.disabled = state.playerMoney < state.rerollCost;
        dom.rerollBtn.textContent = `Reroll ($${state.rerollCost})`;
    }
}

/**
 * Handles the purchase of an item from the shop.
 * @param {object} item - The item object being bought (Joker, Pack, Voucher).
 * @param {string} type - The type of item ('joker', 'pack', 'voucher').
 * @param {number} shopIndex - The index of the item in its shop category (for removal).
 * @param {HTMLElement} slotElement - The DOM element of the shop slot clicked.
 */
export async function buyItem(item, type, shopIndex, slotElement) { // Make async
    if (state.isAnimating) return; // Prevent buying during animations
    if (!item || state.playerMoney < item.cost) {
        console.log("Cannot buy item - insufficient funds or invalid item.");
        return;
    }

    let purchasedItemName = item.name; // For logging
    setPlayerMoney(state.playerMoney - item.cost);

    // --- Handle Purchase based on Type ---
    if (type === "joker") {
        if (!canBuyJoker()) {
            console.log("Cannot buy Joker - maximum Jokers reached.");
            alert("You have too many Jokers!");
            setPlayerMoney(state.playerMoney + item.cost); // Refund
            return; // Stop purchase
        }
        // Create a unique instance for the active jokers array
        const jokerInstance = { ...item };
        jokerInstance.id = generateUniqueId('joker'); // Assign a unique ID
        // Initialize currentValue for scaling jokers
        if (jokerInstance.effect.type === "scaling_mult") {
            jokerInstance.currentValue = 0; // Start scaling from 0
            console.log(`Initialized scaling value for ${jokerInstance.name}`);
        }
        let activeJokers = [...state.activeJokers];
        let added = false;
        for (let i = 0; i < activeJokers.length; i++) {
            if (activeJokers[i] === null) {
                activeJokers[i] = jokerInstance; // Fill the first empty slot
                added = true;
                break;
            }
        }

        if (!added && activeJokers.length < MAX_JOKERS) {
            activeJokers.push(jokerInstance); // Add to the end if no empty slots and space available
            added = true;
        }

        if (!added) {
             console.error("Failed to add joker even though canBuyJoker passed?");
             setPlayerMoney(state.playerMoney + item.cost); // Refund
             return;
        }


        setActiveJokers(activeJokers); // Update state with new joker
        renderJokers(); // Update joker display
        // Remove from shop state
        const newShopItems = { ...state.shopItems };
        newShopItems.jokers[shopIndex] = null;
        setShopItems(newShopItems);

    } else if (type === "pack") {
        // Remove from shop state first
        const newShopItems = { ...state.shopItems };
        newShopItems.packs[shopIndex] = null;
        setShopItems(newShopItems);

        // --- NEW Pack Opening Logic ---
        try {
            await showPackOpeningScreen(item); // Call the new UI function and wait for it
            console.log(`Finished opening ${item.name}`);
            // UI function should handle adding items/effects directly to state
        } catch (error) {
            console.error(`Error during pack opening UI for ${item.name}:`, error);
            // Handle potential errors or cancellations from the UI screen if necessary
            // Maybe refund the cost if the opening was cancelled? Depends on design.
            // For now, just log the error.
        }
        // --- End NEW Pack Opening Logic ---

        // --- OLD Logic (to be removed/replaced by showPackOpeningScreen implementation) ---
        /*
        let alertMessage = `Opened ${item.name} and found: `;

        // Handle different pack types
        if (item.type === "planet") {
            const cardsToAdd = [];
            for (let i = 0; i < item.contains; i++) cardsToAdd.push(getRandomPlanetCard());
            purchasedItemName = `${item.name} (Opened: ${cardsToAdd.map(c => c.name).join(", ")})`;
            cardsToAdd.forEach(planetCard => usePlanetCard(planetCard)); // usePlanetCard updates UI
            alertMessage += `${cardsToAdd.map(c => c.name).join(", ")}!`;
            alert(alertMessage);
        } else if (item.type === "tarot") {
            const cardsToAdd = [];
            for (let i = 0; i < item.contains; i++) cardsToAdd.push(getRandomTarotCard());
            purchasedItemName = `${item.name} (Opened: ${cardsToAdd.map(c => c.name).join(", ")})`;
            let addedSuccessfully = true;
            cardsToAdd.forEach(tarotCard => {
                if (!addConsumable(tarotCard)) { // addConsumable updates UI
                    addedSuccessfully = false;
                    console.warn(`Could not add ${tarotCard.name}, consumable slots full.`);
                }
            });
            alertMessage += `${cardsToAdd.map(c => c.name).join(", ")}! ${addedSuccessfully ? "" : "(Some cards lost due to full slots)"}`;
            alert(alertMessage);
            // renderConsumables called by addConsumable
        } else if (item.type === "standard") {
            // Delegate opening logic to items.js
            openStandardPack(item); // This function handles drawing, effects, adding to hand/discard, and UI updates
            purchasedItemName = `${item.name} (See alert for contents)`; // Alert is shown in openStandardPack
        } else if (item.type === "joker") { // Buffoon Pack
             console.log(`Opening Buffoon Pack (contains ${item.contains} Joker(s))...`);
            const jokersFound = [];
            for (let i = 0; i < item.contains; i++) {
                const newJoker = getRandomJoker(); // Get an available joker
                if (newJoker) jokersFound.push(newJoker);
            }

            if (jokersFound.length === 0) {
                alertMessage += "nothing (no Jokers left in pool)!";
            } else {
                purchasedItemName = `${item.name} (Opened: ${jokersFound.map(j => j.name).join(", ")})`;
                alertMessage += `${jokersFound.map(j => j.name).join(", ")}!`;
                let jokersLost = 0;
                const currentActiveJokers = [...state.activeJokers];
                jokersFound.forEach(joker => {
                    if (currentActiveJokers.length < MAX_JOKERS) {
                        const jokerInstance = { ...joker };
                        jokerInstance.id = generateUniqueId('joker'); // Assign unique ID for pack jokers too
                        if (jokerInstance.effect.type === "scaling_mult") {
                            jokerInstance.currentValue = 0;
                            console.log(`Initialized scaling value for ${jokerInstance.name} from pack`);
                        }
                        currentActiveJokers.push(jokerInstance);
                        console.log(`Added Joker: ${jokerInstance.name}`);
                    } else {
                        jokersLost++;
                        console.log(`Could not add Joker ${joker.name} (slots full).`);
                    }
                });
                setActiveJokers(currentActiveJokers); // Update state with added jokers
                if (jokersLost > 0) {
                    alertMessage += ` (${jokersLost} Joker${jokersLost > 1 ? "s" : ""} lost due to full slots)`;
                }
                renderJokers(); // Update UI
            }
            alert(alertMessage);
        }
        */
        // --- End OLD Logic ---

    } else if (type === "voucher") {
        if (state.purchasedVouchers.includes(item.id)) {
            console.error("Attempted to buy already purchased voucher:", item.id);
            setPlayerMoney(state.playerMoney + item.cost); // Refund
            return; // Stop purchase
        }
        const newVouchers = [...state.purchasedVouchers, item.id];
        setPurchasedVouchers(newVouchers);
        // Remove from shop state
        const newShopItems = { ...state.shopItems };
        newShopItems.voucher = null;
        setShopItems(newShopItems);
        console.log(`Purchased Voucher: ${item.name}`);
        applyVoucherEffects(); // Apply effects immediately
        updatePurchasedVouchersDisplay(); // Update run info display
        // updateUI will update discard counts etc. later
    }

    console.log(`Bought: ${purchasedItemName} for $${item.cost}`);

    // --- Update UI after purchase ---
    // Mark slot as purchased
    slotElement.textContent = "[Purchased]";
    slotElement.classList.add("disabled");
    slotElement.onclick = null;
    // Remove tooltip listener if it exists
    if (slotElement._tooltipListener) {
        slotElement.removeEventListener("mouseover", slotElement._tooltipListener);
        slotElement._tooltipListener = null;
    }


    // Update money display in both gameplay and shop
    dom.playerMoneyEl.textContent = state.playerMoney;
    dom.shopPlayerMoneyEl.textContent = state.playerMoney;

    // Update money display in both gameplay and shop
    dom.playerMoneyEl.textContent = state.playerMoney;
    dom.shopPlayerMoneyEl.textContent = state.playerMoney;

    // Re-evaluate availability of remaining items without fetching new ones
    updateShopAvailability();
    updateUI(); // Update main game UI (money, potentially discards/hand size if voucher)
}

/**
 * Sells an active joker at the specified index.
 * @param {number} index - The index of the joker in the activeJokers array.
 * @param {boolean} [calledFromPackOpening=false] - Flag to indicate if called from pack opening UI.
 * @returns {boolean} True if joker was sold successfully, false otherwise.
 */
export function sellJoker(index, calledFromPackOpening = false) {
    if (state.isAnimating && !calledFromPackOpening) return false; // Allow selling during pack opening UI
    if (index >= 0 && index < state.activeJokers.length && state.activeJokers[index]) {
        const currentJokers = [...state.activeJokers];
        const jokerToSell = currentJokers[index];

        // Replace the joker with null instead of splicing if called from pack opening,
        // to maintain indices for potential subsequent sales within the same UI interaction.
        // If not from pack opening, splice as before.
        if (calledFromPackOpening) {
            currentJokers[index] = null;
        } else {
            currentJokers.splice(index, 1);
             // Ensure array length is maintained if not called from pack opening
             while (currentJokers.length < MAX_JOKERS) {
                currentJokers.push(null);
            }
        }


        setActiveJokers(currentJokers); // Update state
        setPlayerMoney(state.playerMoney + JOKER_SELL_PRICE); // Add sell price

        console.log(`Sold ${jokerToSell.name} for $${JOKER_SELL_PRICE}`);

        // Only update UI fully if not called from pack opening UI
        // The pack opening UI will handle its own refresh
        if (!calledFromPackOpening) {
            renderJokers(); // Update joker display
            updateUI(); // Update money display etc.
            updateShopAvailability(); // Re-evaluate shop item availability (joker slot might open up)
        } else {
             // Just update money display in the main UI if sold from pack opening
             dom.playerMoneyEl.textContent = state.playerMoney;
             dom.shopPlayerMoneyEl.textContent = state.playerMoney; // Also update shop money display
        }
        return true; // Indicate success
    } else {
        console.error("Invalid index or empty slot for selling joker:", index);
        return false; // Indicate failure
    }
}

/**
 * Rerolls the shop items, costing money unless a free reroll is available.
 * Increases the reroll cost for subsequent paid rerolls.
 */
export function rerollShop() {
    if (state.isAnimating) return; // Prevent rerolling during animations

    const freeRerollAvailable = hasVoucher("v_reroll") && !state.freeRerollUsedThisShop;

    if (freeRerollAvailable) {
        console.log("Using free reroll from Reroll Surplus voucher.");
        setFreeRerollUsedThisShop(true); // Mark free reroll as used for this shop visit
        populateShop(); // Repopulate with new items
    } else {
        const currentCost = state.rerollCost;
        if (state.playerMoney >= currentCost) {
            setPlayerMoney(state.playerMoney - currentCost); // Deduct cost
            setRerollCost(state.rerollCost + 1); // Increase cost for next time
            console.log(`Rerolled shop for $${currentCost}. New cost: $${state.rerollCost}`);
            populateShop(); // Repopulate with new items
            // Update money display (handled by populateShop)
        } else {
            console.log("Not enough money to reroll.");
            // Optionally disable reroll button if check wasn't sufficient
            dom.rerollBtn.disabled = true;
        }
    }
}
