# 🍽️ Planejador de Cardápio - Guia Educativo Completo

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura da App](#arquitetura)
3. [Estrutura de Dados](#estrutura-de-dados)
4. [Fluxo de Funcionamento](#fluxo-de-funcionamento)
5. [Como Funciona Cada Visão](#como-funciona-cada-visão)
6. [Armazenamento](#armazenamento)
7. [Como Estudar o Código](#como-estudar-o-código)

---

## Visão Geral

Este é um **aplicativo web para planejar refeições** que permite:

### ✅ O que você pode fazer:
1. **Adicionar receitas** com nome, tipo e categoria
2. **Planejar refeições** em 4 visualizações diferentes:
   - Semanal (7 dias)
   - Mensal (múltiplas semanas)
   - Diária (um dia específico)
   - Por calendário (datas específicas)
3. **Rastrear consumo** - marcar quando comeu
4. **Ver estatísticas** - quantas vezes usou cada receita

### 🎯 Objetivo:
Facilitar o planejamento de cardápio de forma **simples, visual e intuitiva**.

---

## Arquitetura

### 🏗️ Como a app é estruturada:

```
┌─────────────────────────────┐
│      index.html             │
│   (estrutura - HTML)        │
├─────────────────────────────┤
│      css/style.css          │
│   (visual e layout - CSS)   │
├─────────────────────────────┤
│      js/app.js              │
│ (lógica e funcionamento - JS)│
├─────────────────────────────┤
│   localStorage (navegador)  │
│   (armazena os dados)       │
└─────────────────────────────┘
```

### 📱 Camadas:

1. **HTML** - Estrutura (o que existe)
2. **CSS** - Presentação (como se vê)
3. **JavaScript** - Lógica (como funciona)
4. **LocalStorage** - Persistência (onde guardar)

---

## Estrutura de Dados

### 📊 Como os dados são organizados:

#### 1. **Receita**
```javascript
{
  id: "receita_1234567890",           // ID único
  nome: "Sopa de Legumes",            // Nome da receita
  tipo: "Almoço",                     // Tipo de refeição
  categoria: "Salgado",               // Categoria (opcional)
  ingredientes: [                     // Lista de ingredientes
    "Cenoura",
    "Batata",
    "Água"
  ],
  modoPreparo: "Cozinhar por 30 min", // Instruções
  dataCriacao: "2024-01-15T10:30:00"  // Data de criação
}
```

#### 2. **Planejamento Semanal**
```javascript
{
  id: "plan_1234567890",              // ID único
  receitaId: "receita_1234567890",    // Qual receita
  semana: 1,                          // Qual semana (1-52)
  dia: "segunda",                     // Qual dia
  refeicao: "Almoço",                 // Qual tipo de refeição
  tipo: "semanal",                    // Tipo de planejamento
  dataCriacao: "2024-01-15T10:30:00"  // Quando foi planejado
}
```

#### 3. **Planejamento por Data**
```javascript
{
  id: "plan_1234567890",              // ID único
  receitaId: "receita_1234567890",    // Qual receita
  data: "2024-01-15",                 // Data específica
  refeicao: "Almoço",                 // Qual tipo
  tipo: "calendario",                 // Tipo de planejamento
  dataCriacao: "2024-01-15T10:30:00"  // Quando foi planejado
}
```

#### 4. **Histórico de Consumo**
```javascript
{
  receitaId: "receita_1234567890",    // Qual receita
  dataCriacao: "2024-01-01T10:00:00", // Primeira vez que usou
  dataUltimo: "2024-01-15T12:30:00",  // Última vez que usou
  timesUsed: 5                        // Quantas vezes usou
}
```

---

## Fluxo de Funcionamento

### 🔄 Como tudo funciona junto:

```
USUÁRIO ABRE A APP
        ↓
  inicializar()
        ↓
  carregarDados()
  (do localStorage)
        ↓
  renderizarSemanal()
  (mostra interface)
        ↓
USUÁRIO INTERAGE
(clica em botões)
        ↓
  Funções JavaScript
  executam (ex: salvarReceita)
        ↓
  Dados são atualizados
  (app.receitas, etc)
        ↓
  salvarDados()
  (guardar em localStorage)
        ↓
  Renderizar novamente
  (atualizar visual)
        ↓
RESULTADO NA TELA
```

---

## Como Funciona Cada Visão

### 1️⃣ **SEMANAL**

**O que é:** Tabela com 7 dias da semana.

**Como funciona:**
```javascript
// Estrutura:
┌────────────┬─────────┬────────────┬─────────────┬────────┐
│ Refeição   │ Domingo │ Segunda    │ Terça       │ ...    │
├────────────┼─────────┼────────────┼─────────────┼────────┤
│ Café       │ Pão     │ Bolo       │ Tapioca     │ ...    │
│ Almoço     │ Arroz   │ Macarrão   │ Feijão      │ ...    │
│ Lanche     │ Fruta   │ Iogurte    │ Bolo        │ ...    │
│ Jantar     │ Sopa    │ Frango     │ Peixe       │ ...    │
└────────────┴─────────┴────────────┴─────────────┴────────┘
```

**Principais funções:**
- `renderizarSemanal()` - Desenha a tabela
- `buscarPlanejamento()` - Acha receita para dia/tipo
- `semanaAnterior()` / `proxSemana()` - Navegar semanas

---

### 2️⃣ **MENSAL**

**O que é:** Múltiplas tabelas de semanas.

**Como funciona:**
```
Semana 1 | ████████
Semana 2 | ████████
Semana 3 | ████████
Semana 4 | ████████
Semana 5 | ████████
```

**Principais funções:**
- `renderizarMensal()` - Renderiza 5 semanas
- `mesAnterior()` / `proxMes()` - Navegar meses

---

### 3️⃣ **DIÁRIA**

**O que é:** Refeições de um dia em cards.

**Como funciona:**
```
Segunda, 15 de Janeiro
┌──────────────────────────┐
│ Café da Manhã            │
│ Pão com queijo           │
│ ✓ Consumida              │
└──────────────────────────┘
┌──────────────────────────┐
│ Almoço                   │
│ Arroz, feijão, frango    │
│ (sem refeição)           │
│ ➕ Adicionar             │
└──────────────────────────┘
```

**Principais funções:**
- `renderizarDiaria()` - Desenha cards
- `diaAnterior()` / `proximoDia()` - Navegar dias
- `mudarDataDiaria()` - Mudar data manualmente

---

### 4️⃣ **CALENDÁRIO**

**O que é:** Calendário + detalhes da data selecionada.

**Como funciona:**
```
         JANEIRO 2024
Dom Seg Ter Qua Qui Sex Sab
  1   2   3   4   5   6   7
  8   9  10 [15] 16  17  18
 22  23  24  25  26  27  28

Detalhes de 15 de Janeiro:
┌──────────────────────┐
│ Café: Pão com queijo │
│ Almoço: Arroz        │
│ Lanche: Fruta        │
│ Jantar: (vazio)      │
└──────────────────────┘
```

**Principais funções:**
- `renderizarCalendario()` - Desenha calendário
- `selecionarDataCalendario()` - Seleciona data
- `atualizarDetalhesData()` - Mostra refeições

---

### 5️⃣ **RECEITAS**

**O que é:** Lista de todas as receitas criadas.

**Como funciona:**
```
┌─────────────────────────────────┐
│ Sopa de Legumes                 │
│ 🏷️ Almoço | 📌 Salgado          │
│ Ingredientes: Cenoura, Batata   │
│ ✏️ Editar  |  🗑️ Deletar        │
└─────────────────────────────────┘
```

**Principais funções:**
- `renderizarReceitas()` - Desenha cards
- `abrirModalReceita()` - Abrir form de criar
- `editarReceita()` - Editar existente
- `deletarReceita()` - Deletar receita

---

## Armazenamento

### 💾 Como os dados são salvos:

**localStorage** é um armazenamento do navegador que **persiste dados**:

```javascript
// Salvar (em app.js)
function salvarDados() {
    // Converte para texto JSON
    localStorage.setItem('cardapio_receitas', 
        JSON.stringify(app.receitas));
    localStorage.setItem('cardapio_planejamentos', 
        JSON.stringify(app.planejamentos));
    localStorage.setItem('cardapio_historico', 
        JSON.stringify(app.historico));
    localStorage.setItem('cardapio_tipos', 
        JSON.stringify(app.tiposRefeicao));
}

// Carregar (em app.js)
function carregarDados() {
    // Transforma texto JSON em objeto
    app.receitas = JSON.parse(
        localStorage.getItem('cardapio_receitas')) || [];
    // ... mais dados
}
```

**Vantagens:**
- ✅ Dados persistem entre acessos
- ✅ Funciona offline
- ✅ Sem servidor necessário

**Desvantagens:**
- ❌ Só no navegador atual (não sincroniza)
- ❌ Limite de ~5-10MB por domínio

---

## Como Estudar o Código

### 📚 **Ordem recomendada:**

1. **Entender a estrutura**
   - Leia `index.html`
   - Procure por comentários `<!-- ==================== -->`
   - Entenda as abas, modais, visões

2. **Entender o visual**
   - Abra `css/style.css`
   - Procure por `:root` (as cores)
   - Veja `.tabela-semanal`, `.card-receita`, etc

3. **Entender a lógica**
   - Abra `js/app.js`
   - Comece com `const app = {...}`
   - Leia `inicializar()`
   - Depois `renderizarSemanal()`
   - Depois `salvarReceita()`

4. **Seguir um fluxo completo**
   - Clique em "➕ Nova Receita"
   - Veja qual função é chamada
   - Siga a lógica até salvar

---

## Principais Conceitos JavaScript

### 🎓 Coisas que você vai aprender:

1. **Selecionando elementos do HTML**
   ```javascript
   const elemento = document.getElementById('id');
   const elementos = document.querySelectorAll('.classe');
   ```

2. **Alterando o HTML**
   ```javascript
   elemento.innerHTML = '<p>Novo conteúdo</p>';
   elemento.style.display = 'none';
   elemento.classList.add('ativo');
   ```

3. **Armazenando dados**
   ```javascript
   localStorage.setItem('chave', valor);
   const valor = localStorage.getItem('chave');
   ```

4. **Manipulando arrays**
   ```javascript
   app.receitas.push(novaReceita);          // Adiciona
   app.receitas.filter(r => r.id === id);  // Filtra
   app.receitas.map(r => r.nome);          // Transforma
   ```

5. **Eventos**
   ```javascript
   button.addEventListener('click', funcao);
   input.onchange = funcao;
   form.onsubmit = funcao;
   ```

---

## Dúvidas Comuns

**P: Por que usar localStorage?**
R: Porque funciona offline e não precisa de servidor. Simples e direto.

**P: Posso sincronizar entre dispositivos?**
R: Não, localStorage é só do navegador. Para sincronizar, precisaria de um servidor.

**P: Posso adicionar imagens das receitas?**
R: Sim! Adicione um campo `imagem` na receita e use `<img src="">`.

**P: Quantas receitas posso adicionar?**
R: Bastante! localStorage tem limite de ~5MB, que dá para ~1000 receitas simples.

---

**Próximo passo:** Leia `01_GUIA_PRATICO.md` para implementar! 🚀
