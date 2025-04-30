import { state, setPlayerMoney } from './state.js';
import { BASE_HAND_SCORES, ANIMATION_DURATION } from './constants.js';
import * as dom from './domElements.js';
// Import new animation functions from ui.js (will be created later)
import { renderJokers, animateCardContribution, animateJokerTrigger, animateFinalCalculation, animateScoreTransfer, getCardElementById, getJokerElementByIndex } from './ui.js';

// Helper function for delays
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const SCORE_STEP_DELAY = 300; // Delay between animation steps (ms)

/**
 * Determines the base chip value of a card, considering rank and enhancements.
 * Also checks for debuffs from the current blind effect.
 * @param {object} card - The card object.
 * @returns {number} The chip value of the card.
 */
function getCardChipValue(card) {
    // Check for boss blind debuff
    if (state.currentBlindEffect && state.currentBlindEffect.type === "debuff_suit" && card.suit === state.currentBlindEffect.suit) {
        console.log(`  ${card.id} is debuffed by ${state.currentBlindEffect.bossName}, contributing 0 base chips.`);
        return 0;
    }

    const rank = card.rank;
    let value = 0;
    if (["K", "Q", "J", "T"].includes(rank)) {
        value = 10;
    } else if (rank === "A") {
        value = 11;
    } else {
        value = parseInt(rank); // Assumes ranks 2-9
    }

    // Apply enhancements
    if (card.enhancement === "bonus_chips") {
        value += card.enhancementValue || 0;
    }

    return value;
}

/**
 * Checks if a card rank is considered even (2, 4, 6, 8, T, Q, K).
 * @param {string} rank - The card rank ('2'-'A').
 * @returns {boolean} True if the rank is even, false otherwise.
 */
function isEvenRank(rank) {
    if (["T", "Q", "K"].includes(rank)) return true; // T, Q, K are treated as even in the original logic
    const numRank = parseInt(rank);
    return !isNaN(numRank) && numRank % 2 === 0;
}

/**
 * Calculates the score for a played hand, applying card values, editions, seals, and joker effects.
 * Includes animations for each step.
 * @param {Array<object>} playedCards - The cards played in the hand.
 * @param {object} handInfo - The evaluated poker hand information (name, level, baseChips, baseMult).
 * @returns {Promise<number>} A promise that resolves with the total score calculated for the hand after animations.
 */
export async function calculateScore(playedCards, handInfo) {
    if (!handInfo || handInfo.name === "---") return 0;

    // --- Initial Setup ---
    let baseChips = handInfo.baseChips;
    let baseMult = handInfo.baseMult;
    const level = handInfo.level;
    let effectiveChips = baseChips; // Start with hand's base chips
    let additiveMult = baseMult;   // Start with hand's base mult
    let multiplicativeMult = 1;
    const triggeredJokerIndices = []; // Keep track of triggered jokers for animation/logging
    let scalingJokerUpdated = false; // Track if scaling jokers need UI update

    // Update potential hand display to show initial Chips x Mult
    dom.potentialHandDisplay.textContent = `${handInfo.name} (Lv. ${level}): ${effectiveChips} x ${additiveMult}`;
    await delay(SCORE_STEP_DELAY); // Brief pause to show initial state

    console.log(`Scoring Hand: ${handInfo.name} (Level ${level})`);
    console.log(` - Base: ${baseChips} Chips, ${baseMult} Mult`);

    // --- Apply Hand Level Bonuses ---
    if (level > 1) {
        const levelBonusChips = (level - 1) * 10;
        const levelBonusMult = (level - 1) * 2;
        console.log(` - Level ${level} Bonus: +${levelBonusChips} Chips, +${levelBonusMult} Mult`);
        baseChips += levelBonusChips;
        baseMult += levelBonusMult;
        effectiveChips = baseChips;
        additiveMult = baseMult;
        dom.potentialHandDisplay.textContent = `${handInfo.name} (Lv. ${level}): ${effectiveChips} x ${additiveMult}`; // Update display
        // TODO: Add animation for level bonus application?
        await delay(SCORE_STEP_DELAY);
    }

    // --- Apply Card Chip Values & Editions ---
    console.log(" - Applying Card Values & Editions:");
    for (const card of playedCards) {
        const cardElement = getCardElementById(card.id); // Get the DOM element
        let chipChange = 0;
        let multChange = 0;
        let xMultChange = 1;
        let animationText = "";

        // Base card value
        const cardValue = getCardChipValue(card);
        if (cardValue > 0) {
            chipChange += cardValue;
            animationText += `+${cardValue} Chips`;
        }

        // Edition effects
        switch (card.edition) {
            case "foil":
                chipChange += 50;
                animationText += `${animationText ? ', ' : ''}+50 Chips (Foil)`;
                break;
            case "holographic":
                multChange += 10;
                animationText += `${animationText ? ', ' : ''}+10 Mult (Holo)`;
                break;
            case "polychrome":
                xMultChange *= 1.5;
                animationText += `${animationText ? ', ' : ''}x1.5 Mult (Poly)`;
                break;
        }

        if (chipChange !== 0 || multChange !== 0 || xMultChange !== 1) {
            effectiveChips += chipChange;
            additiveMult += multChange;
            multiplicativeMult *= xMultChange;
            console.log(`   - ${card.id}: ${animationText}`);
            dom.potentialHandDisplay.textContent = `${handInfo.name} (Lv. ${level}): ${effectiveChips} x ${additiveMult} * ${multiplicativeMult.toFixed(2)}`;
            if (cardElement) {
                await animateCardContribution(cardElement, animationText); // Animate the card
            }
            await delay(SCORE_STEP_DELAY);
        }
    }

    // --- Check for Red Seal Triggers ---
    console.log(" - Checking Red Seals:");
    for (const card of playedCards) {
        if (card.seal === "red") {
            const cardElement = getCardElementById(card.id);
            let chipChange = 0;
            let multChange = 0;
            let xMultChange = 1;
            let animationText = "Red Seal: ";

            console.log(`   - ${card.id} (Red Seal) triggered! Retriggering edition.`);
            switch (card.edition) {
                case "foil":
                    chipChange += 50;
                    animationText += "+50 Chips";
                    console.log(`     (Red Seal - Foil): +50 Chips`);
                    break;
                case "holographic":
                    multChange += 10;
                    animationText += "+10 Mult";
                    console.log(`     (Red Seal - Holographic): +10 Mult`);
                    break;
                case "polychrome":
                    xMultChange *= 1.5;
                    animationText += "x1.5 Mult";
                    console.log(`     (Red Seal - Polychrome): x1.5 Mult`);
                    break;
                default:
                    animationText += "No edition";
                    console.log(`     (Red Seal - No edition to retrigger)`);
                    break;
            }
            card.seal = null; // Consume the seal after triggering

            if (chipChange !== 0 || multChange !== 0 || xMultChange !== 1) {
                effectiveChips += chipChange;
                additiveMult += multChange;
                multiplicativeMult *= xMultChange;
                dom.potentialHandDisplay.textContent = `${handInfo.name} (Lv. ${level}): ${effectiveChips} x ${additiveMult} * ${multiplicativeMult.toFixed(2)}`;
                if (cardElement) {
                    await animateCardContribution(cardElement, animationText, true); // Animate seal trigger
                }
                await delay(SCORE_STEP_DELAY);
            }
        }
    }

    // --- Apply Joker Effects (Sequentially Left-to-Right) ---
    console.log(" - Applying Joker Effects:");

    // 1. Handle scaling effects first (update internal value)
    for (const [index, joker] of state.activeJokers.entries()) {
        if (!joker) continue; // Skip null/empty joker slots

        if (joker.effect.type === "scaling_mult") {
            let conditionMet = false;
            switch (joker.effect.trigger) {
                case "score_suit":
                    conditionMet = playedCards.some(card =>
                        card.suit === joker.effect.suit &&
                        !(state.currentBlindEffect && state.currentBlindEffect.type === "debuff_suit" && card.suit === state.currentBlindEffect.suit)
                    );
                    break;
                // Add other scaling triggers here if needed
            }
            if (conditionMet) {
                const oldValue = joker.currentValue;
                joker.currentValue += joker.effect.value; // Update the joker's internal state
                console.log(`   - ${joker.name} scaled! +${joker.effect.value} Mult (Now +${joker.currentValue})`);
                if (!triggeredJokerIndices.includes(index)) triggeredJokerIndices.push(index);
                scalingJokerUpdated = true;
                // Animate the scaling update on the joker itself
                const jokerElement = getJokerElementByIndex(index);
                if (jokerElement) {
                    await animateJokerTrigger(jokerElement, `Scaled! +${joker.effect.value} Mult`);
                    // Update joker display text immediately after animation
                    renderJokers();
                }
                await delay(SCORE_STEP_DELAY);
            }
        }
    }

    // 2. Apply all Joker bonuses (including updated scaling values)
    for (const [index, joker] of state.activeJokers.entries()) {
        if (!joker) continue; // Skip null/empty joker slots

        const effect = joker.effect;
        let conditionMet = false;
        let effectApplied = false;
        let chipChange = 0;
        let multChange = 0;
        let xMultChange = 1;
        let animationText = "";

        switch (effect.type) {
            case "flat_chips":
                chipChange = effect.value;
                animationText = `+${effect.value} Chips`;
                effectApplied = true;
                break;
            case "flat_mult":
                multChange = effect.value;
                animationText = `+${effect.value} Mult`;
                effectApplied = true;
                break;
            case "scaling_mult": // Apply the current scaled value
                if (joker.currentValue > 0) { // Only apply if it has scaled
                    multChange = joker.currentValue;
                    animationText = `+${joker.currentValue} Mult (Scaled)`;
                    effectApplied = true; // Already animated scaling, but apply value now
                }
                break;
            case "conditional_mult":
            case "conditional_chips":
            case "conditional_xmult":
                // Determine if the condition is met
                switch (effect.trigger) {
                    case "has_suit":
                        conditionMet = playedCards.some(card => card.suit === effect.suit);
                        break;
                    case "hand_type":
                        conditionMet = handInfo.name === BASE_HAND_SCORES[effect.hand]?.name;
                        break;
                    case "card_count":
                        conditionMet = playedCards.length === effect.count;
                        break;
                    case "rank_parity":
                        const allEven = playedCards.every(card => isEvenRank(card.rank));
                        const allOdd = playedCards.every(card => !isEvenRank(card.rank));
                        conditionMet = (effect.parity === "even" && allEven) || (effect.parity === "odd" && allOdd);
                        break;
                }

                // Apply effect if condition met
                if (conditionMet) {
                    if (effect.type === "conditional_mult") {
                        multChange = effect.value;
                        animationText = `+${effect.value} Mult (Condition Met)`;
                        effectApplied = true;
                    } else if (effect.type === "conditional_chips") {
                        chipChange = effect.value;
                        animationText = `+${effect.value} Chips (Condition Met)`;
                        effectApplied = true;
                    } else if (effect.type === "conditional_xmult") {
                        xMultChange = effect.value;
                        animationText = `x${effect.value} Mult (Condition Met)`;
                        effectApplied = true;
                    }
                } else {
                    console.log(`   - ${joker.name} (Condition Not Met)`);
                    // Optionally show a "miss" animation?
                }
                break;
        }

        // If an effect was applied, update score, animate, and delay
        if (effectApplied) {
            effectiveChips += chipChange;
            additiveMult += multChange;
            multiplicativeMult *= xMultChange;
            console.log(`   - ${joker.name}: ${animationText}`);
            dom.potentialHandDisplay.textContent = `${handInfo.name} (Lv. ${level}): ${effectiveChips} x ${additiveMult} * ${multiplicativeMult.toFixed(2)}`;

            const jokerElement = getJokerElementByIndex(index);
            if (jokerElement) {
                await animateJokerTrigger(jokerElement, animationText);
            }
            if (!triggeredJokerIndices.includes(index)) triggeredJokerIndices.push(index);
            await delay(SCORE_STEP_DELAY);
        }
    }

    // --- Final Calculation ---
    const finalMult = additiveMult * multiplicativeMult;
    const totalScore = Math.floor(effectiveChips * finalMult); // Use floor for integer score

    console.log(` - Final Calculation: ${effectiveChips} Chips * ${finalMult.toFixed(2)} Mult = ${totalScore} Score`);

    // --- Trigger Final Animations ---
    // Animate the Chips x Mult calculation itself
    await animateFinalCalculation(dom.potentialHandDisplay, effectiveChips, finalMult, totalScore);
    await delay(SCORE_STEP_DELAY * 1.5); // Slightly longer pause after final calc

    // Animate score flying to the total
    await animateScoreTransfer(totalScore, dom.currentScoreEl);

    // --- Handle Money Gain (After Score Calculation) ---
    let moneyGainedThisHand = 0;
    state.activeJokers.forEach(joker => {
        // Add null check for empty joker slots
        if (joker && joker.effect.type === "money_per_hand") {
            moneyGainedThisHand += joker.effect.value;
        }
    });
    if (moneyGainedThisHand > 0) {
        console.log(` - Gained $${moneyGainedThisHand} from Jokers this hand.`);
        setPlayerMoney(state.playerMoney + moneyGainedThisHand);
        // TODO: Add animation for money gain?
    }

    // Update joker display if scaling happened (after all animations)
    if (scalingJokerUpdated) {
        renderJokers();
    }

    return totalScore;
}

export { getCardChipValue };
