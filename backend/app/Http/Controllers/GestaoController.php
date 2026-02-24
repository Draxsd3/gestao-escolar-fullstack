<?php

namespace App\Http\Controllers;

use App\Models\{AnoLetivo, Boletim, Disciplina, Matricula, MediaPeriodo, NivelEnsino, Nota, PeriodoAvaliacao, PlanoPagamento, Sala, Serie, Turma, Auditoria};
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class GestaoController extends Controller
{
    private function dependencyError(string $message, string $hint, array $dependencies = []): JsonResponse
    {
        return response()->json([
            'message' => $message,
            'hint' => $hint,
            'dependencies' => $dependencies,
        ], 422);
    }

    // ═══════════════════════════════════════════════════════
    // ANO LETIVO + PERÍODOS — Sistema refatorado
    // ═══════════════════════════════════════════════════════

    /**
     * GET /api/ano-letivo/vigente
     * Retorna o ano letivo ativo + período ativo atual (usado pelo frontend em todas as telas)
     */
    public function anoLetivoVigente(): JsonResponse
    {
        $ano = AnoLetivo::ativo();
        if (!$ano) {
            return response()->json([
                'ano_letivo' => null,
                'periodo_ativo' => null,
                'mensagem' => 'Nenhum ano letivo ativo. Configure um ano letivo para iniciar.',
            ]);
        }

        $periodoAtivo = $ano->periodoAtivo();
        $periodos = $ano->periodos()->orderBy('ordem')->get();

        return response()->json([
            'ano_letivo' => [
                'id' => $ano->id,
                'ano' => $ano->ano,
                'data_inicio' => $ano->data_inicio?->format('Y-m-d'),
                'data_fim' => $ano->data_fim?->format('Y-m-d'),
                'modelo_periodo' => $ano->modelo_periodo,
                'status' => $ano->status,
                'ativo' => $ano->ativo,
            ],
            'periodo_ativo' => $periodoAtivo ? [
                'id' => $periodoAtivo->id,
                'nome' => $periodoAtivo->nome,
                'ordem' => $periodoAtivo->ordem,
                'data_inicio' => $periodoAtivo->data_inicio?->format('Y-m-d'),
                'data_fim' => $periodoAtivo->data_fim?->format('Y-m-d'),
                'encerrado' => false,
            ] : null,
            'periodos' => $periodos->map(fn($p) => [
                'id' => $p->id,
                'nome' => $p->nome,
                'ordem' => $p->ordem,
                'data_inicio' => $p->data_inicio?->format('Y-m-d'),
                'data_fim' => $p->data_fim?->format('Y-m-d'),
                'encerrado' => $p->encerrado,
                'encerrado_em' => $p->encerrado_em?->format('Y-m-d H:i:s'),
            ]),
        ]);
    }

    /**
     * GET /api/anos-letivos
     * Lista todos os anos letivos com seus períodos
     */
    public function anosLetivos(): JsonResponse
    {
        $anos = AnoLetivo::with(['periodos' => fn($q) => $q->orderBy('ordem')])
            ->orderBy('ano', 'desc')
            ->get()
            ->map(function ($ano) {
                $periodoAtivo = $ano->periodos->where('encerrado', false)->sortBy('ordem')->first();
                return [
                    'id' => $ano->id,
                    'ano' => $ano->ano,
                    'data_inicio' => $ano->data_inicio?->format('Y-m-d'),
                    'data_fim' => $ano->data_fim?->format('Y-m-d'),
                    'modelo_periodo' => $ano->modelo_periodo,
                    'status' => $ano->status,
                    'ativo' => $ano->ativo,
                    'periodo_ativo' => $periodoAtivo ? [
                        'id' => $periodoAtivo->id,
                        'nome' => $periodoAtivo->nome,
                        'ordem' => $periodoAtivo->ordem,
                    ] : null,
                    'periodos' => $ano->periodos->map(fn($p) => [
                        'id' => $p->id,
                        'nome' => $p->nome,
                        'ordem' => $p->ordem,
                        'data_inicio' => $p->data_inicio?->format('Y-m-d'),
                        'data_fim' => $p->data_fim?->format('Y-m-d'),
                        'encerrado' => $p->encerrado,
                        'encerrado_em' => $p->encerrado_em?->format('Y-m-d H:i:s'),
                    ]),
                ];
            });

        return response()->json($anos);
    }

    /**
     * POST /api/anos-letivos
     * Cria um novo ano letivo e gera seus períodos automaticamente
     */
    public function storeAnoLetivo(Request $request): JsonResponse
    {
        $request->validate([
            'ano' => 'required|integer|min:2020|max:2099',
            'modelo_periodo' => 'required|in:bimestral,semestral',
        ]);

        $ano = (int) $request->input('ano');

        if (AnoLetivo::where('ano', $ano)->exists()) {
            return response()->json(['message' => 'Ano letivo já cadastrado.'], 422);
        }

        $item = DB::transaction(function () use ($ano, $request) {
            // Desativar todos os outros anos letivos
            AnoLetivo::where('ativo', true)->update(['ativo' => false]);

            $anoLetivo = AnoLetivo::create([
                'ano' => $ano,
                'data_inicio' => $request->input('data_inicio', "{$ano}-02-01"),
                'data_fim' => $request->input('data_fim', "{$ano}-12-15"),
                'modelo_periodo' => $request->input('modelo_periodo'),
                'status' => 'em_andamento',
                'ativo' => true,
            ]);

            // Gerar períodos automaticamente com base no modelo
            $anoLetivo->gerarPeriodos();

            return $anoLetivo->load(['periodos' => fn($q) => $q->orderBy('ordem')]);
        });

        Auditoria::registrar('criar_ano_letivo', 'anos_letivos', $item->id, null, $item->toArray());

        return response()->json($item, 201);
    }

    /**
     * POST /api/anos-letivos/{id}/ativar
     * Ativa um ano letivo (desativa os outros)
     */
    public function ativarAnoLetivo(int $id): JsonResponse
    {
        $anoLetivo = AnoLetivo::findOrFail($id);

        DB::transaction(function () use ($anoLetivo) {
            AnoLetivo::where('ativo', true)->update(['ativo' => false]);
            $anoLetivo->update(['ativo' => true]);
        });

        return response()->json(['message' => "Ano letivo {$anoLetivo->ano} ativado com sucesso."]);
    }

    /**
     * POST /api/periodos-avaliacao/{id}/fechar
     * Fecha o período: bloqueia lançamentos, calcula médias, gera boletins
     */
    public function fecharPeriodo(int $id): JsonResponse
    {
        $periodo = PeriodoAvaliacao::with('anoLetivo')->findOrFail($id);

        if ($periodo->encerrado) {
            return response()->json(['message' => 'Este período já está encerrado.'], 422);
        }

        $anoLetivo = $periodo->anoLetivo;
        if (!$anoLetivo || !$anoLetivo->ativo) {
            return response()->json(['message' => 'O ano letivo deste período não está ativo.'], 422);
        }

        // Verificar se é realmente o período ativo (primeiro não-encerrado)
        $periodoAtivo = $anoLetivo->periodoAtivo();
        if (!$periodoAtivo || $periodoAtivo->id !== $periodo->id) {
            return response()->json(['message' => 'Só é possível fechar o período ativo atual.'], 422);
        }

        DB::transaction(function () use ($periodo, $anoLetivo) {
            // 1. Encerrar o período
            $periodo->update([
                'encerrado' => true,
                'encerrado_em' => now(),
                'encerrado_por' => auth()->id(),
            ]);

            // 2. Calcular médias de todos os alunos para este período
            $turmas = Turma::where('ano_letivo_id', $anoLetivo->id)
                ->where('ativa', true)
                ->with('disciplinas')
                ->get();

            foreach ($turmas as $turma) {
                $matriculas = Matricula::where('turma_id', $turma->id)
                    ->where('situacao', 'ativa')
                    ->get();

                foreach ($turma->disciplinas as $disciplina) {
                    foreach ($matriculas as $matricula) {
                        $mediaValor = Nota::where('matricula_id', $matricula->id)
                            ->where('disciplina_id', $disciplina->id)
                            ->where('periodo_id', $periodo->id)
                            ->avg('valor') ?? 0;

                        MediaPeriodo::updateOrCreate(
                            [
                                'matricula_id' => $matricula->id,
                                'disciplina_id' => $disciplina->id,
                                'periodo_id' => $periodo->id,
                            ],
                            [
                                'media' => round($mediaValor, 2),
                                'situacao' => $mediaValor >= 5 ? 'aprovado' : ($mediaValor > 0 ? 'reprovado' : 'pendente'),
                            ]
                        );
                    }
                }

                // 3. Gerar boletins para cada matrícula
                foreach ($matriculas as $matricula) {
                    $notasPorDisciplina = [];

                    foreach ($turma->disciplinas as $disciplina) {
                        $nota = Nota::where('matricula_id', $matricula->id)
                            ->where('disciplina_id', $disciplina->id)
                            ->where('periodo_id', $periodo->id)
                            ->first();

                        $media = MediaPeriodo::where('matricula_id', $matricula->id)
                            ->where('disciplina_id', $disciplina->id)
                            ->where('periodo_id', $periodo->id)
                            ->first();

                        // Calcular frequência do período
                        $freqQuery = DB::table('frequencias as f')
                            ->join('aulas as a', 'a.id', '=', 'f.aula_id')
                            ->where('f.aluno_id', $matricula->aluno_id)
                            ->where('a.turma_id', $turma->id)
                            ->where('a.disciplina_id', $disciplina->id);

                        if ($periodo->data_inicio && $periodo->data_fim) {
                            $freqQuery->whereBetween('a.data_aula', [
                                $periodo->data_inicio->format('Y-m-d'),
                                $periodo->data_fim->format('Y-m-d'),
                            ]);
                        }

                        $freq = $freqQuery->select(
                            DB::raw('COUNT(*) as total'),
                            DB::raw('SUM(f.presente) as presentes')
                        )->first();

                        $notasPorDisciplina[] = [
                            'disciplina_id' => $disciplina->id,
                            'disciplina' => $disciplina->nome,
                            'nota' => $nota?->valor,
                            'media' => $media?->media,
                            'situacao' => $media?->situacao ?? 'pendente',
                            'total_aulas' => $freq->total ?? 0,
                            'presencas' => $freq->presentes ?? 0,
                            'faltas' => ($freq->total ?? 0) - ($freq->presentes ?? 0),
                            'frequencia_pct' => $freq->total > 0
                                ? round(($freq->presentes / $freq->total) * 100, 1)
                                : 0,
                        ];
                    }

                    Boletim::updateOrCreate(
                        [
                            'matricula_id' => $matricula->id,
                            'periodo_id' => $periodo->id,
                        ],
                        [
                            'ano_letivo_id' => $anoLetivo->id,
                            'dados' => [
                                'aluno' => $matricula->aluno?->nome,
                                'turma' => $turma->nome,
                                'periodo' => $periodo->nome,
                                'ano' => $anoLetivo->ano,
                                'disciplinas' => $notasPorDisciplina,
                                'gerado_em' => now()->format('Y-m-d H:i:s'),
                            ],
                            'gerado_por' => auth()->id(),
                        ]
                    );
                }
            }

            // 4. Se todos os períodos estão encerrados, encerrar o ano letivo
            $totalPeriodos = PeriodoAvaliacao::where('ano_letivo_id', $anoLetivo->id)->count();
            $totalEncerrados = PeriodoAvaliacao::where('ano_letivo_id', $anoLetivo->id)->where('encerrado', true)->count();
            if ($totalEncerrados >= $totalPeriodos) {
                $anoLetivo->update(['status' => 'encerrado']);
            }

            Auditoria::registrar('fechar_periodo', 'periodos_avaliacao', $periodo->id, null, [
                'periodo' => $periodo->nome,
                'ano' => $anoLetivo->ano,
            ]);
        });

        return response()->json([
            'message' => "Período \"{$periodo->nome}\" encerrado com sucesso. Boletins gerados.",
        ]);
    }

    /**
     * GET /api/boletins
     * Retorna boletins de um período (ou do período ativo)
     */
    public function boletins(Request $request): JsonResponse
    {
        $query = Boletim::with(['matricula.aluno', 'periodo', 'anoLetivo']);

        if ($request->filled('periodo_id')) {
            $query->where('periodo_id', $request->periodo_id);
        }

        if ($request->filled('ano_letivo_id')) {
            $query->where('ano_letivo_id', $request->ano_letivo_id);
        }

        if ($request->filled('matricula_id')) {
            $query->where('matricula_id', $request->matricula_id);
        }

        if ($request->filled('aluno_id')) {
            $query->whereHas('matricula', fn($q) => $q->where('aluno_id', $request->aluno_id));
        }

        $boletins = $query->orderBy('gerado_em', 'desc')->get();

        return response()->json($boletins);
    }

    /**
     * GET /api/boletins/{id}
     * Retorna um boletim específico
     */
    public function boletimDetalhe(int $id): JsonResponse
    {
        $boletim = Boletim::with(['matricula.aluno', 'periodo', 'anoLetivo'])->findOrFail($id);
        return response()->json($boletim);
    }

    // ═══════════════════════════════════════════════════════
    // PERÍODOS AVALIAÇÃO — listagem/edição (compat.)
    // ═══════════════════════════════════════════════════════

    public function periodosAvaliacao(): JsonResponse
    {
        return response()->json(
            AnoLetivo::with(['periodos' => fn($q) => $q->orderBy('ordem')])
                ->orderBy('ano', 'desc')
                ->get()
                ->map(function ($ano) {
                    return [
                        'id' => $ano->id,
                        'ano' => $ano->ano,
                        'modelo_periodo' => $ano->modelo_periodo,
                        'status' => $ano->status,
                        'ativo' => $ano->ativo,
                        'periodos' => $ano->periodos->map(fn($p) => [
                            'id' => $p->id,
                            'nome' => $p->nome,
                            'ordem' => $p->ordem,
                            'ano_letivo_id' => $p->ano_letivo_id,
                            'data_inicio' => $p->data_inicio?->format('Y-m-d'),
                            'data_fim' => $p->data_fim?->format('Y-m-d'),
                            'encerrado' => $p->encerrado,
                            'encerrado_em' => $p->encerrado_em?->format('Y-m-d H:i:s'),
                        ]),
                    ];
                })
        );
    }

    public function storePeriodoAvaliacao(Request $request): JsonResponse
    {
        $request->validate(['nome' => 'required|string|max:50']);
        $anoId = $request->input('ano_letivo_id')
            ?? AnoLetivo::where('ativo', true)->first()?->id
            ?? AnoLetivo::latest('id')->first()?->id;

        if (!$anoId) {
            return response()->json(['message' => 'Cadastre um Ano Letivo primeiro.'], 422);
        }

        $ordem = (PeriodoAvaliacao::where('ano_letivo_id', $anoId)->max('ordem') ?? 0) + 1;
        $item = PeriodoAvaliacao::create([
            'nome' => $request->nome,
            'ano_letivo_id' => $anoId,
            'ordem' => $ordem,
            'encerrado' => false,
        ]);

        return response()->json($item, 201);
    }

    public function updatePeriodoAvaliacao(Request $request, int $id): JsonResponse
    {
        $periodo = PeriodoAvaliacao::findOrFail($id);

        if ($periodo->encerrado) {
            return response()->json(['message' => 'Não é possível editar um período já encerrado.'], 422);
        }

        $request->validate([
            'nome' => 'sometimes|required|string|max:50',
            'data_inicio' => 'sometimes|date',
            'data_fim' => 'sometimes|date',
        ]);

        $periodo->fill($request->only(['nome', 'data_inicio', 'data_fim']));
        if ($request->has('ordem')) {
            $periodo->ordem = (int) $request->input('ordem');
        }
        $periodo->save();

        return response()->json($periodo);
    }

    public function destroyPeriodoAvaliacao(int $id): JsonResponse
    {
        $periodo = PeriodoAvaliacao::findOrFail($id);

        if ($periodo->encerrado) {
            return response()->json(['message' => 'Não é possível excluir um período já encerrado.'], 422);
        }
        if ($periodo->notas()->exists()) {
            return response()->json(['message' => 'Não é possível excluir período com notas lançadas.'], 422);
        }

        $periodo->delete();
        return response()->json(null, 204);
    }

    // ═══════════════════════════════════════════════════════
    // DISCIPLINAS
    // ═══════════════════════════════════════════════════════

    public function disciplinas(): JsonResponse
    {
        $cursoId = request()->integer('curso_id');
        $usaVinculoCurso = Schema::hasTable('curso_disciplina');
        $query = Disciplina::query()->orderBy('nome');

        if ($usaVinculoCurso) {
            $query->with('cursos:id,nome');
        }

        if ($cursoId && $usaVinculoCurso) {
            $query->whereHas('cursos', fn($q) => $q->where('niveis_ensino.id', $cursoId));
        }

        $items = $query->get()->map(function (Disciplina $disciplina) use ($usaVinculoCurso) {
            return [
                'id' => $disciplina->id,
                'nome' => $disciplina->nome,
                'codigo' => $disciplina->codigo,
                'carga_horaria_semanal' => $disciplina->carga_horaria_semanal,
                'ativa' => $disciplina->ativa,
                'cursos' => $usaVinculoCurso
                    ? $disciplina->cursos->map(fn($c) => ['id' => $c->id, 'nome' => $c->nome])->values()
                    : [],
                'curso_ids' => $usaVinculoCurso
                    ? $disciplina->cursos->pluck('id')->map(fn($id) => (int) $id)->values()
                    : [],
            ];
        });

        return response()->json($items);
    }

    public function storeDisciplina(Request $request): JsonResponse
    {
        if (!Schema::hasTable('curso_disciplina')) {
            return response()->json([
                'message' => 'Estrutura de vinculo curso-disciplina nao encontrada.',
                'hint' => 'Execute o script banco-de-dados/008_create_curso_disciplina_table.sql.',
            ], 422);
        }

        $request->validate([
            'nome' => 'required|string|max:100',
            'codigo' => 'nullable|string|max:20|unique:disciplinas,codigo',
            'carga_horaria_semanal' => 'nullable|integer|min:1|max:20',
            'curso_ids' => 'required|array|min:1',
            'curso_ids.*' => 'integer|exists:niveis_ensino,id',
        ]);

        $item = DB::transaction(function () use ($request) {
            $disciplina = Disciplina::create([
                'nome' => $request->nome,
                'codigo' => $request->input('codigo'),
                'carga_horaria_semanal' => $request->input('carga_horaria_semanal', 2),
                'ativa' => true,
            ]);
            $disciplina->cursos()->sync($request->input('curso_ids', []));

            return $disciplina;
        });

        return response()->json($item->load('cursos:id,nome'), 201);
    }

    public function updateDisciplina(Request $request, int $id): JsonResponse
    {
        if (!Schema::hasTable('curso_disciplina')) {
            return response()->json([
                'message' => 'Estrutura de vinculo curso-disciplina nao encontrada.',
                'hint' => 'Execute o script banco-de-dados/008_create_curso_disciplina_table.sql.',
            ], 422);
        }

        $item = Disciplina::findOrFail($id);
        $request->validate([
            'nome' => 'sometimes|required|string|max:100',
            'codigo' => "nullable|string|max:20|unique:disciplinas,codigo,{$id}",
            'carga_horaria_semanal' => 'sometimes|integer|min:1|max:20',
            'ativa' => 'sometimes|boolean',
            'curso_ids' => 'sometimes|array|min:1',
            'curso_ids.*' => 'integer|exists:niveis_ensino,id',
        ]);

        DB::transaction(function () use ($item, $request) {
            $item->fill($request->only(['nome', 'codigo', 'carga_horaria_semanal', 'ativa']));
            $item->save();

            if ($request->has('curso_ids')) {
                $item->cursos()->sync($request->input('curso_ids', []));
            }
        });

        return response()->json($item->fresh()->load('cursos:id,nome'));
    }

    public function destroyDisciplina(int $id): JsonResponse
    {
        $item = Disciplina::findOrFail($id);

        $deps = array_filter([
            ['type' => 'turmas', 'count' => DB::table('grade_curricular')->where('disciplina_id', $id)->count()],
            ['type' => 'horarios', 'count' => DB::table('horarios')->where('disciplina_id', $id)->count()],
            ['type' => 'aulas', 'count' => DB::table('aulas')->where('disciplina_id', $id)->count()],
            ['type' => 'notas', 'count' => DB::table('notas')->where('disciplina_id', $id)->count()],
        ], fn($d) => $d['count'] > 0);

        if (!empty($deps)) {
            return $this->dependencyError(
                "Não é possível excluir a disciplina \"{$item->nome}\" porque ela possui vínculos ativos.",
                'Remova primeiro os vínculos da disciplina.',
                array_values($deps)
            );
        }

        $item->delete();
        return response()->json(null, 204);
    }

    // ═══════════════════════════════════════════════════════
    // SÉRIES, PLANOS, NÍVEIS, SALAS, CURSOS
    // ═══════════════════════════════════════════════════════

    public function series(): JsonResponse
    {
        return response()->json(Serie::with('nivel')->orderBy('ordem')->get());
    }

    public function storeSerie(Request $request): JsonResponse
    {
        $request->validate(['nome' => 'required|string|max:80']);
        $nivelId = $request->input('nivel_id') ?? NivelEnsino::first()?->id;
        if (!$nivelId) {
            $nivel = NivelEnsino::create(['nome' => 'Ensino Fundamental']);
            $nivelId = $nivel->id;
        }
        $ordem = (Serie::where('nivel_id', $nivelId)->max('ordem') ?? 0) + 1;
        $item = Serie::create(['nome' => $request->nome, 'nivel_id' => $nivelId, 'ordem' => $ordem]);
        return response()->json($item->load('nivel'), 201);
    }

    public function planosPagamento(): JsonResponse
    {
        return response()->json(PlanoPagamento::orderBy('nome')->get());
    }

    public function storePlanoPagamento(Request $request): JsonResponse
    {
        $request->validate(['nome' => 'required|string|max:100']);
        $item = PlanoPagamento::create([
            'nome' => $request->nome,
            'descricao' => $request->input('descricao'),
            'valor_mensalidade' => $request->input('valor_mensalidade', $request->input('valor', 0)),
            'dia_vencimento' => $request->input('dia_vencimento', 10),
            'desconto_antecipado' => 0,
            'juros_atraso_diario' => 0.0033,
            'multa_atraso' => 2.00,
            'ativo' => true,
        ]);
        return response()->json($item, 201);
    }

    public function niveisEnsino(): JsonResponse
    {
        return response()->json(NivelEnsino::with('series')->get());
    }

    public function storeNivelEnsino(Request $request): JsonResponse
    {
        $request->validate(['nome' => 'required|string|max:80']);
        $item = NivelEnsino::create(['nome' => $request->nome, 'descricao' => $request->input('descricao')]);
        return response()->json($item, 201);
    }

    public function salas(): JsonResponse
    {
        return response()->json(Sala::orderBy('nome')->get());
    }

    public function storeSala(Request $request): JsonResponse
    {
        $request->validate(['nome' => 'required|string|max:100|unique:salas,nome']);
        $item = Sala::create(['nome' => $request->nome, 'descricao' => $request->input('descricao'), 'ativo' => true]);
        return response()->json($item, 201);
    }

    public function updateSala(Request $request, int $id): JsonResponse
    {
        $item = Sala::findOrFail($id);
        $request->validate(['nome' => "sometimes|required|string|max:100|unique:salas,nome,{$id}"]);
        $item->fill($request->only(['nome', 'descricao', 'ativo']));
        $item->save();
        return response()->json($item);
    }

    public function destroySala(int $id): JsonResponse
    {
        $item = Sala::findOrFail($id);
        $turmasComSala = Turma::where('sala', $item->nome)->count();
        if ($turmasComSala > 0) {
            return $this->dependencyError(
                "Não é possível excluir a sala \"{$item->nome}\".",
                'Edite as turmas vinculadas primeiro.',
                [['type' => 'turmas', 'count' => $turmasComSala]]
            );
        }
        $item->delete();
        return response()->json(null, 204);
    }

    public function cursos(): JsonResponse
    {
        return response()->json(NivelEnsino::all()->map(fn($n) => [
            'id' => $n->id, 'nome' => $n->nome, 'descricao' => $n->descricao ?? '', 'ativo' => true,
        ]));
    }

    public function storeCurso(Request $request): JsonResponse
    {
        $request->validate(['nome' => 'required|string|max:80']);
        $item = NivelEnsino::create(['nome' => $request->nome, 'descricao' => $request->input('descricao')]);
        return response()->json(['id' => $item->id, 'nome' => $item->nome, 'descricao' => $item->descricao ?? '', 'ativo' => true], 201);
    }

    public function updateCurso(Request $request, int $id): JsonResponse
    {
        $item = NivelEnsino::findOrFail($id);
        $item->fill($request->only(['nome', 'descricao']));
        $item->save();
        return response()->json(['id' => $item->id, 'nome' => $item->nome, 'descricao' => $item->descricao ?? '', 'ativo' => true]);
    }

    public function destroyCurso(int $id): JsonResponse
    {
        $item = NivelEnsino::findOrFail($id);
        $seriesIds = Serie::where('nivel_id', $item->id)->pluck('id');
        $turmasCount = Turma::whereIn('serie_id', $seriesIds)->count();
        $disciplinasVinculadas = DB::table('curso_disciplina')->where('curso_id', $item->id)->count();

        if ($turmasCount > 0 || $disciplinasVinculadas > 0) {
            $deps = [];
            if ($turmasCount > 0) $deps[] = ['type' => 'turmas', 'count' => $turmasCount];
            if ($disciplinasVinculadas > 0) $deps[] = ['type' => 'disciplinas', 'count' => $disciplinasVinculadas];
            return $this->dependencyError(
                "Nao e possivel excluir o curso \"{$item->nome}\".",
                'Remova primeiro os vinculos deste curso (turmas e disciplinas).',
                $deps
            );
        }

        // Limpa as series internas legadas quando nao ha turmas vinculadas
        Serie::where('nivel_id', $item->id)->delete();

        $item->delete();
        return response()->json(null, 204);
    }
}
