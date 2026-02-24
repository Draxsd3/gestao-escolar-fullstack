<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlanoPagamento extends Model
{
    protected $table = 'planos_pagamento';
    protected $fillable = ['nome', 'descricao', 'valor_mensalidade', 'dia_vencimento', 'desconto_antecipado', 'juros_atraso_diario', 'multa_atraso', 'ativo'];
    protected $casts = ['ativo' => 'boolean'];
    public $timestamps = false;

    public function contratos() { return $this->hasMany(Contrato::class, 'plano_id'); }
}
