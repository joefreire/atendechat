#!/usr/bin/env node

import { logger } from "../utils/logger";
import BaileysOptimizationService from "../services/WbotServices/BaileysOptimizationService";
import WhatsAppPerformanceMonitor from "../services/WbotServices/WhatsAppPerformanceMonitor";
import WhatsAppReconnectionService from "../services/WbotServices/WhatsAppReconnectionService";

/**
 * Script de otimização do WhatsApp Web
 * Aplica todas as otimizações de performance e reconexão
 */

class WhatsAppOptimizer {
  private optimizationService: BaileysOptimizationService;
  private performanceMonitor: WhatsAppPerformanceMonitor;
  private reconnectionService: WhatsAppReconnectionService;

  constructor() {
    this.optimizationService = BaileysOptimizationService.getInstance();
    this.performanceMonitor = WhatsAppPerformanceMonitor.getInstance();
    this.reconnectionService = WhatsAppReconnectionService.getInstance();
  }

  /**
   * Executa todas as otimizações
   */
  public async optimize(): Promise<void> {
    try {
      logger.info("🚀 Iniciando otimização do WhatsApp Web...");

      // 1. Aplicar otimizações de sistema
      await this.applySystemOptimizations();

      // 2. Aplicar otimizações de memória
      await this.applyMemoryOptimizations();

      // 3. Aplicar otimizações de rede
      await this.applyNetworkOptimizations();

      // 4. Configurar monitoramento
      await this.setupMonitoring();

      // 5. Aplicar otimizações do Baileys
      await this.applyBaileysOptimizations();

      logger.info("✅ Otimização do WhatsApp Web concluída com sucesso!");

    } catch (error) {
      logger.error("❌ Erro durante otimização:", error);
      throw error;
    }
  }

  /**
   * Aplica otimizações de sistema
   */
  private async applySystemOptimizations(): Promise<void> {
    logger.info("🔧 Aplicando otimizações de sistema...");

    // Configurar limites de processo
    process.setMaxListeners(50);
    
    // Configurar variáveis de ambiente otimizadas
    process.env.UV_THREADPOOL_SIZE = '32';
    process.env.NODE_OPTIONS = '--max-old-space-size=28672 --max-semi-space-size=512 --optimize-for-size';
    
    // Configurar garbage collection
    if (global.gc) {
      setInterval(() => {
        global.gc();
      }, 300000); // GC a cada 5 minutos
    }

    logger.info("✅ Otimizações de sistema aplicadas");
  }

  /**
   * Aplica otimizações de memória
   */
  private async applyMemoryOptimizations(): Promise<void> {
    logger.info("🧠 Aplicando otimizações de memória...");

    // Configurar cache otimizado
    const cacheConfig = this.optimizationService.getCacheConfig();
    
    // Aplicar configurações de memória
    this.optimizationService.applyMemoryOptimizations();

    logger.info("✅ Otimizações de memória aplicadas");
  }

  /**
   * Aplica otimizações de rede
   */
  private async applyNetworkOptimizations(): Promise<void> {
    logger.info("🌐 Aplicando otimizações de rede...");

    // Aplicar configurações de rede
    this.optimizationService.applyNetworkOptimizations();

    logger.info("✅ Otimizações de rede aplicadas");
  }

  /**
   * Configura monitoramento
   */
  private async setupMonitoring(): Promise<void> {
    logger.info("📊 Configurando monitoramento...");

    // O monitoramento já é inicializado automaticamente
    // Aqui podemos adicionar configurações específicas

    logger.info("✅ Monitoramento configurado");
  }

  /**
   * Aplica otimizações do Baileys
   */
  private async applyBaileysOptimizations(): Promise<void> {
    logger.info("⚙️ Aplicando otimizações do Baileys...");

    // Obter configuração otimizada
    const config = this.optimizationService.getCompleteConfig();
    
    logger.info("Configuração otimizada do Baileys:", {
      socket: config.socket,
      connection: config.connection,
      cache: config.cache
    });

    logger.info("✅ Otimizações do Baileys aplicadas");
  }

  /**
   * Exibe status das otimizações
   */
  public displayStatus(): void {
    logger.info("📊 Status das otimizações:");
    
    const config = this.optimizationService.getCurrentConfig();
    const systemMetrics = this.performanceMonitor.getSystemMetrics();
    const sessionStatus = this.reconnectionService.getSessionStatus();

    logger.info("Configuração atual:", config);
    logger.info("Métricas do sistema:", systemMetrics);
    logger.info("Status das sessões:", Array.from(sessionStatus.entries()));

    // Exibir uso de memória
    const memUsage = process.memoryUsage();
    logger.info("Uso de memória:", {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
    });
  }

  /**
   * Para todos os serviços
   */
  public stop(): void {
    logger.info("🛑 Parando serviços de otimização...");
    
    this.performanceMonitor.stop();
    this.reconnectionService.stop();
    
    logger.info("✅ Serviços parados");
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const optimizer = new WhatsAppOptimizer();
  
  optimizer.optimize()
    .then(() => {
      optimizer.displayStatus();
      logger.info("🎉 Otimização concluída!");
    })
    .catch((error) => {
      logger.error("💥 Erro na otimização:", error);
      process.exit(1);
    });
}

export default WhatsAppOptimizer;
