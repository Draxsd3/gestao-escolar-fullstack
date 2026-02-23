<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MediaAnual extends Model
{
    protected $table = 'medias_anuais';
    protected $fillable = ['matricula_id', 'disciplina_id', 'media_final', 'frequencia_pct', 'situacao'];

    const UPDATED_AT = null;
    const CREATED_AT = 'calculado_em';

    public function matricula()  { return $this->belongsTo(Matricula::class, 'matricula_id'); }
    public function disciplina() { return $this->belongsTo(Disciplina::class, 'disciplina_id'); }
}
