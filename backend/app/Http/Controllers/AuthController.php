<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Perfil;
use App\Models\Auditoria;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private function fotoUrl(?string $path): ?string
    {
        if (!$path) return null;
        return url(Storage::disk('public')->url($path));
    }

    private function payloadUsuario(User $user): array
    {
        $data = [
            'id'           => $user->id,
            'nome'         => $user->nome,
            'email'        => $user->email,
            'perfil'       => $user->perfil->nome,
            'ativo'        => $user->ativo,
            'trocar_senha' => $user->trocar_senha ?? false,
            'foto'         => $user->foto,
            'foto_url'     => $this->fotoUrl($user->foto),
        ];

        if ($user->professor) {
            $data['permissoes'] = $user->professor->permissoes ?? [];
        }

        return $data;
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'senha' => ['required', 'string'],
        ]);

        $user = User::with('perfil')
            ->where('email', $request->email)
            ->where('ativo', true)
            ->first();

        if (!$user || !Hash::check($request->senha, $user->senha)) {
            throw ValidationException::withMessages([
                'email' => ['Credenciais inválidas.'],
            ]);
        }

        $user->load('professor');
        $user->update(['ultimo_login' => now()]);
        $user->tokens()->delete();
        $token = $user->createToken('babel-app', ['*'], now()->addHours(8))->plainTextToken;

        Auditoria::registrar('login', 'usuarios', $user->id, null, ['email' => $user->email]);

        $usuarioData = $this->payloadUsuario($user);

        return response()->json([
            'token'   => $token,
            'usuario' => $usuarioData,
        ]);
    }

    // Rota pública para criar admin — apenas homologação
    public function registrarAdmin(Request $request): JsonResponse
    {
        $request->validate([
            'nome'  => 'required|string|max:150',
            'email' => 'required|email|unique:usuarios,email',
            'senha' => 'required|string|min:6',
        ]);

        $perfilAdmin = Perfil::where('nome', 'admin')->first();

        if (!$perfilAdmin) {
            return response()->json([
                'message' => 'Perfil "admin" não encontrado. Execute os seeds primeiro.'
            ], 500);
        }

        $usuario = User::create([
            'nome'      => $request->nome,
            'email'     => $request->email,
            'senha'     => Hash::make($request->senha),
            'perfil_id' => $perfilAdmin->id,
            'ativo'     => true,
        ]);

        return response()->json([
            'message' => 'Administrador criado com sucesso!',
            'usuario' => [
                'id'    => $usuario->id,
                'nome'  => $usuario->nome,
                'email' => $usuario->email,
            ],
        ], 201);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logout realizado com sucesso.']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('perfil', 'professor');
        return response()->json($this->payloadUsuario($user));
    }

    public function atualizarPerfil(Request $request): JsonResponse
    {
        $user = $request->user()->load('perfil', 'professor');

        $data = $request->validate([
            'nome'        => ['required', 'string', 'max:150'],
            'email'       => ['required', 'email', "unique:usuarios,email,{$user->id}"],
            'foto'        => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remover_foto'=> ['nullable', 'boolean'],
        ]);

        $payload = [
            'nome' => $data['nome'],
            'email' => $data['email'],
        ];

        if ($request->boolean('remover_foto')) {
            if ($user->foto) {
                Storage::disk('public')->delete($user->foto);
            }
            $payload['foto'] = null;
        }

        if ($request->hasFile('foto')) {
            if ($user->foto) {
                Storage::disk('public')->delete($user->foto);
            }
            $payload['foto'] = $request->file('foto')->store('usuarios/perfis', 'public');
        }

        $user->update($payload);

        return response()->json([
            'message' => 'Perfil atualizado com sucesso.',
            'usuario' => $this->payloadUsuario($user->fresh()->load('perfil', 'professor')),
        ]);
    }

    public function alterarSenha(Request $request): JsonResponse
    {
        $request->validate([
            'senha_atual' => ['required'],
            'nova_senha'  => ['required', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        if (!Hash::check($request->senha_atual, $user->senha)) {
            throw ValidationException::withMessages([
                'senha_atual' => ['Senha atual incorreta.'],
            ]);
        }

        $user->update(['senha' => Hash::make($request->nova_senha)]);
        return response()->json(['message' => 'Senha alterada com sucesso.']);
    }
}
