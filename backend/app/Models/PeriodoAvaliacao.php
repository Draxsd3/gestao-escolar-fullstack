<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PeriodoAvaliacao extends Model
{
    protected $table = 'periodos_avaliacao';
    protected $fillable = ['ano_letivo_id', 'nome', 'ordem', 'data_inicio', 'data_fim', 'peso', 'encerrado', 'encerrado_em', 'encerrado_por'];
    protected $casts = [
        'data_inicio' => 'date',
        'data_fim' => 'date',
        'encerrado' => 'boolean',
        'encerrado_em' => 'datetime',
    ];
    public $timestamps = false;

    public function anoLetivo() { return $this->belongsTo(AnoLetivo::class, 'ano_letivo_id'); }
    public function notas()     { return $this->hasMany(Nota::class, 'periodo_id'); }
    public function boletins()  { return $this->hasMany(Boletim::class, 'periodo_id'); }

    /**
     * Verifica se o período está aberto para lançamentos.
     */
    public function isAberto(): bool
    {
        return !$this->encerrado;
    }

    /**
     * Verifica se é o período ativo (primeiro não-encerrado do ano).
     */
    public function isAtivo(): bool
    {
        if ($this->encerrado) return false;

        $anoLetivo = $this->anoLetivo;
        if (!$anoLetivo || !$anoLetivo->ativo) return false;

        $primeiro = PeriodoAvaliacao::where('ano_letivo_id', $this->ano_letivo_id)
            ->where('encerrado', false)
            ->orderBy('ordem')
            ->first();

        return $primeiro && $primeiro->id === $this->id;
    }
}
