<?php

namespace App\Http\Controllers;

use App\Models\{Matricula, Aluno, Turma, AnoLetivo, Auditoria};
use Illuminate\Http\{Request, JsonResponse};

class MatriculaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Matricula::with(['aluno', 'turma.serie', 'anoLetivo'])
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

        // Verificar se já existe matrícula ativa para o mesmo ano
        $existe = Matricula::where('aluno_id', $data['aluno_id'])
            ->where('ano_letivo_id', $data['ano_letivo_id'])
            ->whereIn('situacao', ['ativa', 'trancada'])
            ->exists();

        if ($existe) {
            return response()->json(['message' => 'Aluno já possui matrícula neste ano letivo.'], 422);
        }

        // Verificar vagas
        $turma = Turma::findOrFail($data['turma_id']);
        if ($turma->vagas_disponiveis <= 0) {
            return response()->json(['message' => 'Turma sem vagas disponíveis.'], 422);
        }

        $anoLetivo = AnoLetivo::findOrFail($data['ano_letivo_id']);
        $data['numero_matricula'] = Matricula::gerarNumero($anoLetivo->ano, $data['turma_id']);
        $data['criado_por'] = auth()->id();

        $matricula = Matricula::create($data);

        Auditoria::registrar('matricular', 'matriculas', $matricula->id, null, $matricula->toArray());

        return response()->json($matricula->load(['aluno', 'turma', 'anoLetivo']), 201);
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
