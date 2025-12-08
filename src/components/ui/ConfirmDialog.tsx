import React, { useEffect, useRef, useCallback, useId, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Trash2, XCircle, RefreshCw, Ban } from 'lucide-react';
import { Button } from './Button';

export type ConfirmDialogVariant = 'danger' | 'warning' | 'info';

export interface ConfirmDialogProps {
  /** Se o dialog está aberto */
  isOpen: boolean;
  /** Callback para fechar o dialog */
  onClose: () => void;
  /** Callback quando o usuário confirma */
  onConfirm: () => void | Promise<void>;
  /** Título do dialog */
  title: string;
  /** Descrição/corpo do dialog */
  description: string;
  /** Texto do botão de confirmar */
  confirmText?: string;
  /** Texto do botão de cancelar */
  cancelText?: string;
  /** Variante visual (define cor e ícone) */
  variant?: ConfirmDialogVariant;
  /** Ícone customizado */
  icon?: React.ReactNode;
  /** Se está processando (loading) */
  isLoading?: boolean;
  /** Mensagem de loading */
  loadingText?: string;
  /** Identificador da ação para "não mostrar novamente" */
  actionId?: string;
  /** Se deve mostrar opção "não mostrar novamente" */
  showDontAskAgain?: boolean;
  /** Entrada de confirmação (digitar texto para confirmar) */
  confirmInput?: {
    /** Texto que deve ser digitado */
    text: string;
    /** Label do input */
    label: string;
    /** Placeholder */
    placeholder?: string;
  };
}

// Variantes de estilo
const variantStyles: Record<ConfirmDialogVariant, {
  iconBg: string;
  iconColor: string;
  confirmBg: string;
  confirmHover: string;
  Icon: React.FC<{ size?: number; className?: string }>;
}> = {
  danger: {
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
    confirmBg: 'bg-rose-600 hover:bg-rose-700',
    confirmHover: 'focus-visible:ring-rose-500',
    Icon: Trash2,
  },
  warning: {
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    confirmBg: 'bg-amber-600 hover:bg-amber-700',
    confirmHover: 'focus-visible:ring-amber-500',
    Icon: AlertTriangle,
  },
  info: {
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    confirmBg: 'bg-blue-600 hover:bg-blue-700',
    confirmHover: 'focus-visible:ring-blue-500',
    Icon: RefreshCw,
  },
};

// Chave localStorage para preferências
const PREFERENCES_KEY = 'confirm-dialog-preferences';

// Gerenciar preferências de "não mostrar novamente"
export function getDontAskAgainPreference(actionId: string): boolean {
  try {
    const prefs = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}');
    return prefs[actionId] === true;
  } catch {
    return false;
  }
}

export function setDontAskAgainPreference(actionId: string, value: boolean): void {
  try {
    const prefs = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}');
    if (value) {
      prefs[actionId] = true;
    } else {
      delete prefs[actionId];
    }
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage errors
  }
}

export function clearAllDontAskAgainPreferences(): void {
  try {
    localStorage.removeItem(PREFERENCES_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function getAllDontAskAgainPreferences(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}');
  } catch {
    return {};
  }
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  icon,
  isLoading = false,
  loadingText = 'Processando...',
  actionId,
  showDontAskAgain = false,
  confirmInput,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  const styles = variantStyles[variant];
  const IconComponent = styles.Icon;
  
  // Verificar se a confirmação por input é válida
  const isInputValid = !confirmInput || inputValue === confirmInput.text;

  // Fechar ao pressionar Escape
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && !isLoading) {
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }
  }, [onClose, isLoading]);

  // Focus trap
  const handleTabKey = useCallback((event: KeyboardEvent) => {
    if (event.key !== 'Tab' || !dialogRef.current) return;

    const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setInputValue('');
      setDontAskAgain(false);
      return;
    }

    // Salvar elemento focado anteriormente
    previouslyFocusedRef.current = document.activeElement as HTMLElement;

    // Prevenir scroll do body
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Adicionar listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleTabKey);

    // Focar no botão cancelar (ação segura)
    const focusTimer = setTimeout(() => {
      cancelButtonRef.current?.focus();
    }, 50);

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleTabKey);
      document.body.style.overflow = originalOverflow;
      
      // Restaurar foco
      if (previouslyFocusedRef.current?.focus) {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [isOpen, handleKeyDown, handleTabKey]);

  const handleConfirm = async () => {
    // Salvar preferência se marcado
    if (showDontAskAgain && dontAskAgain && actionId) {
      setDontAskAgainPreference(actionId, true);
    }
    
    await onConfirm();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div 
            className="flex min-h-screen items-center justify-center p-4"
            onClick={handleBackdropClick}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50"
              aria-hidden="true"
            />
            
            {/* Dialog */}
            <motion.div
              ref={dialogRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={descriptionId}
              className="relative w-full max-w-md rounded-xl bg-white shadow-xl"
              tabIndex={-1}
            >
              {/* Close button */}
              {!isLoading && (
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                  aria-label="Fechar"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              )}

              <div className="p-6">
                {/* Icon */}
                <div className={`mx-auto w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center mb-4`}>
                  {icon || <IconComponent size={24} className={styles.iconColor} aria-hidden="true" />}
                </div>

                {/* Title */}
                <h2 
                  id={titleId}
                  className="text-lg font-semibold text-slate-900 text-center mb-2"
                >
                  {title}
                </h2>

                {/* Description */}
                <p 
                  id={descriptionId}
                  className="text-sm text-slate-600 text-center mb-6"
                >
                  {description}
                </p>

                {/* Confirm Input */}
                {confirmInput && (
                  <div className="mb-6">
                    <label 
                      htmlFor="confirm-input"
                      className="block text-sm font-medium text-slate-700 mb-2"
                    >
                      {confirmInput.label}
                    </label>
                    <input
                      id="confirm-input"
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={confirmInput.placeholder || `Digite "${confirmInput.text}"`}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      disabled={isLoading}
                      autoComplete="off"
                    />
                    {inputValue && inputValue !== confirmInput.text && (
                      <p className="mt-1 text-xs text-rose-600">
                        O texto não corresponde. Digite exatamente "{confirmInput.text}"
                      </p>
                    )}
                  </div>
                )}

                {/* Don't ask again checkbox */}
                {showDontAskAgain && actionId && (
                  <div className="flex items-center gap-2 mb-6">
                    <input
                      id="dont-ask-again"
                      type="checkbox"
                      checked={dontAskAgain}
                      onChange={(e) => setDontAskAgain(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                      disabled={isLoading}
                    />
                    <label 
                      htmlFor="dont-ask-again"
                      className="text-sm text-slate-600"
                    >
                      Não perguntar novamente
                    </label>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    ref={cancelButtonRef}
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {cancelText}
                  </Button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isLoading || !isInputValid}
                    className={`
                      flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white
                      transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${styles.confirmBg} ${styles.confirmHover}
                    `}
                  >
                    {isLoading ? loadingText : confirmText}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

// =====================================================
// HOOK PARA USAR CONFIRM DIALOG
// =====================================================

interface UseConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  actionId?: string;
  showDontAskAgain?: boolean;
  confirmInput?: {
    text: string;
    label: string;
  };
}

interface UseConfirmReturn {
  isOpen: boolean;
  isLoading: boolean;
  confirm: () => Promise<boolean>;
  ConfirmDialogComponent: React.FC;
}

export function useConfirm(options: UseConfirmOptions): UseConfirmReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const resolveRef = useRef<(value: boolean) => void>();

  // Verificar preferência "não mostrar novamente"
  const shouldSkip = options.actionId 
    ? getDontAskAgainPreference(options.actionId) 
    : false;

  const confirm = useCallback(async (): Promise<boolean> => {
    // Se usuário marcou "não mostrar novamente", confirmar automaticamente
    if (shouldSkip) {
      return true;
    }

    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setIsOpen(true);
    });
  }, [shouldSkip]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setIsLoading(false);
    resolveRef.current?.(false);
  }, []);

  const handleConfirm = useCallback(async () => {
    setIsLoading(true);
    // Pequeno delay para UX
    await new Promise(resolve => setTimeout(resolve, 200));
    setIsOpen(false);
    setIsLoading(false);
    resolveRef.current?.(true);
  }, []);

  const ConfirmDialogComponent: React.FC = useCallback(() => (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      isLoading={isLoading}
      {...options}
    />
  ), [isOpen, isLoading, handleClose, handleConfirm, options]);

  return {
    isOpen,
    isLoading,
    confirm,
    ConfirmDialogComponent,
  };
}

// =====================================================
// AÇÕES DESTRUTIVAS PRÉ-CONFIGURADAS
// =====================================================

export const destructiveActions = {
  // PDI
  deletePDI: (name?: string): UseConfirmOptions => ({
    title: 'Excluir PDI?',
    description: name 
      ? `O PDI "${name}" será excluído permanentemente. Todo o progresso e ações associadas serão perdidos.`
      : 'Este PDI será excluído permanentemente. Todo o progresso e ações associadas serão perdidos.',
    confirmText: 'Sim, excluir PDI',
    cancelText: 'Cancelar',
    variant: 'danger',
    actionId: 'delete-pdi',
    showDontAskAgain: true,
  }),

  cancelPDI: (name?: string): UseConfirmOptions => ({
    title: 'Cancelar PDI?',
    description: name
      ? `O PDI "${name}" será cancelado. Você poderá reativá-lo posteriormente se necessário.`
      : 'Este PDI será cancelado. Você poderá reativá-lo posteriormente se necessário.',
    confirmText: 'Sim, cancelar PDI',
    cancelText: 'Voltar',
    variant: 'warning',
    actionId: 'cancel-pdi',
  }),

  removeCompetency: (name?: string): UseConfirmOptions => ({
    title: 'Remover competência?',
    description: name
      ? `A competência "${name}" será removida do PDI. O progresso registrado será perdido.`
      : 'Esta competência será removida do PDI. O progresso registrado será perdido.',
    confirmText: 'Sim, remover',
    cancelText: 'Cancelar',
    variant: 'danger',
    actionId: 'remove-competency',
    showDontAskAgain: true,
  }),

  // Competências (Admin)
  deleteCompetency: (name?: string): UseConfirmOptions => ({
    title: 'Excluir competência?',
    description: name
      ? `A competência "${name}" será excluída permanentemente. Todos os PDIs que a utilizam serão afetados.`
      : 'Esta competência será excluída permanentemente. Todos os PDIs que a utilizam serão afetados.',
    confirmText: 'Sim, excluir competência',
    cancelText: 'Cancelar',
    variant: 'danger',
    confirmInput: name ? {
      text: name,
      label: `Digite "${name}" para confirmar`,
    } : undefined,
  }),

  resetProgress: (name?: string): UseConfirmOptions => ({
    title: 'Resetar progresso?',
    description: name
      ? `Todo o progresso da competência "${name}" será zerado. Esta ação não pode ser desfeita.`
      : 'Todo o progresso será zerado. Esta ação não pode ser desfeita.',
    confirmText: 'Sim, resetar',
    cancelText: 'Cancelar',
    variant: 'warning',
  }),

  // Ações/Tarefas
  deleteAction: (name?: string): UseConfirmOptions => ({
    title: 'Excluir ação?',
    description: name
      ? `A ação "${name}" será excluída permanentemente.`
      : 'Esta ação será excluída permanentemente.',
    confirmText: 'Sim, excluir',
    cancelText: 'Cancelar',
    variant: 'danger',
    actionId: 'delete-action',
    showDontAskAgain: true,
  }),

  deleteTask: (name?: string): UseConfirmOptions => ({
    title: 'Excluir tarefa?',
    description: name
      ? `A tarefa "${name}" será excluída permanentemente.`
      : 'Esta tarefa será excluída permanentemente.',
    confirmText: 'Sim, excluir',
    cancelText: 'Cancelar',
    variant: 'danger',
    actionId: 'delete-task',
    showDontAskAgain: true,
  }),

  cancelInProgress: (type: 'ação' | 'tarefa', name?: string): UseConfirmOptions => ({
    title: `Cancelar ${type} em andamento?`,
    description: name
      ? `"${name}" está em andamento. Deseja realmente cancelar?`
      : `Esta ${type} está em andamento. Deseja realmente cancelar?`,
    confirmText: `Sim, cancelar ${type}`,
    cancelText: 'Voltar',
    variant: 'warning',
  }),

  // Mentoria
  cancelSession: (date?: string): UseConfirmOptions => ({
    title: 'Cancelar sessão de mentoria?',
    description: date
      ? `A sessão agendada para ${date} será cancelada. O mentor e mentorado serão notificados.`
      : 'Esta sessão será cancelada. O mentor e mentorado serão notificados.',
    confirmText: 'Sim, cancelar sessão',
    cancelText: 'Voltar',
    variant: 'warning',
    actionId: 'cancel-mentorship-session',
  }),

  rejectMentorshipRequest: (name?: string): UseConfirmOptions => ({
    title: 'Recusar solicitação?',
    description: name
      ? `A solicitação de mentoria de "${name}" será recusada.`
      : 'Esta solicitação de mentoria será recusada.',
    confirmText: 'Sim, recusar',
    cancelText: 'Cancelar',
    variant: 'danger',
  }),

  // Saúde Mental
  deleteCheckIn: (date?: string): UseConfirmOptions => ({
    title: 'Excluir check-in?',
    description: date
      ? `O check-in de ${date} será excluído permanentemente.`
      : 'Este check-in será excluído permanentemente.',
    confirmText: 'Sim, excluir',
    cancelText: 'Cancelar',
    variant: 'danger',
    actionId: 'delete-checkin',
    showDontAskAgain: true,
  }),

  deleteTherapyNote: (): UseConfirmOptions => ({
    title: 'Excluir nota terapêutica?',
    description: 'Esta nota será excluída permanentemente. Esta ação não pode ser desfeita.',
    confirmText: 'Sim, excluir nota',
    cancelText: 'Cancelar',
    variant: 'danger',
  }),

  // Admin
  deleteUser: (name?: string): UseConfirmOptions => ({
    title: 'Excluir usuário?',
    description: name
      ? `O usuário "${name}" será removido permanentemente do sistema. Todos os dados associados serão perdidos.`
      : 'Este usuário será removido permanentemente. Todos os dados associados serão perdidos.',
    confirmText: 'Sim, excluir usuário',
    cancelText: 'Cancelar',
    variant: 'danger',
    confirmInput: name ? {
      text: name,
      label: `Digite "${name}" para confirmar`,
    } : undefined,
  }),

  rejectVacation: (name?: string, dates?: string): UseConfirmOptions => ({
    title: 'Recusar solicitação de férias?',
    description: name && dates
      ? `A solicitação de férias de "${name}" para ${dates} será recusada.`
      : 'Esta solicitação de férias será recusada.',
    confirmText: 'Sim, recusar',
    cancelText: 'Cancelar',
    variant: 'warning',
  }),

  deleteEvent: (name?: string): UseConfirmOptions => ({
    title: 'Excluir evento?',
    description: name
      ? `O evento "${name}" será excluído permanentemente. Todos os participantes serão notificados.`
      : 'Este evento será excluído permanentemente.',
    confirmText: 'Sim, excluir evento',
    cancelText: 'Cancelar',
    variant: 'danger',
    actionId: 'delete-event',
    showDontAskAgain: true,
  }),

  // Genérico
  generic: (action: string, itemName?: string): UseConfirmOptions => ({
    title: `${action}?`,
    description: itemName
      ? `"${itemName}" será ${action.toLowerCase()}. Esta ação não pode ser desfeita.`
      : `Este item será ${action.toLowerCase()}. Esta ação não pode ser desfeita.`,
    confirmText: `Sim, ${action.toLowerCase()}`,
    cancelText: 'Cancelar',
    variant: 'danger',
  }),
};

ConfirmDialog.displayName = 'ConfirmDialog';
