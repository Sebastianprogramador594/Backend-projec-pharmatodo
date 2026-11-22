const connection = require("../config/db");

// CONSULTAR INVENTARIOS
const consultarInventarios = (req, res) => {
    const sql = `
        SELECT
            i.ID_INVENTARIO,
            i.MEDICAMENTO_ID,
            m.NOMBRE AS MEDICAMENTO_NOMBRE,
            m.TIPO,
            m.PRECIO,
            m.FECHA_VENCIMIENTO,
            i.CANTIDAD_TOTAL,
            i.UBICACION,
            i.FECHA_ACTUALIZACION
        FROM inventarios i
        INNER JOIN medicamentos m
            ON i.MEDICAMENTO_ID = m.ID
        ORDER BY m.NOMBRE ASC
    `;

    connection.query(sql, (err, result) => {
        if (err) {
            console.error("Error al consultar inventarios:", err);
            return res.status(500).json({
                mensaje: "Error al consultar los registros de inventario",
                error: err.message
            });
        }

        res.json(result);
    });
};

// REGISTRAR INVENTARIO
const registrarInventario = (req, res) => {
    const {
        MEDICAMENTO_ID,
        CANTIDAD_TOTAL,
        UBICACION
    } = req.body;

    if (
        MEDICAMENTO_ID === undefined ||
        CANTIDAD_TOTAL === undefined ||
        !UBICACION
    ) {
        return res.status(400).json({
            mensaje: "El medicamento, la cantidad total y la ubicación son obligatorios"
        });
    }

    if (Number(CANTIDAD_TOTAL) < 0) {
        return res.status(400).json({
            mensaje: "La cantidad no puede ser un valor negativo"
        });
    }

    const sql = `
        INSERT INTO inventarios
        (MEDICAMENTO_ID, CANTIDAD_TOTAL, UBICACION)
        VALUES (?, ?, ?)
    `;

    connection.query(
        sql,
        [
            Number(MEDICAMENTO_ID),
            Number(CANTIDAD_TOTAL),
            UBICACION.trim()
        ],
        (err, result) => {
            if (err) {
                console.error("Error al registrar inventario:", err);
                return res.status(500).json({
                    mensaje: "Error al registrar en inventario",
                    error: err.message
                });
            }

            res.status(201).json({
                mensaje: "Registro de inventario creado correctamente",
                ID_INVENTARIO: result.insertId
            });
        }
    );
};

// ACTUALIZAR INVENTARIO
const actualizarInventario = (req, res) => {
    const id = req.params.id;

    const {
        MEDICAMENTO_ID,
        CANTIDAD_TOTAL,
        UBICACION
    } = req.body;

    if (
        MEDICAMENTO_ID === undefined ||
        CANTIDAD_TOTAL === undefined ||
        !UBICACION
    ) {
        return res.status(400).json({
            mensaje: "El medicamento, la cantidad total y la ubicación son obligatorios"
        });
    }

    if (Number(CANTIDAD_TOTAL) < 0) {
        return res.status(400).json({
            mensaje: "La cantidad no puede ser un valor negativo"
        });
    }

    const sql = `
        UPDATE inventarios
        SET
            MEDICAMENTO_ID = ?,
            CANTIDAD_TOTAL = ?,
            UBICACION = ?
        WHERE ID_INVENTARIO = ?
    `;

    connection.query(
        sql,
        [
            Number(MEDICAMENTO_ID),
            Number(CANTIDAD_TOTAL),
            UBICACION.trim(),
            id
        ],
        (err, result) => {
            if (err) {
                console.error("Error al actualizar inventario:", err);
                return res.status(500).json({
                    mensaje: "Error al actualizar el registro de inventario",
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    mensaje: "No se encontró el registro de inventario especificado"
                });
            }

            res.json({
                mensaje: "Inventario actualizado correctamente"
            });
        }
    );
};

// ELIMINAR INVENTARIO
const eliminarInventario = (req, res) => {
    const id = req.params.id;

    connection.query(
        "DELETE FROM inventarios WHERE ID_INVENTARIO = ?",
        [id],
        (err, result) => {
            if (err) {
                console.error("Error al eliminar inventario:", err);
                return res.status(500).json({
                    mensaje: "Error al eliminar el registro de inventario",
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    mensaje: "No se encontró el registro de inventario especificado"
                });
            }

            res.json({
                mensaje: "Registro de inventario eliminado correctamente"
            });
        }
    );
};

module.exports = {
    consultarInventarios,
    registrarInventario,
    actualizarInventario,
    eliminarInventario
};
