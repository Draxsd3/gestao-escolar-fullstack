<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnoLetivo extends Model
{
    protected $table = 'anos_letivos';
    protected $fillable = ['ano', 'data_inicio', 'data_fim', 'ativo'];
    protected $casts = ['data_inicio' => 'date', 'data_fim' => 'date', 'ativo' => 'boolean'];

    public function turmas()   { return $this->hasMany(Turma::class, 'ano_letivo_id'); }
    public function periodos() { return $this->hasMany(PeriodoAvaliacao::class, 'ano_letivo_id'); }

    public static function ativo(): ?self
    {
        return static::where('ativo', true)->first();
    }
}
