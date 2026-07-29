# 🍽️ Planejador de Cardápio Inteligente

Um aplicativo web completo para **planejar refeições, gerenciar receitas e acompanhar histórico de consumo** - 100% offline e sem dependências externas.

---

## ⚡ Quick Start (5 minutos)

### 1. Estrutura pronta:
```
cardapio/
├── index.html
├── css/style.css
├── js/app.js
└── fotos/ (para imagens das receitas)
```

### 2. Rodar localmente:
```bash
python -m http.server 8000  # ou python3
```

### 3. Abrir:
```
http://localhost:8000
```

Pronto! 🚀

---

## 📋 Recursos

### ✅ Funcionalidades Implementadas

#### **1. Gestão de Receitas**
- Adicionar receitas com nome, tipo de refeição
- Customizar tipos de refeição (Café, Almoço, etc)
- Adicionar ingredientes (lista)
- Modo de preparo (instruções)
- Categoria (doce, salgado, vegetariano, etc)
- Deletar e editar receitas

#### **2. Planejamento Semanal**
- Visualizar semana com tabela (seg-dom)
- Arrastar receitas para dias/refeições
- Múltiplas semanas ao mesmo tempo
- Adicionar/remover refeições planejadas

#### **3. Planejamento por Calendário**
- Calendário interativo
- Selecionar datas específicas
- Atribuir receitas a datas

#### **4. Histórico e Estatísticas**
- Marcar refeição como "consumida"
- Contar quantas vezes foi usada
- Ver última data de uso
- Tempo desde último uso

#### **5. Visualizações**
- 📅 **Semanal** - Tabela com dias da semana
- 📆 **Mensal** - Múltiplas semanas
- 📊 **Diária** - Refeições do dia
- Alternar com **botões no topo**

#### **6. Armazenamento**
- Dados salvos em localStorage
- Funciona 100% offline
- Persiste entre acessos

---

## 🛠️ Tecnologia

- **HTML5** - Estrutura
- **CSS3** - Design responsivo
- **JavaScript (ES6)** - Lógica
- **LocalStorage** - Persistência
- **Fetch API** - Carregamento de dados

**Sem dependências externas!**

---

## 📱 Como Usar

### **Tela Inicial**
- Abas/botões para navegar entre visualizações
- Menu para gerenciar receitas

### **Gerenciar Receitas**
1. Clique em "Adicionar Receita"
2. Preencha nome, tipo, categoria
3. Adicione ingredientes e modo de preparo
4. Salve

### **Planejamento Semanal**
1. Escolha a semana
2. Clique no dia e refeição
3. Selecione a receita
4. Visualize na tabela

### **Planejamento por Calendário**
1. Clique no calendário
2. Escolha uma data
3. Selecione receita
4. Confirme

### **Histórico**
1. Veja receitas planejadas
2. Marque como "consumida"
3. Veja estatísticas

---

## 🎨 Design

Inspirado nas imagens que você enviou:
- Tabela semanal estilo cardápio
- Layout limpo e responsivo
- Cores warm (marrom, laranja, creme)
- Fácil de ler e usar

---

## 📚 Estrutura de Arquivos

```
cardapio/
├── 📄 README.md (este arquivo)
├── 📄 00_GUIA_COMPLETO.md (conceitos)
├── 📄 01_GUIA_PRATICO.md (implementação)
├── 📄 03_ROADMAP.md (aprendizado)
│
├── 💻 index.html (página)
├── 🎨 css/style.css (estilos)
├── ⚙️ js/app.js (lógica)
│
└── 📷 fotos/ (suas imagens)
```

---

## 💾 Dados e Estrutura

### Receita:
```javascript
{
  id: "receita_001",
  nome: "Sopa de Legumes",
  tipo: "Almoço",
  categoria: "Salgado",
  ingredientes: ["Cenoura", "Batata", "Água"],
  modoPreparo: "Cozinhar...",
  imagem: "fotos/sopa.jpg"
}
```

### Planejamento:
```javascript
{
  id: "plan_001",
  receitaId: "receita_001",
  data: "2024-01-15", // para calendário
  dia: "segunda", // para semanal
  semana: 1, // qual semana
  refeicao: "Almoço"
}
```

### Histórico:
```javascript
{
  id: "hist_001",
  receitaId: "receita_001",
  dataCriacao: "2024-01-01",
  dataUltimo: "2024-01-15",
  timesUsed: 5
}
```

---

## 🎯 Próximos Passos

1. ✅ Leia este README
2. ✅ Leia `00_GUIA_COMPLETO.md` (conceitos)
3. ✅ Siga `01_GUIA_PRATICO.md` (implementação)
4. ✅ Rode localmente e teste
5. ✅ Customize conforme quiser

---

## 📞 Dúvidas?

- Leia os guias
- Veja comentários no código
- Use DevTools (F12) para debugar

---

## ✨ Bônus

Ideias para expandir depois:
- [ ] Integração com lista de compras
- [ ] Sincronizar entre dispositivos
- [ ] Receitas com imagens
- [ ] Avaliação de receitas
- [ ] Sugestões de cardápio automáticas
- [ ] Exportar cardápio (PDF/imagem)

---

**Pronto para começar?** 🚀

Abra `00_GUIA_COMPLETO.md` →
