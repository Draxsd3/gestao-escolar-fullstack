<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NivelEnsino extends Model
{
    protected $table = 'niveis_ensino';
    protected $fillable = ['nome', 'descricao'];
    public $timestamps = false;

    public function series() { return $this->hasMany(Serie::class, 'nivel_id'); }
    public function disciplinas() { return $this->belongsToMany(Disciplina::class, 'curso_disciplina', 'curso_id', 'disciplina_id'); }
}
