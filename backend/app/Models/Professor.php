<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Professor extends Model
{
    protected $table = 'professores';

    const CREATED_AT = 'criado_em';
    const UPDATED_AT = null;

    protected $fillable = ['usuario_id', 'cpf', 'rg', 'data_nascimento', 'formacao', 'especializacao', 'area_atuacao', 'unidade', 'registro_mec', 'telefone', 'endereco', 'permissoes', 'ativo'];
    protected $casts = ['data_nascimento' => 'date', 'endereco' => 'array', 'permissoes' => 'array', 'ativo' => 'boolean'];

    public function usuario() { return $this->belongsTo(User::class, 'usuario_id'); }
    public function turmas()  { return $this->hasMany(ProfessorTurmaDisciplina::class, 'professor_id'); }
    public function aulas()   { return $this->hasMany(Aula::class, 'professor_id'); }
    public function disciplinas()
    {
        return $this->belongsToMany(Disciplina::class, 'professor_disciplina', 'professor_id', 'disciplina_id');
    }
}
