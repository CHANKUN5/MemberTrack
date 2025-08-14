// Configuración de Supabase
const SUPABASE_URL = 'https://ybdzwqyfbwocuybpdhik.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliZHp3cXlmYndvY3V5YnBkaGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNDk1OTIsImV4cCI6MjA3MDcyNTU5Mn0.W1Dl-sl33q6GkLeAgyJxRsivXVeoTtK3f04snwtHxl0';

// Inicializar cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Configuraciones de la aplicación
const APP_CONFIG = {
    // Sectores disponibles
    sectores: [
        'Tecnología',
        'Salud', 
        'Educación',
        'Comercio',
        'Servicios',
        'Transporte' // AGREGADO: faltaba en la lista original
    ],
    
    // Estados de membresía
    estadosMembresia: [
        'activo',
        'inactivo', 
        'suspendido'
    ],
    
    // Configuración de tabla
    itemsPorPagina: 10,
    
    // Formato de moneda
    formatoMoneda: {
        style: 'currency',
        currency: 'PEN', // Soles peruanos
        minimumFractionDigits: 2
    },
    
    // Formato de fecha
    formatoFecha: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }
};

// Funciones de utilidad para formateo
const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-PE', APP_CONFIG.formatoMoneda).format(monto);
};

const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString('es-PE', APP_CONFIG.formatoFecha);
};

const formatearFechaISO = (fecha) => {
    if (!fecha) return '';
    const fechaObj = new Date(fecha);
    return fechaObj.toISOString().split('T')[0];
};

// Función para mostrar errores de manera consistente
const manejarError = (error, mensaje = 'Ocurrió un error') => {
    console.error('Error:', error);
    mostrarToast(mensaje, 'error');
};

// Validaciones
const validarEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

const validarTelefono = (telefono) => {
    const regex = /^[\+]?[0-9\s\-\(\)]{7,15}$/;
    return regex.test(telefono);
};