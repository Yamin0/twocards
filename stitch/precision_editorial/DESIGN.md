# Design System Strategy: Precision Editorial

## 1. Overview & Creative North Star
**The Creative North Star: "The Velvet Ledger"**
This design system is built to transform complex B2B nightlife data into a prestigious, editorial experience. We are moving away from the "SaaS Dashboard" look and toward the aesthetic of a high-end fashion lookbook or a private club’s guest ledger. 

The "Precision Editorial" style relies on **intentional asymmetry** and **tonal layering**. By utilizing a tight typographic scale and rejecting standard container borders, we create an interface that feels curated rather than engineered. We break the "template" look by using exaggerated whitespace and overlapping text elements to guide the user's eye with authority and grace.

---

## 2. Colors & Surface Architecture

### Tonal Palette
*   **Surface (Background):** `#f5fbf9` – A cool, mint-infused white that feels more premium than a clinical neutral.
*   **Surface-Container-Lowest (Cards):** `#ffffff` – Used for primary focus areas to create a "lift" through color purity.
*   **Surface-Container-Low:** `#eff5f3` – Ideal for secondary sidebars or nested content.
*   **Surface-Container:** `#e9efed` – Used for the deepest nesting or "sunken" utility areas.
*   **Primary (Action):** `#13305c` – A deep, authoritative midnight navy.
*   **Headlines:** `#001b40` – High-contrast navy for immediate hierarchy.
*   **Muted/Accents:** `#8099cb` – Used for subtle graphical elements and non-critical data.
*   **Body Text:** `#171d1c` – A soft charcoal (never pure black) for maximum readability.

### The "No-Line" Rule
**Prohibit 1px solid borders for sectioning.** 
Structural boundaries must be defined solely through background color shifts. To separate a list from a dashboard background, transition from `surface` to `surface-container-low`. This creates a sophisticated, "borderless" UI that feels like a single, cohesive piece of stationery.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of fine paper. 
*   **Layer 1 (Base):** `surface` (#f5fbf9)
*   **Layer 2 (Content Group):** `surface-container-low` (#eff5f3)
*   **Layer 3 (Primary Card/Interaction):** `surface-container-lowest` (#ffffff)
Each inner container uses a slightly different tier to define its importance, eliminating the need for heavy shadows or lines.

---

## 3. Typography: The Editorial Voice

Our typography is the backbone of the "Precision" aesthetic. We pair the geometric authority of **Manrope** with the Swiss-style utility of **Inter**.

*   **Display & Headlines (Manrope):** These are our "Anchor" elements. Use `display-lg` (3.5rem) with tight letter-spacing (-0.02em) for hero moments. The contrast between `headline-lg` and `body-sm` creates the editorial "lookbook" feel.
*   **Titles & Body (Inter):** Inter provides the "Precision." Use `title-md` (1.125rem) for navigation and `body-md` (0.875rem) for data. 
*   **Labels (Inter):** Small, all-caps labels in `label-sm` (0.6875rem) with increased letter-spacing (+0.05em) should be used for metadata to mimic a physical filing system.

---

## 4. Elevation & Depth

### The Layering Principle
Depth is achieved by "stacking" the surface tiers. A `surface-container-lowest` (#ffffff) card placed on a `surface` (#f5fbf9) background creates a soft, natural lift without the "dirtiness" of a traditional drop shadow.

### Ambient Shadows
Shadows are a last resort for floating elements (modals, dropdowns). 
*   **Specs:** Blur: 24px–48px | Opacity: 4%–6% | Color: Derived from `primary` (#13305c) to create a "tinted" shadow that feels like natural ambient light, not grey soot.

### The "Ghost Border" Fallback
If a border is required for accessibility in input fields, use the `outline-variant` (#c4c6d0) at **15% opacity**. This "Ghost Border" ensures the element is findable without breaking the editorial flow.

---

## 5. Components

### Buttons
*   **Primary:** Solid `primary` (#13305c) with `on-primary` (#ffffff) text. Corner radius: **0.125rem** (Sharp, architectural).
*   **Secondary:** `surface-container-high` (#e3e9e8) background. No border.
*   **Styling:** Padding should be generous horizontally (e.g., 1rem top/bottom, 2.5rem left/right) to emphasize the premium nature of the action.

### Input Fields
*   **Base:** `surface-container-lowest` (#ffffff) with a 1px "Ghost Border."
*   **Focus State:** Border opacity increases to 100% using `primary`. No "glow" or outer rings.

### Cards & Lists
*   **Forbid Divider Lines.** Separate list items using 12px or 16px of vertical white space. To group items, place them on a `surface-container-low` (#eff5f3) plinth.
*   **Nightlife Specifics:** 
    *   **The Table Map:** Use subtle tonal shifts (Surface to Surface-High) to indicate VIP zones. 
    *   **Guest List Items:** Use `label-sm` for "Arrival Time" and `title-sm` for "Guest Name" to create a high-contrast hierarchy.

---

## 6. Do’s and Don’ts

### Do:
*   **Embrace Negative Space:** If a section feels crowded, increase the padding by 1.5x. Whitespace is a luxury signal.
*   **Use Asymmetric Grids:** Align text to the left but allow large imagery or data visualizations to "break" the margin on the right.
*   **Layer with Intent:** Ensure that every background color change signifies a change in content priority.

### Don’t:
*   **Don't use pure black (#000000):** It creates "visual vibration" that destroys the premium feel. Use `headline` (#001b40).
*   **Don't use 1px Dividers:** They clutter the interface. Use space or tonal shifts instead.
*   **Don't use large corner radii:** Keep cards at **0.375rem** and buttons at **0.125rem**. Rounded "pill" shapes are too consumer-grade; sharp corners feel bespoke and professional.