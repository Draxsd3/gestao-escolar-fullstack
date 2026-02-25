<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{
    UsuarioController, AuthController, AlunoController,
    MatriculaController, NotaController, FrequenciaController,
    FinanceiroController, TurmaController, DashboardController,
    ComunicacaoController, GestaoController, ProfessorController,
    TarefaController,
};

// ── Públicas ──────────────────────────────────────────────────
Route::post('/auth/login',           [AuthController::class, 'login']);
Route::post('/auth/registrar-admin', [AuthController::class, 'registrarAdmin']);

// ── Autenticadas ──────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/auth/me',      [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/senha',  [AuthController::class, 'alterarSenha']);
    Route::post('/auth/perfil', [AuthController::class, 'atualizarPerfil']);

    // ═══════════════════════════════════════════════════════
    // ANO LETIVO VIGENTE — usado pelo frontend em TODAS as telas
    // ═══════════════════════════════════════════════════════
    Route::get('/ano-letivo/vigente', [GestaoController::class, 'anoLetivoVigente']);

    // Dashboard
    Route::get('/dashboard/admin',       [DashboardController::class, 'admin'])->middleware('perfil:admin,secretaria,coordenacao');
    Route::get('/dashboard/professor',   [DashboardController::class, 'professor'])->middleware('perfil:professor,admin');
    Route::get('/dashboard/responsavel', [DashboardController::class, 'responsavel'])->middleware('perfil:responsavel,admin');

    // Professores
    Route::get('/professores',                    [ProfessorController::class, 'index'])->middleware('perfil:admin,secretaria,coordenacao');
    Route::get('/professores/verificar',          [ProfessorController::class, 'verificarDuplicidade'])->middleware('perfil:admin,secretaria');
    Route::get('/professores/minhas-permissoes',  [ProfessorController::class, 'minhasPermissoes'])->middleware('perfil:professor');
    Route::get('/professores/meu-portal',         [ProfessorController::class, 'meuPortal'])->middleware('perfil:professor,admin');
    Route::get('/professores/{id}',               [ProfessorController::class, 'show'])->middleware('perfil:admin,secretaria,coordenacao');
    Route::post('/professores',                   [ProfessorController::class, 'store'])->middleware('perfil:admin,secretaria');
    Route::put('/professores/{id}',               [ProfessorController::class, 'update'])->middleware('perfil:admin,secretaria');
    Route::patch('/professores/{id}/toggle',      [ProfessorController::class, 'toggleAtivo'])->middleware('perfil:admin,secretaria');
    Route::patch('/professores/{id}/credenciais', [ProfessorController::class, 'reenviarCredenciais'])->middleware('perfil:admin,secretaria');

    // Alunos
    Route::get('/alunos',                [AlunoController::class, 'index']);
    Route::get('/alunos/{id}',           [AlunoController::class, 'show']);
    Route::get('/alunos/{id}/boletim',   [AlunoController::class, 'boletim']);
    Route::get('/alunos/{id}/boletim/pdf', [AlunoController::class, 'boletimPdf']);
    Route::get('/alunos/{id}/frequencia',[AlunoController::class, 'frequencia']);
    Route::post('/alunos',               [AlunoController::class, 'store'])->middleware('perfil:admin,secretaria');
    Route::put('/alunos/{id}',           [AlunoController::class, 'update'])->middleware('perfil:admin,secretaria');
    Route::delete('/alunos/{id}',        [AlunoController::class, 'destroy'])->middleware('perfil:admin,secretaria');
    Route::post('/alunos/{id}/acesso',       [AlunoController::class, 'gerarAcesso'])->middleware('perfil:admin,secretaria');
    Route::patch('/alunos/{id}/credenciais', [AlunoController::class, 'redefinirSenha'])->middleware('perfil:admin,secretaria');

    // Portal do Aluno (autenticado como aluno)
    Route::get('/aluno/boletim',                    [AlunoController::class,  'meuBoletim'])->middleware('perfil:aluno');
    Route::get('/aluno/boletim/pdf',                [AlunoController::class,  'meuBoletimPdf'])->middleware('perfil:aluno');
    Route::get('/aluno/tarefas',                    [TarefaController::class, 'minhasTarefas'])->middleware('perfil:aluno');
    Route::post('/aluno/tarefas/{id}/entregar',     [TarefaController::class, 'entregar'])->middleware('perfil:aluno');

    // Tarefas (professor/admin)
    Route::get('/tarefas',                          [TarefaController::class, 'index'])->middleware('perfil:admin,professor,secretaria,coordenacao');
    Route::post('/tarefas',                         [TarefaController::class, 'store'])->middleware('perfil:admin,professor');
    Route::get('/tarefas/{id}',                     [TarefaController::class, 'show'])->middleware('perfil:admin,professor,secretaria,coordenacao');

    // Turmas
    Route::get('/turmas',             [TurmaController::class, 'index']);
    Route::get('/turmas/{id}',        [TurmaController::class, 'show']);
    Route::get('/turmas/{id}/alunos', [TurmaController::class, 'alunos']);
    Route::get('/cursos-disponiveis', [GestaoController::class, 'cursos'])->middleware('perfil:admin,secretaria,coordenacao');
    Route::get('/anos-letivos',       [GestaoController::class, 'anosLetivos'])->middleware('perfil:admin,secretaria,coordenacao');
    Route::get('/salas',              [GestaoController::class, 'salas'])->middleware('perfil:admin,secretaria,coordenacao');
    Route::get('/disciplinas',        [GestaoController::class, 'disciplinas'])->middleware('perfil:admin,secretaria,coordenacao,professor');
    Route::get('/professores-turma',  [TurmaController::class, 'professores'])->middleware('perfil:admin,secretaria,coordenacao');
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
    Route::get('/financeiro/planos-disponiveis', [FinanceiroController::class, 'planosDisponiveis'])
        ->middleware('perfil:admin,secretaria,coordenacao');

    Route::prefix('financeiro')->middleware('perfil:admin,secretaria')->group(function () {
        Route::get('/mensalidades',        [FinanceiroController::class, 'mensalidades']);
        Route::get('/mensalidades/{id}/historico', [FinanceiroController::class, 'historicoConta']);
        Route::get('/inadimplentes',       [FinanceiroController::class, 'inadimplentes']);
        Route::post('/recebimento',        [FinanceiroController::class, 'registrarRecebimento']);
        Route::post('/recebimentos/{id}/estornar', [FinanceiroController::class, 'estornarRecebimento']);
        Route::get('/recebimentos/{id}/comprovante', [FinanceiroController::class, 'comprovanteRecebimento']);
        Route::post('/gerar-mensalidades', [FinanceiroController::class, 'gerarMensalidades']);
        Route::get('/resumo',              [FinanceiroController::class, 'resumoFinanceiro']);
    });

    // Comunicação
    Route::get('/comunicados',           [ComunicacaoController::class, 'comunicados']);
    Route::post('/comunicados',          [ComunicacaoController::class, 'criarComunicado'])->middleware('perfil:admin');
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
        \App\Models\User::where('ativo', true)
            ->select('id', 'nome', 'email', 'foto')
            ->orderBy('nome')
            ->get()
            ->map(fn($u) => [
                'id' => $u->id,
                'nome' => $u->nome,
                'email' => $u->email,
                'foto' => $u->foto,
                'foto_url' => $u->foto ? url(\Illuminate\Support\Facades\Storage::disk('public')->url($u->foto)) : null,
            ])
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
