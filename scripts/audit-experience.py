import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
import json

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()

        print("--- Iniciando Auditoria da Experiência (Fase 9) ---")
        
        # 1. Verificar Home Unified
        await page.goto("http://localhost:8080/")
        title = await page.title()
        print(f"Home Title: {title}")
        
        # 2. Verificar Acervo (Mosteiro)
        await page.goto("http://localhost:8080/acervo")
        has_acervo = await page.query_selector("text=Biblioteca do Cathedra")
        print(f"Acervo acessível: {has_acervo is not None}")

        # 3. Mapear links visíveis (Exploração do Peregrino)
        links = await page.evaluate('''() => {
            return Array.from(document.querySelectorAll('a')).map(a => ({
                text: a.innerText.trim(),
                href: a.getAttribute('href')
            })).filter(l => l.text && l.href && !l.href.startsWith('http'));
        }''')
        print(f"Total de rotas internas descobertas: {len(links)}")
        
        # 4. Verificar se o Logos está em modo conversa
        await page.goto("http://localhost:8080/")
        logos_placeholder = await page.get_attribute("input#home-search", "placeholder")
        print(f"Logos Placeholder na Home: {logos_placeholder}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
