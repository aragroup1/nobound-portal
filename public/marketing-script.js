(() => {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Header scroll state ----------
  const header = document.querySelector('.site-header');
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 12);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // ---------- Mobile nav ----------
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') navLinks.classList.remove('open');
    });
  }

  // ---------- Reveal on scroll ----------
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  // ---------- Contact form ----------
  const form = document.querySelector('#contact-form');
  if (form) {
    const status = form.querySelector('.form-status');
    const setFieldError = (name, msg) => {
      const field = form.querySelector(`.field[data-field="${name}"]`);
      if (!field) return;
      field.classList.toggle('error', !!msg);
      const err = field.querySelector('.error-msg');
      if (err) err.textContent = msg || '';
    };
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      status.textContent = '';
      status.classList.remove('success', 'error');

      const data = new FormData(form);
      const name = (data.get('name') || '').toString().trim();
      const email = (data.get('email') || '').toString().trim();
      const message = (data.get('message') || '').toString().trim();
      const hp = (data.get('website') || '').toString();

      let ok = true;
      if (!name) { setFieldError('name', 'Please enter your name.'); ok = false; } else setFieldError('name', '');
      if (!email || !emailRx.test(email)) { setFieldError('email', 'Enter a valid email address.'); ok = false; } else setFieldError('email', '');
      if (!message || message.length < 10) { setFieldError('message', 'Tell us a little more (10+ characters).'); ok = false; } else setFieldError('message', '');
      if (hp) return;
      if (!ok) return;

      const btn = form.querySelector('button[type="submit"]');
      const original = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Sending...';

      try {
        const endpoint = form.getAttribute('action');
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: data,
        });
        if (res.ok) {
          status.textContent = 'Message launched. We will be in touch soon.';
          status.classList.add('success');
          form.reset();
        } else {
          const json = await res.json().catch(() => ({}));
          status.textContent = json.error || 'Something went wrong. Please try again.';
          status.classList.add('error');
        }
      } catch {
        status.textContent = 'Network error. Please try again.';
        status.classList.add('error');
      } finally {
        btn.disabled = false;
        btn.textContent = original;
      }
    });
  }

  // ---------- Hero WebGL shader ----------
  if (prefersReduced) return;
  const canvas = document.getElementById('shaderCanvas');
  if (!canvas) return;
  const gl = canvas.getContext('webgl2', { antialias: false, powerPreference: 'low-power' });
  if (!gl) {
    const fallback = document.querySelector('.hero-fallback');
    if (fallback) fallback.style.display = 'block';
    return;
  }

  const vertexSrc = `#version 300 es
precision highp float;
in vec4 position;
void main(){ gl_Position = position; }`;

  const fragmentSrc = `#version 300 es
precision highp float;
out vec4 O;
uniform vec2 resolution;
uniform float time;
#define FC gl_FragCoord.xy
#define T time
#define R resolution
#define MN min(R.x,R.y)
float rnd(vec2 p){ p=fract(p*vec2(12.9898,78.233)); p+=dot(p,p+34.56); return fract(p.x*p.y); }
float noise(in vec2 p){ vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
  float a=rnd(i),b=rnd(i+vec2(1,0)),c=rnd(i+vec2(0,1)),d=rnd(i+1.);
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y); }
float fbm(vec2 p){ float t=.0,a=1.; mat2 m=mat2(1.,-.5,.2,1.2);
  for(int i=0;i<5;i++){ t+=a*noise(p); p*=2.*m; a*=.5; } return t; }
float clouds(vec2 p){ float d=1.,t=.0;
  for(float i=.0;i<3.;i++){ float a=d*fbm(i*10.+p.x*.2+.2*(1.+i)*p.y+d+i*i+p); t=mix(t,d,a); d=a; p*=2./(i+1.); } return t; }
void main(void){
  vec2 uv=(FC-.5*R)/MN, st=uv*vec2(2,1);
  vec3 col=vec3(0);
  float bg=clouds(vec2(st.x+T*.5,-st.y));
  uv*=1.-.3*(sin(T*.2)*.5+.5);
  for(float i=1.;i<12.;i++){
    uv+=.1*cos(i*vec2(.1+.01*i,.8)+i*i+T*.5+.1*uv.x);
    vec2 p=uv; float d=length(p);
    col+=.00125/d*(cos(sin(i)*vec3(1.3,0.33,1.0))+1.);
    float b=noise(i+p+bg*1.731);
    col+=.002*b/length(max(p,vec2(b*p.x*.02,p.y)));
    col=mix(col,vec3(bg*.3,bg*.2,bg*.55),d);
  }
  col *= 0.65;
  O=vec4(col,1);
}`;

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  };

  const vs = compile(gl.VERTEX_SHADER, vertexSrc);
  const fs = compile(gl.FRAGMENT_SHADER, fragmentSrc);
  if (!vs || !fs) return;
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return;
  }

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]), gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(program, 'resolution');
  const uTime = gl.getUniformLocation(program, 'time');

  const resize = () => {
    const dpr = Math.min(1.25, Math.max(1, 0.6 * window.devicePixelRatio));
    const w = Math.floor(window.innerWidth * dpr);
    const h = Math.floor(window.innerHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  };
  resize();
  window.addEventListener('resize', resize);

  let raf = 0;
  let running = true;
  const render = (now) => {
    if (!running) return;
    gl.useProgram(program);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, now * 1e-3);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    raf = requestAnimationFrame(render);
  };
  raf = requestAnimationFrame(render);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    } else if (!running) {
      running = true;
      raf = requestAnimationFrame(render);
    }
  });
})();
