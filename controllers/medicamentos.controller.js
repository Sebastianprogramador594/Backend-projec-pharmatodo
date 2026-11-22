const connection = require("../config/db");

// CONSULTAR TODOS LOS MEDICAMENTOS
const consultarMedicamentos = (req, res) => {
    connection.query(
        "SELECT * FROM medicamentos ORDER BY NOMBRE ASC",
        (err, result) => {
            if (err) {
                console.error("❌ Error al consultar medicamentos:", err);
                return res.status(500).json({
                    mensaje: "Error al consultar los medicamentos",
                    error: err.message
                });
            }

            res.json(result);
        }
    );
};

// REGISTRAR UN MEDICAMENTO
const registrarMedicamento = (req, res) => {
    const {
        NOMBRE,
        TIPO,
        PRECIO,
        FECHA_VENCIMIENTO,
        STOCK,
        VENTA_CODIGO
    } = req.body;

    if (!NOMBRE || !TIPO || PRECIO === undefined || !FECHA_VENCIMIENTO || STOCK === undefined) {
        return res.status(400).json({
            mensaje: "Nombre, tipo, precio, fecha de vencimiento y stock son obligatorios"
        });
    }

    if (Number(PRECIO) < 0 || Number(STOCK) < 0) {
        return res.status(400).json({
            mensaje: "El precio y el stock no pueden ser valores negativos"
        });
    }

    connection.query(
        `INSERT INTO medicamentos
        (NOMBRE, TIPO, PRECIO, FECHA_VENCIMIENTO, STOCK, VENTA_CODIGO)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
            NOMBRE.trim(),
            TIPO.trim(),
            Number(PRECIO),
            FECHA_VENCIMIENTO,
            Number(STOCK),
            VENTA_CODIGO ? VENTA_CODIGO.trim() : null
        ],
        (err, result) => {
            if (err) {
                console.error("Error al registrar medicamento:", err);
                return res.status(500).json({
                    mensaje: "Error al registrar el medicamento",
                    error: err.message
                });
            }

            res.status(201).json({
                mensaje: "Medicamento registrado correctamente",
                id: result.insertId
            });
        }
    );
};

// ELIMINAR UN MEDICAMENTO
const eliminarMedicamento = (req, res) => {
    const id = req.params.id;

    connection.query(
        "DELETE FROM medicamentos WHERE ID = ?",
        [id],
        (err, result) => {
            if (err) {
                if (err.code === "ER_ROW_IS_REFERENCED_2" || err.errno === 1451) {
                    return res.status(409).json({
                        mensaje: "No se puede eliminar este medicamento porque tiene registros asociados en inventarios o ventas"
                    });
                }

                console.error("Error al eliminar medicamento:", err);
                return res.status(500).json({
                    mensaje: "Error al eliminar el medicamento",
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    mensaje: "No se encontró el medicamento especificado"
                });
            }

            res.json({
                mensaje: "Medicamento eliminado correctamente"
            });
        }
    );
};

// ACTUALIZAR UN MEDICAMENTO
const actualizarMedicamento = (req, res) => {
    const id = req.params.id;

    const {
        NOMBRE,
        TIPO,
        PRECIO,
        FECHA_VENCIMIENTO,
        STOCK,
        VENTA_CODIGO
    } = req.body;

    if (!NOMBRE || !TIPO || PRECIO === undefined || !FECHA_VENCIMIENTO || STOCK === undefined) {
        return res.status(400).json({
            mensaje: "Nombre, tipo, precio, fecha de vencimiento y stock son obligatorios"
        });
    }

    if (Number(PRECIO) < 0 || Number(STOCK) < 0) {
        return res.status(400).json({
            mensaje: "El precio y el stock no pueden ser valores negativos"
        });
    }

    connection.query(
        `UPDATE medicamentos
        SET
            NOMBRE = ?,
            TIPO = ?,
            PRECIO = ?,
            FECHA_VENCIMIENTO = ?,
            STOCK = ?,
            VENTA_CODIGO = ?
        WHERE ID = ?`,
        [
            NOMBRE.trim(),
            TIPO.trim(),
            Number(PRECIO),
            FECHA_VENCIMIENTO,
            Number(STOCK),
            VENTA_CODIGO ? VENTA_CODIGO.trim() : null,
            id
        ],
        (err, result) => {
            if (err) {
                console.error("Error al actualizar medicamento:", err);
                return res.status(500).json({
                    mensaje: "Error al actualizar el medicamento",
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    mensaje: "No se encontró el medicamento especificado"
                });
            }

            res.json({
                mensaje: "Medicamento actualizado correctamente"
            });
        }
    );
};

module.exports = {
    consultarMedicamentos,
    registrarMedicamento,
    eliminarMedicamento,
    actualizarMedicamento
};
