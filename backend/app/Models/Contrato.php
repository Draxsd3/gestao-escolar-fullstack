<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contrato extends Model
{
    protected $table = 'contratos';
    protected $fillable = ['matricula_id', 'responsavel_id', 'plano_id', 'data_inicio', 'data_fim', 'desconto', 'observacoes', 'ativo'];
    protected $casts = ['data_inicio' => 'date', 'data_fim' => 'date', 'ativo' => 'boolean'];

    const CREATED_AT = 'criado_em';
    const UPDATED_AT = null;

    public function matricula()   { return $this->belongsTo(Matricula::class, 'matricula_id'); }
    public function responsavel() { return $this->belongsTo(Responsavel::class, 'responsavel_id'); }
    public function plano()       { return $this->belongsTo(PlanoPagamento::class, 'plano_id'); }
    public function mensalidades(){ return $this->hasMany(Mensalidade::class, 'contrato_id'); }
}
