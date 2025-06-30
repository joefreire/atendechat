# Estrutura Modular dos Scripts

Este diretório contém a versão modular do gerenciador de stacks Docker, dividida em arquivos especializados para melhor organização e manutenção.

## 📁 Estrutura de Arquivos

```
scripts/
├── main.sh          # Script principal com menu e parsing de argumentos
├── utils.sh         # Funções utilitárias (cores, validações, dependências)
├── instances.sh     # Gerenciamento de instâncias (JSON)
├── stacks.sh        # Funções de gerenciamento de stacks Docker
└── README.md        # Esta documentação
```

## 🔧 Arquivos

### `main.sh`
- **Função**: Script principal que orquestra todos os comandos
- **Conteúdo**:
  - Carregamento dos módulos
  - Menu principal de comandos
  - Função `show_help()` - Documentação completa
  - Função `parse_args()` - Processamento de argumentos
  - Lógica de roteamento de comandos

### `utils.sh`
- **Função**: Funções utilitárias e de validação
- **Conteúdo**:
  - Definição de cores para output
  - `check_port_usage()` - Verifica se porta está em uso
  - `validate_ports()` - Valida portas backend/frontend
  - `check_dependencies()` - Verifica dependências do sistema
  - `calculate_resources()` - Calcula distribuição de recursos
  - `set_default_env_vars()` - Define variáveis padrão

### `instances.sh`
- **Função**: Gerenciamento de instâncias salvas em JSON
- **Conteúdo**:
  - `init_instances_file()` - Inicializa arquivo JSON
  - `save_instance()` - Salva configuração de instância
  - `load_instance()` - Carrega configuração salva
  - `update_instance()` - Atualiza timestamp
  - `list_instances()` - Lista todas as instâncias
  - `remove_instance()` - Remove instância do arquivo
  - `validate_instance()` - Valida existência da instância

### `stacks.sh`
- **Função**: Operações com stacks Docker
- **Conteúdo**:
  - `rollback_stack()` - Rollback em caso de erro
  - `up_stack()` - Inicia nova stack
  - `down_stack()` - Para stack
  - `list_stacks()` - Lista stacks Docker
  - `logs_stack()` - Mostra logs
  - `status_stack()` - Mostra status
  - `restart_stack()` - Reinicia stack
  - `update_stack()` - Atualiza imagens Docker

## 🚀 Como Usar

### Script Wrapper (Recomendado)
```bash
./manage-stacks-new.sh up -n codatende1 -b 3000 -f 3001
./manage-stacks-new.sh instances
./manage-stacks-new.sh --help
```

### Script Principal Direto
```bash
./scripts/main.sh up -n codatende1 -b 3000 -f 3001
./scripts/main.sh instances
./scripts/main.sh --help
```

## 🔄 Migração do Script Original

O script original `manage-stacks.sh` foi dividido em módulos mantendo:
- ✅ Toda a funcionalidade original
- ✅ Compatibilidade com argumentos
- ✅ Mensagens e cores
- ✅ Validações e verificações
- ✅ Gerenciamento de instâncias

## 📝 Vantagens da Estrutura Modular

1. **Manutenibilidade**: Cada arquivo tem responsabilidade específica
2. **Legibilidade**: Código mais organizado e fácil de entender
3. **Reutilização**: Funções podem ser importadas independentemente
4. **Testabilidade**: Cada módulo pode ser testado separadamente
5. **Extensibilidade**: Fácil adicionar novos módulos ou funcionalidades

## 🛠️ Desenvolvimento

Para adicionar novas funcionalidades:

1. **Novas funções utilitárias**: Adicione em `utils.sh`
2. **Novas operações de stack**: Adicione em `stacks.sh`
3. **Novos comandos**: Adicione em `main.sh`
4. **Novas funcionalidades de instância**: Adicione em `instances.sh`

## 🔍 Debugging

Para debugar um módulo específico:
```bash
# Testar apenas utils
source scripts/utils.sh
check_dependencies

# Testar apenas instances
source scripts/instances.sh
list_instances
```

## 📋 Dependências

Os scripts mantêm as mesmas dependências do original:
- Docker
- Docker Compose
- jq (opcional, mas recomendado)
- bc (para cálculos)
- curl (para health checks) 