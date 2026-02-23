<?php

namespace App\Http\Controllers;

use App\Models\Comunicado;
use App\Models\Mensagem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ComunicacaoController extends Controller
{
    // ─── Comunicados ────────────────────────────────────────

    public function indexComunicados(Request $request): JsonResponse
    {
        $user   = auth()->user();
        $perfil = $user->perfil?->nome;

        $query = Comunicado::with('autor:id,nome')->where('publicado', true);

        if (!in_array($perfil, ['admin','secretaria','coordenacao'])) {
            $query->where(function ($q) use ($perfil) {
                $q->where('publico_alvo', 'todos')
                  ->orWhere('publico_alvo', $perfil);
            });
        }

        $comunicados = $query->orderByDesc('publicado_em')->paginate(15);
        return response()->json($comunicados);
    }

    public function storeComunicado(Request $request): JsonResponse
    {
        $data = $request->validate([
            'titulo'      => 'required|string|max:255',
            'corpo'       => 'required|string',
            'publico_alvo'=> 'required|in:todos,alunos,responsaveis,professores,funcionarios,turma',
            'turma_id'    => 'nullable|exists:turmas,id',
            'expira_em'   => 'nullable|date',
            'publicado'   => 'boolean',
        ]);

        $comunicado = Comunicado::create([
            ...$data,
            'autor_id'     => auth()->id(),
            'publicado_em' => now(),
        ]);

        return response()->json($comunicado->load('autor:id,nome'), 201);
    }

    public function destroyComunicado(Comunicado $comunicado): JsonResponse
    {
        $comunicado->delete();
        return response()->json(['message' => 'Comunicado removido.']);
    }

    // ─── Mensagens ──────────────────────────────────────────

    public function indexMensagens(): JsonResponse
    {
        $mensagens = Mensagem::with('remetente:id,nome')
            ->where('destinatario_id', auth()->id())
            ->orderByDesc('criado_em')
            ->paginate(20);

        return response()->json($mensagens);
    }

    public function storeMensagem(Request $request): JsonResponse
    {
        $data = $request->validate([
            'destinatario_id' => 'required|exists:usuarios,id',
            'assunto'         => 'required|string|max:255',
            'corpo'           => 'required|string',
        ]);

        $mensagem = Mensagem::create([
            ...$data,
            'remetente_id' => auth()->id(),
        ]);

        return response()->json($mensagem->load('remetente:id,nome', 'destinatario:id,nome'), 201);
    }

    public function marcarLida(Mensagem $mensagem): JsonResponse
    {
        if ($mensagem->destinatario_id !== auth()->id()) {
            return response()->json(['message' => 'Acesso negado.'], 403);
        }

        $mensagem->update(['lida' => true, 'lida_em' => now()]);
        return response()->json(['message' => 'Marcada como lida.']);
    }
}
