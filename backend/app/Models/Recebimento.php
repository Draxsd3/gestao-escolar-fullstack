<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Recebimento extends Model
{
    protected $table = 'recebimentos';
    protected $fillable = ['mensalidade_id', 'valor', 'data_recebimento', 'forma_pagamento', 'observacoes', 'recebido_por'];

    const CREATED_AT = 'criado_em';
    const UPDATED_AT = null;

    public function mensalidade() { return $this->belongsTo(Mensalidade::class, 'mensalidade_id'); }
    public function recebidoPor() { return $this->belongsTo(User::class, 'recebido_por'); }
}
