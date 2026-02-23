<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{
    UsuarioController,
    AuthController,
    AlunoController,
    MatriculaController,
    NotaController,
    FrequenciaController,
    TurmaController,
    DashboardController,
    ComunicacaoController,
};

// ─────────────────────────────────────────────────────────────
// ROTAS PÚBLICAS
// ─────────────────────────────────────────────────────────────
Route::post('/auth/login',          [AuthController::class, 'login']);
Route::post('/auth/registrar-admin', [AuthController::class, 'registrarAdmin']);

// ─────────────────────────────────────────────────────────────
// ROTAS AUTENTICADAS
// ─────────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/senha', [AuthController::class, 'alterarSenha']);

    // ─── Dashboard (por perfil) ───────────────────────────────
    Route::get('/dashboard/admin',       [DashboardController::class, 'admin'])
        ->middleware('perfil:admin,secretaria,coordenacao');
    Route::get('/dashboard/professor',   [DashboardController::class, 'professor'])
        ->middleware('perfil:professor,admin');
    Route::get('/dashboard/responsavel', [DashboardController::class, 'responsavel'])
        ->middleware('perfil:responsavel,admin');

    // ─── Alunos ───────────────────────────────────────────────
    Route::get('/alunos',               [AlunoController::class, 'index']);
    Route::get('/alunos/{id}',          [AlunoController::class, 'show']);
    Route::get('/alunos/{id}/boletim',  [AlunoController::class, 'boletim']);
    Route::get('/alunos/{id}/frequencia',[AlunoController::class, 'frequencia']);
    Route::post('/alunos',              [AlunoController::class, 'store'])
        ->middleware('perfil:admin,secretaria');
    Route::put('/alunos/{id}',          [AlunoController::class, 'update'])
        ->middleware('perfil:admin,secretaria');
    Route::delete('/alunos/{id}',       [AlunoController::class, 'destroy'])
        ->middleware('perfil:admin,secretaria');

    // ─── Turmas ───────────────────────────────────────────────
    Route::get('/turmas',               [TurmaController::class, 'index']);
    Route::get('/turmas/{id}',          [TurmaController::class, 'show']);
    Route::get('/turmas/{id}/alunos',   [TurmaController::class, 'alunos']);
    Route::post('/turmas',              [TurmaController::class, 'store'])
        ->middleware('perfil:admin,secretaria,coordenacao');
    Route::put('/turmas/{id}',          [TurmaController::class, 'update'])
        ->middleware('perfil:admin,secretaria,coordenacao');

    // ─── Matrículas ───────────────────────────────────────────
    Route::get('/matriculas',           [MatriculaController::class, 'index'])
        ->middleware('perfil:admin,secretaria,coordenacao');
    Route::post('/matriculas',          [MatriculaController::class, 'store'])
        ->middleware('perfil:admin,secretaria');
    Route::put('/matriculas/{id}',      [MatriculaController::class, 'update'])
        ->middleware('perfil:admin,secretaria');

    // ─── Notas ────────────────────────────────────────────────
    Route::get('/notas',                [NotaController::class, 'index'])
        ->middleware('perfil:admin,coordenacao,professor,secretaria');
    Route::post('/notas/lancar',        [NotaController::class, 'lancar'])
        ->middleware('perfil:admin,professor');
    Route::post('/notas/calcular-medias',[NotaController::class, 'calcularMedias'])
        ->middleware('perfil:admin,professor,coordenacao');

    // ─── Frequência ───────────────────────────────────────────
    Route::get('/frequencia',           [FrequenciaController::class, 'index'])
        ->middleware('perfil:admin,coordenacao,professor,secretaria');
    Route::post('/frequencia/lancar',   [FrequenciaController::class, 'lancar'])
        ->middleware('perfil:admin,professor');
    Route::get('/frequencia/relatorio', [FrequenciaController::class, 'relatorio'])
        ->middleware('perfil:admin,coordenacao,professor,secretaria');

    // ─── Financeiro ───────────────────────────────────────────
    Route::prefix('financeiro')->middleware('perfil:admin,secretaria')->group(function () {
        Route::get('/mensalidades',          [\App\Http\Controllers\FinanceiroController::class, 'mensalidades']);
        Route::get('/inadimplentes',         [\App\Http\Controllers\FinanceiroController::class, 'inadimplentes']);
        Route::post('/recebimento',          [\App\Http\Controllers\FinanceiroController::class, 'registrarRecebimento']);
        Route::post('/gerar-mensalidades',   [\App\Http\Controllers\FinanceiroController::class, 'gerarMensalidades']);
        Route::get('/resumo',                [\App\Http\Controllers\FinanceiroController::class, 'resumoFinanceiro']);
    });

    // ─── Comunicação ──────────────────────────────────────────
    Route::get('/comunicados',             [ComunicacaoController::class, 'comunicados']);
    Route::post('/comunicados',            [ComunicacaoController::class, 'criarComunicado'])
        ->middleware('perfil:admin,secretaria,coordenacao');
    Route::get('/mensagens',               [ComunicacaoController::class, 'mensagens']);
    Route::post('/mensagens',              [ComunicacaoController::class, 'enviarMensagem']);
    Route::patch('/mensagens/{id}/lida',   [ComunicacaoController::class, 'marcarLida']);

    // ─── Gestão de Usuários (apenas admin) ───────────────────
    Route::prefix("usuarios")->middleware("perfil:admin")->group(function () {
        Route::get("/",             [UsuarioController::class, "index"]);
        Route::get("/perfis",       [UsuarioController::class, "perfis"]);
        Route::post("/",            [UsuarioController::class, "store"]);
        Route::get("/{id}",         [UsuarioController::class, "show"]);
        Route::put("/{id}",         [UsuarioController::class, "update"]);
        Route::patch("/{id}/toggle", [UsuarioController::class, "toggleAtivo"]);
        Route::patch("/{id}/senha",  [UsuarioController::class, "resetarSenha"]);
    });

    // ─── Referências ──────────────────────────────────────────
    Route::get('/series',                  fn() => \App\Models\Serie::with('nivel')->orderBy('ordem')->get());
    Route::get('/disciplinas',             fn() => \App\Models\Disciplina::where('ativa', true)->orderBy('nome')->get());
    Route::get('/anos-letivos',            fn() => \App\Models\AnoLetivo::orderBy('ano', 'desc')->get());
    Route::get('/periodos-avaliacao',      fn() => \App\Models\PeriodoAvaliacao::orderBy('ordem')->get());
    Route::get('/planos-pagamento',        fn() => \App\Models\PlanoPagamento::where('ativo', true)->get());
    Route::get('/niveis-ensino',           fn() => \App\Models\NivelEnsino::with('series')->get());
});
