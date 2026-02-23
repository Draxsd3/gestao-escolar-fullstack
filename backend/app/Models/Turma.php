<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Turma extends Model
{
    use HasFactory;

    protected $table = 'turmas';
    protected $fillable = ['serie_id', 'ano_letivo_id', 'nome', 'turno', 'vagas', 'sala', 'ativa'];
    protected $casts = ['ativa' => 'boolean'];

    public function serie()      { return $this->belongsTo(Serie::class, 'serie_id'); }
    public function anoLetivo()  { return $this->belongsTo(AnoLetivo::class, 'ano_letivo_id'); }
    public function matriculas() { return $this->hasMany(Matricula::class, 'turma_id'); }
    public function disciplinas(){ return $this->belongsToMany(Disciplina::class, 'grade_curricular', 'turma_id', 'disciplina_id')->withPivot('aulas_semanais'); }
    public function horarios()   { return $this->hasMany(Horario::class, 'turma_id'); }
    public function aulas()      { return $this->hasMany(Aula::class, 'turma_id'); }

    public function getVagasDisponiveisAttribute(): int
    {
        return $this->vagas - $this->matriculas()->where('situacao', 'ativa')->count();
    }
}
