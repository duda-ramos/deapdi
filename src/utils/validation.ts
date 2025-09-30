import { isValidEmail, isValidPassword } from './security';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export const validate = (data: Record<string, any>, schema: ValidationSchema): Record<string, string> => {
  const errors: Record<string, string> = {};

  Object.entries(schema).forEach(([field, rules]) => {
    const value = data[field];

    // Required validation
    if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
      errors[field] = 'Este campo é obrigatório';
      return;
    }

    // Skip other validations if field is empty and not required
    if (!value) return;

    // String length validations
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors[field] = `Deve ter pelo menos ${rules.minLength} caracteres`;
        return;
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        errors[field] = `Deve ter no máximo ${rules.maxLength} caracteres`;
        return;
      }
    }

    // Pattern validation
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      errors[field] = 'Formato inválido';
      return;
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        errors[field] = customError;
        return;
      }
    }
  });

  return errors;
};

// Common validation schemas
export const validationSchemas = {
  login: {
    email: {
      required: true,
      custom: (value: string) => !isValidEmail(value) ? 'Email inválido' : null
    },
    password: {
      required: true,
      custom: (value: string) => !isValidPassword(value) ? 'Senha deve ter pelo menos 6 caracteres' : null
    }
  },

  profile: {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100
    },
    bio: {
      maxLength: 500
    },
    formation: {
      maxLength: 1000
    }
  },

  pdi: {
    title: {
      required: true,
      minLength: 5,
      maxLength: 200
    },
    description: {
      required: true,
      minLength: 20,
      maxLength: 2000
    },
    deadline: {
      required: true,
      custom: (value: string) => {
        const date = new Date(value);
        const today = new Date();
        return date <= today ? 'A data deve ser futura' : null;
      }
    }
  },

  actionGroup: {
    title: {
      required: true,
      minLength: 5,
      maxLength: 200
    },
    description: {
      required: true,
      minLength: 20,
      maxLength: 1000
    },
    deadline: {
      required: true,
      custom: (value: string) => {
        const date = new Date(value);
        const today = new Date();
        return date <= today ? 'A data deve ser futura' : null;
      }
    }
  }
};