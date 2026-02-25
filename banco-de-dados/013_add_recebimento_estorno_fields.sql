-- Script: 013_add_recebimento_estorno_fields.sql
-- Purpose: adicionar campos de estorno em recebimentos para permitir reversao de pagamento.
-- Uso: mysql -u user -p nome_do_banco < 013_add_recebimento_estorno_fields.sql

ALTER TABLE recebimentos
    ADD COLUMN IF NOT EXISTS estornado_em TIMESTAMP NULL AFTER registrado_em,
    ADD COLUMN IF NOT EXISTS estornado_por INT UNSIGNED NULL AFTER estornado_em,
    ADD COLUMN IF NOT EXISTS estorno_motivo VARCHAR(255) NULL AFTER estornado_por;

ALTER TABLE recebimentos
    ADD CONSTRAINT fk_recebimentos_estornado_por
        FOREIGN KEY (estornado_por) REFERENCES usuarios(id);
