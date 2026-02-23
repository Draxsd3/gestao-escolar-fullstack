<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Serie extends Model
{
    protected $table = 'series';
    protected $fillable = ['nivel_id', 'nome', 'ordem'];
    public $timestamps = false;

    public function nivel()  { return $this->belongsTo(NivelEnsino::class, 'nivel_id'); }
    public function turmas() { return $this->hasMany(Turma::class, 'serie_id'); }
}
