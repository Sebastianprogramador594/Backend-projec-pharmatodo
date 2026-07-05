const connection = require("../config/db");

// CONSULTAR
const consultarMedicamentos = (req, res) => {
    connection.query(
        "SELECT * FROM medicamentos",
        (err, result) => {
            if (err) {

                console.error("❌ Error en la consulta:");
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
        }
    );
};

// REGISTRAR
const registrarMedicamento = (req, res) => {

    const {
        NOMBRE,
        TIPO,
        PRECIO,
        FECHA_VENCIMIENTO,
        STOCK,
        VENTA_CODIGO
    } = req.body;

    connection.query(
        `INSERT INTO medicamentos
        (NOMBRE, TIPO, PRECIO, FECHA_VENCIMIENTO, STOCK, VENTA_CODIGO)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
            NOMBRE,
            TIPO,
            PRECIO,
            FECHA_VENCIMIENTO,
            STOCK,
            VENTA_CODIGO
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json({
                mensaje: "Medicamento registrado correctamente"
            });

        }
    );
};

// ELIMINAR
const eliminarMedicamento = (req, res) => {

    const id = req.params.id;

    connection.query(
        "DELETE FROM medicamentos WHERE ID = ?",
        [id],
        (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json({
                mensaje: "Medicamento eliminado correctamente"
            });

        }
    );
};

// ACTUALIZAR
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
            NOMBRE,
            TIPO,
            PRECIO,
            FECHA_VENCIMIENTO,
            STOCK,
            VENTA_CODIGO,
            id
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json(err);
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