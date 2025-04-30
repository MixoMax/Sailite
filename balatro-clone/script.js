document.addEventListener("DOMContentLoaded", () => {
    // --- DOM Elements ---
    const gameplayScreen = document.getElementById("gameplay-screen");
    const shopScreen = document.getElementById("shop-screen");
    const runInfoScreen = document.getElementById("run-info-screen");
    const optionsScreen = document.getElementById("options-screen");

    // Gameplay Elements
    const targetScoreEl = document.getElementById("target-score");
    const currentScoreEl = document.getElementById("current-score");
    const lastHandEl = document.getElementById("last-hand");
    const handsLeftEl = document.getElementById("hands-left");
    const discardsLeftEl = document.getElementById("discards-left");
    const playerMoneyEl = document.getElementById("player-money");
    const currentAnteEl = document.getElementById("current-ante");
    const currentRoundEl = document.getElementById("current-round");
    const deckCountEl = document.getElementById("deck-count");
    const handArea = document.getElementById("hand-area");
    const potentialHandDisplay = document.getElementById("potential-hand-display");
    const playHandBtn = document.getElementById("play-hand-btn");
    const discardBtn = document.getElementById("discard-btn");
    const sortRankBtn = document.getElementById("sort-rank-btn");
    const sortSuitBtn = document.getElementById("sort-suit-btn");
    const runInfoBtn = document.getElementById("run-info-btn");
    const optionsBtn = document.getElementById("options-btn");
    const jokerSlotsContainer = document.getElementById("joker-slots");
    const consumableSlotsContainer = document.getElementById("consumable-slots");
    const blindInfoDisplay = document.getElementById("blind-info"); // Get the blind info div

    // Other Screen Buttons
    const backToGameBtnRunInfo = document.getElementById("back-to-game-btn-runinfo");
    const backToGameBtnOptions = document.getElementById("back-to-game-btn-options");
    const handLevelsDisplay = document.getElementById("hand-levels-display");
    const purchasedVouchersDisplay = document.getElementById("purchased-vouchers-display"); // Added for Run Info

    // Shop Elements
    const shopPlayerMoneyEl = document.getElementById("shop-player-money");
    const nextRoundBtn = document.getElementById("next-round-btn");
    const rerollBtn = document.getElementById("reroll-btn");
    const rerollCostEl = document.getElementById("reroll-cost");
    const shopJokerSlots = document.querySelectorAll("#shop-jokers-consumables .shop-slot");
    const shopVoucherSlot = document.getElementById("voucher-slot"); // Specific ID for the voucher slot
    const shopPackSlots = document.querySelectorAll("#shop-pack-area .shop-slot");

    // --- Game Constants ---
    const SUITS = ["heart", "diamond", "club", "spade"];
    const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
    const RANK_ORDER = RANKS.reduce((acc, rank, index) => { acc[rank] = index; return acc; }, {});
    const BASE_HAND_SIZE = 8; // Base value
    const BASE_DISCARDS = 3; // Base value
    const MAX_SELECT = 5;
    const MAX_JOKERS = 5;
    const MAX_CONSUMABLES = 2;
    const JOKER_SELL_PRICE = 1; // Amount gained for selling a joker
    const ANIMATION_DURATION = 500; // ms for standard animations (shake, draw)
    const DISCARD_ANIMATION_DURATION = 400; // ms for discard animation

    // Probabilities for Standard Pack
    const PROB_EDITION_FOIL = 0.10; // 10%
    const PROB_EDITION_HOLO = 0.05; // 5%
    const PROB_EDITION_POLY = 0.02; // 2%
    const PROB_SEAL_ANY = 0.05; // 5% chance for *any* seal
    const SEALS = ["red", "blue", "gold", "purple"];
    const PROB_BUFFOON_PACK = 0.5; // 50% chance for Buffoon instead of Standard

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
    let discardsLeft = BASE_DISCARDS; // Start with base, modified by vouchers
    let currentHandSize = BASE_HAND_SIZE; // Start with base, modified by vouchers
    let playerMoney = 10;
    let currentAnte = 1;
    let currentRound = 1;
    let rerollCost = 1; // Base cost, increases with use

    let handLevels = {
        HIGH_CARD: 1, PAIR: 1, TWO_PAIR: 1, THREE_OF_A_KIND: 1, STRAIGHT: 1,
        FLUSH: 1, FULL_HOUSE: 1, FOUR_OF_A_KIND: 1, STRAIGHT_FLUSH: 1, FIVE_OF_A_KIND: 1,
    };

    const BASE_HAND_SCORES = {
        FIVE_OF_A_KIND: { name: "Five of a Kind", baseChips: 70, baseMult: 7 },
        STRAIGHT_FLUSH: { name: "Straight Flush", baseChips: 100, baseMult: 8 },
        FOUR_OF_A_KIND: { name: "Four of a Kind", baseChips: 60, baseMult: 7 },
        FULL_HOUSE: { name: "Full House", baseChips: 40, baseMult: 4 },
        FLUSH: { name: "Flush", baseChips: 35, baseMult: 4 },
        STRAIGHT: { name: "Straight", baseChips: 30, baseMult: 4 },
        THREE_OF_A_KIND: { name: "Three of a Kind", baseChips: 30, baseMult: 3 },
        TWO_PAIR: { name: "Two Pair", baseChips: 20, baseMult: 2 },
        PAIR: { name: "Pair", baseChips: 10, baseMult: 2 },
        HIGH_CARD: { name: "High Card", baseChips: 5, baseMult: 1 },
    };

    // --- Joker Definitions ---
    const JOKER_POOL = [
        { id: "j_chips", name: "Greedy Joker", description: "+4 Mult if played hand has a Diamond", cost: 4, effect: { type: "conditional_mult", trigger: "has_suit", suit: "diamond", value: 4 } },
        { id: "j_mult", name: "Jolly Joker", description: "+8 Mult if played hand is a Pair", cost: 4, effect: { type: "conditional_mult", trigger: "hand_type", hand: "PAIR", value: 8 } },
        { id: "j_flat_chips", name: "Zany Joker", description: "+50 Chips", cost: 5, effect: { type: "flat_chips", value: 50 } },
        { id: "j_flat_mult", name: "Mad Joker", description: "+15 Mult", cost: 6, effect: { type: "flat_mult", value: 15 } },
        { id: "j_xmult", name: "Crazy Joker", description: "x3 Mult if played hand has only 2 cards", cost: 7, effect: { type: "conditional_xmult", trigger: "card_count", count: 2, value: 3 } },
        { id: "j_even_mult", name: "Odd Todd", description: "+30 Chips if played hand contains only even ranks (T,Q,K=even)", cost: 5, effect: { type: "conditional_chips", trigger: "rank_parity", parity: "even", value: 30 } },
        { id: "j_scale_hearts", name: "Heartfelt Joker", description: "Gains +1 Mult permanently whenever a Heart card is scored", cost: 6, effect: { type: "scaling_mult", trigger: "score_suit", suit: "heart", value: 1 } },
        { id: "j_money_hand", name: "Business Card", description: "Gain $2 after scoring a hand", cost: 5, effect: { type: "money_per_hand", value: 2 } },
    ];

    // --- Planet Card Definitions ---
    const PLANET_CARDS = [
        { id: "p_earth", name: "Earth", description: "Levels up Full House", targetHand: "FULL_HOUSE" },
        { id: "p_jupiter", name: "Jupiter", description: "Levels up Flush", targetHand: "FLUSH" },
        { id: "p_mars", name: "Mars", description: "Levels up Pair", targetHand: "PAIR" },
        { id: "p_mercury", name: "Mercury", description: "Levels up High Card", targetHand: "HIGH_CARD" },
        { id: "p_neptune", name: "Neptune", description: "Levels up Straight Flush", targetHand: "STRAIGHT_FLUSH" },
        { id: "p_pluto", name: "Pluto", description: "Levels up Two Pair", targetHand: "TWO_PAIR" },
        { id: "p_saturn", name: "Saturn", description: "Levels up Straight", targetHand: "STRAIGHT" },
        { id: "p_uranus", name: "Uranus", description: "Levels up Three of a Kind", targetHand: "THREE_OF_A_KIND" },
        { id: "p_venus", name: "Venus", description: "Levels up Four of a Kind", targetHand: "FOUR_OF_A_KIND" },
    ];

    // --- Tarot Card Definitions ---
    const TAROT_POOL = [
        { id: "t_strength", name: "Strength", description: "Add +30 Chips to 2 selected cards", effect: { type: "enhance_card", enhancement: "bonus_chips", value: 30, targets: 2, requiresTarget: true } },
        { id: "t_death", name: "Death", description: "Convert 1 selected card to match the suit of another selected card", effect: { type: "convert_suit", targets: 2, requiresTarget: true } },
        { id: "t_fool", name: "The Fool", description: "Create a copy of the last played Consumable card (if any)", effect: { type: "create_last_consumable", targets: 0, requiresTarget: false } },
        { id: "t_emperor", name: "The Emperor", description: "Gain $5", effect: { type: "gain_money", value: 5, targets: 0, requiresTarget: false } },
        { id: "t_chariot", name: "The Chariot", description: "Apply Foil edition to 1 selected card", effect: { type: "apply_edition", edition: "foil", targets: 1, requiresTarget: true } },
        { id: "t_star", name: "The Star", description: "Apply Holographic edition to 1 selected card", effect: { type: "apply_edition", edition: "holographic", targets: 1, requiresTarget: true } },
        { id: "t_sun", name: "The Sun", description: "Apply Polychrome edition to 1 selected card", effect: { type: "apply_edition", edition: "polychrome", targets: 1, requiresTarget: true } },
        { id: "t_judgement", name: "Judgement", description: "Apply Red seal to 1 selected card", effect: { type: "apply_seal", seal: "red", targets: 1, requiresTarget: true } },
        { id: "t_temperance", name: "Temperance", description: "Apply Blue seal to 1 selected card", effect: { type: "apply_seal", seal: "blue", targets: 1, requiresTarget: true } },
        { id: "t_wheel", name: "Wheel of Fortune", description: "Apply Gold seal to 1 selected card", effect: { type: "apply_seal", seal: "gold", targets: 1, requiresTarget: true } },
        { id: "t_hermit", name: "The Hermit", description: "Apply Purple seal to 1 selected card", effect: { type: "apply_seal", seal: "purple", targets: 1, requiresTarget: true } }
    ];

    // --- Voucher Definitions ---
    const VOUCHER_POOL = [
        { id: "v_overstock", name: "Overstock", description: "+1 Hand Size", cost: 10, effect: { type: "increase_hand_size", value: 1 } },
        { id: "v_hone", name: "Hone", description: "+1 Discard per round", cost: 8, effect: { type: "increase_discards", value: 1 } },
        { id: "v_grabber", name: "Grabber", description: "+1 Hand Size", cost: 10, effect: { type: "increase_hand_size", value: 1 } },
        { id: "v_reroll", name: "Reroll Surplus", description: "First shop reroll each round is free", cost: 12, effect: { type: "free_reroll", value: 1 } },
    ];

    // --- Pack Definitions ---
    const PACKS = {
        celestial: { id: "pack_celestial", name: "Celestial Pack", cost: 6, description: "Contains 1 Planet card", type: "planet", contains: 1 },
        arcana: { id: "pack_arcana", name: "Arcana Pack", cost: 5, description: "Contains 1 Tarot card", type: "tarot", contains: 1 },
        standard: { id: "pack_standard", name: "Standard Pack", cost: 4, description: "Contains 3 playing cards. May have editions or seals!", type: "standard", contains: 3 },
        buffoon: { id: "pack_buffoon", name: "Buffoon Pack", cost: 7, description: "Contains 1 Joker card", type: "joker", contains: 1 },
    };

    // --- Boss Blind Definitions ---
    const BOSS_BLINDS = [
        {
            id: "boss_the_wall",
            name: "The Wall",
            selectEffect: () => {
                const debuffedSuit = SUITS[Math.floor(Math.random() * SUITS.length)];
                return {
                    description: `Debuffs all ${debuffedSuit.charAt(0).toUpperCase() + debuffedSuit.slice(1)} cards. (Contribute 0 base Chips)`,
                    type: "debuff_suit",
                    suit: debuffedSuit
                };
            }
        },
        // Add more boss blind definitions here
        // { id: "boss_...", name: "...", selectEffect: () => { ... } },
    ];

    // --- Core Functions ---
    function createDeck() {
        deck = [];
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                deck.push({
                    suit, rank, id: `${rank}${suit[0].toUpperCase()}`,
                    enhancement: null,
                    edition: null,
                    seal: null});
            }
        }
    }
    function shuffleDeck() {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]]; 
        }
    }
    function drawCards(numCards) {
        const drawn = [];
        for (let i = 0; i < numCards && deck.length > 0; i++) {
            drawn.push(deck.pop());
        }

        if (drawn.length < numCards && discardPile.length > 0) {
            console.log("Deck empty, reshuffling discard pile...");
            deck = [...discardPile];
            discardPile = [];
            shuffleDeck();
            for (let i = drawn.length; i < numCards && deck.length > 0; i++) {
                drawn.push(deck.pop());
            }
        }
        
        return drawn;
    }
    function dealInitialHand() {
        hand = drawCards(currentHandSize);
        renderHand(false, hand.map(c => c.id)); // Pass IDs of new cards for animation
        updateDeckCount();
    }
    function renderCard(cardData, isTargeting = false, isNewlyDrawn = false) { // Added isNewlyDrawn flag
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
        if (currentBlindEffect && currentBlindEffect.type === "debuff_suit" && cardData.suit === currentBlindEffect.suit) {
            cardDiv.classList.add("debuffed");
            cardDiv.title = `Debuffed by ${currentBlindEffect.bossName}!`; // Add tooltip
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
            cardDiv.onclick = () => applyTarotEffectToTarget(cardData);
        } else {
            cardDiv.addEventListener("click", () => toggleCardSelection(cardDiv, cardData));
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
    function renderHand(isTargeting = false, newCardIds = []) { // Added newCardIds parameter
        handArea.innerHTML = "";
        hand.forEach(cardData => {
            const isNew = newCardIds.includes(cardData.id);
            const cardElement = renderCard(cardData, isTargeting, isNew); // Pass isNew flag
            handArea.appendChild(cardElement);
        });
        if (!isTargeting) {
            selectedCards.forEach(selCardData => {
                const cardElement = handArea.querySelector(`.card[data-id="${selCardData.id}"]`);
                if (cardElement) cardElement.classList.add("selected");
            });
            updateActionButtons();
            updatePotentialHandDisplay();
        } else {
            potentialHandDisplay.textContent = `Applying Tarot: ${activeTarotEffect.tarotCard.name}. Select target card(s).`;
            playHandBtn.disabled = true;
            discardBtn.disabled = true;
        }
    }
    function toggleCardSelection(cardElement, cardData) {
        if (isAnimating || isSelectingTarotTarget) { console.log("Cannot select card during animation or targeting."); return; } const index = selectedCards.findIndex(c => c.id === cardData.id); if (index > -1) { selectedCards.splice(index, 1); cardElement.classList.remove("selected"); } else if (selectedCards.length < MAX_SELECT) { selectedCards.push(cardData); cardElement.classList.add("selected"); } else { console.log("Maximum cards selected"); } updateActionButtons(); updatePotentialHandDisplay();
    }
    function updateActionButtons() {
        const numSelected = selectedCards.length;
        playHandBtn.disabled = numSelected === 0 || handsLeft <= 0 || isSelectingTarotTarget || isAnimating; // Check isAnimating
        discardBtn.disabled = numSelected === 0 || discardsLeft <= 0 || isSelectingTarotTarget || isAnimating; // Check isAnimating
    }
    function updatePotentialHandDisplay() {
        if (isSelectingTarotTarget) return; if (selectedCards.length === 0) { potentialHandDisplay.textContent = "Selected Hand: ---"; return; } const handInfo = evaluatePokerHand(selectedCards); potentialHandDisplay.textContent = `Selected Hand: ${handInfo.name} (Lv. ${handInfo.level || 1})`;
    }

    // --- Poker Hand Evaluation ---
    function getRankCounts(cards) {
        const counts = {}; for (const card of cards) { counts[card.rank] = (counts[card.rank] || 0) + 1; } return counts;
    }
    function getSuitCounts(cards) {
        const counts = {}; for (const card of cards) { counts[card.suit] = (counts[card.suit] || 0) + 1; } return counts;
    }
    function isFlush(cards) {
        if (cards.length === 0) return false; const firstSuit = cards[0].suit; return cards.every(card => card.suit === firstSuit);
    }
    function isStraight(cards) {
        if (cards.length < 5) return false; const sortedRanks = cards.map(c => RANK_ORDER[c.rank]).sort((a, b) => a - b); const uniqueRanks = [...new Set(sortedRanks)]; if (uniqueRanks.length < 5) return false; for (let i = 0; i <= uniqueRanks.length - 5; i++) { let consecutive = true; for (let j = 0; j < 4; j++) { if (uniqueRanks[i + j + 1] !== uniqueRanks[i + j] + 1) { consecutive = false; break; } } if (consecutive) return true; } const aceLowStraightRanks = [RANK_ORDER["A"], RANK_ORDER["2"], RANK_ORDER["3"], RANK_ORDER["4"], RANK_ORDER["5"]]; if (aceLowStraightRanks.every(rank => uniqueRanks.includes(rank))) return true; return false;
    }
    function evaluatePokerHand(cards) {
        if (!cards || cards.length === 0) return { name: "---", level: 0, baseChips: 0, baseMult: 0 }; const rankCounts = getRankCounts(cards); const counts = Object.values(rankCounts).sort((a, b) => b - a); const flush = isFlush(cards); const straight = isStraight(cards); let handKey = "HIGH_CARD"; if (counts[0] === 5) handKey = "FIVE_OF_A_KIND"; else if (straight && flush && cards.length === 5) handKey = "STRAIGHT_FLUSH"; else if (counts[0] === 4) handKey = "FOUR_OF_A_KIND"; else if (counts[0] === 3 && counts[1] === 2) handKey = "FULL_HOUSE"; else if (flush && cards.length === 5) handKey = "FLUSH"; else if (straight && cards.length === 5) handKey = "STRAIGHT"; else if (counts[0] === 3) handKey = "THREE_OF_A_KIND"; else if (counts[0] === 2 && counts[1] === 2) handKey = "TWO_PAIR"; else if (counts[0] === 2) handKey = "PAIR"; const result = { ...BASE_HAND_SCORES[handKey] }; result.level = handLevels[handKey]; return result;
    }

    // --- Scoring ---
    function getCardChipValue(card) {
        if (currentBlindEffect && currentBlindEffect.type === "debuff_suit" && card.suit === currentBlindEffect.suit) { console.log(`  ${card.id} is debuffed by ${currentBlindEffect.bossName}, contributing 0 base chips.`); return 0; } const rank = card.rank; let value = 0; if (["K", "Q", "J", "T"].includes(rank)) value = 10; else if (rank === "A") value = 11; else value = parseInt(rank); if (card.enhancement === "bonus_chips") { value += card.enhancementValue || 0; } return value;
    }
    function isEvenRank(rank) {
        if (["T", "Q", "K"].includes(rank)) return true; const numRank = parseInt(rank); return !isNaN(numRank) && numRank % 2 === 0;
    }
    function calculateScore(playedCards, handInfo) {
        if (!handInfo || handInfo.name === "---") return 0;

        let baseChips = handInfo.baseChips;
        let baseMult = handInfo.baseMult;
        const level = handInfo.level;
        let effectiveChips = baseChips;
        let additiveMult = baseMult;
        let multiplicativeMult = 1;
        const triggeredJokerIndices = []; // Keep track of triggered jokers for animation

        // Apply hand level bonuses
        if (level > 1) {
            const levelBonusChips = (level - 1) * 10;
            const levelBonusMult = (level - 1) * 2;
            console.log(`Applying Level ${level} bonus for ${handInfo.name}: +${levelBonusChips} Chips, +${levelBonusMult} Mult`);
            baseChips += levelBonusChips;
            baseMult += levelBonusMult;
            effectiveChips = baseChips; // Update effective chips after level bonus
            additiveMult = baseMult; // Update additive mult after level bonus
        }

        // Apply card chip values and editions
        playedCards.forEach(card => {
            effectiveChips += getCardChipValue(card);
            switch (card.edition) {
                case "foil": effectiveChips += 50; console.log(`  ${card.id} (Foil): +50 Chips`); break;
                case "holographic": additiveMult += 10; console.log(`  ${card.id} (Holographic): +10 Mult`); break;
                case "polychrome": multiplicativeMult *= 1.5; console.log(`  ${card.id} (Polychrome): x1.5 Mult`); break;
            }
        });

        // Check for Red Seal triggers
        console.log("Checking for Red Seal triggers...");
        playedCards.forEach(card => {
            if (card.seal === "red") {
                console.log(`  ${card.id} (Red Seal) triggered! Retriggering edition bonus.`);
                switch (card.edition) {
                    case "foil": effectiveChips += 50; console.log(`    (Red Seal - Foil): +50 Chips`); break;
                    case "holographic": additiveMult += 10; console.log(`    (Red Seal - Holographic): +10 Mult`); break;
                    case "polychrome": multiplicativeMult *= 1.5; console.log(`    (Red Seal - Polychrome): x1.5 Mult`); break;
                    default: console.log(`    (Red Seal - No edition to retrigger)`); break;
                }
                card.seal = null;
            }
        });

        // --- Apply Joker Effects ---
        console.log("Applying Joker effects...");

        // 1. Handle scaling effects first
        activeJokers.forEach((joker, index) => {
            if (joker.effect.type === "scaling_mult") {
                let conditionMet = false;
                switch (joker.effect.trigger) {
                    case "score_suit":
                        conditionMet = playedCards.some(card =>
                            card.suit === joker.effect.suit &&
                            !(currentBlindEffect && currentBlindEffect.type === "debuff_suit" && card.suit === currentBlindEffect.suit)
                        );
                        break;
                }
                if (conditionMet) {
                    joker.currentValue += joker.effect.value;
                    console.log(`  ${joker.name} scaled! New value: +${joker.currentValue} Mult`);
                    if (!triggeredJokerIndices.includes(index)) triggeredJokerIndices.push(index); // Mark for animation
                }
            }
        });

        // 2. Apply all Joker bonuses
        activeJokers.forEach((joker, index) => {
            const effect = joker.effect;
            let conditionMet = false;
            let effectApplied = false; // Track if this specific joker applied a bonus in this step

            switch (effect.type) {
                case "flat_chips":
                    effectiveChips += effect.value;
                    console.log(`  ${joker.name}: +${effect.value} Chips`);
                    effectApplied = true;
                    break;
                case "flat_mult":
                    additiveMult += effect.value;
                    console.log(`  ${joker.name}: +${effect.value} Mult`);
                    effectApplied = true;
                    break;
                case "scaling_mult":
                    additiveMult += joker.currentValue;
                    console.log(`  ${joker.name}: +${joker.currentValue} Mult (Scaled)`);
                    // Scaling itself already marked it, but applying the value also counts
                    effectApplied = true;
                    break;
                case "conditional_mult":
                case "conditional_chips":
                case "conditional_xmult":
                    switch (effect.trigger) {
                        case "has_suit": conditionMet = playedCards.some(card => card.suit === effect.suit); break;
                        case "hand_type": conditionMet = handInfo.name === BASE_HAND_SCORES[effect.hand]?.name; break;
                        case "card_count": conditionMet = playedCards.length === effect.count; break;
                        case "rank_parity":
                            const allEven = playedCards.every(card => isEvenRank(card.rank));
                            const allOdd = playedCards.every(card => !isEvenRank(card.rank));
                            conditionMet = (effect.parity === "even" && allEven) || (effect.parity === "odd" && allOdd);
                            break;
                    }
                    if (conditionMet) {
                        if (effect.type === "conditional_mult") {
                            additiveMult += effect.value;
                            console.log(`  ${joker.name} (Met): +${effect.value} Mult`);
                            effectApplied = true;
                        } else if (effect.type === "conditional_chips") {
                            effectiveChips += effect.value;
                            console.log(`  ${joker.name} (Met): +${effect.value} Chips`);
                            effectApplied = true;
                        } else if (effect.type === "conditional_xmult") {
                            multiplicativeMult *= effect.value;
                            console.log(`  ${joker.name} (Met): x${effect.value} Mult`);
                            effectApplied = true;
                        }
                    } else {
                        console.log(`  ${joker.name} (Not Met)`);
                    }
                    break;
            }
            // Add to triggered list if effect was applied and not already added
            if (effectApplied && !triggeredJokerIndices.includes(index)) {
                triggeredJokerIndices.push(index);
            }
        });

        // Final calculation
        const finalMult = additiveMult * multiplicativeMult;
        const totalScore = Math.floor(effectiveChips * finalMult);

        console.log(`Scoring: ${handInfo.name} (Lv.${level}) | Base:[${handInfo.baseChips}c x ${handInfo.baseMult}m] | Leveled:[${baseChips}c x ${baseMult}m] | Effective:[${effectiveChips}c x ${additiveMult}(+Mult) x ${multiplicativeMult.toFixed(2)}(xMult) = ${finalMult.toFixed(2)}m] | Total: ${totalScore}`);

        // --- Trigger Scoring Animations ---
        const scoreElements = [currentScoreEl, lastHandEl];
        scoreElements.forEach(el => {
            el.classList.add("is-scoring");
            setTimeout(() => el.classList.remove("is-scoring"), ANIMATION_DURATION);
        });

        const jokerSlots = jokerSlotsContainer.querySelectorAll(".joker-slot-display");
        triggeredJokerIndices.forEach(index => {
            if (jokerSlots[index]) {
                jokerSlots[index].classList.add("is-scoring");
                setTimeout(() => jokerSlots[index].classList.remove("is-scoring"), ANIMATION_DURATION);
            }
        });
        // Update joker display immediately if scaling happened
        if (triggeredJokerIndices.some(idx => activeJokers[idx]?.effect.type === "scaling_mult")) {
            renderJokers();
        }

        return totalScore;
    }

    // --- Planet Card Logic ---
    function usePlanetCard(planetCard) {
        if (planetCard && handLevels.hasOwnProperty(planetCard.targetHand)) { handLevels[planetCard.targetHand]++; console.log(`Used ${planetCard.name}! Leveled up ${BASE_HAND_SCORES[planetCard.targetHand].name} to Level ${handLevels[planetCard.targetHand]}.`); updateHandLevelDisplay(); } else { console.error("Invalid Planet Card or target hand:", planetCard); }
    }
    function getRandomPlanetCard() {
        const randomIndex = Math.floor(Math.random() * PLANET_CARDS.length); return { ...PLANET_CARDS[randomIndex] };
    }

    // --- Tarot Card Logic ---
    function getRandomTarotCard() {
        const randomIndex = Math.floor(Math.random() * TAROT_POOL.length); return { ...TAROT_POOL[randomIndex] };
    }
    function addConsumable(consumable) {
        if (activeConsumables.length < MAX_CONSUMABLES) { activeConsumables.push(consumable); renderConsumables(); return true; } console.log("No space for more consumables."); alert("No space for more consumables!"); return false;
    }
    function useConsumable(consumable, index) {
        if (isAnimating) return; console.log(`Attempting to use consumable: ${consumable.name}`); const effect = consumable.effect; if (effect.requiresTarget) { activeTarotEffect = { tarotCard: consumable, effect: effect, targetsSelected: [], indexToRemove: index }; isSelectingTarotTarget = true; console.log(`Requires ${effect.targets} target(s).`); renderHand(true); renderConsumables(); } else { applyTarotEffectToTarget(null, consumable.effect); activeConsumables.splice(index, 1); renderConsumables(); updateUI(); }
    }
    function applyTarotEffectToTarget(targetCardData, nonTargetEffect = null) {
        if (!isSelectingTarotTarget && nonTargetEffect) { console.log(`Applying non-target effect: ${nonTargetEffect.type}`); switch (nonTargetEffect.type) { case "gain_money": playerMoney += nonTargetEffect.value; console.log(`Gained $${nonTargetEffect.value}`); break; case "create_last_consumable": console.warn("The Fool effect not fully implemented yet."); break; } updateUI(); return; } if (!activeTarotEffect || !isSelectingTarotTarget) { console.error("Tarot effect application error: No active effect or not targeting."); return; } const effect = activeTarotEffect.effect; const tarotCard = activeTarotEffect.tarotCard; const targetCardInHand = hand.find(card => card.id === targetCardData.id); if (!targetCardInHand) { console.error("Target card not found in hand:", targetCardData.id); cancelTarotTargeting(); return; } activeTarotEffect.targetsSelected.push(targetCardInHand); console.log(`Selected target ${activeTarotEffect.targetsSelected.length}/${effect.targets}: ${targetCardInHand.id}`); if (activeTarotEffect.targetsSelected.length === effect.targets) { console.log(`Applying effect ${effect.type} from ${tarotCard.name}...`); const targets = activeTarotEffect.targetsSelected; switch (effect.type) { case "enhance_card": targets.forEach(target => { target.enhancement = effect.enhancement; target.enhancementValue = effect.value; console.log(`Enhanced ${target.id} with ${effect.enhancement} (+${effect.value})`); }); break; case "convert_suit": if (targets.length === 2) { const cardToConvert = targets[0]; const targetSuitCard = targets[1]; console.log(`Converting ${cardToConvert.id} (${cardToConvert.suit}) to ${targetSuitCard.suit}`); cardToConvert.suit = targetSuitCard.suit; } else { console.error("Convert suit requires exactly 2 targets."); } break; case "apply_edition": targets.forEach(target => { console.log(`Applying ${effect.edition} edition to ${target.id}`); target.edition = effect.edition; }); break; case "apply_seal": targets.forEach(target => { console.log(`Applying ${effect.seal} seal to ${target.id}`); target.seal = effect.seal; }); break; } activeConsumables.splice(activeTarotEffect.indexToRemove, 1); cancelTarotTargeting(false); renderHand(); renderConsumables(); updateUI(); } else { potentialHandDisplay.textContent = `Applying Tarot: ${tarotCard.name}. Select target ${activeTarotEffect.targetsSelected.length + 1}/${effect.targets}.`; }
    }
    function cancelTarotTargeting(renderConsumablesToo = true) {
        console.log("Cancelling Tarot targeting."); isSelectingTarotTarget = false; activeTarotEffect = null; renderHand(); if (renderConsumablesToo) renderConsumables(); updateActionButtons(); updatePotentialHandDisplay();
    }

    // --- Voucher Logic ---
    function applyVoucherEffects() {
        currentHandSize = BASE_HAND_SIZE; let currentDiscards = BASE_DISCARDS; purchasedVouchers.forEach(voucherId => { const voucher = VOUCHER_POOL.find(v => v.id === voucherId); if (voucher && voucher.effect) { switch (voucher.effect.type) { case "increase_hand_size": currentHandSize += voucher.effect.value; console.log(`Voucher ${voucher.name} applied: Hand size +${voucher.effect.value}`); break; case "increase_discards": currentDiscards += voucher.effect.value; console.log(`Voucher ${voucher.name} applied: Discards +${voucher.effect.value}`); break; } } }); discardsLeft = currentDiscards; console.log(`Effective Hand Size: ${currentHandSize}, Effective Discards: ${discardsLeft}`);
    }
    function getAvailableVoucher() {
        const available = VOUCHER_POOL.filter(v => !purchasedVouchers.includes(v.id)); if (available.length === 0) return null; const randomIndex = Math.floor(Math.random() * available.length); return { ...available[randomIndex] };
    }
    function hasVoucher(voucherId) {
        return purchasedVouchers.includes(voucherId);
    }

    // --- Card Effects Logic ---
    function applyRandomCardEffects(card) {
        if (!card.edition) { const randEdition = Math.random(); if (randEdition < PROB_EDITION_POLY) { card.edition = "polychrome"; console.log(`  ... ${card.id} became Polychrome!`); } else if (randEdition < PROB_EDITION_POLY + PROB_EDITION_HOLO) { card.edition = "holographic"; console.log(`  ... ${card.id} became Holographic!`); } else if (randEdition < PROB_EDITION_POLY + PROB_EDITION_HOLO + PROB_EDITION_FOIL) { card.edition = "foil"; console.log(`  ... ${card.id} became Foil!`); } } if (!card.seal) { const randSeal = Math.random(); if (randSeal < PROB_SEAL_ANY) { const sealIndex = Math.floor(Math.random() * SEALS.length); card.seal = SEALS[sealIndex]; console.log(`  ... ${card.id} got a ${card.seal} seal!`); } } return card;
    }

    // --- UI Updates ---
    function updateDeckCount() {
        deckCountEl.textContent = `${deck.length} / ${deck.length + hand.length + discardPile.length}`;
    }
    function renderJokers() {
        jokerSlotsContainer.innerHTML = "Jokers: "; for (let i = 0; i < MAX_JOKERS; i++) { const joker = activeJokers[i]; const slotSpan = document.createElement("span"); slotSpan.classList.add("joker-slot-display"); if (joker) { let displayText = `[${joker.name}`; let displayTitle = `${joker.description}`; if (joker.hasOwnProperty("currentValue")) { displayText += ` (+${joker.currentValue})`; displayTitle += ` (Current Bonus: +${joker.currentValue} Mult)`; } displayText += "]"; displayTitle += ` (Click to sell for $${JOKER_SELL_PRICE})`; slotSpan.textContent = displayText; slotSpan.title = displayTitle; slotSpan.classList.add("sellable"); slotSpan.onclick = () => sellJoker(i); } else { slotSpan.textContent = `[Empty Slot ${i + 1}]`; slotSpan.classList.add("empty"); slotSpan.onclick = null; } jokerSlotsContainer.appendChild(slotSpan); }
    }
    function renderConsumables() {
        consumableSlotsContainer.innerHTML = "Consumables: "; for (let i = 0; i < MAX_CONSUMABLES; i++) { const consumable = activeConsumables[i]; const slotSpan = document.createElement("span"); slotSpan.classList.add("consumable-slot-display"); if (consumable) { slotSpan.textContent = `[${consumable.name}]`; slotSpan.title = consumable.description; slotSpan.onclick = () => useConsumable(consumable, i); if (isSelectingTarotTarget && activeTarotEffect && activeTarotEffect.indexToRemove === i) { slotSpan.classList.add("active-targeting"); } } else { slotSpan.textContent = `[Empty Slot ${i + 1}]`; slotSpan.classList.add("empty"); slotSpan.onclick = null; } consumableSlotsContainer.appendChild(slotSpan); } if (isSelectingTarotTarget) { const cancelBtn = document.createElement("button"); cancelBtn.textContent = "Cancel Tarot"; cancelBtn.onclick = () => cancelTarotTargeting(); cancelBtn.style.marginLeft = "10px"; cancelBtn.style.padding = "2px 5px"; cancelBtn.style.fontSize = "0.8em"; consumableSlotsContainer.appendChild(cancelBtn); }
    }
    function updateHandLevelDisplay() {
        if (!handLevelsDisplay) return; handLevelsDisplay.innerHTML = "<h4>Hand Levels:</h4>"; for (const handKey in handLevels) { const level = handLevels[handKey]; const handName = BASE_HAND_SCORES[handKey]?.name || handKey; const p = document.createElement("p"); p.textContent = `${handName}: Lv. ${level}`; handLevelsDisplay.appendChild(p); }
    }
    function updatePurchasedVouchersDisplay() {
        if (!purchasedVouchersDisplay) return; purchasedVouchersDisplay.innerHTML = "<h4>Purchased Vouchers:</h4>"; if (purchasedVouchers.length === 0) { const p = document.createElement("p"); p.textContent = "None"; purchasedVouchersDisplay.appendChild(p); } else { purchasedVouchers.forEach(voucherId => { const voucher = VOUCHER_POOL.find(v => v.id === voucherId); if (voucher) { const p = document.createElement("p"); p.textContent = `${voucher.name} - ${voucher.description}`; purchasedVouchersDisplay.appendChild(p); } }); }
    }
    function updateUI() {
        targetScoreEl.textContent = targetScore; currentScoreEl.textContent = currentScore; handsLeftEl.textContent = `${handsLeft} / 4`; discardsLeftEl.textContent = `${discardsLeft} / ${BASE_DISCARDS + purchasedVouchers.filter(id => VOUCHER_POOL.find(v=>v.id===id)?.effect.type === "increase_discards").reduce((sum, id) => sum + (VOUCHER_POOL.find(v=>v.id===id)?.effect.value || 0), 0)}`; playerMoneyEl.textContent = playerMoney; currentAnteEl.textContent = currentAnte; currentRoundEl.textContent = currentRound; updateDeckCount(); updateActionButtons(); renderJokers(); renderConsumables(); updateHandLevelDisplay(); updatePurchasedVouchersDisplay();
    }

    // --- Screen Navigation ---
    function showScreen(screenToShow) {
        document.querySelectorAll(".screen").forEach(screen => { screen.classList.remove("active"); }); screenToShow.classList.add("active");
    }

    // --- Shop Logic ---
    function getRandomJoker() {
        const availableJokers = JOKER_POOL.filter(j => !activeJokers.some(aj => aj.id === j.id)); if (availableJokers.length === 0) return null; const randomIndex = Math.floor(Math.random() * availableJokers.length); return { ...availableJokers[randomIndex] };
    }

    function populateShop() {
        console.log("Populating shop..."); shopItems = { jokers: [null, null, null], voucher: null, packs: [null, null] }; shopJokerSlots.forEach((slot, index) => { let item = null; if (index < 2) { item = getRandomJoker(); shopItems.jokers[index] = item; } slot.innerHTML = ""; slot.onclick = null; if (item) { slot.textContent = `${item.name} ($${item.cost})`; slot.title = item.description; if (playerMoney >= item.cost && activeJokers.length < MAX_JOKERS) { slot.classList.remove("disabled"); slot.onclick = () => buyItem(item, "joker", index, slot); } else { slot.classList.add("disabled"); } } else { slot.textContent = index < 2 ? "[No Jokers Left]" : "[Shop Slot]"; slot.classList.add("disabled"); } }); shopPackSlots.forEach((slot, index) => { let pack = null; if (index === 0) { pack = { ...PACKS.celestial }; } else if (index === 1) { if (Math.random() < PROB_BUFFOON_PACK) { pack = { ...PACKS.buffoon }; } else { pack = { ...PACKS.standard }; } } shopItems.packs[index] = pack; slot.innerHTML = ""; slot.onclick = null; if (pack) { slot.textContent = `${pack.name} ($${pack.cost})`; slot.title = pack.description; if (playerMoney >= pack.cost) { slot.classList.remove("disabled"); slot.onclick = () => buyItem(pack, "pack", index, slot); } else { slot.classList.add("disabled"); } } else { slot.textContent = "[Pack Slot]"; slot.classList.add("disabled"); } }); const voucher = getAvailableVoucher(); shopItems.voucher = voucher; shopVoucherSlot.innerHTML = ""; shopVoucherSlot.onclick = null; if (voucher) { shopVoucherSlot.textContent = `${voucher.name} ($${voucher.cost})`; shopVoucherSlot.title = voucher.description; if (playerMoney >= voucher.cost) { shopVoucherSlot.classList.remove("disabled"); shopVoucherSlot.onclick = () => buyItem(voucher, "voucher", -1, shopVoucherSlot); } else { shopVoucherSlot.classList.add("disabled"); } } else { shopVoucherSlot.textContent = "[No Vouchers Left]"; shopVoucherSlot.classList.add("disabled"); } const freeRerollAvailable = hasVoucher("v_reroll") && !freeRerollUsedThisShop; if (freeRerollAvailable) { rerollCostEl.textContent = "0"; rerollBtn.disabled = false; rerollBtn.textContent = "Reroll (Free)"; } else { rerollCostEl.textContent = rerollCost; rerollBtn.disabled = playerMoney < rerollCost; rerollBtn.textContent = `Reroll ($${rerollCost})`; }
    }

    function buyItem(item, type, shopIndex, slotElement) {
        if (isAnimating) return; if (!item || playerMoney < item.cost) { console.log("Cannot buy item - insufficient funds or invalid item."); return; } let purchasedItemName = item.name; playerMoney -= item.cost; if (type === "joker") { if (activeJokers.length >= MAX_JOKERS) { console.log("Cannot buy Joker - maximum Jokers reached."); alert("You have too many Jokers!"); playerMoney += item.cost; return; } const jokerInstance = { ...item }; if (jokerInstance.effect.type === "scaling_mult") { jokerInstance.currentValue = 0; console.log(`Initialized scaling value for ${jokerInstance.name}`); } activeJokers.push(jokerInstance); shopItems.jokers[shopIndex] = null; renderJokers(); } else if (type === "pack") { shopItems.packs[shopIndex] = null; let alertMessage = `Opened ${item.name} and found: `; if (item.type === "planet") { const cardsToAdd = []; for (let i = 0; i < item.contains; i++) cardsToAdd.push(getRandomPlanetCard()); purchasedItemName = `${item.name} (Opened: ${cardsToAdd.map(c => c.name).join(", ")})`; cardsToAdd.forEach(planetCard => usePlanetCard(planetCard)); alertMessage += `${cardsToAdd.map(c => c.name).join(", ")}!`; alert(alertMessage); } else if (item.type === "tarot") { const cardsToAdd = []; for (let i = 0; i < item.contains; i++) cardsToAdd.push(getRandomTarotCard()); purchasedItemName = `${item.name} (Opened: ${cardsToAdd.map(c => c.name).join(", ")})`; let addedSuccessfully = true; cardsToAdd.forEach(tarotCard => { if (!addConsumable(tarotCard)) { addedSuccessfully = false; console.warn(`Could not add ${tarotCard.name}, consumable slots full.`); } }); alertMessage += `${cardsToAdd.map(c => c.name).join(", ")}! ${addedSuccessfully ? "" : "(Some cards lost due to full slots)"}`; alert(alertMessage); renderConsumables(); } else if (item.type === "standard") { console.log(`Opening Standard Pack (contains ${item.contains} cards)...`); const drawnCards = drawCards(item.contains); const modifiedCards = drawnCards.map(card => applyRandomCardEffects(card)); purchasedItemName = `${item.name} (Opened: ${modifiedCards.map(c => c.id).join(", ")})`; alertMessage += `${modifiedCards.map(c => c.id).join(", ")}!`; let cardsDiscarded = 0; let createdTarotFromDiscard = false; const newlyAddedCardIds = []; modifiedCards.forEach(card => { if (hand.length < currentHandSize) { hand.push(card); newlyAddedCardIds.push(card.id); } else { console.log(`Hand full, discarding ${card.id}`); if (card.seal === "purple") { console.log(`  ${card.id} (Purple Seal) triggered on discard from pack!`); const newTarot = getRandomTarotCard(); if (addConsumable(newTarot)) { console.log(`  Created Tarot: ${newTarot.name}`); createdTarotFromDiscard = true; } else { console.log(`  Could not create Tarot ${newTarot.name} (slots full).`); } card.seal = null; } discardPile.push(card); cardsDiscarded++; } }); if (cardsDiscarded > 0) { alertMessage += ` (${cardsDiscarded} discarded due to full hand)`; } alert(alertMessage); renderHand(false, newlyAddedCardIds); if (createdTarotFromDiscard) renderConsumables(); updateDeckCount(); } else if (item.type === "joker") { console.log(`Opening Buffoon Pack (contains ${item.contains} Joker(s))...`); const jokersFound = []; for (let i = 0; i < item.contains; i++) { const newJoker = getRandomJoker(); if (newJoker) jokersFound.push(newJoker); } if (jokersFound.length === 0) { alertMessage += "nothing (no Jokers left in pool)!"; } else { purchasedItemName = `${item.name} (Opened: ${jokersFound.map(j => j.name).join(", ")})`; alertMessage += `${jokersFound.map(j => j.name).join(", ")}!`; let jokersLost = 0; jokersFound.forEach(joker => { if (activeJokers.length < MAX_JOKERS) { const jokerInstance = { ...joker }; if (jokerInstance.effect.type === "scaling_mult") { jokerInstance.currentValue = 0; console.log(`Initialized scaling value for ${jokerInstance.name} from pack`); } activeJokers.push(jokerInstance); console.log(`Added Joker: ${jokerInstance.name}`); } else { jokersLost++; console.log(`Could not add Joker ${joker.name} (slots full).`); } }); if (jokersLost > 0) { alertMessage += ` (${jokersLost} Joker${jokersLost > 1 ? "s" : ""} lost due to full slots)`; } renderJokers(); } alert(alertMessage); } } else if (type === "voucher") { if (purchasedVouchers.includes(item.id)) { console.error("Attempted to buy already purchased voucher:", item.id); playerMoney += item.cost; return; } purchasedVouchers.push(item.id); shopItems.voucher = null; console.log(`Purchased Voucher: ${item.name}`); applyVoucherEffects(); updatePurchasedVouchersDisplay(); } console.log(`Bought: ${purchasedItemName} for $${item.cost}`); playerMoneyEl.textContent = playerMoney; shopPlayerMoneyEl.textContent = playerMoney; slotElement.textContent = "[Purchased]"; slotElement.classList.add("disabled"); slotElement.onclick = null; populateShop();
    }

    function sellJoker(index) {
        if (isAnimating) return; if (index >= 0 && index < activeJokers.length) { const jokerToSell = activeJokers[index]; activeJokers.splice(index, 1); playerMoney += JOKER_SELL_PRICE; console.log(`Sold ${jokerToSell.name} for $${JOKER_SELL_PRICE}`); renderJokers(); updateUI(); } else { console.error("Invalid index for selling joker:", index); }
    }

    function rerollShop() {
        if (isAnimating) return; const freeRerollAvailable = hasVoucher("v_reroll") && !freeRerollUsedThisShop; if (freeRerollAvailable) { console.log("Using free reroll from Reroll Surplus voucher."); freeRerollUsedThisShop = true; populateShop(); } else { const currentCost = rerollCost; if (playerMoney >= currentCost) { playerMoney -= currentCost; rerollCost++; shopPlayerMoneyEl.textContent = playerMoney; playerMoneyEl.textContent = playerMoney; console.log(`Rerolled shop for $${currentCost}. New cost: $${rerollCost}`); populateShop(); } else { console.log("Not enough money to reroll."); } }
    }

    // --- Event Listeners ---
    playHandBtn.addEventListener("click", () => {
        if (selectedCards.length === 0 || handsLeft <= 0 || isAnimating || isSelectingTarotTarget) return;

        const handInfo = evaluatePokerHand(selectedCards);
        if (handInfo.name === "---" || (selectedCards.length !== 5 && ["STRAIGHT", "FLUSH", "STRAIGHT_FLUSH"].includes(handInfo.name))) {
            console.log("Invalid hand selection for", handInfo.name);
            potentialHandDisplay.textContent = `Invalid: ${handInfo.name} requires 5 cards`;
            return;
        }

        isAnimating = true;
        updateActionButtons(); // Disable buttons

        const cardsToScore = JSON.parse(JSON.stringify(selectedCards));
        const playedIDs = new Set(selectedCards.map(c => c.id));
        const originalPlayedCards = [...selectedCards]; // Keep a copy before clearing
        const cardElementsToDiscard = [];

        // Add discard animation class
        originalPlayedCards.forEach(cardData => {
            const cardElement = handArea.querySelector(`.card[data-id="${cardData.id}"]`);
            if (cardElement) {
                cardElement.classList.add("is-discarding");
                cardElementsToDiscard.push(cardElement);
            }
        });

        // Clear selection immediately visually
        selectedCards = [];
        potentialHandDisplay.textContent = "Selected Hand: ---";
        cardElementsToDiscard.forEach(el => el.classList.remove("selected")); // Remove selection style

        // Wait for discard animation to finish before proceeding
        setTimeout(() => {
            console.log("Playing hand:", cardsToScore.map(c => c.id), "as", handInfo.name);
            handsLeft--;

            // Calculate score (this also triggers joker/score animations)
            const scoreGained = calculateScore(cardsToScore, handInfo);
            currentScore += scoreGained;
            lastHandEl.textContent = `${handInfo.name} (Lv. ${handInfo.level}) - ${scoreGained}`;

            // Handle money gain from jokers
            let moneyGainedThisHand = 0;
            activeJokers.forEach(joker => {
                if (joker.effect.type === "money_per_hand") {
                    moneyGainedThisHand += joker.effect.value;
                }
            });
            if (moneyGainedThisHand > 0) {
                playerMoney += moneyGainedThisHand;
                console.log(`Gained $${moneyGainedThisHand} from Jokers this hand.`);
            }

            // Update hand state
            hand = hand.filter(card => !playedIDs.has(card.id));
            discardPile.push(...originalPlayedCards); // Add the original data to discard

            // Draw new cards
            const cardsToDrawCount = currentHandSize - hand.length;
            let newlyDrawnCards = [];
            if (cardsToDrawCount > 0) {
                newlyDrawnCards = drawCards(cardsToDrawCount);
                hand.push(...newlyDrawnCards);
            }

            // Render hand with draw animation for new cards
            renderHand(false, newlyDrawnCards.map(c => c.id));
            updateUI(); // Update score, hands left, money etc.

            // Check win/loss condition after UI update
            if (currentScore >= targetScore) {
                isAnimating = false; // Allow winRound to proceed
                winRound();
            } else if (handsLeft <= 0) {
                isAnimating = false; // Allow loseRound to proceed
                loseRound();
            } else {
                // Re-enable buttons after a short delay (allowing draw animation to start)
                setTimeout(() => {
                    isAnimating = false;
                    updateActionButtons();
                }, ANIMATION_DURATION); // Wait for draw animation
            }

        }, DISCARD_ANIMATION_DURATION); // Wait for discard animation
    });

    discardBtn.addEventListener("click", () => {
        if (selectedCards.length === 0 || discardsLeft <= 0 || isAnimating || isSelectingTarotTarget) return;

        isAnimating = true;
        updateActionButtons(); // Disable buttons

        console.log("Discarding:", selectedCards.map(c => c.id));
        discardsLeft--;

        const discardedIDs = new Set(selectedCards.map(c => c.id));
        const originalDiscardedCards = [...selectedCards]; // Keep a copy
        const cardElementsToDiscard = [];
        let createdTarot = false;

        // Add discard animation class and check purple seals
        originalDiscardedCards.forEach(cardData => {
            const cardElement = handArea.querySelector(`.card[data-id="${cardData.id}"]`);
            if (cardElement) {
                cardElement.classList.add("is-discarding");
                cardElementsToDiscard.push(cardElement);
            }
            // Check purple seal
            if (cardData.seal === "purple") {
                console.log(`  ${cardData.id} (Purple Seal) triggered!`);
                const newTarot = getRandomTarotCard();
                if (addConsumable(newTarot)) {
                    console.log(`  Created Tarot: ${newTarot.name}`);
                    createdTarot = true;
                } else {
                    console.log(`  Could not create Tarot ${newTarot.name} (slots full).`);
                }
                cardData.seal = null; // Consume seal
            }
        });

        // Clear selection immediately visually
        selectedCards = [];
        potentialHandDisplay.textContent = "Selected Hand: ---";
        cardElementsToDiscard.forEach(el => el.classList.remove("selected"));

        // Wait for discard animation
        setTimeout(() => {
            // Update hand state
            hand = hand.filter(card => !discardedIDs.has(card.id));
            discardPile.push(...originalDiscardedCards); // Add original data to discard

            // Draw new cards
            const cardsToDrawCount = currentHandSize - hand.length;
            let newlyDrawnCards = [];
            if (cardsToDrawCount > 0) {
                newlyDrawnCards = drawCards(cardsToDrawCount);
                hand.push(...newlyDrawnCards);
            }

            // Render hand with draw animation
            renderHand(false, newlyDrawnCards.map(c => c.id));
            if (createdTarot) renderConsumables(); // Render if tarot was created
            updateUI(); // Update discards left, etc.

            // Re-enable buttons after draw animation starts
            setTimeout(() => {
                isAnimating = false;
                updateActionButtons();
            }, ANIMATION_DURATION); // Wait for draw animation

        }, DISCARD_ANIMATION_DURATION); // Wait for discard animation
    });


    sortRankBtn.addEventListener("click", () => {
        if (isAnimating) return; hand.sort((a, b) => RANK_ORDER[a.rank] - RANK_ORDER[b.rank]); renderHand();
    });
    sortSuitBtn.addEventListener("click", () => {
        if (isAnimating) return; const suitOrder = { "club": 0, "diamond": 1, "heart": 2, "spade": 3 }; hand.sort((a, b) => { const suitDiff = suitOrder[a.suit] - suitOrder[b.suit]; if (suitDiff !== 0) return suitDiff; return RANK_ORDER[a.rank] - RANK_ORDER[b.rank]; }); renderHand();
    });

    // Screen navigation buttons
    runInfoBtn.addEventListener("click", () => { if (isAnimating) return; updateHandLevelDisplay(); updatePurchasedVouchersDisplay(); showScreen(runInfoScreen); });
    optionsBtn.addEventListener("click", () => { if (isAnimating) return; showScreen(optionsScreen); });
    if (backToGameBtnRunInfo) backToGameBtnRunInfo.addEventListener("click", () => showScreen(gameplayScreen));
    if (backToGameBtnOptions) backToGameBtnOptions.addEventListener("click", () => showScreen(gameplayScreen));

    // Shop buttons
    nextRoundBtn.addEventListener("click", () => { if (isAnimating) return; startNextRound(); showScreen(gameplayScreen); });
    rerollBtn.addEventListener("click", rerollShop);

    // --- Round/Game Flow ---
    function winRound() {
        console.log("Round Won!");
        const baseReward = parseInt(document.getElementById("blind-reward").textContent);
        const interest = Math.min(5, Math.floor(playerMoney / 5)); // Max $5 interest
        const handsBonus = handsLeft; // Bonus for hands remaining
        const totalWinnings = baseReward + interest + handsBonus;
        playerMoney += totalWinnings;
        console.log(`Cash Out: $${baseReward} (Blind) + $${interest} (Interest) + $${handsBonus} (Hands) = $${totalWinnings}`);

        // Trigger end-of-round card effects (Gold/Blue seals)
        let createdPlanet = false;
        hand.forEach(card => {
            if (card.seal === "gold") {
                playerMoney += 3;
                console.log(`  ${card.id} (Gold Seal) triggered! +$3`);
                card.seal = null; // Consume seal
            } else if (card.seal === "blue") {
                console.log(`  ${card.id} (Blue Seal) triggered!`);
                const newPlanet = getRandomPlanetCard();
                console.log(`  Created Planet: ${newPlanet.name}`);
                usePlanetCard(newPlanet);
                createdPlanet = true;
                card.seal = null; // Consume seal
            }
        });

        // Update money display
        shopPlayerMoneyEl.textContent = playerMoney;
        playerMoneyEl.textContent = playerMoney;
        if (createdPlanet) updateHandLevelDisplay(); // Update if planets were used

        // Reset shop state for next visit
        rerollCost = 1; // Reset reroll cost
        freeRerollUsedThisShop = false; // Reset free reroll voucher usage
        currentBlindEffect = null; // Clear blind effect after winning

        populateShop();
        showScreen(shopScreen);
    }
    function loseRound() {
        console.log("Round Lost!"); alert("Game Over!"); initGame();
    }
    function startNextRound() {
        console.log("Starting next round setup...");
        currentScore = 0;
        handsLeft = 4;
        applyVoucherEffects(); // Recalculate discards based on vouchers
        discardPile = [];
        selectedCards = [];
        lastHandEl.textContent = "---";
        currentBlindEffect = null; // Clear previous blind effect first
        isAnimating = false; // Ensure animation flag is reset

        if (isSelectingTarotTarget) cancelTarotTargeting();

        // --- Ante / Round Progression ---
        currentRound++;
        if (currentRound > 3) { // Completed Small, Big, Boss
            currentRound = 1;
            currentAnte++;
            if (currentAnte > 8) { // Win condition (placeholder)
                alert("YOU WIN THE GAME (Placeholder)!");
                initGame(); // Restart
                return;
            }
        }

        // --- Set Target Score & Blind Info ---
        targetScore = 100 * currentAnte + 50 * (currentRound - 1) * currentAnte; // Example scaling
        let blindName = "Unknown Blind";
        let blindReward = 4 + currentAnte + (currentRound - 1); // Example scaling
        let blindEffectDescription = ""; // For boss blinds

        if (currentRound === 1) {
            blindName = "Small Blind";
        } else if (currentRound === 2) {
            blindName = "Big Blind";
        } else { // currentRound === 3: Boss Blind
            blindName = "Boss Blind";
            // Select and apply a boss effect
            if (BOSS_BLINDS.length > 0) {
                const bossIndex = Math.floor(Math.random() * BOSS_BLINDS.length);
                const selectedBoss = BOSS_BLINDS[bossIndex];
                currentBlindEffect = selectedBoss.selectEffect(); // Get the specific effect instance
                currentBlindEffect.bossName = selectedBoss.name; // Store boss name for display
                blindName = selectedBoss.name; // Use boss name as the blind name
                blindEffectDescription = currentBlindEffect.description;
                console.log(`Selected Boss Blind: ${blindName} - ${blindEffectDescription}`);
            } else {
                console.warn("No boss blinds defined!");
                blindName = "Boss Blind (No Effect)";
            }
        }

        // Update Blind Info Display
        blindInfoDisplay.querySelector("h3").textContent = blindName;
        blindInfoDisplay.querySelector("#blind-reward").textContent = blindReward;
        const effectEl = blindInfoDisplay.querySelector("#blind-effect");
        if (blindEffectDescription) {
            effectEl.textContent = blindEffectDescription;
            effectEl.style.display = "block"; // Show effect description
        } else {
            effectEl.textContent = "";
            effectEl.style.display = "none"; // Hide effect description
        }

        // --- Reset Deck and Hand ---
        createDeck();
        shuffleDeck();
        dealInitialHand(); // Deals based on currentHandSize and triggers draw animation

        updateUI();
        showScreen(gameplayScreen);
        console.log(`Ante ${currentAnte}, Round ${currentRound} (${blindName} - Target: ${targetScore}) started.`);
    }

    // --- Game Initialization ---
    function initGame() {
        console.log("Initializing game...");
        deck = [];
        hand = [];
        discardPile = [];
        selectedCards = [];
        activeJokers = [];
        activeConsumables = [];
        purchasedVouchers = [];
        currentScore = 0;
        targetScore = 100;
        handsLeft = 4;
        currentHandSize = BASE_HAND_SIZE; // Reset to base
        discardsLeft = BASE_DISCARDS; // Reset to base
        playerMoney = 10;
        currentAnte = 1;
        currentRound = 1;
        rerollCost = 1;
        shopItems = { jokers: [null, null, null], voucher: null, packs: [null, null] };
        activeTarotEffect = null;
        isSelectingTarotTarget = false;
        freeRerollUsedThisShop = false;
        currentBlindEffect = null; // Ensure no blind effect on new game
        isAnimating = false; // Reset animation flag

        // Reset Hand Levels
        handLevels = {
            HIGH_CARD: 1, PAIR: 1, TWO_PAIR: 1, THREE_OF_A_KIND: 1, STRAIGHT: 1,
            FLUSH: 1, FULL_HOUSE: 1, FOUR_OF_A_KIND: 1, STRAIGHT_FLUSH: 1, FIVE_OF_A_KIND: 1,
        };

        // Reset UI elements to default
        blindInfoDisplay.querySelector("h3").textContent = "Small Blind";
        blindInfoDisplay.querySelector("#blind-reward").textContent = "4"; // Initial small blind reward
        blindInfoDisplay.querySelector("#blind-effect").textContent = "";
        blindInfoDisplay.querySelector("#blind-effect").style.display = "none";
        lastHandEl.textContent = "---";
        rerollCostEl.textContent = rerollCost;

        applyVoucherEffects(); // Apply base stats (important if base values change later)
        createDeck();
        shuffleDeck();
        dealInitialHand(); // Deals initial hand with animation
        updateUI(); // Full UI refresh
        shopPlayerMoneyEl.textContent = playerMoney; // Update shop money display too
        showScreen(gameplayScreen);
        console.log("Game ready.");
    }

    initGame(); // Start the game
});
