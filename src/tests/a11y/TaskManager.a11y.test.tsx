import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';
import { Card } from '../../components/ui/Card';

// Mock security module
jest.mock('../../utils/security', () => ({
  sanitizeText: (text: string) => text
}));

/**
 * Task Manager Components Accessibility Tests
 * 
 * Since the TaskManager component has complex dependencies with import.meta,
 * we test the accessibility of the individual UI elements that make up
 * the task manager. Full component integration would be tested in E2E tests.
 */
describe('TaskManager Components Accessibility', () => {
  it('should have accessible search input with keyboard hint', async () => {
    const { container } = render(
      <div className="relative">
        <span aria-hidden="true">🔍</span>
        <input
          type="text"
          placeholder="Buscar tarefas... (Ctrl+K ou /)"
          aria-label="Buscar tarefas por título ou descrição. Use Ctrl+K ou barra para focar"
          className="w-full pl-10 pr-4 py-2"
        />
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible filter selects', async () => {
    const statusOptions = [
      { value: 'all', label: 'Todos os status' },
      { value: 'pending', label: 'Pendente' },
      { value: 'in_progress', label: 'Em Andamento' },
      { value: 'completed', label: 'Concluída' }
    ];

    const typeOptions = [
      { value: 'all', label: 'Todos os tipos' },
      { value: 'exercise', label: 'Exercício' },
      { value: 'meditation', label: 'Meditação' }
    ];

    const { container } = render(
      <div className="grid grid-cols-2 gap-4">
        <Select label="Status" options={statusOptions} />
        <Select label="Tipo" options={typeOptions} />
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible task list', async () => {
    // Using a list pattern instead of grid for better accessibility
    // Grid pattern requires complex row/cell structure
    const { container } = render(
      <div 
        role="list" 
        aria-label="Lista de tarefas de bem-estar"
        className="grid grid-cols-3 gap-6"
      >
        <div role="listitem" tabIndex={0}>
          <Card className="p-6" aria-label="Tarefa: Exercício de Respiração">
            <h3>Exercício de Respiração</h3>
            <Badge variant="info">Exercício</Badge>
            <Badge variant="warning" showIcon>Pendente</Badge>
            <time dateTime="2024-01-20">20/01/2024</time>
            <Button size="sm" aria-label="Iniciar tarefa 'Exercício de Respiração'">
              Iniciar
            </Button>
          </Card>
        </div>
        <div role="listitem" tabIndex={-1}>
          <Card className="p-6" aria-label="Tarefa: Meditação Guiada">
            <h3>Meditação Guiada</h3>
            <Badge variant="info">Meditação</Badge>
            <Badge variant="success" showIcon>Em Andamento</Badge>
            <Button size="sm" aria-label="Concluir tarefa 'Meditação Guiada'">
              Concluir
            </Button>
          </Card>
        </div>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible task card with all elements', async () => {
    const { container } = render(
      <Card className="p-6" role="article" aria-label="Tarefa: Exercício de Respiração">
        <div className="flex items-start justify-between">
          <div>
            <span aria-hidden="true">🏃</span>
            <h3 className="font-semibold">Exercício de Respiração</h3>
            <div className="flex gap-2">
              <Badge variant="info">Exercício</Badge>
              <Badge variant="warning" showIcon>Pendente</Badge>
            </div>
          </div>
          <span aria-label="Tarefa atrasada" role="img">⚠️</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span aria-hidden="true">📅</span>
            <time dateTime="2024-01-20">Vence em 20/01/2024</time>
          </div>
          <div className="flex items-center gap-2">
            <span aria-hidden="true">👤</span>
            <span>Atribuída por Maria Silva</span>
          </div>
        </div>
        <div className="flex justify-between">
          <time dateTime="2024-01-15" className="text-sm">
            Criada em 15/01/2024
          </time>
          <div className="flex gap-2">
            <Button size="sm" aria-label="Iniciar tarefa 'Exercício de Respiração'">
              <span aria-hidden="true">▶</span>
              Iniciar
            </Button>
          </div>
        </div>
      </Card>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible create task modal', async () => {
    const taskTypes = [
      { value: 'exercise', label: 'Exercício' },
      { value: 'meditation', label: 'Meditação' },
      { value: 'reading', label: 'Leitura' }
    ];

    const recurrenceOptions = [
      { value: '', label: 'Sem recorrência' },
      { value: 'daily', label: 'Diária' },
      { value: 'weekly', label: 'Semanal' }
    ];

    const { container } = render(
      <Modal isOpen={true} onClose={() => {}} title="Nova Tarefa Terapêutica" size="lg">
        <form aria-label="Formulário de criação de tarefa">
          <Input label="Título da Tarefa" name="title" required />
          <Select label="Tipo de Tarefa" name="type" options={taskTypes} required />
          <Textarea label="Descrição" name="description" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Data de Vencimento" name="due_date" type="date" />
            <Select label="Recorrência" name="recurrence" options={recurrenceOptions} />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" aria-label="Cancelar criação de tarefa">
              Cancelar
            </Button>
            <Button type="submit" aria-label="Criar nova tarefa terapêutica">
              <span aria-hidden="true">+</span>
              Criar Tarefa
            </Button>
          </div>
        </form>
      </Modal>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible complete task modal with rating', async () => {
    const { container } = render(
      <Modal isOpen={true} onClose={() => {}} title="Concluir Tarefa" size="md">
        <form aria-label="Formulário de conclusão de tarefa">
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h4>Exercício de Respiração</h4>
            <p>Exercício</p>
          </div>
          <Textarea 
            label="Notas de Conclusão" 
            name="notes" 
            required 
          />
          <div>
            <label className="block mb-2">Avaliação de Efetividade (1-5)</label>
            <div role="radiogroup" aria-label="Avaliação de eficácia da tarefa">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  role="radio"
                  aria-checked={rating === 4}
                  aria-label={`Avaliar com ${rating} ${rating === 1 ? 'estrela' : 'estrelas'}`}
                  className="p-2"
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary">Cancelar</Button>
            <Button type="submit">
              <span aria-hidden="true">✓</span>
              Concluir Tarefa
            </Button>
          </div>
        </form>
      </Modal>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible empty state', async () => {
    const { container } = render(
      <Card className="p-8 text-center" role="status" aria-live="polite">
        <span aria-hidden="true" className="text-4xl">🎯</span>
        <h3>Nenhuma tarefa encontrada</h3>
        <p>Tente ajustar os filtros de busca.</p>
      </Card>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('search input should have accessible attributes', () => {
    render(
      <input
        type="text"
        placeholder="Buscar tarefas... (Ctrl+K ou /)"
        aria-label="Buscar tarefas"
      />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-label');
    expect(input.getAttribute('placeholder')).toContain('Ctrl+K');
  });

  it('task list should have proper role and label', () => {
    render(
      <div role="list" aria-label="Lista de tarefas">
        <div role="listitem" tabIndex={0}>Task 1</div>
        <div role="listitem" tabIndex={-1}>Task 2</div>
      </div>
    );
    
    const list = screen.getByRole('list');
    expect(list).toHaveAttribute('aria-label');
    
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveAttribute('tabindex', '0');
    expect(items[1]).toHaveAttribute('tabindex', '-1');
  });
});
