<?php

namespace App\Http\Controllers;

use App\Models\{Matricula, Aluno, Turma, AnoLetivo, Auditoria};
use Illuminate\Http\{Request, JsonResponse};
use Illuminate\Support\Facades\DB;

class MatriculaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Matricula::with(['aluno', 'turma.serie.nivel', 'anoLetivo'])
            ->when($request->turma_id, fn($q) => $q->where('turma_id', $request->turma_id))
            ->when($request->situacao,  fn($q) => $q->where('situacao', $request->situacao))
            ->when($request->ano_letivo_id, fn($q) => $q->where('ano_letivo_id', $request->ano_letivo_id));

        return response()->json($query->orderBy('id', 'desc')->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'aluno_id'     => ['required', 'exists:alunos,id'],
            'turma_id'     => ['required', 'exists:turmas,id'],
            'ano_letivo_id'=> ['required', 'exists:anos_letivos,id'],
            'data_matricula'=> ['required', 'date'],
            'observacoes'  => ['nullable', 'string'],
        ]);

        // Verificar duplicidade na mesma turma/ano
        $existe = Matricula::where('aluno_id', $data['aluno_id'])
            ->where('turma_id', $data['turma_id'])
            ->where('ano_letivo_id', $data['ano_letivo_id'])
            ->whereIn('situacao', ['ativa', 'trancada'])
            ->exists();

        if ($existe) {
            return response()->json(['message' => 'Aluno ja possui matricula ativa/trancada nesta turma para o ano letivo informado.'], 422);
        }

        // Verificar vagas
        $turma = Turma::findOrFail($data['turma_id']);
        if ($turma->vagas_disponiveis <= 0) {
            return response()->json(['message' => 'Turma sem vagas disponíveis.'], 422);
        }

        AnoLetivo::findOrFail($data['ano_letivo_id']);
        $data['numero_matricula'] = Matricula::gerarNumero((int) $data['ano_letivo_id'], (int) $data['turma_id']);
        $data['criado_por'] = auth()->id();

        $matricula = Matricula::create($data);

        Auditoria::registrar('matricular', 'matriculas', $matricula->id, null, $matricula->toArray());

        return response()->json($matricula->load(['aluno', 'turma', 'anoLetivo']), 201);
    }

    public function storeLote(Request $request): JsonResponse
    {
        $data = $request->validate([
            'aluno_id'      => ['required', 'exists:alunos,id'],
            'turma_ids'     => ['required', 'array', 'min:1'],
            'turma_ids.*'   => ['required', 'integer', 'exists:turmas,id', 'distinct'],
            'ano_letivo_id' => ['required', 'exists:anos_letivos,id'],
            'data_matricula'=> ['required', 'date'],
            'observacoes'   => ['nullable', 'string'],
        ]);

        Aluno::findOrFail((int) $data['aluno_id']);
        AnoLetivo::findOrFail((int) $data['ano_letivo_id']);

        $criados = [];
        $erros = [];

        DB::transaction(function () use ($data, &$criados, &$erros) {
            foreach ($data['turma_ids'] as $turmaId) {
                $turmaId = (int) $turmaId;

                $existe = Matricula::where('aluno_id', $data['aluno_id'])
                    ->where('turma_id', $turmaId)
                    ->where('ano_letivo_id', $data['ano_letivo_id'])
                    ->whereIn('situacao', ['ativa', 'trancada'])
                    ->exists();

                if ($existe) {
                    $erros[] = [
                        'turma_id' => $turmaId,
                        'message' => 'Ja existe matricula ativa/trancada para esta turma no ano letivo informado.',
                    ];
                    continue;
                }

                $turma = Turma::findOrFail($turmaId);
                if ($turma->vagas_disponiveis <= 0) {
                    $erros[] = [
                        'turma_id' => $turmaId,
                        'message' => 'Turma sem vagas disponiveis.',
                    ];
                    continue;
                }

                $nova = Matricula::create([
                    'aluno_id' => $data['aluno_id'],
                    'turma_id' => $turmaId,
                    'ano_letivo_id' => $data['ano_letivo_id'],
                    'numero_matricula' => Matricula::gerarNumero((int) $data['ano_letivo_id'], $turmaId),
                    'data_matricula' => $data['data_matricula'],
                    'situacao' => 'ativa',
                    'observacoes' => $data['observacoes'] ?? null,
                    'criado_por' => auth()->id(),
                ]);

                Auditoria::registrar('matricular_lote', 'matriculas', $nova->id, null, $nova->toArray());
                $criados[] = $nova->id;
            }
        });

        $matriculas = Matricula::with(['aluno', 'turma', 'anoLetivo'])
            ->whereIn('id', $criados)
            ->get();

        return response()->json([
            'message' => count($criados) > 0
                ? 'Matriculas processadas com sucesso.'
                : 'Nenhuma matricula foi criada.',
            'criados' => count($criados),
            'erros' => $erros,
            'matriculas' => $matriculas,
        ], count($criados) > 0 ? 201 : 422);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $matricula = Matricula::findOrFail($id);
        $antes = $matricula->toArray();

        $data = $request->validate([
            'situacao'    => ['sometimes', 'in:ativa,trancada,transferida,concluida,cancelada'],
            'turma_id'    => ['sometimes', 'exists:turmas,id'],
            'observacoes' => ['nullable', 'string'],
        ]);

        $matricula->update($data);

        Auditoria::registrar('editar_matricula', 'matriculas', $id, $antes, $matricula->fresh()->toArray());

        return response()->json($matricula->fresh()->load(['aluno', 'turma']));
    }
}
