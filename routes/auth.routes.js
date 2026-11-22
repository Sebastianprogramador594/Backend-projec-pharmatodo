const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { verificarToken, verificarRol } = require("../middlewares/auth.middleware");

const router = express.Router();

// INICIO DE SESIÓN
router.post("/auth/login", (req, res) => {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
        return res.status(400).json({
            mensaje: "El usuario y la contraseña son obligatorios"
        });
    }

    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET no está configurada en las variables de entorno");
        return res.status(500).json({
            mensaje: "Error de configuración del servidor (JWT_SECRET no configurada)"
        });
    }

    const sql = `
        SELECT ID_EMPLEADO, NOMBRE, CARGO, HORARIO, USUARIO, PASSWORD, ROL
        FROM empleados
        WHERE USUARIO = ?
    `;

    db.query(sql, [usuario.trim()], async (err, results) => {
        if (err) {
            console.error("Error al consultar el usuario:", err);
            return res.status(500).json({
                mensaje: "Error interno del servidor al consultar credenciales"
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

            const token = jwt.sign(
                {
                    id: empleado.ID_EMPLEADO,
                    usuario: empleado.USUARIO,
                    rol: empleado.ROL
                },
                process.env.JWT_SECRET,
                { expiresIn: "8h" }
            );

            return res.json({
                mensaje: "Inicio de sesión exitoso",
                token,
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
            console.error("Error al procesar contraseña:", error);
            return res.status(500).json({
                mensaje: "Error interno del servidor al validar contraseña"
            });
        }
    });
});

// CREACIÓN DE USUARIO FARMACÉUTICO (SOLO ADMIN)
router.post(
    "/auth/crear-farmaceutico-prueba",
    verificarToken,
    verificarRol("Administrador"),
    async (req, res) => {
        const { nombre, usuario, password } = req.body;

        if (!nombre || !usuario || !password) {
            return res.status(400).json({
                mensaje: "Nombre, usuario y contraseña son obligatorios"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                mensaje: "La contraseña debe tener al menos 8 caracteres"
            });
        }

        try {
            const hash = await bcrypt.hash(password, 10);

            const sql = `
                INSERT INTO empleados
                    (NOMBRE, CARGO, HORARIO, USUARIO, PASSWORD, ROL)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            db.query(
                sql,
                [
                    nombre.trim(),
                    "Farmacéutico",
                    "Horario completo",
                    usuario.trim(),
                    hash,
                    "Farmaceutico"
                ],
                (err, resultado) => {
                    if (err) {
                        if (err.code === "ER_DUP_ENTRY") {
                            return res.status(409).json({
                                mensaje: "Ese nombre de usuario ya existe"
                            });
                        }

                        console.error("Error al crear farmacéutico:", err);
                        return res.status(500).json({
                            mensaje: "No se pudo crear el usuario"
                        });
                    }

                    return res.status(201).json({
                        mensaje: "Usuario farmacéutico creado correctamente",
                        id: resultado.insertId,
                        usuario: usuario.trim(),
                        rol: "Farmaceutico"
                    });
                }
            );
        } catch (error) {
            console.error("Error al cifrar la contraseña:", error);
            return res.status(500).json({
                mensaje: "Error interno del servidor al procesar la contraseña"
            });
        }
    }
);

// CAMBIAR CONTRASEÑA DE LA CUENTA EN SESIÓN
router.put(
    "/auth/cambiar-password",
    verificarToken,
    async (req, res) => {
        const { passwordActual, passwordNueva } = req.body;

        if (!passwordActual || !passwordNueva) {
            return res.status(400).json({
                mensaje: "Debes proporcionar la contraseña actual y la nueva."
            });
        }

        if (passwordNueva.length < 8) {
            return res.status(400).json({
                mensaje: "La nueva contraseña debe tener mínimo 8 caracteres."
            });
        }

        try {
            const idEmpleado = req.usuario.id;

            const sqlBuscar = `
                SELECT PASSWORD
                FROM empleados
                WHERE ID_EMPLEADO = ?
            `;

            db.query(sqlBuscar, [idEmpleado], async (err, resultados) => {
                if (err) {
                    return res.status(500).json({
                        mensaje: "Error al consultar la cuenta."
                    });
                }

                if (resultados.length === 0) {
                    return res.status(404).json({
                        mensaje: "No se encontró el usuario."
                    });
                }

                const coincide = await bcrypt.compare(
                    passwordActual,
                    resultados[0].PASSWORD
                );

                if (!coincide) {
                    return res.status(401).json({
                        mensaje: "La contraseña actual es incorrecta."
                    });
                }

                const hashNuevo = await bcrypt.hash(passwordNueva, 10);

                const sqlActualizar = `
                    UPDATE empleados
                    SET PASSWORD = ?
                    WHERE ID_EMPLEADO = ?
                `;

                db.query(
                    sqlActualizar,
                    [hashNuevo, idEmpleado],
                    (errorActualizar) => {
                        if (errorActualizar) {
                            return res.status(500).json({
                                mensaje: "No se pudo actualizar la contraseña."
                            });
                        }

                        return res.json({
                            mensaje: "Contraseña actualizada correctamente."
                        });
                    }
                );
            });
        } catch (error) {
            console.error("Error al cambiar contraseña:", error);
            return res.status(500).json({
                mensaje: "Error interno del servidor."
            });
        }
    }
);

module.exports = router;
