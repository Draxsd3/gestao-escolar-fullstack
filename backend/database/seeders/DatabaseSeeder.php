<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Os dados de demonstração estão em banco-de-dados/002_seeds.sql
        // Este seeder cria apenas os dados mínimos via Eloquent

        // Perfis
        $perfis = [
            ['nome' => 'admin',       'descricao' => 'Administrador do sistema'],
            ['nome' => 'secretaria',  'descricao' => 'Secretaria escolar'],
            ['nome' => 'coordenacao', 'descricao' => 'Coordenação pedagógica'],
            ['nome' => 'professor',   'descricao' => 'Professor'],
            ['nome' => 'responsavel', 'descricao' => 'Responsável pelo aluno'],
            ['nome' => 'aluno',       'descricao' => 'Aluno'],
        ];

        foreach ($perfis as $p) {
            DB::table('perfis')->updateOrInsert(['nome' => $p['nome']], $p);
        }

        $adminPerfil = DB::table('perfis')->where('nome', 'admin')->value('id');

        // Usuário admin padrão
        DB::table('usuarios')->updateOrInsert(
            ['email' => 'admin@babel.edu.br'],
            [
                'nome'      => 'Administrador Babel',
                'email'     => 'admin@babel.edu.br',
                'senha'     => Hash::make('Babel@2025'),
                'perfil_id' => $adminPerfil,
                'ativo'     => true,
                'criado_em' => now(),
                'atualizado_em' => now(),
            ]
        );

        $this->command->info('✅ Dados iniciais criados com sucesso!');
        $this->command->info('📧 Login: admin@babel.edu.br | Senha: Babel@2025');
        $this->command->line('');
        $this->command->info('Para dados completos de demonstração, execute:');
        $this->command->info('mysql -u root -p babel_escola < ../banco-de-dados/002_seeds.sql');
    }
}
