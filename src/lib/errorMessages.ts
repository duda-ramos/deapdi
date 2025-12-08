/**
 * Sistema centralizado de mensagens de erro
 * 
 * Princípios:
 * 1. Ser específico - não "Campo obrigatório", mas "Informe seu e-mail"
 * 2. Incluir ação - não "Senha inválida", mas "Senha incorreta. Tente novamente ou clique em 'Esqueci minha senha'"
 * 3. Ser empático - evitar "Você errou", preferir "Algo deu errado"
 * 4. Tom consistente - usar "você", evitar técnico, ser conciso
 */

export type ErrorCategory = 
  | 'auth'
  | 'validation'
  | 'network'
  | 'permission'
  | 'notFound'
  | 'conflict'
  | 'upload'
  | 'server'
  | 'generic';

export interface ErrorMessageConfig {
  message: string;
  suggestion?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

// =====================================================
// MENSAGENS DE VALIDAÇÃO DE FORMULÁRIO
// =====================================================
export const validationMessages = {
  // Campos gerais
  required: (fieldName: string) => `Informe ${fieldName.toLowerCase()}`,
  
  // Email
  email: {
    required: 'Informe seu e-mail para continuar',
    invalid: 'Digite um e-mail válido (exemplo: seu@email.com)',
    notFound: 'Não encontramos uma conta com este e-mail. Verifique o endereço ou crie uma nova conta',
    alreadyExists: 'Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail',
  },
  
  // Senha
  password: {
    required: 'Digite sua senha para continuar',
    tooShort: 'Sua senha precisa ter pelo menos 6 caracteres',
    tooWeak: 'Escolha uma senha mais forte: use letras, números e símbolos',
    mismatch: 'As senhas não coincidem. Digite novamente',
    incorrect: 'Senha incorreta. Tente novamente ou clique em "Esqueci minha senha"',
  },
  
  // Nome
  name: {
    required: 'Informe seu nome completo',
    tooShort: 'Digite seu nome completo',
    tooLong: 'O nome não pode ter mais de 100 caracteres',
    invalid: 'O nome contém caracteres inválidos',
  },
  
  // CPF
  cpf: {
    required: 'Informe seu CPF',
    invalid: 'Digite um CPF válido (apenas números ou com pontos e traço)',
    format: 'Use o formato: 000.000.000-00',
  },
  
  // Telefone
  phone: {
    required: 'Informe um telefone para contato',
    invalid: 'Digite um número de telefone válido',
    format: 'Use o formato: (00) 00000-0000',
  },
  
  // Data
  date: {
    required: 'Selecione uma data',
    invalid: 'Data inválida. Use o formato DD/MM/AAAA',
    past: 'Selecione uma data futura',
    future: 'Selecione uma data passada',
    range: (min: string, max: string) => `Escolha uma data entre ${min} e ${max}`,
  },
  
  // Número
  number: {
    required: 'Informe um valor',
    invalid: 'Digite apenas números',
    min: (min: number) => `O valor mínimo é ${min}`,
    max: (max: number) => `O valor máximo é ${max}`,
    range: (min: number, max: number) => `Digite um valor entre ${min} e ${max}`,
  },
  
  // Texto genérico
  text: {
    tooShort: (min: number) => `Escreva pelo menos ${min} caracteres`,
    tooLong: (max: number) => `O texto não pode ter mais de ${max} caracteres`,
    required: 'Este campo não pode ficar vazio',
  },
  
  // Seleção
  select: {
    required: 'Selecione uma opção',
    invalid: 'Opção inválida. Escolha uma das opções disponíveis',
  },
  
  // Arquivo
  file: {
    required: 'Selecione um arquivo para enviar',
    tooLarge: (maxSize: string) => `O arquivo é muito grande. O tamanho máximo é ${maxSize}`,
    invalidType: (allowedTypes: string) => `Tipo de arquivo não permitido. Use ${allowedTypes}`,
    tooMany: (max: number) => `Você pode enviar no máximo ${max} arquivo${max > 1 ? 's' : ''}`,
  },
} as const;

// =====================================================
// MENSAGENS DE AUTENTICAÇÃO
// =====================================================
export const authMessages: Record<string, ErrorMessageConfig> = {
  // Login
  invalidCredentials: {
    message: 'E-mail ou senha incorretos',
    suggestion: 'Verifique seus dados e tente novamente',
    action: {
      label: 'Esqueci minha senha',
      href: '/forgot-password',
    },
  },
  
  sessionExpired: {
    message: 'Sua sessão expirou',
    suggestion: 'Faça login novamente para continuar',
    action: {
      label: 'Fazer login',
      href: '/login',
    },
  },
  
  emailNotConfirmed: {
    message: 'Confirme seu e-mail para acessar',
    suggestion: 'Verifique sua caixa de entrada e spam',
    action: {
      label: 'Reenviar e-mail de confirmação',
    },
  },
  
  signupDisabled: {
    message: 'O cadastro de novos usuários está temporariamente desabilitado',
    suggestion: 'Entre em contato com o administrador do sistema',
    action: {
      label: 'Contatar suporte',
      href: 'mailto:suporte@empresa.com',
    },
  },
  
  accountLocked: {
    message: 'Sua conta foi temporariamente bloqueada',
    suggestion: 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente',
    action: {
      label: 'Recuperar conta',
      href: '/forgot-password',
    },
  },
  
  accountDeactivated: {
    message: 'Sua conta está desativada',
    suggestion: 'Entre em contato com o RH para reativar seu acesso',
  },
  
  // Cadastro
  emailAlreadyRegistered: {
    message: 'Este e-mail já está cadastrado',
    suggestion: 'Tente fazer login ou recuperar sua senha',
    action: {
      label: 'Ir para login',
      href: '/login',
    },
  },
  
  weakPassword: {
    message: 'Escolha uma senha mais forte',
    suggestion: 'Use pelo menos 8 caracteres com letras, números e símbolos',
  },
};

// =====================================================
// MENSAGENS DE REDE
// =====================================================
export const networkMessages: Record<string, ErrorMessageConfig> = {
  offline: {
    message: 'Você está sem conexão com a internet',
    suggestion: 'Verifique sua conexão e tente novamente',
    action: {
      label: 'Tentar novamente',
    },
  },
  
  timeout: {
    message: 'A conexão está demorando muito',
    suggestion: 'Verifique sua internet ou tente novamente em alguns minutos',
    action: {
      label: 'Tentar novamente',
    },
  },
  
  serverError: {
    message: 'Nosso servidor está com problemas',
    suggestion: 'Nossa equipe foi notificada. Tente novamente em alguns minutos',
    action: {
      label: 'Tentar novamente',
    },
  },
  
  serviceUnavailable: {
    message: 'O serviço está temporariamente indisponível',
    suggestion: 'Estamos trabalhando para resolver. Tente novamente em breve',
  },
};

// =====================================================
// MENSAGENS DE PERMISSÃO
// =====================================================
export const permissionMessages: Record<string, ErrorMessageConfig> = {
  unauthorized: {
    message: 'Você não tem permissão para acessar este recurso',
    suggestion: 'Se precisar de acesso, fale com seu gestor',
    action: {
      label: 'Voltar',
    },
  },
  
  forbidden: {
    message: 'Esta ação não é permitida para o seu perfil',
    suggestion: 'Apenas administradores podem realizar esta operação',
  },
  
  roleRequired: (role: string) => ({
    message: `Acesso restrito a ${role}`,
    suggestion: 'Entre em contato com o RH se precisar de acesso',
  }),
};

// =====================================================
// MENSAGENS DE RECURSOS
// =====================================================
export const resourceMessages: Record<string, ErrorMessageConfig> = {
  notFound: {
    message: 'Ops! Não encontramos o que você procura',
    suggestion: 'O item pode ter sido removido ou o link está incorreto',
    action: {
      label: 'Voltar ao início',
      href: '/dashboard',
    },
  },
  
  deleted: {
    message: 'Este item foi excluído',
    suggestion: 'Você pode criar um novo ou voltar ao início',
  },
  
  conflict: {
    message: 'Outro usuário já fez alterações neste item',
    suggestion: 'Recarregue a página para ver as alterações mais recentes',
    action: {
      label: 'Recarregar página',
    },
  },
  
  duplicate: {
    message: 'Este item já existe',
    suggestion: 'Verifique os dados ou edite o item existente',
  },
};

// =====================================================
// MENSAGENS DE UPLOAD
// =====================================================
export const uploadMessages: Record<string, ErrorMessageConfig> = {
  fileTooLarge: {
    message: 'O arquivo é muito grande',
    suggestion: 'Reduza o tamanho do arquivo ou escolha outro',
  },
  
  invalidFileType: {
    message: 'Tipo de arquivo não permitido',
    suggestion: 'Use arquivos nos formatos: JPG, PNG, PDF ou DOCX',
  },
  
  uploadFailed: {
    message: 'Não foi possível enviar o arquivo',
    suggestion: 'Verifique sua conexão e tente novamente',
    action: {
      label: 'Tentar novamente',
    },
  },
  
  processingFailed: {
    message: 'Erro ao processar o arquivo',
    suggestion: 'O arquivo pode estar corrompido. Tente outro arquivo',
  },
  
  quotaExceeded: {
    message: 'Limite de armazenamento atingido',
    suggestion: 'Exclua alguns arquivos para liberar espaço',
  },
};

// =====================================================
// MENSAGENS DE AÇÕES ESPECÍFICAS DO SISTEMA
// =====================================================
export const actionMessages = {
  // PDI
  pdi: {
    createError: {
      message: 'Não foi possível criar o PDI',
      suggestion: 'Verifique os dados e tente novamente',
    },
    updateError: {
      message: 'Não foi possível atualizar o PDI',
      suggestion: 'Suas alterações não foram salvas. Tente novamente',
    },
    deleteError: {
      message: 'Não foi possível excluir o PDI',
      suggestion: 'Tente novamente ou contate o suporte',
    },
  },
  
  // Competências
  competency: {
    addError: {
      message: 'Não foi possível adicionar a competência',
      suggestion: 'Verifique se a competência já não foi adicionada',
    },
    removeError: {
      message: 'Não foi possível remover a competência',
      suggestion: 'Tente novamente em alguns instantes',
    },
  },
  
  // Mentoria
  mentorship: {
    requestError: {
      message: 'Não foi possível enviar a solicitação de mentoria',
      suggestion: 'Verifique se o mentor está disponível e tente novamente',
    },
    cancelError: {
      message: 'Não foi possível cancelar a sessão',
      suggestion: 'A sessão pode já ter sido realizada',
    },
  },
  
  // Bem-estar
  wellness: {
    checkInError: {
      message: 'Não foi possível registrar seu check-in',
      suggestion: 'Tente novamente em alguns minutos',
    },
  },
  
  // Notificações
  notification: {
    markReadError: {
      message: 'Não foi possível marcar a notificação como lida',
      suggestion: 'Não se preocupe, tente novamente depois',
    },
  },
} as const;

// =====================================================
// UTILITÁRIOS
// =====================================================

/**
 * Mapeia códigos de erro do Supabase para mensagens amigáveis
 */
export function getSupabaseErrorMessage(error: string): ErrorMessageConfig {
  // Erros de autenticação
  if (error.includes('Invalid Refresh Token') || error.includes('refresh_token_not_found')) {
    return authMessages.sessionExpired;
  }
  
  if (error.includes('Invalid login credentials')) {
    return authMessages.invalidCredentials;
  }
  
  if (error.includes('User already registered')) {
    return authMessages.emailAlreadyRegistered;
  }
  
  if (error.includes('email_not_confirmed')) {
    return authMessages.emailNotConfirmed;
  }
  
  if (error.includes('signup_disabled')) {
    return authMessages.signupDisabled;
  }
  
  // Erros de permissão
  if (error.includes('permission') || error.includes('unauthorized') || error.includes('42501')) {
    return permissionMessages.unauthorized;
  }
  
  // Erros de conflito/duplicação
  if (error.includes('23505') || error.includes('duplicate')) {
    return resourceMessages.duplicate;
  }
  
  // Erros de rede
  if (error.includes('Failed to fetch') || error.includes('network') || error.includes('NetworkError')) {
    return networkMessages.offline;
  }
  
  if (error.includes('timeout')) {
    return networkMessages.timeout;
  }
  
  // Erros de banco de dados
  if (error.includes('connection') || error.includes('database')) {
    return networkMessages.serverError;
  }
  
  // Rate limiting
  if (error.includes('rate limit') || error.includes('too many requests')) {
    return {
      message: 'Muitas tentativas em pouco tempo',
      suggestion: 'Aguarde alguns minutos antes de tentar novamente',
    };
  }
  
  // Erro genérico
  return {
    message: 'Algo deu errado',
    suggestion: 'Nossa equipe foi notificada. Tente novamente em alguns instantes',
    action: {
      label: 'Tentar novamente',
    },
  };
}

/**
 * Retorna mensagem de validação formatada para um campo específico
 */
export function getFieldValidationMessage(
  field: string,
  type: 'required' | 'invalid' | 'tooShort' | 'tooLong' | 'custom',
  params?: { min?: number; max?: number; custom?: string }
): string {
  const fieldLabels: Record<string, string> = {
    email: 'seu e-mail',
    password: 'sua senha',
    name: 'seu nome',
    title: 'o título',
    description: 'a descrição',
    deadline: 'a data limite',
    phone: 'seu telefone',
    cpf: 'seu CPF',
    position: 'seu cargo',
    level: 'seu nível',
    date: 'a data',
    file: 'um arquivo',
  };
  
  const label = fieldLabels[field] || field;
  
  switch (type) {
    case 'required':
      return validationMessages.required(label);
    case 'tooShort':
      return validationMessages.text.tooShort(params?.min || 1);
    case 'tooLong':
      return validationMessages.text.tooLong(params?.max || 1000);
    case 'custom':
      return params?.custom || 'Valor inválido';
    default:
      return 'Verifique este campo';
  }
}

/**
 * Gera mensagem de confirmação para ação destrutiva
 */
export function getDestructiveActionMessage(
  action: 'delete' | 'cancel' | 'remove' | 'reset',
  itemType: string,
  itemName?: string
): { title: string; description: string; confirmText: string; cancelText: string } {
  const actionLabels = {
    delete: { verb: 'Excluir', gerund: 'excluído' },
    cancel: { verb: 'Cancelar', gerund: 'cancelado' },
    remove: { verb: 'Remover', gerund: 'removido' },
    reset: { verb: 'Resetar', gerund: 'resetado' },
  };
  
  const { verb, gerund } = actionLabels[action];
  const name = itemName ? ` "${itemName}"` : '';
  
  return {
    title: `${verb} ${itemType}${name}?`,
    description: `Esta ação não pode ser desfeita. O ${itemType.toLowerCase()} será ${gerund} permanentemente.`,
    confirmText: `Sim, ${verb.toLowerCase()} ${itemType.toLowerCase()}`,
    cancelText: 'Cancelar',
  };
}

// =====================================================
// MENSAGENS DE LOADING CONTEXTUAL
// =====================================================
export const loadingMessages = {
  // Autenticação
  'auth.signIn': 'Entrando...',
  'auth.signUp': 'Criando sua conta...',
  'auth.signOut': 'Saindo...',
  'auth.resetPassword': 'Enviando e-mail de recuperação...',
  
  // PDI
  'pdi.loading': 'Carregando PDIs...',
  'pdi.creating': 'Criando PDI...',
  'pdi.saving': 'Salvando alterações...',
  'pdi.deleting': 'Excluindo PDI...',
  
  // Competências
  'competencies.loading': 'Carregando competências...',
  'competencies.adding': 'Adicionando competência...',
  'competencies.removing': 'Removendo competência...',
  
  // Mentoria
  'mentorship.loading': 'Carregando sessões...',
  'mentorship.scheduling': 'Agendando sessão...',
  'mentorship.canceling': 'Cancelando sessão...',
  
  // Bem-estar
  'wellness.loading': 'Carregando recursos...',
  'wellness.checkIn': 'Registrando check-in...',
  
  // Usuários
  'users.loading': 'Carregando usuários...',
  'users.saving': 'Salvando usuário...',
  
  // Notificações
  'notifications.loading': 'Carregando notificações...',
  'notifications.marking': 'Marcando como lida...',
  
  // Upload
  'upload.processing': 'Processando arquivo...',
  'upload.uploading': 'Enviando arquivo...',
  
  // Relatórios
  'reports.generating': 'Gerando relatório...',
  'reports.exporting': 'Exportando dados...',
  
  // Genérico
  'generic.loading': 'Carregando...',
  'generic.saving': 'Salvando...',
  'generic.processing': 'Processando...',
} as const;

export type LoadingMessageKey = keyof typeof loadingMessages;

export function getLoadingMessage(key: LoadingMessageKey): string {
  return loadingMessages[key] || loadingMessages['generic.loading'];
}
