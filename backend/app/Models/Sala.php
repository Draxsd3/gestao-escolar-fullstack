<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sala extends Model
{
    protected $table = 'salas';
    protected $fillable = ['nome', 'descricao', 'ativo'];
    protected $casts = ['ativo' => 'boolean'];

    public const CREATED_AT = 'criado_em';
    public const UPDATED_AT = 'atualizado_em';
}
