# Checklist - Relatorio PDF Tecnico

## Status Da Execucao

- [x] Implementacao do gerador de relatorio PDF estruturado concluida.
- [x] Botao nos tres dashboards, dicionario PT/EN e impressao nativa incluidos.
- [x] Coleta de controles, Canvas, Plotly, SVG, memorial, glossario e referencias incluida.
- [x] Rastreabilidade, autoria, contatos e clausula profissional de limitacoes incluidos.
- [x] Validacao estatica executada por `tests/check-pdf-report.ps1` e sintaxe JavaScript verificada.
- [ ] Validacao visual manual do dialogo nativo de impressao permanece pendente: a automacao nao pode acessar a URL local `file://` nesta sessao.

## Objetivo

Gerar um relatorio PDF A4 retrato, no estilo de artigo tecnico de calculo,
a partir do dashboard ativo e do seu estado atual. O documento deve incluir
os parametros, resultados, ilustracoes, graficos, memorial, glossario e
referencias bibliograficas sem ter aparencia de captura de tela do site.

## Arquitetura

- [ ] Adicionar o comando `Gerar PDF` aos dashboards Destorroador, Distribuidor e Regulacao de pH.
- [ ] Inserir todos os novos textos no dicionario PT/EN.
- [ ] Exportar somente o dashboard ativo e o estado atual de seus controles.
- [ ] Criar um documento temporario de relatorio, separado do layout visual do dashboard.
- [ ] Enviar o documento temporario ao dialogo nativo `Salvar como PDF` do navegador.
- [ ] Descartar o documento temporario ao encerrar a impressao, sem alterar o dashboard original.

## Coleta Do Estado Atual

- [ ] Copiar os valores atuais de inputs numericos, sliders, selects, radios e checkboxes.
- [ ] Transformar controles interativos em parametros estaticos, com nome, unidade e valor atual.
- [ ] Coletar metricas, alertas, status, tabelas, memorial, formulas e links visiveis.
- [ ] Preservar links externos como links clicaveis no PDF.
- [ ] Incluir automaticamente novos elementos HTML visiveis do dashboard ativo.
- [ ] Definir suporte opcional a `data-pdf-section` e `data-pdf-title` para posicionamento editorial de futuros componentes.

## Midias E Componentes Dinamicos

- [ ] Converter todo elemento `canvas` presente no relatorio para imagem em alta resolucao.
- [ ] Converter graficos Plotly com `Plotly.toImage()` mantendo a perspectiva e a escala atuais.
- [ ] Preservar SVG e formulas MathJax renderizadas.
- [ ] Aguardar a renderizacao de MathJax e Plotly antes de abrir o dialogo de impressao.
- [ ] Inserir legenda e titulo editorial para cada grafico ou ilustracao capturada.
- [ ] Garantir que novos Canvas, SVG e graficos Plotly sejam coletados genericamente, sem codigo por grafico.

## Estrutura Editorial A4

- [ ] Configurar pagina A4 retrato e margens tecnicas de impressao.
- [ ] Criar cabecalho com dashboard, objetivo, idioma e data/hora de geracao.
- [ ] Registrar no cabecalho a origem real da geracao, usando URL ou ambiente local disponivel no momento da exportacao.
- [ ] Identificar o criador do dashboard: Guilherme Silva de Oliveira, com links para Portfolio e LinkedIn ja cadastrados na pagina.
- [ ] Criar secao `Rastreabilidade, autoria e limites de aplicacao` antes dos parametros de entrada.
- [ ] Criar secao `Parametros de entrada` em tabela tecnica.
- [ ] Criar secao `Resultados principais` com metricas, status e alertas calculados.
- [ ] Criar secao `Ilustracoes e graficos` com as midias capturadas.
- [ ] Criar secao `Memorial de calculo` preservando formulas, valores e links.
- [ ] Criar secao final `Glossario`.
- [ ] Criar secao final `Referencias bibliograficas`.
- [ ] Criar rodape documental com titulo do relatorio e identificacao do dashboard.
- [ ] Remover sidebar, botoes, barras de rolagem, elementos flutuantes e controles de interface do documento final.
- [ ] Aplicar quebras de pagina para evitar separacao inadequada de titulos, formulas, tabelas, graficos e itens do memorial.
- [ ] Aplicar fundo branco, tipografia de documento tecnico e cores apenas quando transportarem informacao.

## Rastreabilidade, Autoria E Limites De Aplicacao

- [ ] Registrar dashboard, origem da geracao, data/hora, idioma e versao disponivel da aplicacao.
- [ ] Informar o criador do dashboard e os contatos publicados na pagina, sem inventar dados adicionais.
- [ ] Incluir texto profissional deixando claro que o relatorio apresenta calculos e simulacoes de apoio a decisao e aproximacao inicial.
- [ ] Declarar que os resultados nao constituem garantia de funcionamento pratico, seguranca, desempenho ou conformidade da solucao.
- [ ] Declarar que a aplicacao real exige verificacao, calibracao, ajuste e validacao pelo engenheiro responsavel.
- [ ] Explicar que propriedades de materiais, tolerancias construtivas, instrumentacao e condicoes fisicas operacionais podem afetar o resultado.
- [ ] Explicar que o objetivo e aumentar a assertividade da primeira aproximacao ao alvo final, sem expectativa de acerto integral na primeira configuracao.
- [ ] Inserir toda a redacao dessa secao no dicionario PT/EN.

## Glossario

- [ ] Coletar explicacoes de `data-tooltip`, `title` e do catalogo de variaveis do dashboard ativo.
- [ ] Coletar explicacoes associadas a simbolos e formulas do memorial de calculo.
- [ ] Deduplicar entradas equivalentes.
- [ ] Organizar entradas por simbolo ou nome.
- [ ] Mostrar unidade, definicao, importancia e impacto quando essas informacoes estiverem disponiveis.
- [ ] Incluir apenas as explicacoes usadas pelo estado e pelo dashboard exportados.

## Referencias Bibliograficas

- [ ] Localizar todos os links externos associados aos subtitulos do memorial de calculo.
- [ ] Registrar a secao do memorial que utilizou cada fonte.
- [ ] Registrar titulo da secao, texto do link, dominio e URL completa clicavel.
- [ ] Registrar data de acesso no momento da geracao do relatorio.
- [ ] Ordenar as referencias pela primeira aparicao no memorial.
- [ ] Consolidar links repetidos sem perder a indicacao de todas as secoes que os utilizaram.

## Validacao Minima Final

- [ ] Executar verificacao sintatica do JavaScript alterado.
- [ ] Confirmar que o botao `Gerar PDF` aparece no dashboard ativo e usa o idioma atual.
- [ ] Gerar um relatorio de teste com parametros diferentes dos valores iniciais.
- [ ] Confirmar presenca de titulo, parametros, resultados, memorial, glossario e referencias no documento temporario.
- [ ] Confirmar presenca da origem de geracao, autoria, contatos e secao de limites de aplicacao.
- [ ] Confirmar que a origem e os contatos exibidos correspondem aos dados efetivamente disponiveis na pagina.
- [ ] Confirmar que a quantidade de Canvas e graficos Plotly capturados corresponde aos elementos visiveis no dashboard.
- [ ] Confirmar que ao menos uma formula MathJax, um link bibliografico e uma entrada de glossario foram incluidos.
- [ ] Abrir o dialogo de impressao e verificar A4 retrato, multipaginacao e ausencia de elementos de interface do site.
- [ ] Confirmar que o dashboard permanece no mesmo estado apos cancelar ou concluir a exportacao.

## Criterio De Conclusao

O recurso estara finalizado quando todos os itens acima estiverem marcados,
o relatorio do dashboard ativo puder ser salvo como PDF A4 retrato e o
conteudo refletir fielmente o estado atual da simulacao sem depender de
tratamento especifico para cada novo card, grafico ou ilustracao.
