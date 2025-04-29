Okay, here is a comprehensive breakdown of Balatro based on the provided video and general knowledge of the game, structured for a game development team to recreate it.

## Balatro: Game Design Document Outline

**1. Game Overview**

*   **Name:** Balatro (Pronounced "Bala-tro")
*   **Genre:** Roguelike Deckbuilder with Poker Mechanics
*   **Theme:** Psychedelic/Retro Poker
*   **Core Concept:** Players play poker hands to score points ("Chips") against escalating target scores ("Blinds"). They enhance their scoring potential by acquiring and combining various modifier cards, primarily "Jokers," along with other special card types and upgrades purchased in a shop between rounds.
*   **Objective:** Successfully defeat 8 "Antes," each consisting of a Small Blind, Big Blind, and a mandatory Boss Blind, culminating in a final score requirement for the Ante 8 Boss Blind. Winning unlocks higher difficulties ("Stakes") and Endless Mode.

**2. Core Gameplay Loop**

The game progresses through Antes. Each Ante follows this loop:

1.  **Ante Start:** Player is presented with the Blind selection screen for the current Ante.
2.  **Blind Selection (Small Blind):**
    *   Player sees the Small Blind target score and potential reward ($).
    *   Player can choose to **Select** (play the blind) or **Skip Blind**.
    *   Skipping grants a specific "Skip Tag" bonus (e.g., free Reroll, specific booster pack) but forfeits the money reward and shop visit for this blind.
3.  **Round (If Blind Selected):**
    *   Player draws cards up to their maximum hand size (default 8).
    *   Player selects up to 5 cards from their hand. The UI shows the potential poker hand formed and its base `Chips x Mult` score.
    *   Player can choose to **Play Hand** or **Discard** selected cards.
    *   **Play Hand:**
        *   Uses one available "Hand."
        *   Calculates score based on the hand type, cards played, Jokers, and other effects (See Scoring System).
        *   Adds score to the "Round Score."
        *   If Round Score ≥ Target Score, the Blind is won.
        *   Discards played cards (unless modified by effects like Steel cards).
        *   Draws back up to max hand size.
    *   **Discard:**
        *   Uses one available "Discard."
        *   Selected cards are discarded.
        *   Draws back up to max hand size.
    *   Repeat selecting/playing/discarding until the Blind is won OR Hands run out.
4.  **Round End (Win):**
    *   Player receives "Cash Out" - Base reward + $1 per remaining Hand + Interest ($1 per $5 held, max $5 interest).
    *   Player enters the **Shop Screen**.
5.  **Round End (Lose):**
    *   "Game Over" screen is displayed. Run ends.
6.  **Shop Phase:**
    *   Player spends money ($) to buy items (Jokers, Packs, Vouchers).
    *   Player can **Reroll** the shop contents for a cost (increases with each reroll in the same shop visit).
    *   Player chooses **Next Round** to proceed.
7.  **Blind Selection (Big Blind):** Repeat steps 2-6 for the Big Blind (higher target score, potentially different Skip Tag).
8.  **Blind Selection (Boss Blind):**
    *   Player MUST play the Boss Blind (no skip option).
    *   Boss Blind has a significantly higher target score AND a unique, run-altering negative effect (e.g., "All Heart cards are debuffed," "Forces 1 card to always be selected," "Debuffs previously played hand type").
    *   Repeat steps 3-6 (Round, Win/Lose, Shop).
9.  **Ante End:** After defeating the Boss Blind and visiting the shop, the next Ante begins (Step 1), with increased base target scores.
10. **Game End (Win):** Defeat the Ante 8 Boss Blind. Display "You Win!" screen with run summary. Unlock next Stake (if applicable) and Endless Mode option.
11. **Game End (Lose):** Display "Game Over" screen with run summary.

**3. Key Screens & UI**

*   **A. Gameplay Screen:**
    *   **Left Panel (Top to Bottom):**
        *   Current Blind Info: Icon (Small/Big/Boss), Name, Target Score, Reward ($$$ symbols).
        *   Round Score: Current accumulated score for this blind.
        *   Played Hand Display: Shows the last played hand type (e.g., "Flush"), its Level (e.g., Lv. 6), and the scoring formula breakdown (`[Chips] x [Mult]`). Values update dynamically based on Jokers/effects.
        *   Hands Counter: Number of hands remaining for this blind.
        *   Discards Counter: Number of discards remaining for this blind.
        *   Money ($): Current player currency.
        *   Ante Counter: Current Ante / Total Antes (e.g., 7 / 8).
        *   Round Counter: Current Blind within the Ante (e.g., 1=Small, 2=Big, 3=Boss). *[Note: Video shows "Round", might just be Blind counter]*
        *   Run Info Button: Opens the Run Info screen.
        *   Options Button: Opens game options/menu.
    *   **Top Area:**
        *   Joker Slots: Displays currently held Jokers (Max 5, modifiable by Vouchers/effects). Order matters for calculation.
        *   Consumable Slots: Displays currently held Tarot/Planet/Spectral cards (Max 2, modifiable by Vouchers/effects).
    *   **Center Area:**
        *   Hand: Displays the cards currently held by the player (Max 8, modifiable). Cards can be clicked to select/deselect.
        *   Play Hand Button: Becomes active when 1-5 cards are selected.
        *   Sort Hand Buttons: Options to sort hand by Rank or Suit.
        *   Discard Button: Becomes active when 1-5 cards are selected.
    *   **Right Area:**
        *   Draw Pile: Shows the number of cards remaining in the draw pile (e.g., 34/52). Visual representation of the deck back.

*   **B. Shop Screen:**
    *   **Title:** "SHOP", "Improve your run!"
    *   **Top Row (Jokers/Consumables for Sale):** Displays 2-4 items (usually Jokers, sometimes Tarot/Planet cards) with their cost ($). Mouse-over shows card details. Can click "Buy" if affordable.
    *   **Middle Row (Buttons):**
        *   Next Round Button: Proceeds to the next Blind/Ante.
        *   Reroll Button: Spends money to refresh shop contents (Jokers/Consumables and Packs). Cost increases per use within the same shop visit.
    *   **Bottom Row (Voucher/Packs):**
        *   Voucher Slot (Left): Displays one Voucher card with its cost ($10). Mouse-over shows details. Click "Buy". Disappears once purchased for the run.
        *   Pack Slots (Right): Displays 2 Booster Packs with their cost ($). Mouse-over shows pack type. Click "Buy".
    *   **Persistent UI:** Money ($), Ante/Round counters visible.

*   **C. Run Info Screen:**
    *   **Tabs:** "Poker Hands", "Blinds", "Vouchers".
    *   **Poker Hands Tab:** Lists all standard poker hands. For each hand:
        *   Level (e.g., Lvl. 1, Lvl. 4)
        *   Hand Name (e.g., Straight Flush, Two Pair)
        *   Base Score (`[Chips] x [Mult]`) - Reflects current level ups.
        *   Times Played: Counter for how many times this hand has been played this run.
    *   **Blinds Tab:** (Likely shows encountered Boss Blind effects for the run).
    *   **Vouchers Tab:** (Likely shows purchased Vouchers for the run).
    *   **Back Button:** Returns to the previous screen.

*   **D. Blind Selection Screen:**
    *   Displays columns for Small Blind, Big Blind, and the upcoming Boss Blind.
    *   Each column shows:
        *   Blind Icon/Name
        *   Target Score
        *   Reward ($$$)
        *   Skip Blind Button (for Small/Big) OR Boss Blind Effect Description (for Boss).
        *   Skip Tag Reward Icon/Description (appears on hover/selection of Skip).
    *   **Select Button:** Highlights the chosen Blind to play.

*   **E. Game Over Screen:**
    *   Title: "GAME OVER"
    *   Run Summary Stats: Best Hand score, Most Played Hand (Type, Count), Cards Played, Cards Discarded, Cards Purchased, Times Rerolled, New Discoveries, Seed (text string), Ante Reached, Round Reached, Defeated By (Blind Name/Icon).
    *   Buttons: New Run, Main Menu, Copy Seed.

*   **F. Win Screen:**
    *   Title: "YOU WIN!"
    *   Run Summary Stats: (Similar to Game Over Screen).
    *   Buttons: New Run, Main Menu, Copy Seed, Endless Mode.

*   **G. Main Menu Screen (Conceptual):**
    *   Buttons: Play/New Run, Continue Run (if applicable), Collections, Challenges, Options, Quit.
    *   Deck Selection UI (when starting New Run).
    *   Stake Selection UI (when starting New Run).

*   **H. Booster Pack Opening Screen:**
    *   Displays the cards obtained from the pack (e.g., "Choose 1 of 3 Planet Cards," "Choose 2 of 5 Tarot Cards").
    *   Player clicks to select cards.
    *   Skip/Confirm button.

**4. Core Mechanics**

*   **A. Playing Cards & Hands:**
    *   Use standard 52-card deck (can be modified by Decks/effects).
    *   Player selects 1-5 cards to form a Poker Hand.
    *   Valid Hands (Lowest to Highest Base Score): High Card, Pair, Two Pair, Three of a Kind, Straight, Flush, Full House, Four of a Kind, Straight Flush, Five of a Kind (requires specific setups like Wild Cards).
    *   *Hand Leveling:* Planet cards are used to level up specific poker hands, increasing their base Chips and Mult permanently for the run.
    *   *Card Enhancements:* Playing cards can have special properties applied via Tarot cards, Spectral cards, or other effects:
        *   *Edition:* Foil (+50 Chips), Holographic (+10 Mult), Polychrome (x1.5 Mult) - Visual effect on card.
        *   *Seal:* Red (Retriggers card effect 1x when played), Blue (Creates specific Planet card if held in hand at end of round), Gold (Gives $3 if held in hand at end of round), Purple (Creates Tarot card if discarded). - Seal icon on card.
        *   *Enhancement:* Bonus Card (+30 Chips), Mult Card (+4 Mult), Wild Card (Can be any Suit), Glass Card (x2 Mult, 1 in 4 chance to shatter on scoring), Steel Card (x1.5 Mult while card remains in hand after playing), Stone Card (+50 Chips, no rank/suit), Lucky Card (1 in 5 chance for +20 Mult, 1 in 15 chance for $20). - Visual effect/icon on card.
*   **B. Scoring System:**
    *   Formula: `Total Score = Effective Chips * Effective Mult`
    *   `Effective Chips = Base Hand Chips + Sum(Played Card Chips) + Sum(+Chips Effects from Jokers/Cards)`
    *   `Effective Mult = (Base Hand Mult + Sum(+Mult Effects from Jokers/Cards)) * Product(xMult Effects from Jokers/Cards)`
    *   *Order of Operations:* All +Chips effects are added. All +Mult effects are added. These sums form the base for multiplication. Then, all xMult effects are multiplied sequentially against the Mult total.
    *   *Card Chip Values:* Ace=11, K/Q/J=10, 10=10, 9=9... 2=2. Face cards = 10. Number cards = their number.
    *   *Joker Order:* Jokers trigger left-to-right. xMult Jokers should generally be placed on the rightmost slots to multiply the largest possible accumulated +Mult value.
*   **C. Discards & Hands Limits:**
    *   Player starts with a default number of Hands (e.g., 4) and Discards (e.g., 3) per round.
    *   These can be increased/decreased by Jokers, Vouchers, Stakes, or Boss Blind effects.
    *   Running out of Hands before reaching the target score results in a loss.
*   **D. Blinds System:**
    *   *Small/Big Blinds:* Optional rounds primarily for earning money and shop access. Target scores scale with Antes.
    *   *Boss Blinds:* Mandatory rounds with unique negative modifiers that test the player's build. Target scores scale significantly. Boss effects are randomized per Ante.
    *   *Skip Tags:* Skipping Small/Big blinds provides an immediate, often strategic, bonus instead of money/shop.
*   **E. Shop System:**
    *   Primary way to acquire Jokers, Packs, and Vouchers.
    *   Contents are randomized (within certain pools/rarities).
    *   Rerolling allows seeing new items but costs increasing amounts of money.
*   **F. Money & Interest:**
    *   Earned by beating blinds, leftover hands bonus, interest, Gold Seals, Lucky Cards, specific Joker effects.
    *   Spent in the Shop.
    *   Interest mechanic encourages holding onto money ($1 per $5, max $5 interest per round win payout).
*   **G. Jokers:**
    *   The core power scaling mechanic. 150 unique Jokers.
    *   Provide passive effects that modify scoring (+Chips, +Mult, xMult) or gameplay (e.g., extra Discards, card generation, modifying card properties).
    *   Have Rarities (Common, Uncommon, Rare, Legendary) affecting appearance rate and often power.
    *   Can have Editions (Foil, Holo, Polychrome, Negative) which add inherent stat boosts (+50 Chips, +10 Mult, x1.5 Mult, -1 Joker Slot respectively) on top of the Joker's main effect.
*   **H. Consumables (Tarot, Planet, Spectral Cards):**
    *   One-time use cards held in limited consumable slots.
    *   *Tarot Cards:* Apply immediate effects - enhance cards in hand, give money, duplicate cards, create Jokers, etc.
    *   *Planet Cards:* Level up a specific poker hand type, increasing its base Chips/Mult.
    *   *Spectral Cards:* Offer powerful, often double-edged effects - drastically alter cards, Jokers, or deck composition.
*   **I. Vouchers:**
    *   Permanent run upgrades bought for $10 in the shop.
    *   Provide passive benefits (e.g., +1 Hand, +1 Discard, +1 Joker Slot, +1 Consumable Slot, shop improvements).
    *   Only one specific Voucher appears per shop visit until purchased.
*   **J. Decks:**
    *   Players choose a starting Deck when beginning a new run.
    *   Each Deck provides a unique starting bonus or modifier (e.g., Red Deck: +1 Discard; Blue Deck: +1 Hand; Yellow Deck: +$10 starting money; Green Deck: No interest, but more money per round; Black Deck: +1 Joker Slot, -1 Hand; Magic Deck: Starts with Crystal Ball Voucher, 2 free Tarot cards; Nebula Deck: Starts with Telescope Voucher, -1 Consumable Slot; Ghost Deck: Spectrals appear in shop, starts with Hex/Ectoplasm Spectral; Abandoned Deck: No face cards; Checkered Deck: Starts with 26 Spades/26 Hearts; Zodiac Deck: Starts with specific Vouchers; Painted Deck: +2 Hand Size, -1 Joker Slot; Anaglyph Deck: Double Tags appear after boss; Plasma Deck: Chips/Mult scale based on Blinds, requires higher score; Erratic Deck: Ranks/Suits are randomized).
    *   Decks are unlocked by meeting specific gameplay conditions.

**5. Progression & Meta-Game**

*   **Antes:** 8 stages of increasing difficulty.
*   **Stakes:** Difficulty levels (White -> Red -> Green -> Black -> Blue -> Purple -> Orange -> Gold). Each adds a cumulative negative modifier (e.g., Blinds scale faster, shop prices increase, eternal Boss effects, -1 Discard). Unlocked by winning on the previous Stake.
*   **Unlocks:** New Jokers, Decks, and Vouchers are added to the potential pool by completing certain achievements or winning runs.
*   **Challenges:** 20 unique scenarios with specific rules, decks, and restrictions, offering different ways to play.
*   **Endless Mode:** Play beyond Ante 8 with continually scaling Blind requirements and potentially other modifiers.
*   **Collections:** An in-game menu tracking all discovered Jokers, Cards, Vouchers, Tags, etc.
*   **Statistics:** Tracks best scores, hands played, wins/losses, etc.

**6. Visual & Audio Style**

*   **Visuals:** Pixel art aesthetic with CRT filter effect. Psychedelic background animations. Clear visual indicators for card enhancements, Seals, and editions. Satisfying particle effects and screen shake for scoring.
*   **Audio:** Retro-inspired electronic/ambient music. Punchy sound effects for card plays, scoring, purchases, errors, etc. Distinct sounds for different card types/effects activating.

**7. Technical Considerations (Implied)**

*   Robust randomization for card draws, shop contents, Blind effects, pack contents.
*   Accurate implementation of the scoring formula, especially modifier interactions and Joker order.
*   Saving/Loading run progress.
*   Persistence of unlocks and collection data.
*   Seed system for recreating specific run conditions.

This detailed description covers the core loop, mechanics, UI, progression, and items necessary to understand and recreate Balatro. Developers would need specific asset lists, exact numerical values for all base scores/effects/scaling, and detailed logic for each unique card/Joker/effect, but this framework provides the complete functional blueprint.