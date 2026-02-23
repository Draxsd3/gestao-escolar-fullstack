<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerificarPerfil
{
    public function handle(Request $request, Closure $next, string ...$perfis): Response
    {
        $user = $request->user();

        if (!$user || !$user->hasAnyPerfil($perfis)) {
            return response()->json([
                'message' => 'Acesso negado. Perfil sem permissão para esta ação.',
            ], 403);
        }

        return $next($request);
    }
}
