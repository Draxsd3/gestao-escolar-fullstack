<?php

namespace App\Http\Controllers;

use App\Models\{Comunicado, Mensagem};
use Illuminate\Http\{Request, JsonResponse};

class ComunicacaoController extends Controller
{
    public function comunicados(Request $request): JsonResponse
    {
        $user = $request->user();
        $perfil = $user->perfil->nome;

        $query = Comunicado::with('autor')
            ->where('publicado', true)
            ->where(fn($q) => $q
                ->where('publico_alvo', 'todos')
                ->orWhere('publico_alvo', $perfil === 'responsavel' ? 'responsaveis' :
                    ($perfil === 'professor' ? 'professores' :
                    ($perfil === 'aluno' ? 'alunos' : 'funcionarios')))
                ->orWhere(fn($q2) => $q2->where('publico_alvo', 'turma')
                    ->whereHas('turma.matriculas', fn($q3) =>
                        $q3->where('aluno_id', $user->aluno?->id)->where('situacao','ativa')
                    )
                )
            )
            ->orderBy('publicado_em', 'desc');

        return response()->json($query->paginate(10));
    }

    public function criarComunicado(Request $request): JsonResponse
    {
        $data = $request->validate([
            'titulo'      => ['required', 'string', 'max:200'],
            'corpo'       => ['required', 'string'],
            'publico_alvo'=> ['required', 'in:todos,alunos,responsaveis,professores,funcionarios,turma'],
            'turma_id'    => ['required_if:publico_alvo,turma', 'exists:turmas,id'],
            'publicado'   => ['boolean'],
            'expira_em'   => ['nullable', 'date'],
        ]);

        $data['autor_id'] = auth()->id();
        if ($data['publicado'] ?? false) {
            $data['publicado_em'] = now();
        }

        $comunicado = Comunicado::create($data);
        return response()->json($comunicado->load('autor'), 201);
    }

    public function mensagens(Request $request): JsonResponse
    {
        $msgs = Mensagem::with('remetente')
            ->where('destinatario_id', auth()->id())
            ->orderBy('criado_em', 'desc')
            ->paginate(20);

        return response()->json($msgs);
    }

    public function enviarMensagem(Request $request): JsonResponse
    {
        $data = $request->validate([
            'destinatario_id' => ['required', 'exists:usuarios,id'],
            'assunto'         => ['required', 'string', 'max:200'],
            'corpo'           => ['required', 'string'],
        ]);

        $data['remetente_id'] = auth()->id();
        $mensagem = Mensagem::create($data);

        return response()->json($mensagem->load(['remetente','destinatario']), 201);
    }

    public function marcarLida(int $id): JsonResponse
    {
        $msg = Mensagem::where('destinatario_id', auth()->id())->findOrFail($id);
        $msg->update(['lida' => true, 'lida_em' => now()]);
        return response()->json($msg);
    }
}
