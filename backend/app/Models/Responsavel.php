<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Responsavel extends Model
{
    protected $table = 'responsaveis';

    const CREATED_AT = 'criado_em';
    const UPDATED_AT = null;

    protected $fillable = ['usuario_id', 'nome', 'cpf', 'rg', 'email', 'telefone', 'telefone_alt', 'endereco', 'profissao', 'ativo'];
    protected $casts = ['endereco' => 'array', 'ativo' => 'boolean'];

    public function usuario()  { return $this->belongsTo(User::class, 'usuario_id'); }
    public function alunos()   { return $this->belongsToMany(Aluno::class, 'aluno_responsavel', 'responsavel_id', 'aluno_id')->withPivot(['parentesco', 'responsavel_financeiro', 'contato_emergencia']); }
    public function contratos(){ return $this->hasMany(Contrato::class, 'responsavel_id'); }
}
