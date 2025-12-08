import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TooltipProps {
  /** Conteúdo do tooltip */
  content: React.ReactNode;
  /** Elemento que ativa o tooltip */
  children: React.ReactElement;
  /** Posição do tooltip */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Delay antes de mostrar (em ms) */
  delay?: number;
  /** Delay antes de esconder (em ms) */
  hideDelay?: number;
  /** Se o tooltip está desabilitado */
  disabled?: boolean;
  /** Classe CSS adicional para o tooltip */
  className?: string;
  /** Atalho de teclado para exibir (ex: "Ctrl+S") */
  shortcut?: string;
  /** Se deve mostrar seta */
  showArrow?: boolean;
  /** Tamanho máximo do tooltip */
  maxWidth?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 300,
  hideDelay = 0,
  disabled = false,
  className = '',
  shortcut,
  showArrow = true,
  maxWidth = 300,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const tooltipId = useId();
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimeoutRef = useRef<NodeJS.Timeout>();
  const hideTimeoutRef = useRef<NodeJS.Timeout>();

  // Limpar timeouts ao desmontar
  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  // Calcular posição ideal baseado no espaço disponível
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return position;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const spacing = 8; // Espaço entre trigger e tooltip

    // Verificar se há espaço na posição preferida
    const hasSpaceTop = triggerRect.top - tooltipRect.height - spacing > 0;
    const hasSpaceBottom = triggerRect.bottom + tooltipRect.height + spacing < viewport.height;
    const hasSpaceLeft = triggerRect.left - tooltipRect.width - spacing > 0;
    const hasSpaceRight = triggerRect.right + tooltipRect.width + spacing < viewport.width;

    // Se não houver espaço na posição preferida, encontrar alternativa
    if (position === 'top' && !hasSpaceTop) {
      return hasSpaceBottom ? 'bottom' : hasSpaceLeft ? 'left' : 'right';
    }
    if (position === 'bottom' && !hasSpaceBottom) {
      return hasSpaceTop ? 'top' : hasSpaceLeft ? 'left' : 'right';
    }
    if (position === 'left' && !hasSpaceLeft) {
      return hasSpaceRight ? 'right' : hasSpaceTop ? 'top' : 'bottom';
    }
    if (position === 'right' && !hasSpaceRight) {
      return hasSpaceLeft ? 'left' : hasSpaceTop ? 'top' : 'bottom';
    }

    return position;
  }, [position]);

  const showTooltip = useCallback(() => {
    if (disabled) return;

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    showTimeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      // Recalcular posição após render
      requestAnimationFrame(() => {
        setActualPosition(calculatePosition());
      });
    }, delay);
  }, [delay, disabled, calculatePosition]);

  const hideTooltip = useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
    }

    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, hideDelay);
  }, [hideDelay]);

  // Handler para tecla Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isVisible) {
        setIsVisible(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  // Estilos de posicionamento
  const positionStyles: Record<string, React.CSSProperties> = {
    top: {
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginBottom: 8,
    },
    bottom: {
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginTop: 8,
    },
    left: {
      right: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginRight: 8,
    },
    right: {
      left: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginLeft: 8,
    },
  };

  // Estilos da seta
  const arrowStyles: Record<string, string> = {
    top: 'bottom-[-4px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-slate-800',
    bottom: 'top-[-4px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-slate-800',
    left: 'right-[-4px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-slate-800',
    right: 'left-[-4px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-slate-800',
  };

  // Animação baseada na posição
  const getAnimation = (pos: string) => {
    const baseOffset = 4;
    switch (pos) {
      case 'top':
        return { initial: { opacity: 0, y: baseOffset }, animate: { opacity: 1, y: 0 } };
      case 'bottom':
        return { initial: { opacity: 0, y: -baseOffset }, animate: { opacity: 1, y: 0 } };
      case 'left':
        return { initial: { opacity: 0, x: baseOffset }, animate: { opacity: 1, x: 0 } };
      case 'right':
        return { initial: { opacity: 0, x: -baseOffset }, animate: { opacity: 1, x: 0 } };
      default:
        return { initial: { opacity: 0 }, animate: { opacity: 1 } };
    }
  };

  const animation = getAnimation(actualPosition);

  // Clone o children e adicione os event handlers e refs
  const trigger = React.cloneElement(children, {
    ref: (node: HTMLElement) => {
      // Preserve existing ref if present
      triggerRef.current = node;
      const childRef = (children as any).ref;
      if (typeof childRef === 'function') {
        childRef(node);
      } else if (childRef) {
        childRef.current = node;
      }
    },
    onMouseEnter: (e: React.MouseEvent) => {
      showTooltip();
      children.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      hideTooltip();
      children.props.onMouseLeave?.(e);
    },
    onFocus: (e: React.FocusEvent) => {
      showTooltip();
      children.props.onFocus?.(e);
    },
    onBlur: (e: React.FocusEvent) => {
      hideTooltip();
      children.props.onBlur?.(e);
    },
    'aria-describedby': isVisible ? tooltipId : undefined,
  });

  return (
    <span className="relative inline-flex">
      {trigger}
      <AnimatePresence>
        {isVisible && !disabled && (
          <motion.div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            initial={animation.initial}
            animate={animation.animate}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              ...positionStyles[actualPosition],
              maxWidth,
              position: 'absolute',
              zIndex: 50,
            }}
            className={`
              px-3 py-2 text-sm text-white bg-slate-800 rounded-lg shadow-lg
              pointer-events-none whitespace-normal break-words
              ${className}
            `}
          >
            <div className="flex items-center gap-2">
              <span>{content}</span>
              {shortcut && (
                <kbd className="px-1.5 py-0.5 text-xs bg-slate-700 rounded font-mono">
                  {shortcut}
                </kbd>
              )}
            </div>
            {showArrow && (
              <span
                className={`absolute w-0 h-0 border-4 ${arrowStyles[actualPosition]}`}
                aria-hidden="true"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};

// =====================================================
// TOOLTIP PROVIDER - Para tooltips globais
// =====================================================

interface TooltipContextValue {
  isTooltipDisabled: boolean;
  globalDelay: number;
}

const TooltipContext = React.createContext<TooltipContextValue>({
  isTooltipDisabled: false,
  globalDelay: 300,
});

export interface TooltipProviderProps {
  children: React.ReactNode;
  /** Desabilitar todos os tooltips */
  disabled?: boolean;
  /** Delay global (pode ser sobrescrito por tooltip individual) */
  delay?: number;
}

export const TooltipProvider: React.FC<TooltipProviderProps> = ({
  children,
  disabled = false,
  delay = 300,
}) => {
  return (
    <TooltipContext.Provider value={{ isTooltipDisabled: disabled, globalDelay: delay }}>
      {children}
    </TooltipContext.Provider>
  );
};

export const useTooltipContext = () => React.useContext(TooltipContext);

// =====================================================
// ICON BUTTON COM TOOLTIP INTEGRADO
// =====================================================

export interface IconButtonWithTooltipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Texto do tooltip */
  tooltip: string;
  /** Ícone */
  icon: React.ReactNode;
  /** Atalho de teclado */
  shortcut?: string;
  /** Variante visual */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Tamanho */
  size?: 'sm' | 'md' | 'lg';
  /** Posição do tooltip */
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
}

export const IconButtonWithTooltip: React.FC<IconButtonWithTooltipProps> = ({
  tooltip,
  icon,
  shortcut,
  variant = 'ghost',
  size = 'md',
  tooltipPosition = 'top',
  className = '',
  ...buttonProps
}) => {
  const variants = {
    primary: 'bg-primary text-ink hover:bg-primary-dark',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
    danger: 'bg-transparent text-rose-600 hover:bg-rose-50',
  };

  const sizes = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  };

  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20,
  };

  return (
    <Tooltip content={tooltip} shortcut={shortcut} position={tooltipPosition}>
      <button
        type="button"
        className={`
          inline-flex items-center justify-center rounded-lg transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variants[variant]}
          ${sizes[size]}
          ${className}
        `}
        aria-label={tooltip}
        {...buttonProps}
      >
        {React.isValidElement(icon)
          ? React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: iconSizes[size] })
          : icon}
      </button>
    </Tooltip>
  );
};

Tooltip.displayName = 'Tooltip';
TooltipProvider.displayName = 'TooltipProvider';
IconButtonWithTooltip.displayName = 'IconButtonWithTooltip';
