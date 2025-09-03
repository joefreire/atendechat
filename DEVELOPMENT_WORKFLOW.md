# 🚀 Guia de Workflow - Atendechat Custom

## 📋 Configuração Atual

### Repositórios Configurados
- **Origin**: `https://github.com/joefreire/atendechat.git` (seu repositório)
- **Upstream**: `https://github.com/atendechat/codatendechat.git` (repositório original)

### Estrutura de Customizações
```
atendechat/
├── backend/src/custom/          # Customizações do backend
│   ├── controllers/             # Controllers customizados
│   ├── services/                # Services customizados
│   ├── models/                  # Models customizados
│   └── routes/                  # Rotas customizadas
├── frontend/src/custom/         # Customizações do frontend
│   ├── components/              # Componentes customizados
│   ├── pages/                   # Páginas customizadas
│   ├── hooks/                   # Hooks customizados
│   └── services/                # Services customizados
└── custom-docs/                 # Documentação das customizações
```

## 🔄 Workflow de Desenvolvimento

### 1. **Desenvolvimento Diário**

#### Criar Nova Feature
```bash
# 1. Verificar se há atualizações
git fetch upstream

# 2. Criar branch para feature
git checkout -b feature/nova-funcionalidade

# 3. Desenvolver sua customização
# - Adicionar arquivos em backend/src/custom/
# - Adicionar arquivos em frontend/src/custom/

# 4. Testar
npm run test  # Backend
npm start     # Frontend

# 5. Commit
git add .
git commit -m "feat: adiciona nova funcionalidade X"

# 6. Push
git push origin feature/nova-funcionalidade
```

#### Mesclar Feature
```bash
# 1. Voltar para master
git checkout master

# 2. Mesclar feature
git merge feature/nova-funcionalidade

# 3. Push para origin
git push origin master

# 4. Deletar branch local
git branch -d feature/nova-funcionalidade
```

### 2. **Atualizações do Repositório Original**

#### Quando tiver acesso válido ao upstream:
```bash
# 1. Buscar atualizações
git fetch upstream

# 2. Criar branch temporária
git checkout -b temp-update

# 3. Mesclar atualizações
git merge upstream/main

# 4. Resolver conflitos se houver
# 5. Testar funcionamento
# 6. Mesclar na branch principal
git checkout master
git merge temp-update

# 7. Push para seu repositório
git push origin master

# 8. Deletar branch temporária
git branch -d temp-update
```

### 3. **Estrutura de Branches Recomendada**

```bash
master                    # Branch principal (código estável)
├── feature/nova-func     # Nova funcionalidade
├── feature/melhorias-ui  # Melhorias na interface
├── feature/integracao    # Nova integração
└── hotfix/bug-fix        # Correções urgentes
```

## 🛠️ Comandos Úteis

### Git
```bash
# Ver status
git status

# Ver histórico
git log --oneline

# Ver diferenças
git diff

# Ver branches
git branch -a

# Mudar branch
git checkout nome-da-branch

# Criar e mudar para nova branch
git checkout -b nova-branch
```

### Desenvolvimento
```bash
# Instalar dependências
cd backend && npm install
cd ../frontend && npm install

# Executar em desenvolvimento
cd backend && npm run dev
cd frontend && npm start

# Build para produção
cd backend && npm run build
cd frontend && npm run build
```

## 📝 Documentação

### Manter Log de Alterações
Sempre atualize o arquivo `custom-docs/CUSTOM_CHANGES.md`:

```markdown
#### [Data] - Versão X.X.X
**Adicionado:**
- [x] Nova funcionalidade X
- [x] Melhoria na interface Y

**Modificado:**
- [x] Alteração no comportamento Z
```

### Documentar APIs
Sempre documente novas APIs em `custom-docs/API_CUSTOM.md`:

```markdown
#### GET /api/custom/endpoint
**Descrição:** Nova API customizada
**Parâmetros:** ...
**Resposta:** ...
```

## 🚨 Boas Práticas

### 1. **Organização**
- ✅ Sempre use as pastas `custom/` para suas alterações
- ✅ Mantenha o código original intacto
- ✅ Documente todas as customizações

### 2. **Commits**
- ✅ Use mensagens descritivas: `feat:`, `fix:`, `docs:`
- ✅ Faça commits pequenos e frequentes
- ✅ Teste antes de fazer commit

### 3. **Branches**
- ✅ Use branches para cada feature
- ✅ Mantenha master sempre estável
- ✅ Delete branches após merge

### 4. **Testes**
- ✅ Teste localmente antes de push
- ✅ Verifique se não quebrou funcionalidades existentes
- ✅ Mantenha logs de erro

## 🔧 Configuração de Ambiente

### Variáveis de Ambiente
```bash
# Backend (.env)
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=atendechat
DB_USER=usuario
DB_PASS=senha

# Frontend (.env)
REACT_APP_BACKEND_URL=http://localhost:3000
REACT_APP_CUSTOM_FEATURE=true
```

### Dependências
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

## 🎯 Próximos Passos

1. **✅ Fork configurado** - Repositório criado e configurado
2. **🔄 Desenvolver primeira customização** - Implementar funcionalidade específica
3. **📝 Documentar customização** - Atualizar documentação
4. **🧪 Testar funcionamento** - Verificar se tudo funciona
5. **🚀 Deploy** - Colocar em produção (quando necessário)

---

**Última atualização:** 03/09/2025
