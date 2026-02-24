-- Script: 004_reset_all_data.sql
-- Purpose: Trunca todas as tabelas do banco atual (apaga todos os dados).
-- USO: execute com o cliente MySQL: `mysql -u user -p nome_do_banco < 004_reset_all_data.sql`

-- Atenção: faça backup antes de rodar em produção.

SET FOREIGN_KEY_CHECKS = 0;
SET SESSION group_concat_max_len = 1000000;

DELIMITER $$
DROP PROCEDURE IF EXISTS truncate_all_tables$$
CREATE PROCEDURE truncate_all_tables()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE tname VARCHAR(255);
  DECLARE cur CURSOR FOR
    SELECT TABLE_NAME FROM information_schema.tables
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE';
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO tname;
    IF done THEN
      LEAVE read_loop;
    END IF;
    SET @s = CONCAT('TRUNCATE TABLE `', DATABASE(), '`.`', tname, '`');
    PREPARE stmt FROM @s;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END LOOP;
  CLOSE cur;
END$$

CALL truncate_all_tables();$$
DROP PROCEDURE IF EXISTS truncate_all_tables$$
DELIMITER ;

SET FOREIGN_KEY_CHECKS = 1;

-- Opcional: resetar AUTO_INCREMENT para cada tabela (normalmente feito pelo TRUNCATE)
