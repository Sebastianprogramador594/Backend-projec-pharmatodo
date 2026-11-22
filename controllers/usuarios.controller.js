
const db = require("../config/db");
const bcrypt = require("bcrypt");

const ROLES_VALIDOS = ["Administrador", "Farmaceutico"];

function listarUsuarios(req, res) {
    const sql = `
        SELECT ID_EMPLEADO, NOMBRE, CARGO, HORARIO, USUARIO, ROL
        FROM empleados
        ORDER BY ID_EMPLEADO DESC
    `;

    db.query(sql, (err, resultados) => {
        if (err) {
            console.error("Error al consultar usuarios:", err);
            return res.status(500).json({
                mensaje: "Error al consultar los usuarios"
            });
        }

        return res.json(resultados);
    });
}

function obtenerUsuario(req, res) {
    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
        return res.status(400).json({
            mensaje: "El identificador no es válido"
        });
    }

    db.query(
        `SELECT ID_EMPLEADO, NOMBRE, CARGO, HORARIO, USUARIO, ROL
         FROM empleados
         WHERE ID_EMPLEADO = ?`,
        [id],
        (err, resultados) => {
            if (err) {
                console.error("Error al consultar usuario:", err);
                return res.status(500).json({
                    mensaje: "Error al consultar el usuario"
                });
            }

            if (resultados.length === 0) {
                return res.status(404).json({
                    mensaje: "Usuario no encontrado"
                });
            }

            return res.json(resultados[0]);
        }
    );
}

function validarDatos(req, res, permitirPasswordOpcional = false) {
    const { nombre, cargo, horario, usuario, password, rol } = req.body;

    if (
        !nombre?.trim() ||
        !cargo?.trim() ||
        !horario?.trim() ||
        !usuario?.trim() ||
        !ROLES_VALIDOS.includes(rol)
    ) {
        res.status(400).json({
            mensaje: "Verifica el nombre, cargo, horario, usuario y rol"
        });
        return false;
    }

    if (!permitirPasswordOpcional || password) {
        if (typeof password !== "string" || password.length < 8) {
            res.status(400).json({
                mensaje: "La contraseña debe tener al menos 8 caracteres"
            });
            return false;
        }
    }

    if (rol === "Administrador") {
        res.status(403).json({
            mensaje: "No se permite asignar el rol de administrador desde esta operación"
        });
        return false;
    }

    return true;
}

async function crearUsuario(req, res) {
    if (!validarDatos(req, res)) return;

    const { nombre, cargo, horario, usuario, password, rol } = req.body;

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
                cargo.trim(),
                horario.trim(),
                usuario.trim(),
                hash,
                rol
            ],
            (err, resultado) => {
                if (err) {
                    if (err.code === "ER_DUP_ENTRY") {
                        return res.status(409).json({
                            mensaje: "Ese nombre de usuario ya existe"
                        });
                    }

                    console.error("Error al crear usuario:", err);
                    return res.status(500).json({
                        mensaje: "No se pudo crear el usuario"
                    });
                }

                return res.status(201).json({
                    mensaje: "Usuario creado correctamente",
                    id: resultado.insertId
                });
            }
        );
    } catch (error) {
        console.error("Error al crear usuario:", error);
        return res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
}

async function actualizarUsuario(req, res) {
    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
        return res.status(400).json({
            mensaje: "El identificador no es válido"
        });
    }

    if (!validarDatos(req, res, true)) return;

    const { nombre, cargo, horario, usuario, password, rol } = req.body;

    try {
        let sql;
        let valores;

        if (password) {
            const hash = await bcrypt.hash(password, 10);

            sql = `
                UPDATE empleados
                SET NOMBRE = ?, CARGO = ?, HORARIO = ?,
                    USUARIO = ?, PASSWORD = ?, ROL = ?
                WHERE ID_EMPLEADO = ?
            `;

            valores = [
                nombre.trim(),
                cargo.trim(),
                horario.trim(),
                usuario.trim(),
                hash,
                rol,
                id
            ];
        } else {
            sql = `
                UPDATE empleados
                SET NOMBRE = ?, CARGO = ?, HORARIO = ?,
                    USUARIO = ?, ROL = ?
                WHERE ID_EMPLEADO = ?
            `;

            valores = [
                nombre.trim(),
                cargo.trim(),
                horario.trim(),
                usuario.trim(),
                rol,
                id
            ];
        }

        db.query(sql, valores, (err, resultado) => {
            if (err) {
                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        mensaje: "Ese nombre de usuario ya existe"
                    });
                }

                console.error("Error al actualizar usuario:", err);
                return res.status(500).json({
                    mensaje: "No se pudo actualizar el usuario"
                });
            }

            if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    mensaje: "Usuario no encontrado o sin cambios"
                });
            }

            return res.json({
                mensaje: "Usuario actualizado correctamente"
            });
        });
    } catch (error) {
        console.error("Error al actualizar usuario:", error);
        return res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
}

function eliminarUsuario(req, res) {
    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
        return res.status(400).json({
            mensaje: "El identificador no es válido"
        });
    }

    if (Number(id) === Number(req.usuario.id)) {
        return res.status(400).json({
            mensaje: "No puedes eliminar tu propia cuenta"
        });
    }

    db.query(
        "SELECT ROL FROM empleados WHERE ID_EMPLEADO = ?",
        [id],
        (err, usuarios) => {
            if (err) {
                console.error("Error al consultar usuario:", err);
                return res.status(500).json({
                    mensaje: "No se pudo verificar el usuario"
                });
            }

            if (usuarios.length === 0) {
                return res.status(404).json({
                    mensaje: "Usuario no encontrado"
                });
            }

            const continuarEliminacion = () => {
                db.query(
                    "DELETE FROM empleados WHERE ID_EMPLEADO = ?",
                    [id],
                    (error, resultado) => {
                        if (error) {
                            console.error("Error al eliminar usuario:", error);
                            return res.status(500).json({
                                mensaje: "No se pudo eliminar el usuario"
                            });
                        }

                        if (resultado.affectedRows === 0) {
                            return res.status(404).json({
                                mensaje: "Usuario no encontrado"
                            });
                        }

                        return res.json({
                            mensaje: "Usuario eliminado correctamente"
                        });
                    }
                );
            };

            if (usuarios[0].ROL !== "Administrador") {
                return continuarEliminacion();
            }

            db.query(
                "SELECT COUNT(*) AS total FROM empleados WHERE ROL = 'Administrador'",
                (error, conteo) => {
                    if (error) {
                        console.error("Error al verificar administradores:", error);
                        return res.status(500).json({
                            mensaje: "No se pudo verificar las cuentas administrativas"
                        });
                    }

                    if (conteo[0].total <= 1) {
                        return res.status(409).json({
                            mensaje: "No se puede eliminar la última cuenta administrativa"
                        });
                    }

                    return continuarEliminacion();
                }
            );
        }
    );
}

module.exports = {
    listarUsuarios,
    obtenerUsuario,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario
};
