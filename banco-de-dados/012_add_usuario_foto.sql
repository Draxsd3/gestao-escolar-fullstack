-- Script: 012_add_usuario_foto.sql
-- Purpose: adicionar campo de foto de perfil para usuarios.
-- Uso: mysql -u user -p nome_do_banco < 012_add_usuario_foto.sql

ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS foto VARCHAR(255) NULL AFTER matricula_interna;

