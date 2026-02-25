<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tarefa extends Model
{
    protected $table = 'tarefas';

    const CREATED_AT = 'criado_em';
    const UPDATED_AT = null;

    protected $fillable = [
        'titulo', 'descricao', 'disciplina_id', 'turma_id',
        'professor_id', 'data_entrega', 'arquivo_path',
    ];

    protected $casts = [
        'data_entrega' => 'date',
    ];

    public function disciplina() { return $this->belongsTo(Disciplina::class, 'disciplina_id'); }
    public function turma()      { return $this->belongsTo(Turma::class, 'turma_id'); }
    public function professor()  { return $this->belongsTo(Professor::class, 'professor_id'); }
    public function entregas()   { return $this->hasMany(TarefaEntrega::class, 'tarefa_id'); }
}
