const path = require("path");
const dotenv = require("dotenv");

// Cargar variables de entorno desde .env local de Backend y de la raíz
dotenv.config({ quiet: true });
dotenv.config({ path: path.resolve(__dirname, "../.env"), quiet: true });
dotenv.config({ path: path.resolve(__dirname, "../../.env"), quiet: true });

const mysql = require("mysql2");

// Detectar URL de conexión completa (estándar en Railway: MYSQL_URL o DATABASE_URL)
const connectionUri = process.env.MYSQL_URL || process.env.DATABASE_URL;

const poolConfig = {
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    // Compatibilidad SSL para bases de datos en la nube que lo requieran
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined
};

let pool;

if (connectionUri) {
    pool = mysql.createPool({
        uri: connectionUri,
        ...poolConfig
    });
} else {
    pool = mysql.createPool({
        host: process.env.DB_HOST || process.env.MYSQLHOST || "localhost",
        user: process.env.DB_USER || process.env.MYSQLUSER || "root",
        password: process.env.DB_PASSWORD !== undefined
            ? process.env.DB_PASSWORD
            : (process.env.MYSQLPASSWORD !== undefined ? process.env.MYSQLPASSWORD : ""),
        database: process.env.DB_NAME || process.env.MYSQLDATABASE || "pharmatodo",
        port: Number(process.env.DB_PORT || process.env.MYSQLPORT) || 3306,
        ...poolConfig
    });
}

// Comprobación de la conexión inicial
pool.getConnection((err, connection) => {
    if (err) {
        console.error("⚠️ Alerta de conexión con MySQL:");
        console.error(`Código de error: ${err.code}`);
        console.error(`Mensaje: ${err.message}`);
        console.error("💡 En Railway, vincula el servicio MySQL o define MYSQL_URL / DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT.");
        return;
    }

    const host = pool.config.connectionConfig.host || "desconocido";
    const database = pool.config.connectionConfig.database || "desconocido";
    console.log(`✅ Conexión exitosa a MySQL (Base de datos: "${database}" en ${host}) mediante pool`);

    connection.release();
});

module.exports = pool;
