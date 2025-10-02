#!/bin/bash

# Script de monitoramento otimizado para WhatsApp Web
# Executa a cada 2 minutos via cron

LOG_FILE="/home/deploy/wzchat/monitor-optimized.log"
PM2_LOG="/root/.pm2/logs/wzchat-backend-optimized-error.log"
PERFORMANCE_LOG="/home/deploy/wzchat/performance.log"

echo "$(date): Iniciando monitoramento otimizado WhatsApp" >> $LOG_FILE

# Função para log de performance
log_performance() {
    echo "$(date): $1" >> $PERFORMANCE_LOG
}

# Verificar se o PM2 está rodando
if ! pm2 list | grep -q "wzchat-backend-optimized.*online"; then
    echo "$(date): Backend otimizado offline, reiniciando..." >> $LOG_FILE
    pm2 restart wzchat-backend-optimized
    log_performance "Backend restart triggered"
fi

# Verificar uso de memória com threshold mais inteligente
MEMORY_USAGE=$(pm2 jlist | jq '.[] | select(.name=="wzchat-backend-optimized") | .monit.memory' | head -1)
MEMORY_MB=$((MEMORY_USAGE / 1024 / 1024))

# Threshold dinâmico baseado na memória total do sistema
TOTAL_MEMORY=$(free -m | awk 'NR==2{printf "%.0f", $2}')
MEMORY_THRESHOLD=$((TOTAL_MEMORY * 80 / 100)) # 80% da memória total

if [ $MEMORY_MB -gt $MEMORY_THRESHOLD ]; then
    echo "$(date): Memória alta ($MEMORY_MB MB / $MEMORY_THRESHOLD MB), reiniciando backend..." >> $LOG_FILE
    pm2 restart wzchat-backend-optimized
    log_performance "Memory threshold exceeded: ${MEMORY_MB}MB > ${MEMORY_THRESHOLD}MB"
fi

# Verificar CPU usage
CPU_USAGE=$(pm2 jlist | jq '.[] | select(.name=="wzchat-backend-optimized") | .monit.cpu' | head -1)
if [ $(echo "$CPU_USAGE > 90" | bc -l) -eq 1 ]; then
    echo "$(date): CPU alta ($CPU_USAGE%), reiniciando backend..." >> $LOG_FILE
    pm2 restart wzchat-backend-optimized
    log_performance "CPU threshold exceeded: ${CPU_USAGE}%"
fi

# Verificar erros de reconexão
RECONNECT_ERRORS=$(grep -c "ERR_WAPP_NOT_INITIALIZED\|disconnect\|reconnect" $PM2_LOG 2>/dev/null || echo "0")
if [ $RECONNECT_ERRORS -gt 10 ]; then
    echo "$(date): Muitos erros de reconexão ($RECONNECT_ERRORS), reiniciando..." >> $LOG_FILE
    pm2 restart wzchat-backend-optimized
    log_performance "Reconnection errors threshold exceeded: $RECONNECT_ERRORS"
fi

# Verificar tempo de resposta (se disponível)
if command -v curl &> /dev/null; then
    RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:4001/health 2>/dev/null || echo "0")
    if [ $(echo "$RESPONSE_TIME > 5" | bc -l) -eq 1 ]; then
        echo "$(date): Tempo de resposta alto (${RESPONSE_TIME}s), reiniciando..." >> $LOG_FILE
        pm2 restart wzchat-backend-optimized
        log_performance "Response time threshold exceeded: ${RESPONSE_TIME}s"
    fi
fi

# Verificar conexões ativas
ACTIVE_CONNECTIONS=$(netstat -an | grep :4001 | grep ESTABLISHED | wc -l)
if [ $ACTIVE_CONNECTIONS -gt 1000 ]; then
    echo "$(date): Muitas conexões ativas ($ACTIVE_CONNECTIONS), reiniciando..." >> $LOG_FILE
    pm2 restart wzchat-backend-optimized
    log_performance "Active connections threshold exceeded: $ACTIVE_CONNECTIONS"
fi

# Limpar logs antigos (manter apenas últimos 2000 linhas)
if [ -f "$PM2_LOG" ]; then
    tail -n 2000 "$PM2_LOG" > "$PM2_LOG.tmp" && mv "$PM2_LOG.tmp" "$PM2_LOG"
    echo "$(date): Logs do PM2 limpos." >> $LOG_FILE
fi

# Limpar logs de performance antigos
if [ -f "$PERFORMANCE_LOG" ]; then
    tail -n 1000 "$PERFORMANCE_LOG" > "$PERFORMANCE_LOG.tmp" && mv "$PERFORMANCE_LOG.tmp" "$PERFORMANCE_LOG"
fi

# Verificar espaço em disco
DISK_USAGE=$(df /home | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 85 ]; then
    echo "$(date): Espaço em disco baixo ($DISK_USAGE%), limpando logs..." >> $LOG_FILE
    find /root/.pm2/logs -name "*.log" -mtime +7 -delete
    find /home/deploy/wzchat -name "*.log" -mtime +7 -delete
    log_performance "Disk cleanup triggered: ${DISK_USAGE}%"
fi

# Aplicar otimizações de sistema se necessário
if [ $(date +%H) -eq 2 ] && [ $(date +%M) -lt 5 ]; then
    echo "$(date): Aplicando otimizações noturnas..." >> $LOG_FILE
    sync
    echo 1 > /proc/sys/vm/drop_caches
    log_performance "Nightly optimizations applied"
fi

# Log de status
echo "$(date): Status - Mem: ${MEMORY_MB}MB, CPU: ${CPU_USAGE}%, Conexões: ${ACTIVE_CONNECTIONS}, Erros: ${RECONNECT_ERRORS}" >> $LOG_FILE

echo "$(date): Monitoramento otimizado WhatsApp finalizado." >> $LOG_FILE
