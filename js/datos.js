// Capa de datos: Supabase (compartido con la familia) o modo demo (solo este celular).

const nuevoId = () =>
  (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2));

async function hashCorto(texto) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(buf)).slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------------------
// Supabase
// ---------------------------------------------------------------------------
export class AlmacenSupabase {
  constructor(url, anonKey, clave) {
    this.url = url;
    this.anonKey = anonKey;
    this.clave = clave;
    this.cacheUrls = new Map();
    this.canal = null;
  }

  async iniciar() {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    this.sb = createClient(this.url, this.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { 'x-clave-familia': this.clave } },
    });
  }

  async verificarClave() {
    const { data, error } = await this.sb.rpc('clave_ok');
    if (error) throw error;
    return data === true;
  }

  async listar() {
    const { data, error } = await this.sb
      .from('registros')
      .select('*')
      .order('fecha', { ascending: false })
      .order('creado', { ascending: false });
    if (error) throw error;
    return data.map((r) => ({ ...r, costo: r.costo === null ? null : Number(r.costo) }));
  }

  async guardar(registro, fotosNuevas, fotosQuitadas) {
    const id = registro.id || nuevoId();
    const subidas = [];
    for (const blob of fotosNuevas) {
      const ruta = `${id}/${nuevoId()}.jpg`;
      const { error } = await this.sb.storage.from('fotos').upload(ruta, blob, { contentType: 'image/jpeg' });
      if (error) throw error;
      subidas.push(ruta);
    }
    const fila = {
      ...registro,
      id,
      fotos: [...(registro.fotos || []).filter((f) => !fotosQuitadas.includes(f)), ...subidas],
      actualizado: new Date().toISOString(),
    };
    delete fila.creado;
    const { data, error } = await this.sb.from('registros').upsert(fila).select().single();
    if (error) throw error;
    if (fotosQuitadas.length) await this.sb.storage.from('fotos').remove(fotosQuitadas);
    return data;
  }

  async eliminar(registro) {
    const { error } = await this.sb.from('registros').delete().eq('id', registro.id);
    if (error) throw error;
    if (registro.fotos?.length) await this.sb.storage.from('fotos').remove(registro.fotos);
  }

  async urlsFotos(rutas) {
    const faltan = rutas.filter((r) => !this.cacheUrls.has(r));
    if (faltan.length) {
      const { data, error } = await this.sb.storage.from('fotos').createSignedUrls(faltan, 60 * 60 * 6);
      if (!error && data) data.forEach((d) => d.signedUrl && this.cacheUrls.set(d.path, d.signedUrl));
    }
    const mapa = new Map();
    rutas.forEach((r) => this.cacheUrls.has(r) && mapa.set(r, this.cacheUrls.get(r)));
    return mapa;
  }

  // Aviso en vivo a los demás celulares: "algo cambió, recarguen".
  async escucharCambios(alCambiar) {
    try {
      const nombre = 'rojito-' + (await hashCorto(this.clave));
      this.canal = this.sb.channel(nombre, { config: { broadcast: { self: false } } });
      this.canal.on('broadcast', { event: 'cambio' }, () => alCambiar()).subscribe();
    } catch (e) {
      console.warn('Sin avisos en vivo', e);
    }
  }

  avisarCambio() {
    try { this.canal?.send({ type: 'broadcast', event: 'cambio', payload: {} }); } catch (e) { /* sin aviso */ }
  }
}

// ---------------------------------------------------------------------------
// Modo demo: todo se guarda en este navegador
// ---------------------------------------------------------------------------
const LLAVE_DEMO = 'rojito-demo-registros';

export class AlmacenDemo {
  async iniciar() {}
  async verificarClave() { return true; }

  leer() {
    try { return JSON.parse(localStorage.getItem(LLAVE_DEMO) || '[]'); } catch { return []; }
  }

  escribir(lista) { localStorage.setItem(LLAVE_DEMO, JSON.stringify(lista)); }

  async listar() {
    return this.leer().sort((a, b) => (b.fecha + b.creado).localeCompare(a.fecha + a.creado));
  }

  async guardar(registro, fotosNuevas, fotosQuitadas) {
    const lista = this.leer();
    const id = registro.id || nuevoId();
    const subidas = [];
    for (const blob of fotosNuevas) {
      const ruta = `${id}/${nuevoId()}.jpg`;
      const dataUrl = await new Promise((ok, mal) => {
        const lector = new FileReader();
        lector.onload = () => ok(lector.result);
        lector.onerror = mal;
        lector.readAsDataURL(blob);
      });
      try {
        localStorage.setItem('rojito-demo-foto-' + ruta, dataUrl);
        subidas.push(ruta);
      } catch {
        throw new Error('El modo demo se quedó sin espacio para fotos.');
      }
    }
    fotosQuitadas.forEach((r) => localStorage.removeItem('rojito-demo-foto-' + r));
    const anterior = lista.find((r) => r.id === id);
    const fila = {
      ...registro,
      id,
      fotos: [...(registro.fotos || []).filter((f) => !fotosQuitadas.includes(f)), ...subidas],
      creado: anterior?.creado || new Date().toISOString(),
      actualizado: new Date().toISOString(),
    };
    this.escribir([...lista.filter((r) => r.id !== id), fila]);
    return fila;
  }

  async eliminar(registro) {
    (registro.fotos || []).forEach((r) => localStorage.removeItem('rojito-demo-foto-' + r));
    this.escribir(this.leer().filter((r) => r.id !== registro.id));
  }

  async urlsFotos(rutas) {
    const mapa = new Map();
    rutas.forEach((r) => {
      const url = localStorage.getItem('rojito-demo-foto-' + r);
      if (url) mapa.set(r, url);
    });
    return mapa;
  }

  async escucharCambios() {}
  avisarCambio() {}
}
