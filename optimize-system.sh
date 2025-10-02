#!/bin/bash

# Script de otimização para servidor 64GB RAM + 16 CPUs
# Executa uma vez por dia via cron

echo "$(date): Iniciando otimização do sistema" >> /home/deploy/wzchat/optimize.log

# 1. Otimizar limites do sistema
echo "net.core.somaxconn = 65535" >> /etc/sysctl.conf
echo "net.core.netdev_max_backlog = 5000" >> /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65535" >> /etc/sysctl.conf
echo "net.ipv4.tcp_fin_timeout = 10" >> /etc/sysctl.conf
echo "net.ipv4.tcp_tw_reuse = 1" >> /etc/sysctl.conf
echo "vm.swappiness = 10" >> /etc/sysctl.conf
echo "vm.dirty_ratio = 15" >> /etc/sysctl.conf
echo "vm.dirty_background_ratio = 5" >> /etc/sysctl.conf
sysctl -p

# 2. Otimizar limites de arquivos
echo "* soft nofile 65535" >> /etc/security/limits.conf
echo "* hard nofile 65535" >> /etc/security/limits.conf
echo "* soft nproc 65535" >> /etc/security/limits.conf
echo "* hard nproc 65535" >> /etc/security/limits.conf

# 3. Otimizar Redis
if [ -f "/home/deploy/wzchat/redis-optimized.conf" ]; then
    cp /home/deploy/wzchat/redis-optimized.conf /etc/redis/redis.conf
    systemctl restart redis-server
    echo "$(date): Redis otimizado" >> /home/deploy/wzchat/optimize.log
fi

# 4. Otimizar PostgreSQL
if [ -f "/home/deploy/wzchat/postgresql-optimized.conf" ]; then
    cp /home/deploy/wzchat/postgresql-optimized.conf /etc/postgresql/*/main/postgresql.conf
    systemctl restart postgresql
    echo "$(date): PostgreSQL otimizado" >> /home/deploy/wzchat/optimize.log
fi

# 5. Limpar cache do sistema
sync
echo 3 > /proc/sys/vm/drop_caches

# 6. Otimizar PM2
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true

echo "$(date): Otimização concluída" >> /home/deploy/wzchat/optimize.log
