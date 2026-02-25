<?php

namespace App\Http\Controllers;

use App\Models\Aluno;
use App\Models\Tarefa;
use App\Models\TarefaEntrega;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class TarefaController extends Controller
{
    // ── Professor: listar suas tarefas ───────────────────────
    public function index(Request $request): JsonResponse
    {
        $usuario   = $request->user();
        $professor = $usuario->professor;

        $query = Tarefa::with(['disciplina', 'turma'])
            ->withCount('entregas');

        // Professor só vê as próprias; admin/coordenacao/secretaria vê todas
        if ($professor) {
            $query->where('professor_id', $professor->id);
        }

        if ($request->filled('turma_id')) {
            $query->where('turma_id', $request->turma_id);
        }

        $tarefas = $query->orderByDesc('criado_em')->get();

        return response()->json($tarefas->map(fn($t) => $this->formatTarefa($t)));
    }

    // ── Professor: criar tarefa ───────────────────────────────
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'titulo'        => 'required|string|max:200',
            'descricao'     => 'nullable|string',
            'disciplina_id' => 'nullable|integer|exists:disciplinas,id',
            'turma_id'      => 'required|integer|exists:turmas,id',
            'professor_id'  => 'nullable|integer|exists:professores,id',
            'data_entrega'  => 'required|date',
            'arquivo'       => 'nullable|file|mimes:pdf,doc,docx,png,jpg,jpeg|max:10240',
        ]);

        $arquivoPath = null;
        if ($request->hasFile('arquivo')) {
            $arquivoPath = $request->file('arquivo')->store('tarefas', 'public');
        }

        $usuario = $request->user();
        $professorId = $request->integer('professor_id');

        // Fluxo padrão: professor logado cria com o próprio vínculo.
        // Fluxo admin: pode informar professor_id explicitamente.
        if (!$professorId) {
            $professorId = $usuario?->professor?->id;
        }

        if (!$professorId) {
            return response()->json([
                'message' => 'Usuário logado não possui vínculo de professor. Informe professor_id ou faça login como professor.'
            ], 422);
        }

        $tarefa = Tarefa::create([
            'titulo'        => $request->titulo,
            'descricao'     => $request->descricao,
            'disciplina_id' => $request->disciplina_id,
            'turma_id'      => $request->turma_id,
            'professor_id'  => $professorId,
            'data_entrega'  => $request->data_entrega,
            'arquivo_path'  => $arquivoPath,
        ]);

        return response()->json($this->formatTarefa($tarefa->load(['disciplina', 'turma'])), 201);
    }

    // ── Ver detalhes de uma tarefa ────────────────────────────
    public function show(int $id): JsonResponse
    {
        $tarefa = Tarefa::with(['disciplina', 'turma', 'professor.usuario', 'entregas.aluno.usuario'])
            ->findOrFail($id);

        return response()->json($this->formatTarefa($tarefa));
    }

    // ── Aluno: listar suas tarefas ────────────────────────────
    public function minhasTarefas(Request $request): JsonResponse
    {
        $usuario = $request->user();
        $aluno   = Aluno::where('usuario_id', $usuario->id)->firstOrFail();

        // Pega a turma da matrícula ativa
        $matricula = $aluno->matriculaAtiva;

        if (!$matricula) {
            return response()->json([]);
        }

        $filtro = $request->get('filtro', 'todas');
        $hoje   = now()->toDateString();

        $query = Tarefa::with(['disciplina', 'professor.usuario'])
            ->where('turma_id', $matricula->turma_id);

        if ($filtro === 'pendentes') {
            $query->where('data_entrega', '>=', $hoje);
        } elseif ($filtro === 'encerradas') {
            $query->where('data_entrega', '<', $hoje);
        }

        $tarefas = $query->orderBy('data_entrega')->get();

        return response()->json($tarefas->map(function ($tarefa) use ($aluno) {
            $entrega = TarefaEntrega::where('tarefa_id', $tarefa->id)
                ->where('aluno_id', $aluno->id)
                ->first();

            $data = $this->formatTarefa($tarefa);
            $data['entrega'] = $entrega ? [
                'id'           => $entrega->id,
                'entregue'     => $entrega->entregue,
                'observacao'   => $entrega->observacao,
                'entregue_em'  => $entrega->entregue_em,
                'arquivo_url'  => $this->arquivoUrl($entrega->arquivo_path),
            ] : null;

            return $data;
        }));
    }

    // ── Aluno: entregar tarefa ────────────────────────────────
    public function entregar(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'observacao' => 'nullable|string',
            'arquivo'    => 'nullable|file|mimes:pdf,doc,docx,png,jpg,jpeg|max:10240',
        ]);

        $usuario = $request->user();
        $aluno   = Aluno::where('usuario_id', $usuario->id)->firstOrFail();

        $tarefa = Tarefa::findOrFail($id);

        $arquivoPath = null;
        if ($request->hasFile('arquivo')) {
            $arquivoPath = $request->file('arquivo')->store("tarefas/entregas/{$aluno->id}", 'public');
        }

        $entrega = TarefaEntrega::updateOrCreate(
            ['tarefa_id' => $tarefa->id, 'aluno_id' => $aluno->id],
            [
                'entregue'    => true,
                'observacao'  => $request->observacao,
                'entregue_em' => now(),
                'arquivo_path'=> $arquivoPath ?? TarefaEntrega::where('tarefa_id', $tarefa->id)
                    ->where('aluno_id', $aluno->id)->value('arquivo_path'),
            ]
        );

        return response()->json([
            'message'    => 'Tarefa entregue com sucesso.',
            'entregue'   => true,
            'entregue_em'=> $entrega->entregue_em,
            'arquivo_url'=> $this->arquivoUrl($entrega->arquivo_path),
        ]);
    }

    // ── Helper: formata tarefa com URL do arquivo ─────────────
    private function formatTarefa(Tarefa $tarefa): array
    {
        $data = [
            'id'            => $tarefa->id,
            'titulo'        => $tarefa->titulo,
            'descricao'     => $tarefa->descricao,
            'disciplina'    => $tarefa->disciplina ? ['id' => $tarefa->disciplina->id, 'nome' => $tarefa->disciplina->nome] : null,
            'turma'         => $tarefa->turma ? ['id' => $tarefa->turma->id, 'nome' => $tarefa->turma->nome] : null,
            'professor'     => $tarefa->professor?->usuario ? ['nome' => $tarefa->professor->usuario->nome] : null,
            'data_entrega'  => $tarefa->data_entrega?->toDateString(),
            'arquivo_url'   => $this->arquivoUrl($tarefa->arquivo_path),
            'entregas_count'=> $tarefa->entregas_count ?? null,
            'criado_em'     => $tarefa->criado_em,
        ];

        if ($tarefa->relationLoaded('entregas')) {
            $data['entregas'] = $tarefa->entregas->map(function (TarefaEntrega $entrega) {
                $nomeAluno = $entrega->aluno?->nome ?: $entrega->aluno?->usuario?->nome;

                return [
                    'id'          => $entrega->id,
                    'aluno_id'    => $entrega->aluno_id,
                    'entregue'    => $entrega->entregue,
                    'observacao'  => $entrega->observacao,
                    'entregue_em' => $entrega->entregue_em,
                    'arquivo_url' => $this->arquivoUrl($entrega->arquivo_path),
                    'aluno'       => [
                        'id'   => $entrega->aluno?->id,
                        'nome' => $nomeAluno,
                    ],
                ];
            })->values();
        }

        return $data;
    }

    private function arquivoUrl(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        $relativeUrl = Storage::disk('public')->url($path);
        return url($relativeUrl);
    }
}
