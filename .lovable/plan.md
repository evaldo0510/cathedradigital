The Catechism is currently experiencing errors because most paragraphs (over 2800 out of 2865) are missing from the database, and the `catechism-text` edge function is missing the logic to generate them using AI. This causes the application to show error messages or remain in a loading state for most paragraphs.

### Proposed Changes

#### 1. Edge Function Enhancement
- Update `supabase/functions/catechism-text/index.ts` to include AI generation logic.
- Implement the Lovable AI Gateway integration using `LOVABLE_API_KEY` to generate missing content.
- Support `action: 'fetch'`, `action: 'reprocess'`, and `action: 'fix_incomplete'`.
- The generation will include the main content (official text) and "Deep Content" (explanation, interpretation, practical application, etc.).
- Generated content will be cached in the `catechism_cache` table to avoid redundant AI calls.

#### 2. RLS Policy Fix
- Investigate and fix the 403 error on the `catechism_paragraphs_read` table, ensuring users can track their reading progress correctly.

#### 3. Frontend Resiliency
- Ensure the frontend gracefully handles cases where AI generation might be temporarily unavailable (e.g., due to exhausted credits) by showing the official Vatican link as a fallback.

### Technical Details
- **AI Model**: `google/gemini-2.0-flash-lite` (consistent with other functions).
- **Prompt**: Will be designed to ensure fidelity to the Catholic Magisterium while providing deep theological insights.
- **Caching Strategy**: Check `catechism_official` first, then `catechism_cache`. If not found, generate and save to `catechism_cache`.

**Fixed:** 0 issues
**Remaining:** 1 issue (Catechism functional error)
**Summary:** Restoring the AI generation capabilities to populate the Catechism content and fixing progress tracking permissions.
