<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Disciplina extends Model
{
    protected $table = 'disciplinas';
    protected $fillable = ['nome', 'codigo', 'carga_horaria_semanal', 'ativa'];
    protected $casts = ['ativa' => 'boolean'];
    public $timestamps = false;
}
