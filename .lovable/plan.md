I will execute a structural stabilization of the Bible component to recover its functional integrity and eliminate English terms, following the "CATHEDRA BIBLE RECOVERY PHASE" mission.

### 1. Diagnosis & Evidence Gathering
- **Language Violations**: Identification of English book names (e.g., "Tobit", "Judith", "Wisdom", "Sirach") appearing in the UI due to legacy caches or incomplete mapping in the `bible-text` Edge Function.
- **Content Issues**: Verification of "missing content" reports, specifically for books like Abdias (Obadiah) which was identified as having a local fallback.
- **Duplication**: The `BOOK_NAME_MAP` and `BOOK_PT_MAP` in the Edge Function need to be synchronized with the frontend `BIBLE_DATA` to ensure a single source of truth.

### 2. Stabilization & Correction (Frontend)
- **Hard-Coded Correction**: Refine the runtime scanner in `Bible.tsx` to include all missing Brazilian Portuguese (PT-BR) book mappings and common UI terms (e.g., "Chapter", "Verse").
- **Cache Invalidation**: Force a global cache purge by bumping the `cacheSyncVersion` in `Bible.tsx` to match the Edge Function's versioning.
- **Navigation Stabilizer**: Ensure `selectBook` and `selectChapter` handle compound names and route parameters consistently between desktop and mobile.
- **Bible ↔ CIC Reset**: Verify the connection logic to prevent involuntary switching between modules.

### 3. Backend & Data API Stabilization (Edge Functions)
- **`bible-text` Function**:
    - Update `BOOK_NAME_MAP` to handle all abbreviations used by the frontend.
    - Enhance `robustTranslate` with more exhaustive mapping.
    - Fix the "Unexpected end of JSON input" error observed in logs when the external API fails.
- **`bible-search` Function**:
    - Replace the mock logic with real database querying or better-simulated results that respect the language allowlist.

### 4. Validation & Quality Assurance
- **Automated Sweep**: Run the built-in "Deep Scan" auditor in the Diagnostic Panel to navigate through problematic books (Deuterocanonical) and capture evidence.
- **Mobile Navigation Test**: Use the preview to verify swipe navigation and chapter switching on small screens.
- **Integrity Report**: Generate the CSV/JSON report as requested to prove zero occurrences of English.

### Technical Details
- **Files Affected**:
    - `src/components/cathedra/Bible.tsx` (Scanner, Cache, Diagnostic UI)
    - `supabase/functions/bible-text/index.ts` (API Mapping, Fallbacks, ETags)
    - `src/data/bible-books.ts` (Source of Truth for Book Names)
    - `src/components/cathedra/BibleSearch.tsx` (Search UI Translation)
- **Version Control**: Bump CACHE_VERSION to `v1.2.2`.
