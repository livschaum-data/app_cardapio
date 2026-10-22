/* Consulta das mesmas receitas, sem duplicar cadastros ou alterar o planejamento. */
const rotulosLivro = {
    nome: 'Nome', categoria: 'Categoria', tipos: 'Tipos de refeição', tags: 'Tags',
    ingredientes: 'Ingredientes selecionados', ingredientesTexto: 'Ingredientes em texto livre',
    modoPreparo: 'Modo de preparo', dataCriacao: 'Data de criação', dataAtualizacao: 'Última atualização',
    tempoPreparo: 'Tempo de preparo', tempoCozimento: 'Tempo de cozimento', porcoes: 'Porções',
    imagem: 'Imagem', observacoes: 'Observações'
};
let livroFocoAnterior = null;
let livroReceitaAberta = null;

function propriedadesLivro() {
    return [...new Set(['nome', 'categoria', 'tipos', 'tags', 'ingredientes', 'ingredientesTexto', 'modoPreparo',
        ...app.receitas.flatMap(receita => Object.keys(receita))])]
        .filter(chave => !['id', 'tipo'].includes(chave));
}
function rotuloLivro(chave) {
    return rotulosLivro[chave] || chave.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
}
function valorLivro(receita, chave) {
    if (chave === 'tipos') return obterTiposReceita(receita);
    if (chave === 'ingredientes') return (receita.ingredientes || []).map(formatarIngredienteReceita);
    return receita[chave];
}
function textoLivro(valor) {
    if (valor == null) return '';
    if (Array.isArray(valor)) return valor.map(textoLivro).filter(Boolean).join(' · ');
    if (typeof valor === 'object') return Object.entries(valor).map(([chave, item]) => `${rotuloLivro(chave)}: ${textoLivro(item)}`).join(' · ');
    return String(valor);
}
function normalizarBuscaLivro(valor) {
    return textoLivro(valor).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}
function preencherOpcoesLivro(select, opcoes, padrao) {
    const anterior = select.value;
    select.replaceChildren(...opcoes.map(([valor, titulo]) => new Option(titulo, valor)));
    select.value = opcoes.some(([valor]) => valor === anterior) ? anterior : padrao;
}
function atualizarFiltroLivro(renderizar = true) {
    const chave = document.getElementById('livro-propriedade').value;
    const valores = [...new Set(app.receitas.flatMap(receita => {
        const valor = valorLivro(receita, chave);
        return (Array.isArray(valor) ? valor : [valor]).map(textoLivro).filter(Boolean);
    }))].sort((a, b) => a.localeCompare(b, 'pt-BR', {numeric: true}));
    preencherOpcoesLivro(document.getElementById('livro-valor'), [['', 'Todos os valores'], ['__vazio__', 'Não preenchido'], ...valores.map(valor => ['valor:' + valor, valor])], '');
    if (renderizar) renderizarLivro();
}
function selecionarReceitasLivro(receitas, {busca = '', propriedade = 'categoria', valor = '', ordem = 'nome', direcao = 'asc'} = {}) {
    const termo = normalizarBuscaLivro(busca);
    return receitas.filter(receita => {
        const conteudo = valorLivro(receita, propriedade);
        const valores = (Array.isArray(conteudo) ? conteudo : [conteudo]).map(textoLivro).filter(Boolean);
        return (!termo || propriedadesLivro().some(chave => normalizarBuscaLivro(valorLivro(receita, chave)).includes(termo))) &&
            (!valor || (valor === '__vazio__' ? valores.length === 0 : valores.includes(valor.slice(6))));
    }).sort((a, b) => {
        const av = valorLivro(a, ordem), bv = valorLivro(b, ordem);
        const resultado = typeof av === 'number' && typeof bv === 'number' ? av - bv :
            textoLivro(av).localeCompare(textoLivro(bv), 'pt-BR', {numeric: true, sensitivity: 'base'});
        return (direcao === 'desc' ? -resultado : resultado) || textoLivro(a.nome).localeCompare(textoLivro(b.nome), 'pt-BR');
    });
}
function renderizarLivro() {
    const container = document.getElementById('livro-lista');
    if (!container) return;
    const opcoes = propriedadesLivro().map(chave => [chave, rotuloLivro(chave)]);
    preencherOpcoesLivro(document.getElementById('livro-propriedade'), opcoes, 'categoria');
    preencherOpcoesLivro(document.getElementById('livro-ordem'), opcoes, 'nome');
    atualizarFiltroLivro(false);
    const receitas = selecionarReceitasLivro(app.receitas, {
        busca: document.getElementById('livro-busca').value,
        propriedade: document.getElementById('livro-propriedade').value,
        valor: document.getElementById('livro-valor').value,
        ordem: document.getElementById('livro-ordem').value,
        direcao: document.getElementById('livro-direcao').value
    });
    document.getElementById('livro-contagem').textContent = `${receitas.length} de ${app.receitas.length} receitas`;
    container.replaceChildren();
    if (!receitas.length) {
        container.innerHTML = '<p class="sem-resultados">Nenhuma receita encontrada.</p>';
    }
    receitas.forEach(receita => {
        const botao = document.createElement('button');
        botao.type = 'button';
        botao.className = 'livro-cartao';
        botao.innerHTML = `<span class="livro-cartao-categoria">${escaparHtml(receita.categoria || 'Receita')}</span><h3>${escaparHtml(receita.nome)}</h3><p>${escaparHtml(obterTiposReceita(receita).join(' · '))}</p><p>${escaparHtml(textoLivro(receita.tags))}</p><span class="livro-cartao-abrir">Ver receita →</span>`;
        botao.addEventListener('click', () => abrirFichaLivro(receita.id));
        container.appendChild(botao);
    });
    if (livroReceitaAberta) preencherFichaLivro(livroReceitaAberta);
}
function limparFiltrosLivro() {
    document.getElementById('livro-busca').value = '';
    document.getElementById('livro-propriedade').value = 'categoria';
    document.getElementById('livro-valor').value = '';
    document.getElementById('livro-ordem').value = 'nome';
    document.getElementById('livro-direcao').value = 'asc';
    renderizarLivro();
}
function imagemSeguraLivro(valor) {
    if (typeof valor !== 'string' || !valor.trim()) return '';
    try {
        const url = new URL(valor, document.baseURI);
        return ['http:', 'https:'].includes(url.protocol) || /^data:image\/(png|jpeg|webp|gif);base64,/i.test(valor) ? url.href : '';
    } catch { return ''; }
}
function preencherFichaLivro(id) {
    const receita = buscarReceita(id);
    if (!receita) { fecharFichaLivro(); return; }
    const ingredientes = obterIngredientesReceita(receita);
    const imagem = imagemSeguraLivro(receita.imagem);
    const especiais = new Set(['nome', 'tipo', 'tipos', 'categoria', 'tags', 'ingredientes', 'ingredientesTexto', 'modoPreparo', 'imagem', 'tempoPreparo', 'tempoCozimento', 'porcoes', 'observacoes', 'dataCriacao', 'dataAtualizacao']);
    const extras = propriedadesLivro().filter(chave => !especiais.has(chave) && textoLivro(valorLivro(receita, chave)));
    const metadado = (titulo, valor) => `<div><span>${titulo}</span><strong>${escaparHtml(textoLivro(valor) || 'Não informado')}</strong></div>`;
    document.getElementById('livro-ficha').innerHTML = `
        <header><p class="livro-ficha-categoria">${escaparHtml(receita.categoria || 'Livro de receitas')}</p><h2 id="livro-ficha-titulo">${escaparHtml(receita.nome)}</h2><p>${escaparHtml([...obterTiposReceita(receita), ...(receita.tags || [])].join(' · '))}</p></header>
        <div class="livro-ficha-meta">${metadado('Preparo', receita.tempoPreparo)}${metadado('Cozimento', receita.tempoCozimento)}${metadado('Porções', receita.porcoes)}</div>
        <div class="livro-ficha-corpo"><aside><h3>Ingredientes</h3>${ingredientes.length ? `<ul>${ingredientes.map(item => `<li>${escaparHtml(item)}</li>`).join('')}</ul>` : '<p>Ingredientes não informados.</p>'}
        ${receita.observacoes ? `<section class="livro-notas"><h3>Observações</h3><p>${escaparHtml(receita.observacoes)}</p></section>` : ''}</aside>
        <div>${imagem ? `<img class="livro-foto" src="${escaparHtml(imagem)}" alt="${escaparHtml(receita.nome)}">` : ''}<section><h3>Modo de preparo</h3><p class="livro-preparo">${escaparHtml(receita.modoPreparo || 'Modo de preparo não informado.')}</p></section>
        ${extras.length ? `<section class="livro-notas"><h3>Mais informações</h3><dl>${extras.map(chave => `<dt>${escaparHtml(rotuloLivro(chave))}</dt><dd>${escaparHtml(textoLivro(valorLivro(receita, chave)))}</dd>`).join('')}</dl></section>` : ''}</div></div>`;
}
function abrirFichaLivro(id) {
    livroFocoAnterior = document.activeElement;
    livroReceitaAberta = id;
    preencherFichaLivro(id);
    abrirModal('modal-ficha-livro');
    document.querySelector('#modal-ficha-livro .btn-fechar').focus();
}
function fecharFichaLivro() {
    fecharModal('modal-ficha-livro');
    livroReceitaAberta = null;
    livroFocoAnterior?.focus();
}
document.getElementById('modal-ficha-livro').addEventListener('click', evento => {
    if (evento.target.id === 'modal-ficha-livro') fecharFichaLivro();
});
document.addEventListener('keydown', evento => {
    const modal = document.getElementById('modal-ficha-livro');
    if (modal.style.display !== 'flex') return;
    if (evento.key === 'Escape') fecharFichaLivro();
    if (evento.key === 'Tab') { evento.preventDefault(); modal.querySelector('.btn-fechar').focus(); }
});
