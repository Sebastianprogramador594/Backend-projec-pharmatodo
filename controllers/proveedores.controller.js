
const connection = require("../config/db");

const consultarProveedores = (req, res) => {
    connection.query(
        "SELECT * FROM proveedores ORDER BY ID_PROVEEDOR DESC",
        (err, result) => {
            if (err) {
                console.error("Error al consultar proveedores:", err);
                return res.status(500).json({
                    mensaje: "Error al consultar los proveedores",
                    error: err.code
                });
            }

            res.json(result);
        }
    );
};

const registrarProveedor = (req, res) => {
    const {
        NOMBRE,
        NIT,
        CONTACTO,
        TELEFONO,
        CORREO,
        CIUDAD,
        DIRECCION,
        ESTADO
    } = req.body;

    if (!NOMBRE || !NIT || !CONTACTO || !TELEFONO) {
        return res.status(400).json({
            mensaje: "Nombre, NIT, contacto y teléfono son obligatorios"
        });
    }

    connection.query(
        `INSERT INTO proveedores
        (NOMBRE, NIT, CONTACTO, TELEFONO, CORREO, CIUDAD, DIRECCION, ESTADO)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            NOMBRE.trim(),
            NIT.trim(),
            CONTACTO.trim(),
            TELEFONO.trim(),
            CORREO || null,
            CIUDAD || null,
            DIRECCION || null,
            ESTADO || "Activo"
        ],
        (err, result) => {
            if (err) {
                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        mensaje: "Ya existe un proveedor registrado con ese NIT"
                    });
                }

                console.error("Error al registrar proveedor:", err);
                return res.status(500).json({
                    mensaje: "Error al registrar el proveedor",
                    error: err.code
                });
            }

            res.status(201).json({
                mensaje: "Proveedor registrado correctamente",
                ID_PROVEEDOR: result.insertId
            });
        }
    );
};

const actualizarProveedor = (req, res) => {
    const id = req.params.id;

    const {
        NOMBRE,
        NIT,
        CONTACTO,
        TELEFONO,
        CORREO,
        CIUDAD,
        DIRECCION,
        ESTADO
    } = req.body;

    if (!NOMBRE || !NIT || !CONTACTO || !TELEFONO) {
        return res.status(400).json({
            mensaje: "Nombre, NIT, contacto y teléfono son obligatorios"
        });
    }

    connection.query(
        `UPDATE proveedores
        SET NOMBRE = ?,
            NIT = ?,
            CONTACTO = ?,
            TELEFONO = ?,
            CORREO = ?,
            CIUDAD = ?,
            DIRECCION = ?,
            ESTADO = ?
        WHERE ID_PROVEEDOR = ?`,
        [
            NOMBRE.trim(),
            NIT.trim(),
            CONTACTO.trim(),
            TELEFONO.trim(),
            CORREO || null,
            CIUDAD || null,
            DIRECCION || null,
            ESTADO || "Activo",
            id
        ],
        (err, result) => {
            if (err) {
                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        mensaje: "Ya existe otro proveedor registrado con ese NIT"
                    });
                }

                console.error("Error al actualizar proveedor:", err);
                return res.status(500).json({
                    mensaje: "Error al actualizar el proveedor",
                    error: err.code
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    mensaje: "No se encontró el proveedor"
                });
            }

            res.json({
                mensaje: "Proveedor actualizado correctamente"
            });
        }
    );
};

const eliminarProveedor = (req, res) => {
    const id = req.params.id;

    connection.query(
        "DELETE FROM proveedores WHERE ID_PROVEEDOR = ?",
        [id],
        (err, result) => {
            if (err) {
                console.error("Error al eliminar proveedor:", err);
                return res.status(500).json({
                    mensaje: "Error al eliminar el proveedor",
                    error: err.code
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    mensaje: "No se encontró el proveedor"
                });
            }

            res.json({
                mensaje: "Proveedor eliminado correctamente"
            });
        }
    );
};

module.exports = {
    consultarProveedores,
    registrarProveedor,
    actualizarProveedor,
    eliminarProveedor
};