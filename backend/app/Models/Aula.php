<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Aula extends Model
{
    protected $table = 'aulas';
    protected $fillable = ['turma_id', 'disciplina_id', 'professor_id', 'data_aula', 'numero_aulas', 'conteudo', 'observacoes'];
    protected $casts = ['data_aula' => 'date'];

    const UPDATED_AT = null;
    const CREATED_AT = 'lancado_em';

    public function turma()       { return $this->belongsTo(Turma::class, 'turma_id'); }
    public function disciplina()  { return $this->belongsTo(Disciplina::class, 'disciplina_id'); }
    public function professor()   { return $this->belongsTo(Professor::class, 'professor_id'); }
    public function frequencias() { return $this->hasMany(Frequencia::class, 'aula_id'); }
}
