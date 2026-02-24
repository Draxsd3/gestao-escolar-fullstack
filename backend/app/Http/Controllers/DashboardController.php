<?php

namespace App\Http\Controllers;

use Illuminate\Http\{Request, JsonResponse};
use Illuminate\Support\Facades\DB;
use App\Models\{Aluno, Matricula, Turma, Mensalidade, AnoLetivo, Comunicado};

class DashboardController extends Controller
{
    public function admin(): JsonResponse
    {
        $anoLetivo = AnoLetivo::ativo();

        $totalAlunos = Aluno::where('ativo', true)->count();
        $totalMatriculas = $anoLetivo
            ? Matricula::where('ano_letivo_id', $anoLetivo->id)->where('situacao', 'ativa')->count()
            : 0;
        $totalTurmas = Turma::where('ativa', true)
            ->when($anoLetivo, fn($q) => $q->where('ano_letivo_id', $anoLetivo->id))
            ->count();

        $recebidoMes = Mensalidade::whereYear('competencia', now()->year)
            ->whereMonth('competencia', now()->month)
            ->whereIn('situacao', ['pago','parcial'])
            ->sum('valor_final');

        $inadimplentes = Mensalidade::where('situacao', 'pendente')
            ->where('data_vencimento', '<', now())
            ->count();

        $comunicados = Comunicado::where('publicado', true)
            ->orderBy('publicado_em', 'desc')
            ->take(5)
            ->get(['id', 'titulo', 'publico_alvo', 'publicado_em']);

        return response()->json([
            'total_alunos'      => $totalAlunos,
            'total_matriculas'  => $totalMatriculas,
            'total_turmas'      => $totalTurmas,
            'recebido_mes'      => $recebidoMes,
            'inadimplentes'     => $inadimplentes,
            'ano_letivo'        => $anoLetivo,
            'comunicados_recentes' => $comunicados,
        ]);
    }

    public function professor(Request $request): JsonResponse
    {
        $user = $request->user();
        $professor = $user->professor;

        if (!$professor) {
            return response()->json(['message' => 'Professor não encontrado.'], 404);
        }

        $turmas = DB::table('professor_turma_disciplina as ptd')
            ->join('turmas as t', 't.id', '=', 'ptd.turma_id')
            ->join('series as s', 's.id', '=', 't.serie_id')
            ->join('niveis_ensino as ne', 'ne.id', '=', 's.nivel_id')
            ->join('disciplinas as d', 'd.id', '=', 'ptd.disciplina_id')
            ->where('ptd.professor_id', $professor->id)
            ->where('ptd.ano_letivo_id', AnoLetivo::ativo()?->id)
            ->select('t.id as turma_id', 't.nome as turma', 'ne.nome as curso', 'd.id as disciplina_id', 'd.nome as disciplina')
            ->get();

        return response()->json([
            'professor'       => $professor->load('usuario'),
            'turmas_disciplinas' => $turmas,
        ]);
    }

    public function responsavel(Request $request): JsonResponse
    {
        $user = $request->user();
        $responsavel = $user->responsavel;

        if (!$responsavel) {
            return response()->json(['message' => 'Responsável não encontrado.'], 404);
        }

        $alunos = $responsavel->alunos()->with([
            'matriculaAtiva.turma.serie.nivel',
            'matriculaAtiva.mediasAnuais.disciplina',
        ])->get();

        return response()->json([
            'responsavel' => $responsavel,
            'alunos'      => $alunos,
        ]);
    }
}
