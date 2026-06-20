const mysql = require("mysql2");

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "pharmatodo"
});

connection.connect((err) => {
    if (err) {
        console.log("Error de conexión:", err);
        return;
    }

    console.log("Conectado a MySQL");
});

module.exports = connection;