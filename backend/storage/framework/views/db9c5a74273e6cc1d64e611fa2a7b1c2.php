<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Comprovante de Pagamento</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #0f172a; font-size: 12px; }
        .header { border-bottom: 2px solid #1d4ed8; padding-bottom: 10px; margin-bottom: 16px; }
        .title { font-size: 20px; font-weight: 700; color: #1d4ed8; }
        .subtitle { font-size: 12px; color: #475569; margin-top: 3px; }
        .box { border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; margin-bottom: 12px; }
        .box-title { font-size: 13px; font-weight: 700; margin-bottom: 8px; color: #0f172a; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 4px 0; vertical-align: top; }
        .label { color: #475569; width: 42%; }
        .value { color: #0f172a; font-weight: 600; }
        .money { font-size: 16px; font-weight: 700; color: #0f766e; }
        .footer { margin-top: 18px; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Comprovante de Pagamento</div>
        <div class="subtitle">Babel - Gestao Escolar</div>
    </div>

    <div class="box">
        <div class="box-title">Dados do pagamento</div>
        <table>
            <tr>
                <td class="label">Numero do comprovante</td>
                <td class="value">REC-<?php echo e($recebimento->id); ?></td>
            </tr>
            <tr>
                <td class="label">Data de recebimento</td>
                <td class="value"><?php echo e(optional($recebimento->data_recebimento)->format('d/m/Y')); ?></td>
            </tr>
            <tr>
                <td class="label">Forma de pagamento</td>
                <td class="value"><?php echo e(strtoupper(str_replace('_', ' ', $recebimento->forma_pagamento))); ?></td>
            </tr>
            <tr>
                <td class="label">Valor recebido</td>
                <td class="money">R$ <?php echo e(number_format((float) $recebimento->valor, 2, ',', '.')); ?></td>
            </tr>
            <tr>
                <td class="label">Competencia</td>
                <td class="value"><?php echo e(optional($mensalidade->competencia)->format('m/Y')); ?></td>
            </tr>
            <tr>
                <td class="label">Mensalidade</td>
                <td class="value">#<?php echo e($mensalidade->id ?? '-'); ?></td>
            </tr>
        </table>
    </div>

    <div class="box">
        <div class="box-title">Dados academicos e financeiros</div>
        <table>
            <tr>
                <td class="label">Aluno</td>
                <td class="value"><?php echo e($aluno->nome ?? '-'); ?></td>
            </tr>
            <tr>
                <td class="label">Matricula</td>
                <td class="value"><?php echo e($matricula->numero_matricula ?? '-'); ?></td>
            </tr>
            <tr>
                <td class="label">Turma</td>
                <td class="value"><?php echo e($matricula->turma->nome ?? '-'); ?></td>
            </tr>
            <tr>
                <td class="label">Responsavel financeiro</td>
                <td class="value"><?php echo e($responsavel->nome ?? '-'); ?></td>
            </tr>
            <tr>
                <td class="label">Plano</td>
                <td class="value"><?php echo e($plano->nome ?? '-'); ?></td>
            </tr>
        </table>
    </div>

    <div class="box">
        <div class="box-title">Registro</div>
        <table>
            <tr>
                <td class="label">Lancado por</td>
                <td class="value"><?php echo e($recebimento->registradoPor->nome ?? '-'); ?></td>
            </tr>
            <tr>
                <td class="label">Emitido em</td>
                <td class="value"><?php echo e(optional($emitido_em)->format('d/m/Y H:i')); ?></td>
            </tr>
            <?php if(!empty($recebimento->numero_documento)): ?>
            <tr>
                <td class="label">Documento</td>
                <td class="value"><?php echo e($recebimento->numero_documento); ?></td>
            </tr>
            <?php endif; ?>
            <?php if(!empty($recebimento->observacoes)): ?>
            <tr>
                <td class="label">Observacoes</td>
                <td class="value"><?php echo e($recebimento->observacoes); ?></td>
            </tr>
            <?php endif; ?>
        </table>
    </div>

    <div class="footer">
        Documento gerado automaticamente pelo sistema Babel.
    </div>
</body>
</html>
<?php /**PATH C:\Users\draxs\Desktop\babel\backend\resources\views/pdf/comprovante-recebimento.blade.php ENDPATH**/ ?>