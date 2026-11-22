require("dotenv").config();

const mysql = require("mysql2");

const connection = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "pharmatodo",
    port: process.env.DB_PORT || 3306
});

connection.connect((err) => {
    if (err) {
        console.error("❌ Error al conectar con MySQL:");
        console.error(`   Código: ${err.code} | Mensaje: ${err.message}`);
        console.error("💡 Sugerencia: Asegúrate de que MySQL esté activo (en XAMPP, WAMP o servicio local) y que hayas ejecutado el script database.sql.");
        return;
    }

    console.log("✅ Conectado exitosamente a la base de datos MySQL (pharmatodo)");
});

module.exports = connection;
