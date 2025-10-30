-- Crear base de datos si no existe
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'microservices_db')
BEGIN
    CREATE DATABASE microservices_db;
END
GO

USE microservices_db;
GO
