Okay, let's break down the scoring animations in Balatro step-by-step, based on typical gameplay flow:

**1. Pre-Trigger: Selecting Cards & Hand Preview**

*   As the player clicks cards in their hand, the selected cards usually lift slightly or are highlighted.
*   Simultaneously, the "Played Hand Display" area (below the Round Score) updates in real-time to show:
    *   The highest valid poker hand type formed by the selected cards (e.g., "Pair," "Flush," "High Card").
    *   The current *base* `Chips x Mult` value for that hand type at its current level, *before* specific card contributions or Joker effects are calculated for this specific play.

**2. Trigger: Clicking "Play Hand"**

*   The selected cards perform a slightly more pronounced animation, often lifting further up or pulsing briefly, confirming the action.
*   The "Hands" counter decreases by one.

**3. Score Calculation & Triggering Animations (Sequential Process):**

This is the core visual feedback loop and happens rapidly:

*   **Played Card Contributions & Effects:**
    *   The selected cards often "activate." Each card involved in the scoring might briefly flash or pulse.
    *   The base `Chips` value in the "Played Hand Display" increases as the chip values of the individual scored cards (Ace=11, K=10, 5=5, etc.) are added. This update is usually very fast, almost instantaneous, or shown as quick sequential additions.
    *   If any played cards have *triggered effects* (e.g., a Red Seal re-triggering, a Lucky card potentially adding Mult or $), that specific card might have a more distinct animation (e.g., the Red Seal glows red, the Lucky card shimmers). Pop-up text or icons often appear briefly near the card or the score display (e.g., "+10 Chips", "+4 Mult", "x1.5 Mult").
*   **Joker Triggering (Left-to-Right):**
    *   The game processes the Jokers sequentially from the leftmost slot to the rightmost slot.
    *   As each Joker's effect is calculated, the Joker card itself typically **highlights, pulses, or performs a small unique animation**.
    *   Simultaneously, the corresponding value in the `[Chips] x [Mult]` display updates:
        *   `+Chips` Jokers: The blue Chips number increases.
        *   `+Mult` Jokers: The red Mult number increases.
        *   `xMult` Jokers: The red Mult number visibly multiplies (often shown with a larger text flash or brief calculation animation before settling on the new value).
    *   Pop-up text indicating the effect (+X Chips, +Y Mult, xZ Mult) often appears briefly near the triggering Joker or the score display. This sequential highlighting provides crucial feedback on *how* the score is being built.
*   **Final Score Calculation Visualization:**
    *   Once all played cards and Jokers have triggered, the final `Chips x Mult` calculation occurs. This is often visualized dramatically:
        *   The blue Chips number and the red Mult number might "collide" or have energy effects flowing between them.
        *   The numbers themselves might briefly ignite, grow larger, or shake.
        *   The resulting total score appears prominently.

**4. Score Application & Card Movement:**

*   **Score Transfer:** The calculated total score detaches from the `Chips x Mult` display and animates (often flying upwards with a trail) towards the "Round Score" display, adding to the current total with a distinct sound and visual pulse.
*   **Played Card Destination:** The cards that were just played animate off the screen. Typically, they fly upwards or slightly diagonally off the top edge, visually entering a conceptual "discard pile" (which isn't usually shown explicitly on screen).
    *   *Exception (Steel Cards):* If a Steel card is played, it remains in the hand area but might dim slightly or have a visual indicator that its effect was used for that hand, as it's not discarded immediately.
*   **New Card Draw:** Empty slots in the player's hand are immediately filled. New cards animate in, typically sliding or being dealt rapidly from the visual Draw Pile (usually on the right side of the screen) into the empty hand slots.

**Summary of Visual Flow:**

Select Cards -> Hand Preview Updates -> Click Play Hand -> Selected Cards Animate -> Played Cards Add Base Chips -> Jokers Trigger Left-to-Right (Highlight + Score Update) -> Final Chips x Mult Calculation Animation -> Score Flies to Round Total -> Played Cards Fly Off-Screen (Discarded) -> New Cards Dealt from Draw Pile.

This sequence provides constant, dynamic feedback, allowing the player to understand how their cards and Jokers contribute to the final score in real-time, which is essential for a roguelike deckbuilder. The animations are designed to be quick but informative and satisfying.