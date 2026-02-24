-- Script: 006_clear_periodos_avaliacao.sql
-- Purpose: remove todos os periodos avaliativos cadastrados e dados dependentes (notas/medias/criterios).
-- Uso: mysql -u user -p nome_do_banco < 006_clear_periodos_avaliacao.sql

-- ATENCAO: essa operacao apaga lancamentos de notas vinculados aos periodos.
-- Evita TRUNCATE para nao falhar com restricoes de chave estrangeira.

START TRANSACTION;

DELETE FROM medias_periodo;
DELETE FROM notas;
DELETE FROM criterios_avaliacao;
DELETE FROM periodos_avaliacao;

COMMIT;

-- Opcional: reset de AUTO_INCREMENT (descomente se desejar)
-- ALTER TABLE medias_periodo AUTO_INCREMENT = 1;
-- ALTER TABLE notas AUTO_INCREMENT = 1;
-- ALTER TABLE criterios_avaliacao AUTO_INCREMENT = 1;
-- ALTER TABLE periodos_avaliacao AUTO_INCREMENT = 1;
