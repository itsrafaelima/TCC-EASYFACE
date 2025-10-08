const { axe, toHaveNoViolations } = require('jest-axe');
const { loadHTML, axeConfig } = require('../utils/test-utils');

expect.extend(toHaveNoViolations);

describe('Acessibilidade - Navegacao Principal', () => {
  beforeEach(() => {
    const html = "<!DOCTYPE html><html lang='pt-br'><head><title>EASYFACE</title></head><body><button class='menu-button' aria-label='Abrir Editor'>Editor</button></body></html>";
    loadHTML(html);
  });

  it('nao deve ter violacoes criticas', async () => {
    const results = await axe(document.body, axeConfig);
    expect(results).toHaveNoViolations();
  });

  it('deve ter estrutura semantica adequada', () => {
    const htmlElement = document.documentElement;
    expect(htmlElement).not.toBeNull();
    const lang = htmlElement.getAttribute('lang');
    expect(lang).toBe('pt-br');
  });

  it('botoes devem ter labels acessiveis', () => {
    const button = document.querySelector('.menu-button');
    expect(button).toHaveAttribute('aria-label');
    expect(button.getAttribute('aria-label')).toBe('Abrir Editor');
  });
});