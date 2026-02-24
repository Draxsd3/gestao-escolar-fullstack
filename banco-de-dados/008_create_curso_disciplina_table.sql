-- Script: 008_create_curso_disciplina_table.sql
-- Purpose: cria vinculo entre cursos e disciplinas para validar grade e lancamento de notas.
-- Uso: mysql -u user -p nome_do_banco < 008_create_curso_disciplina_table.sql

CREATE TABLE IF NOT EXISTS curso_disciplina (
    curso_id TINYINT UNSIGNED NOT NULL,
    disciplina_id SMALLINT UNSIGNED NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (curso_id, disciplina_id),
    CONSTRAINT fk_curso_disciplina_curso
        FOREIGN KEY (curso_id) REFERENCES niveis_ensino(id) ON DELETE CASCADE,
    CONSTRAINT fk_curso_disciplina_disciplina
        FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id) ON DELETE CASCADE
);

-- Migra vinculos existentes com base na grade das turmas ja cadastradas.
INSERT IGNORE INTO curso_disciplina (curso_id, disciplina_id)
SELECT DISTINCT s.nivel_id, gc.disciplina_id
FROM grade_curricular gc
INNER JOIN turmas t ON t.id = gc.turma_id
INNER JOIN series s ON s.id = t.serie_id
WHERE s.nivel_id IS NOT NULL;
