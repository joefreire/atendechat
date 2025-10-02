import { logger } from "../../utils/logger";
import { Browsers, ConnectionState } from "baileys";

interface BaileysOptimizationConfig {
  // Configurações de conexão
  keepAliveIntervalMs: number;
  defaultQueryTimeoutMs: number;
  retryRequestDelayMs: number;
  maxMsgRetryCount: number;
  
  // Configurações de memória
  msgRetryCounterCache: {
    ttl: number;
    maxKeys: number;
  };
  
  // Configurações de rede
  connectTimeoutMs: number;
  readTimeoutMs: number;
  writeTimeoutMs: number;
  
  // Configurações de reconexão
  reconnectDelayMs: number;
  maxReconnectAttempts: number;
  
  // Configurações de performance
  generateHighQualityLinkPreview: boolean;
  markOnlineOnConnect: boolean;
  syncFullHistory: boolean;
  
  // Configurações de browser
  browser: [string, string, string];
}

class BaileysOptimizationService {
  private static instance: BaileysOptimizationService;
  private config: BaileysOptimizationConfig;

  private constructor() {
    this.config = this.getOptimizedConfig();
  }

  public static getInstance(): BaileysOptimizationService {
    if (!BaileysOptimizationService.instance) {
      BaileysOptimizationService.instance = new BaileysOptimizationService();
    }
    return BaileysOptimizationService.instance;
  }

  /**
   * Obtém configuração otimizada para o Baileys
   */
  private getOptimizedConfig(): BaileysOptimizationConfig {
    return {
      // Configurações de conexão otimizadas
      keepAliveIntervalMs: 30000, // 30 segundos (reduzido de 3 minutos)
      defaultQueryTimeoutMs: 30000, // 30 segundos
      retryRequestDelayMs: 1000, // 1 segundo (reduzido de 250ms)
      maxMsgRetryCount: 3, // Máximo 3 tentativas por mensagem
      
      // Configurações de cache otimizadas
      msgRetryCounterCache: {
        ttl: 300000, // 5 minutos
        maxKeys: 10000 // Máximo 10k chaves em cache
      },
      
      // Configurações de rede otimizadas
      connectTimeoutMs: 30000, // 30 segundos
      readTimeoutMs: 60000, // 1 minuto
      writeTimeoutMs: 30000, // 30 segundos
      
      // Configurações de reconexão
      reconnectDelayMs: 5000, // 5 segundos
      maxReconnectAttempts: 5, // Máximo 5 tentativas
      
      // Configurações de performance
      generateHighQualityLinkPreview: false, // Desabilitado para melhor performance
      markOnlineOnConnect: true, // Marcar como online ao conectar
      syncFullHistory: false, // Não sincronizar histórico completo
      
      // Browser otimizado
      browser: Browsers.appropriate("Desktop")
    };
  }

  /**
   * Obtém configuração otimizada para makeWASocket
   */
  public getSocketConfig(): any {
    return {
      // Configurações básicas
      printQRInTerminal: false,
      browser: this.config.browser,
      
      // Configurações de timeout
      defaultQueryTimeoutMs: this.config.defaultQueryTimeoutMs,
      retryRequestDelayMs: this.config.retryRequestDelayMs,
      
      // Configurações de keep-alive
      keepAliveIntervalMs: this.config.keepAliveIntervalMs,
      
      // Configurações de performance
      generateHighQualityLinkPreview: this.config.generateHighQualityLinkPreview,
      markOnlineOnConnect: this.config.markOnlineOnConnect,
      syncFullHistory: this.config.syncFullHistory,
      
      // Configurações de reconexão
      connectTimeoutMs: this.config.connectTimeoutMs,
      readTimeoutMs: this.config.readTimeoutMs,
      writeTimeoutMs: this.config.writeTimeoutMs,
      
      // Configurações de retry
      maxMsgRetryCount: this.config.maxMsgRetryCount,
      
      // Configurações de cache
      msgRetryCounterCache: {
        ttl: this.config.msgRetryCounterCache.ttl,
        maxKeys: this.config.msgRetryCounterCache.maxKeys
      }
    };
  }

  /**
   * Obtém configuração otimizada para eventos de conexão
   */
  public getConnectionEventConfig(): any {
    return {
      // Configurações de reconexão automática
      reconnectDelayMs: this.config.reconnectDelayMs,
      maxReconnectAttempts: this.config.maxReconnectAttempts,
      
      // Configurações de detecção de desconexão
      connectionStateTimeout: 60000, // 1 minuto
      
      // Configurações de heartbeat
      heartbeatInterval: 30000, // 30 segundos
      heartbeatTimeout: 60000 // 1 minuto
    };
  }

  /**
   * Obtém configuração otimizada para cache
   */
  public getCacheConfig(): any {
    return {
      // Configurações de cache de mensagens
      messageCache: {
        ttl: 3600000, // 1 hora
        maxSize: 1000 // Máximo 1000 mensagens
      },
      
      // Configurações de cache de contatos
      contactCache: {
        ttl: 1800000, // 30 minutos
        maxSize: 5000 // Máximo 5000 contatos
      },
      
      // Configurações de cache de sessão
      sessionCache: {
        ttl: 7200000, // 2 horas
        maxSize: 100 // Máximo 100 sessões
      }
    };
  }

  /**
   * Obtém configuração otimizada para logging
   */
  public getLoggingConfig(): any {
    return {
      level: "error", // Apenas erros para reduzir overhead
      prettyPrint: false, // Desabilitado em produção
      timestamp: true,
      redact: {
        paths: ['auth.creds', 'auth.keys'], // Reduzir informações sensíveis
        censor: '[REDACTED]'
      }
    };
  }

  /**
   * Obtém configuração otimizada para WebSocket
   */
  public getWebSocketConfig(): any {
    return {
      // Configurações de buffer
      bufferSize: 1024 * 1024, // 1MB
      
      // Configurações de compressão
      compression: true,
      compressionThreshold: 1024, // 1KB
      
      // Configurações de ping/pong
      pingInterval: 30000, // 30 segundos
      pongTimeout: 10000, // 10 segundos
      
      // Configurações de reconexão
      reconnectInterval: 5000, // 5 segundos
      maxReconnectAttempts: 5
    };
  }

  /**
   * Aplica otimizações de memória
   */
  public applyMemoryOptimizations(): void {
    // Configurar garbage collection mais agressivo
    if (global.gc) {
      setInterval(() => {
        global.gc();
      }, 300000); // GC a cada 5 minutos
    }

    // Configurar limites de memória
    process.setMaxListeners(20); // Limitar listeners
  }

  /**
   * Aplica otimizações de rede
   */
  public applyNetworkOptimizations(): void {
    // Configurar keep-alive do sistema
    process.env.UV_THREADPOOL_SIZE = '32';
    
    // Configurar timeouts do sistema
    process.env.NODE_OPTIONS = '--max-old-space-size=28672 --max-semi-space-size=512';
  }

  /**
   * Obtém configuração completa otimizada
   */
  public getCompleteConfig(): any {
    return {
      socket: this.getSocketConfig(),
      connection: this.getConnectionEventConfig(),
      cache: this.getCacheConfig(),
      logging: this.getLoggingConfig(),
      websocket: this.getWebSocketConfig()
    };
  }

  /**
   * Atualiza configuração dinamicamente
   */
  public updateConfig(newConfig: Partial<BaileysOptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info(`🔧 Baileys configuration updated`);
  }

  /**
   * Obtém configuração atual
   */
  public getCurrentConfig(): BaileysOptimizationConfig {
    return { ...this.config };
  }

  /**
   * Reseta configuração para padrão
   */
  public resetConfig(): void {
    this.config = this.getOptimizedConfig();
    logger.info(`🔄 Baileys configuration reset to default`);
  }
}

export default BaileysOptimizationService;
