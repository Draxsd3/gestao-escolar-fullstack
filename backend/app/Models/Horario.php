<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Horario extends Model
{
    protected $table = 'horarios';
    protected $fillable = ['turma_id', 'disciplina_id', 'professor_id', 'dia_semana', 'horario_inicio', 'horario_fim'];
    public $timestamps = false;

    public function turma()      { return $this->belongsTo(Turma::class, 'turma_id'); }
    public function disciplina() { return $this->belongsTo(Disciplina::class, 'disciplina_id'); }
    public function professor()  { return $this->belongsTo(Professor::class, 'professor_id'); }
}
