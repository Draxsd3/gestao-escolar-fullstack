<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Frequencia extends Model
{
    protected $table = 'frequencias';
    protected $fillable = ['aula_id', 'aluno_id', 'presente', 'justificativa'];
    protected $casts = ['presente' => 'boolean'];
    public $timestamps = false;

    public function aula()  { return $this->belongsTo(Aula::class, 'aula_id'); }
    public function aluno() { return $this->belongsTo(Aluno::class, 'aluno_id'); }
}
