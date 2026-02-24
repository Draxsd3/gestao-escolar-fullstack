<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Boletim extends Model
{
    protected $table = 'boletins';
    protected $fillable = ['matricula_id', 'periodo_id', 'ano_letivo_id', 'dados', 'gerado_por'];

    const CREATED_AT = 'gerado_em';
    const UPDATED_AT = null;

    protected $casts = [
        'dados' => 'array',
    ];

    public function matricula()  { return $this->belongsTo(Matricula::class, 'matricula_id'); }
    public function periodo()    { return $this->belongsTo(PeriodoAvaliacao::class, 'periodo_id'); }
    public function anoLetivo()  { return $this->belongsTo(AnoLetivo::class, 'ano_letivo_id'); }
    public function geradoPor()  { return $this->belongsTo(User::class, 'gerado_por'); }
}
