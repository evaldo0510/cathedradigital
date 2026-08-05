import asyncio
import os
import json
from pathlib import Path
from playwright.async_api import async_playwright

# Mocking the ROUTE_META and validate function for simple check
CRITICAL_ROUTES = ['/', '/bible', '/catechism', '/oracao', '/santos', '/pricing']

async def main():
    results = []
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()

        for route in CRITICAL_ROUTES:
            errors = []
            try:
                await page.goto(f"http://localhost:8080{route}", wait_until="networkidle")
                title = await page.title()
                desc = await page.getAttribute('meta[name="description"]', 'content')
                canonical = await page.getAttribute('link[rel="canonical"]', 'href')
                
                if not title: errors.append("Título ausente")
                if not desc: errors.append("Description ausente")
                if not canonical: errors.append("Canonical ausente")
                
                # Check JSON-LD
                scripts = await page.locator('script[type="application/ld+json"]').all()
                if not scripts:
                    errors.append("JSON-LD ausente")
                
                results.append({"path": route, "errors": errors, "title": title})
                print(f"Route {route}: {'OK' if not errors else 'FAIL ' + str(errors)}")
            except Exception as e:
                results.append({"path": route, "errors": [str(e)], "title": "ERROR"})

        await browser.close()
    
    # Write summary
    dist_dir = Path("dist/seo")
    dist_dir.mkdir(parents=True, exist_ok=True)
    with open(dist_dir / "e2e-seo-report.json", "w") as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    asyncio.run(main())
