<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Auditoria extends Model
{
    protected $table = 'auditoria';
    protected $fillable = ['usuario_id', 'acao', 'entidade', 'entidade_id', 'dados_anteriores', 'dados_novos', 'ip', 'user_agent'];
    protected $casts = ['dados_anteriores' => 'array', 'dados_novos' => 'array'];

    const CREATED_AT = 'criado_em';
    const UPDATED_AT = null;

    public function usuario() { return $this->belongsTo(User::class, 'usuario_id'); }

    public static function registrar(string $acao, string $entidade, int $entidadeId, ?array $dadosAnteriores = [], ?array $dadosNovos = []): void
    {
        static::create([
            'usuario_id'       => auth()->id(),
            'acao'             => $acao,
            'entidade'         => $entidade,
            'entidade_id'      => $entidadeId,
            'dados_anteriores' => $dadosAnteriores ?? [],
            'dados_novos'      => $dadosNovos ?? [],
            'ip'               => request()->ip(),
            'user_agent'       => request()->userAgent(),
        ]);
    }
}
