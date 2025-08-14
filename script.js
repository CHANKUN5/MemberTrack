// Variables globales
let miembros = [];
let pagos = [];
let miembroEditando = null;
let pagoEditando = null;

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', function() {
    inicializarApp();
});

async function inicializarApp() {
    try {
        configurarEventListeners();
        await cargarDatos();
        configurarModoOscuro();
        mostrarToast('¡Aplicación cargada correctamente!', 'success');
    } catch (error) {
        manejarError(error, 'Error al inicializar la aplicación');
    }
}

// Configurar event listeners
function configurarEventListeners() {
    // Navegación entre tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => cambiarTab(btn.dataset.tab));
    });

    // Botones principales
    document.getElementById('btnNuevoMiembro').addEventListener('click', () => abrirModalMiembro());
    document.getElementById('btnNuevoPago').addEventListener('click', () => abrirModalPago());
    document.getElementById('btnActualizarReportes').addEventListener('click', () => actualizarReportes());

    // Modales
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', cerrarModales);
    });
    document.getElementById('btnCancelarMiembro').addEventListener('click', cerrarModales);
    document.getElementById('btnCancelarPago').addEventListener('click', cerrarModales);

    // Formularios
    document.getElementById('formMiembro').addEventListener('submit', guardarMiembro);
    document.getElementById('formPago').addEventListener('submit', guardarPago);

    // Filtros
    document.getElementById('filtroSector').addEventListener('change', aplicarFiltrosMiembros);
    document.getElementById('filtroEstado').addEventListener('change', aplicarFiltrosMiembros);
    document.getElementById('buscarNombre').addEventListener('input', aplicarFiltrosMiembros);
    document.getElementById('btnLimpiarFiltros').addEventListener('click', limpiarFiltrosMiembros);

    document.getElementById('filtroMiembro').addEventListener('change', aplicarFiltrosPagos);
    document.getElementById('fechaDesde').addEventListener('change', aplicarFiltrosPagos);
    document.getElementById('fechaHasta').addEventListener('change', aplicarFiltrosPagos);
    document.getElementById('btnLimpiarFiltrosPagos').addEventListener('click', limpiarFiltrosPagos);

    // Exportación
    document.getElementById('exportMembersPdf').addEventListener('click', exportarMiembrosPDF);
    document.getElementById('exportPaymentsPdf').addEventListener('click', exportarPagosPDF);

    // Cerrar modales al hacer click fuera
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            cerrarModales();
        }
    });
}

// Cargar datos desde Supabase (optimizado)
async function cargarDatos(actualizarReportesFlag = true) {
    mostrarLoading(true);
    try {
        // Cargar ambos datos en paralelo para mejorar velocidad
        const [miembrosResponse, pagosResponse] = await Promise.all([
            supabase
                .from('miembros')
                .select('*')
                .order('created_at', { ascending: false }),
            supabase
                .from('pagos')
                .select(`
                    *,
                    miembros (
                        nombre
                    )
                `)
                .order('fecha_pago', { ascending: false })
        ]);

        if (miembrosResponse.error) throw miembrosResponse.error;
        if (pagosResponse.error) throw pagosResponse.error;

        miembros = miembrosResponse.data || [];
        pagos = pagosResponse.data || [];

        // Actualizar UI de forma eficiente
        const currentTab = document.querySelector('.tab-content.active').id;
        
        if (currentTab === 'miembros') {
            renderizarTablaMiembros();
        } else if (currentTab === 'pagos') {
            renderizarTablaPagos();
        } else if (currentTab === 'reportes' && actualizarReportesFlag) {
            actualizarReportes();
        }

        // Siempre actualizar selects (son rápidos)
        llenarSelectMiembros();

    } catch (error) {
        manejarError(error, 'Error al cargar los datos');
    } finally {
        mostrarLoading(false);
    }
}

// Cambiar entre tabs (optimizado)
function cambiarTab(tabId) {
    // Actualizar botones
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

    // Mostrar contenido
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');

    // Cargar datos solo si es necesario y no están cargados
    if (tabId === 'reportes') {
        setTimeout(() => actualizarReportes(), 100); // Pequeño delay para suavizar transición
    } else if (tabId === 'miembros' && !document.querySelector('#tablaMiembros tbody').innerHTML.trim()) {
        renderizarTablaMiembros();
    } else if (tabId === 'pagos' && !document.querySelector('#tablaPagos tbody').innerHTML.trim()) {
        renderizarTablaPagos();
    }
}

// Renderizar tabla de miembros
function renderizarTablaMiembros() {
    const tbody = document.querySelector('#tablaMiembros tbody');
    
    if (miembros.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-users"></i><h3>No hay miembros registrados</h3><p>Comienza agregando tu primer miembro</p></td></tr>';
        return;
    }

    tbody.innerHTML = miembros.map(miembro => `
        <tr>
            <td>${miembro.id}</td>
            <td><strong>${miembro.nombre}</strong></td>
            <td>${miembro.sector}</td>
            <td>${formatearFecha(miembro.fecha_ingreso)}</td>
            <td><span class="status-badge status-${miembro.estado_membresia}">${miembro.estado_membresia}</span></td>
            <td>${miembro.email || '-'}</td>
            <td class="action-buttons">
                <button class="btn btn-small btn-secondary" onclick="editarMiembro(${miembro.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-small btn-danger" onclick="eliminarMiembro(${miembro.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Renderizar tabla de pagos
function renderizarTablaPagos() {
    const tbody = document.querySelector('#tablaPagos tbody');
    
    if (pagos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fas fa-money-bill-wave"></i><h3>No hay pagos registrados</h3><p>Comienza registrando el primer pago</p></td></tr>';
        return;
    }

    tbody.innerHTML = pagos.map(pago => `
        <tr>
            <td>${pago.id}</td>
            <td><strong>${pago.miembros?.nombre || 'N/A'}</strong></td>
            <td>${formatearFecha(pago.fecha_pago)}</td>
            <td>${formatearMoneda(pago.monto)}</td>
            <td>${pago.concepto || 'Cuota mensual'}</td>
            <td class="action-buttons">
                <button class="btn btn-small btn-secondary" onclick="editarPago(${pago.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-small btn-danger" onclick="eliminarPago(${pago.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Gestión de miembros
function abrirModalMiembro(id = null) {
    miembroEditando = id;
    const modal = document.getElementById('modalMiembro');
    const titulo = document.getElementById('modalMiembroTitulo');
    const form = document.getElementById('formMiembro');

    if (id) {
        const miembro = miembros.find(m => m.id === id);
        titulo.textContent = 'Editar Miembro';
        llenarFormularioMiembro(miembro);
    } else {
        titulo.textContent = 'Nuevo Miembro';
        form.reset();
        document.getElementById('fechaIngreso').value = new Date().toISOString().split('T')[0];
    }

    modal.style.display = 'block';
}

function llenarFormularioMiembro(miembro) {
    document.getElementById('nombre').value = miembro.nombre;
    document.getElementById('sector').value = miembro.sector;
    document.getElementById('fechaIngreso').value = formatearFechaISO(miembro.fecha_ingreso);
    document.getElementById('estadoMembresia').value = miembro.estado_membresia;
    document.getElementById('email').value = miembro.email || '';
    document.getElementById('telefono').value = miembro.telefono || '';
}

async function guardarMiembro(e) {
    e.preventDefault();
    
    const datos = {
        nombre: document.getElementById('nombre').value,
        sector: document.getElementById('sector').value,
        fecha_ingreso: document.getElementById('fechaIngreso').value,
        estado_membresia: document.getElementById('estadoMembresia').value,
        email: document.getElementById('email').value || null,
        telefono: document.getElementById('telefono').value || null
    };

    // Validaciones
    if (datos.email && !validarEmail(datos.email)) {
        mostrarToast('El email no tiene un formato válido', 'error');
        return;
    }

    try {
        mostrarLoading(true);

        if (miembroEditando) {
            const { error } = await supabase
                .from('miembros')
                .update(datos)
                .eq('id', miembroEditando);
            
            if (error) throw error;
            mostrarToast('Miembro actualizado correctamente', 'success');
        } else {
            const { error } = await supabase
                .from('miembros')
                .insert([datos]);
            
            if (error) throw error;
            mostrarToast('Miembro agregado correctamente', 'success');
        }

        cerrarModales();
        await cargarDatos(false); // No actualizar reportes automáticamente
        
    } catch (error) {
        manejarError(error, 'Error al guardar el miembro');
    } finally {
        mostrarLoading(false);
    }
}

async function eliminarMiembro(id) {
    if (!confirm('¿Estás seguro de eliminar este miembro? Esta acción no se puede deshacer.')) return;

    try {
        mostrarLoading(true);
        
        const { error } = await supabase
            .from('miembros')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        mostrarToast('Miembro eliminado correctamente', 'success');
        await cargarDatos(false);
        
    } catch (error) {
        manejarError(error, 'Error al eliminar el miembro');
    } finally {
        mostrarLoading(false);
    }
}

function editarMiembro(id) {
    abrirModalMiembro(id);
}

// Gestión de pagos
function abrirModalPago(id = null) {
    pagoEditando = id;
    const modal = document.getElementById('modalPago');
    const titulo = document.getElementById('modalPagoTitulo');
    const form = document.getElementById('formPago');

    if (id) {
        const pago = pagos.find(p => p.id === id);
        titulo.textContent = 'Editar Pago';
        llenarFormularioPago(pago);
    } else {
        titulo.textContent = 'Registrar Nuevo Pago';
        form.reset();
        document.getElementById('fechaPago').value = new Date().toISOString().split('T')[0];
    }

    modal.style.display = 'block';
}

function llenarFormularioPago(pago) {
    document.getElementById('miembroId').value = pago.miembro_id;
    document.getElementById('fechaPago').value = formatearFechaISO(pago.fecha_pago);
    document.getElementById('monto').value = pago.monto;
    document.getElementById('concepto').value = pago.concepto || '';
}

async function guardarPago(e) {
    e.preventDefault();
    
    const datos = {
        miembro_id: parseInt(document.getElementById('miembroId').value),
        fecha_pago: document.getElementById('fechaPago').value,
        monto: parseFloat(document.getElementById('monto').value),
        concepto: document.getElementById('concepto').value || 'Cuota mensual'
    };

    try {
        mostrarLoading(true);
        
        if (pagoEditando) {
            const { error } = await supabase
                .from('pagos')
                .update(datos)
                .eq('id', pagoEditando);
            
            if (error) throw error;
            mostrarToast('Pago actualizado correctamente', 'success');
        } else {
            const { error } = await supabase
                .from('pagos')
                .insert([datos]);
            
            if (error) throw error;
            mostrarToast('Pago registrado correctamente', 'success');
        }
        
        cerrarModales();
        await cargarDatos(false);
        
    } catch (error) {
        manejarError(error, 'Error al guardar el pago');
    } finally {
        mostrarLoading(false);
    }
}

function editarPago(id) {
    abrirModalPago(id);
}

async function eliminarPago(id) {
    if (!confirm('¿Estás seguro de eliminar este pago?')) return;

    try {
        mostrarLoading(true);
        
        const { error } = await supabase
            .from('pagos')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        mostrarToast('Pago eliminado correctamente', 'success');
        await cargarDatos(false);
        
    } catch (error) {
        manejarError(error, 'Error al eliminar el pago');
    } finally {
        mostrarLoading(false);
    }
}

// Filtros
function aplicarFiltrosMiembros() {
    const sector = document.getElementById('filtroSector').value;
    const estado = document.getElementById('filtroEstado').value;
    const nombre = document.getElementById('buscarNombre').value.toLowerCase();

    const miembrosFiltrados = miembros.filter(miembro => {
        return (!sector || miembro.sector === sector) &&
               (!estado || miembro.estado_membresia === estado) &&
               (!nombre || miembro.nombre.toLowerCase().includes(nombre));
    });

    const tbody = document.querySelector('#tablaMiembros tbody');
    if (miembrosFiltrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-search"></i><h3>No se encontraron resultados</h3><p>Intenta con otros filtros</p></td></tr>';
        return;
    }

    tbody.innerHTML = miembrosFiltrados.map(miembro => `
        <tr>
            <td>${miembro.id}</td>
            <td><strong>${miembro.nombre}</strong></td>
            <td>${miembro.sector}</td>
            <td>${formatearFecha(miembro.fecha_ingreso)}</td>
            <td><span class="status-badge status-${miembro.estado_membresia}">${miembro.estado_membresia}</span></td>
            <td>${miembro.email || '-'}</td>
            <td class="action-buttons">
                <button class="btn btn-small btn-secondary" onclick="editarMiembro(${miembro.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-small btn-danger" onclick="eliminarMiembro(${miembro.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function limpiarFiltrosMiembros() {
    document.getElementById('filtroSector').value = '';
    document.getElementById('filtroEstado').value = '';
    document.getElementById('buscarNombre').value = '';
    renderizarTablaMiembros();
}

function aplicarFiltrosPagos() {
    const miembroId = document.getElementById('filtroMiembro').value;
    const fechaDesde = document.getElementById('fechaDesde').value;
    const fechaHasta = document.getElementById('fechaHasta').value;

    const pagosFiltrados = pagos.filter(pago => {
        return (!miembroId || pago.miembro_id.toString() === miembroId) &&
               (!fechaDesde || pago.fecha_pago >= fechaDesde) &&
               (!fechaHasta || pago.fecha_pago <= fechaHasta);
    });

    const tbody = document.querySelector('#tablaPagos tbody');
    if (pagosFiltrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fas fa-search"></i><h3>No se encontraron pagos</h3><p>Intenta con otros filtros</p></td></tr>';
        return;
    }

    tbody.innerHTML = pagosFiltrados.map(pago => `
        <tr>
            <td>${pago.id}</td>
            <td><strong>${pago.miembros?.nombre || 'N/A'}</strong></td>
            <td>${formatearFecha(pago.fecha_pago)}</td>
            <td>${formatearMoneda(pago.monto)}</td>
            <td>${pago.concepto || 'Cuota mensual'}</td>
            <td class="action-buttons">
                <button class="btn btn-small btn-secondary" onclick="editarPago(${pago.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-small btn-danger" onclick="eliminarPago(${pago.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function limpiarFiltrosPagos() {
    document.getElementById('filtroMiembro').value = '';
    document.getElementById('fechaDesde').value = '';
    document.getElementById('fechaHasta').value = '';
    renderizarTablaPagos();
}

// Reportes y estadísticas
function actualizarReportes() {
    actualizarEstadisticas();
    crearGraficos();
}

function actualizarEstadisticas() {
    const activos = miembros.filter(m => m.estado_membresia === 'activo').length;
    const sectorPredominante = calcularSectorPredominante();
    const ingresosMes = calcularIngresosMes();
    const nuevosMes = calcularNuevosMes();

    document.getElementById('totalActivos').textContent = activos;
    document.getElementById('sectorPredominante').textContent = sectorPredominante;
    document.getElementById('ingresosMes').textContent = formatearMoneda(ingresosMes);
    document.getElementById('nuevosMes').textContent = nuevosMes;
}

function calcularSectorPredominante() {
    const sectores = {};
    miembros.forEach(m => {
        sectores[m.sector] = (sectores[m.sector] || 0) + 1;
    });
    return Object.keys(sectores).reduce((a, b) => sectores[a] > sectores[b] ? a : b, '-');
}

function calcularIngresosMes() {
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth();
    const añoActual = fechaActual.getFullYear();

    return pagos
        .filter(p => {
            const fechaPago = new Date(p.fecha_pago);
            return fechaPago.getMonth() === mesActual && fechaPago.getFullYear() === añoActual;
        })
        .reduce((total, p) => total + parseFloat(p.monto), 0);
}

function calcularNuevosMes() {
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth();
    const añoActual = fechaActual.getFullYear();

    return miembros.filter(m => {
        const fechaIngreso = new Date(m.fecha_ingreso);
        return fechaIngreso.getMonth() === mesActual && fechaIngreso.getFullYear() === añoActual;
    }).length;
}

// Obtener colores según el tema activo
function obtenerColoresGrafico() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    return {
        text: isDarkMode ? '#f1f5f9' : '#1e293b',
        grid: isDarkMode ? '#334155' : '#e2e8f0',
        background: isDarkMode ? 'rgba(139, 95, 191, 0.1)' : 'rgba(39, 174, 96, 0.1)',
        primary: ['#8b5fbf', '#27ae60', '#9d6dd0', '#2ecc71', '#6a4c93', '#1abc9c'],
        success: '#27ae60',
        danger: '#dc2626',
        warning: '#d97706'
    };
}

function crearGraficos() {
    // Destruir gráficos existentes para evitar problemas
    Chart.helpers.each(Chart.instances, (instance) => {
        instance.destroy();
    });
    
    crearGraficoSectores();
    crearGraficoIngresos();
    crearGraficoEstados();
}

function crearGraficoSectores() {
    const ctx = document.getElementById('chartSectores');
    if (!ctx) return;

    const colores = obtenerColoresGrafico();
    const sectores = {};
    miembros.forEach(m => {
        sectores[m.sector] = (sectores[m.sector] || 0) + 1;
    });

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(sectores),
            datasets: [{
                data: Object.values(sectores),
                backgroundColor: colores.primary,
                borderColor: colores.text,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: colores.text,
                        font: {
                            family: 'Inter',
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

function crearGraficoIngresos() {
    const ctx = document.getElementById('incomeChart');
    if (!ctx) return;

    const colores = obtenerColoresGrafico();
    
    // Crear datos de los últimos 6 meses
    const meses = [];
    const ingresos = [];
    
    for (let i = 5; i >= 0; i--) {
        const fecha = new Date();
        fecha.setMonth(fecha.getMonth() - i);
        meses.push(fecha.toLocaleDateString('es-PE', { month: 'short', year: 'numeric' }));
        
        const ingresoMes = pagos
            .filter(p => {
                const fechaPago = new Date(p.fecha_pago);
                return fechaPago.getMonth() === fecha.getMonth() && fechaPago.getFullYear() === fecha.getFullYear();
            })
            .reduce((total, p) => total + parseFloat(p.monto), 0);
        
        ingresos.push(ingresoMes);
    }

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: meses,
            datasets: [{
                label: 'Ingresos (S/.)',
                data: ingresos,
                borderColor: colores.success,
                backgroundColor: colores.background,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: colores.success,
                pointBorderColor: colores.text,
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: colores.text,
                        font: {
                            family: 'Inter',
                            size: 12
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: colores.text,
                        font: {
                            family: 'Inter',
                            size: 11
                        }
                    },
                    grid: {
                        color: colores.grid
                    }
                },
                y: {
                    ticks: {
                        color: colores.text,
                        font: {
                            family: 'Inter',
                            size: 11
                        },
                        callback: function(value) {
                            return 'S/. ' + value.toFixed(0);
                        }
                    },
                    grid: {
                        color: colores.grid
                    }
                }
            }
        }
    });
}

function crearGraficoEstados() {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;

    const colores = obtenerColoresGrafico();
    const estados = {};
    miembros.forEach(m => {
        estados[m.estado_membresia] = (estados[m.estado_membresia] || 0) + 1;
    });

    const coloresBarras = {
        'activo': colores.success,
        'inactivo': '#94a3b8',
        'suspendido': colores.danger
    };

    const backgroundColors = Object.keys(estados).map(estado => coloresBarras[estado] || colores.primary[0]);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(estados).map(estado => 
                estado.charAt(0).toUpperCase() + estado.slice(1)
            ),
            datasets: [{
                data: Object.values(estados),
                backgroundColor: backgroundColors,
                borderColor: colores.text,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    display: false 
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: colores.text,
                        font: {
                            family: 'Inter',
                            size: 11
                        }
                    },
                    grid: {
                        color: colores.grid
                    }
                },
                y: {
                    ticks: {
                        color: colores.text,
                        font: {
                            family: 'Inter',
                            size: 11
                        },
                        stepSize: 1
                    },
                    grid: {
                        color: colores.grid
                    }
                }
            }
        }
    });
}

// Exportación a PDF
function exportarMiembrosPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text('Reporte de Miembros - MemberTrack', 20, 20);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, 20, 30);

    const tableData = miembros.map(m => [
        m.id,
        m.nombre,
        m.sector,
        formatearFecha(m.fecha_ingreso),
        m.estado_membresia,
        m.email || '-'
    ]);

    doc.autoTable({
        head: [['ID', 'Nombre', 'Sector', 'Fecha Ingreso', 'Estado', 'Email']],
        body: tableData,
        startY: 40
    });

    doc.save('reporte-miembros.pdf');
    mostrarToast('Reporte de miembros descargado', 'success');
}

function exportarPagosPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text('Reporte de Pagos - MemberTrack', 20, 20);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, 20, 30);

    const tableData = pagos.map(p => [
        p.id,
        p.miembros?.nombre || 'N/A',
        formatearFecha(p.fecha_pago),
        formatearMoneda(p.monto),
        p.concepto || 'Cuota mensual'
    ]);

    doc.autoTable({
        head: [['ID', 'Miembro', 'Fecha', 'Monto', 'Concepto']],
        body: tableData,
        startY: 40
    });

    doc.save('reporte-pagos.pdf');
    mostrarToast('Reporte de pagos descargado', 'success');
}

// Utilidades
function llenarSelectMiembros() {
    const selects = [document.getElementById('miembroId'), document.getElementById('filtroMiembro')];
    
    selects.forEach(select => {
        if (!select) return;
        
        const opciones = select === document.getElementById('filtroMiembro') 
            ? '<option value="">Todos los miembros</option>'
            : '<option value="">Seleccionar miembro</option>';
        
        select.innerHTML = opciones + miembros.map(m => 
            `<option value="${m.id}">${m.nombre}</option>`
        ).join('');
    });
}

function cerrarModales() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    miembroEditando = null;
    pagoEditando = null;
}

function mostrarLoading(mostrar) {
    const loading = document.getElementById('loading');
    if (mostrar) {
        loading.classList.remove('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

function mostrarToast(mensaje, tipo = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = toast.querySelector('.toast-icon');

    const iconos = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };

    toast.className = `toast ${tipo}`;
    toastIcon.className = `toast-icon ${iconos[tipo]}`;
    toastMessage.textContent = mensaje;

    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

function configurarModoOscuro() {
    const checkbox = document.getElementById('checkbox');
    
    // Cargar preferencia guardada
    const modoOscuro = localStorage.getItem('modoOscuro') === 'true';
    checkbox.checked = modoOscuro;
    if (modoOscuro) {
        document.body.classList.add('dark-mode');
    }
    
    checkbox.addEventListener('change', function() {
        if (this.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('modoOscuro', 'true');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('modoOscuro', 'false');
        }
        
        // Actualizar gráficos con nuevos colores
        if (document.querySelector('.tab-content.active').id === 'reportes') {
            setTimeout(() => crearGraficos(), 100);
        }
    });
}