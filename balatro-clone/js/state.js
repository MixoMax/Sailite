// --- Game State ---
let deck = [];
let hand = [];
let discardPile = [];
let selectedCards = [];
let activeJokers = []; // Will contain joker objects with potential state like currentValue
let activeConsumables = [];
let purchasedVouchers = []; // Array of voucher IDs that have been bought
let shopItems = { jokers: [null, null, null], voucher: null, packs: [null, null] };
let activeTarotEffect = null;
let isSelectingTarotTarget = false;
let freeRerollUsedThisShop = false; // Track free reroll usage per shop visit
let currentBlindEffect = null; // Holds the active boss blind effect object
let isAnimating = false; // Flag to prevent actions during animations

let currentScore = 0;
let targetScore = 100;
let handsLeft = 4; // Base value, might be modified by vouchers but less common
let discardsLeft = 3; // Start with base, modified by vouchers (will be updated by BASE_DISCARDS)
let currentHandSize = 8; // Start with base, modified by vouchers (will be updated by BASE_HAND_SIZE)
let playerMoney = 10;
let currentAnte = 1;
let currentRound = 1;
let rerollCost = 1; // Base cost, increases with use

let handLevels = {
    HIGH_CARD: 1, PAIR: 1, TWO_PAIR: 1, THREE_OF_A_KIND: 1, STRAIGHT: 1,
    FLUSH: 1, FULL_HOUSE: 1, FOUR_OF_A_KIND: 1, STRAIGHT_FLUSH: 1, FIVE_OF_A_KIND: 1,
};

// --- Unique ID Generation ---
let nextItemId = 0;
export function generateUniqueId(prefix = 'item') {
    // Using timestamp and a counter for better uniqueness, especially if state resets
    return `${prefix}-${Date.now()}-${nextItemId++}`;
}

// --- Round Advancement Logic ---
import { BASE_HANDS, BASE_DISCARDS } from './constants.js'; // Need base values
import { applyVoucherEffects } from './items.js'; // Need to apply voucher effects

/**
 * Advances the game to the next round or ante.
 * Resets hands/discards based on base values and vouchers.
 */
export function advanceRound() {
    let nextRound = state.currentRound + 1;
    let nextAnte = state.currentAnte;

    if (nextRound > 3) { // Completed Small, Big, Boss
        nextRound = 1;
        nextAnte++;
        if (nextAnte > 8) { // Win condition (placeholder)
            console.log("WIN CONDITION MET (Placeholder) - Ante capped at 8");
            // In a real game, you'd show a win screen or proceed to endless mode
            nextAnte = 8; // Cap ante at 8 for placeholder
        }
    }

    setCurrentRound(nextRound);
    setCurrentAnte(nextAnte);

    // Reset hands and discards *after* ante/round update
    // Start with base values - Make sure BASE_HANDS is defined in constants.js
    // Using 4 directly for now if BASE_HANDS isn't defined yet.
    setHandsLeft(BASE_HANDS || 4);
    setDiscardsLeft(BASE_DISCARDS);
    // Then apply voucher effects which might modify these
    applyVoucherEffects(); // Recalculates hands/discards based on purchased vouchers

    console.log(`Advanced to Ante ${state.currentAnte}, Round ${state.currentRound}. Hands: ${state.handsLeft}, Discards: ${state.discardsLeft}`);
}


// Export mutable state variables
// Note: Direct export/import of 'let' can be tricky.
// A better approach might be an object or functions to get/set state.
// For simplicity here, we'll export them directly, but be mindful of potential issues.
// A more robust solution would involve getter/setter functions.

export let state = {
    deck,
    hand,
    discardPile,
    selectedCards,
    activeJokers,
    activeConsumables,
    purchasedVouchers,
    shopItems,
    activeTarotEffect,
    isSelectingTarotTarget,
    freeRerollUsedThisShop,
    currentBlindEffect,
    isAnimating,
    currentScore,
    targetScore,
    handsLeft,
    discardsLeft,
    currentHandSize,
    playerMoney,
    currentAnte,
    currentRound,
    rerollCost,
    handLevels
};

// Functions to update state (example)
export function updateState(newState) {
    state = { ...state, ...newState };
}

// Specific setters might be better
export function setDeck(newDeck) { state.deck = newDeck; }
export function setHand(newHand) { state.hand = newHand; }
export function setDiscardPile(newPile) { state.discardPile = newPile; }
export function setSelectedCards(newSelection) { state.selectedCards = newSelection; }
export function setActiveJokers(newJokers) { state.activeJokers = newJokers; }
export function setActiveConsumables(newConsumables) { state.activeConsumables = newConsumables; }
export function setPurchasedVouchers(newVouchers) { state.purchasedVouchers = newVouchers; }
export function setShopItems(newItems) { state.shopItems = newItems; }
export function setActiveTarotEffect(newEffect) { state.activeTarotEffect = newEffect; }
export function setIsSelectingTarotTarget(value) { state.isSelectingTarotTarget = value; }
export function setFreeRerollUsedThisShop(value) { state.freeRerollUsedThisShop = value; }
export function setCurrentBlindEffect(newEffect) { state.currentBlindEffect = newEffect; }
export function setIsAnimating(value) { state.isAnimating = value; }
export function setCurrentScore(newScore) { state.currentScore = newScore; }
export function setTargetScore(newScore) { state.targetScore = newScore; }
export function setHandsLeft(newValue) { state.handsLeft = newValue; }
export function setDiscardsLeft(newValue) { state.discardsLeft = newValue; }
export function setCurrentHandSize(newValue) { state.currentHandSize = newValue; }
export function setPlayerMoney(newValue) { state.playerMoney = newValue; }
export function setCurrentAnte(newValue) { state.currentAnte = newValue; }
export function setCurrentRound(newValue) { state.currentRound = newValue; }
export function setRerollCost(newValue) { state.rerollCost = newValue; }
export function setHandLevels(newLevels) { state.handLevels = newLevels; }
export function incrementHandLevel(handKey) { if (state.handLevels.hasOwnProperty(handKey)) { state.handLevels[handKey]++; } }

