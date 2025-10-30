-- Crear base de datos si no existe
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'payflow')
BEGIN
    CREATE DATABASE payflow;
END
GO

USE payflow;
GO
