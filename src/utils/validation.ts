import { isValidEmail, isValidPassword } from './security';
import { validationMessages } from '../lib/errorMessages';

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

// Mapeamento de campos para labels amigáveis
const fieldLabels: Record<string, string> = {
  email: 'seu e-mail',
  password: 'sua senha',
  confirmPassword: 'a confirmação de senha',
  name: 'seu nome',
  title: 'o título',
  description: 'a descrição',
  deadline: 'a data limite',
  phone: 'seu telefone',
  cpf: 'seu CPF',
  position: 'seu cargo',
  level: 'seu nível',
};

export const validate = (data: Record<string, any>, schema: ValidationSchema): Record<string, string> => {
  const errors: Record<string, string> = {};

  Object.entries(schema).forEach(([field, rules]) => {
    const value = data[field];
    const label = fieldLabels[field] || field;

    // Required validation
    if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
      errors[field] = validationMessages.required(label);
      return;
    }

    // Skip other validations if field is empty and not required
    if (!value) return;

    // String length validations
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors[field] = validationMessages.text.tooShort(rules.minLength);
        return;
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        errors[field] = validationMessages.text.tooLong(rules.maxLength);
        return;
      }
    }

    // Pattern validation
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      errors[field] = `Verifique o formato de ${label}`;
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
      custom: (value: string) => !isValidEmail(value) ? validationMessages.email.invalid : null
    },
    password: {
      required: true,
      custom: (value: string) => !isValidPassword(value) ? validationMessages.password.tooShort : null
    }
  },

  signup: {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100
    },
    email: {
      required: true,
      custom: (value: string) => !isValidEmail(value) ? validationMessages.email.invalid : null
    },
    password: {
      required: true,
      custom: (value: string) => !isValidPassword(value) ? validationMessages.password.tooShort : null
    },
    confirmPassword: {
      required: true,
    },
    position: {
      required: true,
      minLength: 2
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
        return date <= today ? validationMessages.date.past : null;
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
        return date <= today ? validationMessages.date.past : null;
      }
    }
  }
};