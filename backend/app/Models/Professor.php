<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Professor extends Model
{
    protected $table = 'professores';
    protected $fillable = ['usuario_id', 'cpf', 'rg', 'data_nascimento', 'formacao', 'especializacao', 'registro_mec', 'telefone', 'endereco', 'ativo'];
    protected $casts = ['data_nascimento' => 'date', 'endereco' => 'array', 'ativo' => 'boolean'];

    public function usuario() { return $this->belongsTo(User::class, 'usuario_id'); }
    public function turmas()  { return $this->hasMany(ProfessorTurmaDisciplina::class, 'professor_id'); }
    public function aulas()   { return $this->hasMany(Aula::class, 'professor_id'); }
}
