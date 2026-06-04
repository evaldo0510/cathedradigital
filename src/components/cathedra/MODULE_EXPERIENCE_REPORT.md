# Cathedra Module Experience Report (MXR)

## 1. Bible (Sacra Biblia)
- **Main Objective**: Access, read, and meditate on the Sacred Scriptures.
- **User Journey**: Home -> Bible -> Select Testament -> Select Book -> Select Chapter -> Reading Content.
- **Clicks to Content**: 4 clicks (Home -> Bible -> Book -> Chapter -> Content).
- **Cognitive Load**: Medium. Multiple levels of navigation (Testaments, Books, Chapters) can be overwhelming for rapid lookup.
- **Mobile Experience**: Good. Sticky search and standardized 48px touch targets facilitate navigation.
- **Reading Experience**: High quality. Premium typography, floating controls for audio, marks, and Logos AI insights.

## 2. Catechism (Catechismus)
- **Main Objective**: Study the systematic doctrine of the Church by paragraphs.
- **User Journey**: Home -> Catechism -> Select Part -> Select Section -> Reading Paragraphs.
- **Clicks to Content**: 4 clicks (Home -> Catechism -> Part -> Section -> Paragraph).
- **Cognitive Load**: High. Structural complexity (4 Parts, multiple sections) requires theological familiarity.
- **Mobile Experience**: Excellent. Lazy loading of paragraphs reduces jumpy layouts and improves INP.
- **Reading Experience**: Immersive. Integrated cross-references (Bible/Documents) provide deep theological context.

## 3. Library (Sacrum Archivum)
- **Main Objective**: Discover and explore all available modules and formation resources.
- **User Journey**: Bottom Nav -> Library -> Select Module.
- **Clicks to Content**: 2 clicks (Library -> Module).
- **Cognitive Load**: Low. Grid-based layout with clear categories and icons.
- **Mobile Experience**: Very Good. Sticky search bar and categorized sections provide quick access.
- **Reading Experience**: N/A (Portal module).

## 4. Documents (Magisterium)
- **Main Objective**: Consult papal encyclicals and official Church documents.
- **User Journey**: Home/Library -> Magisterium -> Select Theme or Search -> Select Document -> Reading.
- **Clicks to Content**: 3 clicks (Magisterium -> Search/Theme -> Document).
- **Cognitive Load**: Medium-High. Finding specific documents among centuries of Magisterium requires effective search.
- **Mobile Experience**: Good. The "Spiritual Guidance" entry points reduce the need for manual document lookup.
- **Reading Experience**: Premium. Deep link integration with Bible and Catechism.

---

## Top 10 Highest-Impact UX Improvements

1. **Direct Paragraph/Verse Search**: Implement a "Global Quick Jump" for direct entry (e.g., typing "Jo 3,16" or "CIC 2113" in any search bar).
2. **One-Click Resume**: Add a "Continue Reading" widget on the Home screen for the last accessed Bible/Catechism position.
3. **Breadcrumb Navigation**: Add breadcrumbs in reading mode to allow jumping back to Part/Book/Section without multiple "Back" clicks.
4. **Offline Sync Indicator**: Explicit visual feedback on which chapters/sections are cached for offline contemplation.
5. **Dynamic Search Highlighting**: Highlight search terms within the results and reading content to speed up information retrieval.
6. **Unified Footnote System**: Standardize how Bible/Catechism/Magisterium references appear to avoid context switching.
7. **Volume-to-Scroll**: Allow hardware volume buttons to act as page-turners in long reading sessions (PWA feature).
8. **Reading Time Estimates**: Display estimated reading time for Catechism sections and Encyclical chapters.
9. **Visual Reading History**: A heat-map or visual indicator in the Library showing which areas (Parts/Books) the user has explored most.
10. **Contextual AI Pre-prompts**: Suggest specific questions for Logos AI based on the current paragraph's theological difficulty.
