import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

// Mock security module before importing Textarea
jest.mock('../../utils/security', () => ({
  sanitizeText: (text: string) => text
}));

import { Textarea } from '../../components/ui/Textarea';

describe('Textarea Accessibility', () => {
  it('should not have accessibility violations with label', async () => {
    const { container } = render(
      <Textarea 
        label="Descrição" 
        name="description" 
        placeholder="Digite uma descrição"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with error state', async () => {
    const { container } = render(
      <Textarea 
        label="Comentário" 
        name="comment" 
        error="Comentário é obrigatório"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with helper text', async () => {
    const { container } = render(
      <Textarea 
        label="Notas" 
        name="notes" 
        helperText="Máximo de 500 caracteres"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations when required', async () => {
    const { container } = render(
      <Textarea 
        label="Feedback" 
        name="feedback" 
        required 
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations when disabled', async () => {
    const { container } = render(
      <Textarea 
        label="Campo desabilitado" 
        name="disabled" 
        disabled 
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
