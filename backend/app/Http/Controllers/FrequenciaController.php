<?php

namespace App\Http\Controllers;

use App\Models\{Aula, Frequencia, Matricula};
use Illuminate\Http\{Request, JsonResponse};
use Illuminate\Support\Facades\DB;

class FrequenciaController extends Controller
{
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

        $resultado = $matriculas->map(fn($m) => [
            'aluno_id' => $m->aluno_id,
            'nome'     => $m->aluno->nome,
            'presente' => $freqs->get($m->aluno_id)?->presente ?? null,
            'justificativa' => $freqs->get($m->aluno_id)?->justificativa,
        ]);

        return response()->json([
            'aula'       => $aula,
            'frequencias'=> $resultado,
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

        $dados = DB::table('frequencias as f')
            ->join('aulas as a', 'a.id', '=', 'f.aula_id')
            ->join('alunos as al', 'al.id', '=', 'f.aluno_id')
            ->join('disciplinas as d', 'd.id', '=', 'a.disciplina_id')
            ->where('a.turma_id', $request->turma_id)
            ->when($request->disciplina_id, fn($q) => $q->where('a.disciplina_id', $request->disciplina_id))
            ->select(
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
}

// ─────────────────────────────────────────────────────────────

namespace App\Http\Controllers;

use App\Models\{Contrato, Mensalidade, Recebimento, Matricula, Responsavel, PlanoPagamento, Auditoria};
use Illuminate\Http\{Request, JsonResponse};
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class FinanceiroController extends Controller
{
    public function mensalidades(Request $request): JsonResponse
    {
        $query = Mensalidade::with(['contrato.matricula.aluno', 'contrato.responsavel', 'contrato.plano'])
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
        $dados = Mensalidade::with(['contrato.matricula.aluno', 'contrato.responsavel'])
            ->where('situacao', 'pendente')
            ->where('data_vencimento', '<', now())
            ->orderBy('data_vencimento')
            ->get()
            ->map(function ($m) {
                $diasAtraso = now()->diffInDays($m->data_vencimento);
                $juros = $m->valor_final * ($m->contrato->plano->juros_atraso_diario ?? 0.0033) * $diasAtraso;
                $multa = $m->valor_final * ($m->contrato->plano->multa_atraso ?? 2) / 100;

                return [
                    'mensalidade_id'  => $m->id,
                    'aluno'           => $m->contrato->matricula->aluno->nome ?? '-',
                    'responsavel'     => $m->contrato->responsavel->nome ?? '-',
                    'competencia'     => $m->competencia->format('m/Y'),
                    'valor_original'  => $m->valor_final,
                    'vencimento'      => $m->data_vencimento->format('d/m/Y'),
                    'dias_atraso'     => $diasAtraso,
                    'juros'           => round($juros, 2),
                    'multa'           => round($multa, 2),
                    'total_devido'    => round($m->valor_final + $juros + $multa, 2),
                ];
            });

        return response()->json($dados);
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

        DB::transaction(function () use ($data, $mensalidade) {
            $recebimento = Recebimento::create([
                ...$data,
                'registrado_por' => auth()->id(),
            ]);

            // Verificar total pago
            $totalPago = $mensalidade->recebimentos()->sum('valor');

            if ($totalPago >= $mensalidade->valor_final) {
                $mensalidade->update([
                    'situacao'        => 'pago',
                    'data_pagamento'  => $data['data_recebimento'],
                ]);
            } elseif ($totalPago > 0) {
                $mensalidade->update(['situacao' => 'parcial']);
            }

            Auditoria::registrar('recebimento', 'mensalidades', $mensalidade->id,
                ['situacao' => 'pendente'],
                ['situacao' => $mensalidade->fresh()->situacao, 'valor' => $data['valor']]
            );
        });

        return response()->json(['message' => 'Recebimento registrado com sucesso.']);
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
        $hoje = now();
        $mesAtual = $hoje->format('Y-m');

        $totalPrevisto = Mensalidade::whereYear('competencia', $hoje->year)
            ->whereMonth('competencia', $hoje->month)
            ->sum('valor_final');

        $totalRecebido = Mensalidade::whereYear('competencia', $hoje->year)
            ->whereMonth('competencia', $hoje->month)
            ->whereIn('situacao', ['pago','parcial'])
            ->sum('valor_final');

        $totalPendente = Mensalidade::where('situacao', 'pendente')
            ->where('data_vencimento', '<', $hoje)
            ->sum('valor_final');

        $totalInadimplentes = Mensalidade::where('situacao', 'pendente')
            ->where('data_vencimento', '<', $hoje)
            ->distinct('contrato_id')
            ->count('contrato_id');

        return response()->json([
            'mes_referencia'      => $hoje->format('m/Y'),
            'total_previsto'      => $totalPrevisto,
            'total_recebido'      => $totalRecebido,
            'total_a_receber'     => $totalPrevisto - $totalRecebido,
            'total_inadimplencia' => $totalPendente,
            'qtd_inadimplentes'   => $totalInadimplentes,
        ]);
    }
}
