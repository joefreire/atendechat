import SessionManager from "./SessionManager";
import { logger } from "../../utils/logger";

/**
 * Inicializa o SessionManager e inicia o monitoramento de saúde das sessões
 */
export const initializeSessionManager = (): void => {
  try {
    const sessionManager = SessionManager.getInstance();
    
    // Inicia o monitoramento de saúde das sessões
    sessionManager.startHealthMonitoring();
    
    logger.info("SessionManager inicializado com sucesso");
  } catch (error) {
    logger.error("Erro ao inicializar SessionManager:", error);
  }
};

export default initializeSessionManager;
