<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Perfil extends Model {
    protected $table = 'perfis';
    protected $fillable = ['nome', 'descricao'];
    public $timestamps = false;
    public function usuarios() { return $this->hasMany(User::class, 'perfil_id'); }
}

// ─────────────────────────────────────────────────────────────
// ESTRUTURA ESCOLAR
// ─────────────────────────────────────────────────────────────
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class NivelEnsino extends Model {
    protected $table = 'niveis_ensino';
    protected $fillable = ['nome', 'descricao'];
    public $timestamps = false;
    public function series() { return $this->hasMany(Serie::class, 'nivel_id'); }
}
