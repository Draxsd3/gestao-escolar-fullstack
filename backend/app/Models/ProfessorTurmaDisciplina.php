<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProfessorTurmaDisciplina extends Model
{
    protected $table = 'professor_turma_disciplina';
    protected $fillable = ['professor_id', 'turma_id', 'disciplina_id', 'ano_letivo_id'];
    public $timestamps = false;

    public function professor()  { return $this->belongsTo(Professor::class, 'professor_id'); }
    public function turma()      { return $this->belongsTo(Turma::class, 'turma_id'); }
    public function disciplina() { return $this->belongsTo(Disciplina::class, 'disciplina_id'); }
}
