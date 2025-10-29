import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Trash2,
  Save,
  Eye,
  Settings,
  Type,
  CheckSquare,
  ToggleLeft,
  Hash,
  FileText,
  Copy,
  Move,
  GripVertical
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { mentalHealthService, FormTemplate, FormQuestion } from '../../services/mentalHealth';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';

interface FormBuilderProps {
  onSave?: (template: FormTemplate) => void;
  onCancel?: () => void;
  initialTemplate?: FormTemplate;
}

const FormBuilder: React.FC<FormBuilderProps> = ({ onSave, onCancel, initialTemplate }) => {
  const { user } = useAuth();
  const [template, setTemplate] = useState<Partial<FormTemplate>>({
    title: '',
    description: '',
    form_type: 'custom',
    questions: [],
    scoring_rules: { total_score: 'sum', max_score: 100 },
    alert_thresholds: { alto: 70, critico: 90 },
    target_audience: ['all'],
    is_active: true,
    is_recurring: false,
    created_by: user?.id || ''
  });
  const [selectedQuestion, setSelectedQuestion] = useState<FormQuestion | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [draggedQuestion, setDraggedQuestion] = useState<number | null>(null);

  const questionTypes = [
    { value: 'scale', label: 'Escala (1-10)', icon: <Hash size={16} /> },
    { value: 'multiple_choice', label: 'Múltipla Escolha', icon: <CheckSquare size={16} /> },
    { value: 'text', label: 'Texto Livre', icon: <Type size={16} /> },
    { value: 'yes_no', label: 'Sim/Não', icon: <ToggleLeft size={16} /> }
  ];

  const formTypes = [
    { value: 'auto_avaliacao', label: 'Auto-avaliação' },
    { value: 'feedback_gestor', label: 'Feedback do Gestor' },
    { value: 'avaliacao_rh', label: 'Avaliação RH' },
    { value: 'custom', label: 'Personalizado' }
  ];

  const templates = [
    {
      name: 'GAD-7 - Ansiedade',
      description: 'Questionário de Ansiedade Generalizada',
      questions: [
        {
          id: 'q1',
          question: 'Sentir-se nervoso, ansioso ou muito preocupado',
          type: 'scale',
          options: [
            { value: 0, label: 'Nenhum dia' },
            { value: 1, label: 'Vários dias' },
            { value: 2, label: 'Mais da metade dos dias' },
            { value: 3, label: 'Quase todos os dias' }
          ],
          required: true
        }
      ]
    },
    {
      name: 'PHQ-9 - Depressão',
      description: 'Questionário de Saúde do Paciente',
      questions: [
        {
          id: 'q1',
          question: 'Pouco interesse ou prazer em fazer coisas',
          type: 'scale',
          options: [
            { value: 0, label: 'Nenhum dia' },
            { value: 1, label: 'Vários dias' },
            { value: 2, label: 'Mais da metade dos dias' },
            { value: 3, label: 'Quase todos os dias' }
          ],
          required: true
        }
      ]
    }
  ];

  useEffect(() => {
    if (initialTemplate) {
      setTemplate(initialTemplate);
    }
  }, [initialTemplate]);

  const addQuestion = (type: string) => {
    const newQuestion: FormQuestion = {
      id: `q${Date.now()}`,
      question: '',
      type: type as any,
      options: type === 'multiple_choice' ? [
        { value: 'option1', label: 'Opção 1' },
        { value: 'option2', label: 'Opção 2' }
      ] : type === 'scale' ? [
        { value: 0, label: 'Nunca' },
        { value: 1, label: 'Raramente' },
        { value: 2, label: 'Às vezes' },
        { value: 3, label: 'Frequentemente' },
        { value: 4, label: 'Sempre' }
      ] : undefined,
      required: true
    };

    setTemplate(prev => ({
      ...prev,
      questions: [...(prev.questions || []), newQuestion]
    }));
  };

  const updateQuestion = (index: number, updatedQuestion: FormQuestion) => {
    setTemplate(prev => ({
      ...prev,
      questions: prev.questions?.map((q, i) => i === index ? updatedQuestion : q) || []
    }));
  };

  const deleteQuestion = (index: number) => {
    setTemplate(prev => ({
      ...prev,
      questions: prev.questions?.filter((_, i) => i !== index) || []
    }));
  };

  const duplicateQuestion = (index: number) => {
    const question = template.questions?.[index];
    if (question) {
      const duplicatedQuestion = {
        ...question,
        id: `q${Date.now()}`,
        question: `${question.question} (cópia)`
      };
      
      setTemplate(prev => ({
        ...prev,
        questions: [
          ...(prev.questions?.slice(0, index + 1) || []),
          duplicatedQuestion,
          ...(prev.questions?.slice(index + 1) || [])
        ]
      }));
    }
  };

  const moveQuestion = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const questions = [...(template.questions || [])];
    const [movedQuestion] = questions.splice(fromIndex, 1);
    questions.splice(toIndex, 0, movedQuestion);
    
    setTemplate(prev => ({
      ...prev,
      questions
    }));
  };

  const addOption = (questionIndex: number) => {
    const question = template.questions?.[questionIndex];
    if (question && question.options) {
      const newOption = {
        value: `option${Date.now()}`,
        label: 'Nova opção'
      };
      
      updateQuestion(questionIndex, {
        ...question,
        options: [...question.options, newOption]
      });
    }
  };

  const updateOption = (questionIndex: number, optionIndex: number, field: 'value' | 'label', value: string) => {
    const question = template.questions?.[questionIndex];
    if (question && question.options) {
      const updatedOptions = question.options.map((opt, i) => 
        i === optionIndex ? { ...opt, [field]: value } : opt
      );
      
      updateQuestion(questionIndex, {
        ...question,
        options: updatedOptions
      });
    }
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const question = template.questions?.[questionIndex];
    if (question && question.options && question.options.length > 1) {
      const updatedOptions = question.options.filter((_, i) => i !== optionIndex);
      
      updateQuestion(questionIndex, {
        ...question,
        options: updatedOptions
      });
    }
  };

  const handleSave = async () => {
    if (!template.title || !template.questions?.length) {
      alert('Por favor, preencha o título e adicione pelo menos uma pergunta.');
      return;
    }

    try {
      const savedTemplate = await mentalHealthService.createFormTemplate(template as FormTemplate);
      onSave?.(savedTemplate);
    } catch (error) {
      console.error('Error saving form template:', error);
      alert('Erro ao salvar formulário. Tente novamente.');
    }
  };

  const loadTemplate = (templateData: any) => {
    setTemplate(prev => ({
      ...prev,
      title: templateData.name,
      description: templateData.description,
      questions: templateData.questions
    }));
  };

  const renderQuestionEditor = (question: FormQuestion, index: number) => (
    <Card key={question.id} className="p-4 mb-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-2">
          <GripVertical className="text-gray-400 cursor-move" size={16} />
          <Badge variant="info" size="sm">
            Pergunta {index + 1}
          </Badge>
          <Badge variant="default" size="sm">
            {questionTypes.find(t => t.value === question.type)?.label}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => duplicateQuestion(index)}
          >
            <Copy size={14} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => deleteQuestion(index)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <Input
          label="Pergunta"
          value={question.question}
          onChange={(e) => updateQuestion(index, { ...question, question: e.target.value })}
          placeholder="Digite sua pergunta aqui..."
          required
        />

        <div className="flex items-center space-x-4">
          <Select
            label="Tipo"
            value={question.type}
            onChange={(e) => updateQuestion(index, { ...question, type: e.target.value as any })}
            options={questionTypes}
          />
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`required-${index}`}
              checked={question.required}
              onChange={(e) => updateQuestion(index, { ...question, required: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor={`required-${index}`} className="text-sm text-gray-700">
              Obrigatória
            </label>
          </div>
        </div>

        {(question.type === 'multiple_choice' || question.type === 'scale') && question.options && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opções
            </label>
            <div className="space-y-2">
              {question.options.map((option, optionIndex) => (
                <div key={`${question.id}-option-${optionIndex}`} className="flex items-center space-x-2">
                  <Input
                    value={typeof option.value === 'string' ? option.value : String(option.value || '')}
                    onChange={(e) => updateOption(index, optionIndex, 'value', e.target.value)}
                    placeholder="Valor"
                    className="flex-1"
                  />
                  <Input
                    value={option.label || ''}
                    onChange={(e) => updateOption(index, optionIndex, 'label', e.target.value)}
                    placeholder="Rótulo"
                    className="flex-1"
                  />
                  {question.options!.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeOption(index, optionIndex)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => addOption(index)}
              >
                <Plus size={14} className="mr-1" />
                Adicionar Opção
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );

  const renderPreview = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{template.title}</h2>
        {template.description && (
          <p className="text-gray-600 mt-2">{template.description}</p>
        )}
      </div>

      {template.questions?.map((question, index) => (
        <Card key={question.id} className="p-4">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700">
              {question.question}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>

          {question.type === 'text' && (
            <Textarea
              placeholder="Digite sua resposta..."
              rows={3}
              disabled
            />
          )}

          {question.type === 'yes_no' && (
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input type="radio" name={`preview-${question.id}`} className="mr-2" disabled />
                Sim
              </label>
              <label className="flex items-center">
                <input type="radio" name={`preview-${question.id}`} className="mr-2" disabled />
                Não
              </label>
            </div>
          )}

          {question.type === 'scale' && question.options && (
            <div className="space-y-2">
              {question.options.map((option, optionIndex) => (
                <label key={optionIndex} className="flex items-center">
                  <input
                    type="radio"
                    name={`preview-${question.id}`}
                    value={option.value}
                    className="mr-2"
                    disabled
                  />
                  {option.label}
                </label>
              ))}
            </div>
          )}

          {question.type === 'multiple_choice' && question.options && (
            <div className="space-y-2">
              {question.options.map((option, optionIndex) => (
                <label key={optionIndex} className="flex items-center">
                  <input
                    type="radio"
                    name={`preview-${question.id}`}
                    value={option.value}
                    className="mr-2"
                    disabled
                  />
                  {option.label}
                </label>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Construtor de Formulários</h2>
        <div className="flex items-center space-x-2">
          <Button variant="secondary" onClick={() => setShowPreview(!showPreview)}>
            <Eye size={16} className="mr-2" />
            {showPreview ? 'Editar' : 'Visualizar'}
          </Button>
          <Button variant="secondary" onClick={() => setShowSettings(true)}>
            <Settings size={16} className="mr-2" />
            Configurações
          </Button>
        </div>
      </div>

      {!showPreview ? (
        <>
          {/* Form Basic Info */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Título do Formulário"
                value={template.title || ''}
                onChange={(e) => setTemplate(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Questionário de Bem-estar"
                required
              />
              <Select
                label="Tipo de Formulário"
                value={template.form_type || 'custom'}
                onChange={(e) => setTemplate(prev => ({ ...prev, form_type: e.target.value as any }))}
                options={formTypes}
              />
            </div>
            <Textarea
              label="Descrição"
              value={template.description || ''}
              onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o propósito deste formulário..."
              rows={2}
            />
          </Card>

          {/* Templates */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Modelos Prontos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((templateData, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <h4 className="font-medium text-gray-900">{templateData.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{templateData.description}</p>
                  <Button size="sm" onClick={() => loadTemplate(templateData)}>
                    Usar Modelo
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Question Types */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Adicionar Pergunta</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {questionTypes.map((type) => (
                <Button
                  key={type.value}
                  variant="secondary"
                  onClick={() => addQuestion(type.value)}
                  className="flex flex-col items-center space-y-2 p-4 h-auto"
                >
                  {type.icon}
                  <span className="text-sm">{type.label}</span>
                </Button>
              ))}
            </div>
          </Card>

          {/* Questions */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Perguntas ({template.questions?.length || 0})
            </h3>
            {template.questions?.map((question, index) => renderQuestionEditor(question, index))}
            
            {(!template.questions || template.questions.length === 0) && (
              <Card className="p-8 text-center">
                <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma pergunta adicionada</h3>
                <p className="text-gray-600 mb-4">
                  Adicione perguntas usando os tipos acima para começar a construir seu formulário.
                </p>
              </Card>
            )}
          </div>
        </>
      ) : (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Visualização do Formulário</h3>
          {renderPreview()}
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={!template.title || !template.questions?.length}>
          <Save size={16} className="mr-2" />
          Salvar Formulário
        </Button>
      </div>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Configurações do Formulário"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Pontuação Máxima"
              type="number"
              value={template.scoring_rules?.max_score || 100}
              onChange={(e) => setTemplate(prev => ({
                ...prev,
                scoring_rules: {
                  ...prev.scoring_rules,
                  max_score: parseInt(e.target.value)
                }
              }))}
            />
            <Input
              label="Limite Alto Risco"
              type="number"
              value={template.alert_thresholds?.alto || 70}
              onChange={(e) => setTemplate(prev => ({
                ...prev,
                alert_thresholds: {
                  ...prev.alert_thresholds,
                  alto: parseInt(e.target.value)
                }
              }))}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_recurring"
              checked={template.is_recurring || false}
              onChange={(e) => setTemplate(prev => ({ ...prev, is_recurring: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="is_recurring" className="text-sm text-gray-700">
              Formulário recorrente
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FormBuilder;
