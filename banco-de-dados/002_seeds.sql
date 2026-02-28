-- ============================================================
-- BABEL - Seeds de demonstração
-- Revisado e validado contra o schema 001_schema.sql
-- ============================================================

USE babel_escola;

-- ============================================================
-- perfis: (id, nome, descricao, criado_em*)
-- ============================================================
INSERT INTO perfis (id, nome, descricao) VALUES
(1, 'admin',       'Administrador do sistema com acesso total'),
(2, 'secretaria',  'Secretaria escolar - cadastros e matrículas'),
(3, 'coordenacao', 'Coordenação pedagógica'),
(4, 'professor',   'Professor - lança notas e frequência'),
(5, 'responsavel', 'Pai/mãe/responsável pelo aluno'),
(6, 'aluno',       'Aluno - acesso ao próprio boletim');

-- ============================================================
-- usuarios: (id, nome, email, senha, perfil_id, ativo,
--            ultimo_login*, remember_token*, criado_em*, atualizado_em*)
-- Senha: Babel@2025
-- ============================================================
INSERT INTO usuarios (id, nome, email, senha, perfil_id, ativo) VALUES
(1,  'Administrador Babel',    'admin@babel.edu.br',          '$2y$12$hGxjXzMT3KWx6oSQsWy3vevLhM.FXt8f/nIBZr2c8esCmg2GwHIUi', 1, TRUE),
(2,  'Ana Paula Ferreira',     'secretaria@babel.edu.br',     '$2y$12$hGxjXzMT3KWx6oSQsWy3vevLhM.FXt8f/nIBZr2c8esCmg2GwHIUi', 2, TRUE),
(3,  'Carlos Henrique Moraes', 'coordenacao@babel.edu.br',    '$2y$12$hGxjXzMT3KWx6oSQsWy3vevLhM.FXt8f/nIBZr2c8esCmg2GwHIUi', 3, TRUE),
(4,  'Prof. Roberto Alves',    'roberto.alves@babel.edu.br',  '$2y$12$hGxjXzMT3KWx6oSQsWy3vevLhM.FXt8f/nIBZr2c8esCmg2GwHIUi', 4, TRUE),
(5,  'Profa. Fernanda Costa',  'fernanda.costa@babel.edu.br', '$2y$12$hGxjXzMT3KWx6oSQsWy3vevLhM.FXt8f/nIBZr2c8esCmg2GwHIUi', 4, TRUE),
(6,  'Profa. Juliana Martins', 'juliana.martins@babel.edu.br','$2y$12$hGxjXzMT3KWx6oSQsWy3vevLhM.FXt8f/nIBZr2c8esCmg2GwHIUi', 4, TRUE),
(7,  'Maria José Santos',      'mariajose@gmail.com',         '$2y$12$hGxjXzMT3KWx6oSQsWy3vevLhM.FXt8f/nIBZr2c8esCmg2GwHIUi', 5, TRUE),
(8,  'João Carlos Pereira',    'joaocarlos@gmail.com',        '$2y$12$hGxjXzMT3KWx6oSQsWy3vevLhM.FXt8f/nIBZr2c8esCmg2GwHIUi', 5, TRUE),
(9,  'Lucas Santos Pereira',   'lucas.santos@babel.edu.br',   '$2y$12$hGxjXzMT3KWx6oSQsWy3vevLhM.FXt8f/nIBZr2c8esCmg2GwHIUi', 6, TRUE),
(10, 'Beatriz Pereira Lima',   'beatriz.lima@babel.edu.br',   '$2y$12$hGxjXzMT3KWx6oSQsWy3vevLhM.FXt8f/nIBZr2c8esCmg2GwHIUi', 6, TRUE);

-- ============================================================
-- niveis_ensino: (id, nome, descricao*)
-- ============================================================
INSERT INTO niveis_ensino (id, nome) VALUES
(1, 'Ensino Fundamental I'),
(2, 'Ensino Fundamental II'),
(3, 'Ensino Médio');

-- ============================================================
-- series: (id, nivel_id, nome, ordem)
-- ============================================================
INSERT INTO series (id, nivel_id, nome, ordem) VALUES
(1,  1, '1º Ano EF',   1), (2,  1, '2º Ano EF',   2), (3,  1, '3º Ano EF',  3),
(4,  1, '4º Ano EF',   4), (5,  1, '5º Ano EF',   5),
(6,  2, '6º Ano EF',   6), (7,  2, '7º Ano EF',   7), (8,  2, '8º Ano EF',  8), (9,  2, '9º Ano EF',  9),
(10, 3, '1ª Série EM', 1), (11, 3, '2ª Série EM', 2), (12, 3, '3ª Série EM',3);

-- ============================================================
-- anos_letivos: (id, ano, data_inicio, data_fim, ativo, criado_em*)
-- ============================================================
INSERT INTO anos_letivos (id, ano, data_inicio, data_fim, ativo) VALUES
(1, 2024, '2024-02-05', '2024-12-20', FALSE),
(2, 2025, '2025-02-03', '2025-12-19', TRUE);

-- ============================================================
-- disciplinas: (id, nome, codigo, carga_horaria_semanal, ativa*)
-- ============================================================
INSERT INTO disciplinas (id, nome, codigo, carga_horaria_semanal) VALUES
(1,  'Português',       'PORT', 5),
(2,  'Matemática',      'MAT',  5),
(3,  'Ciências',        'CIE',  3),
(4,  'História',        'HIS',  3),
(5,  'Geografia',       'GEO',  3),
(6,  'Inglês',          'ING',  2),
(7,  'Educação Física', 'EDF',  2),
(8,  'Arte',            'ART',  2),
(9,  'Física',          'FIS',  3),
(10, 'Química',         'QUI',  3),
(11, 'Biologia',        'BIO',  3),
(12, 'Filosofia',       'FIL',  2),
(13, 'Sociologia',      'SOC',  2),
(14, 'Redação',         'RED',  2),
(15, 'Literatura',      'LIT',  2);

-- ============================================================
-- salas: (id, nome, descricao*, ativo*, criado_em*, atualizado_em*)
-- ============================================================
INSERT INTO salas (id, nome, descricao, ativo) VALUES
(1, 'Sala 101', 'Bloco A - Terreo', TRUE),
(2, 'Sala 102', 'Bloco A - Terreo', TRUE),
(3, 'Sala 103', 'Bloco A - 1o Andar', TRUE),
(4, 'Sala 104', 'Bloco A - 1o Andar', TRUE),
(5, 'Sala 201', 'Bloco B - 2o Andar', TRUE),
(6, 'Sala 202', 'Bloco B - 2o Andar', TRUE),
(7, 'Sala 203', 'Bloco B - 2o Andar', TRUE),
(8, 'Sala 204', 'Bloco B - 2o Andar', TRUE);

-- ============================================================
-- turmas: (id, serie_id, ano_letivo_id, nome, turno, vagas*, sala*, ativa*, criado_em*)
-- ============================================================

INSERT INTO turmas (id, serie_id, ano_letivo_id, nome, turno, vagas, sala) VALUES
(1,  6,  2, '6A', 'manha', 35, 'Sala 101'),
(2,  6,  2, '6B', 'tarde', 35, 'Sala 102'),
(3,  7,  2, '7A', 'manha', 35, 'Sala 103'),
(4,  9,  2, '9A', 'manha', 35, 'Sala 104'),
(5,  10, 2, '1A', 'manha', 40, 'Sala 201'),
(6,  10, 2, '1B', 'tarde', 40, 'Sala 202'),
(7,  11, 2, '2A', 'manha', 40, 'Sala 203'),
(8,  12, 2, '3A', 'manha', 40, 'Sala 204');

-- ============================================================
-- grade_curricular: (id*, turma_id, disciplina_id, aulas_semanais*)
-- ============================================================

INSERT INTO grade_curricular (turma_id, disciplina_id, aulas_semanais) VALUES
(1, 1, 5),(1, 2, 5),(1, 3, 3),(1, 4, 3),(1, 5, 3),(1, 6, 2),(1, 7, 2),(1, 8, 2),
(5, 1, 3),(5, 2, 3),(5, 9, 3),(5, 10, 3),(5, 11, 3),(5, 6, 2),(5, 12, 2),(5, 13, 2),(5, 14, 2),(5, 15, 2);

-- ============================================================
-- professores: (id, usuario_id, cpf, rg*, data_nascimento*,
--               formacao*, especializacao*, registro_mec*,
--               telefone*, endereco*, ativo*, criado_em*)
-- ============================================================

INSERT INTO professores (id, usuario_id, cpf, formacao, especializacao) VALUES
(1, 4, '123.456.789-01', 'Licenciatura em Matemática - USP',  'Mestrado em Educação Matemática'),
(2, 5, '234.567.890-12', 'Licenciatura em Letras - UNICAMP',  'Especialização em Literatura Brasileira'),
(3, 6, '345.678.901-23', 'Licenciatura em Ciências - UNESP',  'Especialização em Biologia');

-- ============================================================
-- funcionarios: (id, usuario_id, cpf, cargo, departamento*,
--                data_admissao*, salario*, ativo*, criado_em*)
-- ============================================================
 
INSERT INTO funcionarios (id, usuario_id, cpf, cargo, departamento, data_admissao) VALUES
(1, 2, '456.789.012-34', 'Secretária',             'Secretaria',  '2020-03-01'),
(2, 3, '567.890.123-45', 'Coordenador Pedagógico', 'Coordenação', '2018-01-15');

-- ============================================================
-- alunos: (id, usuario_id*, nome, nome_social*, cpf*, rg*,
--          data_nascimento, sexo, naturalidade*, nacionalidade*,
--          foto*, email*, telefone*, endereco*, informacoes_medicas*,
--          ativo*, criado_em*, atualizado_em*)
-- ============================================================
INSERT INTO alunos (id, usuario_id, nome, cpf, data_nascimento, sexo, email, telefone, endereco) VALUES
(1, 9,    'Lucas Santos Pereira',    '987.654.321-10', '2012-03-15', 'M', 'lucas.santos@gmail.com', '(11) 98765-4321', '{"rua":"Rua das Flores","numero":"123","bairro":"Centro","cidade":"São Paulo","estado":"SP","cep":"01001-000"}'),
(2, 10,   'Beatriz Pereira Lima',   '876.543.210-98', '2012-07-22', 'F', 'beatriz.lima@gmail.com', '(11) 87654-3210', '{"rua":"Av. Paulista","numero":"456","bairro":"Bela Vista","cidade":"São Paulo","estado":"SP","cep":"01310-100"}'),
(3, NULL, 'Gabriel Oliveira Costa', '765.432.109-87', '2013-01-10', 'M', NULL,                     '(11) 76543-2109', '{"rua":"Rua Augusta","numero":"789","bairro":"Consolação","cidade":"São Paulo","estado":"SP","cep":"01305-100"}'),
(4, NULL, 'Sofia Rodrigues Alves',  '654.321.098-76', '2011-11-05', 'F', NULL,                     '(11) 65432-1098', '{"rua":"Rua Oscar Freire","numero":"321","bairro":"Jardins","cidade":"São Paulo","estado":"SP","cep":"01426-001"}'),
(5, NULL, 'Pedro Henrique Dias',    '543.210.987-65', '2010-05-18', 'M', NULL,                     '(11) 54321-0987', '{"rua":"Rua Haddock Lobo","numero":"654","bairro":"Cerqueira César","cidade":"São Paulo","estado":"SP","cep":"01414-001"}');

-- ============================================================
-- responsaveis: (id, usuario_id*, nome, cpf*, rg*, email*,
--                telefone*, telefone_alt*, endereco*, profissao*,
--                ativo*, criado_em*)
-- NOTA: NÃO existe coluna "parentesco" aqui - fica em aluno_responsavel
-- ============================================================
INSERT INTO responsaveis (id, usuario_id, nome, cpf, email, telefone) VALUES
(1, 7,    'Maria José Santos',   '111.222.333-44', 'mariajose@gmail.com',   '(11) 91111-2222'),
(2, 8,    'João Carlos Pereira', '222.333.444-55', 'joaocarlos@gmail.com',  '(11) 92222-3333'),
(3, NULL, 'Claudia Oliveira',    '333.444.555-66', 'claudia.ol@gmail.com',  '(11) 93333-4444'),
(4, NULL, 'Roberto Rodrigues',   '444.555.666-77', 'roberto.rod@gmail.com', '(11) 94444-5555'),
(5, NULL, 'Sonia Dias',          '555.666.777-88', 'sonia.dias@gmail.com',  '(11) 95555-6666');

-- ============================================================
-- aluno_responsavel: (aluno_id, responsavel_id, parentesco,
--                     responsavel_financeiro*, contato_emergencia*)
-- ============================================================
INSERT INTO aluno_responsavel (aluno_id, responsavel_id, parentesco, responsavel_financeiro, contato_emergencia) VALUES
(1, 1, 'mãe', TRUE,  TRUE),
(2, 2, 'pai', TRUE,  TRUE),
(3, 3, 'mãe', TRUE,  TRUE),
(4, 4, 'pai', TRUE,  TRUE),
(5, 5, 'mãe', TRUE,  TRUE);

-- ============================================================
-- professor_turma_disciplina: (id*, professor_id, turma_id,
--                               disciplina_id, ano_letivo_id)
-- ============================================================
INSERT INTO professor_turma_disciplina (professor_id, turma_id, disciplina_id, ano_letivo_id) VALUES
(1, 1, 2, 2),(1, 2, 2, 2),(1, 5, 2, 2),(1, 5, 9, 2),
(2, 1, 1, 2),(2, 2, 1, 2),(2, 5, 1, 2),(2, 5, 14, 2),
(3, 1, 3, 2),(3, 5, 11, 2);

-- ============================================================
-- matriculas: (id, aluno_id, turma_id, ano_letivo_id,
--              numero_matricula, data_matricula, situacao*,
--              observacoes*, criado_por, criado_em*, atualizado_em*)
-- ============================================================
INSERT INTO matriculas (id, aluno_id, turma_id, ano_letivo_id, numero_matricula, data_matricula, situacao, criado_por) VALUES
(1, 1, 1, 2, '2025001001', '2025-01-20', 'ativa', 2),
(2, 2, 1, 2, '2025001002', '2025-01-20', 'ativa', 2),
(3, 3, 1, 2, '2025001003', '2025-01-21', 'ativa', 2),
(4, 4, 5, 2, '2025005001', '2025-01-21', 'ativa', 2),
(5, 5, 5, 2, '2025005002', '2025-01-22', 'ativa', 2);

-- ============================================================
-- calendario_letivo: (id*, ano_letivo_id, data, tipo, descricao*,
--                     aplica_todas_turmas*, turma_id*)
-- ============================================================
INSERT INTO calendario_letivo (ano_letivo_id, data, tipo, descricao) VALUES
(2, '2025-02-03', 'aula',    'Início do ano letivo'),
(2, '2025-03-03', 'recesso', 'Carnaval'),
(2, '2025-03-04', 'recesso', 'Carnaval'),
(2, '2025-04-18', 'feriado', 'Sexta-feira Santa'),
(2, '2025-04-21', 'feriado', 'Tiradentes'),
(2, '2025-05-01', 'feriado', 'Dia do Trabalho'),
(2, '2025-06-19', 'feriado', 'Corpus Christi'),
(2, '2025-07-07', 'recesso', 'Início das férias de julho'),
(2, '2025-07-11', 'recesso', 'Fim das férias de julho'),
(2, '2025-09-07', 'feriado', 'Independência do Brasil'),
(2, '2025-10-12', 'feriado', 'Nossa Senhora Aparecida'),
(2, '2025-11-02', 'feriado', 'Finados'),
(2, '2025-11-15', 'feriado', 'Proclamação da República'),
(2, '2025-12-19', 'aula',    'Último dia letivo');

-- ============================================================
-- aulas: (id*, turma_id, disciplina_id, professor_id,
--         data_aula, numero_aulas*, conteudo*, observacoes*, lancado_em*)
-- ============================================================
INSERT INTO aulas (turma_id, disciplina_id, professor_id, data_aula, numero_aulas, conteudo) VALUES
(1, 1, 2, '2025-02-10', 2, 'Introdução à gramática - substantivos'),
(1, 2, 1, '2025-02-10', 2, 'Números naturais - revisão'),
(1, 1, 2, '2025-02-17', 2, 'Verbos - conjugação presente'),
(1, 2, 1, '2025-02-17', 2, 'Adição e subtração de frações');

-- ============================================================
-- frequencias: (id*, aula_id, aluno_id, presente, justificativa*)
-- ============================================================
INSERT INTO frequencias (aula_id, aluno_id, presente) VALUES
(1, 1, TRUE), (1, 2, TRUE),  (1, 3, FALSE),
(2, 1, TRUE), (2, 2, TRUE),  (2, 3, TRUE),
(3, 1, TRUE), (3, 2, FALSE), (3, 3, TRUE),
(4, 1, TRUE), (4, 2, TRUE),  (4, 3, TRUE);

-- ============================================================
-- periodos_avaliacao: (id, ano_letivo_id, nome, ordem,
--                      data_inicio*, data_fim*, peso*)
-- ============================================================
INSERT INTO periodos_avaliacao (id, ano_letivo_id, nome, ordem, data_inicio, data_fim, peso) VALUES
(1, 2, '1º Bimestre', 1, '2025-02-03', '2025-04-04', 1.00),
(2, 2, '2º Bimestre', 2, '2025-04-07', '2025-06-27', 1.00),
(3, 2, '3º Bimestre', 3, '2025-07-14', '2025-09-19', 1.00),
(4, 2, '4º Bimestre', 4, '2025-09-22', '2025-12-19', 1.00);

-- ============================================================
-- notas: (id*, matricula_id, disciplina_id, periodo_id,
--         criterio_id*, valor, observacoes*, lancado_por,
--         lancado_em*, atualizado_em*)
-- ============================================================
INSERT INTO notas (matricula_id, disciplina_id, periodo_id, valor, lancado_por) VALUES
(1, 1, 1, 8.5, 4), (1, 2, 1, 7.0, 4), (1, 3, 1, 9.0, 4),
(1, 1, 2, 7.5, 4), (1, 2, 2, 8.0, 4), (1, 3, 2, 8.5, 4),
(2, 1, 1, 9.5, 4), (2, 2, 1, 9.0, 4), (2, 3, 1, 8.0, 4),
(2, 1, 2, 9.0, 4), (2, 2, 2, 8.5, 4), (2, 3, 2, 9.5, 4),
(3, 1, 1, 6.0, 4), (3, 2, 1, 5.5, 4), (3, 3, 1, 7.0, 4);

-- ============================================================
-- comunicados: (id*, titulo, corpo, autor_id, publico_alvo,
--               turma_id*, publicado*, publicado_em*, expira_em*,
--               criado_em*)
-- ============================================================
INSERT INTO comunicados (titulo, corpo, autor_id, publico_alvo, publicado, publicado_em) VALUES
('Reunião de Pais - Março 2025',
 'Informamos que a reunião de pais e responsáveis do 1º bimestre será no dia 15/03/2025, às 14h, no auditório.',
 3, 'responsaveis', TRUE, '2025-03-01 08:00:00'),
('Calendário de Provas - 1º Bimestre',
 'Segue o calendário de provas do 1º bimestre. Compareçam com caneta azul/preta e borracha.',
 3, 'todos', TRUE, '2025-02-20 07:00:00'),
('Recesso de Carnaval',
 'A escola entra em recesso nos dias 03 e 04 de março. Aulas retornam na quarta-feira, 05/03.',
 1, 'todos', TRUE, '2025-02-25 08:00:00');

-- ============================================================
-- planos_pagamento: (id, nome, descricao*, valor_mensalidade,
--                    dia_vencimento*, desconto_antecipado*,
--                    juros_atraso_diario*, multa_atraso*, ativo*)
-- ============================================================
INSERT INTO planos_pagamento (id, nome, valor_mensalidade, dia_vencimento, desconto_antecipado, multa_atraso) VALUES
(1, 'Ensino Fundamental - Padrão', 1200.00, 10, 5.00, 2.00),
(2, 'Ensino Médio - Padrão',       1500.00, 10, 5.00, 2.00),
(3, 'Bolsa Social - 50%',           600.00, 10, 0.00, 2.00);

-- ============================================================
-- contratos: (id, matricula_id, responsavel_id, plano_id,
--             valor_negociado*, desconto_pct*, desconto_motivo*,
--             data_inicio, data_fim*, ativo*, criado_por, criado_em*)
-- ============================================================
INSERT INTO contratos (id, matricula_id, responsavel_id, plano_id, data_inicio, ativo, criado_por) VALUES
(1, 1, 1, 1, '2025-02-01', TRUE, 2),
(2, 2, 2, 1, '2025-02-01', TRUE, 2),
(3, 3, 3, 3, '2025-02-01', TRUE, 2),
(4, 4, 4, 2, '2025-02-01', TRUE, 2),
(5, 5, 5, 2, '2025-02-01', TRUE, 2);

-- ============================================================
-- mensalidades: (id*, contrato_id, competencia, valor_original,
--                valor_desconto*, valor_acrescimo*, valor_final,
--                data_vencimento, situacao*, data_pagamento*,
--                observacoes*, gerado_em*)
-- ============================================================
INSERT INTO mensalidades (contrato_id, competencia, valor_original, valor_final, data_vencimento, situacao, data_pagamento) VALUES
(1, '2025-02-01', 1200.00, 1200.00, '2025-02-10', 'pago',    '2025-02-08'),
(1, '2025-03-01', 1200.00, 1200.00, '2025-03-10', 'pago',    '2025-03-10'),
(1, '2025-04-01', 1200.00, 1200.00, '2025-04-10', 'pago',    '2025-04-09'),
(1, '2025-05-01', 1200.00, 1200.00, '2025-05-10', 'pago',    '2025-05-12'),
(1, '2025-06-01', 1200.00, 1200.00, '2025-06-10', 'pendente', NULL),
(2, '2025-02-01', 1200.00, 1200.00, '2025-02-10', 'pago',    '2025-02-10'),
(2, '2025-03-01', 1200.00, 1200.00, '2025-03-10', 'pago',    '2025-03-11'),
(2, '2025-04-01', 1200.00, 1200.00, '2025-04-10', 'pago',    '2025-04-10'),
(2, '2025-05-01', 1200.00, 1200.00, '2025-05-10', 'pendente', NULL),
(2, '2025-06-01', 1200.00, 1200.00, '2025-06-10', 'pendente', NULL),
(3, '2025-02-01',  600.00,  600.00, '2025-02-10', 'pago',    '2025-02-15'),
(3, '2025-03-01',  600.00,  600.00, '2025-03-10', 'pendente', NULL);


agrisk meio apagado 

Restritivos Nacional
Endividamento Financeiro
Consulta CPR
Pesquisa de Imóveis - Simples
Pesquisa Imóveis - CAR
Patrimônio Veicular



serasa meio apagado 
Serasa Avançado




HBI meio apagado
SCR