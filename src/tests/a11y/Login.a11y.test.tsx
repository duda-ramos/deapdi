import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';

// Mock security module
jest.mock('../../utils/security', () => ({
  sanitizeText: (text: string) => text
}));

/**
 * Login Form Accessibility Tests
 * 
 * Since the Login component has complex dependencies with import.meta,
 * we test the accessibility of the individual form elements that make up
 * the login form. The full component integration would be tested in E2E tests.
 */
describe('Login Form Components Accessibility', () => {
  it('should have accessible email input', async () => {
    const { container } = render(
      <Input 
        label="Email" 
        name="email" 
        type="email" 
        placeholder="Digite seu email"
        required
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible password input', async () => {
    const { container } = render(
      <Input 
        label="Senha" 
        name="password" 
        type="password" 
        placeholder="Digite sua senha"
        required
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible submit button', async () => {
    const { container } = render(
      <form>
        <Button type="submit">Entrar</Button>
      </form>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible form with all elements', async () => {
    const { container } = render(
      <form aria-label="Formulário de login">
        <Input 
          label="Email" 
          name="email" 
          type="email" 
          required
        />
        <Input 
          label="Senha" 
          name="password" 
          type="password" 
          required
        />
        <Button type="submit">Entrar</Button>
      </form>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible signup form elements', async () => {
    const levelOptions = [
      { value: 'junior', label: 'Júnior' },
      { value: 'pleno', label: 'Pleno' },
      { value: 'senior', label: 'Sênior' }
    ];

    const { container } = render(
      <form aria-label="Formulário de cadastro">
        <Input label="Nome completo" name="name" required />
        <Input label="Email" name="email" type="email" required />
        <Input label="Cargo" name="position" required />
        <Select label="Nível" name="level" options={levelOptions} />
        <Input label="Senha" name="password" type="password" required />
        <Input label="Confirmar senha" name="confirmPassword" type="password" required />
        <Button type="submit">Criar Conta</Button>
      </form>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible error state', async () => {
    const { container } = render(
      <form aria-label="Formulário de login">
        <div role="alert" aria-live="assertive">
          Email ou senha inválidos
        </div>
        <Input 
          label="Email" 
          name="email" 
          type="email" 
          error="Email é obrigatório"
        />
        <Input 
          label="Senha" 
          name="password" 
          type="password" 
          error="Senha é obrigatória"
        />
        <Button type="submit">Entrar</Button>
      </form>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible password toggle button', async () => {
    const { container } = render(
      <div className="relative">
        <Input label="Senha" name="password" type="password" />
        <Button 
          type="button" 
          variant="ghost"
          aria-label="Mostrar senha"
        >
          <span aria-hidden="true">👁</span>
        </Button>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('email input should be required', () => {
    render(<Input label="Email" name="email" type="email" required />);
    const input = screen.getByLabelText(/email/i);
    expect(input).toBeRequired();
  });

  it('password input should be required', () => {
    render(<Input label="Senha" name="password" type="password" required />);
    const input = screen.getByLabelText(/senha/i);
    expect(input).toBeRequired();
  });
});
