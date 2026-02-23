<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Nota extends Model
{
    protected $table = 'notas';
    protected $fillable = ['matricula_id', 'disciplina_id', 'periodo_id', 'criterio_id', 'valor', 'observacoes', 'lancado_por'];

    const CREATED_AT = 'lancado_em';
    const UPDATED_AT = 'atualizado_em';

    public function matricula()  { return $this->belongsTo(Matricula::class, 'matricula_id'); }
    public function disciplina() { return $this->belongsTo(Disciplina::class, 'disciplina_id'); }
    public function periodo()    { return $this->belongsTo(PeriodoAvaliacao::class, 'periodo_id'); }
    public function lancadoPor() { return $this->belongsTo(User::class, 'lancado_por'); }
}
