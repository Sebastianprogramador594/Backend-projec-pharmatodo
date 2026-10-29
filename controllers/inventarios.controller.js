const connection = require("../config/db");

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

            console.error("Error al consultar inventarios:");
            console.error(err);

            return res.status(500).json({
                code: err.code,
                errno: err.errno,
                sqlMessage: err.sqlMessage,
                sqlState: err.sqlState,
                message: err.message
            });
        }

        res.json(result);

    });
};

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
            mensaje: "Todos los campos son obligatorios"
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
            MEDICAMENTO_ID,
            CANTIDAD_TOTAL,
            UBICACION
        ],
        (err, result) => {

            if (err) {

                console.error("Error al registrar inventario:");
                console.error(err);

                return res.status(500).json({
                    code: err.code,
                    errno: err.errno,
                    sqlMessage: err.sqlMessage,
                    sqlState: err.sqlState,
                    message: err.message
                });
            }

            res.status(201).json({
                mensaje: "Registro de inventario creado correctamente",
                ID_INVENTARIO: result.insertId
            });

        }
    );
};

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
            mensaje: "Todos los campos son obligatorios"
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
            MEDICAMENTO_ID,
            CANTIDAD_TOTAL,
            UBICACION,
            id
        ],
        (err, result) => {

            if (err) {

                console.error("Error al actualizar inventario:");
                console.error(err);

                return res.status(500).json({
                    code: err.code,
                    errno: err.errno,
                    sqlMessage: err.sqlMessage,
                    sqlState: err.sqlState,
                    message: err.message
                });
            }

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    mensaje: "No se encontró el registro de inventario"
                });
            }

            res.json({
                mensaje: "Inventario actualizado correctamente"
            });

        }
    );
};

const eliminarInventario = (req, res) => {

    const id = req.params.id;

    connection.query(
        "DELETE FROM inventarios WHERE ID_INVENTARIO = ?",
        [id],
        (err, result) => {

            if (err) {

                console.error("Error al eliminar inventario:");
                console.error(err);

                return res.status(500).json({
                    code: err.code,
                    errno: err.errno,
                    sqlMessage: err.sqlMessage,
                    sqlState: err.sqlState,
                    message: err.message
                });
            }

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    mensaje: "No se encontró el registro de inventario"
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