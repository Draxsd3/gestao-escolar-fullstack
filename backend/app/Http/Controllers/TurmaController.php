<?php

namespace App\Http\Controllers;

use App\Models\{Turma, AnoLetivo, Disciplina, Serie};
use Illuminate\Http\{Request, JsonResponse};

class TurmaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Turma::with(['serie.nivel', 'anoLetivo'])
            ->withCount(['matriculas' => fn($q) => $q->where('situacao', 'ativa')])
            ->when($request->ano_letivo_id, fn($q) => $q->where('ano_letivo_id', $request->ano_letivo_id))
            ->when($request->serie_id, fn($q) => $q->where('serie_id', $request->serie_id))
            ->when($request->turno, fn($q) => $q->where('turno', $request->turno))
            ->where('ativa', true);

        return response()->json($query->orderBy('nome')->get());
    }

    public function show(int $id): JsonResponse
    {
        $turma = Turma::with([
            'serie.nivel', 'anoLetivo',
            'disciplinas', 'horarios.professor.usuario', 'horarios.disciplina',
            'matriculas' => fn($q) => $q->where('situacao','ativa'),
            'matriculas.aluno',
        ])->findOrFail($id);

        return response()->json($turma);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'serie_id'     => ['required', 'exists:series,id'],
            'ano_letivo_id'=> ['required', 'exists:anos_letivos,id'],
            'nome'         => ['required', 'string', 'max:10'],
            'turno'        => ['required', 'in:manha,tarde,noite,integral'],
            'vagas'        => ['required', 'integer', 'min:1', 'max:60'],
            'sala'         => ['nullable', 'string'],
        ]);

        $turma = Turma::create($data);
        return response()->json($turma->load('serie.nivel'), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $turma = Turma::findOrFail($id);
        $data = $request->validate([
            'nome'  => ['sometimes', 'string', 'max:10'],
            'turno' => ['sometimes', 'in:manha,tarde,noite,integral'],
            'vagas' => ['sometimes', 'integer', 'min:1'],
            'sala'  => ['nullable', 'string'],
            'ativa' => ['sometimes', 'boolean'],
        ]);
        $turma->update($data);
        return response()->json($turma->fresh()->load('serie.nivel'));
    }

    public function alunos(int $id): JsonResponse
    {
        $turma = Turma::findOrFail($id);
        $matriculas = $turma->matriculas()
            ->where('situacao', 'ativa')
            ->with('aluno')
            ->get()
            ->map(fn($m) => ['matricula_id' => $m->id, 'numero' => $m->numero_matricula, 'aluno' => $m->aluno]);

        return response()->json($matriculas);
    }
}

// ─────────────────────────────────────────────────────────────

namespace App\Http\Controllers;

use Illuminate\Http\{Request, JsonResponse};
use Illuminate\Support\Facades\DB;
use App\Models\{Aluno, Matricula, Turma, Mensalidade, AnoLetivo, Comunicado};

class DashboardController extends Controller
{
    public function admin(): JsonResponse
    {
        $anoLetivo = AnoLetivo::ativo();

        $totalAlunos = Aluno::where('ativo', true)->count();
        $totalMatriculas = $anoLetivo
            ? Matricula::where('ano_letivo_id', $anoLetivo->id)->where('situacao', 'ativa')->count()
            : 0;
        $totalTurmas = Turma::where('ativa', true)
            ->when($anoLetivo, fn($q) => $q->where('ano_letivo_id', $anoLetivo->id))
            ->count();

        $recebidoMes = Mensalidade::whereYear('competencia', now()->year)
            ->whereMonth('competencia', now()->month)
            ->whereIn('situacao', ['pago','parcial'])
            ->sum('valor_final');

        $inadimplentes = Mensalidade::where('situacao', 'pendente')
            ->where('data_vencimento', '<', now())
            ->count();

        $comunicados = Comunicado::where('publicado', true)
            ->orderBy('publicado_em', 'desc')
            ->take(5)
            ->get(['id', 'titulo', 'publico_alvo', 'publicado_em']);

        return response()->json([
            'total_alunos'      => $totalAlunos,
            'total_matriculas'  => $totalMatriculas,
            'total_turmas'      => $totalTurmas,
            'recebido_mes'      => $recebidoMes,
            'inadimplentes'     => $inadimplentes,
            'ano_letivo'        => $anoLetivo,
            'comunicados_recentes' => $comunicados,
        ]);
    }

    public function professor(Request $request): JsonResponse
    {
        $user = $request->user();
        $professor = $user->professor;

        if (!$professor) {
            return response()->json(['message' => 'Professor não encontrado.'], 404);
        }

        $turmas = DB::table('professor_turma_disciplina as ptd')
            ->join('turmas as t', 't.id', '=', 'ptd.turma_id')
            ->join('series as s', 's.id', '=', 't.serie_id')
            ->join('disciplinas as d', 'd.id', '=', 'ptd.disciplina_id')
            ->where('ptd.professor_id', $professor->id)
            ->where('ptd.ano_letivo_id', AnoLetivo::ativo()?->id)
            ->select('t.id as turma_id', 't.nome as turma', 's.nome as serie', 'd.id as disciplina_id', 'd.nome as disciplina')
            ->get();

        return response()->json([
            'professor'       => $professor->load('usuario'),
            'turmas_disciplinas' => $turmas,
        ]);
    }

    public function responsavel(Request $request): JsonResponse
    {
        $user = $request->user();
        $responsavel = $user->responsavel;

        if (!$responsavel) {
            return response()->json(['message' => 'Responsável não encontrado.'], 404);
        }

        $alunos = $responsavel->alunos()->with([
            'matriculaAtiva.turma.serie',
            'matriculaAtiva.mediasAnuais.disciplina',
        ])->get();

        return response()->json([
            'responsavel' => $responsavel,
            'alunos'      => $alunos,
        ]);
    }
}

// ─────────────────────────────────────────────────────────────

namespace App\Http\Controllers;

use App\Models\{Comunicado, Mensagem};
use Illuminate\Http\{Request, JsonResponse};

class ComunicacaoController extends Controller
{
    public function comunicados(Request $request): JsonResponse
    {
        $user = $request->user();
        $perfil = $user->perfil->nome;

        $query = Comunicado::with('autor')
            ->where('publicado', true)
            ->where(fn($q) => $q
                ->where('publico_alvo', 'todos')
                ->orWhere('publico_alvo', $perfil === 'responsavel' ? 'responsaveis' :
                    ($perfil === 'professor' ? 'professores' :
                    ($perfil === 'aluno' ? 'alunos' : 'funcionarios')))
                ->orWhere(fn($q2) => $q2->where('publico_alvo', 'turma')
                    ->whereHas('turma.matriculas', fn($q3) =>
                        $q3->where('aluno_id', $user->aluno?->id)->where('situacao','ativa')
                    )
                )
            )
            ->orderBy('publicado_em', 'desc');

        return response()->json($query->paginate(10));
    }

    public function criarComunicado(Request $request): JsonResponse
    {
        $data = $request->validate([
            'titulo'      => ['required', 'string', 'max:200'],
            'corpo'       => ['required', 'string'],
            'publico_alvo'=> ['required', 'in:todos,alunos,responsaveis,professores,funcionarios,turma'],
            'turma_id'    => ['required_if:publico_alvo,turma', 'exists:turmas,id'],
            'publicado'   => ['boolean'],
            'expira_em'   => ['nullable', 'date'],
        ]);

        $data['autor_id'] = auth()->id();
        if ($data['publicado'] ?? false) {
            $data['publicado_em'] = now();
        }

        $comunicado = Comunicado::create($data);
        return response()->json($comunicado->load('autor'), 201);
    }

    public function mensagens(Request $request): JsonResponse
    {
        $msgs = Mensagem::with('remetente')
            ->where('destinatario_id', auth()->id())
            ->orderBy('criado_em', 'desc')
            ->paginate(20);

        return response()->json($msgs);
    }

    public function enviarMensagem(Request $request): JsonResponse
    {
        $data = $request->validate([
            'destinatario_id' => ['required', 'exists:usuarios,id'],
            'assunto'         => ['required', 'string', 'max:200'],
            'corpo'           => ['required', 'string'],
        ]);

        $data['remetente_id'] = auth()->id();
        $mensagem = Mensagem::create($data);

        return response()->json($mensagem->load(['remetente','destinatario']), 201);
    }

    public function marcarLida(int $id): JsonResponse
    {
        $msg = Mensagem::where('destinatario_id', auth()->id())->findOrFail($id);
        $msg->update(['lida' => true, 'lida_em' => now()]);
        return response()->json($msg);
    }
}
