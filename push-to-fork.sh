#!/bin/bash

# Script para fazer push das otimizações para o fork
echo "🚀 Fazendo push das otimizações para o fork..."

# Verificar se estamos na branch correta
current_branch=$(git branch --show-current)
if [ "$current_branch" != "dev-teste" ]; then
    echo "❌ Não está na branch dev-teste. Mudando para dev-teste..."
    git checkout dev-teste
fi

# Verificar status
echo "📊 Status do repositório:"
git status --short

# Fazer push para o fork
echo "📤 Fazendo push para o fork..."
git push https://github.com/joefreire/atendechat.git dev-teste

if [ $? -eq 0 ]; then
    echo "✅ Push realizado com sucesso!"
    echo "🔗 Acesse: https://github.com/joefreire/atendechat/tree/dev-teste"
else
    echo "❌ Erro no push. Verifique as credenciais."
    echo "💡 Dica: Configure um token de acesso pessoal do GitHub"
fi
