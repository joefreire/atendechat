# 🔌 APIs Customizadas - Atendechat

## 📋 Endpoints Customizados

### Backend APIs

#### GET /api/custom/endpoint
**Descrição:** Descrição da nova API customizada.

**Parâmetros:**
- `param1`: string - Descrição do parâmetro
- `param2`: number - Descrição do parâmetro

**Resposta:**
```json
{
  "success": true,
  "data": {
    "message": "Exemplo de resposta"
  }
}
```

**Exemplo de uso:**
```javascript
// Frontend
const response = await api.get('/api/custom/endpoint', {
  params: {
    param1: 'valor1',
    param2: 123
  }
});
```

### Frontend Services

#### CustomService.js
**Descrição:** Service customizado para funcionalidades específicas.

**Métodos:**
- `customMethod()` - Descrição do método
- `anotherMethod()` - Descrição do método

**Exemplo:**
```javascript
import { CustomService } from '../custom/services/CustomService';

const customService = new CustomService();
const result = await customService.customMethod();
```

## 🔧 Configurações Customizadas

### Variáveis de Ambiente
```bash
# Backend (.env)
CUSTOM_FEATURE_ENABLED=true
CUSTOM_API_KEY=your_api_key

# Frontend (.env)
REACT_APP_CUSTOM_FEATURE=true
REACT_APP_CUSTOM_API_URL=https://api.example.com
```

### Configurações de Banco
```sql
-- Tabelas customizadas
CREATE TABLE custom_table (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

**Última atualização:** 03/09/2025
