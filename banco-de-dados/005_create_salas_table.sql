-- Script: 005_create_salas_table.sql
-- Purpose: cria a tabela de salas para cadastro persistente na Gestao Geral.
-- Uso: mysql -u user -p nome_do_banco < 005_create_salas_table.sql

CREATE TABLE IF NOT EXISTS salas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao VARCHAR(255) NULL,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO salas (nome, descricao, ativo)
SELECT DISTINCT t.sala, NULL, TRUE
FROM turmas t
WHERE t.sala IS NOT NULL AND t.sala <> '';
