#!/bin/bash

# Script de inicialização otimizada do WhatsApp Web
# Aplica todas as otimizações de performance e reconexão

echo "🚀 Iniciando WhatsApp Web otimizado..."

# Configurar variáveis de ambiente otimizadas
export NODE_ENV=production
export UV_THREADPOOL_SIZE=32
export NODE_OPTIONS="--max-old-space-size=28672 --max-semi-space-size=512 --optimize-for-size --gc-interval=100 --expose-gc"

# Configurar limites do sistema
ulimit -n 65535
ulimit -u 65535

# Aplicar otimizações de sistema
echo "🔧 Aplicando otimizações de sistema..."

# Configurar TCP
echo "net.core.somaxconn = 65535" >> /etc/sysctl.conf
echo "net.core.netdev_max_backlog = 5000" >> /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65535" >> /etc/sysctl.conf
echo "net.ipv4.tcp_fin_timeout = 10" >> /etc/sysctl.conf
echo "net.ipv4.tcp_tw_reuse = 1" >> /etc/sysctl.conf
echo "vm.swappiness = 10" >> /etc/sysctl.conf
echo "vm.dirty_ratio = 15" >> /etc/sysctl.conf
echo "vm.dirty_background_ratio = 5" >> /etc/sysctl.conf

# Aplicar configurações
sysctl -p

# Configurar limites de arquivos
echo "* soft nofile 65535" >> /etc/security/limits.conf
echo "* hard nofile 65535" >> /etc/security/limits.conf
echo "* soft nproc 65535" >> /etc/security/limits.conf
echo "* hard nproc 65535" >> /etc/security/limits.conf

# Limpar cache de memória
sync
echo 1 > /proc/sys/vm/drop_caches

echo "✅ Otimizações de sistema aplicadas"

# Compilar TypeScript se necessário
if [ ! -d "dist" ] || [ "src" -nt "dist" ]; then
    echo "📦 Compilando TypeScript..."
    npm run build
fi

# Executar script de otimização
echo "⚙️ Executando otimizações do WhatsApp..."
node dist/scripts/optimize-whatsapp.js

# Iniciar aplicação com otimizações
echo "🎯 Iniciando aplicação otimizada..."
node dist/server.js

echo "✅ WhatsApp Web otimizado iniciado com sucesso!"
