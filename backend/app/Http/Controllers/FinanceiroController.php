<?php

namespace App\Http\Controllers;

use App\Models\{Contrato, Mensalidade, Recebimento, Matricula, Responsavel, PlanoPagamento, Auditoria};
use Illuminate\Http\{Request, JsonResponse};
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class FinanceiroController extends Controller
{
    private function somaRecebidoAtivo(int $mensalidadeId): float
    {
        return (float) Recebimento::where('mensalidade_id', $mensalidadeId)
            ->whereNull('estornado_em')
            ->sum('valor');
    }

    private function recalcularSituacaoMensalidade(Mensalidade $mensalidade): void
    {
        $totalPago = $this->somaRecebidoAtivo($mensalidade->id);

        if ($totalPago >= (float) $mensalidade->valor_final) {
            $ultimaData = Recebimento::where('mensalidade_id', $mensalidade->id)
                ->whereNull('estornado_em')
                ->orderByDesc('data_recebimento')
                ->value('data_recebimento');

            $mensalidade->update([
                'situacao' => 'pago',
                'data_pagamento' => $ultimaData,
            ]);
            return;
        }

        if ($totalPago > 0) {
            $mensalidade->update([
                'situacao' => 'parcial',
                'data_pagamento' => null,
            ]);
            return;
        }

        $mensalidade->update([
            'situacao' => 'pendente',
            'data_pagamento' => null,
        ]);
    }

    private function carregarMensalidadeComRecebimentos(int $mensalidadeId): Mensalidade
    {
        return Mensalidade::with([
            'contrato.matricula.aluno',
            'contrato.responsavel',
            'contrato.plano',
            'recebimentos' => fn($q) => $q
                ->with(['registradoPor:id,nome', 'estornadoPor:id,nome'])
                ->orderByDesc('id'),
        ])->findOrFail($mensalidadeId);
    }

    private function gerarMensalidadesDoContrato(Contrato $contrato, Carbon $inicio, Carbon $fim): void
    {
        $plano = $contrato->plano;
        if (!$plano) {
            return;
        }

        $base = $contrato->valor_negociado !== null
            ? (float) $contrato->valor_negociado
            : (float) $plano->valor_mensalidade;
        $descontoPct = (float) ($contrato->desconto_pct ?? 0);
        $valorDesconto = round($base * ($descontoPct / 100), 2);
        $valorFinal = round($base - $valorDesconto, 2);

        $cursor = $inicio->copy();
        while ($cursor->lte($fim)) {
            $existe = Mensalidade::where('contrato_id', $contrato->id)
                ->whereYear('competencia', $cursor->year)
                ->whereMonth('competencia', $cursor->month)
                ->exists();

            if (!$existe) {
                $diaVencimento = min((int) $plano->dia_vencimento, $cursor->daysInMonth);
                Mensalidade::create([
                    'contrato_id' => $contrato->id,
                    'competencia' => $cursor->format('Y-m-01'),
                    'valor_original' => $base,
                    'valor_desconto' => $valorDesconto,
                    'valor_acrescimo' => 0,
                    'valor_final' => $valorFinal,
                    'data_vencimento' => $cursor->copy()->day($diaVencimento)->format('Y-m-d'),
                    'situacao' => 'pendente',
                ]);
            }

            $cursor->addMonth();
        }
    }

    private function assegurarMensalidadesIniciais(): void
    {
        $contratos = Contrato::with('plano')
            ->where('ativo', true)
            ->get();

        foreach ($contratos as $contrato) {
            if (!$contrato->plano) {
                continue;
            }

            $inicio = Carbon::parse($contrato->data_inicio ?? now())->startOfMonth();
            $fim = $contrato->data_fim
                ? Carbon::parse($contrato->data_fim)->startOfMonth()
                : now()->startOfMonth();
            if ($fim->lt($inicio)) {
                $fim = $inicio->copy();
            }

            $this->gerarMensalidadesDoContrato($contrato, $inicio, $fim);
        }
    }

    private function consolidarInadimplencia()
    {
        $this->assegurarMensalidadesIniciais();
        $hoje = now()->startOfDay();

        $mensalidades = Mensalidade::with([
                'contrato.matricula.aluno',
                'contrato.responsavel',
                'contrato.plano',
            ])
            ->withSum(['recebimentos as total_recebido' => fn($q) => $q->whereNull('estornado_em')], 'valor')
            ->whereNotIn('situacao', ['cancelado', 'isento'])
            ->whereDate('data_vencimento', '<', $hoje)
            ->get();

        $linhas = $mensalidades->map(function ($m) use ($hoje) {
            if (!$m->contrato || !$m->contrato->matricula) {
                return null;
            }

            $pago = (float) ($m->total_recebido ?? 0);
            $saldoBase = max((float) $m->valor_final - $pago, 0);
            if ($saldoBase <= 0) return null;

            $diasAtraso = $hoje->diffInDays($m->data_vencimento);
            $jurosDiario = (float) ($m->contrato->plano->juros_atraso_diario ?? 0.0033);
            $multaPct = (float) ($m->contrato->plano->multa_atraso ?? 2);

            $juros = round($saldoBase * $jurosDiario * $diasAtraso, 2);
            $multa = round($saldoBase * ($multaPct / 100), 2);
            $totalDevido = round($saldoBase + $juros + $multa, 2);

            return [
                'mensalidade_id' => $m->id,
                'contrato_id' => $m->contrato_id,
                'aluno_id' => $m->contrato->matricula->aluno->id ?? null,
                'aluno' => $m->contrato->matricula->aluno->nome ?? '-',
                'responsavel' => $m->contrato->responsavel->nome ?? '-',
                'competencia' => $m->competencia?->format('m/Y'),
                'vencimento_iso' => optional($m->data_vencimento)->format('Y-m-d'),
                'vencimento' => $m->data_vencimento?->format('d/m/Y'),
                'dias_atraso' => $diasAtraso,
                'valor_em_aberto' => round($saldoBase, 2),
                'juros' => $juros,
                'multa' => $multa,
                'total_devido' => $totalDevido,
            ];
        })->filter()->values();

        $agregado = $linhas
            ->groupBy(fn($x) => (string) ($x['aluno_id'] ?? 'sem_aluno') . '-' . (string) $x['contrato_id'])
            ->map(function ($grupo) {
                $ordenado = collect($grupo)->sortBy('vencimento_iso')->values();
                $primeiro = $ordenado->first();
                $valorTotal = round($ordenado->sum('total_devido'), 2);

                return [
                    'aluno' => $primeiro['aluno'],
                    'responsavel' => $primeiro['responsavel'],
                    'meses' => $ordenado->count(),
                    'valor_total' => $valorTotal,
                    'vencimento_mais_antigo' => $primeiro['vencimento_iso'],
                    'dias_atraso_max' => (int) $ordenado->max('dias_atraso'),
                ];
            })
            ->sortByDesc('valor_total')
            ->values();

        return [
            'linhas' => $linhas,
            'agregado' => $agregado,
        ];
    }

    public function planosDisponiveis(): JsonResponse
    {
        $planos = PlanoPagamento::where('ativo', true)
            ->orderBy('nome')
            ->get(['id', 'nome', 'valor_mensalidade', 'dia_vencimento']);

        return response()->json($planos);
    }

    public function mensalidades(Request $request): JsonResponse
    {
        $this->assegurarMensalidadesIniciais();

        $query = Mensalidade::with([
                'contrato.matricula.aluno',
                'contrato.responsavel',
                'contrato.plano',
                'recebimentos' => fn($q) => $q
                    ->with(['registradoPor:id,nome', 'estornadoPor:id,nome'])
                    ->orderByDesc('id'),
            ])
            ->when($request->situacao, fn($q) => $q->where('situacao', $request->situacao))
            ->when($request->competencia, fn($q) => $q->whereYear('competencia', substr($request->competencia, 0, 4))
                ->whereMonth('competencia', substr($request->competencia, 5, 2)));

        if ($request->filled('busca')) {
            $query->whereHas('contrato.matricula.aluno', fn($q) =>
                $q->where('nome', 'like', "%{$request->busca}%")
            );
        }

        return response()->json($query->orderBy('data_vencimento')->paginate(20));
    }

    public function inadimplentes(Request $request): JsonResponse
    {
        $dados = $this->consolidarInadimplencia();
        return response()->json($dados['agregado']);
    }

    public function registrarRecebimento(Request $request): JsonResponse
    {
        $data = $request->validate([
            'mensalidade_id'  => ['required', 'exists:mensalidades,id'],
            'valor'           => ['required', 'numeric', 'min:0.01'],
            'forma_pagamento' => ['required', 'in:dinheiro,pix,boleto,cartao_credito,cartao_debito,transferencia,cheque'],
            'data_recebimento'=> ['required', 'date'],
            'numero_documento'=> ['nullable', 'string'],
            'observacoes'     => ['nullable', 'string'],
        ]);

        $mensalidade = Mensalidade::findOrFail($data['mensalidade_id']);

        $recebimentoCriado = null;

        DB::transaction(function () use ($data, $mensalidade, &$recebimentoCriado) {
            $recebimentoCriado = Recebimento::create([
                ...$data,
                'registrado_por' => auth()->id(),
            ]);
            $this->recalcularSituacaoMensalidade($mensalidade->fresh());

            Auditoria::registrar('recebimento', 'mensalidades', $mensalidade->id,
                ['situacao' => 'pendente'],
                ['situacao' => $mensalidade->fresh()->situacao, 'valor' => $data['valor']]
            );
        });

        $mensalidadeAtualizada = $this->carregarMensalidadeComRecebimentos($mensalidade->id);

        return response()->json([
            'message' => 'Recebimento registrado com sucesso.',
            'recebimento_id' => $recebimentoCriado?->id,
            'mensalidade' => $mensalidadeAtualizada,
        ]);
    }

    public function estornarRecebimento(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'motivo' => ['nullable', 'string', 'max:255'],
        ]);

        $recebimento = Recebimento::with('mensalidade')->findOrFail($id);
        if ($recebimento->estornado_em) {
            return response()->json(['message' => 'Este recebimento ja foi estornado.'], 422);
        }

        $antes = $recebimento->toArray();

        DB::transaction(function () use ($recebimento, $data, $antes) {
            $recebimento->update([
                'estornado_em' => now(),
                'estornado_por' => auth()->id(),
                'estorno_motivo' => $data['motivo'] ?? null,
            ]);

            $this->recalcularSituacaoMensalidade($recebimento->mensalidade()->firstOrFail());

            Auditoria::registrar(
                'estornar_recebimento',
                'recebimentos',
                $recebimento->id,
                $antes,
                $recebimento->fresh()->toArray()
            );
        });

        $mensalidadeAtualizada = $this->carregarMensalidadeComRecebimentos($recebimento->mensalidade_id);

        return response()->json([
            'message' => 'Pagamento estornado com sucesso.',
            'mensalidade' => $mensalidadeAtualizada,
        ]);
    }

    public function historicoConta(int $mensalidadeId): JsonResponse
    {
        $mensalidade = $this->carregarMensalidadeComRecebimentos($mensalidadeId);
        $historico = collect();

        foreach ($mensalidade->recebimentos as $r) {
            $historico->push([
                'tipo' => 'pagamento',
                'data' => optional($r->registrado_em)->format('Y-m-d H:i:s'),
                'descricao' => 'Pagamento registrado',
                'valor' => (float) $r->valor,
                'forma_pagamento' => $r->forma_pagamento,
                'usuario' => $r->registradoPor->nome ?? '-',
                'recebimento_id' => $r->id,
            ]);

            if ($r->estornado_em) {
                $historico->push([
                    'tipo' => 'estorno',
                    'data' => optional($r->estornado_em)->format('Y-m-d H:i:s'),
                    'descricao' => 'Pagamento estornado',
                    'valor' => (float) $r->valor,
                    'motivo' => $r->estorno_motivo,
                    'usuario' => $r->estornadoPor->nome ?? '-',
                    'recebimento_id' => $r->id,
                ]);
            }
        }

        $ordenado = $historico->sortByDesc('data')->values();

        return response()->json([
            'mensalidade' => $mensalidade,
            'historico' => $ordenado,
        ]);
    }

    public function comprovanteRecebimento(int $id)
    {
        $recebimento = Recebimento::with([
            'registradoPor',
            'mensalidade.contrato.matricula.aluno',
            'mensalidade.contrato.matricula.turma',
            'mensalidade.contrato.responsavel',
            'mensalidade.contrato.plano',
        ])->findOrFail($id);

        if ($recebimento->estornado_em) {
            return response()->json(['message' => 'Este recebimento foi estornado e nao possui comprovante ativo.'], 422);
        }

        $mensalidade = $recebimento->mensalidade;
        $contrato = $mensalidade?->contrato;
        $matricula = $contrato?->matricula;

        $pdf = Pdf::loadView('pdf.comprovante-recebimento', [
            'recebimento' => $recebimento,
            'mensalidade' => $mensalidade,
            'contrato' => $contrato,
            'matricula' => $matricula,
            'aluno' => $matricula?->aluno,
            'responsavel' => $contrato?->responsavel,
            'plano' => $contrato?->plano,
            'emitido_em' => now(),
        ])->setPaper('a4');

        $numeroMatricula = $matricula?->numero_matricula ?: $id;
        $nomeArquivo = "comprovante-matricula-{$numeroMatricula}-rec-{$id}.pdf";

        return $pdf->download($nomeArquivo);
    }

    public function gerarMensalidades(Request $request): JsonResponse
    {
        $request->validate([
            'contrato_id' => ['required', 'exists:contratos,id'],
            'meses'       => ['required', 'integer', 'min:1', 'max:12'],
        ]);

        $contrato = Contrato::with('plano')->findOrFail($request->contrato_id);
        $geradas = 0;

        $competencia = Carbon::now()->startOfMonth();

        for ($i = 0; $i < $request->meses; $i++) {
            $existe = Mensalidade::where('contrato_id', $contrato->id)
                ->whereYear('competencia', $competencia->year)
                ->whereMonth('competencia', $competencia->month)
                ->exists();

            if (!$existe) {
                $valorBase = $contrato->valor_efetivo;
                $vencimento = $competencia->copy()->day($contrato->plano->dia_vencimento);

                Mensalidade::create([
                    'contrato_id'    => $contrato->id,
                    'competencia'    => $competencia->format('Y-m-01'),
                    'valor_original' => $valorBase,
                    'valor_final'    => $valorBase,
                    'data_vencimento'=> $vencimento,
                    'situacao'       => 'pendente',
                ]);
                $geradas++;
            }

            $competencia->addMonth();
        }

        return response()->json(['message' => "Geradas {$geradas} mensalidade(s).", 'geradas' => $geradas]);
    }

    public function resumoFinanceiro(): JsonResponse
    {
        $this->assegurarMensalidadesIniciais();
        $hoje = now();
        $inicioMes = $hoje->copy()->startOfMonth();
        $fimMes = $hoje->copy()->endOfMonth();

        $mensalidadesMes = Mensalidade::whereYear('competencia', $hoje->year)
            ->whereMonth('competencia', $hoje->month)
            ->withSum(['recebimentos as total_recebido' => fn($q) => $q->whereNull('estornado_em')], 'valor')
            ->get(['id', 'valor_final']);

        $totalPrevisto = (float) $mensalidadesMes->sum('valor_final');
        $totalAbertoMes = (float) $mensalidadesMes->sum(function ($m) {
            return max((float) $m->valor_final - (float) ($m->total_recebido ?? 0), 0);
        });

        $totalRecebido = Recebimento::whereBetween('data_recebimento', [
                $inicioMes->format('Y-m-d'),
                $fimMes->format('Y-m-d'),
            ])
            ->whereNull('estornado_em')
            ->sum('valor');

        $inadimplencia = $this->consolidarInadimplencia();
        $totalPendente = round($inadimplencia['agregado']->sum('valor_total'), 2);
        $totalInadimplentes = $inadimplencia['agregado']->count();

        $totalContratosAtivos = Contrato::where('ativo', true)->count();
        $topInadimplentes = $inadimplencia['agregado']
            ->take(5)
            ->map(fn($x) => [
                'aluno' => $x['aluno'],
                'meses' => $x['meses'],
                'valor' => $x['valor_total'],
            ])
            ->values();

        return response()->json([
            'mes_referencia'      => $hoje->format('m/Y'),
            'total_previsto'      => $totalPrevisto,
            'total_recebido'      => $totalRecebido,
            'total_a_receber'     => round($totalAbertoMes, 2),
            'total_inadimplencia' => $totalPendente,
            'qtd_inadimplentes'   => $totalInadimplentes,
            'total_contratos'     => $totalContratosAtivos,
            'inadimplentes_lista' => $topInadimplentes,
        ]);
    }
}
