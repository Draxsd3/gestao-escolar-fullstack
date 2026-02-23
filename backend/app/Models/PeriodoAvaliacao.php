<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PeriodoAvaliacao extends Model
{
    protected $table = 'periodos_avaliacao';
    protected $fillable = ['ano_letivo_id', 'nome', 'ordem', 'data_inicio', 'data_fim', 'peso'];
    protected $casts = ['data_inicio' => 'date', 'data_fim' => 'date'];
    public $timestamps = false;

    public function anoLetivo() { return $this->belongsTo(AnoLetivo::class, 'ano_letivo_id'); }
    public function notas()     { return $this->hasMany(Nota::class, 'periodo_id'); }
}
