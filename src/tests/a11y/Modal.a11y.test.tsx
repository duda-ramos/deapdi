import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

describe('Modal Accessibility', () => {
  it('should not have accessibility violations when open', async () => {
    const { container } = render(
      <Modal 
        isOpen={true} 
        onClose={() => {}} 
        title="Título do Modal"
      >
        <p>Conteúdo do modal</p>
      </Modal>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations when closed', async () => {
    const { container } = render(
      <Modal 
        isOpen={false} 
        onClose={() => {}} 
        title="Título do Modal"
      >
        <p>Conteúdo do modal</p>
      </Modal>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with form content', async () => {
    const { container } = render(
      <Modal 
        isOpen={true} 
        onClose={() => {}} 
        title="Formulário"
        size="lg"
      >
        <form>
          <label htmlFor="test-input">Nome</label>
          <input id="test-input" type="text" />
          <Button type="submit">Salvar</Button>
        </form>
      </Modal>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with custom aria attributes', async () => {
    const { container } = render(
      <Modal 
        isOpen={true} 
        onClose={() => {}} 
        title="Confirmação"
        ariaDescribedby="modal-desc"
      >
        <p id="modal-desc">Tem certeza que deseja continuar?</p>
        <div>
          <Button onClick={() => {}}>Cancelar</Button>
          <Button onClick={() => {}}>Confirmar</Button>
        </div>
      </Modal>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have correct ARIA attributes', () => {
    const { getByRole } = render(
      <Modal 
        isOpen={true} 
        onClose={() => {}} 
        title="Test Modal"
      >
        <p>Content</p>
      </Modal>
    );
    
    const dialog = getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
  });
});
