<?php

namespace App\Http\Controllers;

use App\Models\{Comunicado, Mensagem};
use Illuminate\Http\{Request, JsonResponse};
use Illuminate\Support\Facades\Storage;

class ComunicacaoController extends Controller
{
    private function fotoUrl(?string $path): ?string
    {
        if (!$path) return null;
        return url(Storage::disk('public')->url($path));
    }

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

        if ($request->filled('publico_alvo')) {
            $query->where('publico_alvo', $request->string('publico_alvo'));
        }

        if ($request->filled('busca')) {
            $termo = trim((string) $request->string('busca'));
            $query->where(function ($q) use ($termo) {
                $q->where('titulo', 'like', "%{$termo}%")
                    ->orWhere('corpo', 'like', "%{$termo}%");
            });
        }

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
        $tipo = $request->string('tipo', 'recebidas')->toString();

        $msgs = Mensagem::with(['remetente:id,nome,email,foto', 'destinatario:id,nome,email,foto'])
            ->when($tipo === 'enviadas',
                fn($q) => $q->where('remetente_id', auth()->id()),
                fn($q) => $q->where('destinatario_id', auth()->id())
            )
            ->when($tipo !== 'enviadas' && $request->boolean('nao_lidas'),
                fn($q) => $q->where('lida', false)
            )
            ->when($request->filled('busca'), function ($q) use ($request) {
                $termo = trim((string) $request->string('busca'));
                $q->where(function ($qq) use ($termo) {
                    $qq->where('assunto', 'like', "%{$termo}%")
                        ->orWhere('corpo', 'like', "%{$termo}%")
                        ->orWhereHas('remetente', fn($u) => $u->where('nome', 'like', "%{$termo}%"))
                        ->orWhereHas('destinatario', fn($u) => $u->where('nome', 'like', "%{$termo}%"));
                });
            })
            ->orderBy('criado_em', 'desc')
            ->paginate(20);

        $msgs->through(function ($msg) {
            if ($msg->remetente) {
                $msg->remetente->foto_url = $this->fotoUrl($msg->remetente->foto);
            }
            if ($msg->destinatario) {
                $msg->destinatario->foto_url = $this->fotoUrl($msg->destinatario->foto);
            }
            return $msg;
        });

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
        $mensagem->load(['remetente:id,nome,email,foto', 'destinatario:id,nome,email,foto']);
        if ($mensagem->remetente) {
            $mensagem->remetente->foto_url = $this->fotoUrl($mensagem->remetente->foto);
        }
        if ($mensagem->destinatario) {
            $mensagem->destinatario->foto_url = $this->fotoUrl($mensagem->destinatario->foto);
        }

        return response()->json($mensagem, 201);
    }

    public function marcarLida(int $id): JsonResponse
    {
        $msg = Mensagem::where('destinatario_id', auth()->id())->findOrFail($id);
        $msg->update(['lida' => true, 'lida_em' => now()]);
        return response()->json($msg);
    }
}
