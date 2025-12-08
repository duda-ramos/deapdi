import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Select } from '../../components/ui/Select';

const mockOptions = [
  { value: 'option1', label: 'Opção 1' },
  { value: 'option2', label: 'Opção 2' },
  { value: 'option3', label: 'Opção 3' },
];

describe('Select Accessibility', () => {
  it('should not have accessibility violations with label', async () => {
    const { container } = render(
      <Select 
        label="Categoria" 
        name="category" 
        options={mockOptions}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with placeholder', async () => {
    const { container } = render(
      <Select 
        label="Status" 
        name="status" 
        options={mockOptions}
        placeholder="Selecione um status"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with error state', async () => {
    const { container } = render(
      <Select 
        label="Prioridade" 
        name="priority" 
        options={mockOptions}
        error="Selecione uma prioridade"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations when required', async () => {
    const { container } = render(
      <Select 
        label="Departamento" 
        name="department" 
        options={mockOptions}
        required
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations when disabled', async () => {
    const { container } = render(
      <Select 
        label="Tipo" 
        name="type" 
        options={mockOptions}
        disabled
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
