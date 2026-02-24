<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mensalidade extends Model
{
    protected $table = 'mensalidades';
    protected $fillable = ['contrato_id', 'competencia', 'valor_original', 'valor_desconto', 'valor_acrescimo', 'valor_final', 'data_vencimento', 'situacao', 'data_pagamento', 'observacoes'];
    protected $casts = ['competencia' => 'date', 'data_vencimento' => 'date'];
    public $timestamps = false;

    public function contrato()     { return $this->belongsTo(Contrato::class, 'contrato_id'); }
    public function recebimentos() { return $this->hasMany(Recebimento::class, 'mensalidade_id'); }
}
