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
        <?php if(!empty($periodo_selecionado_nome)): ?>
            <div class="sub">Período: <?php echo e($periodo_selecionado_nome); ?></div>
        <?php endif; ?>
        <div class="sub">Emitido em <?php echo e(optional($emitido_em)->format('d/m/Y H:i')); ?></div>
    </div>

    <table class="grid">
        <tr>
            <td>
                <div class="label">Aluno</div>
                <div class="value"><?php echo e($matricula->aluno->nome ?? '-'); ?></div>
            </td>
            <td>
                <div class="label">Matrícula</div>
                <div class="value"><?php echo e($matricula->numero_matricula ?? '-'); ?></div>
            </td>
        </tr>
        <tr>
            <td>
                <div class="label">Turma</div>
                <div class="value"><?php echo e($matricula->turma->nome ?? '-'); ?></div>
            </td>
            <td>
                <div class="label">Ano Letivo</div>
                <div class="value"><?php echo e($matricula->anoLetivo->ano ?? '-'); ?></div>
            </td>
        </tr>
        <tr>
            <td colspan="2">
                <div class="label">Curso</div>
                <div class="value"><?php echo e($matricula->turma->serie->nivel->nome ?? '-'); ?></div>
            </td>
        </tr>
    </table>

    <table>
        <thead>
            <tr>
                <th>Disciplina</th>
                <?php $__currentLoopData = $periodos; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $periodo): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <th class="center"><?php echo e($periodo); ?></th>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                <th class="center">Média Final</th>
                <th class="center">Frequência</th>
                <th class="center">Situação</th>
            </tr>
        </thead>
        <tbody>
            <?php $__empty_1 = true; $__currentLoopData = $disciplinas; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $disc): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                <tr>
                    <td><?php echo e($disc['nome']); ?></td>
                    <?php $__currentLoopData = $periodos; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $periodo): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                        <?php $v = $disc['periodos'][$periodo] ?? null; ?>
                        <td class="center"><?php echo e($v !== null ? number_format((float) $v, 1, ',', '.') : '—'); ?></td>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                    <td class="center"><?php echo e($disc['media_final'] !== null ? number_format((float) $disc['media_final'], 1, ',', '.') : '—'); ?></td>
                    <?php
                        $total = (int) ($disc['freq_total'] ?? 0);
                        $presentes = (int) ($disc['freq_presente'] ?? 0);
                        $freq = $total > 0 ? round(($presentes / $total) * 100) . '%' : '—';
                    ?>
                    <td class="center"><?php echo e($freq); ?></td>
                    <td class="center"><?php echo e($disc['situacao'] ?: '—'); ?></td>
                </tr>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                <tr>
                    <td colspan="<?php echo e(4 + count($periodos)); ?>" class="center muted">Nenhum lançamento de nota encontrado.</td>
                </tr>
            <?php endif; ?>
        </tbody>
    </table>
</body>
</html>
<?php /**PATH C:\Users\draxs\Desktop\babel\backend\resources\views/pdf/boletim-aluno.blade.php ENDPATH**/ ?>