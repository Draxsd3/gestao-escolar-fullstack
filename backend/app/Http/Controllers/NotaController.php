<?php

namespace App\Http\Controllers;

use App\Models\{AnoLetivo, Nota, Matricula, MediaPeriodo, Auditoria, Turma, PeriodoAvaliacao, Disciplina};
use Illuminate\Http\{Request, JsonResponse};
use Illuminate\Support\Facades\{DB, Schema};
use Illuminate\Validation\ValidationException;

class NotaController extends Controller
{
    private function cursoIdDaTurma(Turma $turma): ?int
    {
        return $turma->serie()->value('nivel_id');
    }

    private function disciplinaPertenceAoCurso(int $disciplinaId, int $cursoId): bool
    {
        return DB::table('curso_disciplina')
            ->where('disciplina_id', $disciplinaId)
            ->where('curso_id', $cursoId)
            ->exists();
    }

    public function contexto(Request $request): JsonResponse
    {
        $request->validate([
            'turma_id' => ['nullable', 'exists:turmas,id'],
        ]);

        $usuario = $request->user()->loadMissing('perfil', 'professor');
        $isProfessor = $usuario?->perfil?->nome === 'professor';
        $professorId = $usuario?->professor?->id;
        $usaVinculoProfessorDisciplina = Schema::hasTable('professor_disciplina');

        $turmasQuery = Turma::query()
            ->select('id', 'nome', 'sala', 'ano_letivo_id')
            ->where('ativa', true)
            ->orderBy('nome');

        if ($isProfessor && $professorId) {
            $turmasQuery->where(function ($q) use ($professorId, $usaVinculoProfessorDisciplina) {
                $q->whereExists(function ($sq) use ($professorId) {
                    $sq->select(DB::raw(1))
                        ->from('professor_turma_disciplina as ptd')
                        ->whereColumn('ptd.turma_id', 'turmas.id')
                        ->where('ptd.professor_id', $professorId);
                })->orWhereExists(function ($sq) use ($professorId) {
                    $sq->select(DB::raw(1))
                        ->from('horarios as h')
                        ->whereColumn('h.turma_id', 'turmas.id')
                        ->where('h.professor_id', $professorId);
                });

                if ($usaVinculoProfessorDisciplina) {
                    $q->orWhereExists(function ($sq) use ($professorId) {
                        $sq->select(DB::raw(1))
                            ->from('grade_curricular as gc')
                            ->join('professor_disciplina as pd', 'pd.disciplina_id', '=', 'gc.disciplina_id')
                            ->whereColumn('gc.turma_id', 'turmas.id')
                            ->where('pd.professor_id', $professorId);
                    });
                }
            });
        }

        $turmas = $turmasQuery->get();

        if (!$request->filled('turma_id')) {
            // Retornar info do ano/período ativo
            $anoAtivo = AnoLetivo::ativo();
            $periodoAtivo = $anoAtivo?->periodoAtivo();

            return response()->json([
                'turmas' => $turmas,
                'turma' => null,
                'disciplinas' => [],
                'periodos' => [],
                'ano_letivo' => $anoAtivo ? [
                    'id' => $anoAtivo->id,
                    'ano' => $anoAtivo->ano,
                    'modelo_periodo' => $anoAtivo->modelo_periodo,
                ] : null,
                'periodo_ativo' => $periodoAtivo ? [
                    'id' => $periodoAtivo->id,
                    'nome' => $periodoAtivo->nome,
                ] : null,
            ]);
        }

        $turma = Turma::query()
            ->with(['disciplinas' => fn($q) => $q->orderBy('nome')])
            ->select('id', 'nome', 'sala', 'ano_letivo_id')
            ->findOrFail($request->integer('turma_id'));

        if ($isProfessor && $professorId) {
            $temAcesso = DB::table('professor_turma_disciplina')
                ->where('professor_id', $professorId)
                ->where('turma_id', $turma->id)
                ->exists();

            if (!$temAcesso) {
                $temAcesso = DB::table('horarios')
                    ->where('professor_id', $professorId)
                    ->where('turma_id', $turma->id)
                    ->exists();
            }

            if (!$temAcesso && $usaVinculoProfessorDisciplina) {
                $temAcesso = DB::table('grade_curricular as gc')
                    ->join('professor_disciplina as pd', 'pd.disciplina_id', '=', 'gc.disciplina_id')
                    ->where('gc.turma_id', $turma->id)
                    ->where('pd.professor_id', $professorId)
                    ->exists();
            }

            if (!$temAcesso) {
                return response()->json([
                    'message' => 'Voce nao possui vinculo com essa turma.',
                ], 403);
            }
        }

        $periodos = PeriodoAvaliacao::query()
            ->where('ano_letivo_id', $turma->ano_letivo_id)
            ->orderBy('ordem')
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'nome' => $p->nome,
                'ordem' => $p->ordem,
                'tipo' => $this->resolverTipoPeriodo($p->nome),
                'peso' => $p->peso,
                'data_inicio' => $p->data_inicio?->format('Y-m-d'),
                'data_fim' => $p->data_fim?->format('Y-m-d'),
                'encerrado' => $p->encerrado,
                'encerrado_em' => $p->encerrado_em?->format('Y-m-d H:i:s'),
            ])
            ->values();

        $anoLetivo = AnoLetivo::find($turma->ano_letivo_id);
        $periodoAtivo = $anoLetivo?->periodoAtivo();
        $usaVinculoCurso = Schema::hasTable('curso_disciplina');

        $cursoIdTurma = $this->cursoIdDaTurma($turma);
        $disciplinasVinculadas = $turma->disciplinas->values();
        if ($usaVinculoCurso && $cursoIdTurma) {
            $disciplinasVinculadas = $disciplinasVinculadas
                ->filter(fn($d) => $this->disciplinaPertenceAoCurso((int) $d->id, (int) $cursoIdTurma))
                ->values();
        }

        if ($isProfessor && $professorId) {
            $disciplinasPorVinculo = DB::table('professor_turma_disciplina')
                ->where('professor_id', $professorId)
                ->where('turma_id', $turma->id)
                ->pluck('disciplina_id')
                ->map(fn($id) => (int) $id)
                ->all();

            $disciplinasPorHorario = DB::table('horarios')
                ->where('professor_id', $professorId)
                ->where('turma_id', $turma->id)
                ->pluck('disciplina_id')
                ->map(fn($id) => (int) $id)
                ->all();

            $disciplinasPorCadastro = [];
            if (Schema::hasTable('professor_disciplina')) {
                $disciplinasPorCadastro = DB::table('professor_disciplina')
                    ->where('professor_id', $professorId)
                    ->pluck('disciplina_id')
                    ->map(fn($id) => (int) $id)
                    ->all();
            }

            $idsPermitidos = array_values(array_unique(array_merge(
                $disciplinasPorVinculo,
                $disciplinasPorHorario,
                $disciplinasPorCadastro
            )));

            $idsGradeTurma = $turma->disciplinas->pluck('id')->map(fn($id) => (int) $id)->all();
            $idsParaRetorno = $idsPermitidos;
            if (!empty($idsGradeTurma)) {
                $intersecao = array_values(array_intersect($idsPermitidos, $idsGradeTurma));
                if (!empty($intersecao)) {
                    $idsParaRetorno = $intersecao;
                }
            }

            $disciplinasVinculadas = !empty($idsParaRetorno)
                ? Disciplina::query()->whereIn('id', $idsParaRetorno)->orderBy('nome')->get()
                : collect();
        }

        return response()->json([
            'turmas' => $turmas,
            'turma' => $turma,
            'disciplinas' => $disciplinasVinculadas->map(fn($d) => [
                'id' => $d->id,
                'nome' => $d->nome,
                'codigo' => $d->codigo,
            ])->values(),
            'periodos' => $periodos,
            'ano_letivo' => $anoLetivo ? [
                'id' => $anoLetivo->id,
                'ano' => $anoLetivo->ano,
                'modelo_periodo' => $anoLetivo->modelo_periodo,
            ] : null,
            'periodo_ativo' => $periodoAtivo ? [
                'id' => $periodoAtivo->id,
                'nome' => $periodoAtivo->nome,
            ] : null,
        ]);
    }

    private function resolverTipoPeriodo(string $nome): string
    {
        $normalizado = mb_strtolower($nome, 'UTF-8');
        if (str_contains($normalizado, 'bimestre') || str_contains($normalizado, 'bim')) return 'bimestre';
        if (str_contains($normalizado, 'semestre') || str_contains($normalizado, 'sem')) return 'semestre';
        return 'periodo';
    }

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'turma_id'      => ['required', 'exists:turmas,id'],
            'disciplina_id' => ['required', 'exists:disciplinas,id'],
            'periodo_id'    => ['required', 'exists:periodos_avaliacao,id'],
        ]);

        $notas = Nota::with(['matricula.aluno', 'periodo'])
            ->whereHas('matricula', fn($q) => $q->where('turma_id', $request->turma_id)->where('situacao', 'ativa'))
            ->where('disciplina_id', $request->disciplina_id)
            ->where('periodo_id', $request->periodo_id)
            ->get()
            ->keyBy('matricula_id');

        $matriculas = Matricula::with('aluno')
            ->where('turma_id', $request->turma_id)
            ->where('situacao', 'ativa')
            ->orderBy('id')
            ->get();

        $periodo = PeriodoAvaliacao::find($request->periodo_id);

        $resultado = $matriculas->map(fn($m) => [
            'matricula_id' => $m->id,
            'aluno'        => ['id' => $m->aluno->id, 'nome' => $m->aluno->nome],
            'nota'         => $notas->get($m->id)?->valor,
            'nota_id'      => $notas->get($m->id)?->id,
            'observacoes'  => $notas->get($m->id)?->observacoes,
            'periodo_encerrado' => $periodo?->encerrado ?? false,
        ]);

        return response()->json($resultado);
    }

    public function lancar(Request $request): JsonResponse
    {
        $data = $request->validate([
            'turma_id'              => ['required', 'exists:turmas,id'],
            'notas'                 => ['required', 'array', 'min:1'],
            'notas.*.matricula_id'  => ['required', 'exists:matriculas,id'],
            'notas.*.valor'         => ['required', 'numeric', 'min:0', 'max:10'],
            'notas.*.observacoes'   => ['nullable', 'string'],
            'disciplina_id'         => ['required', 'exists:disciplinas,id'],
            'periodo_id'            => ['required', 'exists:periodos_avaliacao,id'],
        ]);

        // ══ VALIDAÇÃO: Período deve estar aberto ══
        $periodo = PeriodoAvaliacao::findOrFail($data['periodo_id']);
        if ($periodo->encerrado) {
            return response()->json([
                'message' => "O período \"{$periodo->nome}\" está encerrado. Não é possível lançar ou editar notas.",
            ], 422);
        }

        $turma = Turma::query()
            ->with('disciplinas:id')
            ->select('id', 'ano_letivo_id')
            ->findOrFail($data['turma_id']);

        if (!$turma->disciplinas->contains('id', (int) $data['disciplina_id'])) {
            throw ValidationException::withMessages([
                'disciplina_id' => ['A disciplina selecionada não pertence à grade da turma.'],
            ]);
        }

        // O lancamento usa como fonte de verdade a grade da turma.
        // Nao bloqueia por curso_disciplina para evitar erro por cadastro incompleto.

        if ((int) $periodo->ano_letivo_id !== (int) $turma->ano_letivo_id) {
            throw ValidationException::withMessages([
                'periodo_id' => ['O período selecionado não pertence ao ano letivo da turma.'],
            ]);
        }

        // ══ VALIDAÇÃO: Só pode lançar no período ativo ══
        $anoLetivo = AnoLetivo::find($turma->ano_letivo_id);
        $periodoAtivo = $anoLetivo?->periodoAtivo();
        if (!$periodoAtivo || $periodoAtivo->id !== $periodo->id) {
            $nomePeriodoAtivo = $periodoAtivo ? $periodoAtivo->nome : 'nenhum';
            return response()->json([
                'message' => "Lançamentos só são permitidos no período ativo ({$nomePeriodoAtivo}).",
            ], 422);
        }

        $matriculasValidas = Matricula::query()
            ->where('turma_id', $data['turma_id'])
            ->where('situacao', 'ativa')
            ->pluck('id')
            ->map(fn($id) => (int) $id)
            ->all();
        $matriculasSet = array_flip($matriculasValidas);

        DB::transaction(function () use ($data, $matriculasSet) {
            foreach ($data['notas'] as $item) {
                if (!isset($matriculasSet[(int) $item['matricula_id']])) {
                    throw ValidationException::withMessages([
                        'notas' => ['Há matrículas inválidas ou inativas para a turma selecionada.'],
                    ]);
                }

                $antes = Nota::where('matricula_id', $item['matricula_id'])
                    ->where('disciplina_id', $data['disciplina_id'])
                    ->where('periodo_id', $data['periodo_id'])
                    ->first();

                $nota = Nota::updateOrCreate(
                    [
                        'matricula_id'  => $item['matricula_id'],
                        'disciplina_id' => $data['disciplina_id'],
                        'periodo_id'    => $data['periodo_id'],
                    ],
                    [
                        'valor'       => $item['valor'],
                        'observacoes' => $item['observacoes'] ?? null,
                        'lancado_por' => auth()->id(),
                    ]
                );

                Auditoria::registrar(
                    $antes ? 'editar_nota' : 'lancar_nota',
                    'notas',
                    $nota->id,
                    $antes?->toArray(),
                    $nota->toArray()
                );
            }
        });

        return response()->json(['message' => 'Notas lançadas com sucesso.']);
    }

    public function calcularMedias(Request $request): JsonResponse
    {
        $request->validate([
            'turma_id'      => ['required'],
            'disciplina_id' => ['required'],
            'periodo_id'    => ['required'],
        ]);

        $matriculas = Matricula::where('turma_id', $request->turma_id)
            ->where('situacao', 'ativa')
            ->get();

        DB::transaction(function () use ($matriculas, $request) {
            foreach ($matriculas as $matricula) {
                $mediaValor = Nota::where('matricula_id', $matricula->id)
                    ->where('disciplina_id', $request->disciplina_id)
                    ->where('periodo_id', $request->periodo_id)
                    ->avg('valor') ?? 0;

                MediaPeriodo::updateOrCreate(
                    [
                        'matricula_id'  => $matricula->id,
                        'disciplina_id' => $request->disciplina_id,
                        'periodo_id'    => $request->periodo_id,
                    ],
                    [
                        'media'    => round($mediaValor, 2),
                        'situacao' => $mediaValor >= 5 ? 'aprovado' : 'reprovado',
                    ]
                );
            }
        });

        return response()->json(['message' => 'Médias calculadas com sucesso.']);
    }
}
