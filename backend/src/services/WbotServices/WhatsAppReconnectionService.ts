import { logger } from "../../utils/logger";
import { getIO } from "../../libs/socket";
import Whatsapp from "../../models/Whatsapp";
import { StartWhatsAppSession } from "./StartWhatsAppSession";
import { removeWbot } from "../../libs/wbot";
import { Op } from "sequelize";

interface ReconnectionConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
}

interface SessionHealth {
  whatsappId: number;
  lastSeen: Date;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting' | 'failed';
  retryCount: number;
  consecutiveFailures: number;
  circuitBreakerOpen: boolean;
  circuitBreakerOpenedAt?: Date;
}

class WhatsAppReconnectionService {
  private static instance: WhatsAppReconnectionService;
  private sessionHealth: Map<number, SessionHealth> = new Map();
  private reconnectionTimers: Map<number, NodeJS.Timeout> = new Map();
  private healthCheckInterval: NodeJS.Timeout;
  
  private config: ReconnectionConfig = {
    maxRetries: 10,
    baseDelay: 2000, // 2 segundos
    maxDelay: 300000, // 5 minutos
    backoffMultiplier: 1.5,
    circuitBreakerThreshold: 5, // 5 falhas consecutivas
    circuitBreakerTimeout: 600000 // 10 minutos
  };

  private constructor() {
    this.startHealthCheck();
  }

  public static getInstance(): WhatsAppReconnectionService {
    if (!WhatsAppReconnectionService.instance) {
      WhatsAppReconnectionService.instance = new WhatsAppReconnectionService();
    }
    return WhatsAppReconnectionService.instance;
  }

  /**
   * Inicializa o monitoramento de uma sessão WhatsApp
   */
  public initializeSession(whatsappId: number): void {
    this.sessionHealth.set(whatsappId, {
      whatsappId,
      lastSeen: new Date(),
      connectionStatus: 'connected',
      retryCount: 0,
      consecutiveFailures: 0,
      circuitBreakerOpen: false
    });
    
    logger.info(`🔗 Session ${whatsappId} initialized for monitoring`);
  }

  /**
   * Marca uma sessão como conectada
   */
  public markSessionConnected(whatsappId: number): void {
    const health = this.sessionHealth.get(whatsappId);
    if (health) {
      health.connectionStatus = 'connected';
      health.lastSeen = new Date();
      health.consecutiveFailures = 0;
      health.retryCount = 0;
      health.circuitBreakerOpen = false;
      health.circuitBreakerOpenedAt = undefined;
      
      // Limpar timer de reconexão se existir
      this.clearReconnectionTimer(whatsappId);
      
      logger.info(`✅ Session ${whatsappId} marked as connected`);
    }
  }

  /**
   * Marca uma sessão como desconectada e inicia reconexão
   */
  public async markSessionDisconnected(whatsappId: number, reason?: string): Promise<void> {
    const health = this.sessionHealth.get(whatsappId);
    if (!health) {
      logger.warn(`⚠️ Session ${whatsappId} not found in health monitoring`);
      return;
    }

    health.connectionStatus = 'disconnected';
    health.consecutiveFailures++;
    
    logger.warn(`❌ Session ${whatsappId} disconnected. Reason: ${reason || 'Unknown'}. Failures: ${health.consecutiveFailures}`);

    // Verificar circuit breaker
    if (this.isCircuitBreakerOpen(whatsappId)) {
      logger.error(`🚫 Circuit breaker open for session ${whatsappId}. Skipping reconnection.`);
      return;
    }

    // Iniciar reconexão com backoff exponencial
    this.scheduleReconnection(whatsappId);
  }

  /**
   * Verifica se o circuit breaker está aberto
   */
  private isCircuitBreakerOpen(whatsappId: number): boolean {
    const health = this.sessionHealth.get(whatsappId);
    if (!health) return false;

    if (health.circuitBreakerOpen) {
      const now = new Date();
      const timeSinceOpened = now.getTime() - (health.circuitBreakerOpenedAt?.getTime() || 0);
      
      if (timeSinceOpened > this.config.circuitBreakerTimeout) {
        // Resetar circuit breaker
        health.circuitBreakerOpen = false;
        health.circuitBreakerOpenedAt = undefined;
        health.consecutiveFailures = 0;
        logger.info(`🔄 Circuit breaker reset for session ${whatsappId}`);
        return false;
      }
      return true;
    }

    // Abrir circuit breaker se exceder o threshold
    if (health.consecutiveFailures >= this.config.circuitBreakerThreshold) {
      health.circuitBreakerOpen = true;
      health.circuitBreakerOpenedAt = new Date();
      logger.error(`🚫 Circuit breaker opened for session ${whatsappId} after ${health.consecutiveFailures} failures`);
      return true;
    }

    return false;
  }

  /**
   * Agenda reconexão com backoff exponencial
   */
  private scheduleReconnection(whatsappId: number): void {
    const health = this.sessionHealth.get(whatsappId);
    if (!health) return;

    if (health.retryCount >= this.config.maxRetries) {
      logger.error(`🛑 Max retries reached for session ${whatsappId}. Stopping reconnection attempts.`);
      health.connectionStatus = 'failed';
      return;
    }

    // Calcular delay com backoff exponencial
    const delay = Math.min(
      this.config.baseDelay * Math.pow(this.config.backoffMultiplier, health.retryCount),
      this.config.maxDelay
    );

    health.connectionStatus = 'reconnecting';
    health.retryCount++;

    logger.info(`🔄 Scheduling reconnection for session ${whatsappId} in ${delay}ms (attempt ${health.retryCount}/${this.config.maxRetries})`);

    const timer = setTimeout(async () => {
      await this.attemptReconnection(whatsappId);
    }, delay);

    this.reconnectionTimers.set(whatsappId, timer);
  }

  /**
   * Tenta reconectar uma sessão
   */
  private async attemptReconnection(whatsappId: number): Promise<void> {
    try {
      const whatsapp = await Whatsapp.findByPk(whatsappId);
      if (!whatsapp) {
        logger.error(`❌ WhatsApp session ${whatsappId} not found in database`);
        return;
      }

      // Remover sessão atual se existir
      await removeWbot(whatsappId, false);

      // Iniciar nova sessão
      await StartWhatsAppSession(whatsapp, whatsapp.companyId);
      
      logger.info(`🔄 Reconnection attempt completed for session ${whatsappId}`);

    } catch (error) {
      logger.error(`❌ Reconnection failed for session ${whatsappId}:`, error);
      
      // Marcar como desconectado novamente para tentar novamente
      await this.markSessionDisconnected(whatsappId, `Reconnection failed: ${error.message}`);
    }
  }

  /**
   * Limpa timer de reconexão
   */
  private clearReconnectionTimer(whatsappId: number): void {
    const timer = this.reconnectionTimers.get(whatsappId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectionTimers.delete(whatsappId);
    }
  }

  /**
   * Inicia verificação de saúde das sessões
   */
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 30000); // Verificar a cada 30 segundos

    logger.info(`🏥 Health check started for WhatsApp sessions`);
  }

  /**
   * Executa verificação de saúde
   */
  private async performHealthCheck(): Promise<void> {
    const now = new Date();
    const staleThreshold = 5 * 60 * 1000; // 5 minutos

    for (const [whatsappId, health] of this.sessionHealth.entries()) {
      const timeSinceLastSeen = now.getTime() - health.lastSeen.getTime();
      
      if (timeSinceLastSeen > staleThreshold && health.connectionStatus === 'connected') {
        logger.warn(`⚠️ Session ${whatsappId} appears stale (${Math.round(timeSinceLastSeen / 1000)}s since last seen)`);
        await this.markSessionDisconnected(whatsappId, 'Stale connection detected');
      }
    }
  }

  /**
   * Obtém status de todas as sessões
   */
  public getSessionStatus(): Map<number, SessionHealth> {
    return new Map(this.sessionHealth);
  }

  /**
   * Força reconexão de uma sessão específica
   */
  public async forceReconnection(whatsappId: number): Promise<void> {
    const health = this.sessionHealth.get(whatsappId);
    if (health) {
      health.retryCount = 0;
      health.consecutiveFailures = 0;
      health.circuitBreakerOpen = false;
      health.circuitBreakerOpenedAt = undefined;
    }

    this.clearReconnectionTimer(whatsappId);
    await this.markSessionDisconnected(whatsappId, 'Force reconnection requested');
  }

  /**
   * Para o serviço
   */
  public stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    for (const timer of this.reconnectionTimers.values()) {
      clearTimeout(timer);
    }

    this.reconnectionTimers.clear();
    this.sessionHealth.clear();

    logger.info(`🛑 WhatsApp Reconnection Service stopped`);
  }
}

export default WhatsAppReconnectionService;
