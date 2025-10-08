const puppeteer = require('puppeteer');

describe('WAVE Accessibility Check', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  it('deve ter menos de 5 erros de acessibilidade no WAVE', async () => {
    await page.goto('http://localhost:3000');
    
    // Verificar elementos críticos
    const errors = await page.evaluate(() => {
      const issues = [];
      
      // Verificar imagens sem alt
      const imagesWithoutAlt = Array.from(document.querySelectorAll('img:not([alt])'));
      imagesWithoutAlt.forEach(img => issues.push(`Imagem sem alt: ${img.src}`));
      
      // Verificar links sem texto
      const linksWithoutText = Array.from(document.querySelectorAll('a:not([aria-label]):empty'));
      linksWithoutText.forEach(link => issues.push('Link sem texto'));
      
      // Verificar botões sem texto/aria-label
      const buttonsWithoutLabel = Array.from(document.querySelectorAll('button:not([aria-label]):empty'));
      buttonsWithoutLabel.forEach(btn => issues.push('Botão sem label'));
      
      return issues;
    });

    expect(errors.length).toBeLessThan(5);
    if (errors.length > 0) {
      console.log('Erros encontrados:', errors);
    }
  }, 30000);
});