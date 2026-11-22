
require("dotenv").config();

const mysql = require("mysql2");

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "pharmatodo",
    port: Number(process.env.DB_PORT) || 3306,

    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,

    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Comprobar la conexión inicial
pool.getConnection((err, connection) => {
    if (err) {
        console.error("❌ Error al conectar con MySQL:");
        console.error(`Código: ${err.code}`);
        console.error(`Mensaje: ${err.message}`);
        return;
    }

    console.log("✅ Conectado exitosamente a MySQL mediante pool");

    // Devolver la conexión al pool
    connection.release();
});

module.exports = pool;