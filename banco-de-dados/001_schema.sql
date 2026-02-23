-- ============================================================
-- BABEL - Sistema de Gestão Escolar
-- Schema do Banco de Dados MySQL
-- ============================================================

CREATE DATABASE IF NOT EXISTS babel_escola CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE babel_escola;

-- ============================================================
-- USUÁRIOS E AUTENTICAÇÃO
-- ============================================================

CREATE TABLE perfis (
    id TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    descricao VARCHAR(200),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuarios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    perfil_id TINYINT UNSIGNED NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    ultimo_login TIMESTAMP NULL,
    remember_token VARCHAR(100) NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (perfil_id) REFERENCES perfis(id)
);

CREATE TABLE tokens_acesso (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expira_em TIMESTAMP NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_usuario (usuario_id)
);

-- ============================================================
-- ESTRUTURA ESCOLAR
-- ============================================================

CREATE TABLE niveis_ensino (
    id TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(80) NOT NULL,
    descricao VARCHAR(200)
);

CREATE TABLE series (
    id TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nivel_id TINYINT UNSIGNED NOT NULL,
    nome VARCHAR(80) NOT NULL,
    ordem TINYINT UNSIGNED NOT NULL DEFAULT 1,
    FOREIGN KEY (nivel_id) REFERENCES niveis_ensino(id)
);

CREATE TABLE anos_letivos (
    id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ano INT(4) NOT NULL UNIQUE,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    ativo BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE turmas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    serie_id TINYINT UNSIGNED NOT NULL,
    ano_letivo_id SMALLINT UNSIGNED NOT NULL,
    nome VARCHAR(10) NOT NULL,
    turno ENUM('manha','tarde','noite','integral') NOT NULL,
    vagas TINYINT UNSIGNED DEFAULT 35,
    sala VARCHAR(20),
    ativa BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (serie_id) REFERENCES series(id),
    FOREIGN KEY (ano_letivo_id) REFERENCES anos_letivos(id),
    UNIQUE KEY uk_turma (serie_id, ano_letivo_id, nome)
);

CREATE TABLE disciplinas (
    id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    codigo VARCHAR(20) UNIQUE,
    carga_horaria_semanal TINYINT UNSIGNED DEFAULT 2,
    ativa BOOLEAN DEFAULT TRUE
);

CREATE TABLE grade_curricular (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    turma_id INT UNSIGNED NOT NULL,
    disciplina_id SMALLINT UNSIGNED NOT NULL,
    aulas_semanais TINYINT UNSIGNED DEFAULT 2,
    FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE CASCADE,
    FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id),
    UNIQUE KEY uk_grade (turma_id, disciplina_id)
);

-- ============================================================
-- PESSOAS
-- ============================================================

CREATE TABLE alunos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NULL,
    nome VARCHAR(150) NOT NULL,
    nome_social VARCHAR(150) NULL,
    cpf VARCHAR(14) UNIQUE NULL,
    rg VARCHAR(20) NULL,
    data_nascimento DATE NOT NULL,
    sexo ENUM('M','F','O') NOT NULL,
    naturalidade VARCHAR(100),
    nacionalidade VARCHAR(80) DEFAULT 'Brasileiro',
    foto VARCHAR(255) NULL,
    email VARCHAR(150) NULL,
    telefone VARCHAR(20) NULL,
    endereco JSON NULL,
    informacoes_medicas TEXT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_nome (nome),
    INDEX idx_cpf (cpf)
);

CREATE TABLE responsaveis (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NULL,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) UNIQUE NULL,
    rg VARCHAR(20) NULL,
    email VARCHAR(150) NULL,
    telefone VARCHAR(20) NULL,
    telefone_alt VARCHAR(20) NULL,
    endereco JSON NULL,
    profissao VARCHAR(100) NULL,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE aluno_responsavel (
    aluno_id INT UNSIGNED NOT NULL,
    responsavel_id INT UNSIGNED NOT NULL,
    parentesco VARCHAR(50) NOT NULL,
    responsavel_financeiro BOOLEAN DEFAULT FALSE,
    contato_emergencia BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (aluno_id, responsavel_id),
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
    FOREIGN KEY (responsavel_id) REFERENCES responsaveis(id) ON DELETE CASCADE
);

CREATE TABLE professores (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL UNIQUE,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    rg VARCHAR(20) NULL,
    data_nascimento DATE NULL,
    formacao VARCHAR(200) NULL,
    especializacao VARCHAR(200) NULL,
    registro_mec VARCHAR(50) NULL,
    telefone VARCHAR(20) NULL,
    endereco JSON NULL,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE funcionarios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL UNIQUE,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    departamento VARCHAR(100) NULL,
    data_admissao DATE NULL,
    salario DECIMAL(10,2) NULL,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ============================================================
-- PROFESSOR -> DISCIPLINA -> TURMA
-- ============================================================

CREATE TABLE professor_turma_disciplina (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    professor_id INT UNSIGNED NOT NULL,
    turma_id INT UNSIGNED NOT NULL,
    disciplina_id SMALLINT UNSIGNED NOT NULL,
    ano_letivo_id SMALLINT UNSIGNED NOT NULL,
    FOREIGN KEY (professor_id) REFERENCES professores(id),
    FOREIGN KEY (turma_id) REFERENCES turmas(id),
    FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id),
    FOREIGN KEY (ano_letivo_id) REFERENCES anos_letivos(id),
    UNIQUE KEY uk_ptd (professor_id, turma_id, disciplina_id, ano_letivo_id)
);

-- ============================================================
-- MATRÍCULAS
-- ============================================================

CREATE TABLE matriculas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT UNSIGNED NOT NULL,
    turma_id INT UNSIGNED NOT NULL,
    ano_letivo_id SMALLINT UNSIGNED NOT NULL,
    numero_matricula VARCHAR(20) NOT NULL UNIQUE,
    data_matricula DATE NOT NULL,
    situacao ENUM('ativa','trancada','transferida','concluida','cancelada') DEFAULT 'ativa',
    observacoes TEXT NULL,
    criado_por INT UNSIGNED NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id),
    FOREIGN KEY (turma_id) REFERENCES turmas(id),
    FOREIGN KEY (ano_letivo_id) REFERENCES anos_letivos(id),
    FOREIGN KEY (criado_por) REFERENCES usuarios(id),
    INDEX idx_aluno (aluno_id),
    INDEX idx_turma (turma_id)
);

-- ============================================================
-- CALENDÁRIO LETIVO
-- ============================================================

CREATE TABLE calendario_letivo (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ano_letivo_id SMALLINT UNSIGNED NOT NULL,
    data DATE NOT NULL,
    tipo ENUM('aula','feriado','recesso','evento','prova','reuniao') NOT NULL,
    descricao VARCHAR(200) NULL,
    aplica_todas_turmas BOOLEAN DEFAULT TRUE,
    turma_id INT UNSIGNED NULL,
    FOREIGN KEY (ano_letivo_id) REFERENCES anos_letivos(id),
    FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE SET NULL,
    INDEX idx_data (data),
    INDEX idx_ano (ano_letivo_id)
);

CREATE TABLE horarios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    turma_id INT UNSIGNED NOT NULL,
    disciplina_id SMALLINT UNSIGNED NOT NULL,
    professor_id INT UNSIGNED NOT NULL,
    dia_semana TINYINT UNSIGNED NOT NULL COMMENT '0=Dom,1=Seg,...,6=Sab',
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    FOREIGN KEY (turma_id) REFERENCES turmas(id),
    FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id),
    FOREIGN KEY (professor_id) REFERENCES professores(id)
);

-- ============================================================
-- FREQUÊNCIA / PRESENÇA
-- ============================================================

CREATE TABLE aulas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    turma_id INT UNSIGNED NOT NULL,
    disciplina_id SMALLINT UNSIGNED NOT NULL,
    professor_id INT UNSIGNED NOT NULL,
    data_aula DATE NOT NULL,
    numero_aulas TINYINT UNSIGNED DEFAULT 1,
    conteudo TEXT NULL,
    observacoes TEXT NULL,
    lancado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (turma_id) REFERENCES turmas(id),
    FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id),
    FOREIGN KEY (professor_id) REFERENCES professores(id),
    INDEX idx_turma_data (turma_id, data_aula)
);

CREATE TABLE frequencias (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    aula_id BIGINT UNSIGNED NOT NULL,
    aluno_id INT UNSIGNED NOT NULL,
    presente BOOLEAN NOT NULL DEFAULT TRUE,
    justificativa TEXT NULL,
    FOREIGN KEY (aula_id) REFERENCES aulas(id) ON DELETE CASCADE,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id),
    UNIQUE KEY uk_freq (aula_id, aluno_id),
    INDEX idx_aluno (aluno_id)
);

-- ============================================================
-- NOTAS / AVALIAÇÕES
-- ============================================================

CREATE TABLE periodos_avaliacao (
    id TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ano_letivo_id SMALLINT UNSIGNED NOT NULL,
    nome VARCHAR(50) NOT NULL,
    ordem TINYINT UNSIGNED NOT NULL,
    data_inicio DATE NULL,
    data_fim DATE NULL,
    peso DECIMAL(5,2) DEFAULT 1.00,
    FOREIGN KEY (ano_letivo_id) REFERENCES anos_letivos(id)
);

CREATE TABLE criterios_avaliacao (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    turma_id INT UNSIGNED NOT NULL,
    disciplina_id SMALLINT UNSIGNED NOT NULL,
    periodo_id TINYINT UNSIGNED NOT NULL,
    nome VARCHAR(100) NOT NULL,
    peso DECIMAL(5,2) DEFAULT 1.00,
    nota_maxima DECIMAL(5,2) DEFAULT 10.00,
    FOREIGN KEY (turma_id) REFERENCES turmas(id),
    FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id),
    FOREIGN KEY (periodo_id) REFERENCES periodos_avaliacao(id)
);

CREATE TABLE notas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    matricula_id INT UNSIGNED NOT NULL,
    disciplina_id SMALLINT UNSIGNED NOT NULL,
    periodo_id TINYINT UNSIGNED NOT NULL,
    criterio_id INT UNSIGNED NULL,
    valor DECIMAL(5,2) NOT NULL,
    observacoes TEXT NULL,
    lancado_por INT UNSIGNED NOT NULL,
    lancado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (matricula_id) REFERENCES matriculas(id),
    FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id),
    FOREIGN KEY (periodo_id) REFERENCES periodos_avaliacao(id),
    FOREIGN KEY (criterio_id) REFERENCES criterios_avaliacao(id) ON DELETE SET NULL,
    FOREIGN KEY (lancado_por) REFERENCES usuarios(id),
    INDEX idx_matricula (matricula_id),
    INDEX idx_disciplina (disciplina_id)
);

CREATE TABLE medias_periodo (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    matricula_id INT UNSIGNED NOT NULL,
    disciplina_id SMALLINT UNSIGNED NOT NULL,
    periodo_id TINYINT UNSIGNED NOT NULL,
    media DECIMAL(5,2) NOT NULL,
    situacao ENUM('aprovado','reprovado','recuperacao','pendente') DEFAULT 'pendente',
    calculado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (matricula_id) REFERENCES matriculas(id),
    FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id),
    FOREIGN KEY (periodo_id) REFERENCES periodos_avaliacao(id),
    UNIQUE KEY uk_media (matricula_id, disciplina_id, periodo_id)
);

CREATE TABLE medias_anuais (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    matricula_id INT UNSIGNED NOT NULL,
    disciplina_id SMALLINT UNSIGNED NOT NULL,
    media_final DECIMAL(5,2) NOT NULL,
    frequencia_pct DECIMAL(5,2) NOT NULL DEFAULT 0,
    situacao ENUM('aprovado','reprovado','recuperacao','pendente') DEFAULT 'pendente',
    calculado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (matricula_id) REFERENCES matriculas(id),
    FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id),
    UNIQUE KEY uk_media_anual (matricula_id, disciplina_id)
);

-- ============================================================
-- COMUNICAÇÃO
-- ============================================================

CREATE TABLE comunicados (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    corpo TEXT NOT NULL,
    autor_id INT UNSIGNED NOT NULL,
    publico_alvo ENUM('todos','alunos','responsaveis','professores','funcionarios','turma') NOT NULL,
    turma_id INT UNSIGNED NULL,
    publicado BOOLEAN DEFAULT FALSE,
    publicado_em TIMESTAMP NULL,
    expira_em TIMESTAMP NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (autor_id) REFERENCES usuarios(id),
    FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE SET NULL,
    INDEX idx_publicado (publicado, publicado_em)
);

CREATE TABLE mensagens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    remetente_id INT UNSIGNED NOT NULL,
    destinatario_id INT UNSIGNED NOT NULL,
    assunto VARCHAR(200) NOT NULL,
    corpo TEXT NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    lida_em TIMESTAMP NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (remetente_id) REFERENCES usuarios(id),
    FOREIGN KEY (destinatario_id) REFERENCES usuarios(id),
    INDEX idx_destinatario (destinatario_id, lida)
);

-- ============================================================
-- FINANCEIRO
-- ============================================================

CREATE TABLE planos_pagamento (
    id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT NULL,
    valor_mensalidade DECIMAL(10,2) NOT NULL,
    dia_vencimento TINYINT UNSIGNED NOT NULL DEFAULT 10,
    desconto_antecipado DECIMAL(5,2) DEFAULT 0.00,
    juros_atraso_diario DECIMAL(5,4) DEFAULT 0.0033,
    multa_atraso DECIMAL(5,2) DEFAULT 2.00,
    ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE contratos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    matricula_id INT UNSIGNED NOT NULL UNIQUE,
    responsavel_id INT UNSIGNED NOT NULL,
    plano_id SMALLINT UNSIGNED NOT NULL,
    valor_negociado DECIMAL(10,2) NULL,
    desconto_pct DECIMAL(5,2) DEFAULT 0.00,
    desconto_motivo VARCHAR(200) NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NULL,
    ativo BOOLEAN DEFAULT TRUE,
    criado_por INT UNSIGNED NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (matricula_id) REFERENCES matriculas(id),
    FOREIGN KEY (responsavel_id) REFERENCES responsaveis(id),
    FOREIGN KEY (plano_id) REFERENCES planos_pagamento(id),
    FOREIGN KEY (criado_por) REFERENCES usuarios(id)
);

CREATE TABLE mensalidades (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    contrato_id INT UNSIGNED NOT NULL,
    competencia DATE NOT NULL,
    valor_original DECIMAL(10,2) NOT NULL,
    valor_desconto DECIMAL(10,2) DEFAULT 0.00,
    valor_acrescimo DECIMAL(10,2) DEFAULT 0.00,
    valor_final DECIMAL(10,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    situacao ENUM('pendente','pago','parcial','cancelado','isento') DEFAULT 'pendente',
    data_pagamento DATE NULL,
    observacoes TEXT NULL,
    gerado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contrato_id) REFERENCES contratos(id),
    UNIQUE KEY uk_mensalidade (contrato_id, competencia),
    INDEX idx_vencimento (data_vencimento, situacao),
    INDEX idx_situacao (situacao)
);

CREATE TABLE recebimentos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    mensalidade_id INT UNSIGNED NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    forma_pagamento ENUM('dinheiro','pix','boleto','cartao_credito','cartao_debito','transferencia','cheque') NOT NULL,
    data_recebimento DATE NOT NULL,
    numero_documento VARCHAR(100) NULL,
    observacoes TEXT NULL,
    registrado_por INT UNSIGNED NOT NULL,
    registrado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mensalidade_id) REFERENCES mensalidades(id),
    FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
);

-- ============================================================
-- AUDITORIA
-- ============================================================

CREATE TABLE auditoria (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NULL,
    acao VARCHAR(100) NOT NULL,
    entidade VARCHAR(100) NOT NULL,
    entidade_id VARCHAR(50) NOT NULL,
    dados_anteriores JSON NULL,
    dados_novos JSON NULL,
    ip VARCHAR(45) NULL,
    user_agent VARCHAR(500) NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuario (usuario_id),
    INDEX idx_entidade (entidade, entidade_id),
    INDEX idx_criado (criado_em)
);

-- ============================================================
-- SANCTUM - Tabela de tokens de acesso (Laravel Sanctum padrão)
-- ============================================================

CREATE TABLE IF NOT EXISTS personal_access_tokens (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tokenable_type VARCHAR(255) NOT NULL,
    tokenable_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    abilities TEXT NULL,
    last_used_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX pat_tokenable_index (tokenable_type, tokenable_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
