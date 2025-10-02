import SessionManager from "./SessionManager";
import { logger } from "../../utils/logger";

/**
 * Classe para testar o SessionManager
 * Este arquivo deve ser removido em produção
 */
export class SessionManagerTest {
  private sessionManager: SessionManager;

  constructor() {
    this.sessionManager = SessionManager.getInstance();
  }

  /**
   * Testa a detecção de erros de criptografia
   */
  async testCryptoErrorDetection(): Promise<void> {
    logger.info("🧪 Testando detecção de erros de criptografia...");

    const testErrors = [
      { message: "Bad MAC", shouldBeDetected: true },
      { message: "PreKeyError: Invalid PreKey ID", shouldBeDetected: true },
      { message: "SessionError: Over 2000 messages into the future!", shouldBeDetected: true },
      { message: "Failed to decrypt message", shouldBeDetected: true },
      { message: "Connection timeout", shouldBeDetected: false },
      { message: "Database error", shouldBeDetected: false }
    ];

    for (const testError of testErrors) {
      const mockSession = { id: 999 } as any;
      const wasHandled = await this.sessionManager.handleCryptoError(
        new Error(testError.message), 
        mockSession, 
        { test: true }
      );

      const result = wasHandled === testError.shouldBeDetected ? "✅" : "❌";
      logger.info(`${result} ${testError.message} - Esperado: ${testError.shouldBeDetected}, Obtido: ${wasHandled}`);
    }
  }

  /**
   * Testa o retry com backoff exponencial
   */
  async testRetryWithBackoff(): Promise<void> {
    logger.info("🧪 Testando retry com backoff exponencial...");

    let attemptCount = 0;
    const maxRetries = 3;

    try {
      await this.sessionManager.retryCryptoOperation(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error("Bad MAC");
        }
        return "Sucesso!";
      }, maxRetries);

      logger.info(`✅ Retry funcionou! Tentativas: ${attemptCount}`);
    } catch (error) {
      logger.error(`❌ Retry falhou: ${error.message}`);
    }
  }

  /**
   * Testa o monitoramento de saúde das sessões
   */
  async testSessionHealthMonitoring(): Promise<void> {
    logger.info("🧪 Testando monitoramento de saúde das sessões...");

    const testSessionId = 123;
    
    // Simula alguns erros
    for (let i = 0; i < 3; i++) {
      const mockSession = { id: testSessionId } as any;
      await this.sessionManager.handleCryptoError(
        new Error("Bad MAC"), 
        mockSession, 
        { test: true }
      );
    }

    const health = this.sessionManager.getSessionHealth(testSessionId);
    logger.info(`📊 Saúde da sessão ${testSessionId}:`, health);

    const stats = this.sessionManager.getSessionStats();
    logger.info("📊 Estatísticas das sessões:", stats);
  }

  /**
   * Executa todos os testes
   */
  async runAllTests(): Promise<void> {
    logger.info("🚀 Iniciando testes do SessionManager...");

    try {
      await this.testCryptoErrorDetection();
      await this.testRetryWithBackoff();
      await this.testSessionHealthMonitoring();
      
      logger.info("✅ Todos os testes do SessionManager foram executados com sucesso!");
    } catch (error) {
      logger.error("❌ Erro durante os testes do SessionManager:", error);
    }
  }
}

// Função para executar os testes (apenas para desenvolvimento)
export const runSessionManagerTests = async (): Promise<void> => {
  const tester = new SessionManagerTest();
  await tester.runAllTests();
};

export default SessionManagerTest;
