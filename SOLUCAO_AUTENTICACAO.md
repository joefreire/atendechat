# 🔐 Solução para Autenticação GitHub

## ✅ Status atual:
- **Token removido**: O token foi removido do histórico do Git com sucesso
- **Branch limpa**: A branch `dev-teste` está pronta para push
- **Problema**: Falta de autenticação para fazer push

## 🚀 Soluções possíveis:

### Opção 1: Token de Acesso Pessoal (Recomendado)
1. Acesse: https://github.com/settings/tokens
2. Clique em "Generate new token (classic)"
3. Selecione os escopos: `repo`, `workflow`
4. Copie o token gerado
5. Execute no terminal:
```bash
cd /home/deploy/wzchat
git config --global credential.helper store
git push origin dev-teste
# Quando pedir username: joefreire
# Quando pedir password: cole o token aqui
```

### Opção 2: SSH Key (Mais seguro)
1. Gere uma chave SSH:
```bash
ssh-keygen -t ed25519 -C "seu-email@exemplo.com"
```
2. Adicione a chave ao GitHub:
```bash
cat ~/.ssh/id_ed25519.pub
# Copie o conteúdo e adicione em: https://github.com/settings/ssh/new
```
3. Configure o repositório para usar SSH:
```bash
cd /home/deploy/wzchat
git remote set-url origin git@github.com:joefreire/atendechat.git
git push origin dev-teste
```

### Opção 3: GitHub CLI
```bash
# Instalar GitHub CLI
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Fazer login
gh auth login

# Fazer push
git push origin dev-teste
```

## 📋 Verificação:
Após o push, acesse: https://github.com/joefreire/atendechat/tree/dev-teste

## ⚠️ Importante:
- O token foi removido do histórico do Git
- A branch está limpa e pronta para push
- Escolha uma das opções acima para autenticar
