import { logger } from "../../utils/logger";
import * as Sentry from "@sentry/node";
import { WASocket } from "baileys";
import Whatsapp from "../../models/Whatsapp";

type Session = WASocket & {
  id?: number;
  store?: any;
};

export interface CryptoError {
  type: 'Bad MAC' | 'PreKeyError' | 'SessionError' | 'DecryptError';
  message: string;
  sessionId: number;
  timestamp: Date;
  context?: any;
}

export class SessionManager {
  private static instance: SessionManager;
  private corruptedSessions: Set<number> = new Set();
  private sessionHealth: Map<number, { lastError: Date; errorCount: number }> = new Map();

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Detecta e trata erros de criptografia
   */
  async handleCryptoError(error: any, wbot: Session, context?: any): Promise<boolean> {
    const errorMessage = error.message || error.toString();
    const sessionId = wbot.id;

    // Log detalhado do erro
    this.logCryptoError(error, { sessionId, context });

    // Verifica se é um erro de criptografia conhecido
    if (this.isCryptoError(errorMessage)) {
      this.corruptedSessions.add(sessionId);
      this.updateSessionHealth(sessionId, true);

      // Tenta regenerar as chaves de sessão
      try {
        await this.regenerateSessionKeys(wbot);
        logger.info(`Chaves de sessão regeneradas para sessão ${sessionId}`);
        return true;
      } catch (regenerateError) {
        logger.error(`Falha ao regenerar chaves para sessão ${sessionId}:`, regenerateError);
        
        // Se falhar, marca a sessão como corrompida
        await this.markSessionAsCorrupted(wbot);
        return false;
      }
    }

    return false;
  }

  /**
   * Verifica se o erro é relacionado à criptografia
   */
  private isCryptoError(errorMessage: string): boolean {
    const cryptoErrorPatterns = [
      'Bad MAC',
      'PreKeyError',
      'SessionError',
      'Failed to decrypt',
      'Invalid PreKey ID',
      'Over 2000 messages into the future',
      'CIPHERTEXT',
      'libsignal'
    ];

    return cryptoErrorPatterns.some(pattern => 
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Regenera as chaves de sessão
   */
  async regenerateSessionKeys(wbot: Session): Promise<void> {
    try {
      // Limpa o estado atual da sessão
      if (wbot.store) {
        await wbot.store.clear();
      }

      // Força uma nova autenticação
      if (wbot.authState) {
        // Limpa as credenciais
        wbot.authState.creds = {} as any;
        wbot.authState.keys = {} as any;
      }

      // Remove da lista de sessões corrompidas
      this.corruptedSessions.delete(wbot.id);
      
      logger.info(`Sessão ${wbot.id} regenerada com sucesso`);
    } catch (error) {
      logger.error(`Erro ao regenerar chaves da sessão ${wbot.id}:`, error);
      throw error;
    }
  }

  /**
   * Marca uma sessão como corrompida
   */
  async markSessionAsCorrupted(wbot: Session): Promise<void> {
    try {
      this.corruptedSessions.add(wbot.id);
      
      // Desconecta a sessão
      if (wbot.logout) {
        await wbot.logout();
      }

      // Atualiza o status no banco de dados
      if (wbot.id) {
        await Whatsapp.update(
          { status: 'DISCONNECTED' },
          { where: { id: wbot.id } }
        );
      }

      logger.warn(`Sessão ${wbot.id} marcada como corrompida e desconectada`);
    } catch (error) {
      logger.error(`Erro ao marcar sessão ${wbot.id} como corrompida:`, error);
    }
  }

  /**
   * Limpa sessões corrompidas periodicamente
   */
  async cleanupCorruptedSessions(): Promise<void> {
    try {
      const corruptedSessions = Array.from(this.corruptedSessions);
      
      for (const sessionId of corruptedSessions) {
        try {
          const whatsapp = await Whatsapp.findByPk(sessionId);
          if (whatsapp) {
            // Atualiza o status no banco de dados
            await Whatsapp.update(
              { status: 'DISCONNECTED' },
              { where: { id: sessionId } }
            );
            this.corruptedSessions.delete(sessionId);
            logger.info(`Sessão corrompida ${sessionId} limpa com sucesso`);
          }
        } catch (error) {
          logger.error(`Erro ao limpar sessão corrompida ${sessionId}:`, error);
        }
      }
    } catch (error) {
      logger.error('Erro durante limpeza de sessões corrompidas:', error);
    }
  }

  /**
   * Atualiza a saúde da sessão
   */
  private updateSessionHealth(sessionId: number, hasError: boolean): void {
    const current = this.sessionHealth.get(sessionId) || { lastError: new Date(), errorCount: 0 };
    
    if (hasError) {
      current.lastError = new Date();
      current.errorCount++;
    } else {
      // Reset contador de erros se não há erro
      current.errorCount = Math.max(0, current.errorCount - 1);
    }

    this.sessionHealth.set(sessionId, current);
  }

  /**
   * Verifica a saúde de uma sessão
   */
  getSessionHealth(sessionId: number): { isHealthy: boolean; errorCount: number; lastError?: Date } {
    const health = this.sessionHealth.get(sessionId);
    
    if (!health) {
      return { isHealthy: true, errorCount: 0 };
    }

    const isHealthy = health.errorCount < 5 && 
      (Date.now() - health.lastError.getTime()) > 300000; // 5 minutos

    return {
      isHealthy,
      errorCount: health.errorCount,
      lastError: health.lastError
    };
  }

  /**
   * Log detalhado de erros de criptografia
   */
  private logCryptoError(error: any, context: any): void {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      sessionId: context.sessionId,
      timestamp: new Date().toISOString(),
      context: context.context || {}
    };

    logger.error('Erro de criptografia WhatsApp:', errorInfo);

    // Envia para Sentry com tags específicas
    Sentry.captureException(error, {
      tags: { 
        type: 'whatsapp_crypto_error',
        sessionId: context.sessionId
      },
      extra: errorInfo
    });
  }

  /**
   * Retry com backoff exponencial para operações de criptografia
   */
  async retryCryptoOperation<T>(
    operation: () => Promise<T>, 
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (this.isCryptoError(error.message)) {
          if (attempt === maxRetries - 1) {
            throw error;
          }

          // Aguarda com backoff exponencial
          const delay = baseDelay * Math.pow(2, attempt);
          logger.warn(`Tentativa ${attempt + 1} falhou, aguardando ${delay}ms antes de tentar novamente`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Inicia o monitoramento periódico de saúde das sessões
   */
  startHealthMonitoring(): void {
    // Limpeza de sessões corrompidas a cada 5 minutos
    setInterval(async () => {
      await this.cleanupCorruptedSessions();
    }, 5 * 60 * 1000);

    // Verificação de saúde a cada 2 minutos
    setInterval(() => {
      this.logSessionHealth();
    }, 2 * 60 * 1000);

    logger.info('Monitoramento de saúde das sessões iniciado');
  }

  /**
   * Log do status de saúde das sessões
   */
  private logSessionHealth(): void {
    const unhealthySessions = [];
    
    for (const [sessionId, health] of this.sessionHealth.entries()) {
      if (!this.getSessionHealth(sessionId).isHealthy) {
        unhealthySessions.push({
          sessionId,
          errorCount: health.errorCount,
          lastError: health.lastError
        });
      }
    }

    if (unhealthySessions.length > 0) {
      logger.warn('Sessões com problemas de saúde:', unhealthySessions);
    } else {
      logger.info('Todas as sessões estão saudáveis');
    }
  }

  /**
   * Obtém estatísticas das sessões
   */
  getSessionStats(): {
    totalSessions: number;
    corruptedSessions: number;
    healthySessions: number;
    unhealthySessions: number;
  } {
    const totalSessions = this.sessionHealth.size;
    const corruptedSessions = this.corruptedSessions.size;
    const healthySessions = Array.from(this.sessionHealth.keys())
      .filter(sessionId => this.getSessionHealth(sessionId).isHealthy).length;
    const unhealthySessions = totalSessions - healthySessions;

    return {
      totalSessions,
      corruptedSessions,
      healthySessions,
      unhealthySessions
    };
  }
}

export default SessionManager;
