// --- Game Constants ---
const SUITS = ["heart", "diamond", "club", "spade"];
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
const RANKS_TO_HUMAN = {
    "2": "Two", "3": "Three", "4": "Four", "5": "Five", "6": "Six", "7": "Seven",
    "8": "Eight", "9": "Nine", "T": "Ten", "J": "Jack", "Q": "Queen", "K": "King", "A": "Ace"
};
const RANK_ORDER = RANKS.reduce((acc, rank, index) => { acc[rank] = index; return acc; }, {});
const BASE_HAND_SIZE = 8; // Base value
const BASE_HANDS = 4; // Base value for hands per round
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
            // Need SUITS here, will import later in main.js or pass it around
            const tempSuits = ["heart", "diamond", "club", "spade"]; // Temporary fix
            const debuffedSuit = tempSuits[Math.floor(Math.random() * tempSuits.length)];
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

// Export all constants
export {
    SUITS, RANKS, RANK_ORDER, BASE_HAND_SIZE, BASE_HANDS, BASE_DISCARDS, MAX_SELECT, MAX_JOKERS, MAX_CONSUMABLES,
    JOKER_SELL_PRICE, ANIMATION_DURATION, DISCARD_ANIMATION_DURATION, INTEREST_RATE, INTEREST_CAP, HAND_MONEY_BONUS,
    PROB_EDITION_FOIL, PROB_EDITION_HOLO, PROB_EDITION_POLY, PROB_SEAL_ANY, SEALS, PROB_BUFFOON_PACK,
    BASE_HAND_SCORES, JOKER_POOL, PLANET_CARDS, TAROT_POOL, VOUCHER_POOL, PACKS, BOSS_BLINDS, RANKS_TO_HUMAN
};
