// --- Main Game Entry Point ---
import * as dom from './domElements.js';
import { initGame, playSelectedHand, discardSelectedCards, startNextRound } from './game.js';
import { showScreen, sortHandByRank, sortHandBySuit, updateHandLevelDisplay, updatePurchasedVouchersDisplay } from './ui.js';
import { rerollShop } from './shop.js';
// Hand functions like toggleCardSelection are implicitly handled via event listeners set up in ui.js/renderCard
// Item functions like useConsumable are implicitly handled via event listeners set up in ui.js/renderConsumables
// Shop functions like buyItem/sellJoker are implicitly handled via event listeners set up in shop.js/populateShop and ui.js/renderJokers

// --- Event Listeners ---

// Gameplay Buttons
dom.playHandBtn.addEventListener("click", playSelectedHand);
dom.discardBtn.addEventListener("click", discardSelectedCards);
dom.sortRankBtn.addEventListener("click", sortHandByRank);
dom.sortSuitBtn.addEventListener("click", sortHandBySuit);

// Screen Navigation Buttons
dom.runInfoBtn.addEventListener("click", () => {
    updateHandLevelDisplay(); // Update info before showing
    updatePurchasedVouchersDisplay();
    showScreen(dom.runInfoScreen);
});
dom.optionsBtn.addEventListener("click", () => showScreen(dom.optionsScreen));
dom.backToGameBtnRunInfo.addEventListener("click", () => showScreen(dom.gameplayScreen));
dom.backToGameBtnOptions.addEventListener("click", () => showScreen(dom.gameplayScreen));

// Shop Buttons
dom.nextRoundBtn.addEventListener("click", startNextRound);
dom.rerollBtn.addEventListener("click", rerollShop);

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM Loaded. Initializing game...");
    initGame(); // Start the game once the DOM is ready
});
