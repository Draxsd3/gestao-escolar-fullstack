<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Boletim Escolar</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #0f172a; font-size: 12px; }
        .header { margin-bottom: 14px; border-bottom: 1px solid #cbd5e1; padding-bottom: 10px; }
        .title { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
        .sub { color: #475569; font-size: 11px; }
        .grid { width: 100%; margin: 10px 0 14px; border-collapse: collapse; }
        .grid td { padding: 6px 8px; border: 1px solid #e2e8f0; }
        .label { color: #475569; font-size: 10px; text-transform: uppercase; }
        .value { font-weight: 600; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f1f5f9; color: #334155; font-size: 10px; text-transform: uppercase; letter-spacing: .3px; }
        th, td { border: 1px solid #e2e8f0; padding: 7px 8px; }
        td { font-size: 11px; }
        .center { text-align: center; }
        .right { text-align: right; }
        .muted { color: #64748b; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Boletim Escolar</div>
        @if(!empty($periodo_selecionado_nome))
            <div class="sub">Período: {{ $periodo_selecionado_nome }}</div>
        @endif
        <div class="sub">Emitido em {{ optional($emitido_em)->format('d/m/Y H:i') }}</div>
    </div>

    <table class="grid">
        <tr>
            <td>
                <div class="label">Aluno</div>
                <div class="value">{{ $matricula->aluno->nome ?? '-' }}</div>
            </td>
            <td>
                <div class="label">Matrícula</div>
                <div class="value">{{ $matricula->numero_matricula ?? '-' }}</div>
            </td>
        </tr>
        <tr>
            <td>
                <div class="label">Turma</div>
                <div class="value">{{ $matricula->turma->nome ?? '-' }}</div>
            </td>
            <td>
                <div class="label">Ano Letivo</div>
                <div class="value">{{ $matricula->anoLetivo->ano ?? '-' }}</div>
            </td>
        </tr>
        <tr>
            <td colspan="2">
                <div class="label">Curso</div>
                <div class="value">{{ $matricula->turma->serie->nivel->nome ?? '-' }}</div>
            </td>
        </tr>
    </table>

    <table>
        <thead>
            <tr>
                <th>Disciplina</th>
                @foreach($periodos as $periodo)
                    <th class="center">{{ $periodo }}</th>
                @endforeach
                <th class="center">Média Final</th>
                <th class="center">Frequência</th>
                <th class="center">Situação</th>
            </tr>
        </thead>
        <tbody>
            @forelse($disciplinas as $disc)
                <tr>
                    <td>{{ $disc['nome'] }}</td>
                    @foreach($periodos as $periodo)
                        @php $v = $disc['periodos'][$periodo] ?? null; @endphp
                        <td class="center">{{ $v !== null ? number_format((float) $v, 1, ',', '.') : '—' }}</td>
                    @endforeach
                    <td class="center">{{ $disc['media_final'] !== null ? number_format((float) $disc['media_final'], 1, ',', '.') : '—' }}</td>
                    @php
                        $total = (int) ($disc['freq_total'] ?? 0);
                        $presentes = (int) ($disc['freq_presente'] ?? 0);
                        $freq = $total > 0 ? round(($presentes / $total) * 100) . '%' : '—';
                    @endphp
                    <td class="center">{{ $freq }}</td>
                    <td class="center">{{ $disc['situacao'] ?: '—' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="{{ 4 + count($periodos) }}" class="center muted">Nenhum lançamento de nota encontrado.</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
