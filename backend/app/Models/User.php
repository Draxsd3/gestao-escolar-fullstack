<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'usuarios';

    const CREATED_AT = 'criado_em';
    const UPDATED_AT = 'atualizado_em';

    protected $fillable = [
        'nome', 'email', 'senha', 'perfil_id', 'ativo', 'trocar_senha', 'matricula_interna', 'foto',
    ];

    protected $hidden = ['senha', 'remember_token'];

    protected $casts = [
        'ativo'        => 'boolean',
        'trocar_senha' => 'boolean',
        'ultimo_login' => 'datetime',
    ];

    public function getAuthPassword(): string
    {
        return 'senha';
    }

    public function perfil()
    {
        return $this->belongsTo(Perfil::class, 'perfil_id');
    }

    public function aluno()
    {
        return $this->hasOne(Aluno::class, 'usuario_id');
    }

    public function professor()
    {
        return $this->hasOne(Professor::class, 'usuario_id');
    }

    public function responsavel()
    {
        return $this->hasOne(Responsavel::class, 'usuario_id');
    }

    public function funcionario()
    {
        return $this->hasOne(Funcionario::class, 'usuario_id');
    }

    public function isPerfil(string $perfil): bool
    {
        return $this->perfil?->nome === $perfil;
    }

    public function hasAnyPerfil(array $perfis): bool
    {
        return in_array($this->perfil?->nome, $perfis);
    }
}
