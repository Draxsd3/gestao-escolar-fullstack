<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Recebimento extends Model
{
    protected $table = 'recebimentos';
    protected $fillable = ['mensalidade_id', 'valor', 'forma_pagamento', 'data_recebimento', 'numero_documento', 'observacoes', 'registrado_por'];

    const CREATED_AT = 'registrado_em';
    const UPDATED_AT = null;

    public function mensalidade() { return $this->belongsTo(Mensalidade::class, 'mensalidade_id'); }
    public function registradoPor() { return $this->belongsTo(User::class, 'registrado_por'); }
}
