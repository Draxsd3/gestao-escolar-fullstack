-- Script: 011_create_professor_disciplina_table.sql
-- Purpose: vincular professores as disciplinas que eles podem ministrar.
-- Uso: mysql -u user -p nome_do_banco < 011_create_professor_disciplina_table.sql

CREATE TABLE IF NOT EXISTS professor_disciplina (
    professor_id INT UNSIGNED NOT NULL,
    disciplina_id SMALLINT UNSIGNED NOT NULL,
    PRIMARY KEY (professor_id, disciplina_id),
    CONSTRAINT fk_prof_disc_professor
        FOREIGN KEY (professor_id) REFERENCES professores(id) ON DELETE CASCADE,
    CONSTRAINT fk_prof_disc_disciplina
        FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id) ON DELETE CASCADE
);

