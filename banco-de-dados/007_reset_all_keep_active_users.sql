-- Script: 007_reset_all_keep_active_users.sql
-- Purpose: apaga todos os dados do banco atual, mantendo apenas usuarios ativos e seus perfis.
-- Uso: mysql -u user -p nome_do_banco < 007_reset_all_keep_active_users.sql

-- ATENCAO:
-- 1) sempre faca backup antes de executar.
-- 2) usuarios inativos serao removidos.
-- 3) tokens/sessoes serao apagados.
-- 4) script usa DELETE (nao TRUNCATE) para evitar erro com FKs.
-- 5) script NAO usa information_schema (ambientes com permissao restrita).

SET SQL_SAFE_UPDATES = 0;
START TRANSACTION;

DROP TEMPORARY TABLE IF EXISTS tmp_usuarios_ativos;
CREATE TEMPORARY TABLE tmp_usuarios_ativos AS
SELECT *
FROM usuarios
WHERE ativo = 1;

SET FOREIGN_KEY_CHECKS = 0;

-- Financeiro
DELETE FROM recebimentos;
DELETE FROM mensalidades;
DELETE FROM contratos;
DELETE FROM planos_pagamento;

-- Comunicacao
DELETE FROM mensagens;
DELETE FROM comunicados;

-- Academico: notas e frequencia
DELETE FROM medias_periodo;
DELETE FROM medias_anuais;
DELETE FROM notas;
DELETE FROM criterios_avaliacao;
DELETE FROM periodos_avaliacao;
DELETE FROM frequencias;
DELETE FROM aulas;
DELETE FROM horarios;
DELETE FROM calendario_letivo;

-- Vínculos curriculares e matrículas
DELETE FROM professor_turma_disciplina;
DELETE FROM grade_curricular;
DELETE FROM matriculas;
DELETE FROM aluno_responsavel;

-- Cadastros de pessoas
DELETE FROM responsaveis;
DELETE FROM alunos;
DELETE FROM professores;
DELETE FROM funcionarios;

-- Estrutura escolar
DELETE FROM turmas;
DELETE FROM curso_disciplina;
DELETE FROM disciplinas;
DELETE FROM salas;
DELETE FROM series;
DELETE FROM niveis_ensino;
DELETE FROM anos_letivos;

-- Auditoria e tokens/sessoes
DELETE FROM auditoria;
DELETE FROM tokens_acesso;
DELETE FROM personal_access_tokens;

SET FOREIGN_KEY_CHECKS = 1;

-- Remove inativos e mantém apenas os ativos salvos.
DELETE FROM usuarios;
INSERT INTO usuarios
SELECT *
FROM tmp_usuarios_ativos;

DROP TEMPORARY TABLE IF EXISTS tmp_usuarios_ativos;

COMMIT;

-- Opcional: reset de AUTO_INCREMENT (usuarios continua a partir do max atual automaticamente).
-- Voce pode ajustar manualmente se desejar:
-- ALTER TABLE usuarios AUTO_INCREMENT = 1;
