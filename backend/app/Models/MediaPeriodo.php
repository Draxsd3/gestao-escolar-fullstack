<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MediaPeriodo extends Model
{
    protected $table = 'medias_periodo';
    protected $fillable = ['matricula_id', 'disciplina_id', 'periodo_id', 'media', 'situacao'];

    const UPDATED_AT = null;
    const CREATED_AT = 'calculado_em';

    public function matricula()  { return $this->belongsTo(Matricula::class, 'matricula_id'); }
    public function disciplina() { return $this->belongsTo(Disciplina::class, 'disciplina_id'); }
    public function periodo()    { return $this->belongsTo(PeriodoAvaliacao::class, 'periodo_id'); }
}
