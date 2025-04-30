import * as dom from './domElements.js';
// Import setHand, setActiveJokers, and setIsAnimating
import { state, setSelectedCards, setIsAnimating, setHand, setActiveJokers } from './state.js';
import {
    MAX_JOKERS, MAX_CONSUMABLES, JOKER_SELL_PRICE, BASE_HAND_SCORES,
    ANIMATION_DURATION, BASE_DISCARDS, VOUCHER_POOL, RANK_ORDER, RANKS_TO_HUMAN
} from './constants.js';

// Import functions from other modules
import { toggleCardSelection, evaluatePokerHand } from './hand.js';
import { applyTarotEffectToTarget, useConsumable, cancelTarotTargeting } from './items.js';
import { sellJoker } from './shop.js';
import { getCardChipValue } from './scoring.js';

// --- Tooltip Globals ---
let tooltipTimeout = null;
const TOOLTIP_DELAY = 350; // ms delay before showing tooltip
const tooltipElement = document.getElementById('custom-tooltip');
let currentTooltipTarget = null; // Track the element the tooltip is for

// Helper function for delays
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const POPUP_ANIMATION_DURATION = 600; // Duration for pop-up text animations
const SORT_ANIMATION_DURATION = 400; // Duration for sort animation

// --- Helper Functions ---

/**
 * Gets the DOM element for a card by its ID.
 * @param {string} cardId - The unique ID of the card (e.g., "KH", "5D").
 * @returns {HTMLElement | null} The card element or null if not found.
 */
export function getCardElementById(cardId) {
    return dom.handArea.querySelector(`.card[data-id="${cardId}"]`);
}

/**
 * Gets the DOM element for a joker slot by its index.
 * @param {number} index - The index of the joker (0-4).
 * @returns {HTMLElement | null} The joker slot element or null if not found.
 */
export function getJokerElementByIndex(index) {
    const jokerSlots = dom.jokerSlotsContainer.querySelectorAll(".joker-slot-display");
    return jokerSlots[index] || null;
}

// --- Animation Functions ---

/**
 * Creates and animates a pop-up text element near a target element.
 * @param {HTMLElement} targetElement - The element to animate near.
 * @param {string} text - The text content for the pop-up.
 * @param {string} [color='white'] - The color of the pop-up text.
 */
function createPopupText(targetElement, text, color = 'white') {
    if (!targetElement) return;

    const popup = document.createElement('div');
    popup.textContent = text;
    popup.style.position = 'absolute';
    popup.style.color = color;
    popup.style.fontSize = '1.1em';
    popup.style.fontWeight = 'bold';
    popup.style.textShadow = '1px 1px 2px black';
    popup.style.pointerEvents = 'none';
    popup.style.zIndex = '100';
    popup.style.transition = `transform ${POPUP_ANIMATION_DURATION}ms ease-out, opacity ${POPUP_ANIMATION_DURATION}ms ease-out`;

    // Position near the target element
    const rect = targetElement.getBoundingClientRect();
    popup.style.left = `${rect.left + rect.width / 2}px`; // Center horizontally
    popup.style.top = `${rect.top}px`; // Start at the top

    document.body.appendChild(popup);

    // Initial state (slightly offset and transparent)
    popup.style.transform = 'translate(-50%, 0) scale(0.8)';
    popup.style.opacity = '0';

    // Animate upwards and fade out
    requestAnimationFrame(() => {
        popup.style.transform = 'translate(-50%, -50px) scale(1.1)'; // Move up and slightly grow
        popup.style.opacity = '1';
    });

    setTimeout(() => {
        popup.style.transform = 'translate(-50%, -100px) scale(0.9)'; // Continue moving up
        popup.style.opacity = '0';
        setTimeout(() => {
            popup.remove();
        }, POPUP_ANIMATION_DURATION);
    }, POPUP_ANIMATION_DURATION / 3); // Start fade out partway through
}

/**
 * Animates a card contributing to the score.
 * @param {HTMLElement} cardElement - The card DOM element.
 * @param {string} popupText - Text to display (e.g., "+10 Chips").
 * @param {boolean} [isSealTrigger=false] - If true, use a different color/emphasis for seal triggers.
 * @returns {Promise<void>} Promise that resolves when the animation is complete.
 */
export async function animateCardContribution(cardElement, popupText, isSealTrigger = false) {
    return new Promise(resolve => {
        cardElement.classList.add('is-scoring');
        createPopupText(cardElement, popupText, isSealTrigger ? 'gold' : 'lightblue'); // Lightblue for chips/mult, gold for seals

        setTimeout(() => {
            cardElement.classList.remove('is-scoring');
            resolve();
        }, ANIMATION_DURATION);
    });
}

/**
 * Animates a joker triggering its effect.
 * @param {HTMLElement} jokerElement - The joker slot DOM element.
 * @param {string} popupText - Text to display (e.g., "+15 Mult", "x3 Mult").
 * @returns {Promise<void>} Promise that resolves when the animation is complete.
 */
export async function animateJokerTrigger(jokerElement, popupText) {
    return new Promise(resolve => {
        jokerElement.classList.add('is-scoring');
        let color = 'white';
        if (popupText.includes('Chips')) color = 'lightblue';
        if (popupText.includes('Mult')) color = 'lightcoral';
        if (popupText.includes('x')) color = 'red'; // Emphasize xMult
        if (popupText.includes('Scaled')) color = 'lightgreen';

        createPopupText(jokerElement, popupText, color);

        setTimeout(() => {
            jokerElement.classList.remove('is-scoring');
            resolve();
        }, ANIMATION_DURATION);
    });
}

/**
 * Animates the final Chips x Mult calculation.
 * @param {HTMLElement} displayElement - The element showing the calculation (potentialHandDisplay).
 * @param {number} chips - Final chip value.
 * @param {number} mult - Final multiplier value.
 * @param {number} totalScore - The final calculated score.
 * @returns {Promise<void>} Promise that resolves when the animation is complete.
 */
export async function animateFinalCalculation(displayElement, chips, mult, totalScore) {
    return new Promise(resolve => {
        // Make the text bold and slightly larger
        displayElement.style.fontWeight = 'bold';
        displayElement.style.transform = 'scale(1.1)';
        displayElement.style.transition = 'transform 0.2s ease-out';
        displayElement.textContent = `${chips} x ${mult.toFixed(2)} = ${totalScore}`;

        // Add a brief shake/pulse effect
        displayElement.classList.add('shake');

        setTimeout(() => {
            displayElement.style.fontWeight = 'normal'; // Reset style
            displayElement.style.transform = 'scale(1)';
            displayElement.classList.remove('shake');
            resolve();
        }, ANIMATION_DURATION * 1.5); // Longer duration for final calc display
    });
}

/**
 * Animates the score value flying to the target score element.
 * @param {number} scoreToAdd - The score value being added.
 * @param {HTMLElement} targetScoreElement - The element displaying the round's total score.
 * @returns {Promise<void>} Promise that resolves when the animation is complete.
 */
export async function animateScoreTransfer(scoreToAdd, targetScoreElement) {
    return new Promise(resolve => {
        const scorePopup = document.createElement('div');
        scorePopup.textContent = `+${scoreToAdd}`;
        scorePopup.style.position = 'absolute';
        scorePopup.style.color = 'yellow';
        scorePopup.style.fontSize = '1.5em';
        scorePopup.style.fontWeight = 'bold';
        scorePopup.style.textShadow = '1px 1px 3px black';
        scorePopup.style.pointerEvents = 'none';
        scorePopup.style.zIndex = '101'; // Above other popups
        scorePopup.style.transition = 'transform 0.6s ease-in-out, opacity 0.6s ease-in-out';

        // Start position (near the calculation area or center screen)
        const startRect = dom.potentialHandDisplay.getBoundingClientRect();
        scorePopup.style.left = `${startRect.left + startRect.width / 2}px`;
        scorePopup.style.top = `${startRect.top}px`;
        scorePopup.style.transform = 'translate(-50%, 0)';
        scorePopup.style.opacity = '1';

        document.body.appendChild(scorePopup);

        // Target position (center of the target score element)
        const targetRect = targetScoreElement.getBoundingClientRect();
        const targetX = targetRect.left + targetRect.width / 2;
        const targetY = targetRect.top + targetRect.height / 2;

        // Animate towards the target
        requestAnimationFrame(() => {
            scorePopup.style.transform = `translate(${targetX - (startRect.left + startRect.width / 2)}px, ${targetY - startRect.top}px) scale(0.5)`; // Move and shrink
            scorePopup.style.opacity = '0.5';
        });

        // When animation finishes, pulse the target element and remove popup
        setTimeout(() => {
            targetScoreElement.classList.add('is-scoring'); // Pulse the target score
            setTimeout(() => targetScoreElement.classList.remove('is-scoring'), ANIMATION_DURATION);
            scorePopup.remove();
            resolve();
        }, 600); // Match transition duration
    });
}

// --- SortableJS Initialization ---
let handSortableInstance = null;
let jokerSortableInstance = null;

/**
 * Initializes SortableJS for the hand area.
 */
function initHandSortable() {
    if (state.isSelectingTarotTarget) return; // Don't init if targeting
    if (handSortableInstance) {
        handSortableInstance.destroy(); // Destroy previous instance if exists
    }
    handSortableInstance = new Sortable(dom.handArea, {
        animation: 150,
        ghostClass: 'sortable-ghost', // Class for the drop placeholder
        chosenClass: 'sortable-chosen', // Class for the chosen item
        dragClass: 'sortable-drag', // Class for the dragging item
        // filter: '.targeting', // Should not be needed if we destroy on targeting
        // preventOnFilter: true, // Not needed if filter isn't used
        onEnd: function (evt) {
            // Update the state.hand array based on the new DOM order
            const newHandOrder = Array.from(dom.handArea.children).map(cardElement => {
                const cardId = cardElement.dataset.id;
                return state.hand.find(card => card.id === cardId);
            }).filter(Boolean); // Filter out potential undefined if something went wrong

            if (newHandOrder.length === state.hand.length) {
                // Check if order actually changed
                let orderChanged = false;
                for(let i = 0; i < newHandOrder.length; i++) {
                    if (state.hand[i]?.id !== newHandOrder[i]?.id) {
                        orderChanged = true;
                        break;
                    }
                }
                if (orderChanged) {
                    setHand(newHandOrder); // Update the state
                    console.log("Hand order updated:", state.hand.map(c => c.id));
                    // Re-apply selection visuals as dragging might remove them temporarily
                    // Find selected IDs before re-rendering
                    const selectedIDs = new Set(state.selectedCards.map(c => c.id));
                    renderHand(); // Re-render to ensure selection state is correct
                    // Re-apply selection state after re-render
                    setSelectedCards(state.hand.filter(card => selectedIDs.has(card.id)));
                    updatePotentialHandDisplay(); // Update display based on new selection state
                    updateActionButtons();
                } else {
                     console.log("Hand order unchanged.");
                }

            } else {
                console.error("Hand sort failed: Mismatch in card count.");
                renderHand(); // Re-render to restore visual state
            }
        },
    });
}

/**
 * Initializes SortableJS for the joker slots container.
 * Requires joker elements to have a `data-joker-id` attribute.
 */
function initJokerSortable() {
    if (jokerSortableInstance) {
        jokerSortableInstance.destroy();
    }
    const jokerContainer = dom.jokerSlotsContainer;
    jokerSortableInstance = new Sortable(jokerContainer, {
        animation: 150,
        filter: '.empty', // Don't allow dragging empty slots
        preventOnFilter: true,
        items: '.joker-slot-display:not(.empty)', // Only allow dragging actual jokers
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        onEnd: function (evt) {
            const newJokerOrder = [];
            const jokerElements = Array.from(jokerContainer.querySelectorAll('.joker-slot-display'));
            const currentJokers = [...state.activeJokers]; // Copy current state

            // Map the new visual order of joker elements to joker objects
            jokerElements.forEach(jokerElement => {
                if (!jokerElement.classList.contains('empty')) {
                    const jokerId = jokerElement.dataset.jokerId; // Get ID from data attribute
                    // Find the original joker object from the current state *before* the drag
                    const originalJoker = currentJokers.find(j => j && j.id === jokerId);
                    if (originalJoker) {
                        newJokerOrder.push(originalJoker);
                    } else {
                         console.warn(`Could not find original joker data for element with ID: ${jokerId}`);
                         // Push null as a fallback to maintain array structure, though this indicates an error
                         newJokerOrder.push(null);
                    }
                } else {
                    // Add a null placeholder for empty slots to maintain array length
                    newJokerOrder.push(null);
                }
            });

             // Ensure the final array has the correct length (MAX_JOKERS)
            while (newJokerOrder.length < MAX_JOKERS) {
                newJokerOrder.push(null);
            }
            // Trim if somehow it got too long (shouldn't happen with this logic)
            if (newJokerOrder.length > MAX_JOKERS) {
                newJokerOrder.length = MAX_JOKERS;
            }

            // Check if the order actually changed before updating state
            let orderChanged = false;
            if (newJokerOrder.length !== currentJokers.length) {
                 orderChanged = true; // Should not happen if logic is correct
                 console.error("Joker sort resulted in different array length!");
            } else {
                for(let i = 0; i < newJokerOrder.length; i++) {
                    // Compare IDs, handling nulls
                    if (currentJokers[i]?.id !== newJokerOrder[i]?.id) {
                        orderChanged = true;
                        break;
                    }
                }
            }

            if (orderChanged) {
                setActiveJokers(newJokerOrder); // Update the state
                console.log("Joker order updated:", state.activeJokers.map(j => j?.name || 'Empty'));
                renderJokers(); // Re-render to reflect new order and re-attach listeners/data attributes
            } else {
                console.log("Joker order unchanged.");
                // Re-render even if unchanged to ensure SortableJS state is consistent with DOM
                renderJokers();
            }
        },
    });
}

// --- Tooltip Functions ---

/**
 * Shows the tooltip with specific content after a delay.
 * @param {string} content - The HTML or text content for the tooltip.
 * @param {MouseEvent} event - The mouse event that triggered the tooltip.
 * @param {HTMLElement} target - The element being hovered over.
 */
export function showTooltip(content, event, target) { // Added export
    // Clear any existing timeout to prevent multiple tooltips
    clearTimeout(tooltipTimeout);
    hideTooltip(); // Hide any currently visible tooltip immediately

    currentTooltipTarget = target; // Set the target

    tooltipTimeout = setTimeout(() => {
        if (!tooltipElement || !currentTooltipTarget) return; // Check if elements still exist

        tooltipElement.innerHTML = content;
        tooltipElement.style.display = 'block';
        updateTooltipPosition(event); // Initial position update

        // Add mousemove listener to the target to keep tooltip updated
        currentTooltipTarget.addEventListener('mousemove', updateTooltipPosition);
        // Add mouseout listener to the target to hide tooltip
        currentTooltipTarget.addEventListener('mouseout', hideTooltip, { once: true }); // Use once to auto-remove

    }, TOOLTIP_DELAY);
}

/**
 * Hides the tooltip and clears any pending show timeout.
 */
function hideTooltip() {
    clearTimeout(tooltipTimeout);
    if (tooltipElement) {
        tooltipElement.style.display = 'none';
        tooltipElement.innerHTML = ''; // Clear content
    }
    // Remove listeners from the previous target if it exists
    if (currentTooltipTarget) {
        currentTooltipTarget.removeEventListener('mousemove', updateTooltipPosition);
        // The mouseout listener is already set to { once: true }
    }
    currentTooltipTarget = null; // Reset the target
}

/**
 * Updates the tooltip's position based on the mouse event.
 * @param {MouseEvent} event - The mouse event.
 */
function updateTooltipPosition(event) {
    if (!tooltipElement || tooltipElement.style.display === 'none') return;

    const xOffset = 15; // Offset from cursor
    const yOffset = 15;
    let x = event.clientX + xOffset;
    let y = event.clientY + yOffset;

    // Prevent tooltip from going off-screen
    const tooltipRect = tooltipElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (x + tooltipRect.width > viewportWidth) {
        x = event.clientX - tooltipRect.width - xOffset; // Flip to left side
    }
    if (y + tooltipRect.height > viewportHeight) {
        y = event.clientY - tooltipRect.height - yOffset; // Flip above
    }

    // Ensure tooltip doesn't go off the top or left
    if (x < 0) x = 0;
    if (y < 0) y = 0;

    tooltipElement.style.left = `${x}px`;
    tooltipElement.style.top = `${y}px`;
}

// --- Existing UI Functions ---

/**
 * Populates and displays the Cash Out screen.
 * @param {number} blindReward - Money earned from the blind.
 * @param {number} interest - Money earned from interest.
 * @param {number} handsBonus - Money earned from remaining hands.
 * @param {number} totalWinnings - Total money earned this round.
 * @param {number} finalBalance - Player's money after winnings.
 */
export function showCashOutScreen(blindReward, interest, handsBonus, totalWinnings, finalBalance) {
    dom.cashOutBlindEl.textContent = blindReward;
    dom.cashOutInterestEl.textContent = interest;
    dom.cashOutHandsEl.textContent = handsBonus;
    dom.cashOutTotalEl.textContent = totalWinnings;
    dom.cashOutBalanceEl.textContent = finalBalance;

    showScreen(dom.cashOutScreen);
}

/**
 * Renders a single card element.
 * @param {object} cardData - The card data object.
 * @param {boolean} [isTargeting=false] - Whether the card is being rendered for targeting.
 * @param {boolean} [isNewlyDrawn=false] - Whether the card was just drawn (for animation).
 * @returns {HTMLElement} The card's div element.
 */
export function renderCard(cardData, isTargeting = false, isNewlyDrawn = false) {
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card", cardData.suit);
    cardDiv.dataset.id = cardData.id;

    // Apply edition class
    if (cardData.edition) { cardDiv.classList.add(`edition-${cardData.edition}`); }

    // Apply seal element
    if (cardData.seal) {
        const sealSpan = document.createElement("span");
        sealSpan.classList.add("card-seal", `seal-${cardData.seal}`);
        sealSpan.textContent = "●"; // Use a character for the seal
        cardDiv.appendChild(sealSpan);
    }

    // Apply enhancement element
    if (cardData.enhancement) {
        const enhancementSpan = document.createElement("span");
        enhancementSpan.classList.add("card-enhancement");
        enhancementSpan.textContent = `[${cardData.enhancement === "bonus_chips" ? `+${cardData.enhancementValue}c` : cardData.enhancement}]`;
        cardDiv.appendChild(enhancementSpan);
    }

    // Apply debuff class if boss effect is active
    let tooltipContent = `${RANKS_TO_HUMAN[cardData.rank]} of ${cardData.suit.charAt(0).toUpperCase() + cardData.suit.slice(1)}s\n+${getCardChipValue(cardData)} Chips`;

    if (cardData.edition) tooltipContent += `\nEdition: ${cardData.edition.charAt(0).toUpperCase() + cardData.edition.slice(1)}`;
    if (cardData.seal) tooltipContent += `\nSeal: ${cardData.seal.charAt(0).toUpperCase() + cardData.seal.slice(1)}`;
    if (cardData.enhancement) tooltipContent += `\nEnhancement: ${cardData.enhancement === "bonus_chips" ? `+${cardData.enhancementValue} Chips` : cardData.enhancement}`;

    if (state.currentBlindEffect && state.currentBlindEffect.type === "debuff_suit" && cardData.suit === state.currentBlindEffect.suit) {
        cardDiv.classList.add("debuffed");
        tooltipContent += `\n\nDebuffed by ${state.currentBlindEffect.bossName}! (0 Base Chips)`;
    }

    // Add rank and suit
    const rankSpan = document.createElement("span");
    rankSpan.classList.add("card-rank");
    rankSpan.textContent = cardData.rank;
    const suitSpan = document.createElement("span");
    suitSpan.classList.add("card-suit");
    switch (cardData.suit) {
        case "heart": suitSpan.innerHTML = "&hearts;"; break;
        case "diamond": suitSpan.innerHTML = "&diams;"; break;
        case "club": suitSpan.innerHTML = "&clubs;"; break;
        case "spade": suitSpan.innerHTML = "&spades;"; break;
    }
    cardDiv.appendChild(rankSpan);
    cardDiv.appendChild(suitSpan);

    // Add event listener or targeting class
    if (isTargeting) {
        cardDiv.classList.add("targeting");
        // Ensure applyTarotEffectToTarget is imported and available
        cardDiv.onclick = () => applyTarotEffectToTarget(cardData);
    } else {
        // Ensure toggleCardSelection is imported and available
        cardDiv.addEventListener("click", () => toggleCardSelection(cardDiv, cardData));
        // Add tooltip listener
        cardDiv.addEventListener("mouseover", (event) => showTooltip(tooltipContent, event, cardDiv));
    }

    // Apply draw animation class
    if (isNewlyDrawn) {
        cardDiv.classList.add("newly-drawn");
        // Remove class after animation finishes
        setTimeout(() => {
            cardDiv.classList.remove("newly-drawn");
        }, ANIMATION_DURATION);
    }

    return cardDiv;
}

/**
 * Renders the player's hand in the hand area.
 * @param {boolean} [isTargeting=false] - Whether the hand is being rendered for targeting.
 * @param {Array<string>} [newCardIds=[]] - IDs of newly drawn cards for animation.
 */
export function renderHand(isTargeting = false, newCardIds = []) {
    dom.handArea.innerHTML = "";
    state.hand.forEach(cardData => {
        const isNew = newCardIds.includes(cardData.id);
        const cardElement = renderCard(cardData, isTargeting, isNew); // Pass isNew flag
        dom.handArea.appendChild(cardElement);
    });
    if (!isTargeting) {
        // Re-apply 'selected' class based on current state.selectedCards
        state.selectedCards.forEach(selCardData => {
            const cardElement = getCardElementById(selCardData.id); // Use helper
            if (cardElement) cardElement.classList.add("selected");
        });
        updateActionButtons();
        updatePotentialHandDisplay();
        // Initialize SortableJS for the hand after rendering
        initHandSortable();
    } else {
        // Destroy hand sortable instance when entering targeting mode
        if (handSortableInstance) {
            handSortableInstance.destroy();
            handSortableInstance = null;
        }
        dom.potentialHandDisplay.textContent = `Applying Tarot: ${state.activeTarotEffect.tarotCard.name}. Select target card(s).`;
        dom.playHandBtn.disabled = true;
        dom.discardBtn.disabled = true;
    }
}

/**
 * Updates the enabled/disabled state of Play Hand and Discard buttons.
 */
export function updateActionButtons() {
    const numSelected = state.selectedCards.length;
    dom.playHandBtn.disabled = numSelected === 0 || state.handsLeft <= 0 || state.isSelectingTarotTarget || state.isAnimating;
    dom.discardBtn.disabled = numSelected === 0 || state.discardsLeft <= 0 || state.isSelectingTarotTarget || state.isAnimating;
}

/**
 * Updates the display showing the potential poker hand of selected cards.
 * Also updates during scoring animation.
 */
export function updatePotentialHandDisplay() {
    if (state.isSelectingTarotTarget) {
        // Show targeting prompt
        const effect = state.activeTarotEffect.effect;
        const remaining = effect.targets - state.activeTarotEffect.targetsSelected.length;
        dom.potentialHandDisplay.textContent = `Applying ${state.activeTarotEffect.tarotCard.name}: Select ${remaining} more target card(s).`;
        return;
    }
    if (state.isAnimating && !dom.potentialHandDisplay.textContent.includes('=')) {
        // During scoring animation, the text is controlled by calculateScore
        return;
    }
    if (state.selectedCards.length === 0) {
        dom.potentialHandDisplay.textContent = "Selected Hand: ---";
        return;
    }
    // Show potential hand before playing
    const handInfo = evaluatePokerHand(state.selectedCards);
    dom.potentialHandDisplay.textContent = `Selected Hand: ${handInfo.name} (Lv. ${handInfo.level || 1})`;
}

/**
 * Updates the deck count display.
 */
export function updateDeckCount() {
    dom.deckCountEl.textContent = `${state.deck.length} / ${state.deck.length + state.hand.length + state.discardPile.length}`;
}

/**
 * Renders the active jokers in their slots.
 */
export function renderJokers() {
    dom.jokerSlotsContainer.innerHTML = "Jokers: ";
    for (let i = 0; i < MAX_JOKERS; i++) {
        const joker = state.activeJokers[i];
        const slotSpan = document.createElement("span");
        slotSpan.classList.add("joker-slot-display");
        if (joker) {
            let displayText = `[${joker.name}`;
            let displayTitle = `${joker.description}`;
            if (joker.hasOwnProperty("currentValue")) {
                displayText += ` (+${joker.currentValue})`;
                displayTitle += ` (Current Bonus: +${joker.currentValue} Mult)`;
            }
            displayText += "]";
            let tooltipText = `<strong>${joker.name}</strong>\n${joker.description}`;
            if (joker.hasOwnProperty("currentValue")) {
                tooltipText += `\n(Current Bonus: +${joker.currentValue} Mult)`;
            }
            tooltipText += `\n\n<em>Click to sell for $${JOKER_SELL_PRICE}</em>`;

            slotSpan.textContent = displayText;
            // slotSpan.title = displayTitle; // Remove default title
            slotSpan.classList.add("sellable");
            // Ensure sellJoker is imported and available
            slotSpan.onclick = () => sellJoker(i);
            // Add data attribute for SortableJS
            slotSpan.dataset.jokerId = joker.id; // Assuming jokers have a unique 'id' property
            // Add tooltip listener
            slotSpan.addEventListener("mouseover", (event) => showTooltip(tooltipText, event, slotSpan));
        } else {
            slotSpan.textContent = `[Empty Slot ${i + 1}]`;
            slotSpan.classList.add("empty");
            slotSpan.onclick = null;
        }
        dom.jokerSlotsContainer.appendChild(slotSpan);
    }
    // Initialize SortableJS for jokers after rendering
    initJokerSortable();
}

/**
 * Renders the active consumables (Tarot cards) in their slots.
 * Also handles destroying SortableJS instances when entering targeting mode.
 */
export function renderConsumables() {
    dom.consumableSlotsContainer.innerHTML = "Consumables: ";
    let isTargetingNow = false; // Flag to check if we are entering targeting

    for (let i = 0; i < MAX_CONSUMABLES; i++) {
        const consumable = state.activeConsumables[i];
        const slotSpan = document.createElement("span");
        slotSpan.classList.add("consumable-slot-display");
        if (consumable) {
            slotSpan.textContent = `[${consumable.name}]`;
            // slotSpan.title = consumable.description; // Remove default title
            const tooltipText = `<strong>${consumable.name}</strong>\n${consumable.description}\n\n<em>Click to use</em>`;
            // Ensure useConsumable is imported and available
            slotSpan.onclick = () => useConsumable(consumable, i);
            // Add tooltip listener
            slotSpan.addEventListener("mouseover", (event) => showTooltip(tooltipText, event, slotSpan));
            if (state.isSelectingTarotTarget && state.activeTarotEffect && state.activeTarotEffect.indexToRemove === i) {
                slotSpan.classList.add("active-targeting");
                isTargetingNow = true; // Set flag if we find an active targeting consumable
            }
        } else {
            slotSpan.textContent = `[Empty Slot ${i + 1}]`;
            slotSpan.classList.add("empty");
            slotSpan.onclick = null;
        }
        dom.consumableSlotsContainer.appendChild(slotSpan);
    }
    // Add cancel button if targeting
    if (state.isSelectingTarotTarget) {
        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Cancel Tarot";
        // Ensure cancelTarotTargeting is imported and available
        cancelBtn.onclick = () => cancelTarotTargeting();
        cancelBtn.style.marginLeft = "10px";
        cancelBtn.style.padding = "2px 5px";
        cancelBtn.style.fontSize = "0.8em";
        dom.consumableSlotsContainer.appendChild(cancelBtn);
        isTargetingNow = true; // Also set flag if cancel button is shown
    }

    // If entering targeting mode, destroy hand sortable instance
    if (isTargetingNow) {
        if (handSortableInstance) {
            handSortableInstance.destroy();
            handSortableInstance = null;
            console.log("Destroyed hand sortable due to targeting.");
        }
        // Jokers might still be sortable during targeting, depending on game rules.
        // If not, destroy jokerSortableInstance here too.
    } else {
        // If *not* targeting, ensure hand sortable is initialized (if hand is rendered)
        // This might be redundant if renderHand always calls it, but acts as a safety net
        if (!handSortableInstance && dom.handArea.children.length > 0) {
             initHandSortable();
             console.log("Re-initialized hand sortable after targeting ended.");
        }
    }
}

/**
 * Updates the hand level display in the Run Info screen.
 */
export function updateHandLevelDisplay() {
    if (!dom.handLevelsDisplay) return;
    dom.handLevelsDisplay.innerHTML = "<h4>Hand Levels:</h4>";
    for (const handKey in state.handLevels) {
        const level = state.handLevels[handKey];
        const handName = BASE_HAND_SCORES[handKey]?.name || handKey;
        const p = document.createElement("p");
        p.textContent = `${handName}: Lv. ${level}`;
        dom.handLevelsDisplay.appendChild(p);
    }
}

/**
 * Updates the purchased vouchers display in the Run Info screen.
 */
export function updatePurchasedVouchersDisplay() {
    if (!dom.purchasedVouchersDisplay) return;
    dom.purchasedVouchersDisplay.innerHTML = "<h4>Purchased Vouchers:</h4>";
    if (state.purchasedVouchers.length === 0) {
        const p = document.createElement("p");
        p.textContent = "None";
        dom.purchasedVouchersDisplay.appendChild(p);
    } else {
        state.purchasedVouchers.forEach(voucherId => {
            const voucher = VOUCHER_POOL.find(v => v.id === voucherId);
            if (voucher) {
                const p = document.createElement("p");
                p.textContent = `${voucher.name} - ${voucher.description}`;
                dom.purchasedVouchersDisplay.appendChild(p);
            }
        });
    }
}

/**
 * Updates all major UI elements based on the current game state.
 */
export function updateUI() {
    dom.targetScoreEl.textContent = state.targetScore;
    dom.currentScoreEl.textContent = state.currentScore;
    dom.handsLeftEl.textContent = `${state.handsLeft} / 4`; // Assuming base 4 hands
    // Calculate effective discards based on vouchers
    const discardBonus = state.purchasedVouchers
        .map(id => VOUCHER_POOL.find(v => v.id === id))
        .filter(v => v?.effect.type === "increase_discards")
        .reduce((sum, v) => sum + (v?.effect.value || 0), 0);
    dom.discardsLeftEl.textContent = `${state.discardsLeft} / ${BASE_DISCARDS + discardBonus}`;
    dom.playerMoneyEl.textContent = state.playerMoney;
    dom.currentAnteEl.textContent = state.currentAnte;
    dom.currentRoundEl.textContent = state.currentRound;

    updateDeckCount();
    updateActionButtons();
    renderJokers();
    renderConsumables();
    // These are for the Run Info screen, update them if the screen is visible or when needed
    // updateHandLevelDisplay();
    // updatePurchasedVouchersDisplay();
    // Update potential hand display unless animating score
    if (!state.isAnimating) {
        updatePotentialHandDisplay();
    }
}

/**
 * Shows the specified screen and hides others.
 * @param {HTMLElement} screenToShow - The screen element to make active.
 */
export function showScreen(screenToShow) {
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
    });
    screenToShow.classList.add("active");
}

/**
 * Animates the sorting of cards in the hand using the FLIP technique.
 * @param {Function} sortFunction - The function to sort the state.hand array.
 */
async function animateSort(sortFunction) {
    if (state.isAnimating || state.isSelectingTarotTarget) return;
    setIsAnimating(true);
    updateActionButtons(); // Disable buttons during animation

    const cardElements = Array.from(dom.handArea.children);
    const initialPositions = new Map();

    // 1. Get initial positions (First)
    cardElements.forEach(el => {
        const id = el.dataset.id;
        if (id) {
            initialPositions.set(id, el.getBoundingClientRect());
        }
    });

    // 2. Sort the underlying state.hand array
    sortFunction();

    // 3. Re-render the hand in the new order (Last - DOM placement)
    //    We need to re-render completely to get the new natural flow positions.
    dom.handArea.innerHTML = ''; // Clear the hand area
    const finalElementsMap = new Map();
    state.hand.forEach(cardData => {
        const cardElement = renderCard(cardData); // Create final elements
        // Re-apply selection if needed
        if (state.selectedCards.some(sel => sel.id === cardData.id)) {
            cardElement.classList.add('selected');
        }
        dom.handArea.appendChild(cardElement);
        finalElementsMap.set(cardData.id, cardElement); // Store newly created elements
    });

    // 4. Get final positions (Last - measured)
    const finalPositions = new Map();
    finalElementsMap.forEach((el, id) => {
        finalPositions.set(id, el.getBoundingClientRect());
    });

    // 5. Invert: Apply initial transforms to move elements back visually
    finalElementsMap.forEach((el, id) => {
        const initialRect = initialPositions.get(id);
        const finalRect = finalPositions.get(id);
        if (initialRect && finalRect) {
            const dx = initialRect.left - finalRect.left;
            const dy = initialRect.top - finalRect.top; // Should be 0 for inline-block, but calculate anyway
            el.style.transform = `translate(${dx}px, ${dy}px)`;
            el.style.transition = 'transform 0s'; // No transition yet
        } else {
            // Handle cards that might not have been present initially? (unlikely for sort)
            el.style.transform = 'none';
            el.style.transition = 'transform 0s';
        }
    });

    // 6. Play: Force reflow and trigger animation to final position
    // Reading a property forces reflow
    dom.handArea.offsetHeight;

    finalElementsMap.forEach((el, id) => {
        // Check if the element actually moved
        const initialRect = initialPositions.get(id);
        const finalRect = finalPositions.get(id);
        if (initialRect && finalRect && (initialRect.left !== finalRect.left || initialRect.top !== finalRect.top)) {
            el.style.transition = `transform ${SORT_ANIMATION_DURATION}ms ease-in-out`;
            el.style.transform = 'translate(0, 0)'; // Animate to final position (no transform)
        } else {
            // If it didn't move, remove any potential lingering transform/transition immediately
            el.style.transform = '';
            el.style.transition = '';
        }
    });

    // 7. Clean up after animation
    await delay(SORT_ANIMATION_DURATION + 50); // Wait for animation plus a buffer
    finalElementsMap.forEach(el => {
        el.style.transition = ''; // Remove transition override
        el.style.transform = ''; // Ensure transform is fully cleared
    });
    setIsAnimating(false);
    updateActionButtons(); // Re-enable buttons
}

/**
 * Sorts the hand by rank (Ace high to 2 low) and re-renders with animation.
 */
export function sortHandByRank() {
    animateSort(() => {
        // Sort descending by rank value
        state.hand.sort((a, b) => RANK_ORDER[b.rank] - RANK_ORDER[a.rank]);
    });
}

/**
 * Sorts the hand by suit (Spade -> Heart -> Diamond -> Club), then rank (Ace high to 2 low), and re-renders with animation.
 */
export function sortHandBySuit() {
    animateSort(() => {
        const suitOrder = { "club": 0, "diamond": 1, "heart": 2, "spade": 3 };
        state.hand.sort((a, b) => {
            // Sort descending by suit value
            const suitDiff = suitOrder[b.suit] - suitOrder[a.suit];
            if (suitDiff !== 0) return suitDiff;
            // Then descending by rank value
            return RANK_ORDER[b.rank] - RANK_ORDER[a.rank];
        });
    });
}
