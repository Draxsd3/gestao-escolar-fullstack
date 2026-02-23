<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Funcionario extends Model
{
    protected $table = 'funcionarios';
    protected $fillable = ['usuario_id', 'cpf', 'cargo', 'departamento', 'data_admissao', 'salario', 'ativo'];
    protected $casts = ['data_admissao' => 'date', 'ativo' => 'boolean'];

    public function usuario() { return $this->belongsTo(User::class, 'usuario_id'); }
}
