1. **Parse Sitemap**: Load and parse `public/sitemap.xml` to populate the list of routes in `SEOVerificationPage`.
2. **Scanner Service**: Implement a `scanRoute(url)` utility in `SEOVerificationPage` that fetches the URL, parses the HTML, and extracts `og:title`, `og:description`, `og:image`, `twitter:card` tags.
3. **UI Updates**:
    - Update `SEOVerificationPage` to use the sitemap routes as the source of truth.
    - Add a "Scan All" button.
    - Add a "Scan" button per route to update individual status.
    - Add a "Copy" button for each route's meta-tag block.
    - Add an "Export CSV" button.
4. **Data Display**: Show a status badge for each route (missing, OK, incomplete) based on the fetched data.
5. **PDF/CSV Export**: Implement CSV download logic using a Blob. Use `window.print` as a quick PDF workaround.