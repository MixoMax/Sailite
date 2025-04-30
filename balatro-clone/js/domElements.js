// --- DOM Elements ---
export const gameplayScreen = document.getElementById("gameplay-screen");
export const shopScreen = document.getElementById("shop-screen");
export const runInfoScreen = document.getElementById("run-info-screen");
export const optionsScreen = document.getElementById("options-screen");

// Gameplay Elements
export const targetScoreEl = document.getElementById("target-score");
export const currentScoreEl = document.getElementById("current-score");
export const lastHandEl = document.getElementById("last-hand");
export const handsLeftEl = document.getElementById("hands-left");
export const discardsLeftEl = document.getElementById("discards-left");
export const playerMoneyEl = document.getElementById("player-money");
export const currentAnteEl = document.getElementById("current-ante");
export const currentRoundEl = document.getElementById("current-round");
export const deckCountEl = document.getElementById("deck-count");
export const handArea = document.getElementById("hand-area");
export const potentialHandDisplay = document.getElementById("potential-hand-display");
export const playHandBtn = document.getElementById("play-hand-btn");
export const discardBtn = document.getElementById("discard-btn");
export const sortRankBtn = document.getElementById("sort-rank-btn");
export const sortSuitBtn = document.getElementById("sort-suit-btn");
export const runInfoBtn = document.getElementById("run-info-btn");
export const optionsBtn = document.getElementById("options-btn");
export const jokerSlotsContainer = document.getElementById("joker-slots");
export const consumableSlotsContainer = document.getElementById("consumable-slots");
export const blindInfoDisplay = document.getElementById("blind-info"); // Get the blind info div

// Other Screen Buttons
export const backToGameBtnRunInfo = document.getElementById("back-to-game-btn-runinfo");
export const backToGameBtnOptions = document.getElementById("back-to-game-btn-options");
export const handLevelsDisplay = document.getElementById("hand-levels-display");
export const purchasedVouchersDisplay = document.getElementById("purchased-vouchers-display"); // Added for Run Info

// Shop Elements
export const shopPlayerMoneyEl = document.getElementById("shop-player-money");
export const nextRoundBtn = document.getElementById("next-round-btn");
export const rerollBtn = document.getElementById("reroll-btn");
export const rerollCostEl = document.getElementById("reroll-cost");
export const shopJokerSlots = document.querySelectorAll("#shop-jokers-consumables .shop-slot");
export const shopVoucherSlot = document.getElementById("voucher-slot"); // Specific ID for the voucher slot
export const shopPackSlots = document.querySelectorAll("#shop-pack-area .shop-slot");

// Blind Info Elements (within blindInfoDisplay)
export const blindNameEl = blindInfoDisplay.querySelector("h3");
export const blindRewardEl = blindInfoDisplay.querySelector("#blind-reward");
export const blindEffectEl = blindInfoDisplay.querySelector("#blind-effect");

// Cash Out Screen Elements
export const cashOutScreen = document.getElementById("cash-out-screen");
export const cashOutBlindEl = document.getElementById("cash-out-blind");
export const cashOutInterestEl = document.getElementById("cash-out-interest");
export const cashOutHandsEl = document.getElementById("cash-out-hands");
export const cashOutTotalEl = document.getElementById("cash-out-total");
export const cashOutBalanceEl = document.getElementById("cash-out-balance");
export const continueToShopBtn = document.getElementById("continue-to-shop-btn");
