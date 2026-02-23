<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Perfil;
use App\Models\Professor;
use App\Models\Aluno;
use App\Models\Funcionario;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UsuarioController extends Controller
{
    // ── Listar todos os usuários ──────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $query = User::with('perfil')
            ->when($request->busca, fn($q) =>
                $q->where('nome', 'like', "%{$request->busca}%")
                  ->orWhere('email', 'like', "%{$request->busca}%")
            )
            ->when($request->perfil_id, fn($q) =>
                $q->where('perfil_id', $request->perfil_id)
            )
            ->orderBy('nome');

        $usuarios = $query->paginate(20);

        return response()->json($usuarios);
    }

    // ── Listar perfis disponíveis ─────────────────────────────
    public function perfis(): JsonResponse
    {
        return response()->json(Perfil::orderBy('id')->get());
    }

    // ── Criar usuário (+ vínculo automático por perfil) ───────
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'nome'      => 'required|string|max:150',
            'email'     => 'required|email|unique:usuarios,email',
            'senha'     => 'required|string|min:6',
            'perfil_id' => 'required|exists:perfis,id',
            // campos extras para professor
            'cpf'           => 'nullable|string',
            'formacao'      => 'nullable|string',
            'especializacao'=> 'nullable|string',
            // campos extras para aluno
            'data_nascimento' => 'nullable|date',
            'sexo'            => 'nullable|in:M,F,O',
        ]);

        DB::beginTransaction();
        try {
            // Criar usuário
            $usuario = User::create([
                'nome'      => $request->nome,
                'email'     => $request->email,
                'senha'     => Hash::make($request->senha),
                'perfil_id' => $request->perfil_id,
                'ativo'     => true,
            ]);

            // Buscar nome do perfil
            $perfil = Perfil::find($request->perfil_id);

            // Criar vínculo automático por perfil
            if ($perfil->nome === 'professor') {
                Professor::create([
                    'usuario_id'     => $usuario->id,
                    'cpf'            => $request->cpf ?? '000.000.000-00',
                    'formacao'       => $request->formacao,
                    'especializacao' => $request->especializacao,
                    'ativo'          => true,
                ]);
            } elseif ($perfil->nome === 'aluno') {
                Aluno::create([
                    'usuario_id'       => $usuario->id,
                    'nome'             => $request->nome,
                    'cpf'              => $request->cpf,
                    'data_nascimento'  => $request->data_nascimento ?? now()->subYears(10)->toDateString(),
                    'sexo'             => $request->sexo ?? 'M',
                    'email'            => $request->email,
                    'ativo'            => true,
                ]);
            } elseif (in_array($perfil->nome, ['secretaria', 'coordenacao'])) {
                Funcionario::create([
                    'usuario_id'    => $usuario->id,
                    'cpf'           => $request->cpf ?? '000.000.000-00',
                    'cargo'         => ucfirst($perfil->nome),
                    'departamento'  => ucfirst($perfil->nome),
                    'data_admissao' => now()->toDateString(),
                    'ativo'         => true,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Usuário criado com sucesso.',
                'usuario' => $usuario->load('perfil'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erro ao criar usuário: ' . $e->getMessage()], 500);
        }
    }

    // ── Ver usuário ───────────────────────────────────────────
    public function show(int $id): JsonResponse
    {
        $usuario = User::with('perfil', 'professor', 'aluno', 'funcionario')->findOrFail($id);
        return response()->json($usuario);
    }

    // ── Atualizar usuário ─────────────────────────────────────
    public function update(Request $request, int $id): JsonResponse
    {
        $usuario = User::findOrFail($id);

        $request->validate([
            'nome'      => 'sometimes|required|string|max:150',
            'email'     => "sometimes|required|email|unique:usuarios,email,{$id}",
            'perfil_id' => 'sometimes|required|exists:perfis,id',
            'ativo'     => 'sometimes|boolean',
        ]);

        $dados = $request->only(['nome', 'email', 'perfil_id', 'ativo']);

        if ($request->filled('nova_senha')) {
            $dados['senha'] = Hash::make($request->nova_senha);
        }

        $usuario->update($dados);

        return response()->json([
            'message' => 'Usuário atualizado.',
            'usuario' => $usuario->load('perfil'),
        ]);
    }

    // ── Ativar / Desativar ────────────────────────────────────
    public function toggleAtivo(int $id): JsonResponse
    {
        $usuario = User::findOrFail($id);
        $usuario->update(['ativo' => !$usuario->ativo]);

        return response()->json([
            'message' => 'Status atualizado.',
            'ativo'   => $usuario->ativo,
        ]);
    }

    // ── Resetar senha ─────────────────────────────────────────
    public function resetarSenha(Request $request, int $id): JsonResponse
    {
        $request->validate(['nova_senha' => 'required|string|min:6']);

        $usuario = User::findOrFail($id);
        $usuario->update(['senha' => Hash::make($request->nova_senha)]);

        return response()->json(['message' => 'Senha resetada com sucesso.']);
    }
}
