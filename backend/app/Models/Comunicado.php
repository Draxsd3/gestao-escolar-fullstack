<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Comunicado extends Model
{
    protected $table = 'comunicados';
    protected $fillable = ['titulo', 'corpo', 'autor_id', 'publico_alvo', 'turma_id', 'publicado', 'publicado_em', 'expira_em'];
    protected $casts = ['publicado' => 'boolean', 'publicado_em' => 'datetime', 'expira_em' => 'datetime'];

    public function autor() { return $this->belongsTo(User::class, 'autor_id'); }
    public function turma() { return $this->belongsTo(Turma::class, 'turma_id'); }
}
