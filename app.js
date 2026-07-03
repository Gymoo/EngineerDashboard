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

            function redimensionarCanvasDoDashboard(dashboardKey) {
                if (dashboardKey === 'destorroador' && !dom?.mainContent?.classList.contains('hidden')) {
                    redimensionarCanvas();
                } else if (dashboardKey === 'distribuidor' && !dom?.mainDist?.classList.contains('hidden')) {
                    redimensionarCanvasDist();
                }
            }
            window.addEventListener('resize', redimensionarCanvas);
            window.addEventListener('resize', redimensionarCanvasDist);
            redimensionarCanvas();
            redimensionarCanvasDist();

            // --- MAPEAMENTO DE DOM SEGURO ---
            dom = {
                homeScreen: document.getElementById('home-screen'),
                sidebar: document.getElementById('sidebar'),
                mainContent: document.getElementById('main-content'),
                sidebarDist: document.getElementById('sidebar-distribuidor'),
                mainDist: document.getElementById('main-distribuidor'),
                
                btnDestorroador: document.getElementById('btn-destorroador'),
                btnDistribuidor: document.getElementById('btn-distribuidor'),
                btnVoltar: document.getElementById('btn-voltar'),
                btnVoltarDist: document.getElementById('btn-voltar-dist'),
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
                painelDirDist: document.getElementById('painel_dir_dist')
            };

            const dashboardProfiles = {
                destorroador: {
                    container: dom.sidebar,
                    activeProfile: 'minimo',
                    profiles: { minimo: {}, maximo: {} }
                },
                distribuidor: {
                    container: dom.sidebarDist,
                    activeProfile: 'minimo',
                    profiles: { minimo: {}, maximo: {} }
                }
            };
            const dashboardDefaults = {};
            const sidebarConfigs = {
                destorroador: { element: dom.sidebar, pinned: true, collapsed: false },
                distribuidor: { element: dom.sidebarDist, pinned: true, collapsed: false }
            };
            const textosOriginais = new WeakMap();
            const traducoesIngles = {
                'Portal de Engenharia': 'Engineering Portal',
                'Selecione a ferramenta de simulação desejada.': 'Select the desired simulation tool.',
                'Destorroador NPK': 'NPK Lump Breaker',
                'Distribuidor de Sólidos': 'Solid Material Distributor',
                'Aplicação de Fluido no Solo': 'Soil Fluid Application',
                'Aplicação Linha Pressurizada': 'Pressurized Line Application',
                'Acessar Simulador': 'Open Simulator',
                'Em desenvolvimento': 'In development',
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
                'Velocidade Refletida (Váµ£)': 'Reflected Velocity (Váµ£)',
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
                'Física aplicada: Escoamento de fluidos compressíveis, vazão volumétrica e razão de carregamento bifásico.': 'Applied physics: Compressible fluid flow, volumetric flow rate, and two-phase loading ratio.'
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
                        }
                    },
                    radios: {
                        modo: obterModoSelecionado('modo'),
                        modo_dist: obterModoSelecionado('modo_dist')
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
                atualizarBotoesDashboard(dashboardKey);
                persistirEstadoAplicacao();
                atualizarDashboardPorChave(dashboardKey);
            }

            function restaurarEstadoPersistido() {
                const estadoSalvo = carregarEstadoPersistido();
                if (!estadoSalvo) return;

                ['destorroador', 'distribuidor'].forEach((dashboardKey) => {
                    const salvo = estadoSalvo.dashboards?.[dashboardKey];
                    if (!salvo) return;

                    if (salvo.profiles?.minimo) {
                        dashboardProfiles[dashboardKey].profiles.minimo = clonarEstrutura(salvo.profiles.minimo);
                    }
                    if (salvo.profiles?.maximo) {
                        dashboardProfiles[dashboardKey].profiles.maximo = clonarEstrutura(salvo.profiles.maximo);
                    }
                    if (salvo.activeProfile === 'minimo' || salvo.activeProfile === 'maximo') {
                        dashboardProfiles[dashboardKey].activeProfile = salvo.activeProfile;
                    }

                    restaurarEstadoDashboard(dashboardKey);
                    atualizarBotoesDashboard(dashboardKey);
                });

                aplicarModoSelecionado('modo', estadoSalvo.radios?.modo);
                aplicarModoSelecionado('modo_dist', estadoSalvo.radios?.modo_dist);
            }

            function resetarDashboard(dashboardKey) {
                const padrao = dashboardDefaults[dashboardKey];
                if (!padrao) return;

                dashboardProfiles[dashboardKey].activeProfile = padrao.activeProfile;
                dashboardProfiles[dashboardKey].profiles.minimo = clonarEstrutura(padrao.profiles.minimo);
                dashboardProfiles[dashboardKey].profiles.maximo = clonarEstrutura(padrao.profiles.maximo);

                if (dashboardKey === 'destorroador') {
                    aplicarModoSelecionado('modo', '1');
                } else {
                    aplicarModoSelecionado('modo_dist', '1');
                }

                restaurarEstadoDashboard(dashboardKey);
                atualizarBotoesDashboard(dashboardKey);
                persistirEstadoAplicacao();
                atualizarDashboardPorChave(dashboardKey);
            }

            let resetDashboardPendente = null;

            function getTextoConfirmacaoReset(dashboardKey) {
                const idiomaAtual = document.body.dataset.language === 'en' ? 'en' : 'pt';
                const nomeDashboard = dashboardKey === 'destorroador'
                    ? (idiomaAtual === 'en' ? 'NPK Lump Breaker' : 'Destorroador NPK')
                    : (idiomaAtual === 'en' ? 'Solid Material Distributor' : 'Distribuidor de Sólidos');

                return idiomaAtual === 'en'
                    ? {
                        title: 'Confirm reset',
                        text: `Reset ${nomeDashboard} to the default values? This will discard the current minimum and maximum profiles.`,
                        cancel: 'Cancel',
                        confirm: 'Reset'
                    }
                    : {
                        title: 'Confirmar redefinição',
                        text: `Redefinir ${nomeDashboard} para os valores padrão? Isso vai descartar os perfis de mínimo e máximo atuais.`,
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
                return `\\texttip{${latex}}{${document.body.dataset.language === 'en' ? item.en : item.pt}}`;
            }

            function configurarTooltipsInstantaneos() {
                const tooltip = document.createElement('div');
                tooltip.className = 'app-tooltip';
                tooltip.setAttribute('role', 'tooltip');
                document.body.appendChild(tooltip);
                let alvoAtual = null;

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
                    alvoAtual = alvo;
                    tooltip.textContent = alvo.dataset.tooltip;
                    tooltip.classList.add('visible');
                    posicionar(event);
                });
                document.addEventListener('pointermove', posicionar);
                document.addEventListener('pointerout', (event) => {
                    if (!alvoAtual || event.relatedTarget?.closest?.('[data-tooltip]') === alvoAtual) return;
                    alvoAtual = null;
                    tooltip.classList.remove('visible');
                });
                document.addEventListener('focusin', (event) => {
                    const alvo = event.target.closest?.('[data-tooltip]');
                    if (!alvo || !alvo.dataset.tooltip) return;
                    alvoAtual = alvo;
                    tooltip.textContent = alvo.dataset.tooltip;
                    const rect = alvo.getBoundingClientRect();
                    tooltip.classList.add('visible');
                    posicionar({ clientX: rect.left + rect.width / 2, clientY: rect.bottom });
                });
                document.addEventListener('focusout', () => {
                    alvoAtual = null;
                    tooltip.classList.remove('visible');
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

                let resultado = '';
                let cursor = 0;
                while (cursor < html.length) {
                    const inicioTexttip = html.indexOf(prefixo, cursor);
                    if (inicioTexttip < 0) {
                        resultado += html.slice(cursor);
                        break;
                    }

                    resultado += html.slice(cursor, inicioTexttip);
                    const inicioSimbolo = inicioTexttip + prefixo.length - 1;
                    const simbolo = lerGrupoBalanceado(html, inicioSimbolo);
                    if (!simbolo || html[simbolo.fim] !== '{') {
                        resultado += prefixo;
                        cursor = inicioTexttip + prefixo.length;
                        continue;
                    }

                    const descricao = lerGrupoBalanceado(html, simbolo.fim);
                    if (!descricao) {
                        resultado += prefixo;
                        cursor = inicioTexttip + prefixo.length;
                        continue;
                    }

                    let textoTooltip = descricao.conteudo;
                    if (portuguesVisivel.test(textoTooltip)) {
                        textoTooltip = criarTooltipEspecificoEmIngles(simbolo.conteudo, textoTooltip);
                    }

                    resultado += `${prefixo}${simbolo.conteudo}}{${textoTooltip}}`;
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

            Object.keys(dashboardProfiles).forEach((dashboardKey) => {
                const snapshotInicial = capturarEstadoDashboard(dashboardProfiles[dashboardKey].container);
                dashboardProfiles[dashboardKey].profiles.minimo = clonarEstrutura(snapshotInicial);
                dashboardProfiles[dashboardKey].profiles.maximo = clonarEstrutura(snapshotInicial);
                dashboardDefaults[dashboardKey] = {
                    activeProfile: 'minimo',
                    profiles: {
                        minimo: clonarEstrutura(snapshotInicial),
                        maximo: clonarEstrutura(snapshotInicial)
                    }
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

            dom.btnVoltar.addEventListener('click', irParaHome);
            dom.btnVoltarDist.addEventListener('click', irParaHome);

            // --- LÓGICA MATEMÁTICA E RENDERIZAÇÃO DE INTERFACE ---
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
                    bufferInvisivel.innerHTML = traduzirTextosDeFormula(htmlDireito);
                    
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
                        dom.painelDireito.innerHTML = traduzirTextosDeFormula(htmlDireito);
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

                    canvasDist.style.display = 'none';
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
                            <div class="metric-card" title="${textoIdioma('Velocidade da semente imediatamente após bater na chapa, descontada a perda pelo coeficiente de restituição.', 'Seed speed immediately after striking the plate, discounting the loss from the restitution coefficient.')}"><div class="metric-label">${textoIdioma('Velocidade Refletida (Váµ£)', 'Reflected Velocity (Váµ£)')}</div><div class="metric-value">${v_refl.toFixed(1)} m/s</div></div>
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
                    buffer.innerHTML = traduzirTextosDeFormula(htmlDireito);
                    if (window.MathJax && MathJax.typesetPromise) {
                        if (!window.mjPromiseDist) window.mjPromiseDist = Promise.resolve();
                        window.mjPromiseDist = window.mjPromiseDist.then(function() {
                            return MathJax.typesetPromise([buffer]).then(function() {
                                dom.painelDirDist.innerHTML = "";
                                while (buffer.firstChild) dom.painelDirDist.appendChild(buffer.firstChild);
                            });
                        }).catch(err => console.log(err));
                    } else {
                        dom.painelDirDist.innerHTML = traduzirTextosDeFormula(htmlDireito);
                    }
                }, 80);
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
            
            function renderizar() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

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
                            x: centroX - 40 + Math.random() * 80,
                            y: 0,
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

            function renderizarDistribuidorMatterJS() {
                if (!ativarAnimacaoDist) {
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
            console.log('✅ Dashboards atualizados');
            renderizar();
            console.log('✅ Renderizadores iniciados');
            renderizarDistribuidorMatterJS();
            renderizarDosador(); // Inicia o laço 2D do dosador pneumático
            console.log('✅ ===== APLICAÇÃO INICIADA COM SUCESSO! =====');
        }  // Fecha iniciarAplicacao

