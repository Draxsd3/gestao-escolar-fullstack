<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Turma extends Model
{
    use HasFactory;
    protected $table = 'turmas';
    protected $fillable = ['serie_id','ano_letivo_id','nome','turno','vagas','sala','ativa'];
    protected $casts = ['ativa' => 'boolean'];

    public function serie()     { return $this->belongsTo(Serie::class, 'serie_id'); }
    public function anoLetivo() { return $this->belongsTo(AnoLetivo::class, 'ano_letivo_id'); }
    public function matriculas(){ return $this->hasMany(Matricula::class, 'turma_id'); }
    public function disciplinas(){ return $this->belongsToMany(Disciplina::class, 'grade_curricular', 'turma_id', 'disciplina_id')->withPivot('aulas_semanais'); }
    public function horarios()  { return $this->hasMany(Horario::class, 'turma_id'); }
    public function aulas()     { return $this->hasMany(Aula::class, 'turma_id'); }

    public function getVagasDisponiveisAttribute(): int
    {
        return $this->vagas - $this->matriculas()->where('situacao', 'ativa')->count();
    }
}

class Serie extends Model
{
    protected $table = 'series';
    protected $fillable = ['nivel_id','nome','ordem'];
    public $timestamps = false;
    public function nivel()  { return $this->belongsTo(NivelEnsino::class, 'nivel_id'); }
    public function turmas() { return $this->hasMany(Turma::class, 'serie_id'); }
}

class AnoLetivo extends Model
{
    protected $table = 'anos_letivos';
    protected $fillable = ['ano','data_inicio','data_fim','ativo'];
    protected $casts = ['data_inicio' => 'date', 'data_fim' => 'date', 'ativo' => 'boolean'];

    public function turmas()   { return $this->hasMany(Turma::class, 'ano_letivo_id'); }
    public function periodos() { return $this->hasMany(PeriodoAvaliacao::class, 'ano_letivo_id'); }

    public static function ativo(): ?self
    {
        return static::where('ativo', true)->first();
    }
}

class Disciplina extends Model
{
    protected $table = 'disciplinas';
    protected $fillable = ['nome','codigo','carga_horaria_semanal','ativa'];
    protected $casts = ['ativa' => 'boolean'];
    public $timestamps = false;
}

class Responsavel extends Model
{
    protected $table = 'responsaveis';
    protected $fillable = ['usuario_id','nome','cpf','rg','email','telefone','telefone_alt','endereco','profissao','ativo'];
    protected $casts = ['endereco' => 'array', 'ativo' => 'boolean'];

    public function usuario() { return $this->belongsTo(User::class, 'usuario_id'); }
    public function alunos()  { return $this->belongsToMany(Aluno::class, 'aluno_responsavel', 'responsavel_id', 'aluno_id')->withPivot(['parentesco','responsavel_financeiro','contato_emergencia']); }
    public function contratos(){ return $this->hasMany(Contrato::class, 'responsavel_id'); }
}

class Professor extends Model
{
    protected $table = 'professores';
    protected $fillable = ['usuario_id','cpf','rg','data_nascimento','formacao','especializacao','registro_mec','telefone','endereco','ativo'];
    protected $casts = ['data_nascimento' => 'date', 'endereco' => 'array', 'ativo' => 'boolean'];

    public function usuario()   { return $this->belongsTo(User::class, 'usuario_id'); }
    public function turmas()    { return $this->hasMany(ProfessorTurmaDisciplina::class, 'professor_id'); }
    public function aulas()     { return $this->hasMany(Aula::class, 'professor_id'); }
}

class ProfessorTurmaDisciplina extends Model
{
    protected $table = 'professor_turma_disciplina';
    protected $fillable = ['professor_id','turma_id','disciplina_id','ano_letivo_id'];
    public $timestamps = false;

    public function professor()  { return $this->belongsTo(Professor::class, 'professor_id'); }
    public function turma()      { return $this->belongsTo(Turma::class, 'turma_id'); }
    public function disciplina() { return $this->belongsTo(Disciplina::class, 'disciplina_id'); }
}

class Horario extends Model
{
    protected $table = 'horarios';
    protected $fillable = ['turma_id','disciplina_id','professor_id','dia_semana','horario_inicio','horario_fim'];
    public $timestamps = false;

    public function turma()      { return $this->belongsTo(Turma::class, 'turma_id'); }
    public function disciplina() { return $this->belongsTo(Disciplina::class, 'disciplina_id'); }
    public function professor()  { return $this->belongsTo(Professor::class, 'professor_id'); }
}

class Aula extends Model
{
    protected $table = 'aulas';
    protected $fillable = ['turma_id','disciplina_id','professor_id','data_aula','numero_aulas','conteudo','observacoes'];
    protected $casts = ['data_aula' => 'date'];
    const UPDATED_AT = null;
    const CREATED_AT = 'lancado_em';

    public function turma()      { return $this->belongsTo(Turma::class, 'turma_id'); }
    public function disciplina() { return $this->belongsTo(Disciplina::class, 'disciplina_id'); }
    public function professor()  { return $this->belongsTo(Professor::class, 'professor_id'); }
    public function frequencias(){ return $this->hasMany(Frequencia::class, 'aula_id'); }
}

class Frequencia extends Model
{
    protected $table = 'frequencias';
    protected $fillable = ['aula_id','aluno_id','presente','justificativa'];
    protected $casts = ['presente' => 'boolean'];
    public $timestamps = false;

    public function aula()  { return $this->belongsTo(Aula::class, 'aula_id'); }
    public function aluno() { return $this->belongsTo(Aluno::class, 'aluno_id'); }
}

class PeriodoAvaliacao extends Model
{
    protected $table = 'periodos_avaliacao';
    protected $fillable = ['ano_letivo_id','nome','ordem','data_inicio','data_fim','peso'];
    protected $casts = ['data_inicio' => 'date', 'data_fim' => 'date'];
    public $timestamps = false;

    public function anoLetivo() { return $this->belongsTo(AnoLetivo::class, 'ano_letivo_id'); }
    public function notas()     { return $this->hasMany(Nota::class, 'periodo_id'); }
}

class Nota extends Model
{
    protected $table = 'notas';
    protected $fillable = ['matricula_id','disciplina_id','periodo_id','criterio_id','valor','observacoes','lancado_por'];
    const CREATED_AT = 'lancado_em';
    const UPDATED_AT = 'atualizado_em';

    public function matricula()  { return $this->belongsTo(Matricula::class, 'matricula_id'); }
    public function disciplina() { return $this->belongsTo(Disciplina::class, 'disciplina_id'); }
    public function periodo()    { return $this->belongsTo(PeriodoAvaliacao::class, 'periodo_id'); }
    public function lancadoPor() { return $this->belongsTo(User::class, 'lancado_por'); }
}

class MediaPeriodo extends Model
{
    protected $table = 'medias_periodo';
    protected $fillable = ['matricula_id','disciplina_id','periodo_id','media','situacao'];
    const UPDATED_AT = null;
    const CREATED_AT = 'calculado_em';

    public function matricula()  { return $this->belongsTo(Matricula::class, 'matricula_id'); }
    public function disciplina() { return $this->belongsTo(Disciplina::class, 'disciplina_id'); }
    public function periodo()    { return $this->belongsTo(PeriodoAvaliacao::class, 'periodo_id'); }
}

class MediaAnual extends Model
{
    protected $table = 'medias_anuais';
    protected $fillable = ['matricula_id','disciplina_id','media_final','frequencia_pct','situacao'];
    const UPDATED_AT = null;
    const CREATED_AT = 'calculado_em';

    public function matricula()  { return $this->belongsTo(Matricula::class, 'matricula_id'); }
    public function disciplina() { return $this->belongsTo(Disciplina::class, 'disciplina_id'); }
}

class Comunicado extends Model
{
    protected $table = 'comunicados';
    protected $fillable = ['titulo','corpo','autor_id','publico_alvo','turma_id','publicado','publicado_em','expira_em'];
    protected $casts = ['publicado' => 'boolean', 'publicado_em' => 'datetime', 'expira_em' => 'datetime'];

    public function autor() { return $this->belongsTo(User::class, 'autor_id'); }
    public function turma() { return $this->belongsTo(Turma::class, 'turma_id'); }
}

class Mensagem extends Model
{
    protected $table = 'mensagens';
    protected $fillable = ['remetente_id','destinatario_id','assunto','corpo','lida','lida_em'];
    protected $casts = ['lida' => 'boolean', 'lida_em' => 'datetime'];
    const UPDATED_AT = null;

    public function remetente()    { return $this->belongsTo(User::class, 'remetente_id'); }
    public function destinatario() { return $this->belongsTo(User::class, 'destinatario_id'); }
}

class PlanoPagamento extends Model
{
    protected $table = 'planos_pagamento';
    protected $fillable = ['nome','descricao','valor_mensalidade','dia_vencimento','desconto_antecipado','juros_atraso_diario','multa_atraso','ativo'];
    protected $casts = ['ativo' => 'boolean'];
    public $timestamps = false;

    public function contratos() { return $this->hasMany(Contrato::class, 'plano_id'); }
}

class Contrato extends Model
{
    protected $table = 'contratos';
    protected $fillable = ['matricula_id','responsavel_id','plano_id','valor_negociado','desconto_pct','desconto_motivo','data_inicio','data_fim','ativo','criado_por'];
    protected $casts = ['data_inicio' => 'date', 'data_fim' => 'date', 'ativo' => 'boolean'];

    public function matricula()   { return $this->belongsTo(Matricula::class, 'matricula_id'); }
    public function responsavel() { return $this->belongsTo(Responsavel::class, 'responsavel_id'); }
    public function plano()       { return $this->belongsTo(PlanoPagamento::class, 'plano_id'); }
    public function mensalidades(){ return $this->hasMany(Mensalidade::class, 'contrato_id'); }

    public function getValorEfetivoAttribute(): float
    {
        $base = $this->valor_negociado ?? $this->plano->valor_mensalidade;
        return round($base * (1 - $this->desconto_pct / 100), 2);
    }
}

class Mensalidade extends Model
{
    protected $table = 'mensalidades';
    protected $fillable = ['contrato_id','competencia','valor_original','valor_desconto','valor_acrescimo','valor_final','data_vencimento','situacao','data_pagamento','observacoes'];
    protected $casts = ['competencia' => 'date', 'data_vencimento' => 'date', 'data_pagamento' => 'date'];
    const UPDATED_AT = null;
    const CREATED_AT = 'gerado_em';

    public function contrato()     { return $this->belongsTo(Contrato::class, 'contrato_id'); }
    public function recebimentos() { return $this->hasMany(Recebimento::class, 'mensalidade_id'); }

    public function isAtrasada(): bool
    {
        return $this->situacao === 'pendente' && $this->data_vencimento->isPast();
    }
}

class Recebimento extends Model
{
    protected $table = 'recebimentos';
    protected $fillable = ['mensalidade_id','valor','forma_pagamento','data_recebimento','numero_documento','observacoes','registrado_por'];
    protected $casts = ['data_recebimento' => 'date'];
    const UPDATED_AT = null;
    const CREATED_AT = 'registrado_em';

    public function mensalidade()  { return $this->belongsTo(Mensalidade::class, 'mensalidade_id'); }
    public function registradoPor(){ return $this->belongsTo(User::class, 'registrado_por'); }
}

class Auditoria extends Model
{
    protected $table = 'auditoria';
    protected $fillable = ['usuario_id','acao','entidade','entidade_id','dados_anteriores','dados_novos','ip','user_agent'];
    protected $casts = ['dados_anteriores' => 'array', 'dados_novos' => 'array'];
    public $timestamps = false;
    const CREATED_AT = 'criado_em';

    public function usuario() { return $this->belongsTo(User::class, 'usuario_id'); }

    public static function registrar(string $acao, string $entidade, mixed $id, ?array $antes = null, ?array $depois = null): void
    {
        static::create([
            'usuario_id'       => auth()->id(),
            'acao'             => $acao,
            'entidade'         => $entidade,
            'entidade_id'      => (string) $id,
            'dados_anteriores' => $antes,
            'dados_novos'      => $depois,
            'ip'               => request()->ip(),
            'user_agent'       => request()->userAgent(),
        ]);
    }
}
