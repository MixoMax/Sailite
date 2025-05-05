import { RANK_ORDER, BASE_HAND_SCORES, MAX_SELECT } from './constants.js';
import { state, setSelectedCards, setHand, setDeck, setDiscardPile } from './state.js'; // Added setDeck, setDiscardPile
import { updateActionButtons, updatePotentialHandDisplay, renderHand } from './ui.js';
import { drawCards } from './deck.js';
import { updateDeckCount } from './ui.js'; // Needed for dealInitialHand

// --- Poker Hand Evaluation Helpers ---

/**
 * Counts the occurrences of each rank in a set of cards.
 * @param {Array<object>} cards - Array of card objects.
 * @returns {object} An object mapping rank to count.
 */
function getRankCounts(cards) {
    const counts = {};
    for (const card of cards) {
        counts[card.rank] = (counts[card.rank] || 0) + 1;
    }
    return counts;
}

/**
 * Counts the occurrences of each suit in a set of cards.
 * @param {Array<object>} cards - Array of card objects.
 * @returns {object} An object mapping suit to count.
 */
function getSuitCounts(cards) {
    const counts = {};
    for (const card of cards) {
        counts[card.suit] = (counts[card.suit] || 0) + 1;
    }
    return counts;
}

/**
 * Checks if all cards in a set have the same suit.
 * @param {Array<object>} cards - Array of card objects.
 * @returns {boolean} True if it's a flush, false otherwise.
 */
function isFlush(cards) {
    if (cards.length === 0) return false;
    const firstSuit = cards[0].suit;
    return cards.every(card => card.suit === firstSuit);
}

/**
 * Checks if a set of cards contains a straight.
 * Handles Ace-low straights (A-2-3-4-5).
 * Requires at least 5 cards to form a straight.
 * @param {Array<object>} cards - Array of card objects.
 * @returns {boolean} True if it's a straight, false otherwise.
 */
function isStraight(cards) {
    if (cards.length < 5) return false; // Need at least 5 cards for a straight

    const sortedRanks = cards.map(c => RANK_ORDER[c.rank]).sort((a, b) => a - b);
    const uniqueRanks = [...new Set(sortedRanks)];

    if (uniqueRanks.length < 5) return false; // Not enough unique ranks

    // Check for standard straights
    for (let i = 0; i <= uniqueRanks.length - 5; i++) {
        let consecutive = true;
        for (let j = 0; j < 4; j++) {
            if (uniqueRanks[i + j + 1] !== uniqueRanks[i + j] + 1) {
                consecutive = false;
                break;
            }
        }
        if (consecutive) return true;
    }

    // Check for Ace-low straight (A, 2, 3, 4, 5)
    const aceLowStraightRanks = [RANK_ORDER["A"], RANK_ORDER["2"], RANK_ORDER["3"], RANK_ORDER["4"], RANK_ORDER["5"]];
    if (aceLowStraightRanks.every(rank => uniqueRanks.includes(rank))) {
        return true;
    }

    return false;
}

// --- Poker Hand Evaluation ---

/**
 * Evaluates the best poker hand from a given set of cards.
 * @param {Array<object>} cards - Array of card objects to evaluate.
 * @returns {object} An object containing the hand name, level, base chips, and base multiplier.
 */
export function evaluatePokerHand(cards) {
    if (!cards || cards.length === 0) {
        return { name: "---", level: 0, baseChips: 0, baseMult: 0 };
    }

    const rankCounts = getRankCounts(cards);
    const counts = Object.values(rankCounts).sort((a, b) => b - a); // Sorted counts [3, 1, 1]
    const flush = isFlush(cards);
    const straight = isStraight(cards);

    let handKey = "HIGH_CARD"; // Default

    // Check from best hand down
    if (counts[0] === 5) {
        handKey = "FIVE_OF_A_KIND";
    } else if (straight && flush && cards.length === 5) { // Straight Flush requires exactly 5 cards
        handKey = "STRAIGHT_FLUSH";
    } else if (counts[0] === 4) {
        handKey = "FOUR_OF_A_KIND";
    } else if (counts[0] === 3 && counts[1] === 2) {
        handKey = "FULL_HOUSE";
    } else if (flush && cards.length === 5) { // Flush requires exactly 5 cards
        handKey = "FLUSH";
    } else if (straight && cards.length === 5) { // Straight requires exactly 5 cards
        handKey = "STRAIGHT";
    } else if (counts[0] === 3) {
        handKey = "THREE_OF_A_KIND";
    } else if (counts[0] === 2 && counts[1] === 2) {
        handKey = "TWO_PAIR";
    } else if (counts[0] === 2) {
        handKey = "PAIR";
    }

    const result = { ...BASE_HAND_SCORES[handKey] }; // Copy base stats
    result.level = state.handLevels[handKey]; // Add current level
    return result;
}


// --- Hand Manipulation ---

/**
 * Toggles the selection state of a card in the hand.
 * @param {HTMLElement} cardElement - The DOM element of the card clicked.
 * @param {object} cardData - The data object of the card clicked.
 */
export function toggleCardSelection(cardElement, cardData) {
    // Allow selection during targeting, but not during animation
    if (state.isAnimating) {
        console.log("Cannot select card during animation.");
        return;
    }

    const currentSelectedCards = [...state.selectedCards];
    const index = currentSelectedCards.findIndex(c => c.id === cardData.id);

    if (index > -1) {
        // Card is currently selected, deselect it
        currentSelectedCards.splice(index, 1);
        cardElement.classList.remove("selected");
    } else if (currentSelectedCards.length < MAX_SELECT) {
        // Card is not selected, and there's space, select it
        currentSelectedCards.push(cardData);
        cardElement.classList.add("selected");
    } else {
        // Max cards already selected
        console.log("Maximum cards selected");
        // Optional: Add visual feedback like shaking the selection
    }

    setSelectedCards(currentSelectedCards); // Update state
    updateActionButtons();
    updatePotentialHandDisplay();
}

/**
 * Deals the initial hand of cards at the start of a round.
 * Updates the deck and hand state.
 */
export function dealInitialHand() {
    const drawResult = drawCards(state.currentHandSize);
    // Note: drawCards now returns an object { drawnCards, remainingDeck, remainingDiscard }
    // We need to update the global deck/discard state here.
    setDeck(drawResult.remainingDeck);
    setDiscardPile(drawResult.remainingDiscard);
    setHand(drawResult.drawnCards); // Update the hand state
    renderHand(false, drawResult.drawnCards.map(c => c.id)); // Pass IDs of new cards for animation
    updateDeckCount(); // Update UI for deck count
}
