<?php

namespace App\Http\Controllers;

use App\Models\Aluno;
use App\Models\Auditoria;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AlunoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Aluno::with(['matriculaAtiva.turma.serie', 'responsaveis'])
            ->where('ativo', true);

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

        if ($request->filled('serie_id')) {
            $query->whereHas('matriculas.turma', fn($q) =>
                $q->where('serie_id', $request->serie_id)
            );
        }

        $alunos = $query->orderBy('nome')->paginate($request->get('por_pagina', 20));

        return response()->json($alunos);
    }

    public function show(int $id): JsonResponse
    {
        $aluno = Aluno::with([
            'usuario',
            'responsaveis',
            'matriculas.turma.serie',
            'matriculas.anoLetivo',
        ])->findOrFail($id);

        return response()->json($aluno);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nome'              => ['required', 'string', 'max:150'],
            'nome_social'       => ['nullable', 'string', 'max:150'],
            'cpf'               => ['nullable', 'string', 'unique:alunos,cpf'],
            'rg'                => ['nullable', 'string', 'max:20'],
            'data_nascimento'   => ['required', 'date'],
            'sexo'              => ['required', 'in:M,F,O'],
            'naturalidade'      => ['nullable', 'string'],
            'email'             => ['nullable', 'email'],
            'telefone'          => ['nullable', 'string'],
            'endereco'          => ['nullable', 'array'],
            'informacoes_medicas' => ['nullable', 'string'],
        ]);

        $aluno = Aluno::create($data);

        Auditoria::registrar('criar', 'alunos', $aluno->id, null, $aluno->toArray());

        return response()->json($aluno->load('responsaveis'), 201);
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
        ]);

        $aluno->update($data);

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

    public function boletim(int $id): JsonResponse
    {
        $matricula = \App\Models\Matricula::with([
            'aluno', 'turma.serie', 'anoLetivo',
            'notas.disciplina', 'notas.periodo',
            'mediasPeriodo.disciplina', 'mediasPeriodo.periodo',
            'mediasAnuais.disciplina',
        ])->where('aluno_id', $id)
          ->where('situacao', 'ativa')
          ->firstOrFail();

        // Calcular frequência por disciplina
        $frequencias = DB::table('frequencias as f')
            ->join('aulas as a', 'a.id', '=', 'f.aula_id')
            ->where('f.aluno_id', $id)
            ->where('a.turma_id', $matricula->turma_id)
            ->select('a.disciplina_id',
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(f.presente) as presentes')
            )
            ->groupBy('a.disciplina_id')
            ->get()
            ->keyBy('disciplina_id');

        return response()->json([
            'matricula'   => $matricula,
            'frequencias' => $frequencias,
        ]);
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
