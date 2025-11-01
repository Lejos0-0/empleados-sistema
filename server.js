const express = require('express');
const cors = require('cors');
const { empleados, departamentos, estadisticas } = require('./database/queries');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Ruta Hola Mundo
app.get('/', (req, res) => {
    res.json({ 
        mensaje: '¡Hola Mundo desde la API de Empleados!',
        version: '2.0.0',
        descripcion: 'API para gestión de empleados con Base de Datos',
        database: 'SQLite'
    });
});

// Ruta de health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        database: 'Conectada'
    });
});

// 📊 GET /api/departamentos - Obtener todos los departamentos
app.get('/api/departamentos', async (req, res) => {
    try {
        const departamentosList = await departamentos.getAll();
        res.json({
            success: true,
            data: departamentosList
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener departamentos'
        });
    }
});

// 👥 GET /api/empleados - Obtener todos los empleados
app.get('/api/empleados', async (req, res) => {
    try {
        const empleadosList = await empleados.getAll();
        res.json({
            success: true,
            data: empleadosList,
            total: empleadosList.length
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener empleados'
        });
    }
});

// 👤 GET /api/empleados/:id - Obtener un empleado por ID
app.get('/api/empleados/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const empleado = await empleados.getById(id);
        
        if (!empleado) {
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: empleado
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el empleado'
        });
    }
});

// ➕ POST /api/empleados - Crear nuevo empleado
app.post('/api/empleados', async (req, res) => {
    try {
        const { nombre, puesto, departamento_id, salario, fecha_contratacion, email } = req.body;
        
        // Validaciones
        if (!nombre || !puesto || !departamento_id || !salario || !email) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios'
            });
        }

        // Verificar que el departamento existe
        const departamento = await departamentos.getById(departamento_id);
        if (!departamento) {
            return res.status(400).json({
                success: false,
                message: 'El departamento especificado no existe'
            });
        }

        const nuevoEmpleado = {
            nombre,
            puesto,
            departamento_id: parseInt(departamento_id),
            salario: parseFloat(salario),
            email,
            fecha_contratacion: fecha_contratacion || new Date().toISOString().split('T')[0]
        };

        const resultado = await empleados.create(nuevoEmpleado);
        
        // Obtener el empleado creado con información del departamento
        const empleadoCreado = await empleados.getById(resultado.id);
        
        res.status(201).json({
            success: true,
            message: 'Empleado creado exitosamente',
            data: empleadoCreado
        });
    } catch (error) {
        console.error('Error:', error);
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error al crear el empleado'
        });
    }
});

// ✏️ PUT /api/empleados/:id - Actualizar empleado
app.put('/api/empleados/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { nombre, puesto, departamento_id, salario, fecha_contratacion, email } = req.body;
        
        // Verificar que el empleado existe
        const empleadoExistente = await empleados.getById(id);
        if (!empleadoExistente) {
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }

        // Si se proporciona departamento_id, verificar que existe
        if (departamento_id) {
            const departamento = await departamentos.getById(departamento_id);
            if (!departamento) {
                return res.status(400).json({
                    success: false,
                    message: 'El departamento especificado no existe'
                });
            }
        }

        const datosActualizados = {
            nombre: nombre || empleadoExistente.nombre,
            puesto: puesto || empleadoExistente.puesto,
            departamento_id: departamento_id ? parseInt(departamento_id) : empleadoExistente.departamento_id,
            salario: salario ? parseFloat(salario) : empleadoExistente.salario,
            email: email || empleadoExistente.email,
            fecha_contratacion: fecha_contratacion || empleadoExistente.fecha_contratacion
        };

        await empleados.update(id, datosActualizados);
        
        // Obtener el empleado actualizado
        const empleadoActualizado = await empleados.getById(id);
        
        res.json({
            success: true,
            message: 'Empleado actualizado exitosamente',
            data: empleadoActualizado
        });
    } catch (error) {
        console.error('Error:', error);
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el empleado'
        });
    }
});

// 🗑️ DELETE /api/empleados/:id - Eliminar empleado
app.delete('/api/empleados/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        // Verificar que el empleado existe
        const empleadoExistente = await empleados.getById(id);
        if (!empleadoExistente) {
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }

        await empleados.delete(id);
        
        res.json({
            success: true,
            message: 'Empleado eliminado exitosamente',
            data: empleadoExistente
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el empleado'
        });
    }
});

// 📈 GET /api/estadisticas - Estadísticas de empleados
app.get('/api/estadisticas', async (req, res) => {
    try {
        const [estadisticasGenerales] = await estadisticas.getEstadisticas();
        const empleadosPorDepartamento = await estadisticas.getEmpleadosPorDepartamento();
        
        res.json({
            success: true,
            data: {
                totalEmpleados: estadisticasGenerales.total_empleados,
                totalSalarios: estadisticasGenerales.total_salarios,
                salarioPromedio: Math.round(estadisticasGenerales.salario_promedio * 100) / 100,
                porDepartamento: empleadosPorDepartamento
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas'
        });
    }
});

// Manejo de errores 404
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

// Manejo de errores global
app.use((error, req, res, next) => {
    console.error('Error global:', error);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`👥 API Empleados: http://localhost:${PORT}/api/empleados`);
    console.log(`🏢 API Departamentos: http://localhost:${PORT}/api/departamentos`);
    console.log(`💾 Base de datos: SQLite`);
});