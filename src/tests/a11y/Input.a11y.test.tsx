import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

// Mock security module before importing Input
jest.mock('../../utils/security', () => ({
  sanitizeText: (text: string) => text
}));

import { Input } from '../../components/ui/Input';

describe('Input Accessibility', () => {
  it('should not have accessibility violations with label', async () => {
    const { container } = render(
      <Input 
        label="Email" 
        name="email" 
        type="email" 
        placeholder="Digite seu email"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with error state', async () => {
    const { container } = render(
      <Input 
        label="Email" 
        name="email" 
        type="email" 
        error="Email inválido"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with helper text', async () => {
    const { container } = render(
      <Input 
        label="Senha" 
        name="password" 
        type="password" 
        helperText="Mínimo de 8 caracteres"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations when required', async () => {
    const { container } = render(
      <Input 
        label="Nome completo" 
        name="name" 
        required 
        aria-required="true"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations when disabled', async () => {
    const { container } = render(
      <Input 
        label="Campo desabilitado" 
        name="disabled" 
        disabled 
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
