import {
    PLANET_CARDS, TAROT_POOL, VOUCHER_POOL, BASE_HAND_SCORES, MAX_CONSUMABLES,
    PROB_EDITION_FOIL, PROB_EDITION_HOLO, PROB_EDITION_POLY, PROB_SEAL_ANY, SEALS,
    BASE_HAND_SIZE, BASE_DISCARDS // Added BASE_HAND_SIZE and BASE_DISCARDS
} from './constants.js';
import {
    state, incrementHandLevel, setActiveConsumables, setActiveTarotEffect,
    setIsSelectingTarotTarget, setPlayerMoney, setPurchasedVouchers,
    setCurrentHandSize, setDiscardsLeft, setHand, setDiscardPile
} from './state.js';
import {
    updateHandLevelDisplay, renderConsumables, renderHand, updateUI,
    updateActionButtons, updatePotentialHandDisplay, updatePurchasedVouchersDisplay,
    updateDeckCount // Needed for standard pack opening
} from './ui.js';
import { drawCards } from './deck.js'; // Needed for standard pack opening

// --- Planet Card Logic ---

/**
 * Applies the effect of a Planet card, leveling up the target hand type.
 * @param {object} planetCard - The Planet card object.
 */
export function usePlanetCard(planetCard) {
    if (planetCard && state.handLevels.hasOwnProperty(planetCard.targetHand)) {
        incrementHandLevel(planetCard.targetHand);
        console.log(`Used ${planetCard.name}! Leveled up ${BASE_HAND_SCORES[planetCard.targetHand].name} to Level ${state.handLevels[planetCard.targetHand]}.`);
        updateHandLevelDisplay(); // Update UI immediately
    } else {
        console.error("Invalid Planet Card or target hand:", planetCard);
    }
}

/**
 * Gets a random Planet card definition.
 * @returns {object} A copy of a random Planet card object.
 */
export function getRandomPlanetCard() {
    const randomIndex = Math.floor(Math.random() * PLANET_CARDS.length);
    return { ...PLANET_CARDS[randomIndex] };
}

// --- Tarot Card (Consumable) Logic ---

/**
 * Gets a random Tarot card definition.
 * @returns {object} A copy of a random Tarot card object.
 */
export function getRandomTarotCard() {
    const randomIndex = Math.floor(Math.random() * TAROT_POOL.length);
    return { ...TAROT_POOL[randomIndex] };
}

/**
 * Adds a consumable (Tarot card) to the player's active consumables if space is available.
 * @param {object} consumable - The consumable card object to add.
 * @returns {boolean} True if added successfully, false otherwise.
 */
export function addConsumable(consumable) {
    if (state.activeConsumables.length < MAX_CONSUMABLES) {
        const newConsumables = [...state.activeConsumables, consumable];
        setActiveConsumables(newConsumables);
        renderConsumables(); // Update UI
        return true;
    }
    console.log("No space for more consumables.");
    alert("No space for more consumables!");
    return false;
}

/**
 * Initiates the use of a consumable card.
 * If it requires a target, enters targeting mode. Otherwise, applies the effect directly.
 * @param {object} consumable - The consumable card object being used.
 * @param {number} index - The index of the consumable in the activeConsumables array.
 */
export function useConsumable(consumable, index) {
    if (state.isAnimating) return; // Prevent use during animations

    console.log(`Attempting to use consumable: ${consumable.name}`);
    const effect = consumable.effect;

    if (effect.requiresTarget) {
        // Enter targeting mode
        setActiveTarotEffect({ tarotCard: consumable, effect: effect, targetsSelected: [], indexToRemove: index });
        setIsSelectingTarotTarget(true);
        console.log(`Requires ${effect.targets} target(s). Entering targeting mode.`);
        renderHand(true); // Re-render hand with targeting enabled
        renderConsumables(); // Re-render consumables to show active/cancel button
    } else {
        // Apply effect immediately and remove consumable
        applyTarotEffectToTarget(null, consumable.effect); // Pass null target, just the effect
        const newConsumables = [...state.activeConsumables];
        newConsumables.splice(index, 1);
        setActiveConsumables(newConsumables);
        renderConsumables(); // Update UI
        updateUI(); // Update general UI (e.g., money if gained)
    }
}

/**
 * Applies the effect of an active Tarot card to a selected target card or applies a non-target effect.
 * @param {object | null} targetCardData - The data of the target card selected, or null for non-target effects.
 * @param {object | null} [nonTargetEffect=null] - The effect object if applying directly without targeting.
 */
export function applyTarotEffectToTarget(targetCardData, nonTargetEffect = null) {
    // Handle non-targeting effects first
    if (!state.isSelectingTarotTarget && nonTargetEffect) {
        console.log(`Applying non-target effect: ${nonTargetEffect.type}`);
        switch (nonTargetEffect.type) {
            case "gain_money":
                setPlayerMoney(state.playerMoney + nonTargetEffect.value);
                console.log(`Gained $${nonTargetEffect.value}`);
                break;
            case "create_last_consumable":
                // This needs access to the history of used consumables, which isn't tracked yet.
                console.warn("The Fool effect (Create Last Consumable) not fully implemented yet.");
                // Example: if (lastUsedConsumable) addConsumable(lastUsedConsumable);
                break;
            // Add other non-target effects here
        }
        // No need to remove consumable here, it's done in useConsumable for non-target effects
        updateUI(); // Update money, etc.
        return;
    }

    // Handle targeting effects
    if (!state.activeTarotEffect || !state.isSelectingTarotTarget) {
        console.error("Tarot effect application error: No active effect or not targeting.");
        return; // Should not happen in normal flow
    }

    const effect = state.activeTarotEffect.effect;
    const tarotCard = state.activeTarotEffect.tarotCard;

    // Find the actual card object in the hand array to modify it
    const targetCardInHand = state.hand.find(card => card.id === targetCardData.id);
    if (!targetCardInHand) {
        console.error("Target card not found in hand:", targetCardData.id);
        cancelTarotTargeting(); // Exit targeting mode if target is invalid
        return;
    }

    // Add the validated target card object to the list
    const currentTargets = [...state.activeTarotEffect.targetsSelected, targetCardInHand];
    setActiveTarotEffect({ ...state.activeTarotEffect, targetsSelected: currentTargets });

    console.log(`Selected target ${currentTargets.length}/${effect.targets}: ${targetCardInHand.id}`);

    // Check if all targets have been selected
    if (currentTargets.length === effect.targets) {
        console.log(`Applying effect ${effect.type} from ${tarotCard.name}...`);
        const targets = currentTargets; // Use the collected targets

        // Apply the effect to the target(s) - MODIFY THE CARD OBJECTS DIRECTLY
        switch (effect.type) {
            case "enhance_card":
                targets.forEach(target => {
                    target.enhancement = effect.enhancement;
                    target.enhancementValue = effect.value; // Store the value too
                    console.log(`Enhanced ${target.id} with ${effect.enhancement} (+${effect.value})`);
                });
                break;
            case "convert_suit":
                if (targets.length === 2) {
                    const cardToConvert = targets[0];
                    const targetSuitCard = targets[1]; // Use the suit of the second selected card
                    console.log(`Converting ${cardToConvert.id} (${cardToConvert.suit}) to ${targetSuitCard.suit}`);
                    cardToConvert.suit = targetSuitCard.suit;
                    // Note: ID doesn't change, just the suit property and appearance
                } else {
                    console.error("Convert suit requires exactly 2 targets.");
                }
                break;
            case "apply_edition":
                targets.forEach(target => {
                    console.log(`Applying ${effect.edition} edition to ${target.id}`);
                    target.edition = effect.edition;
                });
                break;
            case "apply_seal":
                 targets.forEach(target => {
                    console.log(`Applying ${effect.seal} seal to ${target.id}`);
                    target.seal = effect.seal;
                });
                break;
            // Add other target-based effects here
        }

        // Remove the used consumable
        const indexToRemove = state.activeTarotEffect.indexToRemove;
        const newConsumables = [...state.activeConsumables];
        newConsumables.splice(indexToRemove, 1);
        setActiveConsumables(newConsumables);

        // Exit targeting mode and update UI
        cancelTarotTargeting(false); // Exit targeting mode, don't re-render consumables yet
        renderHand(); // Re-render hand with updated cards
        renderConsumables(); // Now render consumables without the used one
        updateUI(); // Update general UI if needed

    } else {
        // Still need more targets
        updatePotentialHandDisplay(); // Update prompt for next target
    }
}

/**
 * Cancels the Tarot targeting mode.
 * @param {boolean} [renderConsumablesToo=true] - Whether to re-render consumables (e.g., if cancelled manually).
 */
export function cancelTarotTargeting(renderConsumablesToo = true) {
    console.log("Cancelling Tarot targeting.");
    setIsSelectingTarotTarget(false);
    setActiveTarotEffect(null);
    renderHand(); // Render hand normally
    if (renderConsumablesToo) {
        renderConsumables(); // Render consumables without cancel button/highlight
    }
    updateActionButtons();
    updatePotentialHandDisplay(); // Reset potential hand display
}


// --- Voucher Logic ---

/**
 * Applies the effects of all purchased vouchers to the game state.
 * Should be called when vouchers are bought or at the start of a round/game.
 */
export function applyVoucherEffects() {
    // Reset stats to base values before applying voucher effects
    let newHandSize = BASE_HAND_SIZE; // Assuming BASE_HAND_SIZE is imported
    let newDiscards = BASE_DISCARDS; // Assuming BASE_DISCARDS is imported

    state.purchasedVouchers.forEach(voucherId => {
        const voucher = VOUCHER_POOL.find(v => v.id === voucherId);
        if (voucher && voucher.effect) {
            switch (voucher.effect.type) {
                case "increase_hand_size":
                    newHandSize += voucher.effect.value;
                    console.log(`Voucher ${voucher.name} applied: Hand size +${voucher.effect.value}`);
                    break;
                case "increase_discards":
                    newDiscards += voucher.effect.value;
                    console.log(`Voucher ${voucher.name} applied: Discards +${voucher.effect.value}`);
                    break;
                // Add other voucher effects here (e.g., free_reroll is handled in shop logic)
            }
        }
    });

    // Update the state
    setCurrentHandSize(newHandSize);
    setDiscardsLeft(newDiscards); // Set the total allowed discards for the round

    console.log(`Effective Hand Size: ${state.currentHandSize}, Effective Discards: ${state.discardsLeft}`);
    // UI update for discards happens in updateUI based on state.discardsLeft
}

/**
 * Gets a random available voucher that hasn't been purchased yet.
 * @returns {object | null} A copy of an available voucher object, or null if none are left.
 */
export function getAvailableVoucher() {
    const available = VOUCHER_POOL.filter(v => !state.purchasedVouchers.includes(v.id));
    if (available.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * available.length);
    return { ...available[randomIndex] }; // Return a copy
}

/**
 * Checks if a specific voucher has been purchased.
 * @param {string} voucherId - The ID of the voucher to check.
 * @returns {boolean} True if the voucher has been purchased, false otherwise.
 */
export function hasVoucher(voucherId) {
    return state.purchasedVouchers.includes(voucherId);
}


// --- Card Effects Logic (from Standard Pack) ---

/**
 * Applies random editions (Foil, Holo, Poly) and seals to a playing card based on probabilities.
 * @param {object} card - The card object to potentially modify.
 * @returns {object} The potentially modified card object.
 */
export function applyRandomCardEffects(card) {
    // Apply Edition (only if it doesn't have one already)
    if (!card.edition) {
        const randEdition = Math.random();
        if (randEdition < PROB_EDITION_POLY) {
            card.edition = "polychrome";
            console.log(`  ... ${card.id} became Polychrome!`);
        } else if (randEdition < PROB_EDITION_POLY + PROB_EDITION_HOLO) {
            card.edition = "holographic";
            console.log(`  ... ${card.id} became Holographic!`);
        } else if (randEdition < PROB_EDITION_POLY + PROB_EDITION_HOLO + PROB_EDITION_FOIL) {
            card.edition = "foil";
            console.log(`  ... ${card.id} became Foil!`);
        }
    }

    // Apply Seal (only if it doesn't have one already)
    if (!card.seal) {
        const randSeal = Math.random();
        if (randSeal < PROB_SEAL_ANY) {
            const sealIndex = Math.floor(Math.random() * SEALS.length);
            card.seal = SEALS[sealIndex];
            console.log(`  ... ${card.id} got a ${card.seal} seal!`);
        }
    }
    return card; // Return the modified (or unmodified) card
}

/**
 * Opens a standard pack, draws cards, applies effects, and adds them to the hand or discard pile.
 * Handles Purple Seal effect on discard.
 * @param {object} pack - The pack definition object (must be type 'standard').
 */
export function openStandardPack(pack) {
    if (pack.type !== 'standard') return;

    console.log(`Opening Standard Pack (contains ${pack.contains} cards)...`);
    const drawnCards = drawCards(pack.contains); // Draw cards first
    const modifiedCards = drawnCards.map(card => applyRandomCardEffects(card)); // Apply effects

    let alertMessage = `Opened ${pack.name} and found: ${modifiedCards.map(c => c.id).join(", ")}!`;
    let cardsDiscarded = 0;
    let createdTarotFromDiscard = false;
    const newlyAddedCardIds = []; // For animation
    const currentHand = [...state.hand];
    const currentDiscard = [...state.discardPile];

    modifiedCards.forEach(card => {
        if (currentHand.length < state.currentHandSize) {
            currentHand.push(card);
            newlyAddedCardIds.push(card.id);
        } else {
            console.log(`Hand full, discarding ${card.id}`);
            // Check for Purple Seal *before* adding to discard
            if (card.seal === "purple") {
                console.log(`  ${card.id} (Purple Seal) triggered on discard from pack!`);
                const newTarot = getRandomTarotCard();
                if (addConsumable(newTarot)) { // addConsumable updates state and UI
                    console.log(`  Created Tarot: ${newTarot.name}`);
                    createdTarotFromDiscard = true; // Flag to re-render consumables if needed
                } else {
                    console.log(`  Could not create Tarot ${newTarot.name} (slots full).`);
                }
                card.seal = null; // Consume the seal
            }
            currentDiscard.push(card); // Add to discard pile
            cardsDiscarded++;
        }
    });

    // Update state
    setHand(currentHand);
    setDiscardPile(currentDiscard);

    if (cardsDiscarded > 0) {
        alertMessage += ` (${cardsDiscarded} discarded due to full hand)`;
    }
    alert(alertMessage);

    renderHand(false, newlyAddedCardIds); // Render hand with animation for new cards
    if (createdTarotFromDiscard) {
        // addConsumable already called renderConsumables, no need to call again
    }
    updateDeckCount(); // Update deck count display
}
