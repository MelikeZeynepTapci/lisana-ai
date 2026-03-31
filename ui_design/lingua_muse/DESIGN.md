# Design System Strategy: The Elevated Academic

This design system is a bespoke framework crafted for a premium, high-end language learning experience. Moving beyond the "standard" SaaS aesthetic, this system adopts an editorial approach that treats the UI as a series of curated, layered surfaces rather than a rigid grid of boxes. 

## 1. Creative North Star: "The Digital Atelier"
The core philosophy of this design system is the **Digital Atelier**. Just as a high-end physical workspace uses natural light, premium paper stock, and intentional negative space to foster focus, our UI uses a warm, tonal palette and soft, organic geometry. 

We break the "template" look by prioritizing **Intentional Asymmetry**. Instead of perfectly centered content, we use generous, unequal whitespace and overlapping "glass" layers to create a sense of depth and movement. This makes the learning process feel like an artisanal experience rather than a repetitive chore.

---

## 2. Color & Tonal Architecture
The palette is rooted in a warm, "Paper" base (`#fefee5`), supported by a triad of sophisticated pastels. 

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders for sectioning. Structural boundaries must be defined solely through background color shifts or tonal transitions.
- Use `surface-container-low` (`#fafcda`) sections sitting atop a `surface` (`#fefee5`) background to define content zones.
- Use `surface-container-highest` (`#e7edb1`) for high-contrast interactive zones.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of semi-translucent materials.
- **Base Layer:** `surface` (The "Desk").
- **Secondary Layer:** `surface-container` (The "Mat").
- **Action Layer:** `surface-container-lowest` (The "Paper" – use for cards to create a subtle lift).

### Glass & Gradient Soul
To avoid a flat, "Bootstrap" appearance:
- **Floating Elements:** Use `primary-container` with a 60% opacity and a `backdrop-filter: blur(20px)` for overlays or floating navigation.
- **Signature CTAs:** Apply a subtle linear gradient from `primary` (`#725991`) to `primary-dim` (`#664d84`) at a 135-degree angle. This adds "visual soul" and a tactile, premium finish.

---

## 3. Typography: Editorial Authority
The typography system uses a pairing of **Lexend** for character and **Manrope** for high-performance readability.

*   **Display & Headlines (Lexend):** Used for "Brand Moments"—lesson titles, progress milestones, and hero headers. The geometric nature of Lexend provides a friendly yet authoritative tone.
*   **Body & Labels (Manrope):** Chosen for its rhythmic clarity. It handles dense language-learning content (translations, grammar notes) without visual fatigue.

**Hierarchy as Identity:** 
We use a high-contrast scale. A `display-lg` (3.5rem) headline should sit near `body-md` (0.875rem) metadata to create an editorial, magazine-like feel that emphasizes the hierarchy of information.

---

## 4. Elevation & Depth: Tonal Layering
We reject traditional heavy drop shadows. Depth is achieved through light and material logic.

*   **The Layering Principle:** Place a `surface-container-lowest` (`#ffffff`) card on a `surface-container-low` (`#fafcda`) section. This creates a natural, soft "lift" that feels integrated into the environment.
*   **Ambient Shadows:** If an element must "float" (e.g., a modal), use a shadow tinted with `on-surface` (`#363b10`) at 5% opacity with a `blur` of 40px and `y-offset` of 20px. 
*   **The Ghost Border:** If a boundary is required for accessibility, use `outline-variant` (`#b8be86`) at **15% opacity**. Never use 100% opaque lines.

---

## 5. Signature Components

### Primary Buttons
- **Style:** `xl` (3rem) corner radius. 
- **Color:** Gradient of `primary` to `primary-dim`. 
- **Interaction:** On hover, the button should not just change color; it should increase its "lift" via a slightly more pronounced ambient shadow.

### Progress Architecture
- **Track:** `surface-container-highest` (`#e7edb1`).
- **Indicator:** `tertiary` (`#22705f`) for "Success/Progress" or `secondary` (`#8c5900`) for "Focus/Energy."
- **Design Note:** Avoid hard ends; use `full` rounded caps for a softer, more organic feel.

### Learning Cards
- **Rule:** No dividers. Use `spacing-6` (2rem) of vertical whitespace to separate header from body.
- **Style:** `lg` (2rem) rounded corners. Use `surface-container-lowest` for the card body to make it "pop" against the beige background.

### Sidebar Navigation
- **Background:** `surface-container-low` (`#fafcda`).
- **Active State:** A vertical pill using `tertiary-container` with an `on-tertiary-container` icon.
- **Softness:** The sidebar should feel like a docked "sheet" of paper, slightly separated from the main content by a subtle tonal shift, not a line.

### Vocabulary Chips
- **Action Chips:** `secondary-container` background with `on-secondary-container` text.
- **Selection:** Use `xl` (3rem) rounding. These should feel like small, smooth pebbles.

---

## 6. Do’s and Don’ts

### Do
- **Do** use "Breathing Room." If you think there is enough whitespace, add 20% more.
- **Do** use `tertiary` (Teal) for positive reinforcement and `secondary` (Orange) for alerts or "Streak" indicators.
- **Do** align items to a soft rhythm, but allow for off-center headers to create a "designer" feel.

### Don’t
- **Don’t** use pure black (#000) for text. Always use `on-surface` (`#363b10`) to maintain the soft, premium warmth.
- **Don’t** use `none` or `sm` corner radius. This system lives in the `lg` (2rem) to `xl` (3rem) range.
- **Don’t** use dividers or "rules." If elements feel cluttered, increase the background tonal difference or the spacing scale.
- **Don’t** use standard "system" shadows. If it looks like a default CSS shadow, it is wrong. Use the Ambient Shadow spec.