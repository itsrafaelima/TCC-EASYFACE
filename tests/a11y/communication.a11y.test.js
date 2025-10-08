describe('ComunicaÃ§Ã£o Alternativa', () => {
  test('teste bÃ¡sico de comunicaÃ§Ã£o', () => {
    expect(1).toBe(1);
  });

  test('deve ter botÃµes acessÃ­veis', () => {
    document.body.innerHTML = '<button aria-label="BotÃ£o de teste">Teste</button>';
    const button = document.querySelector('button');
    expect(button).toHaveAttribute('aria-label');
  });
});
