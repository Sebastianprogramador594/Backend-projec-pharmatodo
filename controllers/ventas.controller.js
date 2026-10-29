const connection = require("../config/db");

const registrarVenta = (req, res) => {
    const {
        CLIENTE_NOMBRE,
        METODO_PAGO,
        productos
    } = req.body;

    if (!CLIENTE_NOMBRE || !METODO_PAGO || !Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({
            mensaje: "Los datos de la venta están incompletos"
        });
    }

    connection.beginTransaction((err) => {
        if (err) {
            return res.status(500).json({
                mensaje: "No se pudo iniciar la transacción",
                error: err.message
            });
        }

        let total = 0;
        let detallesProcesados = 0;
        const detalles = [];

        const procesarProducto = (indice) => {
            if (indice >= productos.length) {
                connection.query(
                    `INSERT INTO ventas
                    (TOTAL, METODO_PAGO, CLIENTE_NOMBRE)
                    VALUES (?, ?, ?)`,
                    [total, METODO_PAGO, CLIENTE_NOMBRE],
                    (err, resultadoVenta) => {

                        if (err) {
                            return connection.rollback(() => {
                                res.status(500).json({
                                    mensaje: "No se pudo registrar la venta",
                                    error: err.message
                                });
                            });
                        }

                        const codigoVenta = resultadoVenta.insertId;

                        const insertarDetalle = (posicion) => {
                            if (posicion >= detalles.length) {
                                return connection.commit((err) => {
                                    if (err) {
                                        return connection.rollback(() => {
                                            res.status(500).json({
                                                mensaje: "No se pudo confirmar la venta",
                                                error: err.message
                                            });
                                        });
                                    }

                                    res.status(201).json({
                                        mensaje: "Venta registrada correctamente",
                                        codigoVenta: codigoVenta,
                                        total: total
                                    });
                                });
                            }

                            const detalle = detalles[posicion];

                            connection.query(
                                `INSERT INTO detalle_ventas
                                (VENTA_CODIGO, MEDICAMENTO_ID, CANTIDAD, PRECIO_UNITARIO, SUBTOTAL)
                                VALUES (?, ?, ?, ?, ?)`,
                                [
                                    codigoVenta,
                                    detalle.MEDICAMENTO_ID,
                                    detalle.CANTIDAD,
                                    detalle.PRECIO_UNITARIO,
                                    detalle.SUBTOTAL
                                ],
                                (err) => {
                                    if (err) {
                                    return connection.rollback(() => {
                                        res.status(500).json({
                                            mensaje: "No se pudo registrar el detalle de la venta",
                                            error: err.message
                                        });
                                    });
                                }

                                    connection.query(
                                        `UPDATE medicamentos
                                        SET STOCK = STOCK - ?
                                        WHERE ID = ?`,
                                        [
                                            detalle.CANTIDAD,
                                            detalle.MEDICAMENTO_ID
                                        ],
                                        (err) => {
                                            if (err) {
                                                return connection.rollback(() => {
                                                    res.status(500).json({
                                                        mensaje: "No se pudo actualizar el stock",
                                                        error: err.message
                                                    });
                                                });
                                            }

                                            insertarDetalle(posicion + 1);
                                        }
                                    );
                                }
                            );
                        };

                        insertarDetalle(0);
                    }
                );

                return;
            }

            const producto = productos[indice];

            if (!producto.MEDICAMENTO_ID || !producto.CANTIDAD || producto.CANTIDAD <= 0) {
                return connection.rollback(() => {
                    res.status(400).json({
                        mensaje: "Los productos contienen datos inválidos"
                    });
                });
            }

            connection.query(
                `SELECT ID, NOMBRE, PRECIO, STOCK
                FROM medicamentos
                WHERE ID = ?`,
                [producto.MEDICAMENTO_ID],
                (err, resultados) => {

                    if (err) {
                        return connection.rollback(() => {
                            res.status(500).json({
                                mensaje: "Error al consultar el medicamento",
                                error: err.message
                            });
                        });
                    }

                    if (resultados.length === 0) {
                        return connection.rollback(() => {
                            res.status(404).json({
                                mensaje: `El medicamento con ID ${producto.MEDICAMENTO_ID} no existe`
                            });
                        });
                    }

                    const medicamento = resultados[0];

                    if (medicamento.STOCK < producto.CANTIDAD) {
                        return connection.rollback(() => {
                            res.status(400).json({
                                mensaje: `Stock insuficiente para ${medicamento.NOMBRE}. Stock disponible: ${medicamento.STOCK}`
                            });
                        });
                    }

                    const subtotal = Number(medicamento.PRECIO) * Number(producto.CANTIDAD);

                    total += subtotal;

                    detalles.push({
                        MEDICAMENTO_ID: medicamento.ID,
                        CANTIDAD: Number(producto.CANTIDAD),
                        PRECIO_UNITARIO: Number(medicamento.PRECIO),
                        SUBTOTAL: subtotal
                    });

                    detallesProcesados++;

                    procesarProducto(indice + 1);
                }
            );
        };

        procesarProducto(0);
    });
};

const consultarVentas = (req, res) => {
    connection.query(
        `SELECT
            CODIGO,
            FECHA,
            TOTAL,
            METODO_PAGO,
            CLIENTE_NOMBRE
        FROM ventas
        ORDER BY FECHA DESC`,
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    mensaje: "Error al consultar las ventas",
                    error: err.message
                });
            }

            res.json(result);
        }
    );
};

const consultarDetalleVenta = (req, res) => {
    const codigo = req.params.codigo;

    connection.query(
        `SELECT
            dv.ID,
            dv.VENTA_CODIGO,
            dv.MEDICAMENTO_ID,
            m.NOMBRE AS MEDICAMENTO,
            dv.CANTIDAD,
            dv.PRECIO_UNITARIO,
            dv.SUBTOTAL
        FROM detalle_ventas dv
        INNER JOIN medicamentos m
            ON dv.MEDICAMENTO_ID = m.ID
        WHERE dv.VENTA_CODIGO = ?`,
        [codigo],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    mensaje: "Error al consultar el detalle de la venta",
                    error: err.message
                });
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