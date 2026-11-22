const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ quiet: true });
dotenv.config({ path: path.resolve(__dirname, "../.env"), quiet: true });
dotenv.config({ path: path.resolve(__dirname, "../../.env"), quiet: true });

const pool = require("../config/db");

const TABLAS_SQL = [
    `CREATE TABLE IF NOT EXISTS empleados (
        ID_EMPLEADO INT NOT NULL AUTO_INCREMENT,
        NOMBRE VARCHAR(120) NOT NULL,
        CARGO VARCHAR(80) NOT NULL,
        HORARIO VARCHAR(80) NOT NULL,
        USUARIO VARCHAR(50) NOT NULL UNIQUE,
        PASSWORD VARCHAR(255) NOT NULL,
        ROL ENUM('Administrador', 'Farmaceutico') NOT NULL DEFAULT 'Farmaceutico',
        FECHA_CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (ID_EMPLEADO)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS medicamentos (
        ID INT NOT NULL AUTO_INCREMENT,
        NOMBRE VARCHAR(150) NOT NULL,
        TIPO VARCHAR(80) NOT NULL,
        PRECIO DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        STOCK INT NOT NULL DEFAULT 0,
        FECHA_VENCIMIENTO DATE NOT NULL,
        VENTA_CODIGO VARCHAR(50) DEFAULT NULL,
        PRIMARY KEY (ID)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS inventarios (
        ID_INVENTARIO INT NOT NULL AUTO_INCREMENT,
        MEDICAMENTO_ID INT NOT NULL,
        CANTIDAD_TOTAL INT NOT NULL DEFAULT 0,
        UBICACION VARCHAR(100) NOT NULL,
        FECHA_ACTUALIZACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (ID_INVENTARIO),
        CONSTRAINT fk_inventario_medicamento
            FOREIGN KEY (MEDICAMENTO_ID)
            REFERENCES medicamentos (ID)
            ON DELETE CASCADE
            ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT datos_proveedores (
        ID_PROVEEDOR INT NOT NULL AUTO_INCREMENT,
        NOMBRE VARCHAR(120) NOT NULL,
        NIT VARCHAR(30) NOT NULL UNIQUE,
        CONTACTO VARCHAR(100) NOT NULL,
        TELEFONO VARCHAR(25) NOT NULL,
        CORREO VARCHAR(120) DEFAULT NULL,
        CIUDAD VARCHAR(80) DEFAULT NULL,
        DIRECCION VARCHAR(180) DEFAULT NULL,
        ESTADO ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
        FECHA_REGISTRO TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (ID_PROVEEDOR)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS ventas (
        CODIGO INT NOT NULL AUTO_INCREMENT,
        TOTAL DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        METODO_PAGO VARCHAR(50) NOT NULL,
        CLIENTE_NOMBRE VARCHAR(120) NOT NULL,
        FECHA TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (CODIGO)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS detalle_ventas (
        ID INT NOT NULL AUTO_INCREMENT,
        VENTA_CODIGO INT NOT NULL,
        MEDICAMENTO_ID INT NOT NULL,
        CANTIDAD INT NOT NULL,
        PRECIO_UNITARIO DECIMAL(10,2) NOT NULL,
        SUBTOTAL DECIMAL(10,2) NOT NULL,
        PRIMARY KEY (ID),
        CONSTRAINT fk_detalle_venta
            FOREIGN KEY (VENTA_CODIGO)
            REFERENCES ventas (CODIGO)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
        CONSTRAINT fk_detalle_medicamento
            FOREIGN KEY (MEDICAMENTO_ID)
            REFERENCES medicamentos (ID)
            ON DELETE RESTRICT
            ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
];

// Note: Replace "datos_proveedores" typo:
TABLAS_SQL[3] = `CREATE TABLE IF NOT EXISTS proveedores (
    ID_PROVEEDOR INT NOT NULL AUTO_INCREMENT,
    NOMBRE VARCHAR(120) NOT NULL,
    NIT VARCHAR(30) NOT NULL UNIQUE,
    CONTACTO VARCHAR(100) NOT NULL,
    TELEFONO VARCHAR(25) NOT NULL,
    CORREO VARCHAR(120) DEFAULT NULL,
    CIUDAD VARCHAR(80) DEFAULT NULL,
    DIRECCION VARCHAR(180) DEFAULT NULL,
    ESTADO ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
    FECHA_REGISTRO TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (ID_PROVEEDOR)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;

const SEEDS_SQL = [
    // Empleados iniciales: admin / admin123 y farmaceutico / farmacia123
    `INSERT IGNORE INTO empleados (ID_EMPLEADO, NOMBRE, CARGO, HORARIO, USUARIO, PASSWORD, ROL) VALUES
    (1, 'Administrador General', 'Administrador del Sistema', 'Turno Completo', 'admin', '$2b$10$pg/6izAIGvPcBljV3smCturcfJ7uRHeKut179aD3faBsPKYC2wGZK', 'Administrador'),
    (2, 'Carlos Ruiz', 'Farmacéutico Jefe', 'Turno Mañana (07:00 - 15:00)', 'farmaceutico', '$2b$10$QVtXXWwfl.Sw/FoaT5EFjO6zdW7rXaN.2uEhphXDW0LCmdj/E2T.y', 'Farmaceutico');`,

    // Catálogo de medicamentos
    `INSERT IGNORE INTO medicamentos (ID, NOMBRE, TIPO, PRECIO, STOCK, FECHA_VENCIMIENTO, VENTA_CODIGO) VALUES
    (1, 'Acetaminofén 500mg', 'Analgésico / Antipirético', 4500.00, 120, DATE_ADD(CURDATE(), INTERVAL 365 DAY), 'ACET-500'),
    (2, 'Dolex Gripa Tabletas', 'Antigripal', 8900.00, 8, DATE_ADD(CURDATE(), INTERVAL 20 DAY), 'DOL-GRP'),
    (3, 'Amoxicilina 500mg', 'Antibiótico', 14200.00, 45, DATE_ADD(CURDATE(), INTERVAL 180 DAY), 'AMOX-500'),
    (4, 'Ibuprofeno 400mg', 'Antiinflamatorio', 6200.00, 5, DATE_ADD(CURDATE(), INTERVAL 250 DAY), 'IBU-400'),
    (5, 'Jarabe para la Tos 120ml', 'Antitusivo', 12500.00, 15, DATE_ADD(CURDATE(), INTERVAL 15 DAY), 'JAR-TOS'),
    (6, 'Omeprazol 20mg', 'Antiácido', 7800.00, 60, DATE_ADD(CURDATE(), INTERVAL 400 DAY), 'OME-20'),
    (7, 'Loratadina 10mg', 'Antihistamínico', 5500.00, 30, DATE_ADD(CURDATE(), INTERVAL 300 DAY), 'LOR-10'),
    (8, 'Losartán 50mg', 'Antihipertensivo', 9800.00, 0, DATE_ADD(CURDATE(), INTERVAL 200 DAY), 'LOS-50'),
    (9, 'Salbutamol Inhalador 100mcg', 'Broncodilatador', 18500.00, 22, DATE_ADD(CURDATE(), INTERVAL 180 DAY), 'SAL-100'),
    (10, 'Alcohol Antiséptico 700ml', 'Antiséptico / Desinfectante', 6500.00, 40, DATE_ADD(CURDATE(), INTERVAL 600 DAY), 'ALC-700');`,

    // Inventarios físicos
    `INSERT IGNORE INTO inventarios (ID_INVENTARIO, MEDICAMENTO_ID, CANTIDAD_TOTAL, UBICACION) VALUES
    (1, 1, 120, 'Estante A-01'),
    (2, 2, 8, 'Estante A-02'),
    (3, 3, 45, 'Vitrina B-01'),
    (4, 4, 5, 'Estante A-03'),
    (5, 5, 15, 'Estante B-02'),
    (6, 6, 60, 'Vitrina B-03'),
    (7, 7, 30, 'Estante C-01'),
    (8, 8, 0, 'Bodega P-01'),
    (9, 9, 22, 'Vitrina B-04'),
    (10, 10, 40, 'Bodega P-02');`,

    // Proveedores iniciales
    `INSERT IGNORE INTO proveedores (ID_PROVEEDOR, NOMBRE, NIT, CONTACTO, TELEFONO, CORREO, CIUDAD, DIRECCION, ESTADO) VALUES
    (1, 'Laboratorios Baxter S.A.', '860002540-1', 'María Fernanda Gómez', '3104567890', 'pedidos@baxter.com', 'Bogotá D.C.', 'Calle 26 # 69-76', 'Activo'),
    (2, 'Pfizer Colombia', '860010200-5', 'Andrés Felipe Morales', '3209876543', 'contacto@pfizer.com.co', 'Medellín', 'Carrera 43A # 1-50', 'Activo'),
    (3, 'Genfar S.A.', '890102030-9', 'Claudia Patricia Ríos', '3157891234', 'ventas@genfar.com', 'Cali', 'Avenida 6N # 24-02', 'Activo'),
    (4, 'Tecnoquímicas S.A.', '890300250-4', 'Julián David Castro', '3006549870', 'pedidos@tecnoquimicas.com', 'Barranquilla', 'Calle 77B # 57-141', 'Activo'),
    (5, 'Distribuidora Farmacéutica del Valle', '900123456-7', 'Roberto Méndez', '3123456789', 'rmendez@disfarvalle.com', 'Cali', 'Carrera 15 # 33-20', 'Inactivo');`,

    // Ventas de ejemplo
    `INSERT IGNORE INTO ventas (CODIGO, TOTAL, METODO_PAGO, CLIENTE_NOMBRE, FECHA) VALUES
    (1, 22400.00, 'Efectivo', 'Andrea Salazar', DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (2, 27400.00, 'Tarjeta', 'Felipe Arango', DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (3, 17800.00, 'Transferencia', 'Carolina Benítez', NOW());`,

    // Detalle de ventas de ejemplo
    `INSERT IGNORE INTO detalle_ventas (ID, VENTA_CODIGO, MEDICAMENTO_ID, CANTIDAD, PRECIO_UNITARIO, SUBTOTAL) VALUES
    (1, 1, 1, 2, 4500.00, 9000.00),
    (2, 1, 2, 1, 8900.00, 8900.00),
    (3, 1, 1, 1, 4500.00, 4500.00),
    (4, 2, 3, 1, 14200.00, 14200.00),
    (5, 2, 5, 1, 12500.00, 12500.00),
    (6, 3, 6, 1, 7800.00, 7800.00),
    (7, 3, 1, 2, 4500.00, 9000.00),
    (8, 3, 10, 1, 6500.00, 6500.00);`
];

async function inicializarBaseDeDatos({ force = false } = {}) {
    let connection;
    try {
        connection = await pool.promise().getConnection();

        // Comprobar si ya existen las tablas
        const [tablasExistentes] = await connection.query(
            "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'empleados'"
        );

        if (tablasExistentes.length > 0 && !force) {
            console.log("ℹ️ Base de datos ya configurada (tablas existentes detectadas).");
            return { yaConfigurada: true };
        }

        console.log("🚀 Inicializando tablas y datos semilla de PharmaTodo...");

        // Desactivar temporalmente revisión de claves foráneas si se fuerza reestructuración
        if (force) {
            await connection.query("SET FOREIGN_KEY_CHECKS = 0;");
            await connection.query("DROP TABLE IF EXISTS detalle_ventas, ventas, inventarios, proveedores, medicamentos, empleados;");
            await connection.query("SET FOREIGN_KEY_CHECKS = 1;");
        }

        // Crear tablas
        for (const sql of TABLAS_SQL) {
            await connection.query(sql);
        }

        // Insertar datos semilla
        for (const sql of SEEDS_SQL) {
            await connection.query(sql);
        }

        console.log("✅ Base de datos inicializada exitosamente con usuarios y datos de prueba.");
        return { yaConfigurada: false, exito: true };
    } catch (error) {
        console.error("❌ Error al inicializar la base de datos:", error.message);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

if (require.main === module) {
    const force = process.argv.includes("--force");
    inicializarBaseDeDatos({ force })
        .then(() => {
            console.log("Terminado.");
            process.exit(0);
        })
        .catch(() => {
            process.exit(1);
        });
}

module.exports = {
    inicializarBaseDeDatos
};
