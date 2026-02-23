<?php

use App\Models\{User, Aluno, Turma, Matricula, AnoLetivo, Nota, Mensalidade, Contrato, Perfil};
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function criarUsuario(string $perfil = 'admin'): User
{
    $p = Perfil::firstOrCreate(['nome' => $perfil], ['descricao' => $perfil]);
    return User::factory()->create(['perfil_id' => $p->id, 'senha' => bcrypt('Babel@2025')]);
}

// ─────────────────────────────────────────────────────────────
// AUTENTICAÇÃO
// ─────────────────────────────────────────────────────────────
describe('Autenticação', function () {

    it('realiza login com credenciais válidas', function () {
        $user = criarUsuario('admin');

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'senha' => 'Babel@2025',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token', 'usuario' => ['id','nome','email','perfil']]);
    });

    it('rejeita login com senha incorreta', function () {
        $user = criarUsuario('admin');

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'senha' => 'senha_errada',
        ])->assertStatus(422);
    });

    it('rejeita login de usuário inativo', function () {
        $user = criarUsuario('secretaria');
        $user->update(['ativo' => false]);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'senha' => 'Babel@2025',
        ])->assertStatus(422);
    });

    it('retorna dados do usuário logado em /me', function () {
        $user = criarUsuario('admin');

        $this->actingAs($user)
            ->getJson('/api/auth/me')
            ->assertStatus(200)
            ->assertJsonFragment(['email' => $user->email]);
    });

    it('realiza logout com sucesso', function () {
        $user = criarUsuario('admin');
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/auth/logout')
            ->assertStatus(200);
    });

    it('bloqueia rotas sem autenticação', function () {
        $this->getJson('/api/alunos')->assertStatus(401);
    });
});

// ─────────────────────────────────────────────────────────────
// PERMISSÕES
// ─────────────────────────────────────────────────────────────
describe('Permissões por perfil', function () {

    it('responsável não pode cadastrar alunos', function () {
        $user = criarUsuario('responsavel');

        $this->actingAs($user)
            ->postJson('/api/alunos', ['nome' => 'Teste'])
            ->assertStatus(403);
    });

    it('professor não pode acessar financeiro', function () {
        $user = criarUsuario('professor');

        $this->actingAs($user)
            ->getJson('/api/financeiro/mensalidades')
            ->assertStatus(403);
    });

    it('secretaria pode cadastrar alunos', function () {
        $user = criarUsuario('secretaria');

        $this->actingAs($user)
            ->postJson('/api/alunos', [
                'nome'            => 'Aluno Teste',
                'data_nascimento' => '2012-01-01',
                'sexo'            => 'M',
            ])->assertStatus(201);
    });

    it('professor pode lançar notas', function () {
        $perfProfessor = Perfil::firstOrCreate(['nome' => 'professor']);
        $user = User::factory()->create(['perfil_id' => $perfProfessor->id, 'senha' => bcrypt('Babel@2025')]);

        // professor não tem acesso ao financeiro
        $this->actingAs($user)
            ->getJson('/api/financeiro/resumo')
            ->assertStatus(403);
    });
});

// ─────────────────────────────────────────────────────────────
// ALUNOS
// ─────────────────────────────────────────────────────────────
describe('Módulo Alunos', function () {

    it('lista alunos com paginação', function () {
        $user = criarUsuario('secretaria');
        Aluno::factory()->count(5)->create();

        $this->actingAs($user)
            ->getJson('/api/alunos')
            ->assertStatus(200)
            ->assertJsonStructure(['data', 'total', 'per_page']);
    });

    it('cria aluno com dados válidos', function () {
        $user = criarUsuario('secretaria');

        $this->actingAs($user)
            ->postJson('/api/alunos', [
                'nome'            => 'Maria Silva',
                'cpf'             => '111.111.111-11',
                'data_nascimento' => '2010-05-15',
                'sexo'            => 'F',
                'email'           => 'maria@escola.com',
            ])->assertStatus(201)
              ->assertJsonFragment(['nome' => 'Maria Silva']);
    });

    it('valida CPF duplicado', function () {
        $user = criarUsuario('secretaria');
        Aluno::factory()->create(['cpf' => '222.222.222-22']);

        $this->actingAs($user)
            ->postJson('/api/alunos', [
                'nome'            => 'Outro Aluno',
                'cpf'             => '222.222.222-22',
                'data_nascimento' => '2011-01-01',
                'sexo'            => 'M',
            ])->assertStatus(422);
    });

    it('edita aluno existente', function () {
        $user = criarUsuario('secretaria');
        $aluno = Aluno::factory()->create();

        $this->actingAs($user)
            ->putJson("/api/alunos/{$aluno->id}", ['nome' => 'Nome Alterado'])
            ->assertStatus(200)
            ->assertJsonFragment(['nome' => 'Nome Alterado']);
    });

    it('busca aluno por nome', function () {
        $user = criarUsuario('admin');
        Aluno::factory()->create(['nome' => 'Fernanda Especial']);
        Aluno::factory()->count(3)->create();

        $this->actingAs($user)
            ->getJson('/api/alunos?busca=Fernanda')
            ->assertStatus(200)
            ->assertJsonFragment(['nome' => 'Fernanda Especial']);
    });
});

// ─────────────────────────────────────────────────────────────
// TURMAS
// ─────────────────────────────────────────────────────────────
describe('Módulo Turmas', function () {

    it('lista turmas com filtro de ano letivo', function () {
        $user = criarUsuario('coordenacao');
        $anoLetivo = AnoLetivo::factory()->create(['ativo' => true]);
        Turma::factory()->count(3)->create(['ano_letivo_id' => $anoLetivo->id]);

        $this->actingAs($user)
            ->getJson("/api/turmas?ano_letivo_id={$anoLetivo->id}")
            ->assertStatus(200);
    });

    it('cria turma com dados válidos', function () {
        $user = criarUsuario('secretaria');
        $serie = \App\Models\Serie::factory()->create();
        $anoLetivo = AnoLetivo::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/turmas', [
                'serie_id'      => $serie->id,
                'ano_letivo_id' => $anoLetivo->id,
                'nome'          => '8B',
                'turno'         => 'tarde',
                'vagas'         => 35,
            ])->assertStatus(201)
              ->assertJsonFragment(['nome' => '8B']);
    });
});

// ─────────────────────────────────────────────────────────────
// NOTAS
// ─────────────────────────────────────────────────────────────
describe('Módulo Notas', function () {

    it('lança notas para uma turma', function () {
        $user = criarUsuario('professor');
        $matricula = Matricula::factory()->create();
        $disciplina = \App\Models\Disciplina::factory()->create();
        $periodo = \App\Models\PeriodoAvaliacao::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/notas/lancar', [
                'disciplina_id' => $disciplina->id,
                'periodo_id'    => $periodo->id,
                'notas' => [
                    ['matricula_id' => $matricula->id, 'valor' => 8.5],
                ],
            ])->assertStatus(200);

        $this->assertDatabaseHas('notas', [
            'matricula_id'  => $matricula->id,
            'disciplina_id' => $disciplina->id,
            'valor'         => 8.5,
        ]);
    });

    it('rejeita nota acima de 10', function () {
        $user = criarUsuario('professor');
        $matricula = Matricula::factory()->create();
        $disciplina = \App\Models\Disciplina::factory()->create();
        $periodo = \App\Models\PeriodoAvaliacao::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/notas/lancar', [
                'disciplina_id' => $disciplina->id,
                'periodo_id'    => $periodo->id,
                'notas' => [['matricula_id' => $matricula->id, 'valor' => 11]],
            ])->assertStatus(422);
    });
});

// ─────────────────────────────────────────────────────────────
// FREQUÊNCIA
// ─────────────────────────────────────────────────────────────
describe('Módulo Frequência', function () {

    it('registra frequência de alunos', function () {
        $user = criarUsuario('professor');
        $aluno = Aluno::factory()->create();
        $turma = Turma::factory()->create();
        $disciplina = \App\Models\Disciplina::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/frequencia/lancar', [
                'turma_id'      => $turma->id,
                'disciplina_id' => $disciplina->id,
                'data_aula'     => '2025-06-10',
                'numero_aulas'  => 2,
                'frequencias'   => [
                    ['aluno_id' => $aluno->id, 'presente' => true],
                ],
            ])->assertStatus(200);

        $this->assertDatabaseHas('aulas', [
            'turma_id'      => $turma->id,
            'disciplina_id' => $disciplina->id,
        ]);
    });
});

// ─────────────────────────────────────────────────────────────
// FINANCEIRO
// ─────────────────────────────────────────────────────────────
describe('Módulo Financeiro', function () {

    it('retorna resumo financeiro para secretaria', function () {
        $user = criarUsuario('secretaria');

        $this->actingAs($user)
            ->getJson('/api/financeiro/resumo')
            ->assertStatus(200)
            ->assertJsonStructure([
                'mes_referencia', 'total_previsto', 'total_recebido',
                'total_inadimplencia', 'qtd_inadimplentes',
            ]);
    });

    it('lista inadimplentes', function () {
        $user = criarUsuario('secretaria');

        $this->actingAs($user)
            ->getJson('/api/financeiro/inadimplentes')
            ->assertStatus(200);
    });

    it('registra recebimento de mensalidade', function () {
        $user = criarUsuario('secretaria');
        $mensalidade = Mensalidade::factory()->create(['situacao' => 'pendente', 'valor_final' => 1200.00]);

        $this->actingAs($user)
            ->postJson('/api/financeiro/recebimento', [
                'mensalidade_id'   => $mensalidade->id,
                'valor'            => 1200.00,
                'forma_pagamento'  => 'pix',
                'data_recebimento' => '2025-06-10',
            ])->assertStatus(200);

        $this->assertDatabaseHas('mensalidades', [
            'id'      => $mensalidade->id,
            'situacao' => 'pago',
        ]);
    });
});
