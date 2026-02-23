# BABEL – Documentação do Esquema de Banco de Dados

## Visão Geral

Banco de dados MySQL (v8+) utilizando `utf8mb4_unicode_ci`.  
Nome do banco: `babel_escola`

---

## Módulos e Tabelas

### Autenticação
| Tabela | Descrição |
|--------|-----------|
| `perfis` | Perfis de acesso: admin, secretaria, coordenacao, professor, responsavel, aluno |
| `usuarios` | Contas de acesso ao sistema |
| `tokens_acesso` | Tokens de autenticação Bearer (Sanctum) |

### Estrutura Escolar
| Tabela | Descrição |
|--------|-----------|
| `niveis_ensino` | Fundamental I/II, Médio etc. |
| `series` | Anos/séries vinculados ao nível |
| `anos_letivos` | Anos letivos com datas de início/fim |
| `turmas` | Turmas por série, ano letivo e turno |
| `disciplinas` | Matérias com carga horária |
| `grade_curricular` | Vínculo turma ↔ disciplina |

### Pessoas
| Tabela | Descrição |
|--------|-----------|
| `alunos` | Dados cadastrais dos alunos |
| `responsaveis` | Pais/responsáveis vinculados |
| `aluno_responsavel` | Relacionamento N:N com parentesco |
| `professores` | Dados complementares dos professores |
| `funcionarios` | Dados complementares dos funcionários |
| `professor_turma_disciplina` | Atribuição professor → turma → disciplina |

### Acadêmico
| Tabela | Descrição |
|--------|-----------|
| `matriculas` | Matrículas anuais com número único gerado |
| `calendario_letivo` | Eventos, feriados e recessos |
| `horarios` | Grade de horários por turma |
| `aulas` | Registro de aulas ministradas |
| `frequencias` | Presença/falta por aula e aluno |
| `periodos_avaliacao` | Bimestres/trimestres com pesos |
| `criterios_avaliacao` | Critérios/provas com pesos configuráveis |
| `notas` | Notas lançadas por período/critério |
| `medias_periodo` | Médias calculadas por período |
| `medias_anuais` | Média final anual com situação |

### Comunicação
| Tabela | Descrição |
|--------|-----------|
| `comunicados` | Avisos segmentados por público-alvo |
| `mensagens` | Mensagens diretas entre usuários |

### Financeiro
| Tabela | Descrição |
|--------|-----------|
| `planos_pagamento` | Planos com valor, juros e multas |
| `contratos` | Contrato de matrícula com plano e responsável |
| `mensalidades` | Parcelas mensais geradas automaticamente |
| `recebimentos` | Pagamentos registrados por mensalidade |

### Auditoria
| Tabela | Descrição |
|--------|-----------|
| `auditoria` | Log de alterações críticas (matrícula, notas, financeiro) |

---

## Regras e Integridade

- Todas as FKs usam `ON DELETE CASCADE` ou `SET NULL` adequados
- Campos monetários: `DECIMAL(10,2)`
- Notas: `DECIMAL(5,2)` — range 0.00 a 10.00
- Endereços: `JSON` com campos padronizados
- Datas de competência financeira: sempre o primeiro dia do mês
- `numero_matricula`: formato `{ano}{turma_id 3 dígitos}{seq 3 dígitos}` — ex: `2025001001`

## Índices criados

- `usuarios.email` (UNIQUE)
- `alunos.nome`, `alunos.cpf`
- `matriculas.aluno_id`, `matriculas.turma_id`
- `notas.matricula_id`, `notas.disciplina_id`
- `frequencias.aluno_id`
- `mensalidades.data_vencimento+situacao`
- `auditoria.entidade+entidade_id`, `auditoria.criado_em`
- `comunicados.publicado+publicado_em`

## Credenciais de demonstração

Todos os usuários de demonstração usam a senha: **`Babel@2025`**

| E-mail | Perfil |
|--------|--------|
| admin@babel.edu.br | Administrador |
| secretaria@babel.edu.br | Secretaria |
| coordenacao@babel.edu.br | Coordenação |
| roberto.alves@babel.edu.br | Professor |
| mariajose@gmail.com | Responsável |
| lucas.santos@babel.edu.br | Aluno |
