<?php

namespace App\Http\Controllers;

use App\Models\Turma;
use App\Models\{Horario, Professor, Serie};
use Illuminate\Http\{Request, JsonResponse};
use Illuminate\Support\Facades\{DB, Schema};

class TurmaController extends Controller
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

    private function resolverSerieIdPorCurso(int $cursoId): int
    {
        $serieId = Serie::where('nivel_id', $cursoId)->orderBy('ordem')->value('id');
        if ($serieId) return (int) $serieId;

        $ordem = (Serie::where('nivel_id', $cursoId)->max('ordem') ?? 0) + 1;
        $serie = Serie::create([
            'nivel_id' => $cursoId,
            'nome' => 'Base',
            'ordem' => $ordem,
        ]);

        return (int) $serie->id;
    }

    private function validarConflitoHorario(
        int $turmaId,
        int $diaSemana,
        string $inicio,
        string $fim,
        ?int $ignorarHorarioId = null
    ): ?string {
        if ($inicio >= $fim) {
            return 'O horário de início deve ser anterior ao horário de fim.';
        }

        $existeConflito = Horario::where('turma_id', $turmaId)
            ->where('dia_semana', $diaSemana)
            ->when($ignorarHorarioId, fn($q) => $q->where('id', '!=', $ignorarHorarioId))
            ->where('horario_inicio', '<', $fim)
            ->where('horario_fim', '>', $inicio)
            ->exists();

        if ($existeConflito) {
            return 'Já existe horário cadastrado nesse intervalo para a turma.';
        }

        return null;
    }

    public function index(Request $request): JsonResponse
    {
        $query = Turma::with(['serie.nivel', 'anoLetivo'])
            ->withCount(['matriculas' => fn($q) => $q->where('situacao', 'ativa')])
            ->when($request->ano_letivo_id, fn($q) => $q->where('ano_letivo_id', $request->ano_letivo_id))
            ->when($request->curso_id, fn($q) => $q->whereHas('serie', fn($s) => $s->where('nivel_id', $request->curso_id)))
            ->when($request->turno, fn($q) => $q->where('turno', $request->turno))
            ->when(!$request->boolean('incluir_inativas'), fn($q) => $q->where('ativa', true));

        return response()->json($query->orderBy('nome')->get());
    }

    public function show(int $id): JsonResponse
    {
        $turma = Turma::with([
            'serie.nivel', 'anoLetivo',
            'disciplinas', 'horarios.professor.usuario', 'horarios.disciplina',
            'matriculas' => fn($q) => $q->where('situacao','ativa'),
            'matriculas.aluno',
        ])->findOrFail($id);

        return response()->json($turma);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'curso_id'     => ['required', 'exists:niveis_ensino,id'],
            'ano_letivo_id'=> ['required', 'exists:anos_letivos,id'],
            'nome'         => ['required', 'string', 'max:10'],
            'turno'        => ['required', 'in:manha,tarde,noite,integral'],
            'vagas'        => ['required', 'integer', 'min:1', 'max:60'],
            'sala'         => ['required', 'string', 'exists:salas,nome'],
        ]);

        $payload = $data;
        $payload['serie_id'] = $this->resolverSerieIdPorCurso((int) $data['curso_id']);
        unset($payload['curso_id']);

        $turma = Turma::create($payload);
        return response()->json($turma->load('serie.nivel'), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $turma = Turma::findOrFail($id);
        $data = $request->validate([
            'curso_id' => ['sometimes', 'exists:niveis_ensino,id'],
            'ano_letivo_id' => ['sometimes', 'exists:anos_letivos,id'],
            'nome'  => ['sometimes', 'string', 'max:10'],
            'turno' => ['sometimes', 'in:manha,tarde,noite,integral'],
            'vagas' => ['sometimes', 'integer', 'min:1'],
            'sala'  => ['sometimes', 'required', 'string', 'exists:salas,nome'],
            'ativa' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('curso_id', $data)) {
            $data['serie_id'] = $this->resolverSerieIdPorCurso((int) $data['curso_id']);
            unset($data['curso_id']);
        }

        $turma->update($data);
        return response()->json($turma->fresh()->load('serie.nivel'));
    }

    public function alunos(int $id): JsonResponse
    {
        $turma = Turma::findOrFail($id);
        $matriculas = $turma->matriculas()
            ->where('situacao', 'ativa')
            ->with('aluno')
            ->get()
            ->map(fn($m) => ['matricula_id' => $m->id, 'numero' => $m->numero_matricula, 'aluno' => $m->aluno]);

        return response()->json($matriculas);
    }

    public function professores(): JsonResponse
    {
        $professores = Professor::with('usuario:id,nome')
            ->where('ativo', true)
            ->orderBy('id')
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'nome' => $p->usuario?->nome ?? "Professor {$p->id}",
            ]);

        return response()->json($professores->values());
    }

    public function storeDisciplina(Request $request, int $id): JsonResponse
    {
        $turma = Turma::findOrFail($id);
        $data = $request->validate([
            'disciplina_id' => ['required', 'exists:disciplinas,id'],
            'aulas_semanais' => ['nullable', 'integer', 'min:1', 'max:20'],
        ]);

        if (!Schema::hasTable('curso_disciplina')) {
            return response()->json([
                'message' => 'Estrutura de vinculo curso-disciplina nao encontrada.',
                'hint' => 'Execute o script banco-de-dados/008_create_curso_disciplina_table.sql.',
            ], 422);
        }

        $cursoId = $this->cursoIdDaTurma($turma);
        if (!$cursoId || !$this->disciplinaPertenceAoCurso((int) $data['disciplina_id'], (int) $cursoId)) {
            return response()->json([
                'message' => 'A disciplina selecionada nao esta vinculada ao curso desta turma.',
                'hint' => 'Vincule a disciplina ao curso em Gestao Geral > Disciplinas.',
            ], 422);
        }

        $turma->disciplinas()->syncWithoutDetaching([
            $data['disciplina_id'] => ['aulas_semanais' => $data['aulas_semanais'] ?? 2],
        ]);

        $disciplina = $turma->disciplinas()->where('disciplinas.id', $data['disciplina_id'])->first();
        return response()->json($disciplina, 201);
    }

    public function updateDisciplina(Request $request, int $id, int $disciplinaId): JsonResponse
    {
        $turma = Turma::findOrFail($id);
        if (!$turma->disciplinas()->where('disciplinas.id', $disciplinaId)->exists()) {
            return response()->json(['message' => 'Disciplina não vinculada à turma.'], 404);
        }

        $data = $request->validate([
            'aulas_semanais' => ['required', 'integer', 'min:1', 'max:20'],
        ]);

        $turma->disciplinas()->updateExistingPivot($disciplinaId, ['aulas_semanais' => $data['aulas_semanais']]);
        $disciplina = $turma->disciplinas()->where('disciplinas.id', $disciplinaId)->first();
        return response()->json($disciplina);
    }

    public function destroyDisciplina(int $id, int $disciplinaId): JsonResponse
    {
        $turma = Turma::findOrFail($id);
        if (!$turma->disciplinas()->where('disciplinas.id', $disciplinaId)->exists()) {
            return response()->json(['message' => 'Disciplina não vinculada à turma.'], 404);
        }

        DB::transaction(function () use ($turma, $disciplinaId) {
            $turma->horarios()->where('disciplina_id', $disciplinaId)->delete();
            $turma->disciplinas()->detach($disciplinaId);
        });

        return response()->json(null, 204);
    }

    public function storeHorario(Request $request, int $id): JsonResponse
    {
        $turma = Turma::findOrFail($id);
        $data = $request->validate([
            'disciplina_id' => ['required', 'exists:disciplinas,id'],
            'professor_id' => ['required', 'exists:professores,id'],
            'dia_semana' => ['required', 'integer', 'min:0', 'max:6'],
            'horario_inicio' => ['required', 'date_format:H:i'],
            'horario_fim' => ['required', 'date_format:H:i'],
        ]);

        if (!$turma->disciplinas()->where('disciplinas.id', $data['disciplina_id'])->exists()) {
            return response()->json(['message' => 'A disciplina precisa estar na grade da turma.'], 422);
        }

        $erroConflito = $this->validarConflitoHorario(
            $turma->id,
            (int) $data['dia_semana'],
            $data['horario_inicio'],
            $data['horario_fim']
        );
        if ($erroConflito) {
            return response()->json(['message' => $erroConflito], 422);
        }

        $horario = $turma->horarios()->create($data);
        return response()->json($horario->load(['disciplina', 'professor.usuario']), 201);
    }

    public function updateHorario(Request $request, int $id, int $horarioId): JsonResponse
    {
        $turma = Turma::findOrFail($id);
        $horario = $turma->horarios()->where('id', $horarioId)->firstOrFail();
        $data = $request->validate([
            'disciplina_id' => ['sometimes', 'exists:disciplinas,id'],
            'professor_id' => ['sometimes', 'exists:professores,id'],
            'dia_semana' => ['sometimes', 'integer', 'min:0', 'max:6'],
            'horario_inicio' => ['sometimes', 'date_format:H:i'],
            'horario_fim' => ['sometimes', 'date_format:H:i'],
        ]);

        $disciplinaId = (int) ($data['disciplina_id'] ?? $horario->disciplina_id);
        if (!$turma->disciplinas()->where('disciplinas.id', $disciplinaId)->exists()) {
            return response()->json(['message' => 'A disciplina precisa estar na grade da turma.'], 422);
        }

        $diaSemana = (int) ($data['dia_semana'] ?? $horario->dia_semana);
        $inicio = $data['horario_inicio'] ?? $horario->horario_inicio;
        $fim = $data['horario_fim'] ?? $horario->horario_fim;
        $erroConflito = $this->validarConflitoHorario($turma->id, $diaSemana, $inicio, $fim, $horario->id);
        if ($erroConflito) {
            return response()->json(['message' => $erroConflito], 422);
        }

        $horario->fill($data);
        $horario->save();
        return response()->json($horario->fresh()->load(['disciplina', 'professor.usuario']));
    }

    public function destroyHorario(int $id, int $horarioId): JsonResponse
    {
        $turma = Turma::findOrFail($id);
        $horario = $turma->horarios()->where('id', $horarioId)->firstOrFail();
        $horario->delete();
        return response()->json(null, 204);
    }

    public function encerrar(int $id): JsonResponse
    {
        $turma = Turma::findOrFail($id);

        if ($turma->ativa === false) {
            return response()->json(['message' => 'Esta turma ja esta encerrada.']);
        }

        $turma->update(['ativa' => false]);

        return response()->json([
            'message' => 'Turma encerrada com sucesso.',
            'turma' => $turma->fresh()->load('serie.nivel'),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $turma = Turma::findOrFail($id);

        $matriculasCount = DB::table('matriculas')->where('turma_id', $turma->id)->count();
        $aulasCount = DB::table('aulas')->where('turma_id', $turma->id)->count();
        $horariosCount = DB::table('horarios')->where('turma_id', $turma->id)->count();
        $ptdCount = DB::table('professor_turma_disciplina')->where('turma_id', $turma->id)->count();

        $dependencias = array_values(array_filter([
            ['type' => 'matriculas', 'count' => $matriculasCount],
            ['type' => 'aulas', 'count' => $aulasCount],
            ['type' => 'horarios', 'count' => $horariosCount],
            ['type' => 'vinculos_professor_disciplina', 'count' => $ptdCount],
        ], fn($d) => $d['count'] > 0));

        if (!empty($dependencias)) {
            return response()->json([
                'message' => "Nao e possivel excluir a turma \"{$turma->nome}\" porque ela possui vinculos ativos.",
                'hint' => 'Encerre a turma para preservar historico, ou remova os vinculos antes de excluir.',
                'dependencies' => $dependencias,
            ], 422);
        }

        $turma->delete();
        return response()->json(['message' => 'Turma excluida com sucesso.']);
    }
}
