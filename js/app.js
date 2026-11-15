import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { AlmacenSupabase, AlmacenDemo } from './datos.js';

// ===========================================================================
// Configuración de tipos de registro
// ===========================================================================
const TIPOS = {
  aceite: {
    nombre: 'Cambio de aceite', icono: 'gota', km: true,
    desc: 'Km, próximo cambio, tipo de aceite, filtro',
    campos: [
      { id: 'proximo_km', etiqueta: 'Próximo cambio a los (km)', tipo: 'numero', sugerencias: [3000, 5000, 10000] },
      { id: 'tipo_aceite', etiqueta: 'Tipo de aceite', tipo: 'texto', placeholder: 'Ej: 10W-40 sintético' },
      { id: 'filtro', etiqueta: '¿Se cambió el filtro?', tipo: 'opciones', opciones: ['Sí', 'No'] },
    ],
  },
  llantas: {
    nombre: 'Llantas', icono: 'llanta', km: true,
    desc: 'Km, cuáles se cambiaron, marca y medida',
    campos: [
      { id: 'cuales', etiqueta: '¿Cuáles?', tipo: 'select', opciones: ['Las 4', 'Delanteras', 'Traseras', 'Una', 'Repuesto'] },
      { id: 'marca_medida', etiqueta: 'Marca y medida', tipo: 'texto', placeholder: 'Ej: Bridgestone 185/55 R15' },
    ],
  },
  revision: {
    nombre: 'Revisión técnica', icono: 'check',
    desc: 'Resultado y fecha de vencimiento',
    campos: [
      { id: 'resultado', etiqueta: 'Resultado', tipo: 'opciones', opciones: ['Aprobado', 'Observado', 'Desaprobado'] },
      { id: 'vence', etiqueta: 'Vence el', tipo: 'fecha', requerido: true },
    ],
  },
  soat: {
    nombre: 'SOAT', icono: 'escudo',
    desc: 'Aseguradora y fecha de vencimiento',
    campos: [
      { id: 'aseguradora', etiqueta: 'Aseguradora', tipo: 'texto', placeholder: 'Ej: Rímac, Pacífico, La Positiva' },
      { id: 'vence', etiqueta: 'Vence el', tipo: 'fecha', requerido: true },
    ],
  },
  mantenimiento: {
    nombre: 'Mantenimiento', icono: 'engranaje',
    desc: 'Qué incluyó el servicio',
    campos: [
      { id: 'incluye', etiqueta: '¿Qué incluyó?', tipo: 'textarea', placeholder: 'Ej: Afinamiento, cambio de bujías, revisión de frenos' },
    ],
  },
  reparacion: {
    nombre: 'Reparación', icono: 'llave',
    desc: 'Qué se reparó',
    campos: [
      { id: 'que', etiqueta: '¿Qué se reparó?', tipo: 'texto', requerido: true, placeholder: 'Ej: Pastillas de freno delanteras' },
    ],
  },
  otros: {
    nombre: 'Otros', icono: 'puntos', gris: true,
    desc: 'Título libre para cualquier otra cosa',
    campos: [
      { id: 'titulo', etiqueta: '¿Qué fue?', tipo: 'texto', requerido: true, placeholder: 'Ej: Cambio de plumillas' },
    ],
  },
};

const NOMBRES_BASE = ['Elvis', 'Hermano', 'Mamá'];

// ===========================================================================
// Íconos (trazo, sin emoji)
// ===========================================================================
const P = {
  gota: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  llanta: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/>',
  check: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 13l2 2 4-4"/>',
  escudo: '<path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z"/>',
  engranaje: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  llave: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-2.4z"/>',
  puntos: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  mas: '<path d="M12 5v14M5 12h14"/>',
  atras: '<path d="M15 6l-6 6 6 6"/>',
  camara: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  imagen: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M21 16l-5-5-8 8"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  usuario: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  descargar: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  compartir: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>',
  recargar: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
};
const icono = (n, t = 20, g = 2) =>
  `<svg width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${g}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;
const icoTipo = (tipo, grande = false) => {
  const t = TIPOS[tipo] || TIPOS.otros;
  return `<span class="ico${grande ? ' grande' : ''}${t.gris ? ' gris' : ''}">${icono(t.icono, grande ? 22 : 20)}</span>`;
};

// ===========================================================================
// Utilidades
// ===========================================================================
const $app = document.getElementById('app');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtNum = (n) => Number(n).toLocaleString('en-US');
const fmtKm = (n) => `${fmtNum(n)} km`;
const fmtSoles = (n) => {
  if (n === null || n === undefined || n === '' || isNaN(n)) return '';
  const v = Number(n);
  return 'S/ ' + v.toLocaleString('en-US', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 });
};
const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const aFecha = (iso) => { const [a, m, d] = iso.split('-').map(Number); return new Date(a, m - 1, d); };
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MESES_C = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const fechaCorta = (iso) => { const f = aFecha(iso); const s = `${f.getDate()} ${MESES_C[f.getMonth()]}`; return f.getFullYear() === new Date().getFullYear() ? s : `${s} ${f.getFullYear()}`; };
const fechaMedia = (iso) => { const f = aFecha(iso); return `${f.getDate()} ${MESES_C[f.getMonth()]} ${f.getFullYear()}`; };
const fechaLarga = (iso) => { const f = aFecha(iso); const s = `${DIAS[f.getDay()]} ${f.getDate()} de ${MESES[f.getMonth()]} de ${f.getFullYear()}`; return s[0].toUpperCase() + s.slice(1); };
const mesAnio = (iso) => { const f = aFecha(iso); return `${MESES[f.getMonth()][0].toUpperCase() + MESES[f.getMonth()].slice(1)} ${f.getFullYear()}`; };
const diasHasta = (iso) => Math.round((aFecha(iso) - aFecha(hoyISO())) / 86400000);
const soloDigitos = (s) => { const d = String(s ?? '').replace(/[^\d]/g, ''); return d ? parseInt(d, 10) : null; };
const aNumero = (s) => { const t = String(s ?? '').trim().replace(/\s/g, '').replace(',', '.'); if (!t) return null; const n = Number(t); return isNaN(n) ? NaN : Math.round(n * 100) / 100; };

let temporizadorToast;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(temporizadorToast);
  temporizadorToast = setTimeout(() => { t.hidden = true; }, 2600);
}

// ===========================================================================
// Estado
// ===========================================================================
const MODO_DEMO = !SUPABASE_URL || !SUPABASE_ANON_KEY;
const estado = {
  almacen: null,
  registros: [],
  urls: new Map(),
  usuario: localStorage.getItem('rojito-usuario') || '',
  clave: '',
  form: null,
};

function leerClaveDeTexto(texto) {
  const m = String(texto || '').match(/[#&?]k=([A-Za-z0-9_-]{12,})/);
  if (m) return m[1];
  const solo = String(texto || '').trim();
  return /^[A-Za-z0-9_-]{12,}$/.test(solo) ? solo : '';
}

function linkFamiliar() {
  return `${location.origin}${location.pathname}#k=${estado.clave}`;
}

// ===========================================================================
// Cálculos
// ===========================================================================
const titulo = (r) => {
  const d = r.datos || {};
  switch (r.tipo) {
    case 'aceite': return r.lugar || 'Cambio de aceite';
    case 'llantas': return [d.cuales, r.lugar].filter(Boolean).join(' · ') || 'Llantas';
    case 'revision': return r.lugar || (d.resultado ? `Revisión: ${d.resultado.toLowerCase()}` : 'Revisión técnica');
    case 'soat': return d.aseguradora || r.lugar || 'SOAT';
    case 'mantenimiento': return r.lugar || 'Mantenimiento';
    case 'reparacion': return d.que || 'Reparación';
    default: return d.titulo || 'Otros';
  }
};

function subtitulo(r) {
  const partes = [fechaCorta(r.fecha)];
  if (r.km) partes.push(fmtKm(r.km));
  else if (r.lugar && titulo(r) !== r.lugar) partes.push(r.lugar);
  if (r.autor) partes.push('por ' + r.autor);
  return partes.join(' · ');
}

const ultimoKm = () => estado.registros.reduce((max, r) => (r.km && r.km > max ? r.km : max), 0);
const ultimoDe = (tipo, cond = () => true) => estado.registros.find((r) => r.tipo === tipo && cond(r));

function proximos() {
  const lista = [];
  const km = ultimoKm();
  const aceite = ultimoDe('aceite', (r) => r.datos?.proximo_km);
  if (aceite) {
    const prox = Number(aceite.datos.proximo_km);
    const faltan = prox - km;
    let chip;
    if (faltan <= 0) chip = { c: 'vencido', t: faltan === 0 ? 'ya toca' : `pasado por ${fmtNum(-faltan)} km` };
    else chip = { c: faltan <= 1000 ? 'pronto' : 'ok', t: `faltan ${fmtNum(faltan)} km` };
    lista.push({ tipo: 'aceite', nombre: 'Cambio de aceite', texto: `A los ${fmtKm(prox)}`, chip, id: aceite.id });
  }
  for (const tipo of ['soat', 'revision']) {
    const r = ultimoDe(tipo, (x) => x.datos?.vence);
    if (!r) continue;
    const dias = diasHasta(r.datos.vence);
    let chip;
    if (dias < 0) chip = { c: 'vencido', t: 'vencido' };
    else if (dias === 0) chip = { c: 'vencido', t: 'vence hoy' };
    else chip = { c: dias <= 30 ? 'pronto' : 'ok', t: dias === 1 ? 'mañana' : `en ${dias} días` };
    lista.push({ tipo, nombre: TIPOS[tipo].nombre, texto: `${dias < 0 ? 'Venció' : 'Vence'} el ${fechaMedia(r.datos.vence)}`, chip, id: r.id });
  }
  return lista;
}

// ===========================================================================
// Navegación (con botón "atrás" del celular)
// ===========================================================================
function ir(vista, params = {}, { reemplazar = false } = {}) {
  const prof = reemplazar ? (history.state?.prof || 0) : (history.state?.prof || 0) + 1;
  const st = { vista, params, prof };
  if (reemplazar) history.replaceState(st, '');
  else history.pushState(st, '');
  pintar(st);
}

function atras() {
  if ((history.state?.prof || 0) > 0) history.back();
  else ir('inicio', {}, { reemplazar: true });
}

function volverAlInicio() {
  const prof = history.state?.prof || 0;
  if (prof > 0) history.go(-prof);
  else ir('inicio', {}, { reemplazar: true });
}

window.addEventListener('popstate', (e) => pintar(e.state || { vista: 'inicio', params: {}, prof: 0 }));

function pintar(st) {
  cerrarHoja();
  const v = st?.vista || 'inicio';
  if (!estado.usuario && v !== 'bienvenida') return vistaBienvenida();
  window.scrollTo(0, 0);
  if (v === 'bienvenida') return vistaBienvenida();
  if (v === 'tipos') return vistaTipos();
  if (v === 'form') return vistaFormulario(st.params);
  if (v === 'detalle') return vistaDetalle(st.params);
  return vistaInicio();
}

const pintarActual = () => pintar(history.state || { vista: 'inicio', params: {}, prof: 0 });

// ===========================================================================
// Vistas
// ===========================================================================
function vistaInicio() {
  const km = ultimoKm();
  const prox = proximos();
  const grupos = [];
  for (const r of estado.registros) {
    const mes = mesAnio(r.fecha);
    const g = grupos[grupos.length - 1];
    if (g && g.mes === mes) g.items.push(r);
    else grupos.push({ mes, items: [r] });
  }

  $app.innerHTML = `
    <header class="cabecera">
      <div class="marca">
        <img src="img/logo.svg" alt="" width="52" height="52">
        <div>
          <h1>Rojito</h1>
          <p>${km ? `Último km registrado: <strong>${fmtKm(km)}</strong>` : 'El historial del carro de la familia'}</p>
        </div>
      </div>
      <button class="avatar" data-accion="menu" aria-label="Menú de ${esc(estado.usuario)}">${esc(estado.usuario.slice(0, 1).toUpperCase())}</button>
    </header>
    ${MODO_DEMO ? '<p class="aviso demo">Modo demo: lo que registres se guarda solo en este celular hasta conectar la base de datos.</p>' : ''}
    ${prox.length ? `
      <section class="proximos" aria-labelledby="t-prox">
        <h2 class="seccion-titulo" id="t-prox">Próximos</h2>
        ${prox.map((p) => `
          <div class="prox-fila">
            ${icoTipo(p.tipo)}
            <div class="prox-texto"><b>${esc(p.nombre)}</b><span>${esc(p.texto)}</span></div>
            <span class="chip ${p.chip.c}">${esc(p.chip.t)}</span>
          </div>`).join('')}
      </section>` : ''}
    ${estado.registros.length ? grupos.map((g) => `
      <h2 class="seccion-titulo mes">${esc(g.mes)}</h2>
      <div class="lista">
        ${g.items.map((r) => `
          <button class="registro" data-accion="ver" data-id="${esc(r.id)}">
            <span class="miniatura" data-foto="${esc(r.fotos?.[0] || '')}">${icono(TIPOS[r.tipo]?.icono || 'puntos', 24)}</span>
            <span class="registro-texto">
              <span class="registro-tipo">${esc(TIPOS[r.tipo]?.nombre || 'Otros')}</span>
              <span class="registro-titulo">${esc(titulo(r))}</span>
              <span class="registro-sub">${esc(subtitulo(r))}</span>
            </span>
            ${r.costo !== null && r.costo !== undefined && r.costo !== '' ? `<span class="monto">${esc(fmtSoles(r.costo))}</span>` : ''}
          </button>`).join('')}
      </div>`).join('') : `
      <div class="vacio">
        <img src="img/logo.svg" alt="">
        <p>Todavía no hay registros.<br>Toca <b>Nuevo registro</b> para agregar el primero.</p>
      </div>`}
    <div class="espacio-fab"></div>
    <button class="fab" data-accion="nuevo">${icono('mas', 22, 2.5)}Nuevo registro</button>
  `;
  cargarMiniaturas();
}

async function cargarMiniaturas() {
  const cajas = [...$app.querySelectorAll('[data-foto]')].filter((c) => c.dataset.foto);
  if (!cajas.length) return;
  const urls = await estado.almacen.urlsFotos(cajas.map((c) => c.dataset.foto)).catch(() => new Map());
  cajas.forEach((c) => {
    const u = urls.get(c.dataset.foto);
    if (u) c.innerHTML = `<img src="${esc(u)}" alt="" loading="lazy">`;
  });
}

function vistaTipos() {
  $app.innerHTML = `
    <header class="barra">
      <button class="icono-btn" data-accion="atras" aria-label="Volver">${icono('atras', 24)}</button>
      <h1>Nuevo registro</h1>
    </header>
    <p class="subtitulo">¿Qué le hiciste a Rojito?</p>
    <div class="tipos">
      ${Object.entries(TIPOS).map(([id, t]) => `
        <button class="tipo" data-accion="elegir-tipo" data-tipo="${id}">
          ${icoTipo(id, true)}
          <b>${esc(t.nombre)}</b>
          <span class="desc">${esc(t.desc)}</span>
        </button>`).join('')}
    </div>
  `;
}

function campoHTML(c, valor) {
  const id = 'c-' + c.id;
  const req = c.requerido ? ' required' : '';
  if (c.tipo === 'opciones') {
    return `<div class="campo">
      <span class="etiqueta" id="${id}-e">${esc(c.etiqueta)}</span>
      <div class="segmentado" role="group" aria-labelledby="${id}-e" data-segmentado="${c.id}">
        ${c.opciones.map((o) => `<button type="button" data-valor="${esc(o)}" class="${valor === o ? 'activo' : ''}" aria-pressed="${valor === o}">${esc(o)}</button>`).join('')}
      </div>
      <input type="hidden" name="${c.id}" value="${esc(valor || '')}">
    </div>`;
  }
  if (c.tipo === 'select') {
    return `<div class="campo"><label for="${id}">${esc(c.etiqueta)}</label>
      <select id="${id}" name="${c.id}"${req}>
        <option value="">Elegir…</option>
        ${c.opciones.map((o) => `<option${valor === o ? ' selected' : ''}>${esc(o)}</option>`).join('')}
      </select></div>`;
  }
  if (c.tipo === 'textarea') {
    return `<div class="campo"><label for="${id}">${esc(c.etiqueta)}</label>
      <textarea id="${id}" name="${c.id}" rows="3" placeholder="${esc(c.placeholder || '')}"${req}>${esc(valor || '')}</textarea></div>`;
  }
  if (c.tipo === 'fecha') {
    return `<div class="campo"><label for="${id}">${esc(c.etiqueta)}</label>
      <input id="${id}" name="${c.id}" type="date" value="${esc(valor || '')}"${req}></div>`;
  }
  if (c.tipo === 'numero') {
    return `<div class="campo"><label for="${id}">${esc(c.etiqueta)}</label>
      <input id="${id}" name="${c.id}" type="text" inputmode="numeric" autocomplete="off" value="${valor ? esc(fmtNum(valor)) : ''}"${req}>
      ${c.sugerencias ? `<div class="pastillas">${c.sugerencias.map((s) => `<button type="button" class="pastilla" data-accion="sumar-km" data-destino="${c.id}" data-suma="${s}">+${fmtNum(s)}</button>`).join('')}</div>` : ''}
    </div>`;
  }
  return `<div class="campo"><label for="${id}">${esc(c.etiqueta)}</label>
    <input id="${id}" name="${c.id}" type="text" placeholder="${esc(c.placeholder || '')}" value="${esc(valor || '')}"${req}></div>`;
}

function vistaFormulario({ tipo, id }) {
  const existente = id ? estado.registros.find((r) => r.id === id) : null;
  if (id && !existente) return volverAlInicio();
  tipo = existente?.tipo || tipo;
  const t = TIPOS[tipo];
  if (!t) return volverAlInicio();
  const r = existente || { tipo, fecha: hoyISO(), datos: {}, fotos: [] };
  const d = r.datos || {};
  estado.form = { tipo, existente, nuevas: [], quitadas: [] };
  const lugares = [...new Set(estado.registros.map((x) => x.lugar).filter(Boolean))];

  $app.innerHTML = `
    <header class="barra">
      <button class="icono-btn" data-accion="atras" aria-label="Volver">${icono('atras', 24)}</button>
      ${icoTipo(tipo)}
      <h1>${existente ? 'Editar' : esc(t.nombre)}</h1>
    </header>
    <form class="formulario" id="formulario" novalidate>
      <section class="caja">
        <h2 class="acento">${esc(t.nombre)}</h2>
        ${t.km ? `<div class="campo"><label for="c-km">Kilometraje actual</label>
          <input id="c-km" name="km" type="text" inputmode="numeric" autocomplete="off" required value="${r.km ? esc(fmtNum(r.km)) : ''}" placeholder="${ultimoKm() ? 'Último: ' + esc(fmtNum(ultimoKm())) : 'Ej: 48,250'}"></div>` : ''}
        ${t.campos.map((c) => campoHTML(c, d[c.id])).join('')}
      </section>
      <section class="caja">
        <h2>Datos generales</h2>
        <div class="dos-col">
          <div class="campo"><label for="c-fecha">Fecha</label>
            <input id="c-fecha" name="fecha" type="date" required value="${esc(r.fecha)}" max="${hoyISO()}"></div>
          <div class="campo"><label for="c-costo">Costo (S/)</label>
            <input id="c-costo" name="costo" type="text" inputmode="decimal" autocomplete="off" placeholder="0.00" value="${r.costo !== null && r.costo !== undefined ? esc(r.costo) : ''}"></div>
        </div>
        <div class="campo"><label for="c-lugar">Lugar</label>
          <input id="c-lugar" name="lugar" type="text" list="lugares" autocomplete="off" placeholder="¿Dónde lo hiciste?" value="${esc(r.lugar || '')}">
          <datalist id="lugares">${lugares.map((l) => `<option value="${esc(l)}">`).join('')}</datalist>
        </div>
        <div class="campo"><label for="c-com">Comentarios</label>
          <textarea id="c-com" name="comentarios" rows="3" placeholder="Algo que quieras recordar">${esc(r.comentarios || '')}</textarea></div>
      </section>
      <section class="caja">
        <h2>Fotos</h2>
        <div class="fotos-botones">
          <button type="button" class="boton-borde" data-accion="camara">${icono('camara')}Tomar foto</button>
          <button type="button" class="boton-borde" data-accion="galeria">${icono('imagen')}Galería</button>
        </div>
        <input type="file" id="in-camara" accept="image/*" capture="environment" hidden>
        <input type="file" id="in-galeria" accept="image/*" multiple hidden>
        <div class="fotos-lista" id="fotos-lista"></div>
        <span class="ayuda" style="font-size:12px;color:var(--gris)">Por ejemplo: la boleta o el sticker del próximo cambio</span>
      </section>
    </form>
    <div class="pie-fijo"><div><button class="boton" type="submit" form="formulario" id="btn-guardar">${existente ? 'Guardar cambios' : 'Guardar registro'}</button></div></div>
  `;

  const form = document.getElementById('formulario');
  form.addEventListener('submit', guardarFormulario);
  form.querySelectorAll('input[inputmode="numeric"]').forEach((inp) => {
    inp.addEventListener('input', () => {
      const n = soloDigitos(inp.value);
      inp.value = n === null ? '' : fmtNum(n);
    });
  });
  document.getElementById('in-camara').addEventListener('change', agregarFotos);
  document.getElementById('in-galeria').addEventListener('change', agregarFotos);
  pintarFotosForm();
}

async function pintarFotosForm() {
  const f = estado.form;
  const caja = document.getElementById('fotos-lista');
  if (!f || !caja) return;
  const existentes = (f.existente?.fotos || []).filter((p) => !f.quitadas.includes(p));
  const urls = existentes.length ? await estado.almacen.urlsFotos(existentes).catch(() => new Map()) : new Map();
  caja.innerHTML = [
    ...existentes.map((p) => `<div class="foto-mini">${urls.get(p) ? `<img src="${esc(urls.get(p))}" alt="Foto guardada">` : ''}
      <button type="button" class="foto-quitar" data-accion="quitar-foto" data-ruta="${esc(p)}" aria-label="Quitar foto">${icono('x', 14, 3)}</button></div>`),
    ...f.nuevas.map((n, i) => `<div class="foto-mini"><img src="${esc(n.url)}" alt="Foto nueva">
      <button type="button" class="foto-quitar" data-accion="quitar-nueva" data-i="${i}" aria-label="Quitar foto">${icono('x', 14, 3)}</button></div>`),
  ].join('');
}

async function comprimir(archivo, lado = MODO_DEMO ? 900 : 1600, calidad = MODO_DEMO ? 0.7 : 0.8) {
  let fuente;
  try {
    fuente = await createImageBitmap(archivo, { imageOrientation: 'from-image' });
  } catch {
    fuente = await new Promise((ok, mal) => {
      const img = new Image();
      img.onload = () => ok(img);
      img.onerror = mal;
      img.src = URL.createObjectURL(archivo);
    });
  }
  const w = fuente.width, h = fuente.height;
  const escala = Math.min(1, lado / Math.max(w, h));
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(w * escala);
  lienzo.height = Math.round(h * escala);
  lienzo.getContext('2d').drawImage(fuente, 0, 0, lienzo.width, lienzo.height);
  return await new Promise((ok) => lienzo.toBlob(ok, 'image/jpeg', calidad));
}

async function agregarFotos(e) {
  const archivos = [...(e.target.files || [])];
  e.target.value = '';
  for (const a of archivos) {
    try {
      const blob = await comprimir(a);
      if (blob && estado.form) estado.form.nuevas.push({ blob, url: URL.createObjectURL(blob) });
    } catch {
      toast('No se pudo leer una de las fotos');
    }
  }
  pintarFotosForm();
}

async function guardarFormulario(e) {
  e.preventDefault();
  const f = estado.form;
  const t = TIPOS[f.tipo];
  const fd = new FormData(e.target);
  const datos = {};
  for (const c of t.campos) {
    let v = fd.get(c.id);
    if (c.tipo === 'numero') v = soloDigitos(v);
    else v = (v || '').toString().trim();
    if (v !== '' && v !== null) datos[c.id] = v;
  }
  const km = t.km ? soloDigitos(fd.get('km')) : null;
  const costo = aNumero(fd.get('costo'));
  const fecha = fd.get('fecha');

  const faltantes = [];
  if (!fecha) faltantes.push('la fecha');
  if (t.km && !km) faltantes.push('el kilometraje');
  t.campos.filter((c) => c.requerido && !datos[c.id]).forEach((c) => faltantes.push(c.etiqueta.replace(/[¿?]/g, '').toLowerCase()));
  if (faltantes.length) return toast('Falta completar ' + faltantes.join(', '));
  if (Number.isNaN(costo)) return toast('El costo no es un número válido');
  if (f.tipo === 'aceite' && datos.proximo_km && km && datos.proximo_km <= km) return toast('El próximo cambio debe ser mayor al km actual');

  const registro = {
    ...(f.existente ? { id: f.existente.id, fotos: f.existente.fotos || [], autor: f.existente.autor } : { autor: estado.usuario, fotos: [] }),
    tipo: f.tipo,
    fecha,
    costo,
    lugar: (fd.get('lugar') || '').toString().trim() || null,
    comentarios: (fd.get('comentarios') || '').toString().trim() || null,
    km,
    datos,
  };

  const btn = document.getElementById('btn-guardar');
  btn.disabled = true;
  btn.textContent = f.nuevas.length ? 'Subiendo fotos…' : 'Guardando…';
  try {
    await estado.almacen.guardar(registro, f.nuevas.map((n) => n.blob), f.quitadas);
    f.nuevas.forEach((n) => URL.revokeObjectURL(n.url));
    estado.form = null;
    await recargar();
    estado.almacen.avisarCambio();
    toast(f.existente ? 'Cambios guardados' : 'Registro guardado');
    if (f.existente) atras(); else volverAlInicio();
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    btn.textContent = f.existente ? 'Guardar cambios' : 'Guardar registro';
    toast(err?.message?.includes('demo') ? err.message : 'No se pudo guardar. Revisa tu internet e intenta otra vez.');
  }
}

async function vistaDetalle({ id }) {
  const r = estado.registros.find((x) => x.id === id);
  if (!r) return volverAlInicio();
  const t = TIPOS[r.tipo] || TIPOS.otros;
  const d = r.datos || {};

  const tarjetas = [];
  if (r.costo !== null && r.costo !== undefined) tarjetas.push(['Costo', fmtSoles(r.costo)]);
  if (r.km) tarjetas.push(['Kilometraje', fmtKm(r.km)]);
  if (r.tipo === 'aceite') {
    if (d.proximo_km) tarjetas.push(['Próximo cambio', fmtKm(d.proximo_km)]);
    if (d.filtro) tarjetas.push(['Filtro', d.filtro]);
  }
  if (r.tipo === 'revision' && d.resultado) tarjetas.push(['Resultado', d.resultado]);
  if ((r.tipo === 'revision' || r.tipo === 'soat') && d.vence) tarjetas.push(['Vence', fechaMedia(d.vence)]);
  if (r.tipo === 'llantas' && d.cuales) tarjetas.push(['Cuáles', d.cuales]);

  const filas = [];
  if (r.lugar && titulo(r) !== r.lugar) filas.push(['Lugar', r.lugar]);
  if (d.tipo_aceite) filas.push(['Tipo de aceite', d.tipo_aceite]);
  if (d.marca_medida) filas.push(['Marca y medida', d.marca_medida]);
  if (r.tipo === 'soat' && d.aseguradora && titulo(r) !== d.aseguradora) filas.push(['Aseguradora', d.aseguradora]);
  if (d.incluye) filas.push(['Qué incluyó', d.incluye]);
  if (r.comentarios) filas.push(['Comentarios', r.comentarios]);

  const fotos = r.fotos || [];
  const creado = r.creado ? new Date(r.creado) : null;

  $app.innerHTML = `
    <div class="galeria">
      ${fotos.length ? `<div class="galeria-pista" id="pista">${fotos.map(() => '<img alt="" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=">').join('')}</div>
        ${fotos.length > 1 ? `<span class="contador" id="contador">1 / ${fotos.length}</span>` : ''}`
        : `<div class="galeria-vacia">${icono(t.icono, 64, 1.5)}</div>`}
      <button class="icono-btn volver-flotante" data-accion="atras" aria-label="Volver">${icono('atras', 22)}</button>
    </div>
    <div class="detalle">
      <div>
        <span class="registro-tipo">${esc(t.nombre)}</span>
        <h1>${esc(titulo(r))}</h1>
        <span class="fecha">${esc(fechaLarga(r.fecha))}</span>
      </div>
      ${tarjetas.length ? `<div class="datos-grid">${tarjetas.map(([k, v]) => `<div class="dato"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>` : ''}
      ${filas.length ? `<dl class="lista-datos">${filas.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
      <p class="autor">Registrado por <strong>${esc(r.autor || '—')}</strong>${creado ? ` · ${creado.getDate()} ${MESES_C[creado.getMonth()]} ${creado.getFullYear()}, ${String(creado.getHours()).padStart(2, '0')}:${String(creado.getMinutes()).padStart(2, '0')}` : ''}</p>
      <div class="dos-col">
        <button class="boton-borde" data-accion="editar" data-id="${esc(r.id)}">Editar</button>
        <button class="boton-borde peligro" data-accion="eliminar" data-id="${esc(r.id)}">Eliminar</button>
      </div>
    </div>
  `;

  if (fotos.length) {
    const urls = await estado.almacen.urlsFotos(fotos).catch(() => new Map());
    const imgs = $app.querySelectorAll('#pista img');
    fotos.forEach((p, i) => { if (urls.get(p) && imgs[i]) imgs[i].src = urls.get(p); });
    const pista = document.getElementById('pista');
    const contador = document.getElementById('contador');
    if (pista && contador) {
      pista.addEventListener('scroll', () => {
        contador.textContent = `${Math.round(pista.scrollLeft / pista.clientWidth) + 1} / ${fotos.length}`;
      }, { passive: true });
    }
  }
}

function vistaBienvenida() {
  const nombres = [...new Set([...NOMBRES_BASE, ...estado.registros.map((r) => r.autor).filter(Boolean), estado.usuario].filter(Boolean))];
  let elegido = estado.usuario;

  $app.innerHTML = `
    <div class="bienvenida">
      <div class="logo-grande">
        <img src="img/logo.svg" alt="Rojito">
        <h1>Rojito</h1>
        <p>El historial del carro de la familia</p>
      </div>
      <div class="campo">
        <span class="etiqueta" style="font-size:15px">¿Quién eres?</span>
        <span class="ayuda" style="font-size:13px">Solo se pregunta una vez en este celular</span>
        <div class="nombres" id="nombres">
          ${nombres.map((n) => `<button type="button" class="nombre${n === elegido ? ' activo' : ''}" data-nombre="${esc(n)}">${esc(n)}</button>`).join('')}
          <button type="button" class="nombre otro" id="otro-nombre">+ Otro nombre</button>
        </div>
        <div class="campo" id="caja-otro" hidden>
          <label for="in-otro">Tu nombre</label>
          <input id="in-otro" type="text" maxlength="24" autocomplete="given-name" placeholder="Ej: Papá">
        </div>
      </div>
      <div class="crece"></div>
      <button class="boton" id="entrar" ${elegido ? '' : 'disabled'}>Entrar</button>
    </div>
  `;
  const btn = document.getElementById('entrar');
  const inOtro = document.getElementById('in-otro');
  const marcar = (n) => {
    elegido = n;
    $app.querySelectorAll('[data-nombre]').forEach((b) => b.classList.toggle('activo', b.dataset.nombre === n));
    btn.disabled = !elegido;
  };
  $app.querySelectorAll('[data-nombre]').forEach((b) => b.addEventListener('click', () => {
    document.getElementById('caja-otro').hidden = true;
    marcar(b.dataset.nombre);
  }));
  document.getElementById('otro-nombre').addEventListener('click', () => {
    document.getElementById('caja-otro').hidden = false;
    marcar(inOtro.value.trim());
    inOtro.focus();
  });
  inOtro.addEventListener('input', () => marcar(inOtro.value.trim()));
  btn.addEventListener('click', () => {
    if (!elegido) return;
    estado.usuario = elegido.slice(0, 24);
    localStorage.setItem('rojito-usuario', estado.usuario);
    if ((history.state?.prof || 0) > 0) history.back();
    else ir('inicio', {}, { reemplazar: true });
  });
}

function vistaSinClave(mensaje) {
  $app.innerHTML = `
    <div class="bienvenida">
      <div class="logo-grande">
        <img src="img/logo.svg" alt="Rojito">
        <h1>Rojito</h1>
      </div>
      <div class="aviso">${mensaje}</div>
      <div class="campo">
        <label for="in-link">Pega aquí el link familiar</label>
        <input id="in-link" type="url" autocomplete="off" placeholder="https://…#k=…">
      </div>
      <div class="crece"></div>
      <button class="boton" id="usar-link">Entrar</button>
    </div>
  `;
  document.getElementById('usar-link').addEventListener('click', () => {
    const k = leerClaveDeTexto(document.getElementById('in-link').value);
    if (!k) return toast('Ese link no tiene la clave familiar');
    localStorage.setItem('rojito-clave', k);
    location.hash = 'k=' + k;
    location.reload();
  });
}

// ===========================================================================
// Hoja inferior (menú y confirmaciones)
// ===========================================================================
function abrirHoja(html) {
  cerrarHoja();
  const velo = document.createElement('div');
  velo.className = 'velo';
  velo.id = 'velo';
  velo.innerHTML = `<div class="hoja" role="dialog" aria-modal="true">${html}</div>`;
  velo.addEventListener('click', (e) => { if (e.target === velo) cerrarHoja(); });
  document.body.appendChild(velo);
  return velo;
}
function cerrarHoja() { document.getElementById('velo')?.remove(); }

function abrirMenu() {
  const v = abrirHoja(`
    <h2>Hola, ${esc(estado.usuario)}</h2>
    <button class="opcion" data-m="nombre">${icono('usuario')}Cambiar de nombre</button>
    ${MODO_DEMO ? '' : `<button class="opcion" data-m="compartir">${icono('compartir')}Compartir link familiar</button>`}
    <button class="opcion" data-m="copia">${icono('descargar')}Descargar copia (Excel)</button>
    <button class="opcion" data-m="recargar">${icono('recargar')}Actualizar</button>
  `);
  v.querySelector('[data-m="nombre"]').addEventListener('click', () => { cerrarHoja(); ir('bienvenida'); });
  v.querySelector('[data-m="copia"]').addEventListener('click', () => { cerrarHoja(); descargarCopia(); });
  v.querySelector('[data-m="recargar"]').addEventListener('click', async () => { cerrarHoja(); await recargar(); pintarActual(); toast('Actualizado'); });
  v.querySelector('[data-m="compartir"]')?.addEventListener('click', async () => {
    cerrarHoja();
    const url = linkFamiliar();
    try {
      if (navigator.share) await navigator.share({ title: 'Rojito', text: 'Link de Rojito, el historial del carro:', url });
      else { await navigator.clipboard.writeText(url); toast('Link copiado'); }
    } catch { /* cancelado */ }
  });
}

function confirmarEliminar(id) {
  const r = estado.registros.find((x) => x.id === id);
  if (!r) return;
  const v = abrirHoja(`
    <h2>¿Eliminar este registro?</h2>
    <p>${esc(TIPOS[r.tipo]?.nombre || 'Registro')} del ${esc(fechaMedia(r.fecha))}. También se borrarán sus fotos. No se puede deshacer.</p>
    <div class="acciones">
      <button class="boton-borde" data-c="no">Cancelar</button>
      <button class="boton" data-c="si">Eliminar</button>
    </div>
  `);
  v.querySelector('[data-c="no"]').addEventListener('click', cerrarHoja);
  v.querySelector('[data-c="si"]').addEventListener('click', async (e) => {
    e.currentTarget.disabled = true;
    try {
      await estado.almacen.eliminar(r);
      cerrarHoja();
      await recargar();
      estado.almacen.avisarCambio();
      toast('Registro eliminado');
      volverAlInicio();
    } catch (err) {
      console.error(err);
      cerrarHoja();
      toast('No se pudo eliminar. Revisa tu internet.');
    }
  });
}

function descargarCopia() {
  const celda = (v) => {
    const s = String(v ?? '');
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const filas = [['Fecha', 'Tipo', 'Detalle', 'Lugar', 'Costo (S/)', 'Km', 'Datos extra', 'Comentarios', 'Registrado por', 'Fotos']];
  for (const r of estado.registros) {
    const extra = Object.entries(r.datos || {}).map(([k, v]) => `${k}: ${v}`).join(' | ');
    filas.push([r.fecha, TIPOS[r.tipo]?.nombre || r.tipo, titulo(r), r.lugar || '', r.costo ?? '', r.km ?? '', extra, r.comentarios || '', r.autor || '', (r.fotos || []).length]);
  }
  const csv = '﻿' + filas.map((f) => f.map(celda).join(';')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `rojito-${hoyISO()}.csv`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

// ===========================================================================
// Clicks (delegados)
// ===========================================================================
$app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-accion], [data-segmentado] button');
  if (!el) return;
  if (el.parentElement?.dataset.segmentado) {
    const grupo = el.parentElement;
    const input = grupo.parentElement.querySelector(`input[name="${grupo.dataset.segmentado}"]`);
    const yaActivo = el.classList.contains('activo');
    grupo.querySelectorAll('button').forEach((b) => { b.classList.remove('activo'); b.setAttribute('aria-pressed', 'false'); });
    if (!yaActivo) { el.classList.add('activo'); el.setAttribute('aria-pressed', 'true'); }
    input.value = yaActivo ? '' : el.dataset.valor;
    return;
  }
  const acc = el.dataset.accion;
  if (acc === 'nuevo') ir('tipos');
  else if (acc === 'atras') atras();
  else if (acc === 'menu') abrirMenu();
  else if (acc === 'elegir-tipo') ir('form', { tipo: el.dataset.tipo }, { reemplazar: true });
  else if (acc === 'ver') ir('detalle', { id: el.dataset.id });
  else if (acc === 'editar') ir('form', { id: el.dataset.id });
  else if (acc === 'eliminar') confirmarEliminar(el.dataset.id);
  else if (acc === 'camara') document.getElementById('in-camara').click();
  else if (acc === 'galeria') document.getElementById('in-galeria').click();
  else if (acc === 'quitar-foto') { estado.form.quitadas.push(el.dataset.ruta); pintarFotosForm(); }
  else if (acc === 'quitar-nueva') {
    const [n] = estado.form.nuevas.splice(Number(el.dataset.i), 1);
    if (n) URL.revokeObjectURL(n.url);
    pintarFotosForm();
  } else if (acc === 'sumar-km') {
    const base = soloDigitos(document.getElementById('c-km')?.value) || ultimoKm();
    if (!base) return toast('Primero escribe el kilometraje actual');
    document.getElementById('c-' + el.dataset.destino).value = fmtNum(base + Number(el.dataset.suma));
    $app.querySelectorAll(`[data-destino="${el.dataset.destino}"]`).forEach((b) => b.classList.toggle('activa', b === el));
  }
});

// ===========================================================================
// Arranque
// ===========================================================================
async function recargar() {
  estado.registros = await estado.almacen.listar();
}

let recargando = false;
async function recargarYRepintar() {
  if (recargando) return;
  recargando = true;
  try {
    await recargar();
    const v = history.state?.vista || 'inicio';
    if (v === 'inicio' || v === 'detalle') pintarActual();
  } catch (e) { console.warn(e); }
  recargando = false;
}

async function iniciar() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

  if (MODO_DEMO) {
    estado.almacen = new AlmacenDemo();
  } else {
    const deLink = leerClaveDeTexto(location.hash);
    if (deLink) localStorage.setItem('rojito-clave', deLink);
    estado.clave = deLink || localStorage.getItem('rojito-clave') || '';
    if (!estado.clave) {
      return vistaSinClave('Para entrar necesitas el <b>link familiar</b>. Pídeselo a Elvis por WhatsApp y ábrelo, o pégalo aquí abajo.');
    }
    if (!deLink) history.replaceState(history.state, '', `${location.pathname}#k=${estado.clave}`);
    estado.almacen = new AlmacenSupabase(SUPABASE_URL, SUPABASE_ANON_KEY, estado.clave);
  }

  try {
    await estado.almacen.iniciar();
    if (!(await estado.almacen.verificarClave())) {
      localStorage.removeItem('rojito-clave');
      return vistaSinClave('Ese link familiar ya no es válido. Pide el link nuevo y pégalo aquí abajo.');
    }
    await recargar();
  } catch (e) {
    console.error(e);
    $app.innerHTML = `<div class="error-caja aviso">No se pudo conectar. Revisa tu internet y vuelve a abrir Rojito.<br><br><button class="boton" onclick="location.reload()">Reintentar</button></div>`;
    return;
  }

  estado.almacen.escucharCambios(() => recargarYRepintar());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') recargarYRepintar(); });

  history.replaceState({ vista: 'inicio', params: {}, prof: 0 }, '');
  pintar(history.state);
}

iniciar();
