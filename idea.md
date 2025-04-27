# Game Idea: "Sailite"

**Core Concept:** A tense, arcade-style roguelike where survival hinges purely on skillful maneuvering. You pilot a sailing trade vessel through treacherous waters, dodging increasingly complex barrages of pirate projectiles ("Bullet Storms") and environmental hazards. There is no direct combat from the player; the focus is entirely on evasion, navigation, and resource management (cargo = health).

The core game loop is as follows:  
1) Choose a vessel from the unlocked options. Each ship has unique stats (speed, cargo capacity, hitbox size).
2) Start at a port and select a trade route. Each route has a different difficulty, length, and potential hazards (e.g., maelstroms, reefs).
3) Navigate through the route, dodging pirate projectiles and environmental hazards. Survive multiple "Bullet Storms" (waves of projectiles) while managing wind direction and speed. Arrive at the destination port with as much cargo intact as possible.
4) Get paid based on the amount and type of cargo delivered. You can now spend currency at the port to buy one of the available upgrades (permanent upgrades to the ship, crewmates, etc.).
5) Repeat the process, selecting a new trade route from the current port. The game continues until you run out of cargo (health) or complete a major objective (e.g., defeating a final boss).

**Core Mechanic:**
*   **Pure Evasion:** Control your ship's movement to weave through dense patterns of incoming pirate projectiles. Controls should feel responsive but weighty, reflecting a sailing ship influenced by momentum and wind.
*   **Cargo as Health:** Your primary goal is delivering cargo. Each hit from a pirate projectile or hazard knocks cargo overboard. Running out of cargo means mission failure (and potentially the end of the run).
*   **Wind Simulation:** A simplified wind system affects your ship's speed. Sailing downwind provides a significant speed boost, while sailing upwind or across the wind slows you down. This adds a layer of navigational strategy to dodging. Visual cues (wind lines, sail animation) clearly indicate wind direction and effect.

**Roguelike Elements:**
*   **Progression:** Advance through a series of procedurally generated "Trade Routes," each consisting of multiple Bullet Storms. Routes vary in length, difficulty, potential rewards, and may feature unique environmental hazards (e.g., narrow channels, maelstroms, fog). Boss stages appear at the end of routes or key milestones – these are challenging, hand-crafted bullet hell sequences themed around unique pirate captains or legendary sea monsters.
*   **Modifiers (Pickups/Temporary Boosts):** Found adrift during stages or occasionally awarded.
    *   *Shield Modules:* Temporary invincibility bubble (lasts X seconds) or absorb N hits. Visual indicator is crucial.
    *   *Phase Shifters:* Short, cooldown-based dash that grants brief invulnerability, allowing passage through projectiles. Requires precise timing.
    *   *Score Multipliers:* Temporarily increases score gain from grazing bullets or time survived. *Balance:* Often comes with a temporary risk (e.g., slightly increased projectile speed, attracts more pirate attention).
    *   *Field Dampeners:* Creates a temporary radius around the ship that slows specific types of incoming projectiles (e.g., slows cannonballs but not fire arrows). Strategic use for dense patterns.
    *   *Emergency Jettison:* Instantly drop a small amount of *non-essential* cargo to gain a very brief, powerful speed boost (panic button).
*   **Permanent Upgrades (Bought at Port):** Spend earned currency between missions.
    *   *Hull Integrity:* Reduces amount of cargo lost per hit.
    *   *Maneuverability:* Faster base speed, quicker turning rate.
    *   *Hitbox Reduction:* Makes the ship physically slightly smaller (visual change).
    *   *Cargo Capacity:* Increases maximum cargo, effectively increasing "health" buffer.
    *   *Wind Efficiency:* Improves speed bonus downwind / reduces penalty upwind.
    *   *Modifier Enhancement:* Increase duration/effectiveness of temporary pickups (e.g., longer shield, faster Phase Shift cooldown).
*   **Synergy:** Combining upgrades creates powerful builds. Faster Movement + Hitbox Reduction + Graze Multipliers = High-risk, high-reward score chasing. Phase Shifter + Shield Module = Safer navigation through impossible patterns. Increased Cargo Capacity + Hull Integrity = Tanky build focused on survival.
*   **Risk/Reward:**
    *   *Mission Choice:* Select from available trade routes with varying difficulties, lengths, potential hazards, cargo types (some more valuable but fragile?), and rewards. Harder routes yield more currency but risk ending the run early.
    *   *Gameplay:* Constantly choosing between playing it safe at the edge of the screen or weaving through dense bullet clusters for potential score multipliers or pickups. Using risky maneuvers near obstacles for potential shortcuts vs. open water safety. Activating score multipliers that also increase danger.

**Main Mission Loop:**
1.  **Start Run:** Choose an available starting vessel (initially limited).
2.  **Select Mission:** Pick a trade route from available options at the starting port (varying difficulty, reward, length, potential hazards). Load cargo.
3.  **Navigate & Survive:** Sail through the route, enduring multiple Bullet Storms and navigating environmental challenges. Dodge pirate attacks, manage wind.
4.  **Reach Port:** Arrive at the destination port.
5.  **Get Paid:** Receive currency based on the amount and type of cargo successfully delivered. Bonus pay for speed, no hits, or high score elements.
6.  **Upgrade:** Spend currency at the port's Shipyard on permanent upgrades or repairs (if damage persists between missions - optional). Maybe hire Crewmates here.
7.  **Repeat:** Select a new mission from the current port. Continue until failure (zero cargo) or completion of a major objective/final boss.

**Ship Selection:**
*   **Variety:** Start with a basic, balanced Sloop. Unlock others via achievements/milestones (e.g., deliver X total cargo, defeat Y boss, reach Z port).
    *   *Sloop:* Balanced speed, average cargo, medium hitbox. Good all-rounder.
    *   *Brigantine:* Faster, more agile, smaller hitbox, but lower cargo capacity. Favors skillful dodging.
    *   *Galleon:* Slow, poor turning, large hitbox, but massive cargo capacity and potentially higher Hull Integrity. Favors careful positioning and upgrade synergy.
    *   *Cutter:* Very fast with the wind, excellent upwind performance, but fragile (loses more cargo per hit). High skill ceiling.
*   **Unlocks:** Milestones could include: delivering 1000 units of cargo total, completing a "Hard" difficulty route, defeating the first boss without taking damage, unlocking specific upgrades.

---

**Fleshed Out Additional Ideas & Balance:**

**1. Sail Upgrades:**
*   **How it Works:** Instead of just general speed upgrades, players can purchase and equip specific *types* of sails at port. These could be mutually exclusive (you choose one 'special' sail rig) or layered passive bonuses. Let's go with equipping **one major Sail Type** alongside general upgrades.
*   **Examples:**
    *   *Spinnaker:* Grants a *massive* speed boost when sailing directly downwind. *Balance:* Significantly reduces turning speed while active; less effective or even detrimental at other angles to the wind. Great for routes with predictable downwind legs, risky otherwise.
    *   *Storm Jib:* Significantly reduces the speed penalty when sailing into or across the wind. Allows for better maneuvering *against* the grain. *Balance:* Provides little to no bonus when sailing downwind compared to standard sails. Essential for routes with tricky wind patterns or frequent need to backtrack/change direction sharply.
    *   *Square Rigging:* Provides a solid speed boost on broad reaches (slightly across the wind) and downwind. *Balance:* Very poor performance sailing into the wind. A good generalist sail for routes without extreme upwind sections.
    *   *Lateen / Fore-and-Aft Rig:* Offers the best ability to "point" towards the wind (smallest penalty sailing upwind) and potentially faster tacking (changing direction through the wind). *Balance:* Lower top speed potential compared to Spinnaker or Square Rig when running downwind. Favors technical sailing and routes requiring precise positioning.
*   **Interaction & Balance:**
    *   **Strategic Choice:** Players must consider the likely wind conditions of their chosen mission (perhaps a basic forecast is given: "Strong Westerlies Expected"). Choosing the wrong sail makes dodging significantly harder.
    *   **Synergy:** Combines with ship types. A slow Galleon might rely on a Storm Jib to mitigate its weakness, while a fast Cutter could maximize its potential with a Spinnaker on favorable routes.
    *   **Resource Sink:** Adds another valuable category for spending currency, forcing harder choices between sails, hull, or crew.
    *   **Visuals:** The ship's sail appearance could change based on the equipped type, providing clear visual feedback.

**2. Crewmates:**
*   **How it Works:** Hire individual crew members at port, each providing a unique passive bonus. The ship has a limited number of Crew Slots (perhaps upgradable). Crew might require a hiring fee and potentially small ongoing wages deducted from earnings after each successful mission.
*   **Examples:**
    *   *Lookout:* Provides slightly earlier visual warnings for off-screen projectiles or hazards (e.g., a small indicator arrow appears sooner).
    *   *Master Helmsman:* Increases the ship's turning speed / responsiveness.
    *   *Seasoned Navigator:* Slightly reduces the negative effects of sailing against the wind *or* slightly increases the bonus from sailing with it.
    *   *Quartermaster:* Reduces the amount of cargo lost per hit by a small percentage or fixed amount.
    *   *Shipwright:* Slowly repairs a tiny amount of "lost cargo potential" between stages *within* a single route (e.g., restores 1-2 units of cargo capacity, up to the max, after successfully completing a storm). Doesn't add cargo, but fixes the 'slots'.
    *   *Bosun:* Slightly increases the duration or effectiveness of temporary pickups (Shields, Dampeners).
    *   *Powder Monkey (if limited countermeasures added):* Slightly reduces the cooldown of defensive abilities.
*   **Interaction & Balance:**
    *   **Customization:** Allows players to tailor their ship's passive abilities to their playstyle or shore up weaknesses.
    *   **Resource Drain:** Hiring fees and potential wages add another economic pressure. Do you invest in permanent upgrades or flexible crew bonuses?
    *   **Synergy:** Crew bonuses stack with ship stats and upgrades (Helmsman + Maneuverability Upgrade = very agile ship). Quartermaster + Hull Integrity = extremely tanky.
    *   **Risk/Loss (Optional):** Maybe crew can be injured or lost during particularly devastating hits or specific boss attacks, adding consequence. Or perhaps certain hazardous routes have a chance of losing a crew member if you fail. This adds stakes but could be frustrating – needs careful balance.
    *   **Rarity:** Could introduce Rare/Unique crew found randomly or after specific achievements, offering more powerful or combined bonuses.

**3. More Player Agency (Beyond Pure Dodging - *Carefully Implemented*):**
*   **The Challenge:** Avoid undermining the "pure dodge" core. Direct, spammable offense changes the genre. Agency should focus on *defensive* or *maneuvering* options, not destruction.
*   **Non-Shooting Options:**
    *   *Deployable Buoys (Limited Use):*
        *   *Decoy Buoy:* Creates a temporary visual target that draws *some* basic, non-homing projectiles for a few seconds. Has a long cooldown or limited charges per route.
        *   *Repair Nanite Buoy (Rare):* Drops a buoy that, if touched again after a delay, restores a very small amount of cargo. Risky to deploy and retrieve.
        *   *Current Buoy:* Creates a small, temporary patch of water that slightly pushes projectiles (and potentially the player ship) in a chosen direction. Used for subtle pattern manipulation.
    *   *Advanced Maneuvers (Cooldown-Based):*
        *   *Hard Rudder:* A brief burst of extremely high turn rate, possibly at the cost of temporary speed loss. Allows sharp turns to avoid sudden traps.
        *   *Emergency Anchor / Drogue:* Rapidly decelerate, potentially dodging fast-moving projectiles by letting them pass. Leaves you vulnerable briefly.
        *   *Controlled Drift:* Initiate a sideways drift, maintaining some momentum while quickly changing facing. Good for navigating tight clusters or setting up wind shifts.
    *   *Limited Countermeasures (High Cooldown / Rare Resource):*
        *   *Signal Flare:* Briefly (1-2 seconds) causes *basic* enemy projectiles in a radius to become erratic or slow down significantly. No damage, just temporary disruption. Needs a long cooldown.
        *   *Sonic Pulse:* A very short-range pulse that pushes nearby projectiles away slightly. Requires being dangerously close.
*   **Interaction & Balance:**
    *   **Cooldowns/Charges:** These abilities *must* be limited to prevent trivializing the dodging. They are panic buttons or tactical tools, not primary mechanics.
    *   **Resource Cost:** Could potentially cost a small amount of currency to use, or have upgrades purchased at port alongside other systems.
    *   **Strategic Depth:** Adds layers to decision-making beyond just movement. When is the best time to use a Hard Rudder? Is it worth deploying a Decoy Buoy now or saving it?
    *   **Maintains Core:** Crucially, none of these destroy projectiles wholesale or allow sustained offense. The focus remains on navigating the bullet hell.

**4. Sharks:**
*   **How it Works:** Environmental hazard/enemy type distinct from projectile-firing pirates.
*   **Types & Behaviors:**
    *   *Patrolling Reef Sharks:* Move in predictable patterns in certain zones (e.g., near reefs, shallow waters). Colliding causes minor cargo loss. Clearly visible.
    *   *Hunter Sharks:* Occasionally appear, lock onto the player briefly, and perform a fast, telegraphed lunge attack. Requires a quick dodge. Collision causes moderate cargo loss. May have a distinct audio/visual cue.
    *   *Cargo Snatchers:* Appear in swarms in specific hazard zones. Don't actively attack the ship's "hull," but if the player moves too slowly or stops within the swarm, they start visibly tearing off cargo bundles. Encourages constant movement.
    *   *Deep Sea Terrors (Mini-Boss/Hazard):* Large, rare shark variants that might create localized hazards (small whirlpools, temporary ink clouds obscuring vision) or perform larger area-denial attacks.
*   **Interaction & Balance:**
    *   **Threat Diversity:** Breaks up the monotony of only dodging projectiles. Forces awareness of the water surface itself.
    *   **Movement Puzzles:** Interacts with bullet patterns – forces players *into* dangerous areas to avoid a shark lunge, or vice versa. Makes stopping or slowing down (e.g., for a Field Dampener) riskier in certain zones.
    *   **Environmental Storytelling:** Adds to the theme and atmosphere of dangerous seas.
    *   **Telegraphing:** Clear visual and audio cues are essential for fairness, especially for lunging attacks. Patrolling sharks should be easily visible.
    *   **Frequency:** Must be balanced so they add tension, not constant annoyance. Shouldn't overshadow the core bullet-dodging from pirates.

**Overall Balance Considerations:**
*   **Currency Flow:** Ensure rewards scale appropriately with difficulty so players feel progression but can't afford *everything* too quickly. Hard choices should always be present.
*   **Difficulty Curve:** Smoothly ramp up projectile density, speed, pattern complexity, and the introduction of new hazards/enemies. Avoid sudden, unfair spikes.
*   **Synergy Power:** Ensure that combinations are strong but not game-breaking. There should always be threats that challenge even optimized builds.
*   **Feedback:** Clear visual and audio feedback for everything: wind effect, projectile types, hazard warnings, low cargo status, modifier active states, ability cooldowns.

This expanded structure provides a much more detailed blueprint for "Sailite," integrating the new ideas in a way that complements the core mechanic while adding strategic depth and variety.