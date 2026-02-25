<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Disciplina extends Model
{
    protected $table = 'disciplinas';
    protected $fillable = ['nome', 'codigo', 'carga_horaria_semanal', 'ativa'];
    protected $casts = ['ativa' => 'boolean'];
    public $timestamps = false;

    public function cursos()
    {
        return $this->belongsToMany(NivelEnsino::class, 'curso_disciplina', 'disciplina_id', 'curso_id');
    }

    public function professores()
    {
        return $this->belongsToMany(Professor::class, 'professor_disciplina', 'disciplina_id', 'professor_id');
    }
}
