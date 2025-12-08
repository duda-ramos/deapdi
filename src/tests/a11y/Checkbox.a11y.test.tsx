import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Checkbox } from '../../components/ui/Checkbox';

describe('Checkbox Accessibility', () => {
  it('should not have accessibility violations with label', async () => {
    const { container } = render(
      <Checkbox 
        checked={false} 
        onChange={() => {}} 
        label="Aceito os termos de uso"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations when checked', async () => {
    const { container } = render(
      <Checkbox 
        checked={true} 
        onChange={() => {}} 
        label="Lembrar-me"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations when disabled', async () => {
    const { container } = render(
      <Checkbox 
        checked={false} 
        onChange={() => {}} 
        label="Opção desabilitada" 
        disabled
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with helper text', async () => {
    const { container } = render(
      <Checkbox 
        checked={false} 
        onChange={() => {}} 
        label="Receber notificações" 
        helperText="Você receberá emails sobre atualizações"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with aria-label when no visible label', async () => {
    const { container } = render(
      <Checkbox 
        checked={false} 
        onChange={() => {}} 
        aria-label="Selecionar item"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
