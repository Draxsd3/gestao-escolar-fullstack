<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Perfil;
use App\Models\Auditoria;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
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

        $user->update(['ultimo_login' => now()]);
        $user->tokens()->delete();
        $token = $user->createToken('babel-app', ['*'], now()->addHours(8))->plainTextToken;

        Auditoria::registrar('login', 'usuarios', $user->id, null, ['email' => $user->email]);

        return response()->json([
            'token'   => $token,
            'usuario' => [
                'id'     => $user->id,
                'nome'   => $user->nome,
                'email'  => $user->email,
                'perfil' => $user->perfil->nome,
            ],
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
        $user = $request->user()->load('perfil');
        return response()->json([
            'id'     => $user->id,
            'nome'   => $user->nome,
            'email'  => $user->email,
            'perfil' => $user->perfil->nome,
            'ativo'  => $user->ativo,
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
