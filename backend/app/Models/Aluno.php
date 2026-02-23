<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Aluno extends Model
{
    use HasFactory;

    protected $table = 'alunos';

    protected $fillable = [
        'usuario_id', 'nome', 'nome_social', 'cpf', 'rg',
        'data_nascimento', 'sexo', 'naturalidade', 'nacionalidade',
        'foto', 'email', 'telefone', 'endereco', 'informacoes_medicas', 'ativo',
    ];

    protected $casts = [
        'data_nascimento' => 'date',
        'endereco' => 'array',
        'ativo' => 'boolean',
    ];

    public function usuario() { return $this->belongsTo(User::class, 'usuario_id'); }

    public function responsaveis()
    {
        return $this->belongsToMany(Responsavel::class, 'aluno_responsavel', 'aluno_id', 'responsavel_id')
            ->withPivot(['parentesco', 'responsavel_financeiro', 'contato_emergencia']);
    }

    public function matriculas() { return $this->hasMany(Matricula::class, 'aluno_id'); }

    public function matriculaAtiva()
    {
        return $this->hasOne(Matricula::class, 'aluno_id')
            ->where('situacao', 'ativa')
            ->latest();
    }

    public function getIdadeAttribute(): ?int
    {
        return $this->data_nascimento?->age;
    }
}
