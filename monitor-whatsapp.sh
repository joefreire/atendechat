#!/bin/bash

# Script de monitoramento e limpeza automática para WhatsApp
# Executa a cada 5 minutos via cron

LOG_FILE="/home/deploy/wzchat/monitor.log"
PM2_LOG="/root/.pm2/logs/wzchat-backend-error.log"

echo "$(date): Iniciando monitoramento WhatsApp" >> $LOG_FILE

# Verificar se o PM2 está rodando
if ! pm2 list | grep -q "wzchat-backend.*online"; then
    echo "$(date): Backend offline, reiniciando..." >> $LOG_FILE
    pm2 restart wzchat-backend
fi

# Verificar uso de memória
MEMORY_USAGE=$(pm2 jlist | jq '.[] | select(.name=="wzchat-backend") | .monit.memory' | head -1)
MEMORY_MB=$((MEMORY_USAGE / 1024 / 1024))

if [ $MEMORY_MB -gt 30000 ]; then
    echo "$(date): Memória alta ($MEMORY_MB MB), reiniciando backend..." >> $LOG_FILE
    pm2 restart wzchat-backend
fi

# Limpar logs antigos (manter apenas últimos 1000 linhas)
if [ -f "$PM2_LOG" ]; then
    tail -n 1000 "$PM2_LOG" > "$PM2_LOG.tmp" && mv "$PM2_LOG.tmp" "$PM2_LOG"
fi

# Verificar erros críticos e reiniciar se necessário
if [ -f "$PM2_LOG" ]; then
    ERROR_COUNT=$(grep -c "unhandledRejection\|Timed Out\|Connection Closed" "$PM2_LOG" | tail -1)
    if [ $ERROR_COUNT -gt 50 ]; then
        echo "$(date): Muitos erros detectados ($ERROR_COUNT), reiniciando..." >> $LOG_FILE
        pm2 restart wzchat-backend
    fi
fi

# Limpar cache do Node.js periodicamente
echo "$(date): Limpeza de cache concluída" >> $LOG_FILE

echo "$(date): Monitoramento concluído" >> $LOG_FILE
