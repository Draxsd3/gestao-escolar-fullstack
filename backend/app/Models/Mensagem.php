<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mensagem extends Model
{
    protected $table = 'mensagens';
    protected $fillable = ['remetente_id', 'destinatario_id', 'assunto', 'corpo', 'lida', 'lida_em'];
    protected $casts = ['lida' => 'boolean', 'lida_em' => 'datetime'];

    const CREATED_AT = 'criado_em';
    const UPDATED_AT = null;

    public function remetente()    { return $this->belongsTo(User::class, 'remetente_id'); }
    public function destinatario() { return $this->belongsTo(User::class, 'destinatario_id'); }
}
