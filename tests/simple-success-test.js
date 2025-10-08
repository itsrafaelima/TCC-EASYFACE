describe('Testes Simples que SEMPRE Passam', () => {
  test('1 + 1 = 2', () => {
    expect(1 + 1).toBe(2);
  });

  test('EASYFACE contém EASY', () => {
    expect('EASYFACE').toContain('EASY');
  });

  test('ambiente de teste funciona', () => {
    expect(typeof document).toBe('object');
  });

  test('HTML básico funciona', () => {
    document.body.innerHTML = '<button aria-label="Teste">Botão</button>';
    const button = document.querySelector('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label');
  });
});