/* ==================== OBJETO PRINCIPAL DA APP ====================
   Centraliza todo o estado da aplicacao */

const app = {
    // Array de alimentos
    alimentos: [],

    // Array de receitas
    receitas: [],

    // Array de refeicoes compostas por receitas e/ou alimentos
    refeicoes: [],

    // Array de planejamentos
    planejamentos: [],

    // Planejamentos separados que compartilham os mesmos cadastros
    planejamentosGrupos: [
        { id: 'adulto', nome: 'Adulto' },
        { id: 'bebe', nome: 'Beb\u00ea' },
        { id: 'simplificado', nome: 'Simplificado' },
    ],
    planejamentoAtivo: localStorage.getItem('cardapio_planejamento_ativo') || 'adulto',

    // Array de historico de consumo
    historico: [],

    // Tipos de refeicao customizaveis
    tiposRefeicao: ['Café da Manhã', 'Almoço', 'Lanche', 'Jantar', 'Ceia'],

    // Tipos de uso exclusivos da visao mensal
    tiposUso: ['Café da Manhã', 'Almoço', 'Lanche', 'Jantar', 'Ceia'],

    // Categorias customizaveis de receitas
    categorias: ['Proteínas', 'Acompanhamentos', 'Prato Único', 'Legumes', 'Saladas', 'Lanches', 'Cremes e Sopas', 'Caldas e Molhos', 'Doces e Sobremesas', 'Bolos e Tortas', 'Bolachas e Biscoitos', 'Pães e Massas', 'Bebidas'],

    // Categorias customizaveis de refeicoes compostas
    categoriasRefeicoes: ['Refeição Principal', 'Lanche', 'Acompanhamento', 'Sobremesa'],

    // Categorias customizaveis de alimentos
    categoriasAlimentos: ['Fruta', 'Legume', 'Verdura', 'Proteina', 'Carboidrato', 'Laticinio', 'Bebida', 'Tempero', 'Grao', 'Oleaginosa'],

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
    syncMeta: {
        deletados: {},
    },
};

/* ==================== INICIALIZACAO ====================
   Carrega dados e renderiza interface */

async function inicializar() {
    console.log('Inicializando app de cardapio...');

    configurarEventosNuvem();
    aplicarEstadoSidebar();
    configurarFechamentoSidebarMobile();

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
    normalizarTiposUso();
    normalizarCategoriasRefeicoes();
    atualizarSelectCategoriasRefeicao();
    atualizarFiltroCategoriaRefeicao();
    normalizarTags();
    atualizarSelectTags();
    normalizarCategoriasAlimentos();
    atualizarSelectCategoriasAlimentos();

    // Renderizar visao inicial
    atualizarControlePlanejamentoAtivo();
    renderizarSemanal();

    // Configurar evento de envio de formulario
    const formReceita = document.getElementById('form-receita');
    if (formReceita) {
        formReceita.addEventListener('submit', salvarReceita);
    }

    const formRefeicao = document.getElementById('form-refeicao');
    if (formRefeicao) {
        formRefeicao.addEventListener('submit', salvarRefeicao);
    }

    configurarAcoesPlanejamentoMobile();

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
    localStorage.setItem('cardapio_alimentos', JSON.stringify(app.alimentos));
    localStorage.setItem('cardapio_receitas', JSON.stringify(app.receitas));
    localStorage.setItem('cardapio_refeicoes', JSON.stringify(app.refeicoes));
    localStorage.setItem('cardapio_planejamentos', JSON.stringify(app.planejamentos));
    localStorage.setItem('cardapio_historico', JSON.stringify(app.historico));
    localStorage.setItem('cardapio_tipos', JSON.stringify(app.tiposRefeicao));
    localStorage.setItem('cardapio_tipos_uso', JSON.stringify(app.tiposUso));
    localStorage.setItem('cardapio_categorias', JSON.stringify(app.categorias));
    localStorage.setItem('cardapio_categorias_refeicoes', JSON.stringify(app.categoriasRefeicoes));
    localStorage.setItem('cardapio_categorias_alimentos', JSON.stringify(app.categoriasAlimentos));
    localStorage.setItem('cardapio_tags', JSON.stringify(app.tags));
    localStorage.setItem('cardapio_sync_meta', JSON.stringify(obterSyncMetaAtual()));
    localStorage.setItem('cardapio_atualizado_em', app.atualizadoEm);
    console.log('Dados salvos!');
}

function carregarDadosLegado() {
    app.alimentos = JSON.parse(localStorage.getItem('cardapio_alimentos')) || [];
    app.receitas = JSON.parse(localStorage.getItem('cardapio_receitas')) || [];
    app.refeicoes = JSON.parse(localStorage.getItem('cardapio_refeicoes')) || [];
    app.planejamentos = JSON.parse(localStorage.getItem('cardapio_planejamentos')) || [];
    app.historico = JSON.parse(localStorage.getItem('cardapio_historico')) || [];
    app.tiposRefeicao = JSON.parse(localStorage.getItem('cardapio_tipos')) || app.tiposRefeicao;
    app.tiposUso = JSON.parse(localStorage.getItem('cardapio_tipos_uso')) || app.tiposUso;
    app.categorias = JSON.parse(localStorage.getItem('cardapio_categorias')) || app.categorias;
    app.categoriasRefeicoes = JSON.parse(localStorage.getItem('cardapio_categorias_refeicoes')) || app.categoriasRefeicoes;
    app.categoriasAlimentos = JSON.parse(localStorage.getItem('cardapio_categorias_alimentos')) || app.categoriasAlimentos;
    app.tags = JSON.parse(localStorage.getItem('cardapio_tags')) || app.tags;
    app.syncMeta = JSON.parse(localStorage.getItem('cardapio_sync_meta')) || app.syncMeta;
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

function configurarAcoesPlanejamentoMobile() {
    if (document.body.dataset.acoesPlanejamentoMobile === 'true') return;
    document.body.dataset.acoesPlanejamentoMobile = 'true';

    const seletorItem = '.celula-refeicao, .item-planejamento-diario, .linha-planejamento-data';
    let timerPressionar = null;
    let itemPressionado = null;
    let inicioX = 0;
    let inicioY = 0;

    const limparTimer = () => {
        if (timerPressionar) {
            clearTimeout(timerPressionar);
            timerPressionar = null;
        }
    };

    const esconderAcoes = (exceto = null) => {
        document.querySelectorAll(`${seletorItem}.mostrar-acoes`).forEach(item => {
            if (item !== exceto) item.classList.remove('mostrar-acoes');
        });
    };

    document.addEventListener('pointerdown', (evento) => {
        if (!window.matchMedia('(hover: none)').matches || evento.pointerType === 'mouse') return;

        const item = evento.target.closest(seletorItem);
        if (!item) {
            esconderAcoes();
            return;
        }

        if (evento.target.closest('button')) return;

        itemPressionado = item;
        inicioX = evento.clientX;
        inicioY = evento.clientY;
        limparTimer();

        timerPressionar = setTimeout(() => {
            esconderAcoes(itemPressionado);
            itemPressionado.classList.add('mostrar-acoes');
            timerPressionar = null;
        }, 450);
    });

    document.addEventListener('pointermove', (evento) => {
        if (!itemPressionado || !timerPressionar) return;

        const distanciaX = Math.abs(evento.clientX - inicioX);
        const distanciaY = Math.abs(evento.clientY - inicioY);
        if (distanciaX > 12 || distanciaY > 12) {
            limparTimer();
            itemPressionado = null;
        }
    });

    ['pointerup', 'pointercancel'].forEach(tipoEvento => {
        document.addEventListener(tipoEvento, () => {
            limparTimer();
            itemPressionado = null;
        });
    });

    document.addEventListener('contextmenu', (evento) => {
        if (!window.matchMedia('(hover: none)').matches) return;
        if (evento.target.closest(seletorItem)) {
            evento.preventDefault();
        }
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
        const dadosLocais = obterSnapshotDadosApp();
        const dadosRemotos = await carregarDadosSupabase();

        if (dadosRemotos) {
            const dadosMesclados = mesclarDadosCardapio(dadosLocais, dadosRemotos);
            aplicarDados(dadosMesclados);
            marcarDadosAlterados();
            salvarDadosLocais();
            renderizarTudoAposSync();
            await enviarDadosSupabase({ silencioso: true, mesclarAntes: false });
            if (!silencioso) atualizarStatusNuvem('online', 'Dados mesclados com a nuvem');
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

function aplicarEstadoSidebar() {
    const appEl = document.getElementById('app');
    if (!appEl) return;

    const telaPequena = window.matchMedia('(max-width: 680px)').matches;
    const sidebarOculta = telaPequena || localStorage.getItem('cardapio-sidebar-oculta') === 'true';
    appEl.classList.toggle('sidebar-oculta', sidebarOculta);
    atualizarBotoesSidebar(sidebarOculta);
}

function atualizarBotoesSidebar(sidebarOculta) {
    const btnOcultar = document.querySelector('.btn-sidebar-toggle');
    const btnMostrar = document.getElementById('btn-expandir-sidebar');

    if (btnOcultar) {
        btnOcultar.setAttribute('aria-label', sidebarOculta ? 'Mostrar barra lateral' : 'Ocultar barra lateral');
        btnOcultar.setAttribute('title', sidebarOculta ? 'Mostrar barra lateral' : 'Ocultar barra lateral');
    }

    if (btnMostrar) {
        btnMostrar.setAttribute('aria-expanded', String(!sidebarOculta));
    }
}

function telaMobileSidebar() {
    return window.matchMedia('(max-width: 680px)').matches;
}

function sidebarAbertaMobile() {
    const appEl = document.getElementById('app');
    return Boolean(appEl && telaMobileSidebar() && !appEl.classList.contains('sidebar-oculta'));
}

function fecharSidebarMobile() {
    const appEl = document.getElementById('app');
    if (!appEl || !sidebarAbertaMobile()) return;

    appEl.classList.add('sidebar-oculta');
    localStorage.setItem('cardapio-sidebar-oculta', 'true');
    atualizarBotoesSidebar(true);
}

function configurarFechamentoSidebarMobile() {
    if (document.body.dataset.fechamentoSidebarMobile === 'true') return;
    document.body.dataset.fechamentoSidebarMobile = 'true';

    const toqueForaSidebar = (alvo) => {
        const sidebar = document.querySelector('.header.sidebar');
        const botaoAbrir = document.getElementById('btn-expandir-sidebar');

        return sidebarAbertaMobile() &&
            !sidebar?.contains(alvo) &&
            !botaoAbrir?.contains(alvo);
    };

    document.addEventListener('pointerdown', (evento) => {
        if (toqueForaSidebar(evento.target)) {
            fecharSidebarMobile();
        }
    });

    document.addEventListener('touchmove', (evento) => {
        if (toqueForaSidebar(evento.target)) {
            fecharSidebarMobile();
        }
    }, { passive: true });
}

function alternarSidebar() {
    const appEl = document.getElementById('app');
    if (!appEl) return;

    const sidebarOculta = !appEl.classList.contains('sidebar-oculta');
    appEl.classList.toggle('sidebar-oculta', sidebarOculta);
    localStorage.setItem('cardapio-sidebar-oculta', String(sidebarOculta));
    atualizarBotoesSidebar(sidebarOculta);
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

function obterSnapshotDadosApp() {
    return {
        alimentos: app.alimentos,
        receitas: app.receitas,
        refeicoes: app.refeicoes,
        planejamentos: app.planejamentos,
        historico: app.historico,
        tiposRefeicao: app.tiposRefeicao,
        tiposUso: app.tiposUso,
        categorias: app.categorias,
        categoriasRefeicoes: app.categoriasRefeicoes,
        categoriasAlimentos: app.categoriasAlimentos,
        tags: app.tags,
        atualizadoEm: app.atualizadoEm,
        syncMeta: obterSyncMetaAtual(),
    };
}

const COLECOES_SYNC = [
    'alimentos',
    'receitas',
    'refeicoes',
    'planejamentos',
    'historico',
    'tiposRefeicao',
    'tiposUso',
    'categorias',
    'categoriasRefeicoes',
    'categoriasAlimentos',
    'tags',
];

function normalizarSyncMeta(meta) {
    const deletados = {};
    COLECOES_SYNC.forEach(colecao => {
        deletados[colecao] = {};
        const origem = meta?.deletados?.[colecao] || {};
        Object.keys(origem).forEach(chave => {
            const timestamp = obterTimestamp(origem[chave]);
            if (chave && timestamp) {
                deletados[colecao][chave] = new Date(timestamp).toISOString();
            }
        });
    });

    return {
        deletados,
    };
}

function obterSyncMetaAtual() {
    const meta = normalizarSyncMeta(app.syncMeta);
    app.syncMeta = meta;
    return meta;
}

function mesclarSyncMeta(metaLocal, metaRemota) {
    const local = normalizarSyncMeta(metaLocal);
    const remoto = normalizarSyncMeta(metaRemota);
    const resultado = normalizarSyncMeta();

    COLECOES_SYNC.forEach(colecao => {
        const chaves = new Set([
            ...Object.keys(local.deletados[colecao] || {}),
            ...Object.keys(remoto.deletados[colecao] || {}),
        ]);

        chaves.forEach(chave => {
            const dataLocal = local.deletados[colecao]?.[chave];
            const dataRemota = remoto.deletados[colecao]?.[chave];
            resultado.deletados[colecao][chave] =
                obterTimestamp(dataLocal) >= obterTimestamp(dataRemota) ? dataLocal : dataRemota;
        });
    });

    return limparSyncMetaAntigo(resultado);
}

function limparSyncMetaAntigo(meta) {
    const normalizado = normalizarSyncMeta(meta);
    const limite = Date.now() - (1000 * 60 * 60 * 24 * 180);

    COLECOES_SYNC.forEach(colecao => {
        Object.keys(normalizado.deletados[colecao]).forEach(chave => {
            if (obterTimestamp(normalizado.deletados[colecao][chave]) < limite) {
                delete normalizado.deletados[colecao][chave];
            }
        });
    });

    return normalizado;
}

function registrarExclusao(colecao, chave, data = new Date().toISOString()) {
    if (!colecao || !chave) return;
    app.syncMeta = normalizarSyncMeta(app.syncMeta);
    app.syncMeta.deletados[colecao][String(chave)] = data;
}

function removerExclusao(colecao, chave) {
    if (!colecao || !chave) return;
    app.syncMeta = normalizarSyncMeta(app.syncMeta);
    delete app.syncMeta.deletados[colecao][String(chave)];
}

function itemFoiExcluido(colecao, chave, item, meta) {
    const excluidoEm = normalizarSyncMeta(meta).deletados[colecao]?.[chave];
    if (!excluidoEm) return false;
    return obterTimestamp(excluidoEm) >= obterTimestampItem(item);
}

function obterTimestampItem(item) {
    return Math.max(
        obterTimestamp(item?.dataAtualizacao),
        obterTimestamp(item?.atualizadoEm),
        obterTimestamp(item?.dataCriacao),
        obterTimestamp(item?.dataUltimo)
    );
}

function escolherItemMesclado(local, remoto) {
    if (!local) return remoto;
    if (!remoto) return local;

    const timestampLocal = obterTimestampItem(local);
    const timestampRemoto = obterTimestampItem(remoto);

    if (timestampRemoto > timestampLocal) {
        return { ...local, ...remoto };
    }

    return { ...remoto, ...local };
}

function mesclarListaPorChave(listaLocal, listaRemota, obterChave, colecao, meta) {
    const mapa = new Map();

    [...(Array.isArray(listaRemota) ? listaRemota : []), ...(Array.isArray(listaLocal) ? listaLocal : [])]
        .filter(Boolean)
        .forEach(item => {
            const chave = obterChave(item);
            if (!chave) return;
            mapa.set(chave, escolherItemMesclado(mapa.get(chave), item));
        });

    return Array.from(mapa.entries())
        .filter(([chave, item]) => !itemFoiExcluido(colecao, chave, item, meta))
        .map(([, item]) => item);
}

function mesclarListaTexto(listaLocal, listaRemota, colecao, meta) {
    const mapa = new Map();
    const deletados = normalizarSyncMeta(meta).deletados[colecao] || {};

    [...(Array.isArray(listaLocal) ? listaLocal : []), ...(Array.isArray(listaRemota) ? listaRemota : [])]
        .map(item => String(item || '').trim())
        .filter(Boolean)
        .forEach(item => {
            const chave = normalizarNomeAlimento(item);
            if (deletados[chave]) return;
            if (!mapa.has(chave)) mapa.set(chave, item);
        });

    return Array.from(mapa.values());
}

function chaveAlimento(alimento) {
    return alimento?.id || `nome:${normalizarNomeAlimento(alimento?.nome)}`;
}

function chaveReceita(receita) {
    return receita?.id || `nome:${normalizarNomeAlimento(receita?.nome)}`;
}

function chaveRefeicao(refeicao) {
    return refeicao?.id || `nome:${normalizarNomeAlimento(refeicao?.nome)}`;
}

function chavePlanejamento(plano) {
    if (planejamentoEhNotaDia(plano)) {
        return [
            'nota-dia',
            plano?.data || '',
        ].join('|');
    }

    return plano?.id || [
        normalizarGrupoPlanejamento(plano?.grupo),
        plano?.data || '',
        plano?.semana || '',
        plano?.dia || '',
        plano?.refeicao || '',
        plano?.itemTipo || (plano?.receitaId ? 'receita' : ''),
        plano?.itemId || plano?.receitaId || '',
    ].join('|');
}

function chaveHistorico(item) {
    return item?.id || [
        item?.itemTipo || (item?.receitaId ? 'receita' : ''),
        item?.itemId || item?.receitaId || '',
    ].join('|');
}

function mesclarDadosCardapio(dadosLocais, dadosRemotos) {
    const local = dadosLocais || {};
    const remoto = dadosRemotos || {};
    const atualizadoLocal = obterTimestamp(local.atualizadoEm);
    const atualizadoRemoto = obterTimestamp(remoto.atualizadoEm);
    const localSemHistorico = !atualizadoLocal && atualizadoRemoto;
    const syncMeta = mesclarSyncMeta(local.syncMeta, remoto.syncMeta);
    const dados = {
        alimentos: mesclarListaPorChave(local.alimentos, remoto.alimentos, chaveAlimento, 'alimentos', syncMeta),
        receitas: mesclarListaPorChave(local.receitas, remoto.receitas, chaveReceita, 'receitas', syncMeta),
        refeicoes: mesclarListaPorChave(local.refeicoes, remoto.refeicoes, chaveRefeicao, 'refeicoes', syncMeta),
        planejamentos: mesclarListaPorChave(local.planejamentos, remoto.planejamentos, chavePlanejamento, 'planejamentos', syncMeta),
        historico: mesclarListaPorChave(local.historico, remoto.historico, chaveHistorico, 'historico', syncMeta),
        tiposRefeicao: mesclarListaTexto(localSemHistorico ? [] : local.tiposRefeicao, remoto.tiposRefeicao, 'tiposRefeicao', syncMeta),
        tiposUso: mesclarListaTexto(localSemHistorico ? [] : local.tiposUso, remoto.tiposUso, 'tiposUso', syncMeta),
        categorias: mesclarListaTexto(localSemHistorico ? [] : local.categorias, remoto.categorias, 'categorias', syncMeta),
        categoriasRefeicoes: mesclarListaTexto(localSemHistorico ? [] : local.categoriasRefeicoes, remoto.categoriasRefeicoes, 'categoriasRefeicoes', syncMeta),
        categoriasAlimentos: mesclarListaTexto(localSemHistorico ? [] : local.categoriasAlimentos, remoto.categoriasAlimentos, 'categoriasAlimentos', syncMeta),
        tags: mesclarListaTexto(localSemHistorico ? [] : local.tags, remoto.tags, 'tags', syncMeta),
        atualizadoEm: atualizadoLocal > atualizadoRemoto ? local.atualizadoEm : remoto.atualizadoEm,
        syncMeta,
    };

    return aplicarExclusoesRelacionadas(dados);
}

function aplicarExclusoesRelacionadas(dados) {
    const meta = normalizarSyncMeta(dados.syncMeta);
    const categoriaExcluida = nome => Boolean(meta.deletados.categorias[normalizarNomeAlimento(nome)]);
    const categoriaRefeicaoExcluida = nome => Boolean(meta.deletados.categoriasRefeicoes[normalizarNomeAlimento(nome)]);
    const categoriaAlimentoExcluida = nome => Boolean(meta.deletados.categoriasAlimentos[normalizarNomeAlimento(nome)]);
    const tagExcluida = nome => Boolean(meta.deletados.tags[normalizarNomeAlimento(nome)]);

    dados.receitas = (dados.receitas || []).map(receita => ({
        ...receita,
        categoria: receita.categoria && categoriaExcluida(receita.categoria) ? '' : receita.categoria,
        tags: Array.isArray(receita.tags) ? receita.tags.filter(tag => !tagExcluida(tag)) : receita.tags,
    }));
    dados.refeicoes = (dados.refeicoes || []).map(refeicao => ({
        ...refeicao,
        categoria: refeicao.categoria && categoriaRefeicaoExcluida(refeicao.categoria) ? '' : refeicao.categoria,
        tags: Array.isArray(refeicao.tags) ? refeicao.tags.filter(tag => !tagExcluida(tag)) : refeicao.tags,
    }));
    dados.alimentos = (dados.alimentos || []).map(alimento => ({
        ...alimento,
        categoria: alimento.categoria && categoriaAlimentoExcluida(alimento.categoria) ? '' : alimento.categoria,
        tags: Array.isArray(alimento.tags) ? alimento.tags.filter(tag => !tagExcluida(tag)) : alimento.tags,
    }));

    return dados;
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
    atualizarControlePlanejamentoAtivo();
    atualizarSelectTipos();
    atualizarSelectCategorias();
    atualizarFiltroCategoria();
    normalizarTiposUso();
    normalizarCategoriasRefeicoes();
    atualizarSelectCategoriasRefeicao();
    atualizarFiltroCategoriaRefeicao();
    atualizarSelectTags();
    atualizarSelectTagsAlimento();
    atualizarSelectCategoriasAlimentos();
    atualizarFiltrosModalSelecao();
    renderizarSemanal();
    renderizarMensal();
    renderizarDiaria();
    renderizarCalendario();
    renderizarReceitas();
    renderizarRefeicoes();
    renderizarAlimentos();
    renderizarCategoriasAlimentos();
    renderizarContagemAlimentos();
}

function aplicarDados(dados) {
    if (!dados) return;

    app.alimentos = Array.isArray(dados.alimentos) ? dados.alimentos : [];
    app.receitas = Array.isArray(dados.receitas) ? dados.receitas : [];
    app.refeicoes = Array.isArray(dados.refeicoes) ? dados.refeicoes : [];
    app.planejamentos = Array.isArray(dados.planejamentos) ? dados.planejamentos : [];
    app.historico = Array.isArray(dados.historico) ? dados.historico : [];
    app.tiposRefeicao = Array.isArray(dados.tiposRefeicao)
        ? dados.tiposRefeicao
        : app.tiposRefeicao;
    app.tiposUso = Array.isArray(dados.tiposUso)
        ? dados.tiposUso
        : app.tiposUso;
    app.categorias = Array.isArray(dados.categorias)
        ? dados.categorias
        : app.categorias;
    app.categoriasRefeicoes = Array.isArray(dados.categoriasRefeicoes)
        ? dados.categoriasRefeicoes
        : app.categoriasRefeicoes;
    app.categoriasAlimentos = Array.isArray(dados.categoriasAlimentos)
        ? dados.categoriasAlimentos
        : app.categoriasAlimentos;
    app.tags = Array.isArray(dados.tags)
        ? dados.tags
        : app.tags;
    app.atualizadoEm = dados.atualizadoEm || app.atualizadoEm;
    app.syncMeta = normalizarSyncMeta(dados.syncMeta || app.syncMeta);

    const normalizou = normalizarEncodingApp();
    const migrou = normalizarDadosAlimentos();

    if (normalizou || migrou) {
        marcarDadosAlterados();
        salvarDadosLocais();
    }
}

function normalizarEncodingApp() {
    const antes = JSON.stringify({
        alimentos: app.alimentos,
        receitas: app.receitas,
        refeicoes: app.refeicoes,
        planejamentos: app.planejamentos,
        historico: app.historico,
        tiposRefeicao: app.tiposRefeicao,
        tiposUso: app.tiposUso,
        categorias: app.categorias,
        categoriasRefeicoes: app.categoriasRefeicoes,
        categoriasAlimentos: app.categoriasAlimentos,
        tags: app.tags,
    });

    app.alimentos = normalizarEncodingValor(app.alimentos);
    app.receitas = normalizarEncodingValor(app.receitas);
    app.refeicoes = normalizarEncodingValor(app.refeicoes);
    app.planejamentos = normalizarEncodingValor(app.planejamentos);
    app.historico = normalizarEncodingValor(app.historico);
    app.tiposRefeicao = normalizarEncodingValor(app.tiposRefeicao);
    app.tiposUso = normalizarEncodingValor(app.tiposUso);
    app.categorias = normalizarEncodingValor(app.categorias);
    app.categoriasRefeicoes = normalizarEncodingValor(app.categoriasRefeicoes);
    app.categoriasAlimentos = normalizarEncodingValor(app.categoriasAlimentos);
    app.tags = normalizarEncodingValor(app.tags);

    const depois = JSON.stringify({
        alimentos: app.alimentos,
        receitas: app.receitas,
        refeicoes: app.refeicoes,
        planejamentos: app.planejamentos,
        historico: app.historico,
        tiposRefeicao: app.tiposRefeicao,
        tiposUso: app.tiposUso,
        categorias: app.categorias,
        categoriasRefeicoes: app.categoriasRefeicoes,
        categoriasAlimentos: app.categoriasAlimentos,
        tags: app.tags,
    });

    return antes !== depois;
}

function normalizarNomeAlimento(nome) {
    return String(nome || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

function escaparHtml(valor) {
    return String(valor || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function chaveCategoria(valor) {
    return normalizarNomeAlimento(valor)
        .replace(/\s+/g, '-');
}

const CORES_CATEGORIAS_RECEITA = {
    proteinas: '#e23d4f',
    acompanhamentos: '#f7b928',
    'prato-unico': '#e84949',
    legumes: '#0d5f25',
    saladas: '#27c83f',
    lanches: '#6542f5',
    'cremes-e-sopas': '#e1d36d',
    'caldas-e-molhos': '#e996a3',
    'doces-e-sobremesas': '#ff2b75',
    'bolos-e-tortas': '#63b9d8',
    'bolachas-e-biscoitos': '#9a6580',
    'paes-e-massas': '#3d2a0d',
    bebidas: '#9b9b9b',
    doce: '#ff2b75',
    salgado: '#f7b928',
    vegetariano: '#27c83f',
    vegan: '#0d5f25',
    'sem-gluten': '#63b9d8',
    'sem-lactose': '#e996a3',
};

const CORES_CATEGORIAS_ALIMENTO = {
    fruta: '#ff8a3d',
    legume: '#16803a',
    verdura: '#32c766',
    proteina: '#d94747',
    proteinas: '#d94747',
    carboidrato: '#c7852f',
    laticinio: '#6bb7d6',
    bebida: '#8fa4b8',
    tempero: '#7b5bd6',
    grao: '#9c7a36',
    oleaginosa: '#7d4f2a',
};

function gerarCorCategoria(nome, tipo = 'receita') {
    const chave = chaveCategoria(nome);
    const paleta = tipo === 'alimento' ? CORES_CATEGORIAS_ALIMENTO : CORES_CATEGORIAS_RECEITA;
    if (paleta[chave]) return paleta[chave];

    let hash = 0;
    for (let i = 0; i < chave.length; i++) {
        hash = ((hash << 5) - hash) + chave.charCodeAt(i);
        hash |= 0;
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 58%, 44%)`;
}

function corTextoParaFundo(cor) {
    if (!cor || !cor.startsWith('#') || cor.length !== 7) return '#ffffff';
    const r = parseInt(cor.slice(1, 3), 16);
    const g = parseInt(cor.slice(3, 5), 16);
    const b = parseInt(cor.slice(5, 7), 16);
    const luminancia = (0.299 * r + 0.587 * g + 0.114 * b);
    return luminancia > 150 ? '#262626' : '#ffffff';
}

function renderizarBadgeCategoria(categoria, tipo = 'receita') {
    if (!categoria) return '';
    const cor = gerarCorCategoria(categoria, tipo);
    const texto = corTextoParaFundo(cor);
    return `<span class="badge-categoria badge-categoria-colorida" style="--categoria-cor:${cor};--categoria-texto:${texto};">${escaparHtml(categoria)}</span>`;
}

function criarIdAlimento() {
    return `alimento_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function buscarAlimento(id) {
    return app.alimentos.find(alimento => alimento.id === id);
}

function buscarAlimentoPorNome(nome) {
    const chave = normalizarNomeAlimento(nome);
    if (!chave) return null;
    return app.alimentos.find(alimento => normalizarNomeAlimento(alimento.nome) === chave) || null;
}

function obterOuCriarAlimento(nome, categoria = '') {
    const nomeLimpo = String(nome || '').trim();
    if (!nomeLimpo) return null;

    const existente = buscarAlimentoPorNome(nomeLimpo);
    if (existente) return existente;

    const alimento = {
        id: criarIdAlimento(),
        nome: nomeLimpo,
        categoria: categoria || '',
        unidadePadrao: '',
        dataCriacao: new Date().toISOString(),
    };

    app.alimentos.push(alimento);
    return alimento;
}

function normalizarIngredienteReceita(ingrediente) {
    if (typeof ingrediente === 'string') {
        const alimento = obterOuCriarAlimento(ingrediente);
        return alimento ? {
            alimentoId: alimento.id,
            nome: alimento.nome,
            quantidade: '',
            unidade: '',
        } : null;
    }

    if (ingrediente && typeof ingrediente === 'object') {
        let alimento = ingrediente.alimentoId ? buscarAlimento(ingrediente.alimentoId) : null;
        if (!alimento && ingrediente.nome) {
            alimento = obterOuCriarAlimento(ingrediente.nome);
        }

        return alimento ? {
            alimentoId: alimento.id,
            nome: alimento.nome,
            quantidade: ingrediente.quantidade || '',
            unidade: ingrediente.unidade || '',
        } : null;
    }

    return null;
}

function normalizarItemRefeicao(item) {
    if (!item || typeof item !== 'object') return null;

    const itemTipo = item.itemTipo === 'alimento' ? 'alimento' : 'receita';
    const itemId = item.itemId || item.receitaId || item.alimentoId || '';
    const entidade = itemTipo === 'alimento' ? buscarAlimento(itemId) : buscarReceita(itemId);

    if (!entidade) return null;

    return {
        itemTipo,
        itemId,
        nome: entidade.nome,
        quantidade: item.quantidade || '',
        unidade: item.unidade || '',
    };
}

function normalizarDadosAlimentos() {
    const antes = JSON.stringify({
        alimentos: app.alimentos,
        categoriasAlimentos: app.categoriasAlimentos,
        receitas: app.receitas,
        refeicoes: app.refeicoes,
        planejamentos: app.planejamentos,
    });

    app.alimentos = app.alimentos
        .filter(alimento => alimento && alimento.nome && String(alimento.nome).trim())
        .map(alimento => ({
            id: alimento.id || criarIdAlimento(),
            nome: String(alimento.nome).trim(),
            categoria: alimento.categoria || '',
            unidadePadrao: alimento.unidadePadrao || alimento.unidade || '',
            tags: Array.isArray(alimento.tags) ? alimento.tags.filter(Boolean) : [],
            dataCriacao: alimento.dataCriacao || new Date().toISOString(),
        }));

    normalizarCategoriasAlimentos();
    normalizarTiposUso();

    app.receitas.forEach(receita => {
        receita.ingredientes = Array.isArray(receita.ingredientes)
            ? receita.ingredientes.map(normalizarIngredienteReceita).filter(Boolean)
            : [];
    });

    app.refeicoes = app.refeicoes
        .filter(refeicao => refeicao && refeicao.nome && String(refeicao.nome).trim())
        .map(refeicao => ({
            id: refeicao.id || `refeicao_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            nome: String(refeicao.nome).trim(),
            tipo: refeicao.tipo || (Array.isArray(refeicao.tipos) ? refeicao.tipos[0] : ''),
            tipos: Array.isArray(refeicao.tipos) ? refeicao.tipos.filter(Boolean) : (refeicao.tipo ? [refeicao.tipo] : []),
            categoria: refeicao.categoria || '',
            tags: Array.isArray(refeicao.tags) ? refeicao.tags.filter(Boolean) : [],
            itens: Array.isArray(refeicao.itens)
                ? refeicao.itens.map(normalizarItemRefeicao).filter(Boolean)
                : [],
            observacoes: refeicao.observacoes || '',
            dataCriacao: refeicao.dataCriacao || new Date().toISOString(),
        }));

    normalizarCategoriasRefeicoes();

    app.planejamentos.forEach(plano => {
        if (!plano.itemTipo) plano.itemTipo = 'receita';
        if (!plano.itemId && plano.receitaId) plano.itemId = plano.receitaId;
        if (planejamentoEhNotaDia(plano)) return;
        plano.grupo = normalizarGrupoPlanejamento(plano.grupo);
    });

    normalizarNotasPlanejamentoDiarias();

    const depois = JSON.stringify({
        alimentos: app.alimentos,
        categoriasAlimentos: app.categoriasAlimentos,
        receitas: app.receitas,
        refeicoes: app.refeicoes,
        planejamentos: app.planejamentos,
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
        alimentos: JSON.parse(localStorage.getItem('cardapio_alimentos')) || [],
        receitas: JSON.parse(localStorage.getItem('cardapio_receitas')) || [],
        refeicoes: JSON.parse(localStorage.getItem('cardapio_refeicoes')) || [],
        planejamentos: JSON.parse(localStorage.getItem('cardapio_planejamentos')) || [],
        historico: JSON.parse(localStorage.getItem('cardapio_historico')) || [],
        tiposRefeicao: JSON.parse(localStorage.getItem('cardapio_tipos')) || app.tiposRefeicao,
        tiposUso: JSON.parse(localStorage.getItem('cardapio_tipos_uso')) || app.tiposUso,
        categorias: JSON.parse(localStorage.getItem('cardapio_categorias')) || app.categorias,
        categoriasRefeicoes: JSON.parse(localStorage.getItem('cardapio_categorias_refeicoes')) || app.categoriasRefeicoes,
        categoriasAlimentos: JSON.parse(localStorage.getItem('cardapio_categorias_alimentos')) || app.categoriasAlimentos,
        tags: JSON.parse(localStorage.getItem('cardapio_tags')) || app.tags,
        atualizadoEm: localStorage.getItem('cardapio_atualizado_em') || null,
        syncMeta: JSON.parse(localStorage.getItem('cardapio_sync_meta')) || app.syncMeta,
    };
}

function salvarDadosLocais() {
    localStorage.setItem('cardapio_alimentos', JSON.stringify(app.alimentos));
    localStorage.setItem('cardapio_receitas', JSON.stringify(app.receitas));
    localStorage.setItem('cardapio_refeicoes', JSON.stringify(app.refeicoes));
    localStorage.setItem('cardapio_planejamentos', JSON.stringify(app.planejamentos));
    localStorage.setItem('cardapio_historico', JSON.stringify(app.historico));
    localStorage.setItem('cardapio_tipos', JSON.stringify(app.tiposRefeicao));
    localStorage.setItem('cardapio_tipos_uso', JSON.stringify(app.tiposUso));
    localStorage.setItem('cardapio_categorias', JSON.stringify(app.categorias));
    localStorage.setItem('cardapio_categorias_refeicoes', JSON.stringify(app.categoriasRefeicoes));
    localStorage.setItem('cardapio_categorias_alimentos', JSON.stringify(app.categoriasAlimentos));
    localStorage.setItem('cardapio_tags', JSON.stringify(app.tags));
    localStorage.setItem('cardapio_sync_meta', JSON.stringify(obterSyncMetaAtual()));
    if (app.atualizadoEm) {
        localStorage.setItem('cardapio_atualizado_em', app.atualizadoEm);
    }
}

async function carregarDadosSupabase() {
    if (!app.usuarioSupabase) return null;

    const config = window.CARDAPIO_SUPABASE;
    let { data, error } = await app.supabase
        .from(config.table)
        .select('alimentos, receitas, refeicoes, planejamentos, historico, tipos_refeicao, tipos_uso, categorias, categorias_refeicoes, categorias_alimentos, tags, sync_meta, atualizado_em')
        .eq('user_id', app.usuarioSupabase.id)
        .eq('id', config.recordId)
        .maybeSingle();

    if (error && (String(error.message || '').toLowerCase().includes('tipos_uso') ||
        String(error.message || '').toLowerCase().includes('categorias_refeicoes'))) {
        const fallback = await app.supabase
            .from(config.table)
            .select('alimentos, receitas, refeicoes, planejamentos, historico, tipos_refeicao, categorias, categorias_alimentos, tags, sync_meta, atualizado_em')
            .eq('user_id', app.usuarioSupabase.id)
            .eq('id', config.recordId)
            .maybeSingle();
        data = fallback.data;
        error = fallback.error;
    }

    if (error && String(error.message || '').toLowerCase().includes('sync_meta')) {
        const fallback = await app.supabase
            .from(config.table)
            .select('alimentos, receitas, refeicoes, planejamentos, historico, tipos_refeicao, categorias, categorias_alimentos, tags, atualizado_em')
            .eq('user_id', app.usuarioSupabase.id)
            .eq('id', config.recordId)
            .maybeSingle();
        data = fallback.data;
        error = fallback.error;
    }

    if (error && String(error.message || '').toLowerCase().includes('refeicoes')) {
        const fallback = await app.supabase
            .from(config.table)
            .select('alimentos, receitas, planejamentos, historico, tipos_refeicao, categorias, categorias_alimentos, tags, atualizado_em')
            .eq('user_id', app.usuarioSupabase.id)
            .eq('id', config.recordId)
            .maybeSingle();
        data = fallback.data;
        error = fallback.error;
    }

    if (error && String(error.message || '').toLowerCase().includes('categorias_alimentos')) {
        const fallback = await app.supabase
            .from(config.table)
            .select('alimentos, receitas, planejamentos, historico, tipos_refeicao, categorias, tags, atualizado_em')
            .eq('user_id', app.usuarioSupabase.id)
            .eq('id', config.recordId)
            .maybeSingle();
        data = fallback.data;
        error = fallback.error;
    }

    if (error && String(error.message || '').toLowerCase().includes('alimentos')) {
        const fallback = await app.supabase
            .from(config.table)
            .select('receitas, planejamentos, historico, tipos_refeicao, categorias, tags, atualizado_em')
            .eq('user_id', app.usuarioSupabase.id)
            .eq('id', config.recordId)
            .maybeSingle();
        data = fallback.data;
        error = fallback.error;
    }

    if (error) throw error;
    if (!data) return null;

    return {
        alimentos: data.alimentos,
        receitas: data.receitas,
        refeicoes: data.refeicoes,
        planejamentos: data.planejamentos,
        historico: data.historico,
        tiposRefeicao: data.tipos_refeicao,
        tiposUso: data.tipos_uso,
        categorias: data.categorias,
        categoriasRefeicoes: data.categorias_refeicoes,
        categoriasAlimentos: data.categorias_alimentos,
        tags: data.tags,
        atualizadoEm: data.atualizado_em,
        syncMeta: data.sync_meta,
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

    let { error } = await app.supabase
        .from(config.table)
        .upsert({
            id: config.recordId,
            user_id: app.usuarioSupabase.id,
            alimentos: app.alimentos,
            receitas: app.receitas,
            refeicoes: app.refeicoes,
            planejamentos: app.planejamentos,
            historico: app.historico,
            tipos_refeicao: app.tiposRefeicao,
            tipos_uso: app.tiposUso,
            categorias: app.categorias,
            categorias_refeicoes: app.categoriasRefeicoes,
            categorias_alimentos: app.categoriasAlimentos,
            tags: app.tags,
            sync_meta: obterSyncMetaAtual(),
            atualizado_em: app.atualizadoEm || new Date().toISOString(),
        }, { onConflict: 'user_id,id' });

    if (error && (String(error.message || '').toLowerCase().includes('tipos_uso') ||
        String(error.message || '').toLowerCase().includes('categorias_refeicoes'))) {
        const fallback = await app.supabase
            .from(config.table)
            .upsert({
                id: config.recordId,
                user_id: app.usuarioSupabase.id,
                alimentos: app.alimentos,
                receitas: app.receitas,
                refeicoes: app.refeicoes,
                planejamentos: app.planejamentos,
                historico: app.historico,
                tipos_refeicao: app.tiposRefeicao,
                categorias: app.categorias,
                categorias_alimentos: app.categoriasAlimentos,
                tags: app.tags,
                sync_meta: obterSyncMetaAtual(),
                atualizado_em: app.atualizadoEm || new Date().toISOString(),
            }, { onConflict: 'user_id,id' });
        error = fallback.error;
    }

    if (error && String(error.message || '').toLowerCase().includes('sync_meta')) {
        const fallback = await app.supabase
            .from(config.table)
            .upsert({
                id: config.recordId,
                user_id: app.usuarioSupabase.id,
                alimentos: app.alimentos,
                receitas: app.receitas,
                refeicoes: app.refeicoes,
                planejamentos: app.planejamentos,
                historico: app.historico,
                tipos_refeicao: app.tiposRefeicao,
                categorias: app.categorias,
                categorias_alimentos: app.categoriasAlimentos,
                tags: app.tags,
                atualizado_em: app.atualizadoEm || new Date().toISOString(),
            }, { onConflict: 'user_id,id' });
        error = fallback.error;
    }

    if (error && String(error.message || '').toLowerCase().includes('refeicoes')) {
        const fallback = await app.supabase
            .from(config.table)
            .upsert({
                id: config.recordId,
                user_id: app.usuarioSupabase.id,
                alimentos: app.alimentos,
                receitas: app.receitas,
                planejamentos: app.planejamentos,
                historico: app.historico,
                tipos_refeicao: app.tiposRefeicao,
                categorias: app.categorias,
                categorias_alimentos: app.categoriasAlimentos,
                tags: app.tags,
                atualizado_em: app.atualizadoEm || new Date().toISOString(),
            }, { onConflict: 'user_id,id' });
        error = fallback.error;
    }

    if (error && String(error.message || '').toLowerCase().includes('categorias_alimentos')) {
        const fallback = await app.supabase
            .from(config.table)
            .upsert({
                id: config.recordId,
                user_id: app.usuarioSupabase.id,
                alimentos: app.alimentos,
                receitas: app.receitas,
                planejamentos: app.planejamentos,
                historico: app.historico,
                tipos_refeicao: app.tiposRefeicao,
                categorias: app.categorias,
                tags: app.tags,
                atualizado_em: app.atualizadoEm || new Date().toISOString(),
            }, { onConflict: 'user_id,id' });
        error = fallback.error;
    }

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
            aplicarDados(mesclarDadosCardapio(dadosLocais, dadosRemotos));
            marcarDadosAlterados();
            salvarDadosLocais();
            await salvarDadosSupabase();
            console.log('Dados carregados do Supabase.');
            return;
        }

        if (app.alimentos.length || app.receitas.length || app.refeicoes.length || app.planejamentos.length || app.historico.length) {
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
    } else if (nomeVisao === 'refeicoes') {
        renderizarRefeicoes();
    } else if (nomeVisao === 'alimentos') {
        renderizarAlimentos();
    } else if (nomeVisao === 'contagem') {
        renderizarContagemAlimentos();
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

const TIPO_PLANEJAMENTO_NOTA_DIA = 'nota-dia';
const REFEICAO_NOTA_DIA = '__nota_dia__';

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

function normalizarGrupoPlanejamento(grupo) {
    const id = String(grupo || '').trim().toLowerCase();
    return app.planejamentosGrupos.some(item => item.id === id) ? id : 'adulto';
}

function obterGrupoPlanejamentoAtivo() {
    app.planejamentoAtivo = normalizarGrupoPlanejamento(app.planejamentoAtivo);
    return app.planejamentoAtivo;
}

function obterNomePlanejamentoAtivo() {
    const grupo = app.planejamentosGrupos.find(item => item.id === obterGrupoPlanejamentoAtivo());
    return grupo?.nome || 'Adulto';
}

function planejamentoPertenceAoAtivo(plano) {
    return normalizarGrupoPlanejamento(plano?.grupo) === obterGrupoPlanejamentoAtivo();
}

function atualizarControlePlanejamentoAtivo() {
    const container = document.getElementById('controle-planejamento-ativo');
    if (!container) return;

    const ativo = obterGrupoPlanejamentoAtivo();
    container.innerHTML = app.planejamentosGrupos.map(grupo => `
        <button type="button"
                class="btn-planejamento-opcao ${grupo.id === ativo ? 'ativo' : ''}"
                onclick="selecionarPlanejamentoAtivo('${grupo.id}')">
            ${escaparHtml(grupo.nome)}
        </button>
    `).join('');
}

function selecionarPlanejamentoAtivo(grupo) {
    const novoGrupo = normalizarGrupoPlanejamento(grupo);
    if (novoGrupo === app.planejamentoAtivo) return;

    app.planejamentoAtivo = novoGrupo;
    localStorage.setItem('cardapio_planejamento_ativo', novoGrupo);
    atualizarControlePlanejamentoAtivo();
    renderizarSemanal();
    renderizarMensal();
    renderizarDiaria();
    renderizarCalendario();
    renderizarContagemAlimentos();
}

function alternarPlanejamentoAtivo() {
    const ativo = obterGrupoPlanejamentoAtivo();
    const indiceAtual = app.planejamentosGrupos.findIndex(grupo => grupo.id === ativo);
    const proximo = app.planejamentosGrupos[(indiceAtual + 1) % app.planejamentosGrupos.length];
    selecionarPlanejamentoAtivo(proximo.id);
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
    return buscarPlanejamentosPorDataGrupo(dataStr, tipo, obterGrupoPlanejamentoAtivo());
}

function buscarPlanejamentosPorDataGrupo(dataStr, tipo, grupo) {
    const data = criarDataLocal(dataStr);
    const legado = obterSemanaDiaPorData(data);
    const grupoNormalizado = normalizarGrupoPlanejamento(grupo);

    return app.planejamentos.filter(p =>
        normalizarGrupoPlanejamento(p?.grupo) === grupoNormalizado &&
        p.data === dataStr &&
        p.refeicao === tipo
    ).concat(app.planejamentos.filter(p =>
        normalizarGrupoPlanejamento(p?.grupo) === grupoNormalizado &&
        !p.data &&
        Number(p.semana) === legado.semana &&
        normalizarDiaSemana(p.dia) === legado.dia &&
        p.refeicao === tipo
    ));
}

function buscarNotaPlanejamentoPorData(dataStr) {
    return app.planejamentos.find(plano =>
        planejamentoEhNotaDia(plano) &&
        plano.data === dataStr
    ) || null;
}

function criarIdNotaPlanejamento(dataStr) {
    return `nota_${dataStr}`;
}

function obterTimestampPlano(plano) {
    return obterTimestamp(plano?.dataAtualizacao || plano?.dataCriacao);
}

function normalizarNotasPlanejamentoDiarias() {
    const notasPorData = new Map();
    const planejamentosSemNotas = [];

    app.planejamentos.forEach(plano => {
        if (!planejamentoEhNotaDia(plano)) {
            planejamentosSemNotas.push(plano);
            return;
        }

        const dataStr = plano.data || (plano.semana && plano.dia ? formatarDataChave(obterDataSemanaDia(plano.semana, plano.dia)) : '');
        if (!dataStr) return;

        const notaAtual = notasPorData.get(dataStr);
        if (!notaAtual || obterTimestampPlano(plano) >= obterTimestampPlano(notaAtual)) {
            notasPorData.set(dataStr, plano);
        }
    });

    notasPorData.forEach((plano, dataStr) => {
        const data = criarDataLocal(dataStr);
        const semanaDia = obterSemanaDiaPorData(data);
        planejamentosSemNotas.push({
            ...plano,
            id: criarIdNotaPlanejamento(dataStr),
            grupo: '',
            itemTipo: TIPO_PLANEJAMENTO_NOTA_DIA,
            itemId: '',
            receitaId: '',
            refeicao: REFEICAO_NOTA_DIA,
            tipo: 'nota',
            data: dataStr,
            semana: semanaDia.semana,
            dia: semanaDia.dia,
            nota: String(plano.nota || ''),
        });
    });

    app.planejamentos = planejamentosSemNotas;
}

function salvarNotaPlanejamentoData(dataStr, texto) {
    const data = criarDataLocal(dataStr);
    const semanaDia = obterSemanaDiaPorData(data);
    const nota = buscarNotaPlanejamentoPorData(dataStr);
    const conteudo = String(texto || '');
    const agora = new Date().toISOString();

    if (!conteudo.trim()) {
        if (nota) {
            registrarExclusao('planejamentos', chavePlanejamento(nota));
            app.planejamentos = app.planejamentos.filter(plano =>
                !(planejamentoEhNotaDia(plano) && plano.data === dataStr)
            );
            salvarDados();
            renderizarCalendario();
        }
        return;
    }

    if (nota) {
        nota.id = criarIdNotaPlanejamento(dataStr);
        nota.grupo = '';
        nota.nota = conteudo;
        nota.itemTipo = TIPO_PLANEJAMENTO_NOTA_DIA;
        nota.itemId = '';
        nota.receitaId = '';
        nota.refeicao = REFEICAO_NOTA_DIA;
        nota.tipo = 'nota';
        nota.data = dataStr;
        nota.semana = semanaDia.semana;
        nota.dia = semanaDia.dia;
        nota.dataAtualizacao = agora;
    } else {
        const novoPlano = {
            id: criarIdNotaPlanejamento(dataStr),
            grupo: '',
            itemTipo: TIPO_PLANEJAMENTO_NOTA_DIA,
            itemId: '',
            receitaId: '',
            refeicao: REFEICAO_NOTA_DIA,
            tipo: 'nota',
            data: dataStr,
            semana: semanaDia.semana,
            dia: semanaDia.dia,
            nota: conteudo,
            dataCriacao: agora,
            dataAtualizacao: agora,
        };

        app.planejamentos.push(novoPlano);
    }

    removerExclusao('planejamentos', ['nota-dia', dataStr].join('|'));
    normalizarNotasPlanejamentoDiarias();
    salvarDados();
    renderizarCalendario();
}

function renderizarCampoNotaPlanejamento(dataStr, compacto = false) {
    const nota = buscarNotaPlanejamentoPorData(dataStr);
    const valor = escaparHtml(nota?.nota || '');
    const classeCompacta = compacto ? ' nota-planejamento-compacta' : '';

    return `
        <label class="nota-planejamento${classeCompacta}" onclick="event.stopPropagation()">
            <span>Notas</span>
            <textarea
                placeholder="Escreva livremente..."
                onblur="salvarNotaPlanejamentoData('${dataStr}', this.value)"
                onclick="event.stopPropagation()">${valor}</textarea>
        </label>
    `;
}

function obterTipoItemPlano(plano) {
    return plano.itemTipo || 'receita';
}

function planejamentoEhNotaDia(plano) {
    return obterTipoItemPlano(plano || {}) === TIPO_PLANEJAMENTO_NOTA_DIA;
}

function obterItemIdPlano(plano) {
    return plano.itemId || plano.receitaId;
}

function buscarRefeicao(id) {
    return app.refeicoes.find(refeicao => refeicao.id === id);
}

function buscarItemPlanejamento(plano) {
    const itemTipo = obterTipoItemPlano(plano);
    const itemId = obterItemIdPlano(plano);

    if (itemTipo === 'alimento') {
        return { tipo: 'alimento', item: buscarAlimento(itemId) };
    }

    if (itemTipo === 'refeicao') {
        return { tipo: 'refeicao', item: buscarRefeicao(itemId) };
    }

    return { tipo: 'receita', item: buscarReceita(itemId) };
}

function planejamentoPermiteCheck(plano) {
    return normalizarGrupoPlanejamento(plano?.grupo) === 'simplificado';
}

function renderizarCheckPlanejamento(plano) {
    if (!planejamentoPermiteCheck(plano)) return '';

    return `
        <label class="check-planejamento" onclick="event.stopPropagation()" title="Marcar como seguido">
            <input type="checkbox" aria-label="Marcar como seguido" ${plano.seguido ? 'checked' : ''} onchange="alternarPlanoSeguido('${plano.id}', this.checked)">
        </label>
    `;
}

function alternarPlanoSeguido(id, seguido) {
    const plano = app.planejamentos.find(item => item.id === id);
    if (!plano || !planejamentoPermiteCheck(plano)) return;

    plano.seguido = Boolean(seguido);
    plano.dataAtualizacao = new Date().toISOString();
    salvarDados();
    renderizarSemanal();
    renderizarMensal();
    renderizarDiaria();
    renderizarCalendario();
    renderizarContagemAlimentos();
}

function renderizarResumoReceitaPlano(plano, compacto = false) {
    const { tipo, item } = buscarItemPlanejamento(plano);

    if (!item) {
        return `
            <div class="celula-refeicao receita-removida">
                <div class="conteudo-planejamento">
                    <div class="nome-refeicao">Item removido</div>
                    ${renderizarCheckPlanejamento(plano)}
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
        <div class="celula-refeicao ${tipo === 'alimento' ? 'celula-alimento' : tipo === 'refeicao' ? 'celula-refeicao-composta' : 'celula-receita'}" style="--categoria-cor:${gerarCorCategoria(item.categoria || tipo, tipo)};">
            <div class="conteudo-planejamento">
                <div class="nome-refeicao">${escaparHtml(item.nome)}</div>
                ${renderizarCheckPlanejamento(plano)}
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
    const hojeStr = formatarDataChave(new Date());

    app.tiposRefeicao.forEach(tipo => {
        const tr = document.createElement('tr');
        let html = `<td class="refeicao-nome" style="font-weight: 600; background: #f0f0f0;">${escaparHtml(tipo)}</td>`;

        DIAS_SEMANA.forEach(diaInfo => {
            const data = obterDataSemanaDia(app.semanaAtual, diaInfo.chave);
            const dataStr = formatarDataChave(data);
            const planos = buscarPlanejamentos(app.semanaAtual, diaInfo.chave, tipo);
            const classeHoje = dataStr === hojeStr ? ' coluna-hoje' : '';

            if (planos.length > 0) {
                html += `
                    <td class="${classeHoje}">
                        ${renderizarListaPlanejamentos(planos)}
                        <button class="btn-adicionar-mini" onclick="abrirModalPlanejar('${app.semanaAtual}', '${diaInfo.chave}', '${tipo}', '${dataStr}')">
                            Adicionar
                        </button>
                    </td>
                `;
            } else {
                html += `
                    <td class="celula-vazia${classeHoje}" onclick="abrirModalPlanejar('${app.semanaAtual}', '${diaInfo.chave}', '${tipo}', '${dataStr}')">
                        <span class="btn-add-celula">+</span>
                    </td>
                `;
            }
        });

        tr.innerHTML = html;
        tbody.appendChild(tr);
    });

    const trNotas = document.createElement('tr');
    trNotas.className = 'linha-notas-planejamento';
    trNotas.innerHTML = `<td class="refeicao-nome">Notas</td>` + DIAS_SEMANA.map(diaInfo => {
        const dataStr = formatarDataChave(obterDataSemanaDia(app.semanaAtual, diaInfo.chave));
        return `<td>${renderizarCampoNotaPlanejamento(dataStr, true)}</td>`;
    }).join('');
    tbody.appendChild(trNotas);
}

function atualizarCabecalhoSemanal() {
    const tabela = document.querySelector('#visao-semanal .tabela-semanal thead tr');
    if (!tabela) return;

    const inicio = obterInicioSemana(app.semanaAtual);
    const hojeStr = formatarDataChave(new Date());
    tabela.innerHTML = '<th>Refeicao</th>' + DIAS_SEMANA.map((dia, indice) => {
        const data = new Date(inicio);
        data.setDate(inicio.getDate() + indice);
        const classeHoje = formatarDataChave(data) === hojeStr ? ' class="coluna-hoje"' : '';
        return `<th${classeHoje}>${dia.nome}<br><span class="data-cabecalho">${data.getDate()}/${data.getMonth() + 1}</span></th>`;
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
        planejamentoPertenceAoAtivo(p) &&
        Number(p.semana) === Number(semana) &&
        normalizarDiaSemana(p.dia) === normalizarDiaSemana(dia) &&
        p.refeicao === tipo &&
        !ids.has(p.id)
    );

    return planejamentosData.concat(planejamentosLegados);
}

function buscarPlanejamentosPorSemana(semana, tipo) {
    return app.planejamentos.filter(p =>
        !planejamentoEhNotaDia(p) &&
        p.tipo === 'mensal' &&
        Number(p.semana) === Number(semana) &&
        p.refeicao === tipo
    );
}

function buscarReceita(id) {
    return app.receitas.find(r => r.id === id);
}

function abrirModalPlanejar(semana, dia, tipo, data = '') {
    // Guardar contexto
    window.contextoPlanejar = {
        modo: 'semanal',
        grupo: obterGrupoPlanejamentoAtivo(),
        semana,
        dia: normalizarDiaSemana(dia),
        data: data || formatarDataChave(obterDataSemanaDia(semana, dia)),
        refeicao: tipo,
        planejamentoId: null,
    };

    renderizarReceitasModalSelecao();
    abrirModal('modal-selecionar-receita');
}

function abrirModalPlanejarSemana(semana, tipo) {
    window.contextoPlanejar = {
        modo: 'mensal',
        grupo: obterGrupoPlanejamentoAtivo(),
        semana,
        dia: '',
        data: '',
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
        grupo: normalizarGrupoPlanejamento(plano.grupo),
        semana: plano.semana,
        dia: normalizarDiaSemana(plano.dia),
        data: plano.data || (plano.semana && plano.dia ? formatarDataChave(obterDataSemanaDia(plano.semana, plano.dia)) : ''),
        refeicao: plano.refeicao,
        planejamentoId: id,
    };

    renderizarReceitasModalSelecao();
    abrirModal('modal-selecionar-receita');
}

function atualizarFiltrosModalSelecao() {
    const tipoSelect = document.getElementById('filtro-selecao-tipo');
    const categoriaSelect = document.getElementById('filtro-selecao-categoria');
    const tagSelect = document.getElementById('filtro-selecao-tag');

    if (tipoSelect) {
        const valorAtual = tipoSelect.value;
        tipoSelect.innerHTML = '<option value="">Todos os tipos</option>' +
            app.tiposRefeicao.map(tipo => `<option value="${escaparHtml(tipo)}">${escaparHtml(tipo)}</option>`).join('');
        tipoSelect.value = app.tiposRefeicao.includes(valorAtual) ? valorAtual : '';
    }

    if (categoriaSelect) {
        const valorAtual = categoriaSelect.value;
        const categorias = Array.from(new Set([
            ...app.categorias,
            ...app.categoriasRefeicoes,
            ...app.categoriasAlimentos,
        ])).filter(Boolean).sort((a, b) => a.localeCompare(b, 'pt-BR'));

        categoriaSelect.innerHTML = '<option value="">Todas as categorias</option>' +
            categorias.map(categoria => `<option value="${escaparHtml(categoria)}">${escaparHtml(categoria)}</option>`).join('');
        categoriaSelect.value = categorias.includes(valorAtual) ? valorAtual : '';
    }

    if (tagSelect) {
        const valorAtual = tagSelect.value;
        tagSelect.innerHTML = '<option value="">Todas as tags</option>' +
            app.tags.map(tag => `<option value="${escaparHtml(tag)}">${escaparHtml(tag)}</option>`).join('');
        tagSelect.value = app.tags.includes(valorAtual) ? valorAtual : '';
    }
}

function selecionarFiltroItemModal(botao) {
    const input = document.getElementById('filtro-selecao-item');
    if (!input) return;

    document.querySelectorAll('.segmentos-selecao .segmento').forEach(item => {
        item.classList.remove('ativo');
    });

    botao.classList.add('ativo');
    input.value = botao.dataset.filtroItem || '';
    buscarReceitasModal();
}

function limparFiltrosModalSelecao() {
    const busca = document.getElementById('busca-selecionar');
    const item = document.getElementById('filtro-selecao-item');
    const tipo = document.getElementById('filtro-selecao-tipo');
    const categoria = document.getElementById('filtro-selecao-categoria');
    const tag = document.getElementById('filtro-selecao-tag');
    const ordenacao = document.getElementById('ordenacao-selecao');

    if (busca) busca.value = '';
    if (item) item.value = '';
    if (tipo) tipo.value = '';
    if (categoria) categoria.value = '';
    if (tag) tag.value = '';
    if (ordenacao) ordenacao.value = 'tipo';

    document.querySelectorAll('.segmentos-selecao .segmento').forEach(botao => {
        botao.classList.toggle('ativo', !botao.dataset.filtroItem);
    });

    buscarReceitasModal();
}

function alternarNovoItemPlanejamento(forcarAbrir = null) {
    const painel = document.getElementById('opcoes-novo-item-planejamento');
    if (!painel) return;

    const abrir = forcarAbrir === null ? painel.style.display === 'none' : Boolean(forcarAbrir);
    painel.style.display = abrir ? 'grid' : 'none';
}

function criarItemParaPlanejamento(itemTipo) {
    window.reabrirSelecaoAposCadastro = true;
    alternarNovoItemPlanejamento(false);
    fecharModal('modal-selecionar-receita');

    if (itemTipo === 'alimento') {
        abrirModalAlimento();
        return;
    }

    if (itemTipo === 'refeicao') {
        abrirModalRefeicao();
        return;
    }

    abrirModalReceita();
}

function reabrirSelecaoPlanejamentoAposCadastro() {
    if (!window.reabrirSelecaoAposCadastro || !window.contextoPlanejar) return;

    window.reabrirSelecaoAposCadastro = false;
    renderizarReceitasModalSelecao();
    abrirModal('modal-selecionar-receita');
}

function renderizarReceitasModalSelecao() {
    const lista = document.getElementById('lista-selecionar-receita');
    atualizarFiltrosModalSelecao();
    lista.innerHTML = '';

    if (app.receitas.length === 0 && app.refeicoes.length === 0 && app.alimentos.length === 0) {
        lista.innerHTML = '<div class="sem-resultados">Nenhuma receita, refeicao ou alimento cadastrado ainda.</div>';
        return;
    }

    obterItensOrdenadosModalSelecao().forEach(item => {
        lista.appendChild(criarLinhaModalSelecao(item));
    });

    buscarReceitasModal();
}

function obterItensOrdenadosModalSelecao() {
    const itens = [
        ...app.receitas.map(receita => criarItemModalSelecao('receita', receita)),
        ...app.refeicoes.map(refeicao => criarItemModalSelecao('refeicao', refeicao)),
        ...app.alimentos.map(alimento => criarItemModalSelecao('alimento', alimento)),
    ];

    const ordenacao = document.getElementById('ordenacao-selecao')?.value || 'tipo';
    const pesoTipo = { receita: 1, refeicao: 2, alimento: 3 };

    return itens.sort((a, b) => {
        if (ordenacao === 'nome') {
            return a.nome.localeCompare(b.nome, 'pt-BR') ||
                (pesoTipo[a.itemTipo] - pesoTipo[b.itemTipo]);
        }

        if (ordenacao === 'categoria') {
            return a.categoria.localeCompare(b.categoria, 'pt-BR') ||
                a.nome.localeCompare(b.nome, 'pt-BR');
        }

        return (pesoTipo[a.itemTipo] - pesoTipo[b.itemTipo]) ||
            a.nome.localeCompare(b.nome, 'pt-BR');
    });
}

function criarItemModalSelecao(itemTipo, item) {
    const tipos = itemTipo === 'alimento' ? [] : obterTiposReceita(item);
    const tags = obterTagsReceita(item);

    return {
        itemTipo,
        id: item.id,
        nome: item.nome || '',
        categoria: item.categoria || '',
        tipos,
        tags,
    };
}

function obterRotuloItemModalSelecao(itemTipo) {
    if (itemTipo === 'alimento') return 'Alimento';
    if (itemTipo === 'refeicao') return 'Refeicao';
    return 'Receita';
}

function criarLinhaModalSelecao(item) {
    const div = document.createElement('div');
    div.className = `item-selecao linha-selecao linha-selecao-${item.itemTipo}`;
    div.dataset.itemTipo = item.itemTipo;
    div.dataset.nome = item.nome;
    div.dataset.tipos = item.tipos.join('|');
    div.dataset.categoria = item.categoria;
    div.dataset.tags = item.tags.join('|');

    const tipoClasse = item.itemTipo === 'alimento'
        ? 'badge-alimento'
        : item.itemTipo === 'refeicao'
            ? 'badge-refeicao'
            : 'badge-receita';
    const detalhes = [
        item.categoria || 'Sem categoria',
        item.tipos.slice(0, 2).join(', '),
    ].filter(Boolean).join(' - ');
    const tagsHtml = item.tags.length > 0
        ? `<div class="tags-selecao">${item.tags.slice(0, 3).map(tag => renderizarBadgeTag(tag)).join('')}</div>`
        : '<div class="tags-selecao tags-selecao-vazia">Sem tags</div>';

    div.innerHTML = `
        <div class="linha-selecao-identidade">
            <span class="icone-selecao" aria-hidden="true">${item.itemTipo === 'alimento' ? 'A' : item.itemTipo === 'refeicao' ? 'M' : 'R'}</span>
            <div>
                <h3>${escaparHtml(item.nome)}</h3>
                <p>${escaparHtml(detalhes)}</p>
            </div>
        </div>
        ${tagsHtml}
        <span class="badge-item ${tipoClasse}">${obterRotuloItemModalSelecao(item.itemTipo)}</span>
        <button onclick="selecionarItemParaPlano('${item.itemTipo}', '${item.id}')" class="btn-principal btn-selecionar-linha">
            Selecionar
        </button>
    `;

    return div;
}

function selecionarReceitaParaPlano(receitaId) {
    selecionarItemParaPlano('receita', receitaId);
}

function selecionarItemParaPlano(itemTipo, itemId) {
    const ctx = window.contextoPlanejar;
    if (!ctx) return;

    const planejamentoExistente = ctx.planejamentoId
        ? app.planejamentos.find(p => p.id === ctx.planejamentoId)
        : null;

    if (planejamentoExistente) {
        const agora = new Date().toISOString();
        planejamentoExistente.itemTipo = itemTipo;
        planejamentoExistente.itemId = itemId;
        planejamentoExistente.receitaId = itemTipo === 'receita' ? itemId : '';
        planejamentoExistente.grupo = normalizarGrupoPlanejamento(ctx.grupo || planejamentoExistente.grupo);
        planejamentoExistente.refeicao = ctx.refeicao;
        planejamentoExistente.data = ctx.data || '';
        planejamentoExistente.semana = ctx.semana || planejamentoExistente.semana;
        planejamentoExistente.dia = ctx.dia || '';
        planejamentoExistente.tipo = ctx.modo === 'calendario'
            ? 'calendario'
            : ctx.modo === 'mensal'
                ? 'mensal'
                : 'semanal';
        planejamentoExistente.dataAtualizacao = agora;
        salvarDados();
        renderizarAposPlanejamento(ctx.modo);
        fecharModal('modal-selecionar-receita');
        console.log('Planejamento atualizado:', planejamentoExistente);
        return;
    }

    const isCalendario = ctx.modo === 'calendario';
    const isMensal = ctx.modo === 'mensal';

    const agora = new Date().toISOString();
    const planeamento = {
        id: 'plan_' + Date.now(),
        grupo: normalizarGrupoPlanejamento(ctx.grupo || app.planejamentoAtivo),
        itemTipo,
        itemId,
        receitaId: itemTipo === 'receita' ? itemId : '',
        refeicao: ctx.refeicao,
        tipo: isCalendario ? 'calendario' : isMensal ? 'mensal' : 'semanal',
        data: isMensal ? '' : ctx.data,
        semana: ctx.semana,
        dia: isMensal ? '' : ctx.dia,
        dataCriacao: agora,
        dataAtualizacao: agora,
    };

    app.planejamentos.push(planeamento);
    removerExclusao('planejamentos', chavePlanejamento(planeamento));
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
    renderizarContagemAlimentos();
}

function removerPlanejamento(id) {
    if (confirm('Remover este planejamento?')) {
        const plano = app.planejamentos.find(p => p.id === id);
        if (plano) registrarExclusao('planejamentos', chavePlanejamento(plano));
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
        `${obterNomePlanejamentoAtivo()} - Semana ${app.semanaAtual} (${inicio.getDate()}/${inicio.getMonth() + 1} a ${fim.getDate()}/${fim.getMonth() + 1})`;
    document.getElementById('numero-semana').value = app.semanaAtual;
}

/* ==================== VISAO MENSAL ====================
   Renderiza itens associados a semanas do mes */

function obterSemanasMesPlanejamento() {
    const primeiroDiaMes = new Date(app.anoAtual, app.mesAtual, 1);
    const ultimoDiaMes = new Date(app.anoAtual, app.mesAtual + 1, 0);
    const cursor = new Date(primeiroDiaMes);
    cursor.setDate(primeiroDiaMes.getDate() - obterIndiceSemanaSegunda(primeiroDiaMes));

    const semanas = [];
    while (cursor <= ultimoDiaMes) {
        const inicio = new Date(cursor);
        const fim = new Date(cursor);
        fim.setDate(cursor.getDate() + 6);
        semanas.push({
            indice: semanas.length + 1,
            numero: obterNumeroSemana(inicio),
            inicio,
            fim,
        });
        cursor.setDate(cursor.getDate() + 7);
    }

    return semanas;
}

function formatarIntervaloSemanaCurto(semana) {
    const mesmoMes = semana.inicio.getMonth() === semana.fim.getMonth();
    const inicio = mesmoMes
        ? String(semana.inicio.getDate())
        : `${semana.inicio.getDate()}/${semana.inicio.getMonth() + 1}`;
    const fim = `${semana.fim.getDate()}/${semana.fim.getMonth() + 1}`;
    return `${inicio} a ${fim}`;
}

function renderizarMensal() {
    const container = document.getElementById('container-semanas-mensais');
    container.innerHTML = '';
    atualizarTituloMes();

    const semanas = obterSemanasMesPlanejamento();
    const wrapper = document.createElement('div');
    wrapper.className = 'semana-mensal planejamento-mensal-semanas';

    const table = document.createElement('table');
    table.className = 'tabela-semanal tabela-mensal-semanas';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Semana</th>
                ${semanas.map(semana => `
                    <th>
                        ${semana.indice}
                        <br>
                        <span class="data-cabecalho">(${formatarIntervaloSemanaCurto(semana)})</span>
                    </th>
                `).join('')}
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');
    app.tiposUso.forEach(tipo => {
        const tr = document.createElement('tr');
        let html = `<td class="refeicao-nome">${escaparHtml(tipo)}</td>`;

        semanas.forEach(semana => {
            const planos = buscarPlanejamentosPorSemana(semana.numero, tipo);
            const tipoParam = encodeURIComponent(tipo);

            if (planos.length > 0) {
                html += `
                    <td>
                        ${renderizarListaPlanejamentos(planos, true)}
                        <button class="btn-adicionar-mini" onclick="abrirModalPlanejarSemana('${semana.numero}', decodeURIComponent('${tipoParam}'))">
                            Adicionar
                        </button>
                    </td>
                `;
            } else {
                html += `
                    <td class="celula-vazia" onclick="abrirModalPlanejarSemana('${semana.numero}', decodeURIComponent('${tipoParam}'))">
                        <span class="btn-add-celula">+</span>
                    </td>
                `;
            }
        });

        tr.innerHTML = html;
        tbody.appendChild(tr);
    });

    wrapper.appendChild(table);
    container.appendChild(wrapper);
}
function atualizarTituloMes() {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    document.getElementById('titulo-mes').textContent = 
        `${obterNomePlanejamentoAtivo()} - ${meses[app.mesAtual]} ${app.anoAtual}`;
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

function renderizarItemPlanejamentoDiario(plano) {
    const { tipo: tipoItem, item } = buscarItemPlanejamento(plano);

    if (!item) {
        return `
            <div class="item-planejamento-diario">
                <div class="conteudo-planejamento">
                    <p><strong>Item removido</strong></p>
                    ${renderizarCheckPlanejamento(plano)}
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
                <p><strong>${escaparHtml(item.nome)}</strong></p>
                ${renderizarCheckPlanejamento(plano)}
            </div>
            <div class="acoes-planejamento">
                <button onclick="abrirEdicaoPlanejamento('${plano.id}')">Editar</button>
                ${tipoItem === 'receita' ? `<button onclick="marcarComoConsumida('${item.id}')">Consumida</button>` : ''}
                <button onclick="removerPlanejamento('${plano.id}')" class="btn-acao-remover">Remover</button>
            </div>
        </div>
    `;
}

function renderizarGrupoDiario(grupo, dataString, tipo) {
    const planos = buscarPlanejamentosPorDataGrupo(dataString, tipo, grupo.id);
    const tipoParam = encodeURIComponent(tipo);
    const itensHtml = planos.length > 0
        ? planos.map(renderizarItemPlanejamentoDiario).join('')
        : '<p class="sem-planejamento-diario">Sem refeicao planejada</p>';

    return `
        <section class="grupo-diaria grupo-diaria-${grupo.id}">
            <h4>${escaparHtml(grupo.nome)}</h4>
            ${itensHtml}
            <button onclick="abrirModalPlanejarData('${dataString}', decodeURIComponent('${tipoParam}'), '${grupo.id}')">
                Adicionar
            </button>
        </section>
    `;
}

function renderizarResumoSemanaDiaria(data) {
    const semana = obterNumeroSemana(data);
    const inicio = obterInicioSemana(semana, data.getFullYear());
    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
    const intervalo = `${inicio.getDate()}/${inicio.getMonth() + 1} a ${fim.getDate()}/${fim.getMonth() + 1}`;
    const colunas = app.tiposUso.map(tipo => {
        const planos = buscarPlanejamentosPorSemana(semana, tipo);
        const tipoParam = encodeURIComponent(tipo);
        const itensHtml = planos.length > 0
            ? renderizarListaPlanejamentos(planos, true)
            : '<p class="sem-planejamento-diario">Sem planejamento</p>';

        return `
            <div class="coluna-semana-diaria">
                <div class="tipo-uso-semana-diaria">${escaparHtml(tipo)}</div>
                <div class="planejamentos-semana-diaria">${itensHtml}</div>
                <button onclick="abrirModalPlanejarSemana('${semana}', decodeURIComponent('${tipoParam}'))">
                    Adicionar
                </button>
            </div>
        `;
    }).join('');

    return `
        <section class="card-diario card-semana-diaria">
            <h3>Semana ${semana} <span>${intervalo}</span></h3>
            <div class="grade-semana-diaria">
                ${colunas}
            </div>
        </section>
    `;
}

function renderizarDiaria() {
    const container = document.getElementById('container-diaria');
    const titulo = document.getElementById('titulo-dia');
    container.innerHTML = '';

    // Formatar data
    const opcoes = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dataFormatada = dataDiaria.toLocaleDateString('pt-BR', opcoes);
    titulo.textContent = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);

    // Buscar refeicoes planejadas para essa data
    const dataString = formatarDataChave(dataDiaria);

    const blocoNotas = document.createElement('div');
    blocoNotas.className = 'card-diario card-notas-planejamento';
    blocoNotas.innerHTML = renderizarCampoNotaPlanejamento(dataString);
    container.appendChild(blocoNotas);

    app.tiposRefeicao.forEach(tipo => {
        const card = document.createElement('div');
        card.className = 'card-diario';
        card.innerHTML = `
            <h3>${escaparHtml(tipo)}</h3>
            <div class="grupos-diaria">
                ${app.planejamentosGrupos.map(grupo => renderizarGrupoDiario(grupo, dataString, tipo)).join('')}
            </div>
        `;

        container.appendChild(card);
    });

    container.insertAdjacentHTML('beforeend', renderizarResumoSemanaDiaria(dataDiaria));
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

function abrirModalPlanejarData(data, tipo, grupo = '') {
    const semanaDia = obterSemanaDiaPorData(criarDataLocal(data));
    window.contextoPlanejar = {
        modo: 'calendario',
        grupo: grupo ? normalizarGrupoPlanejamento(grupo) : obterGrupoPlanejamentoAtivo(),
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
        `${obterNomePlanejamentoAtivo()} - ${meses[mesCalendario]} ${anoCalendario}`;

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
        const dataStr = formatarDataChave(data);
        if (app.tiposRefeicao.some(tipo => buscarPlanejamentosPorData(dataStr, tipo).length > 0)) {
            div.classList.add('com-refeicao');
        }

        if (buscarNotaPlanejamentoPorData(dataStr)) {
            div.classList.add('com-nota');
        }
    }

    return div;
}

function selecionarDataCalendario(data) {
    dataSelecionada = data;
    renderizarCalendario();
}

function atualizarDetalhesData(data) {
    const dataStr = formatarDataChave(data);
    const opcoes = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('data-selecionada').textContent = 
        data.toLocaleDateString('pt-BR', opcoes).charAt(0).toUpperCase() +
        data.toLocaleDateString('pt-BR', opcoes).slice(1);

    const refeicoes = document.getElementById('refeicoes-data');
    refeicoes.innerHTML = '';

    const blocoNotas = document.createElement('div');
    blocoNotas.className = 'detalhes-notas-planejamento';
    blocoNotas.innerHTML = renderizarCampoNotaPlanejamento(dataStr);
    refeicoes.appendChild(blocoNotas);

    app.tiposRefeicao.forEach(tipo => {
        const planos = buscarPlanejamentosPorData(dataStr, tipo);

        const div = document.createElement('div');
        div.className = 'item-refeicao-data';

        if (planos.length > 0) {
            div.innerHTML = `
                <strong>${tipo}:</strong>
                <div class="lista-planejamentos-data">
                    ${planos.map(plano => {
                        const { item } = buscarItemPlanejamento(plano);
                        return `
                            <div class="linha-planejamento-data">
                                <span>${item ? escaparHtml(item.nome) : 'Item removido'}</span>
                                ${renderizarCheckPlanejamento(plano)}
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

    const dataStr = formatarDataChave(dataSelecionada);
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
    document.querySelector('#modal-receita h2').textContent = 'Nova Receita';
    atualizarSelectTipos();
    atualizarSelectCategorias();
    atualizarSelectTags();
    renderizarIngredientesReceita();
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

function renderizarOpcaoTag(tag, selecionada, name) {
    const cor = gerarCorTag(tag);
    const texto = corTextoParaFundo(cor);
    return `
        <label class="opcao-checkbox opcao-checkbox-tag" style="--tag-cor:${cor};--tag-texto:${texto};">
            <input type="checkbox" name="${name}" value="${escaparHtml(tag)}" ${selecionada ? 'checked' : ''}>
            <span>${escaparHtml(tag)}</span>
        </label>
    `;
}

function renderizarCheckboxesTags(containerId, name, tagsSelecionadas = []) {
    const container = document.getElementById(containerId);
    if (!container) return;

    normalizarTags();
    container.innerHTML = app.tags
        .map(tag => renderizarOpcaoTag(tag, tagsSelecionadas.includes(tag), name))
        .join('');
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
            ${tags.map(tag => renderizarBadgeTag(tag)).join('')}
        </div>
    `;
}

function gerarCorTag(tag) {
    const cores = [
        '#8B4513',
        '#2f6f5e',
        '#7c4f94',
        '#b25d1c',
        '#4f6f9f',
        '#9f5f6f',
        '#6d7d2d',
        '#5f4b32',
    ];
    return cores[chaveCategoria(tag).split('').reduce((total, char) => total + char.charCodeAt(0), 0) % cores.length];
}

function renderizarBadgeTag(tag) {
    const cor = gerarCorTag(tag);
    const texto = corTextoParaFundo(cor);
    return `<span class="badge-tag badge-tag-colorida" style="--tag-cor:${cor};--tag-texto:${texto};">${escaparHtml(tag)}</span>`;
}

function formatarIngredienteReceita(ingrediente) {
    if (typeof ingrediente === 'string') return ingrediente;
    const alimento = buscarAlimento(ingrediente.alimentoId);
    const nome = alimento ? alimento.nome : ingrediente.nome;
    const quantidade = ingrediente.quantidade ? `${ingrediente.quantidade} ` : '';
    const unidade = ingrediente.unidade ? `${ingrediente.unidade} ` : '';
    return nome ? `${quantidade}${unidade}${nome}`.trim() : '';
}

function obterIngredientesReceita(receita) {
    if (!receita || !Array.isArray(receita.ingredientes)) return [];

    return receita.ingredientes.map(formatarIngredienteReceita).filter(Boolean);
}

function criarOpcaoAlimento(alimentoIdSelecionado = '') {
    return app.alimentos
        .slice()
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
        .map(alimento => `
            <option value="${alimento.id}" ${alimento.id === alimentoIdSelecionado ? 'selected' : ''}>
                ${escaparHtml(alimento.nome)}${alimento.categoria ? ` (${escaparHtml(alimento.categoria)})` : ''}
            </option>
        `)
        .join('');
}

function renderizarIngredientesReceita(ingredientes = []) {
    const container = document.getElementById('lista-ingredientes-receita');
    if (!container) return;

    container.innerHTML = '';
    ingredientes.forEach(ingrediente => adicionarLinhaIngredienteReceita(ingrediente));
}

function adicionarLinhaIngredienteReceita(ingrediente = {}) {
    const container = document.getElementById('lista-ingredientes-receita');
    if (!container) return;

    if (app.alimentos.length === 0) {
        container.innerHTML = '<div class="sem-resultados ingredientes-vazio">Cadastre alimentos antes de adicionar ingredientes.</div>';
        return;
    }

    container.querySelector('.ingredientes-vazio')?.remove();

    const ingredienteNormalizado = normalizarIngredienteReceita(ingrediente);
    const alimentoId = ingredienteNormalizado?.alimentoId || app.alimentos[0]?.id || '';
    const linha = document.createElement('div');
    linha.className = 'linha-ingrediente-receita';
    linha.innerHTML = `
        <select class="ingrediente-alimento">
            <option value="">Selecione um alimento</option>
            ${criarOpcaoAlimento(alimentoId)}
        </select>
        <input class="ingrediente-quantidade" type="text" inputmode="decimal" placeholder="Qtd" value="${escaparHtml(ingredienteNormalizado?.quantidade || '')}">
        <input class="ingrediente-unidade" type="text" placeholder="Unidade" value="${escaparHtml(ingredienteNormalizado?.unidade || '')}">
        <button type="button" class="btn-remover-ingrediente" onclick="removerLinhaIngredienteReceita(this)">Remover</button>
    `;
    container.appendChild(linha);
}

function removerLinhaIngredienteReceita(botao) {
    botao.closest('.linha-ingrediente-receita')?.remove();
}

function atualizarSelectsIngredientesReceita() {
    document.querySelectorAll('.linha-ingrediente-receita .ingrediente-alimento').forEach(select => {
        const valorAtual = select.value;
        select.innerHTML = '<option value="">Selecione um alimento</option>' + criarOpcaoAlimento(valorAtual);
        select.value = app.alimentos.some(alimento => alimento.id === valorAtual) ? valorAtual : '';
    });
}

function obterIngredientesSelecionadosReceita() {
    return Array.from(document.querySelectorAll('.linha-ingrediente-receita'))
        .map(linha => {
            const alimentoId = linha.querySelector('.ingrediente-alimento')?.value || '';
            const alimento = buscarAlimento(alimentoId);
            if (!alimento) return null;

            return {
                alimentoId,
                nome: alimento.nome,
                quantidade: linha.querySelector('.ingrediente-quantidade')?.value.trim() || '',
                unidade: linha.querySelector('.ingrediente-unidade')?.value.trim() || '',
            };
        })
        .filter(Boolean);
}

function salvarReceita(e) {
    e.preventDefault();

    const tiposSelecionados = obterTiposSelecionadosReceita();
    const id = document.getElementById('form-receita').dataset.receitaId || 'receita_' + Date.now();
    const existente = app.receitas.find(item => item.id === id);
    const agora = new Date().toISOString();
    const receita = {
        id: id,
        nome: document.getElementById('nome-receita').value,
        tipo: tiposSelecionados[0] || '',
        tipos: tiposSelecionados,
        categoria: document.getElementById('categoria-receita').value,
        tags: obterTagsSelecionadasReceita(),
        ingredientes: obterIngredientesSelecionadosReceita(),
        modoPreparo: document.getElementById('preparo-receita').value,
        dataCriacao: existente?.dataCriacao || agora,
        dataAtualizacao: agora,
    };

    // Verificar se e edicao ou novo
    const indice = app.receitas.findIndex(r => r.id === id);
    if (indice >= 0) {
        app.receitas[indice] = receita;
    } else {
        app.receitas.push(receita);
        removerExclusao('receitas', chaveReceita(receita));
    }
    if (receita.categoria) removerExclusao('categorias', normalizarNomeAlimento(receita.categoria));
    receita.tags.forEach(tag => removerExclusao('tags', normalizarNomeAlimento(tag)));
    receita.tipos.forEach(tipo => removerExclusao('tiposRefeicao', normalizarNomeAlimento(tipo)));

    salvarDados();
    fecharModal('modal-receita');
    normalizarCategorias();
    atualizarSelectCategorias();
    atualizarFiltroCategoria();
    normalizarTags();
    atualizarSelectTags();
    atualizarSelectsItensRefeicao();
    renderizarTudoAposSync();

    console.log('Receita salva:', receita);
    reabrirSelecaoPlanejamentoAposCadastro();
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
                ${renderizarBadgeCategoria(receita.categoria, 'receita')}
                ${renderizarBadgesTags(receita)}
                ${obterIngredientesReceita(receita).length > 0 ? `
                    <p><strong>Ingredientes:</strong><br>${obterIngredientesReceita(receita).slice(0, 3).join('<br>')}</p>
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
    renderizarIngredientesReceita(receita.ingredientes || []);
    document.getElementById('preparo-receita').value = receita.modoPreparo;
    document.querySelector('#modal-receita h2').textContent = 'Editar Receita';

    abrirModal('modal-receita');
}

function deletarReceita(id) {
    if (confirm('Deletar esta receita?')) {
        const receita = app.receitas.find(r => r.id === id);
        if (receita) registrarExclusao('receitas', chaveReceita(receita));
        app.planejamentos
            .filter(p => obterTipoItemPlano(p) === 'receita' && obterItemIdPlano(p) === id)
            .forEach(p => registrarExclusao('planejamentos', chavePlanejamento(p)));
        app.receitas = app.receitas.filter(r => r.id !== id);
        app.refeicoes.forEach(refeicao => {
            if (Array.isArray(refeicao.itens)) {
                refeicao.itens = refeicao.itens.filter(item =>
                    !(item.itemTipo === 'receita' && item.itemId === id)
                );
                refeicao.dataAtualizacao = new Date().toISOString();
            }
        });
        app.planejamentos = app.planejamentos.filter(p => !(obterTipoItemPlano(p) === 'receita' && obterItemIdPlano(p) === id));
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
    normalizarCategorias();

    if (!select) return;

    const valorAtual = select.value;
    select.innerHTML = '<option value="">Todas as categorias</option>';

    app.categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });

    select.value = app.categorias.includes(valorAtual) ? valorAtual : '';
}

function atualizarFiltroCategoriaRefeicao() {
    const filtro = document.getElementById('filtro-categoria-refeicao');
    if (!filtro) return;

    normalizarCategoriasRefeicoes();
    const valorAtual = filtro.value;
    filtro.innerHTML = '<option value="">Todas as categorias</option>';

    app.categoriasRefeicoes.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        filtro.appendChild(option);
    });

    filtro.value = app.categoriasRefeicoes.includes(valorAtual) ? valorAtual : '';
}

function buscarReceitasModal() {
    const termo = document.getElementById('busca-selecionar')?.value.toLowerCase() || '';
    const itemTipo = document.getElementById('filtro-selecao-item')?.value || '';
    const tipoRefeicao = document.getElementById('filtro-selecao-tipo')?.value || '';
    const categoria = document.getElementById('filtro-selecao-categoria')?.value || '';
    const tag = document.getElementById('filtro-selecao-tag')?.value || '';
    const cards = document.querySelectorAll('.lista-receitas-modal .item-selecao');
    let visiveis = 0;

    cards.forEach(card => {
        const texto = card.textContent.toLowerCase();
        const tipos = (card.dataset.tipos || '').split('|').filter(Boolean);
        const tags = (card.dataset.tags || '').split('|').filter(Boolean);

        const passaBusca = !termo || texto.includes(termo);
        const passaItem = !itemTipo || card.dataset.itemTipo === itemTipo;
        const passaTipo = !tipoRefeicao || tipos.includes(tipoRefeicao);
        const passaCategoria = !categoria || card.dataset.categoria === categoria;
        const passaTag = !tag || tags.includes(tag);

        const visivel = passaBusca && passaItem && passaTipo && passaCategoria && passaTag;
        card.style.display = visivel ? 'grid' : 'none';
        if (visivel) visiveis++;
    });

    const contador = document.getElementById('resultado-selecao-contador');
    if (contador) {
        contador.textContent = `${visiveis} ${visiveis === 1 ? 'item encontrado' : 'itens encontrados'}`;
    }
}

/* ==================== REFEICOES ====================
   Gerenciar refeicoes compostas por receitas e/ou alimentos */

function abrirModalRefeicao(id = '') {
    const form = document.getElementById('form-refeicao');
    if (!form) return;

    form.reset();
    form.dataset.refeicaoId = id;
    document.querySelector('#modal-refeicao h2').textContent = id ? 'Editar Refeicao' : 'Nova Refeicao';
    atualizarSelectTiposRefeicaoComposta();
    atualizarSelectCategoriasRefeicao();
    atualizarSelectTagsRefeicao();
    renderizarItensRefeicao();

    if (id) {
        const refeicao = buscarRefeicao(id);
        if (!refeicao) return;
        document.getElementById('nome-refeicao-composta').value = refeicao.nome;
        atualizarSelectTiposRefeicaoComposta(obterTiposReceita(refeicao));
        atualizarSelectCategoriasRefeicao(refeicao.categoria);
        atualizarSelectTagsRefeicao(obterTagsReceita(refeicao));
        document.getElementById('categoria-refeicao-composta').value = refeicao.categoria || '';
        document.getElementById('observacoes-refeicao').value = refeicao.observacoes || '';
        renderizarItensRefeicao(refeicao.itens || []);
    }

    abrirModal('modal-refeicao');
}

function atualizarSelectTiposRefeicaoComposta(tiposSelecionados = []) {
    const container = document.getElementById('tipo-refeicao-composta');
    if (!container) return;

    container.innerHTML = '';
    app.tiposRefeicao.forEach(tipo => {
        const label = document.createElement('label');
        label.className = 'opcao-checkbox';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'tipos-refeicao-composta';
        checkbox.value = tipo;
        checkbox.checked = tiposSelecionados.includes(tipo);

        const span = document.createElement('span');
        span.textContent = tipo;

        label.appendChild(checkbox);
        label.appendChild(span);
        container.appendChild(label);
    });
}

function atualizarSelectCategoriasRefeicao(categoriaAtual = '') {
    const select = document.getElementById('categoria-refeicao-composta');
    if (!select) return;

    normalizarCategoriasRefeicoes();
    select.innerHTML = '<option value="">Sem categoria</option>';

    if (categoriaAtual && !app.categoriasRefeicoes.includes(categoriaAtual)) {
        app.categoriasRefeicoes.push(categoriaAtual);
        normalizarCategoriasRefeicoes();
    }

    app.categoriasRefeicoes.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria;
        option.textContent = categoria;
        select.appendChild(option);
    });
}

function atualizarSelectTagsRefeicao(tagsSelecionadas = []) {
    renderizarCheckboxesTags('tags-refeicao-composta', 'tags-refeicao-composta', tagsSelecionadas);
}

function obterTiposSelecionadosRefeicao() {
    return Array.from(document.querySelectorAll('input[name="tipos-refeicao-composta"]:checked'))
        .map(input => input.value);
}

function obterTagsSelecionadasRefeicao() {
    return Array.from(document.querySelectorAll('input[name="tags-refeicao-composta"]:checked'))
        .map(input => input.value);
}

function obterItensDisponiveisRefeicao(tipo) {
    return tipo === 'alimento' ? app.alimentos : app.receitas;
}

function criarOpcaoItemRefeicao(tipo, itemIdSelecionado = '') {
    return obterItensDisponiveisRefeicao(tipo)
        .slice()
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
        .map(item => `
            <option value="${item.id}" ${item.id === itemIdSelecionado ? 'selected' : ''}>
                ${escaparHtml(item.nome)}${item.categoria ? ` (${escaparHtml(item.categoria)})` : ''}
            </option>
        `)
        .join('');
}

function renderizarItensRefeicao(itens = []) {
    const container = document.getElementById('lista-itens-refeicao');
    if (!container) return;

    container.innerHTML = '';
    itens.forEach(item => adicionarLinhaItemRefeicao(item));
}

function adicionarLinhaItemRefeicao(item = {}) {
    const container = document.getElementById('lista-itens-refeicao');
    if (!container) return;

    if (app.receitas.length === 0 && app.alimentos.length === 0) {
        container.innerHTML = '<div class="sem-resultados itens-refeicao-vazio">Cadastre receitas ou alimentos antes de montar uma refeicao.</div>';
        return;
    }

    container.querySelector('.itens-refeicao-vazio')?.remove();

    const itemNormalizado = normalizarItemRefeicao(item);
    const tipo = itemNormalizado?.itemTipo || (app.receitas.length > 0 ? 'receita' : 'alimento');
    const itemId = itemNormalizado?.itemId || obterItensDisponiveisRefeicao(tipo)[0]?.id || '';
    const linha = document.createElement('div');
    linha.className = 'linha-item-refeicao';
    linha.innerHTML = `
        <select class="item-refeicao-tipo" onchange="atualizarSelectItemRefeicao(this)">
            <option value="receita" ${tipo === 'receita' ? 'selected' : ''}>Receita</option>
            <option value="alimento" ${tipo === 'alimento' ? 'selected' : ''}>Alimento</option>
        </select>
        <select class="item-refeicao-id">
            <option value="">Selecione</option>
            ${criarOpcaoItemRefeicao(tipo, itemId)}
        </select>
        <input class="item-refeicao-quantidade" type="text" inputmode="decimal" placeholder="Qtd" value="${escaparHtml(itemNormalizado?.quantidade || '')}">
        <input class="item-refeicao-unidade" type="text" placeholder="Unidade" value="${escaparHtml(itemNormalizado?.unidade || '')}">
        <button type="button" class="btn-remover-ingrediente" onclick="removerLinhaItemRefeicao(this)">Remover</button>
    `;
    container.appendChild(linha);
}

function atualizarSelectItemRefeicao(selectTipo) {
    const linha = selectTipo.closest('.linha-item-refeicao');
    const selectItem = linha?.querySelector('.item-refeicao-id');
    if (!selectItem) return;

    selectItem.innerHTML = '<option value="">Selecione</option>' + criarOpcaoItemRefeicao(selectTipo.value);
}

function removerLinhaItemRefeicao(botao) {
    botao.closest('.linha-item-refeicao')?.remove();
}

function atualizarSelectsItensRefeicao() {
    document.querySelectorAll('.linha-item-refeicao').forEach(linha => {
        const tipo = linha.querySelector('.item-refeicao-tipo')?.value || 'receita';
        const select = linha.querySelector('.item-refeicao-id');
        const valorAtual = select?.value || '';
        if (!select) return;

        select.innerHTML = '<option value="">Selecione</option>' + criarOpcaoItemRefeicao(tipo, valorAtual);
        select.value = obterItensDisponiveisRefeicao(tipo).some(item => item.id === valorAtual) ? valorAtual : '';
    });
}

function obterItensSelecionadosRefeicao() {
    return Array.from(document.querySelectorAll('.linha-item-refeicao'))
        .map(linha => {
            const itemTipo = linha.querySelector('.item-refeicao-tipo')?.value || 'receita';
            const itemId = linha.querySelector('.item-refeicao-id')?.value || '';
            const entidade = itemTipo === 'alimento' ? buscarAlimento(itemId) : buscarReceita(itemId);
            if (!entidade) return null;

            return {
                itemTipo,
                itemId,
                nome: entidade.nome,
                quantidade: linha.querySelector('.item-refeicao-quantidade')?.value.trim() || '',
                unidade: linha.querySelector('.item-refeicao-unidade')?.value.trim() || '',
            };
        })
        .filter(Boolean);
}

function formatarItemRefeicao(item) {
    const normalizado = normalizarItemRefeicao(item);
    if (!normalizado) return '';

    const quantidade = normalizado.quantidade ? `${normalizado.quantidade} ` : '';
    const unidade = normalizado.unidade ? `${normalizado.unidade} ` : '';
    const tipo = normalizado.itemTipo === 'alimento' ? 'Alimento' : 'Receita';
    return `${quantidade}${unidade}${normalizado.nome} (${tipo})`.trim();
}

function salvarRefeicao(evento) {
    evento.preventDefault();

    const tiposSelecionados = obterTiposSelecionadosRefeicao();
    const itens = obterItensSelecionadosRefeicao();
    const form = document.getElementById('form-refeicao');
    const id = form.dataset.refeicaoId || `refeicao_${Date.now()}`;
    const existente = app.refeicoes.find(item => item.id === id);
    const agora = new Date().toISOString();
    const refeicao = {
        id,
        nome: document.getElementById('nome-refeicao-composta').value.trim(),
        tipo: tiposSelecionados[0] || '',
        tipos: tiposSelecionados,
        categoria: document.getElementById('categoria-refeicao-composta').value,
        tags: obterTagsSelecionadasRefeicao(),
        itens,
        observacoes: document.getElementById('observacoes-refeicao').value.trim(),
        dataCriacao: existente?.dataCriacao || agora,
        dataAtualizacao: agora,
    };

    if (!refeicao.nome) {
        alert('Digite o nome da refeicao.');
        return;
    }

    const indice = app.refeicoes.findIndex(item => item.id === id);
    if (indice >= 0) {
        app.refeicoes[indice] = refeicao;
    } else {
        app.refeicoes.push(refeicao);
        removerExclusao('refeicoes', chaveRefeicao(refeicao));
    }
    if (refeicao.categoria) removerExclusao('categoriasRefeicoes', normalizarNomeAlimento(refeicao.categoria));
    refeicao.tags.forEach(tag => removerExclusao('tags', normalizarNomeAlimento(tag)));
    refeicao.tipos.forEach(tipo => removerExclusao('tiposRefeicao', normalizarNomeAlimento(tipo)));

    salvarDados();
    fecharModal('modal-refeicao');
    normalizarCategoriasRefeicoes();
    normalizarTags();
    renderizarTudoAposSync();
    reabrirSelecaoPlanejamentoAposCadastro();
}

function renderizarRefeicoes() {
    const container = document.getElementById('lista-refeicoes');
    if (!container) return;

    container.innerHTML = '';

    if (app.refeicoes.length === 0) {
        container.innerHTML = '<div class="sem-resultados">Nenhuma refeicao cadastrada.</div>';
        return;
    }

    app.refeicoes.forEach(refeicao => {
        const itens = Array.isArray(refeicao.itens) ? refeicao.itens.map(formatarItemRefeicao).filter(Boolean) : [];
        const card = document.createElement('div');
        card.className = 'card-receita card-refeicao';
        card.dataset.categoria = refeicao.categoria || '';
        card.innerHTML = `
            <div class="card-receita-header header-refeicao">
                <div>
                    <h3>${refeicao.nome}</h3>
                    ${renderizarBadgesTipos(refeicao)}
                </div>
            </div>
            <div class="card-receita-content">
                ${renderizarBadgeCategoria(refeicao.categoria, 'refeicao')}
                ${renderizarBadgesTags(refeicao)}
                ${itens.length > 0 ? `<p><strong>Itens:</strong><br>${itens.slice(0, 4).join('<br>')}</p>` : ''}
                ${refeicao.observacoes ? `<p>${escaparHtml(refeicao.observacoes)}</p>` : ''}
                <div class="card-receita-actions">
                    <button class="btn-editar" onclick="abrirModalRefeicao('${refeicao.id}')">Editar</button>
                    <button class="btn-deletar" onclick="deletarRefeicao('${refeicao.id}')">Deletar</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    filtrarRefeicoes();
}

function filtrarRefeicoes() {
    const busca = document.getElementById('busca-refeicoes');
    if (!busca) return;

    const termo = busca.value.toLowerCase();
    const categoria = document.getElementById('filtro-categoria-refeicao')?.value || '';
    document.querySelectorAll('#lista-refeicoes .card-refeicao').forEach(card => {
        const passaBusca = card.textContent.toLowerCase().includes(termo);
        const passaCategoria = !categoria || card.dataset.categoria === categoria;
        card.style.display = passaBusca && passaCategoria ? 'block' : 'none';
    });
}

function deletarRefeicao(id) {
    const refeicao = buscarRefeicao(id);
    if (!refeicao) return;

    const usadoEmPlanejamento = app.planejamentos.some(plano =>
        obterTipoItemPlano(plano) === 'refeicao' &&
        obterItemIdPlano(plano) === id
    );

    const mensagem = usadoEmPlanejamento
        ? `Deletar "${refeicao.nome}"? Ela sera removida dos planejamentos onde aparece.`
        : `Deletar "${refeicao.nome}"?`;

    if (!confirm(mensagem)) return;

    registrarExclusao('refeicoes', chaveRefeicao(refeicao));
    app.planejamentos
        .filter(plano => obterTipoItemPlano(plano) === 'refeicao' && obterItemIdPlano(plano) === id)
        .forEach(plano => registrarExclusao('planejamentos', chavePlanejamento(plano)));
    app.refeicoes = app.refeicoes.filter(item => item.id !== id);
    app.planejamentos = app.planejamentos.filter(plano =>
        !(obterTipoItemPlano(plano) === 'refeicao' && obterItemIdPlano(plano) === id)
    );

    salvarDados();
    renderizarTudoAposSync();
}

/* ==================== ALIMENTOS ====================
   Gerenciar alimentos avulsos e ingredientes */

function normalizarCategoriasAlimentos() {
    const categorias = new Set();

    app.categoriasAlimentos.forEach(categoria => {
        if (categoria && categoria.trim()) categorias.add(categoria.trim());
    });

    app.alimentos.forEach(alimento => {
        if (alimento.categoria && alimento.categoria.trim()) {
            categorias.add(alimento.categoria.trim());
        }
    });

    app.categoriasAlimentos = Array.from(categorias).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function atualizarSelectCategoriasAlimentos(categoriaAtual = '') {
    normalizarCategoriasAlimentos();

    const datalist = document.getElementById('categorias-alimentos-lista');
    if (datalist) {
        datalist.innerHTML = app.categoriasAlimentos
            .map(categoria => `<option value="${escaparHtml(categoria)}"></option>`)
            .join('');
    }

    const filtro = document.getElementById('filtro-categoria-alimento');
    if (filtro) {
        const valorAtual = filtro.value;
        filtro.innerHTML = '<option value="">Todas as categorias</option>' +
            app.categoriasAlimentos.map(categoria => `<option value="${escaparHtml(categoria)}">${escaparHtml(categoria)}</option>`).join('');
        filtro.value = app.categoriasAlimentos.includes(valorAtual) ? valorAtual : '';
    }

    if (categoriaAtual && !app.categoriasAlimentos.includes(categoriaAtual)) {
        app.categoriasAlimentos.push(categoriaAtual);
        normalizarCategoriasAlimentos();
    }
}

function abrirCategoriasAlimentos() {
    abrirModal('modal-categorias-alimentos');
    renderizarCategoriasAlimentos();
}

function adicionarCategoriaAlimento() {
    const input = document.getElementById('nova-categoria-alimento');
    const novaCategoria = input.value.trim();

    if (!novaCategoria) {
        alert('Digite uma categoria!');
        return;
    }

    if (app.categoriasAlimentos.some(categoria => categoria.toLowerCase() === novaCategoria.toLowerCase())) {
        alert('Esta categoria ja existe!');
        return;
    }

    app.categoriasAlimentos.push(novaCategoria);
    removerExclusao('categoriasAlimentos', normalizarNomeAlimento(novaCategoria));
    normalizarCategoriasAlimentos();
    salvarDados();
    atualizarSelectCategoriasAlimentos();
    atualizarFiltrosModalSelecao();
    input.value = '';
    renderizarCategoriasAlimentos();
}

function editarCategoriaAlimento(categoriaAtual) {
    const novaCategoria = prompt('Novo nome da categoria:', categoriaAtual);
    if (!novaCategoria) return;

    const categoriaLimpa = novaCategoria.trim();
    if (!categoriaLimpa || categoriaLimpa === categoriaAtual) return;

    if (app.categoriasAlimentos.some(categoria =>
        categoria !== categoriaAtual &&
        categoria.toLowerCase() === categoriaLimpa.toLowerCase()
    )) {
        alert('Esta categoria ja existe!');
        return;
    }

    registrarExclusao('categoriasAlimentos', normalizarNomeAlimento(categoriaAtual));
    removerExclusao('categoriasAlimentos', normalizarNomeAlimento(categoriaLimpa));
    app.categoriasAlimentos = app.categoriasAlimentos.map(categoria =>
        categoria === categoriaAtual ? categoriaLimpa : categoria
    );

    app.alimentos.forEach(alimento => {
        if (alimento.categoria === categoriaAtual) {
            alimento.categoria = categoriaLimpa;
            alimento.dataAtualizacao = new Date().toISOString();
        }
    });

    normalizarCategoriasAlimentos();
    salvarDados();
    renderizarAposAlterarCategoriasAlimentos();
}

function removerCategoriaAlimento(categoria) {
    const usada = app.alimentos.some(alimento => alimento.categoria === categoria);
    const mensagem = usada
        ? `Remover "${categoria}"? Os alimentos desta categoria ficarao sem categoria.`
        : `Remover "${categoria}"?`;

    if (!confirm(mensagem)) return;

    registrarExclusao('categoriasAlimentos', normalizarNomeAlimento(categoria));
    app.categoriasAlimentos = app.categoriasAlimentos.filter(item => item !== categoria);
    app.alimentos.forEach(alimento => {
        if (alimento.categoria === categoria) {
            alimento.categoria = '';
            alimento.dataAtualizacao = new Date().toISOString();
        }
    });

    salvarDados();
    renderizarAposAlterarCategoriasAlimentos();
}

function renderizarCategoriasAlimentos() {
    const container = document.getElementById('lista-categorias-alimentos');
    if (!container) return;

    container.innerHTML = '';
    normalizarCategoriasAlimentos();

    if (app.categoriasAlimentos.length === 0) {
        container.innerHTML = '<div class="sem-resultados">Nenhuma categoria cadastrada.</div>';
        return;
    }

    app.categoriasAlimentos.forEach(categoria => {
        const item = document.createElement('div');
        item.className = 'item-gerenciavel';

        const nome = document.createElement('span');
        nome.innerHTML = `${renderizarBadgeCategoria(categoria, 'alimento')} ${escaparHtml(categoria)}`;

        const acoes = document.createElement('div');
        acoes.className = 'acoes-gerenciavel';

        const btnEditar = document.createElement('button');
        btnEditar.className = 'btn-editar';
        btnEditar.textContent = 'Editar';
        btnEditar.onclick = () => editarCategoriaAlimento(categoria);

        const btnRemover = document.createElement('button');
        btnRemover.className = 'btn-deletar';
        btnRemover.textContent = 'Remover';
        btnRemover.onclick = () => removerCategoriaAlimento(categoria);

        acoes.appendChild(btnEditar);
        acoes.appendChild(btnRemover);
        item.appendChild(nome);
        item.appendChild(acoes);
        container.appendChild(item);
    });
}

function renderizarAposAlterarCategoriasAlimentos() {
    atualizarSelectCategoriasAlimentos();
    atualizarFiltrosModalSelecao();
    renderizarCategoriasAlimentos();
    renderizarAlimentos();
    renderizarReceitasModalSelecao();
    renderizarSemanal();
    renderizarMensal();
    renderizarDiaria();
    renderizarCalendario();
    renderizarContagemAlimentos();
}

function abrirModalAlimento(id = '') {
    const form = document.getElementById('form-alimento');
    if (!form) return;

    form.reset();
    form.dataset.alimentoId = id;
    document.querySelector('#modal-alimento h2').textContent = id ? 'Editar Alimento' : 'Novo Alimento';
    atualizarSelectCategoriasAlimentos();
    atualizarSelectTagsAlimento();

    if (id) {
        const alimento = buscarAlimento(id);
        if (!alimento) return;
        document.getElementById('nome-alimento').value = alimento.nome;
        document.getElementById('categoria-alimento').value = alimento.categoria || '';
        document.getElementById('unidade-alimento').value = alimento.unidadePadrao || '';
        atualizarSelectTagsAlimento(obterTagsReceita(alimento));
    }

    abrirModal('modal-alimento');
}

function salvarAlimento(evento) {
    evento.preventDefault();

    const form = document.getElementById('form-alimento');
    const id = form.dataset.alimentoId || criarIdAlimento();
    const nome = document.getElementById('nome-alimento').value.trim();
    const categoria = document.getElementById('categoria-alimento').value.trim();
    const unidadePadrao = document.getElementById('unidade-alimento').value.trim();
    const tags = obterTagsSelecionadasAlimento();

    if (!nome) {
        alert('Digite o nome do alimento.');
        return;
    }

    const duplicado = app.alimentos.some(alimento =>
        alimento.id !== id &&
        normalizarNomeAlimento(alimento.nome) === normalizarNomeAlimento(nome)
    );

    if (duplicado) {
        alert('Este alimento ja existe.');
        return;
    }

    const existente = app.alimentos.find(item => item.id === id);
    const agora = new Date().toISOString();
    const alimento = {
        id,
        nome,
        categoria,
        unidadePadrao,
        tags,
        dataCriacao: existente?.dataCriacao || agora,
        dataAtualizacao: agora,
    };

    const indice = app.alimentos.findIndex(item => item.id === id);
    if (indice >= 0) {
        app.alimentos[indice] = { ...app.alimentos[indice], ...alimento };
    } else {
        app.alimentos.push(alimento);
        removerExclusao('alimentos', chaveAlimento(alimento));
    }
    if (alimento.categoria) removerExclusao('categoriasAlimentos', normalizarNomeAlimento(alimento.categoria));
    alimento.tags.forEach(tag => removerExclusao('tags', normalizarNomeAlimento(tag)));

    normalizarCategoriasAlimentos();
    normalizarTags();
    salvarDados();
    fecharModal('modal-alimento');
    atualizarSelectCategoriasAlimentos();
    atualizarSelectTagsAlimento();
    atualizarSelectsIngredientesReceita();
    atualizarSelectsItensRefeicao();
    renderizarTudoAposSync();
    reabrirSelecaoPlanejamentoAposCadastro();
}

function renderizarAlimentos() {
    const container = document.getElementById('lista-alimentos');
    if (!container) return;

    container.innerHTML = '';

    if (app.alimentos.length === 0) {
        container.innerHTML = '<div class="sem-resultados">Nenhum alimento cadastrado.</div>';
        return;
    }

    app.alimentos
        .slice()
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
        .forEach(alimento => {
            const card = document.createElement('div');
            card.className = 'card-receita card-alimento';
            card.dataset.categoria = alimento.categoria || '';
            card.innerHTML = `
                <div class="card-receita-header header-alimento">
                    <div>
                        <h3>${alimento.nome}</h3>
                    </div>
                </div>
                <div class="card-receita-content">
                    ${renderizarBadgeCategoria(alimento.categoria, 'alimento')}
                    ${renderizarBadgesTags(alimento)}
                    ${alimento.unidadePadrao ? `<p>Unidade padrao: ${alimento.unidadePadrao}</p>` : ''}
                    <div class="card-receita-actions">
                        <button class="btn-editar" onclick="abrirModalAlimento('${alimento.id}')">Editar</button>
                        <button class="btn-deletar" onclick="deletarAlimento('${alimento.id}')">Deletar</button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

    filtrarAlimentos();
}

function filtrarAlimentos() {
    const busca = document.getElementById('busca-alimentos');
    if (!busca) return;

    const termo = busca.value.toLowerCase();
    const categoria = document.getElementById('filtro-categoria-alimento')?.value || '';
    document.querySelectorAll('#lista-alimentos .card-alimento').forEach(card => {
        const passaBusca = card.textContent.toLowerCase().includes(termo);
        const passaCategoria = !categoria || card.dataset.categoria === categoria;
        card.style.display = passaBusca && passaCategoria ? 'block' : 'none';
    });
}

function deletarAlimento(id) {
    const alimento = buscarAlimento(id);
    if (!alimento) return;

    const usadoEmReceita = app.receitas.some(receita =>
        Array.isArray(receita.ingredientes) &&
        receita.ingredientes.some(ingrediente => ingrediente.alimentoId === id)
    );
    const usadoEmPlanejamento = app.planejamentos.some(plano =>
        obterTipoItemPlano(plano) === 'alimento' &&
        obterItemIdPlano(plano) === id
    );

    const mensagem = usadoEmReceita || usadoEmPlanejamento
        ? `Deletar "${alimento.nome}"? Ele sera removido das receitas e planejamentos onde aparece.`
        : `Deletar "${alimento.nome}"?`;

    if (!confirm(mensagem)) return;

    registrarExclusao('alimentos', chaveAlimento(alimento));
    app.planejamentos
        .filter(plano => obterTipoItemPlano(plano) === 'alimento' && obterItemIdPlano(plano) === id)
        .forEach(plano => registrarExclusao('planejamentos', chavePlanejamento(plano)));
    app.alimentos = app.alimentos.filter(item => item.id !== id);
    app.receitas.forEach(receita => {
        if (Array.isArray(receita.ingredientes)) {
            receita.ingredientes = receita.ingredientes.filter(ingrediente => ingrediente.alimentoId !== id);
            receita.dataAtualizacao = new Date().toISOString();
        }
    });
    app.refeicoes.forEach(refeicao => {
        if (Array.isArray(refeicao.itens)) {
            refeicao.itens = refeicao.itens.filter(item =>
                !(item.itemTipo === 'alimento' && item.itemId === id)
            );
            refeicao.dataAtualizacao = new Date().toISOString();
        }
    });
    app.planejamentos = app.planejamentos.filter(plano =>
        !(obterTipoItemPlano(plano) === 'alimento' && obterItemIdPlano(plano) === id)
    );

    salvarDados();
    renderizarTudoAposSync();
}

/* ==================== CONTAGEM DE ALIMENTOS ====================
   Conta alimentos diretos e ingredientes das receitas planejadas */

function configurarPeriodoContagemPadrao() {
    const inicioInput = document.getElementById('contagem-inicio');
    const fimInput = document.getElementById('contagem-fim');
    if (!inicioInput || !fimInput || (inicioInput.value && fimInput.value)) return;

    const inicio = obterInicioSemana(obterNumeroSemana(new Date()), new Date().getFullYear());
    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
    inicioInput.value = formatarDataChave(inicio);
    fimInput.value = formatarDataChave(fim);
}

function usarSemanaAtualContagem() {
    const inicioInput = document.getElementById('contagem-inicio');
    const fimInput = document.getElementById('contagem-fim');
    if (!inicioInput || !fimInput) return;

    const hoje = new Date();
    const inicio = obterInicioSemana(obterNumeroSemana(hoje), hoje.getFullYear());
    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
    inicioInput.value = formatarDataChave(inicio);
    fimInput.value = formatarDataChave(fim);
    renderizarContagemAlimentos();
}

function usarMesAtualContagem() {
    const inicioInput = document.getElementById('contagem-inicio');
    const fimInput = document.getElementById('contagem-fim');
    if (!inicioInput || !fimInput) return;

    const hoje = new Date();
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    inicioInput.value = formatarDataChave(inicio);
    fimInput.value = formatarDataChave(fim);
    renderizarContagemAlimentos();
}

function obterDataPlano(plano) {
    if (plano.data) return plano.data;
    if (plano.semana && plano.dia) return formatarDataChave(obterDataSemanaDia(plano.semana, plano.dia));
    return '';
}

function somarAlimentosReceita(receita, somar) {
    if (!receita || !Array.isArray(receita.ingredientes)) return;

    receita.ingredientes.forEach(ingrediente => {
        if (typeof ingrediente === 'string') {
            const alimento = buscarAlimentoPorNome(ingrediente);
            somar('alimento', alimento?.id);
            return;
        }
        somar('alimento', ingrediente.alimentoId);
    });
}

function somarAlimentosRefeicao(refeicao, somar) {
    if (!refeicao || !Array.isArray(refeicao.itens)) return;

    refeicao.itens.forEach(item => {
        if (item.itemTipo === 'alimento') {
            somar('alimento', item.itemId);
            return;
        }

        if (item.itemTipo === 'receita') {
            somar('receita', item.itemId);
            somarAlimentosReceita(buscarReceita(item.itemId), somar);
        }
    });
}

function criarChaveContagem(itemTipo, itemId) {
    return `${itemTipo}:${itemId}`;
}

function obterItensBaseContagem() {
    return [
        ...app.alimentos.map(alimento => ({
            itemTipo: 'alimento',
            itemId: alimento.id,
            nome: alimento.nome,
            categoria: alimento.categoria || '',
            tags: obterTagsReceita(alimento),
        })),
        ...app.receitas.map(receita => ({
            itemTipo: 'receita',
            itemId: receita.id,
            nome: receita.nome,
            categoria: receita.categoria || '',
            tags: obterTagsReceita(receita),
        })),
        ...app.refeicoes.map(refeicao => ({
            itemTipo: 'refeicao',
            itemId: refeicao.id,
            nome: refeicao.nome,
            categoria: refeicao.categoria || '',
            tags: obterTagsReceita(refeicao),
        })),
    ];
}

function obterRotuloTipoContagem(itemTipo) {
    if (itemTipo === 'alimento') return 'Alimento';
    if (itemTipo === 'refeicao') return 'Refeicao';
    return 'Receita';
}

function atualizarFiltrosContagem(itensBase = obterItensBaseContagem()) {
    const filtroCategoria = document.getElementById('contagem-filtro-categoria');
    const filtroTipo = document.getElementById('contagem-filtro-tipo')?.value || '';
    if (!filtroCategoria) return;

    const valorAtual = filtroCategoria.value;
    const itensFiltradosPorTipo = filtroTipo
        ? itensBase.filter(item => item.itemTipo === filtroTipo)
        : itensBase;
    const categorias = Array.from(new Set(
        itensFiltradosPorTipo
            .map(item => item.categoria)
            .filter(categoria => categoria && categoria.trim())
    )).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const temSemCategoria = itensFiltradosPorTipo.some(item => !item.categoria);

    filtroCategoria.innerHTML = '<option value="">Todas as categorias</option>' +
        (temSemCategoria ? '<option value="__sem_categoria">Sem categoria</option>' : '') +
        categorias.map(categoria => `<option value="${escaparHtml(categoria)}">${escaparHtml(categoria)}</option>`).join('');
    filtroCategoria.value = categorias.includes(valorAtual) || (valorAtual === '__sem_categoria' && temSemCategoria)
        ? valorAtual
        : '';
}

function contarItensNoPeriodo(dataInicio, dataFim, modo = 'direta') {
    const contagem = new Map();

    const somar = (itemTipo, itemId) => {
        if (!itemTipo || !itemId) return;
        const chave = criarChaveContagem(itemTipo, itemId);
        const atual = contagem.get(chave) || 0;
        contagem.set(chave, atual + 1);
    };

    app.planejamentos
        .filter(plano => {
            const data = obterDataPlano(plano);
            return planejamentoPertenceAoAtivo(plano) &&
                !planejamentoEhNotaDia(plano) &&
                data &&
                data >= dataInicio &&
                data <= dataFim;
        })
        .forEach(plano => {
            const tipoItem = obterTipoItemPlano(plano);
            const itemId = obterItemIdPlano(plano);

            somar(tipoItem, itemId);
            if (modo !== 'indireta') return;

            if (tipoItem === 'receita') {
                somarAlimentosReceita(buscarReceita(itemId), somar);
                return;
            }

            if (tipoItem === 'refeicao') {
                somarAlimentosRefeicao(buscarRefeicao(itemId), somar);
            }
        });

    const pesoTipo = { alimento: 1, receita: 2, refeicao: 3 };
    return obterItensBaseContagem()
        .map(item => ({
            ...item,
            vezes: contagem.get(criarChaveContagem(item.itemTipo, item.itemId)) || 0,
        }))
        .sort((a, b) =>
            b.vezes - a.vezes ||
            (pesoTipo[a.itemTipo] - pesoTipo[b.itemTipo]) ||
            a.nome.localeCompare(b.nome, 'pt-BR')
        );
}

function renderizarContagemAlimentos() {
    const container = document.getElementById('lista-contagem-alimentos');
    if (!container) return;

    configurarPeriodoContagemPadrao();
    const inicio = document.getElementById('contagem-inicio')?.value;
    const fim = document.getElementById('contagem-fim')?.value;
    const modo = document.getElementById('contagem-modo')?.value || 'direta';
    atualizarFiltrosContagem();
    const filtroTipo = document.getElementById('contagem-filtro-tipo')?.value || '';
    const filtroCategoria = document.getElementById('contagem-filtro-categoria')?.value || '';

    if (!inicio || !fim) {
        container.innerHTML = '<div class="sem-resultados">Selecione um periodo.</div>';
        return;
    }

    const itens = contarItensNoPeriodo(inicio, fim, modo)
        .filter(item =>
            (!filtroTipo || item.itemTipo === filtroTipo) &&
            (!filtroCategoria ||
                (filtroCategoria === '__sem_categoria' ? !item.categoria : item.categoria === filtroCategoria))
        );
    if (itens.length === 0) {
        container.innerHTML = '<div class="sem-resultados">Nenhum item encontrado para os filtros selecionados.</div>';
        return;
    }

    container.innerHTML = itens.map(item => `
        <div class="linha-contagem linha-contagem-${item.itemTipo}">
            <div>
                <strong>${item.nome}</strong>
                <div class="linha-metadados-card">
                    <span class="badge-item badge-${item.itemTipo}">${obterRotuloTipoContagem(item.itemTipo)}</span>
                    ${item.categoria ? renderizarBadgeCategoria(item.categoria, item.itemTipo) : '<span class="badge-neutra">Sem categoria</span>'}
                    ${item.tags.map(tag => renderizarBadgeTag(tag)).join('')}
                </div>
            </div>
            <div class="numero-contagem">${item.vezes}</div>
        </div>
    `).join('');
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

    app.alimentos.forEach(alimento => {
        obterTagsReceita(alimento).forEach(tag => tags.add(tag.trim()));
    });

    app.refeicoes.forEach(refeicao => {
        obterTagsReceita(refeicao).forEach(tag => tags.add(tag.trim()));
    });

    app.tags = Array.from(tags).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function atualizarSelectTags(tagsSelecionadas = []) {
    renderizarCheckboxesTags('tags-receita', 'tags-receita', tagsSelecionadas);
}

function atualizarSelectTagsAlimento(tagsSelecionadas = []) {
    renderizarCheckboxesTags('tags-alimento', 'tags-alimento', tagsSelecionadas);
}

function obterTagsSelecionadasAlimento() {
    return Array.from(document.querySelectorAll('input[name="tags-alimento"]:checked'))
        .map(input => input.value);
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
    removerExclusao('tags', normalizarNomeAlimento(novaTag));
    normalizarTags();
    salvarDados();
    atualizarSelectTags();
    atualizarSelectTagsAlimento();
    atualizarSelectTagsRefeicao();
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

    registrarExclusao('tags', normalizarNomeAlimento(tagAtual));
    removerExclusao('tags', normalizarNomeAlimento(tagLimpa));
    app.tags = app.tags.map(tag => tag === tagAtual ? tagLimpa : tag);

    app.receitas.forEach(receita => {
        if (!Array.isArray(receita.tags)) return;
        receita.tags = receita.tags.map(tag => tag === tagAtual ? tagLimpa : tag);
        receita.dataAtualizacao = new Date().toISOString();
    });

    app.alimentos.forEach(alimento => {
        if (!Array.isArray(alimento.tags)) return;
        alimento.tags = alimento.tags.map(tag => tag === tagAtual ? tagLimpa : tag);
        alimento.dataAtualizacao = new Date().toISOString();
    });

    app.refeicoes.forEach(refeicao => {
        if (!Array.isArray(refeicao.tags)) return;
        refeicao.tags = refeicao.tags.map(tag => tag === tagAtual ? tagLimpa : tag);
        refeicao.dataAtualizacao = new Date().toISOString();
    });

    normalizarTags();
    salvarDados();
    renderizarAposAlterarTags();
}

function removerTag(tag) {
    const usada = app.receitas.some(receita => obterTagsReceita(receita).includes(tag)) ||
        app.alimentos.some(alimento => obterTagsReceita(alimento).includes(tag)) ||
        app.refeicoes.some(refeicao => obterTagsReceita(refeicao).includes(tag));
    const mensagem = usada
        ? `Remover "${tag}"? Ela tambem sera removida das receitas, alimentos e refeicoes.`
        : `Remover "${tag}"?`;

    if (!confirm(mensagem)) return;

    registrarExclusao('tags', normalizarNomeAlimento(tag));
    app.tags = app.tags.filter(item => item !== tag);
    app.receitas.forEach(receita => {
        if (Array.isArray(receita.tags)) {
            receita.tags = receita.tags.filter(item => item !== tag);
            receita.dataAtualizacao = new Date().toISOString();
        }
    });
    app.alimentos.forEach(alimento => {
        if (Array.isArray(alimento.tags)) {
            alimento.tags = alimento.tags.filter(item => item !== tag);
            alimento.dataAtualizacao = new Date().toISOString();
        }
    });
    app.refeicoes.forEach(refeicao => {
        if (Array.isArray(refeicao.tags)) {
            refeicao.tags = refeicao.tags.filter(item => item !== tag);
            refeicao.dataAtualizacao = new Date().toISOString();
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
        nome.innerHTML = renderizarBadgeTag(tag);

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
    atualizarSelectTagsAlimento();
    atualizarSelectTagsRefeicao();
    renderizarTags();
    renderizarReceitas();
    renderizarAlimentos();
    renderizarRefeicoes();
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
    removerExclusao('categorias', normalizarNomeAlimento(novaCategoria));
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

    registrarExclusao('categorias', normalizarNomeAlimento(categoriaAtual));
    removerExclusao('categorias', normalizarNomeAlimento(categoriaLimpa));
    app.categorias = app.categorias.map(categoria =>
        categoria === categoriaAtual ? categoriaLimpa : categoria
    );

    app.receitas.forEach(receita => {
        if (receita.categoria === categoriaAtual) {
            receita.categoria = categoriaLimpa;
            receita.dataAtualizacao = new Date().toISOString();
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

    registrarExclusao('categorias', normalizarNomeAlimento(categoria));
    app.categorias = app.categorias.filter(item => item !== categoria);
    app.receitas.forEach(receita => {
        if (receita.categoria === categoria) {
            receita.categoria = '';
            receita.dataAtualizacao = new Date().toISOString();
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
        nome.innerHTML = `${renderizarBadgeCategoria(categoria, 'receita')} ${escaparHtml(categoria)}`;

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

/* ==================== CATEGORIAS DE REFEICOES ====================
   Gerenciar categorias exclusivas das refeicoes compostas */

function normalizarCategoriasRefeicoes() {
    const categorias = new Set();

    app.categoriasRefeicoes.forEach(categoria => {
        if (categoria && categoria.trim()) {
            categorias.add(categoria.trim());
        }
    });

    app.refeicoes.forEach(refeicao => {
        if (refeicao.categoria && refeicao.categoria.trim()) {
            categorias.add(refeicao.categoria.trim());
        }
    });

    app.categoriasRefeicoes = Array.from(categorias).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function abrirCategoriasRefeicoes() {
    abrirModal('modal-categorias-refeicoes');
    renderizarCategoriasRefeicoes();
}

function adicionarCategoriaRefeicao() {
    const input = document.getElementById('nova-categoria-refeicao');
    const novaCategoria = input.value.trim();

    if (!novaCategoria) {
        alert('Digite uma categoria!');
        return;
    }

    if (app.categoriasRefeicoes.some(categoria => categoria.toLowerCase() === novaCategoria.toLowerCase())) {
        alert('Esta categoria já existe!');
        return;
    }

    app.categoriasRefeicoes.push(novaCategoria);
    removerExclusao('categoriasRefeicoes', normalizarNomeAlimento(novaCategoria));
    normalizarCategoriasRefeicoes();
    salvarDados();
    atualizarSelectCategoriasRefeicao();
    atualizarFiltroCategoriaRefeicao();
    input.value = '';
    renderizarCategoriasRefeicoes();
}

function editarCategoriaRefeicao(categoriaAtual) {
    const novaCategoria = prompt('Novo nome da categoria:', categoriaAtual);
    if (!novaCategoria) return;

    const categoriaLimpa = novaCategoria.trim();
    if (!categoriaLimpa || categoriaLimpa === categoriaAtual) return;

    if (app.categoriasRefeicoes.some(categoria =>
        categoria !== categoriaAtual &&
        categoria.toLowerCase() === categoriaLimpa.toLowerCase()
    )) {
        alert('Esta categoria já existe!');
        return;
    }

    registrarExclusao('categoriasRefeicoes', normalizarNomeAlimento(categoriaAtual));
    removerExclusao('categoriasRefeicoes', normalizarNomeAlimento(categoriaLimpa));
    app.categoriasRefeicoes = app.categoriasRefeicoes.map(categoria =>
        categoria === categoriaAtual ? categoriaLimpa : categoria
    );

    app.refeicoes.forEach(refeicao => {
        if (refeicao.categoria === categoriaAtual) {
            refeicao.categoria = categoriaLimpa;
            refeicao.dataAtualizacao = new Date().toISOString();
        }
    });

    normalizarCategoriasRefeicoes();
    salvarDados();
    renderizarAposAlterarCategoriasRefeicoes();
}

function removerCategoriaRefeicao(categoria) {
    const usada = app.refeicoes.some(refeicao => refeicao.categoria === categoria);
    const mensagem = usada
        ? `Remover "${categoria}"? As refeicoes desta categoria ficarão sem categoria.`
        : `Remover "${categoria}"?`;

    if (!confirm(mensagem)) return;

    registrarExclusao('categoriasRefeicoes', normalizarNomeAlimento(categoria));
    app.categoriasRefeicoes = app.categoriasRefeicoes.filter(item => item !== categoria);
    app.refeicoes.forEach(refeicao => {
        if (refeicao.categoria === categoria) {
            refeicao.categoria = '';
            refeicao.dataAtualizacao = new Date().toISOString();
        }
    });

    salvarDados();
    renderizarAposAlterarCategoriasRefeicoes();
}

function renderizarCategoriasRefeicoes() {
    const container = document.getElementById('lista-categorias-refeicoes');
    if (!container) return;

    container.innerHTML = '';
    normalizarCategoriasRefeicoes();

    if (app.categoriasRefeicoes.length === 0) {
        container.innerHTML = '<div class="sem-resultados">Nenhuma categoria cadastrada.</div>';
        return;
    }

    app.categoriasRefeicoes.forEach(categoria => {
        const item = document.createElement('div');
        item.className = 'item-gerenciavel';

        const nome = document.createElement('span');
        nome.innerHTML = `${renderizarBadgeCategoria(categoria, 'refeicao')} ${escaparHtml(categoria)}`;

        const acoes = document.createElement('div');
        acoes.className = 'acoes-gerenciavel';

        const btnEditar = document.createElement('button');
        btnEditar.className = 'btn-editar';
        btnEditar.textContent = 'Editar';
        btnEditar.onclick = () => editarCategoriaRefeicao(categoria);

        const btnRemover = document.createElement('button');
        btnRemover.className = 'btn-deletar';
        btnRemover.textContent = 'Remover';
        btnRemover.onclick = () => removerCategoriaRefeicao(categoria);

        acoes.appendChild(btnEditar);
        acoes.appendChild(btnRemover);
        item.appendChild(nome);
        item.appendChild(acoes);
        container.appendChild(item);
    });
}

function renderizarAposAlterarCategoriasRefeicoes() {
    atualizarSelectCategoriasRefeicao();
    atualizarFiltroCategoriaRefeicao();
    renderizarCategoriasRefeicoes();
    renderizarRefeicoes();
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
    removerExclusao('tiposRefeicao', normalizarNomeAlimento(novoTipo));
    salvarDados();
    atualizarSelectTipos();
    atualizarSelectTiposRefeicaoComposta();
    document.getElementById('novo-tipo-refeicao').value = '';
    renderizarTiposRefeicao();

    console.log('? Tipo de refeicao adicionado:', novoTipo);
}

function removerTipoRefeicao(tipo) {
    if (confirm(`Remover "${tipo}"?`)) {
        registrarExclusao('tiposRefeicao', normalizarNomeAlimento(tipo));
        app.tiposRefeicao = app.tiposRefeicao.filter(t => t !== tipo);
        salvarDados();
        atualizarSelectTipos();
        atualizarSelectTiposRefeicaoComposta();
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

/* ==================== TIPOS DE USO ====================
   Gerenciar linhas exclusivas da visao mensal */

function normalizarTiposUso() {
    const tipos = new Set();

    app.tiposUso.forEach(tipo => {
        if (tipo && tipo.trim()) {
            tipos.add(tipo.trim());
        }
    });

    app.planejamentos.forEach(plano => {
        if (plano.tipo === 'mensal' && plano.refeicao && plano.refeicao.trim()) {
            tipos.add(plano.refeicao.trim());
        }
    });

    app.tiposUso = Array.from(tipos).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function abrirTiposUso() {
    abrirModal('modal-tipos-uso');
    renderizarTiposUso();
}

function adicionarTipoUso() {
    const input = document.getElementById('novo-tipo-uso');
    const novoTipo = input.value.trim();

    if (!novoTipo) {
        alert('Digite um tipo de uso!');
        return;
    }

    if (app.tiposUso.some(tipo => tipo.toLowerCase() === novoTipo.toLowerCase())) {
        alert('Este tipo já existe!');
        return;
    }

    app.tiposUso.push(novoTipo);
    removerExclusao('tiposUso', normalizarNomeAlimento(novoTipo));
    normalizarTiposUso();
    salvarDados();
    input.value = '';
    renderizarTiposUso();
    renderizarMensal();
}

function editarTipoUso(tipoAtual) {
    const novoTipo = prompt('Novo nome do tipo de uso:', tipoAtual);
    if (!novoTipo) return;

    const tipoLimpo = novoTipo.trim();
    if (!tipoLimpo || tipoLimpo === tipoAtual) return;

    if (app.tiposUso.some(tipo =>
        tipo !== tipoAtual &&
        tipo.toLowerCase() === tipoLimpo.toLowerCase()
    )) {
        alert('Este tipo já existe!');
        return;
    }

    registrarExclusao('tiposUso', normalizarNomeAlimento(tipoAtual));
    removerExclusao('tiposUso', normalizarNomeAlimento(tipoLimpo));
    app.tiposUso = app.tiposUso.map(tipo => tipo === tipoAtual ? tipoLimpo : tipo);
    app.planejamentos.forEach(plano => {
        if (plano.tipo === 'mensal' && plano.refeicao === tipoAtual) {
            plano.refeicao = tipoLimpo;
            plano.dataAtualizacao = new Date().toISOString();
        }
    });

    normalizarTiposUso();
    salvarDados();
    renderizarTiposUso();
    renderizarMensal();
}

function removerTipoUso(tipo) {
    const usado = app.planejamentos.some(plano => plano.tipo === 'mensal' && plano.refeicao === tipo);
    const mensagem = usado
        ? `Remover "${tipo}"? Os itens mensais deste tipo tambem serao removidos.`
        : `Remover "${tipo}"?`;

    if (!confirm(mensagem)) return;

    registrarExclusao('tiposUso', normalizarNomeAlimento(tipo));
    app.tiposUso = app.tiposUso.filter(item => item !== tipo);
    app.planejamentos
        .filter(plano => plano.tipo === 'mensal' && plano.refeicao === tipo)
        .forEach(plano => registrarExclusao('planejamentos', chavePlanejamento(plano)));
    app.planejamentos = app.planejamentos.filter(plano => !(plano.tipo === 'mensal' && plano.refeicao === tipo));

    salvarDados();
    renderizarTiposUso();
    renderizarMensal();
    renderizarContagemAlimentos();
}

function renderizarTiposUso() {
    const container = document.getElementById('lista-tipos-uso');
    if (!container) return;

    container.innerHTML = '';
    normalizarTiposUso();

    if (app.tiposUso.length === 0) {
        container.innerHTML = '<div class="sem-resultados">Nenhum tipo de uso cadastrado.</div>';
        return;
    }

    app.tiposUso.forEach(tipo => {
        const item = document.createElement('div');
        item.className = 'item-gerenciavel';

        const nome = document.createElement('span');
        nome.textContent = tipo;

        const acoes = document.createElement('div');
        acoes.className = 'acoes-gerenciavel';

        const btnEditar = document.createElement('button');
        btnEditar.className = 'btn-editar';
        btnEditar.textContent = 'Editar';
        btnEditar.onclick = () => editarTipoUso(tipo);

        const btnRemover = document.createElement('button');
        btnRemover.className = 'btn-deletar';
        btnRemover.textContent = 'Remover';
        btnRemover.onclick = () => removerTipoUso(tipo);

        acoes.appendChild(btnEditar);
        acoes.appendChild(btnRemover);
        item.appendChild(nome);
        item.appendChild(acoes);
        container.appendChild(item);
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
    abrirCategoriasRefeicoes,
    adicionarCategoriaRefeicao,
    editarCategoriaRefeicao,
    removerCategoriaRefeicao,
    abrirTags,
    adicionarTag,
    editarTag,
    removerTag,
    conectarNuvem,
    alternarSidebar,
    selecionarPlanejamentoAtivo,
    alternarPlanejamentoAtivo,
    alternarPlanoSeguido,
    alternarNovoItemPlanejamento,
    criarItemParaPlanejamento,
    alternarPainelNuvem,
    fecharPainelNuvem,
    entrarNuvem,
    criarContaNuvem,
    sairNuvem,
    sincronizarSupabase,
    baixarDadosSupabase,
    enviarDadosSupabase,
    abrirModalReceita,
    abrirModalRefeicao,
    salvarRefeicao,
    filtrarRefeicoes,
    adicionarLinhaItemRefeicao,
    removerLinhaItemRefeicao,
    atualizarSelectItemRefeicao,
    deletarRefeicao,
    abrirModalAlimento,
    salvarAlimento,
    deletarAlimento,
    filtrarAlimentos,
    adicionarLinhaIngredienteReceita,
    removerLinhaIngredienteReceita,
    selecionarItemParaPlano,
    abrirModalPlanejarSemana,
    salvarNotaPlanejamentoData,
    renderizarContagemAlimentos,
    usarSemanaAtualContagem,
    usarMesAtualContagem,
    selecionarFiltroItemModal,
    limparFiltrosModalSelecao,
    abrirCategoriasAlimentos,
    adicionarCategoriaAlimento,
    editarCategoriaAlimento,
    removerCategoriaAlimento,
    abrirTiposRefeicao,
    abrirTiposUso,
    adicionarTipoUso,
    editarTipoUso,
    removerTipoUso,
    abrirHistorico,
});

/* ==================== INICIAR ====================
   Quando pagina carrega */

window.addEventListener('DOMContentLoaded', inicializar);


