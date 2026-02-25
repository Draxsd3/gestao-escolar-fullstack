-- ============================================================
-- Migration 009 — Campos para o wizard de cadastro de professor
-- ============================================================

-- Adicionar campo "trocar_senha" na tabela usuarios
-- (professor obrigado a trocar senha no primeiro acesso)
ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS trocar_senha BOOLEAN DEFAULT FALSE AFTER ativo;

-- Adicionar campo "matricula_interna" na tabela usuarios
ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS matricula_interna VARCHAR(50) NULL AFTER trocar_senha;

-- Adicionar campos extras na tabela professores
ALTER TABLE professores
    ADD COLUMN IF NOT EXISTS area_atuacao VARCHAR(150) NULL AFTER especializacao,
    ADD COLUMN IF NOT EXISTS unidade VARCHAR(150) NULL AFTER area_atuacao,
    ADD COLUMN IF NOT EXISTS permissoes JSON NULL AFTER unidade;

-- Remover restrição NOT NULL do cpf em professores
-- para permitir cadastro sem CPF (ex: estrangeiros)
-- (Ajuste conforme necessidade do ambiente)
-- ALTER TABLE professores MODIFY COLUMN cpf VARCHAR(14) NULL;
x4n!A6znYa