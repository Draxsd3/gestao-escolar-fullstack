<?php

namespace App\Http\Controllers;

use App\Models\{Matricula, Aluno, Turma, AnoLetivo, Auditoria, Contrato, Mensalidade, PlanoPagamento, Responsavel};
use Illuminate\Http\{Request, JsonResponse};
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class MatriculaController extends Controller
{
    private function normalizarFinanceiroVenda(array $financeiro): array
    {
        if (
            !isset($financeiro['valor_curso']) ||
            !isset($financeiro['quantidade_parcelas'])
        ) {
            return $financeiro;
        }

        $valorCurso = max((float) $financeiro['valor_curso'], 0);
        $entrada = max((float) ($financeiro['entrada_valor'] ?? 0), 0);
        $entrada = min($entrada, $valorCurso);
        $parcelas = max((int) $financeiro['quantidade_parcelas'], 1);

        $saldo = max($valorCurso - $entrada, 0);
        $valorMensal = round($saldo / $parcelas, 2);

        $financeiro['valor_curso'] = $valorCurso;
        $financeiro['entrada_valor'] = $entrada;
        $financeiro['quantidade_parcelas'] = $parcelas;
        $financeiro['valor_negociado'] = $valorMensal;

        if (!empty($entrada)) {
            $obsEntrada = 'Entrada na venda: R$ ' . number_format($entrada, 2, '.', '');
            $financeiro['observacoes_mensalidade'] = trim(
                (($financeiro['observacoes_mensalidade'] ?? '') . ' ' . $obsEntrada)
            );
        }

        return $financeiro;
    }

    private function faixaCompetenciaDoContrato(Matricula $matricula, array $financeiro): array
    {
        $financeiro = $this->normalizarFinanceiroVenda($financeiro);

        $inicio = isset($financeiro['competencia'])
            ? Carbon::parse($financeiro['competencia'] . '-01')->startOfMonth()
            : Carbon::parse($matricula->data_matricula)->startOfMonth();

        if (!empty($financeiro['quantidade_parcelas'])) {
            $fim = $inicio->copy()->addMonths(((int) $financeiro['quantidade_parcelas']) - 1);
        } else {
            $anoLetivo = $matricula->anoLetivo()->first();
            $fim = $anoLetivo?->data_fim
                ? Carbon::parse($anoLetivo->data_fim)->startOfMonth()
                : $inicio->copy();
        }

        if ($fim->lt($inicio)) {
            $fim = $inicio->copy();
        }

        return [$inicio, $fim];
    }

    private function gerarMensalidadesRecorrentes(
        Contrato $contrato,
        PlanoPagamento $plano,
        Carbon $inicio,
        Carbon $fim,
        string $situacaoPrimeira = 'pendente',
        ?string $dataPagamentoPrimeira = null,
        ?string $obsPrimeira = null
    ): void {
        $base = $contrato->valor_negociado !== null
            ? (float) $contrato->valor_negociado
            : (float) $plano->valor_mensalidade;
        $descontoPct = (float) ($contrato->desconto_pct ?? 0);
        $valorDesconto = round($base * ($descontoPct / 100), 2);
        $valorFinal = round($base - $valorDesconto, 2);

        $cursor = $inicio->copy();
        $primeira = true;

        while ($cursor->lte($fim)) {
            $existe = Mensalidade::where('contrato_id', $contrato->id)
                ->whereYear('competencia', $cursor->year)
                ->whereMonth('competencia', $cursor->month)
                ->exists();

            if (!$existe) {
                $diaVencimento = min((int) $plano->dia_vencimento, $cursor->daysInMonth);
                $situacao = $primeira ? $situacaoPrimeira : 'pendente';

                Mensalidade::create([
                    'contrato_id' => $contrato->id,
                    'competencia' => $cursor->format('Y-m-01'),
                    'valor_original' => $base,
                    'valor_desconto' => $valorDesconto,
                    'valor_acrescimo' => 0,
                    'valor_final' => $valorFinal,
                    'data_vencimento' => $cursor->copy()->day($diaVencimento)->format('Y-m-d'),
                    'situacao' => $situacao,
                    'data_pagamento' => $primeira && $situacao === 'pago'
                        ? ($dataPagamentoPrimeira ?? now()->toDateString())
                        : null,
                    'observacoes' => $primeira ? $obsPrimeira : null,
                ]);
            }

            $primeira = false;
            $cursor->addMonth();
        }
    }

    private function resolverResponsavelFinanceiro(Matricula $matricula, ?int $responsavelId): Responsavel
    {
        $aluno = $matricula->aluno()->with('responsaveis')->first();

        if ($responsavelId) {
            return Responsavel::findOrFail($responsavelId);
        }

        $responsavel = $aluno?->responsaveis?->firstWhere('pivot.responsavel_financeiro', true);
        if (!$responsavel) {
            $responsavel = $aluno?->responsaveis?->first();
        }

        if (!$responsavel) {
            $responsavelExistenteContrato = $matricula->contrato?->responsavel_id
                ? Responsavel::find($matricula->contrato->responsavel_id)
                : null;
            if ($responsavelExistenteContrato) {
                return $responsavelExistenteContrato;
            }

            throw ValidationException::withMessages([
                'financeiro.responsavel_id' => ['Aluno sem responsavel vinculado. Defina o responsavel financeiro no cadastro do aluno (aba Responsavel).'],
            ]);
        }

        return $responsavel;
    }

    private function criarFinanceiroDaMatricula(Matricula $matricula, array $financeiro): void
    {
        $financeiro = $this->normalizarFinanceiroVenda($financeiro);
        $plano = PlanoPagamento::where('ativo', true)->findOrFail((int) $financeiro['plano_id']);
        $responsavel = $this->resolverResponsavelFinanceiro(
            $matricula,
            isset($financeiro['responsavel_id']) ? (int) $financeiro['responsavel_id'] : null
        );

        [$inicioContrato, $fimContrato] = $this->faixaCompetenciaDoContrato($matricula, $financeiro);

        $contrato = Contrato::create([
            'matricula_id' => $matricula->id,
            'responsavel_id' => $responsavel->id,
            'plano_id' => $plano->id,
            'valor_negociado' => $financeiro['valor_negociado'] ?? null,
            'desconto_pct' => $financeiro['desconto_pct'] ?? 0,
            'desconto_motivo' => $financeiro['desconto_motivo'] ?? null,
            'data_inicio' => $inicioContrato->format('Y-m-d'),
            'data_fim' => $fimContrato->format('Y-m-d'),
            'ativo' => true,
            'criado_por' => auth()->id(),
        ]);

        if (!($financeiro['gerar_mensalidade_inicial'] ?? true)) {
            return;
        }

        $this->gerarMensalidadesRecorrentes(
            $contrato,
            $plano,
            $inicioContrato,
            $fimContrato,
            $financeiro['situacao_inicial'] ?? 'pendente',
            $financeiro['data_pagamento'] ?? null,
            $financeiro['observacoes_mensalidade'] ?? null
        );
    }

    private function atualizarFinanceiroDaMatricula(Matricula $matricula, array $financeiro): void
    {
        $financeiro = $this->normalizarFinanceiroVenda($financeiro);
        $plano = PlanoPagamento::where('ativo', true)->findOrFail((int) $financeiro['plano_id']);
        $responsavel = $this->resolverResponsavelFinanceiro(
            $matricula,
            isset($financeiro['responsavel_id']) ? (int) $financeiro['responsavel_id'] : null
        );

        $contrato = Contrato::firstOrNew(['matricula_id' => $matricula->id]);
        if (!$contrato->exists) {
            $contrato->criado_por = auth()->id();
            $contrato->ativo = true;
            $contrato->data_inicio = $matricula->data_matricula;
        }

        [$inicioContrato, $fimContrato] = $this->faixaCompetenciaDoContrato($matricula, $financeiro);

        $contrato->responsavel_id = $responsavel->id;
        $contrato->plano_id = $plano->id;
        $contrato->valor_negociado = $financeiro['valor_negociado'] ?? null;
        $contrato->desconto_pct = $financeiro['desconto_pct'] ?? 0;
        $contrato->desconto_motivo = $financeiro['desconto_motivo'] ?? null;
        $contrato->data_inicio = $inicioContrato->format('Y-m-d');
        $contrato->data_fim = $fimContrato->format('Y-m-d');
        $contrato->save();

        if (!array_key_exists('mensalidade', $financeiro) && !array_key_exists('situacao_inicial', $financeiro)) {
            return;
        }

        $mensalidadeData = $financeiro['mensalidade'] ?? $financeiro;
        $this->gerarMensalidadesRecorrentes(
            $contrato,
            $plano,
            $inicioContrato,
            $fimContrato,
            $mensalidadeData['situacao_inicial'] ?? $mensalidadeData['situacao'] ?? 'pendente',
            $mensalidadeData['data_pagamento'] ?? null,
            $mensalidadeData['observacoes_mensalidade'] ?? $mensalidadeData['observacoes'] ?? null
        );
    }

    public function index(Request $request): JsonResponse
    {
        $query = Matricula::with([
            'aluno',
            'turma.serie.nivel',
            'anoLetivo',
            'contrato.plano',
            'contrato.mensalidades',
        ])
            ->when($request->turma_id, fn($q) => $q->where('turma_id', $request->turma_id))
            ->when($request->situacao,  fn($q) => $q->where('situacao', $request->situacao))
            ->when($request->ano_letivo_id, fn($q) => $q->where('ano_letivo_id', $request->ano_letivo_id));

        return response()->json($query->orderBy('id', 'desc')->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'aluno_id'     => ['required', 'exists:alunos,id'],
            'turma_id'     => ['required', 'exists:turmas,id'],
            'ano_letivo_id'=> ['required', 'exists:anos_letivos,id'],
            'data_matricula'=> ['required', 'date'],
            'observacoes'  => ['nullable', 'string'],
        ]);

        // Verificar duplicidade na mesma turma/ano
        $existe = Matricula::where('aluno_id', $data['aluno_id'])
            ->where('turma_id', $data['turma_id'])
            ->where('ano_letivo_id', $data['ano_letivo_id'])
            ->whereIn('situacao', ['ativa', 'trancada'])
            ->exists();

        if ($existe) {
            return response()->json(['message' => 'Aluno ja possui matricula ativa/trancada nesta turma para o ano letivo informado.'], 422);
        }

        // Verificar vagas
        $turma = Turma::findOrFail($data['turma_id']);
        if ($turma->vagas_disponiveis <= 0) {
            return response()->json(['message' => 'Turma sem vagas disponíveis.'], 422);
        }

        AnoLetivo::findOrFail($data['ano_letivo_id']);
        $data['numero_matricula'] = Matricula::gerarNumero((int) $data['ano_letivo_id'], (int) $data['turma_id']);
        $data['criado_por'] = auth()->id();

        $matricula = Matricula::create($data);

        Auditoria::registrar('matricular', 'matriculas', $matricula->id, null, $matricula->toArray());

        return response()->json($matricula->load(['aluno', 'turma', 'anoLetivo']), 201);
    }

    public function storeLote(Request $request): JsonResponse
    {
        $data = $request->validate([
            'aluno_id'      => ['required', 'exists:alunos,id'],
            'turma_ids'     => ['required', 'array', 'min:1'],
            'turma_ids.*'   => ['required', 'integer', 'exists:turmas,id', 'distinct'],
            'ano_letivo_id' => ['required', 'exists:anos_letivos,id'],
            'data_matricula'=> ['required', 'date'],
            'observacoes'   => ['nullable', 'string'],
            'financeiro' => ['nullable', 'array'],
            'financeiro.plano_id' => ['required_with:financeiro', 'integer', 'exists:planos_pagamento,id'],
            'financeiro.responsavel_id' => ['nullable', 'integer', 'exists:responsaveis,id'],
            'financeiro.valor_negociado' => ['nullable', 'numeric', 'min:0'],
            'financeiro.desconto_pct' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'financeiro.desconto_motivo' => ['nullable', 'string', 'max:200'],
            'financeiro.gerar_mensalidade_inicial' => ['nullable', 'boolean'],
            'financeiro.competencia' => ['nullable', 'date_format:Y-m'],
            'financeiro.situacao_inicial' => ['nullable', 'in:pendente,pago,isento,cancelado,parcial'],
            'financeiro.data_pagamento' => ['nullable', 'date'],
            'financeiro.observacoes_mensalidade' => ['nullable', 'string'],
            'financeiro.valor_curso' => ['nullable', 'numeric', 'min:0'],
            'financeiro.entrada_valor' => ['nullable', 'numeric', 'min:0'],
            'financeiro.quantidade_parcelas' => ['nullable', 'integer', 'min:1', 'max:60'],
        ]);

        if (
            isset($data['financeiro']['situacao_inicial']) &&
            $data['financeiro']['situacao_inicial'] === 'pago' &&
            empty($data['financeiro']['data_pagamento'])
        ) {
            return response()->json([
                'message' => 'Informe a data de pagamento quando a mensalidade inicial estiver como paga.',
            ], 422);
        }
        if (
            !empty($data['financeiro']) &&
            (
                isset($data['financeiro']['valor_curso']) ||
                isset($data['financeiro']['quantidade_parcelas']) ||
                isset($data['financeiro']['entrada_valor'])
            )
        ) {
            if (
                !isset($data['financeiro']['valor_curso']) ||
                !isset($data['financeiro']['quantidade_parcelas'])
            ) {
                return response()->json([
                    'message' => 'Informe valor do curso e quantidade de parcelas no lancamento da venda.',
                ], 422);
            }
            if (
                isset($data['financeiro']['entrada_valor']) &&
                (float) $data['financeiro']['entrada_valor'] > (float) $data['financeiro']['valor_curso']
            ) {
                return response()->json([
                    'message' => 'A entrada nao pode ser maior que o valor do curso.',
                ], 422);
            }
        }

        Aluno::findOrFail((int) $data['aluno_id']);
        AnoLetivo::findOrFail((int) $data['ano_letivo_id']);

        $criados = [];
        $erros = [];

        DB::transaction(function () use ($data, &$criados, &$erros) {
            foreach ($data['turma_ids'] as $turmaId) {
                $turmaId = (int) $turmaId;

                $existe = Matricula::where('aluno_id', $data['aluno_id'])
                    ->where('turma_id', $turmaId)
                    ->where('ano_letivo_id', $data['ano_letivo_id'])
                    ->whereIn('situacao', ['ativa', 'trancada'])
                    ->exists();

                if ($existe) {
                    $erros[] = [
                        'turma_id' => $turmaId,
                        'message' => 'Ja existe matricula ativa/trancada para esta turma no ano letivo informado.',
                    ];
                    continue;
                }

                $turma = Turma::findOrFail($turmaId);
                if ($turma->vagas_disponiveis <= 0) {
                    $erros[] = [
                        'turma_id' => $turmaId,
                        'message' => 'Turma sem vagas disponiveis.',
                    ];
                    continue;
                }

                $nova = Matricula::create([
                    'aluno_id' => $data['aluno_id'],
                    'turma_id' => $turmaId,
                    'ano_letivo_id' => $data['ano_letivo_id'],
                    'numero_matricula' => Matricula::gerarNumero((int) $data['ano_letivo_id'], $turmaId),
                    'data_matricula' => $data['data_matricula'],
                    'situacao' => 'ativa',
                    'observacoes' => $data['observacoes'] ?? null,
                    'criado_por' => auth()->id(),
                ]);

                if (!empty($data['financeiro'])) {
                    $this->criarFinanceiroDaMatricula($nova, $data['financeiro']);
                }

                Auditoria::registrar('matricular_lote', 'matriculas', $nova->id, null, $nova->toArray());
                $criados[] = $nova->id;
            }
        });

        $matriculas = Matricula::with(['aluno', 'turma', 'anoLetivo'])
            ->whereIn('id', $criados)
            ->get();

        return response()->json([
            'message' => count($criados) > 0
                ? 'Matriculas processadas com sucesso.'
                : 'Nenhuma matricula foi criada.',
            'criados' => count($criados),
            'erros' => $erros,
            'matriculas' => $matriculas,
        ], count($criados) > 0 ? 201 : 422);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $matricula = Matricula::with(['aluno.responsaveis', 'contrato'])->findOrFail($id);
        $antes = $matricula->toArray();

        $data = $request->validate([
            'situacao'    => ['sometimes', 'in:ativa,trancada,transferida,concluida,cancelada'],
            'turma_id'    => ['sometimes', 'exists:turmas,id'],
            'observacoes' => ['nullable', 'string'],
            'financeiro' => ['nullable', 'array'],
            'financeiro.plano_id' => ['required_with:financeiro', 'integer', 'exists:planos_pagamento,id'],
            'financeiro.responsavel_id' => ['nullable', 'integer', 'exists:responsaveis,id'],
            'financeiro.valor_negociado' => ['nullable', 'numeric', 'min:0'],
            'financeiro.desconto_pct' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'financeiro.desconto_motivo' => ['nullable', 'string', 'max:200'],
            'financeiro.competencia' => ['nullable', 'date_format:Y-m'],
            'financeiro.situacao_inicial' => ['nullable', 'in:pendente,pago,isento,cancelado,parcial'],
            'financeiro.data_pagamento' => ['nullable', 'date'],
            'financeiro.observacoes_mensalidade' => ['nullable', 'string'],
            'financeiro.valor_curso' => ['nullable', 'numeric', 'min:0'],
            'financeiro.entrada_valor' => ['nullable', 'numeric', 'min:0'],
            'financeiro.quantidade_parcelas' => ['nullable', 'integer', 'min:1', 'max:60'],
        ]);

        if (
            isset($data['financeiro']['situacao_inicial']) &&
            $data['financeiro']['situacao_inicial'] === 'pago' &&
            empty($data['financeiro']['data_pagamento'])
        ) {
            return response()->json([
                'message' => 'Informe a data de pagamento quando a mensalidade estiver como paga.',
            ], 422);
        }
        if (
            !empty($data['financeiro']) &&
            (
                isset($data['financeiro']['valor_curso']) ||
                isset($data['financeiro']['quantidade_parcelas']) ||
                isset($data['financeiro']['entrada_valor'])
            )
        ) {
            if (
                !isset($data['financeiro']['valor_curso']) ||
                !isset($data['financeiro']['quantidade_parcelas'])
            ) {
                return response()->json([
                    'message' => 'Informe valor do curso e quantidade de parcelas no lancamento da venda.',
                ], 422);
            }
            if (
                isset($data['financeiro']['entrada_valor']) &&
                (float) $data['financeiro']['entrada_valor'] > (float) $data['financeiro']['valor_curso']
            ) {
                return response()->json([
                    'message' => 'A entrada nao pode ser maior que o valor do curso.',
                ], 422);
            }
        }

        DB::transaction(function () use ($matricula, $data) {
            $dadosMatricula = collect($data)->except('financeiro')->toArray();
            if (!empty($dadosMatricula)) {
                $matricula->update($dadosMatricula);
            }

            if (!empty($data['financeiro'])) {
                $this->atualizarFinanceiroDaMatricula($matricula->fresh(), $data['financeiro']);
            }
        });

        Auditoria::registrar('editar_matricula', 'matriculas', $id, $antes, $matricula->fresh()->toArray());

        return response()->json($matricula->fresh()->load(['aluno', 'turma', 'contrato.plano', 'contrato.mensalidades']));
    }
}
