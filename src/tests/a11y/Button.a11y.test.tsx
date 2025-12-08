import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Button } from '../../components/ui/Button';

describe('Button Accessibility', () => {
  it('should not have accessibility violations with text content', async () => {
    const { container } = render(
      <Button>Clique aqui</Button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with icon and aria-label', async () => {
    const { container } = render(
      <Button aria-label="Adicionar item">
        <span aria-hidden="true">+</span>
      </Button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations when loading', async () => {
    const { container } = render(
      <Button loading>Salvando</Button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations when disabled', async () => {
    const { container } = render(
      <Button disabled>Desabilitado</Button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations for all variants', async () => {
    const variants = ['primary', 'secondary', 'success', 'danger', 'ghost'] as const;
    
    for (const variant of variants) {
      const { container } = render(
        <Button variant={variant}>Botão {variant}</Button>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    }
  });

  it('should not have accessibility violations for all sizes', async () => {
    const sizes = ['sm', 'md', 'lg'] as const;
    
    for (const size of sizes) {
      const { container } = render(
        <Button size={size}>Botão {size}</Button>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    }
  });

  it('should not have accessibility violations as submit button', async () => {
    const { container } = render(
      <form>
        <Button type="submit">Enviar</Button>
      </form>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
