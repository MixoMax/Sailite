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
 * @param {number} numCards - The number of cards to draw.
 * @returns {Array<object>} An array of drawn card objects.
 */
export function drawCards(numCards) {
    const drawn = [];
    let currentDeck = [...state.deck];
    let currentDiscardPile = [...state.discardPile];

    for (let i = 0; i < numCards && currentDeck.length > 0; i++) {
        drawn.push(currentDeck.pop());
    }

    // Check if deck is empty and discard pile has cards
    if (drawn.length < numCards && currentDiscardPile.length > 0) {
        console.log("Deck empty, reshuffling discard pile...");
        currentDeck = [...currentDiscardPile]; // Move discard pile to deck
        currentDiscardPile = []; // Empty discard pile

        // Shuffle the newly formed deck
        for (let i = currentDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [currentDeck[i], currentDeck[j]] = [currentDeck[j], currentDeck[i]];
        }

        // Draw remaining cards
        for (let i = drawn.length; i < numCards && currentDeck.length > 0; i++) {
            drawn.push(currentDeck.pop());
        }
    }

    // Update the state
    setDeck(currentDeck);
    setDiscardPile(currentDiscardPile);

    return drawn;
}
