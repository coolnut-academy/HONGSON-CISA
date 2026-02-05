# Enhanced Drag-and-Drop System
## UX & Design Specification

### 1. Standardized Item Layout
All draggable items now use a strict **card-based layout** to ensure assessment validity and visual consistency.

- **Container Dimensions**: Fixed at `150px x 150px`.
- **Reasoning**: Prevents size-based bias (e.g., "the big answer goes in the big box").
- **Composition**:
  - Top 80%: Image / Icon Area (Flexible container)
  - Bottom 20%: Label Area (Fixed height strip)

### 2. Image & Content Rules
- **Scaling**: Images use `object-fit: contain`. They are never cropped, stretched, or distorted.
- **Background**: Images sit on a neutral white/transparent background.
- **Fallback**: If no image is provided, a neutral icon placeholder is displayed.
- **Constraint**: Images cannot push the container boundaries.

### 3. Label Typography
- **Position**: Always docked at the bottom of the card.
- **Truncation**: Restricted to **one line** with ellipsis (`...`).
- **Styling**: Neutral slate gray (`text-slate-600`) on a light background.
- **Purpose**: Acts as an identifier, not a full explanation.

### 4. Usability & States
- **Default**: White card, thin gray border.
- **Hover**: Subtle lift, primary border color hint.
- **Dragging**: High opacity clone floats with cursor, original fades.
- **Placed**: Card snaps into the drop zone with a green/success tint border.

### 5. Why This Improves Assessment
1.  **Eliminates Visual Cueing**: All items are the same size, so students cannot guess the answer based on shape fitting.
2.  **Reduces Cognitive Load**: Consistent layout allows students to scan images/labels quickly without re-orienting.
3.  **Supports Richer Content**: Allowing standardized images enables diagram-labeling and visual sorting tasks without layout breakage.
4.  **Professional Aesthetic**: The rigid grid feels engineered and trustworthy, matching the "Research-Grade" platform theme.
