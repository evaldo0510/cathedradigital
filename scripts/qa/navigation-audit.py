import asyncio
import json
import os
from pathlib import Path
from playwright.async_api import async_playwright

SCREENSHOTS = Path("/tmp/browser/navigation-audit/screenshots")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)
REPORT_PATH = Path("/tmp/browser/navigation-audit/report.json")

# Rotas do novo Hub
ROUTES_TO_TEST = [
    "/bible",
    "/rezar",
    "/igreja",
    "/santos",
    "/jornadas",
    "/nexus",
    "/biblioteca",
    "/profile"
]

async def audit_route(page, route):
    errors = []
    try:
        url = f"http://localhost:8080{route}"
        print(f"Auditando {url}...")
        response = await page.goto(url, wait_until="networkidle")
        
        if not response or response.status >= 400:
            errors.append(f"HTTP {response.status if response else 'No Response'} em {route}")
            return errors

        # Verificar se houve redirecionamento e se o destino é válido
        final_url = page.url
        print(f"  URL Final: {final_url}")

        # Screenshot
        slug = route.replace("/", "_") or "home"
        await page.screenshot(path=str(SCREENSHOTS / f"{slug}.png"))
        
    except Exception as e:
        errors.append(f"Erro ao acessar {route}: {str(e)}")
    
    return errors

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 375, "height": 667, "is_mobile": True, "has_touch": True})
        page = await context.new_page()

        results = {"errors": [], "tested": []}
        
        for route in ROUTES_TO_TEST:
            route_errors = await audit_route(page, route)
            results["errors"].extend(route_errors)
            results["tested"].append(route)

        with open(REPORT_PATH, "w") as f:
            json.dump(results, f, indent=2)

        print(f"Auditoria Mobile concluída. Report em {REPORT_PATH}")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
