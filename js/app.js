/* ==================== OBJETO PRINCIPAL DA APP ====================
   Centraliza todo o estado da aplicação */

const app = {
    // Array de receitas
    receitas: [],

    // Array de planejamentos
    planejamentos: [],

    // Array de histórico de consumo
    historico: [],

    // Tipos de refeição customizáveis
    tiposRefeicao: ['Café da Manhã', 'Almoço', 'Lanche', 'Jantar', 'Ceia'],

    // Data/semana atual
    dataCurrent: new Date(),
    semanaAtual: 1,
    mesAtual: new Date().getMonth(),
    anoAtual: new Date().getFullYear(),
};

/* ==================== INICIALIZAÇÃO ====================
   Carrega dados e renderiza interface */

function inicializar() {
    console.log('🍽️ Inicializando app de cardápio...');

    // Carregar dados do localStorage
    carregarDados();

    // Preencher selects com tipos de refeição
    atualizarSelectTipos();

    // Preencher filtros de categoria
    atualizarFiltroCategoria();

    // Renderizar visão inicial
    renderizarSemanal();

    // Configurar evento de envio de formulário
    const formReceita = document.getElementById('form-receita');
    if (formReceita) {
        formReceita.addEventListener('submit', salvarReceita);
    }

    console.log('✅ App inicializada!');
}

/* ==================== ARMAZENAMENTO ====================
   Salvar e carregar dados do localStorage */

function salvarDados() {
    localStorage.setItem('cardapio_receitas', JSON.stringify(app.receitas));
    localStorage.setItem('cardapio_planejamentos', JSON.stringify(app.planejamentos));
    localStorage.setItem('cardapio_historico', JSON.stringify(app.historico));
    localStorage.setItem('cardapio_tipos', JSON.stringify(app.tiposRefeicao));
    console.log('💾 Dados salvos!');
}

function carregarDados() {
    app.receitas = JSON.parse(localStorage.getItem('cardapio_receitas')) || [];
    app.planejamentos = JSON.parse(localStorage.getItem('cardapio_planejamentos')) || [];
    app.historico = JSON.parse(localStorage.getItem('cardapio_historico')) || [];
    app.tiposRefeicao = JSON.parse(localStorage.getItem('cardapio_tipos')) || app.tiposRefeicao;
    console.log('📂 Dados carregados!');
}

/* ==================== NAVEGAÇÃO: TROCAR VISÃO ====================
   Mostrar/esconder visões principais */

function mostrarVisao(nomeVisao) {
    // Esconde todas as visões
    document.querySelectorAll('.visao').forEach(visao => {
        visao.style.display = 'none';
    });

    // Desativa todos os botões de aba
    document.querySelectorAll('.aba-btn').forEach(btn => {
        btn.classList.remove('ativo');
    });

    // Mostra a visão selecionada
    const visao = document.getElementById(`visao-${nomeVisao}`);
    if (visao) {
        visao.style.display = 'block';
    }

    // Marca botão como ativo
    event.target.classList.add('ativo');

    // Renderiza conteúdo apropriado
    if (nomeVisao === 'semanal') {
        renderizarSemanal();
    } else if (nomeVisao === 'mensal') {
        renderizarMensal();
    } else if (nomeVisao === 'diaria') {
        renderizarDiaria();
    } else if (nomeVisao === 'calendario') {
        renderizarCalendario();
    } else if (nomeVisao === 'receitas') {
        renderizarReceitas();
    }
}

/* ==================== VISÃO SEMANAL ====================
   Renderiza tabela com 7 dias da semana */

function renderizarSemanal() {
    const tbody = document.getElementById('corpo-tabela-semanal');
    tbody.innerHTML = '';

    // Para cada tipo de refeição
    app.tiposRefeicao.forEach(tipo => {
        const tr = document.createElement('tr');

        // Célula com nome da refeição
        let html = `<td class="refeicao-nome" style="font-weight: 600; background: #f0f0f0;">${tipo}</td>`;

        // Para cada dia da semana (segunda a domingo, mais sabado)
        const diasSemana = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

        diasSemana.forEach(dia => {
            // Buscar planejamento para esse dia/tipo/semana
            const plano = buscarPlanejamento(app.semanaAtual, dia, tipo);

            if (plano) {
                const receita = buscarReceita(plano.receitaId);
                html += `
                    <td onclick="abrirEdicaoPlanejamento('${plano.id}')">
                        <div class="celula-refeicao">
                            <div class="nome-refeicao">${receita.nome}</div>
                            <div class="tipo-refeicao-tabela">${receita.categoria || ''}</div>
                            <button onclick="event.stopPropagation(); removerPlanejamento('${plano.id}')" 
                                    style="background: #ff6b6b; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                                ✕
                            </button>
                        </div>
                    </td>
                `;
            } else {
                html += `
                    <td class="celula-vazia" onclick="abrirModalPlanejar('${app.semanaAtual}', '${dia}', '${tipo}')">
                        + Adicionar
                    </td>
                `;
            }
        });

        tr.innerHTML = html;
        tbody.appendChild(tr);
    });
}

function buscarPlanejamento(semana, dia, tipo) {
    return app.planejamentos.find(p => 
        p.semana === semana && 
        p.dia === dia && 
        p.refeicao === tipo &&
        p.tipo === 'semanal'
    );
}

function buscarReceita(id) {
    return app.receitas.find(r => r.id === id);
}

function abrirModalPlanejar(semana, dia, tipo) {
    // Guardar contexto
    window.contextoPlanejar = {
        modo: 'semanal',
        semana,
        dia,
        refeicao: tipo,
        planejamentoId: null,
    };

    renderizarReceitasModalSelecao();
    abrirModal('modal-selecionar-receita');
}

function abrirEdicaoPlanejamento(id) {
    const plano = app.planejamentos.find(p => p.id === id);
    if (!plano) return;

    window.contextoPlanejar = {
        modo: plano.tipo || 'semanal',
        semana: plano.semana,
        dia: plano.dia,
        data: plano.data,
        refeicao: plano.refeicao,
        planejamentoId: id,
    };

    renderizarReceitasModalSelecao();
    abrirModal('modal-selecionar-receita');
}

function renderizarReceitasModalSelecao() {
    // Renderizar lista de receitas no modal
    const lista = document.getElementById('lista-selecionar-receita');
    lista.innerHTML = '';

    if (app.receitas.length === 0) {
        lista.innerHTML = '<div class="sem-resultados">Nenhuma receita cadastrada ainda.</div>';
        return;
    }

    app.receitas.forEach(receita => {
        const div = document.createElement('div');
        div.className = 'card-receita';
        div.innerHTML = `
            <div class="card-receita-header">
                <div>
                    <h3>${receita.nome}</h3>
                    <div class="badge-tipo">${receita.tipo}</div>
                </div>
            </div>
            <div class="card-receita-content">
                <p>Categoria: ${receita.categoria || 'N/A'}</p>
                <button onclick="selecionarReceitaParaPlano('${receita.id}')" 
                        class="btn-principal" style="width: 100%;">
                    Selecionar
                </button>
            </div>
        `;
        lista.appendChild(div);
    });
}

function selecionarReceitaParaPlano(receitaId) {
    const ctx = window.contextoPlanejar;
    if (!ctx) return;

    const planejamentoExistente = ctx.planejamentoId
        ? app.planejamentos.find(p => p.id === ctx.planejamentoId)
        : null;

    if (planejamentoExistente) {
        planejamentoExistente.receitaId = receitaId;
        salvarDados();
        renderizarAposPlanejamento(ctx.modo);
        fecharModal('modal-selecionar-receita');
        console.log('Planejamento atualizado:', planejamentoExistente);
        return;
    }

    const isCalendario = ctx.modo === 'calendario';

    const planeamento = {
        id: 'plan_' + Date.now(),
        receitaId: receitaId,
        refeicao: ctx.refeicao,
        tipo: isCalendario ? 'calendario' : 'semanal',
        dataCriacao: new Date().toISOString(),
    };

    if (isCalendario) {
        planeamento.data = ctx.data;
    } else {
        planeamento.semana = ctx.semana;
        planeamento.dia = ctx.dia;
    }

    app.planejamentos.push(planeamento);
    salvarDados();
    renderizarAposPlanejamento(ctx.modo);
    fecharModal('modal-selecionar-receita');

    console.log('✅ Refeição planejada:', planeamento);
}

function renderizarAposPlanejamento(modo) {
    if (modo === 'calendario') {
        renderizarDiaria();
        renderizarCalendario();
    } else {
        renderizarSemanal();
        renderizarMensal();
    }
}

function removerPlanejamento(id) {
    if (confirm('Remover este planejamento?')) {
        app.planejamentos = app.planejamentos.filter(p => p.id !== id);
        salvarDados();
        renderizarSemanal();
        renderizarDiaria();
        renderizarCalendario();
    }
}

/* Navegação de semanas */
function semanaAnterior() {
    app.semanaAtual = Math.max(1, app.semanaAtual - 1);
    atualizarTituloSemana();
    renderizarSemanal();
}

function proxSemana() {
    app.semanaAtual = Math.min(52, app.semanaAtual + 1);
    atualizarTituloSemana();
    renderizarSemanal();
}

function mudarSemana(numero) {
    app.semanaAtual = parseInt(numero) || 1;
    atualizarTituloSemana();
    renderizarSemanal();
}

function atualizarTituloSemana() {
    document.getElementById('titulo-semana').textContent = `Semana ${app.semanaAtual}`;
    document.getElementById('numero-semana').value = app.semanaAtual;
}

/* ==================== VISÃO MENSAL ====================
   Renderiza múltiplas semanas do mês */

function renderizarMensal() {
    const container = document.getElementById('container-semanas-mensais');
    container.innerHTML = '';

    // Renderizar 4-5 semanas
    for (let i = 1; i <= 5; i++) {
        const semanaDiv = document.createElement('div');
        semanaDiv.className = 'semana-mensal';
        semanaDiv.innerHTML = `<h3>Semana ${i}</h3>`;

        // Criar tabela para cada semana
        const table = document.createElement('table');
        table.className = 'tabela-semanal';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Refeição</th>
                    <th>Dom</th>
                    <th>Seg</th>
                    <th>Ter</th>
                    <th>Qua</th>
                    <th>Qui</th>
                    <th>Sex</th>
                    <th>Sab</th>
                </tr>
            </thead>
            <tbody id="corpo-semana-${i}"></tbody>
        `;
        semanaDiv.appendChild(table);
        container.appendChild(semanaDiv);

        // Renderizar linhas da tabela
        const tbody = document.getElementById(`corpo-semana-${i}`);
        app.tiposRefeicao.forEach(tipo => {
            const tr = document.createElement('tr');
            let html = `<td style="font-weight: 600;">${tipo}</td>`;

            const diasSemana = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
            diasSemana.forEach(dia => {
                const plano = buscarPlanejamento(i, dia, tipo);
                if (plano) {
                    const receita = buscarReceita(plano.receitaId);
                    html += `<td><div class="celula-refeicao">${receita.nome}</div></td>`;
                } else {
                    html += `<td class="celula-vazia">-</td>`;
                }
            });

            tr.innerHTML = html;
            tbody.appendChild(tr);
        });
    }

    atualizarTituloMes();
}

function atualizarTituloMes() {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    document.getElementById('titulo-mes').textContent = 
        `${meses[app.mesAtual]} ${app.anoAtual}`;
}

function mesAnterior() {
    if (app.mesAtual === 0) {
        app.mesAtual = 11;
        app.anoAtual--;
    } else {
        app.mesAtual--;
    }
    renderizarMensal();
}

function proxMes() {
    if (app.mesAtual === 11) {
        app.mesAtual = 0;
        app.anoAtual++;
    } else {
        app.mesAtual++;
    }
    renderizarMensal();
}

/* ==================== VISÃO DIÁRIA ====================
   Refeições de um dia específico */

let dataDiaria = new Date();

function renderizarDiaria() {
    const container = document.getElementById('container-diaria');
    const titulo = document.getElementById('titulo-dia');
    container.innerHTML = '';

    // Formatar data
    const opcoes = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dataFormatada = dataDiaria.toLocaleDateString('pt-BR', opcoes);
    titulo.textContent = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);

    // Buscar refeições planejadas para essa data
    const dataString = dataDiaria.toISOString().split('T')[0];

    app.tiposRefeicao.forEach(tipo => {
        const plano = app.planejamentos.find(p => 
            p.data === dataString && p.refeicao === tipo && p.tipo === 'calendario'
        );

        const card = document.createElement('div');
        card.className = 'card-diario';
        card.innerHTML = `
            <h3>${tipo}</h3>
        `;

        if (plano) {
            const receita = buscarReceita(plano.receitaId);
            card.innerHTML += `
                <p><strong>${receita.nome}</strong></p>
                <p>Categoria: ${receita.categoria || 'N/A'}</p>
                <button onclick="marcarComoConsumida('${receita.id}')">✓ Consumida</button>
                <button onclick="removerPlanejamento('${plano.id}')" style="background: #e74c3c;">Remover</button>
            `;
        } else {
            card.innerHTML += `
                <p style="color: #999;">Sem refeição planejada</p>
                <button onclick="abrirModalPlanejarData('${dataString}', '${tipo}')">
                    ➕ Adicionar
                </button>
            `;
        }

        container.appendChild(card);
    });
}

function diaAnterior() {
    dataDiaria.setDate(dataDiaria.getDate() - 1);
    renderizarDiaria();
}

function proximoDia() {
    dataDiaria.setDate(dataDiaria.getDate() + 1);
    renderizarDiaria();
}

function mudarDataDiaria(data) {
    dataDiaria = new Date(data + 'T00:00:00');
    renderizarDiaria();
}

function abrirModalPlanejarData(data, tipo) {
    window.contextoPlanejar = {
        modo: 'calendario',
        data,
        refeicao: tipo,
        planejamentoId: null,
    };

    renderizarReceitasModalSelecao();
    abrirModal('modal-selecionar-receita');
}

function selecionarReceitaParaPlanoDia(receitaId) {
    selecionarReceitaParaPlano(receitaId);
}

/* ==================== VISÃO CALENDÁRIO ====================
   Calendário interativo com datas */

let mesCalendario = new Date().getMonth();
let anoCalendario = new Date().getFullYear();
let dataSelecionada = null;

function renderizarCalendario() {
    const container = document.getElementById('calendario');
    container.innerHTML = '';

    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    // Atualizar título
    document.getElementById('titulo-calendario').textContent = 
        `${meses[mesCalendario]} ${anoCalendario}`;

    // Primeiro dia do mês
    const primeiro = new Date(anoCalendario, mesCalendario, 1);
    const ultimo = new Date(anoCalendario, mesCalendario + 1, 0);
    const diasAnterior = primeiro.getDay();

    // Dias do mês anterior
    const diasMesAnterior = new Date(anoCalendario, mesCalendario, 0).getDate();
    for (let i = diasAnterior - 1; i >= 0; i--) {
        const dia = diasMesAnterior - i;
        const div = criarDiaCalendario(dia, true);
        container.appendChild(div);
    }

    // Dias do mês
    for (let dia = 1; dia <= ultimo.getDate(); dia++) {
        const div = criarDiaCalendario(dia, false);
        container.appendChild(div);
    }

    // Dias do mês seguinte
    const diasRestantes = 42 - (diasAnterior + ultimo.getDate());
    for (let dia = 1; dia <= diasRestantes; dia++) {
        const div = criarDiaCalendario(dia, true);
        container.appendChild(div);
    }

    // Atualizar detalhes se tem data selecionada
    if (dataSelecionada) {
        atualizarDetalhesData(dataSelecionada);
    }
}

function criarDiaCalendario(dia, outroMes) {
    const div = document.createElement('div');
    div.className = 'dia-calendario';

    if (outroMes) {
        div.classList.add('outro-mes');
        div.textContent = dia;
    } else {
        const hoje = new Date();
        const data = new Date(anoCalendario, mesCalendario, dia);

        if (hoje.toDateString() === data.toDateString()) {
            div.classList.add('hoje');
        }

        if (dataSelecionada && dataSelecionada.toDateString() === data.toDateString()) {
            div.classList.add('selecionado');
        }

        div.textContent = dia;
        div.onclick = () => selecionarDataCalendario(data);

        // Verificar se tem refeição
        const dataStr = data.toISOString().split('T')[0];
        if (app.planejamentos.some(p => p.data === dataStr)) {
            div.classList.add('com-refeicao');
        }
    }

    return div;
}

function selecionarDataCalendario(data) {
    dataSelecionada = data;
    renderizarCalendario();
}

function atualizarDetalhesData(data) {
    const dataStr = data.toISOString().split('T')[0];
    const opcoes = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('data-selecionada').textContent = 
        data.toLocaleDateString('pt-BR', opcoes).charAt(0).toUpperCase() +
        data.toLocaleDateString('pt-BR', opcoes).slice(1);

    const refeicoes = document.getElementById('refeicoes-data');
    refeicoes.innerHTML = '';

    app.tiposRefeicao.forEach(tipo => {
        const plano = app.planejamentos.find(p => 
            p.data === dataStr && p.refeicao === tipo && p.tipo === 'calendario'
        );

        const div = document.createElement('div');
        div.className = 'item-refeicao-data';

        if (plano) {
            const receita = buscarReceita(plano.receitaId);
            div.innerHTML = `
                <strong>${tipo}:</strong> ${receita ? receita.nome : 'Receita removida'}
                <button onclick="abrirEdicaoPlanejamento('${plano.id}')"
                        style="background: #8B4513; color: white; border: none; margin-left: 10px; padding: 2px 6px; cursor: pointer; border-radius: 3px;">
                    Trocar
                </button>
                <button onclick="removerPlanejamento('${plano.id}')" 
                        style="background: #e74c3c; color: white; border: none; margin-left: 10px; padding: 2px 6px; cursor: pointer; border-radius: 3px;">
                    ✕
                </button>
            `;
        } else {
            div.innerHTML = `
                <strong>${tipo}:</strong> (vazio)
                <button onclick="abrirModalPlanejarData('${dataStr}', '${tipo}')"
                        style="background: #8B4513; color: white; border: none; margin-left: 10px; padding: 2px 6px; cursor: pointer; border-radius: 3px;">
                    Adicionar
                </button>
            `;
        }

        refeicoes.appendChild(div);
    });
}

function adicionarRefeicaoData() {
    if (!dataSelecionada) {
        alert('Selecione uma data primeiro!');
        return;
    }

    const tipos = app.tiposRefeicao.join(', ');
    const tipoEscolhido = prompt(`Qual tipo de refeicao deseja adicionar?\nOpcoes: ${tipos}`, app.tiposRefeicao[0]);

    if (!tipoEscolhido) return;

    const tipo = app.tiposRefeicao.find(t => t.toLowerCase() === tipoEscolhido.trim().toLowerCase());
    if (!tipo) {
        alert('Tipo de refeicao nao encontrado.');
        return;
    }

    const dataStr = dataSelecionada.toISOString().split('T')[0];
    abrirModalPlanejarData(dataStr, tipo);
}

function mesCalendarioAnterior() {
    if (mesCalendario === 0) {
        mesCalendario = 11;
        anoCalendario--;
    } else {
        mesCalendario--;
    }
    renderizarCalendario();
}

function proxMesCalendario() {
    if (mesCalendario === 11) {
        mesCalendario = 0;
        anoCalendario++;
    } else {
        mesCalendario++;
    }
    renderizarCalendario();
}

/* ==================== RECEITAS ====================
   Gerenciar receitas */

function abrirModalReceita() {
    // Limpar formulário
    document.getElementById('form-receita').reset();
    document.getElementById('form-receita').dataset.receitaId = '';
    document.querySelector('.modal-content h2').textContent = 'Nova Receita';
    abrirModal('modal-receita');
}

function salvarReceita(e) {
    e.preventDefault();

    const id = document.getElementById('form-receita').dataset.receitaId || 'receita_' + Date.now();
    const receita = {
        id: id,
        nome: document.getElementById('nome-receita').value,
        tipo: document.getElementById('tipo-refeicao').value,
        categoria: document.getElementById('categoria-receita').value,
        ingredientes: document.getElementById('ingredientes-receita').value
            .split('\n')
            .filter(i => i.trim()),
        modoPreparo: document.getElementById('preparo-receita').value,
        dataCriacao: new Date().toISOString(),
    };

    // Verificar se é edi ção ou novo
    const indice = app.receitas.findIndex(r => r.id === id);
    if (indice >= 0) {
        app.receitas[indice] = receita;
    } else {
        app.receitas.push(receita);
    }

    salvarDados();
    fecharModal('modal-receita');
    renderizarReceitas();

    console.log('✅ Receita salva:', receita);
}

function renderizarReceitas() {
    const container = document.getElementById('lista-receitas');
    container.innerHTML = '';

    if (app.receitas.length === 0) {
        container.innerHTML = '<div class="sem-resultados">Nenhuma receita. <strong>Adicione uma!</strong></div>';
        return;
    }

    app.receitas.forEach(receita => {
        const card = document.createElement('div');
        card.className = 'card-receita';
        card.innerHTML = `
            <div class="card-receita-header">
                <div>
                    <h3>${receita.nome}</h3>
                    <div class="badge-tipo">${receita.tipo}</div>
                </div>
            </div>
            <div class="card-receita-content">
                ${receita.categoria ? `<span class="badge-categoria">${receita.categoria}</span>` : ''}
                ${receita.ingredientes.length > 0 ? `
                    <p><strong>Ingredientes:</strong><br>${receita.ingredientes.slice(0, 3).join('<br>')}</p>
                ` : ''}
                <div class="card-receita-actions">
                    <button class="btn-editar" onclick="editarReceita('${receita.id}')">✏️ Editar</button>
                    <button class="btn-deletar" onclick="deletarReceita('${receita.id}')">🗑️ Deletar</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function editarReceita(id) {
    const receita = buscarReceita(id);
    if (!receita) return;

    document.getElementById('form-receita').dataset.receitaId = id;
    document.getElementById('nome-receita').value = receita.nome;
    document.getElementById('tipo-refeicao').value = receita.tipo;
    document.getElementById('categoria-receita').value = receita.categoria;
    document.getElementById('ingredientes-receita').value = receita.ingredientes.join('\n');
    document.getElementById('preparo-receita').value = receita.modoPreparo;
    document.querySelector('.modal-content h2').textContent = 'Editar Receita';

    abrirModal('modal-receita');
}

function deletarReceita(id) {
    if (confirm('Deletar esta receita?')) {
        app.receitas = app.receitas.filter(r => r.id !== id);
        app.planejamentos = app.planejamentos.filter(p => p.receitaId !== id);
        salvarDados();
        renderizarReceitas();
    }
}

function filtrarReceitas() {
    const termo = document.getElementById('busca-receitas').value.toLowerCase();
    const categoria = document.getElementById('filtro-categoria').value;

    const cards = document.querySelectorAll('.card-receita');
    cards.forEach(card => {
        const nome = card.querySelector('h3').textContent.toLowerCase();
        const temCategoria = !categoria || card.textContent.includes(categoria);
        const temTermo = nome.includes(termo);

        card.style.display = temTermo && temCategoria ? 'block' : 'none';
    });
}

function atualizarFiltroCategoria() {
    const select = document.getElementById('filtro-categoria');
    const categorias = new Set();

    app.receitas.forEach(r => {
        if (r.categoria) categorias.add(r.categoria);
    });

    categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });
}

function buscarReceitasModal() {
    const termo = document.getElementById('busca-selecionar').value.toLowerCase();
    const cards = document.querySelectorAll('.lista-receitas-modal .card-receita');

    cards.forEach(card => {
        const nome = card.querySelector('h3').textContent.toLowerCase();
        card.style.display = nome.includes(termo) ? 'block' : 'none';
    });
}

/* ==================== TIPOS DE REFEIÇÃO ====================
   Gerenciar tipos customizados */

function abrirTiposRefeicao() {
    abrirModal('modal-tipos-refeicao');
    renderizarTiposRefeicao();
}

function adicionarTipoRefeicao() {
    const novoTipo = document.getElementById('novo-tipo-refeicao').value.trim();

    if (!novoTipo) {
        alert('Digite um tipo de refeição!');
        return;
    }

    if (app.tiposRefeicao.includes(novoTipo)) {
        alert('Este tipo já existe!');
        return;
    }

    app.tiposRefeicao.push(novoTipo);
    salvarDados();
    atualizarSelectTipos();
    document.getElementById('novo-tipo-refeicao').value = '';
    renderizarTiposRefeicao();

    console.log('✅ Tipo de refeição adicionado:', novoTipo);
}

function removerTipoRefeicao(tipo) {
    if (confirm(`Remover "${tipo}"?`)) {
        app.tiposRefeicao = app.tiposRefeicao.filter(t => t !== tipo);
        salvarDados();
        atualizarSelectTipos();
        renderizarTiposRefeicao();
    }
}

function renderizarTiposRefeicao() {
    const container = document.getElementById('lista-tipos-refeicao');
    container.innerHTML = '';

    app.tiposRefeicao.forEach(tipo => {
        const badge = document.createElement('div');
        badge.className = 'badge-tipo-removivel';
        badge.innerHTML = `
            ${tipo}
            <button onclick="removerTipoRefeicao('${tipo}')">✕</button>
        `;
        container.appendChild(badge);
    });
}

function atualizarSelectTipos() {
    const select = document.getElementById('tipo-refeicao');
    select.innerHTML = '';

    app.tiposRefeicao.forEach(tipo => {
        const option = document.createElement('option');
        option.value = tipo;
        option.textContent = tipo;
        select.appendChild(option);
    });
}

/* ==================== HISTÓRICO ====================
   Acompanhar consumo de receitas */

function abrirHistorico() {
    abrirModal('modal-historico');
    renderizarHistorico();
}

function marcarComoConsumida(receitaId) {
    let item = app.historico.find(h => h.receitaId === receitaId);

    if (!item) {
        item = {
            receitaId: receitaId,
            dataCriacao: new Date().toISOString(),
            dataUltimo: new Date().toISOString(),
            timesUsed: 1,
        };
        app.historico.push(item);
    } else {
        item.dataUltimo = new Date().toISOString();
        item.timesUsed++;
    }

    salvarDados();
    console.log('✅ Consumo registrado:', item);
    alert('Refeição marcada como consumida!');
}

function renderizarHistorico() {
    const container = document.getElementById('lista-historico');
    container.innerHTML = '';

    if (app.historico.length === 0) {
        container.innerHTML = '<div class="sem-resultados">Nenhum histórico registrado ainda.</div>';
        return;
    }

    app.historico.forEach(item => {
        const receita = buscarReceita(item.receitaId);
        if (!receita) return;

        const dataUltimo = new Date(item.dataUltimo);
        const agora = new Date();
        const diferenca = Math.floor((agora - dataUltimo) / (1000 * 60 * 60 * 24));

        const div = document.createElement('div');
        div.className = 'item-historico';
        div.innerHTML = `
            <h3>${receita.nome}</h3>
            <div class="stat-historico">
                <div class="stat-box">
                    <div class="stat-numero">${item.timesUsed}</div>
                    <div class="stat-label">Vezes Usada</div>
                </div>
                <div class="stat-box">
                    <div class="stat-numero">${diferenca}</div>
                    <div class="stat-label">Dias desde o último uso</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Última vez</div>
                    <div class="stat-numero" style="font-size: 12px;">${dataUltimo.toLocaleDateString('pt-BR')}</div>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

/* ==================== MODAIS ====================
   Abrir e fechar popups */

function abrirModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'flex';
    }
}

function fecharModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Fechar modal clicando fora
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

/* ==================== INICIAR ====================
   Quando página carrega */

window.addEventListener('DOMContentLoaded', inicializar);
