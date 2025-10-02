import * as Sentry from "@sentry/node";
import makeWASocket, {
  WASocket,
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  isJidBroadcast,
  CacheStore
} from "baileys";
import P from "pino";

import Whatsapp from "../models/Whatsapp";
import { logger } from "../utils/logger";
import MAIN_LOGGER from "baileys/lib/Utils/logger";
import authState from "../helpers/authState";
import { Boom } from "@hapi/boom";
import AppError from "../errors/AppError";
import { getIO } from "./socket";
import { Store } from "./store";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";
import DeleteBaileysService from "../services/BaileysServices/DeleteBaileysService";
import NodeCache from 'node-cache';

// Importar serviços de otimização
import WhatsAppReconnectionService from "../services/WbotServices/WhatsAppReconnectionService";
import BaileysOptimizationService from "../services/WbotServices/BaileysOptimizationService";
import WhatsAppPerformanceMonitor from "../services/WbotServices/WhatsAppPerformanceMonitor";

const loggerBaileys = MAIN_LOGGER.child({});
loggerBaileys.level = "error";

type Session = WASocket & {
  id?: number;
  store?: Store;
};

const sessions: Session[] = [];
const retriesQrCodeMap = new Map<number, number>();

// Instâncias dos serviços de otimização
const reconnectionService = WhatsAppReconnectionService.getInstance();
const optimizationService = BaileysOptimizationService.getInstance();
const performanceMonitor = WhatsAppPerformanceMonitor.getInstance();

export const getWbot = (whatsappId: number): Session => {
  const sessionIndex = sessions.findIndex(s => s.id === whatsappId);

  if (sessionIndex === -1) {
    throw new AppError("ERR_WAPP_NOT_INITIALIZED");
  }
  return sessions[sessionIndex];
};

export const removeWbot = async (
  whatsappId: number,
  isLogout = true
): Promise<void> => {
  try {
    const sessionIndex = sessions.findIndex(s => s.id === whatsappId);
    if (sessionIndex !== -1) {
      if (isLogout) {
        sessions[sessionIndex].logout();
        sessions[sessionIndex].ws.close();
      }

      sessions.splice(sessionIndex, 1);
      
      // Notificar serviços de otimização
      reconnectionService.markSessionDisconnected(whatsappId, 'Manual removal');
    }
  } catch (err) {
    logger.error(err);
  }
};

export const initWASocket = async (whatsapp: Whatsapp): Promise<Session> => {
  return new Promise(async (resolve, reject) => {
    try {
      (async () => {
        const io = getIO();
        const startTime = performance.now();

        const whatsappUpdate = await Whatsapp.findOne({
          where: { id: whatsapp.id }
        });

        if (!whatsappUpdate) return;

        const { id, name, provider } = whatsappUpdate;

        const { version, isLatest } = await fetchLatestBaileysVersion();
        const isLegacy = provider === "stable" ? true : false;

        logger.info(`using WA v${version.join(".")}, isLatest: ${isLatest}`);
        logger.info(`isLegacy: ${isLegacy}`);
        logger.info(`Starting session ${name}`);
        
        let retriesQrCode = 0;
        let wsocket: Session = null;

        const { state, saveState } = await authState(whatsapp);

        // Configurações otimizadas do Baileys
        const optimizationConfig = optimizationService.getSocketConfig();
        
        const msgRetryCounterCache = new NodeCache({
          stdTTL: optimizationConfig.msgRetryCounterCache.ttl,
          maxKeys: optimizationConfig.msgRetryCounterCache.maxKeys
        });
        
        const userDevicesCache: CacheStore = new NodeCache();

        // Inicializar monitoramento de performance
        performanceMonitor.initializeSession(id);

        wsocket = makeWASocket({
          logger: loggerBaileys,
          printQRInTerminal: false,
          browser: optimizationConfig.browser,
          auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
          },
          version,
          defaultQueryTimeoutMs: optimizationConfig.defaultQueryTimeoutMs,
          retryRequestDelayMs: optimizationConfig.retryRequestDelayMs,
          keepAliveIntervalMs: optimizationConfig.keepAliveIntervalMs,
          generateHighQualityLinkPreview: optimizationConfig.generateHighQualityLinkPreview,
          markOnlineOnConnect: optimizationConfig.markOnlineOnConnect,
          syncFullHistory: optimizationConfig.syncFullHistory,
          msgRetryCounterCache,
          shouldIgnoreJid: jid => isJidBroadcast(jid),
        });

        // Inicializar serviço de reconexão
        reconnectionService.initializeSession(id);

        wsocket.ev.on(
          "connection.update",
          async ({ connection, lastDisconnect, qr }) => {
            const connectionTime = performance.now() - startTime;
            
            logger.info(
              `Socket ${name} Connection Update ${connection || ""} ${lastDisconnect || ""} (${connectionTime.toFixed(2)}ms)`
            );

            if (connection === "close") {
              // Registrar desconexão
              reconnectionService.markSessionDisconnected(id, lastDisconnect?.error?.message || 'Unknown');
              
              if ((lastDisconnect?.error as Boom)?.output?.statusCode === 403) {
                await whatsapp.update({ status: "PENDING", session: "" });
                await DeleteBaileysService(whatsapp.id);
                io.to(`company-${whatsapp.companyId}-mainchannel`).emit(`company-${whatsapp.companyId}-whatsappSession`, {
                  action: "update",
                  session: whatsapp
                });
                removeWbot(id, false);
              }
              
              if (
                (lastDisconnect?.error as Boom)?.output?.statusCode !==
                DisconnectReason.loggedOut
              ) {
                removeWbot(id, false);
                // Usar serviço de reconexão inteligente
                reconnectionService.markSessionDisconnected(id, 'Connection closed');
              } else {
                await whatsapp.update({ status: "PENDING", session: "" });
                await DeleteBaileysService(whatsapp.id);
                io.to(`company-${whatsapp.companyId}-mainchannel`).emit(`company-${whatsapp.companyId}-whatsappSession`, {
                  action: "update",
                  session: whatsapp
                });
                removeWbot(id, false);
                reconnectionService.markSessionDisconnected(id, 'Logged out');
              }
            }

            if (connection === "open") {
              // Registrar conexão bem-sucedida
              reconnectionService.markSessionConnected(id);
              
              await whatsapp.update({
                status: "CONNECTED",
                qrcode: "",
                retries: 0
              });

              io.to(`company-${whatsapp.companyId}-mainchannel`).emit(`company-${whatsapp.companyId}-whatsappSession`, {
                action: "update",
                session: whatsapp
              });

              const sessionIndex = sessions.findIndex(
                s => s.id === whatsapp.id
              );
              if (sessionIndex === -1) {
                wsocket.id = whatsapp.id;
                sessions.push(wsocket);
              }

              // Registrar tempo de conexão
              performanceMonitor.recordMessageProcessed(id, connectionTime);

              resolve(wsocket);
            }

            if (qr !== undefined) {
              if (retriesQrCodeMap.get(id) && retriesQrCodeMap.get(id) >= 3) {
                await whatsappUpdate.update({
                  status: "DISCONNECTED",
                  qrcode: ""
                });
                await DeleteBaileysService(whatsappUpdate.id);
                io.to(`company-${whatsapp.companyId}-mainchannel`).emit("whatsappSession", {
                  action: "update",
                  session: whatsappUpdate
                });
                wsocket.ev.removeAllListeners("connection.update");
                wsocket.ws.close();
                wsocket = null;
                retriesQrCodeMap.delete(id);
              } else {
                logger.info(`Session QRCode Generate ${name}`);
                retriesQrCodeMap.set(id, (retriesQrCode += 1));

                await whatsapp.update({
                  qrcode: qr,
                  status: "qrcode",
                  retries: 0
                });
                const sessionIndex = sessions.findIndex(
                  s => s.id === whatsapp.id
                );

                if (sessionIndex === -1) {
                  wsocket.id = whatsapp.id;
                  sessions.push(wsocket);
                }

                io.to(`company-${whatsapp.companyId}-mainchannel`).emit(`company-${whatsapp.companyId}-whatsappSession`, {
                  action: "update",
                  session: whatsapp
                });
              }
            }
          }
        );

        wsocket.ev.on("creds.update", saveState);

        // Adicionar listeners de performance
        wsocket.ev.on("messages.upsert", () => {
          performanceMonitor.recordMessageProcessed(id, 0);
        });

        wsocket.ev.on("connection.update", (update) => {
          if (update.connection === "close") {
            performanceMonitor.recordReconnection(id);
          }
        });

        // Adicionar error handler (comentado temporariamente devido a incompatibilidade de tipos)
        // wsocket.ev.on("error", (error: any) => {
        //   performanceMonitor.recordError(id, error);
        // });

      })();
    } catch (error) {
      Sentry.captureException(error);
      performanceMonitor.recordError(whatsapp.id, error);
      console.log(error);
      reject(error);
    }
  });
};

// Função para obter métricas de performance
export const getPerformanceMetrics = () => {
  return performanceMonitor.getAllMetrics();
};

// Função para forçar reconexão
export const forceReconnection = async (whatsappId: number) => {
  return reconnectionService.forceReconnection(whatsappId);
};

// Função para obter status das sessões
export const getSessionStatus = () => {
  return reconnectionService.getSessionStatus();
};

// Função para aplicar otimizações de sistema
export const applySystemOptimizations = () => {
  optimizationService.applyMemoryOptimizations();
  optimizationService.applyNetworkOptimizations();
};

// Função para obter configuração otimizada
export const getOptimizationConfig = () => {
  return optimizationService.getCompleteConfig();
};
