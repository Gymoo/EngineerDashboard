$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$app = Get-Content (Join-Path $root 'app.js') -Raw
$html = Get-Content (Join-Path $root 'index.html') -Raw
$css = Get-Content (Join-Path $root 'styles.css') -Raw

function Assert-Contains([string]$Content, [string]$Pattern, [string]$Message) {
    if ($Content -notmatch $Pattern) { throw "Falhou: $Message" }
}

Assert-Contains $html 'data-pdf-export="destorroador"' 'botão do Destorroador ausente'
Assert-Contains $html 'data-pdf-export="distribuidor"' 'botão do Distribuidor ausente'
Assert-Contains $html 'data-pdf-export="ph"' 'botão de pH ausente'
Assert-Contains $app 'function gerarRelatorioPdf' 'gerador de relatório ausente'
Assert-Contains $app 'Plotly\.toImage' 'captura Plotly ausente'
Assert-Contains $app 'canvasAtual\.toDataURL' 'captura Canvas ausente'
Assert-Contains $app 'coletarGlossarioPdf' 'glossário ausente'
Assert-Contains $app 'registrosVariaveisMemorial' 'registro semântico das variáveis ausente'
Assert-Contains $app 'registrarVariavelMemorial' 'registro das variáveis do memorial ausente'
Assert-Contains $app 'termo\.innerHTML = `\\\\\(' 'notação matemática do glossário ausente'
Assert-Contains $app 'coletarReferenciasPdf' 'bibliografia ausente'
Assert-Contains $app 'Guilherme Silva de Oliveira' 'autoria ausente'
Assert-Contains $app 'window\.print\(\)' 'impressão nativa ausente'
Assert-Contains $css '@page \{ size: A4 portrait' 'formato A4 retrato ausente'
Assert-Contains $css 'body\.pdf-printing' 'isolamento de impressão ausente'

Write-Output 'Validação estática do relatório PDF concluída com sucesso.'
