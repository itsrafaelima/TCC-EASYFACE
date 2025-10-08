const { axe, toHaveNoViolations } = require('jest-axe');
const { loadHTML, axeConfig } = require('../utils/test-utils');

expect.extend(toHaveNoViolations);

describe('Acessibilidade - Calculadora', () => {
  beforeEach(() => {
    const html = `
      <div id="calculator-app">
        <div class="calc-display" id="calc-display" aria-live="polite">0</div>
        <div class="calculator">
          <button class="calc-button" aria-label="Limpar calculadora">C</button>
          <button class="calc-button" aria-label="Apagar último dígito">⌫</button>
          <button class="calc-button operator" aria-label="Dividir">÷</button>
          <button class="calc-button" aria-label="Número 7">7</button>
          <button class="calc-button" aria-label="Número 8">8</button>
          <button class="calc-button equals" aria-label="Calcular resultado">=</button>
        </div>
      </div>
    `;
    
    loadHTML(html);
  });

  it('calculadora deve ser acessível', async () => {
    const results = await axe(document.getElementById('calculator-app'), axeConfig);
    expect(results).toHaveNoViolations();
  });

  it('botões da calculadora devem ter labels descritivos', () => {
    const buttons = document.querySelectorAll('.calc-button');
    
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
      expect(button.getAttribute('aria-label')).not.toMatch(/^$|^button$/i);
    });
  });

  it('display deve ter aria-live para leitores de tela', () => {
    const display = document.getElementById('calc-display');
    expect(display).toHaveAttribute('aria-live', 'polite');
  });
});