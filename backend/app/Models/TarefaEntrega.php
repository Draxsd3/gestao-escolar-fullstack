<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TarefaEntrega extends Model
{
    protected $table = 'tarefa_entregas';

    const CREATED_AT = 'criado_em';
    const UPDATED_AT = null;

    protected $fillable = [
        'tarefa_id', 'aluno_id', 'entregue',
        'arquivo_path', 'observacao', 'entregue_em',
    ];

    protected $casts = [
        'entregue'    => 'boolean',
        'entregue_em' => 'datetime',
    ];

    public function tarefa() { return $this->belongsTo(Tarefa::class, 'tarefa_id'); }
    public function aluno()  { return $this->belongsTo(Aluno::class, 'aluno_id'); }
}
