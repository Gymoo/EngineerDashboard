// Verificar se Matter.js carregou
        function aguardarMatterJS(callback, tentativas = 0) {
            if (typeof window.Matter !== 'undefined') {
                console.log('Matter.js carregado com sucesso!');
                callback();
            } else if (tentativas < 50) {
                setTimeout(() => aguardarMatterJS(callback, tentativas + 1), 100);
            } else {
                console.warn('Matter.js não disponível!');
                callback();
            }
        }

console.log('ðŸ”§ Script iniciando...');
        
        // --- CONSTANTES FÍSICAS ---
        // Essas constantes/variáveis aparecem no memorial e também podem ganhar significado via tooltip.
        const RPM_BASE = 3400; // [RPM] Rotação nominal do motor na base (para estimar velocidade angular).
        const EFICIENCIA_REDUTOR = 0.85; // [-] Eficiência mecânica da caixa/redutor (fração que vira potência útil).
        const GRAVIDADE_PADRAO = 9.80665; // [m/s²] Gravidade padrão definida por convenção metrológica.

        // --- VARIÁVEIS GLOBAIS ---
        let canvas, ctx;
        let canvasDist, ctxDist;
        let anguloEsquerdo = 0;
        let anguloDireito = 0;
        let rotacaoFinalGlobal = 0;
        let isStalled = false;
        let particulas = [];
        let particulasDistribuidor = [];
        let ativarAnimacaoDist = false;
        let mathJaxTimer = null;
        
        // Matter.js
        let Matter = null;
        let Engine = null;
        let World = null;
        let Bodies = null;
        let Body = null;
        let engineDist = null;
        let worldDist = null;
        let defletorBody = null;
        let particulasBodyDist = [];
        let tempoGeracaoSemente = 0;
        
        // DOM
        let dom = null;
        const STORAGE_KEY = 'portal-engenharia-dashboard-state-v1';
        const SIDEBAR_STORAGE_KEY = 'portal-engenharia-sidebar-state-v1';
        const THEME_STORAGE_KEY = 'portal-engenharia-theme-v1';
        const LANGUAGE_STORAGE_KEY = 'portal-engenharia-language-v1';

        // Aguardar Matter.js e depois inicializar
        console.log('â³ Aguardando Matter.js...');
        aguardarMatterJS(function() {
            console.log('✅ Matter.js carregado!');
            // Aguardar também que o DOM esteja pronto
            if (document.readyState === 'loading') {
                console.log('â³ Aguardando DOMContentLoaded...');
                document.addEventListener('DOMContentLoaded', iniciarAplicacao);
            } else {
                console.log('✅ DOM já está pronto!');
                iniciarAplicacao();
            }
        });
        
        function iniciarAplicacao() {
            console.log('✅ Aplicação iniciando...');
            console.log('✅ Window.Matter:', typeof window.Matter);
            
            // Inicializar Matter.js
            inicializarMatterJS();

            // --- VARIÁVEIS DA ANIMAÇÃO ---
            const canvas = document.getElementById('moinhoCanvas');
            const ctx = canvas.getContext('2d');
            let anguloEsquerdo = 0;
            let anguloDireito = 0;
            let rotacaoFinalGlobal = 0;
            let isStalled = false;
            let particulas = [];
            let particulasDistribuidor = [];
            let ativarAnimacaoDist = false;
            let particulasDosador = [];
            let ativarAnimacaoDosador = false;
            let anguloDosador = 0;
            let mathJaxTimer = null;
            let controlePh = criarEstadoControlePh();
            console.log('✅ Canvas destorroador inicializado');
            
            // Inicializar Matter.js
            function inicializarMatterJS() {
                // Se Matter.js está desativado, retornar false
                if (window.Matter && window.Matter.DISABLED) {
                    console.warn('Matter.js não disponível, usando física simplificada');
                    return false;
                }
                
                if (window.Matter) {
                    Matter = window.Matter;
                    Engine = Matter.Engine;
                    World = Matter.World;
                    Bodies = Matter.Bodies;
                    Body = Matter.Body;
                    console.log('Matter.js inicializado com sucesso!');
                    return true;
                } else {
                    console.warn('Matter.js ainda não disponível!');
                    return false;
                }
            }

            // Ajuste automático do Canvas para não distorcer em telas diferentes
            function redimensionarCanvas() {
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;
            }
            function redimensionarCanvasDist() {
                canvasDist = document.getElementById('distribuidorCanvas');
                ctxDist = canvasDist.getContext('2d');
                canvasDist.width = canvasDist.clientWidth;
                canvasDist.height = canvasDist.clientHeight;
            }
            function redimensionarCanvasPh() {
                const canvasPh = document.getElementById('phCanvas');
                if (!canvasPh) return;
                canvasPh.width = canvasPh.clientWidth;
                canvasPh.height = canvasPh.clientHeight;
                if (dom?.mainPh && !dom.mainPh.classList.contains('hidden')) atualizarPh();
            }

            function redimensionarCanvasDoDashboard(dashboardKey) {
                if (dashboardKey === 'destorroador' && !dom?.mainContent?.classList.contains('hidden')) {
                    redimensionarCanvas();
                } else if (dashboardKey === 'distribuidor' && !dom?.mainDist?.classList.contains('hidden')) {
                    redimensionarCanvasDist();
                } else if (dashboardKey === 'ph' && !dom?.mainPh?.classList.contains('hidden')) {
                    redimensionarCanvasPh();
                }
            }
            window.addEventListener('resize', redimensionarCanvas);
            window.addEventListener('resize', redimensionarCanvasDist);
            window.addEventListener('resize', redimensionarCanvasPh);
            redimensionarCanvas();
            redimensionarCanvasDist();

            // --- MAPEAMENTO DE DOM SEGURO ---
            dom = {
                homeScreen: document.getElementById('home-screen'),
                sidebar: document.getElementById('sidebar'),
                mainContent: document.getElementById('main-content'),
                sidebarDist: document.getElementById('sidebar-distribuidor'),
                mainDist: document.getElementById('main-distribuidor'),
                sidebarPh: document.getElementById('sidebar-ph'),
                mainPh: document.getElementById('main-ph'),
                
                btnDestorroador: document.getElementById('btn-destorroador'),
                btnDistribuidor: document.getElementById('btn-distribuidor'),
                btnPh: document.getElementById('btn-ph'),
                btnVoltar: document.getElementById('btn-voltar'),
                btnVoltarDist: document.getElementById('btn-voltar-dist'),
                btnVoltarPh: document.getElementById('btn-voltar-ph'),
                stateButtons: document.querySelectorAll('.state-btn'),
                resetButtons: document.querySelectorAll('[data-dashboard-reset]'),
                resetModal: document.getElementById('reset-confirmation-modal'),
                resetModalTitle: document.getElementById('reset-confirmation-title'),
                resetModalText: document.getElementById('reset-confirmation-text'),
                resetModalCancel: document.getElementById('reset-confirmation-cancel'),
                resetModalConfirm: document.getElementById('reset-confirmation-confirm'),
                sidebarToggleButtons: document.querySelectorAll('[data-sidebar-toggle]'),
                sidebarPinButtons: document.querySelectorAll('[data-sidebar-pin]'),
                themeToggleButtons: document.querySelectorAll('[data-theme-toggle]'),
                languageToggleButtons: document.querySelectorAll('[data-language-toggle]'),
                
                // Variáveis Destorroador
                energia: document.getElementById('in_energia'),
                tensao: document.getElementById('in_tensao'),
                corrente: document.getElementById('in_corrente'),
                eficiencia: document.getElementById('in_eficiencia'),
                reducao: document.getElementById('in_reducao'),
                taxaRange: document.getElementById('in_taxa_range'),
                taxaNum: document.getElementById('in_taxa_num'),
                lblCorrente: document.getElementById('lbl_corrente'),
                painelEsquerdo: document.getElementById('painel_esquerdo'),
                painelDireito: document.getElementById('painel_direito'),
                
                // Variáveis Distribuidor (Pneumática e Agronômica)
                distGrpModo1: document.getElementById('grp_dist_modo1'),
                distGrpModo2: document.getElementById('grp_dist_modo2'),
                distTaxa: document.getElementById('in_dist_taxa'),
                distVelTrator: document.getElementById('in_dist_veltrator'),
                distLargura: document.getElementById('in_dist_largura'),
                distEspessura: document.getElementById('in_dist_espessura'),
                distQtdDiscos: document.getElementById('in_dist_qtd_discos'),
                distCavidades: document.getElementById('in_dist_cavidades'),
                distAreaCavidade: document.getElementById('in_dist_area_cavidade'),
                distDensidade: document.getElementById('in_dist_densidade'),
                distTensao: document.getElementById('in_dist_tensao'),
                distCorrente: document.getElementById('in_dist_corrente'),
                distEficienciaMotor: document.getElementById('in_dist_eficiencia_motor'),
                distEnergiaDosador: document.getElementById('in_dist_energia_dosador'),
                distQtdPrimarios: document.getElementById('in_dist_qtd_primarios'),
                distDiametroPrimarioPol: document.getElementById('in_dist_diametro_primario_pol'),
                distComprimentoPrimario: document.getElementById('in_dist_comprimento_primario'),
                distKTorre: document.getElementById('in_dist_k_torre'),
                distLinhas: document.getElementById('in_dist_linhas'),
                distComprimento: document.getElementById('in_dist_comprimento'),
                distVazaoTurbina: document.getElementById('in_dist_vazaoturbina'),
                distDiametro: document.getElementById('in_dist_diametro'),
                distDensidadeAr: document.getElementById('in_dist_densidade_ar'),
                distFatorAtrito: document.getElementById('in_dist_fator_atrito'),
                distPressaoTurbina: document.getElementById('in_dist_pressao_turbina'),
                
                // Variáveis Distribuidor (Cinemática)
                distV0: document.getElementById('in_dist_v0'),
                distAngulo: document.getElementById('in_dist_angulo'),
                distRaio: document.getElementById('in_dist_raio'),
                distLargChapa: document.getElementById('in_dist_largchapa'),
                distDiamTubo2: document.getElementById('in_dist_diamtubo2'),
                distAltura: document.getElementById('in_dist_altura'),
                distCr: document.getElementById('in_dist_cr'),
                painelEsqDist: document.getElementById('painel_esq_dist'),
                painelDirDist: document.getElementById('painel_dir_dist'),
                painelGraficoDist: document.getElementById('painel_grafico_dist'),

                painelEsqPh: document.getElementById('painel_esq_ph'),
                painelDirPh: document.getElementById('painel_dir_ph')
            };

            const dashboardProfiles = {
                destorroador: {
                    container: dom.sidebar,
                    activeProfile: 'minimo_a',
                    profiles: {}
                },
                distribuidor: {
                    container: dom.sidebarDist,
                    activeProfile: 'minimo_a',
                    profiles: {}
                },
                ph: {
                    container: dom.sidebarPh,
                    activeProfile: 'minimo_a',
                    profiles: {}
                }
            };
            const dashboardDefaults = {};
            const dashboardProfileKeys = ['minimo', 'minimo_a', 'minimo_b', 'minimo_c', 'maximo', 'maximo_a', 'maximo_b', 'maximo_c'];
            const sidebarConfigs = {
                destorroador: { element: dom.sidebar, pinned: true, collapsed: false },
                distribuidor: { element: dom.sidebarDist, pinned: true, collapsed: false },
                ph: { element: dom.sidebarPh, pinned: true, collapsed: false }
            };
            const textosOriginais = new WeakMap();
            const traducoesIngles = {
                'Portal de Engenharia': 'Engineering Portal',
                'Selecione a ferramenta de simulação desejada.': 'Select the desired simulation tool.',
                'Destorroador NPK': 'NPK Lump Breaker',
                'Distribuidor de Sólidos': 'Solid Material Distributor',
                'Regulação de Ph': 'pH Regulation',
                'Em construção · Acessar ferramenta': 'Under construction · Open tool',
                '🧪 Tanque e meta de pH': '🧪 Tank and pH target',
                '🧪 Tanque e alvo de pH': '🧪 Tank and target pH',
                'pH desejado e condição medida no depósito.': 'Desired pH and measured tank condition.',
                'Etapas da regulação de pH': 'pH regulation steps',
                'Tanque': 'Tank',
                'Aplicação': 'Application',
                'Ciclos': 'Cycles',
                'Resultado': 'Result',
                'Etapa 1 de 4': 'Step 1 of 4',
                'Etapa 2 de 4': 'Step 2 of 4',
                'Etapa 3 de 4': 'Step 3 of 4',
                'Etapa 4 de 4': 'Step 4 of 4',
                '🧪 Tanque e reagentes': '🧪 Tank and reagents',
                'pH inicial medido': 'Measured initial pH',
                'Informe a condição inicial do tanque e os reagentes realmente disponíveis.': 'Enter the initial tank condition and the reagents actually available.',
                'Valor medido antes do primeiro pulso deste processo.': 'Value measured before the first pulse of this process.',
                'Valor de pH que o controle deve atingir.': 'pH value the control must reach.',
                'Diferença máxima aceita entre o pH medido e o alvo.': 'Maximum accepted difference between measured and target pH.',
                'Temperatura medida da água usada na avaliação hidráulica.': 'Measured water temperature used in hydraulic assessment.',
                'Selecione uma solução padronizada ou informe os dados reais do produto.': 'Select a standardized solution or enter actual product data.',
                'pH medido ou declarado da solução ácida disponível.': 'Measured or declared pH of the available acid solution.',
                'pH medido ou declarado da solução básica disponível.': 'Measured or declared pH of the available base solution.',
                'Quantidade de equivalentes neutralizantes por mol do ácido.': 'Neutralizing equivalents per mole of acid.',
                'Quantidade de equivalentes neutralizantes por mol da base.': 'Neutralizing equivalents per mole of base.',
                'Volume efetivamente disponível para os ciclos.': 'Volume actually available for the cycles.',
                '🌊 Método de aplicação': '🌊 Application method',
                'Defina como cada pulso será transferido ao tanque.': 'Define how each pulse will be transferred to the tank.',
                'Controle incremental avançado': 'Advanced incremental control',
                'Hidráulica avançada': 'Advanced hydraulics',
                'Volume utilizado no primeiro ciclo, antes de existir resposta medida.': 'Volume used in the first cycle before a measured response exists.',
                'Menor volume permitido em um ciclo.': 'Smallest volume allowed in a cycle.',
                'Maior volume permitido em um ciclo.': 'Largest volume allowed in a cycle.',
                'Fração da dose estimada aplicada no próximo ciclo.': 'Fraction of the estimated dose applied in the next cycle.',
                'Tempo reservado para homogeneizar o tanque depois da aplicação.': 'Time reserved to homogenize the tank after application.',
                'Tempo aguardado após a mistura antes da nova leitura.': 'Time waited after mixing before the new reading.',
                'Menor alteração considerada uma resposta mensurável.': 'Smallest change considered a measurable response.',
                'Ciclos consecutivos sem resposta antes da interrupção.': 'Consecutive no-response cycles before stopping.',
                'Volume total máximo antes da interrupção.': 'Maximum total volume before stopping.',
                'Quantidade máxima de ciclos permitida.': 'Maximum number of cycles allowed.',
                'Pressão manométrica imediatamente antes do Venturi.': 'Gauge pressure immediately before the Venturi.',
                'Desnível positivo quando o reservatório está abaixo da garganta.': 'Positive elevation when the reservoir is below the throat.',
                'Comprimento total da mangueira do produto.': 'Total product hose length.',
                'Fator de atrito de Darcy da mangueira e do produto.': 'Darcy friction factor of the hose and product.',
                'Densidade medida do produto dosado.': 'Measured density of the dosed product.',
                'Viscosidade dinâmica medida do produto.': 'Measured dynamic viscosity of the product.',
                'Ângulo total do cone convergente.': 'Total convergent cone angle.',
                'Ângulo total do difusor.': 'Total diffuser angle.',
                'Comprimento cilíndrico em múltiplos do diâmetro da garganta.': 'Cylindrical length in multiples of throat diameter.',
                '▶ Executar ciclos': '▶ Run cycles',
                'Use o cartão operacional no painel principal. A nova leitura de pH aparecerá junto ao botão correto depois da mistura.': 'Use the operating card in the main panel. The new pH reading will appear next to the correct button after mixing.',
                '📊 Resultado e histórico': '📊 Result and history',
                'Consulte o histórico, o gráfico de aproximação e o memorial completo no painel principal.': 'View history, the approach chart, and the complete report in the main panel.',
                'pH mínimo ideal': 'Ideal minimum pH',
                'pH máximo ideal': 'Ideal maximum pH',
                'pH alvo': 'Target pH',
                'pH atual do tanque': 'Current tank pH',
                '🔁 Controle incremental': '🔁 Incremental control',
                'Tolerância do pH (±pH)': 'pH tolerance (±pH)',
                'Pulso inicial (L)': 'Initial pulse (L)',
                'Pulso mínimo (L)': 'Minimum pulse (L)',
                'Pulso máximo (L)': 'Maximum pulse (L)',
                'Fator de aproximação (%)': 'Approach factor (%)',
                'Tempo de mistura (s)': 'Mixing time (s)',
                'Tempo de estabilização (s)': 'Stabilization time (s)',
                'Variação mínima detectável (pH)': 'Minimum detectable change (pH)',
                'Limite de ciclos sem resposta': 'No-response cycle limit',
                'Dose acumulada máxima (L)': 'Maximum cumulative dose (L)',
                'Número máximo de ciclos': 'Maximum number of cycles',
                'Tempo de aplicação por pulso (min)': 'Application time per pulse (min)',
                'Controle incremental por realimentação de pH e dimensionamento hidráulico.': 'Incremental pH feedback control and hydraulic sizing.',
                'Física aplicada: realimentação de pH, continuidade, equação de Bernoulli e Darcy-Weisbach.': 'Applied physics: pH feedback, continuity, Bernoulli equation, and Darcy-Weisbach.',
                'Configura a dosagem em pequenos pulsos, seguida por mistura, estabilização e nova leitura real de pH.': 'Configures dosing in small pulses followed by mixing, stabilization, and a new real pH reading.',
                'Diferença máxima aceita entre o pH medido e o alvo. Dentro desse intervalo, o processo é encerrado.': 'Maximum accepted difference between measured and target pH. The process ends inside this interval.',
                'Volume utilizado no primeiro ciclo, antes de existir uma resposta medida da água.': 'Volume used in the first cycle before a measured water response exists.',
                'Menor volume permitido em um ciclo. Limita o cálculo adaptativo perto do pH alvo.': 'Smallest volume allowed in a cycle. Limits adaptive calculation near target pH.',
                'Maior volume permitido em um ciclo. Limita a ação após uma resposta pequena da água.': 'Largest volume allowed in a cycle. Limits action after a small water response.',
                'Fração da dose estimada aplicada no próximo ciclo. Valores menores tornam a aproximação mais conservadora.': 'Fraction of the estimated dose applied in the next cycle. Lower values make the approach more conservative.',
                'Tempo reservado para homogeneizar o tanque depois de cada aplicação.': 'Time reserved to homogenize the tank after each application.',
                'Tempo adicional aguardado após a mistura antes de registrar a nova leitura do sensor.': 'Additional time after mixing before recording the new sensor reading.',
                'Menor alteração de pH considerada resposta mensurável após um pulso.': 'Smallest pH change considered a measurable response after a pulse.',
                'Quantidade de ciclos consecutivos sem alteração mensurável antes de interromper o processo.': 'Number of consecutive cycles without measurable change before stopping the process.',
                'Volume total máximo de ácido e base que pode ser registrado antes de interromper o processo.': 'Maximum total acid and base volume that may be recorded before stopping the process.',
                'Quantidade máxima de ciclos permitida antes de interromper o controlador.': 'Maximum number of cycles allowed before stopping the controller.',
                'Tempo disponível para transferir cada pulso calculado.': 'Time available to transfer each calculated pulse.',
                'Volume do tanque (L)': 'Tank volume (L)',
                'Temperatura da água (°C)': 'Water temperature (°C)',
                'Alcalinidade (mg/L como CaCO₃)': 'Alkalinity (mg/L as CaCO₃)',
                '📐 Método químico': '📐 Chemical method',
                'Titulação experimental': 'Experimental titration',
                'Capacidade tampão medida': 'Measured buffer capacity',
                'Volume da amostra (mL)': 'Sample volume (mL)',
                'Titulante consumido (mL)': 'Titrant consumed (mL)',
                'Capacidade tampão (mmol/L/pH)': 'Buffer capacity (mmol/L/pH)',
                '⚗️ Ácido disponível': '⚗️ Available acid',
                'Pré-seleção de ácido': 'Acid preset',
                'Pré-seleção de base': 'Base preset',
                'Solução personalizada': 'Custom solution',
                'Ácido clorídrico 0,100 mol/L': 'Hydrochloric acid 0.100 mol/L',
                'Ácido nítrico 0,100 mol/L': 'Nitric acid 0.100 mol/L',
                'Ácido sulfúrico 0,100 mol/L': 'Sulfuric acid 0.100 mol/L',
                'Hidróxido de sódio 0,100 mol/L': 'Sodium hydroxide 0.100 mol/L',
                'Hidróxido de potássio 0,100 mol/L': 'Potassium hydroxide 0.100 mol/L',
                'Nome ou composição do ácido': 'Acid name or composition',
                'pH do ácido': 'Acid pH',
                'Concentração do ácido (mol/L)': 'Acid concentration (mol/L)',
                'Equivalentes do ácido (eq/mol)': 'Acid equivalents (eq/mol)',
                'Pureza do ácido (%)': 'Acid purity (%)',
                'Volume de ácido disponível (L)': 'Available acid volume (L)',
                '⚗️ Base disponível': '⚗️ Available base',
                'Nome ou composição da base': 'Base name or composition',
                'pH da base': 'Base pH',
                'Concentração da base (mol/L)': 'Base concentration (mol/L)',
                'Equivalentes da base (eq/mol)': 'Base equivalents (eq/mol)',
                'Pureza da base (%)': 'Base purity (%)',
                'Volume de base disponível (L)': 'Available base volume (L)',
                '🌊 Aplicação e Venturi': '🌊 Application and Venturi',
                'Venturi dosador': 'Dosing Venturi',
                'Bomba peristáltica': 'Peristaltic pump',
                'Material em contato com o produto': 'Material in contact with product',
                'Compatibilidade química confirmada pelo fabricante': 'Chemical compatibility confirmed by manufacturer',
                'Calibração da bomba (mL/rev)': 'Pump calibration (mL/rev)',
                'Vazão da linha (L/min)': 'Line flow rate (L/min)',
                'Diâmetro interno da linha (mm)': 'Line internal diameter (mm)',
                'Pressão antes do Venturi (bar g)': 'Pressure before Venturi (bar g)',
                'Pressão depois do Venturi (bar g)': 'Pressure after Venturi (bar g)',
                'Tempo de aplicação (min)': 'Application time (min)',
                'Altura de sucção (m)': 'Suction height (m)',
                'Comprimento da mangueira (m)': 'Hose length (m)',
                'Diâmetro da mangueira (mm)': 'Hose diameter (mm)',
                'Fator de atrito da mangueira': 'Hose friction factor',
                'Densidade do produto (kg/m³)': 'Product density (kg/m³)',
                'Viscosidade do produto (mPa·s)': 'Product viscosity (mPa·s)',
                'Ângulo do convergente (°)': 'Convergent angle (°)',
                'Ângulo do difusor (°)': 'Diffuser angle (°)',
                'Comprimento relativo da garganta (L/d)': 'Relative throat length (L/d)',
                '⚗️ Dashboard: Regulação de pH': '⚗️ Dashboard: pH Regulation',
                'Dimensionamento químico da dose e hidráulico do tubo de Venturi.': 'Chemical dose and Venturi tube hydraulic sizing.',
                'Física aplicada: equilíbrio ácido-base, continuidade, equação de Bernoulli e Darcy-Weisbach.': 'Applied physics: acid-base equilibrium, continuity, Bernoulli equation, and Darcy-Weisbach.',
                'Informar produto e composição': 'Enter product and composition',
                'Informar material da mangueira, bomba e Venturi': 'Enter hose, pump, and Venturi material',
                'Faixa operacional desejada e condição medida no depósito.': 'Desired operating range and measured tank condition.',
                'Limite inferior da faixa de pH aceita pelo processo.': 'Lower pH limit accepted by the process.',
                'Limite superior da faixa de pH aceita pelo processo.': 'Upper pH limit accepted by the process.',
                'Valor de pH que a dosagem deve atingir dentro da faixa ideal.': 'pH value that dosing must reach within the ideal range.',
                'Valor de pH que a dosagem deve atingir.': 'pH value that dosing must reach.',
                'pH medido atualmente no tanque.': 'pH currently measured in the tank.',
                'Volume real de solução que será corrigido.': 'Actual solution volume to be corrected.',
                'Temperatura medida da água, usada para avaliar a margem até a pressão de vapor.': 'Measured water temperature used to assess margin above vapor pressure.',
                'Capacidade da água de neutralizar ácidos, informada pelo laudo em mg/L como CaCO3. Não substitui a titulação até o pH alvo.': 'Water acid-neutralizing capacity reported as mg/L CaCO3. It does not replace titration to target pH.',
                'A dose exata exige uma titulação ou uma capacidade tampão medida no intervalo de interesse.': 'An exact dose requires titration or buffer capacity measured over the relevant interval.',
                'Titulação experimental: retire uma amostra conhecida da água, adicione aos poucos exatamente o mesmo ácido ou base que será usado no tanque e meça quanto foi necessário para alcançar o pH alvo. O sistema amplia essa proporção da amostra para o volume total do tanque. Exemplo: se 1 mL corrige uma amostra de 100 mL, serão necessários 10 L para corrigir 1000 L nas mesmas condições. É o método recomendado porque incorpora a composição e o tamponamento reais da água.': 'Experimental titration: take a known water sample, gradually add exactly the same acid or base that will be used in the tank, and measure how much is required to reach the target pH. The system scales this sample ratio to the total tank volume. Example: if 1 mL corrects a 100 mL sample, 10 L will be required to correct 1000 L under the same conditions. This is the recommended method because it incorporates the actual water composition and buffering.',
                'Capacidade tampão medida: indica quantos milimoles de carga ácida ou básica são necessários para alterar em uma unidade o pH de um litro da solução, em mmol/L/pH. Deve ser obtida por ensaio no intervalo entre o pH atual e o alvo. Quanto maior esse valor, maior será a dose necessária. Exemplo: dobrar a capacidade tampão dobra a quantidade calculada de ácido ou base para o mesmo tanque e a mesma variação de pH.': 'Measured buffer capacity: indicates how many millimoles of acidic or basic charge are required to change the pH of one liter of solution by one unit, in mmol/L/pH. It must be obtained experimentally over the interval between current and target pH. The higher this value, the greater the required dose. Example: doubling buffer capacity doubles the calculated acid or base amount for the same tank and pH change.',
                'Volume da amostra de água utilizada no ensaio de titulação.': 'Water sample volume used in the titration.',
                'Volume do titulante consumido para levar a amostra do pH atual ao pH alvo.': 'Titrant volume consumed to move the sample from current to target pH.',
                'Capacidade tampão medida no intervalo entre o pH atual e o pH alvo, em mmol de carga por litro e por unidade de pH.': 'Buffer capacity measured between current and target pH in mmol of charge per liter per pH unit.',
                'Propriedades medidas ou declaradas dos produtos disponíveis.': 'Measured or declared properties of available products.',
                'pH medido da solução ácida disponível; é informativo e não substitui sua concentração.': 'Measured pH of available acid solution; informational and not a substitute for concentration.',
                'pH medido da solução básica disponível; é informativo e não substitui sua concentração.': 'Measured pH of available base solution; informational and not a substitute for concentration.',
                'Concentração molar informada pelo fabricante ou obtida por análise.': 'Molar concentration reported by the manufacturer or obtained by analysis.',
                'Quantidade de equivalentes neutralizantes liberados por mol do ácido no processo considerado.': 'Neutralizing equivalents released per mole of acid in the process.',
                'Quantidade de equivalentes neutralizantes fornecidos por mol da base no processo considerado.': 'Neutralizing equivalents supplied per mole of base in the process.',
                'Fração efetiva do produto conforme certificado do fornecedor.': 'Effective product fraction according to supplier certificate.',
                'Volume efetivamente disponível para dosagem.': 'Volume effectively available for dosing.',
                'Escolha se o produto será aspirado pelo Venturi ou dosado por uma bomba peristáltica em garganta despressurizada.': 'Choose whether product is drawn by Venturi or metered by a peristaltic pump into a depressurized throat.',
                'Vazão volumétrica de água que atravessa o Venturi.': 'Volumetric water flow through the Venturi.',
                'Volume deslocado por volta conforme curva ou calibração da bomba. Use zero quando o dado não estiver disponível.': 'Volume displaced per revolution according to the pump curve or calibration. Use zero when unavailable.',
                'Diâmetro interno real da tubulação antes do convergente.': 'Actual internal pipe diameter before the convergent.',
                'Pressão manométrica medida imediatamente antes do Venturi.': 'Gauge pressure measured immediately before the Venturi.',
                'Pressão manométrica requerida depois do difusor.': 'Required gauge pressure after the diffuser.',
                'Tempo disponível para transferir toda a dose calculada.': 'Time available to transfer the entire calculated dose.',
                'Desnível positivo quando o reservatório do aditivo está abaixo da garganta.': 'Positive elevation when the additive reservoir is below the throat.',
                'Comprimento total da mangueira entre o produto e a garganta.': 'Total hose length between product and throat.',
                'Diâmetro interno real da mangueira de produto.': 'Actual internal diameter of product hose.',
                'Fator de atrito de Darcy medido ou calculado para a mangueira e o produto.': 'Measured or calculated Darcy friction factor for hose and product.',
                'Densidade medida do produto que será efetivamente dosado.': 'Measured density of the product to be dosed.',
                'Viscosidade dinâmica medida do produto, usada para caracterizar o escoamento na sucção.': 'Measured product dynamic viscosity used to characterize suction flow.',
                'Ângulo total do cone convergente usado para transformar a diferença de diâmetros em comprimento.': 'Total convergent cone angle used to convert diameter difference into length.',
                'Ângulo total do difusor usado para recuperar pressão com menor separação de escoamento.': 'Total diffuser angle used to recover pressure with less flow separation.',
                'Comprimento da seção cilíndrica expresso em múltiplos do diâmetro da garganta.': 'Cylindrical section length expressed as multiples of throat diameter.',
                'Microdosagem': 'Microdosing',
                'Aplicação de Fluido no Solo': 'Soil Fluid Application',
                'Aplicação Linha Pressurizada': 'Pressurized Line Application',
                'Acessar Simulador': 'Open Simulator',
                'Em desenvolvimento': 'In development',
                'Perfil base': 'Base profile',
                'Cenários': 'Scenarios',
                'ENTRADA': 'INLET',
                'TORQUE': 'TORQUE',
                'SAÍDA': 'OUTLET',
                'FLUXO MECÂNICO - DESTORROADOR': 'MECHANICAL FLOW - LUMP BREAKER',
                'Rolos opostos puxam o material e geram torque de esmagamento': 'Opposing rollers pull the material and generate crushing torque',
                'ROLOS DE MOAGEM': 'GRINDING ROLLERS',
                '⬅ Voltar ao Portal': '⬅ Back to Portal',
                '↓ Mínimo': '↓ Minimum',
                '↑ Máximo': '↑ Maximum',
                'Resetar': 'Reset',
                '🪨 Propriedades do Material': '🪨 Material Properties',
                'Energia Específica de Fratura': 'Specific Fracture Energy',
                'Trabalho para romper o grão. NPK = ~15 a 20 J/g.': 'Work required to break the granule. NPK = ~15 to 20 J/g.',
                '🔄 Modo de Simulação': '🔄 Simulation Mode',
                '⚙️ 1. Sistema Mecânico (Foco em Potência)': '⚙️ 1. Mechanical System (Power Focus)',
                '⚡ 2. Sistema Elétrico (Risco de Queima)': '⚡ 2. Electrical System (Overheating Risk)',
                '⚡ Parâmetros Elétricos': '⚡ Electrical Parameters',
                'Tensão Nominal (Vdc)': 'Nominal Voltage (Vdc)',
                'Corrente Aplicada (A)': 'Applied Current (A)',
                'Corrente Máxima Suportada (A)': 'Maximum Supported Current (A)',
                'Eficiência do Motor (%)': 'Motor Efficiency (%)',
                'Densidade (g/mm³)': 'Density (g/mm³)',
                'Tensão do Motor (Vdc)': 'Motor Voltage (Vdc)',
                'Corrente Máx (A)': 'Maximum Current (A)',
                'Energia Específica do Dosador (J/g)': 'Metering Specific Energy (J/g)',
                'Quantidade de Dutos Primários': 'Number of Primary Ducts',
                'Diâmetro do Duto Primário (pol)': 'Primary Duct Diameter (in)',
                'Comprimento do Duto Primário (m)': 'Primary Duct Length (m)',
                'Perda Local da Torre (K)': 'Tower Local Loss (K)',
                'Número de Linhas': 'Number of Rows',
                'Comprimento do Tubo (m)': 'Tube Length (m)',
                'Vazão da Turbina (m³/min)': 'Turbine Flow Rate (m³/min)',
                'Diâmetro Tubulação (mm)': 'Tube Diameter (mm)',
                'Densidade do Ar (kg/m³)': 'Air Density (kg/m³)',
                'Fator de Atrito Darcy (λ)': 'Darcy Friction Factor (λ)',
                'Pressão Estática Máx. (Pa)': 'Maximum Static Pressure (Pa)',
                'Coeficiente Restituição (e)': 'Restitution Coefficient (e)',
                '🌪️ Sistema Pneumático': '🌪️ Pneumatic System',
                'Sistema Pneumático': 'Pneumatic System',
                'Linhas Secundárias': 'Secondary Rows',
                'Trecho Primário': 'Primary Section',
                'Rede Pneumática em Dois Estágios': 'Two-Stage Pneumatic Network',
                'Energia total circulando no sistema no limite da corrente estipulada.': 'Total energy circulating in the system at the specified current limit.',
                'Potência mecânica máxima que o motor consegue entregar antes de queimar.': 'Maximum mechanical power the motor can deliver before thermal damage.',
                'Como o motor DC tenta manter o torque variando a corrente, esta é a Amperagem real que a pedra exige do sistema para quebrar. Se for maior que a Etiqueta, o motor queima.': 'Because the DC motor varies current to maintain torque, this is the actual current required to fracture the material. Exceeding the nameplate limit creates thermal-damage risk.',
                'Limite térmico do fabricante (Amperes de placa).': 'Manufacturer thermal limit (nameplate amperes).',
                'Torque de Estol referencial. Acima deste torque, a amperagem ultrapassa o limite térmico.': 'Reference stall torque. Above this torque, current exceeds the thermal limit.',
                'Velocidade cinemática na ponta do eixo triturador.': 'Kinematic speed at the crusher shaft end.',
                'Potência elétrica, tensão, corrente e conversão de energia. Clique para referência.': 'Electrical power, voltage, current, and energy conversion. Click for the reference.',
                'Potência dissipada em resistência elétrica e aquecimento por corrente. Clique para referência.': 'Power dissipated in electrical resistance and current-induced heating. Click for the reference.',
                'Potência elétrica e potência mecânica com eficiência do motor.': 'Electrical and mechanical power including motor efficiency.',
                'Conversão exata do diâmetro primário de polegadas para SI.': 'Exact conversion of primary diameter from inches to SI.',
                'Continuidade na rede primária até a torre.': 'Continuity through the primary network to the tower.',
                'Perda distribuída por atrito ao longo do duto primário.': 'Distributed friction loss along the primary duct.',
                'Perda localizada por divisão e mudança de direção na torre.': 'Local loss caused by flow splitting and direction changes in the tower.',
                'Continuidade nas linhas menores após a torre.': 'Continuity through the smaller rows downstream of the tower.',
                'Recolher barra lateral': 'Collapse sidebar',
                'Desafixar barra lateral': 'Unpin sidebar',
                'Expandir barra lateral': 'Expand sidebar',
                'Fixar barra lateral': 'Pin sidebar',
                'Características físicas intrínsecas ao aglomerado mineral que será triturado.': 'Intrinsic physical properties of the mineral agglomerate to be crushed.',
                "Índice empírico (Bond's Work Index) que define o trabalho mecânico em Joules para cisalhar 1 grama de material. O NPK cristalizado exige entre 15 e 20 J/g.": "Empirical index (Bond's Work Index) defining the mechanical work in joules required to shear 1 gram of material. Crystallized NPK requires between 15 and 20 J/g.",
                'Alterna o referencial do cálculo: da mecânica empurrando o limite, para a elétrica sofrendo o impacto.': 'Switches the calculation perspective between mechanical demand and its electrical impact.',
                'Capacidade da fonte de alimentação e conversão eletromecânica do motor CC.': 'Power-supply capacity and electromechanical conversion of the DC motor.',
                'Diferença de potencial da bateria/fonte. Sistemas veiculares padrão operam em 12V ou 24V.': 'Battery or supply potential difference. Standard vehicle systems operate at 12 V or 24 V.',
                'Limite de corrente contínua que o enrolamento do motor suporta antes do verniz isolante derreter (Fator limitante térmico).': 'Continuous-current limit supported by the motor winding before the insulating varnish deteriorates (thermal limiting factor).',
                'Porcentagem de energia elétrica que efetivamente vira giro e torque. Os 25% restantes são dissipados como calor na carcaça.': 'Percentage of electrical energy effectively converted into rotation and torque. The remaining 25% is dissipated as heat through the housing.',
                'Cinemática da caixa de engrenagens do Destorroador.': 'Kinematics of the lump breaker gearbox.',
                'Fator multiplicador de força. Uma redução de 50:1 significa que o motor gira 50 vezes para o rolo girar 1 vez, multiplicando o torque por 50 (menos as perdas por atrito).': 'Force multiplication factor. A 50:1 reduction means the motor rotates 50 times for one roller revolution, multiplying torque by 50 minus friction losses.',
                'Demanda de produção: Quantos gramas de fertilizante a máquina precisa engolir e cuspir por segundo.': 'Production demand: grams of fertilizer the machine must process per second.',
                'Alterna entre o cálculo da linha de ar e o voo livre da semente.': 'Switches between airflow-line calculation and seed free-flight calculation.',
                'Características de campo ditadas pelo agricultor.': 'Field requirements defined by the operator.',
                'Quantidade de material desejado por Hectare.': 'Desired material application rate per hectare.',
                'Velocidade de operação da máquina na lavoura. Quanto mais rápido, mais o motor sofre para compensar.': 'Machine operating speed in the field. Higher speed requires the motor to compensate with greater output.',
                'Largura de atuação correspondente a este único dosador (espaçamento da linha).': 'Working width corresponding to this individual meter (row spacing).',
                'Geometria do dosador e elétrica limitante.': 'Meter geometry and electrical limits.',
                'Espessura de cada disco útil do rolo.': 'Thickness of each active roller disc.',
                'Quantidade de discos que realmente participam do volume útil por revolução.': 'Number of discs contributing to the useful volume per revolution.',
                'Quantidade de cavidades externas por disco.': 'Number of external cavities per disc.',
                'Área lateral de cada cavidade em contato com o material.': 'Lateral area of each cavity in contact with the material.',
                'Massa por unidade de volume do material.': 'Material mass per unit volume.',
                'Tensão elétrica alimentada pela bateria do trator.': 'Electrical voltage supplied by the tractor battery.',
                'Amperagem limite antes da queima do verniz da bobina.': 'Current limit before thermal damage to the winding insulation.',
                'Fração da potência elétrica que vira potência mecânica no eixo do motor.': 'Fraction of electrical power converted into mechanical power at the motor shaft.',
                'Energia específica necessária para movimentar/dosar 1 g de material. Deve ser medida em ensaio para o dosador real.': 'Specific energy required to move or meter 1 g of material. It must be measured in a test of the actual meter.',
                'Malha de ar que transporta o sólido do dosador.': 'Air network transporting solids from the meter.',
                'Quantidade de dutos primários de grande diâmetro entre a turbina e a torre de distribuição. No seu arranjo real, são os ramais grossos que preservam pressão antes da divisão final.': 'Number of large-diameter primary ducts between the turbine and distribution tower. These ducts preserve pressure before the final split.',
                'Diâmetro interno do duto primário em polegadas. A conversão usada é 1 ft = 0,3048 m exato, logo 1 in = 25,4 mm. Dutos maiores reduzem L/D e velocidade média, diminuindo a perda por atrito até a torre.': 'Primary-duct internal diameter in inches. The exact conversion is 1 ft = 0.3048 m, therefore 1 in = 25.4 mm. Larger ducts reduce L/D and average velocity, decreasing friction loss to the tower.',
                'Comprimento de cada duto primário até a torre. Esse trecho concentra grande vazão e, mesmo com diâmetro maior, ainda gera perda distribuída ao longo da parede.': 'Length of each primary duct to the tower. This section carries high flow and still produces distributed wall-friction loss.',
                'Coeficiente de perda localizada da torre de distribuição. Modela perdas por mudança de direção, divisão de fluxo e transições internas segundo ΔP_local = K·ρ·v²/2. Ajuste por ensaio ou geometria real da torre.': 'Distribution-tower local-loss coefficient. It models direction changes, flow splitting, and internal transitions using ΔP_local = K·ρ·v²/2. Set it from testing or actual tower geometry.',
                'Trecho após a torre, já dividido em linhas menores até o ponto de aplicação.': 'Section after the tower, divided into smaller rows leading to the application point.',
                'Quantidade de linhas de plantio. A turbina divide seu vento total entre todas elas.': 'Number of planting rows. The turbine divides its total airflow among them.',
                'Comprimento da mangueira de cada linha. Mangueiras longas geram atrito (perda de carga) e reduzem a velocidade real do vento.': 'Hose length for each row. Longer hoses increase friction loss and reduce actual air velocity.',
                'Capacidade volumétrica do soprador.': 'Volumetric capacity of the blower.',
                'Diâmetro interno de cada mangueira individual.': 'Internal diameter of each individual hose.',
                'Densidade do ar usada na pressão dinâmica. 1,2 kg/m³ é aproximação comum para ar próximo de 20 °C ao nível do mar.': 'Air density used for dynamic pressure. 1.2 kg/m³ is a common approximation for air near 20 °C at sea level.',
                'Fator de atrito de Darcy-Weisbach (λ), grandeza adimensional usada na equação de perda de carga ΔP = λ·(L/D)·(ρ·v²/2). Ele representa quanto o escoamento perde pressão por atrito com a parede do tubo. Seu valor depende principalmente do número de Reynolds, da rugosidade interna da mangueira e do regime de escoamento, sendo normalmente obtido por diagrama de Moody, equação de Colebrook ou ensaio. No sistema, aumentar λ eleva a perda de carga, reduz a velocidade real do ar na linha e aumenta o risco de entupimento; reduzir λ diminui a contrapressão e melhora o transporte pneumático. Exemplo: para a mesma vazão, dobrar λ aproximadamente dobra a parcela de perda por atrito prevista na fórmula. Referências: Darcy-Weisbach e diagramas de escoamento em tubos.': 'Darcy-Weisbach friction factor (λ), a dimensionless quantity used in ΔP = λ·(L/D)·(ρ·v²/2). It represents pressure lost to pipe-wall friction. Its value depends mainly on Reynolds number, internal roughness, and flow regime, and is normally obtained from a Moody chart, the Colebrook equation, or testing. Increasing λ raises pressure loss, reduces actual line velocity, and increases clogging risk; reducing λ lowers backpressure and improves pneumatic transport. Example: at the same flow rate, doubling λ approximately doubles the predicted friction-loss component.',
                'Pressão estática máxima disponível na curva da turbina. Use dado do fabricante ou ensaio.': 'Maximum static pressure available from the turbine curve. Use manufacturer or test data.',
                'Coeficiente de Restituição (e): Determina quanta energia a semente perde no choque contra o defletor. Borracha perde muito (~0.4), Aço preserva mais (~0.7).': 'Restitution coefficient (e): determines how much energy the seed loses when striking the deflector. Rubber dissipates more (~0.4), while steel preserves more (~0.7).',
                '🎛️ Parâmetros do Moinho': '🎛️ Mill Parameters',
                'Relação de Redução (1:X)': 'Reduction Ratio (1:X)',
                'Taxa de Moagem Alvo (g/s)': 'Target Grinding Rate (g/s)',
                '⚙️ Dashboard: Destorroador NPK': '⚙️ Dashboard: NPK Lump Breaker',
                'Simulador dinâmico de dimensionamento mecânico e proteção elétrica a 60 FPS.': 'Dynamic mechanical sizing and electrical protection simulator at 60 FPS.',
                '🚜 1. Dosagem e Arraste Pneumático': '🚜 1. Metering and Pneumatic Conveying',
                '☄️ 2. Cinemática de Espalhamento (Queda)': '☄️ 2. Spreading Kinematics (Fall)',
                'Terminal Defletor': 'Terminal Deflector',
                'Velocidade de Queda (V0 m/s)': 'Fall Velocity (V0 m/s)',
                'Velocidade de Queda (V₀ m/s)': 'Fall Velocity (V₀ m/s)',
                'Ângulo Vertical (°)': 'Vertical Angle (°)',
                'Raio de Curvatura (mm)': 'Curvature Radius (mm)',
                'Largura da Chapa (L) mm': 'Plate Width (L) mm',
                'Diâmetro do Tubo (mm)': 'Tube Diameter (mm)',
                'Altura da Chapa (m)': 'Plate Height (m)',
                'Coeficiente de Restituição (e)': 'Restitution Coefficient (e)',
                'Geometria da chapa final de distribuição na linha de plantio.': 'Geometry of the final distribution plate on the planting row.',
                'Velocidade com que a semente cai verticalmente quando sai da mangueira pneumática e atinge o defletor.': 'Speed at which the seed falls vertically when leaving the pneumatic hose and striking the deflector.',
                'Ângulo de inclinação do defletor em relação à horizontal. 45° reflete a semente horizontalmente (máximo alcance). Valores menores aumentam a componente descendente.': 'Deflector tilt angle relative to the horizontal. 45° reflects the seed horizontally (maximum range). Smaller values increase the downward component.',
                'Raio de dobra geométrica da chapa. Raios abertos (1000mm) a deixam quase plana. Raios apertados (60mm) geram alto espalhamento.': 'Geometric bend radius of the plate. Open radii (1000 mm) leave it almost flat. Tight radii (60 mm) generate high spreading.',
                'Largura física total da chapa (limite estrutural do defletor).': 'Total physical width of the plate (structural limit of the deflector).',
                'Diâmetro interno da tubulação de descida. Define a dispersão inicial (cortina) das sementes antes de tocarem a chapa. Tubos finos reduzem o espalhamento.': 'Internal diameter of the drop tube. Defines the initial seed curtain before it reaches the plate. Narrow tubes reduce spreading.',
                'Distância vertical do ponto de impacto na chapa até o solo/sulco onde a semente pousa.': 'Vertical distance from the impact point on the plate to the ground/furrow where the seed lands.',
                'Coeficiente de Restituição (e): Determina quanta energia a semente perde no choque contra o defletor. Borracha perde muito (~0.4), aço preserva mais (~0.7).': 'Coefficient of Restitution (e): Determines how much energy the seed loses on impact with the deflector. Rubber loses a lot (~0.4), steel preserves more (~0.7).',
                'Física aplicada: Conservação de Energia (V x A), resistência de materiais e Lei de Joule.': 'Applied physics: Energy conservation (V x A), materials strength, and Joule\'s law.',
                'Física aplicada: Escoamento de fluidos compressíveis, vazão volumétrica e razão de carregamento bifásico.': 'Applied physics: Compressible fluid flow, volumetric flow rate, and two-phase loading ratio.',
                'Geometria da chapa final de distribui??o na linha de plantio.': 'Geometry of the final distribution plate on the planting row.',
                'Velocidade com que a semente cai verticalmente quando sai da mangueira pneum?tica e atinge o defletor.': 'Speed at which the seed falls vertically when leaving the pneumatic hose and striking the deflector.',
                '?ngulo de inclina??o do defletor em rela??o ? horizontal. 45? reflete a semente horizontalmente (m?ximo alcance). Valores menores aumentam a componente descendente.': 'Deflector tilt angle relative to the horizontal. 45? reflects the seed horizontally (maximum range). Smaller values increase the downward component.',
                'Raio de dobra geom?trica da chapa. Raios abertos (1000mm) a deixam quase plana. Raios apertados (60mm) geram alto espalhamento.': 'Geometric bend radius of the plate. Open radii (1000 mm) leave it almost flat. Tight radii (60 mm) generate high spreading.',
                'Largura f?sica total da chapa (limite estrutural do defletor).': 'Total physical width of the plate (structural limit of the deflector).',
                'Di?metro interno da tubula??o de descida. Define a dispers?o inicial (cortina) das sementes antes de tocarem a chapa. Tubos finos reduzem o espalhamento.': 'Internal diameter of the drop tube. Defines the initial seed curtain before it reaches the plate. Narrow tubes reduce spreading.',
                'Dist?ncia vertical do ponto de impacto na chapa at? o solo/sulco onde a semente pousa.': 'Vertical distance from the impact point on the plate to the ground/furrow where the seed lands.',
                'Coeficiente de Restitui??o (e): Determina quanta energia a semente perde no choque contra o defletor. Borracha perde muito (~0.4), A?o preserva mais (~0.7).': 'Coefficient of Restitution (e): Determines how much energy the seed loses on impact with the deflector. Rubber loses a lot (~0.4), steel preserves more (~0.7).',
                '🚜 Demanda Agronômica': '🚜 Agronomic Demand',
                'Taxa Alvo (kg/ha)': 'Target Rate (kg/ha)',
                'Velocidade do Trator (km/h)': 'Tractor Speed (km/h)',
                'Largura de Trabalho (m)': 'Working Width (m)',
                '⚙️ Implemento e Motor': '⚙️ Implement and Motor',
                'Espessura do Disco (mm)': 'Disc Thickness (mm)',
                'Quantidade Útil de Discos': 'Number of Active Discs',
                'Cavidades Externas por Disco': 'External Cavities per Disc',
                'Área Lateral por Cavidade (mm²)': 'Lateral Area per Cavity (mm²)',
                '🚜 Dashboard: Distribuidor de Sólidos': '🚜 Dashboard: Solid Material Distributor',
                'Simulador pneumático para projeto de semeadoras (Fase Diluída).': 'Pneumatic simulator for seed drill design (Dilute Phase).',
                'Análise de Conversão de Energia': 'Energy Conversion Analysis',
                'Potência Elétrica Consumida': 'Electrical Power Consumption',
                'Potência Útil Entregue ao Eixo': 'Useful Power Delivered to the Shaft',
                'Análise de Força Bruta': 'Gross Force Analysis',
                'Torque Disponível nos Rolos': 'Available Roller Torque',
                'Rotação Final nos Rolos': 'Final Roller Speed',
                'Status de Operação': 'Operating Status',
                'Integridade do Sistema': 'System Integrity',
                'Análise de Demanda de Corrente': 'Current Demand Analysis',
                'Corrente Exigida para Moer': 'Required Grinding Current',
                'Corrente Máxima (Etiqueta)': 'Maximum Current (Nameplate)',
                'Torque Máximo de Trabalho': 'Maximum Working Torque',
                '📚 Memorial de Cálculo': '📚 Calculation Report',
                '📚 Memorial de Cálculo Inverso': '📚 Reverse Calculation Report',
                'Parâmetros Base Assumidos': 'Assumed Base Parameters',
                'Energia Específica': 'Specific Energy',
                'Eficiência Mecânica': 'Mechanical Efficiency',
                'Motor na rotação base': 'Motor at baseline speed',
                '1. Demanda Mecânica (Rolos) 🔗': '1. Mechanical Demand (Rollers) 🔗',
                'Potência mecânica refletida na ponta do eixo do motor:': 'Mechanical power reflected at the motor shaft end:',
                '2. Reflexo Elétrico (Tomada) 🔗': '2. Electrical Demand (Supply) 🔗',
                'O que o motor precisará drenar da bateria para não travar:': 'Electrical power the motor must draw from the battery to avoid stalling:',
                'Corrente resultante dessa demanda forçada:': 'Current resulting from this forced demand:',
                '3. Risco de Queima (Lei de Joule) 🔗': '3. Overheating Risk (Joule’s Law) 🔗',
                'Conversão dimensional para cada linha final:': 'Dimensional conversion for each final row:',
                'Dinâmica de Dosagem Agronômica': 'Agronomic Metering Dynamics',
                'Rotação do Rolo': 'Roller Speed',
                'Taxa Mássica por Linha': 'Mass Flow per Row',
                'Volume Integral do Rolo': 'Integral Roller Volume',
                'Taxa Mássica Total': 'Total Mass Flow',
                'Rede Pneumática em Dois Estágios': 'Two-Stage Pneumatic Network',
                'Velocidade no Duto Primário': 'Primary Duct Velocity',
                'Velocidade na Linha Secundária': 'Secondary Line Velocity',
                '📚 Memorial da Semeadura': '📚 Seeding Calculation Report',
                'Mecânica do Impacto (Defletor)': 'Impact Mechanics (Deflector)',
                'Velocidade de Queda (V₀)': 'Fall Velocity (V₀)',
                'Velocidade Refletida (Vᵣ)': 'Reflected Velocity (Vᵣ)',
                'Análise Vetorial': 'Vector Analysis',
                'Ângulo Saída Frontal': 'Front Exit Angle',
                'Ângulo Curva Máx. (Î³)': 'Maximum Curve Angle (Î³)',
                'Projeção Cinemática no Solo': 'Kinematic Projection on the Ground',
                'Tempo de Queda': 'Fall Time',
                'Alcance Longitudinal': 'Longitudinal Range',
                'Largura da Faixa Distribuída (Espalhamento Z)': 'Distributed Swath Width (Z Spreading)',
                'Perfil de Distribuição': 'Distribution Profile',
                '📚 Memorial da Cinemática': '📚 Kinematics Calculation Report',
                'Física de Projéteis Assumida': 'Assumed Projectile Physics',
                'Física aplicada: Conservação de Energia (V x A), resistência de materiais e Lei de Joule.': 'Applied physics: Energy conservation (V x A), material strength, and Joule\'s law.',
                'Física aplicada: Escoamento de fluidos compressíveis, vazão volumétrica e razão de carregamento bifásico.': 'Applied physics: Compressible fluid flow, volumetric flow rate, and two-phase loading ratio.',
                '© 2026 Guilherme Silva de Oliveira': '© 2026 Guilherme Silva de Oliveira',
                'Visitar Portfólio': 'Visit Portfolio',
                'LinkedIn': 'LinkedIn',
                'VISTA SUPERIOR - DOSAGEM E ARRASTE PNEUMÁTICO': 'TOP VIEW - METERING AND PNEUMATIC CONVEYING',
                'LINHA PRINCIPAL': 'PRIMARY LINE',
                'TORRE DE DISTRIBUIÇÃO': 'DISTRIBUTION TOWER',
                'LINHAS SECUNDÁRIAS': 'SECONDARY LINES',
                'DEPÓSITO': 'HOPPER',
                'ENTRADA DA MÁQUINA': 'MACHINE INLET',
                'Linha grossa = principal | linhas finas = secundárias': 'Thick line = primary | thin lines = secondary',
                'Dashboard Destorroador NPK (Simulador Dinâmico)': 'NPK Lump Breaker Dashboard (Dynamic Simulator)',
                'Preferências da interface': 'Interface preferences',
                'Mudar idioma para inglês': 'Switch language to English',
                'Ativar modo claro': 'Enable light mode',
                'Ativar modo escuro': 'Enable dark mode',
                'Controles da barra lateral': 'Sidebar controls',
                'Rodapé do portal': 'Portal footer',
                'Rodapé do dashboard': 'Dashboard footer',
                'Voltar ao Portal': 'Back to Portal',
                'Recolher barra lateral': 'Collapse sidebar',
                'Desafixar barra lateral': 'Unpin sidebar',
                'Portal de Engenharia': 'Engineering Portal',
                'Selecione a ferramenta de simulação desejada.': 'Select the desired simulation tool.',
                'Acessar Simulador': 'Open Simulator',
                'Em desenvolvimento': 'In development'
            };

            function traduzirTexto(texto, idioma) {
                if (idioma !== 'en') return texto;
                const inicio = texto.match(/^\s*/)?.[0] || '';
                const fim = texto.match(/\s*$/)?.[0] || '';
                const conteudo = texto.trim();
                return `${inicio}${traducoesIngles[conteudo] || conteudo}${fim}`;
            }

            function traduzirElemento(raiz, idioma) {
                if (!raiz || raiz.nodeType !== Node.ELEMENT_NODE) return;
                if (raiz.matches('script, style, mjx-container') || raiz.closest('mjx-container')) return;
                const walker = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
                const nodes = [];
                while (walker.nextNode()) nodes.push(walker.currentNode);
                nodes.forEach((node) => {
                    if (node.parentElement?.closest('script, style, mjx-container')) return;
                    if (!textosOriginais.has(node)) textosOriginais.set(node, node.nodeValue);
                    node.nodeValue = traduzirTexto(textosOriginais.get(node), idioma);
                });
            }

            function traduzirAtributos(raiz, idioma) {
                if (!raiz || raiz.nodeType !== Node.ELEMENT_NODE) return;
                if (raiz.matches('script, style, mjx-container') || raiz.closest('mjx-container')) return;
                const atributos = ['title', 'aria-label', 'placeholder'];
                const elementos = [raiz, ...raiz.querySelectorAll('*')];
                elementos.forEach((elemento) => {
                    if (elemento.matches('script, style, mjx-container') || elemento.closest('mjx-container')) return;
                    atributos.forEach((attr) => {
                        if (!elemento.hasAttribute(attr)) return;
                        const chave = `i18nOriginal${attr.replace(/(^.|-.)/g, (m) => m.replace('-', '').toUpperCase())}`;
                        if (!elemento.dataset[chave]) elemento.dataset[chave] = elemento.getAttribute(attr);
                        elemento.setAttribute(attr, traduzirTexto(elemento.dataset[chave], idioma));
                    });
                });
            }


            function aplicarIdioma(idioma, persistir = true) {
                const inglesAtivo = idioma === 'en';
                document.documentElement.lang = inglesAtivo ? 'en' : 'pt-BR';
                document.body.dataset.language = inglesAtivo ? 'en' : 'pt';
                document.title = textoIdioma('Dashboard Destorroador NPK (Simulador Dinâmico)', 'NPK Lump Breaker Dashboard (Dynamic Simulator)');
                traduzirElemento(document.body, inglesAtivo ? 'en' : 'pt');
                traduzirAtributos(document.body, inglesAtivo ? 'en' : 'pt');
                document.querySelectorAll('[data-tooltip-original]').forEach((elemento) => {
                    elemento.dataset.tooltip = traduzirTexto(elemento.dataset.tooltipOriginal, inglesAtivo ? 'en' : 'pt');
                });
                dom.languageToggleButtons.forEach((button) => {
                    button.textContent = inglesAtivo ? 'BR' : 'EN';
                    const acao = inglesAtivo ? 'Switch language to Portuguese' : 'Mudar idioma para inglês';
                    button.setAttribute('aria-label', acao);
                    button.title = acao;
                });
                const modoClaroAtivo = document.body.dataset.theme === 'light';
                dom.themeToggleButtons.forEach((button) => {
                    const acaoTema = inglesAtivo
                        ? (modoClaroAtivo ? 'Enable dark mode' : 'Enable light mode')
                        : (modoClaroAtivo ? 'Ativar modo escuro' : 'Ativar modo claro');
                    button.setAttribute('aria-label', acaoTema);
                    button.title = acaoTema;
                });
                if (dom?.mainContent && !dom.mainContent.classList.contains('hidden')) {
                    atualizarDashboard();
                }
                if (dom?.mainDist && !dom.mainDist.classList.contains('hidden')) {
                    atualizarDistribuidor();
                }
                if (dom?.mainPh && !dom.mainPh.classList.contains('hidden')) {
                    atualizarPh();
                }
                if (persistir) {
                    try {
                        localStorage.setItem(LANGUAGE_STORAGE_KEY, inglesAtivo ? 'en' : 'pt');
                    } catch (error) {
                        console.warn('Falha ao persistir idioma:', error);
                    }
                }
            }

            function configurarIdioma() {
                let idiomaSalvo = 'pt';
                try {
                    idiomaSalvo = localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'pt';
                } catch (error) {
                    console.warn('Falha ao carregar idioma:', error);
                }
                aplicarIdioma(idiomaSalvo, false);
                dom.languageToggleButtons.forEach((button) => {
                    button.addEventListener('click', () => {
                        aplicarIdioma(document.body.dataset.language === 'en' ? 'pt' : 'en');
                    });
                });
                const observer = new MutationObserver((mutations) => {
                    if (document.body.dataset.language !== 'en') return;
                    mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            traduzirElemento(node, 'en');
                            traduzirAtributos(node, 'en');
                        }
                    }));
                });
                observer.observe(document.body, { childList: true, subtree: true });
            }

            function aplicarTema(theme, persistir = true) {
                const tema = theme === 'light' ? 'light' : 'dark';
                document.body.dataset.theme = tema;
                const modoClaroAtivo = tema === 'light';
                dom.themeToggleButtons.forEach((button) => {
                    button.textContent = modoClaroAtivo ? '🌙' : '☀️';
                    const inglesAtivo = document.body.dataset.language === 'en';
                    const acao = inglesAtivo
                        ? (modoClaroAtivo ? 'Enable dark mode' : 'Enable light mode')
                        : (modoClaroAtivo ? 'Ativar modo escuro' : 'Ativar modo claro');
                    button.setAttribute('aria-label', acao);
                    button.title = acao;
                    button.setAttribute('aria-pressed', String(modoClaroAtivo));
                });
                if (dom?.mainPh && !dom.mainPh.classList.contains('hidden')) atualizarPh();
                if (persistir) {
                    try {
                        localStorage.setItem(THEME_STORAGE_KEY, tema);
                    } catch (error) {
                        console.warn('Falha ao persistir tema:', error);
                    }
                }
            }

            function configurarTema() {
                let temaSalvo = 'dark';
                try {
                    temaSalvo = localStorage.getItem(THEME_STORAGE_KEY) || 'dark';
                } catch (error) {
                    console.warn('Falha ao carregar tema:', error);
                }
                aplicarTema(temaSalvo, false);
                dom.themeToggleButtons.forEach((button) => {
                    button.addEventListener('click', () => {
                        aplicarTema(document.body.dataset.theme === 'light' ? 'dark' : 'light');
                    });
                });
            }

            function salvarEstadoSidebars() {
                const estado = {};
                Object.entries(sidebarConfigs).forEach(([key, config]) => {
                    estado[key] = { pinned: config.pinned, collapsed: config.collapsed };
                });
                try {
                    localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(estado));
                } catch (error) {
                    console.warn('Falha ao persistir estado das barras laterais:', error);
                }
            }

            function atualizarSidebar(key, persistir = true) {
                const config = sidebarConfigs[key];
                if (!config) return;

                config.element.classList.toggle('sidebar-collapsed', config.collapsed);
                const toggle = document.querySelector(`[data-sidebar-toggle="${key}"]`);
                const pin = document.querySelector(`[data-sidebar-pin="${key}"]`);
                if (toggle) {
                    toggle.setAttribute('aria-expanded', String(!config.collapsed));
                    toggle.title = config.collapsed
                        ? textoIdioma('Expandir barra lateral', 'Expand sidebar')
                        : textoIdioma('Recolher barra lateral', 'Collapse sidebar');
                }
                if (pin) {
                    pin.classList.toggle('active', config.pinned);
                    pin.setAttribute('aria-pressed', String(config.pinned));
                    pin.title = config.pinned
                        ? textoIdioma('Desafixar barra lateral', 'Unpin sidebar')
                        : textoIdioma('Fixar barra lateral', 'Pin sidebar');
                }
                if (persistir) salvarEstadoSidebars();
            }

            function configurarSidebars() {
                try {
                    const salvo = JSON.parse(localStorage.getItem(SIDEBAR_STORAGE_KEY) || '{}');
                    Object.entries(sidebarConfigs).forEach(([key, config]) => {
                        if (typeof salvo[key]?.pinned === 'boolean') config.pinned = salvo[key].pinned;
                        if (typeof salvo[key]?.collapsed === 'boolean') config.collapsed = salvo[key].collapsed;
                    });
                } catch (error) {
                    console.warn('Falha ao carregar estado das barras laterais:', error);
                }

                dom.sidebarToggleButtons.forEach((button) => {
                    button.addEventListener('click', () => {
                        const key = button.dataset.sidebarToggle;
                        const config = sidebarConfigs[key];
                        if (!config) return;
                        config.collapsed = !config.collapsed;
                        atualizarSidebar(key);
                    });
                });

                dom.sidebarPinButtons.forEach((button) => {
                    button.addEventListener('click', () => {
                        const key = button.dataset.sidebarPin;
                        const config = sidebarConfigs[key];
                        if (!config) return;
                        config.pinned = !config.pinned;
                        config.collapsed = !config.pinned;
                        atualizarSidebar(key);
                    });
                });

                Object.entries(sidebarConfigs).forEach(([key, config]) => {
                    config.element.addEventListener('transitionend', (event) => {
                        if (event.propertyName !== 'width') return;
                        redimensionarCanvasDoDashboard(key);
                    });
                    config.element.addEventListener('mouseenter', () => {
                        if (config.pinned || !config.collapsed) return;
                        config.collapsed = false;
                        atualizarSidebar(key, false);
                    });
                    config.element.addEventListener('mouseleave', () => {
                        if (config.pinned || config.collapsed) return;
                        config.collapsed = true;
                        atualizarSidebar(key, false);
                    });
                    atualizarSidebar(key, false);
                });
            }

            function clonarEstrutura(dado) {
                return JSON.parse(JSON.stringify(dado));
            }

            function obterRangesDoDashboard(container) {
                return Array.from(container.querySelectorAll('.control-group input[type="range"]'));
            }

            function capturarEstadoDashboard(container) {
                const estado = {};
                obterRangesDoDashboard(container).forEach((range) => {
                    const number = range.parentElement.querySelector('input[type="number"]');
                    estado[range.id] = {
                        value: range.value,
                        numberValue: number ? number.value : range.value,
                        min: range.min,
                        max: range.max,
                        step: range.step,
                        numberMin: number ? number.min : range.min,
                        numberMax: number ? number.max : range.max,
                        numberStep: number ? number.step : range.step
                    };
                });
                container.querySelectorAll('input[type="text"], input[type="checkbox"], select').forEach((input) => {
                    if (!input.id) return;
                    estado[input.id] = input.type === 'checkbox'
                        ? { checked: input.checked, type: 'checkbox' }
                        : { value: input.value, type: input.tagName === 'SELECT' ? 'select' : 'text' };
                });
                return estado;
            }

            function aplicarEstadoDashboard(container, estado) {
                obterRangesDoDashboard(container).forEach((range) => {
                    const salvo = estado[range.id];
                    const number = range.parentElement.querySelector('input[type="number"]');
                    if (!salvo) return;

                    range.min = salvo.min;
                    range.max = salvo.max;
                    range.step = salvo.step || range.step;
                    range.value = salvo.value;

                    if (number) {
                        number.min = salvo.numberMin;
                        number.max = salvo.numberMax;
                        number.step = salvo.numberStep || number.step;
                        number.value = salvo.numberValue ?? salvo.value;
                    }
                });
                container.querySelectorAll('input[type="text"], input[type="checkbox"], select').forEach((input) => {
                    const salvo = estado[input.id];
                    if (!salvo) return;
                    if (input.type === 'checkbox') input.checked = Boolean(salvo.checked);
                    else input.value = salvo.value || '';
                });
            }

            function salvarEstadoDashboard(dashboardKey) {
                const dashboard = dashboardProfiles[dashboardKey];
                if (!dashboard) return;
                dashboard.profiles[dashboard.activeProfile] = capturarEstadoDashboard(dashboard.container);
            }

            function obterModoSelecionado(name) {
                const radio = document.querySelector(`input[name="${name}"]:checked`);
                return radio ? radio.value : null;
            }

            function aplicarModoSelecionado(name, value) {
                if (!value) return;
                const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
                if (radio) radio.checked = true;
            }

            function obterEstadoPersistivel() {
                return {
                    dashboards: {
                        destorroador: {
                            activeProfile: dashboardProfiles.destorroador.activeProfile,
                            profiles: dashboardProfiles.destorroador.profiles
                        },
                        distribuidor: {
                            activeProfile: dashboardProfiles.distribuidor.activeProfile,
                            profiles: dashboardProfiles.distribuidor.profiles
                        },
                        ph: {
                            activeProfile: dashboardProfiles.ph.activeProfile,
                            profiles: dashboardProfiles.ph.profiles
                        }
                    },
                    radios: {
                        modo: obterModoSelecionado('modo'),
                        modo_dist: obterModoSelecionado('modo_dist'),
                        modo_aplicacao_ph: obterModoSelecionado('modo_aplicacao_ph')
                    },
                    controlePh: {
                        estado: 'pausado',
                        historico: controlePh.historico,
                        doseAcido: controlePh.doseAcido,
                        doseBase: controlePh.doseBase,
                        ciclo: controlePh.ciclo,
                        sensibilidade: controlePh.sensibilidade,
                        estimativaRestante: controlePh.estimativaRestante,
                        semRespostaConsecutiva: controlePh.semRespostaConsecutiva,
                        etapa: controlePh.etapa
                    }
                };
            }

            function persistirEstadoAplicacao() {
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(obterEstadoPersistivel()));
                } catch (error) {
                    console.warn('Falha ao persistir estado da aplicação:', error);
                }
            }

            function carregarEstadoPersistido() {
                try {
                    const bruto = localStorage.getItem(STORAGE_KEY);
                    return bruto ? JSON.parse(bruto) : null;
                } catch (error) {
                    console.warn('Falha ao carregar estado persistido:', error);
                    return null;
                }
            }

            function atualizarBotoesDashboard(dashboardKey) {
                dom.stateButtons.forEach((button) => {
                    if (button.dataset.dashboard !== dashboardKey) return;
                    button.classList.toggle('active', dashboardProfiles[dashboardKey].activeProfile === button.dataset.profile);
                });
            }

            function restaurarEstadoDashboard(dashboardKey) {
                const dashboard = dashboardProfiles[dashboardKey];
                if (!dashboard) return;
                aplicarEstadoDashboard(dashboard.container, dashboard.profiles[dashboard.activeProfile]);
            }

            function atualizarDashboardPorChave(dashboardKey) {
                if (dashboardKey === 'destorroador') {
                    atualizarDashboard();
                    return;
                }

                if (dashboardKey === 'ph') {
                    atualizarPh();
                    return;
                }

                atualizarDistribuidor();
                const modoDistElement = document.querySelector('input[name="modo_dist"]:checked');
                if (modoDistElement && modoDistElement.value === "2" && ativarAnimacaoDist) {
                    const v0 = parseFloat(dom.distV0.value) || 12;
                    const theta = parseFloat(dom.distAngulo.value) || 30;
                    const h = parseFloat(dom.distAltura.value) || 0.8;
                    const e = parseFloat(dom.distCr.value) || 0.6;
                    inicializarFisicaDistribuidor(theta, v0, h, e);
                }
            }

            function trocarPerfilDashboard(dashboardKey, profileKey) {
                const dashboard = dashboardProfiles[dashboardKey];
                if (!dashboard || dashboard.activeProfile === profileKey) return;

                salvarEstadoDashboard(dashboardKey);
                dashboard.activeProfile = profileKey;
                restaurarEstadoDashboard(dashboardKey);
                if (dashboardKey === 'ph') controlePh = criarEstadoControlePh();
                atualizarBotoesDashboard(dashboardKey);
                persistirEstadoAplicacao();
                atualizarDashboardPorChave(dashboardKey);
            }

            function restaurarEstadoPersistido() {
                const estadoSalvo = carregarEstadoPersistido();
                if (!estadoSalvo) return;

                ['destorroador', 'distribuidor', 'ph'].forEach((dashboardKey) => {
                    const salvo = estadoSalvo.dashboards?.[dashboardKey];
                    if (!salvo) return;

                    dashboardProfileKeys.forEach((profileKey) => {
                        if (salvo.profiles?.[profileKey]) {
                            dashboardProfiles[dashboardKey].profiles[profileKey] = clonarEstrutura(salvo.profiles[profileKey]);
                        }
                    });
                    if (dashboardProfileKeys.includes(salvo.activeProfile)) {
                        dashboardProfiles[dashboardKey].activeProfile = salvo.activeProfile;
                    } else if (salvo.activeProfile === 'minimo') {
                        dashboardProfiles[dashboardKey].activeProfile = 'minimo_a';
                    } else if (salvo.activeProfile === 'maximo') {
                        dashboardProfiles[dashboardKey].activeProfile = 'maximo_a';
                    }

                    restaurarEstadoDashboard(dashboardKey);
                    atualizarBotoesDashboard(dashboardKey);
                });

                aplicarModoSelecionado('modo', estadoSalvo.radios?.modo);
                aplicarModoSelecionado('modo_dist', estadoSalvo.radios?.modo_dist);
                aplicarModoSelecionado('modo_aplicacao_ph', estadoSalvo.radios?.modo_aplicacao_ph);
                if (estadoSalvo.controlePh) {
                    controlePh = {
                        ...criarEstadoControlePh(),
                        ...estadoSalvo.controlePh,
                        estado: 'pausado',
                        historico: Array.isArray(estadoSalvo.controlePh.historico) ? estadoSalvo.controlePh.historico : []
                    };
                }
            }

            function resetarDashboard(dashboardKey) {
                const padrao = dashboardDefaults[dashboardKey];
                if (!padrao) return;

                dashboardProfiles[dashboardKey].activeProfile = padrao.activeProfile;
                dashboardProfileKeys.forEach((profileKey) => {
                    dashboardProfiles[dashboardKey].profiles[profileKey] = clonarEstrutura(padrao.profiles[profileKey]);
                });

                if (dashboardKey === 'destorroador') {
                    aplicarModoSelecionado('modo', '1');
                } else if (dashboardKey === 'distribuidor') {
                    aplicarModoSelecionado('modo_dist', '1');
                } else {
                    aplicarModoSelecionado('modo_aplicacao_ph', 'venturi');
                    controlePh = criarEstadoControlePh();
                }

                restaurarEstadoDashboard(dashboardKey);
                atualizarBotoesDashboard(dashboardKey);
                persistirEstadoAplicacao();
                atualizarDashboardPorChave(dashboardKey);
            }

            let resetDashboardPendente = null;

            function getTextoConfirmacaoReset(dashboardKey) {
                const idiomaAtual = document.body.dataset.language === 'en' ? 'en' : 'pt';
                const nomes = {
                    destorroador: idiomaAtual === 'en' ? 'NPK Lump Breaker' : 'Destorroador NPK',
                    distribuidor: idiomaAtual === 'en' ? 'Solid Material Distributor' : 'Distribuidor de Sólidos',
                    ph: idiomaAtual === 'en' ? 'pH Regulation' : 'Regulação de pH'
                };
                const nomeDashboard = nomes[dashboardKey] || dashboardKey;

                return idiomaAtual === 'en'
                    ? {
                        title: 'Confirm reset',
                        text: `Reset ${nomeDashboard} to the default values? This will discard the current saved states.`,
                        cancel: 'Cancel',
                        confirm: 'Reset'
                    }
                    : {
                        title: 'Confirmar redefinição',
                        text: `Redefinir ${nomeDashboard} para os valores padrão? Isso vai descartar os estados salvos atuais.`,
                        cancel: 'Cancelar',
                        confirm: 'Redefinir'
                    };
            }

            function fecharConfirmacaoReset() {
                resetDashboardPendente = null;
                dom.resetModal?.classList.add('hidden');
            }

            function abrirConfirmacaoReset(dashboardKey) {
                const texto = getTextoConfirmacaoReset(dashboardKey);
                resetDashboardPendente = dashboardKey;
                dom.resetModalTitle.textContent = texto.title;
                dom.resetModalText.textContent = texto.text;
                dom.resetModalCancel.textContent = texto.cancel;
                dom.resetModalConfirm.textContent = texto.confirm;
                dom.resetModal.classList.remove('hidden');
                dom.resetModalCancel.focus();
            }

            const graficoDistSaidasBase = [
                { chave: 'volumeRolo', pt: 'Volume do rolo', en: 'Roller volume', unidade: 'mm³/rev' },
                { chave: 'massaLinha', pt: 'Fluxo mássico por linha', en: 'Mass flow per row', unidade: 'kg/h' },
                { chave: 'rotacaoDosador', pt: 'Rotação do dosador', en: 'Metering roller speed', unidade: 'RPM' },
                { chave: 'velocidadeSecundaria', pt: 'Velocidade secundária', en: 'Secondary velocity', unidade: 'm/s' },
                { chave: 'perdaTotal', pt: 'Perda de pressão total', en: 'Total pressure loss', unidade: 'Pa' },
                { chave: 'vazaoTotal', pt: 'Vazão total real', en: 'Actual total airflow', unidade: 'm³/min' }
            ];
            function obterSaidasGraficoDist() {
                const saidas = new Map(graficoDistSaidasBase.map((item) => [item.chave, item]));
                Object.entries(catalogoVariaveisFormula || {}).forEach(([chave, item]) => {
                    if (saidas.has(chave)) return;
                    const idioma = item.pt || chave;
                    const unidade = idioma.match(/^\s*(\[[^\]]+\])/u)?.[1]?.slice(1, -1) || '';
                    const nome = idioma.replace(/^\s*\[[^\]]+\]\s*/u, '').split('.')[0] || chave;
                    const nomeIngles = (item.en || chave).replace(/^\s*\[[^\]]+\]\s*/u, '').split('.')[0] || chave;
                    saidas.set(chave, { chave, pt: nome, en: nomeIngles, unidade });
                });
                Object.entries(graficoDescricoesAuto).forEach(([chave, item]) => {
                    if (saidas.has(chave)) return;
                    const unidade = item.descricao.match(/^\s*(\[[^\]]+\])/u)?.[1]?.slice(1, -1) || '';
                    saidas.set(chave, { chave, pt: item.simbolo, en: item.simbolo, unidade });
                });
                return Array.from(saidas.values());
            }
            const graficoDistEstado = {
                entradas: ['in_dist_espessura', 'in_dist_qtd_discos', 'in_dist_area_cavidade'],
                saida: 'rotacaoDosador',
                flutuante: false,
                posicao: null
            };
            const graficoDescricoesAuto = {};

            function obterVariaveisEntradaGraficoDist() {
                const chavesCatalogo = {
                    in_dist_taxa: 'taxaHectare',
                    in_dist_veltrator: 'velocidadeTrator',
                    in_dist_largura: 'larguraLinha',
                    in_dist_espessura: 'espessuraDisco',
                    in_dist_qtd_discos: 'discosAtivos',
                    in_dist_cavidades: 'cavidadesDisco',
                    in_dist_area_cavidade: 'areaCavidade',
                    in_dist_densidade: 'densidadeSolido',
                    in_dist_qtd_primarios: 'numeroPrimarios',
                    in_dist_comprimento_primario: 'comprimentoPrimario',
                    in_dist_densidade_ar: 'densidadeAr',
                    in_dist_fator_atrito: 'fatorAtrito'
                };
                return Array.from(dom.distGrpModo1?.querySelectorAll('input[type="range"]') || []).map((range) => {
                    const grupo = range.closest('.control-group');
                    const label = grupo?.querySelector('label span');
                    const itemCatalogo = catalogoVariaveisFormula[chavesCatalogo[range.id]];
                    const unidade = itemCatalogo?.pt.match(/^\s*(\[[^\]]+\])/u)?.[1]?.slice(1, -1) || '';
                    const nomeBruto = label?.textContent?.trim() || range.id;
                    return {
                        chave: range.id,
                        nome: nomeBruto.replace(/\s*\([^)]*\)\s*$/u, ''),
                        unidade,
                        min: parseFloat(range.min),
                        max: parseFloat(range.max),
                        step: parseFloat(range.step) || 1,
                        valor: parseFloat(range.value)
                    };
                });
            }

            function configurarSeletoresGraficoDist() {
                dom.distGrpModo1?.querySelectorAll('.control-group').forEach((grupo) => {
                    const range = grupo.querySelector('input[type="range"]');
                    const label = grupo.querySelector('label');
                    if (!range || !label || label.querySelector('.graph-input-toggle')) return;

                    const toggle = document.createElement('input');
                    toggle.type = 'checkbox';
                    toggle.id = `graph_input_${range.id}`;
                    toggle.className = 'graph-input-toggle';
                    toggle.dataset.graphInput = range.id;
                    toggle.checked = graficoDistEstado.entradas.includes(range.id);
                    toggle.setAttribute('aria-label', textoIdioma('Usar como entrada do gráfico', 'Use as graph input'));

                    const texto = document.createElement('span');
                    texto.className = 'graph-input-label';
                    texto.textContent = textoIdioma('Entrada do gráfico', 'Graph input');
                    texto.dataset.tooltip = textoIdioma('Seleciona esta variável como uma das entradas da varredura do gráfico.', 'Selects this variable as one of the graph sweep inputs.');
                    const grupoEntrada = document.createElement('span');
                    grupoEntrada.className = 'graph-input-toggle';
                    grupoEntrada.append(toggle, texto);
                    label.appendChild(grupoEntrada);
                });

                dom.sidebarDist?.addEventListener('change', (event) => {
                    if (!event.target.matches('.graph-input-toggle')) return;
                    const entradas = Array.from(dom.sidebarDist.querySelectorAll('.graph-input-toggle:checked')).map((input) => input.dataset.graphInput);
                    if (entradas.length > 3) {
                        event.target.checked = false;
                        return;
                    }
                    graficoDistEstado.entradas = entradas;
                    atualizarGraficoDist();
                });
                dom.mainDist?.addEventListener('click', (event) => {
                    const botao = event.target.closest('[data-graph-output]');
                    if (botao) {
                        graficoDistEstado.saida = graficoDistEstado.saida === botao.dataset.graphOutput ? null : botao.dataset.graphOutput;
                        atualizarDistribuidor();
                        return;
                    }
                    const flutuante = event.target.closest('[data-graph-float]');
                    if (flutuante) {
                        graficoDistEstado.flutuante = !graficoDistEstado.flutuante;
                        if (!graficoDistEstado.flutuante) graficoDistEstado.posicao = null;
                        atualizarGraficoDist();
                    }
                });
                dom.mainDist?.addEventListener('keydown', (event) => {
                    if ((event.key !== 'Enter' && event.key !== ' ') || !event.target.closest('[data-graph-output]')) return;
                    event.preventDefault();
                    event.target.click();
                });
                let arrasteGrafico = null;
                document.addEventListener('pointerdown', (event) => {
                    if (!graficoDistEstado.flutuante || !event.target.closest('.graph-drag-handle')) return;
                    const painel = dom.painelGraficoDist;
                    const rect = painel.getBoundingClientRect();
                    arrasteGrafico = { offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
                    painel.classList.add('graph-dragging');
                });
                document.addEventListener('pointermove', (event) => {
                    if (!arrasteGrafico || !graficoDistEstado.flutuante) return;
                    const painel = dom.painelGraficoDist;
                    const largura = painel.offsetWidth;
                    const altura = painel.offsetHeight;
                    const left = Math.max(8, Math.min(window.innerWidth - largura - 8, event.clientX - arrasteGrafico.offsetX));
                    const top = Math.max(8, Math.min(window.innerHeight - altura - 8, event.clientY - arrasteGrafico.offsetY));
                    painel.style.left = `${left}px`;
                    painel.style.top = `${top}px`;
                    painel.style.right = 'auto';
                    painel.style.bottom = 'auto';
                    graficoDistEstado.posicao = { left, top };
                });
                document.addEventListener('pointerup', () => {
                    if (!arrasteGrafico) return;
                    arrasteGrafico = null;
                    dom.painelGraficoDist.classList.remove('graph-dragging');
                });
            }

            function lerValorDistGrafico(id, substituicoes) {
                const entrada = document.getElementById(id);
                const valor = substituicoes?.[id] ?? entrada?.value;
                return parseFloat(valor);
            }

            function calcularPontoGraficoDist(substituicoes = {}) {
                const nLinhas = parseInt(lerValorDistGrafico('in_dist_linhas', substituicoes)) || 1;
                const nPrimarios = parseInt(lerValorDistGrafico('in_dist_qtd_primarios', substituicoes)) || 1;
                const comprimentoSecundario = lerValorDistGrafico('in_dist_comprimento', substituicoes) || 0;
                const comprimentoPrimario = lerValorDistGrafico('in_dist_comprimento_primario', substituicoes) || 0;
                const taxa = lerValorDistGrafico('in_dist_taxa', substituicoes) || 0;
                const velocidadeTrator = lerValorDistGrafico('in_dist_veltrator', substituicoes) || 0;
                const largura = lerValorDistGrafico('in_dist_largura', substituicoes) || 0;
                const espessura = lerValorDistGrafico('in_dist_espessura', substituicoes) || 1;
                const discos = lerValorDistGrafico('in_dist_qtd_discos', substituicoes) || 1;
                const cavidades = lerValorDistGrafico('in_dist_cavidades', substituicoes) || 1;
                const areaCavidade = lerValorDistGrafico('in_dist_area_cavidade', substituicoes) || 1;
                const densidadeSolido = lerValorDistGrafico('in_dist_densidade', substituicoes) || 1;
                const vazaoTurbina = lerValorDistGrafico('in_dist_vazaoturbina', substituicoes) || 0;
                const diametroSecundario = (lerValorDistGrafico('in_dist_diametro', substituicoes) || 1) / 1000;
                const diametroPrimario = (lerValorDistGrafico('in_dist_diametro_primario_pol', substituicoes) || 1) * 0.0254;
                const densidadeAr = lerValorDistGrafico('in_dist_densidade_ar', substituicoes) || 1;
                const fatorAtrito = lerValorDistGrafico('in_dist_fator_atrito', substituicoes) || 0;
                const pressaoMax = lerValorDistGrafico('in_dist_pressao_turbina', substituicoes) || 1;
                const kTorre = lerValorDistGrafico('in_dist_k_torre', substituicoes) || 0;
                const volumeRolo = espessura * discos * cavidades * areaCavidade;
                const massaLinha = (taxa * velocidadeTrator * largura) / 10;
                const rotacaoDosador = (massaLinha * 1000) / (volumeRolo * densidadeSolido * 60);
                const areaSecundaria = Math.PI * Math.pow(diametroSecundario, 2) / 4;
                const areaPrimaria = Math.PI * Math.pow(diametroPrimario, 2) / 4;
                const parametrosRede = {
                    vazaoTotalNominalM3Min: vazaoTurbina,
                    quantidadePrimarios: Math.max(nPrimarios, 1),
                    quantidadeLinhas: Math.max(nLinhas, 1),
                    comprimentoPrimarioM: comprimentoPrimario,
                    comprimentoSecundarioM: comprimentoSecundario,
                    diametroPrimarioM: diametroPrimario,
                    diametroSecundarioM: diametroSecundario,
                    areaPrimaria,
                    areaSecundaria,
                    densidadeAr,
                    fatorAtrito,
                    pressaoMaxPa: pressaoMax,
                    kTorre,
                    massaSolidoPrimarioKgh: massaLinha * nLinhas / Math.max(nPrimarios, 1),
                    massaSolidoSecundarioKgh: massaLinha
                };
                const rede = simularRedePneumatica(parametrosRede);
                return {
                    volumeRolo,
                    massaLinha,
                    massaTotal: massaLinha * nLinhas,
                    rotacaoDosador,
                    potenciaUtilMax: (lerValorDistGrafico('in_dist_tensao', substituicoes) || 0) * (lerValorDistGrafico('in_dist_corrente', substituicoes) || 0) * ((lerValorDistGrafico('in_dist_eficiencia_motor', substituicoes) || 0) / 100),
                    potenciaRequerida: ((massaLinha * (1000 / 3600)) * (lerValorDistGrafico('in_dist_energia_dosador', substituicoes) || 0)) / EFICIENCIA_REDUTOR,
                    velocidadeSecundaria: rede.velocidadeSecundaria,
                    perdaTotal: rede.deltaPTotal,
                    vazaoTotal: rede.vazaoTotalReal,
                    espessuraDisco: espessura,
                    discosAtivos: discos,
                    cavidadesDisco: cavidades,
                    areaCavidade,
                    densidadeSolido,
                    taxaHectare: taxa,
                    velocidadeTrator,
                    larguraLinha: largura,
                    numeroLinhas: nLinhas,
                    numeroPrimarios: nPrimarios,
                    comprimentoPrimario,
                    diametroPrimario,
                    densidadeAr,
                    fatorAtrito,
                    comprimentoSecundario,
                    diametroSecundario,
                    kTorre,
                    vazaoPrimaria: rede.vazaoPrimariaReal,
                    areaPrimaria,
                    velocidadePrimaria: rede.velocidadePrimaria,
                    slrPrimario: rede.slrPrimario,
                    massaSolidoPrimario: massaLinha * nLinhas / Math.max(nPrimarios, 1),
                    massaArPrimario: rede.massaArPrimariaKgh,
                    perdaPrimaria: rede.deltaPPrimario,
                    perdaTorre: rede.deltaPTorre,
                    areaSecundaria,
                    vazaoSecundaria: rede.vazaoSecundariaReal,
                    slrSecundario: rede.slrSecundario,
                    massaArSecundario: rede.massaArSecundariaKgh,
                    perdaSecundaria: rede.deltaPSecundario,
                    fatorAcoplamento: rede.fatorVazao,
                    vazaoTurbina,
                    pressaoMaxima: pressaoMax
                };
            }

            function formatarValorGrafico(valor) {
                if (!Number.isFinite(valor)) return '—';
                if (Math.abs(valor) >= 1000 || Math.abs(valor) < 0.01) return valor.toExponential(2);
                return valor.toFixed(2);
            }

            function corSerieGraficoDist(indice) {
                return `hsl(${(indice * 47) % 360} 78% 62%)`;
            }

            function desenharGraficoDist(series, variavelX, saida) {
                const canvas = document.getElementById('grafico_dist_canvas');
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                const largura = canvas.width = Math.max(720, canvas.clientWidth * 2 || 900);
                const altura = canvas.height = 680;
                const margem = { esquerda: 92, direita: 30, topo: 28, baixo: 78 };
                const todos = series.flatMap((serie) => serie.pontos).filter((ponto) => Number.isFinite(ponto.y));
                if (!todos.length) return;
                const xMin = variavelX.min;
                const xMax = variavelX.max;
                const yMinBruto = Math.min(...todos.map((ponto) => ponto.y));
                const yMaxBruto = Math.max(...todos.map((ponto) => ponto.y));
                const margemY = (yMaxBruto - yMinBruto || Math.abs(yMaxBruto) * 0.1 || 1) * 0.12;
                const yMin = yMinBruto - margemY;
                const yMax = yMaxBruto + margemY;
                const px = (valor) => margem.esquerda + ((valor - xMin) / (xMax - xMin || 1)) * (largura - margem.esquerda - margem.direita);
                const py = (valor) => altura - margem.baixo - ((valor - yMin) / (yMax - yMin || 1)) * (altura - margem.topo - margem.baixo);
                const estilos = getComputedStyle(document.body);
                ctx.clearRect(0, 0, largura, altura);
                ctx.fillStyle = estilos.getPropertyValue('--bg-card').trim() || '#161b22';
                ctx.fillRect(0, 0, largura, altura);
                ctx.strokeStyle = estilos.getPropertyValue('--border').trim() || '#30363d';
                ctx.fillStyle = estilos.getPropertyValue('--text-muted').trim() || '#8b949e';
                ctx.font = '24px Segoe UI';
                for (let i = 0; i <= 5; i++) {
                    const y = margem.topo + i * (altura - margem.topo - margem.baixo) / 5;
                    ctx.beginPath(); ctx.moveTo(margem.esquerda, y); ctx.lineTo(largura - margem.direita, y); ctx.stroke();
                    const valor = yMax - i * (yMax - yMin) / 5;
                    ctx.fillText(formatarValorGrafico(valor), 12, y + 8);
                }
                ctx.strokeStyle = estilos.getPropertyValue('--text-muted').trim() || '#8b949e';
                ctx.beginPath(); ctx.moveTo(margem.esquerda, margem.topo); ctx.lineTo(margem.esquerda, altura - margem.baixo); ctx.lineTo(largura - margem.direita, altura - margem.baixo); ctx.stroke();
                series.forEach((serie, indice) => {
                    ctx.strokeStyle = corSerieGraficoDist(indice);
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    serie.pontos.forEach((ponto, pontoIndice) => {
                        const x = px(ponto.x); const y = py(ponto.y);
                        if (!pontoIndice) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                    });
                    ctx.stroke();
                });
                ctx.fillStyle = estilos.getPropertyValue('--text-main').trim() || '#c9d1d9';
                ctx.textAlign = 'center'; ctx.fillText(`${variavelX.nome} (${variavelX.unidade || ''})`, largura / 2, altura - 22);
                ctx.save(); ctx.translate(24, altura / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(`${saida.nome} (${saida.unidade})`, 0, 0); ctx.restore();
                ctx.textAlign = 'left';
            }

            function desenharSuperficieGraficoDist(superficie, variavelX, variavelY, saida) {
                const canvas = document.getElementById('grafico_dist_canvas');
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                const largura = canvas.width = Math.max(720, canvas.clientWidth * 2 || 900);
                const altura = canvas.height = 680;
                const estilos = getComputedStyle(document.body);
                const fundo = estilos.getPropertyValue('--bg-card').trim() || '#161b22';
                const texto = estilos.getPropertyValue('--text-main').trim() || '#c9d1d9';
                const apagado = estilos.getPropertyValue('--text-muted').trim() || '#8b949e';
                const grade = estilos.getPropertyValue('--border').trim() || '#30363d';
                const todos = superficie.flatMap((linha) => linha).filter((ponto) => Number.isFinite(ponto.z));
                if (!todos.length) return;
                const zMin = Math.min(...todos.map((ponto) => ponto.z));
                const zMax = Math.max(...todos.map((ponto) => ponto.z));
                const escalaZ = zMax - zMin || Math.abs(zMax) * 0.1 || 1;
                const origem = { x: 210, y: 535 };
                const vetorX = { x: 450, y: 0 };
                const vetorY = { x: 150, y: -125 };
                const vetorZ = { x: 0, y: -280 };
                const projetar = (ponto) => {
                    const x = (ponto.x - variavelX.min) / (variavelX.max - variavelX.min || 1);
                    const y = (ponto.y - variavelY.min) / (variavelY.max - variavelY.min || 1);
                    const z = (ponto.z - zMin) / escalaZ;
                    return {
                        x: origem.x + x * vetorX.x + y * vetorY.x + z * vetorZ.x,
                        y: origem.y + x * vetorX.y + y * vetorY.y + z * vetorZ.y
                    };
                };
                const corSuperficie = (valor) => {
                    const proporcao = Math.max(0, Math.min(1, (valor - zMin) / escalaZ));
                    return `hsl(${220 - proporcao * 185} 78% ${38 + proporcao * 20}%)`;
                };
                const desenharEixo = (inicio, fim) => {
                    const angulo = Math.atan2(fim.y - inicio.y, fim.x - inicio.x);
                    const tamanho = 14;
                    ctx.beginPath();
                    ctx.moveTo(fim.x, fim.y);
                    ctx.lineTo(fim.x - tamanho * Math.cos(angulo - Math.PI / 6), fim.y - tamanho * Math.sin(angulo - Math.PI / 6));
                    ctx.moveTo(fim.x, fim.y);
                    ctx.lineTo(fim.x - tamanho * Math.cos(angulo + Math.PI / 6), fim.y - tamanho * Math.sin(angulo + Math.PI / 6));
                    ctx.stroke();
                };

                ctx.clearRect(0, 0, largura, altura);
                ctx.fillStyle = fundo;
                ctx.fillRect(0, 0, largura, altura);
                ctx.lineJoin = 'round';
                for (let linha = superficie.length - 2; linha >= 0; linha -= 1) {
                    for (let coluna = 0; coluna < superficie[linha].length - 1; coluna += 1) {
                        const pontos = [
                            superficie[linha][coluna],
                            superficie[linha][coluna + 1],
                            superficie[linha + 1][coluna + 1],
                            superficie[linha + 1][coluna]
                        ];
                        if (pontos.some((ponto) => !Number.isFinite(ponto.z))) continue;
                        const projetados = pontos.map(projetar);
                        ctx.beginPath();
                        ctx.moveTo(projetados[0].x, projetados[0].y);
                        projetados.slice(1).forEach((ponto) => ctx.lineTo(ponto.x, ponto.y));
                        ctx.closePath();
                        ctx.fillStyle = corSuperficie(pontos.reduce((soma, ponto) => soma + ponto.z, 0) / pontos.length);
                        ctx.fill();
                        ctx.strokeStyle = 'rgba(255,255,255,0.20)';
                        ctx.lineWidth = 1.5;
                        ctx.stroke();
                    }
                }

                const fimX = { x: origem.x + vetorX.x, y: origem.y + vetorX.y };
                const fimY = { x: origem.x + vetorY.x, y: origem.y + vetorY.y };
                const fimZ = { x: origem.x + vetorZ.x, y: origem.y + vetorZ.y };
                ctx.save();
                ctx.strokeStyle = grade;
                ctx.lineWidth = 1.5;
                ctx.setLineDash([5, 7]);
                for (let indice = 1; indice < 6; indice += 1) {
                    const fracao = indice / 6;
                    const inicioX = { x: origem.x + vetorX.x * fracao, y: origem.y + vetorX.y * fracao };
                    const inicioY = { x: origem.x + vetorY.x * fracao, y: origem.y + vetorY.y * fracao };
                    ctx.beginPath(); ctx.moveTo(inicioX.x, inicioX.y); ctx.lineTo(inicioX.x + vetorY.x, inicioX.y + vetorY.y); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(inicioY.x, inicioY.y); ctx.lineTo(inicioY.x + vetorX.x, inicioY.y + vetorX.y); ctx.stroke();
                }
                ctx.restore();
                ctx.strokeStyle = texto;
                ctx.fillStyle = texto;
                ctx.lineWidth = 4;
                [[origem, fimX], [origem, fimY], [origem, fimZ]].forEach(([inicio, fim]) => {
                    ctx.beginPath(); ctx.moveTo(inicio.x, inicio.y); ctx.lineTo(fim.x, fim.y); ctx.stroke();
                    desenharEixo(inicio, fim);
                });
                ctx.save();
                ctx.setLineDash([8, 8]);
                ctx.strokeStyle = 'rgba(255,255,255,0.28)';
                ctx.lineWidth = 2;
                for (let indice = 1; indice < 5; indice += 1) {
                    const fracao = indice / 5;
                    const inicioGrade = { x: origem.x + vetorY.x * fracao, y: origem.y + vetorY.y * fracao };
                    const fimGrade = { x: fimX.x + vetorY.x * fracao, y: fimX.y + vetorY.y * fracao };
                    ctx.beginPath(); ctx.moveTo(inicioGrade.x, inicioGrade.y); ctx.lineTo(fimGrade.x, fimGrade.y); ctx.stroke();
                }
                ctx.restore();
                ctx.font = '22px Segoe UI';
                ctx.textAlign = 'center';
                ctx.fillText(`${variavelX.nome} (${variavelX.unidade || ''})`, fimX.x - 20, fimX.y + 34);
                ctx.fillText(`${textoIdioma('Profundidade', 'Depth')}: ${variavelY.nome} (${variavelY.unidade || ''})`, fimY.x - 62, fimY.y - 18);
                ctx.save();
                ctx.translate(fimZ.x - 24, fimZ.y);
                ctx.rotate(-Math.PI / 2);
                ctx.fillText(`${saida.nome} (${saida.unidade || ''})`, 0, 0);
                ctx.restore();
                ctx.textAlign = 'left';
                ctx.font = '20px Segoe UI';
                ctx.fillStyle = apagado;
                ctx.fillText(formatarValorGrafico(variavelX.min), origem.x - 12, origem.y + 28);
                ctx.fillText(formatarValorGrafico(variavelY.min), origem.x - 46, origem.y + 8);
                ctx.fillText(formatarValorGrafico(zMin), fimZ.x - 54, fimZ.y + 8);
                ctx.textAlign = 'right';
                ctx.fillText(formatarValorGrafico(variavelX.max), fimX.x + 8, fimX.y + 28);
                ctx.fillText(formatarValorGrafico(variavelY.max), fimY.x - 8, fimY.y - 8);
                ctx.fillText(formatarValorGrafico(zMax), fimZ.x - 54, fimZ.y - 8);
                const barraX = largura - 74;
                const barraTopo = 92;
                const barraAltura = 300;
                const gradiente = ctx.createLinearGradient(0, barraTopo + barraAltura, 0, barraTopo);
                gradiente.addColorStop(0, 'hsl(220 78% 38%)');
                gradiente.addColorStop(0.5, 'hsl(125 78% 48%)');
                gradiente.addColorStop(1, 'hsl(35 78% 58%)');
                ctx.fillStyle = gradiente;
                ctx.fillRect(barraX, barraTopo, 22, barraAltura);
                ctx.strokeStyle = grade;
                ctx.strokeRect(barraX, barraTopo, 22, barraAltura);
                ctx.fillStyle = apagado;
                ctx.textAlign = 'left';
                ctx.fillText(formatarValorGrafico(zMax), barraX + 30, barraTopo + 8);
                ctx.fillText(formatarValorGrafico(zMin), barraX + 30, barraTopo + barraAltura);
                ctx.save();
                ctx.translate(barraX + 62, barraTopo + barraAltura / 2);
                ctx.rotate(-Math.PI / 2);
                ctx.textAlign = 'center';
                ctx.fillText(textoIdioma('Magnitude da saída', 'Output magnitude'), 0, 0);
                ctx.restore();
                ctx.textAlign = 'left';
            }

            function desenharMapa3DGraficoDist(pontos, variaveis, saida, pontoAtual) {
                const canvas = document.getElementById('grafico_dist_canvas');
                if (!canvas || !pontos.length) return;
                const ctx = canvas.getContext('2d');
                const largura = canvas.width = Math.max(860, canvas.clientWidth * 2 || 1000);
                const altura = canvas.height = 700;
                const estilos = getComputedStyle(document.body);
                const fundo = estilos.getPropertyValue('--bg-card').trim() || '#161b22';
                const texto = estilos.getPropertyValue('--text-main').trim() || '#c9d1d9';
                const apagado = estilos.getPropertyValue('--text-muted').trim() || '#8b949e';
                const grade = estilos.getPropertyValue('--border').trim() || '#30363d';
                const zSaidaMin = Math.min(...pontos.map((ponto) => ponto.saida));
                const zSaidaMax = Math.max(...pontos.map((ponto) => ponto.saida));
                const escalaSaida = zSaidaMax - zSaidaMin || Math.abs(zSaidaMax) * 0.1 || 1;
                const valoresSaidaOrdenados = pontos.map((ponto) => ponto.saida).sort((a, b) => a - b);
                const origem = { x: 205, y: 545 };
                const vetores = [
                    { x: 430, y: 0 },
                    { x: 150, y: -125 },
                    { x: 0, y: -300 }
                ];
                const projetar = (ponto) => ({
                    x: origem.x + ponto.coordenadas[0] * vetores[0].x + ponto.coordenadas[1] * vetores[1].x + ponto.coordenadas[2] * vetores[2].x,
                    y: origem.y + ponto.coordenadas[0] * vetores[0].y + ponto.coordenadas[1] * vetores[1].y + ponto.coordenadas[2] * vetores[2].y
                });
                const corSaida = (valor) => {
                    const quantidadeAbaixo = valoresSaidaOrdenados.filter((item) => item <= valor).length - 1;
                    const proporcao = valoresSaidaOrdenados.length > 1
                        ? quantidadeAbaixo / (valoresSaidaOrdenados.length - 1)
                        : 0.5;
                    const cores = ['#1746d1', '#00a9d9', '#19c957', '#f2cf25', '#e6332a'];
                    return cores[Math.min(cores.length - 1, Math.floor(proporcao * cores.length))];
                };
                const desenharEixo = (fim) => {
                    const angulo = Math.atan2(fim.y - origem.y, fim.x - origem.x);
                    const tamanho = 16;
                    ctx.beginPath();
                    ctx.moveTo(fim.x, fim.y);
                    ctx.lineTo(fim.x - tamanho * Math.cos(angulo - Math.PI / 6), fim.y - tamanho * Math.sin(angulo - Math.PI / 6));
                    ctx.moveTo(fim.x, fim.y);
                    ctx.lineTo(fim.x - tamanho * Math.cos(angulo + Math.PI / 6), fim.y - tamanho * Math.sin(angulo + Math.PI / 6));
                    ctx.stroke();
                };
                ctx.clearRect(0, 0, largura, altura);
                ctx.fillStyle = fundo;
                ctx.fillRect(0, 0, largura, altura);
                ctx.save();
                ctx.strokeStyle = grade;
                ctx.lineWidth = 1.5;
                ctx.setLineDash([6, 8]);
                for (let indice = 1; indice < 6; indice += 1) {
                    const fracao = indice / 6;
                    const baseX = { x: origem.x + vetores[0].x * fracao, y: origem.y };
                    const baseY = { x: origem.x + vetores[1].x * fracao, y: origem.y + vetores[1].y * fracao };
                    ctx.beginPath(); ctx.moveTo(baseX.x, baseX.y); ctx.lineTo(baseX.x + vetores[1].x, baseX.y + vetores[1].y); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(baseY.x, baseY.y); ctx.lineTo(baseY.x + vetores[0].x, baseY.y + vetores[0].y); ctx.stroke();
                }
                ctx.restore();
                pontos.slice().sort((a, b) => (a.coordenadas[1] + a.coordenadas[2]) - (b.coordenadas[1] + b.coordenadas[2])).forEach((ponto) => {
                    const posicao = projetar(ponto);
                    const raio = 4 + 3 * ponto.coordenadas[2];
                    ctx.beginPath();
                    ctx.arc(posicao.x, posicao.y, raio, 0, Math.PI * 2);
                    ctx.fillStyle = corSaida(ponto.saida);
                    ctx.globalAlpha = 0.86;
                    ctx.fill();
                    ctx.globalAlpha = 1;
                });
                if (pontoAtual && Number.isFinite(pontoAtual.saida)) {
                    const posicaoAtual = projetar(pontoAtual);
                    ctx.beginPath();
                    ctx.arc(posicaoAtual.x, posicaoAtual.y, 11, 0, Math.PI * 2);
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 4;
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(posicaoAtual.x, posicaoAtual.y, 5, 0, Math.PI * 2);
                    ctx.fillStyle = corSaida(pontoAtual.saida);
                    ctx.fill();
                }
                const fins = vetores.map((vetor) => ({ x: origem.x + vetor.x, y: origem.y + vetor.y }));
                ctx.strokeStyle = texto;
                ctx.lineWidth = 4;
                fins.forEach((fim) => {
                    ctx.beginPath(); ctx.moveTo(origem.x, origem.y); ctx.lineTo(fim.x, fim.y); ctx.stroke();
                    desenharEixo(fim);
                });
                ctx.fillStyle = texto;
                ctx.font = '22px Segoe UI';
                ctx.textAlign = 'center';
                ctx.fillText(`${variaveis[0].nome} (${variaveis[0].unidade || ''})`, fins[0].x - 8, fins[0].y + 38);
                ctx.fillText(`${variaveis[1].nome} (${variaveis[1].unidade || ''})`, fins[1].x - 70, fins[1].y - 18);
                ctx.save();
                ctx.translate(fins[2].x - 28, fins[2].y - 12);
                ctx.rotate(-Math.PI / 2);
                ctx.fillText(`${variaveis[2].nome} (${variaveis[2].unidade || ''})`, 0, 0);
                ctx.restore();
                const barraX = largura - 82;
                const barraTopo = 92;
                const barraAltura = 330;
                const gradiente = ctx.createLinearGradient(0, barraTopo + barraAltura, 0, barraTopo);
                gradiente.addColorStop(0, 'hsl(220 82% 40%)');
                gradiente.addColorStop(0.5, 'hsl(125 82% 48%)');
                gradiente.addColorStop(1, 'hsl(35 82% 58%)');
                ctx.fillStyle = gradiente;
                ctx.fillRect(barraX, barraTopo, 24, barraAltura);
                ctx.strokeStyle = grade;
                ctx.strokeRect(barraX, barraTopo, 24, barraAltura);
                ctx.fillStyle = apagado;
                ctx.textAlign = 'left';
                ctx.font = '20px Segoe UI';
                ctx.fillText(formatarValorGrafico(zSaidaMax), barraX + 32, barraTopo + 8);
                ctx.fillText(formatarValorGrafico(zSaidaMin), barraX + 32, barraTopo + barraAltura);
                ctx.save();
                ctx.translate(barraX + 68, barraTopo + barraAltura / 2);
                ctx.rotate(-Math.PI / 2);
                ctx.textAlign = 'center';
                ctx.fillText(textoIdioma('Saída: ', 'Output: ') + saida.nome, 0, 0);
                ctx.restore();
                ctx.textAlign = 'left';
            }

            function configurarPlotly3D(elemento, dados, layout) {
                if (!window.Plotly || !elemento) return false;
                window.Plotly.react(elemento, dados, layout, { responsive: true, displaylogo: false, modeBarButtonsToRemove: ['toImage'] });
                return true;
            }

            function obterEscalaCromaticaPlotly(valores) {
                const ordenados = valores.filter(Number.isFinite).sort((a, b) => a - b);
                if (!ordenados.length) return { cmin: 0, cmax: 1, colorscale: 'Jet' };
                const percentil = (fracao) => ordenados[Math.round((ordenados.length - 1) * fracao)];
                const minimo = percentil(0.05);
                const maximo = percentil(0.95);
                return {
                    cmin: minimo,
                    cmax: maximo > minimo ? maximo : Math.max(...ordenados),
                    colorscale: [
                        [0, '#1236b5'],
                        [0.25, '#00a8e8'],
                        [0.5, '#18c95b'],
                        [0.75, '#f4d225'],
                        [1, '#e3312b']
                    ]
                };
            }

            function desenharPlotlyMapa3DDist(pontos, variaveis, saida, pontoAtual) {
                const elemento = document.getElementById('grafico_dist_plotly');
                if (!elemento) return;
                const valores = pontos.map((ponto) => ponto.saida);
                const escalaCores = obterEscalaCromaticaPlotly(valores);
                const x = pontos.map((ponto) => variaveis[0].min + ponto.coordenadas[0] * (variaveis[0].max - variaveis[0].min));
                const y = pontos.map((ponto) => variaveis[1].min + ponto.coordenadas[1] * (variaveis[1].max - variaveis[1].min));
                const z = pontos.map((ponto) => variaveis[2].min + ponto.coordenadas[2] * (variaveis[2].max - variaveis[2].min));
                const dados = [{
                    type: 'scatter3d', mode: 'markers', x, y, z,
                    marker: { size: 4, color: valores, ...escalaCores, opacity: 0.88, colorbar: { x: 1.03, len: 0.72, title: { text: `${textoIdioma('Saída', 'Output')}: ${saida.nome}`, side: 'right' } } },
                    hovertemplate: `${variaveis[0].nome}: %{x}<br>${variaveis[1].nome}: %{y}<br>${variaveis[2].nome}: %{z}<br>${saida.nome}: %{marker.color}<extra></extra>`
                }];
                if (pontoAtual && Number.isFinite(pontoAtual.saida)) {
                    dados.push({
                        type: 'scatter3d', mode: 'markers', name: textoIdioma('Ponto atual', 'Current point'),
                        x: [variaveis[0].valor], y: [variaveis[1].valor], z: [variaveis[2].valor],
                        marker: { size: 7, color: '#ffffff', line: { color: '#111827', width: 3 } }, showlegend: false,
                        hovertemplate: `${textoIdioma('Ponto atual', 'Current point')}<br>${saida.nome}: ${formatarValorGrafico(pontoAtual.saida)}<extra></extra>`
                    });
                }
                const estilos = getComputedStyle(document.body);
                const fundo = estilos.getPropertyValue('--bg-card').trim() || '#161b22';
                const texto = estilos.getPropertyValue('--text-main').trim() || '#c9d1d9';
                configurarPlotly3D(elemento, dados, {
                    paper_bgcolor: fundo, plot_bgcolor: fundo, font: { color: texto }, showlegend: false, margin: { l: 18, r: 86, t: 24, b: 18 },
                    scene: {
                        aspectmode: 'cube', dragmode: 'orbit',
                        xaxis: { title: `${variaveis[0].nome} (${variaveis[0].unidade || ''})` },
                        yaxis: { title: `${variaveis[1].nome} (${variaveis[1].unidade || ''})` },
                        zaxis: { title: `${variaveis[2].nome} (${variaveis[2].unidade || ''})` },
                        camera: { eye: { x: 1.5, y: 1.5, z: 1.25 } }
                    }
                });
            }

            function desenharPlotlySuperficieDist(superficie, variavelX, variavelY, saida) {
                const elemento = document.getElementById('grafico_dist_plotly');
                if (!elemento) return;
                const x = superficie[0].map((ponto) => ponto.x);
                const y = superficie.map((linha) => linha[0].y);
                const z = superficie.map((linha) => linha.map((ponto) => ponto.z));
                const valores = z.flat();
                const escalaCores = obterEscalaCromaticaPlotly(valores);
                const estilos = getComputedStyle(document.body);
                const fundo = estilos.getPropertyValue('--bg-card').trim() || '#161b22';
                const texto = estilos.getPropertyValue('--text-main').trim() || '#c9d1d9';
                configurarPlotly3D(elemento, [{
                    type: 'surface', x, y, z, ...escalaCores, showscale: true,
                    colorbar: { x: 1.03, len: 0.72, title: { text: `${textoIdioma('Saída', 'Output')}: ${saida.nome}`, side: 'right' } }, contours: { z: { show: true, usecolormap: true, project: { z: true } } },
                    hovertemplate: `${variavelX.nome}: %{x}<br>${variavelY.nome}: %{y}<br>${saida.nome}: %{z}<extra></extra>`
                }], {
                    paper_bgcolor: fundo, plot_bgcolor: fundo, font: { color: texto }, showlegend: false, margin: { l: 18, r: 86, t: 24, b: 18 },
                    scene: {
                        aspectmode: 'cube', dragmode: 'orbit',
                        xaxis: { title: `${variavelX.nome} (${variavelX.unidade || ''})` },
                        yaxis: { title: `${variavelY.nome} (${variavelY.unidade || ''})` },
                        zaxis: { title: `${saida.nome} (${saida.unidade || ''})` },
                        camera: { eye: { x: 1.5, y: 1.5, z: 1.25 } }
                    }
                });
            }

            function atualizarGraficoDist() {
                const modo = document.querySelector('input[name="modo_dist"]:checked')?.value;
                if (!dom.painelGraficoDist) return;
                if (modo !== '1') { dom.painelGraficoDist.classList.add('hidden'); return; }
                dom.painelGraficoDist.classList.remove('hidden');
                const entradas = obterVariaveisEntradaGraficoDist().filter((item) => graficoDistEstado.entradas.includes(item.chave));
                const saidasDisponiveis = obterSaidasGraficoDist();
                const saida = saidasDisponiveis.find((item) => item.chave === graficoDistEstado.saida);
                const saidaNome = saida ? textoIdioma(saida.pt, saida.en) : textoIdioma('Nenhuma saída selecionada', 'No output selected');
                dom.painelGraficoDist.innerHTML = `<div class="graph-panel-header"><div class="graph-drag-handle"><h2>${entradas.length >= 2 ? textoIdioma('Mapa 3D de sensibilidade', '3D sensitivity map') : textoIdioma('Gráfico de sensibilidade', 'Sensitivity graph')}</h2><p>${textoIdioma('As entradas selecionadas variam dentro dos limites atuais dos sliders; as demais variáveis permanecem nos valores atuais.', 'Selected inputs sweep across the current slider limits; all other variables remain at their current values.')}</p></div><button type="button" class="graph-float-btn" data-graph-float aria-pressed="${graficoDistEstado.flutuante}">${graficoDistEstado.flutuante ? textoIdioma('Fixar no fluxo', 'Return to flow') : textoIdioma('Tornar flutuante', 'Make floating')}</button></div>${entradas.length ? `<div class="graph-selection-summary"><strong>${textoIdioma('Entradas', 'Inputs')}:</strong> ${entradas.map((item) => `${item.nome} (${item.unidade}) = ${formatarValorGrafico(item.valor)}`).join(' · ')}<br><strong>${textoIdioma('Saída', 'Output')}:</strong> ${saidaNome} (${saida?.unidade || ''})</div>${entradas.length >= 2 ? `<div id="grafico_dist_plotly" aria-label="${textoIdioma('Mapa tridimensional de sensibilidade do distribuidor', 'Distributor three-dimensional sensitivity map')}"></div>` : `<canvas id="grafico_dist_canvas" aria-label="${textoIdioma('Gráfico de sensibilidade do distribuidor', 'Distributor sensitivity graph')}"></canvas>`}<div id="grafico_dist_legenda" class="graph-legend" aria-label="${textoIdioma('Legenda da magnitude da saída', 'Output magnitude legend')}"></div>` : `<div class="graph-empty">${textoIdioma('Selecione pelo menos uma entrada na sidebar para gerar o gráfico.', 'Select at least one sidebar input to generate the graph.')}</div>`}`;
                dom.painelGraficoDist.classList.toggle('graph-floating', graficoDistEstado.flutuante);
                if (graficoDistEstado.flutuante && graficoDistEstado.posicao) {
                    dom.painelGraficoDist.style.left = `${graficoDistEstado.posicao.left}px`;
                    dom.painelGraficoDist.style.top = `${graficoDistEstado.posicao.top}px`;
                    dom.painelGraficoDist.style.right = 'auto';
                    dom.painelGraficoDist.style.bottom = 'auto';
                } else {
                    dom.painelGraficoDist.style.left = '';
                    dom.painelGraficoDist.style.top = '';
                    dom.painelGraficoDist.style.right = '';
                    dom.painelGraficoDist.style.bottom = '';
                }
                if (!entradas.length) return;
                if (!saida) {
                    const canvas = document.getElementById('grafico_dist_canvas');
                    if (canvas) {
                        const aviso = document.createElement('div');
                        aviso.className = 'graph-empty';
                        aviso.textContent = textoIdioma('Clique em uma variável calculada dentro do memorial para definir a saída do gráfico.', 'Click a calculated variable inside the memorial to define the graph output.');
                        canvas.replaceWith(aviso);
                    }
                    return;
                }
                const x = entradas[0];
                if (entradas.length === 3) {
                    const pontos = [];
                    const amostras = 9;
                    for (let indiceX = 0; indiceX < amostras; indiceX += 1) {
                        const valorX = x.min + (x.max - x.min) * indiceX / (amostras - 1);
                        for (let indiceY = 0; indiceY < amostras; indiceY += 1) {
                            const valorY = entradas[1].min + (entradas[1].max - entradas[1].min) * indiceY / (amostras - 1);
                            for (let indiceZ = 0; indiceZ < amostras; indiceZ += 1) {
                                const valorZ = entradas[2].min + (entradas[2].max - entradas[2].min) * indiceZ / (amostras - 1);
                                const resultado = calcularPontoGraficoDist({ [x.chave]: valorX, [entradas[1].chave]: valorY, [entradas[2].chave]: valorZ });
                                if (Number.isFinite(resultado[saida.chave])) {
                                    pontos.push({ coordenadas: [indiceX / (amostras - 1), indiceY / (amostras - 1), indiceZ / (amostras - 1)], saida: resultado[saida.chave] });
                                }
                            }
                        }
                    }
                    if (!pontos.length) {
                        const canvas = document.getElementById('grafico_dist_canvas');
                        if (canvas) {
                            const aviso = document.createElement('div');
                            aviso.className = 'graph-empty';
                            aviso.textContent = textoIdioma('Esta variável é elegível, mas ainda não possui resultado numérico calculável neste modo.', 'This variable is eligible, but it does not yet have a numeric result calculable in this mode.');
                            canvas.replaceWith(aviso);
                        }
                        return;
                    }
                    const valoresAtuais = entradas.map((item) => parseFloat(item.valor));
                    const pontoAtualResultado = calcularPontoGraficoDist({});
                    const pontoAtual = {
                        coordenadas: entradas.map((item, indice) => {
                            const valor = valoresAtuais[indice];
                            return (valor - item.min) / (item.max - item.min || 1);
                        }),
                        saida: pontoAtualResultado[saida.chave]
                    };
                    const legenda = document.getElementById('grafico_dist_legenda');
                    if (legenda) legenda.innerHTML = `<span class="graph-legend-item"><i class="graph-surface-gradient"></i>${textoIdioma('Cor: ordem relativa do valor da saída (menor para maior)', 'Color: relative output value rank (low to high)')}</span><span class="graph-legend-item"><i class="graph-current-point"></i>${textoIdioma('Ponto atual do simulador', 'Current simulator point')}</span>`;
                    desenharPlotlyMapa3DDist(pontos, entradas, { ...saida, nome: saidaNome }, pontoAtual);
                    return;
                }
                if (entradas.length === 2) {
                    const y = entradas[1];
                    const linhas = 21;
                    const colunas = 21;
                    const superficie = Array.from({ length: linhas }, (_, indiceY) => {
                        const valorY = y.min + (y.max - y.min) * indiceY / (linhas - 1);
                        return Array.from({ length: colunas }, (_, indiceX) => {
                            const valorX = x.min + (x.max - x.min) * indiceX / (colunas - 1);
                            const ponto = calcularPontoGraficoDist({ [x.chave]: valorX, [y.chave]: valorY });
                            return { x: valorX, y: valorY, z: ponto[saida.chave] };
                        });
                    });
                    const todosPontos = superficie.flatMap((linha) => linha);
                    if (!todosPontos.some((ponto) => Number.isFinite(ponto.z))) {
                        const canvas = document.getElementById('grafico_dist_canvas');
                        if (canvas) {
                            const aviso = document.createElement('div');
                            aviso.className = 'graph-empty';
                            aviso.textContent = textoIdioma('Esta variável é elegível, mas ainda não possui resultado numérico calculável neste modo.', 'This variable is eligible, but it does not yet have a numeric result calculable in this mode.');
                            canvas.replaceWith(aviso);
                        }
                        return;
                    }
                    const legenda = document.getElementById('grafico_dist_legenda');
                    if (legenda) legenda.innerHTML = `<span class="graph-legend-item"><i class="graph-surface-gradient"></i>${textoIdioma('Superfície: cor representa a magnitude da saída', 'Surface: color represents output magnitude')}</span>`;
                    desenharPlotlySuperficieDist(superficie, x, y, { ...saida, nome: saidaNome });
                    return;
                }
                const pontosX = Array.from({ length: 41 }, (_, indice) => x.min + (x.max - x.min) * indice / 40);
                const valoresSeries = entradas.slice(1).map((item) => ({ item, valores: [item.min + (item.max - item.min) * 0.25, item.min + (item.max - item.min) * 0.5, item.min + (item.max - item.min) * 0.75] }));
                const combinacoes = valoresSeries.length ? valoresSeries.reduce((acumulado, serie) => acumulado.flatMap((base) => serie.valores.map((valor) => [...base, { item: serie.item, valor }])), [[]]) : [[]];
                const series = combinacoes.map((combinacao, indice) => ({ label: combinacao.map((item) => `${item.item.nome}: ${formatarValorGrafico(item.valor)}`).join(' · ') || textoIdioma('Valor atual', 'Current value'), pontos: pontosX.map((valorX) => { const substituicoes = { [x.chave]: valorX }; combinacao.forEach((item) => { substituicoes[item.item.chave] = item.valor; }); return { x: valorX, y: calcularPontoGraficoDist(substituicoes)[saida.chave] }; }) }));
                if (!series.some((serie) => serie.pontos.some((ponto) => Number.isFinite(ponto.y)))) {
                    const canvas = document.getElementById('grafico_dist_canvas');
                    if (canvas) {
                        const aviso = document.createElement('div');
                        aviso.className = 'graph-empty';
                        aviso.textContent = textoIdioma('Esta variável é elegível, mas ainda não possui resultado numérico calculável neste modo.', 'This variable is eligible, but it does not yet have a numeric result calculable in this mode.');
                        canvas.replaceWith(aviso);
                    }
                    return;
                }
                const legenda = document.getElementById('grafico_dist_legenda');
                if (legenda) {
                    legenda.innerHTML = series.map((serie, indice) => `<span class="graph-legend-item"><i style="background:${corSerieGraficoDist(indice)}"></i>${serie.label}</span>`).join('');
                }
                desenharGraficoDist(series, x, { ...saida, nome: saidaNome });
            }

            function marcarVariaveisSaidaMemorialDist() {
                dom.painelDirDist?.querySelectorAll('[class*="graph-output-"]').forEach((elemento) => {
                    const classe = Array.from(elemento.classList).find((item) => item.startsWith('graph-output-'));
                    const chave = classe?.replace('graph-output-', '');
                    const descricaoAuto = graficoDescricoesAuto[chave];
                    if (!catalogoVariaveisFormula[chave] && !descricaoAuto) return;
                    elemento.dataset.graphOutput = chave;
                    const descricao = catalogoVariaveisFormula[chave];
                    elemento.dataset.tooltip = descricao
                        ? textoIdioma(descricao.pt, descricao.en)
                        : descricaoAuto.descricao;
                    elemento.classList.toggle('graph-output-selected', chave === graficoDistEstado.saida);
                    elemento.setAttribute('role', 'button');
                    elemento.setAttribute('tabindex', '0');
                    elemento.setAttribute('aria-label', textoIdioma('Clique para usar esta variável como saída do gráfico.', 'Click to use this variable as the graph output.'));
                });
            }

            function envolverSimbolosCalculadosMemorialDist(html) {
                const simbolos = {
                    'V_r': 'volumeRolo',
                    '\\dot{m}_{linha}': 'massaLinha',
                    '\\dot{m}_{total}': 'massaTotal',
                    'N_r': 'rotacaoDosador',
                    'P_{util,max}': 'potenciaUtilMax',
                    'P_{req}': 'potenciaRequerida',
                    'D_{prim}': 'diametroPrimario',
                    'A_{prim}': 'areaPrimaria',
                    'Q_{prim}': 'vazaoPrimaria',
                    'v_{prim}': 'velocidadePrimaria',
                    'SLR_{prim}': 'slrPrimario',
                    '\\Delta P_{prim}': 'perdaPrimaria',
                    '\\Delta P_{torre}': 'perdaTorre',
                    'A_{sec}': 'areaSecundaria',
                    'Q_{sec}': 'vazaoSecundaria',
                    'v_{sec}': 'velocidadeSecundaria',
                    'SLR_{sec}': 'slrSecundario',
                    '\\Delta P_{sec}': 'perdaSecundaria',
                    '\\Delta P_{total}': 'perdaTotal',
                    'f': 'fatorAcoplamento',
                    'Q_{total,real}': 'vazaoTotal'
                };

                Object.entries(simbolos).forEach(([simbolo, chave]) => {
                    const inicioToken = `\\texttip{${simbolo}}`;
                    let cursor = 0;
                    let inicio = html.indexOf(inicioToken, cursor);
                    while (inicio >= 0) {
                        const prefixo = html.slice(Math.max(0, inicio - 80), inicio);
                        const abertura = inicio + inicioToken.length;
                        if (prefixo.includes('graph-output-') || html[abertura] !== '{') {
                            cursor = abertura;
                            inicio = html.indexOf(inicioToken, cursor);
                            continue;
                        }

                        let profundidade = 0;
                        let fim = abertura;
                        for (; fim < html.length; fim += 1) {
                            if (html[fim] === '{') profundidade += 1;
                            if (html[fim] === '}' && --profundidade === 0) break;
                        }
                        if (fim >= html.length) break;

                        const token = html.slice(inicio, fim + 1);
                        const marcado = `\\class{graph-output-${chave}}{${token}}`;
                        html = html.slice(0, inicio) + marcado + html.slice(fim + 1);
                        cursor = inicio + marcado.length;
                        inicio = html.indexOf(inicioToken, cursor);
                    }
                });

                let cursor = 0;
                while (true) {
                    const inicio = html.indexOf('\\texttip{', cursor);
                    if (inicio < 0) break;
                    const prefixo = html.slice(Math.max(0, inicio - 80), inicio);
                    const simboloInicio = inicio + '\\texttip{'.length;
                    const simboloFim = encontrarFechamentoGrupoFormula(html, simboloInicio - 1);
                    if (simboloFim < 0) break;
                    const simbolo = html.slice(simboloInicio, simboloFim);
                    const descricaoInicio = simboloFim + 2;
                    const descricaoFim = encontrarFechamentoGrupoFormula(html, descricaoInicio - 1);
                    if (prefixo.includes('graph-output-') || descricaoFim < 0 || !/[A-Za-z\\]/u.test(simbolo)) {
                        cursor = Math.max(simboloFim + 1, inicio + 9);
                        continue;
                    }

                    const descricao = html.slice(descricaoInicio, descricaoFim);
                    const chave = simbolos[simbolo] || `memorial_${Array.from(simbolo).reduce((total, caractere) => total + caractere.charCodeAt(0), 0)}`;
                    if (!catalogoVariaveisFormula[chave] && !graficoDescricoesAuto[chave]) {
                        graficoDescricoesAuto[chave] = { descricao };
                    }
                    const token = html.slice(inicio, descricaoFim + 1);
                    const marcado = `\\class{graph-output-${chave}}{${token}}`;
                    html = html.slice(0, inicio) + marcado + html.slice(descricaoFim + 1);
                    cursor = inicio + marcado.length;
                }
                return html;
            }

            function encontrarFechamentoGrupoFormula(texto, abertura) {
                if (texto[abertura] !== '{') return -1;
                let profundidade = 0;
                for (let indice = abertura; indice < texto.length; indice += 1) {
                    if (texto[indice] === '{') profundidade += 1;
                    if (texto[indice] === '}' && --profundidade === 0) return indice;
                }
                return -1;
            }

            function calcularVolumeRolo() {
                const espessura = parseFloat(dom.distEspessura?.value) || 1;
                const discos = parseFloat(dom.distQtdDiscos?.value) || 1;
                const cavidades = parseFloat(dom.distCavidades?.value) || 1;
                const area = parseFloat(dom.distAreaCavidade?.value) || 1;
                const volumeRoloMm3 = espessura * discos * cavidades * area;
                return {
                    volumeRoloMm3,
                    volumePorDiscoMm3: espessura * cavidades * area
                };
            }

            function calcularPerdaDistribuida(fatorAtrito, comprimento, diametro, densidadeAr, velocidade, slr) {
                if (diametro <= 0) return 0;
                return fatorAtrito * (comprimento / diametro) * ((densidadeAr * Math.pow(velocidade, 2)) / 2) * (1 + slr);
            }

            function calcularPerdaLocal(kLocal, densidadeAr, velocidade, slr) {
                return kLocal * ((densidadeAr * Math.pow(velocidade, 2)) / 2) * (1 + slr);
            }

            function simularRedePneumatica(params) {
                let fatorVazao = 1;
                let resultado = null;

                for (let iteracao = 0; iteracao < 30; iteracao++) {
                    const vazaoTotalReal = params.vazaoTotalNominalM3Min * fatorVazao;
                    const vazaoPrimariaReal = vazaoTotalReal / params.quantidadePrimarios;
                    const vazaoSecundariaReal = vazaoTotalReal / params.quantidadeLinhas;

                    const velocidadePrimaria = (vazaoPrimariaReal / 60) / params.areaPrimaria;
                    const velocidadeSecundaria = (vazaoSecundariaReal / 60) / params.areaSecundaria;

                    const massaArPrimariaKgh = vazaoPrimariaReal * 60 * params.densidadeAr;
                    const massaArSecundariaKgh = vazaoSecundariaReal * 60 * params.densidadeAr;

                    const slrPrimario = params.massaSolidoPrimarioKgh / Math.max(massaArPrimariaKgh, 1e-9);
                    const slrSecundario = params.massaSolidoSecundarioKgh / Math.max(massaArSecundariaKgh, 1e-9);

                    const deltaPPrimario = calcularPerdaDistribuida(params.fatorAtrito, params.comprimentoPrimarioM, params.diametroPrimarioM, params.densidadeAr, velocidadePrimaria, slrPrimario);
                    const deltaPTorre = calcularPerdaLocal(params.kTorre, params.densidadeAr, velocidadePrimaria, slrPrimario);
                    const deltaPSecundario = calcularPerdaDistribuida(params.fatorAtrito, params.comprimentoSecundarioM, params.diametroSecundarioM, params.densidadeAr, velocidadeSecundaria, slrSecundario);
                    const deltaPTotal = deltaPPrimario + deltaPTorre + deltaPSecundario;

                    const novoFator = Math.max(0.01, 1 - (deltaPTotal / params.pressaoMaxPa));
                    resultado = {
                        fatorVazao: novoFator,
                        vazaoTotalReal,
                        vazaoPrimariaReal,
                        vazaoSecundariaReal,
                        velocidadePrimaria,
                        velocidadeSecundaria,
                        massaArPrimariaKgh,
                        massaArSecundariaKgh,
                        slrPrimario,
                        slrSecundario,
                        deltaPPrimario,
                        deltaPTorre,
                        deltaPSecundario,
                        deltaPTotal,
                        pressaoNaTorre: Math.max(0, params.pressaoMaxPa - deltaPPrimario),
                        pressaoNaLinha: Math.max(0, params.pressaoMaxPa - deltaPPrimario - deltaPTorre)
                    };

                    if (Math.abs(novoFator - fatorVazao) < 1e-4) break;
                    fatorVazao = novoFator;
                }

                return resultado;
            }

            function simularRedeDireta(params) {
                let fatorVazao = 1;
                let resultado = null;

                for (let iteracao = 0; iteracao < 30; iteracao++) {
                    const vazaoTotalReal = params.vazaoTotalNominalM3Min * fatorVazao;
                    const vazaoLinhaReal = vazaoTotalReal / params.quantidadeLinhas;
                    const velocidadeLinha = (vazaoLinhaReal / 60) / params.areaSecundaria;
                    const massaArLinhaKgh = vazaoLinhaReal * 60 * params.densidadeAr;
                    const slrLinha = params.massaSolidoSecundarioKgh / Math.max(massaArLinhaKgh, 1e-9);
                    const deltaPLinha = calcularPerdaDistribuida(params.fatorAtrito, params.comprimentoSecundarioM, params.diametroSecundarioM, params.densidadeAr, velocidadeLinha, slrLinha);
                    const novoFator = Math.max(0.01, 1 - (deltaPLinha / params.pressaoMaxPa));

                    resultado = {
                        fatorVazao: novoFator,
                        vazaoTotalReal,
                        vazaoLinhaReal,
                        velocidadeLinha,
                        massaArLinhaKgh,
                        slrLinha,
                        deltaPLinha
                    };

                    if (Math.abs(novoFator - fatorVazao) < 1e-4) break;
                    fatorVazao = novoFator;
                }

                return resultado;
            }

            // --- SINCRONIZAÇÃO DOS CONTROLES ---
            // Amarração automática de todos os inputs RANGE e NUMBER correspondentes
            function ajustarFaixaDinamica(range, value) {
                if (!range || Number.isNaN(value)) return;
                const atualMin = parseFloat(range.min);
                const atualMax = parseFloat(range.max);
                const passo = parseFloat(range.step);
                const margem = Number.isFinite(passo) ? Math.max(passo, Math.abs(value) * 0.05) : Math.abs(value) * 0.05;

                if (value < atualMin) range.min = String(value - margem);
                if (value > atualMax) range.max = String(value + margem);
            }

            function normalizarValorNumerico(valorTexto) {
                if (typeof valorTexto !== 'string') return NaN;
                const valorNormalizado = valorTexto.replace(',', '.').trim();
                return parseFloat(valorNormalizado);
            }

            function normalizarTextoNumerico(valorTexto) {
                if (typeof valorTexto !== 'string') return '';
                return valorTexto.replace(',', '.').trim();
            }

            function textoIdioma(portugues, ingles) {
                const idioma = document.body.dataset.language === 'en' ? 'en' : 'pt';
                if (idioma === 'pt') return portugues;
                const traduzido = traducoesIngles[portugues];
                if (traduzido) return traduzido;
                if (ingles) return ingles;
                if (!textoIdioma.termosFaltantes) textoIdioma.termosFaltantes = new Set();
                if (!textoIdioma.termosFaltantes.has(portugues)) {
                    textoIdioma.termosFaltantes.add(portugues);
                    console.warn(`[i18n] Tradução ausente para: ${portugues}`);
                }
                return portugues;
            }

            const catalogoVariaveisFormula = {
                espessuraDisco: {
                    pt: '[mm] Espessura do disco. Descrição: dimensão axial útil de cada disco dosador. Impacto: aumentar a espessura eleva proporcionalmente o volume deslocado por revolução e reduz a rotação necessária para a mesma dose.',
                    en: '[mm] Disc thickness. Description: usable axial dimension of each metering disc. Impact: increasing thickness proportionally raises displaced volume per revolution and reduces the speed required for the same dose.'
                },
                discosAtivos: {
                    pt: '[un] Quantidade de discos ativos. Descrição: número de discos que contribuem para o volume dosado. Impacto: adicionar discos aumenta proporcionalmente o volume por revolução e a capacidade de dosagem.',
                    en: '[count] Number of active discs. Description: number of discs contributing to metered volume. Impact: adding discs proportionally increases volume per revolution and metering capacity.'
                },
                cavidadesDisco: {
                    pt: '[un] Cavidades por disco. Descrição: número de bolsões dosadores em cada disco. Impacto: aumentar a quantidade eleva o volume por volta e reduz a pulsação entre descargas.',
                    en: '[count] Cavities per disc. Description: number of metering pockets in each disc. Impact: increasing the count raises volume per turn and reduces pulsation between discharges.'
                },
                areaCavidade: {
                    pt: '[mm²] Área lateral da cavidade. Descrição: seção útil de cada bolsão que captura material. Impacto: aumentar a área eleva o volume deslocado por revolução; reduzir a área exige maior rotação para a mesma dose.',
                    en: '[mm²] Lateral cavity area. Description: usable cross-section of each material-capturing pocket. Impact: increasing area raises displaced volume per revolution; reducing it requires higher speed for the same dose.'
                },
                massaLinha: {
                    pt: '[kg/h] Vazão mássica por linha. Descrição: massa de insumo requerida por hora em uma linha. Impacto: aumentar a taxa por hectare, a velocidade do trator ou o espaçamento eleva esta vazão e exige maior capacidade do dosador e do transporte pneumático.',
                    en: '[kg/h] Mass flow per row. Description: material mass required per hour in one row. Impact: increasing the application rate, tractor speed, or row spacing raises this flow and requires greater metering and pneumatic-conveying capacity.'
                },
                taxaHectare: {
                    pt: '[kg/ha] Taxa de aplicação por hectare. Descrição: dose agronômica definida para a área. Impacto: aumentar a dose eleva proporcionalmente a vazão mássica e a rotação requerida do dosador.',
                    en: '[kg/ha] Application rate per hectare. Description: agronomic dose specified for the field. Impact: increasing the dose proportionally raises mass flow and required meter speed.'
                },
                velocidadeTrator: {
                    pt: '[km/h] Velocidade do trator. Descrição: velocidade de avanço da máquina no campo. Impacto: aumentar a velocidade eleva proporcionalmente a massa que deve ser dosada por hora.',
                    en: '[km/h] Tractor speed. Description: machine travel speed in the field. Impact: increasing speed proportionally raises the mass that must be metered per hour.'
                },
                larguraLinha: {
                    pt: '[m] Largura de trabalho por linha. Descrição: faixa de terreno atendida por uma linha. Impacto: aumentar a largura eleva proporcionalmente a vazão mássica exigida nessa linha.',
                    en: '[m] Working width per row. Description: field width served by one row. Impact: increasing width proportionally raises the mass flow required in that row.'
                },
                conversaoAgronomica: {
                    pt: '[adimensional] Fator de conversão agronômica. Descrição: compatibiliza kg/ha, km/h e metros para obter kg/h. Impacto: é fixo para essas unidades; alterá-lo tornaria a conversão dimensional incorreta.',
                    en: '[dimensionless] Agronomic conversion factor. Description: reconciles kg/ha, km/h, and metres to obtain kg/h. Impact: it is fixed for these units; changing it would make the dimensional conversion incorrect.'
                },
                massaTotal: {
                    pt: '[kg/h] Vazão mássica total. Descrição: soma da massa requerida por todas as linhas. Impacto: cresce com a vazão por linha e com o número de linhas, aumentando a carga global do reservatório e da turbina.',
                    en: '[kg/h] Total mass flow. Description: combined mass required by all rows. Impact: it grows with row flow and row count, increasing the total load on the hopper and blower.'
                },
                numeroLinhas: {
                    pt: '[un] Número de linhas secundárias. Descrição: quantidade de ramais finais alimentados pela rede. Impacto: aumentar o número de linhas eleva a massa total e divide a vazão de ar entre mais ramais.',
                    en: '[count] Number of secondary rows. Description: number of final branches supplied by the network. Impact: increasing row count raises total material flow and divides airflow among more branches.'
                },
                rotacaoDosador: {
                    pt: '[RPM] Rotação do dosador. Descrição: velocidade necessária do rolo para entregar a dose por linha. Impacto: aumenta com a vazão mássica e diminui quando o volume por volta ou a densidade do material aumentam.',
                    en: '[RPM] Meter speed. Description: roller speed required to deliver the row dose. Impact: it rises with mass flow and falls when displaced volume per revolution or material density increases.'
                },
                volumeRolo: {
                    pt: '[mm³/rev] Volume útil do rolo por revolução. Descrição: volume deslocado em uma volta. Impacto: aumentar o volume reduz a rotação necessária para a mesma vazão mássica.',
                    en: '[mm³/rev] Useful roller volume per revolution. Description: volume displaced in one turn. Impact: increasing volume reduces the speed required for the same mass flow.'
                },
                potenciaUtilMax: {
                    pt: '[W] Potência útil máxima. Descrição: capacidade mecânica disponível no eixo do dosador. Impacto: aumentar esta potência amplia a margem antes da sobrecarga.',
                    en: '[W] Maximum useful power. Description: mechanical capacity available at the metering shaft. Impact: increasing it expands the margin before overload.'
                },
                potenciaRequerida: {
                    pt: '[W] Potência requerida. Descrição: potência mecânica calculada para dosar o material. Impacto: aumentar a vazão ou a energia específica eleva a exigência do motor.',
                    en: '[W] Required power. Description: mechanical power calculated for metering the material. Impact: increasing flow or specific energy raises motor demand.'
                },
                densidadeSolido: {
                    pt: '[g/mm³] Densidade do sólido. Descrição: massa do material por unidade de volume. Impacto: aumentar a densidade eleva a massa entregue por volta e reduz a rotação necessária para a mesma dose.',
                    en: '[g/mm³] Solid density. Description: material mass per unit volume. Impact: increasing density raises mass delivered per revolution and reduces the speed required for the same dose.'
                },
                vazaoTotal: {
                    pt: '[m³/min] Vazão volumétrica total real. Descrição: volume de ar efetivamente fornecido pela turbina após as perdas. Impacto: aumentar esta vazão eleva as velocidades nos dutos e também as perdas de carga.',
                    en: '[m³/min] Actual total volumetric flow. Description: air volume effectively supplied by the blower after losses. Impact: increasing this flow raises duct velocities and pressure losses.'
                },
                numeroPrimarios: {
                    pt: '[un] Número de dutos primários. Descrição: quantidade de ramais grandes antes das torres. Impacto: aumentar a quantidade divide a vazão total, reduzindo a velocidade e a perda por duto primário.',
                    en: '[count] Number of primary ducts. Description: number of large branches upstream of the towers. Impact: increasing the count splits total flow, reducing velocity and loss in each primary duct.'
                },
                vazaoPrimaria: {
                    pt: '[m³/min] Vazão por duto primário. Descrição: parcela da vazão total que atravessa um duto grande. Impacto: aumentar esta vazão eleva a velocidade e a perda de carga no trecho primário.',
                    en: '[m³/min] Flow per primary duct. Description: share of total flow crossing one large duct. Impact: increasing this flow raises velocity and pressure loss in the primary section.'
                },
                areaPrimaria: {
                    pt: '[m²] Área interna do duto primário. Descrição: seção transversal disponível ao escoamento. Impacto: aumentar a área reduz a velocidade e a perda de carga para a mesma vazão.',
                    en: '[m²] Primary-duct internal area. Description: cross-sectional area available to the flow. Impact: increasing area reduces velocity and pressure loss at the same flow rate.'
                },
                velocidadePrimaria: {
                    pt: '[m/s] Velocidade média no duto primário. Descrição: rapidez do ar no trecho de maior diâmetro. Impacto: maior velocidade favorece o arraste, mas aumenta aproximadamente com o quadrado a parcela dinâmica da perda.',
                    en: '[m/s] Mean primary-duct velocity. Description: air speed in the larger-diameter section. Impact: higher velocity promotes conveying but raises the dynamic loss term approximately with its square.'
                },
                slrPrimario: {
                    pt: '[adimensional] Razão de carregamento sólido/ar no primário. Descrição: massa de sólido dividida pela massa de ar. Impacto: aumentar a razão eleva a correção de perda e o risco de instabilidade do transporte.',
                    en: '[dimensionless] Primary solids loading ratio. Description: solid mass divided by air mass. Impact: increasing the ratio raises the corrected loss and the risk of unstable conveying.'
                },
                massaSolidoPrimario: {
                    pt: '[kg/h] Vazão mássica de sólido no duto primário. Descrição: massa de material conduzida por um ramal grande. Impacto: aumentar esta massa eleva a razão de carregamento e a perda corrigida.',
                    en: '[kg/h] Solid mass flow in a primary duct. Description: material mass conveyed by one large branch. Impact: increasing this mass raises the loading ratio and corrected pressure loss.'
                },
                massaArPrimario: {
                    pt: '[kg/h] Vazão mássica de ar no duto primário. Descrição: massa de ar disponível para transportar o sólido. Impacto: aumentar esta massa reduz a razão de carregamento para a mesma vazão de sólido.',
                    en: '[kg/h] Air mass flow in a primary duct. Description: air mass available to convey solids. Impact: increasing this mass reduces the loading ratio for the same solid flow.'
                },
                perdaPrimaria: {
                    pt: '[Pa] Perda de pressão no duto primário. Descrição: queda de pressão distribuída por atrito. Impacto: cresce com atrito, comprimento, densidade, carregamento e velocidade ao quadrado; reduz a pressão disponível na torre.',
                    en: '[Pa] Primary-duct pressure loss. Description: distributed pressure drop caused by friction. Impact: it grows with friction, length, density, loading, and squared velocity, reducing pressure available at the tower.'
                },
                fatorAtrito: {
                    pt: '[adimensional] Fator de atrito de Darcy. Descrição: representa a resistência da parede ao escoamento. Impacto: dobrar o fator dobra a parcela de perda distribuída, mantendo as demais variáveis.',
                    en: '[dimensionless] Darcy friction factor. Description: represents wall resistance to flow. Impact: doubling the factor doubles the distributed-loss term when all other variables remain unchanged.'
                },
                comprimentoPrimario: {
                    pt: '[m] Comprimento do duto primário. Descrição: distância de escoamento até a torre. Impacto: dobrar o comprimento dobra a perda distribuída nas mesmas condições.',
                    en: '[m] Primary-duct length. Description: flow distance to the tower. Impact: doubling length doubles distributed loss under the same conditions.'
                },
                diametroPrimario: {
                    pt: '[m] Diâmetro interno do duto primário. Descrição: bitola útil do ramal grande. Impacto: aumentar o diâmetro amplia a área, reduz a velocidade e diminui fortemente a perda de carga.',
                    en: '[m] Primary-duct internal diameter. Description: usable bore of the large branch. Impact: increasing diameter enlarges area, reduces velocity, and strongly decreases pressure loss.'
                },
                densidadeAr: {
                    pt: '[kg/m³] Densidade do ar. Descrição: massa de ar por volume usada na pressão dinâmica. Impacto: aumentar a densidade eleva a pressão dinâmica na mesma velocidade e altera a razão sólido/ar.',
                    en: '[kg/m³] Air density. Description: air mass per volume used in dynamic pressure. Impact: increasing density raises dynamic pressure at the same velocity and changes the solids-to-air ratio.'
                },
                perdaTorre: {
                    pt: '[Pa] Perda localizada na torre. Descrição: queda de pressão causada por divisão, mudança de direção e turbulência. Impacto: reduz a pressão disponível nas linhas secundárias.',
                    en: '[Pa] Tower local pressure loss. Description: pressure drop caused by splitting, direction changes, and turbulence. Impact: it reduces pressure available to the secondary rows.'
                },
                coeficienteTorre: {
                    pt: '[adimensional] Coeficiente de perda local K da torre. Descrição: caracteriza a resistência geométrica da torre. Impacto: aumentar K eleva proporcionalmente a perda localizada.',
                    en: '[dimensionless] Tower local-loss coefficient K. Description: characterises the tower geometric resistance. Impact: increasing K proportionally raises the local pressure loss.'
                },
                areaSecundaria: {
                    pt: '[m²] Área interna da linha secundária. Descrição: seção transversal da mangueira final. Impacto: aumentar a área reduz a velocidade para a mesma vazão por linha.',
                    en: '[m²] Secondary-line internal area. Description: cross-sectional area of the final hose. Impact: increasing area reduces velocity for the same row flow.'
                },
                diametroSecundario: {
                    pt: '[m] Diâmetro interno da linha secundária. Descrição: bitola útil da mangueira final. Impacto: aumentar o diâmetro amplia a área e reduz velocidade e perda de carga.',
                    en: '[m] Secondary-line internal diameter. Description: usable bore of the final hose. Impact: increasing diameter enlarges area and reduces velocity and pressure loss.'
                },
                vazaoSecundaria: {
                    pt: '[m³/min] Vazão por linha secundária. Descrição: parcela de ar destinada a uma linha final. Impacto: aumentar esta vazão eleva a velocidade de transporte e a perda de carga.',
                    en: '[m³/min] Flow per secondary row. Description: share of airflow assigned to one final row. Impact: increasing this flow raises conveying velocity and pressure loss.'
                },
                velocidadeSecundaria: {
                    pt: '[m/s] Velocidade na linha secundária. Descrição: rapidez final do ar que transporta o material. Impacto: aumentar a velocidade melhora a suspensão, mas eleva a perda aproximadamente com seu quadrado.',
                    en: '[m/s] Secondary-line velocity. Description: final air speed conveying the material. Impact: increasing velocity improves suspension but raises pressure loss approximately with its square.'
                },
                slrSecundario: {
                    pt: '[adimensional] Razão de carregamento sólido/ar na linha secundária. Descrição: massa de sólido por massa de ar no ramal final. Impacto: aumentar a razão eleva a perda corrigida e o risco de entupimento.',
                    en: '[dimensionless] Secondary-line solids loading ratio. Description: solid mass per air mass in the final branch. Impact: increasing the ratio raises corrected loss and clogging risk.'
                },
                massaArSecundario: {
                    pt: '[kg/h] Vazão mássica de ar na linha secundária. Descrição: massa de ar disponível no ramal final. Impacto: aumentar esta massa reduz a razão de carregamento para a mesma massa de sólido.',
                    en: '[kg/h] Air mass flow in a secondary row. Description: air mass available in the final branch. Impact: increasing this mass reduces the loading ratio for the same solid mass.'
                },
                perdaSecundaria: {
                    pt: '[Pa] Perda de pressão na linha secundária. Descrição: queda distribuída por atrito na mangueira final. Impacto: cresce com comprimento, atrito, densidade, carregamento e velocidade ao quadrado.',
                    en: '[Pa] Secondary-line pressure loss. Description: distributed friction drop in the final hose. Impact: it grows with length, friction, density, loading, and squared velocity.'
                },
                comprimentoSecundario: {
                    pt: '[m] Comprimento da linha secundária. Descrição: extensão da mangueira após a torre. Impacto: dobrar o comprimento dobra a perda distribuída nas mesmas condições.',
                    en: '[m] Secondary-line length. Description: hose length downstream of the tower. Impact: doubling length doubles distributed loss under the same conditions.'
                },
                perdaTotal: {
                    pt: '[Pa] Perda de pressão total. Descrição: soma das perdas primária, da torre e secundária. Impacto: aumentar qualquer parcela reduz a vazão efetiva entregue pela turbina.',
                    en: '[Pa] Total pressure loss. Description: sum of primary, tower, and secondary losses. Impact: increasing any component reduces the effective flow delivered by the blower.'
                },
                fatorAcoplamento: {
                    pt: '[adimensional] Fator de acoplamento da turbina. Descrição: fração da vazão nominal restante após a contrapressão. Impacto: aumenta quando as perdas caem e diminui quando a rede oferece maior resistência.',
                    en: '[dimensionless] Blower coupling factor. Description: fraction of nominal flow remaining after backpressure. Impact: it increases when losses fall and decreases when network resistance rises.'
                },
                pressaoMaxima: {
                    pt: '[Pa] Pressão estática máxima da turbina. Descrição: limite de contrapressão no modelo simplificado. Impacto: aumentar este limite preserva maior fator de vazão para a mesma perda total.',
                    en: '[Pa] Maximum blower static pressure. Description: backpressure limit in the simplified model. Impact: increasing this limit preserves a higher flow factor for the same total loss.'
                },
                vazaoTurbina: {
                    pt: '[m³/min] Vazão nominal da turbina. Descrição: capacidade de ar em condição de referência. Impacto: aumentar a vazão nominal eleva a vazão real, as velocidades e as perdas da rede.',
                    en: '[m³/min] Nominal blower flow. Description: airflow capacity under the reference condition. Impact: increasing nominal flow raises actual flow, velocities, and network losses.'
                },
                pi: {
                    pt: '[adimensional] Constante π. Descrição: razão entre circunferência e diâmetro. Impacto: constante geométrica fixa usada para calcular áreas circulares; não é um parâmetro ajustável.',
                    en: '[dimensionless] Constant π. Description: ratio of circumference to diameter. Impact: fixed geometric constant used to calculate circular areas; it is not an adjustable parameter.'
                },
                divisorArea: {
                    pt: '[adimensional] Divisor geométrico 4. Descrição: resulta do uso do raio D/2 na área πr². Impacto: constante fixa; alterá-la produziria área circular incorreta.',
                    en: '[dimensionless] Geometric divisor 4. Description: results from using radius D/2 in area πr². Impact: fixed constant; changing it would produce an incorrect circular area.'
                },
                conversaoMinuto: {
                    pt: '[s/min] Conversão de minuto para segundo. Descrição: 60 segundos por minuto. Impacto: constante fixa que compatibiliza vazão por minuto com velocidade em m/s.',
                    en: '[s/min] Minute-to-second conversion. Description: 60 seconds per minute. Impact: fixed constant reconciling per-minute flow with velocity in m/s.'
                },
                anguloSaida: {
                    pt: '[graus] Ângulo de saída. Descrição: direção do vetor de velocidade refletida em relação à horizontal. Impacto: aumentar o ângulo eleva a componente vertical e altera o alcance longitudinal e o tempo de voo.',
                    en: '[degrees] Exit angle. Description: direction of the reflected velocity vector relative to horizontal. Impact: increasing the angle raises the vertical component and changes longitudinal range and flight time.'
                },
                anguloTangencial: {
                    pt: '[graus] Ângulo tangencial. Descrição: direção lateral de escape na borda curva do defletor. Impacto: aumentar o ângulo eleva a componente lateral da velocidade e amplia a faixa distribuída.',
                    en: '[degrees] Tangential angle. Description: lateral escape direction at the curved deflector edge. Impact: increasing the angle raises lateral velocity and widens the distributed swath.'
                }
            };

            function variavelFormula(latex, chave) {
                const item = catalogoVariaveisFormula[chave];
                if (!item) {
                    console.warn(`[formula] Variável sem descrição: ${chave}`);
                    return latex;
                }
                const formula = `\\texttip{${latex}}{${document.body.dataset.language === 'en' ? item.en : item.pt}}`;
                return `\\class{graph-output-${chave}}{${formula}}`;
            }

            function configurarTooltipsInstantaneos() {
                const tooltip = document.createElement('div');
                tooltip.className = 'app-tooltip';
                tooltip.setAttribute('role', 'tooltip');
                document.body.appendChild(tooltip);
                let alvoAtual = null;
                let tooltipFixo = false;

                const mostrarTooltip = (alvo, event) => {
                    if (!alvo || !alvo.dataset.tooltip) return;
                    alvoAtual = alvo;
                    tooltip.textContent = alvo.dataset.tooltip;
                    tooltip.classList.add('visible');
                    if (event) posicionar(event);
                };

                const ocultarTooltip = () => {
                    alvoAtual = null;
                    tooltipFixo = false;
                    tooltip.classList.remove('visible');
                };

                const preparar = (raiz) => {
                    if (!(raiz instanceof Element)) return;
                    const elementos = raiz.matches('[title]') ? [raiz] : [];
                    elementos.push(...raiz.querySelectorAll('[title]'));
                    elementos.forEach((elemento) => {
                        const titulo = elemento.getAttribute('title');
                        if (!titulo) return;
                        if (!elemento.dataset.tooltipOriginal) {
                            elemento.dataset.tooltipOriginal = elemento.dataset.i18nOriginalTitle || titulo;
                        }
                        elemento.dataset.tooltip = traduzirTexto(
                            elemento.dataset.tooltipOriginal,
                            document.body.dataset.language === 'en' ? 'en' : 'pt'
                        );
                        elemento.removeAttribute('title');
                    });
                };

                const posicionar = (event) => {
                    if (!alvoAtual) return;
                    if (tooltipFixo && !event?.clientX && !event?.clientY) {
                        const rect = alvoAtual.getBoundingClientRect();
                        const margem = 14;
                        let left = rect.left + rect.width / 2 + window.scrollX;
                        let top = rect.bottom + window.scrollY + margem;
                        const largura = tooltip.offsetWidth;
                        const altura = tooltip.offsetHeight;
                        if (left + largura > window.innerWidth - 8) left = window.innerWidth - largura - 8;
                        if (top + altura > window.innerHeight - 8) top = rect.top + window.scrollY - altura - margem;
                        tooltip.style.left = `${Math.max(8, left)}px`;
                        tooltip.style.top = `${Math.max(8, top)}px`;
                        return;
                    }
                    const margem = 14;
                    const largura = tooltip.offsetWidth;
                    const altura = tooltip.offsetHeight;
                    let left = event.clientX + margem;
                    let top = event.clientY + margem;
                    if (left + largura > window.innerWidth - 8) left = event.clientX - largura - margem;
                    if (top + altura > window.innerHeight - 8) top = event.clientY - altura - margem;
                    tooltip.style.left = `${Math.max(8, left)}px`;
                    tooltip.style.top = `${Math.max(8, top)}px`;
                };

                document.addEventListener('pointerover', (event) => {
                    const alvo = event.target.closest?.('[data-tooltip]');
                    if (!alvo || !alvo.dataset.tooltip) return;
                    if (tooltipFixo && alvo !== alvoAtual) return;
                    alvoAtual = alvo;
                    tooltip.textContent = alvo.dataset.tooltip;
                    tooltip.classList.add('visible');
                    posicionar(event);
                });
                document.addEventListener('pointermove', (event) => {
                    if (tooltipFixo) return;
                    posicionar(event);
                });
                document.addEventListener('pointerout', (event) => {
                    if (tooltipFixo) return;
                    if (!alvoAtual || event.relatedTarget?.closest?.('[data-tooltip]') === alvoAtual) return;
                    ocultarTooltip();
                });
                document.addEventListener('focusin', (event) => {
                    const alvo = event.target.closest?.('[data-tooltip]');
                    if (!alvo || !alvo.dataset.tooltip) return;
                    if (tooltipFixo && alvo !== alvoAtual) return;
                    alvoAtual = alvo;
                    tooltip.textContent = alvo.dataset.tooltip;
                    const rect = alvo.getBoundingClientRect();
                    tooltip.classList.add('visible');
                    posicionar({ clientX: rect.left + rect.width / 2, clientY: rect.bottom });
                });
                document.addEventListener('focusout', () => {
                    if (tooltipFixo) return;
                    ocultarTooltip();
                });
                document.addEventListener('click', (event) => {
                    const alvo = event.target.closest?.('[data-tooltip]');
                    if (alvo && alvo.dataset.tooltip) {
                        if (alvoAtual === alvo && tooltipFixo) {
                            ocultarTooltip();
                            return;
                        }
                        tooltipFixo = true;
                        mostrarTooltip(alvo, {
                            clientX: alvo.getBoundingClientRect().left + alvo.getBoundingClientRect().width / 2,
                            clientY: alvo.getBoundingClientRect().bottom
                        });
                        return;
                    }

                    if (tooltipFixo) {
                        ocultarTooltip();
                    }
                });

                preparar(document.body);
                new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        mutation.addedNodes.forEach(preparar);
                        if (mutation.type === 'attributes') preparar(mutation.target);
                    });
                }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['title'] });
            }

            function traduzirTextosDeFormula(html) {
                if (document.body.dataset.language !== 'en') return html;
                const traducoesFormula = {
                    '_{linha}': '_{row}',
                    '_{linhas}': '_{rows}',
                    '_{trator}': '_{tractor}',
                    '_{turbina}': '_{blower}',
                    '_{ar}': '_{air}',
                    '_{torre}': '_{tower}',
                    '_{tubo}': '_{tube}',
                    '_{pol}': '_{in}',
                    '_{direto}': '_{direct}',
                    '_{exigida}': '_{required}',
                    '_{redutor}': '_{gearbox}',
                    '_{caixa}': '_{gearbox}',
                    '[Pa] Perda de Carga Total. Definição: Contrapressão macro do sistema resistindo ao fluxo da turbina.': '[Pa] Total Pressure Loss. Definition: overall system backpressure opposing turbine flow.',
                    'Pressão Friccional Morta no Custo da Transferência de Carga Bruta Frontal Pela Parede de Borracha ou Silicone Grossa Liso': 'Primary-duct friction loss.',
                    'Soco Impactante Dinâmico Caótico Morto Fracassado no Teto do Chapéu Divisor ou Venturi Salvação': 'Local pressure loss at the distribution tower.',
                    'Arrasto Espiral Espremido Serpenteante Estiolante das Linhas Longilíneas Sibilantes Mangueiradas': 'Secondary-line friction loss.',
                    '[Pa] BARREIRA RESISTIVA INTEGRAL DO SISTEMA. Impacto: A força cega invisível e brutal do vento engarrafado dentro da couraça de canos ocos colidindo empedernida batendo de frente contra o olho do furacão centrífugo metálico na boca exaustora da turbina Fprime de ferro trancando e ensurdecendo a mesma violentamente em desespero restritivo aerodinâmico!': '[Pa] Total system resistance. Impact: determines the backpressure imposed on the turbine and the remaining usable airflow.',
                    '[Adim.] Fator de Acoplamento. Definição: Fator de redução de vazão da turbina devido à contrapressão da rede.': '[Dimensionless] Coupling Factor. Definition: turbine-flow reduction factor caused by network backpressure.',
                    'Rendimento Livre Máximo Fantasia sem atrito.': 'Maximum free-flow factor without pressure losses.',
                    'Frenagem e freio resistivo duro de trancar o vento.': 'Total backpressure opposing turbine flow.',
                    '[Pa] Pressão Fechada Absoluta Trancada (Ponto Morto Estol). Impacto: A turbina uivará em 2900 RPM e nenhuma fagulha de ar escapará das suas beiradas emparedadas!': '[Pa] Shutoff static pressure. Impact: maximum backpressure at zero delivered flow.',
                    '[Adim.] Ponto Cruzado de Equilíbrio Tênue Resultante de Escoamento Fluidodinâmico da Curva Plena Original Fabril de Desempenho. Impacto: A fatia matemática final gloriosa que escapou de toda a morte e restrição do sistema físico da tubagem!': '[Dimensionless] Operating coupling factor. Impact: fraction of nominal turbine flow remaining after network losses.',
                    '[m³/min] Vazão Total Real. Definição: Volume de ar real que a turbina consegue empurrar na rede.': '[m³/min] Actual Total Flow. Definition: actual air volume the turbine can deliver through the network.',
                    'Eficiência Final Acoplada Relativa Resistida': 'Final flow coupling factor.',
                    'Vazão Virgem Absoluta de Laboratório Ideal sem canos no vento frio limpo e silencioso germânico testado na Punker.': 'Nominal free-flow turbine capacity measured without network losses.',
                    '[m³/min] VAZÃO MAGISTRAL DE TRABALHO EMPÍRICA REAL E VERDADEIRA! Impacto: É este pulmão matemático inegável retroativo e exato que permitiu trancar o balanço e resolver em frações as velocidades milimétricas que manterão as toneladas de adubo e soja de 60 covas perfeitamente suspensas como mágica flutuante e assopradas contra o abismo do leito arado no solo quente da fazenda!': '[m³/min] Actual operating flow. Impact: determines the air available to suspend and transport material through all rows.'
                };
                const traduzido = Object.entries(traducoesFormula).reduce(
                    (resultado, [portugues, ingles]) => resultado.split(portugues).join(ingles),
                    html
                );
                return substituirTexttipsNaoTraduzidos(traduzido);
            }

            function substituirTexttipsNaoTraduzidos(html) {
                const prefixo = '\\texttip{';
                const portuguesVisivel = /[ãõáéíóúâêôçÁÉÍÓÚÂÊÔÇ]|\b(?:Definição|Impacto|Potência|Vazão|Velocidade|Perda|Pressão|Densidade|Quantidade|Área|Diâmetro|Eficiência|Fator|Massa|Corrente|Tensão|Rotação|Razão|Conversão|Atrito|Tubo|Linha|Torre|Semente|Carga|Tempo|Altura|Largura|Rendimento|Resistência|Desvio|Queda|Fluxo|Trecho|Divisor|Valor|Energia)\b/i;

                function lerGrupoBalanceado(texto, inicio) {
                    if (texto[inicio] !== '{') return null;
                    let nivel = 0;
                    for (let indice = inicio; indice < texto.length; indice += 1) {
                        if (texto[indice] === '{') nivel += 1;
                        if (texto[indice] === '}') {
                            nivel -= 1;
                            if (nivel === 0) {
                                return { conteudo: texto.slice(inicio + 1, indice), fim: indice + 1 };
                            }
                        }
                    }
                    return null;
                }

                function criarTooltipEspecificoEmIngles(simbolo, descricao) {
                    const unidadeOriginal = descricao.match(/^\s*(\[[^\]]+\])/u)?.[1] || '';
                    const unidade = unidadeOriginal
                        .replace('[Conversão]', '[Conversion factor]')
                        .replace('[Constante Universal]', '[Exact constant]')
                        .replace('[Adim.]', '[Dimensionless]')
                        .replace('[un]', '[count]')
                        .replace('[pol]', '[in]')
                        .replace('[Graus]', '[degrees]');
                    const casos = [
                        [/pot[eê]ncia mec[aâ]nica(?! requerida)/i, 'Mechanical power transmitted at the motor shaft. Importance: represents the mechanical load imposed by the process. Impact example: increasing material flow or specific energy increases this power demand.'],
                        [/pot[eê]ncia el[eé]trica/i, 'Electrical input power drawn from the supply. Importance: determines source, cable, and protection sizing. Impact example: increasing required mechanical power or reducing motor efficiency increases electrical input power.'],
                        [/calor gerado|energia t[eé]rmica dissipada/i, 'Thermal energy generated by Joule heating. Importance: determines winding temperature rise and insulation risk. Impact example: doubling current increases resistive heating by a factor of four for the same resistance and time.'],
                        [/corrente ao quadrado/i, 'Squared electrical current used by Joule’s law. Importance: makes heating highly sensitive to overload. Impact example: a 10% current increase produces approximately a 21% increase in the I² term.'],
                        [/resist[eê]ncia interna.*bobinas/i, 'Electrical resistance of the copper windings. Importance: converts current into heat through I²R losses. Impact example: increasing resistance increases generated heat proportionally at fixed current and time.'],
                        [/tempo de exposi[cç][aã]o/i, 'Duration of the overload condition. Importance: determines accumulated Joule heat. Impact example: doubling exposure time doubles dissipated thermal energy at unchanged current and resistance.'],
                        [/constante metrol[oó]gica/i, 'Agronomic unit-conversion factor linking kg/ha, km/h, and row width to kg/h. Importance: keeps the dimensional conversion consistent. Impact example: it remains fixed at 10 for this specific combination of units and must not be tuned as a design parameter.'],
                        [/massa exigida calculada no passo anterior/i, 'Previously calculated mass flow for one planting row. Importance: it is reused to calculate total flow and roller speed. Impact example: increasing row flow raises total flow and required RPM.'],
                        [/n[uú]mero total de linhas|divis[oõ]es do coletor|fracionamento.*linhas/i, 'Number of parallel rows or branches sharing the total flow. Importance: determines how total material or air flow is divided. Impact example: increasing the row count reduces airflow per row at unchanged turbine flow and increases total material demand at unchanged row dose.'],
                        [/transforma quilos em gramas/i, 'Exact mass-unit conversion from kilograms to grams. Importance: aligns mass flow with density expressed in g/mm³. Impact example: the fixed factor is 1000 g/kg and must not be adjusted.'],
                        [/horas em minutos|minutos para segundos|conversor de tempo|desmembramento temporal/i, 'Exact time-unit conversion. Importance: aligns hourly or minute-based flow with RPM or m/s. Impact example: 60 min/h or 60 s/min is fixed and must not be adjusted.'],
                        [/energia de trabalho mec[aâ]nico do dosador/i, 'Specific mechanical energy required by the metering process per gram of material. Importance: converts mass flow into power demand. Impact example: increasing this measured energy increases required power proportionally.'],
                        [/convers[aã]o exata de polegadas|converte.*polegadas/i, 'Exact inch-to-meter conversion constant. Importance: converts commercial duct size to SI before area and pressure-loss calculations. Impact example: the fixed value 0.0254 m/in must not be adjusted.'],
                        [/di[aâ]metro.*quadrado|di[aâ]metro isolado.*quadrado/i, 'Squared internal diameter used in the circular-area equation. Importance: area grows with the square of diameter. Impact example: doubling diameter increases cross-sectional area by a factor of four.'],
                        [/divisor.*geom[eé]trico|divisor de planifica[cç][aã]o/i, 'Geometric divisor in the circular-area relation A = πD²/4. Importance: converts diameter into circle area. Impact example: the constant 4 is fixed by geometry and must not be adjusted.'],
                        [/vaz[aã]o real calculada da m[aá]quina/i, 'Actual total airflow delivered after accounting for network backpressure. Importance: supplies all branches. Impact example: increasing this flow increases branch velocity and usually raises friction loss.'],
                        [/massa individual da tubula[cç][aã]o|peso acumulado das sementes/i, 'Solid mass flow assigned to one pneumatic branch. Importance: forms the numerator of the solids loading ratio. Impact example: increasing solid flow raises SLR and corrected pressure loss.'],
                        [/massa transportadora gasosa|peso.*ar|respiro massivo/i, 'Air mass flow through the branch. Importance: forms the denominator of the solids loading ratio. Impact example: increasing air mass flow lowers SLR for the same solid flow.'],
                        [/quadratura.*velocidade|fatora[cç][aã]o.*(?:velocidade|costelas)|impulso quadrado/i, 'Squared air velocity in the dynamic-pressure term. Importance: makes pressure loss highly sensitive to speed. Impact example: doubling velocity increases this term and the associated loss by a factor of four.'],
                        [/estabilizador.*press[aã]o|restritor cin[eé]tico|constante universal.*energia cin[eé]tica/i, 'Factor 2 in the dynamic-pressure relation ρv²/2. Importance: comes from kinetic-energy formulation and is not an adjustable design parameter.'],
                        [/somat[oó]ria do arrasto|proje[cç][aã]o de peso|carga s[oó]lida.*embuchamento/i, 'Solids-loading correction applied to gas-only pressure loss. Importance: represents added momentum exchange caused by transported particles. Impact example: increasing SLR increases corrected pressure loss through the factor (1 + SLR).'],
                        [/di[aâ]metro fino|di[aâ]metro asfixiante/i, 'Internal secondary-hose diameter. Importance: determines hose area, velocity, and friction loss. Impact example: increasing diameter lowers velocity and Darcy-Weisbach loss at the same flow.'],
                        [/vaz[aã]o t[eê]nue|vaz[aã]o minuciosa/i, 'Actual volumetric airflow assigned to one secondary row. Importance: determines final hose velocity. Impact example: increasing row airflow raises transport velocity and dynamic pressure.'],
                        [/aperto transversal|canal secund[aá]rio min[uú]sculo/i, 'Secondary-hose cross-sectional area. Importance: converts row airflow into velocity. Impact example: increasing area lowers velocity for unchanged airflow.'],
                        [/massa micro pulverizada/i, 'Solid mass flow transported by one secondary row. Importance: forms the numerator of secondary SLR. Impact example: increasing this mass flow raises SLR and clogging risk.'],
                        [/coeficiente pulmonar.*carregamento/i, 'Secondary solids loading ratio. Importance: compares transported solid mass with available air mass. Impact example: increasing this ratio raises corrected pressure loss and the risk of unstable transport.'],
                        [/extens[aã]o tormentosa secund[aá]ria/i, 'Secondary-hose length. Importance: distributed wall-friction loss accumulates along this distance. Impact example: doubling length doubles the Darcy-Weisbach loss at unchanged conditions.'],
                        [/energia espec[ií]fica|resist[eê]ncia do npk/i, 'Specific energy required to process one unit of material mass. Importance: represents material resistance and directly scales required mechanical power. Impact example: increasing specific energy increases required power proportionally; decreasing it reduces motor demand.'],
                        [/taxa.*moagem|taxa instant[aâ]nea|fluxo m[aá]ssico.*linha|massa individual exigida/i, 'Material mass flow processed by one row. Importance: sets row delivery capacity and mechanical loading. Impact example: increasing flow raises required roller speed and power; decreasing it reduces both.'],
                        [/fluxo m[aá]ssico total|massa total global/i, 'Combined material mass flow across all rows. Importance: defines total machine throughput and pneumatic solids loading. Impact example: adding rows or increasing row flow raises total flow proportionally.'],
                        [/taxa agron[oô]mica alvo/i, 'Target application rate per hectare. Importance: establishes the prescribed material dose. Impact example: increasing the target rate raises row mass flow and roller speed proportionally.'],
                        [/velocidade operacional do trator/i, 'Tractor ground speed. Importance: determines the covered area per unit time. Impact example: increasing tractor speed requires proportionally higher material flow to preserve the hectare dose.'],
                        [/largura de trabalho|espa[cç]amento/i, 'Effective working width assigned to one row. Importance: converts area-based prescription into row mass flow. Impact example: increasing row spacing increases required mass flow per row proportionally.'],
                        [/espessura do disco/i, 'Active disc thickness. Importance: contributes directly to roller displacement per revolution. Impact example: increasing thickness increases displaced volume and reduces required RPM for the same mass flow.'],
                        [/quantidade de discos|discos [uú]teis/i, 'Number of active metering discs. Importance: multiplies roller displacement. Impact example: adding discs increases volume per revolution and lowers required RPM for the same target flow.'],
                        [/cavidades por disco|quantidade de cavidades/i, 'Number of metering cavities on each disc. Importance: multiplies material pockets per revolution. Impact example: more cavities increase displacement and smooth delivery pulses.'],
                        [/área lateral da cavidade|tamanho da.*colher/i, 'Effective lateral area of one metering cavity. Importance: controls material volume captured per cavity. Impact example: increasing area raises displacement per revolution; decreasing it requires higher RPM.'],
                        [/densidade do material s[oó]lido/i, 'Bulk material density. Importance: converts roller volume into transported mass. Impact example: increasing density reduces the RPM needed for the same mass flow; decreasing density increases it.'],
                        [/volume integral|volume.*rolo|cilindrada/i, 'Useful roller volume displaced per revolution. Importance: links roller geometry to delivered mass. Impact example: increasing this volume lowers required RPM for a fixed mass target.'],
                        [/rota[cç][aã]o.*dosador|rota[cç][aã]o alvo/i, 'Metering roller rotational speed. Importance: controls delivered volume per minute. Impact example: increasing RPM raises material flow approximately proportionally when filling remains constant.'],
                        [/tens[aã]o cont[ií]nua|tens[aã]o da bateria|tens[aã]o nominal/i, 'DC supply voltage. Importance: combines with current to determine electrical input power. Impact example: increasing voltage increases available power at the same current.'],
                        [/corrente m[aá]xima|corrente exigida|corrente el[eé]trica/i, 'Electrical current. Importance: determines conductor and winding thermal loading and contributes directly to electrical power. Impact example: increasing current raises power linearly and resistive heating approximately with its square.'],
                        [/efici[eê]ncia.*motor|efici[eê]ncia eletromec[aâ]nica/i, 'Motor efficiency, expressed as useful mechanical output divided by electrical input. Importance: defines conversion losses. Impact example: increasing efficiency raises shaft power for the same voltage and current.'],
                        [/efici[eê]ncia.*transmiss[aã]o|efici[eê]ncia.*redutor|perdas da caixa/i, 'Mechanical transmission efficiency. Importance: accounts for gearbox friction losses. Impact example: increasing efficiency reduces input power required for the same output demand.'],
                        [/pot[eê]ncia [uú]til m[aá]xima|pot[eê]ncia [uú]til teto/i, 'Maximum useful mechanical power available at the shaft. Importance: defines the continuous operating limit. Impact example: a required power above this value indicates overload or stall risk.'],
                        [/pot[eê]ncia requerida|pot[eê]ncia mec[aâ]nica requerida|pot[eê]ncia exigida/i, 'Mechanical power required by the current operating point. Importance: it is compared with available shaft power. Impact example: increasing mass flow or material specific energy raises this demand.'],
                        [/di[aâ]metro prim[aá]rio|di[aâ]metro em polegadas|di[aâ]metro base/i, 'Internal primary-duct diameter. Importance: sets cross-sectional area and strongly affects velocity and friction loss. Impact example: increasing diameter reduces velocity and Darcy-Weisbach loss at the same flow.'],
                        [/área prim[aá]ria|área transversal interna|se[cç][aã]o transversal/i, 'Primary-duct cross-sectional area. Importance: converts volumetric flow into air velocity. Impact example: increasing area lowers velocity for the same flow rate.'],
                        [/vaz[aã]o.*duto prim[aá]rio|vaz[aã]o prim[aá]ria|vaz[aã]o isolada/i, 'Volumetric airflow through one primary duct. Importance: supplies its distribution tower. Impact example: increasing this flow raises primary velocity and dynamic pressure.'],
                        [/velocidade prim[aá]ria|velocidade bruta prim[aá]ria/i, 'Mean air velocity in a primary duct. Importance: determines transport capacity and dynamic pressure. Impact example: increasing velocity improves entrainment but raises friction loss approximately with velocity squared.'],
                        [/raz[aã]o de carregamento.*duto|slr.*trecho 1/i, 'Primary solids loading ratio: solid mass flow divided by air mass flow. Importance: indicates pneumatic transport severity. Impact example: increasing SLR raises corrected pressure loss and clogging risk.'],
                        [/fator.*darcy|atrito friccional|atrito da parede/i, 'Darcy friction factor. Importance: represents wall-friction resistance in the duct. Impact example: doubling this factor doubles the Darcy-Weisbach friction-loss component when other variables remain fixed.'],
                        [/comprimento.*prim[aá]ri|extens[aã]o.*prim[aá]ri/i, 'Primary-duct length. Importance: pressure loss accumulates along the wall-contact distance. Impact example: doubling length doubles the distributed friction loss at unchanged flow conditions.'],
                        [/perda distribu[ií]da prim[aá]ria|resist[eê]ncia acumulada prim[aá]ria/i, 'Distributed pressure loss along the primary duct. Importance: reduces pressure available at the tower. Impact example: increasing friction factor, length, density, or velocity increases this loss.'],
                        [/coeficiente.*torre|fator k/i, 'Tower local-loss coefficient K. Importance: represents turbulence and direction-change losses. Impact example: increasing K increases tower pressure loss proportionally.'],
                        [/perda localizada.*torre|sangria.*torre/i, 'Local pressure loss through the distribution tower. Importance: reduces pressure available to secondary rows. Impact example: increasing K or primary velocity increases this loss.'],
                        [/área secund[aá]ria|canal secund[aá]rio/i, 'Secondary-hose cross-sectional area. Importance: converts row airflow into hose velocity. Impact example: increasing diameter increases area and lowers velocity at unchanged flow.'],
                        [/vaz[aã]o por linha|vaz[aã]o secund[aá]ria|vaz[aã]o integral atuante/i, 'Volumetric airflow assigned to one secondary row. Importance: determines final transport velocity. Impact example: increasing row flow raises velocity and pressure loss.'],
                        [/velocidade secund[aá]ria|velocidade final de arraste/i, 'Actual air velocity in a secondary hose. Importance: must sustain particle transport to the outlet. Impact example: increasing velocity improves suspension but raises Darcy-Weisbach loss approximately with velocity squared.'],
                        [/raz[aã]o de carregamento.*mangueira|slr.*secund/i, 'Secondary solids loading ratio: row solid mass flow divided by row air mass flow. Importance: indicates final-hose transport severity. Impact example: increasing SLR raises corrected loss and clogging risk.'],
                        [/comprimento.*secund|extens[aã]o.*mangueira/i, 'Secondary-hose length. Importance: determines the distance over which wall friction accumulates. Impact example: doubling length doubles distributed loss at unchanged conditions.'],
                        [/perda distribu[ií]da secund[aá]ria|atrito.*tubula[cç][aã]o/i, 'Distributed pressure loss along a secondary hose. Importance: determines pressure remaining at the application point. Impact example: increasing length, friction factor, density, or velocity increases this loss.'],
                        [/densidade.*ar|densidade termodin[aâ]mica|pesagem do vapor|densidade natural/i, 'Air density used in dynamic-pressure and air-mass-flow calculations. Importance: links velocity to pressure and solids loading. Impact example: increasing density raises dynamic pressure at the same velocity.'],
                        [/fator de acoplamento|redu[cç][aã]o de vaz[aã]o/i, 'Turbine flow-coupling factor after backpressure. Importance: scales nominal flow to actual operating flow. Impact example: higher total pressure loss reduces this factor and delivered airflow.'],
                        [/press[aã]o fechada|press[aã]o.*m[aá]xima/i, 'Maximum turbine static pressure at shutoff. Importance: defines the backpressure limit of the simplified fan curve. Impact example: increasing this capacity preserves more airflow for the same network loss.'],
                        [/vaz[aã]o total real|vaz[aã]o.*trabalho/i, 'Actual total turbine airflow after network backpressure. Importance: feeds all primary and secondary branches. Impact example: increasing the coupling factor or nominal turbine flow increases actual flow.'],
                        [/tempo de voo|tempo de queda/i, 'Seed flight time from deflector to ground. Importance: determines longitudinal and lateral travel. Impact example: increasing flight time increases traveled distance at unchanged velocity.'],
                        [/gravidade/i, 'Standard gravitational acceleration. Importance: controls vertical seed motion and flight time. Impact example: increasing gravity shortens flight time and reduces travel distance.'],
                        [/coeficiente.*restitui[cç][aã]o|restitui[cç][aã]o/i, 'Impact restitution coefficient. Importance: defines the fraction of speed retained after striking the deflector. Impact example: increasing it raises rebound speed and spreading distance.'],
                        [/raio de curvatura/i, 'Deflector curvature radius. Importance: controls the lateral escape angle. Impact example: reducing the radius increases curvature and lateral spreading for the same tube diameter.'],
                        [/altura da chapa/i, 'Vertical distance from deflector to ground. Importance: affects seed flight time. Impact example: increasing height increases flight time and potential spreading.']
                    ];
                    const caso = casos.find(([padrao]) => padrao.test(descricao));
                    if (caso) return `${unidade || '[unit defined by the variable]'} ${caso[1]}`;
                    console.warn(`[i18n-formula] Tooltip sem tradução específica: ${simbolo} :: ${descricao}`);
                    return `${unidade || '[unit defined by the variable]'} ${simbolo}. Definition: engineering term used in the displayed relationship. Importance and impact must be verified from the linked technical reference.`;
                }

                const chavesPorSimbolo = {
                    'V_r': 'volumeRolo',
                    '\\dot{m}_{linha}': 'massaLinha',
                    '\\dot{m}_{total}': 'massaTotal',
                    'N_r': 'rotacaoDosador',
                    'Q_{total,real}': 'vazaoTotal',
                    'Q_{prim}': 'vazaoPrimaria',
                    'A_{prim}': 'areaPrimaria',
                    'v_{prim}': 'velocidadePrimaria',
                    'SLR_{prim}': 'slrPrimario',
                    '\\Delta P_{prim}': 'perdaPrimaria',
                    '\\Delta P_{torre}': 'perdaTorre',
                    'A_{sec}': 'areaSecundaria',
                    'Q_{sec}': 'vazaoSecundaria',
                    'v_{sec}': 'velocidadeSecundaria',
                    'SLR_{sec}': 'slrSecundario',
                    '\\Delta P_{sec}': 'perdaSecundaria',
                    '\\Delta P_{total}': 'perdaTotal',
                    'f': 'fatorAcoplamento'
                };

                let resultado = '';
                let cursor = 0;
                while (cursor < traduzido.length) {
                    const inicioTexttip = traduzido.indexOf(prefixo, cursor);
                    if (inicioTexttip < 0) {
                        resultado += traduzido.slice(cursor);
                        break;
                    }

                    resultado += traduzido.slice(cursor, inicioTexttip);
                    const inicioSimbolo = inicioTexttip + prefixo.length - 1;
                    const simbolo = lerGrupoBalanceado(traduzido, inicioSimbolo);
                    if (!simbolo || traduzido[simbolo.fim] !== '{') {
                        resultado += prefixo;
                        cursor = inicioTexttip + prefixo.length;
                        continue;
                    }

                    const descricao = lerGrupoBalanceado(traduzido, simbolo.fim);
                    if (!descricao) {
                        resultado += prefixo;
                        cursor = inicioTexttip + prefixo.length;
                        continue;
                    }

                    let textoTooltip = descricao.conteudo;
                    if (portuguesVisivel.test(textoTooltip)) {
                        textoTooltip = criarTooltipEspecificoEmIngles(simbolo.conteudo, textoTooltip);
                    }

                    const textoTip = `${prefixo}${simbolo.conteudo}}{${textoTooltip}}`;
                    resultado += textoTip;
                    cursor = descricao.fim;
                }
                return resultado;
            }

            function lerValorSincronizado(rangeId) {
                const range = document.getElementById(rangeId);
                if (!range) return NaN;
                const number = range.parentElement?.querySelector('input[type="number"]');
                const valorNumero = number ? normalizarValorNumerico(number.value) : NaN;
                if (!Number.isNaN(valorNumero)) return valorNumero;
                const valorRange = parseFloat(range.value);
                return Number.isNaN(valorRange) ? NaN : valorRange;
            }

            function ehEntradaNumericaParcial(valorTexto) {
                if (typeof valorTexto !== 'string') return false;
                const texto = valorTexto.trim();
                return texto.endsWith(',') || texto.endsWith('.') || texto === '-' || texto === '';
            }

            function contarCasasDecimais(valorTexto) {
                const texto = normalizarTextoNumerico(valorTexto);
                if (!texto.includes('.')) return 0;
                return texto.split('.')[1].length;
            }

            function ajustarPrecisaoDoRange(range, number, valorTexto) {
                const casasDecimais = contarCasasDecimais(valorTexto);
                if (casasDecimais <= 0) return;

                const passoAtual = normalizarTextoNumerico(range.step || '1');
                const passoAtualDecimais = contarCasasDecimais(passoAtual);
                if (casasDecimais <= passoAtualDecimais) return;

                const novoStep = (1 / Math.pow(10, casasDecimais)).toFixed(casasDecimais);
                range.step = novoStep;
                if (number) number.step = novoStep;
            }

            document.querySelectorAll('.control-group').forEach(group => {
                const range = group.querySelector('input[type="range"]');
                const number = group.querySelector('input[type="number"]');
                if (range && number) {
                    range.addEventListener('input', (e) => { 
                        const valor = parseFloat(e.target.value);
                        number.value = e.target.value;
                        ajustarFaixaDinamica(range, valor);
                        number.min = range.min;
                        number.max = range.max;
                        dispararAtualizacaoBaseadoNoPainel(e.target);
                    });
                    number.addEventListener('input', (e) => { 
                        const valorTexto = e.target.value;
                        const valor = normalizarValorNumerico(valorTexto);
                        if (Number.isNaN(valor)) return;
                        ajustarPrecisaoDoRange(range, number, valorTexto);
                        range.value = normalizarTextoNumerico(valorTexto);
                        ajustarFaixaDinamica(range, valor);
                        number.min = range.min;
                        number.max = range.max;
                        dispararAtualizacaoBaseadoNoPainel(e.target);
                    });
                    number.addEventListener('blur', (e) => {
                        const valorTexto = e.target.value;
                        if (ehEntradaNumericaParcial(valorTexto)) {
                            e.target.value = range.value;
                            return;
                        }

                        const valor = normalizarValorNumerico(valorTexto);
                        if (Number.isNaN(valor)) {
                            e.target.value = range.value;
                            return;
                        }

                        e.target.value = normalizarTextoNumerico(valorTexto);
                    });
                }
            });
            document.querySelectorAll('#sidebar-ph input[type="text"], #sidebar-ph input[type="checkbox"]').forEach((input) => {
                input.addEventListener(input.type === 'checkbox' ? 'change' : 'input', () => {
                    if (input.id === 'in_ph_acido_nome') document.getElementById('in_ph_acido_preset').value = 'personalizado';
                    if (input.id === 'in_ph_base_nome') document.getElementById('in_ph_base_preset').value = 'personalizado';
                    salvarEstadoDashboard('ph');
                    persistirEstadoAplicacao();
                    atualizarPh();
                });
            });
            document.querySelectorAll('#in_ph_acido_preset, #in_ph_base_preset').forEach((select) => {
                select.addEventListener('change', () => {
                    aplicarPresetPh(select.value);
                    salvarEstadoDashboard('ph');
                    persistirEstadoAplicacao();
                    atualizarPh();
                });
            });

            // Função helper para descobrir qual dashboard deve ser atualizado
            function dispararAtualizacaoBaseadoNoPainel(elemento) {
                if (dom.sidebar.contains(elemento)) {
                    salvarEstadoDashboard('destorroador');
                    persistirEstadoAplicacao();
                    atualizarDashboard();
                } else if (dom.sidebarDist.contains(elemento)) {
                    salvarEstadoDashboard('distribuidor');
                    persistirEstadoAplicacao();
                    atualizarDistribuidor();
                    // Lógica especial de reiniciar física do Distribuidor Modo 2
                    const modoDistElement = document.querySelector('input[name="modo_dist"]:checked');
                    if (modoDistElement && modoDistElement.value === "2" && ativarAnimacaoDist) {
                        const v0 = parseFloat(dom.distV0.value) || 12;
                        const theta = parseFloat(dom.distAngulo.value) || 30;
                        const h = parseFloat(dom.distAltura.value) || 0.8;
                        const e = parseFloat(dom.distCr.value) || 0.6;
                        inicializarFisicaDistribuidor(theta, v0, h, e);
                    }
                } else if (dom.sidebarPh.contains(elemento)) {
                    const matchPreset = elemento.id.match(/^in_ph_(acido|base)_(ph|conc|eq|pureza)$/);
                    if (matchPreset) document.getElementById(`in_ph_${matchPreset[1]}_preset`).value = 'personalizado';
                    salvarEstadoDashboard('ph');
                    persistirEstadoAplicacao();
                    atualizarPh();
                }
            }

            const radiosModo = document.querySelectorAll('input[name="modo"]');
            radiosModo.forEach(function(radio) {
                radio.addEventListener('change', function() {
                    salvarEstadoDashboard('destorroador');
                    persistirEstadoAplicacao();
                    atualizarDashboard();
                });
            });

            const radiosModoDist = document.querySelectorAll('input[name="modo_dist"]');
            radiosModoDist.forEach(function(radio) { 
                radio.addEventListener('change', function() {
                    salvarEstadoDashboard('distribuidor');
                    persistirEstadoAplicacao();
                    atualizarDistribuidor();
                    // Se mudar para modo 2, inicializar a física
                    if (this.value === "2" && ativarAnimacaoDist) {
                        const v0 = parseFloat(dom.distV0.value) || 12;
                        const theta = parseFloat(dom.distAngulo.value) || 30;
                        const h = parseFloat(dom.distAltura.value) || 0.8;
                        const e = parseFloat(dom.distCr.value) || 0.6;
                        inicializarFisicaDistribuidor(theta, v0, h, e);
                    }
                });
            });

            document.querySelectorAll('input[name="modo_aplicacao_ph"]').forEach((radio) => {
                radio.addEventListener('change', () => {
                    salvarEstadoDashboard('ph');
                    persistirEstadoAplicacao();
                    atualizarPh();
                });
            });
            dom.painelEsqPh.addEventListener('click', (event) => {
                if (event.target.closest('#btn-ph-continuar')) avancarEtapaPh(2);
                if (event.target.closest('#btn-ph-voltar-config')) avancarEtapaPh(1);
                if (event.target.closest('#btn-ph-iniciar')) iniciarNovoControlePh();
                if (event.target.closest('#btn-ph-novo')) solicitarNovoControlePh();
                if (event.target.closest('#btn-ph-acao')) executarAcaoControlePh();
                if (event.target.closest('#btn-ph-resultados')) avancarEtapaPh(4);
                if (event.target.closest('#btn-ph-voltar-ciclos')) avancarEtapaPh(3);
            });

            dom.stateButtons.forEach((button) => {
                button.addEventListener('click', function() {
                    trocarPerfilDashboard(this.dataset.dashboard, this.dataset.profile);
                });
            });

            dom.resetButtons.forEach((button) => {
                button.addEventListener('click', function() {
                    abrirConfirmacaoReset(this.dataset.dashboardReset);
                });
            });

            dom.resetModalCancel?.addEventListener('click', fecharConfirmacaoReset);
            dom.resetModalConfirm?.addEventListener('click', () => {
                if (!resetDashboardPendente) return;
                const dashboardKey = resetDashboardPendente;
                fecharConfirmacaoReset();
                resetarDashboard(dashboardKey);
            });
            dom.resetModal?.addEventListener('click', (event) => {
                if (event.target === dom.resetModal) {
                    fecharConfirmacaoReset();
                }
            });
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && !dom.resetModal?.classList.contains('hidden')) {
                    fecharConfirmacaoReset();
                }
            });

            configurarSeletoresGraficoDist();
            Object.keys(dashboardProfiles).forEach((dashboardKey) => {
                const snapshotInicial = capturarEstadoDashboard(dashboardProfiles[dashboardKey].container);
                dashboardProfileKeys.forEach((profileKey) => {
                    dashboardProfiles[dashboardKey].profiles[profileKey] = clonarEstrutura(snapshotInicial);
                });
                dashboardDefaults[dashboardKey] = {
                    activeProfile: 'minimo_a',
                    profiles: dashboardProfileKeys.reduce((acc, profileKey) => {
                        acc[profileKey] = clonarEstrutura(snapshotInicial);
                        return acc;
                    }, {})
                };
                atualizarBotoesDashboard(dashboardKey);
            });

            restaurarEstadoPersistido();
            configurarTema();
            configurarIdioma();
            configurarSidebars();
            configurarTooltipsInstantaneos();

            // --- NAVEGAÇÃO ENTRE TELAS ---
            function irParaHome() {
                dom.sidebar.classList.add('hidden');
                dom.mainContent.classList.add('hidden');
                dom.sidebarDist.classList.add('hidden');
                dom.mainDist.classList.add('hidden');
                dom.sidebarPh.classList.add('hidden');
                dom.mainPh.classList.add('hidden');
                dom.homeScreen.classList.remove('hidden');
            }

            dom.btnDestorroador.addEventListener('click', function() {
                console.log('Clicou em Destorroador');
                try {
                    dom.homeScreen.classList.add('hidden');
                    dom.sidebar.classList.remove('hidden');
                    dom.mainContent.classList.remove('hidden');
                    setTimeout(redimensionarCanvas, 50);
                    console.log('Destorroador aberto');
                } catch(err) {
                    console.error('Erro ao abrir destorroador:', err);
                }
            });

            dom.btnDistribuidor.addEventListener('click', function() {
                console.log('Clicou em Distribuidor');
                try {
                    console.log('Tentando esconder home');
                    dom.homeScreen.classList.add('hidden');
                    
                    console.log('Tentando mostrar sidebar distribuidor');
                    dom.sidebarDist.classList.remove('hidden');
                    
                    console.log('Tentando mostrar main distribuidor');
                    dom.mainDist.classList.remove('hidden');
                    
                    console.log('Tentando redimensionar canvas');
                    setTimeout(function() {
                        try {
                            redimensionarCanvasDist();
                            console.log('Canvas distribuidor redimensionado');
                            
                            console.log('Tentando atualizar distribuidor');
                            atualizarDistribuidor();
                            console.log('Distribuidor atualizado');
                            
                            // Se estiver em modo 2, inicializar física
                            const modoDistElement = document.querySelector('input[name="modo_dist"]:checked');
                            if (modoDistElement && modoDistElement.value === "2") {
                                console.log('Modo 2 detectado, inicializando física');
                                const v0 = parseFloat(dom.distV0.value) || 12;
                                const theta = parseFloat(dom.distAngulo.value) || 30;
                                const h = parseFloat(dom.distAltura.value) || 0.8;
                                const e = parseFloat(dom.distCr.value) || 0.6;
                                inicializarFisicaDistribuidor(theta, v0, h, e);
                            }
                            console.log('Distribuidor aberto com sucesso!');
                        } catch(err) {
                            console.error('Erro no setTimeout:', err);
                            console.error('Stack:', err.stack);
                        }
                    }, 100);
                } catch(err) {
                    console.error('Erro ao navegar para distribuidor:', err);
                    console.error('Stack:', err.stack);
                    dom.homeScreen.classList.remove('hidden');
                }
            });

            dom.btnPh.addEventListener('click', function() {
                dom.homeScreen.classList.add('hidden');
                dom.sidebarPh.classList.remove('hidden');
                dom.mainPh.classList.remove('hidden');
                setTimeout(redimensionarCanvasPh, 50);
            });

            dom.btnVoltar.addEventListener('click', irParaHome);
            dom.btnVoltarDist.addEventListener('click', irParaHome);
            dom.btnVoltarPh.addEventListener('click', irParaHome);

            // --- LÓGICA MATEMÁTICA E RENDERIZAÇÃO DE INTERFACE ---
            function escaparHtml(valor) {
                return String(valor || '').replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
            }

            function lerPh(id) {
                const valor = lerValorSincronizado(id);
                return Number.isFinite(valor) ? valor : 0;
            }

            const presetsPh = {
                hcl_01: { tipo: 'acido', nome: 'HCl 0,100 mol/L', ph: 1, concentracao: 0.1, equivalentes: 1, pureza: 100 },
                hno3_01: { tipo: 'acido', nome: 'HNO₃ 0,100 mol/L', ph: 1, concentracao: 0.1, equivalentes: 1, pureza: 100 },
                h2so4_01: { tipo: 'acido', nome: 'H₂SO₄ 0,100 mol/L', ph: 0.959, concentracao: 0.1, equivalentes: 2, pureza: 100 },
                naoh_01: { tipo: 'base', nome: 'NaOH 0,100 mol/L', ph: 13, concentracao: 0.1, equivalentes: 1, pureza: 100 },
                koh_01: { tipo: 'base', nome: 'KOH 0,100 mol/L', ph: 13, concentracao: 0.1, equivalentes: 1, pureza: 100 }
            };

            function definirValorControlePh(id, valor) {
                const range = document.getElementById(id);
                if (!range) return;
                range.value = String(valor);
                const number = range.parentElement?.querySelector('input[type="number"]');
                if (number) number.value = String(valor);
            }

            function aplicarPresetPh(chave) {
                const preset = presetsPh[chave];
                if (!preset) return;
                const prefixo = `in_ph_${preset.tipo}_`;
                document.getElementById(`${prefixo}nome`).value = preset.nome;
                definirValorControlePh(`${prefixo}ph`, preset.ph);
                definirValorControlePh(`${prefixo}conc`, preset.concentracao);
                definirValorControlePh(`${prefixo}eq`, preset.equivalentes);
                definirValorControlePh(`${prefixo}pureza`, preset.pureza);
            }

            function criarEstadoControlePh() {
                return {
                    estado: 'pausado',
                    historico: [],
                    doseAcido: 0,
                    doseBase: 0,
                    ciclo: 0,
                    sensibilidade: null,
                    estimativaRestante: null,
                    semRespostaConsecutiva: 0,
                    pendente: null,
                    etapa: 1,
                    erroInterface: ''
                };
            }

            function limitar(valor, minimo, maximo) {
                return Math.min(maximo, Math.max(minimo, valor));
            }

            function iniciarNovoControlePh() {
                controlePh.erroInterface = '';
                const modo = obterModoSelecionado('modo_aplicacao_ph') || 'venturi';
                const hidraulica = calcularRegulacaoPh();
                if (!document.getElementById('in_ph_compatibilidade').checked) {
                    controlePh.erroInterface = textoIdioma('Confirme a compatibilidade química dos materiais antes de iniciar.', 'Confirm material chemical compatibility before starting.');
                    controlePh.etapa = 2;
                    atualizarPh();
                    return;
                }
                if (modo === 'peristaltica' && lerPh('in_ph_bomba_ml_rev') <= 0) {
                    controlePh.erroInterface = textoIdioma('Informe a calibração volumétrica da bomba peristáltica antes de iniciar.', 'Enter the peristaltic pump volumetric calibration before starting.');
                    controlePh.etapa = 2;
                    atualizarPh();
                    return;
                }
                if (!hidraulica.geometriaValida || hidraulica.cavitacao) {
                    controlePh.erroInterface = textoIdioma('Revise a hidráulica avançada: a geometria calculada é inválida ou apresenta risco de cavitação.', 'Review advanced hydraulics: the calculated geometry is invalid or presents cavitation risk.');
                    controlePh.etapa = 2;
                    atualizarPh();
                    return;
                }
                controlePh = criarEstadoControlePh();
                const erro = Math.abs(lerPh('in_ph_atual') - lerPh('in_ph_alvo'));
                controlePh.estado = erro <= lerPh('in_ph_tolerancia') ? 'alvo' : 'pronto';
                controlePh.etapa = controlePh.estado === 'alvo' ? 4 : 3;
                persistirEstadoAplicacao();
                atualizarPh();
            }

            function solicitarNovoControlePh() {
                const possuiDados = controlePh.historico.length > 0 || controlePh.doseAcido > 0 || controlePh.doseBase > 0;
                if (possuiDados && !window.confirm(textoIdioma('Iniciar um novo processo apagará o histórico atual. Deseja continuar?', 'Starting a new process will clear the current history. Continue?'))) return;
                controlePh = criarEstadoControlePh();
                persistirEstadoAplicacao();
                atualizarPh();
            }

            function avancarEtapaPh(etapa) {
                controlePh.erroInterface = '';
                if (etapa === 2) {
                    const erroAtual = Math.abs(lerPh('in_ph_atual') - lerPh('in_ph_alvo'));
                    if (erroAtual <= lerPh('in_ph_tolerancia')) {
                        controlePh.estado = 'alvo';
                        controlePh.etapa = 4;
                        atualizarPh();
                        return;
                    }
                    const produto = lerPh('in_ph_atual') > lerPh('in_ph_alvo') ? 'acido' : 'base';
                    const nome = document.getElementById(`in_ph_${produto}_nome`).value.trim();
                    const volume = lerPh(`in_ph_${produto}_volume`);
                    if (!nome || volume <= 0) {
                        controlePh.erroInterface = textoIdioma('Informe a composição e o volume disponível do reagente necessário antes de continuar.', 'Enter the composition and available volume of the required reagent before continuing.');
                        atualizarPh();
                        return;
                    }
                }
                controlePh.etapa = limitar(etapa, 1, 4);
                persistirEstadoAplicacao();
                atualizarPh();
            }

            function executarAcaoControlePh() {
                if (controlePh.estado === 'pausado' || ['insuficiente', 'sem_resposta', 'tendencia'].includes(controlePh.estado)) {
                    if (controlePh.estado === 'insuficiente') {
                        const reavaliacao = calcularRegulacaoPh();
                        controlePh.estado = reavaliacao.estimativaRestante !== null && reavaliacao.estimativaRestante > reavaliacao.volumeDisponivel ? 'insuficiente' : 'pronto';
                    } else {
                        controlePh.estado = 'pronto';
                    }
                    persistirEstadoAplicacao();
                    atualizarPh();
                    return;
                }

                if (controlePh.estado === 'pronto') {
                    const r = calcularRegulacaoPh();
                    if (!r.produto || r.proximoPulso <= 0) return;
                    if (r.proximoPulso > r.volumeDisponivel) {
                        controlePh.estado = 'insuficiente';
                    } else if (r.doseAcumulada + r.proximoPulso > r.doseMaxima) {
                        controlePh.estado = 'limite';
                    } else if (controlePh.ciclo >= r.ciclosMaximos) {
                        controlePh.estado = 'ciclos';
                    } else {
                        controlePh.pendente = {
                            ciclo: controlePh.ciclo + 1,
                            phInicial: r.phAtual,
                            produto: r.produto,
                            volume: r.proximoPulso
                        };
                        if (r.produto === 'acido') controlePh.doseAcido += r.proximoPulso;
                        else controlePh.doseBase += r.proximoPulso;
                        controlePh.estado = 'dosando';
                    }
                } else if (controlePh.estado === 'dosando') {
                    controlePh.estado = 'misturando';
                } else if (controlePh.estado === 'misturando') {
                    controlePh.estado = 'estabilizando';
                } else if (controlePh.estado === 'estabilizando' && controlePh.pendente) {
                    const campoLeitura = document.getElementById('in_ph_nova_leitura');
                    const phFinal = campoLeitura ? normalizarValorNumerico(campoLeitura.value) : NaN;
                    if (!Number.isFinite(phFinal) || phFinal < 0 || phFinal > 14) {
                        controlePh.erroInterface = textoIdioma('Informe uma nova leitura de pH válida entre 0 e 14.', 'Enter a valid new pH reading between 0 and 14.');
                        atualizarPh();
                        return;
                    }
                    definirValorControlePh('in_ph_atual', phFinal);
                    controlePh.erroInterface = '';
                    const pendente = controlePh.pendente;
                    const deltaPh = phFinal - pendente.phInicial;
                    const sensibilidade = Math.abs(deltaPh) / pendente.volume;
                    const respostaMinima = lerPh('in_ph_variacao_min');
                    const direcaoCorreta = pendente.produto === 'acido' ? deltaPh < 0 : deltaPh > 0;
                    controlePh.historico.push({ ...pendente, phFinal, deltaPh, sensibilidade });
                    controlePh.ciclo = pendente.ciclo;
                    controlePh.pendente = null;

                    const erro = Math.abs(phFinal - lerPh('in_ph_alvo'));
                    if (erro <= lerPh('in_ph_tolerancia')) {
                        controlePh.estado = 'alvo';
                        controlePh.etapa = 4;
                    } else if (Math.abs(deltaPh) < respostaMinima) {
                        controlePh.semRespostaConsecutiva += 1;
                        controlePh.estado = controlePh.semRespostaConsecutiva >= Math.round(lerPh('in_ph_sem_resposta_max')) ? 'sem_resposta' : 'pronto';
                    } else if (!direcaoCorreta) {
                        controlePh.estado = 'tendencia';
                    } else {
                        controlePh.semRespostaConsecutiva = 0;
                        controlePh.sensibilidade = sensibilidade;
                        const produtoSeguinte = phFinal > lerPh('in_ph_alvo') ? 'acido' : 'base';
                        const usadoSeguinte = produtoSeguinte === 'acido' ? controlePh.doseAcido : controlePh.doseBase;
                        const disponivelSeguinte = Math.max(0, lerPh(`in_ph_${produtoSeguinte}_volume`) - usadoSeguinte);
                        const estimativaSeguinte = erro / sensibilidade;
                        if (estimativaSeguinte > disponivelSeguinte) controlePh.estado = 'insuficiente';
                        else controlePh.estado = controlePh.ciclo >= lerPh('in_ph_ciclos_max') ? 'ciclos' : 'pronto';
                    }
                }

                persistirEstadoAplicacao();
                atualizarPh();
            }

            function calcularRegulacaoPh() {
                const phAtual = lerPh('in_ph_atual');
                const phAlvo = lerPh('in_ph_alvo');
                const tolerancia = lerPh('in_ph_tolerancia');
                const erro = phAlvo - phAtual;
                const alvoAtingido = Math.abs(erro) <= tolerancia;
                const produto = alvoAtingido ? null : (erro < 0 ? 'acido' : 'base');
                const pulsoMinimo = lerPh('in_ph_pulso_min');
                const pulsoMaximo = Math.max(pulsoMinimo, lerPh('in_ph_pulso_max'));
                const pulsoInicial = limitar(lerPh('in_ph_pulso_inicial'), pulsoMinimo, pulsoMaximo);
                const fatorAproximacao = lerPh('in_ph_fator_aproximacao') / 100;
                const estimativaRestante = controlePh.sensibilidade > 0 ? Math.abs(erro) / controlePh.sensibilidade : null;
                const pulsoAdaptativo = estimativaRestante === null ? pulsoInicial : estimativaRestante * fatorAproximacao;
                const proximoPulso = alvoAtingido ? 0 : limitar(pulsoAdaptativo, pulsoMinimo, pulsoMaximo);
                const pulsoHidraulico = controlePh.pendente?.volume || proximoPulso;
                const usadoProduto = produto === 'acido' ? controlePh.doseAcido : controlePh.doseBase;
                const volumeOriginal = produto ? lerPh(`in_ph_${produto}_volume`) : 0;
                const volumeDisponivel = Math.max(0, volumeOriginal - usadoProduto);
                const doseAcumulada = controlePh.doseAcido + controlePh.doseBase;
                const doseMaxima = lerPh('in_ph_dose_max');
                const ciclosMaximos = Math.round(lerPh('in_ph_ciclos_max'));
                const tempoAplicacao = lerPh('in_ph_tempo');
                const vazaoProdutoLMin = tempoAplicacao > 0 ? pulsoHidraulico / tempoAplicacao : 0;
                const qProduto = vazaoProdutoLMin / 60000;
                const diamMangueira = lerPh('in_ph_mangueira_diam') / 1000;
                const areaMangueira = Math.PI * diamMangueira * diamMangueira / 4;
                const velProduto = areaMangueira > 0 ? qProduto / areaMangueira : 0;
                const densidadeProduto = lerPh('in_ph_densidade_produto');
                const viscosidade = lerPh('in_ph_viscosidade') / 1000;
                const reynoldsProduto = viscosidade > 0 ? densidadeProduto * velProduto * diamMangueira / viscosidade : 0;
                const perdaMangueira = diamMangueira > 0
                    ? lerPh('in_ph_fator_atrito') * (lerPh('in_ph_mangueira_comp') / diamMangueira) * densidadeProduto * velProduto ** 2 / 2
                    : 0;
                const pressaoEstatica = densidadeProduto * GRAVIDADE_PADRAO * lerPh('in_ph_altura_succao');
                const pressaoCinetica = densidadeProduto * velProduto ** 2 / 2;
                const modoAplicacao = obterModoSelecionado('modo_aplicacao_ph') || 'venturi';
                const pressaoBomba = Math.max(0, perdaMangueira + pressaoEstatica + pressaoCinetica);
                const vacuoNecessario = modoAplicacao === 'venturi' ? pressaoBomba : 0;
                const pressaoGargantaGauge = -vacuoNecessario;
                const calibracaoBomba = lerPh('in_ph_bomba_ml_rev');
                const rpmBomba = modoAplicacao === 'peristaltica' && calibracaoBomba > 0
                    ? vazaoProdutoLMin * 1000 / calibracaoBomba
                    : 0;

                const vazaoLinha = lerPh('in_ph_vazao_linha') / 60000;
                const diamLinha = lerPh('in_ph_diametro_linha') / 1000;
                const areaLinha = Math.PI * diamLinha ** 2 / 4;
                const velEntrada = areaLinha > 0 ? vazaoLinha / areaLinha : 0;
                const pressaoEntrada = lerPh('in_ph_pressao_entrada') * 100000;
                const pressaoSaida = lerPh('in_ph_pressao_saida') * 100000;
                const densidadeAgua = 1000;
                const termoVelocidade = velEntrada ** 2 + 2 * (pressaoEntrada - pressaoGargantaGauge) / densidadeAgua;
                const velGarganta = termoVelocidade > 0 ? Math.sqrt(termoVelocidade) : 0;
                const areaGarganta = velGarganta > 0 ? vazaoLinha / velGarganta : 0;
                const diamGarganta = areaGarganta > 0 ? Math.sqrt(4 * areaGarganta / Math.PI) : 0;
                const beta = diamLinha > 0 ? diamGarganta / diamLinha : 0;
                const angConv = lerPh('in_ph_angulo_convergente') * Math.PI / 180;
                const angDif = lerPh('in_ph_angulo_difusor') * Math.PI / 180;
                const compConvergente = angConv > 0 ? (diamLinha - diamGarganta) / (2 * Math.tan(angConv / 2)) : 0;
                const compDifusor = angDif > 0 ? (diamLinha - diamGarganta) / (2 * Math.tan(angDif / 2)) : 0;
                const compGarganta = lerPh('in_ph_garganta_rel') * diamGarganta;
                const temperatura = lerPh('in_ph_temperatura');
                const temperaturaK = temperatura + 273.15;
                const ant = temperaturaK <= 303
                    ? { a: 5.40221, b: 1838.675, c: -31.737 }
                    : (temperaturaK <= 333 ? { a: 5.20389, b: 1733.926, c: -39.485 } : { a: 5.0768, b: 1659.793, c: -45.854 });
                const pressaoVapor = Math.pow(10, ant.a - ant.b / (temperaturaK + ant.c)) * 100000;
                const pressaoAbsolutaGarganta = 101325 + pressaoGargantaGauge;
                const cavitacao = pressaoAbsolutaGarganta <= pressaoVapor;
                const geometriaValida = diamGarganta > 0 && diamGarganta < diamLinha && pressaoEntrada >= pressaoSaida && pressaoAbsolutaGarganta > 0;

                return {
                    phAtual, phAlvo, tolerancia, erro, alvoAtingido, produto, proximoPulso, pulsoHidraulico,
                    estimativaRestante, volumeDisponivel, doseAcumulada, doseMaxima, ciclosMaximos, tempoAplicacao,
                    vazaoProdutoLMin, velProduto, reynoldsProduto, perdaMangueira, pressaoEstatica, pressaoBomba,
                    modoAplicacao, vacuoNecessario, pressaoGargantaGauge, calibracaoBomba, rpmBomba, diamLinha,
                    velEntrada, pressaoEntrada, pressaoSaida, velGarganta, diamGarganta, beta, compConvergente,
                    compDifusor, compGarganta, pressaoVapor, pressaoAbsolutaGarganta, cavitacao, geometriaValida,
                    temperatura, ant, fatorAproximacao
                };
            }

            function textoEstadoControlePh(estado) {
                const estados = {
                    pausado: textoIdioma('Processo pausado', 'Process paused'),
                    pronto: textoIdioma('Pulso pronto para aplicação', 'Pulse ready for application'),
                    dosando: controlePh.pendente?.produto === 'acido' ? textoIdioma('Dosando ácido', 'Dosing acid') : textoIdioma('Dosando base', 'Dosing base'),
                    misturando: textoIdioma('Mistura em andamento', 'Mixing in progress'),
                    estabilizando: textoIdioma('Aguardando leitura estabilizada', 'Waiting for stabilized reading'),
                    alvo: textoIdioma('pH alvo atingido', 'Target pH reached'),
                    insuficiente: textoIdioma('Produto insuficiente', 'Insufficient product'),
                    limite: textoIdioma('Dose acumulada máxima atingida', 'Maximum cumulative dose reached'),
                    ciclos: textoIdioma('Número máximo de ciclos atingido', 'Maximum cycle count reached'),
                    sem_resposta: textoIdioma('Sensor sem resposta mensurável', 'No measurable sensor response'),
                    tendencia: textoIdioma('pH moveu-se na direção contrária', 'pH moved in the opposite direction')
                };
                return estados[estado] || estado;
            }

            function textoAcaoControlePh() {
                if (controlePh.estado === 'pronto') return textoIdioma('Iniciar aplicação do pulso', 'Start pulse application');
                if (controlePh.estado === 'dosando') return textoIdioma('Já apliquei o pulso', 'I applied the pulse');
                if (controlePh.estado === 'misturando') return textoIdioma('Mistura concluída', 'Mixing completed');
                if (controlePh.estado === 'estabilizando') return textoIdioma('Registrar leitura e calcular próximo pulso', 'Record reading and calculate next pulse');
                if (['pausado', 'insuficiente', 'sem_resposta', 'tendencia'].includes(controlePh.estado)) return textoIdioma('Retomar controle', 'Resume control');
                return '';
            }

            function desenharRegulacaoPh(r) {
                const canvasPh = document.getElementById('phCanvas');
                if (!canvasPh) return;
                const c = canvasPh.getContext('2d');
                const estilos = getComputedStyle(document.body);
                const fundo = estilos.getPropertyValue('--canvas-bg').trim();
                const texto = estilos.getPropertyValue('--text-main').trim();
                const muted = estilos.getPropertyValue('--text-muted').trim();
                const border = estilos.getPropertyValue('--border').trim();
                const accent = estilos.getPropertyValue('--accent').trim();
                const success = estilos.getPropertyValue('--success').trim();
                const error = estilos.getPropertyValue('--error').trim();
                c.clearRect(0, 0, canvasPh.width, canvasPh.height);
                c.fillStyle = fundo; c.fillRect(0, 0, canvasPh.width, canvasPh.height);
                c.strokeStyle = border; c.globalAlpha = 0.35;
                for (let x = 40; x < canvasPh.width; x += 50) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, canvasPh.height); c.stroke(); }
                c.globalAlpha = 1;

                const tanqueX = Math.max(42, canvasPh.width * 0.08);
                const tanqueY = 45;
                const tanqueW = Math.min(245, canvasPh.width * 0.3);
                const tanqueH = 195;
                c.strokeStyle = texto; c.lineWidth = 3; c.strokeRect(tanqueX, tanqueY, tanqueW, tanqueH);
                const nivel = limitar(r.phAtual / 14, 0, 1);
                c.fillStyle = r.alvoAtingido ? success : error; c.globalAlpha = 0.25;
                c.fillRect(tanqueX + 4, tanqueY + 4 + tanqueH * (1 - nivel), tanqueW - 8, Math.max(0, tanqueH * nivel - 4));
                c.globalAlpha = 1; c.fillStyle = texto; c.font = 'bold 14px monospace';
                c.fillText(textoIdioma('TANQUE', 'TANK'), tanqueX + 12, tanqueY + 22);
                c.font = 'bold 22px monospace'; c.fillText(`pH ${r.phAtual.toFixed(2)}`, tanqueX + 12, tanqueY + 52);
                c.fillStyle = muted; c.font = '11px monospace';
                c.fillText(`${textoIdioma('ALVO', 'TARGET')} ${r.phAlvo.toFixed(2)} ± ${r.tolerancia.toFixed(2)}`, tanqueX + 12, tanqueY + 72);
                c.fillText(`${textoIdioma('CICLO', 'CYCLE')} ${controlePh.ciclo}/${r.ciclosMaximos}`, tanqueX + 12, tanqueY + 92);

                const x0 = tanqueX + tanqueW + 55;
                const x3 = canvasPh.width - 45;
                const y = canvasPh.height * 0.55;
                const x1 = x0 + (x3 - x0) * 0.3;
                const x2 = x1 + Math.max(30, (x3 - x0) * 0.12);
                const gargantaR = Math.max(8, Math.min(38, 55 * Math.max(0.1, r.beta)));
                c.beginPath(); c.moveTo(x0, y - 38); c.lineTo(x1, y - gargantaR); c.lineTo(x2, y - gargantaR); c.lineTo(x3, y - 38);
                c.lineTo(x3, y + 38); c.lineTo(x2, y + gargantaR); c.lineTo(x1, y + gargantaR); c.lineTo(x0, y + 38); c.closePath();
                c.strokeStyle = accent; c.lineWidth = 3; c.stroke(); c.fillStyle = accent; c.globalAlpha = 0.12; c.fill(); c.globalAlpha = 1;
                c.fillStyle = texto; c.font = 'bold 13px monospace'; c.fillText(textoIdioma('VENTURI E DOSAGEM', 'VENTURI AND DOSING'), x0, y - 60);
                c.fillStyle = muted; c.font = '11px monospace';
                c.fillText(`d ${(r.diamGarganta * 1000).toFixed(2)} mm`, x1, y + 60);
                c.fillText(`P ${(r.pressaoGargantaGauge / 100000).toFixed(3)} bar(g)`, x1, y - 48);
                c.strokeStyle = r.produto ? accent : muted; c.beginPath(); c.moveTo((x1 + x2) / 2, y + gargantaR); c.lineTo((x1 + x2) / 2, y + 92); c.stroke();
                c.fillStyle = texto; c.font = 'bold 11px monospace';
                c.fillText(textoEstadoControlePh(controlePh.estado).toUpperCase(), x0, canvasPh.height - 18);

                const grafX = Math.max(x0, canvasPh.width - 235);
                const grafY = 18;
                const grafW = 190;
                const grafH = 58;
                c.strokeStyle = border; c.lineWidth = 1; c.strokeRect(grafX, grafY, grafW, grafH);
                c.fillStyle = muted; c.font = '10px monospace';
                c.fillText(textoIdioma('APROXIMAÇÃO AO ALVO', 'APPROACH TO TARGET'), grafX + 6, grafY + 12);
                const pontos = controlePh.historico.map((item) => item.phFinal);
                if (pontos.length) {
                    const todos = [r.phAlvo, ...pontos];
                    const minPh = Math.min(...todos) - 0.1;
                    const maxPh = Math.max(...todos) + 0.1;
                    const escalaY = (valor) => grafY + grafH - 5 - ((valor - minPh) / Math.max(maxPh - minPh, 0.01)) * (grafH - 22);
                    c.strokeStyle = success; c.setLineDash([4, 3]); c.beginPath(); c.moveTo(grafX + 5, escalaY(r.phAlvo)); c.lineTo(grafX + grafW - 5, escalaY(r.phAlvo)); c.stroke(); c.setLineDash([]);
                    c.strokeStyle = accent; c.lineWidth = 2; c.beginPath();
                    pontos.forEach((valor, indice) => {
                        const px = grafX + 7 + indice * (grafW - 14) / Math.max(pontos.length - 1, 1);
                        const py = escalaY(valor);
                        if (indice === 0) c.moveTo(px, py); else c.lineTo(px, py);
                    });
                    c.stroke();
                }
            }

            function montarLinhasHistoricoPh() {
                return controlePh.historico.map((item, indice) => `<tr class="${indice === controlePh.historico.length - 1 ? 'latest' : ''}"><td>${item.ciclo}</td><td>${item.phInicial.toFixed(3)}</td><td>${item.produto === 'acido' ? textoIdioma('Ácido', 'Acid') : textoIdioma('Base', 'Base')}</td><td>${item.volume.toFixed(4)} L</td><td>${item.phFinal.toFixed(3)}</td><td>${item.sensibilidade.toFixed(4)}</td></tr>`).join('');
            }

            function montarTabelaHistoricoPh() {
                const linhas = montarLinhasHistoricoPh();
                return `<div class="history-table-wrap"><table class="history-table"><thead><tr><th>#</th><th>pH ${textoIdioma('inicial', 'initial')}</th><th>${textoIdioma('Produto', 'Product')}</th><th>${textoIdioma('Volume', 'Volume')}</th><th>pH ${textoIdioma('final', 'final')}</th><th>ΔpH/ΔV</th></tr></thead><tbody>${linhas || `<tr><td colspan="6">${textoIdioma('Nenhum ciclo registrado.', 'No cycle recorded.')}</td></tr>`}</tbody></table></div>`;
            }

            function atualizarEtapaVisualPh() {
                const etapa = limitar(controlePh.etapa || 1, 1, 4);
                document.querySelectorAll('[data-ph-sidebar-step]').forEach((painel) => {
                    painel.classList.toggle('hidden', Number(painel.dataset.phSidebarStep) !== etapa);
                });
                document.querySelectorAll('[data-ph-step-indicator]').forEach((indicador) => {
                    const numero = Number(indicador.dataset.phStepIndicator);
                    indicador.classList.toggle('active', numero === etapa);
                    indicador.classList.toggle('completed', numero < etapa);
                    if (numero === etapa) indicador.setAttribute('aria-current', 'step');
                    else indicador.removeAttribute('aria-current');
                });
            }

            function montarErroInterfacePh() {
                return controlePh.erroInterface ? `<div class="ph-inline-error" role="alert">${controlePh.erroInterface}</div>` : '';
            }

            function montarMemorialCompletoPh(r) {
                const refControle = 'https://www3.epa.gov/ttnemc01/cam/sec4-5.pdf';
                const refBernoulli = 'https://www.grc.nasa.gov/www/k-12/airplane/bern.html';
                const refDarcy = 'https://www1.eere.energy.gov/manufacturing/tech_assistance/pdfs/airmaster_plus_appendix.pdf';
                const refVenturi = 'https://www.iso.org/standard/79181.html';
                const refVapor = 'https://webbook.nist.gov/cgi/cbook.cgi?ID=C7732185&Plot=on&Type=ANTOINE';
                const refBomba = 'https://www.lambda-instruments.com/fileadmin/LAMBDA_Peristaltic_pumps_touch_Operation_manual_rev14.pdf';
                return `
                    <h2>${textoIdioma('Memorial do controle', 'Control report')}</h2>
                    <div class="memorial-item"><strong>${textoIdioma('1. Erro de controle', '1. Control error')}</strong><br><code>e = pH_alvo − pH_atual</code> = ${r.erro.toFixed(4)}; ${textoIdioma('tolerância', 'tolerance')} = ±${r.tolerancia.toFixed(3)}. <a href="${refControle}" target="_blank" rel="noopener noreferrer">EPA</a></div>
                    <div class="memorial-item"><strong>${textoIdioma('2. Resposta observada', '2. Observed response')}</strong><br><code>S = |ΔpH/ΔV|</code> = ${controlePh.sensibilidade === null ? textoIdioma('aguardando primeiro ciclo', 'waiting for first cycle') : controlePh.sensibilidade.toFixed(6) + ' pH/L'}. <a href="${refControle}" target="_blank" rel="noopener noreferrer">EPA</a></div>
                    <div class="memorial-item"><strong>${textoIdioma('3. Próximo pulso', '3. Next pulse')}</strong><br><code>V_próximo = limitar(|e|/S · F, V_mín, V_máx)</code><br>${textoIdioma('Resultado', 'Result')}: ${r.proximoPulso.toFixed(6)} L; F = ${(r.fatorAproximacao * 100).toFixed(0)}%. <a href="${refControle}" target="_blank" rel="noopener noreferrer">${textoIdioma('Controle por realimentação', 'Feedback control')}</a></div>
                    <div class="memorial-item"><strong>${textoIdioma('4. Tempos do ciclo', '4. Cycle timing')}</strong><br>${textoIdioma('Aplicação', 'Application')}: ${r.tempoAplicacao.toFixed(2)} min; ${textoIdioma('mistura', 'mixing')}: ${lerPh('in_ph_tempo_mistura').toFixed(0)} s; ${textoIdioma('estabilização', 'stabilization')}: ${lerPh('in_ph_tempo_estabilizacao').toFixed(0)} s. <a href="${refControle}" target="_blank" rel="noopener noreferrer">EPA</a></div>
                    <div class="memorial-item"><strong>${textoIdioma('5. Linha do aditivo', '5. Additive line')}</strong><br><code>v = Q/A; ΔP_f = f(L/D)ρv²/2; ΔP_z = ρgh</code><br>Re = ${r.reynoldsProduto.toFixed(0)}; ΔP_f = ${(r.perdaMangueira / 1000).toFixed(3)} kPa; ΔP_z = ${(r.pressaoEstatica / 1000).toFixed(3)} kPa. <a href="${refDarcy}" target="_blank" rel="noopener noreferrer">${textoIdioma('Referência', 'Reference')}</a></div>
                    <div class="memorial-item"><strong>${textoIdioma('6. Venturi', '6. Venturi')}</strong><br><code>P₁ + ρv₁²/2 = P_g + ρv_g²/2; d = √(4Q/πv_g)</code><br>P_g = ${(r.pressaoGargantaGauge / 100000).toFixed(4)} bar(g); d = ${(r.diamGarganta * 1000).toFixed(3)} mm; β = ${r.beta.toFixed(4)}. <a href="${refBernoulli}" target="_blank" rel="noopener noreferrer">Bernoulli</a></div>
                    <div class="memorial-item ${r.geometriaValida ? 'green' : 'red'}"><strong>${textoIdioma('7. Geometria', '7. Geometry')}</strong><br><code>L = (D-d)/[2 tan(θ/2)]</code><br>${textoIdioma('Convergente', 'Convergent')}: ${(r.compConvergente * 1000).toFixed(2)} mm; ${textoIdioma('garganta', 'throat')}: ${(r.compGarganta * 1000).toFixed(2)} mm; ${textoIdioma('difusor', 'diffuser')}: ${(r.compDifusor * 1000).toFixed(2)} mm. <a href="${refVenturi}" target="_blank" rel="noopener noreferrer">ISO 5167-4</a></div>
                    ${r.modoAplicacao === 'peristaltica' ? `<div class="memorial-item"><strong>${textoIdioma('8. Bomba peristáltica', '8. Peristaltic pump')}</strong><br><code>n = Q/V_rev</code>; ${textoIdioma('rotação', 'speed')}: ${r.calibracaoBomba > 0 ? r.rpmBomba.toFixed(3) + ' rpm' : textoIdioma('aguardando calibração', 'waiting for calibration')}; ${textoIdioma('pressão residual', 'residual pressure')}: ${(r.pressaoBomba / 1000).toFixed(3)} kPa. <a href="${refBomba}" target="_blank" rel="noopener noreferrer">${textoIdioma('Referência', 'Reference')}</a></div>` : ''}
                    <div class="memorial-item ${r.cavitacao ? 'red' : 'green'}"><strong>${textoIdioma('Pressão absoluta e cavitação', 'Absolute pressure and cavitation')}</strong><br>P_abs,g = ${(r.pressaoAbsolutaGarganta / 1000).toFixed(2)} kPa; P_vapor = ${(r.pressaoVapor / 1000).toFixed(2)} kPa. ${r.cavitacao ? textoIdioma('Risco de cavitação.', 'Cavitation risk.') : textoIdioma('Acima da pressão de vapor.', 'Above vapor pressure.')} <a href="${refVapor}" target="_blank" rel="noopener noreferrer">NIST</a></div>
                    <div class="memorial-item yellow"><strong>${textoIdioma('Constantes utilizadas', 'Constants used')}</strong><br><span data-tooltip="${textoIdioma('[m/s²] Gravidade padrão. Converte desnível em pressão; dobrar a altura dobra essa parcela.', '[m/s²] Standard gravity. Converts elevation into pressure; doubling height doubles this component.')}">g = ${GRAVIDADE_PADRAO} m/s²</span>; <span data-tooltip="${textoIdioma('[kg/m³] Densidade de referência da água. Maior densidade exige maior diferencial para a mesma velocidade.', '[kg/m³] Reference water density. Greater density requires greater differential at the same velocity.')}">ρ_água = 1000 kg/m³</span>; <span data-tooltip="${textoIdioma('[Pa] Pressão atmosférica padrão usada na pressão absoluta e na margem de cavitação.', '[Pa] Standard atmospheric pressure used for absolute pressure and cavitation margin.')}">P_atm = 101325 Pa</span>; <span data-tooltip="${textoIdioma('[bar e K] Coeficientes de Antoine selecionados pela temperatura para calcular a pressão de vapor.', '[bar and K] Antoine coefficients selected by temperature to calculate vapor pressure.')}">A=${r.ant.a}, B=${r.ant.b}, C=${r.ant.c}</span>.</div>`;
            }

            function atualizarPh() {
                const r = calcularRegulacaoPh();
                atualizarEtapaVisualPh();
                const etapa = limitar(controlePh.etapa || 1, 1, 4);
                const produtoTexto = r.produto === 'acido' ? textoIdioma('Ácido', 'Acid') : (r.produto === 'base' ? textoIdioma('Base', 'Base') : textoIdioma('Nenhum', 'None'));
                const produtoNome = r.produto ? escaparHtml(document.getElementById(`in_ph_${r.produto}_nome`).value.trim()) : textoIdioma('Nenhum', 'None');
                const modoTexto = r.modoAplicacao === 'venturi' ? textoIdioma('Venturi dosador', 'Dosing Venturi') : textoIdioma('Bomba peristáltica', 'Peristaltic pump');
                const erroHtml = montarErroInterfacePh();

                if (etapa === 1) {
                    dom.painelEsqPh.innerHTML = `
                        <div class="ph-stage-card">
                            <div class="ph-stage-kicker">${textoIdioma('Etapa 1 de 4', 'Step 1 of 4')}</div>
                            <h2>${textoIdioma('Prepare o tanque e os reagentes', 'Prepare tank and reagents')}</h2>
                            <p>${textoIdioma('Informe a primeira leitura real, o objetivo e o reagente disponível. Os dados hidráulicos ficam para a próxima etapa.', 'Enter the first real reading, the target, and the available reagent. Hydraulic data comes next.')}</p>
                            <div class="ph-stage-summary">
                                <div class="ph-summary-item"><span>${textoIdioma('pH inicial', 'Initial pH')}</span><strong>${r.phAtual.toFixed(2)}</strong></div>
                                <div class="ph-summary-item"><span>${textoIdioma('pH alvo', 'Target pH')}</span><strong>${r.phAlvo.toFixed(2)} ± ${r.tolerancia.toFixed(2)}</strong></div>
                                <div class="ph-summary-item"><span>${textoIdioma('Reagente necessário', 'Required reagent')}</span><strong>${produtoTexto}</strong></div>
                            </div>
                            ${erroHtml}
                            <div class="ph-stage-actions"><button type="button" id="btn-ph-continuar" class="process-btn">${textoIdioma('Continuar para aplicação', 'Continue to application')}</button></div>
                        </div>`;
                    dom.painelDirPh.innerHTML = `
                        <h2>${textoIdioma('O que preencher agora', 'What to enter now')}</h2>
                        <ol class="ph-checklist"><li>${textoIdioma('Meça e informe o pH inicial do tanque.', 'Measure and enter the initial tank pH.')}</li><li>${textoIdioma('Defina o pH alvo e a tolerância.', 'Set target pH and tolerance.')}</li><li>${textoIdioma('Selecione ou descreva o reagente necessário.', 'Select or describe the required reagent.')}</li><li>${textoIdioma('Informe o volume realmente disponível.', 'Enter the volume actually available.')}</li></ol>
                        <div class="alert alert-warning"><strong>${textoIdioma('Resposta química não simulada', 'Chemical response is not simulated')}</strong><br>${textoIdioma('O próximo pulso será aprendido pelas leituras reais registradas durante os ciclos.', 'The next pulse will be learned from real readings recorded during the cycles.')}</div>`;
                } else if (etapa === 2) {
                    const compatibilidade = document.getElementById('in_ph_compatibilidade').checked;
                    dom.painelEsqPh.innerHTML = `
                        <div class="ph-stage-card">
                            <div class="ph-stage-kicker">${textoIdioma('Etapa 2 de 4', 'Step 2 of 4')}</div>
                            <h2>${textoIdioma('Configure a aplicação', 'Configure application')}</h2>
                            <p>${textoIdioma('Escolha o método e confira o resumo. Parâmetros menos frequentes estão recolhidos na barra lateral.', 'Choose the method and review the summary. Less frequent parameters are collapsed in the sidebar.')}</p>
                            <div class="ph-stage-summary">
                                <div class="ph-summary-item"><span>${textoIdioma('Método', 'Method')}</span><strong>${modoTexto}</strong></div>
                                <div class="ph-summary-item"><span>${textoIdioma('Primeiro pulso', 'First pulse')}</span><strong>${r.proximoPulso.toFixed(4)} L</strong></div>
                                <div class="ph-summary-item"><span>${textoIdioma('Garganta', 'Throat')}</span><strong>${(r.diamGarganta * 1000).toFixed(2)} mm</strong></div>
                            </div>
                            <div class="alert ${compatibilidade ? 'alert-success' : 'alert-warning'}"><strong>${textoIdioma('Compatibilidade química', 'Chemical compatibility')}</strong><br>${compatibilidade ? textoIdioma('Confirmada com dados do fabricante.', 'Confirmed using manufacturer data.') : textoIdioma('Ainda precisa ser confirmada.', 'Still needs confirmation.')}</div>
                            ${erroHtml}
                            <div class="ph-stage-actions"><button type="button" id="btn-ph-voltar-config" class="process-btn secondary">${textoIdioma('Voltar', 'Back')}</button><button type="button" id="btn-ph-iniciar" class="process-btn">${textoIdioma('Iniciar controle de pH', 'Start pH control')}</button></div>
                        </div>`;
                    dom.painelDirPh.innerHTML = `
                        <h2>${textoIdioma('Resumo técnico', 'Technical summary')}</h2>
                        <div class="memorial-item"><strong>${textoIdioma('Produto', 'Product')}</strong><br>${produtoNome || textoIdioma('Não informado', 'Not provided')} · ${r.volumeDisponivel.toFixed(3)} L ${textoIdioma('disponíveis', 'available')}</div>
                        <div class="memorial-item ${r.geometriaValida ? 'green' : 'red'}"><strong>${textoIdioma('Venturi', 'Venturi')}</strong><br>d = ${(r.diamGarganta * 1000).toFixed(3)} mm · P = ${(r.pressaoGargantaGauge / 100000).toFixed(3)} bar(g)</div>
                        <div class="memorial-item ${r.cavitacao ? 'red' : 'green'}"><strong>${textoIdioma('Cavitação', 'Cavitation')}</strong><br>${r.cavitacao ? textoIdioma('Risco calculado: revise a hidráulica avançada.', 'Calculated risk: review advanced hydraulics.') : textoIdioma('Pressão acima da pressão de vapor.', 'Pressure above vapor pressure.')}</div>`;
                } else if (etapa === 3) {
                    const acao = textoAcaoControlePh();
                    const instrucao = controlePh.estado === 'pronto'
                        ? textoIdioma('Confira o volume abaixo e inicie a aplicação física.', 'Review the volume below and start physical application.')
                        : controlePh.estado === 'dosando'
                            ? textoIdioma('Depois que todo o pulso entrar no tanque, confirme a aplicação.', 'After the full pulse enters the tank, confirm application.')
                            : controlePh.estado === 'misturando'
                                ? textoIdioma('Misture ou recircule pelo tempo configurado antes de continuar.', 'Mix or recirculate for the configured time before continuing.')
                                : controlePh.estado === 'estabilizando'
                                    ? textoIdioma('Aguarde a estabilização, digite a nova leitura abaixo e registre.', 'Wait for stabilization, enter the new reading below, and record it.')
                                    : textoIdioma('Retome o controle para recalcular o próximo passo.', 'Resume control to recalculate the next step.');
                    const leitura = controlePh.estado === 'estabilizando' ? `<div class="ph-reading-field"><label for="in_ph_nova_leitura">${textoIdioma('Nova leitura após mistura', 'New reading after mixing')}</label><input type="number" id="in_ph_nova_leitura" min="0" max="14" step="0.01" inputmode="decimal" placeholder="${textoIdioma('Digite o pH medido', 'Enter measured pH')}"></div>` : '';
                    dom.painelEsqPh.innerHTML = `
                        <div class="ph-stage-card ph-operation-card">
                            <div class="ph-stage-kicker">${textoIdioma('Etapa 3 de 4', 'Step 3 of 4')} · ${textoIdioma('Ciclo', 'Cycle')} ${controlePh.ciclo + (controlePh.pendente ? 1 : 0)} ${textoIdioma('de', 'of')} ${r.ciclosMaximos}</div>
                            <h2>${textoEstadoControlePh(controlePh.estado)}</h2>
                            <p>${instrucao}</p>
                            <div class="ph-stage-summary">
                                <div class="ph-summary-item"><span>pH ${textoIdioma('atual', 'current')}</span><strong>${r.phAtual.toFixed(3)}</strong></div>
                                <div class="ph-summary-item"><span>${textoIdioma('Alvo', 'Target')}</span><strong>${r.phAlvo.toFixed(2)} ± ${r.tolerancia.toFixed(2)}</strong></div>
                                <div class="ph-summary-item"><span>${textoIdioma('Produto', 'Product')}</span><strong>${produtoTexto}</strong></div>
                            </div>
                            <div class="ph-operation-main"><div class="metric-label">${textoIdioma('Pulso desta etapa', 'Pulse for this step')}</div><div class="metric-value">${(controlePh.pendente?.volume || r.proximoPulso).toFixed(4)} L</div><div class="metric-delta">${modoTexto} · ${r.vazaoProdutoLMin.toFixed(4)} L/min</div></div>
                            ${controlePh.estado === 'misturando' ? `<div class="alert alert-warning">${textoIdioma('Tempo de mistura configurado', 'Configured mixing time')}: <strong>${lerPh('in_ph_tempo_mistura').toFixed(0)} s</strong></div>` : ''}
                            ${controlePh.estado === 'estabilizando' ? `<div class="alert alert-warning">${textoIdioma('Tempo de estabilização configurado', 'Configured stabilization time')}: <strong>${lerPh('in_ph_tempo_estabilizacao').toFixed(0)} s</strong></div>` : ''}
                            ${leitura}
                            ${erroHtml}
                            <div class="ph-stage-actions"><button type="button" id="btn-ph-novo" class="process-btn secondary">${textoIdioma('Reiniciar processo', 'Restart process')}</button>${acao ? `<button type="button" id="btn-ph-acao" class="process-btn">${acao}</button>` : ''}${controlePh.historico.length ? `<button type="button" id="btn-ph-resultados" class="process-btn secondary">${textoIdioma('Ver histórico', 'View history')}</button>` : ''}</div>
                        </div>`;
                    dom.painelDirPh.innerHTML = `
                        <h2>${textoIdioma('Histórico até agora', 'History so far')}</h2>
                        ${montarTabelaHistoricoPh()}
                        <div class="memorial-item"><strong>${textoIdioma('Sensibilidade observada', 'Observed sensitivity')}</strong><br>${controlePh.sensibilidade === null ? textoIdioma('Será calculada após uma resposta válida.', 'Will be calculated after a valid response.') : controlePh.sensibilidade.toFixed(6) + ' pH/L'}</div>
                        <div class="memorial-item"><strong>${textoIdioma('Dose acumulada', 'Cumulative dose')}</strong><br>${textoIdioma('Ácido', 'Acid')}: ${controlePh.doseAcido.toFixed(4)} L · ${textoIdioma('Base', 'Base')}: ${controlePh.doseBase.toFixed(4)} L</div>`;
                } else {
                    const estimativaTexto = r.estimativaRestante === null ? textoIdioma('Indeterminada', 'Undetermined') : r.estimativaRestante.toFixed(4) + ' L';
                    dom.painelEsqPh.innerHTML = `
                        <div class="ph-stage-card">
                            <div class="ph-stage-kicker">${textoIdioma('Etapa 4 de 4', 'Step 4 of 4')}</div>
                            <h2>${textoIdioma('Resultado e histórico', 'Result and history')}</h2>
                            <div class="alert ${r.alvoAtingido ? 'alert-success' : 'alert-warning'}"><strong>${textoEstadoControlePh(controlePh.estado)}</strong><br>pH ${textoIdioma('atual', 'current')}: ${r.phAtual.toFixed(3)} · ${textoIdioma('alvo', 'target')}: ${r.phAlvo.toFixed(3)}</div>
                            <div class="ph-stage-summary">
                                <div class="ph-summary-item"><span>${textoIdioma('Ciclos registrados', 'Recorded cycles')}</span><strong>${controlePh.historico.length}</strong></div>
                                <div class="ph-summary-item"><span>${textoIdioma('Dose acumulada', 'Cumulative dose')}</span><strong>${r.doseAcumulada.toFixed(4)} L</strong></div>
                                <div class="ph-summary-item"><span>${textoIdioma('Estimativa restante', 'Remaining estimate')}</span><strong>${estimativaTexto}</strong></div>
                            </div>
                            <h3>${textoIdioma('Histórico dos ciclos', 'Cycle history')}</h3>
                            ${montarTabelaHistoricoPh()}
                            <div class="ph-stage-actions"><button type="button" id="btn-ph-voltar-ciclos" class="process-btn secondary">${textoIdioma('Voltar aos ciclos', 'Back to cycles')}</button><button type="button" id="btn-ph-novo" class="process-btn">${textoIdioma('Iniciar novo processo', 'Start new process')}</button></div>
                        </div>`;
                    dom.painelDirPh.innerHTML = montarMemorialCompletoPh(r);
                }
                desenharRegulacaoPh(r);
            }
            function atualizarDashboard() {
                // Captura valores numéricos limpos
                const E_e = parseFloat(dom.energia.value);
                const V = parseFloat(dom.tensao.value);
                const I = parseFloat(dom.corrente.value);
                const eta_m = parseFloat(dom.eficiencia.value) / 100.0;
                const red = parseFloat(dom.reducao.value);
                let taxa = lerValorSincronizado('in_taxa_range');
                
                // Prevenção caso o usuário apague o número da caixa de texto
                if(isNaN(taxa)) taxa = 0.1;

                const modoElemento = document.querySelector('input[name="modo"]:checked');
                const modo = modoElemento ? modoElemento.value : "1";

                let htmlEsquerdo = "";
                let htmlDireito = "";

                if (modo === "1") {
                    dom.lblCorrente.innerText = textoIdioma('Corrente Aplicada (A)', 'Applied Current (A)');
                    
                    const P_ele = V * I;
                    const P_util = P_ele * eta_m;
                    const P_exigida = (taxa * E_e) / EFICIENCIA_REDUTOR;
                    const rot_final = RPM_BASE / red;
                    const T_disp = (P_util * EFICIENCIA_REDUTOR) / (rot_final * (Math.PI / 30));
                    
                    rotacaoFinalGlobal = rot_final;
                    isStalled = P_util < P_exigida;

                    let statusBox = "";
                    if (!isStalled) {
                        statusBox = "<div class='alert alert-success'><strong>" + textoIdioma('✅ SISTEMA OPERANDO LISO', '✅ SYSTEM OPERATING SMOOTHLY') + "</strong><br><br>" + textoIdioma('A potência exigida para fraturar o material é de', 'The power required to fracture the material is') + " <strong>" + P_exigida.toFixed(1) + " Watts</strong>, " + textoIdioma('o que está dentro da margem de segurança da sua potência útil de', 'which is within the safety margin of your useful power of') + " <strong>" + P_util.toFixed(1) + " Watts</strong>.</div>";
                    } else {
                        statusBox = "<div class='alert alert-error'><strong>" + textoIdioma('❌ MOTOR EM ESTOL (TRAVADO)', '❌ MOTOR STALLED (JAMMED)') + "</strong><br><br>" + textoIdioma('A potência exigida para fraturar o material', 'The power required to fracture the material') + " (<strong>" + P_exigida.toFixed(1) + " Watts</strong>) " + textoIdioma('é superior à potência útil disponível no eixo', 'is greater than the useful power available at the shaft') + " (<strong>" + P_util.toFixed(1) + " Watts</strong>). " + textoIdioma('O material encavalou.', 'The material jammed.') + "</div>";
                    }

                    htmlEsquerdo = `
                        <h3 style="color: #fff; margin-bottom: 15px;">${textoIdioma('Análise de Conversão de Energia', 'Energy Conversion Analysis')}</h3>
                        <div class="metrics-row">
                            <div class="metric-card" title="Energia bruta puxada da bateria (Tensão x Corrente)."><div class="metric-label">${textoIdioma('Potência Elétrica Consumida', 'Electrical Power Consumption')}</div><div class="metric-value">${P_ele.toFixed(1)} W</div></div>
                            <div class="metric-card" title="${textoIdioma('Energia que sobreviveu à dissipação térmica do motor e está efetivamente girando o eixo.', 'Energy remaining after the motor’s thermal losses and effectively driving the shaft.')}"><div class="metric-label">${textoIdioma('Potência Útil Entregue ao Eixo', 'Useful Power Delivered to the Shaft')}</div><div class="metric-value">${P_util.toFixed(1)} W</div></div>
                        </div>
                        <h3 style="color: #fff; margin-bottom: 15px;">Análise de Força Bruta</h3>
                        <div class="metrics-row">
                            <div class="metric-card" title="Força de torção máxima que o dente do rolo consegue aplicar no grão de NPK. Calculado dividindo a potência útil pela velocidade angular final."><div class="metric-label">Torque Disponível nos Rolos</div><div class="metric-value">${T_disp.toFixed(2)} N.m</div></div>
                            <div class="metric-card" title="Velocidade física dos rolos após passar pelo redutor."><div class="metric-label">${textoIdioma('Rotação Final nos Rolos', 'Final Roller Speed')}</div><div class="metric-value">${rot_final.toFixed(1)} RPM</div></div>
                        </div>
                        <h3 style="color: #fff; margin-bottom: 15px;">Status de Operação</h3>
                        ${statusBox}
                    `;

                    htmlDireito = `
                        <h3 style="color: #fff; margin-top: 0;">${textoIdioma('📚 Memorial de Cálculo', '📚 Calculation Report')}</h3>
                        <div style="margin-bottom: 15px; font-size: 0.9em; color: var(--text-muted);">
                            <strong>${textoIdioma('Parâmetros Base Assumidos', 'Assumed Base Parameters')}</strong><br>
                            &bull; ${textoIdioma('Energia Específica', 'Specific Energy')} (E<sub>e</sub>): ${E_e.toFixed(1)} J/g<br>
                            &bull; ${textoIdioma('Eficiência Mecânica', 'Mechanical Efficiency')} (&eta;<sub>redutor</sub>): ${(EFICIENCIA_REDUTOR*100).toFixed(0)}%<br>
                            &bull; ${textoIdioma('Motor na rotação base', 'Motor at baseline speed')}: ${RPM_BASE} RPM
                        </div>
                        <div class="memorial-item">
                            <strong title="Potência elétrica e conversão de energia. Clique para referência bibliográfica.">
                                <a href="https://openstax.org/books/college-physics-2e/pages/20-4-electric-power-and-energy" target="_blank" style="color: inherit; text-decoration: underline;">${textoIdioma('1. Conversão Elétrica ➡ Mecânica 🔗', '1. Electrical Conversion ➡ Mechanical 🔗')}</a>
                            </strong><br>
                            <p style="margin: 10px 0 5px 0; font-size: 0.9em;">${textoIdioma('Potência elétrica total consumida da fonte de alimentação:', 'Total electrical power consumed from the supply source:')}</p>
                            $$ \\require{action} \\texttip{P_{ele}}{${textoIdioma('[W] Potência Elétrica. Definição: Energia bruta puxada da fonte. Importância: Fundamental para dimensionar a bateria e a bitola dos cabos de energia.', '[W] Electrical Power. Definition: Gross energy drawn from the source. Importance: Fundamental for sizing the battery and power cable gauge.')}} = \\texttip{V}{${textoIdioma('[V] Tensão Nominal. Definição: Potencial do sistema elétrico. Importância: Define a categoria do equipamento (ex: 12V ou 24V).', '[V] Nominal Voltage. Definition: Electrical system potential. Importance: Defines the equipment class (e.g. 12V or 24V).')}} \\cdot \\texttip{I}{${textoIdioma('[A] Corrente Elétrica. Definição: Fluxo de elétrons. Importância: Principal gerador de calor (Joule); controlá-la evita a queima do motor.', '[A] Electric Current. Definition: Electron flow. Importance: Main heat generator (Joule); controlling it avoids motor burn-out.')}} $$
                            $$ P_{ele} = ${V} \\cdot ${I.toFixed(1)} $$
                            $$ P_{ele} = ${P_ele.toFixed(1)} \\text{ W} $$
                            <hr style="border: 0; border-top: 1px dashed rgba(255,255,255,0.05); margin: 10px 0;">
                            <p style="margin: 5px 0; font-size: 0.9em;">${textoIdioma('Potência mecânica útil convertida no eixo do motor:', 'Useful mechanical power converted at the motor shaft:')}</p>
                            $$ \\require{action} \\texttip{P_{util}}{${textoIdioma('[W] Potência Útil. Definição: Energia efetiva de giro. Importância: É a força real, descontadas as perdas de calor, que vai triturar a pedra.', '[W] Useful Power. Definition: Effective rotational energy. Importance: The real force, after heat losses, that will crush the stone.')}} = \\texttip{P_{ele}}{${textoIdioma('[W] Potência Elétrica Bruta.', '[W] Gross Electrical Power.')}} \\cdot \\texttip{\\eta_{mot}}{${textoIdioma('[%] Eficiência Eletromagnética. Definição: Fração de eletricidade convertida em giro. Importância: Motores ruins (baixa %) esquentam mais e puxam mais bateria.', '[%] Electromagnetic Efficiency. Definition: Fraction of electricity converted into rotation. Importance: Poor motors (low %) run hotter and draw more battery.')}} $$
                            $$ P_{util} = ${P_ele.toFixed(1)} \\cdot ${eta_m.toFixed(2)} $$
                            $$ P_{util} = ${P_util.toFixed(1)} \\text{ W} $$
                        </div>
                        <div class="memorial-item yellow">
                            <strong title="Potência como taxa de energia por tempo. A energia específica E_e deve vir de ensaio ou ficha técnica do material.">
                                <a href="https://openstax.org/books/college-physics-2e/pages/7-7-power" target="_blank" style="color: inherit; text-decoration: underline;">${textoIdioma('2. Demanda do Material (Fratura) 🔗', '2. Material Demand (Fracture) 🔗')}</a>
                            </strong><br>
                            <p style="margin: 10px 0 5px 0; font-size: 0.9em;">${textoIdioma('Potência mecânica exigida pelos rolos para esmagar os grãos:', 'Mechanical power required by the rollers to crush the granules:')}</p>
                            $$ \\require{action} \\texttip{P_{exigida}}{${textoIdioma('[W] Potência Exigida. Definição: Esforço necessário para fraturar a vazão alvo. Importância: Se superar a P_util, o rolo trava (estola).', '[W] Required Power. Definition: Effort needed to fracture the target flow. Importance: If it exceeds P_util, the roller stalls.')}} = \\frac{\\texttip{\\dot{m}}{${textoIdioma('[g/s] Taxa de Moagem. Definição: Massa triturada por segundo. Importância: Dita a capacidade produtiva comercial da máquina.', "[g/s] Grinding Rate. Definition: Mass crushed per second. Importance: Determines the machine's commercial production capacity.")}} \\cdot \\texttip{E_e}{${textoIdioma('[J/g] Energia Específica. Definição: Resistência do material. Importância: Adubos mais duros exigem motores mais caros e potentes.', '[J/g] Specific Energy. Definition: Material resistance. Importance: Harder fertilizers require more expensive and powerful motors.')}}}{\\texttip{\\eta_{red}}{${textoIdioma('[%] Eficiência da Caixa. Definição: Perdas por atrito. Importância: Redutores planetários bons mantêm 85% da força.', '[%] Gearbox Efficiency. Definition: Friction losses. Importance: Good planetary reducers keep 85% of the force.')}}} $$
                            $$ P_{exigida} = \\frac{${taxa.toFixed(1)} \\cdot ${E_e.toFixed(1)}}{${EFICIENCIA_REDUTOR}} $$
                            $$ P_{exigida} = ${P_exigida.toFixed(1)} \\text{ W} $$
                        </div>
                        <div class="memorial-item green">
                            <strong title="Relação entre potência, torque e velocidade angular em movimento rotacional. Clique para referência.">
                                <a href="https://openstax.org/books/university-physics-volume-1/pages/10-8-work-and-power-for-rotational-motion" target="_blank" style="color: inherit; text-decoration: underline;">${textoIdioma('3. Cinemática e Torque 🔗', '3. Kinematics and Torque 🔗')}</a>
                            </strong><br>
                            <p style="margin: 10px 0 5px 0; font-size: 0.9em;">${textoIdioma('Rotação mecânica final na saída do redutor:', 'Final mechanical rotation at the reducer output:')}</p>
                            $$ \\require{action} \\texttip{N_{final}}{${textoIdioma('[RPM] Rotação Final. Definição: Rotação visível do rolo. Importância: Determina o tempo que o material fica retido esmagando.', '[RPM] Final Rotation. Definition: Visible roller rotation. Importance: Determines how long the material stays crushing.')}} = \\frac{\\texttip{RPM_{base}}{${textoIdioma('[RPM] Rotação Motor. Definição: Velocidade nominal do rotor livre.', '[RPM] Motor Rotation. Definition: Nominal free-rotor speed.')}}}{\\texttip{Red_{caixa}}{${textoIdioma('[Adim.] Fator de Redução. Definição: Relação das engrenagens. Importância: Transforma rotação inútil em torque esmagador brutal.', '[Dimensionless] Reduction factor. Definition: Gear ratio. Importance: Converts useless rotation into brutal crushing torque.')}}} $$
                            $$ N_{final} = \\frac{${RPM_BASE}}{${red}} $$
                            $$ N_{final} = ${rot_final.toFixed(1)} \\text{ RPM} $$
                            <hr style="border: 0; border-top: 1px dashed rgba(255,255,255,0.05); margin: 10px 0;">
                            <p style="margin: 5px 0; font-size: 0.9em;">${textoIdioma('Torque resultante disponível nas estrias do rolo:', 'Resulting torque available on the roller splines:')}</p>
                            $$ \\require{action} \\texttip{T_{disp}}{${textoIdioma('[N.m] Torque Disponível. Definição: Força de torção nas estrias. Importância: Capacidade limite de morder e quebrar rochas sem parar.', '[N.m] Available Torque. Definition: Twisting force on the splines. Importance: Limit capacity to bite and break stones without stopping.')}} = \\frac{\\texttip{P_{util}}{${textoIdioma('[W] Potência Útil Limite.', '[W] Useful Power Limit.')}} \\cdot \\texttip{\\eta_{red}}{${textoIdioma('[%] Eficiência Mecânica.', '[%] Mechanical Efficiency.')}}}{\\texttip{\\omega}{${textoIdioma('[rad/s] Vel. Angular. Definição: Rotação convertida para o Sistema Internacional.', '[rad/s] Angular velocity. Definition: Rotation converted to the SI system.')}}} $$
                            $$ T_{disp} = \\frac{${P_util.toFixed(1)} \\cdot ${EFICIENCIA_REDUTOR}}{${rot_final.toFixed(1)} \\cdot \\frac{\\pi}{30}} $$
                            $$ T_{disp} = ${T_disp.toFixed(2)} \\text{ N.m} $$
                        </div>
                    `;

                } else {
                    dom.lblCorrente.innerText = textoIdioma('Corrente M?xima Suportada (A)', 'Maximum Supported Current (A)');

                    const P_mec_exigida = (taxa * E_e) / EFICIENCIA_REDUTOR;
                    const P_ele_exigida = P_mec_exigida / eta_m;
                    const I_exigida = P_ele_exigida / V;
                    const P_ele_consumida = V * I;
                    const P_util_disp = P_ele_consumida * eta_m;
                    const rot_final = RPM_BASE / red;
                    const T_disp = (P_util_disp * EFICIENCIA_REDUTOR) / (rot_final * (Math.PI / 30));
                    
                    rotacaoFinalGlobal = rot_final;
                    const margem_queima = I;
                    isStalled = I_exigida > margem_queima; // Trava quando a demanda ultrapassa a corrente nominal informada
                    const delta = I_exigida - I;

                    let statusBox = "";
                    if (I_exigida > I) {
                        statusBox = `<div class='alert alert-error'><strong>${textoIdioma('🔥 SOBRECARGA ELÉTRICA DO MOTOR', '🔥 ELECTRICAL MOTOR OVERLOAD')}</strong><br><br>${textoIdioma('Para não travar os rolos trituradores, o motor teria de puxar', 'To keep the crushing rollers from stalling, the motor would need to draw')} <strong>${I_exigida.toFixed(1)} A</strong> ${textoIdioma('da fonte. Como o limite informado é', 'from the power source. Since the specified limit is')} <strong>${I.toFixed(1)} A</strong>, ${textoIdioma('a condição excede a corrente nominal e aumenta a dissipação térmica nas bobinas.', 'this condition exceeds the rated current and increases thermal dissipation in the windings.')}</div>`;
                    } else {
                        statusBox = `<div class='alert alert-success'><strong>${textoIdioma('✅ OPERAÇÃO ESTÁVEL E FRIA', '✅ STABLE, COOL OPERATION')}</strong><br><br>${textoIdioma('A demanda mecânica nos rolos gera uma corrente de apenas', 'The mechanical demand at the rollers draws only')} <strong>${I_exigida.toFixed(1)} A</strong>, ${textoIdioma('dentro da capacidade contínua de', 'within the continuous capacity of')} <strong>${I.toFixed(1)} A</strong>. ${textoIdioma('Operação segura.', 'Safe operation.')}</div>`;
                    }

                    htmlEsquerdo = `
                        <h3 style="color: #fff; margin-bottom: 15px;">${textoIdioma('Análise de Conversão de Energia', 'Energy Conversion Analysis')}</h3>
                        <div class="metrics-row">
                            <div class="metric-card" title="Energia total circulando no sistema no limite da corrente estipulada."><div class="metric-label">${textoIdioma('Potência Elétrica Consumida', 'Electrical Power Consumption')}</div><div class="metric-value">${P_ele_consumida.toFixed(1)} W</div></div>
                            <div class="metric-card" title="Potência mecânica máxima que o motor consegue entregar antes de queimar."><div class="metric-label">${textoIdioma('Potência Útil Entregue ao Eixo', 'Useful Power Delivered to the Shaft')}</div><div class="metric-value">${P_util_disp.toFixed(1)} W</div></div>
                        </div>
                        <h3 style="color: #fff; margin-bottom: 15px;">${textoIdioma('Análise de Demanda de Corrente', 'Current Demand Analysis')}</h3>
                        <div class="metrics-row">
                            <div class="metric-card" title="Como o motor DC tenta manter o torque variando a corrente, esta é a Amperagem real que a pedra exige do sistema para quebrar. Se for maior que a Etiqueta, o motor queima.">
                                <div class="metric-label">${textoIdioma('Corrente Exigida para Moer', 'Required Grinding Current')}</div>
                                <div class="metric-value">${I_exigida.toFixed(1)} A</div>
                                <div class="metric-delta ${delta > 0 ? 'delta-red' : 'delta-green'}">${delta > 0 ? '↑ ' + delta.toFixed(1) + ' A acima do limite' : '↓ Seguro'}</div>
                            </div>
                            <div class="metric-card" title="Limite térmico do fabricante (Amperes de placa)."><div class="metric-label">${textoIdioma('Corrente Máxima (Etiqueta)', 'Maximum Current (Nameplate)')}</div><div class="metric-value">${I.toFixed(1)} A</div></div>
                        </div>
                        <div class="metrics-row">
                            <div class="metric-card" title="Torque de Estol referencial. Acima deste torque, a amperagem ultrapassa o limite térmico."><div class="metric-label">${textoIdioma('Torque Máximo de Trabalho', 'Maximum Working Torque')}</div><div class="metric-value">${T_disp.toFixed(2)} N.m</div></div>
                            <div class="metric-card" title="Velocidade cinemática na ponta do eixo triturador."><div class="metric-label">${textoIdioma('Rotação Final nos Rolos', 'Final Roller Speed')}</div><div class="metric-value">${rot_final.toFixed(1)} RPM</div></div>
                        </div>
                        <h3 style="color: #fff; margin-bottom: 15px;">${textoIdioma('Integridade do Sistema', 'System Integrity')}</h3>
                        ${statusBox}
                    `;

                    htmlDireito = `
                        <h3 style="color: #fff; margin-top: 0;">${textoIdioma('📚 Memorial de Cálculo Inverso', '📚 Reverse Calculation Report')}</h3>
                        <div style="margin-bottom: 15px; font-size: 0.9em; color: var(--text-muted);">
                            <strong>${textoIdioma('Parâmetros Base Assumidos', 'Assumed Base Parameters')}</strong><br>
                            &bull; ${textoIdioma('Energia Específica', 'Specific Energy')} (E<sub>e</sub>): ${E_e.toFixed(1)} J/g<br>
                            &bull; ${textoIdioma('Eficiência Mecânica', 'Mechanical Efficiency')} (&eta;<sub>redutor</sub>): ${(EFICIENCIA_REDUTOR*100).toFixed(0)}%<br>
                            &bull; ${textoIdioma('Motor na rotação base', 'Motor at baseline speed')}: ${RPM_BASE} RPM
                        </div>
                        <div class="memorial-item yellow">
                            <strong title="${textoIdioma('Potência mecânica como taxa de energia por tempo. A energia específica E_e deve vir de calibração do material.', 'Mechanical power as an energy rate over time. The specific energy E_e must come from material calibration.')} ">
                                <a href="https://openstax.org/books/college-physics-2e/pages/7-7-power" target="_blank" style="color: inherit; text-decoration: underline;">${textoIdioma('1. Demanda Mecânica (Rolos) 🔗', '1. Mechanical Demand (Rollers) 🔗')}</a>
                            </strong><br>
                            <p style="margin: 10px 0 5px 0; font-size: 0.9em;">${textoIdioma('Potência mecânica refletida na ponta do eixo do motor:', 'Mechanical power reflected at the motor shaft end:')}</p>
                            $$ \\require{action} \\texttip{P_{mec}}{[W] Potência Mecânica. Definição: Esforço real exercido pelas pedras sobre o motor. Importância: Define o peso mecânico do sistema no limite.} = \\frac{\\texttip{\\dot{m}}{[g/s] Taxa de Moagem Alvo.} \\cdot \\texttip{E_e}{[J/g] Resistência do NPK.}}{\\texttip{\\eta_{red}}{[%] Perdas da Caixa Redutora.}} $$
                            $$ P_{mec} = \\frac{${taxa.toFixed(1)} \\cdot ${E_e.toFixed(1)}}{${EFICIENCIA_REDUTOR}} $$
                            $$ P_{mec} = ${P_mec_exigida.toFixed(1)} \\text{ W} $$
                        </div>
                        <div class="memorial-item red">
                            <strong title="Potência elétrica, tensão, corrente e conversão de energia. Clique para referência.">
                                <a href="https://openstax.org/books/college-physics-2e/pages/20-4-electric-power-and-energy" target="_blank" style="color: inherit; text-decoration: underline;">${textoIdioma('2. Reflexo Elétrico (Tomada) 🔗', '2. Electrical Demand (Supply) 🔗')}</a>
                            </strong><br>
                            <p style="margin: 10px 0 5px 0; font-size: 0.9em;">${textoIdioma('O que o motor precisará drenar da bateria para não travar:', 'Electrical power the motor must draw from the battery to avoid stalling:')}</p>
                            $$ \\require{action} \\texttip{P_{ele}}{[W] Potência Elétrica Exigida. Definição: Energia elétrica drenada para suprir o esforço mecânico. Importância: Base para calcular a corrente de sobrecarga.} = \\frac{\\texttip{P_{mec}}{[W] Potência Mecânica Requerida.}}{\\texttip{\\eta_{mot}}{[%] Eficiência Eletromecânica.}} $$
                            $$ P_{ele} = \\frac{${P_mec_exigida.toFixed(1)}}{${eta_m.toFixed(2)}} $$
                            $$ P_{ele} = ${P_ele_exigida.toFixed(1)} \\text{ W} $$
                            <hr style="border: 0; border-top: 1px dashed rgba(255,255,255,0.05); margin: 10px 0;">
                            <p style="margin: 5px 0; font-size: 0.9em;">${textoIdioma('Corrente resultante dessa demanda forçada:', 'Current resulting from this forced demand:')}</p>
                            $$ \\require{action} \\texttip{I_{exigida}}{[A] Corrente Exigida. Definição: Amperagem real puxada sob carga pesada. Importância: Se ultrapassar o limite nominal, causa degradação térmica acelerada.} = \\frac{\\texttip{P_{ele}}{[W] Potência Elétrica Calculada.}}{\\texttip{V}{[V] Tensão da Bateria.}} $$
                            $$ I_{exigida} = \\frac{${P_ele_exigida.toFixed(1)}}{${V}} $$
                            $$ I_{exigida} = ${I_exigida.toFixed(1)} \\text{ A} $$
                        </div>
                        <div class="memorial-item">
                            <strong title="Potência dissipada em resistência elétrica e aquecimento por corrente. Clique para referência.">
                                <a href="https://openstax.org/books/college-physics-2e/pages/20-4-electric-power-and-energy" target="_blank" style="color: inherit; text-decoration: underline;">${textoIdioma('3. Risco de Queima (Lei de Joule) 🔗', '3. Overheating Risk (Joule’s Law) 🔗')}</a>
                            </strong><br>
                            <p style="margin-bottom: 15px; margin-top: 10px;">${textoIdioma(`A energia térmica dissipada na carcaça do motor cresce de forma quadrática. Com a corrente exigida em <strong>${I_exigida.toFixed(1)} A</strong>, aumenta o risco de degradação do verniz isolante.`, `Thermal energy dissipated in the motor housing grows quadratically. With the required current at <strong>${I_exigida.toFixed(1)} A</strong>, the risk of insulation-varnish degradation increases.`)}</p>
                            $$ \\require{action} \\texttip{Q}{[J] Calor Gerado. Definição: Energia térmica dissipada no motor. Importância: Cresce ao quadrado com a corrente, sendo a principal causa de incêndios em motores em estol.} = \\texttip{I_{exigida}^2}{[A²] Corrente ao Quadrado. Definição: Crescimento exponencial do Efeito Joule.} \\cdot \\texttip{R}{[Ohms] Resistência interna das bobinas de cobre.} \\cdot \\texttip{t}{[s] Tempo. Definição: Tempo de exposição à sobrecarga. Importância: Define se o fusível desarmará antes da queima.} $$
                            $$ Q = ${I_exigida.toFixed(1)}^2 \\cdot R \\cdot t $$
                            $$ Q = ${(I_exigida * I_exigida).toFixed(1)} \\cdot R \\cdot t \\text{ Joules} $$
                        </div>
                    `;
                }

                dom.painelEsquerdo.innerHTML = htmlEsquerdo;

                // --- DOUBLE BUFFERING AVANÇADO (DOM NODES + PROMISE QUEUE) ---
                if (mathJaxTimer) clearTimeout(mathJaxTimer);
                mathJaxTimer = setTimeout(function() {
                    // Cria uma "tela fantasma" na memória
                    const bufferInvisivel = document.createElement('div');
                    bufferInvisivel.innerHTML = traduzirTextosDeFormula(envolverSimbolosCalculadosMemorialDist(htmlDireito));
                    
                    if (window.MathJax && MathJax.typesetPromise) {
                        // Cria uma fila para garantir que o MathJax não se atropele no arrasto rápido
                        if (!window.mjPromise) window.mjPromise = Promise.resolve();
                        
                        window.mjPromise = window.mjPromise.then(function() {
                            // Manda renderizar a matemática na tela fantasma primeiro
                            return MathJax.typesetPromise([bufferInvisivel]).then(function() {
                                // Só quando estiver 100% pronto e desenhado, esvazia o painel
                                dom.painelDireito.innerHTML = "";
                                // Move os blocos físicos (estilizados) para a tela real
                                while (bufferInvisivel.firstChild) {
                                    dom.painelDireito.appendChild(bufferInvisivel.firstChild);
                                }
                            });
                        }).catch(function(err){ console.log(err); });
                    } else {
                        dom.painelDireito.innerHTML = traduzirTextosDeFormula(envolverSimbolosCalculadosMemorialDist(htmlDireito));
                    }
                }, 80); // 80ms: o equilíbrio perfeito entre responsividade visual e alívio da GPU
            }

            // --- LÓGICA DO DISTRIBUIDOR DE SÓLIDOS ---
            let mathJaxTimerDist = null;
            function atualizarDistribuidor() {
                const modoDistElement = document.querySelector('input[name="modo_dist"]:checked');
                const modoDist = modoDistElement ? modoDistElement.value : "1";
                
                let htmlEsquerdo = "";
                let htmlDireito = "";

                if (modoDist === "1") {
                    dom.distGrpModo1.classList.remove('hidden');
                    dom.distGrpModo2.classList.add('hidden');

                    canvasDist.style.display = 'block';
                    ativarAnimacaoDist = false;

                    const n_linhas = parseInt(dom.distLinhas.value);
                    const n_primarios = parseInt(dom.distQtdPrimarios.value);
                    const L_tubo_m = parseFloat(dom.distComprimento.value);
                    const L_primario_m = parseFloat(dom.distComprimentoPrimario.value);
                    const taxa_ha = lerValorSincronizado('in_dist_taxa');
                    const v_trator = parseFloat(dom.distVelTrator.value);
                    const largura = parseFloat(dom.distLargura.value);
                    const geometriaRolo = calcularVolumeRolo();
                    const espessura_disco = parseFloat(dom.distEspessura.value);
                    const qtd_discos_uteis = parseFloat(dom.distQtdDiscos.value);
                    const cavidades_por_disco = parseFloat(dom.distCavidades.value);
                    const area_lateral_cavidade = parseFloat(dom.distAreaCavidade.value);
                    const rho_s = parseFloat(dom.distDensidade.value);
                    const V_motor = parseFloat(dom.distTensao.value);
                    const I_max = parseFloat(dom.distCorrente.value);
                    const eta_motor_dist = parseFloat(dom.distEficienciaMotor.value) / 100.0;
                    const E_dosador = parseFloat(dom.distEnergiaDosador.value);
                    const Q_turbina_m3min = parseFloat(dom.distVazaoTurbina.value);
                    const D_mm = parseFloat(dom.distDiametro.value);
                    const D_primario_pol = parseFloat(dom.distDiametroPrimarioPol.value);
                    const rho_a = parseFloat(dom.distDensidadeAr.value);
                    const fator_atrito = parseFloat(dom.distFatorAtrito.value);
                    const pressao_turbina_max = parseFloat(dom.distPressaoTurbina.value);
                    const k_torre = parseFloat(dom.distKTorre.value);

                    const V_r_mm3 = geometriaRolo.volumeRoloMm3;
                    const volume_por_disco_mm3 = geometriaRolo.volumePorDiscoMm3;
                    const m_s_kgh_linha = (taxa_ha * v_trator * largura) / 10;
                    const m_s_kgh_total = m_s_kgh_linha * n_linhas;
                    const m_s_kgh_primario = m_s_kgh_total / Math.max(n_primarios, 1);
                    const m_s_gs = m_s_kgh_linha * (1000 / 3600);
                    const N_r = (m_s_kgh_linha * 1000) / (V_r_mm3 * rho_s * 60);

                    const P_util_max = V_motor * I_max * eta_motor_dist;
                    const P_mec_req = (m_s_gs * E_dosador) / EFICIENCIA_REDUTOR;

                    const D_m = D_mm / 1000;
                    const D_primario_m = D_primario_pol * 0.0254;
                    const D_primario_mm = D_primario_m * 1000;
                    const areaSecundaria = (Math.PI * Math.pow(D_m, 2)) / 4;
                    const areaPrimaria = (Math.PI * Math.pow(D_primario_m, 2)) / 4;
                    const linhas_por_primario_media = n_linhas / Math.max(n_primarios, 1);
                    const distribuicaoInteira = Number.isInteger(linhas_por_primario_media);

                    const parametrosRede = {
                        vazaoTotalNominalM3Min: Q_turbina_m3min,
                        quantidadePrimarios: Math.max(n_primarios, 1),
                        quantidadeLinhas: Math.max(n_linhas, 1),
                        comprimentoPrimarioM: L_primario_m,
                        comprimentoSecundarioM: L_tubo_m,
                        diametroPrimarioM: D_primario_m,
                        diametroSecundarioM: D_m,
                        areaPrimaria,
                        areaSecundaria,
                        densidadeAr: rho_a,
                        fatorAtrito: fator_atrito,
                        pressaoMaxPa: pressao_turbina_max,
                        kTorre: k_torre,
                        massaSolidoPrimarioKgh: m_s_kgh_primario,
                        massaSolidoSecundarioKgh: m_s_kgh_linha
                    };

                    const redeDoisEstagios = simularRedePneumatica(parametrosRede);
                    const redeDireta = simularRedeDireta(parametrosRede);
                    const ganhoPressaoPa = redeDireta.deltaPLinha - redeDoisEstagios.deltaPTotal;
                    const ganhoVelocidadeMs = redeDoisEstagios.velocidadeSecundaria - redeDireta.velocidadeLinha;
                    const aproveitamentoTurbina = (redeDoisEstagios.vazaoTotalReal / Q_turbina_m3min) * 100;

                    let statusEletrico = "";
                    if (P_mec_req > P_util_max) {
                        statusEletrico = `<div class='alert alert-error'><strong>${textoIdioma('❌ MOTOR TRAVADO (SOBRECARGA)', '❌ MOTOR STALLED (OVERLOAD)')}</strong><br>${textoIdioma('A potência mecânica exigida é', 'The required mechanical power is')} <strong>${P_mec_req.toFixed(1)} W</strong>, ${textoIdioma('acima da potência útil máxima de', 'above the maximum useful power of')} <strong>${P_util_max.toFixed(1)} W</strong>.</div>`;
                    } else {
                        statusEletrico = `<div class='alert alert-success'><strong>${textoIdioma('✅ MOTOR DIMENSIONADO', '✅ MOTOR PROPERLY SIZED')}</strong><br>${textoIdioma('A potência mecânica exigida é de apenas', 'The required mechanical power is only')} <strong>${P_mec_req.toFixed(1)} W</strong>, ${textoIdioma('dentro do limite seguro do motor.', 'within the motor’s safe limit.')}</div>`;
                    }

                    let statusPneumatico = "";
                    if (redeDoisEstagios.deltaPTotal >= pressao_turbina_max) {
                        statusPneumatico = `<div class='alert alert-error' style="margin-top: 10px;"><strong>❌ ${textoIdioma('ESTOL DA TURBINA', 'TURBINE STALL')}</strong><br>${textoIdioma('A soma das perdas nos dutos primários, torre e linhas secundárias atingiu', 'The sum of losses in the primary ducts, tower, and secondary lines reached')} <strong>${redeDoisEstagios.deltaPTotal.toFixed(0)} Pa</strong>, ${textoIdioma('acima da pressão estática disponível.', 'above the available static pressure.')}</div>`;
                    } else if (redeDoisEstagios.velocidadeSecundaria < 15) {
                        statusPneumatico = `<div class='alert alert-error' style="margin-top: 10px;"><strong>❌ ${textoIdioma('RISCO DE ENTUPIMENTO NAS LINHAS FINAIS', 'RISK OF CLOGGING IN THE FINAL LINES')}</strong><br>${textoIdioma('A velocidade real nas linhas secundárias caiu para', 'The actual velocity in the secondary lines dropped to')} <strong>${redeDoisEstagios.velocidadeSecundaria.toFixed(1)} m/s</strong>. ${textoIdioma('O arraste já não é suficiente para manter fase diluída robusta.', 'The drag is no longer enough to maintain a robust dilute phase.')}</div>`;
                    } else if (redeDoisEstagios.slrSecundario > 8) {
                        statusPneumatico = `<div class='alert alert-error' style="margin-top: 10px;"><strong>❌ ${textoIdioma('AFOGAMENTO DAS LINHAS SECUNDÁRIAS', 'SECONDARY LINE FLOODING')}</strong><br>${textoIdioma('O SLR secundário subiu para', 'The secondary SLR rose to')} <strong>${redeDoisEstagios.slrSecundario.toFixed(2)}</strong>. ${textoIdioma('A linha final está ar/sólido demais para transporte estável.', 'The final line has too much air/solid ratio for stable transport.')}</div>`;
                    } else {
                        statusPneumatico = `<div class='alert alert-success' style="margin-top: 10px;"><strong>✅ ${textoIdioma('REDE PRIMÁRIA APROVEITANDO MELHOR A TURBINA', 'PRIMARY NETWORK MAKING BETTER USE OF THE TURBINE')}</strong><br>${textoIdioma('As linhas secundárias recebem', 'The secondary lines receive')} <strong>${redeDoisEstagios.velocidadeSecundaria.toFixed(1)} m/s</strong> ${textoIdioma('com perda total de', 'with total loss of')} <strong>${redeDoisEstagios.deltaPTotal.toFixed(0)} Pa</strong>. ${textoIdioma('Frente à divisão direta, o ganho de velocidade é', 'Compared with the direct split, the velocity gain is')} <strong>${ganhoVelocidadeMs.toFixed(1)} m/s</strong>.</div>`;
                    }

                    const avisoDistribuicao = !distribuicaoInteira
                        ? `<div class='alert alert-warning' style="margin-top: 10px;"><strong>${textoIdioma('⚠️ DIVISÃO MÉDIA NA TORRE', '⚠️ AVERAGE SPLIT AT THE TOWER')}</strong><br>${textoIdioma('O modelo assume balanceamento médio de', 'The model assumes an average balance of')} <strong>${linhas_por_primario_media.toFixed(2)}</strong> ${textoIdioma('linhas secundárias por duto primário. Se a torre real alimentar grupos diferentes, será preciso modelar cada ramo separadamente.', 'secondary rows per primary duct. If the actual tower feeds different groups, each branch must be modeled separately.')}</div>`
                        : '';

                    htmlEsquerdo = `
                        <h3 style="color: #fff; margin-bottom: 15px;">${textoIdioma('Dinâmica de Dosagem Agronômica', 'Agronomic Metering Dynamics')}</h3>
                        <div class="metrics-row">
                            <div class="metric-card" title="${textoIdioma('Velocidade exigida pela controladora do trator.', 'Speed required by the tractor controller.')}"><div class="metric-label">${textoIdioma('Rotação do Rolo', 'Roller Speed')}</div><div class="metric-value">${N_r.toFixed(1)} RPM</div></div>
                            <div class="metric-card" title="${textoIdioma('Massa de material despejado em uma única linha final.', 'Mass of material discharged into one final row.')}"><div class="metric-label">${textoIdioma('Taxa Mássica por Linha', 'Mass Flow per Row')}</div><div class="metric-value">${m_s_kgh_linha.toFixed(1)} kg/h</div></div>
                        </div>
                        <div class="metrics-row">
                            <div class="metric-card" title="${textoIdioma('Volume integral calculado por revolução a partir da geometria do rolo.', 'Integral volume calculated per revolution from roller geometry.')}"><div class="metric-label">${textoIdioma('Volume Integral do Rolo', 'Integral Roller Volume')}</div><div class="metric-value">${V_r_mm3.toFixed(0)} mm³/rev</div></div>
                            <div class="metric-card" title="${textoIdioma('Vazão total de sólido entregue ao conjunto das linhas finais.', 'Total solid flow delivered to the set of final rows.')}"><div class="metric-label">${textoIdioma('Taxa Mássica Total', 'Total Mass Flow')}</div><div class="metric-value">${m_s_kgh_total.toFixed(1)} kg/h</div></div>
                        </div>
                        <h3 style="color: #fff; margin-bottom: 15px;">${textoIdioma('Rede Pneumática em Dois Estágios', 'Two-Stage Pneumatic Network')}</h3>
                        <div class="metrics-row">
                            <div class="metric-card" title="${textoIdioma('Velocidade real do ar nos dutos primários de grande diâmetro.', 'Actual air velocity in the large-diameter primary ducts.')}"><div class="metric-label">${textoIdioma('Velocidade no Duto Primário', 'Primary Duct Velocity')}</div><div class="metric-value">${redeDoisEstagios.velocidadePrimaria.toFixed(1)} m/s</div></div>
                            <div class="metric-card" title="${textoIdioma('Velocidade real do ar nas linhas secundárias de aplicação.', 'Actual air velocity in the application secondary lines.')}"><div class="metric-label">${textoIdioma('Velocidade na Linha Secundária', 'Secondary Line Velocity')}</div><div class="metric-value">${redeDoisEstagios.velocidadeSecundaria.toFixed(1)} m/s</div></div>
                        </div>
                        <div class="metrics-row">
                            <div class="metric-card" title="${textoIdioma('Perda total do sistema considerando duto primário, torre e linha secundária.', 'Total system loss considering the primary duct, tower, and secondary line.')}"><div class="metric-label">${textoIdioma('Perda Total', 'Total Loss')}</div><div class="metric-value">${redeDoisEstagios.deltaPTotal.toFixed(0)} Pa</div></div>
                            <div class="metric-card" title="${textoIdioma('Diferença de pressão entre o arranjo com rede primária e a divisão direta nas linhas pequenas.', 'Pressure difference between the primary-network arrangement and the direct split across the small lines.')}"><div class="metric-label">${textoIdioma('Ganho vs Divisão Direta', 'Gain vs Direct Split')}</div><div class="metric-value">${ganhoPressaoPa.toFixed(0)} Pa</div></div>
                        </div>
                        <div class="metrics-row">
                            <div class="metric-card" title="${textoIdioma('Pressão estática remanescente na entrada da torre após o trecho primário.', 'Remaining static pressure at the tower inlet after the primary section.')}"><div class="metric-label">${textoIdioma('Pressão na Torre', 'Tower Pressure')}</div><div class="metric-value">${redeDoisEstagios.pressaoNaTorre.toFixed(0)} Pa</div></div>
                            <div class="metric-card" title="${textoIdioma('Pressão estática disponível na entrada das linhas secundárias após a perda no duto primário e na torre.', 'Available static pressure at the secondary-line inlet after losses in the primary duct and tower.')}"><div class="metric-label">${textoIdioma('Pressão nas Linhas', 'Line Pressure')}</div><div class="metric-value">${redeDoisEstagios.pressaoNaLinha.toFixed(0)} Pa</div></div>
                        </div>
                        <h3 style="color: #fff; margin-bottom: 15px;">${textoIdioma('Status do Sistema', 'System Status')}</h3>
                        ${statusEletrico}
                        ${statusPneumatico}
                        ${avisoDistribuicao}
                    `;

                    htmlDireito = `
                        <h3 style="color: #fff; margin-top: 0;">${textoIdioma('📚 Memorial da Semeadura', '📚 Seeding Calculation Report')}</h3>
                        <div style="margin-bottom: 15px; font-size: 0.9em; color: var(--text-muted);">
                            <strong>${textoIdioma('Rede Pneumática em Dois Estágios', 'Two-Stage Pneumatic Network')}</strong><br>
                            &bull; ${textoIdioma('Dutos primários', 'Primary ducts')}: ${n_primarios} ${textoIdioma('unidades de', 'units of')} ${D_primario_pol.toFixed(2)} ${textoIdioma('pol', 'in')} (${D_primario_mm.toFixed(1)} mm)<br>
                            &bull; ${textoIdioma('Linhas secundárias totais', 'Total secondary rows')}: ${n_linhas}<br>
                            &bull; ${textoIdioma('Média de linhas por torre', 'Average rows per tower')}: ${linhas_por_primario_media.toFixed(2)}<br>
                            &bull; ${textoIdioma('Fator de Atrito Darcy', 'Darcy Friction Factor')} (&lambda;): ${fator_atrito.toFixed(3)}<br>
                            &bull; ${textoIdioma('Perda Local da Torre', 'Tower Local Loss')} (K): ${k_torre.toFixed(2)}<br>
                            &bull; ${textoIdioma('Aproveitamento de vazão da turbina', 'Turbine flow utilization')}: ${aproveitamentoTurbina.toFixed(0)}%
                        </div>
                        <div class="memorial-item">
                            <strong title="${textoIdioma('Relação geométrica do volume do rolo com a espessura, discos e cavidades.', 'Geometric relation between roller volume, thickness, discs, and cavities.')}">
                                <a href="https://openstax.org/books/college-physics-2e/pages/12-1-flow-rate-and-its-relation-to-velocity" target="_blank" style="color: inherit; text-decoration: underline;">${textoIdioma('1. Volume Integral do Rolo por Revolução', '1. Integral Roller Volume per Revolution')}</a>
                            </strong><br>
                            <p style="margin: 10px 0 5px 0; font-size: 0.9em;">${textoIdioma('Composição geométrica do volume útil por rotação:', 'Geometric composition of the useful volume per rotation:')}</p>
                            $$ \\require{action} ${variavelFormula('V_r', 'volumeRolo')} = ${variavelFormula('\\mathrm{' + textoIdioma('espessura', 'thickness') + '}', 'espessuraDisco')} \\cdot ${variavelFormula('\\mathrm{' + textoIdioma('discos', 'discs') + '}', 'discosAtivos')} \\cdot ${variavelFormula('\\mathrm{' + textoIdioma('cavidades', 'cavities') + '}', 'cavidadesDisco')} \\cdot ${variavelFormula('\\mathrm{' + textoIdioma('área', 'area') + '}', 'areaCavidade')} $$
                            $$ \\require{action} \\texttip{V_r}{[mm³/rev] Volume Integral do Rolo. Definição: Capacidade volumétrica total a cada volta do eixo.} = \\texttip{${espessura_disco.toFixed(0)}}{[mm] Espessura do Disco. Impacto: Espessuras maiores aumentam o volume geométrico da fatia do rolo, permitindo reduzir a RPM do motor elétrico para atingir a mesma dose.} \\cdot \\texttip{${qtd_discos_uteis.toFixed(0)}}{[un] Quantidade de Discos Úteis. Impacto: Adicionar discos multiplica transversalmente a capacidade volumétrica final da máquina.} \\cdot \\texttip{${cavidades_por_disco.toFixed(0)}}{[un] Cavidades por Disco. Impacto: Define a quantidade de 'pulsos' de semente despejados a cada volta. Mais cavidades suavizam o fluxo contínuo na mangueira.} \\cdot \\texttip{${area_lateral_cavidade.toFixed(0)}}{[mm²] Área Lateral da Cavidade. Impacto: Funciona como o tamanho da 'colher' que pega o grão. Sementes grandes como soja/milho exigem áreas maiores para não serem esmagadas na roseta.} = \\texttip{${V_r_mm3.toFixed(0)}}{[mm³/rev] Volume Integral Calculado. Impacto: É a cilindrada matemática bruta do rotor. Dita a relação direta entre o giro do motor elétrico e a massa despejada no tubo.} \\text{ mm}^3\\text{/rev} $$
                        </div>
                        <div class="memorial-item">
                            <strong title="${textoIdioma('Conversão agronômica de taxa por área para vazão mássica por linha.', 'Agronomic conversion from rate per area to mass flow per row.')}">
                                <a href="https://www.nist.gov/pml/special-publication-811/nist-guide-si-chapter-5-units-outside-si" target="_blank" style="color: inherit; text-decoration: underline;">${textoIdioma('2. Taxa Mássica por Linha', '2. Mass Flow per Row')}</a>
                            </strong><br>
                            <p style="margin: 10px 0 5px 0; font-size: 0.9em;">${textoIdioma('Conversão dimensional para cada linha final:', 'Dimensional conversion for each final row:')}</p>
                            $$ \\require{action} ${variavelFormula('\\dot{m}_{linha}', 'massaLinha')} = \\frac{${variavelFormula('T_{ha}', 'taxaHectare')} \\cdot ${variavelFormula('v_{trator}', 'velocidadeTrator')} \\cdot ${variavelFormula('L_{linha}', 'larguraLinha')}}{${variavelFormula('10', 'conversaoAgronomica')}} $$
                            $$ \\require{action} ${variavelFormula('\\dot{m}_{total}', 'massaTotal')} = ${variavelFormula('\\dot{m}_{linha}', 'massaLinha')} \\cdot ${variavelFormula('n_{linhas}', 'numeroLinhas')} $$
                            $$ \\require{action} ${variavelFormula('N_r', 'rotacaoDosador')} = \\frac{${variavelFormula('\\dot{m}_{linha}', 'massaLinha')} \\cdot ${variavelFormula('1000', 'conversaoAgronomica')} / ${variavelFormula('60', 'conversaoMinuto')}}{${variavelFormula('V_r', 'volumeRolo')} \\cdot ${variavelFormula('\\rho_s', 'densidadeSolido')}} $$
                            $$ \\require{action} \\texttip{\\dot{m}_{linha}}{[kg/h] Fluxo Mássico por Linha. Definição: Massa de insumo exigida por hora em uma única mangueira final.} = \\frac{\\texttip{${taxa_ha.toFixed(1)}}{[kg/ha] Taxa Agronômica Alvo. Impacto: É a exigência pura do produtor no campo. Taxas altas exigem giro mais rápido e empurram mais massa densa para as mangueiras, elevando a chance de entupir.} \\cdot \\texttip{${v_trator.toFixed(1)}}{[km/h] Velocidade Operacional do Trator. Impacto: Máquinas correndo rápido obrigam o dosador a disparar a RPM para compensar a distância percorrida no solo.} \\cdot \\texttip{${largura.toFixed(2)}}{[m] Largura de Trabalho por Linha (Espaçamento). Impacto: Linhas mais espaçadas forçam uma maior injeção de insumo dentro de um mesmo sulco para bater a taxa por hectare.}}{\\texttip{10}{Constante metrológica. Impacto: Fator físico obrigatório para ajustar e cruzar as unidades rurais (hectares, km/h) para as grandezas do Sistema Internacional (kg/h).}} = \\texttip{${m_s_kgh_linha.toFixed(2)}}{[kg/h] Massa Individual Exigida por Linha. Impacto: Define a carga absoluta de peso de adubo/semente que o vento da turbina será obrigado a arrastar na tubulação secundária.} \\text{ kg/h} $$
                            $$ \\require{action} \\texttip{\\dot{m}_{total}}{[kg/h] Fluxo Mássico Total. Definição: Massa combinada exigida por todas as linhas da máquina.} = \\texttip{${m_s_kgh_linha.toFixed(2)}}{[kg/h] Massa exigida calculada no passo anterior, referente a uma única linha de plantio descendo do Air Cart.} \\cdot \\texttip{${n_linhas}}{[un] Número Total de Linhas da Máquina. Impacto: É o multiplicador extremo do implemento. 60 linhas exigem mangueiramentos massivos e turbinas F10 na exaustão térmica.} = \\texttip{${m_s_kgh_total.toFixed(2)}}{[kg/h] Massa Total Global. Impacto: Representa as centenas de quilos de insumo bruto que o reservatório superior e o ventilador terão de processar em conjunto a cada hora relógio.} \\text{ kg/h} $$
                            $$ \\require{action} \\texttip{N_r}{[RPM] Rotação do Dosador. Definição: Rotação comandada pela ECU para atingir a taxa alvo.} = \\frac{\\texttip{${m_s_kgh_linha.toFixed(2)}}{[kg/h] Fluxo mássico caindo por cada linha acoplada ao dosador.} \\cdot \\texttip{1000}{[Conversão]. Impacto: Transforma quilos em gramas para equivaler volumetricamente.} / \\texttip{60}{[Conversão]. Impacto: Fatora as horas em minutos para obter Rotações Por Minuto (RPM).}}{\\texttip{${V_r_mm3.toFixed(0)}}{[mm³/rev] Volume (Cilindrada) do rolo acrílico ou de chapa calculado na Etapa 1.} \\cdot \\texttip{${rho_s}}{[g/mm³] Densidade do Material Sólido. Impacto: Adubos cristalizados muito pesados reduzem drasticamente a rotação mecânica para bater o alvo da balança; material ultra-leve acelera o eixo.}} = \\texttip{${N_r.toFixed(2)}}{[RPM] Rotação Alvo Controlada. Impacto: É o pulso elétrico exato que a central ISOBUS do trator enviará ao motoredutor ROJ do seu dosador para manter a prescrição.} \\text{ RPM} $$
                        </div>
                        <div class="memorial-item">
                            <strong title="Potência elétrica e potência mecânica com eficiência do motor.">
                                <a href="https://openstax.org/books/college-physics-2e/pages/20-4-electric-power-and-energy" target="_blank" style="color: inherit; text-decoration: underline;">${textoIdioma('3. Potência do Motor do Dosador', '3. Doser Motor Power')}</a>
                            </strong><br>
                            <p style="margin: 10px 0 5px 0; font-size: 0.9em;">${textoIdioma('Capacidade mecânica do motor e potência requerida no dosador:', 'Mechanical motor capacity and required doser power:')}</p>
                            $$ \\require{action} \\texttip{P_{util,max}}{[W] Potência Útil Máxima. Definição: Capacidade de trabalho mecânico limite do motor elétrico.} = \\texttip{V_{motor}}{[V] Tensão Contínua.} \\cdot \\texttip{I_{max}}{[A] Corrente Máxima.} \\cdot \\texttip{\\eta_{motor}}{[%] Eficiência Mecânica do Motor.} $$
                            $$ \\require{action} \\texttip{P_{util,max}}{[W] Potência Útil Máxima. Definição: Capacidade de trabalho mecânico limite do motor elétrico.} = \\texttip{${V_motor.toFixed(1)}}{[V] Tensão Contínua. Impacto: Diferença de potencial limitante ditada pelas baterias e alternador do trator.} \\cdot \\texttip{${I_max.toFixed(1)}}{[A] Corrente Máxima. Impacto: É a blindagem térmica da engenharia. Acima dessa amperagem, o esmalte das bobinas superaquece, trinca e gera curto-circuito em campo.} \\cdot \\texttip{${eta_motor_dist.toFixed(2)}}{[%] Eficiência Mecânica do Motor. Impacto: Parcela limpa e nobre da eletricidade que efetivamente se converte em torção mecânica no eixo; a sobra (ex: 25%) é lixo térmico.} = \\texttip{${P_util_max.toFixed(1)}}{[W] Potência Útil Teto Disponível. Impacto: É a força de emergência máxima que seu motor elétrico tem guardada para esmagar uma pedra intrusa no adubo sem desligar.} \\text{ W} $$
                            $$ \\require{action} \\texttip{P_{req}}{[W] Potência Requerida. Definição: Trabalho mecânico exigido para dosar o material.} = \\frac{\\texttip{${m_s_gs.toFixed(3)}}{[g/s] Taxa Instantânea em Gramas. Impacto: Quantidade bruta de material mordida a cada fração de segundo pelo rotor azul estriado.} \\cdot \\texttip{${E_dosador.toFixed(2)}}{[J/g] Energia de Trabalho Mecânico do Dosador. Impacto: Se o material for úmido e muito colante (alta energia requerida), essa métrica salta violentamente e arrasta o motor para baixo.}}{\\texttip{${EFICIENCIA_REDUTOR}}{[%] Eficiência da Transmissão (Redutor Planetário/Ortogonal). Impacto: Perda natural termodinâmica devido ao atrito de aço com aço nas engrenagens redutoras que acoplam o motor no eixo.}} = \\texttip{${P_mec_req.toFixed(2)}}{[W] Potência Requerida Atual. Impacto: A força real do momento. Se esse número ultrapassar a potência útil da linha de cima, seu dosador fatalmente irá estolar (travar duro) no plantio.} \\text{ W} $$
                        </div>
                        <div class="memorial-item green">
                            <strong title="Conversão exata do diâmetro primário de polegadas para SI.">
                                <a href="https://www.nist.gov/pml/us-surveyfoot/revised-unit-conversion-factors" target="_blank" style="color: inherit; text-decoration: underline;">${textoIdioma('4. Conversão do Duto Primário para SI', '4. Primary Duct Conversion to SI')}</a>
                            </strong><br>
                            <p style="margin: 10px 0 5px 0; font-size: 0.9em;">${textoIdioma('Usando 1 ft = 0,3048 m exato, então 1 in = 0,0254 m:', 'Using exact 1 ft = 0.3048 m, so 1 in = 0.0254 m:')}</p>
                            $$ \\require{action} \\texttip{D_{prim}}{[m] Diâmetro Primário. Definição: Diâmetro interno do duto primário convertido para SI.} = \\texttip{D_{pol}}{[pol] Diâmetro em Polegadas.} \\cdot \\texttip{0.0254}{[m/pol] Conversão exata de polegadas para metros.} $$
                            $$ \\require{action} \\texttip{D_{prim}}{[m] Diâmetro Primário. Definição: Diâmetro interno do duto primário convertido para SI.} = \\texttip{${D_primario_pol.toFixed(2)}}{[pol] Diâmetro em Polegadas (Bitola Comercial). Impacto: Medida de prateleira da mangueira corrugada primária robusta, vital para alívio da pressão da turbina.} \\cdot \\texttip{0.0254}{[Constante Universal]. Impacto: Converte perfeitamente as polegadas rurais americanas no formato métrico exigido pelas equações clássicas da mecânica dos fluidos.} = \\texttip{${D_primario_m.toFixed(4)}}{[m] Diâmetro Primário Científico. Impacto: A base métrica rigorosa para a extração algébrica da área transversal do cano.} \\text{ m} $$
                            $$ \\require{action} \\texttip{A_{prim}}{[m²] Área Primária. Definição: Área da seção transversal do duto primário.} = \\frac{\\pi \\cdot \\texttip{${D_primario_m.toFixed(4)}^2}{O diâmetro isolado na etapa anterior, agora exposto ao quadrado para revelar o envelope bidimensional interno do tubo.}}{\\texttip{4}{Divisor base geométrico utilizado universalmente em equações circulares de caldeiraria e tubulações focadas no diâmetro (pi*D²/4).}} = \\texttip{${areaPrimaria.toFixed(4)}}{[m²] Área Transversal Interna. Impacto: Áreas muito estreitas estrangulam a saída da Punker; áreas gigantemente largas derrubam o ar a uma velocidade de brisa frouxa (entupindo fácil).} \\text{ m}^2 $$
                        </div>
                        <div class="memorial-item green">
                            <strong title="Continuidade na rede primária até a torre.">
                                <a href="https://openstax.org/books/college-physics-2e/pages/12-1-flow-rate-and-its-relation-to-velocity" target="_blank" style="color: inherit; text-decoration: underline;">${textoIdioma('5. Continuidade nos Dutos Primários', '5. Continuity in Primary Ducts')}</a>
                            </strong><br>
                            <p style="margin: 10px 0 5px 0; font-size: 0.9em;">${textoIdioma('A vazão total é dividida primeiro pelos dutos grandes:', 'The total flow is first split by the large ducts:')}</p>
                            $$ \\require{action} ${variavelFormula('Q_{prim}', 'vazaoPrimaria')} = \\frac{${variavelFormula('Q_{total,real}', 'vazaoTotal')}}{${variavelFormula('n_{prim}', 'numeroPrimarios')}} $$
                            $$ \\require{action} ${variavelFormula('v_{prim}', 'velocidadePrimaria')} = \\frac{${variavelFormula('Q_{prim}', 'vazaoPrimaria')} / ${variavelFormula('60', 'conversaoMinuto')}}{${variavelFormula('A_{prim}', 'areaPrimaria')}} $$
                            $$ \\require{action} ${variavelFormula('SLR_{prim}', 'slrPrimario')} = \\frac{${variavelFormula('\\dot{m}_{s,prim}', 'massaSolidoPrimario')}}{${variavelFormula('\\dot{m}_{ar,prim}', 'massaArPrimario')}} $$
                            $$ \\require{action} \\texttip{Q_{prim}}{[m³/min] Vazão por Duto Primário. Definição: Quantidade de ar que passa por um único duto grosso.} = \\frac{\\texttip{${redeDoisEstagios.vazaoTotalReal.toFixed(2)}}{[m³/min] Vazão Real Calculada da Máquina. Impacto: Ar total absoluto que a turbina ainda obteve coragem matemática para impelir após sentir todo o pesadelo do atrito.}}{\\texttip{${n_primarios}}{[un] Divisões do Coletor Base. Impacto: O Air Cart quebra e distribui seu tufão de vento primeiramente pelas pernas principais grossas da plantadeira.}} = \\texttip{${redeDoisEstagios.vazaoPrimariaReal.toFixed(2)}}{[m³/min] Vazão Isolada por Duto Principal. Impacto: É o pulmão exclusivo que abastecerá de vento a base estática de uma única Torre de Distribuição (cogumelo divisório) lá na frente.} \\text{ m}^3\\text{/min} $$
                            $$ \\require{action} \\texttip{v_{prim}}{[m/s] Velocidade Primária. Definição: Velocidade média do ar no duto primário.} = \\frac{\\texttip{${redeDoisEstagios.vazaoPrimariaReal.toFixed(2)}}{A vazão isolada e dedicada apenas ao cano grosso no trecho do chassi.} / \\texttip{60}{Fator conversor de Tempo. Reduz métrica pesada de minutos para segundos SI.}}{\\texttip{${areaPrimaria.toFixed(4)}}{Seção Transversal Circular extraída no Passo 4 (m²).}} = \\texttip{${redeDoisEstagios.velocidadePrimaria.toFixed(2)}}{[m/s] Velocidade Bruta Primária. Impacto: Força frontal maciça com que o ar captura a semente que acabou de chover da boca do dosador elétrico em direção à torre.} \\text{ m/s} $$
                            $$ \\require{action} \\texttip{SLR_{prim}}{[Adim.] Razão de Carregamento (Duto). Definição: Relação mássica Insumo/Ar no trecho primário.} = \\frac{\\texttip{${m_s_kgh_primario.toFixed(2)}}{[kg/h] Massa Individual da Tubulação. Impacto: O peso acumulado das sementes daquele cluster.}}{\\texttip{${redeDoisEstagios.massaArPrimariaKgh.toFixed(2)}}{[kg/h] Massa Transportadora Gasosa. Impacto: O peso etéreo do ar que forma o colchão fluidizado suspensor das partículas densas de adubo.}} = \\texttip{${redeDoisEstagios.slrPrimario.toFixed(2)}}{[Adim.] Fator SLR do Trecho 1. Impacto: Razão Sólido/Gás. Limiar superior a 5 aproxima o maquinário rural a zonas perigosas de estrangulamento coloidal intermitente e pulsações violentas nas torres.} $$
                        </div>
                        <div class="memorial-item yellow">
                            <strong title="Perda distribuída por atrito ao longo do duto primário.">
                                <a href="https://www.engineeringtoolbox.com/darcy-weisbach-equation-d_646.html" target="_blank" style="color: inherit; text-decoration: underline;">${textoIdioma('6. Perda no Duto Primário (Darcy-Weisbach)', '6. Primary Duct Loss (Darcy-Weisbach)')}</a>
                            </strong><br>
                            <p style="margin: 10px 0 5px 0; font-size: 0.9em;">${textoIdioma('Perda distribuída com correção simplificada para sólido em suspensão:', 'Distributed loss with simplified correction for solid suspension:')}</p>
                            $$ \\require{action} ${variavelFormula('\\Delta P_{prim}', 'perdaPrimaria')} = ${variavelFormula('\\lambda', 'fatorAtrito')} \\cdot \\frac{${variavelFormula('L_{prim}', 'comprimentoPrimario')}}{${variavelFormula('D_{prim}', 'diametroPrimario')}} \\cdot \\frac{${variavelFormula('\\rho_a', 'densidadeAr')} \\cdot ${variavelFormula('v_{prim}^{2}', 'velocidadePrimaria')}}{${variavelFormula('2', 'divisorArea')}} \\cdot (1 + ${variavelFormula('SLR_{prim}', 'slrPrimario')}) $$
                            $$ \\require{action} \\texttip{\\Delta P_{prim}}{[Pa] Perda Distribuída Primária. Definição: Queda de pressão por atrito na extensão do tubo primário.} = \\texttip{${fator_atrito.toFixed(3)}}{[Adim.] Atrito Friccional Darcy-Weisbach (Lambda). Impacto: Tubulações flexíveis sanfonadas raspam e frenam severamente o ar (fator sobe). Tubos PVC ou PU liso espelhado conservam imensamente a energia cinética (fator cai).} \\cdot \\frac{\\texttip{${L_primario_m.toFixed(2)}}{[m] Comprimento Físico Linear da Tubulação Primária do chassi do Air Cart. Impacto: Custo friccional quilométrico ao escoamento.}}{\\texttip{${D_primario_m.toFixed(4)}}{[m] Diâmetro Base. Impacto: Quanto mais grosso e espaçoso o túnel flexível, menos arrasto nas margens o vento sentirá.}} \\cdot \\frac{\\texttip{${rho_a.toFixed(2)}}{[kg/m³] Densidade Termodinâmica (Tensão superficial do gás nas mangueiras flexíveis do trator).} \\cdot \\texttip{${redeDoisEstagios.velocidadePrimaria.toFixed(2)}^2}{A quadratura caótica da velocidade de vento da linha grossa punindo impiedosamente a turbina se os diâmetros primários forem muito delgados e longos.}}{\\texttip{2}{Estabilizador algébrico da constante universal associada na pressão e energia cinética de empuxo dos fluidos industriais gasosos.}} \\cdot (1 + \\texttip{${redeDoisEstagios.slrPrimario.toFixed(2)}}{A somatória do arrasto pesado inerente e colisional da semente caindo pela extensão cilíndrica.}) $$
                            $$ \\require{action} \\texttip{\\Delta P_{prim}}{[Pa] Perda Distribuída Primária. Definição: Queda de pressão por atrito na extensão do tubo primário.} = \\texttip{${redeDoisEstagios.deltaPPrimario.toFixed(0)}}{[Pa] Resistência Acumulada Primária Total. Impacto: Quantidade nítida de sucção magnética fantasma e atrito puro que se opõe passivamente à descarga exaustora originária do ventilador de hélice curva.} \\text{ Pa} $$
                        </div>
                        <div class="memorial-item yellow">
                            <strong title="Perda localizada por divisão e mudança de direção na torre.">
                                <a href="https://www.engineeringtoolbox.com/minor-loss-air-ducts-fittings-d_208.html" target="_blank" style="color: inherit; text-decoration: underline;">${textoIdioma('7. Perda Localizada da Torre', '7. Tower Local Loss')}</a>
                            </strong><br>
                            <p style="margin: 10px 0 5px 0; font-size: 0.9em;">${textoIdioma('Modelo de perda localizada com coeficiente K referido à velocidade no duto primário:', 'Local loss model with K coefficient referenced to primary duct velocity:')}</p>
                            $$ \\require{action} ${variavelFormula('\\Delta P_{torre}', 'perdaTorre')} = ${variavelFormula('K_{torre}', 'coeficienteTorre')} \\cdot \\frac{${variavelFormula('\\rho_a', 'densidadeAr')} \\cdot ${variavelFormula('v_{prim}^{2}', 'velocidadePrimaria')}}{${variavelFormula('2', 'divisorArea')}} \\cdot (1 + ${variavelFormula('SLR_{prim}', 'slrPrimario')}) $$
                            $$ \\require{action} \\texttip{\\Delta P_{torre}}{[Pa] Perda Localizada (Torre). Definição: Dissipação de energia cinética por turbulência no cogumelo divisor.} = \\texttip{${k_torre.toFixed(2)}}{[Adim.] Coeficiente Arquitetônico Obstrutivo Local de Torre de Choque (Fator K). Impacto: Torre cogumelo chata, reta 90° e plana no teto explode a turbulência (K altíssimo; ex: 1,8); Torre de ogiva cônica pontiaguda lisa acalma o ar com desvios em lâminas suaves (K minúsculo; ex: 0,3).} \\cdot \\frac{\\texttip{${rho_a.toFixed(2)}}{Densidade natural do balanço.} \\cdot \\texttip{${redeDoisEstagios.velocidadePrimaria.toFixed(2)}^2}{[m/s] Fatoração caótica violenta explodindo nas costelas oblíquas metálicas das aletas curvas na redoma da torre.}}{\\texttip{2}{Estabilizador de conversão fluidodinâmica termocinética de pressão.}} \\cdot (1 + \\texttip{${redeDoisEstagios.slrPrimario.toFixed(2)}}{Projeção de peso da poeira da braquiária ricocheteando brutalmente e estancando no cogumelo difusor mecânico superior.}) $$
                            $$ \\require{action} \\texttip{\\Delta P_{torre}}{[Pa] Perda Localizada (Torre). Definição: Dissipação de energia cinética por turbulência no cogumelo divisor.} = \\texttip{${redeDoisEstagios.deltaPTorre.toFixed(0)}}{[Pa] Sangria Plena de Choque da Transição da Torre Distributiva de Escoamento. Impacto: Indica se o domo da torre virou um gargalo inaceitável. O alvo clássico de engenheiros de design industrial em arado é manter esta métrica microscópica perante o todo.} \\text{ Pa} $$
                        </div>
                        <div class="memorial-item green">
                            <strong title="Continuidade nas linhas menores após a torre.">
                                <a href="https://openstax.org/books/college-physics-2e/pages/12-1-flow-rate-and-its-relation-to-velocity" target="_blank" style="color: inherit; text-decoration: underline;">${textoIdioma('8. Continuidade nas Linhas Secundárias', '8. Continuity in Secondary Lines')}</a>
                            </strong><br>
                            <p style="margin: 10px 0 5px 0; font-size: 0.9em;">${textoIdioma('A vazão real remanescente é dividida entre as linhas finais:', 'The remaining real flow is divided among the final rows:')}</p>
                            $$ \\require{action} ${variavelFormula('A_{sec}', 'areaSecundaria')} = \\frac{${variavelFormula('\\pi', 'pi')} \\cdot ${variavelFormula('D_{sec}^{2}', 'diametroSecundario')}}{${variavelFormula('4', 'divisorArea')}} $$
                            $$ \\require{action} ${variavelFormula('Q_{sec}', 'vazaoSecundaria')} = \\frac{${variavelFormula('Q_{total,real}', 'vazaoTotal')}}{${variavelFormula('n_{linhas}', 'numeroLinhas')}} $$
                            $$ \\require{action} ${variavelFormula('v_{sec}', 'velocidadeSecundaria')} = \\frac{${variavelFormula('Q_{sec}', 'vazaoSecundaria')} / ${variavelFormula('60', 'conversaoMinuto')}}{${variavelFormula('A_{sec}', 'areaSecundaria')}} $$
                            $$ \\require{action} ${variavelFormula('SLR_{sec}', 'slrSecundario')} = \\frac{${variavelFormula('\\dot{m}_{s,linha}', 'massaLinha')}}{${variavelFormula('\\dot{m}_{ar,sec}', 'massaArSecundario')}} $$
                            $$ \\require{action} \\texttip{A_{sec}}{[m²] Área Secundária. Definição: Área da seção transversal da mangueira fina.} = \\frac{\\pi \\cdot \\texttip{${D_m.toFixed(4)}^2}{Diâmetro fino engasgado da tubulação fina escorrendo arame liso para a extremidade terminal em milímetros.}}{\\texttip{4}{Divisor de planificação redonda da sessão retangular.}} = \\texttip{${areaSecundaria.toFixed(4)}}{[m²] Canal Secundário Minúsculo Transversal. Impacto: Tubagens muito curtas agudamente finalizam o afunilamento de Bernoulli para tentar recuperar velocidades moribundas após a torre.} \\text{ m}^2 $$
                            $$ \\require{action} \\texttip{Q_{sec}}{[m³/min] Vazão por Linha. Definição: Quantidade de ar que passa por uma única mangueira secundária.} = \\frac{\\texttip{${redeDoisEstagios.vazaoTotalReal.toFixed(2)}}{Vazão Integral Atuante.}}{\\texttip{${n_linhas}}{[un] Fracionamento Micro-Segmentar Oblíquo Total da Semeadora de 60 linhas paralelas. Impacto: O pulverizador do exaustor mestre de injeção original.}} = \\texttip{${redeDoisEstagios.vazaoSecundariaReal.toFixed(2)}}{[m³/min] Vazão Tênue Marginal Injetada Diretamente. Impacto: Quantidade delicadíssima real enviada gota a gota para proteger do embuchamento as ponteiras finais plantadoras de braquiária do disco duplo cortador de solo profundo.} \\text{ m}^3\\text{/min} $$
                            $$ \\require{action} \\texttip{v_{sec}}{[m/s] Velocidade Secundária. Definição: Velocidade final de arraste na mangueira. Essencial para evitar embuchamento.} = \\frac{\\texttip{${redeDoisEstagios.vazaoSecundariaReal.toFixed(2)}}{Vazão minuciosa remanescente fluida na mangueirinha.} / \\texttip{60}{Relatório conversional de desmembramento temporal.}}{\\texttip{${areaSecundaria.toFixed(4)}}{Aperto transversal geofísico limitador das condutas finais restritivas.}} = \\texttip{${redeDoisEstagios.velocidadeSecundaria.toFixed(2)}}{[m/s] CÚPULA DE VELOCIDADE CLÍNICA FINAL (ZONA DE SALTAÇÃO EXTREMA E FATAL PARA ENTUPIMENTO). Impacto: A sentinela mestra da mecânica plantadora! Abaixo de gloriosos 15 metros cravados oscilando e rangendo a mangueira o fluxo sucumbe, o grão despenca como pedras fúteis para a gravidade trágica trancando e engasgando o terminal difusor da plantadeira mortalmente!} \\text{ m/s} $$
                            $$ \\require{action} \\texttip{SLR_{sec}}{[Adim.] Razão de Carregamento (Mangueira). Definição: Relação mássica Insumo/Ar na mangueira fina.} = \\frac{\\texttip{${m_s_kgh_linha.toFixed(2)}}{Massa micro pulverizada isolada individual finita pendular por roseta das cavidades rurais do cilindro dentado acrílico de cor opaca.}}{\\texttip{${redeDoisEstagios.massaArSecundariaKgh.toFixed(2)}}{Respiro massivo aerodinâmico escasso em filetes de vento terminal restrito encurvado. }} = \\texttip{${redeDoisEstagios.slrSecundario.toFixed(2)}}{[Adim.] Coeficiente Pulmonar Gaseificado Mássico Friccional Secundário Mestre e de Carregamento. Impacto: Mostra o peso desproporcional do granulado para uma tubagem final extremamente restritiva de poliuretano, denunciando imediatamente o limite teto fatal do afogamento de adubo intermitente por cansaço aerodinâmico estrutural.} $$
                        </div>
                        <div class="memorial-item yellow">
                            <strong title="${textoIdioma('Perda distribuída nas linhas menores até o ponto de aplicação.', 'Distributed loss along the smaller lines up to the application point.')}">
                                <a href="https://www.engineeringtoolbox.com/darcy-weisbach-equation-d_646.html" target="_blank" style="color: inherit; text-decoration: underline;">${textoIdioma('9. Perda nas Linhas Secundárias', '9. Loss in Secondary Lines')}</a>
                            </strong><br>
                            <p style="margin: 10px 0 5px 0; font-size: 0.9em;">${textoIdioma('Perda distribuída no trecho final, já após a torre:', 'Distributed loss in the final section, after the tower:')}</p>
                            $$ \\require{action} ${variavelFormula('\\Delta P_{sec}', 'perdaSecundaria')} = ${variavelFormula('\\lambda', 'fatorAtrito')} \\cdot \\frac{${variavelFormula('L_{sec}', 'comprimentoSecundario')}}{${variavelFormula('D_{sec}', 'diametroSecundario')}} \\cdot \\frac{${variavelFormula('\\rho_a', 'densidadeAr')} \\cdot ${variavelFormula('v_{sec}^{2}', 'velocidadeSecundaria')}}{${variavelFormula('2', 'divisorArea')}} \\cdot (1 + ${variavelFormula('SLR_{sec}', 'slrSecundario')}) $$
                            $$ \\require{action} \\texttip{\\Delta P_{sec}}{[Pa] Perda Distribuída Secundária. Definição: Queda de pressão por atrito na extensão da mangueira fina.} = \\texttip{${fator_atrito.toFixed(3)}}{Atrito da parede do caninho flexível terminal descendo a máquina espinhosa.} \\cdot \\frac{\\texttip{${L_tubo_m.toFixed(2)}}{[m] Extensão Tormentosa Secundária Final da Mangueirinha fina enrodilhada contornando suspensões pantográficas pesadas das bandejas basculantes.}}{\\texttip{${D_m.toFixed(4)}}{Diâmetro asfixiante exato final minúsculo engolindo ar desesperadamente.}} \\cdot \\frac{\\texttip{${rho_a.toFixed(2)}}{Pesagem do vapor atmosférico.} \\cdot \\texttip{${redeDoisEstagios.velocidadeSecundaria.toFixed(2)}^2}{Impulso quadrado agressivo abrasivo rasgando o caninho internamente colidindo contra pedras minerais duras pontiagudas NPK 4-14-8 e polímeros corrugados plásticos da linha fina.}}{\\texttip{2}{Restritor Cinético Universal Base}} \\cdot (1 + \\texttip{${redeDoisEstagios.slrSecundario.toFixed(2)}}{Carga Sólida de embuchamento final na descida ao adubador pantográfico pendular oscilante.}) $$
                            $$ \\require{action} \\texttip{\\Delta P_{sec}}{[Pa] Perda Distribuída Secundária. Definição: Queda de pressão por atrito na extensão da mangueira fina.} = \\texttip{${redeDoisEstagios.deltaPSecundario.toFixed(0)}}{[Pa] Atrito Quilométrico Estancador Passivo Final de Tubulação Finíssima do Sistema Distributivo Pêndulo Oscilador Pantográfico Paralelogrâmico Traseiro da Plantadeira Maciça de 60 Linhas de Soja! Impacto: É a drenagem e derramamento de toda e qualquer energia pressional sobressalente da pobre turbina Punker antes do ar ir morrer em exaustão e decantar estéril no arado abrindo o leito espinhoso sulcado pela roseta desencontrada!} \\text{ Pa} $$
                        </div>
                        <div class="memorial-item red">
                            <strong title="${textoIdioma('Acoplamento iterativo entre a curva da turbina e as perdas do sistema.', 'Iterative coupling between turbine curve and system losses.')}">
                                <a href="https://www.engineeringtoolbox.com/fan-performance-characteristics-d_48.html" target="_blank" style="color: inherit; text-decoration: underline;">${textoIdioma('10. Fechamento da Rede e Comparação com Divisão Direta', '10. Network Closure and Direct Split Comparison')}</a>
                            </strong><br>
                            <p style="margin: 10px 0 5px 0; font-size: 0.9em;">${textoIdioma('O modelo recalcula a vazão até convergir entre a contrapressão total e a capacidade do soprador:', 'The model recalculates flow until it converges between total backpressure and blower capacity:')}</p>
                            $$ \\require{action} ${variavelFormula('\\Delta P_{total}', 'perdaTotal')} = ${variavelFormula('\\Delta P_{prim}', 'perdaPrimaria')} + ${variavelFormula('\\Delta P_{torre}', 'perdaTorre')} + ${variavelFormula('\\Delta P_{sec}', 'perdaSecundaria')} $$
                            $$ \\require{action} ${variavelFormula('f', 'fatorAcoplamento')} = 1 - \\frac{${variavelFormula('\\Delta P_{total}', 'perdaTotal')}}{${variavelFormula('P_{max}', 'pressaoMaxima')}} $$
                            $$ \\require{action} ${variavelFormula('Q_{total,real}', 'vazaoTotal')} = ${variavelFormula('f', 'fatorAcoplamento')} \\cdot ${variavelFormula('Q_{turbina}', 'vazaoTurbina')} $$
                            $$ \\require{action} \\texttip{\\Delta P_{total}}{[Pa] Perda de Carga Total. Definição: Contrapressão macro do sistema resistindo ao fluxo da turbina.} = \\texttip{${redeDoisEstagios.deltaPPrimario.toFixed(0)}}{Pressão Friccional Morta no Custo da Transferência de Carga Bruta Frontal Pela Parede de Borracha ou Silicone Grossa Liso} + \\texttip{${redeDoisEstagios.deltaPTorre.toFixed(0)}}{Soco Impactante Dinâmico Caótico Morto Fracassado no Teto do Chapéu Divisor ou Venturi Salvação} + \\texttip{${redeDoisEstagios.deltaPSecundario.toFixed(0)}}{Arrasto Espiral Espremido Serpenteante Estiolante das Linhas Longilíneas Sibilantes Mangueiradas} = \\texttip{${redeDoisEstagios.deltaPTotal.toFixed(0)}}{[Pa] BARREIRA RESISTIVA INTEGRAL DO SISTEMA. Impacto: A força cega invisível e brutal do vento engarrafado dentro da couraça de canos ocos colidindo empedernida batendo de frente contra o olho do furacão centrífugo metálico na boca exaustora da turbina Fprime de ferro trancando e ensurdecendo a mesma violentamente em desespero restritivo aerodinâmico!} \\text{ Pa} $$
                            $$ \\require{action} \\texttip{f}{[Adim.] Fator de Acoplamento. Definição: Fator de redução de vazão da turbina devido à contrapressão da rede.} = \\texttip{1}{Rendimento Livre Máximo Fantasia sem atrito.} - \\frac{\\texttip{${redeDoisEstagios.deltaPTotal.toFixed(0)}}{Frenagem e freio resistivo duro de trancar o vento.}}{\\texttip{${pressao_turbina_max.toFixed(0)}}{[Pa] Pressão Fechada Absoluta Trancada (Ponto Morto Estol). Impacto: A turbina uivará em 2900 RPM e nenhuma fagulha de ar escapará das suas beiradas emparedadas!}} = \\texttip{${redeDoisEstagios.fatorVazao.toFixed(3)}}{[Adim.] Ponto Cruzado de Equilíbrio Tênue Resultante de Escoamento Fluidodinâmico da Curva Plena Original Fabril de Desempenho. Impacto: A fatia matemática final gloriosa que escapou de toda a morte e restrição do sistema físico da tubagem!} $$
                            $$ \\require{action} \\texttip{Q_{total,real}}{[m³/min] Vazão Total Real. Definição: Volume de ar real que a turbina consegue empurrar na rede.} = \\texttip{${redeDoisEstagios.fatorVazao.toFixed(3)}}{Eficiência Final Acoplada Relativa Resistida} \\cdot \\texttip{${Q_turbina_m3min.toFixed(2)}}{Vazão Virgem Absoluta de Laboratório Ideal sem canos no vento frio limpo e silencioso germânico testado na Punker.} = \\texttip{${redeDoisEstagios.vazaoTotalReal.toFixed(2)}}{[m³/min] VAZÃO MAGISTRAL DE TRABALHO EMPÍRICA REAL E VERDADEIRA! Impacto: É este pulmão matemático inegável retroativo e exato que permitiu trancar o balanço e resolver em frações as velocidades milimétricas que manterão as toneladas de adubo e soja de 60 covas perfeitamente suspensas como mágica flutuante e assopradas contra o abismo do leito arado no solo quente da fazenda!} \\text{ m}^3\\text{/min} $$
                            <hr style="border: 0; border-top: 1px dashed rgba(255,255,255,0.05); margin: 10px 0;">
                            <p style="margin: 5px 0; font-size: 0.9em;">${textoIdioma(`Comparação com a divisão direta em ${n_linhas} linhas pequenas:`, `Comparison with direct split across ${n_linhas} small rows:`)}</p>
                            $$ \\require{action} \\texttip{\\Delta P_{${textoIdioma('direto', 'direct')}}}{${textoIdioma('[Pa] Perda direta. Definição: perda hipotética caso a turbina soprasse diretamente para as linhas pequenas sem torre divisora.', '[Pa] Direct loss. Definition: hypothetical loss if the turbine blew directly into the small rows without a distribution tower.')}} = \\texttip{${redeDireta.deltaPLinha.toFixed(0)}}{${textoIdioma('[Pa] Perda de pressão calculada para a divisão direta. Impacto: permite comparar a contrapressão desse arranjo com a rede em dois estágios.', '[Pa] Pressure loss calculated for the direct split. Impact: allows comparison of this arrangement’s backpressure with the two-stage network.')}} \\text{ Pa}, \\quad \\texttip{v_{${textoIdioma('direto', 'direct')}}}{${textoIdioma('[m/s] Velocidade direta. Definição: velocidade final hipotética no esquema de divisão direta.', '[m/s] Direct velocity. Definition: hypothetical final velocity in the direct-split arrangement.')}} = \\texttip{${redeDireta.velocidadeLinha.toFixed(2)}}{${textoIdioma('[m/s] Velocidade calculada nas linhas com divisão direta. Impacto: referência para avaliar o ganho ou a perda de velocidade da rede em dois estágios.', '[m/s] Velocity calculated in the rows with direct splitting. Impact: reference for evaluating the velocity gain or loss of the two-stage network.')}} \\text{ m/s} $$
                            $$ \\text{${textoIdioma('Ganho de pressão', 'Pressure gain')}} = \\texttip{${ganhoPressaoPa.toFixed(0)}}{${textoIdioma('[Pa] Diferença entre a perda da divisão direta e a perda da rede em dois estágios. Valor positivo indica menor perda na rede em dois estágios.', '[Pa] Difference between direct-split loss and two-stage-network loss. A positive value indicates lower loss in the two-stage network.')}} \\text{ Pa}, \\quad \\text{${textoIdioma('Ganho de velocidade', 'Velocity gain')}} = \\texttip{${ganhoVelocidadeMs.toFixed(2)}}{${textoIdioma('[m/s] Diferença entre a velocidade secundária da rede em dois estágios e a velocidade da divisão direta. Valor positivo indica aumento de velocidade.', '[m/s] Difference between the two-stage network’s secondary velocity and the direct-split velocity. A positive value indicates increased velocity.')}} \\text{ m/s} $$
                        </div>
                    `;

                } else {
                    // MODO 2: CINEMÁTICA DE ESPALHAMENTO - COM MATTER.JS
                    dom.distGrpModo1.classList.add('hidden');
                    dom.distGrpModo2.classList.remove('hidden');
                    
                    // Mostrar canvas e iniciar animação Matter.js
                    canvasDist.style.display = 'block';
                    ativarAnimacaoDosador = false; 
                    ativarAnimacaoDist = true;
                    redimensionarCanvasDist();
                    
                    // Inicializar Motor de Física
                    const v0_queda = parseFloat(dom.distV0.value) || 12;
                    const theta_angle = parseFloat(dom.distAngulo.value) || 30;
                    const h_altura = parseFloat(dom.distAltura.value) || 0.8;
                    const e_coef = parseFloat(dom.distCr.value) || 0.6;
                    
                    inicializarFisicaDistribuidor(theta_angle, v0_queda, h_altura, e_coef);

                    const largura_chapa_mm = parseFloat(dom.distLargChapa.value) || 100; // Usado APENAS visualmente no canvas
                    const diam_tubo_mm = parseFloat(dom.distDiamTubo2.value) || 40; 
                    const raio_mm = parseFloat(dom.distRaio.value) || 100;    
                    const v0_vertical = parseFloat(dom.distV0.value) || 12;  
                    const theta_deg = parseFloat(dom.distAngulo.value) || 30;
                    const h = parseFloat(dom.distAltura.value) || 0.8;        
                    const e_rest = parseFloat(dom.distCr.value) || 0.6;       
                    const g = GRAVIDADE_PADRAO;
                    
                    const diam_tubo_m = diam_tubo_mm / 1000;
                    const raio_m = raio_mm / 1000;

                    // FÍSICA DE REFLEXÃO ESPECULAR (FRONTAL XY)
                    const theta_rad = theta_deg * (Math.PI / 180);
                    const v_refl = v0_vertical * e_rest;
                    const angulo_saida_rad = 2 * theta_rad - (Math.PI / 2);
                    
                    const v_x = v_refl * Math.cos(angulo_saida_rad); 
                    const v_y = v_refl * Math.sin(angulo_saida_rad); 

                    // CINEMÁTICA DE QUEDA DA ALTURA h (Bhaskara)
                    const discriminante = Math.pow(v_y, 2) + 2 * g * h;
                    const t_queda = (v_y + Math.sqrt(discriminante)) / g;
                    const alcance_abs = Math.abs(v_x * t_queda);

                    // CÁLCULO FÍSICO DO ESPALHAMENTO TRANSVERSAL (EIXO Z - LATERAL)
                    // A largura física da chapa não afeta a matemática, exceto estruturalmente.
                    // O desvio lateral máximo é ditado APENAS pelo diâmetro do tubo.
                    const limite_seno = Math.min((diam_tubo_m / 2) / raio_m, 1);
                    const gama_max_rad = Math.asin(limite_seno);
                    const gama_max_deg = (gama_max_rad * 180) / Math.PI;
                    
                    const vz_max = v_refl * Math.sin(gama_max_rad);
                    const largura_faixa = (2 * vz_max * t_queda) + diam_tubo_m; 
                    const angulo_saida_deg = (angulo_saida_rad * 180) / Math.PI;

                    let statusCinematica = "";
                    if (alcance_abs < 0.02) {
                        statusCinematica = `<div class='alert alert-warning'><strong>⚠️ ESPALHAMENTO VERTICAL (QUEDA LIVRE)</strong><br><br>A inclinação da chapa (${theta_deg}°) está desviando a semente quase completamente para baixo (ângulo de saída: ${angulo_saida_deg.toFixed(1)}°). O material formará uma fileira grossa e concentrada no sulco.</div>`;
                    } else if (Math.abs(angulo_saida_deg) > 45) {
                        statusCinematica = `<div class='alert alert-warning'><strong>${textoIdioma('⚠️ DEFLEXÃO EXCESSIVA PARA CIMA', '⚠️ EXCESSIVE UPWARD DEFLECTION')}</strong><br><br>${textoIdioma(`O ângulo do defletor (${theta_deg}°) está lançando a semente para cima (ângulo: ${angulo_saida_deg.toFixed(1)}°). Alto risco de deriva pelo vento do ambiente externo.`, `The deflector angle (${theta_deg}°) is launching the seed upward (angle: ${angulo_saida_deg.toFixed(1)}°). High risk of drift caused by ambient wind.`)}</div>`;
                    } else {
                        statusCinematica = `<div class='alert alert-success'><strong>${textoIdioma('✅ DISTRIBUIÇÃO PARABÓLICA ATIVA', '✅ ACTIVE PARABOLIC DISTRIBUTION')}</strong><br><br>${textoIdioma(`Semente lançada frontalmente por <strong>${alcance_abs.toFixed(2)} m</strong> e espalhada lateralmente por causa do arco em uma faixa de <strong>${largura_faixa.toFixed(2)} m</strong>. Boa uniformidade.`, `Seed launched forward by <strong>${alcance_abs.toFixed(2)} m</strong> and spread laterally by the arc across a <strong>${largura_faixa.toFixed(2)} m</strong> swath. Good uniformity.`)}</div>`;
                    }

                    htmlEsquerdo = `
                        <h3 style="color: #fff; margin-bottom: 15px;">${textoIdioma('Mecânica do Impacto (Defletor)', 'Impact Mechanics (Deflector)')}</h3>
                        <div class="metrics-row">
                            <div class="metric-card" title="${textoIdioma('Velocidade vertical da semente ao atingir o defletor (após sair do tubo pneumático).', 'Vertical seed speed when reaching the deflector (after leaving the pneumatic tube).')}"><div class="metric-label">${textoIdioma('Velocidade de Queda (V₀)', 'Fall Velocity (V₀)')}</div><div class="metric-value">${v0_vertical.toFixed(1)} m/s</div></div>
                            <div class="metric-card" title="${textoIdioma('Velocidade da semente imediatamente após bater na chapa, descontada a perda pelo coeficiente de restituição.', 'Seed speed immediately after striking the plate, discounting the loss from the restitution coefficient.')}"><div class="metric-label">${textoIdioma('Velocidade Refletida (Vᵣ)', 'Reflected Velocity (Vᵣ)')}</div><div class="metric-value">${v_refl.toFixed(1)} m/s</div></div>
                        </div>
                        <h3 style="color: #fff; margin-bottom: 15px;">${textoIdioma('Análise Vetorial', 'Vector Analysis')}</h3>
                        <div class="metrics-row">
                            <div class="metric-card" title="${textoIdioma('Ângulo em relação à horizontal com que a semente é lançada pelo centro da chapa.', 'Angle relative to the horizontal at which the seed leaves the center of the plate.')}"><div class="metric-label">${textoIdioma('Ângulo Saída Frontal', 'Front Exit Angle')}</div><div class="metric-value">${angulo_saida_deg.toFixed(1)}°</div></div>
                            <div class="metric-card" title="${textoIdioma(`Desvio lateral tangencial na borda da chapa gerado pelo raio de curvatura de ${raio_mm} mm.`, `Tangential lateral deviation at the plate edge generated by the ${raio_mm} mm curvature radius.`)}"><div class="metric-label">${textoIdioma('Ângulo Curva Máx. (γ)', 'Maximum Curve Angle (γ)')}</div><div class="metric-value">${gama_max_deg.toFixed(1)}°</div></div>
                        </div>
                        <h3 style="color: #fff; margin-bottom: 15px;">${textoIdioma('Projeção Cinemática no Solo', 'Kinematic Projection on the Ground')}</h3>
                        <div class="metrics-row">
                            <div class="metric-card" title="Tempo total de voo da semente."><div class="metric-label">${textoIdioma('Tempo de Queda', 'Fall Time')}</div><div class="metric-value">${t_queda.toFixed(3)} s</div></div>
                            <div class="metric-card" title="Alcance longitudinal máximo gerado na linha da máquina (Eixo X)."><div class="metric-label">${textoIdioma('Alcance Longitudinal', 'Longitudinal Range')}</div><div class="metric-value">${alcance_abs.toFixed(2)} m</div></div>
                        </div>
                        <div class="metrics-row">
                            <div class="metric-card" style="grid-column: span 2;" title="A abertura total da faixa no solo provocada pelo espalhamento tangencial (Eixo Z)."><div class="metric-label">Largura da Faixa Distribuída (Espalhamento Z)</div><div class="metric-value">${largura_faixa.toFixed(2)} m</div></div>
                        </div>
                        <h3 style="color: #fff; margin-bottom: 15px;">${textoIdioma('Perfil de Distribuição', 'Distribution Profile')}</h3>
                        ${statusCinematica}
                    `;

                    htmlDireito = `
                        <h3 style="color: #fff; margin-top: 0;">${textoIdioma('📚 Memorial da Cinemática', '📚 Kinematics Calculation Report')}</h3>
                        <div style="margin-bottom: 15px; font-size: 0.9em; color: var(--text-muted);">
                            <strong>${textoIdioma('Física de Projéteis Assumida', 'Assumed Projectile Physics')}</strong><br>
                            &bull; ${textoIdioma('Tubo de descida estritamente vertical.', 'Strictly vertical descent tube.')}<br>
                            &bull; ${textoIdioma('Inclinação Frontal do Defletor', 'Front Deflector Inclination')}: ${theta_deg}°<br>
                            &bull; ${textoIdioma('Diâmetro do Tubo (D)', 'Tube Diameter (D)')}: ${diam_tubo_mm} mm<br>
                            &bull; ${textoIdioma('Raio de Curvatura Transversal (R)', 'Transverse Curvature Radius (R)')}: ${raio_mm} mm
                        </div>
                        
                        <div class="memorial-item">
                            <strong title="${textoIdioma('Coeficiente de restituição e elasticidade. Clique para referência.', 'Coefficient of restitution and elasticity. Click for reference.')}">
                                <a href="https://scienceworld.wolfram.com/physics/CoefficientofRestitution.html" target="_blank" style="color: inherit; text-decoration: underline;">${textoIdioma('1. Reflexão no Defletor Frontal (XY) 🔗', '1. Front Deflector Reflection (XY) 🔗')}</a>
                            </strong><br>
                            <p style="margin: 10px 0 5px 0; font-size: 0.9em;">${textoIdioma('Desvio baseado na lei da reflexão especular:', 'Deviation based on the law of specular reflection:')}</p>
                            $$ \\require{action} \\texttip{\\alpha}{${textoIdioma('[Graus] Ângulo de Saída. Definição: Ângulo do vetor de velocidade da semente após bater no defletor. Importância: Define a parábola de voo no eixo longitudinal.', '[Degrees] Exit Angle. Definition: Angle of the seed velocity vector after impact on the deflector. Importance: Defines the flight parabola along the longitudinal axis.')}} = 2 \\cdot \\texttip{\\theta}{${textoIdioma('[Graus] Ângulo da Chapa. Definição: Inclinação do defletor. Importância: Regula se a semente vai mais para frente ou mais para baixo.', '[Degrees] Plate Angle. Definition: Deflector inclination. Importance: Controls whether the seed goes more forward or more downward.')}} - 90^\\circ $$
                            $$ \\alpha = 2 \\cdot ${theta_deg}^\\circ - 90^\\circ $$
                            $$ \\alpha = ${angulo_saida_deg.toFixed(1)}^\\circ $$
                            <hr style="border: 0; border-top: 1px dashed rgba(255,255,255,0.05); margin: 10px 0;">
                            <p style="margin: 5px 0; font-size: 0.9em;">${textoIdioma('Velocidade de saída descontando a perda por restituição mecânica:', 'Exit speed discounting the loss from mechanical restitution:')}</p>
                            $$ \\require{action} \\texttip{V_r}{${textoIdioma('[m/s] Vel. Pós-Choque. Definição: Velocidade resultante após impacto. Importância: Vetor principal que será decomposto nos 3 eixos (X, Y, Z).', '[m/s] Post-impact velocity. Definition: Resulting speed after impact. Importance: Main vector to be decomposed into the 3 axes (X, Y, Z).')}} = \\texttip{V_0}{${textoIdioma('[m/s] Vel. Queda. Definição: Velocidade com que a semente desce do tubo pneumático. Importância: Dita a energia cinética inicial da colisão.', '[m/s] Fall speed. Definition: Speed at which the seed exits the pneumatic tube. Importance: Sets the initial kinetic energy of the collision.')}} \\cdot \\texttip{e}{${textoIdioma('[Adim.] Restituição. Definição: Coeficiente elástico do impacto. Importância: Aço puro repica mais (0.7); borracha amortece e espalha menos (0.4).', '[Dimensionless] Restitution. Definition: Impact elasticity coefficient. Importance: Bare steel rebounds more (0.7); rubber dampens and spreads less (0.4).')}} $$
                            $$ V_r = ${v0_vertical.toFixed(1)} \\cdot ${e_rest.toFixed(2)} $$
                            $$ V_r = ${v_refl.toFixed(2)} \\text{ m/s} $$
                        </div>

                        <div class="memorial-item yellow">
                            <strong title="${textoIdioma('Equações do movimento de projéteis com aceleração gravitacional constante. Clique para referência.', 'Projectile motion equations with constant gravitational acceleration. Click for reference.')}">
                                <a href="https://openstax.org/books/college-physics-2e/pages/3-4-projectile-motion" target="_blank" style="color: inherit; text-decoration: underline;">${textoIdioma('2. Equação Horária da Posição Vertical 🔗', '2. Vertical Position Time Equation 🔗')}</a>
                            </strong><br>
                            <p style="margin: 10px 0 5px 0; font-size: 0.9em;">${textoIdioma('Componente vertical inicial da velocidade refletida:', 'Initial vertical component of the reflected velocity:')}</p>
                            $$ \\require{action} \\texttip{V_y}{${textoIdioma('[m/s] Vel. Y Inicial. Definição: Vetor vertical da semente. Importância: Impacta o tempo de voo. Se positivo, semente sobe; se negativo, desce rápido.', '[m/s] Initial Y velocity. Definition: Seed vertical vector. Importance: Affects flight time. If positive, the seed rises; if negative, it drops quickly.')}} = \\texttip{V_r}{${textoIdioma('Vel. Refletida', 'Reflected velocity')}} \\cdot \\sin(${variavelFormula('\\alpha', 'anguloSaida')}) $$
                            $$ V_y = ${v_refl.toFixed(2)} \\cdot \\sin(${angulo_saida_deg.toFixed(1)}^\\circ) $$
                            $$ V_y = ${v_y.toFixed(2)} \\text{ m/s} $$
                            <hr style="border: 0; border-top: 1px dashed rgba(255,255,255,0.05); margin: 10px 0;">
                            <p style="margin: 5px 0; font-size: 0.9em;">${textoIdioma('Tempo de voo obtido isolando a raiz real da função horária da posição (y = 0):', 'Flight time obtained by isolating the real root of the position-time equation (y = 0):')}</p>
                            $$ \\require{action} \\texttip{t}{${textoIdioma('[s] Tempo de Voo. Definição: Duração da queda livre após o defletor. Importância: Quanto mais tempo no ar, maior o espalhamento e o risco de deriva pelo vento.', '[s] Flight Time. Definition: Duration of free fall after the deflector. Importance: More time in the air means more spreading and more risk of wind drift.')}} = \\frac{\\texttip{V_y}{${textoIdioma('Vel. Vertical', 'Vertical velocity')}} + \\sqrt{\\texttip{V_y^2}{${textoIdioma('Vel. Vertical Quadrada', 'Squared vertical velocity')}} + 2 \\cdot \\texttip{g}{${textoIdioma('[m/s²] Gravidade padrão. Definição: aceleração convencional de 9,80665 m/s². Unidade: metro por segundo ao quadrado. Importância: puxa a semente para o solo; se g aumentar, o tempo de voo diminui e a faixa reduz; se g diminuir, a semente fica mais tempo no ar. Exemplo: maior g reduz D_x e D_z.', '[m/s²] Standard gravity. Definition: conventional acceleration of 9.80665 m/s². Unit: meter per second squared. Importance: pulls the seed toward the ground; if g increases, flight time decreases and the swath shrinks; if g decreases, the seed stays in the air longer. Example: larger g reduces D_x and D_z.')}} \\cdot \\texttip{h}{${textoIdioma('[m] Altura da Chapa. Definição: Distância do defletor ao solo. Importância: Chapas muito altas sofrem deriva severa de vento externo.', '[m] Plate Height. Definition: Distance from the deflector to the ground. Importance: Very high plates suffer severe external wind drift.')}}}}{\\texttip{g}{${textoIdioma('[m/s²] Gravidade padrão usada no cálculo.', '[m/s²] Standard gravity used in the calculation.')}}} $$
                            $$ t = \\frac{(${v_y.toFixed(2)}) + \\sqrt{(${v_y.toFixed(2)})^2 + 2 \\cdot ${g.toFixed(5)} \\cdot ${h.toFixed(2)}}}{${g.toFixed(5)}} $$
                            $$ t = ${t_queda.toFixed(3)} \\text{ s} $$
                        </div>

                        <div class="memorial-item green">
                            <strong title="${textoIdioma('Cinemática bidimensional de projéteis. Clique para referência.', 'Two-dimensional projectile kinematics. Click for reference.')}">
                                <a href="https://openstax.org/books/college-physics-2e/pages/3-4-projectile-motion" target="_blank" style="color: inherit; text-decoration: underline;">${textoIdioma('3. Alcance Longitudinal (Eixo X) 🔗', '3. Longitudinal Range (X Axis) 🔗')}</a>
                            </strong><br>
                            <p style="margin: 10px 0 5px 0; font-size: 0.9em;">${textoIdioma('Componente horizontal constante da velocidade projetada (MRU):', 'Constant horizontal component of the projected velocity (uniform motion):')}</p>
                            $$ \\require{action} \\texttip{V_x}{${textoIdioma('[m/s] Vel. X. Definição: Deslocamento na linha do trator. Importância: Compõe o alcance longitudinal.', '[m/s] X velocity. Definition: Displacement along the tractor line. Importance: Forms the longitudinal range.')}} = \\texttip{V_r}{${textoIdioma('Vel. Refletida', 'Reflected velocity')}} \\cdot \\cos(${variavelFormula('\\alpha', 'anguloSaida')}) $$
                            $$ V_x = ${v_refl.toFixed(2)} \\cdot \\cos(${angulo_saida_deg.toFixed(1)}^\\circ) $$
                            $$ V_x = ${v_x.toFixed(2)} \\text{ m/s} $$
                            <hr style="border: 0; border-top: 1px dashed rgba(255,255,255,0.05); margin: 10px 0;">
                            <p style="margin: 5px 0; font-size: 0.9em;">${textoIdioma('Alcance máximo frontal percorrido no solo:', 'Maximum frontal range traveled on the ground:')}</p>
                            $$ \\require{action} \\texttip{D_x}{[m] ${textoIdioma('Alcance Longitudinal', 'Longitudinal Range')}. Definição: O quanto a semente vai para frente antes de cair. Importância: Atrasos longos exigem ajuste do offset no GPS do trator para não plantar fora do alvo.} = \\texttip{V_x}{${textoIdioma('Vel. Horizontal', 'Horizontal velocity')}} \\cdot \\texttip{t}{${textoIdioma('Tempo de Voo', 'Flight Time')}} $$
                            $$ D_x = ${v_x.toFixed(2)} \\cdot ${t_queda.toFixed(3)} $$
                            $$ D_x = ${alcance_abs.toFixed(2)} \\text{ m} $$
                        </div>

                        <div class="memorial-item red">
                            <strong title="${textoIdioma('Geometria de raio de curvatura aplicada à chapa curva. Clique para referência.', 'Curvature-radius geometry applied to the curved plate. Click for reference.')}">
                                <a href="https://mathworld.wolfram.com/RadiusofCurvature.html" target="_blank" style="color: inherit; text-decoration: underline;">${textoIdioma('4. Espalhamento Transversal Geométrico (Eixo Z) 🔗', '4. Geometric Transverse Spreading (Z Axis) 🔗')}</a>
                            </strong><br>
                            <p style="margin: 10px 0 5px 0; font-size: 0.9em;">${textoIdioma('Ângulo tangencial máximo de escape ditado pelas bordas do duto de ar:', 'Maximum tangential escape angle dictated by the air duct edges:')}</p>
                            $$ \\require{action} \\texttip{\\gamma}{${textoIdioma('[Graus] Ângulo Tangencial. Definição: Ângulo de fuga na borda da chapa curva. Importância: Dita o poder de esparramar a semente nos lados do sulco.', '[Degrees] Tangential angle. Definition: Escape angle at the curved plate edge. Importance: Controls how strongly the seed spreads to both sides of the furrow.')}} = \\arcsin \\left( \\frac{\\texttip{D_{tubo}/2}{${textoIdioma('[mm] Diâmetro Tubo. Definição: Abertura por onde a semente cai. Importância: Se o tubo é largo, a semente bate na extremidade curva do defletor e espalha mais.', '[mm] Tube Diameter. Definition: Opening through which the seed falls. Importance: If the tube is wide, the seed hits the curved edge of the deflector and spreads more.')}}}{\\texttip{R}{${textoIdioma('[mm] Raio de Curvatura. Definição: Grau de dobra lateral da chapa defletora. Importância: Raios fechados (ex: 80mm) geram altíssimo espalhamento lateral.', '[mm] Curvature Radius. Definition: Lateral bending degree of the deflector plate. Importance: Tight radii (e.g. 80 mm) generate very high lateral spreading.')}}} \\right) $$
                            $$ \\gamma = \\arcsin \\left( \\frac{${diam_tubo_mm}/2}{${raio_mm}} \\right) $$
                            $$ \\gamma = ${gama_max_deg.toFixed(1)}^\\circ $$
                            <hr style="border: 0; border-top: 1px dashed rgba(255,255,255,0.05); margin: 10px 0;">
                            <p style="margin: 5px 0; font-size: 0.9em;">${textoIdioma('Componente de velocidade máxima lateral gerada no repique:', 'Maximum lateral velocity component generated by the bounce:')}</p>
                            $$ \\require{action} \\texttip{V_z}{${textoIdioma('[m/s] Vel. Z. Definição: Vetor de velocidade transversal. Importância: Força com que a semente se afasta do centro da linha.', '[m/s] Z velocity. Definition: Transverse velocity vector. Importance: Force with which the seed moves away from the line center.')}} = \\texttip{V_r}{${textoIdioma('Velocidade Refletida', 'Reflected velocity')}} \\cdot \\sin(${variavelFormula('\\gamma', 'anguloTangencial')}) $$
                            $$ V_z = ${v_refl.toFixed(2)} \\cdot \\sin(${gama_max_deg.toFixed(1)}^\\circ) $$
                            $$ V_z = ${vz_max.toFixed(2)} \\text{ m/s} $$
                            <hr style="border: 0; border-top: 1px dashed rgba(255,255,255,0.05); margin: 10px 0;">
                            <p style="margin: 5px 0; font-size: 0.9em; padding-left: 10px; border-left: 2px solid var(--error);"><strong>${textoIdioma('A Faixa Total:', 'Total Swath:')}</strong><br>${textoIdioma('A largura depositada no solo (Dz) é a soma da abertura bilateral (2 × Vel. Lateral × Tempo) com a largura física do duto.', 'The width deposited on the ground (Dz) is the sum of the bilateral opening (2 × Lateral Velocity × Time) and the physical duct width.')}</p>
                            $$ \\require{action} \\texttip{D_z}{${textoIdioma('[m] Faixa de Distribuição. Definição: Largura total coberta pela sementeira. Importância: Precisa casar (match) perfeitamente com a distância entre as linhas de plantio para não haver falha ou sobreposição.', '[m] Distribution Swath. Definition: Total width covered by the seeder. Importance: It must match the planting row spacing perfectly to avoid gaps or overlap.')}} = \\texttip{D_{tubo}}{${textoIdioma('Largura Inicial da Cortina', 'Initial curtain width')}} + 2 \\cdot ( \\texttip{V_z}{${textoIdioma('Vel. Lateral Z', 'Lateral velocity Z')}} \\cdot \\texttip{t}{${textoIdioma('Tempo de Queda', 'Fall Time')}} ) $$
                            $$ D_z = ${diam_tubo_m.toFixed(3)} + 2 \\cdot (${vz_max.toFixed(2)} \\cdot ${t_queda.toFixed(3)}) $$
                            $$ D_z = ${largura_faixa.toFixed(2)} \\text{ m} $$
                        </div>
                    `;
                }
                dom.painelEsqDist.innerHTML = htmlEsquerdo;

                if (mathJaxTimerDist) clearTimeout(mathJaxTimerDist);
                mathJaxTimerDist = setTimeout(function() {
                    const buffer = document.createElement('div');
                    buffer.innerHTML = traduzirTextosDeFormula(envolverSimbolosCalculadosMemorialDist(htmlDireito));
                    if (window.MathJax && MathJax.typesetPromise) {
                        if (!window.mjPromiseDist) window.mjPromiseDist = Promise.resolve();
                        window.mjPromiseDist = window.mjPromiseDist.then(function() {
                            return MathJax.typesetPromise([buffer]).then(function() {
                                dom.painelDirDist.innerHTML = "";
                                while (buffer.firstChild) dom.painelDirDist.appendChild(buffer.firstChild);
                                marcarVariaveisSaidaMemorialDist();
                            });
                        }).catch(err => console.log(err));
                    } else {
                        dom.painelDirDist.innerHTML = traduzirTextosDeFormula(envolverSimbolosCalculadosMemorialDist(htmlDireito));
                        marcarVariaveisSaidaMemorialDist();
                    }
                }, 80);
                atualizarGraficoDist();
            }

            // --- LÓGICA DO CANVAS GEOMÉTRICO ---
            function desenharRolo(x, y, raio, angulo, isEsquerdo) {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angulo);

                ctx.beginPath();
                ctx.arc(0, 0, raio, 0, Math.PI * 2);
                ctx.fillStyle = '#21262d';
                ctx.fill();
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#8b949e';
                ctx.stroke();

                const numDentes = 14;
                ctx.fillStyle = isStalled ? '#ff7b72' : '#58a6ff'; 
                
                for (let i = 0; i < numDentes; i++) {
                    ctx.save();
                    let teta = (i * Math.PI * 2) / numDentes;
                    if (!isEsquerdo) teta += Math.PI / numDentes; 
                    
                    ctx.rotate(teta);
                    ctx.beginPath();
                    ctx.moveTo(raio - 2, -7);
                    ctx.lineTo(raio + 14, 0); 
                    ctx.lineTo(raio - 2, 7);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    ctx.restore();
                }

                ctx.beginPath();
                ctx.arc(0, 0, 15, 0, Math.PI * 2);
                ctx.fillStyle = '#0d1117';
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#8b949e';
                ctx.fillRect(-3, -18, 6, 8);

                ctx.restore();
            }

            function desenharIlustracaoDestorroador() {
                const estilos = getComputedStyle(document.body);
                const corFundo = estilos.getPropertyValue('--canvas-bg').trim() || '#0d1117';
                const corTexto = estilos.getPropertyValue('--text-main').trim() || '#c9d1d9';
                const corMutado = estilos.getPropertyValue('--text-muted').trim() || '#8b949e';
                const corBorda = estilos.getPropertyValue('--border').trim() || '#30363d';
                const corAccent = estilos.getPropertyValue('--accent').trim() || '#58a6ff';
                const corPerigo = estilos.getPropertyValue('--danger').trim() || '#ff7b72';

                ctx.fillStyle = corFundo;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.strokeStyle = 'rgba(139, 148, 158, 0.08)';
                ctx.lineWidth = 1;
                for (let x = 50; x < canvas.width; x += 50) {
                    ctx.beginPath();
                    ctx.moveTo(x, 56);
                    ctx.lineTo(x, canvas.height);
                    ctx.stroke();
                }

                const centroX = canvas.width / 2;
                const centroY = canvas.height / 2 + 18;

                ctx.strokeStyle = corBorda;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(centroX - 210, centroY - 96);
                ctx.lineTo(centroX + 210, centroY - 96);
                ctx.stroke();

                ctx.fillStyle = 'rgba(88, 166, 255, 0.08)';
                ctx.beginPath();
                ctx.moveTo(centroX - 120, centroY - 116);
                ctx.lineTo(centroX + 120, centroY - 116);
                ctx.lineTo(centroX + 80, centroY - 42);
                ctx.lineTo(centroX - 80, centroY - 42);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = corAccent;
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.fillStyle = corTexto;
                ctx.font = '11px monospace';
                ctx.fillText(textoIdioma('ENTRADA', 'INLET'), centroX - 22, centroY - 152);

                ctx.strokeStyle = corAccent;
                ctx.lineWidth = 4;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(centroX, centroY - 42);
                ctx.lineTo(centroX, centroY - 12);
                ctx.stroke();

                ctx.fillStyle = corAccent;
                ctx.beginPath();
                ctx.moveTo(centroX - 12, centroY - 20);
                ctx.lineTo(centroX, centroY - 6);
                ctx.lineTo(centroX + 12, centroY - 20);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = 'rgba(88, 166, 255, 0.06)';
                ctx.strokeStyle = corAccent;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(centroX - 190, centroY - 10, 380, 140, 24);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = corBorda;
                ctx.fillRect(centroX - 205, centroY + 82, 410, 14);
                ctx.fillStyle = 'rgba(139, 148, 158, 0.24)';
                ctx.fillRect(centroX - 160, centroY + 72, 320, 4);

                ctx.save();
                ctx.translate(centroX - 94, centroY + 30);
                ctx.rotate(-0.06);
                ctx.fillStyle = '#21262d';
                ctx.strokeStyle = corAccent;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.roundRect(-84, -42, 168, 84, 34);
                ctx.fill();
                ctx.stroke();
                ctx.restore();

                ctx.save();
                ctx.translate(centroX + 94, centroY + 30);
                ctx.rotate(0.06);
                ctx.fillStyle = '#21262d';
                ctx.strokeStyle = isStalled ? corPerigo : corAccent;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.roundRect(-84, -42, 168, 84, 34);
                ctx.fill();
                ctx.stroke();
                ctx.restore();

                ctx.fillStyle = corTexto;
                ctx.font = 'bold 11px monospace';
                ctx.fillText(textoIdioma('ROLOS DE MOAGEM', 'GRINDING ROLLERS'), centroX - 55, centroY + 128);

                ctx.strokeStyle = isStalled ? 'rgba(255, 123, 114, 0.75)' : 'rgba(88, 166, 255, 0.75)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(centroX, centroY + 28, 82, Math.PI * 1.15, Math.PI * 1.85);
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(centroX + 2, centroY + 28, 82, Math.PI * 0.15, Math.PI * 0.85);
                ctx.stroke();

                ctx.fillStyle = corMutado;
                ctx.font = '11px monospace';
                ctx.fillText(textoIdioma('TORQUE', 'TORQUE'), centroX + 118, centroY + 34);

                ctx.strokeStyle = corBorda;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(centroX - 88, centroY + 92);
                ctx.lineTo(centroX + 88, centroY + 92);
                ctx.stroke();

                ctx.fillStyle = corMutado;
                ctx.font = '11px monospace';
                ctx.fillText(textoIdioma('SAÍDA', 'OUTLET'), centroX - 18, centroY + 114);
            }
            
            function renderizar() {
                desenharIlustracaoDestorroador();

                let velAngular = 0;
                if (!isStalled && rotacaoFinalGlobal > 0) {
                    // Cálculo da velocidade real (rad/frame)
                    velAngular = (rotacaoFinalGlobal * 2 * Math.PI) / 3600; 
                    
                    // Trava anti-ilusão de ótica
                    // Garante que o dente nunca pule mais que a metade da distância até o próximo,
                    // impedindo que o cérebro enxergue a engrenagem girando para fora.
                    if (velAngular > 0.15) velAngular = 0.15;
                }

                // FÍSICA CORRETA DE MOAGEM (Puxando o material para o centro e para baixo)
                anguloEsquerdo += velAngular; // Rolo esquerdo gira no sentido Horário (+)
                anguloDireito -= velAngular;  // Rolo direito gira no sentido Anti-horário (-)

                const centroX = canvas.width / 2;
                const centroY = canvas.height / 2;
                
                desenharRolo(centroX - 102, centroY, 90, anguloEsquerdo, true);
                desenharRolo(centroX + 102, centroY, 90, anguloDireito, false);

                let taxaAtual = lerValorSincronizado('in_taxa_range');
                if(isNaN(taxaAtual)) taxaAtual = 0;

                if (!isStalled && velAngular > 0) {
                    const particulasPorFrame = Math.ceil(taxaAtual / 15);
                    for(let i=0; i < particulasPorFrame; i++) {
                        particulas.push({
                            x: centroX - 16 + Math.random() * 32,
                            y: centroY - 132 + Math.random() * 18,
                            raio: 2 + Math.random() * 4,
                            velY: 2 + Math.random() * 3
                        });
                    }
                }

                ctx.fillStyle = '#d29922'; 
                for (let i = particulas.length - 1; i >= 0; i--) {
                    let p = particulas[i];
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.raio, 0, Math.PI * 2);
                    ctx.fill();
                    
                    if(!isStalled) {
                        p.y += p.velY;
                        if(p.y > centroY - 50) p.velY += 1.5; 
                    }

                    if (p.y > canvas.height) {
                        particulas.splice(i, 1);
                    }
                }

                requestAnimationFrame(renderizar);
            }

            // --- LÓGICA DE VISUALIZAÇÃO DO DISTRIBUIDOR (COM MATTER.JS) ---
            function inicializarFisicaDistribuidor(theta_deg, v0, h_chapa, e_rest) {
                // Verificar se Matter.js está pronto e disponível
                if (!Engine || !World || !Bodies || !Body) {
                    console.warn('Matter.js não disponível. Renderização manual será usada.');
                    ativarAnimacaoDist = false;
                    return false;
                }
                
                try {
                    // Destruir engine anterior se existir
                    if (engineDist) {
                        Engine.clear(engineDist);
                    }
                
                // Criar novo engine
                engineDist = Engine.create();
                worldDist = engineDist.world;
                worldDist.gravity.y = GRAVIDADE_PADRAO;
                
                particulasBodyDist = [];
                tempoGeracaoSemente = 0;
                
                const centroX = canvasDist.width / 4;
                const centroY = canvasDist.height * 0.7;
                const theta_rad = theta_deg * (Math.PI / 180);
                
                // === CRIAR DEFLETOR (Body Estático Inclinado) ===
                const comprimento = 200;
                defletorBody = Bodies.rectangle(
                    centroX, 
                    centroY, 
                    comprimento, 
                    60, // ESPESSURA AUMENTADA PARA 60px para evitar tunelamento visual
                    {
                        isStatic: true,
                        angle: theta_rad,
                        friction: 0.5,
                        restitution: e_rest,
                        label: 'defletor',
                        // Como a renderização customizada usa os vértices exatos, a chapa 
                        // vai desenhar mais grossa no fundo, impedindo o fantasma.
                    }
                );
                World.add(worldDist, defletorBody);
                
                // === CRIAR SOLO (Body Estático Horizontal no Fundo) ===
                const soloY = centroY + (h_chapa * 120);
                const solo = Bodies.rectangle(
                    canvasDist.width / 2,
                    soloY + 50,
                    canvasDist.width * 2,
                    100,
                    {
                        isStatic: true,
                        friction: 1.0,
                        restitution: 0.2,
                        label: 'solo'
                    }
                );
                World.add(worldDist, solo);
                
                // === CRIAR PAREDES LATERAIS E TETO (para não perder semente voando) ===
                const paredeEsquerda = Bodies.rectangle(
                    -50, 
                    canvasDist.height / 2, 
                    100, 
                    canvasDist.height * 2,
                    { isStatic: true }
                );
                const paredeDireita = Bodies.rectangle(
                    canvasDist.width + 50, 
                    canvasDist.height / 2, 
                    100, 
                    canvasDist.height * 2,
                    { isStatic: true }
                );
                const teto = Bodies.rectangle(
                    canvasDist.width / 2, 
                    -500, 
                    canvasDist.width * 2, 
                    100,
                    { isStatic: true }
                );
                World.add(worldDist, [paredeEsquerda, paredeDireita, teto]);
                
                ativarAnimacaoDist = true;  // Ativar renderização
                console.log('Física do Distribuidor inicializada com Proteção de Tunelamento!');
                return true;
                } catch(err) {
                    console.error('Erro ao inicializar física:', err);
                    return false;
                }
            }

            function criarSementeDistribuidor(v0, theta_deg) {
                const centroX = canvasDist.width / 4;
                const centroY = canvasDist.height * 0.7;
                
                // A semente tem liberdade de cair em qualquer parte "vazada" do tubo.
                // Na nossa escala visual, 1 pixel = 1 milímetro. Fica perfeito.
                const diam_tubo_mm = parseFloat(dom.distDiamTubo2.value) || 40;
                
                // Espalhamento em X (Frontal)
                const x = centroX + (Math.random() - 0.5) * diam_tubo_mm; 
                const y = centroY - 120;
                
                const semente = Bodies.circle(x, y, 5, {
                    friction: 0.05, 
                    frictionAir: 0.01, 
                    restitution: 0.6,  
                    density: 0.05, 
                    slop: 0.05,
                    label: 'semente'
                });
                
                Body.setVelocity(semente, { x: 0, y: v0 * 0.8 }); 
                World.add(worldDist, semente);
                
                particulasBodyDist.push({
                    body: semente,
                    raio: 5,
                    // Espalhamento em Z (Lateral): semente cai aleatoriamente pelo diâmetro do tubo
                    z: (Math.random() - 0.5) * diam_tubo_mm, 
                    vz: 0, 
                    hit: false, 
                    criado: Date.now()
                });
            }

            function renderizarDosador() {
                if (!ativarAnimacaoDosador) {
                    requestAnimationFrame(renderizarDosador);
                    return;
                }
                
                ctxDist.clearRect(0, 0, canvasDist.width, canvasDist.height);
                
                const centroX = canvasDist.width / 2;
                const centroY = canvasDist.height / 2 - 20;
                const rpm = parseFloat(dom.distRpm?.value) || 45;
                const velAr = parseFloat(dom.distVelar?.value) || 25;
                
                // Limite óptico (Efeito Estroboscópico)
                let rpmVisual = rpm;
                if (rpmVisual > 60) rpmVisual = 60;
                let velAngular = (rpmVisual * 2 * Math.PI) / 3600;
                anguloDosador += velAngular;
                
                // === TUBO DE AR (Inferior) ===
                ctxDist.fillStyle = '#161b22';
                ctxDist.fillRect(centroX - 200, centroY + 50, canvasDist.width, 50);
                ctxDist.strokeStyle = '#30363d';
                ctxDist.lineWidth = 2;
                ctxDist.strokeRect(centroX - 200, centroY + 50, canvasDist.width, 50);
                
                // Efeito de vento dinâmico
                ctxDist.fillStyle = 'rgba(88, 166, 255, 0.3)';
                ctxDist.font = '16px monospace';
                ctxDist.fillText('💨 Ar (' + velAr + ' m/s) ➡', centroX - 180, centroY + 80);

                // === TREMONHA (Funil Superior) ===
                ctxDist.fillStyle = 'rgba(88, 166, 255, 0.05)';
                ctxDist.beginPath();
                ctxDist.moveTo(centroX - 80, centroY - 120);
                ctxDist.lineTo(centroX + 80, centroY - 120);
                ctxDist.lineTo(centroX + 48, centroY);
                ctxDist.lineTo(centroX - 48, centroY);
                ctxDist.closePath();
                ctxDist.fill();
                ctxDist.strokeStyle = '#58a6ff';
                ctxDist.lineWidth = 3;
                ctxDist.stroke();
                
                // === GERAR SEMENTES ===
                const volume = calcularVolumeRolo().volumeRoloMm3 || 150;
                // Taxa visual proporcional à matemática da máquina
                const taxaVisual = (volume * rpm) / 5000; 
                const particulasPorFrame = Math.ceil(taxaVisual);
                
                if (rpm > 0) {
                    for(let i = 0; i < particulasPorFrame; i++) {
                        particulasDosador.push({
                            x: centroX + (Math.random() - 0.5) * 100, // Nasce no topo largo do funil
                            y: centroY - 110 + Math.random() * 20,
                            raio: 3 + Math.random() * 2,
                            velY: 1 + Math.random() * 2,
                            velX: 0,
                            estado: 'funil' // estados físicos: funil, rolo, tubo
                        });
                    }
                }
                
                // === ATUALIZAR E DESENHAR PARTÍCULAS ===
                ctxDist.fillStyle = '#3fb950'; // Coroa verde clássica de semente tratada
                for (let i = particulasDosador.length - 1; i >= 0; i--) {
                    let p = particulasDosador[i];
                    ctxDist.beginPath();
                    ctxDist.arc(p.x, p.y, p.raio, 0, Math.PI * 2);
                    ctxDist.fill();
                    
                    if (p.estado === 'funil') {
                        p.y += p.velY;
                        // Afunilamento físico da chapa de metal
                        if (p.y < centroY - 20) {
                            if (p.x < centroX - 40) p.x += 1.5;
                            if (p.x > centroX + 40) p.x -= 1.5;
                        } else {
                            // Semente encostou no rolo dosador
                            p.estado = 'rolo';
                        }
                    } 
                    else if (p.estado === 'rolo') {
                        // Semente viaja na estria (sulco) e cai por gravidade na ponta
                        p.y += (rpmVisual / 30);
                        if (p.y > centroY + 45) {
                            p.estado = 'tubo';
                        }
                    } 
                    else if (p.estado === 'tubo') {
                        p.y += p.velY;
                        // Semente cai na tubulação pneumática
                        if (p.y > centroY + 90) {
                            p.y = centroY + 90 - Math.random() * 5; // Piso do tubo
                            p.velX = (velAr * 0.3) + Math.random() * 3; // O arrasto carrega para a direita
                        }
                        p.x += p.velX;
                    }
                    
                    // Limpar sementes que saíram da tela
                    if (p.x > canvasDist.width || p.y > canvasDist.height) {
                        particulasDosador.splice(i, 1);
                    }
                }

                // === DESENHAR ROLO DOSADOR (Peça Azul Estriada) ===
                ctxDist.save();
                ctxDist.translate(centroX, centroY);
                ctxDist.rotate(anguloDosador);
                
                // Corpo maciço do rolo azul
                ctxDist.beginPath();
                ctxDist.arc(0, 0, 45, 0, Math.PI * 2);
                ctxDist.fillStyle = '#1f6feb'; // Azul idêntico à imagem de projeto
                ctxDist.fill();
                ctxDist.lineWidth = 2;
                ctxDist.strokeStyle = '#58a6ff';
                ctxDist.stroke();
                
                // Desenhar as estrias (recortes semi-circulares)
                const numDentes = 12;
                ctxDist.fillStyle = '#0d1117'; // Máscara vazada (mesma cor do fundo do Canvas)
                for (let i = 0; i < numDentes; i++) {
                    ctxDist.save();
                    ctxDist.rotate((i * Math.PI * 2) / numDentes);
                    ctxDist.beginPath();
                    ctxDist.arc(45, 0, 12, 0, Math.PI * 2); 
                    ctxDist.fill();
                    ctxDist.restore();
                }
                
                // Desenhar Eixo Central (Acoplamento Hexagonal)
                ctxDist.beginPath();
                for (let i=0; i<6; i++) {
                    ctxDist.lineTo(10 * Math.cos(i * Math.PI/3), 10 * Math.sin(i * Math.PI/3));
                }
                ctxDist.closePath();
                ctxDist.fillStyle = '#8b949e';
                ctxDist.fill();
                
                ctxDist.restore();

                requestAnimationFrame(renderizarDosador);
            }

            function distribuirLinhasPorTorre(totalLinhas, totalTorres) {
                const base = Math.floor(totalLinhas / Math.max(totalTorres, 1));
                let resto = totalLinhas % Math.max(totalTorres, 1);
                return Array.from({ length: Math.max(totalTorres, 1) }, () => base + (resto-- > 0 ? 1 : 0));
            }

            function desenharVistaSuperiorDistribuidor() {
                ctxDist.clearRect(0, 0, canvasDist.width, canvasDist.height);

                const estilos = getComputedStyle(document.body);
                const corTexto = estilos.getPropertyValue('--text-main').trim() || '#c9d1d9';
                const corMutado = estilos.getPropertyValue('--text-muted').trim() || '#8b949e';
                const corBorda = estilos.getPropertyValue('--border').trim() || '#30363d';
                const corAccent = estilos.getPropertyValue('--accent').trim() || '#58a6ff';
                const corSucesso = estilos.getPropertyValue('--success').trim() || '#3fb950';
                const corFundo = estilos.getPropertyValue('--canvas-bg').trim() || '#0d1117';

                ctxDist.fillStyle = corFundo;
                ctxDist.fillRect(0, 0, canvasDist.width, canvasDist.height);

                const margemX = 28;
                const margemY = 34;
                const nPrimarios = Math.max(parseInt(dom.distQtdPrimarios.value) || 1, 1);
                const nLinhas = Math.max(parseInt(dom.distLinhas.value) || 1, 1);
                const LPrimario = Math.max(parseFloat(dom.distComprimentoPrimario.value) || 1, 0.1);
                const LSecundario = Math.max(parseFloat(dom.distComprimento.value) || 1, 0.1);
                const DPrimarioMm = Math.max((parseFloat(dom.distDiametroPrimarioPol.value) || 1) * 25.4, 18);
                const DSecundarioMm = Math.max(parseFloat(dom.distDiametro.value) || 1, 10);
                const escala = Math.min((canvasDist.height - 180) / Math.max(LPrimario + LSecundario, 1), 135);
                const compPrimario = Math.max(90, LPrimario * escala);
                const compSecundario = Math.max(90, LSecundario * escala);
                const topoDepositoY = 58;
                const depositoRaio = 22;
                const yInicioPrimario = topoDepositoY + depositoRaio + 22;
                const yTorre = yInicioPrimario + compPrimario;
                const linhasPorTorre = distribuirLinhasPorTorre(nLinhas, nPrimarios);
                const colunasUtil = Math.max(canvasDist.width - 2 * margemX, 1);
                const espacamentoX = colunasUtil / Math.max(nPrimarios, 1);
                const offsetSec = Math.min(16, Math.max(8, espacamentoX / 4));

                for (let x = 60; x < canvasDist.width; x += 60) {
                    ctxDist.strokeStyle = 'rgba(139, 148, 158, 0.08)';
                    ctxDist.lineWidth = 1;
                    ctxDist.beginPath();
                    ctxDist.moveTo(x, margemY);
                    ctxDist.lineTo(x, canvasDist.height - 40);
                    ctxDist.stroke();
                }

                ctxDist.strokeStyle = 'rgba(139, 148, 158, 0.12)';
                ctxDist.lineWidth = 1;
                for (let y = margemY; y < canvasDist.height - 40; y += 50) {
                    ctxDist.beginPath();
                    ctxDist.moveTo(20, y);
                    ctxDist.lineTo(canvasDist.width - 20, y);
                    ctxDist.stroke();
                }

                ctxDist.fillStyle = corTexto;
                ctxDist.font = 'bold 16px monospace';
                ctxDist.fillText(textoIdioma('VISTA SUPERIOR - DOSAGEM E ARRASTE PNEUMÁTICO', 'TOP VIEW - METERING AND PNEUMATIC CONVEYING'), 18, 24);
                ctxDist.font = '11px monospace';
                ctxDist.fillStyle = corMutado;
                ctxDist.fillText(textoIdioma('Linha grossa = principal | linhas finas = secundárias', 'Thick line = primary | thin lines = secondary'), 18, 42);

                ctxDist.fillStyle = corAccent;
                ctxDist.fillRect(18, canvasDist.height - 28, 26, 4);
                ctxDist.fillStyle = corTexto;
                ctxDist.font = '10px monospace';
                ctxDist.fillText(textoIdioma('LINHA PRINCIPAL', 'PRIMARY LINE'), 52, canvasDist.height - 20);
                ctxDist.fillStyle = corSucesso;
                ctxDist.fillRect(210, canvasDist.height - 28, 26, 2);
                ctxDist.fillStyle = corTexto;
                ctxDist.fillText(textoIdioma('LINHAS SECUNDÁRIAS', 'SECONDARY LINES'), 246, canvasDist.height - 20);

                ctxDist.fillStyle = 'rgba(88, 166, 255, 0.12)';
                ctxDist.strokeStyle = corAccent;
                ctxDist.lineWidth = 2;
                ctxDist.beginPath();
                ctxDist.arc(canvasDist.width / 2, topoDepositoY, depositoRaio, 0, Math.PI * 2);
                ctxDist.fill();
                ctxDist.stroke();
                ctxDist.fillStyle = corMutado;
                ctxDist.font = '10px monospace';
                ctxDist.fillText(textoIdioma('DEPÓSITO', 'HOPPER'), canvasDist.width / 2 - 18, topoDepositoY + 4);

                linhasPorTorre.forEach((linhasNaTorre, indice) => {
                    const x = margemX + espacamentoX * (indice + 0.5);
                    const torreRaio = Math.min(18, Math.max(12, linhasNaTorre * 2));
                    const xSecBase = x - ((linhasNaTorre - 1) * offsetSec) / 2;

                    ctxDist.strokeStyle = corAccent;
                    ctxDist.lineWidth = Math.max(4, DPrimarioMm / 10);
                    ctxDist.lineCap = 'round';
                    ctxDist.beginPath();
                    ctxDist.moveTo(x, yInicioPrimario);
                    ctxDist.lineTo(x, yTorre);
                    ctxDist.stroke();

                    ctxDist.fillStyle = 'rgba(88, 166, 255, 0.12)';
                    ctxDist.strokeStyle = corAccent;
                    ctxDist.lineWidth = 2;
                    ctxDist.beginPath();
                    ctxDist.arc(x, yTorre, torreRaio, 0, Math.PI * 2);
                    ctxDist.fill();
                    ctxDist.stroke();

                    ctxDist.fillStyle = corTexto;
                    ctxDist.font = '10px monospace';
                    ctxDist.fillText(`${textoIdioma('TORRE DE DISTRIBUIÇÃO', 'DISTRIBUTION TOWER')} ${indice + 1}`, x - 44, yTorre - torreRaio - 6);

                    const comprimentoSaida = Math.min(compSecundario, canvasDist.height - yTorre - 56);
                    const passoSecundario = Math.max(8, Math.min(16, offsetSec + 2));

                    for (let j = 0; j < linhasNaTorre; j++) {
                        const xSec = xSecBase + j * passoSecundario;

                        ctxDist.strokeStyle = corSucesso;
                        ctxDist.lineWidth = Math.max(2, DSecundarioMm / 16);
                        ctxDist.lineCap = 'round';
                        ctxDist.beginPath();
                        ctxDist.moveTo(xSec, yTorre + torreRaio + 10);
                        ctxDist.lineTo(xSec, yTorre + torreRaio + 10 + comprimentoSaida);
                        ctxDist.stroke();

                        ctxDist.fillStyle = corSucesso;
                        ctxDist.fillRect(xSec - 2, yTorre + torreRaio + 10 + comprimentoSaida - 3, 4, 6);
                    }
                });

                ctxDist.strokeStyle = 'rgba(139, 148, 158, 0.16)';
                ctxDist.lineWidth = 2;
                ctxDist.beginPath();
                ctxDist.moveTo(canvasDist.width / 2, topoDepositoY + depositoRaio);
                ctxDist.lineTo(canvasDist.width / 2, yInicioPrimario - 10);
                ctxDist.stroke();
            }

            function renderizarDistribuidorMatterJS() {
                if (!ativarAnimacaoDist) {
                    desenharVistaSuperiorDistribuidor();
                    requestAnimationFrame(renderizarDistribuidorMatterJS);
                    return;
                }
                
                try {
                    // Verificar se Matter.js está disponível
                    if (!engineDist || !Engine) {
                        requestAnimationFrame(renderizarDistribuidorMatterJS);
                        return;
                    }

                    // Atualizar física
                    Engine.update(engineDist, 1000 / 60);
                
                // Limpar canvas
                ctxDist.clearRect(0, 0, canvasDist.width, canvasDist.height);
                
                const meioTela = canvasDist.width / 2;

                // Fundo com grid suave
                ctxDist.strokeStyle = 'rgba(139, 148, 158, 0.1)';
                ctxDist.lineWidth = 1;
                for (let i = 0; i < canvasDist.width; i += 50) {
                    ctxDist.beginPath();
                    ctxDist.moveTo(i, 0);
                    ctxDist.lineTo(i, canvasDist.height);
                    ctxDist.stroke();
                }

                // Divisória Central
                ctxDist.beginPath();
                ctxDist.moveTo(meioTela, 0);
                ctxDist.lineTo(meioTela, canvasDist.height);
                ctxDist.strokeStyle = 'rgba(139, 148, 158, 0.4)';
                ctxDist.lineWidth = 2;
                ctxDist.setLineDash([5, 5]);
                ctxDist.stroke();
                ctxDist.setLineDash([]);

                // Labels de Vista
                ctxDist.fillStyle = '#c9d1d9';
                ctxDist.font = 'bold 14px monospace';
                ctxDist.fillText('VISTA FRONTAL (Corte XY)', 15, 25);
                ctxDist.fillText('VISTA LATERAL (Espalhamento)', meioTela + 15, 25);
                
                const v0 = parseFloat(dom.distV0.value) || 12;
                const theta_deg = parseFloat(dom.distAngulo.value) || 30;
                const raio_mm = parseFloat(dom.distRaio.value) || 100;
                const diam_tubo_mm = parseFloat(dom.distDiamTubo2.value) || 40; // CAPTURA O TUBO
                const largura_chapa_mm = parseFloat(dom.distLargChapa.value) || 100; 
                const h_chapa = parseFloat(dom.distAltura.value) || 0.8;
                const e_rest = parseFloat(dom.distCr.value) || 0.6;
                const centroY = canvasDist.height * 0.7;
                const centroX = meioTela / 2; 
                const centroXLateral = meioTela + (meioTela / 2); 
                const soloY = centroY + (h_chapa * 120);
                
                // === DESENHAR TUBO DE ENTRADA (VISTA FRONTAL) ===
                const raioTuboVisual = diam_tubo_mm / 2; // 1px = 1mm
                ctxDist.fillStyle = '#30363d';
                // Desenha o tubo como um retângulo (projeção ortogonal)
                ctxDist.fillRect(centroX - raioTuboVisual, centroY - 120, diam_tubo_mm, 40);
                ctxDist.strokeStyle = '#8b949e';
                ctxDist.lineWidth = 2;
                ctxDist.strokeRect(centroX - raioTuboVisual, centroY - 120, diam_tubo_mm, 40);
                
                // Linha de queda vertical do tubo (Frontal)
                ctxDist.strokeStyle = '#8b949e';
                ctxDist.lineWidth = 3;
                ctxDist.setLineDash([3, 3]);
                ctxDist.beginPath();
                ctxDist.moveTo(centroX, centroY - 80); // Inicia exatamente na base do tubo
                ctxDist.lineTo(centroX, centroY + 30);
                ctxDist.stroke();
                ctxDist.setLineDash([]);
                ctxDist.fillStyle = '#8b949e';
                ctxDist.font = '11px monospace';
                ctxDist.fillText('TUBO', centroX - 15, centroY - 130);

                // === DESENHAR TUBO DE ENTRADA (VISTA LATERAL) ===
                ctxDist.fillStyle = '#30363d';
                ctxDist.fillRect(centroXLateral - raioTuboVisual, centroY - 120, diam_tubo_mm, 40); 
                ctxDist.strokeStyle = '#8b949e';
                ctxDist.lineWidth = 2;
                ctxDist.strokeRect(centroXLateral - raioTuboVisual, centroY - 120, diam_tubo_mm, 40);
                ctxDist.fillStyle = '#8b949e';
                ctxDist.font = '11px monospace';
                ctxDist.fillText('TUBO', centroXLateral - 15, centroY - 130);
                
                // Gerar novas sementes periodicamente (limite aumentado para criar volume visual)
                tempoGeracaoSemente++;
                if (tempoGeracaoSemente > 6 && particulasBodyDist.length < 15) { 
                    criarSementeDistribuidor(v0, theta_deg);
                    tempoGeracaoSemente = 0;
                }
                
                // === DESENHAR DEFLETOR (VISTA FRONTAL) ===
                // Renderização volumétrica sólida do retângulo inclinado gerado pelo Matter.js
                const defletorVertices = defletorBody.vertices;
                
                // Sombra projetada do corpo rígido
                ctxDist.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctxDist.beginPath();
                ctxDist.moveTo(defletorVertices[0].x + 3, defletorVertices[0].y + 3);
                for (let i = 1; i < defletorVertices.length; i++) {
                    ctxDist.lineTo(defletorVertices[i].x + 3, defletorVertices[i].y + 3);
                }
                ctxDist.closePath();
                ctxDist.fill();

                // Desenho do corpo preenchido e bordas externas do bloco
                ctxDist.fillStyle = 'rgba(255, 107, 91, 0.15)';
                ctxDist.strokeStyle = '#ff6b5b';
                ctxDist.lineWidth = 4;
                ctxDist.lineJoin = 'round';
                ctxDist.beginPath();
                ctxDist.moveTo(defletorVertices[0].x, defletorVertices[0].y);
                for (let i = 1; i < defletorVertices.length; i++) {
                    ctxDist.lineTo(defletorVertices[i].x, defletorVertices[i].y);
                }
                ctxDist.closePath();
                ctxDist.fill();
                ctxDist.stroke();
                
                // Label ângulo (Frontal)
                ctxDist.fillStyle = '#8b949e';
                ctxDist.font = 'bold 13px monospace';
                ctxDist.fillText(`${theta_deg}°`, centroX + 50, centroY - 35);

                // === DESENHAR DEFLETOR (VISTA LATERAL) ===
                // Renderização da chapa baseada na equação da "Flecha" (Sagitta) de um arco.
                const theta_rad = theta_deg * (Math.PI / 180);
                const larguraChapa_Vlat = largura_chapa_mm; // Largura visual responde à barra diretamente (1px = 1mm para simplificar)
                const comprimentoFisico = 150; // Comprimento da chapa inclinada
                const h_projetada = comprimentoFisico * Math.sin(theta_rad);
                
                // Cálculo visual da curvatura geométrica (Sagitta = R - sqrt(R^2 - (L/2)^2))
                let curvatura = 0;
                if (raio_mm > (larguraChapa_Vlat / 2)) {
                    const sagitta_arco = raio_mm - Math.sqrt(Math.pow(raio_mm, 2) - Math.pow(larguraChapa_Vlat / 2, 2));
                    curvatura = sagitta_arco * Math.cos(theta_rad); 
                } else {
                    // Impede o colapso visual se o usuário colocar R menor que L/2 (chapa vira um semi-círculo completo)
                    curvatura = (larguraChapa_Vlat / 2) * Math.cos(theta_rad);
                }
                
                ctxDist.fillStyle = 'rgba(255, 107, 91, 0.2)';
                ctxDist.strokeStyle = '#ff6b5b';
                ctxDist.lineWidth = 5;
                ctxDist.lineJoin = 'round';
                
                ctxDist.beginPath();
                // Curva do topo da chapa (Convexa, sobe em direção ao centro)
                ctxDist.moveTo(centroXLateral - larguraChapa_Vlat / 2, centroY - h_projetada / 2 + curvatura);
                ctxDist.quadraticCurveTo(centroXLateral, centroY - h_projetada / 2 - curvatura, centroXLateral + larguraChapa_Vlat / 2, centroY - h_projetada / 2 + curvatura);
                
                // Lateral direita da chapa
                ctxDist.lineTo(centroXLateral + larguraChapa_Vlat / 2, centroY + h_projetada / 2 + curvatura);
                
                // Curva da base da chapa (Acompanha o perfil superior)
                ctxDist.quadraticCurveTo(centroXLateral, centroY + h_projetada / 2 - curvatura, centroXLateral - larguraChapa_Vlat / 2, centroY + h_projetada / 2 + curvatura);
                
                ctxDist.closePath();
                ctxDist.fill();
                ctxDist.stroke();
                
                // === DESENHAR SEMENTES E FÍSICA LATERAL ===
                for (let i = particulasBodyDist.length - 1; i >= 0; i--) {
                    const p = particulasBodyDist[i];
                    const body = p.body;
                    
                    if (body.position.y > centroY - 15 && body.velocity.y > 0 && !p.hit) {
                        p.hit = true;
                        
                        // FÍSICA CORRIGIDA: A semente cai deslocada do centro puramente com base 
                        // na sua posição dentro do Tubo (p.z). A LARGURA DA CHAPA NÃO INFLUENCIA.
                        // Caso a semente caia FORA da largura estrutural da chapa, ela não é defletida:
                        if (Math.abs(p.z) > largura_chapa_mm / 2) {
                            p.vz = 0; // A semente não encosta na chapa, cai reto (vazamento)
                        } else {
                            // Bateu na chapa! Calculamos o desvio baseado na curvatura
                            const posicaoQueda_mm = p.z; 
                            const senoTangente = Math.max(-1, Math.min(posicaoQueda_mm / raio_mm, 1)); // Trava de segurança trigonométrica
                            const angulo_lateral_rad = Math.asin(senoTangente); 
                            
                            const v_refl = v0 * e_rest;
                            p.vz = v_refl * Math.sin(angulo_lateral_rad) + (Math.random() - 0.5) * 0.5;
                        }
                    }
                    
                    if (p.hit) {
                        p.z += p.vz; // Propaga no tempo
                    }

                    // Remover sementes que caíram do solo ou escaparam muito pela lateral
                    if (body.position.y > canvasDist.height + 100 || Math.abs(p.z) > 300) {
                        World.remove(worldDist, body);
                        particulasBodyDist.splice(i, 1);
                        continue;
                    }
                    
                    // --- RENDERIZAÇÃO: VISTA FRONTAL (XY) ---
                    ctxDist.shadowColor = '#d29922';
                    ctxDist.shadowBlur = 5;
                    ctxDist.fillStyle = '#d29922';
                    ctxDist.beginPath();
                    ctxDist.arc(body.position.x, body.position.y, p.raio, 0, Math.PI * 2);
                    ctxDist.fill();
                    
                    ctxDist.shadowColor = 'transparent';
                    ctxDist.fillStyle = '#ffc107';
                    ctxDist.beginPath();
                    ctxDist.arc(body.position.x - 1, body.position.y - 1, p.raio * 0.4, 0, Math.PI * 2);
                    ctxDist.fill();

                    // --- RENDERIZAÇÃO: VISTA LATERAL (ZY) ---
                    const z_screen = centroXLateral + p.z; 
                    
                    // Impede o desenho de vazar para a visão do quadro esquerdo
                    if (z_screen > meioTela + 10 && z_screen < canvasDist.width - 10) {
                        ctxDist.shadowColor = '#d29922';
                        ctxDist.shadowBlur = 5;
                        ctxDist.fillStyle = '#d29922';
                        ctxDist.beginPath();
                        ctxDist.arc(z_screen, body.position.y, p.raio, 0, Math.PI * 2);
                        ctxDist.fill();
                        
                        ctxDist.shadowColor = 'transparent';
                        ctxDist.fillStyle = '#ffc107';
                        ctxDist.beginPath();
                        ctxDist.arc(z_screen - 1, body.position.y - 1, p.raio * 0.4, 0, Math.PI * 2);
                        ctxDist.fill();
                    }
                }
                
                // === DESENHAR SOLO (AMBAS AS VISTAS) ===
                ctxDist.fillStyle = '#3d2817';
                ctxDist.fillRect(0, soloY, canvasDist.width, canvasDist.height - soloY);
                
                ctxDist.shadowColor = 'transparent';
                ctxDist.strokeStyle = '#8b949e';
                ctxDist.lineWidth = 3;
                ctxDist.beginPath();
                ctxDist.moveTo(0, soloY);
                ctxDist.lineTo(canvasDist.width, soloY);
                ctxDist.stroke();
                
                // Label do solo
                ctxDist.fillStyle = '#8b949e';
                ctxDist.font = 'bold 14px monospace';
                ctxDist.fillText('SOLO', 15, soloY + 25);
                ctxDist.fillText('SOLO', meioTela + 15, soloY + 25);
                
                // Informação de altura
                ctxDist.fillStyle = '#8b949e';
                ctxDist.font = '11px monospace';
                ctxDist.fillText(`h = ${h_chapa.toFixed(1)}m`, meioTela - 60, soloY - 10);
                
                } catch(err) {
                    console.error('Erro na renderização:', err);
                }
                
                requestAnimationFrame(renderizarDistribuidorMatterJS);
            }

            // Ativa o sistema
            console.log('✅ Ativando sistema...');
            atualizarDashboard();    // Pré-renderiza o Destorroador
            atualizarDistribuidor(); // Pré-renderiza o Distribuidor (corrige o bug do MathJax vazio na 1Âª abertura)
            atualizarPh();
            console.log('✅ Dashboards atualizados');
            renderizar();
            console.log('✅ Renderizadores iniciados');
            renderizarDistribuidorMatterJS();
            renderizarDosador(); // Inicia o laço 2D do dosador pneumático
            console.log('✅ ===== APLICAÇÃO INICIADA COM SUCESSO! =====');
        }  // Fecha iniciarAplicacao

