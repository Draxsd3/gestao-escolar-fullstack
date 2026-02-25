-- ============================================================
-- Migration 010 — Sistema de Tarefas
-- Professor cria tarefa (com PDF opcional), aluno entrega (com resposta/PDF)
-- ============================================================

CREATE TABLE IF NOT EXISTS tarefas (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    titulo        VARCHAR(200) NOT NULL,
    descricao     TEXT NULL,
    disciplina_id SMALLINT UNSIGNED NULL,       -- disciplinas.id é SMALLINT UNSIGNED
    turma_id      INT UNSIGNED NOT NULL,
    professor_id  INT UNSIGNED NOT NULL,
    data_entrega  DATE NOT NULL,
    arquivo_path  VARCHAR(500) NULL,
    criado_em     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id) ON DELETE SET NULL,
    FOREIGN KEY (turma_id)      REFERENCES turmas(id)      ON DELETE CASCADE,
    FOREIGN KEY (professor_id)  REFERENCES professores(id) ON DELETE CASCADE,
    INDEX idx_turma (turma_id),
    INDEX idx_professor (professor_id),
    INDEX idx_data_entrega (data_entrega)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tarefa_entregas (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tarefa_id     INT UNSIGNED NOT NULL,
    aluno_id      INT UNSIGNED NOT NULL,
    entregue      TINYINT(1) DEFAULT 0,
    arquivo_path  VARCHAR(500) NULL,
    observacao    TEXT NULL,
    entregue_em   TIMESTAMP NULL,
    criado_em     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_tarefa_aluno (tarefa_id, aluno_id),
    FOREIGN KEY (tarefa_id) REFERENCES tarefas(id)  ON DELETE CASCADE,
    FOREIGN KEY (aluno_id)  REFERENCES alunos(id)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
