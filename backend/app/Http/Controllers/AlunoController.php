<?php

namespace App\Http\Controllers;

use App\Models\Aluno;
use App\Models\User;
use App\Models\Perfil;
use App\Models\Auditoria;
use App\Models\Matricula;
use App\Models\Responsavel;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Barryvdh\DomPDF\Facade\Pdf;

class AlunoController extends Controller
{
    private function dadosBoletimPorAlunoId(int $alunoId): array
    {
        $matricula = Matricula::with([
            'aluno', 'turma.serie.nivel', 'anoLetivo',
            'notas.disciplina', 'notas.periodo',
            'mediasPeriodo.disciplina', 'mediasPeriodo.periodo',
            'mediasAnuais.disciplina',
        ])->where('aluno_id', $alunoId)
          ->where('situacao', 'ativa')
          ->first();

        if (!$matricula) {
            return ['matricula' => null, 'frequencias' => []];
        }

        $frequencias = DB::table('frequencias as f')
            ->join('aulas as a', 'a.id', '=', 'f.aula_id')
            ->where('f.aluno_id', $alunoId)
            ->where('a.turma_id', $matricula->turma_id)
            ->select('a.disciplina_id',
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(f.presente) as presentes')
            )
            ->groupBy('a.disciplina_id')
            ->get()
            ->keyBy('disciplina_id');

        return [
            'matricula' => $matricula,
            'frequencias' => $frequencias,
        ];
    }

    private function garantirResponsavelProprio(Aluno $aluno): Responsavel
    {
        $proprio = $aluno->responsaveis()
            ->wherePivot('parentesco', 'Proprio')
            ->first();

        if (!$proprio) {
            $proprio = Responsavel::create([
                'nome' => $aluno->nome,
                'cpf' => $aluno->cpf ?: null,
                'email' => $aluno->email ?: null,
                'telefone' => $aluno->telefone ?: null,
                'ativo' => true,
            ]);
        } else {
            $proprio->update([
                'nome' => $aluno->nome,
                'cpf' => $aluno->cpf ?: $proprio->cpf,
                'email' => $aluno->email ?: $proprio->email,
                'telefone' => $aluno->telefone ?: $proprio->telefone,
            ]);
        }

        return $proprio;
    }

    private function syncResponsaveis(Aluno $aluno, array $responsaveis): void
    {
        $sync = [];

        foreach ($responsaveis as $item) {
            $respId = $item['id'] ?? null;

            if ($respId) {
                $responsavel = Responsavel::findOrFail((int) $respId);
            } else {
                if (empty($item['nome'])) {
                    continue;
                }

                $responsavel = Responsavel::create([
                    'nome' => $item['nome'],
                    'cpf' => $item['cpf'] ?? null,
                    'email' => $item['email'] ?? null,
                    'telefone' => $item['telefone'] ?? null,
                    'ativo' => true,
                ]);
            }

            $sync[$responsavel->id] = [
                'parentesco' => $item['parentesco'] ?? 'Responsavel',
                'responsavel_financeiro' => !empty($item['responsavel_financeiro']),
                'contato_emergencia' => !empty($item['contato_emergencia']),
            ];
        }

        $aluno->responsaveis()->sync($sync);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Aluno::with(['matriculaAtiva.turma.serie.nivel', 'responsaveis'])
            ->where(function ($q) {
                $q->where('ativo', true)
                  ->orWhereNull('ativo');
            });

        if ($request->filled('busca')) {
            $busca = "%{$request->busca}%";
            $query->where(function ($q) use ($busca) {
                $q->where('nome', 'like', $busca)
                  ->orWhere('cpf', 'like', $busca)
                  ->orWhere('email', 'like', $busca);
            });
        }

        if ($request->filled('turma_id')) {
            $query->whereHas('matriculas', fn($q) =>
                $q->where('turma_id', $request->turma_id)->where('situacao', 'ativa')
            );
        }

        if ($request->filled('curso_id')) {
            $query->whereHas('matriculas.turma', fn($q) =>
                $q->whereHas('serie', fn($s) => $s->where('nivel_id', $request->curso_id))
            );
        }

        $alunos = $query->orderBy('nome')->paginate($request->get('por_pagina', $request->get('per_page', 20)));

        return response()->json($alunos);
    }

    public function show(int $id): JsonResponse
    {
        $aluno = Aluno::with([
            'usuario',
            'responsaveis',
            'matriculas.turma.serie.nivel',
            'matriculas.anoLetivo',
        ])->findOrFail($id);

        return response()->json($aluno);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nome'               => ['required', 'string', 'max:150'],
            'nome_social'        => ['nullable', 'string', 'max:150'],
            'cpf'                => ['nullable', 'string', 'unique:alunos,cpf'],
            'rg'                 => ['nullable', 'string', 'max:20'],
            'data_nascimento'    => ['required', 'date'],
            'sexo'               => ['required', 'in:M,F,O'],
            'naturalidade'       => ['nullable', 'string'],
            'email'              => ['nullable', 'email'],
            'telefone'           => ['nullable', 'string'],
            'endereco'           => ['nullable', 'array'],
            'informacoes_medicas'=> ['nullable', 'string'],
            // Campos opcionais de login
            'gerar_acesso'       => ['boolean'],
            'email_login'        => ['required_if:gerar_acesso,true', 'nullable', 'email', 'unique:usuarios,email'],
            'senha'              => ['required_if:gerar_acesso,true', 'nullable', 'string', 'min:8'],
            'trocar_senha'       => ['boolean'],
            'responsaveis'       => ['nullable', 'array'],
            'responsaveis.*.id'  => ['nullable', 'integer', 'exists:responsaveis,id'],
            'responsaveis.*.nome'=> ['nullable', 'string', 'max:150'],
            'responsaveis.*.cpf' => ['nullable', 'string', 'max:14'],
            'responsaveis.*.email' => ['nullable', 'email'],
            'responsaveis.*.telefone' => ['nullable', 'string', 'max:20'],
            'responsaveis.*.parentesco' => ['nullable', 'string', 'max:50'],
            'responsaveis.*.responsavel_financeiro' => ['nullable', 'boolean'],
            'responsaveis.*.contato_emergencia' => ['nullable', 'boolean'],
            'responsavel_proprio' => ['nullable', 'boolean'],
        ]);

        // Remover campos de login do array de dados do aluno
        $camposLogin = ['gerar_acesso', 'email_login', 'senha', 'trocar_senha', 'responsaveis'];
        $dadosAluno  = array_diff_key($data, array_flip($camposLogin));
        $dadosAluno['ativo'] = true;

        DB::beginTransaction();
        try {
            $aluno = Aluno::create($dadosAluno);

            $listaResponsaveis = $data['responsaveis'] ?? [];
            if ($request->boolean('responsavel_proprio')) {
                $proprio = $this->garantirResponsavelProprio($aluno);
                $listaResponsaveis = collect($listaResponsaveis)
                    ->map(function ($r) {
                        $r['responsavel_financeiro'] = false;
                        return $r;
                    })->values()->all();
                $listaResponsaveis[] = [
                    'id' => $proprio->id,
                    'parentesco' => 'Proprio',
                    'responsavel_financeiro' => true,
                    'contato_emergencia' => false,
                ];
            }

            if (!empty($listaResponsaveis)) {
                $this->syncResponsaveis($aluno, $listaResponsaveis);
            }

            // Se solicitou geração de acesso, criar usuário vinculado
            if ($request->boolean('gerar_acesso') && $request->filled('email_login') && $request->filled('senha')) {
                $perfil = Perfil::where('nome', 'aluno')->firstOrFail();

                $usuario = User::create([
                    'nome'        => $aluno->nome,
                    'email'       => $request->email_login,
                    'senha'       => Hash::make($request->senha),
                    'perfil_id'   => $perfil->id,
                    'ativo'       => 1,
                    'trocar_senha'=> $request->boolean('trocar_senha', true) ? 1 : 0,
                ]);

                // Garantir ativo = 1 (quirk PDO/XAMPP com boolean)
                if (!$usuario->ativo) {
                    DB::table('usuarios')->where('id', $usuario->id)->update(['ativo' => 1]);
                }

                $aluno->update(['usuario_id' => $usuario->id]);

                Auditoria::registrar('gerar_acesso_aluno', 'alunos', $aluno->id, null, [
                    'email'      => $request->email_login,
                    'usuario_id' => $usuario->id,
                    'responsavel'=> $request->user()->nome,
                ]);
            } else {
                Auditoria::registrar('criar', 'alunos', $aluno->id, null, $aluno->toArray());
            }

            DB::commit();

            return response()->json($aluno->fresh()->load('responsaveis', 'usuario'), 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erro ao cadastrar aluno: ' . $e->getMessage()], 500);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $aluno = Aluno::findOrFail($id);
        $antes = $aluno->toArray();

        $data = $request->validate([
            'nome'              => ['sometimes', 'string', 'max:150'],
            'nome_social'       => ['nullable', 'string', 'max:150'],
            'cpf'               => ['nullable', 'string', "unique:alunos,cpf,{$id}"],
            'rg'                => ['nullable', 'string', 'max:20'],
            'data_nascimento'   => ['sometimes', 'date'],
            'sexo'              => ['sometimes', 'in:M,F,O'],
            'naturalidade'      => ['nullable', 'string'],
            'email'             => ['nullable', 'email'],
            'telefone'          => ['nullable', 'string'],
            'endereco'          => ['nullable', 'array'],
            'informacoes_medicas' => ['nullable', 'string'],
            'responsaveis'       => ['nullable', 'array'],
            'responsaveis.*.id'  => ['nullable', 'integer', 'exists:responsaveis,id'],
            'responsaveis.*.nome'=> ['nullable', 'string', 'max:150'],
            'responsaveis.*.cpf' => ['nullable', 'string', 'max:14'],
            'responsaveis.*.email' => ['nullable', 'email'],
            'responsaveis.*.telefone' => ['nullable', 'string', 'max:20'],
            'responsaveis.*.parentesco' => ['nullable', 'string', 'max:50'],
            'responsaveis.*.responsavel_financeiro' => ['nullable', 'boolean'],
            'responsaveis.*.contato_emergencia' => ['nullable', 'boolean'],
            'responsavel_proprio' => ['nullable', 'boolean'],
        ]);

        $dadosAluno = collect($data)->except('responsaveis')->toArray();
        $aluno->update($dadosAluno);

        if (array_key_exists('responsaveis', $data) || $request->has('responsavel_proprio')) {
            $listaResponsaveis = $data['responsaveis'] ?? [];

            if ($request->boolean('responsavel_proprio')) {
                $proprio = $this->garantirResponsavelProprio($aluno->fresh());
                $listaResponsaveis = collect($listaResponsaveis)
                    ->map(function ($r) {
                        $r['responsavel_financeiro'] = false;
                        return $r;
                    })->values()->all();
                $listaResponsaveis[] = [
                    'id' => $proprio->id,
                    'parentesco' => 'Proprio',
                    'responsavel_financeiro' => true,
                    'contato_emergencia' => false,
                ];
            }

            $this->syncResponsaveis($aluno, $listaResponsaveis);
        }

        Auditoria::registrar('editar', 'alunos', $id, $antes, $aluno->fresh()->toArray());

        return response()->json($aluno->fresh()->load('responsaveis'));
    }

    public function destroy(int $id): JsonResponse
    {
        $aluno = Aluno::findOrFail($id);
        $antes = $aluno->toArray();

        $aluno->update(['ativo' => false]);

        Auditoria::registrar('desativar', 'alunos', $id, $antes, ['ativo' => false]);

        return response()->json(['message' => 'Aluno desativado com sucesso.']);
    }

    // ── Gerar acesso para aluno existente ────────────────────
    public function gerarAcesso(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'email'        => 'required|email|unique:usuarios,email',
            'senha'        => 'required|string|min:8',
            'trocar_senha' => 'boolean',
        ]);

        $aluno = Aluno::with('usuario')->findOrFail($id);

        if ($aluno->usuario_id) {
            return response()->json(['message' => 'Este aluno já possui acesso ao sistema.'], 422);
        }

        DB::beginTransaction();
        try {
            $perfil = Perfil::where('nome', 'aluno')->firstOrFail();

            $usuario = User::create([
                'nome'        => $aluno->nome,
                'email'       => $request->email,
                'senha'       => Hash::make($request->senha),
                'perfil_id'   => $perfil->id,
                'ativo'       => 1,
                'trocar_senha'=> $request->boolean('trocar_senha', true) ? 1 : 0,
            ]);

            // Garantir ativo = 1 (quirk PDO/XAMPP com boolean)
            if (!$usuario->ativo) {
                DB::table('usuarios')->where('id', $usuario->id)->update(['ativo' => 1]);
            }

            $aluno->update(['usuario_id' => $usuario->id]);

            Auditoria::registrar('gerar_acesso_aluno', 'alunos', $aluno->id, null, [
                'email'      => $request->email,
                'usuario_id' => $usuario->id,
                'responsavel'=> $request->user()->nome,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Acesso gerado com sucesso.',
                'usuario' => ['id' => $usuario->id, 'email' => $usuario->email],
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erro ao gerar acesso: ' . $e->getMessage()], 500);
        }
    }

    // ── Redefinir senha do aluno ──────────────────────────────
    public function redefinirSenha(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'nova_senha' => 'required|string|min:8',
        ]);

        $aluno = Aluno::with('usuario')->findOrFail($id);

        if (!$aluno->usuario_id) {
            return response()->json(['message' => 'Este aluno não possui acesso ao sistema.'], 422);
        }

        $aluno->usuario->update([
            'senha'        => Hash::make($request->nova_senha),
            'trocar_senha' => true,
        ]);

        Auditoria::registrar('reset_senha_aluno', 'alunos', $aluno->id, null, [
            'responsavel' => $request->user()->nome,
        ]);

        return response()->json([
            'message' => 'Senha redefinida com sucesso. O aluno deverá trocar no próximo acesso.',
        ]);
    }

    // ── Boletim do aluno autenticado ─────────────────────────
    public function meuBoletim(Request $request): JsonResponse
    {
        $usuario = $request->user();
        $aluno   = Aluno::where('usuario_id', $usuario->id)->firstOrFail();

        return response()->json($this->dadosBoletimPorAlunoId((int) $aluno->id));
    }

    public function boletim(int $id): JsonResponse
    {
        $dados = $this->dadosBoletimPorAlunoId($id);
        if (!$dados['matricula']) {
            return response()->json(['message' => 'Aluno sem matricula ativa.'], 404);
        }

        return response()->json($dados);
    }

    public function meuBoletimPdf(Request $request)
    {
        $usuario = $request->user();
        $aluno = Aluno::where('usuario_id', $usuario->id)->firstOrFail();

        return $this->boletimPdf($request, $aluno->id);
    }

    public function boletimPdf(Request $request, int $id)
    {
        $dados = $this->dadosBoletimPorAlunoId($id);
        $matricula = $dados['matricula'];

        if (!$matricula) {
            return response()->json(['message' => 'Aluno sem matricula ativa.'], 404);
        }

        $frequencias = collect($dados['frequencias']);
        $disciplinas = [];

        foreach ($matricula->mediasAnuais ?? [] as $ma) {
            $discId = (int) $ma->disciplina_id;
            if (!array_key_exists($discId, $disciplinas)) {
                $disciplinas[$discId] = [
                    'nome' => $ma->disciplina?->nome ?? "Disciplina {$discId}",
                    'periodos' => [],
                    'media_final' => null,
                    'situacao' => null,
                    'freq_total' => 0,
                    'freq_presente' => 0,
                ];
            }
            $disciplinas[$discId]['media_final'] = $ma->media_final;
            $disciplinas[$discId]['situacao'] = $ma->situacao;
        }

        foreach ($matricula->mediasPeriodo ?? [] as $mp) {
            $discId = (int) $mp->disciplina_id;
            if (!array_key_exists($discId, $disciplinas)) {
                $disciplinas[$discId] = [
                    'nome' => $mp->disciplina?->nome ?? "Disciplina {$discId}",
                    'periodos' => [],
                    'media_final' => null,
                    'situacao' => null,
                    'freq_total' => 0,
                    'freq_presente' => 0,
                ];
            }
            $periodoNome = $mp->periodo?->nome ?? "P{$mp->periodo_id}";
            $disciplinas[$discId]['periodos'][$periodoNome] = $mp->media;
        }

        foreach ($matricula->notas ?? [] as $nota) {
            $discId = (int) $nota->disciplina_id;
            if (!array_key_exists($discId, $disciplinas)) {
                $disciplinas[$discId] = [
                    'nome' => $nota->disciplina?->nome ?? "Disciplina {$discId}",
                    'periodos' => [],
                    'media_final' => null,
                    'situacao' => null,
                    'freq_total' => 0,
                    'freq_presente' => 0,
                ];
            }
            $periodoNome = $nota->periodo?->nome ?? "P{$nota->periodo_id}";
            if (!isset($disciplinas[$discId]['periodos'][$periodoNome])) {
                $disciplinas[$discId]['periodos'][$periodoNome] = $nota->valor;
            }
        }

        foreach ($frequencias as $discId => $freq) {
            $disciplinaId = (int) $discId;
            if (array_key_exists($disciplinaId, $disciplinas)) {
                $disciplinas[$disciplinaId]['freq_total'] = (int) ($freq->total ?? 0);
                $disciplinas[$disciplinaId]['freq_presente'] = (int) ($freq->presentes ?? 0);
            }
        }

        $periodos = collect($disciplinas)
            ->flatMap(fn($d) => array_keys($d['periodos']))
            ->unique()
            ->values()
            ->all();

        $periodoId = $request->integer('periodo_id');
        $periodoSelecionadoNome = null;
        if ($periodoId) {
            $periodoSelecionadoNome = collect($matricula->mediasPeriodo ?? [])
                ->first(fn($mp) => (int) $mp->periodo_id === (int) $periodoId)?->periodo?->nome;

            if (!$periodoSelecionadoNome) {
                $periodoSelecionadoNome = collect($matricula->notas ?? [])
                    ->first(fn($n) => (int) $n->periodo_id === (int) $periodoId)?->periodo?->nome;
            }

            if (!$periodoSelecionadoNome) {
                return response()->json(['message' => 'Periodo de boletim nao encontrado para este aluno.'], 422);
            }

            $disciplinas = collect($disciplinas)
                ->map(function ($d) use ($periodoSelecionadoNome) {
                    $d['periodos'] = array_key_exists($periodoSelecionadoNome, $d['periodos'])
                        ? [$periodoSelecionadoNome => $d['periodos'][$periodoSelecionadoNome]]
                        : [];
                    return $d;
                })
                ->filter(fn($d) => !empty($d['periodos']))
                ->values()
                ->all();

            $periodos = [$periodoSelecionadoNome];
        }

        $pdf = Pdf::loadView('pdf.boletim-aluno', [
            'matricula' => $matricula,
            'disciplinas' => collect($disciplinas)->values()->all(),
            'periodos' => $periodos,
            'periodo_selecionado_nome' => $periodoSelecionadoNome,
            'emitido_em' => now(),
        ])->setPaper('a4');

        $numero = $matricula->numero_matricula ?: $matricula->id;
        $sufixoPeriodo = $periodoSelecionadoNome
            ? '-' . strtolower(str_replace(' ', '-', preg_replace('/[^A-Za-z0-9 ]/', '', $periodoSelecionadoNome)))
            : '';
        $arquivo = "boletim-matricula-{$numero}{$sufixoPeriodo}.pdf";

        return $pdf->download($arquivo);
    }

    public function frequencia(int $id): JsonResponse
    {
        $freq = DB::table('frequencias as f')
            ->join('aulas as a', 'a.id', '=', 'f.aula_id')
            ->join('disciplinas as d', 'd.id', '=', 'a.disciplina_id')
            ->where('f.aluno_id', $id)
            ->select(
                'd.nome as disciplina',
                'a.disciplina_id',
                DB::raw('COUNT(*) as total_aulas'),
                DB::raw('SUM(f.presente) as presencas'),
                DB::raw('COUNT(*) - SUM(f.presente) as faltas'),
                DB::raw('ROUND(SUM(f.presente) / COUNT(*) * 100, 1) as pct_frequencia')
            )
            ->groupBy('a.disciplina_id', 'd.nome')
            ->get();

        return response()->json($freq);
    }
}
