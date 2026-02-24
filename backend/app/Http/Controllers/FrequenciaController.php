<?php

namespace App\Http\Controllers;

use App\Models\{AnoLetivo, Aula, Frequencia, Matricula, PeriodoAvaliacao, Turma};
use Illuminate\Http\{Request, JsonResponse};
use Illuminate\Support\Facades\DB;

class FrequenciaController extends Controller
{
    /**
     * Verifica se uma data de aula está dentro do período ativo.
     */
    private function validarPeriodoParaData(string $dataAula, Turma $turma): ?JsonResponse
    {
        $anoLetivo = AnoLetivo::find($turma->ano_letivo_id);
        if (!$anoLetivo || !$anoLetivo->ativo) {
            return response()->json([
                'message' => 'O ano letivo desta turma não está ativo.',
            ], 422);
        }

        $periodoAtivo = $anoLetivo->periodoAtivo();
        if (!$periodoAtivo) {
            return response()->json([
                'message' => 'Não há período letivo ativo. Todos os períodos podem estar encerrados.',
            ], 422);
        }

        // Verificar se a data está dentro do período ativo
        if ($periodoAtivo->data_inicio && $periodoAtivo->data_fim) {
            $data = \Carbon\Carbon::parse($dataAula);
            if ($data->lt($periodoAtivo->data_inicio) || $data->gt($periodoAtivo->data_fim)) {
                return response()->json([
                    'message' => "A data {$dataAula} está fora do período ativo \"{$periodoAtivo->nome}\" ({$periodoAtivo->data_inicio->format('d/m/Y')} a {$periodoAtivo->data_fim->format('d/m/Y')}).",
                ], 422);
            }
        }

        return null;
    }

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'turma_id'      => ['required', 'exists:turmas,id'],
            'disciplina_id' => ['required', 'exists:disciplinas,id'],
            'data_aula'     => ['required', 'date'],
        ]);

        $aula = Aula::where('turma_id', $request->turma_id)
            ->where('disciplina_id', $request->disciplina_id)
            ->whereDate('data_aula', $request->data_aula)
            ->with('frequencias')
            ->first();

        $matriculas = Matricula::with('aluno')
            ->where('turma_id', $request->turma_id)
            ->where('situacao', 'ativa')
            ->orderBy('id')
            ->get();

        $freqs = $aula?->frequencias->keyBy('aluno_id') ?? collect();

        // Verificar se o período está encerrado para esta data
        $turma = Turma::find($request->turma_id);
        $periodoEncerrado = false;
        if ($turma) {
            $anoLetivo = AnoLetivo::find($turma->ano_letivo_id);
            if ($anoLetivo) {
                $periodos = PeriodoAvaliacao::where('ano_letivo_id', $anoLetivo->id)
                    ->orderBy('ordem')
                    ->get();
                foreach ($periodos as $p) {
                    if ($p->data_inicio && $p->data_fim) {
                        $data = \Carbon\Carbon::parse($request->data_aula);
                        if ($data->between($p->data_inicio, $p->data_fim) && $p->encerrado) {
                            $periodoEncerrado = true;
                            break;
                        }
                    }
                }
            }
        }

        $resultado = $matriculas->map(fn($m) => [
            'aluno_id' => $m->aluno_id,
            'nome'     => $m->aluno->nome,
            'presente' => $freqs->get($m->aluno_id)?->presente ?? null,
            'justificativa' => $freqs->get($m->aluno_id)?->justificativa,
        ]);

        return response()->json([
            'aula'       => $aula,
            'frequencias'=> $resultado,
            'periodo_encerrado' => $periodoEncerrado,
        ]);
    }

    public function lancar(Request $request): JsonResponse
    {
        $data = $request->validate([
            'turma_id'      => ['required', 'exists:turmas,id'],
            'disciplina_id' => ['required', 'exists:disciplinas,id'],
            'data_aula'     => ['required', 'date'],
            'numero_aulas'  => ['required', 'integer', 'min:1'],
            'conteudo'      => ['nullable', 'string'],
            'frequencias'   => ['required', 'array'],
            'frequencias.*.aluno_id'   => ['required', 'exists:alunos,id'],
            'frequencias.*.presente'   => ['required', 'boolean'],
            'frequencias.*.justificativa' => ['nullable', 'string'],
        ]);

        // ══ VALIDAÇÃO: Período ativo ══
        $turma = Turma::findOrFail($data['turma_id']);
        $erroResp = $this->validarPeriodoParaData($data['data_aula'], $turma);
        if ($erroResp) return $erroResp;

        DB::transaction(function () use ($data) {
            $aula = Aula::updateOrCreate(
                [
                    'turma_id'      => $data['turma_id'],
                    'disciplina_id' => $data['disciplina_id'],
                    'data_aula'     => $data['data_aula'],
                ],
                [
                    'professor_id' => auth()->user()->professor?->id ?? 1,
                    'numero_aulas' => $data['numero_aulas'],
                    'conteudo'     => $data['conteudo'],
                ]
            );

            foreach ($data['frequencias'] as $f) {
                Frequencia::updateOrCreate(
                    ['aula_id' => $aula->id, 'aluno_id' => $f['aluno_id']],
                    ['presente' => $f['presente'], 'justificativa' => $f['justificativa'] ?? null]
                );
            }
        });

        return response()->json(['message' => 'Frequência registrada com sucesso.']);
    }

    public function relatorio(Request $request): JsonResponse
    {
        $request->validate([
            'turma_id' => ['required', 'exists:turmas,id'],
        ]);

        $query = DB::table('frequencias as f')
            ->join('aulas as a', 'a.id', '=', 'f.aula_id')
            ->join('alunos as al', 'al.id', '=', 'f.aluno_id')
            ->join('disciplinas as d', 'd.id', '=', 'a.disciplina_id')
            ->where('a.turma_id', $request->turma_id)
            ->when($request->disciplina_id, fn($q) => $q->where('a.disciplina_id', $request->disciplina_id));

        // Filtrar por período se especificado
        if ($request->filled('periodo_id')) {
            $periodo = PeriodoAvaliacao::find($request->periodo_id);
            if ($periodo && $periodo->data_inicio && $periodo->data_fim) {
                $query->whereBetween('a.data_aula', [
                    $periodo->data_inicio->format('Y-m-d'),
                    $periodo->data_fim->format('Y-m-d'),
                ]);
            }
        }

        $dados = $query->select(
                'al.id as aluno_id', 'al.nome as aluno',
                'd.id as disciplina_id', 'd.nome as disciplina',
                DB::raw('COUNT(*) as total_aulas'),
                DB::raw('SUM(f.presente) as presencas'),
                DB::raw('(COUNT(*) - SUM(f.presente)) as faltas'),
                DB::raw('ROUND(SUM(f.presente) / COUNT(*) * 100, 1) as pct')
            )
            ->groupBy('al.id', 'al.nome', 'd.id', 'd.nome')
            ->orderBy('al.nome')
            ->get();

        return response()->json($dados);
    }

    public function historico(Request $request): JsonResponse
    {
        $data = $request->validate([
            'turma_id'      => ['nullable', 'exists:turmas,id'],
            'disciplina_id' => ['nullable', 'exists:disciplinas,id'],
            'data_inicio'   => ['nullable', 'date'],
            'data_fim'      => ['nullable', 'date', 'after_or_equal:data_inicio'],
            'periodo_id'    => ['nullable', 'exists:periodos_avaliacao,id'],
        ]);

        $usuario = $request->user()->loadMissing('perfil');
        $isAdmin = $usuario?->perfil?->nome === 'admin';

        if (!$isAdmin && empty($data['turma_id'])) {
            return response()->json([
                'message' => 'Selecione uma turma para consultar o histórico de frequências.',
            ], 422);
        }

        $turma = null;
        if (!empty($data['turma_id'])) {
            $turma = Turma::select('id', 'nome', 'sala')->findOrFail($data['turma_id']);
        }

        // Se período especificado, usar suas datas
        if (!empty($data['periodo_id'])) {
            $periodo = PeriodoAvaliacao::find($data['periodo_id']);
            if ($periodo) {
                if ($periodo->data_inicio) $data['data_inicio'] = $periodo->data_inicio->format('Y-m-d');
                if ($periodo->data_fim) $data['data_fim'] = $periodo->data_fim->format('Y-m-d');
            }
        }

        $aulasQuery = Aula::query()
            ->with(['disciplina:id,nome', 'turma:id,nome,sala'])
            ->when(!empty($data['turma_id']), fn($q) => $q->where('turma_id', $data['turma_id']))
            ->when(!empty($data['disciplina_id']), fn($q) => $q->where('disciplina_id', $data['disciplina_id']))
            ->when(!empty($data['data_inicio']), fn($q) => $q->whereDate('data_aula', '>=', $data['data_inicio']))
            ->when(!empty($data['data_fim']), fn($q) => $q->whereDate('data_aula', '<=', $data['data_fim']))
            ->orderBy('data_aula')
            ->orderBy('id');

        $aulas = $aulasQuery->get();
        $aulaIds = $aulas->pluck('id');

        $frequencias = Frequencia::query()
            ->join('alunos as al', 'al.id', '=', 'frequencias.aluno_id')
            ->whereIn('frequencias.aula_id', $aulaIds)
            ->select(
                'frequencias.aula_id', 'frequencias.aluno_id',
                'frequencias.presente', 'frequencias.justificativa',
                'al.nome as aluno_nome'
            )
            ->orderBy('al.nome')
            ->get();

        $frequenciasPorAula = $frequencias->groupBy('aula_id');

        $aulasHistorico = $aulas->map(function ($aula) use ($frequenciasPorAula) {
            $registros = $frequenciasPorAula->get($aula->id, collect())->values();
            $total = $registros->count();
            $presencas = $registros->where('presente', 1)->count();
            return [
                'aula_id'       => $aula->id,
                'data_aula'     => optional($aula->data_aula)->format('Y-m-d'),
                'turma_id'      => $aula->turma_id,
                'turma'         => $aula->turma?->nome,
                'sala'          => $aula->turma?->sala,
                'disciplina_id' => $aula->disciplina_id,
                'disciplina'    => $aula->disciplina?->nome,
                'total_alunos'  => $total,
                'presencas'     => $presencas,
                'faltas'        => $total - $presencas,
                'percentual'    => $total > 0 ? round(($presencas / $total) * 100, 1) : 0.0,
                'registros'     => $registros->map(fn($r) => [
                    'aluno_id' => $r->aluno_id, 'aluno' => $r->aluno_nome,
                    'presente' => (bool) $r->presente, 'justificativa' => $r->justificativa,
                ])->values(),
            ];
        })->values();

        $resumoAlunos = $frequencias->groupBy('aluno_id')->map(function ($itens) {
            $total = $itens->count();
            $presencas = $itens->where('presente', 1)->count();
            return [
                'aluno_id' => (int) $itens->first()->aluno_id,
                'aluno' => $itens->first()->aluno_nome,
                'total_aulas' => $total, 'presencas' => $presencas,
                'faltas' => $total - $presencas,
                'percentual' => $total > 0 ? round(($presencas / $total) * 100, 1) : 0.0,
            ];
        })->sortBy('aluno')->values();

        $totalRegistros = $frequencias->count();
        $totalPresencas = $frequencias->where('presente', 1)->count();

        return response()->json([
            'turma' => $turma ? ['id' => $turma->id, 'nome' => $turma->nome, 'sala' => $turma->sala] : null,
            'filtros' => [
                'escopo' => $turma ? 'turma' : 'todas_turmas',
                'disciplina_id' => $data['disciplina_id'] ?? null,
                'data_inicio' => $data['data_inicio'] ?? null,
                'data_fim' => $data['data_fim'] ?? null,
            ],
            'resumo' => [
                'total_aulas' => $aulas->count(),
                'total_registros' => $totalRegistros,
                'total_presencas' => $totalPresencas,
                'total_faltas' => $totalRegistros - $totalPresencas,
                'percentual_geral' => $totalRegistros > 0 ? round(($totalPresencas / $totalRegistros) * 100, 1) : 0.0,
                'alunos_avaliados' => $resumoAlunos->count(),
            ],
            'aulas' => $aulasHistorico,
            'alunos' => $resumoAlunos,
        ]);
    }
}
