import * as dom from './domElements.js';
import {
    state, setDeck, setHand, setDiscardPile, setSelectedCards, setActiveJokers,
    setActiveConsumables, setPurchasedVouchers, setCurrentScore, setTargetScore,
    setHandsLeft, setDiscardsLeft, setCurrentHandSize, setPlayerMoney,
    setCurrentAnte, setCurrentRound, setRerollCost, setShopItems,
    setActiveTarotEffect, setIsSelectingTarotTarget, setFreeRerollUsedThisShop,
    setCurrentBlindEffect, setIsAnimating, setHandLevels, advanceRound
} from './state.js';
import {
    BASE_HAND_SIZE, BASE_DISCARDS, ANIMATION_DURATION, DISCARD_ANIMATION_DURATION,
    BOSS_BLINDS, SUITS, BASE_HAND_SCORES, JOKER_POOL, // Import necessary constants
    INTEREST_RATE, INTEREST_CAP, HAND_MONEY_BONUS // Added cash out constants
} from './constants.js';
import { createDeck, shuffleDeck, drawCards } from './deck.js';
import { evaluatePokerHand, dealInitialHand } from './hand.js';
import { calculateScore } from './scoring.js';
// Import the whole ui module
import * as ui from './ui.js';
import {
    applyVoucherEffects, getRandomTarotCard, addConsumable, usePlanetCard,
    getRandomPlanetCard, cancelTarotTargeting // Import item functions
} from './items.js';
import { populateShop } from './shop.js'; // Import shop function

// Helper function for delays
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Handles the logic for playing the currently selected cards.
 * Calculates score, updates state, draws new cards, and checks win/loss conditions.
 */
export async function playSelectedHand() { // Make function async
    if (state.selectedCards.length === 0 || state.handsLeft <= 0 || state.isAnimating || state.isSelectingTarotTarget) {
        console.log("Cannot play hand right now.");
        return;
    }

    const handInfo = evaluatePokerHand(state.selectedCards);

    // Validate hand
    if (handInfo.name === "---" || (state.selectedCards.length !== 5 && ["STRAIGHT", "FLUSH", "STRAIGHT_FLUSH"].includes(handInfo.name))) {
        console.log("Invalid hand selection for", handInfo.name);
        dom.potentialHandDisplay.textContent = `Invalid: ${handInfo.name} requires 5 cards`;
        dom.potentialHandDisplay.classList.add('shake');
        setTimeout(() => dom.potentialHandDisplay.classList.remove('shake'), 300);
        return;
    }

    setIsAnimating(true);
    ui.updateActionButtons(); // Disable buttons during animation/processing

    // --- Prepare for scoring ---
    const selectedIDs = new Set(state.selectedCards.map(c => c.id));
    const orderedSelectedCards = state.hand.filter(card => selectedIDs.has(card.id));
    const cardsToScore = JSON.parse(JSON.stringify(orderedSelectedCards));
    const playedIDs = new Set(orderedSelectedCards.map(c => c.id));
    const originalPlayedCardsData = [...orderedSelectedCards];

    const cardElementsToAnimate = [];
    originalPlayedCardsData.forEach(cardData => {
        const cardElement = dom.handArea.querySelector(`.card[data-id="${cardData.id}"]`);
        if (cardElement) {
            cardElementsToAnimate.push(cardElement);
        }
    });

    setSelectedCards([]);
    cardElementsToAnimate.forEach(el => el.classList.remove("selected"));

    console.log("Playing hand:", cardsToScore.map(c => c.id), "as", handInfo.name);
    setHandsLeft(state.handsLeft - 1);

    // --- Calculate score (ASYNC) ---
    const scoreGained = await calculateScore(cardsToScore, handInfo);
    setCurrentScore(state.currentScore + scoreGained);
    dom.lastHandEl.textContent = `${handInfo.name} (Lv. ${handInfo.level}) - ${scoreGained}`;

    // --- Visual Discard Animation (AFTER scoring popups) ---
    cardElementsToAnimate.forEach(el => {
        el.classList.add("is-discarding");
    });

    await delay(DISCARD_ANIMATION_DURATION);

    // --- Update Hand State (after discard animation) ---
    const newHand = state.hand.filter(card => !playedIDs.has(card.id));
    setHand(newHand);
    setDiscardPile([...state.discardPile, ...originalPlayedCardsData]);

    // --- Draw New Cards ---
    const cardsToDrawCount = state.currentHandSize - state.hand.length;
    let newlyDrawnCards = [];
    if (cardsToDrawCount > 0) {
        newlyDrawnCards = drawCards(cardsToDrawCount);
        setHand([...state.hand, ...newlyDrawnCards]);
    }

    // --- Update UI (after drawing) ---
    ui.renderHand(false, newlyDrawnCards.map(c => c.id));
    ui.updateUI();

    // --- Check Win/Loss Condition ---
    if (state.currentScore >= state.targetScore) {
        await delay(ANIMATION_DURATION);
        setIsAnimating(false);
        winRound();
    } else if (state.handsLeft <= 0) {
        await delay(ANIMATION_DURATION);
        setIsAnimating(false);
        loseRound();
    } else {
        await delay(ANIMATION_DURATION);
        setIsAnimating(false);
        ui.updateActionButtons();
        ui.updatePotentialHandDisplay();
    }
}

/**
 * Handles the logic for discarding the currently selected cards.
 * Updates state, draws new cards, and handles Purple Seal effect.
 */
export function discardSelectedCards() {
    if (state.selectedCards.length === 0 || state.discardsLeft <= 0 || state.isAnimating || state.isSelectingTarotTarget) {
        console.log("Cannot discard cards right now.");
        return;
    }

    setIsAnimating(true);
    ui.updateActionButtons();

    console.log("Discarding:", state.selectedCards.map(c => c.id));
    setDiscardsLeft(state.discardsLeft - 1);

    const discardedIDs = new Set(state.selectedCards.map(c => c.id));
    const originalDiscardedCardsData = [...state.selectedCards];
    const cardElementsToDiscard = [];
    let createdTarot = false;

    // --- Visual Discard Animation & Purple Seal Check ---
    originalDiscardedCardsData.forEach(cardData => {
        const cardElement = dom.handArea.querySelector(`.card[data-id="${cardData.id}"]`);
        if (cardElement) {
            cardElement.classList.add("is-discarding");
            cardElementsToDiscard.push(cardElement);
        }
        if (cardData.seal === "purple") {
            console.log(`  ${cardData.id} (Purple Seal) triggered on discard!`);
            const newTarot = getRandomTarotCard();
            if (addConsumable(newTarot)) {
                console.log(`  Created Tarot: ${newTarot.name}`);
                createdTarot = true;
            } else {
                console.log(`  Could not create Tarot ${newTarot.name} (slots full).`);
            }
            cardData.seal = null;
        }
    });

    setSelectedCards([]);
    ui.updatePotentialHandDisplay();
    cardElementsToDiscard.forEach(el => el.classList.remove("selected"));

    // --- Process after discard animation ---
    setTimeout(() => {
        const newHand = state.hand.filter(card => !discardedIDs.has(card.id));
        setHand(newHand);
        setDiscardPile([...state.discardPile, ...originalDiscardedCardsData]);

        const cardsToDrawCount = state.currentHandSize - state.hand.length;
        let newlyDrawnCards = [];
        if (cardsToDrawCount > 0) {
            newlyDrawnCards = drawCards(cardsToDrawCount);
            setHand([...state.hand, ...newlyDrawnCards]);
        }

        ui.renderHand(false, newlyDrawnCards.map(c => c.id));
        if (createdTarot) {
            // ui.renderConsumables already called by addConsumable
        }
        ui.updateUI();

        setTimeout(() => {
            setIsAnimating(false);
            ui.updateActionButtons();
        }, ANIMATION_DURATION);

    }, DISCARD_ANIMATION_DURATION);
}

/**
 * Handles the logic when a round is won. Calculates winnings, applies end-of-round effects,
 * and transitions to the cash-out screen.
 */
export function winRound() {
    console.log("Round Won!");

    // --- Calculate Winnings ---
    const baseReward = parseInt(dom.blindRewardEl.textContent) || 0;
    const interest = Math.min(INTEREST_CAP, Math.floor(state.playerMoney * INTEREST_RATE));
    const handsBonus = state.handsLeft * HAND_MONEY_BONUS;
    const initialWinnings = baseReward + interest + handsBonus;
    let currentBalance = state.playerMoney + initialWinnings;

    console.log(`Cash Out Base: $${baseReward} (Blind) + $${interest} (Interest) + $${handsBonus} (Hands) = $${initialWinnings}`);

    // --- Trigger End-of-Round Card Effects ---
    let createdPlanet = false;
    const currentHand = [...state.hand];
    currentHand.forEach(card => {
        if (card.seal === "gold") {
            currentBalance += 3;
            console.log(`  ${card.id} (Gold Seal) triggered! +$3`);
            card.seal = null;
        } else if (card.seal === "blue") {
            console.log(`  ${card.id} (Blue Seal) triggered!`);
            const newPlanet = getRandomPlanetCard();
            console.log(`  Created Planet: ${newPlanet.name}`);
            usePlanetCard(newPlanet); // This updates hand levels and UI
            createdPlanet = true;
            card.seal = null;
        }
    });
    setHand(currentHand);
    setPlayerMoney(currentBalance);

    // --- Clear Blind Effect ---
    setCurrentBlindEffect(null);

    // --- Show Cash Out Screen ---
    const totalWinnings = currentBalance - (state.playerMoney - initialWinnings); // Recalculate based on final balance
    ui.showCashOutScreen(baseReward, interest, handsBonus, totalWinnings, currentBalance);

    // Update UI in background
    ui.updateUI();
    if (createdPlanet) {
        // ui.updateHandLevelDisplay is called by usePlanetCard
    }
}

/**
 * Transitions the game from the Cash Out screen to the shop screen.
 * Advances the round, resets shop state, populates shop, and updates UI.
 */
export function goToShop() {
    console.log("Going to shop...");

    // --- Advance Round & Reset Shop State ---
    advanceRound();
    setRerollCost(1);
    setFreeRerollUsedThisShop(false);

    // --- Populate Shop & Update UI ---
    populateShop();
    ui.updateUI();
    dom.shopPlayerMoneyEl.textContent = state.playerMoney;
    dom.rerollCostEl.textContent = state.rerollCost;

    ui.showScreen(dom.shopScreen);
}

/**
 * Handles the logic when a round is lost. Shows game over message and restarts.
 */
export function loseRound() {
    console.log("Round Lost!");
    alert("Game Over!");
    initGame(); // Restart the game
}

/**
 * Sets up and starts the next round of gameplay.
 * Resets round-specific state, progresses ante/round, sets new target score and blind,
 * deals a new hand, and updates the UI.
 */
export function startNextRound() {
    console.log("Starting next round setup...");

    // --- Reset Round State ---
    setCurrentScore(0);
    // Hands/Discards are reset by advanceRound() called from goToShop()
    // applyVoucherEffects(); // This should be called by advanceRound or similar state reset
    setDiscardPile([]);
    setSelectedCards([]);
    dom.lastHandEl.textContent = "---";
    // setCurrentBlindEffect(null); // Already cleared in winRound
    setIsAnimating(false);

    if (state.isSelectingTarotTarget) {
        cancelTarotTargeting();
    }

    // --- Ante / Round Progression ---
    // This is now handled by advanceRound() in state.js

    // --- Set Target Score & Blind Info ---
    const anteBaseScore = 100 * state.currentAnte; // Use updated ante
    const roundBonusScore = 50 * (state.currentRound - 1) * state.currentAnte; // Use updated round/ante
    setTargetScore(anteBaseScore + roundBonusScore);

    let blindName = "Unknown Blind";
    let blindReward = 4 + state.currentAnte + (state.currentRound - 1);
    let blindEffectDescription = "";
    let newBlindEffect = null;

    if (state.currentRound === 1) {
        blindName = "Small Blind";
    } else if (state.currentRound === 2) {
        blindName = "Big Blind";
    } else { // currentRound === 3: Boss Blind
        blindName = "Boss Blind";
        if (BOSS_BLINDS.length > 0) {
            const bossIndex = Math.floor(Math.random() * BOSS_BLINDS.length);
            const selectedBoss = BOSS_BLINDS[bossIndex];
            newBlindEffect = selectedBoss.selectEffect({ SUITS });
            newBlindEffect.bossName = selectedBoss.name;
            blindName = selectedBoss.name;
            blindEffectDescription = newBlindEffect.description;
            console.log(`Selected Boss Blind: ${blindName} - ${blindEffectDescription}`);
        } else {
            console.warn("No boss blinds defined!");
            blindName = "Boss Blind (No Effect)";
        }
        setCurrentBlindEffect(newBlindEffect);
    }

    // Update Blind Info Display in UI
    dom.blindNameEl.textContent = blindName;
    dom.blindRewardEl.textContent = blindReward;
    if (blindEffectDescription) {
        dom.blindEffectEl.textContent = blindEffectDescription;
        dom.blindEffectEl.style.display = "block";
    } else {
        dom.blindEffectEl.textContent = "";
        dom.blindEffectEl.style.display = "none";
    }

    // --- Reset Deck and Hand ---
    createDeck();
    shuffleDeck();
    dealInitialHand();

    // --- Final Updates ---
    ui.updateUI();
    ui.showScreen(dom.gameplayScreen);
    console.log(`Ante ${state.currentAnte}, Round ${state.currentRound} (${blindName} - Target: ${state.targetScore}) started.`);
}

/**
 * Initializes the game state for a new game.
 * Resets all state variables, deck, hand, UI elements, and starts the first round.
 */
export function initGame() {
    console.log("Initializing new game...");

    // --- Reset Core State ---
    setDeck([]);
    setHand([]);
    setDiscardPile([]);
    setSelectedCards([]);
    setActiveJokers([]);
    setActiveConsumables([]);
    setPurchasedVouchers([]);
    setCurrentScore(0);
    setTargetScore(100); // Initial target
    setHandsLeft(4); // Base value
    setCurrentHandSize(BASE_HAND_SIZE); // Reset to base
    setDiscardsLeft(BASE_DISCARDS); // Reset to base
    setPlayerMoney(10);
    setCurrentAnte(1);
    setCurrentRound(1);
    setRerollCost(1);
    setShopItems({ jokers: [null, null, null], voucher: null, packs: [null, null] });
    setActiveTarotEffect(null);
    setIsSelectingTarotTarget(false);
    setFreeRerollUsedThisShop(false);
    setCurrentBlindEffect(null); // Ensure no blind effect on new game
    setIsAnimating(false); // Reset animation flag

    // Reset Hand Levels
    setHandLevels({
        HIGH_CARD: 1, PAIR: 1, TWO_PAIR: 1, THREE_OF_A_KIND: 1, STRAIGHT: 1,
        FLUSH: 1, FULL_HOUSE: 1, FOUR_OF_A_KIND: 1, STRAIGHT_FLUSH: 1, FIVE_OF_A_KIND: 1,
    });

    // --- Reset UI Elements to Default ---
    dom.blindNameEl.textContent = "Small Blind";
    dom.blindRewardEl.textContent = "4"; // Initial small blind reward
    dom.blindEffectEl.textContent = "";
    dom.blindEffectEl.style.display = "none";
    dom.lastHandEl.textContent = "---";
    dom.rerollCostEl.textContent = state.rerollCost; // Update reroll cost display

    // --- Setup First Round ---
    applyVoucherEffects(); // Apply base stats (important if base values change later)
    createDeck();
    shuffleDeck();
    dealInitialHand(); // Deals initial hand with animation

    // --- Add Event Listeners (if not already added) ---
    // Check if listeners are already attached to prevent duplicates if initGame is called multiple times
    if (!dom.playHandBtn.dataset.listenerAttached) {
        dom.playHandBtn.addEventListener('click', playSelectedHand);
        dom.discardBtn.addEventListener('click', discardSelectedCards);
        dom.sortRankBtn.addEventListener('click', ui.sortHandByRank); // Use ui. prefix
        dom.sortSuitBtn.addEventListener('click', ui.sortHandBySuit); // Use ui. prefix

        // Screen Navigation Buttons
        dom.runInfoBtn.addEventListener('click', () => {
            ui.updateHandLevelDisplay(); // Use ui. prefix
            ui.updatePurchasedVouchersDisplay(); // Use ui. prefix
            ui.showScreen(dom.runInfoScreen); // Use ui. prefix
        });
        dom.optionsBtn.addEventListener('click', () => ui.showScreen(dom.optionsScreen)); // Use ui. prefix
        dom.backToGameBtnRunInfo.addEventListener('click', () => ui.showScreen(dom.gameplayScreen)); // Use ui. prefix
        dom.backToGameBtnOptions.addEventListener('click', () => ui.showScreen(dom.gameplayScreen)); // Use ui. prefix

        // Cash Out Screen Button
        dom.continueToShopBtn.addEventListener('click', goToShop); // Connect the button

        // Shop Buttons
        dom.nextRoundBtn.addEventListener('click', startNextRound); // Button in shop to start next blind
        // Assuming shop module handles its own listeners for reroll/purchase

        // Mark buttons to indicate listeners are attached
        dom.playHandBtn.dataset.listenerAttached = 'true';
        // Add similar dataset markers for other buttons if needed
    }

    // --- Final UI Update and Screen ---
    ui.updateUI(); // Use ui. prefix
    ui.updateHandLevelDisplay(); // Use ui. prefix
    ui.updatePurchasedVouchersDisplay(); // Use ui. prefix
    dom.shopPlayerMoneyEl.textContent = state.playerMoney; // Update shop money display too
    ui.showScreen(dom.gameplayScreen); // Use ui. prefix
    console.log("Game ready.");
}
