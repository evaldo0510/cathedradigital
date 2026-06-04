Transform the Bible module into a premium, contemplative reading experience inspired by manuscripts and classical libraries. This involves a complete visual overhaul of the Bible landing page, book selection, and reading interface, prioritizing typography and removing administrative noise.

### 1. Visual Identity & Design Tokens
- Update global CSS/styles to enhance the "Digital Bible" feel.
- Utilize the provided color palette: Cream (#FDF8F3), Parchment (#F3E9D2), Gold (#D4AF37), Charcoal (#2C2C2C), Deep Brown (#6B4E31).
- Enforce serif typography (Playfair Display for titles, Lora/Merriweather for text) as primary.

### 2. Bible Home Redesign (`src/components/cathedra/Bible.tsx`)
- Create a new "Bible Home" area above the books list.
- Implement discrete widgets for:
  - **Continue Reading**: Prominent but elegant resumption.
  - **Daily Reading**: Current liturgical or daily verse.
  - **Reading Plan**: Progress indicator.
  - **Favorites & History**: Quick access links.
- Move search to a more integrated, less "input-like" position.

### 3. Book Selection (Hierarchical Library)
- Replace the simple testamento toggle with a unified, hierarchical library view.
- Categories: Old Testament (Pentateuch, Historical, Wisdom, Prophets), New Testament (Gospels, Acts, Epistles, Revelation).
- Books styled as "library chapters" rather than buttons.

### 4. Chapter Summary Redesign
- Replace numerical grids (1, 2, 3...) with an elegant "Table of Contents" style list.
- Each chapter will show its title (e.g., "Capítulo 1 — O Verbo se fez carne").
- Add reading progress indicators for each chapter.

### 5. Reading Experience Overhaul
- Center text with generous margins and line-height.
- Implement "Reading Mode" (full immersive).
- Add controls for:
  - Font size adjustment.
  - Quick favorite for verses.
  - Note creation.
  - Sharing options.
- Integrate the audio player more subtly into the text flow or a refined floating bar.

### 6. Mobile Optimization
- Simplify header height and "above the fold" content.
- Focus 80% of screen real estate on text during reading.
- Ensure the Bible Home follows the "Search, Continue, Daily" priority.

### Technical Details
- Update `Bible.tsx` to handle the new view states.
- Create or refine helper components for the hierarchical list and TOC chapters.
- Ensure state persistence for reading progress and favorites is seamless.
- Maintain accessibility with visible focus and high contrast support.
