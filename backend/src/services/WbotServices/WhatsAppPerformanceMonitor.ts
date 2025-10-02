import { logger } from "../../utils/logger";
import { getIO } from "../../libs/socket";
import { performance } from "perf_hooks";

interface PerformanceMetrics {
  whatsappId: number;
  timestamp: Date;
  connectionUptime: number;
  messagesProcessed: number;
  messagesPerMinute: number;
  averageResponseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  errorCount: number;
  reconnectCount: number;
  lastActivity: Date;
}

interface SystemMetrics {
  totalMemory: number;
  freeMemory: number;
  usedMemory: number;
  cpuUsage: number;
  activeConnections: number;
  totalMessages: number;
  errorRate: number;
}

class WhatsAppPerformanceMonitor {
  private static instance: WhatsAppPerformanceMonitor;
  private metrics: Map<number, PerformanceMetrics> = new Map();
  private systemMetrics: SystemMetrics;
  private monitoringInterval: NodeJS.Timeout;
  private alertThresholds = {
    memoryUsage: 0.8, // 80%
    cpuUsage: 0.9, // 90%
    errorRate: 0.1, // 10%
    responseTime: 5000, // 5 segundos
    reconnectCount: 5 // 5 reconexões por hora
  };

  private constructor() {
    this.systemMetrics = this.getInitialSystemMetrics();
    this.startMonitoring();
  }

  public static getInstance(): WhatsAppPerformanceMonitor {
    if (!WhatsAppPerformanceMonitor.instance) {
      WhatsAppPerformanceMonitor.instance = new WhatsAppPerformanceMonitor();
    }
    return WhatsAppPerformanceMonitor.instance;
  }

  /**
   * Inicializa monitoramento para uma sessão
   */
  public initializeSession(whatsappId: number): void {
    this.metrics.set(whatsappId, {
      whatsappId,
      timestamp: new Date(),
      connectionUptime: 0,
      messagesProcessed: 0,
      messagesPerMinute: 0,
      averageResponseTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      errorCount: 0,
      reconnectCount: 0,
      lastActivity: new Date()
    });

    logger.info(`📊 Performance monitoring initialized for session ${whatsappId}`);
  }

  /**
   * Registra processamento de mensagem
   */
  public recordMessageProcessed(whatsappId: number, responseTime: number): void {
    const metric = this.metrics.get(whatsappId);
    if (!metric) return;

    metric.messagesProcessed++;
    metric.lastActivity = new Date();
    
    // Calcular tempo médio de resposta
    const totalTime = metric.averageResponseTime * (metric.messagesProcessed - 1) + responseTime;
    metric.averageResponseTime = totalTime / metric.messagesProcessed;

    // Verificar alertas
    this.checkPerformanceAlerts(whatsappId, metric);
  }

  /**
   * Registra erro
   */
  public recordError(whatsappId: number, error: Error): void {
    const metric = this.metrics.get(whatsappId);
    if (!metric) return;

    metric.errorCount++;
    metric.lastActivity = new Date();

    logger.error(`❌ Error recorded for session ${whatsappId}: ${error.message}`);
  }

  /**
   * Registra reconexão
   */
  public recordReconnection(whatsappId: number): void {
    const metric = this.metrics.get(whatsappId);
    if (!metric) return;

    metric.reconnectCount++;
    metric.connectionUptime = 0; // Reset uptime
    metric.lastActivity = new Date();

    logger.warn(`🔄 Reconnection recorded for session ${whatsappId}`);
  }

  /**
   * Atualiza métricas de sistema
   */
  private updateSystemMetrics(): void {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    this.systemMetrics = {
      totalMemory: memUsage.heapTotal,
      freeMemory: memUsage.heapTotal - memUsage.heapUsed,
      usedMemory: memUsage.heapUsed,
      cpuUsage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
      activeConnections: this.metrics.size,
      totalMessages: Array.from(this.metrics.values()).reduce((sum, m) => sum + m.messagesProcessed, 0),
      errorRate: this.calculateErrorRate()
    };
  }

  /**
   * Calcula taxa de erro
   */
  private calculateErrorRate(): number {
    const totalMessages = this.systemMetrics.totalMessages;
    const totalErrors = Array.from(this.metrics.values()).reduce((sum, m) => sum + m.errorCount, 0);
    
    return totalMessages > 0 ? totalErrors / totalMessages : 0;
  }

  /**
   * Verifica alertas de performance
   */
  private checkPerformanceAlerts(whatsappId: number, metric: PerformanceMetrics): void {
    const alerts: string[] = [];

    // Verificar uso de memória
    if (metric.memoryUsage > this.alertThresholds.memoryUsage) {
      alerts.push(`High memory usage: ${(metric.memoryUsage * 100).toFixed(1)}%`);
    }

    // Verificar uso de CPU
    if (metric.cpuUsage > this.alertThresholds.cpuUsage) {
      alerts.push(`High CPU usage: ${(metric.cpuUsage * 100).toFixed(1)}%`);
    }

    // Verificar tempo de resposta
    if (metric.averageResponseTime > this.alertThresholds.responseTime) {
      alerts.push(`Slow response time: ${metric.averageResponseTime.toFixed(0)}ms`);
    }

    // Verificar reconexões
    if (metric.reconnectCount > this.alertThresholds.reconnectCount) {
      alerts.push(`High reconnect count: ${metric.reconnectCount}`);
    }

    // Enviar alertas se houver
    if (alerts.length > 0) {
      this.sendPerformanceAlert(whatsappId, alerts);
    }
  }

  /**
   * Envia alerta de performance
   */
  private sendPerformanceAlert(whatsappId: number, alerts: string[]): void {
    const alert = {
      whatsappId,
      timestamp: new Date(),
      type: 'performance',
      severity: 'warning',
      messages: alerts
    };

    // Enviar via WebSocket
    const io = getIO();
    io.emit('whatsapp-performance-alert', alert);

    logger.warn(`⚠️ Performance alert for session ${whatsappId}: ${alerts.join(', ')}`);
  }

  /**
   * Inicia monitoramento contínuo
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.performMonitoringCycle();
    }, 60000); // A cada minuto

    logger.info(`📊 Performance monitoring started`);
  }

  /**
   * Executa ciclo de monitoramento
   */
  private async performMonitoringCycle(): Promise<void> {
    try {
      this.updateSystemMetrics();
      this.updateSessionMetrics();
      this.checkSystemAlerts();
      this.cleanupOldMetrics();
    } catch (error) {
      logger.error('Error in monitoring cycle:', error);
    }
  }

  /**
   * Atualiza métricas das sessões
   */
  private updateSessionMetrics(): void {
    const now = new Date();
    
    for (const [whatsappId, metric] of this.metrics.entries()) {
      // Atualizar uptime
      const timeSinceLastActivity = now.getTime() - metric.lastActivity.getTime();
      if (timeSinceLastActivity < 300000) { // 5 minutos
        metric.connectionUptime += 60000; // Adicionar 1 minuto
      }

      // Calcular mensagens por minuto
      const minutesSinceStart = (now.getTime() - metric.timestamp.getTime()) / 60000;
      metric.messagesPerMinute = minutesSinceStart > 0 ? metric.messagesProcessed / minutesSinceStart : 0;

      // Atualizar uso de memória e CPU
      const memUsage = process.memoryUsage();
      metric.memoryUsage = memUsage.heapUsed / memUsage.heapTotal;
      metric.cpuUsage = this.getCurrentCpuUsage();
    }
  }

  /**
   * Obtém uso atual de CPU
   */
  private getCurrentCpuUsage(): number {
    const usage = process.cpuUsage();
    return (usage.user + usage.system) / 1000000; // Convert to seconds
  }

  /**
   * Verifica alertas do sistema
   */
  private checkSystemAlerts(): void {
    const alerts: string[] = [];

    // Verificar uso de memória do sistema
    if (this.systemMetrics.usedMemory / this.systemMetrics.totalMemory > this.alertThresholds.memoryUsage) {
      alerts.push(`System memory usage: ${((this.systemMetrics.usedMemory / this.systemMetrics.totalMemory) * 100).toFixed(1)}%`);
    }

    // Verificar taxa de erro do sistema
    if (this.systemMetrics.errorRate > this.alertThresholds.errorRate) {
      alerts.push(`System error rate: ${(this.systemMetrics.errorRate * 100).toFixed(1)}%`);
    }

    if (alerts.length > 0) {
      this.sendSystemAlert(alerts);
    }
  }

  /**
   * Envia alerta do sistema
   */
  private sendSystemAlert(alerts: string[]): void {
    const alert = {
      timestamp: new Date(),
      type: 'system',
      severity: 'critical',
      messages: alerts
    };

    const io = getIO();
    io.emit('whatsapp-system-alert', alert);

    logger.error(`🚨 System alert: ${alerts.join(', ')}`);
  }

  /**
   * Limpa métricas antigas
   */
  private cleanupOldMetrics(): void {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas

    for (const [whatsappId, metric] of this.metrics.entries()) {
      if (now.getTime() - metric.timestamp.getTime() > maxAge) {
        this.metrics.delete(whatsappId);
      }
    }
  }

  /**
   * Obtém métricas de uma sessão
   */
  public getSessionMetrics(whatsappId: number): PerformanceMetrics | undefined {
    return this.metrics.get(whatsappId);
  }

  /**
   * Obtém métricas do sistema
   */
  public getSystemMetrics(): SystemMetrics {
    return { ...this.systemMetrics };
  }

  /**
   * Obtém todas as métricas
   */
  public getAllMetrics(): { sessions: Map<number, PerformanceMetrics>; system: SystemMetrics } {
    return {
      sessions: new Map(this.metrics),
      system: { ...this.systemMetrics }
    };
  }

  /**
   * Obtém métricas iniciais do sistema
   */
  private getInitialSystemMetrics(): SystemMetrics {
    const memUsage = process.memoryUsage();
    return {
      totalMemory: memUsage.heapTotal,
      freeMemory: memUsage.heapTotal - memUsage.heapUsed,
      usedMemory: memUsage.heapUsed,
      cpuUsage: 0,
      activeConnections: 0,
      totalMessages: 0,
      errorRate: 0
    };
  }

  /**
   * Para o monitoramento
   */
  public stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.metrics.clear();
    logger.info(`🛑 Performance monitoring stopped`);
  }
}

export default WhatsAppPerformanceMonitor;
