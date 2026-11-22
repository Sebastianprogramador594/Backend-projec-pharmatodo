// Controlador de ventas de Pharmatodo: compatible con mysql2.createPool().
const pool = require("../config/db");

function errorDeVenta(estado, mensaje) {
    const error = new Error(mensaje);
    error.estado = estado;
    return error;
}

const registrarVenta = async (req, res) => {
    const { CLIENTE_NOMBRE, METODO_PAGO, productos } = req.body || {};

    if (
        typeof CLIENTE_NOMBRE !== "string" || !CLIENTE_NOMBRE.trim() ||
        typeof METODO_PAGO !== "string" || !METODO_PAGO.trim() ||
        !Array.isArray(productos) || productos.length === 0
    ) {
        return res.status(400).json({
            mensaje: "Los datos de la venta están incompletos. Debe indicar cliente, método de pago y al menos un producto."
        });
    }

    // Sumar cantidades de productos repetidos para validar el stock real.
    const cantidadesPorMedicamento = new Map();
    for (const producto of productos) {
        const id = Number(producto?.MEDICAMENTO_ID);
        const cantidad = Number(producto?.CANTIDAD);

        if (!Number.isSafeInteger(id) || id <= 0 ||
            !Number.isSafeInteger(cantidad) || cantidad <= 0) {
            return res.status(400).json({
                mensaje: "Uno o más productos contienen datos de cantidad inválidos"
            });
        }

        const acumulado = (cantidadesPorMedicamento.get(id) || 0) + cantidad;
        if (!Number.isSafeInteger(acumulado)) {
            return res.status(400).json({ mensaje: "Cantidad solicitada inválida" });
        }
        cantidadesPorMedicamento.set(id, acumulado);
    }

    let connection;
    let transaccionIniciada = false;

    try {
        // Obtener UNA conexión del pool para toda la transacción.
        connection = await pool.promise().getConnection();
        await connection.beginTransaction();
        transaccionIniciada = true;

        // Bloquear filas en orden fijo para evitar ventas simultáneas sin stock.
        const cantidades = [...cantidadesPorMedicamento.entries()]
            .sort(([idA], [idB]) => idA - idB);
        const medicamentos = new Map();

        for (const [id, cantidad] of cantidades) {
            const [filas] = await connection.execute(
                `SELECT ID, NOMBRE, PRECIO, STOCK
                 FROM medicamentos WHERE ID = ? FOR UPDATE`,
                [id]
            );

            if (filas.length === 0) {
                throw errorDeVenta(404, `El medicamento con ID ${id} no existe`);
            }

            const medicamento = filas[0];
            if (Number(medicamento.STOCK) < cantidad) {
                throw errorDeVenta(
                    400,
                    `Stock insuficiente para "${medicamento.NOMBRE}". ` +
                    `Stock disponible: ${medicamento.STOCK}, solicitado: ${cantidad}`
                );
            }
            medicamentos.set(id, medicamento);
        }

        // Mantener una línea de detalle por cada producto enviado por el frontend.
        const detalles = productos.map((producto) => {
            const id = Number(producto.MEDICAMENTO_ID);
            const cantidad = Number(producto.CANTIDAD);
            const precio = Number(medicamentos.get(id).PRECIO);
            return {
                MEDICAMENTO_ID: id,
                CANTIDAD: cantidad,
                PRECIO_UNITARIO: precio,
                SUBTOTAL: Math.round((precio * cantidad + Number.EPSILON) * 100) / 100
            };
        });

        const total = Math.round(
            (detalles.reduce((suma, detalle) => suma + detalle.SUBTOTAL, 0) + Number.EPSILON) * 100
        ) / 100;

        const [resultadoVenta] = await connection.execute(
            `INSERT INTO ventas (TOTAL, METODO_PAGO, CLIENTE_NOMBRE)
             VALUES (?, ?, ?)`,
            [total, METODO_PAGO.trim(), CLIENTE_NOMBRE.trim()]
        );
        const codigoVenta = resultadoVenta.insertId;

        for (const detalle of detalles) {
            await connection.execute(
                `INSERT INTO detalle_ventas
                 (VENTA_CODIGO, MEDICAMENTO_ID, CANTIDAD, PRECIO_UNITARIO, SUBTOTAL)
                 VALUES (?, ?, ?, ?, ?)`,
                [codigoVenta, detalle.MEDICAMENTO_ID, detalle.CANTIDAD,
                    detalle.PRECIO_UNITARIO, detalle.SUBTOTAL]
            );
        }

        for (const [id, cantidad] of cantidades) {
            // Descuento del stock global del medicamento.
            await connection.execute(
                `UPDATE medicamentos SET STOCK = STOCK - ? WHERE ID = ?`,
                [cantidad, id]
            );

            // Mantener la misma lógica de inventario físico del controlador original.
            // Si existen VARIAS ubicaciones por medicamento, conviene revisar esta
            // distribución posteriormente para no restar toda la cantidad en cada una.
            await connection.execute(
                `UPDATE inventarios
                 SET CANTIDAD_TOTAL = GREATEST(0, CANTIDAD_TOTAL - ?)
                 WHERE MEDICAMENTO_ID = ?`,
                [cantidad, id]
            );
        }

        await connection.commit();
        transaccionIniciada = false;

        return res.status(201).json({
            mensaje: "Venta registrada correctamente",
            codigoVenta,
            total
        });
    } catch (err) {
        if (connection && transaccionIniciada) {
            try {
                await connection.rollback();
            } catch (errorRollback) {
                console.error("Error al revertir la venta:", errorRollback);
            }
        }
        if (!err.estado) {
            console.error("Error al registrar la venta:", err);
        }
        return res.status(err.estado || 500).json({
            mensaje: err.estado ? err.message : "No se pudo registrar la venta"
        });
    } finally {
        // Se ejecuta tras COMMIT, ROLLBACK o error: no agota el pool.
        if (connection) connection.release();
    }
};

const consultarVentas = (req, res) => {
    pool.query(
        `SELECT CODIGO, FECHA, TOTAL, METODO_PAGO, CLIENTE_NOMBRE
         FROM ventas ORDER BY FECHA DESC, CODIGO DESC`,
        (err, result) => {
            if (err) {
                console.error("Error al consultar las ventas:", err);
                return res.status(500).json({ mensaje: "Error al consultar las ventas" });
            }
            res.json(result);
        }
    );
};

const consultarDetalleVenta = (req, res) => {
    const codigo = req.params.codigo;

    pool.query(
        `SELECT dv.ID, dv.VENTA_CODIGO, dv.MEDICAMENTO_ID,
                m.NOMBRE AS MEDICAMENTO, dv.CANTIDAD,
                dv.PRECIO_UNITARIO, dv.SUBTOTAL
         FROM detalle_ventas dv
         INNER JOIN medicamentos m ON dv.MEDICAMENTO_ID = m.ID
         WHERE dv.VENTA_CODIGO = ?`,
        [codigo],
        (err, result) => {
            if (err) {
                console.error("Error al consultar el detalle de la venta:", err);
                return res.status(500).json({ mensaje: "Error al consultar el detalle de la venta" });
            }
            res.json(result);
        }
    );
};

module.exports = {
    registrarVenta,
    consultarVentas,
    consultarDetalleVenta
};
