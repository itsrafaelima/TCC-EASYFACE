const { axe, toHaveNoViolations } = require('jest-axe');
expect.extend(toHaveNoViolations);

// Função para carregar HTML no JSDOM
const loadHTML = (html) => {
  document.body.innerHTML = html;
  return document;
};

// Configurações do axe
const axeConfig = {
  rules: {
    'color-contrast': { enabled: false } // Desativa verificação de contraste
  }
};

module.exports = { loadHTML, axeConfig };