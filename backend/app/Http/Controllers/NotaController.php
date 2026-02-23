<?php

namespace App\Http\Controllers;

use App\Models\{Nota, Matricula, MediaPeriodo, MediaAnual, Auditoria};
use Illuminate\Http\{Request, JsonResponse};
use Illuminate\Support\Facades\DB;

class NotaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'turma_id'     => ['required', 'exists:turmas,id'],
            'disciplina_id'=> ['required', 'exists:disciplinas,id'],
            'periodo_id'   => ['required', 'exists:periodos_avaliacao,id'],
        ]);

        $notas = Nota::with(['matricula.aluno', 'periodo'])
            ->whereHas('matricula', fn($q) => $q->where('turma_id', $request->turma_id)->where('situacao', 'ativa'))
            ->where('disciplina_id', $request->disciplina_id)
            ->where('periodo_id', $request->periodo_id)
            ->get()
            ->keyBy('matricula_id');

        // Buscar todos alunos da turma
        $matriculas = Matricula::with('aluno')
            ->where('turma_id', $request->turma_id)
            ->where('situacao', 'ativa')
            ->orderBy('id')
            ->get();

        $resultado = $matriculas->map(fn($m) => [
            'matricula_id' => $m->id,
            'aluno'        => ['id' => $m->aluno->id, 'nome' => $m->aluno->nome],
            'nota'         => $notas->get($m->id)?->valor,
            'nota_id'      => $notas->get($m->id)?->id,
            'observacoes'  => $notas->get($m->id)?->observacoes,
        ]);

        return response()->json($resultado);
    }

    public function lancar(Request $request): JsonResponse
    {
        $data = $request->validate([
            'notas'        => ['required', 'array'],
            'notas.*.matricula_id' => ['required', 'exists:matriculas,id'],
            'notas.*.valor'        => ['required', 'numeric', 'min:0', 'max:10'],
            'notas.*.observacoes'  => ['nullable', 'string'],
            'disciplina_id' => ['required', 'exists:disciplinas,id'],
            'periodo_id'    => ['required', 'exists:periodos_avaliacao,id'],
        ]);

        DB::transaction(function () use ($data) {
            foreach ($data['notas'] as $item) {
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
