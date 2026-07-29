# 🍽️ Planejador de Cardápio - Guia Prático

## ⚡ Quick Start (5 minutos)

### 1. Preparar pasta:
```
cardapio/
├── index.html
├── css/style.css
├── js/app.js
└── fotos/ (opcional)
```

### 2. Rodar servidor:
```bash
python -m http.server 8000
# ou
python3 -m http.server 8000
```

### 3. Abrir navegador:
```
http://localhost:8000
```

**Pronto!** ✅ A app está rodando!

---

## 📋 Checklist: Você Tem Tudo?

```
Arquivos básicos:
☐ index.html           ← Página principal
☐ css/style.css        ← Estilos
☐ js/app.js            ← Lógica

Pastas:
☐ css/                 ← Subpasta
☐ js/                  ← Subpasta
☐ fotos/               ← Opcional
```

Se sim, pode rodar! ✅

---

## 🧪 Testar a App

### Checklist de Testes:

```
Página carrega?
☐ Abrir http://localhost:8000
☐ Deve aparecer "Planejador de Cardápio"

Receitas:
☐ Clique "➕ Nova Receita"
☐ Preencha nome, tipo, etc
☐ Clique "Salvar Receita"
☐ Deve aparecer na visão "Receitas"

Planejamento Semanal:
☐ Na abra "📅 Semanal"
☐ Clique em uma célula vazia
☐ Selecione uma receita
☐ Deve aparecer na tabela

Histórico:
☐ Clique "📊 Histórico"
☐ Clique "✓ Consumida" em uma refeição
☐ Deve aparecer nas estatísticas

Todos os testes passaram?
☐ Excelente! App funcionando!
```

---

## 🎯 Primeira Receita: Passo a Passo

Vamos criar a primeira receita juntos!

### Passo 1: Abrir modal
1. Clique no botão "➕ Nova Receita" no topo

### Passo 2: Preencher dados
```
Nome da Receita: Arroz com Feijão
Tipo de Refeição: Almoço
Categoria: Salgado

Ingredientes:
Arroz
Feijão
Cebola
Alho
Sal

Modo de Preparo:
1. Cozinhe o arroz
2. Cozinhe o feijão
3. Misture
```

### Passo 3: Salvar
Clique "Salvar Receita"

### Resultado:
- Aparece em "📚 Receitas"
- Pode usar em planejamentos
- Fica salvo no localStorage

---

## 📅 Planejar uma Semana

### Seção: Planejamento Semanal

1. **Abra a aba "📅 Semanal"**

2. **Escolha a semana:**
   - Use os botões "← Semana Anterior" e "Próxima Semana →"
   - Ou digite o número (1-52)

3. **Adicione refeição:**
   - Clique em uma célula vazia
   - Selecione a receita
   - Confirme

4. **Resultado:**
   - Aparece na tabela
   - Fica persistido em localStorage
   - Pode navegar e volta lá

### Exemplo Visual:

```
SEMANA 1

┌────────────┬───────────┬───────────────┐
│ Refeição   │ Segunda   │ Terça         │
├────────────┼───────────┼───────────────┤
│ Café       │ Pão       │ Bolo          │
│ Almoço     │ Arroz     │ Macarrão      │
│ Lanche     │ Fruta     │ Iogurte       │
│ Jantar     │ Sopa      │ Frango        │
└────────────┴───────────┴───────────────┘
```

---

## 🗓️ Planejar por Calendário

### Seção: Planejamento por Calendário

1. **Abra a aba "🗓️ Calendário"**

2. **Navegue até o mês:**
   - Use "← Anterior" e "Próximo →"

3. **Selecione uma data:**
   - Clique no dia no calendário
   - Dia fica destacado

4. **Adicione refeição:**
   - Clique "➕ Adicionar Refeição"
   - Selecione receita
   - Confirme

5. **Visualize:**
   - Dia fica com borda especial
   - "Detalhes da Data" mostra refeições

---

## 📊 Ver Histórico

### Como usar:

1. **Clique "📊 Histórico"** no menu superior

2. **Você verá:**
   - Cada receita que você já comeu
   - Quantas vezes comeu
   - Última vez que comeu
   - Dias desde o último uso

3. **Marcando como consumida:**
   - Em "📊 Diária", clique "✓ Consumida"
   - Registro é adicionado automaticamente
   - Estatísticas atualizam

### Exemplo:

```
Sopa de Legumes
├─ 5 vezes usada
├─ Última vez: 15/01/2024
└─ 3 dias desde o último uso
```

---

## 🔧 Customizar Tipos de Refeição

### Por padrão vem com:
- Café da Manhã
- Almoço
- Lanche
- Jantar
- Ceia

### Para adicionar novos tipos:

1. Clique "⚙️ Tipos de Refeição" no menu

2. Na modal que abre:
   - Digite um nome (ex: "Café da Tarde")
   - Clique "➕ Adicionar"

3. Novo tipo aparece:
   - Em "Nova Receita"
   - Na tabela semanal
   - Em todas as visões

### Para remover:

1. Abra "⚙️ Tipos de Refeição"

2. Clique "✕" no tipo que quer remover

3. Pronto! Desaparece de tudo

---

## 🖼️ Adicionar Fotos das Receitas (Bônus)

Se quiser adicionar imagens das receitas:

### 1. Preparar fotos:
- Comprima em TinyJPG.com
- Tamanho recomendado: 300x300px
- Coloque na pasta `fotos/`

### 2. Editar `js/app.js`:

Procure por `criarCardReceita()` e mude para:

```javascript
// Adicione isso ao objeto receita:
imagem: "fotos/arroz.jpg"

// E no card, adicione:
<img src="${receita.imagem}" alt="${receita.nome}">
```

### 3. Resultado:
- Imagem aparece no card
- Fica mais visual!

---

## 🐛 Troubleshooting

### Problema: "App não carrega"

**Solução:**
1. Abra DevTools (F12)
2. Vá em "Console"
3. Procure por erro (vermelho)
4. Copie o erro e procure no Google

**Erros comuns:**
```
❌ "Cannot read property of undefined"
✅ Significa: Algo não encontrado
✅ Solução: Verifique sintaxe no código

❌ "localhost:8000 refused"
✅ Significa: Servidor não rodando
✅ Solução: Execute "python -m http.server 8000"
```

---

### Problema: "Dados não salvam"

**Solução:**
1. localStorage pode estar desabilitado
2. Tente em modo anônimo/incógnito
3. Limpe cache do navegador

**Testar localStorage:**

No DevTools (F12), Console, digite:
```javascript
localStorage.setItem('teste', 'funcionando');
console.log(localStorage.getItem('teste'));
```

Se imprimir "funcionando", está OK!

---

### Problema: "Receitas não aparecem na tabela"

**Checklist:**
- ☐ Receita foi criada? (verifique em "📚 Receitas")
- ☐ Tipo de refeição corresponde?
- ☐ Semana está correta?
- ☐ Recarregue a página (Ctrl+F5)

---

## 📱 Testar no Celular

### Na mesma rede Wi-Fi:

**No PC:**
1. Abra terminal
2. `python -m http.server 8000`
3. Copie seu IP (`ipconfig` no Windows)
4. Aparece algo como: `192.168.1.100`

**No celular:**
1. Conecte na mesma Wi-Fi
2. Abra navegador
3. Digite: `http://192.168.1.100:8000`
4. Funciona igual!

---

## 🎨 Customizar Cores

Quer mudar as cores?

### Editar `css/style.css`:

Procure por `:root` no início:

```css
:root {
    --cor-primaria: #8B4513;      /* Marrom escuro */
    --cor-secundaria: #D2691E;    /* Chocolate */
    --cor-destaque: #FF8C00;      /* Laranja */
    /* ... mais cores */
}
```

Mude para suas cores! Por exemplo:

```css
--cor-primaria: #2E7D32;  /* Verde */
--cor-secundaria: #43A047; /* Verde mais claro */
--cor-destaque: #558B2F;   /* Verde escuro */
```

Salve e recarregue (Ctrl+F5). Mudou! ✨

---

## 💡 Dicas Úteis

### 1. Criar rotina semanal
- Planeje sempre segundas (por exemplo)
- Copie a semana anterior
- Faça pequenos ajustes

### 2. Manter histórico
- Marque sempre que comer
- Veja o que mais gosta
- Planeje com base nisso

### 3. Backup dos dados
No DevTools (F12), Console:
```javascript
JSON.stringify(localStorage)
```
Copie tudo e guarde em um arquivo .txt!

### 4. Restaurar de backup
No Console:
```javascript
// Cole seus dados aqui
JSON.parse('{"cardapio_receitas": ...}')
```

---

## 🚀 Próximos Passos

### Agora que está funcionando:

1. ✅ Crie suas receitas
2. ✅ Planeje uma semana
3. ✅ Use no dia a dia
4. ✅ Marque consumo
5. ✅ Veja histórico

### Depois, customize:

1. ✅ Mude cores
2. ✅ Adicione tipos de refeição
3. ✅ Adicione imagens das receitas
4. ✅ Leia o código

### Depois, expanda:

1. ✅ Adicione lista de compras
2. ✅ Integre com Google Drive
3. ✅ Faça backup automático
4. ✅ Exporte cardápio como PDF

---

## ✅ Checklist Final

Quando terminar:

- [ ] App rodando localmente
- [ ] Consegui criar receita
- [ ] Consegui planejar semana
- [ ] Consegui marcar consumo
- [ ] Consegui ver histórico
- [ ] Entendo como funciona
- [ ] Consegui customizar cores
- [ ] Consegui adicionar tipo refeição

**Se tudo marcado:** Parabéns! Você dominou a app! 🎉

---

**Dúvidas?** Releia este guia ou estude o código! 🚀
