<?php

namespace App\Http\Controllers;

use App\Models\{AnoLetivo, Nota, Matricula, MediaPeriodo, Auditoria, Turma, PeriodoAvaliacao};
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

        $turmas = Turma::query()
            ->select('id', 'nome', 'sala', 'ano_letivo_id')
            ->where('ativa', true)
            ->orderBy('nome')
            ->get();

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
        if (!Schema::hasTable('curso_disciplina')) {
            return response()->json([
                'message' => 'Estrutura de vinculo curso-disciplina nao encontrada.',
                'hint' => 'Execute o script banco-de-dados/008_create_curso_disciplina_table.sql.',
            ], 422);
        }

        $cursoIdTurma = $this->cursoIdDaTurma($turma);
        $disciplinasVinculadas = $turma->disciplinas
            ->filter(fn($d) => $cursoIdTurma ? $this->disciplinaPertenceAoCurso((int) $d->id, (int) $cursoIdTurma) : false)
            ->values();

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

        if (!Schema::hasTable('curso_disciplina')) {
            return response()->json([
                'message' => 'Estrutura de vinculo curso-disciplina nao encontrada.',
                'hint' => 'Execute o script banco-de-dados/008_create_curso_disciplina_table.sql.',
            ], 422);
        }


        $cursoId = $this->cursoIdDaTurma($turma);
        if (!$cursoId || !$this->disciplinaPertenceAoCurso((int) $data['disciplina_id'], (int) $cursoId)) {
            throw ValidationException::withMessages([
                'disciplina_id' => ['A disciplina selecionada nao esta vinculada ao curso da turma.'],
            ]);
        }

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
