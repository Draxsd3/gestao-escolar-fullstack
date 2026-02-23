<?php

namespace App\Http\Controllers;

use App\Models\Aluno;
use App\Models\Turma;
use App\Models\Matricula;
use App\Models\Mensalidade;
use App\Models\Comunicado;
use App\Models\Professor;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $user = auth()->user();
        $perfil = $user->perfil?->nome;

        return match($perfil) {
            'admin', 'secretaria' => $this->dashboardAdmin(),
            'professor'           => $this->dashboardProfessor($user),
            'responsavel'         => $this->dashboardResponsavel($user),
            'aluno'               => $this->dashboardAluno($user),
            default               => response()->json(['message' => 'Dashboard não disponível'], 403),
        };
    }

    private function dashboardAdmin(): JsonResponse
    {
        $mesAtual = now()->format('Y-m');

        $totalAlunos     = Aluno::count();
        $totalMatriculas = Matricula::where('situacao', 'ativa')->count();
        $totalTurmas     = Turma::where('ativa', true)->count();
        $totalProfessores= Professor::where('ativo', true)->count();

        $recebidoMes = Mensalidade::whereRaw("DATE_FORMAT(competencia, '%Y-%m') = ?", [$mesAtual])
            ->where('situacao', 'pago')->sum('valor_final');

        $inadimplentes = Mensalidade::where('situacao', 'pendente')
            ->where('data_vencimento', '<', now())->count();

        $comunicados = Comunicado::where('publicado', true)
            ->orderByDesc('publicado_em')->limit(5)->get();

        return response()->json(compact(
            'totalAlunos', 'totalMatriculas', 'totalTurmas', 'totalProfessores',
            'recebidoMes', 'inadimplentes', 'comunicados'
        ));
    }

    private function dashboardProfessor($user): JsonResponse
    {
        $professor = $user->professor;
        if (!$professor) return response()->json(['turmas' => [], 'comunicados' => []]);

        $turmas = DB::table('professor_turma_disciplina as ptd')
            ->join('turmas as t', 't.id', '=', 'ptd.turma_id')
            ->join('disciplinas as d', 'd.id', '=', 'ptd.disciplina_id')
            ->join('series as s', 's.id', '=', 't.serie_id')
            ->where('ptd.professor_id', $professor->id)
            ->select('t.nome as turma', 's.nome as serie', 'd.nome as disciplina', 'ptd.turma_id', 'ptd.disciplina_id')
            ->get();

        $comunicados = Comunicado::whereIn('publico_alvo', ['todos', 'professores'])
            ->where('publicado', true)->orderByDesc('publicado_em')->limit(5)->get();

        return response()->json(compact('turmas', 'comunicados'));
    }

    private function dashboardResponsavel($user): JsonResponse
    {
        $responsavel = $user->responsavel;
        if (!$responsavel) return response()->json(['filhos' => [], 'comunicados' => []]);

        $filhos = $responsavel->alunos()->with(['matriculas' => fn($q) => $q->where('situacao','ativa')->with('turma')])->get();

        $comunicados = Comunicado::whereIn('publico_alvo', ['todos', 'responsaveis'])
            ->where('publicado', true)->orderByDesc('publicado_em')->limit(5)->get();

        return response()->json(compact('filhos', 'comunicados'));
    }

    private function dashboardAluno($user): JsonResponse
    {
        $aluno = $user->aluno;
        if (!$aluno) return response()->json(['message' => 'Aluno não encontrado']);

        $matriculaAtiva = $aluno->matriculas()->where('situacao', 'ativa')
            ->with(['turma.serie', 'mediasAnuais.disciplina'])->first();

        $comunicados = Comunicado::whereIn('publico_alvo', ['todos', 'alunos'])
            ->where('publicado', true)->orderByDesc('publicado_em')->limit(5)->get();

        return response()->json(compact('matriculaAtiva', 'comunicados'));
    }
}
