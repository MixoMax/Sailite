import { SUITS, RANKS } from './constants.js';
import { state, setDeck, setDiscardPile } from './state.js';

// --- Core Deck Functions ---

/**
 * Creates a standard 52-card deck.
 */
export function createDeck() {
    const newDeck = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            newDeck.push({
                suit, rank, id: `${rank}${suit[0].toUpperCase()}`,
                enhancement: null,
                edition: null,
                seal: null
            });
        }
    }
    setDeck(newDeck);
}

/**
 * Shuffles the current deck using the Fisher-Yates algorithm.
 */
export function shuffleDeck() {
    const deckToShuffle = [...state.deck]; // Work on a copy
    for (let i = deckToShuffle.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deckToShuffle[i], deckToShuffle[j]] = [deckToShuffle[j], deckToShuffle[i]];
    }
    setDeck(deckToShuffle);
}

/**
 * Draws a specified number of cards from the deck.
 * Reshuffles the discard pile if the deck runs out.
 * Updates the deck and discard pile states internally.
 * @param {number} numCards - The number of cards to draw.
 * @returns {{drawnCards: Array<object>, remainingDeck: Array<object>, remainingDiscard: Array<object>}} An object containing the drawn cards and the updated deck/discard piles.
 */
export function drawCards(numCards) {
    const drawn = [];
    let currentDeck = [...state.deck];
    let currentDiscardPile = [...state.discardPile];

    for (let i = 0; i < numCards; i++) { // Loop up to numCards requested
        if (currentDeck.length === 0) {
            // Deck is empty, check discard pile
            if (currentDiscardPile.length === 0) {
                // Both empty, cannot draw more cards
                console.log("Deck and discard pile are empty. Cannot draw more cards.");
                break; // Stop drawing
            } else {
                // Reshuffle discard pile into deck
                console.log("Deck empty. Reshuffling discard pile.");
                currentDeck = [...currentDiscardPile]; // Copy discard to deck
                // Shuffle the new deck (Fisher-Yates)
                for (let k = currentDeck.length - 1; k > 0; k--) {
                    const j = Math.floor(Math.random() * (k + 1));
                    [currentDeck[k], currentDeck[j]] = [currentDeck[j], currentDeck[k]];
                }
                currentDiscardPile = []; // Empty the discard pile

                // Now try drawing the current card again from the reshuffled deck
                if (currentDeck.length === 0) {
                    // Should not happen if discard wasn't empty, but safety check
                    console.log("Reshuffled deck is somehow still empty.");
                    break;
                }
            }
        }
        // Draw the top card if available
        const drawnCard = currentDeck.pop();
        if (drawnCard) {
            drawn.push(drawnCard);
        } else {
             // This case should ideally not be reached due to the length checks,
             // but break just in case.
             break;
        }
    }

    // Return the drawn cards and the final state of deck and discard
    // Note: We are NOT updating the global state here anymore.
    // The caller (e.g., showPackOpeningScreen) will handle state updates.
    return {
        drawnCards: drawn || [],
        remainingDeck: currentDeck || [],
        remainingDiscard: currentDiscardPile || []
    };
}
