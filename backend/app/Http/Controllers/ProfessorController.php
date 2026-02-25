<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Perfil;
use App\Models\Professor;
use App\Models\Auditoria;
use App\Models\AnoLetivo;
use App\Models\Turma;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ProfessorController extends Controller
{
    // ── Listar professores ────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $query = Professor::with('usuario.perfil')
            ->when($request->busca, fn($q) =>
                $q->whereHas('usuario', fn($u) =>
                    $u->where('nome', 'like', "%{$request->busca}%")
                      ->orWhere('email', 'like', "%{$request->busca}%")
                )->orWhere('cpf', 'like', "%{$request->busca}%")
            )
            ->when(isset($request->ativo), fn($q) =>
                $q->where('ativo', filter_var($request->ativo, FILTER_VALIDATE_BOOLEAN))
            )
            ->orderByDesc('id');

        $professores = $query->paginate(20);

        return response()->json($professores);
    }

    // ── Ver professor ────────────────────────────────────────
    public function show(int $id): JsonResponse
    {
        $professor = Professor::with('usuario.perfil')->findOrFail($id);
        return response()->json($professor);
    }

    // ── Verificar duplicidade (email / CPF) ───────────────────
    public function verificarDuplicidade(Request $request): JsonResponse
    {
        $resultado = [
            'email_disponivel' => true,
            'cpf_disponivel'   => true,
        ];

        if ($request->filled('email')) {
            $resultado['email_disponivel'] = !User::where('email', $request->email)->exists();
        }

        if ($request->filled('cpf')) {
            $cpfLimpo = preg_replace('/\D/', '', $request->cpf);
            $resultado['cpf_disponivel'] = !Professor::where(
                DB::raw("REGEXP_REPLACE(cpf, '[^0-9]', '')"), $cpfLimpo
            )->exists();
        }

        return response()->json($resultado);
    }

    // ── Cadastro completo via wizard ──────────────────────────
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            // Dados pessoais
            'nome'            => 'required|string|max:150',
            'email'           => 'required|email|unique:usuarios,email',
            'cpf'             => 'required|string|max:14|unique:professores,cpf',
            'data_nascimento' => 'required|date',
            'telefone'        => 'required|string|max:20',
            'formacao'        => 'required|string|max:200',
            // Opcionais
            'rg'              => 'nullable|string|max:20',
            'sexo'            => 'nullable|in:M,F,O',
            'especializacao'  => 'nullable|string|max:200',
            'area_atuacao'    => 'nullable|string|max:150',
            'unidade'         => 'nullable|string|max:150',
            'registro_mec'    => 'nullable|string|max:50',
            'matricula_interna' => 'nullable|string|max:50',
            'endereco'        => 'nullable|array',
            // Login
            'senha'           => 'required|string|min:8',
            'trocar_senha'    => 'boolean',
            // Permissões
            'permissoes'      => 'nullable|array',
        ]);

        DB::beginTransaction();
        try {
            $perfilProfessor = Perfil::where('nome', 'professor')->firstOrFail();

            // Criar usuário
            $usuario = User::create([
                'nome'             => $request->nome,
                'email'            => $request->email,
                'senha'            => Hash::make($request->senha),
                'perfil_id'        => $perfilProfessor->id,
                'ativo'            => 1,
                'trocar_senha'     => $request->boolean('trocar_senha', true) ? 1 : 0,
                'matricula_interna' => $request->matricula_interna,
            ]);

            // Garantir que ativo foi gravado corretamente (força via DB direto se necessário)
            if (!$usuario->ativo) {
                DB::table('usuarios')->where('id', $usuario->id)->update(['ativo' => 1]);
                $usuario->ativo = true;
            }

            // Criar professor vinculado
            $professor = Professor::create([
                'usuario_id'      => $usuario->id,
                'cpf'             => $request->cpf,
                'rg'              => $request->rg,
                'data_nascimento' => $request->data_nascimento,
                'formacao'        => $request->formacao,
                'especializacao'  => $request->especializacao,
                'area_atuacao'    => $request->area_atuacao,
                'unidade'         => $request->unidade,
                'registro_mec'    => $request->registro_mec,
                'telefone'        => $request->telefone,
                'endereco'        => $request->endereco ?? [],
                'permissoes'      => $request->permissoes ?? [],
                'ativo'           => 1,
            ]);

            // Registrar auditoria
            $responsavel = $request->user();
            Auditoria::registrar(
                'cadastro_professor',
                'professores',
                $professor->id,
                null,
                [
                    'nome'        => $usuario->nome,
                    'email'       => $usuario->email,
                    'usuario_id'  => $usuario->id,
                    'responsavel' => $responsavel->nome,
                    'permissoes'  => $request->permissoes ?? [],
                ]
            );

            DB::commit();

            return response()->json([
                'message'   => 'Professor cadastrado com sucesso.',
                'professor' => $professor->load('usuario.perfil'),
                'usuario'   => [
                    'id'    => $usuario->id,
                    'nome'  => $usuario->nome,
                    'email' => $usuario->email,
                ],
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erro ao cadastrar professor: ' . $e->getMessage()
            ], 500);
        }
    }

    // ── Atualizar professor ──────────────────────────────────
    public function update(Request $request, int $id): JsonResponse
    {
        $professor = Professor::with('usuario')->findOrFail($id);

        $request->validate([
            'nome'           => 'sometimes|string|max:150',
            'email'          => "sometimes|email|unique:usuarios,email,{$professor->usuario_id}",
            'formacao'       => 'sometimes|string|max:200',
            'especializacao' => 'nullable|string|max:200',
            'area_atuacao'   => 'nullable|string|max:150',
            'unidade'        => 'nullable|string|max:150',
            'telefone'       => 'nullable|string|max:20',
            'endereco'       => 'nullable|array',
            'permissoes'     => 'nullable|array',
            'ativo'          => 'boolean',
        ]);

        DB::beginTransaction();
        try {
            // Atualizar usuario
            $dadosUsuario = array_filter([
                'nome'  => $request->nome,
                'email' => $request->email,
                'ativo' => $request->has('ativo') ? $request->boolean('ativo') : null,
            ], fn($v) => !is_null($v));

            if (!empty($dadosUsuario)) {
                $professor->usuario->update($dadosUsuario);
            }

            // Atualizar professor
            $dadosProfessor = array_filter([
                'formacao'      => $request->formacao,
                'especializacao'=> $request->especializacao,
                'area_atuacao'  => $request->area_atuacao,
                'unidade'       => $request->unidade,
                'telefone'      => $request->telefone,
                'endereco'      => $request->endereco,
                'permissoes'    => $request->permissoes,
                'ativo'         => $request->has('ativo') ? $request->boolean('ativo') : null,
            ], fn($v) => !is_null($v));

            if (!empty($dadosProfessor)) {
                $professor->update($dadosProfessor);
            }

            DB::commit();

            return response()->json([
                'message'   => 'Professor atualizado com sucesso.',
                'professor' => $professor->fresh()->load('usuario.perfil'),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erro: ' . $e->getMessage()], 500);
        }
    }

    // ── Ativar / Desativar ────────────────────────────────────
    public function toggleAtivo(int $id): JsonResponse
    {
        $professor = Professor::with('usuario')->findOrFail($id);
        $novoStatus = !$professor->ativo;
        $professor->update(['ativo' => $novoStatus]);
        $professor->usuario->update(['ativo' => $novoStatus]);

        return response()->json([
            'message' => $novoStatus ? 'Professor ativado.' : 'Professor desativado.',
            'ativo'   => $novoStatus,
        ]);
    }

    // ── Reenviar credenciais (gerar nova senha) ───────────────
    public function reenviarCredenciais(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'nova_senha' => 'required|string|min:8',
        ]);

        $professor = Professor::with('usuario')->findOrFail($id);
        $professor->usuario->update([
            'senha'       => Hash::make($request->nova_senha),
            'trocar_senha' => true,
        ]);

        Auditoria::registrar(
            'reset_senha_professor',
            'professores',
            $professor->id,
            null,
            ['responsavel' => $request->user()->nome]
        );

        return response()->json([
            'message' => 'Senha redefinida com sucesso. O professor deverá trocar no próximo acesso.',
        ]);
    }

    // ── Retornar permissões do professor logado ───────────────
    public function minhasPermissoes(Request $request): JsonResponse
    {
        $usuario = $request->user();
        $professor = Professor::where('usuario_id', $usuario->id)->first();

        return response()->json([
            'permissoes' => $professor?->permissoes ?? [],
        ]);
    }

    public function meuPortal(Request $request): JsonResponse
    {
        $usuario = $request->user()->loadMissing('professor.usuario');
        $professor = $usuario->professor;

        if (!$professor) {
            return response()->json(['message' => 'Professor nao encontrado.'], 404);
        }

        $anoAtivo = AnoLetivo::ativo();
        $professorId = (int) $professor->id;

        $turmasPtd = DB::table('professor_turma_disciplina')
            ->where('professor_id', $professorId)
            ->when($anoAtivo, fn($q) => $q->where('ano_letivo_id', $anoAtivo->id))
            ->pluck('turma_id')
            ->map(fn($id) => (int) $id)
            ->all();

        $turmasHorario = DB::table('horarios')
            ->where('professor_id', $professorId)
            ->pluck('turma_id')
            ->map(fn($id) => (int) $id)
            ->all();

        $turmasPorCadastroDisciplina = [];
        if (Schema::hasTable('professor_disciplina')) {
            $turmasPorCadastroDisciplina = DB::table('professor_disciplina as pd')
                ->join('grade_curricular as gc', 'gc.disciplina_id', '=', 'pd.disciplina_id')
                ->join('turmas as t', 't.id', '=', 'gc.turma_id')
                ->where('pd.professor_id', $professorId)
                ->when($anoAtivo, fn($q) => $q->where('t.ano_letivo_id', $anoAtivo->id))
                ->pluck('gc.turma_id')
                ->map(fn($id) => (int) $id)
                ->all();
        }

        $turmaIds = collect(array_merge($turmasPtd, $turmasHorario))
            ->merge($turmasPorCadastroDisciplina)
            ->filter()
            ->unique()
            ->values();

        if ($turmaIds->isEmpty()) {
            return response()->json([
                'professor' => [
                    'id' => $professor->id,
                    'nome' => $professor->usuario?->nome ?? 'Professor',
                    'unidade' => $professor->unidade,
                ],
                'ano_letivo' => $anoAtivo,
                'resumo' => [
                    'total_cursos' => 0,
                    'total_disciplinas' => 0,
                    'total_turmas' => 0,
                    'total_alunos' => 0,
                ],
                'cursos' => [],
                'disciplinas' => [],
                'salas' => [],
                'turmas' => [],
            ]);
        }

        $disciplinasPorTurmaPtd = DB::table('professor_turma_disciplina')
            ->where('professor_id', $professorId)
            ->when($anoAtivo, fn($q) => $q->where('ano_letivo_id', $anoAtivo->id))
            ->get(['turma_id', 'disciplina_id'])
            ->groupBy('turma_id')
            ->map(fn($rows) => collect($rows)->pluck('disciplina_id')->map(fn($id) => (int) $id)->unique()->values()->all());

        $disciplinasPorTurmaHorario = DB::table('horarios')
            ->where('professor_id', $professorId)
            ->get(['turma_id', 'disciplina_id'])
            ->groupBy('turma_id')
            ->map(fn($rows) => collect($rows)->pluck('disciplina_id')->map(fn($id) => (int) $id)->unique()->values()->all());

        $disciplinasDoProfessor = [];
        if (Schema::hasTable('professor_disciplina')) {
            $disciplinasDoProfessor = DB::table('professor_disciplina')
                ->where('professor_id', $professorId)
                ->pluck('disciplina_id')
                ->map(fn($id) => (int) $id)
                ->unique()
                ->values()
                ->all();
        }

        $turmas = Turma::with([
            'serie.nivel',
            'disciplinas' => fn($q) => $q->orderBy('nome'),
            'matriculas' => fn($q) => $q->where('situacao', 'ativa')->with('aluno')->orderBy('numero_matricula'),
        ])
            ->whereIn('id', $turmaIds->all())
            ->orderBy('nome')
            ->get();

        $disciplinasResumo = collect();
        $salas = [];
        $totalAlunos = 0;

        $turmasPayload = $turmas->map(function ($turma) use (
            $disciplinasPorTurmaPtd,
            $disciplinasPorTurmaHorario,
            $disciplinasDoProfessor,
            &$disciplinasResumo,
            &$salas,
            &$totalAlunos
        ) {
            $idsTurma = $turma->disciplinas->pluck('id')->map(fn($id) => (int) $id)->all();
            $idsVinculo = array_merge(
                $disciplinasPorTurmaPtd->get((string) $turma->id, []),
                $disciplinasPorTurmaHorario->get((string) $turma->id, [])
            );

            $idsPorCadastro = !empty($disciplinasDoProfessor)
                ? array_values(array_intersect($idsTurma, $disciplinasDoProfessor))
                : [];

            $idsMinhas = collect(array_merge($idsVinculo, $idsPorCadastro))
                ->filter()
                ->unique()
                ->values()
                ->all();

            if (empty($idsMinhas)) {
                $idsMinhas = $idsTurma;
            }

            $disciplinasMinhas = $turma->disciplinas
                ->whereIn('id', $idsMinhas)
                ->values()
                ->map(fn($d) => ['id' => $d->id, 'nome' => $d->nome]);

            foreach ($disciplinasMinhas as $d) {
                $disciplinasResumo->push($d);
            }

            $alunos = $turma->matriculas->map(fn($m) => [
                'matricula_id' => $m->id,
                'numero_matricula' => $m->numero_matricula,
                'aluno_id' => $m->aluno?->id,
                'nome' => $m->aluno?->nome ?? '-',
            ])->values();

            $totalAlunos += $alunos->count();

            $salaKey = $turma->sala ?: 'Sem sala';
            if (!isset($salas[$salaKey])) {
                $salas[$salaKey] = [
                    'sala' => $salaKey,
                    'turmas' => [],
                    'total_alunos' => 0,
                ];
            }
            $salas[$salaKey]['turmas'][] = $turma->nome;
            $salas[$salaKey]['total_alunos'] += $alunos->count();

            return [
                'id' => $turma->id,
                'nome' => $turma->nome,
                'sala' => $turma->sala,
                'turno' => $turma->turno,
                'curso' => $turma->serie?->nivel?->nome ?? '-',
                'disciplinas' => $disciplinasMinhas,
                'alunos' => $alunos,
                'total_alunos' => $alunos->count(),
            ];
        })->values();

        $cursos = $turmasPayload
            ->pluck('curso')
            ->filter()
            ->unique()
            ->values()
            ->map(fn($nome) => [
                'nome' => $nome,
                'turmas' => $turmasPayload->where('curso', $nome)->pluck('nome')->values(),
            ]);

        $disciplinas = $disciplinasResumo
            ->unique('id')
            ->sortBy('nome')
            ->values();

        return response()->json([
            'professor' => [
                'id' => $professor->id,
                'nome' => $professor->usuario?->nome ?? 'Professor',
                'unidade' => $professor->unidade,
            ],
            'ano_letivo' => $anoAtivo,
            'resumo' => [
                'total_cursos' => $cursos->count(),
                'total_disciplinas' => $disciplinas->count(),
                'total_turmas' => $turmasPayload->count(),
                'total_alunos' => $totalAlunos,
            ],
            'cursos' => $cursos,
            'disciplinas' => $disciplinas,
            'salas' => array_values($salas),
            'turmas' => $turmasPayload,
        ]);
    }
}
