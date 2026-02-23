<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Matricula extends Model
{
    use HasFactory;

    protected $table = 'matriculas';

    protected $fillable = [
        'aluno_id', 'turma_id', 'ano_letivo_id', 'numero_matricula',
        'data_matricula', 'situacao', 'observacoes', 'criado_por',
    ];

    protected $casts = [
        'data_matricula' => 'date',
    ];

    public function aluno()    { return $this->belongsTo(Aluno::class, 'aluno_id'); }
    public function turma()    { return $this->belongsTo(Turma::class, 'turma_id'); }
    public function anoLetivo(){ return $this->belongsTo(AnoLetivo::class, 'ano_letivo_id'); }
    public function criadoPor(){ return $this->belongsTo(User::class, 'criado_por'); }
    public function notas()    { return $this->hasMany(Nota::class, 'matricula_id'); }
    public function contrato() { return $this->hasOne(Contrato::class, 'matricula_id'); }
    public function mediasAnuais() { return $this->hasMany(MediaAnual::class, 'matricula_id'); }
    public function mediasPeriodo() { return $this->hasMany(MediaPeriodo::class, 'matricula_id'); }

    public static function gerarNumero(int $anoLetivo, int $turmaId): string
    {
        $ultimo = static::where('ano_letivo_id', $anoLetivo)
            ->where('turma_id', $turmaId)
            ->count();
        return sprintf('%d%03d%03d', $anoLetivo, $turmaId, $ultimo + 1);
    }
}
