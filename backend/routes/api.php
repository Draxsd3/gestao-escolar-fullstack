<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{
    UsuarioController, AuthController, AlunoController,
    MatriculaController, NotaController, FrequenciaController,
    FinanceiroController, TurmaController, DashboardController,
    ComunicacaoController, GestaoController,
};

// ── Públicas ──────────────────────────────────────────────────
Route::post('/auth/login',           [AuthController::class, 'login']);
Route::post('/auth/registrar-admin', [AuthController::class, 'registrarAdmin']);

// ── Autenticadas ──────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/auth/me',      [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/senha',  [AuthController::class, 'alterarSenha']);

    // ═══════════════════════════════════════════════════════
    // ANO LETIVO VIGENTE — usado pelo frontend em TODAS as telas
    // ═══════════════════════════════════════════════════════
    Route::get('/ano-letivo/vigente', [GestaoController::class, 'anoLetivoVigente']);

    // Dashboard
    Route::get('/dashboard/admin',       [DashboardController::class, 'admin'])->middleware('perfil:admin,secretaria,coordenacao');
    Route::get('/dashboard/professor',   [DashboardController::class, 'professor'])->middleware('perfil:professor,admin');
    Route::get('/dashboard/responsavel', [DashboardController::class, 'responsavel'])->middleware('perfil:responsavel,admin');

    // Alunos
    Route::get('/alunos',                [AlunoController::class, 'index']);
    Route::get('/alunos/{id}',           [AlunoController::class, 'show']);
    Route::get('/alunos/{id}/boletim',   [AlunoController::class, 'boletim']);
    Route::get('/alunos/{id}/frequencia',[AlunoController::class, 'frequencia']);
    Route::post('/alunos',               [AlunoController::class, 'store'])->middleware('perfil:admin,secretaria');
    Route::put('/alunos/{id}',           [AlunoController::class, 'update'])->middleware('perfil:admin,secretaria');
    Route::delete('/alunos/{id}',        [AlunoController::class, 'destroy'])->middleware('perfil:admin,secretaria');

    // Turmas
    Route::get('/turmas',             [TurmaController::class, 'index']);
    Route::get('/turmas/{id}',        [TurmaController::class, 'show']);
    Route::get('/turmas/{id}/alunos', [TurmaController::class, 'alunos']);
    Route::get('/cursos-disponiveis', [GestaoController::class, 'cursos'])->middleware('perfil:admin,secretaria,coordenacao');
    Route::get('/anos-letivos',       [GestaoController::class, 'anosLetivos'])->middleware('perfil:admin,secretaria,coordenacao');
    Route::get('/salas',              [GestaoController::class, 'salas'])->middleware('perfil:admin,secretaria,coordenacao');
    Route::get('/disciplinas',        [GestaoController::class, 'disciplinas'])->middleware('perfil:admin,secretaria,coordenacao,professor');
    Route::get('/professores',        [TurmaController::class, 'professores'])->middleware('perfil:admin,secretaria,coordenacao');
    Route::post('/turmas',            [TurmaController::class, 'store'])->middleware('perfil:admin,secretaria,coordenacao');
    Route::put('/turmas/{id}',        [TurmaController::class, 'update'])->middleware('perfil:admin,secretaria,coordenacao');
    Route::patch('/turmas/{id}/encerrar', [TurmaController::class, 'encerrar'])->middleware('perfil:admin,secretaria,coordenacao');
    Route::delete('/turmas/{id}',     [TurmaController::class, 'destroy'])->middleware('perfil:admin,secretaria,coordenacao');
    Route::post('/turmas/{id}/disciplinas', [TurmaController::class, 'storeDisciplina'])->middleware('perfil:admin,secretaria,coordenacao');
    Route::put('/turmas/{id}/disciplinas/{disciplinaId}', [TurmaController::class, 'updateDisciplina'])->middleware('perfil:admin,secretaria,coordenacao');
    Route::delete('/turmas/{id}/disciplinas/{disciplinaId}', [TurmaController::class, 'destroyDisciplina'])->middleware('perfil:admin,secretaria,coordenacao');
    Route::post('/turmas/{id}/horarios', [TurmaController::class, 'storeHorario'])->middleware('perfil:admin,secretaria,coordenacao');
    Route::put('/turmas/{id}/horarios/{horarioId}', [TurmaController::class, 'updateHorario'])->middleware('perfil:admin,secretaria,coordenacao');
    Route::delete('/turmas/{id}/horarios/{horarioId}', [TurmaController::class, 'destroyHorario'])->middleware('perfil:admin,secretaria,coordenacao');

    // Matrículas
    Route::get('/matriculas',      [MatriculaController::class, 'index'])->middleware('perfil:admin,secretaria,coordenacao');
    Route::post('/matriculas',     [MatriculaController::class, 'store'])->middleware('perfil:admin,secretaria');
    Route::post('/matriculas/lote',[MatriculaController::class, 'storeLote'])->middleware('perfil:admin,secretaria');
    Route::put('/matriculas/{id}', [MatriculaController::class, 'update'])->middleware('perfil:admin,secretaria');

    // Notas
    Route::get('/notas/contexto',        [NotaController::class, 'contexto'])->middleware('perfil:admin,coordenacao,professor,secretaria');
    Route::get('/notas',                 [NotaController::class, 'index'])->middleware('perfil:admin,coordenacao,professor,secretaria');
    Route::post('/notas/lancar',         [NotaController::class, 'lancar'])->middleware('perfil:admin,professor');
    Route::post('/notas/calcular-medias',[NotaController::class, 'calcularMedias'])->middleware('perfil:admin,professor,coordenacao');
    Route::get('/periodos-avaliacao',    [GestaoController::class, 'periodosAvaliacao'])->middleware('perfil:admin,coordenacao,professor,secretaria');

    // Frequência
    Route::get('/frequencia',           [FrequenciaController::class, 'index'])->middleware('perfil:admin,coordenacao,professor,secretaria');
    Route::post('/frequencia/lancar',   [FrequenciaController::class, 'lancar'])->middleware('perfil:admin,professor');
    Route::get('/frequencia/relatorio', [FrequenciaController::class, 'relatorio'])->middleware('perfil:admin,coordenacao,professor,secretaria');
    Route::get('/frequencia/historico', [FrequenciaController::class, 'historico'])->middleware('perfil:admin,coordenacao,professor,secretaria');

    // Boletins
    Route::get('/boletins',      [GestaoController::class, 'boletins'])->middleware('perfil:admin,coordenacao,professor,secretaria,responsavel,aluno');
    Route::get('/boletins/{id}', [GestaoController::class, 'boletimDetalhe'])->middleware('perfil:admin,coordenacao,professor,secretaria,responsavel,aluno');

    // Financeiro
    Route::prefix('financeiro')->middleware('perfil:admin,secretaria')->group(function () {
        Route::get('/mensalidades',        [FinanceiroController::class, 'mensalidades']);
        Route::get('/inadimplentes',       [FinanceiroController::class, 'inadimplentes']);
        Route::post('/recebimento',        [FinanceiroController::class, 'registrarRecebimento']);
        Route::post('/gerar-mensalidades', [FinanceiroController::class, 'gerarMensalidades']);
        Route::get('/resumo',              [FinanceiroController::class, 'resumoFinanceiro']);
    });

    // Comunicação
    Route::get('/comunicados',           [ComunicacaoController::class, 'comunicados']);
    Route::post('/comunicados',          [ComunicacaoController::class, 'criarComunicado'])->middleware('perfil:admin,secretaria,coordenacao');
    Route::get('/mensagens',             [ComunicacaoController::class, 'mensagens']);
    Route::post('/mensagens',            [ComunicacaoController::class, 'enviarMensagem']);
    Route::patch('/mensagens/{id}/lida', [ComunicacaoController::class, 'marcarLida']);

    // Usuários (admin)
    Route::prefix('usuarios')->middleware('perfil:admin')->group(function () {
        Route::get('/',              [UsuarioController::class, 'index']);
        Route::get('/perfis',        [UsuarioController::class, 'perfis']);
        Route::post('/',             [UsuarioController::class, 'store']);
        Route::get('/{id}',          [UsuarioController::class, 'show']);
        Route::put('/{id}',          [UsuarioController::class, 'update']);
        Route::patch('/{id}/toggle', [UsuarioController::class, 'toggleAtivo']);
        Route::patch('/{id}/senha',  [UsuarioController::class, 'resetarSenha']);
    });

    Route::get('/usuarios-lista', fn() =>
        \App\Models\User::where('ativo', true)->select('id','nome','email')->orderBy('nome')->get()
    );

    // ── Gestão Escolar CRUD ───────────────────────────────
    Route::middleware('perfil:admin')->group(function () {
        // Anos Letivos
        Route::get('/ano-letivo',                [GestaoController::class, 'anosLetivos']);
        Route::post('/anos-letivos',             [GestaoController::class, 'storeAnoLetivo']);
        Route::post('/ano-letivo',               [GestaoController::class, 'storeAnoLetivo']);
        Route::post('/anos-letivos/{id}/ativar', [GestaoController::class, 'ativarAnoLetivo']);

        // Fechar período (ação explícita do admin)
        Route::post('/periodos-avaliacao/{id}/fechar', [GestaoController::class, 'fecharPeriodo']);

        // Períodos
        Route::post('/periodos-avaliacao',       [GestaoController::class, 'storePeriodoAvaliacao']);
        Route::put('/periodos-avaliacao/{id}',   [GestaoController::class, 'updatePeriodoAvaliacao']);
        Route::delete('/periodos-avaliacao/{id}',[GestaoController::class, 'destroyPeriodoAvaliacao']);

        // Disciplinas
        Route::post('/disciplinas',     [GestaoController::class, 'storeDisciplina']);
        Route::put('/disciplinas/{id}', [GestaoController::class, 'updateDisciplina']);
        Route::delete('/disciplinas/{id}', [GestaoController::class, 'destroyDisciplina']);

        // Séries

        // Planos
        Route::get('/planos-pagamento',  [GestaoController::class, 'planosPagamento']);
        Route::post('/planos-pagamento', [GestaoController::class, 'storePlanoPagamento']);

        // Níveis
        Route::get('/niveis-ensino',  [GestaoController::class, 'niveisEnsino']);
        Route::post('/niveis-ensino', [GestaoController::class, 'storeNivelEnsino']);

        // Aliases para frontend
        Route::get('/periodo-letivo',  [GestaoController::class, 'periodosAvaliacao']);
        Route::post('/periodo-letivo', [GestaoController::class, 'storePeriodoAvaliacao']);
        Route::get('/planos',          [GestaoController::class, 'planosPagamento']);
        Route::post('/planos',         [GestaoController::class, 'storePlanoPagamento']);
        Route::post('/salas',          [GestaoController::class, 'storeSala']);
        Route::put('/salas/{id}',      [GestaoController::class, 'updateSala']);
        Route::delete('/salas/{id}',   [GestaoController::class, 'destroySala']);
        Route::get('/cursos',          [GestaoController::class, 'cursos']);
        Route::post('/cursos',         [GestaoController::class, 'storeCurso']);
        Route::put('/cursos/{id}',     [GestaoController::class, 'updateCurso']);
        Route::delete('/cursos/{id}',  [GestaoController::class, 'destroyCurso']);
    });
});
