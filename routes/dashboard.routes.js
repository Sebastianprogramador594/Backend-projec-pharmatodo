const express = require("express");
const db = require("../config/db");

const router = express.Router();

router.get("/dashboard", (req, res) => {
    const consultas = {
        productos: `
            SELECT COUNT(*) AS total
            FROM medicamentos
        `,
        inventario: `
            SELECT COALESCE(SUM(STOCK), 0) AS total
            FROM medicamentos
        `,
        bajoStock: `
            SELECT COUNT(*) AS total
            FROM medicamentos
            WHERE STOCK <= 10
        `,
        proximosVencer: `
            SELECT COUNT(*) AS total
            FROM medicamentos
            WHERE FECHA_VENCIMIENTO BETWEEN CURDATE()
            AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        `,
        ventasRecientes: `
            SELECT CODIGO, FECHA, TOTAL, CLIENTE_NOMBRE
            FROM ventas
            ORDER BY CODIGO DESC
            LIMIT 5
        `,
        medicamentosBajoStock: `
            SELECT NOMBRE, STOCK
            FROM medicamentos
            WHERE STOCK <= 10
            ORDER BY STOCK ASC
            LIMIT 5
        `,
        medicamentosProximosVencer: `
            SELECT NOMBRE, FECHA_VENCIMIENTO
            FROM medicamentos
            WHERE FECHA_VENCIMIENTO BETWEEN CURDATE()
            AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
            ORDER BY FECHA_VENCIMIENTO ASC
            LIMIT 5
        `
    };

    const ejecutarConsulta = (sql) => {
        return new Promise((resolve, reject) => {
            db.query(sql, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    };

    Promise.all([
        ejecutarConsulta(consultas.productos),
        ejecutarConsulta(consultas.inventario),
        ejecutarConsulta(consultas.bajoStock),
        ejecutarConsulta(consultas.proximosVencer),
        ejecutarConsulta(consultas.ventasRecientes),
        ejecutarConsulta(consultas.medicamentosBajoStock),
        ejecutarConsulta(consultas.medicamentosProximosVencer)
    ])
    .then(([
        productos,
        inventario,
        bajoStock,
        proximosVencer,
        ventasRecientes,
        medicamentosBajoStock,
        medicamentosProximosVencer
    ]) => {
        res.json({
            productos: productos[0].total,
            inventario: inventario[0].total,
            bajoStock: bajoStock[0].total,
            proximosVencer: proximosVencer[0].total,
            ventasRecientes,
            medicamentosBajoStock,
            medicamentosProximosVencer
        });
    })
    .catch((err) => {
        console.error("Error al cargar el dashboard:", err);
        res.status(500).json({
            mensaje: "Error al cargar los datos del dashboard"
        });
    });
});

module.exports = router;