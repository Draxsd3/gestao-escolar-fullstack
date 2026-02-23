<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NivelEnsino extends Model
{
    protected $table = 'niveis_ensino';
    protected $fillable = ['nome', 'descricao'];
    public $timestamps = false;

    public function series() { return $this->hasMany(Serie::class, 'nivel_id'); }
}
