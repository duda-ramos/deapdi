import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Badge } from '../../components/ui/Badge';

describe('Badge Accessibility', () => {
  it('should not have accessibility violations with default variant', async () => {
    const { container } = render(
      <Badge>Padrão</Badge>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations for all variants', async () => {
    const variants = ['default', 'success', 'warning', 'danger', 'info'] as const;
    
    for (const variant of variants) {
      const { container } = render(
        <Badge variant={variant}>Status {variant}</Badge>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    }
  });

  it('should not have accessibility violations with icon', async () => {
    const { container } = render(
      <Badge variant="success" showIcon>
        Aprovado
      </Badge>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations for all sizes', async () => {
    const sizes = ['sm', 'md'] as const;
    
    for (const size of sizes) {
      const { container } = render(
        <Badge size={size}>Tamanho {size}</Badge>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    }
  });

  it('should have role status for assistive technology', () => {
    const { getByRole } = render(
      <Badge variant="success">Concluído</Badge>
    );
    
    expect(getByRole('status')).toBeInTheDocument();
  });

  it('should convey status with both color and icon', () => {
    const { container, getByRole } = render(
      <Badge variant="danger" showIcon>
        Erro
      </Badge>
    );
    
    const badge = getByRole('status');
    expect(badge).toBeInTheDocument();
    // Icon should be present for non-color dependent identification
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
