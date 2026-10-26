(function () {
  var N = '5492478505253', U = 'https://wa.me/' + N + '?text=', $ = function (s) { return document.querySelector(s) };
  document.documentElement.classList.add('js');

  /* ==========================================
     CONFIGURACIÓN DE SUPABASE
     ========================================== */
  const SUPABASE_URL = 'https://turklfcpoaqzaouzesms.supabase.co'; // Asegúrate de incluir la URL completa
  const SUPABASE_ANON_KEY = 'sb_publishable_23pXoL6f2kdizx2iaJvoeQ_XzSmzaJH';
  
  const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

  /* ==========================================
     MENÚ MÓVIL (HAMBURGUESA)
     ========================================== */
  var bg = $('#bg'), mn = $('#menu');
  function tog(o) {
    bg.setAttribute('aria-expanded', o);
    mn.classList.toggle('open', o);
    document.body.style.overflow = o ? 'hidden' : '';
  }
  if (bg && mn) {
    bg.onclick = function () { tog(bg.getAttribute('aria-expanded') !== 'true') };
    mn.addEventListener('click', function (e) { if (e.target.tagName === 'A') tog(false) });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') tog(false) });
  }

  /* ==========================================
     ENLACES DE WHATSAPP Y SERVICIOS
     ========================================== */
  document.querySelectorAll('[data-v]').forEach(function (a) {
    a.href = U + encodeURIComponent('Hola, quiero consultar el valor de: ' + a.dataset.v + '.')
  });
  if ($('#wa')) {
    $('#wa').href = U + encodeURIComponent('Hola Cutz Barber, quiero reservar un turno.');
  }
  
  /* ==========================================
     SELECTOR DE FECHA Y GRILLA DE HORARIOS (40 MIN)
     ========================================== */
  const fechaInput = $('#fecha-input');
  const grillaHorarios = $('#grilla-horarios');
  const inputHoraSeleccionada = $('#hora-seleccionada');

  const HORARIOS_DISPONIBLES = [
    "10:00", "10:40", "11:20", "12:00", "12:40",
    "16:00", "16:40", "17:20", "18:00", "18:40", "19:20"
  ];

  if (fechaInput && grillaHorarios) {
    const hoy = new Date().toISOString().split('T')[0];
    fechaInput.min = hoy;

    fechaInput.addEventListener('change', async function () {
      const fechaSeleccionada = this.value;
      grillaHorarios.innerHTML = '<p style="grid-column: span 4; color: #888; font-size: 0.9rem;">Cargando horarios...</p>';
      inputHoraSeleccionada.value = '';

      let horasOcupadas = [];

      if (supabase) {
        try {
          // Traemos todos los turnos activos y filtramos en cliente por fecha local para evitar errores de zona horaria
          const { data, error } = await supabase
            .from('turnos')
            .select('*')
            .in('estado', ['confirmado', 'pendiente']);

          if (!error && data) {
            horasOcupadas = data
              .filter(t => {
                const d = new Date(t.fecha_hora);
                const localDateStr = d.getFullYear() + '-' + 
                  String(d.getMonth() + 1).padStart(2, '0') + '-' + 
                  String(d.getDate()).padStart(2, '0');
                return localDateStr === fechaSeleccionada;
              })
              .map(t => {
                const d = new Date(t.fecha_hora);
                const horas = String(d.getHours()).padStart(2, '0');
                const minutos = String(d.getMinutes()).padStart(2, '0');
                return `${horas}:${minutos}`;
              });
          }
        } catch (e) {
          console.error('Error al consultar horarios:', e);
        }
      }

      grillaHorarios.innerHTML = '';
      HORARIOS_DISPONIBLES.forEach(hora => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = hora;
        btn.className = 'time-slot-btn'; // Asignamos la clase moderna

        if (horasOcupadas.includes(hora)) {
          btn.disabled = true;
          btn.title = 'Horario Ocupado';
        } else {
          btn.addEventListener('click', function () {
            grillaHorarios.querySelectorAll('.time-slot-btn').forEach(b => {
              b.classList.remove('selected');
            });
            btn.classList.add('selected');
            inputHoraSeleccionada.value = fechaSeleccionada + ' ' + hora;
          });
        }

        grillaHorarios.appendChild(btn);
      });
    });
  }

  var form = $('#f');
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var v = function (i) { return $(i) ? $(i).value.trim() : '' };

      var nombre = v('#n');
      var telefono = v('#t');
      var servicio = v('#s');
      var fechaHoraStr = v('#hora-seleccionada');

      if (!nombre || !telefono || !fechaHoraStr) {
        alert('Por favor completá tu nombre, teléfono y seleccioná un día y horario disponible.');
        return;
      }

      // Convertir fecha y hora local a formato ISO exacto
      const [fechaPart, horaPart] = fechaHoraStr.split(' ');
      const [anio, mes, dia] = fechaPart.split('-');
      const [hora, minuto] = horaPart.split(':');
      const fechaLocalObj = new Date(anio, mes - 1, dia, hora, minuto, 0);

      if (supabase) {
        try {
          const { error } = await supabase
            .from('turnos')
            .insert([
              {
                nombre: nombre,
                telefono: telefono,
                servicio: servicio,
                fecha_hora: fechaLocalObj.toISOString(),
                estado: 'confirmado'
              }
            ]);

          if (error) {
            console.error('Error al guardar en Supabase:', error.message);
          }
        } catch (err) {
          console.error('Excepción de conexión con Supabase:', err);
        }
      }

      var L = [
        'Hola Cutz Barber, quiero confirmar mi turno.',
        'Nombre: ' + nombre,
        'Servicio: ' + servicio,
        'Fecha y Hora: ' + fechaHoraStr,
        'Teléfono: ' + telefono
      ];

      window.open(U + encodeURIComponent(L.join('\n')), '_blank');
    });
  }

  /* ==========================================
     FORMULARIO DE RESERVAS + SUPABASE
     ========================================== */
  var form = $('#f');
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var v = function (i) { return $(i) ? $(i).value.trim() : '' };

      var nombre = v('#n');
      var telefono = v('#t');
      var servicio = v('#s');
      var fechaHoraStr = v('#hora-seleccionada');

      if (!nombre || !telefono || !fechaHoraStr) {
        alert('Por favor completá tu nombre, teléfono y seleccioná un día y horario disponible.');
        return;
      }

      if (supabase) {
        try {
          const { error } = await supabase
            .from('turnos')
            .insert([
              {
                nombre: nombre,
                telefono: telefono,
                servicio: servicio,
                fecha_hora: new Date(fechaHoraStr.replace(' ', 'T') + ':00').toISOString(),
                estado: 'confirmado'
              }
            ]);

          if (error) {
            console.error('Error al guardar en Supabase:', error.message);
          }
        } catch (err) {
          console.error('Excepción de conexión con Supabase:', err);
        }
      }

      var L = [
        'Hola Cutz Barber, quiero confirmar mi turno.',
        'Nombre: ' + nombre,
        'Servicio: ' + servicio,
        'Fecha y Hora: ' + fechaHoraStr,
        'Teléfono: ' + telefono
      ];

      window.open(U + encodeURIComponent(L.join('\n')), '_blank');
    });
  }

  /* ==========================================
     ANIMACIONES DE ENTRADA Y CONTADORES
     ========================================== */
  var els = document.querySelectorAll('.m,.r,.eyebrow,.grid figure,.frame,.row,.step');
  document.querySelectorAll('.grid figure,.row,.step').forEach(function (el) {
    el.style.transitionDelay = (Array.prototype.indexOf.call(el.parentNode.children, el) % 4 * .12) + 's'
  });

  function count(el) {
    var to = +el.dataset.to, t0 = null;
    function f(t) {
      t0 = t0 || t; var p = Math.min((t - t0) / 1400, 1);
      el.firstChild.nodeValue = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(f)
    }
    requestAnimationFrame(f)
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (x) {
        if (x.isIntersecting) {
          x.target.classList.add('in');
          var c = x.target.querySelector('[data-to]') || (x.target.dataset.to ? x.target : null);
          if (c && !c.done) { c.done = 1; count(c) }
          io.unobserve(x.target)
        }
      })
    }, { threshold: .15 });
    els.forEach(function (el) { io.observe(el) });
  } else {
    els.forEach(function (el) { el.classList.add('in') })
  }

  /* ==========================================
     BARRA DE PROGRESO Y EFECTO PARALLAX
     ========================================== */
  var pb = $('#pb'), par = $('[data-par]'), red = matchMedia('(prefers-reduced-motion:reduce)').matches, tk = 0;
  function sc() {
    tk = 0; var m = document.documentElement.scrollHeight - innerHeight;
    if (pb) pb.style.transform = 'scaleX(' + (m > 0 ? scrollY / m : 0) + ')';
    if (par && !red && scrollY < 900) par.style.transform = 'translateY(' + (scrollY * .06) + 'px)'
  }
  addEventListener('scroll', function () { if (!tk) tk = requestAnimationFrame(sc) }, { passive: true });
  sc();
})();