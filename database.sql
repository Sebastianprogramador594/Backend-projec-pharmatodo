-- ========================================================
-- PHARMATODO - Base de Datos para Control de Inventarios y Ventas
-- Versión: 1.0.0
-- Compatible con: MySQL 5.7+, MySQL 8.0+, MariaDB 10.4+
-- ========================================================

CREATE DATABASE IF NOT EXISTS `pharmatodo` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `pharmatodo`;

-- --------------------------------------------------------
-- 1. Tabla: empleados (Usuarios del sistema)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `detalle_ventas`;
DROP TABLE IF EXISTS `ventas`;
DROP TABLE IF EXISTS `inventarios`;
DROP TABLE IF EXISTS `proveedores`;
DROP TABLE IF EXISTS `medicamentos`;
DROP TABLE IF EXISTS `empleados`;

CREATE TABLE `empleados` (
  `ID_EMPLEADO` INT NOT NULL AUTO_INCREMENT,
  `NOMBRE` VARCHAR(120) NOT NULL,
  `CARGO` VARCHAR(80) NOT NULL,
  `HORARIO` VARCHAR(80) NOT NULL,
  `USUARIO` VARCHAR(50) NOT NULL UNIQUE,
  `PASSWORD` VARCHAR(255) NOT NULL,
  `ROL` ENUM('Administrador', 'Farmaceutico') NOT NULL DEFAULT 'Farmaceutico',
  `FECHA_CREACION` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID_EMPLEADO`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 2. Tabla: medicamentos (Catálogo de productos farmacéuticos)
-- --------------------------------------------------------
CREATE TABLE `medicamentos` (
  `ID` INT NOT NULL AUTO_INCREMENT,
  `NOMBRE` VARCHAR(150) NOT NULL,
  `TIPO` VARCHAR(80) NOT NULL,
  `PRECIO` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `STOCK` INT NOT NULL DEFAULT 0,
  `FECHA_VENCIMIENTO` DATE NOT NULL,
  `VENTA_CODIGO` VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 3. Tabla: inventarios (Ubicación física y control de existencias)
-- --------------------------------------------------------
CREATE TABLE `inventarios` (
  `ID_INVENTARIO` INT NOT NULL AUTO_INCREMENT,
  `MEDICAMENTO_ID` INT NOT NULL,
  `CANTIDAD_TOTAL` INT NOT NULL DEFAULT 0,
  `UBICACION` VARCHAR(100) NOT NULL,
  `FECHA_ACTUALIZACION` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID_INVENTARIO`),
  CONSTRAINT `fk_inventario_medicamento` 
    FOREIGN KEY (`MEDICAMENTO_ID`) 
    REFERENCES `medicamentos` (`ID`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 4. Tabla: proveedores (Registro y directorio de proveedores)
-- --------------------------------------------------------
CREATE TABLE `proveedores` (
  `ID_PROVEEDOR` INT NOT NULL AUTO_INCREMENT,
  `NOMBRE` VARCHAR(120) NOT NULL,
  `NIT` VARCHAR(30) NOT NULL UNIQUE,
  `CONTACTO` VARCHAR(100) NOT NULL,
  `TELEFONO` VARCHAR(25) NOT NULL,
  `CORREO` VARCHAR(120) DEFAULT NULL,
  `CIUDAD` VARCHAR(80) DEFAULT NULL,
  `DIRECCION` VARCHAR(180) DEFAULT NULL,
  `ESTADO` ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
  `FECHA_REGISTRO` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID_PROVEEDOR`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 5. Tabla: ventas (Cabecera de facturas/ventas)
-- --------------------------------------------------------
CREATE TABLE `ventas` (
  `CODIGO` INT NOT NULL AUTO_INCREMENT,
  `TOTAL` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `METODO_PAGO` VARCHAR(50) NOT NULL,
  `CLIENTE_NOMBRE` VARCHAR(120) NOT NULL,
  `FECHA` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`CODIGO`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 6. Tabla: detalle_ventas (Líneas de productos por venta)
-- --------------------------------------------------------
CREATE TABLE `detalle_ventas` (
  `ID` INT NOT NULL AUTO_INCREMENT,
  `VENTA_CODIGO` INT NOT NULL,
  `MEDICAMENTO_ID` INT NOT NULL,
  `CANTIDAD` INT NOT NULL,
  `PRECIO_UNITARIO` DECIMAL(10,2) NOT NULL,
  `SUBTOTAL` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`ID`),
  CONSTRAINT `fk_detalle_venta` 
    FOREIGN KEY (`VENTA_CODIGO`) 
    REFERENCES `ventas` (`CODIGO`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  CONSTRAINT `fk_detalle_medicamento` 
    FOREIGN KEY (`MEDICAMENTO_ID`) 
    REFERENCES `medicamentos` (`ID`) 
    ON DELETE RESTRICT 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- DATOS INICIALES (SEMILLA / SEED DATA)
-- ========================================================

-- Credenciales por defecto:
-- 1. admin / admin123
-- 2. farmaceutico / farmacia123
INSERT INTO `empleados` (`ID_EMPLEADO`, `NOMBRE`, `CARGO`, `HORARIO`, `USUARIO`, `PASSWORD`, `ROL`) VALUES
(1, 'Administrador General', 'Administrador del Sistema', 'Turno Completo', 'admin', '$2b$10$pg/6izAIGvPcBljV3smCturcfJ7uRHeKut179aD3faBsPKYC2wGZK', 'Administrador'),
(2, 'Carlos Ruiz', 'Farmacéutico Jefe', 'Turno Mañana (07:00 - 15:00)', 'farmaceutico', '$2b$10$QVtXXWwfl.Sw/FoaT5EFjO6zdW7rXaN.2uEhphXDW0LCmdj/E2T.y', 'Farmaceutico');

-- Catálogo de medicamentos iniciales (con variedad de stock y fechas)
INSERT INTO `medicamentos` (`ID`, `NOMBRE`, `TIPO`, `PRECIO`, `STOCK`, `FECHA_VENCIMIENTO`, `VENTA_CODIGO`) VALUES
(1, 'Acetaminofén 500mg', 'Analgésico / Antipirético', 4500.00, 120, DATE_ADD(CURDATE(), INTERVAL 365 DAY), 'ACET-500'),
(2, 'Dolex Gripa Tabletas', 'Antigripal', 8900.00, 8, DATE_ADD(CURDATE(), INTERVAL 20 DAY), 'DOL-GRP'),
(3, 'Amoxicilina 500mg', 'Antibiótico', 14200.00, 45, DATE_ADD(CURDATE(), INTERVAL 180 DAY), 'AMOX-500'),
(4, 'Ibuprofeno 400mg', 'Antiinflamatorio', 6200.00, 5, DATE_ADD(CURDATE(), INTERVAL 250 DAY), 'IBU-400'),
(5, 'Jarabe para la Tos 120ml', 'Antitusivo', 12500.00, 15, DATE_ADD(CURDATE(), INTERVAL 15 DAY), 'JAR-TOS'),
(6, 'Omeprazol 20mg', 'Antiácido', 7800.00, 60, DATE_ADD(CURDATE(), INTERVAL 400 DAY), 'OME-20'),
(7, 'Loratadina 10mg', 'Antihistamínico', 5500.00, 30, DATE_ADD(CURDATE(), INTERVAL 300 DAY), 'LOR-10'),
(8, 'Losartán 50mg', 'Antihipertensivo', 9800.00, 0, DATE_ADD(CURDATE(), INTERVAL 200 DAY), 'LOS-50'),
(9, 'Salbutamol Inhalador 100mcg', 'Broncodilatador', 18500.00, 22, DATE_ADD(CURDATE(), INTERVAL 180 DAY), 'SAL-100'),
(10, 'Alcohol Antiséptico 700ml', 'Antiséptico / Desinfectante', 6500.00, 40, DATE_ADD(CURDATE(), INTERVAL 600 DAY), 'ALC-700');

-- Registro en inventarios físico
INSERT INTO `inventarios` (`ID_INVENTARIO`, `MEDICAMENTO_ID`, `CANTIDAD_TOTAL`, `UBICACION`) VALUES
(1, 1, 120, 'Estante A-01'),
(2, 2, 8, 'Estante A-02'),
(3, 3, 45, 'Vitrina B-01'),
(4, 4, 5, 'Estante A-03'),
(5, 5, 15, 'Estante B-02'),
(6, 6, 60, 'Vitrina B-03'),
(7, 7, 30, 'Estante C-01'),
(8, 8, 0, 'Bodega P-01'),
(9, 9, 22, 'Vitrina B-04'),
(10, 10, 40, 'Bodega P-02');

-- Directorio de proveedores iniciales
INSERT INTO `proveedores` (`ID_PROVEEDOR`, `NOMBRE`, `NIT`, `CONTACTO`, `TELEFONO`, `CORREO`, `CIUDAD`, `DIRECCION`, `ESTADO`) VALUES
(1, 'Laboratorios Baxter S.A.', '860002540-1', 'María Fernanda Gómez', '3104567890', 'pedidos@baxter.com', 'Bogotá D.C.', 'Calle 26 # 69-76', 'Activo'),
(2, 'Pfizer Colombia', '860010200-5', 'Andrés Felipe Morales', '3209876543', 'contacto@pfizer.com.co', 'Medellín', 'Carrera 43A # 1-50', 'Activo'),
(3, 'Genfar S.A.', '890102030-9', 'Claudia Patricia Ríos', '3157891234', 'ventas@genfar.com', 'Cali', 'Avenida 6N # 24-02', 'Activo'),
(4, 'Tecnoquímicas S.A.', '890300250-4', 'Julián David Castro', '3006549870', 'pedidos@tecnoquimicas.com', 'Barranquilla', 'Calle 77B # 57-141', 'Activo'),
(5, 'Distribuidora Farmacéutica del Valle', '900123456-7', 'Roberto Méndez', '3123456789', 'rmendez@disfarvalle.com', 'Cali', 'Carrera 15 # 33-20', 'Inactivo');

-- Ventas de ejemplo
INSERT INTO `ventas` (`CODIGO`, `TOTAL`, `METODO_PAGO`, `CLIENTE_NOMBRE`, `FECHA`) VALUES
(1, 22400.00, 'Efectivo', 'Andrea Salazar', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, 27400.00, 'Tarjeta', 'Felipe Arango', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, 17800.00, 'Transferencia', 'Carolina Benítez', NOW());

-- Detalle de las ventas de ejemplo
INSERT INTO `detalle_ventas` (`ID`, `VENTA_CODIGO`, `MEDICAMENTO_ID`, `CANTIDAD`, `PRECIO_UNITARIO`, `SUBTOTAL`) VALUES
(1, 1, 1, 2, 4500.00, 9000.00),
(2, 1, 2, 1, 8900.00, 8900.00),
(3, 1, 1, 1, 4500.00, 4500.00),
(4, 2, 3, 1, 14200.00, 14200.00),
(5, 2, 5, 1, 12500.00, 12500.00),
(6, 3, 6, 1, 7800.00, 7800.00),
(7, 3, 1, 2, 4500.00, 9000.00),
(8, 3, 10, 1, 6500.00, 6500.00);
