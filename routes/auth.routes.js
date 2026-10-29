
const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../config/db");

const router = express.Router();

router.post("/auth/login", (req, res) => {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
        return res.status(400).json({
            mensaje: "El usuario y la contraseña son obligatorios"
        });
    }

    const sql = `
        SELECT ID_EMPLEADO, NOMBRE, CARGO, HORARIO, USUARIO, PASSWORD, ROL
        FROM empleados
        WHERE USUARIO = ?
    `;

    db.query(sql, [usuario], async (err, results) => {
        if (err) {
            console.error("Error al consultar el usuario:", err);
            return res.status(500).json({
                mensaje: "Error interno del servidor"
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                mensaje: "Usuario o contraseña incorrectos"
            });
        }

        const empleado = results[0];

        try {
            const passwordCorrecta = await bcrypt.compare(
                password,
                empleado.PASSWORD
            );

            if (!passwordCorrecta) {
                return res.status(401).json({
                    mensaje: "Usuario o contraseña incorrectos"
                });
            }

            return res.json({
                mensaje: "Inicio de sesión exitoso",
                usuario: {
                    id: empleado.ID_EMPLEADO,
                    nombre: empleado.NOMBRE,
                    cargo: empleado.CARGO,
                    horario: empleado.HORARIO,
                    usuario: empleado.USUARIO,
                    rol: empleado.ROL
                }
            });
        } catch (error) {
            console.error("Error al verificar la contraseña:", error);
            return res.status(500).json({
                mensaje: "Error interno del servidor"
            });
        }
    });
});

module.exports = router;