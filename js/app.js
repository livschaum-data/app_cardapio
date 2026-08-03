/* ==================== OBJETO PRINCIPAL DA APP ====================
   Centraliza todo o estado da aplicacao */

const app = {
    // Array de receitas
    receitas: [],

    // Array de planejamentos
    planejamentos: [],

    // Array de historico de consumo
    historico: [],

    // Tipos de refeicao customizaveis
    tiposRefeicao: ['Café da Manhã', 'Almoço', 'Lanche', 'Jantar', 'Ceia'],

    // Categorias customizaveis de receitas
    categorias: ['Doce', 'Salgado', 'Vegetariano', 'Vegan', 'Sem Glúten', 'Sem Lactose'],

    // Tags customizaveis de receitas
    tags: ['bebê', 'sem glúten', 'sem lactose', 'dia a dia'],

    // Data/semana atual
    dataCurrent: new Date(),
    semanaAtual: obterNumeroSemana(new Date()),
    mesAtual: new Date().getMonth(),
    anoAtual: new Date().getFullYear(),

    // Supabase
    supabase: null,
    supabaseOnline: false,
    usuarioSupabase: null,
    supabaseStatus: 'offline',
    supabaseMensagem: 'Nuvem desconectada',
    salvandoRemoto: false,
    salvarRemotoPendente: false,
    atualizadoEm: null,
};

/* ==================== INICIALIZACAO ====================
   Carrega dados e renderiza interface */

async function inicializar() {
    console.log('Inicializando app de cardapio...');

    configurarEventosNuvem();

    // Carregar dados locais primeiro; a nuvem entra depois se houver conta conectada.
    configurarSupabase();
    await carregarDados();
    await inicializarSessaoNuvem();

    // Preencher selects com tipos de refeicao
    atualizarSelectTipos();

    // Preencher selects e filtros de categoria
    normalizarCategorias();
    atualizarSelectCategorias();
    atualizarFiltroCategoria();
    normalizarTags();
    atualizarSelectTags();

    // Renderizar visao inicial
    renderizarSemanal();

    // Configurar evento de envio de formulario
    const formReceita = document.getElementById('form-receita');
    if (formReceita) {
        formReceita.addEventListener('submit', salvarReceita);
    }

    const btnCategorias = document.getElementById('btn-categorias');
    if (btnCategorias) {
        btnCategorias.addEventListener('click', abrirCategorias);
    }

    const btnTags = document.getElementById('btn-tags');
    if (btnTags) {
        btnTags.addEventListener('click', abrirTags);
    }

    console.log('App inicializada!');
}

/* ==================== ARMAZENAMENTO ====================
   Salvar e carregar dados do localStorage */

function salvarDadosLegado() {
    marcarDadosAlterados();
    localStorage.setItem('cardapio_receitas', JSON.stringify(app.receitas));
    localStorage.setItem('cardapio_planejamentos', JSON.stringify(app.planejamentos));
    localStorage.setItem('cardapio_historico', JSON.stringify(app.historico));
    localStorage.setItem('cardapio_tipos', JSON.stringify(app.tiposRefeicao));
    localStorage.setItem('cardapio_categorias', JSON.stringify(app.categorias));
    localStorage.setItem('cardapio_tags', JSON.stringify(app.tags));
    localStorage.setItem('cardapio_atualizado_em', app.atualizadoEm);
    console.log('Dados salvos!');
}

function carregarDadosLegado() {
    app.receitas = JSON.parse(localStorage.getItem('cardapio_receitas')) || [];
    app.planejamentos = JSON.parse(localStorage.getItem('cardapio_planejamentos')) || [];
    app.historico = JSON.parse(localStorage.getItem('cardapio_historico')) || [];
    app.tiposRefeicao = JSON.parse(localStorage.getItem('cardapio_tipos')) || app.tiposRefeicao;
    app.categorias = JSON.parse(localStorage.getItem('cardapio_categorias')) || app.categorias;
    app.tags = JSON.parse(localStorage.getItem('cardapio_tags')) || app.tags;
    app.atualizadoEm = localStorage.getItem('cardapio_atualizado_em') || app.atualizadoEm;
    console.log('Dados carregados!');
}

/* ==================== NAVEGACAO: TROCAR VISAO ====================
   Mostrar/esconder visoes principais */

function configurarSupabase() {
    const config = window.CARDAPIO_SUPABASE;
    const sdkDisponivel = window.supabase && typeof window.supabase.createClient === 'function';
    const supabaseUrl = limparUrlSupabase(config?.url || '');

    if (!config || !supabaseUrl || !config.anonKey) {
        app.supabaseOnline = false;
        app.supabaseStatus = 'offline';
        app.supabaseMensagem = 'Nuvem não configurada';
        atualizarStatusNuvem();
        console.log('Supabase nao configurado. Usando localStorage.');
        return false;
    }

    if (!sdkDisponivel) {
        app.supabaseOnline = false;
        app.supabaseStatus = 'offline';
        app.supabaseMensagem = 'SDK da nuvem carregando';
        atualizarStatusNuvem();
        console.log('SDK do Supabase indisponivel no momento.');
        return false;
    }

    if (app.supabase) {
        return true;
    }

    app.supabase = window.supabase.createClient(supabaseUrl, config.anonKey);
    atualizarStatusNuvem('offline', 'Entre na conta para sincronizar');
    console.log('Supabase configurado.');
    return true;
}

function limparUrlSupabase(url) {
    return String(url)
        .trim()
        .replace(/\/rest\/v1\/?$/i, '')
        .replace(/\/+$/, '');
}

function atualizarStatusNuvem(status = app.supabaseStatus, mensagem = app.supabaseMensagem) {
    app.supabaseStatus = status;
    app.supabaseMensagem = mensagem;

    const indicador = document.getElementById('status-nuvem-indicador');
    const texto = document.getElementById('status-nuvem-texto');
    const botao = document.getElementById('btn-conectar-nuvem');
    const statusPainel = document.getElementById('nuvem-status');

    if (statusPainel) {
        statusPainel.textContent = mensagem;
        statusPainel.className = `texto-ajuda ${status}`.trim();
    }

    if (!indicador || !texto || !botao) {
        return;
    }

    indicador.className = `status-indicador status-${status}`;
    texto.textContent = mensagem;
    botao.dataset.status = status;
}

async function conectarNuvem() {
    const conectado = configurarSupabase();
    if (!conectado) {
        atualizarStatusNuvem(app.supabaseStatus, app.supabaseMensagem);
        return;
    }

    await inicializarSessaoNuvem();
}

function configurarEventosNuvem() {
    const eventos = [
        ['nuvem-entrar', entrarNuvem],
        ['nuvem-criar-conta', criarContaNuvem],
        ['nuvem-sair', sairNuvem],
        ['nuvem-sincronizar', sincronizarSupabase],
        ['nuvem-baixar', () => baixarDadosSupabase()],
        ['nuvem-enviar', () => enviarDadosSupabase()],
    ];

    eventos.forEach(([id, acao]) => {
        const botao = document.getElementById(id);
        if (!botao || botao.dataset.eventoConfigurado === 'true') return;
        botao.addEventListener('click', acao);
        botao.dataset.eventoConfigurado = 'true';
    });
}

async function inicializarSessaoNuvem() {
    if (!app.supabase) {
        atualizarUINuvem(null);
        return false;
    }

    atualizarStatusNuvem('conectando', 'Verificando conta na nuvem...');
    const { data, error } = await app.supabase.auth.getSession();

    if (error) {
        app.usuarioSupabase = null;
        app.supabaseOnline = false;
        atualizarUINuvem(null);
        atualizarStatusNuvem('erro', error.message);
        return false;
    }

    app.usuarioSupabase = data.session?.user || null;
    app.supabaseOnline = Boolean(app.usuarioSupabase);
    atualizarUINuvem(app.usuarioSupabase);

    if (!app.usuarioSupabase) {
        atualizarStatusNuvem('offline', 'Entre na conta para sincronizar');
        return false;
    }

    await baixarDadosSupabase({ silencioso: true });
    atualizarStatusNuvem('online', 'Nuvem conectada');
    return true;
}

function atualizarUINuvem(usuario) {
    const login = document.getElementById('nuvem-login');
    const logado = document.getElementById('nuvem-logado');
    const usuarioEl = document.getElementById('nuvem-usuario');

    if (login) login.style.display = usuario ? 'none' : 'grid';
    if (logado) logado.style.display = usuario ? 'grid' : 'none';
    if (usuarioEl) usuarioEl.textContent = usuario ? `Conectado como ${usuario.email}` : '';
}

function alternarPainelNuvem(forcarAbrir = null) {
    const painel = document.getElementById('painel-nuvem');
    if (!painel) return;

    const abrir = forcarAbrir === null ? painel.style.display === 'none' : Boolean(forcarAbrir);
    painel.style.display = abrir ? 'grid' : 'none';
    document.getElementById('btn-conectar-nuvem')?.setAttribute('aria-expanded', String(abrir));

    if (abrir) conectarNuvem();
}

function fecharPainelNuvem() {
    const painel = document.getElementById('painel-nuvem');
    if (painel) painel.style.display = 'none';
    document.getElementById('btn-conectar-nuvem')?.setAttribute('aria-expanded', 'false');
}

function obterCredenciaisNuvem() {
    const email = document.getElementById('nuvem-email')?.value?.trim();
    const password = document.getElementById('nuvem-senha')?.value || '';

    if (!email || !password) {
        alert('Preencha email e senha.');
        return null;
    }

    return { email, password };
}

function obterUrlRedirectNuvem() {
    return window.location.origin + window.location.pathname;
}

async function entrarNuvem() {
    if (!configurarSupabase()) return;

    const credenciais = obterCredenciaisNuvem();
    if (!credenciais) return;

    atualizarStatusNuvem('conectando', 'Entrando na nuvem...');
    const { data, error } = await app.supabase.auth.signInWithPassword(credenciais);

    if (error) {
        atualizarStatusNuvem('erro', error.message);
        return false;
    }

    app.usuarioSupabase = data.session?.user || data.user;
    app.supabaseOnline = Boolean(app.usuarioSupabase);
    atualizarUINuvem(app.usuarioSupabase);
    await baixarDadosSupabase();
    return true;
}

async function criarContaNuvem() {
    if (!configurarSupabase()) return;

    const credenciais = obterCredenciaisNuvem();
    if (!credenciais) return;

    atualizarStatusNuvem('conectando', 'Criando conta...');
    const { data, error } = await app.supabase.auth.signUp({
        email: credenciais.email,
        password: credenciais.password,
        options: {
            emailRedirectTo: obterUrlRedirectNuvem(),
        },
    });

    if (error) {
        atualizarStatusNuvem('erro', error.message);
        return false;
    }

    if (!data.session) {
        atualizarStatusNuvem('online', 'Conta criada. Confirme o email e depois entre.');
        return true;
    }

    app.usuarioSupabase = data.session.user;
    app.supabaseOnline = true;
    atualizarUINuvem(app.usuarioSupabase);
    await enviarDadosSupabase({ silencioso: true });
    atualizarStatusNuvem('online', 'Conta criada e sincronizada');
    return true;
}

async function sairNuvem() {
    if (!app.supabase) return;

    await app.supabase.auth.signOut();
    app.usuarioSupabase = null;
    app.supabaseOnline = false;
    atualizarUINuvem(null);
    atualizarStatusNuvem('offline', 'Nuvem desconectada');
}

async function sincronizarSupabase() {
    if (!app.supabase || !app.usuarioSupabase) {
        atualizarStatusNuvem('erro', 'Entre na conta antes de sincronizar');
        return false;
    }

    atualizarStatusNuvem('salvando', 'Sincronizando...');
    await baixarDadosSupabase({ silencioso: true });
    const enviou = await enviarDadosSupabase({ silencioso: true, mesclarAntes: false });

    if (enviou) {
        atualizarStatusNuvem('online', 'Sincronizado com a nuvem');
    }

    return enviou;
}

async function baixarDadosSupabase({ silencioso = false } = {}) {
    if (!app.supabase || !app.usuarioSupabase) {
        atualizarStatusNuvem('erro', 'Entre na conta antes de baixar');
        return false;
    }

    if (!silencioso) atualizarStatusNuvem('conectando', 'Baixando dados da nuvem...');

    try {
        const dadosRemotos = await carregarDadosSupabase();

        if (dadosRemotos) {
            if (dadosLocaisMaisRecentesQueNuvem(dadosRemotos)) {
                await enviarDadosSupabase({ silencioso: true, mesclarAntes: false });
                if (!silencioso) atualizarStatusNuvem('online', 'Dados locais eram mais recentes e foram enviados para a nuvem');
                return true;
            }

            aplicarDados(dadosRemotos);
            salvarDadosLocais();
            renderizarTudoAposSync();
            if (!silencioso) atualizarStatusNuvem('online', 'Dados baixados da nuvem');
            return true;
        }

        await enviarDadosSupabase({ silencioso: true, mesclarAntes: false });
        if (!silencioso) atualizarStatusNuvem('online', 'Nuvem iniciada com os dados locais');
        return true;
    } catch (error) {
        atualizarStatusNuvem('erro', 'Erro ao baixar da nuvem');
        console.error('Erro ao baixar do Supabase:', error);
        return false;
    }
}

function obterTimestamp(valor) {
    const data = valor ? new Date(valor) : null;
    return data && !Number.isNaN(data.getTime()) ? data.getTime() : 0;
}

function dadosLocaisMaisRecentesQueNuvem(dadosRemotos) {
    const local = obterTimestamp(app.atualizadoEm);
    const remoto = obterTimestamp(dadosRemotos?.atualizadoEm);

    if (!local) return false;
    if (!remoto) return true;

    return local > remoto;
}

async function enviarDadosSupabase({ silencioso = false, mesclarAntes = false } = {}) {
    if (!app.supabase || !app.usuarioSupabase) {
        atualizarStatusNuvem('erro', 'Entre na conta antes de enviar');
        return false;
    }

    if (mesclarAntes) {
        await baixarDadosSupabase({ silencioso: true });
    }

    if (!silencioso) atualizarStatusNuvem('salvando', 'Enviando dados para a nuvem...');
    await salvarDadosSupabase();

    if (app.supabaseOnline) {
        if (!silencioso) atualizarStatusNuvem('online', 'Dados enviados para a nuvem');
        return true;
    }

    return false;
}

function renderizarTudoAposSync() {
    atualizarSelectTipos();
    atualizarSelectCategorias();
    atualizarFiltroCategoria();
    atualizarSelectTags();
    renderizarSemanal();
    renderizarMensal();
    renderizarDiaria();
    renderizarCalendario();
    renderizarReceitas();
}

function aplicarDados(dados) {
    if (!dados) return;

    app.receitas = Array.isArray(dados.receitas) ? dados.receitas : [];
    app.planejamentos = Array.isArray(dados.planejamentos) ? dados.planejamentos : [];
    app.historico = Array.isArray(dados.historico) ? dados.historico : [];
    app.tiposRefeicao = Array.isArray(dados.tiposRefeicao) && dados.tiposRefeicao.length > 0
        ? dados.tiposRefeicao
        : app.tiposRefeicao;
    app.categorias = Array.isArray(dados.categorias) && dados.categorias.length > 0
        ? dados.categorias
        : app.categorias;
    app.tags = Array.isArray(dados.tags) && dados.tags.length > 0
        ? dados.tags
        : app.tags;
    app.atualizadoEm = dados.atualizadoEm || app.atualizadoEm;

    if (normalizarEncodingApp()) {
        marcarDadosAlterados();
        salvarDadosLocais();
    }
}

function normalizarEncodingApp() {
    const antes = JSON.stringify({
        receitas: app.receitas,
        planejamentos: app.planejamentos,
        historico: app.historico,
        tiposRefeicao: app.tiposRefeicao,
        categorias: app.categorias,
        tags: app.tags,
    });

    app.receitas = normalizarEncodingValor(app.receitas);
    app.planejamentos = normalizarEncodingValor(app.planejamentos);
    app.historico = normalizarEncodingValor(app.historico);
    app.tiposRefeicao = normalizarEncodingValor(app.tiposRefeicao);
    app.categorias = normalizarEncodingValor(app.categorias);
    app.tags = normalizarEncodingValor(app.tags);

    const depois = JSON.stringify({
        receitas: app.receitas,
        planejamentos: app.planejamentos,
        historico: app.historico,
        tiposRefeicao: app.tiposRefeicao,
        categorias: app.categorias,
        tags: app.tags,
    });

    return antes !== depois;
}

function normalizarEncodingValor(valor) {
    if (typeof valor === 'string') {
        return corrigirTextoEncoding(valor);
    }

    if (Array.isArray(valor)) {
        return valor.map(item => normalizarEncodingValor(item));
    }

    if (valor && typeof valor === 'object') {
        const corrigido = {};
        Object.entries(valor).forEach(([chave, item]) => {
            corrigido[chave] = normalizarEncodingValor(item);
        });
        return corrigido;
    }

    return valor;
}

function corrigirTextoEncoding(texto) {
    if (!/[\u00c3\u00c2\u00e2\u00f0\u00ef\uFFFD]/.test(texto)) return texto;

    let atual = texto;
    for (let i = 0; i < 3; i++) {
        const corrigido = decodificarWindows1252ComoUtf8(atual);
        if (corrigido === atual) break;
        atual = corrigido;
    }

    return atual
        .replace(/\uFFFD/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function decodificarWindows1252ComoUtf8(texto) {
    if (typeof TextDecoder === 'undefined') return texto;

    const mapaWindows1252 = {
        0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84,
        0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88,
        0x2030: 0x89, 0x0160: 0x8a, 0x2039: 0x8b, 0x0152: 0x8c,
        0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92, 0x201c: 0x93,
        0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
        0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b,
        0x0153: 0x9c, 0x017e: 0x9e, 0x0178: 0x9f,
    };

    const bytes = [];
    for (const caractere of texto) {
        const codigo = caractere.codePointAt(0);
        if (codigo <= 0xff) {
            bytes.push(codigo);
        } else if (mapaWindows1252[codigo]) {
            bytes.push(mapaWindows1252[codigo]);
        } else {
            return texto;
        }
    }

    try {
        return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes));
    } catch {
        return texto;
    }
}

function carregarDadosLocais() {
    return {
        receitas: JSON.parse(localStorage.getItem('cardapio_receitas')) || [],
        planejamentos: JSON.parse(localStorage.getItem('cardapio_planejamentos')) || [],
        historico: JSON.parse(localStorage.getItem('cardapio_historico')) || [],
        tiposRefeicao: JSON.parse(localStorage.getItem('cardapio_tipos')) || app.tiposRefeicao,
        categorias: JSON.parse(localStorage.getItem('cardapio_categorias')) || app.categorias,
        tags: JSON.parse(localStorage.getItem('cardapio_tags')) || app.tags,
        atualizadoEm: localStorage.getItem('cardapio_atualizado_em') || null,
    };
}

function salvarDadosLocais() {
    localStorage.setItem('cardapio_receitas', JSON.stringify(app.receitas));
    localStorage.setItem('cardapio_planejamentos', JSON.stringify(app.planejamentos));
    localStorage.setItem('cardapio_historico', JSON.stringify(app.historico));
    localStorage.setItem('cardapio_tipos', JSON.stringify(app.tiposRefeicao));
    localStorage.setItem('cardapio_categorias', JSON.stringify(app.categorias));
    localStorage.setItem('cardapio_tags', JSON.stringify(app.tags));
    if (app.atualizadoEm) {
        localStorage.setItem('cardapio_atualizado_em', app.atualizadoEm);
    }
}

async function carregarDadosSupabase() {
    if (!app.usuarioSupabase) return null;

    const config = window.CARDAPIO_SUPABASE;
    const { data, error } = await app.supabase
        .from(config.table)
        .select('receitas, planejamentos, historico, tipos_refeicao, categorias, tags, atualizado_em')
        .eq('user_id', app.usuarioSupabase.id)
        .eq('id', config.recordId)
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
        receitas: data.receitas,
        planejamentos: data.planejamentos,
        historico: data.historico,
        tiposRefeicao: data.tipos_refeicao,
        categorias: data.categorias,
        tags: data.tags,
        atualizadoEm: data.atualizado_em,
    };
}

async function salvarDadosSupabase() {
    if (!app.supabaseOnline || !app.usuarioSupabase) return;

    if (app.salvandoRemoto) {
        app.salvarRemotoPendente = true;
        return;
    }

    const config = window.CARDAPIO_SUPABASE;
    app.salvandoRemoto = true;
    app.salvarRemotoPendente = false;
    atualizarStatusNuvem('salvando', 'Salvando na nuvem...');

    const { error } = await app.supabase
        .from(config.table)
        .upsert({
            id: config.recordId,
            user_id: app.usuarioSupabase.id,
            receitas: app.receitas,
            planejamentos: app.planejamentos,
            historico: app.historico,
            tipos_refeicao: app.tiposRefeicao,
            categorias: app.categorias,
            tags: app.tags,
            atualizado_em: app.atualizadoEm || new Date().toISOString(),
        }, { onConflict: 'user_id,id' });

    app.salvandoRemoto = false;

    if (error) {
        app.supabaseOnline = false;
        atualizarStatusNuvem('erro', 'Erro ao salvar na nuvem');
        console.error('Erro ao salvar no Supabase:', error);
        return;
    }

    atualizarStatusNuvem('online', 'Nuvem conectada');
    console.log('Dados salvos no Supabase.');

    if (app.salvarRemotoPendente) {
        salvarDadosSupabase();
    }
}

function salvarDados() {
    marcarDadosAlterados();
    salvarDadosLocais();
    salvarDadosSupabase();
    console.log('Dados salvos localmente.');
}

function marcarDadosAlterados() {
    app.atualizadoEm = new Date().toISOString();
}

async function carregarDados() {
    const dadosLocais = carregarDadosLocais();
    aplicarDados(dadosLocais);

    if (!app.supabaseOnline) {
        console.log('Dados carregados do localStorage.');
        return;
    }

    try {
        const dadosRemotos = await carregarDadosSupabase();

        if (dadosRemotos) {
            aplicarDados(dadosRemotos);
            salvarDadosLocais();
            console.log('Dados carregados do Supabase.');
            return;
        }

        if (app.receitas.length || app.planejamentos.length || app.historico.length) {
            await salvarDadosSupabase();
            console.log('Dados locais enviados ao Supabase.');
        }
    } catch (error) {
        app.supabaseOnline = false;
        atualizarStatusNuvem('erro', 'Erro ao conectar nuvem');
        console.error('Nao foi possivel carregar do Supabase. Usando localStorage:', error);
    }
}

function mostrarVisao(nomeVisao) {
    // Esconde todas as visoes
    document.querySelectorAll('.visao').forEach(visao => {
        visao.style.display = 'none';
    });

    // Desativa todos os botoes de aba
    document.querySelectorAll('.aba-btn').forEach(btn => {
        btn.classList.remove('ativo');
    });

    // Mostra a visao selecionada
    const visao = document.getElementById(`visao-${nomeVisao}`);
    if (visao) {
        visao.style.display = 'block';
    }

    const botaoAtivo = event?.target || document.querySelector(`.aba-btn[onclick*="${nomeVisao}"]`);
    if (botaoAtivo) {
        botaoAtivo.classList.add('ativo');
    }

    // Renderiza conteudo apropriado
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

const DIAS_SEMANA = [
    { chave: 'segunda', nome: 'Segunda', abrev: 'Seg' },
    { chave: 'terca', nome: 'Terca', abrev: 'Ter', aliases: ['terça', 'terça'] },
    { chave: 'quarta', nome: 'Quarta', abrev: 'Qua' },
    { chave: 'quinta', nome: 'Quinta', abrev: 'Qui' },
    { chave: 'sexta', nome: 'Sexta', abrev: 'Sex' },
    { chave: 'sabado', nome: 'Sabado', abrev: 'Sab', aliases: ['sábado', 'sábado'] },
    { chave: 'domingo', nome: 'Domingo', abrev: 'Dom' },
];

function normalizarDiaSemana(dia) {
    const valor = String(dia || '').toLowerCase();
    if (valor.startsWith('ter')) return 'terca';
    if (valor.startsWith('sab') || valor.includes('bado')) return 'sabado';
    const item = DIAS_SEMANA.find(d => d.chave === valor || d.aliases?.includes(valor));
    return item?.chave || valor;
}

function formatarDataChave(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

function criarDataLocal(dataStr) {
    return new Date(`${dataStr}T00:00:00`);
}

function obterNumeroSemana(data) {
    const inicioAno = new Date(data.getFullYear(), 0, 1);
    const inicioPrimeiraSemana = new Date(inicioAno);
    inicioPrimeiraSemana.setDate(inicioAno.getDate() - obterIndiceSemanaSegunda(inicioAno));
    const diferencaDias = Math.floor((data - inicioPrimeiraSemana) / 86400000);
    return Math.floor(diferencaDias / 7) + 1;
}

function obterIndiceSemanaSegunda(data) {
    return (data.getDay() + 6) % 7;
}

function obterInicioSemana(numeroSemana, ano = app.anoAtual) {
    const primeiroDiaAno = new Date(ano, 0, 1);
    const inicio = new Date(primeiroDiaAno);
    inicio.setDate(primeiroDiaAno.getDate() - obterIndiceSemanaSegunda(primeiroDiaAno) + ((Number(numeroSemana) - 1) * 7));
    return inicio;
}

function obterDataSemanaDia(semana, dia, ano = app.anoAtual) {
    const inicio = obterInicioSemana(semana, ano);
    const indiceDia = DIAS_SEMANA.findIndex(d => d.chave === normalizarDiaSemana(dia));
    const data = new Date(inicio);
    data.setDate(inicio.getDate() + Math.max(indiceDia, 0));
    return data;
}

function obterSemanaDiaPorData(data) {
    return {
        semana: obterNumeroSemana(data),
        dia: DIAS_SEMANA[obterIndiceSemanaSegunda(data)].chave,
    };
}

function buscarPlanejamentoPorData(dataStr, tipo) {
    return buscarPlanejamentosPorData(dataStr, tipo)[0] || null;
}

function buscarPlanejamentosPorData(dataStr, tipo) {
    const data = criarDataLocal(dataStr);
    const legado = obterSemanaDiaPorData(data);

    return app.planejamentos.filter(p =>
        p.data === dataStr &&
        p.refeicao === tipo
    ).concat(app.planejamentos.filter(p =>
        !p.data &&
        Number(p.semana) === legado.semana &&
        normalizarDiaSemana(p.dia) === legado.dia &&
        p.refeicao === tipo
    ));
}

function renderizarResumoReceitaPlano(plano, compacto = false) {
    const receita = buscarReceita(plano.receitaId);

    if (!receita) {
        return `
            <div class="celula-refeicao receita-removida">
                <div class="conteudo-planejamento">
                    <div class="nome-refeicao">Receita removida</div>
                </div>
                <div class="acoes-planejamento-mini">
                    <button onclick="event.stopPropagation(); abrirEdicaoPlanejamento('${plano.id}')"
                            class="btn-editar-mini">
                        Editar
                    </button>
                    <button onclick="event.stopPropagation(); removerPlanejamento('${plano.id}')"
                            class="btn-remover-mini">
                        Remover
                    </button>
                </div>
            </div>
        `;
    }

    return `
        <div class="celula-refeicao">
            <div class="conteudo-planejamento">
                <div class="nome-refeicao">${receita.nome}</div>
                ${compacto ? '' : `<div class="tipo-refeicao-tabela">${receita.categoria || ''}</div>`}
            </div>
            <div class="acoes-planejamento-mini">
                <button onclick="event.stopPropagation(); abrirEdicaoPlanejamento('${plano.id}')"
                        class="btn-editar-mini">
                    Editar
                </button>
                <button onclick="event.stopPropagation(); removerPlanejamento('${plano.id}')"
                        class="btn-remover-mini">
                    Remover
                </button>
            </div>
        </div>
    `;
}

function renderizarListaPlanejamentos(planos, compacto = false) {
    return `
        <div class="lista-planejamentos-refeicao">
            ${planos.map(plano => renderizarResumoReceitaPlano(plano, compacto)).join('')}
        </div>
    `;
}

/* ==================== VISAO SEMANAL ====================
   Renderiza tabela com 7 dias da semana */

function renderizarSemanal() {
    const tbody = document.getElementById('corpo-tabela-semanal');
    tbody.innerHTML = '';
    atualizarTituloSemana();
    atualizarCabecalhoSemanal();

    app.tiposRefeicao.forEach(tipo => {
        const tr = document.createElement('tr');
        let html = `<td class="refeicao-nome" style="font-weight: 600; background: #f0f0f0;">${tipo}</td>`;

        DIAS_SEMANA.forEach(diaInfo => {
            const data = obterDataSemanaDia(app.semanaAtual, diaInfo.chave);
            const dataStr = formatarDataChave(data);
            const planos = buscarPlanejamentos(app.semanaAtual, diaInfo.chave, tipo);

            if (planos.length > 0) {
                html += `
                    <td>
                        ${renderizarListaPlanejamentos(planos)}
                        <button class="btn-adicionar-mini" onclick="abrirModalPlanejar('${app.semanaAtual}', '${diaInfo.chave}', '${tipo}', '${dataStr}')">
                            Adicionar
                        </button>
                    </td>
                `;
            } else {
                html += `
                    <td class="celula-vazia" onclick="abrirModalPlanejar('${app.semanaAtual}', '${diaInfo.chave}', '${tipo}', '${dataStr}')">
                        + Adicionar
                    </td>
                `;
            }
        });

        tr.innerHTML = html;
        tbody.appendChild(tr);
    });
}

function atualizarCabecalhoSemanal() {
    const tabela = document.querySelector('#visao-semanal .tabela-semanal thead tr');
    if (!tabela) return;

    const inicio = obterInicioSemana(app.semanaAtual);
    tabela.innerHTML = '<th>Refeicao</th>' + DIAS_SEMANA.map((dia, indice) => {
        const data = new Date(inicio);
        data.setDate(inicio.getDate() + indice);
        return `<th>${dia.nome}<br><span class="data-cabecalho">${data.getDate()}/${data.getMonth() + 1}</span></th>`;
    }).join('');
}

function buscarPlanejamento(semana, dia, tipo) {
    return buscarPlanejamentos(semana, dia, tipo)[0] || null;
}

function buscarPlanejamentos(semana, dia, tipo) {
    const dataStr = formatarDataChave(obterDataSemanaDia(semana, dia));

    const planejamentosData = buscarPlanejamentosPorData(dataStr, tipo);
    const ids = new Set(planejamentosData.map(p => p.id));
    const planejamentosLegados = app.planejamentos.filter(p =>
        Number(p.semana) === Number(semana) &&
        normalizarDiaSemana(p.dia) === normalizarDiaSemana(dia) &&
        p.refeicao === tipo &&
        !ids.has(p.id)
    );

    return planejamentosData.concat(planejamentosLegados);
}
function buscarReceita(id) {
    return app.receitas.find(r => r.id === id);
}

function abrirModalPlanejar(semana, dia, tipo, data = '') {
    // Guardar contexto
    window.contextoPlanejar = {
        modo: 'semanal',
        semana,
        dia: normalizarDiaSemana(dia),
        data: data || formatarDataChave(obterDataSemanaDia(semana, dia)),
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
        dia: normalizarDiaSemana(plano.dia),
        data: plano.data || (plano.semana && plano.dia ? formatarDataChave(obterDataSemanaDia(plano.semana, plano.dia)) : ''),
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
                    ${renderizarBadgesTipos(receita)}
                </div>
            </div>
            <div class="card-receita-content">
                <p>Categoria: ${receita.categoria || 'N/A'}</p>
                ${renderizarBadgesTags(receita)}
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
        planejamentoExistente.refeicao = ctx.refeicao;
        planejamentoExistente.data = ctx.data || planejamentoExistente.data;
        planejamentoExistente.semana = ctx.semana || planejamentoExistente.semana;
        planejamentoExistente.dia = ctx.dia || planejamentoExistente.dia;
        planejamentoExistente.tipo = ctx.modo === 'calendario' ? 'calendario' : 'semanal';
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
        data: ctx.data,
        semana: ctx.semana,
        dia: ctx.dia,
        dataCriacao: new Date().toISOString(),
    };

    app.planejamentos.push(planeamento);
    salvarDados();
    renderizarAposPlanejamento(ctx.modo);
    fecharModal('modal-selecionar-receita');

    console.log('Refeicao planejada:', planeamento);
}

function renderizarAposPlanejamento(modo) {
    renderizarSemanal();
    renderizarMensal();
    renderizarDiaria();
    renderizarCalendario();
}

function removerPlanejamento(id) {
    if (confirm('Remover este planejamento?')) {
        app.planejamentos = app.planejamentos.filter(p => p.id !== id);
        salvarDados();
        renderizarTudoAposSync();
    }
}

/* Navegacao de semanas */
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
    const inicio = obterInicioSemana(app.semanaAtual);
    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
    document.getElementById('titulo-semana').textContent =
        `Semana ${app.semanaAtual} (${inicio.getDate()}/${inicio.getMonth() + 1} a ${fim.getDate()}/${fim.getMonth() + 1})`;
    document.getElementById('numero-semana').value = app.semanaAtual;
}

/* ==================== VISAO MENSAL ====================
   Renderiza multiplas semanas do mes */

function renderizarMensal() {
    const container = document.getElementById('container-semanas-mensais');
    container.innerHTML = '';

    const primeiroDiaMes = new Date(app.anoAtual, app.mesAtual, 1);
    const ultimoDiaMes = new Date(app.anoAtual, app.mesAtual + 1, 0);
    const inicio = new Date(primeiroDiaMes);
    inicio.setDate(primeiroDiaMes.getDate() - obterIndiceSemanaSegunda(primeiroDiaMes));

    let cursor = new Date(inicio);
    while (cursor <= ultimoDiaMes) {
        const semana = obterNumeroSemana(cursor);
        const semanaDiv = document.createElement('div');
        semanaDiv.className = 'semana-mensal';
        semanaDiv.innerHTML = `<h3>Semana ${semana}</h3>`;

        const table = document.createElement('table');
        table.className = 'tabela-semanal';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Refeicao</th>
                    ${DIAS_SEMANA.map((dia, indice) => {
                        const data = new Date(cursor);
                        data.setDate(cursor.getDate() + indice);
                        const foraMes = data.getMonth() !== app.mesAtual ? ' data-fora-mes' : '';
                        return `<th class="${foraMes}">${dia.abrev}<br><span class="data-cabecalho">${data.getDate()}/${data.getMonth() + 1}</span></th>`;
                    }).join('')}
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector('tbody');
        app.tiposRefeicao.forEach(tipo => {
            const tr = document.createElement('tr');
            let html = `<td style="font-weight: 600;">${tipo}</td>`;

            DIAS_SEMANA.forEach((diaInfo, indice) => {
                const data = new Date(cursor);
                data.setDate(cursor.getDate() + indice);
                const dataStr = formatarDataChave(data);
                const planos = buscarPlanejamentosPorData(dataStr, tipo);
                const classeForaMes = data.getMonth() !== app.mesAtual ? ' data-fora-mes' : '';

                if (planos.length > 0) {
                    html += `
                        <td class="${classeForaMes}">
                            ${renderizarListaPlanejamentos(planos, true)}
                            <button class="btn-adicionar-mini" onclick="abrirModalPlanejar('${semana}', '${diaInfo.chave}', '${tipo}', '${dataStr}')">
                                +
                            </button>
                        </td>
                    `;
                } else {
                    html += `
                        <td class="celula-vazia${classeForaMes}" onclick="abrirModalPlanejar('${semana}', '${diaInfo.chave}', '${tipo}', '${dataStr}')">
                            +
                        </td>
                    `;
                }
            });

            tr.innerHTML = html;
            tbody.appendChild(tr);
        });

        semanaDiv.appendChild(table);
        container.appendChild(semanaDiv);
        cursor.setDate(cursor.getDate() + 7);
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

/* ==================== VISAO DIARIA ====================
   Refeições de um dia especifico */

let dataDiaria = new Date();

function renderizarDiaria() {
    const container = document.getElementById('container-diaria');
    const titulo = document.getElementById('titulo-dia');
    container.innerHTML = '';

    // Formatar data
    const opcoes = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dataFormatada = dataDiaria.toLocaleDateString('pt-BR', opcoes);
    titulo.textContent = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);

    // Buscar refeicoes planejadas para essa data
    const dataString = dataDiaria.toISOString().split('T')[0];

    app.tiposRefeicao.forEach(tipo => {
        const planos = buscarPlanejamentosPorData(dataString, tipo);

        const card = document.createElement('div');
        card.className = 'card-diario';
        card.innerHTML = `
            <h3>${tipo}</h3>
        `;

        if (planos.length > 0) {
            card.innerHTML += planos.map(plano => {
                const receita = buscarReceita(plano.receitaId);
                if (!receita) {
                    return `
                        <div class="item-planejamento-diario">
                            <div class="conteudo-planejamento">
                                <p><strong>Receita removida</strong></p>
                            </div>
                            <div class="acoes-planejamento">
                                <button onclick="abrirEdicaoPlanejamento('${plano.id}')">Editar</button>
                                <button onclick="removerPlanejamento('${plano.id}')" class="btn-acao-remover">Remover</button>
                            </div>
                        </div>
                    `;
                }

                return `
                    <div class="item-planejamento-diario">
                        <div class="conteudo-planejamento">
                            <p><strong>${receita.nome}</strong></p>
                            <p>Categoria: ${receita.categoria || 'N/A'}</p>
                        </div>
                        <div class="acoes-planejamento">
                            <button onclick="abrirEdicaoPlanejamento('${plano.id}')">Editar</button>
                            <button onclick="marcarComoConsumida('${receita.id}')">Consumida</button>
                            <button onclick="removerPlanejamento('${plano.id}')" class="btn-acao-remover">Remover</button>
                        </div>
                    </div>
                `;
            }).join('');

            card.innerHTML += `
                <button onclick="abrirModalPlanejarData('${dataString}', '${tipo}')">
                    Adicionar
                </button>
            `;
        } else {
            card.innerHTML += `
                <p style="color: #999;">Sem refeicao planejada</p>
                <button onclick="abrirModalPlanejarData('${dataString}', '${tipo}')">
                    Adicionar
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
    const semanaDia = obterSemanaDiaPorData(criarDataLocal(data));
    window.contextoPlanejar = {
        modo: 'calendario',
        data,
        semana: semanaDia.semana,
        dia: semanaDia.dia,
        refeicao: tipo,
        planejamentoId: null,
    };

    renderizarReceitasModalSelecao();
    abrirModal('modal-selecionar-receita');
}

function selecionarReceitaParaPlanoDia(receitaId) {
    selecionarReceitaParaPlano(receitaId);
}

/* ==================== VISAO CALENDARIO ====================
   Calendario interativo com datas */

let mesCalendario = new Date().getMonth();
let anoCalendario = new Date().getFullYear();
let dataSelecionada = null;

function renderizarCalendario() {
    const container = document.getElementById('calendario');
    container.innerHTML = '';

    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    // Atualizar titulo
    document.getElementById('titulo-calendario').textContent = 
        `${meses[mesCalendario]} ${anoCalendario}`;

    // Primeiro dia do mes
    const primeiro = new Date(anoCalendario, mesCalendario, 1);
    const ultimo = new Date(anoCalendario, mesCalendario + 1, 0);
    const diasAnterior = primeiro.getDay();

    // Dias do mes anterior
    const diasMesAnterior = new Date(anoCalendario, mesCalendario, 0).getDate();
    for (let i = diasAnterior - 1; i >= 0; i--) {
        const dia = diasMesAnterior - i;
        const div = criarDiaCalendario(dia, true);
        container.appendChild(div);
    }

    // Dias do mes
    for (let dia = 1; dia <= ultimo.getDate(); dia++) {
        const div = criarDiaCalendario(dia, false);
        container.appendChild(div);
    }

    // Dias do mes seguinte
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

        // Verificar se tem refeicao
        const dataStr = data.toISOString().split('T')[0];
        if (app.tiposRefeicao.some(tipo => buscarPlanejamentosPorData(dataStr, tipo).length > 0)) {
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
        const planos = buscarPlanejamentosPorData(dataStr, tipo);

        const div = document.createElement('div');
        div.className = 'item-refeicao-data';

        if (planos.length > 0) {
            div.innerHTML = `
                <strong>${tipo}:</strong>
                <div class="lista-planejamentos-data">
                    ${planos.map(plano => {
                        const receita = buscarReceita(plano.receitaId);
                        return `
                            <div class="linha-planejamento-data">
                                <span>${receita ? receita.nome : 'Receita removida'}</span>
                                <div class="acoes-planejamento">
                                    <button onclick="abrirEdicaoPlanejamento('${plano.id}')">Editar</button>
                                    <button onclick="removerPlanejamento('${plano.id}')" class="btn-acao-remover">Remover</button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <button onclick="abrirModalPlanejarData('${dataStr}', '${tipo}')">Adicionar</button>
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
    // Limpar formulario
    document.getElementById('form-receita').reset();
    document.getElementById('form-receita').dataset.receitaId = '';
    document.querySelector('.modal-content h2').textContent = 'Nova Receita';
    atualizarSelectTipos();
    atualizarSelectCategorias();
    atualizarSelectTags();
    abrirModal('modal-receita');
}

function obterTiposReceita(receita) {
    if (!receita) return [];

    if (Array.isArray(receita.tipos)) {
        return receita.tipos.filter(tipo => tipo && tipo.trim());
    }

    if (receita.tipo && receita.tipo.trim()) {
        return [receita.tipo.trim()];
    }

    return [];
}

function obterTiposSelecionadosReceita() {
    return Array.from(document.querySelectorAll('input[name="tipos-receita"]:checked'))
        .map(input => input.value);
}

function obterTagsReceita(receita) {
    if (!receita || !Array.isArray(receita.tags)) return [];
    return receita.tags.filter(tag => tag && tag.trim());
}

function obterTagsSelecionadasReceita() {
    return Array.from(document.querySelectorAll('input[name="tags-receita"]:checked'))
        .map(input => input.value);
}

function renderizarBadgesTipos(receita) {
    const tipos = obterTiposReceita(receita);

    if (tipos.length === 0) {
        return '<div class="badge-tipo">Sem tipo</div>';
    }

    return `
        <div class="badges-tipos">
            ${tipos.map(tipo => `<span class="badge-tipo">${tipo}</span>`).join('')}
        </div>
    `;
}

function renderizarBadgesTags(receita) {
    const tags = obterTagsReceita(receita);

    if (tags.length === 0) return '';

    return `
        <div class="badges-tags">
            ${tags.map(tag => `<span class="badge-tag">${tag}</span>`).join('')}
        </div>
    `;
}

function salvarReceita(e) {
    e.preventDefault();

    const tiposSelecionados = obterTiposSelecionadosReceita();
    if (tiposSelecionados.length === 0) {
        alert('Selecione pelo menos um tipo de refeicao!');
        return;
    }

    const id = document.getElementById('form-receita').dataset.receitaId || 'receita_' + Date.now();
    const receita = {
        id: id,
        nome: document.getElementById('nome-receita').value,
        tipo: tiposSelecionados[0],
        tipos: tiposSelecionados,
        categoria: document.getElementById('categoria-receita').value,
        tags: obterTagsSelecionadasReceita(),
        ingredientes: document.getElementById('ingredientes-receita').value
            .split('\n')
            .filter(i => i.trim()),
        modoPreparo: document.getElementById('preparo-receita').value,
        dataCriacao: new Date().toISOString(),
    };

    // Verificar se e edicao ou novo
    const indice = app.receitas.findIndex(r => r.id === id);
    if (indice >= 0) {
        app.receitas[indice] = receita;
    } else {
        app.receitas.push(receita);
    }

    salvarDados();
    fecharModal('modal-receita');
    normalizarCategorias();
    atualizarSelectCategorias();
    atualizarFiltroCategoria();
    normalizarTags();
    atualizarSelectTags();
    renderizarTudoAposSync();

    console.log('Receita salva:', receita);
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
                    ${renderizarBadgesTipos(receita)}
                </div>
            </div>
            <div class="card-receita-content">
                ${receita.categoria ? `<span class="badge-categoria">${receita.categoria}</span>` : ''}
                ${renderizarBadgesTags(receita)}
                ${receita.ingredientes.length > 0 ? `
                    <p><strong>Ingredientes:</strong><br>${receita.ingredientes.slice(0, 3).join('<br>')}</p>
                ` : ''}
                <div class="card-receita-actions">
                    <button class="btn-editar" onclick="editarReceita('${receita.id}')">Editar</button>
                    <button class="btn-deletar" onclick="deletarReceita('${receita.id}')">Deletar</button>
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
    atualizarSelectTipos(obterTiposReceita(receita));
    atualizarSelectCategorias(receita.categoria);
    atualizarSelectTags(obterTagsReceita(receita));
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
        renderizarTudoAposSync();
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
    const valorAtual = select.value;
    select.innerHTML = '<option value="">Todas as categorias</option>';

    normalizarCategorias();
    app.categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });

    select.value = app.categorias.includes(valorAtual) ? valorAtual : '';
}

function buscarReceitasModal() {
    const termo = document.getElementById('busca-selecionar').value.toLowerCase();
    const cards = document.querySelectorAll('.lista-receitas-modal .card-receita');

    cards.forEach(card => {
        const nome = card.querySelector('h3').textContent.toLowerCase();
        card.style.display = nome.includes(termo) ? 'block' : 'none';
    });
}

/* ==================== TAGS ====================
   Gerenciar tags de receitas */

function normalizarTags() {
    const tags = new Set();

    app.tags.forEach(tag => {
        if (tag && tag.trim()) {
            tags.add(tag.trim());
        }
    });

    app.receitas.forEach(receita => {
        obterTagsReceita(receita).forEach(tag => tags.add(tag.trim()));
    });

    app.tags = Array.from(tags).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function atualizarSelectTags(tagsSelecionadas = []) {
    const container = document.getElementById('tags-receita');
    if (!container) return;

    normalizarTags();
    container.innerHTML = '';

    app.tags.forEach(tag => {
        const label = document.createElement('label');
        label.className = 'opcao-checkbox';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'tags-receita';
        checkbox.value = tag;
        checkbox.checked = tagsSelecionadas.includes(tag);

        const span = document.createElement('span');
        span.textContent = tag;

        label.appendChild(checkbox);
        label.appendChild(span);
        container.appendChild(label);
    });
}

function abrirTags() {
    abrirModal('modal-tags');
    renderizarTags();
}

function adicionarTag() {
    const input = document.getElementById('nova-tag');
    const novaTag = input.value.trim();

    if (!novaTag) {
        alert('Digite uma tag!');
        return;
    }

    if (app.tags.some(tag => tag.toLowerCase() === novaTag.toLowerCase())) {
        alert('Esta tag já existe!');
        return;
    }

    app.tags.push(novaTag);
    normalizarTags();
    salvarDados();
    atualizarSelectTags();
    input.value = '';
    renderizarTags();
}

function editarTag(tagAtual) {
    const novaTag = prompt('Novo nome da tag:', tagAtual);
    if (!novaTag) return;

    const tagLimpa = novaTag.trim();
    if (!tagLimpa || tagLimpa === tagAtual) return;

    if (app.tags.some(tag =>
        tag !== tagAtual &&
        tag.toLowerCase() === tagLimpa.toLowerCase()
    )) {
        alert('Esta tag já existe!');
        return;
    }

    app.tags = app.tags.map(tag => tag === tagAtual ? tagLimpa : tag);

    app.receitas.forEach(receita => {
        if (!Array.isArray(receita.tags)) return;
        receita.tags = receita.tags.map(tag => tag === tagAtual ? tagLimpa : tag);
    });

    normalizarTags();
    salvarDados();
    renderizarAposAlterarTags();
}

function removerTag(tag) {
    const usada = app.receitas.some(receita => obterTagsReceita(receita).includes(tag));
    const mensagem = usada
        ? `Remover "${tag}"? Ela também será removida das receitas.`
        : `Remover "${tag}"?`;

    if (!confirm(mensagem)) return;

    app.tags = app.tags.filter(item => item !== tag);
    app.receitas.forEach(receita => {
        if (Array.isArray(receita.tags)) {
            receita.tags = receita.tags.filter(item => item !== tag);
        }
    });

    salvarDados();
    renderizarAposAlterarTags();
}

function renderizarTags() {
    const container = document.getElementById('lista-tags');
    container.innerHTML = '';

    normalizarTags();

    if (app.tags.length === 0) {
        container.innerHTML = '<div class="sem-resultados">Nenhuma tag cadastrada.</div>';
        return;
    }

    app.tags.forEach(tag => {
        const item = document.createElement('div');
        item.className = 'item-gerenciavel';

        const nome = document.createElement('span');
        nome.textContent = tag;

        const acoes = document.createElement('div');
        acoes.className = 'acoes-gerenciavel';

        const btnEditar = document.createElement('button');
        btnEditar.className = 'btn-editar';
        btnEditar.textContent = 'Editar';
        btnEditar.onclick = () => editarTag(tag);

        const btnRemover = document.createElement('button');
        btnRemover.className = 'btn-deletar';
        btnRemover.textContent = 'Remover';
        btnRemover.onclick = () => removerTag(tag);

        acoes.appendChild(btnEditar);
        acoes.appendChild(btnRemover);
        item.appendChild(nome);
        item.appendChild(acoes);
        container.appendChild(item);
    });
}

function renderizarAposAlterarTags() {
    atualizarSelectTags();
    renderizarTags();
    renderizarReceitas();
    renderizarReceitasModalSelecao();
    renderizarSemanal();
    renderizarMensal();
    renderizarDiaria();
    renderizarCalendario();
}

/* ==================== CATEGORIAS ====================
   Gerenciar categorias de receitas */

function normalizarCategorias() {
    const categorias = new Set();

    app.categorias.forEach(categoria => {
        if (categoria && categoria.trim()) {
            categorias.add(categoria.trim());
        }
    });

    app.receitas.forEach(receita => {
        if (receita.categoria && receita.categoria.trim()) {
            categorias.add(receita.categoria.trim());
        }
    });

    app.categorias = Array.from(categorias).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function atualizarSelectCategorias(categoriaAtual = '') {
    const select = document.getElementById('categoria-receita');
    if (!select) return;

    normalizarCategorias();
    select.innerHTML = '<option value="">Sem categoria</option>';

    if (categoriaAtual && !app.categorias.includes(categoriaAtual)) {
        app.categorias.push(categoriaAtual);
        normalizarCategorias();
    }

    app.categorias.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria;
        option.textContent = categoria;
        select.appendChild(option);
    });
}

function abrirCategorias() {
    abrirModal('modal-categorias');
    renderizarCategorias();
}

function adicionarCategoria() {
    const input = document.getElementById('nova-categoria');
    const novaCategoria = input.value.trim();

    if (!novaCategoria) {
        alert('Digite uma categoria!');
        return;
    }

    if (app.categorias.some(categoria => categoria.toLowerCase() === novaCategoria.toLowerCase())) {
        alert('Esta categoria já existe!');
        return;
    }

    app.categorias.push(novaCategoria);
    normalizarCategorias();
    salvarDados();
    atualizarSelectCategorias();
    atualizarFiltroCategoria();
    input.value = '';
    renderizarCategorias();
}

function editarCategoria(categoriaAtual) {
    const novaCategoria = prompt('Novo nome da categoria:', categoriaAtual);
    if (!novaCategoria) return;

    const categoriaLimpa = novaCategoria.trim();
    if (!categoriaLimpa || categoriaLimpa === categoriaAtual) return;

    if (app.categorias.some(categoria =>
        categoria !== categoriaAtual &&
        categoria.toLowerCase() === categoriaLimpa.toLowerCase()
    )) {
        alert('Esta categoria já existe!');
        return;
    }

    app.categorias = app.categorias.map(categoria =>
        categoria === categoriaAtual ? categoriaLimpa : categoria
    );

    app.receitas.forEach(receita => {
        if (receita.categoria === categoriaAtual) {
            receita.categoria = categoriaLimpa;
        }
    });

    normalizarCategorias();
    salvarDados();
    renderizarAposAlterarCategorias();
}

function removerCategoria(categoria) {
    const usada = app.receitas.some(receita => receita.categoria === categoria);
    const mensagem = usada
        ? `Remover "${categoria}"? As receitas desta categoria ficarão sem categoria.`
        : `Remover "${categoria}"?`;

    if (!confirm(mensagem)) return;

    app.categorias = app.categorias.filter(item => item !== categoria);
    app.receitas.forEach(receita => {
        if (receita.categoria === categoria) {
            receita.categoria = '';
        }
    });

    salvarDados();
    renderizarAposAlterarCategorias();
}

function renderizarCategorias() {
    const container = document.getElementById('lista-categorias');
    container.innerHTML = '';

    normalizarCategorias();

    if (app.categorias.length === 0) {
        container.innerHTML = '<div class="sem-resultados">Nenhuma categoria cadastrada.</div>';
        return;
    }

    app.categorias.forEach(categoria => {
        const item = document.createElement('div');
        item.className = 'item-gerenciavel';

        const nome = document.createElement('span');
        nome.textContent = categoria;

        const acoes = document.createElement('div');
        acoes.className = 'acoes-gerenciavel';

        const btnEditar = document.createElement('button');
        btnEditar.className = 'btn-editar';
        btnEditar.textContent = 'Editar';
        btnEditar.onclick = () => editarCategoria(categoria);

        const btnRemover = document.createElement('button');
        btnRemover.className = 'btn-deletar';
        btnRemover.textContent = 'Remover';
        btnRemover.onclick = () => removerCategoria(categoria);

        acoes.appendChild(btnEditar);
        acoes.appendChild(btnRemover);
        item.appendChild(nome);
        item.appendChild(acoes);
        container.appendChild(item);
    });
}

function renderizarAposAlterarCategorias() {
    atualizarSelectCategorias();
    atualizarFiltroCategoria();
    renderizarCategorias();
    renderizarReceitas();
    renderizarReceitasModalSelecao();
    renderizarSemanal();
    renderizarMensal();
    renderizarDiaria();
    renderizarCalendario();
}

/* ==================== TIPOS DE REFEICAO ====================
   Gerenciar tipos customizados */

function abrirTiposRefeicao() {
    abrirModal('modal-tipos-refeicao');
    renderizarTiposRefeicao();
}

function adicionarTipoRefeicao() {
    const novoTipo = document.getElementById('novo-tipo-refeicao').value.trim();

    if (!novoTipo) {
        alert('Digite um tipo de refeicao!');
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

    console.log('? Tipo de refeicao adicionado:', novoTipo);
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
            <button onclick="removerTipoRefeicao('${tipo}')">x</button>
        `;
        container.appendChild(badge);
    });
}

function atualizarSelectTipos(tiposSelecionados = []) {
    const container = document.getElementById('tipo-refeicao');
    if (!container) return;

    container.innerHTML = '';

    app.tiposRefeicao.forEach(tipo => {
        const label = document.createElement('label');
        label.className = 'opcao-checkbox';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'tipos-receita';
        checkbox.value = tipo;
        checkbox.checked = tiposSelecionados.includes(tipo);

        const span = document.createElement('span');
        span.textContent = tipo;

        label.appendChild(checkbox);
        label.appendChild(span);
        container.appendChild(label);
    });
}

/* ==================== HISTORICO ====================
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
    console.log('Consumo registrado:', item);
    alert('Refeição marcada como consumida!');
}

function renderizarHistorico() {
    const container = document.getElementById('lista-historico');
    container.innerHTML = '';

    if (app.historico.length === 0) {
        container.innerHTML = '<div class="sem-resultados">Nenhum historico registrado ainda.</div>';
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

Object.assign(window, {
    abrirCategorias,
    adicionarCategoria,
    editarCategoria,
    removerCategoria,
    abrirTags,
    adicionarTag,
    editarTag,
    removerTag,
    conectarNuvem,
    alternarPainelNuvem,
    fecharPainelNuvem,
    entrarNuvem,
    criarContaNuvem,
    sairNuvem,
    sincronizarSupabase,
    baixarDadosSupabase,
    enviarDadosSupabase,
    abrirModalReceita,
    abrirTiposRefeicao,
    abrirHistorico,
});

/* ==================== INICIAR ====================
   Quando pagina carrega */

window.addEventListener('DOMContentLoaded', inicializar);


