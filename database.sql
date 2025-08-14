

CREATE TABLE miembros (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    sector VARCHAR(50) NOT NULL,
    fecha_ingreso DATE NOT NULL,
    estado_membresia VARCHAR(20) CHECK (estado_membresia IN ('activo', 'inactivo', 'suspendido')) DEFAULT 'activo',
    email VARCHAR(100) UNIQUE,
    telefono VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pagos (
    id SERIAL PRIMARY KEY,
    miembro_id INTEGER REFERENCES miembros(id) ON DELETE CASCADE,
    fecha_pago DATE NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    concepto VARCHAR(100) DEFAULT 'Cuota mensual',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar miembros
INSERT INTO miembros (nombre, sector, fecha_ingreso, estado_membresia, email, telefono) VALUES
('Juan Pérez', 'Tecnología', '2023-01-10', 'activo', 'juan.perez@example.com', '987654321'),
('María López', 'Comercio', '2022-11-05', 'activo', 'maria.lopez@example.com', '987111222'),
('Carlos Gómez', 'Educación', '2021-09-12', 'inactivo', 'carlos.gomez@example.com', '987333444'),
('Ana Torres', 'Salud', '2023-02-15', 'activo', 'ana.torres@example.com', '987555666'),
('Pedro Castillo', 'Transporte', '2020-07-01', 'suspendido', 'pedro.castillo@example.com', '987777888'),
('Laura Fernández', 'Tecnología', '2022-05-20', 'activo', 'laura.fernandez@example.com', '987999000'),
('Luis Martínez', 'Comercio', '2021-12-25', 'activo', 'luis.martinez@example.com', '986111222'),
('Sofía Ramírez', 'Educación', '2020-03-15', 'inactivo', 'sofia.ramirez@example.com', '986333444'),
('Diego Chávez', 'Salud', '2019-06-10', 'activo', 'diego.chavez@example.com', '986555666'),
('Camila Vargas', 'Transporte', '2022-10-05', 'activo', 'camila.vargas@example.com', '986777888'),
('Andrés Morales', 'Tecnología', '2023-03-12', 'activo', 'andres.morales@example.com', '986999000'),
('Paula Herrera', 'Comercio', '2021-08-18', 'inactivo', 'paula.herrera@example.com', '985111222'),
('Fernando Silva', 'Educación', '2020-01-30', 'activo', 'fernando.silva@example.com', '985333444'),
('Lucía Medina', 'Salud', '2022-04-22', 'activo', 'lucia.medina@example.com', '985555666'),
('Ricardo Peña', 'Transporte', '2023-05-28', 'activo', 'ricardo.pena@example.com', '985777888');

-- Insertar pagos
INSERT INTO pagos (miembro_id, fecha_pago, monto, concepto) VALUES
(1, '2023-07-01', 50.00, 'Cuota mensual'),
(3, '2023-06-15', 75.00, 'Cuota especial'),
(5, '2023-05-10', 50.00, 'Cuota mensual'),
(7, '2023-04-20', 60.00, 'Cuota mensual'),
(10, '2023-03-05', 50.00, 'Cuota mensual'),
(2, '2023-08-10', 55.00, 'Cuota mensual'),
(4, '2023-09-12', 70.00, 'Cuota especial'),
(6, '2023-02-25', 65.00, 'Cuota mensual'),
(8, '2023-01-18', 50.00, 'Cuota mensual'),
(9, '2023-11-22', 80.00, 'Cuota especial');



