/**
 * Configuração de otimização do WhatsApp Web
 * Centraliza todas as configurações de performance e reconexão
 */

export interface WhatsAppOptimizationConfig {
  // Configurações de reconexão
  reconnection: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    circuitBreakerThreshold: number;
    circuitBreakerTimeout: number;
  };

  // Configurações de performance
  performance: {
    healthCheckInterval: number;
    memoryThreshold: number;
    cpuThreshold: number;
    errorRateThreshold: number;
    responseTimeThreshold: number;
    reconnectCountThreshold: number;
  };

  // Configurações do Baileys
  baileys: {
    keepAliveIntervalMs: number;
    defaultQueryTimeoutMs: number;
    retryRequestDelayMs: number;
    maxMsgRetryCount: number;
    connectTimeoutMs: number;
    readTimeoutMs: number;
    writeTimeoutMs: number;
    generateHighQualityLinkPreview: boolean;
    markOnlineOnConnect: boolean;
    syncFullHistory: boolean;
  };

  // Configurações de cache
  cache: {
    messageCache: {
      ttl: number;
      maxSize: number;
    };
    contactCache: {
      ttl: number;
      maxSize: number;
    };
    sessionCache: {
      ttl: number;
      maxSize: number;
    };
    msgRetryCounterCache: {
      ttl: number;
      maxKeys: number;
    };
  };

  // Configurações de sistema
  system: {
    maxListeners: number;
    uvThreadpoolSize: number;
    nodeOptions: string;
    gcInterval: number;
  };

  // Configurações de monitoramento
  monitoring: {
    enabled: boolean;
    logLevel: string;
    alertWebhook?: string;
    metricsRetention: number;
  };
}

export const defaultConfig: WhatsAppOptimizationConfig = {
  reconnection: {
    maxRetries: 10,
    baseDelay: 2000, // 2 segundos
    maxDelay: 300000, // 5 minutos
    backoffMultiplier: 1.5,
    circuitBreakerThreshold: 5, // 5 falhas consecutivas
    circuitBreakerTimeout: 600000 // 10 minutos
  },

  performance: {
    healthCheckInterval: 30000, // 30 segundos
    memoryThreshold: 0.8, // 80%
    cpuThreshold: 0.9, // 90%
    errorRateThreshold: 0.1, // 10%
    responseTimeThreshold: 5000, // 5 segundos
    reconnectCountThreshold: 5 // 5 reconexões por hora
  },

  baileys: {
    keepAliveIntervalMs: 30000, // 30 segundos
    defaultQueryTimeoutMs: 30000, // 30 segundos
    retryRequestDelayMs: 1000, // 1 segundo
    maxMsgRetryCount: 3, // Máximo 3 tentativas por mensagem
    connectTimeoutMs: 30000, // 30 segundos
    readTimeoutMs: 60000, // 1 minuto
    writeTimeoutMs: 30000, // 30 segundos
    generateHighQualityLinkPreview: false, // Desabilitado para melhor performance
    markOnlineOnConnect: true, // Marcar como online ao conectar
    syncFullHistory: false // Não sincronizar histórico completo
  },

  cache: {
    messageCache: {
      ttl: 3600000, // 1 hora
      maxSize: 1000 // Máximo 1000 mensagens
    },
    contactCache: {
      ttl: 1800000, // 30 minutos
      maxSize: 5000 // Máximo 5000 contatos
    },
    sessionCache: {
      ttl: 7200000, // 2 horas
      maxSize: 100 // Máximo 100 sessões
    },
    msgRetryCounterCache: {
      ttl: 300000, // 5 minutos
      maxKeys: 10000 // Máximo 10k chaves em cache
    }
  },

  system: {
    maxListeners: 50,
    uvThreadpoolSize: 32,
    nodeOptions: '--max-old-space-size=28672 --max-semi-space-size=512 --optimize-for-size',
    gcInterval: 300000 // 5 minutos
  },

  monitoring: {
    enabled: true,
    logLevel: 'info',
    metricsRetention: 86400000 // 24 horas
  }
};

/**
 * Configuração para ambiente de produção
 */
export const productionConfig: Partial<WhatsAppOptimizationConfig> = {
  reconnection: {
    maxRetries: 15,
    baseDelay: 5000, // 5 segundos
    maxDelay: 600000, // 10 minutos
    backoffMultiplier: 2.0,
    circuitBreakerThreshold: 3, // 3 falhas consecutivas
    circuitBreakerTimeout: 900000 // 15 minutos
  },

  performance: {
    healthCheckInterval: 60000, // 1 minuto
    memoryThreshold: 0.85, // 85%
    cpuThreshold: 0.95, // 95%
    errorRateThreshold: 0.05, // 5%
    responseTimeThreshold: 3000, // 3 segundos
    reconnectCountThreshold: 3 // 3 reconexões por hora
  },

  baileys: {
    keepAliveIntervalMs: 60000, // 1 minuto
    defaultQueryTimeoutMs: 45000, // 45 segundos
    retryRequestDelayMs: 2000, // 2 segundos
    maxMsgRetryCount: 5, // Máximo 5 tentativas por mensagem
    connectTimeoutMs: 45000, // 45 segundos
    readTimeoutMs: 90000, // 1.5 minutos
    writeTimeoutMs: 45000, // 45 segundos
    generateHighQualityLinkPreview: false, // Desabilitado para melhor performance
    markOnlineOnConnect: true, // Marcar como online ao conectar
    syncFullHistory: false // Não sincronizar histórico completo
  },

  system: {
    maxListeners: 100,
    uvThreadpoolSize: 64,
    nodeOptions: '--max-old-space-size=32768 --max-semi-space-size=1024 --optimize-for-size --gc-interval=100',
    gcInterval: 180000 // 3 minutos
  }
};

/**
 * Configuração para ambiente de desenvolvimento
 */
export const developmentConfig: Partial<WhatsAppOptimizationConfig> = {
  reconnection: {
    maxRetries: 5,
    baseDelay: 1000, // 1 segundo
    maxDelay: 60000, // 1 minuto
    backoffMultiplier: 1.2,
    circuitBreakerThreshold: 10, // 10 falhas consecutivas
    circuitBreakerTimeout: 300000 // 5 minutos
  },

  performance: {
    healthCheckInterval: 10000, // 10 segundos
    memoryThreshold: 0.9, // 90%
    cpuThreshold: 0.95, // 95%
    errorRateThreshold: 0.2, // 20%
    responseTimeThreshold: 10000, // 10 segundos
    reconnectCountThreshold: 10 // 10 reconexões por hora
  },

  baileys: {
    keepAliveIntervalMs: 15000, // 15 segundos
    defaultQueryTimeoutMs: 15000, // 15 segundos
    retryRequestDelayMs: 500, // 500ms
    maxMsgRetryCount: 2, // Máximo 2 tentativas por mensagem
    connectTimeoutMs: 15000, // 15 segundos
    readTimeoutMs: 30000, // 30 segundos
    writeTimeoutMs: 15000, // 15 segundos
    generateHighQualityLinkPreview: false, // Desabilitado para melhor performance
    markOnlineOnConnect: true, // Marcar como online ao conectar
    syncFullHistory: false // Não sincronizar histórico completo
  },

  system: {
    maxListeners: 20,
    uvThreadpoolSize: 16,
    nodeOptions: '--max-old-space-size=8192 --max-semi-space-size=256',
    gcInterval: 600000 // 10 minutos
  },

  monitoring: {
    enabled: true,
    logLevel: 'debug',
    metricsRetention: 3600000 // 1 hora
  }
};

/**
 * Obtém configuração baseada no ambiente
 */
export function getConfigForEnvironment(env: string = process.env.NODE_ENV || 'development'): WhatsAppOptimizationConfig {
  const baseConfig = { ...defaultConfig };
  
  switch (env) {
    case 'production':
      return { ...baseConfig, ...productionConfig };
    case 'development':
      return { ...baseConfig, ...developmentConfig };
    default:
      return baseConfig;
  }
}

/**
 * Valida configuração
 */
export function validateConfig(config: WhatsAppOptimizationConfig): string[] {
  const errors: string[] = [];

  // Validar configurações de reconexão
  if (config.reconnection.maxRetries < 1) {
    errors.push('maxRetries deve ser maior que 0');
  }
  if (config.reconnection.baseDelay < 1000) {
    errors.push('baseDelay deve ser pelo menos 1000ms');
  }
  if (config.reconnection.maxDelay < config.reconnection.baseDelay) {
    errors.push('maxDelay deve ser maior que baseDelay');
  }

  // Validar configurações de performance
  if (config.performance.memoryThreshold < 0 || config.performance.memoryThreshold > 1) {
    errors.push('memoryThreshold deve estar entre 0 e 1');
  }
  if (config.performance.cpuThreshold < 0 || config.performance.cpuThreshold > 1) {
    errors.push('cpuThreshold deve estar entre 0 e 1');
  }

  // Validar configurações do Baileys
  if (config.baileys.keepAliveIntervalMs < 10000) {
    errors.push('keepAliveIntervalMs deve ser pelo menos 10000ms');
  }
  if (config.baileys.maxMsgRetryCount < 1) {
    errors.push('maxMsgRetryCount deve ser maior que 0');
  }

  return errors;
}

export default defaultConfig;
