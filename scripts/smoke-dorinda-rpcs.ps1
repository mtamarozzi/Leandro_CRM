# ============================================================================
# Smoke test das 5 RPCs da Dorinda (sub-bloco 4.4)
# Migration: supabase/migrations/0008_dorinda_rpcs.sql
# Contrato:  docs/04-DORINDA-TOOLS-CONTRACT.md (v0.2)
# ============================================================================
# Como rodar:
#
#   1. Aplicar a migration 0008 no Supabase Leandro (SQL Editor ou supabase db push)
#   2. Garantir que o workspace tem ao menos 1 imóvel disponível com fotos
#   3. Configurar variáveis de ambiente:
#        $env:SUPABASE_LEANDRO_URL = "https://ompbnsrtnpgwiufanljp.supabase.co"
#        $env:SUPABASE_LEANDRO_ANON_KEY = "<anon key do projeto Leandro>"
#   4. Rodar: pwsh scripts/smoke-dorinda-rpcs.ps1
#
# Cada teste imprime [OK] ou [FAIL] + o JSON retornado pra inspeção manual.
# Os testes que esperam erro são marcados [esperado erro] no título.
# ============================================================================

# ----- Setup ----------------------------------------------------------------

if (-not $env:SUPABASE_LEANDRO_URL) {
    Write-Error 'Variável $env:SUPABASE_LEANDRO_URL não definida.'
    exit 1
}
if (-not $env:SUPABASE_LEANDRO_ANON_KEY) {
    Write-Error 'Variável $env:SUPABASE_LEANDRO_ANON_KEY não definida.'
    exit 1
}

$base = "$($env:SUPABASE_LEANDRO_URL)/rest/v1/rpc"
$headers = @{
    apikey         = $env:SUPABASE_LEANDRO_ANON_KEY
    Authorization  = "Bearer $($env:SUPABASE_LEANDRO_ANON_KEY)"
    'Content-Type' = 'application/json'
}

function Invoke-Rpc {
    param([string]$Name, [hashtable]$Body)
    $json = if ($Body) { $Body | ConvertTo-Json -Depth 8 -Compress } else { '{}' }
    try {
        Invoke-RestMethod -Uri "$base/$Name" -Method Post -Headers $headers -Body $json
    } catch {
        # PostgREST retorna 400/500 com JSON no body; extrai pra exibir
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errBody = $reader.ReadToEnd()
        [PSCustomObject]@{ http_error = $_.Exception.Message; body = $errBody }
    }
}

function Show-Test {
    param([string]$Label, $Result, [bool]$ExpectOk = $true)
    $ok = ($Result.ok -eq $true)
    $passed = ($ok -eq $ExpectOk)
    $mark = if ($passed) { '[OK]' } else { '[FAIL]' }
    $color = if ($passed) { 'Green' } else { 'Red' }
    Write-Host "`n$mark $Label" -ForegroundColor $color
    $Result | ConvertTo-Json -Depth 6
}

# ----- 1. consultar_imoveis -------------------------------------------------

Write-Host "`n===== 1. dorinda_consultar_imoveis =====" -ForegroundColor Cyan

$r = Invoke-Rpc 'dorinda_consultar_imoveis' @{ p_limit = 3 }
Show-Test 'sem filtros (limit 3)' $r
$global:FIRST_PROPERTY = if ($r.results.Count -gt 0) { $r.results[0] } else { $null }

$r = Invoke-Rpc 'dorinda_consultar_imoveis' @{
    p_city = 'Santos'; p_min_bedrooms = 2; p_max_sale_price = 1500000; p_limit = 5
}
Show-Test 'filtros: Santos + 2+ dorm + até 1.5M' $r

# ----- 2. consultar_imovel_por_id -------------------------------------------

Write-Host "`n===== 2. dorinda_consultar_imovel_por_id =====" -ForegroundColor Cyan

if ($global:FIRST_PROPERTY) {
    $r = Invoke-Rpc 'dorinda_consultar_imovel_por_id' @{ p_identifier = $global:FIRST_PROPERTY.id }
    Show-Test "por UUID ($($global:FIRST_PROPERTY.id))" $r

    if ($global:FIRST_PROPERTY.ref_code) {
        $r = Invoke-Rpc 'dorinda_consultar_imovel_por_id' @{ p_identifier = $global:FIRST_PROPERTY.ref_code }
        Show-Test "por ref_code ($($global:FIRST_PROPERTY.ref_code))" $r
    }
} else {
    Write-Host '[SKIP] Nenhum imóvel disponível no consultar_imoveis — pule pra 3' -ForegroundColor Yellow
}

$r = Invoke-Rpc 'dorinda_consultar_imovel_por_id' @{ p_identifier = 'XXX-NAO-EXISTE-999' }
Show-Test 'ref_code inexistente [esperado erro]' $r -ExpectOk $false

# ----- 3. criar_lead --------------------------------------------------------

Write-Host "`n===== 3. dorinda_criar_lead =====" -ForegroundColor Cyan

$smokePhone = '(13) 99876-0000'  # marcador "0000" pra facilitar limpeza depois

$r = Invoke-Rpc 'dorinda_criar_lead' @{
    p_name = 'Smoke Test Lead'
    p_phone = $smokePhone
    p_interest = 'apê 2 dorm Santos (teste smoke)'
    p_ai_summary = 'Lead criado pelo smoke test da Dorinda'
}
Show-Test 'criar lead novo' $r
$global:SMOKE_LEAD_ID = $r.lead_id

# Mesmo telefone, formato diferente → deve dar was_existing=true
$r = Invoke-Rpc 'dorinda_criar_lead' @{
    p_name = 'Smoke Test Lead Atualizado'
    p_phone = '13998760000'   # mesmo número, sem formatação
    p_interest = 'agora atualizou interesse'
}
Show-Test 'dedup: mesmo phone normalizado → was_existing:true' $r
if ($r.was_existing -ne $true) {
    Write-Host '⚠ esperava was_existing:true — dedup falhou?' -ForegroundColor Yellow
}

$r = Invoke-Rpc 'dorinda_criar_lead' @{ p_name = 'X'; p_phone = '123' }
Show-Test 'telefone curto demais [esperado erro]' $r -ExpectOk $false

$r = Invoke-Rpc 'dorinda_criar_lead' @{ p_name = ''; p_phone = '11999999999' }
Show-Test 'nome vazio [esperado erro]' $r -ExpectOk $false

# ----- 4. agendar_visita ----------------------------------------------------

Write-Host "`n===== 4. dorinda_agendar_visita =====" -ForegroundColor Cyan

if ($global:FIRST_PROPERTY) {
    $futureSlot = (Get-Date).AddDays(2).Date.AddHours(14).ToString('o')  # depois de amanhã 14h

    $r = Invoke-Rpc 'dorinda_agendar_visita' @{
        p_property_id = $global:FIRST_PROPERTY.id
        p_lead_phone  = $smokePhone
        p_lead_name   = 'Smoke Test Lead'
        p_starts_at   = $futureSlot
        p_notes       = 'Visita criada pelo smoke test'
    }
    Show-Test "agendar visita válida ($futureSlot)" $r
    $global:SMOKE_EVENT_ID = $r.event_id
    $global:SMOKE_PROTOCOL = $r.protocol_code

    # Mesmo horário → conflict
    $r = Invoke-Rpc 'dorinda_agendar_visita' @{
        p_property_id = $global:FIRST_PROPERTY.id
        p_lead_phone  = $smokePhone
        p_lead_name   = 'Smoke Test Lead'
        p_starts_at   = $futureSlot
    }
    Show-Test 'mesmo horário → conflict [esperado erro]' $r -ExpectOk $false
    if ($r.error -ne 'conflict') {
        Write-Host '⚠ esperava error:conflict' -ForegroundColor Yellow
    }

    # 30min depois → ainda dentro da janela de 60min → conflict
    $futureCollide = (Get-Date).AddDays(2).Date.AddHours(14).AddMinutes(30).ToString('o')
    $r = Invoke-Rpc 'dorinda_agendar_visita' @{
        p_property_id = $global:FIRST_PROPERTY.id
        p_lead_phone  = $smokePhone
        p_lead_name   = 'Smoke Test Lead'
        p_starts_at   = $futureCollide
    }
    Show-Test '+30min → ainda na janela de conflito [esperado erro]' $r -ExpectOk $false

    # Passado → invalid_starts_at
    $past = (Get-Date).AddDays(-1).ToString('o')
    $r = Invoke-Rpc 'dorinda_agendar_visita' @{
        p_property_id = $global:FIRST_PROPERTY.id
        p_lead_phone  = $smokePhone
        p_lead_name   = 'Smoke Test Lead'
        p_starts_at   = $past
    }
    Show-Test 'no passado [esperado erro: invalid_starts_at + stage:validation]' $r -ExpectOk $false
} else {
    Write-Host '[SKIP] Sem imóvel — pule pra 5' -ForegroundColor Yellow
}

# ----- 5. notificar_corretor ------------------------------------------------

Write-Host "`n===== 5. dorinda_notificar_corretor =====" -ForegroundColor Cyan

$r = Invoke-Rpc 'dorinda_notificar_corretor' @{
    p_tipo     = 'handoff'
    p_mensagem = 'Lead pediu desconto de 50k no imóvel ALG-SP-014 (smoke test)'
    p_urgencia = 'alta'
    p_lead_id  = $global:SMOKE_LEAD_ID
}
Show-Test 'handoff urgência alta' $r

$r = Invoke-Rpc 'dorinda_notificar_corretor' @{
    p_tipo     = 'situacao_complexa'
    p_mensagem = 'Lead repetiu mesma pergunta 3x (smoke test)'
    p_urgencia = 'media'
    p_lead_id  = $global:SMOKE_LEAD_ID
}
Show-Test 'situacao_complexa urgência media' $r

$r = Invoke-Rpc 'dorinda_notificar_corretor' @{
    p_tipo = 'tipo_que_nao_existe'; p_mensagem = 'oi'
}
Show-Test 'tipo inválido [esperado erro]' $r -ExpectOk $false

# ----- Cleanup hint ---------------------------------------------------------

Write-Host "`n===== Cleanup (manual) =====" -ForegroundColor Cyan
Write-Host @"
Pra remover os dados do smoke (execute no SQL Editor do Supabase):

DELETE FROM events WHERE id = '$($global:SMOKE_EVENT_ID)';
DELETE FROM interactions WHERE lead_id = '$($global:SMOKE_LEAD_ID)';
DELETE FROM lead_properties WHERE lead_id = '$($global:SMOKE_LEAD_ID)';
DELETE FROM notifications WHERE metadata->>'lead_id' = '$($global:SMOKE_LEAD_ID)';
DELETE FROM leads WHERE id = '$($global:SMOKE_LEAD_ID)';
"@ -ForegroundColor DarkGray

Write-Host "`n===== Smoke test concluído =====" -ForegroundColor Cyan
