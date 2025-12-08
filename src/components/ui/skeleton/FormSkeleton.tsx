import React from 'react';
import { Skeleton, SkeletonText, SkeletonTitle } from './Skeleton';

export interface FormSkeletonProps {
  /** Número de campos */
  fields?: number;
  /** Se deve mostrar título */
  showTitle?: boolean;
  /** Se deve mostrar botões de ação */
  showActions?: boolean;
  /** Se deve mostrar campos em grid */
  gridCols?: 1 | 2;
  /** Classe CSS adicional */
  className?: string;
  /** Configuração específica de campos */
  fieldConfig?: Array<{
    type?: 'input' | 'textarea' | 'select' | 'checkbox' | 'date' | 'file';
    label?: boolean;
    helperText?: boolean;
    fullWidth?: boolean;
  }>;
}

/**
 * Skeleton para Formulários
 */
export const FormSkeleton: React.FC<FormSkeletonProps> = ({
  fields = 4,
  showTitle = true,
  showActions = true,
  gridCols = 1,
  className = '',
  fieldConfig,
}) => {
  const renderField = (config: FormSkeletonProps['fieldConfig'][0] = {}, index: number) => {
    const { type = 'input', label = true, helperText = false, fullWidth = false } = config;
    
    const fieldClasses = gridCols === 2 && !fullWidth ? '' : 'col-span-2';

    // Input padrão
    if (type === 'input') {
      return (
        <div className={`space-y-2 ${fieldClasses}`}>
          {label && <SkeletonText width="100px" />}
          <Skeleton width="100%" height={44} className="rounded-lg" />
          {helperText && <SkeletonText width="150px" />}
        </div>
      );
    }

    // Textarea
    if (type === 'textarea') {
      return (
        <div className={`space-y-2 col-span-2`}>
          {label && <SkeletonText width="100px" />}
          <Skeleton width="100%" height={120} className="rounded-lg" />
          {helperText && <SkeletonText width="200px" />}
        </div>
      );
    }

    // Select
    if (type === 'select') {
      return (
        <div className={`space-y-2 ${fieldClasses}`}>
          {label && <SkeletonText width="80px" />}
          <Skeleton width="100%" height={44} className="rounded-lg" />
        </div>
      );
    }

    // Checkbox
    if (type === 'checkbox') {
      return (
        <div className={`flex items-center gap-3 ${fieldClasses}`}>
          <Skeleton width={20} height={20} className="rounded" />
          <SkeletonText width="200px" />
        </div>
      );
    }

    // Date picker
    if (type === 'date') {
      return (
        <div className={`space-y-2 ${fieldClasses}`}>
          {label && <SkeletonText width="60px" />}
          <Skeleton width="100%" height={44} className="rounded-lg" />
        </div>
      );
    }

    // File upload
    if (type === 'file') {
      return (
        <div className={`space-y-2 col-span-2`}>
          {label && <SkeletonText width="120px" />}
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-8">
            <div className="flex flex-col items-center gap-3">
              <Skeleton width={48} height={48} className="rounded-lg" />
              <SkeletonText width="200px" />
              <SkeletonText width="150px" />
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Gerar configuração padrão se não fornecida
  const fieldsConfig = fieldConfig || Array.from({ length: fields }).map((_, i) => ({
    type: i === fields - 1 && fields > 3 ? 'textarea' : 'input' as const,
    label: true,
    helperText: i === 0,
  }));

  return (
    <div 
      className={`bg-white rounded-xl border border-slate-200 p-6 ${className}`}
      role="status"
      aria-busy="true"
      aria-label="Carregando formulário..."
    >
      {/* Title */}
      {showTitle && (
        <div className="mb-6">
          <SkeletonTitle width="200px" />
          <SkeletonText width="300px" className="mt-2" />
        </div>
      )}

      {/* Fields */}
      <div className={`grid ${gridCols === 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
        {fieldsConfig.map((config, index) => (
          <React.Fragment key={index}>
            {renderField(config, index)}
          </React.Fragment>
        ))}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
          <Skeleton width={100} height={44} className="rounded-lg" />
          <Skeleton width={120} height={44} className="rounded-lg" />
        </div>
      )}
      
      <span className="sr-only">Carregando formulário...</span>
    </div>
  );
};

/**
 * Skeleton para formulário de login
 */
export const LoginFormSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <FormSkeleton
    showTitle={false}
    fields={2}
    fieldConfig={[
      { type: 'input', label: true },
      { type: 'input', label: true },
    ]}
    className={className}
  />
);

/**
 * Skeleton para formulário de perfil
 */
export const ProfileFormSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <FormSkeleton
    showTitle={true}
    gridCols={2}
    fieldConfig={[
      { type: 'input', label: true, fullWidth: false },
      { type: 'input', label: true, fullWidth: false },
      { type: 'input', label: true, fullWidth: false },
      { type: 'select', label: true, fullWidth: false },
      { type: 'textarea', label: true, fullWidth: true },
      { type: 'file', label: true, fullWidth: true },
    ]}
    className={className}
  />
);

/**
 * Skeleton para formulário de PDI
 */
export const PDIFormSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <FormSkeleton
    showTitle={true}
    fieldConfig={[
      { type: 'input', label: true, helperText: true },
      { type: 'textarea', label: true },
      { type: 'date', label: true },
      { type: 'select', label: true },
    ]}
    className={className}
  />
);

/**
 * Skeleton para modal de formulário
 */
export const FormModalSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`space-y-6 ${className}`}>
    {/* Header */}
    <div className="flex items-center justify-between">
      <SkeletonTitle width="180px" />
      <Skeleton width={32} height={32} className="rounded-lg" />
    </div>
    
    {/* Content */}
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <SkeletonText width="80px" />
          <Skeleton width="100%" height={44} className="rounded-lg" />
        </div>
      ))}
    </div>
    
    {/* Actions */}
    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
      <Skeleton width={80} height={40} className="rounded-lg" />
      <Skeleton width={100} height={40} className="rounded-lg" />
    </div>
  </div>
);

FormSkeleton.displayName = 'FormSkeleton';
LoginFormSkeleton.displayName = 'LoginFormSkeleton';
ProfileFormSkeleton.displayName = 'ProfileFormSkeleton';
PDIFormSkeleton.displayName = 'PDIFormSkeleton';
FormModalSkeleton.displayName = 'FormModalSkeleton';
