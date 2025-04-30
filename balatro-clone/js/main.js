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

// --- Debug / Placeholder ---
// Add any debug functions or initial setup needed
window.debug = {
    // Example: Add money
    addMoney: (amount) => {
        import('./state.js').then(({ state, setPlayerMoney }) => {
            setPlayerMoney(state.playerMoney + amount);
            import('./ui.js').then(({ updateUI }) => updateUI());
            import('./shop.js').then(({ populateShop }) => populateShop()); // Update shop availability
            console.log(`Added $${amount}. Current money: $${state.playerMoney}`);
        });
    },
    // Example: Add specific joker
    addJoker: (jokerId) => {
        Promise.all([
            import('./state.js'),
            import('./constants.js'),
            import('./ui.js'),
            import('./shop.js')
        ]).then(([{ state, setActiveJokers }, { JOKER_POOL, MAX_JOKERS }, { renderJokers, updateUI }, { populateShop }]) => {
            const jokerToAdd = JOKER_POOL.find(j => j.id === jokerId);
            if (jokerToAdd && state.activeJokers.length < MAX_JOKERS) {
                const jokerInstance = { ...jokerToAdd };
                 if (jokerInstance.effect.type === "scaling_mult") {
                    jokerInstance.currentValue = 0; // Initialize scaling value
                }
                setActiveJokers([...state.activeJokers, jokerInstance]);
                renderJokers();
                updateUI();
                populateShop(); // Update shop availability
                console.log(`Added Joker: ${jokerToAdd.name}`);
            } else if (!jokerToAdd) {
                console.error(`Joker with ID "${jokerId}" not found.`);
            } else {
                 console.error(`Cannot add Joker, slots full.`);
            }
        });
    }
    // Add more debug functions as needed
};
