-- Inserir um Ano Letivo com alguns bimestres de exemplo
-- Execute este arquivo no banco `babel_escola` (MySQL).

INSERT INTO anos_letivos (ano, data_inicio, data_fim, ativo)
VALUES (2026, '2026-02-01', '2026-12-15', TRUE);

-- Usa LAST_INSERT_ID() para referenciar o id recém-criado
SET @ano_id = LAST_INSERT_ID();

INSERT INTO periodos_avaliacao (ano_letivo_id, nome, ordem, data_inicio, data_fim)
VALUES
(@ano_id, '1º Bimestre', 1, '2026-02-01', '2026-04-30'),
(@ano_id, '2º Bimestre', 2, '2026-05-01', '2026-07-31'),
(@ano_id, '3º Bimestre', 3, '2026-08-01', '2026-10-15'),
(@ano_id, '4º Bimestre', 4, '2026-10-16', '2026-12-15');

-- Verificar inserção
SELECT * FROM anos_letivos WHERE id = @ano_id;
SELECT * FROM periodos_avaliacao WHERE ano_letivo_id = @ano_id;
