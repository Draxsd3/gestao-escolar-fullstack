<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnoLetivo extends Model
{
    public $timestamps = false;
    protected $table = 'anos_letivos';
    protected $fillable = ['ano', 'data_inicio', 'data_fim', 'modelo_periodo', 'status', 'ativo'];
    protected $casts = [
        'data_inicio' => 'date',
        'data_fim' => 'date',
        'ativo' => 'boolean',
    ];

    public function turmas()   { return $this->hasMany(Turma::class, 'ano_letivo_id'); }
    public function periodos() { return $this->hasMany(PeriodoAvaliacao::class, 'ano_letivo_id'); }

    public static function ativo(): ?self
    {
        return static::where('ativo', true)->first();
    }

    public function periodoAtivo(): ?PeriodoAvaliacao
    {
        return $this->periodos()
            ->where('encerrado', false)
            ->orderBy('ordem')
            ->first();
    }

    public function isBimestral(): bool
    {
        return $this->modelo_periodo === 'bimestral';
    }

    public function isSemestral(): bool
    {
        return $this->modelo_periodo === 'semestral';
    }

    public function totalPeriodosEsperado(): int
    {
        return $this->isBimestral() ? 4 : 2;
    }

    public function gerarPeriodos(): void
    {
        $ano = $this->ano;

        if ($this->isBimestral()) {
            $periodos = [
                ['nome' => '1º Bimestre', 'ordem' => 1, 'data_inicio' => "{$ano}-02-01", 'data_fim' => "{$ano}-04-30"],
                ['nome' => '2º Bimestre', 'ordem' => 2, 'data_inicio' => "{$ano}-05-01", 'data_fim' => "{$ano}-07-15"],
                ['nome' => '3º Bimestre', 'ordem' => 3, 'data_inicio' => "{$ano}-07-28", 'data_fim' => "{$ano}-10-15"],
                ['nome' => '4º Bimestre', 'ordem' => 4, 'data_inicio' => "{$ano}-10-16", 'data_fim' => "{$ano}-12-15"],
            ];
        } else {
            $periodos = [
                ['nome' => '1º Semestre', 'ordem' => 1, 'data_inicio' => "{$ano}-02-01", 'data_fim' => "{$ano}-07-15"],
                ['nome' => '2º Semestre', 'ordem' => 2, 'data_inicio' => "{$ano}-07-28", 'data_fim' => "{$ano}-12-15"],
            ];
        }

        foreach ($periodos as $p) {
            PeriodoAvaliacao::create(array_merge($p, [
                'ano_letivo_id' => $this->id,
                'encerrado' => false,
            ]));
        }
    }
}
