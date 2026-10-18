const reduced = window.moumReduced;
let paused = !!reduced,
  lenis = null;
const triggers = [];
const motionButton = document.querySelector("#motion-toggle");
let renderSculpture = () => {},
  scatter = () => {},
  syncPhysics = () => {};
let visible = true;
document.addEventListener("visibilitychange", () => {
  visible = !document.hidden;
});
function smooth() {
  if (window.Lenis && !paused) {
    lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      syncTouch: false,
      anchors: true,
      autoRaf: true,
    });
    lenis.on("scroll", () => window.ScrollTrigger?.update());
  }
}
smooth();
if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  if (!reduced) {
    gsap.from(".about-hero h1>span", {
      yPercent: 110,
      opacity: 0,
      duration: 1.3,
      stagger: 0.12,
      ease: "power4.out",
      clearProps: "transform,opacity",
    });
    gsap.from(".hero-under", { y: 20, opacity: 0, duration: 1, delay: 0.5 });
    const add = (a) => {
      if (a.scrollTrigger) triggers.push(a.scrollTrigger);
      return a;
    };
    add(
      gsap.to(".about-progress", {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: "main",
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5,
        },
      }),
    );
    add(
      gsap.to(".about-hero h1", {
        yPercent: -12,
        opacity: 0.2,
        ease: "none",
        scrollTrigger: {
          trigger: ".about-hero",
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      }),
    );
    add(
      gsap.fromTo(
        ".manifesto-text",
        { y: 75, opacity: 0.25 },
        {
          y: 0,
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: ".manifesto",
            start: "top 85%",
            end: "top 15%",
            scrub: 1,
          },
        },
      ),
    );
    add(
      gsap.fromTo(
        ".manifesto-sticker",
        { rotation: -25, y: 100 },
        {
          rotation: 12,
          y: -35,
          ease: "none",
          scrollTrigger: {
            trigger: ".manifesto",
            start: "top bottom",
            end: "bottom top",
            scrub: 1.4,
          },
        },
      ),
    );
    document
      .querySelectorAll(".process-card")
      .forEach((el, i) =>
        add(
          gsap.fromTo(
            el,
            { y: 80, rotation: (i - 1) * 8, rotateX: 20 },
            {
              y: 0,
              rotation: 0,
              rotateX: 0,
              duration: 1,
              ease: "back.out(1.4)",
              scrollTrigger: {
                trigger: el,
                start: "top 88%",
                toggleActions: "play none none reverse",
              },
            },
          ),
        ),
      );
    add(
      gsap.fromTo(
        ".end-link",
        { scale: 0.82, rotation: -4 },
        {
          scale: 1,
          rotation: 0,
          ease: "none",
          scrollTrigger: {
            trigger: ".about-end",
            start: "top bottom",
            end: "top 10%",
            scrub: 1,
          },
        },
      ),
    );
  }
}
function updateMotion() {
  motionButton.innerHTML = paused
    ? '모션 재생 <i data-lucide="play"></i>'
    : '모션 일시정지 <i data-lucide="pause"></i>';
  motionButton.setAttribute("aria-pressed", String(paused));
  window.moumIcons();
  if (paused) {
    lenis?.destroy();
    lenis = null;
    triggers.forEach((t) => t.disable(false));
  } else {
    smooth();
    triggers.forEach((t) => t.enable());
    window.ScrollTrigger?.refresh();
  }
}
motionButton.addEventListener("click", () => {
  paused = !paused;
  updateMotion();
});
if (reduced) updateMotion();
async function sculpture() {
  try {
    const THREE = await import("/vendor/three.module.js");
    const host = document.querySelector("#sculpture");
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
    renderer.setClearColor(0, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.z = 8;
    const envCanvas = document.createElement("canvas");
    envCanvas.width = 1024;
    envCanvas.height = 512;
    const ctx = envCanvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, "#f2edff");
    gradient.addColorStop(0.2, "#b19ae9");
    gradient.addColorStop(0.45, "#22222c");
    gradient.addColorStop(0.56, "#f8ffe0");
    gradient.addColorStop(0.68, "#8a79d4");
    gradient.addColorStop(1, "#111118");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 512);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(80, 0, 100, 512);
    ctx.fillRect(650, 40, 40, 400);
    ctx.fillStyle = "#d9fa67";
    ctx.fillRect(850, 0, 130, 512);
    const env = new THREE.CanvasTexture(envCanvas);
    env.mapping = THREE.EquirectangularReflectionMapping;
    env.colorSpace = THREE.SRGBColorSpace;
    scene.environment = env;
    const group = new THREE.Group();
    scene.add(group);
    const geo = new THREE.TorusKnotGeometry(1.48, 0.49, 180, 32, 2, 3);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0xb6a0ff,
      metalness: 0.86,
      roughness: 0.17,
      clearcoat: 1,
      clearcoatRoughness: 0.13,
      iridescence: 0.65,
      iridescenceIOR: 1.35,
      envMapIntensity: 1.7,
    });
    const knot = new THREE.Mesh(geo, mat);
    group.add(knot);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xd9fa67,
      metalness: 0.3,
      roughness: 0.22,
    });
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.42, 0.027, 8, 100),
      ringMat,
    );
    ring.rotation.x = 1.25;
    ring.rotation.y = 0.3;
    group.add(ring);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 24), ringMat);
    orb.position.set(2.4, 0, 0);
    group.add(orb);
    scene.add(new THREE.AmbientLight(0xffffff, 1.3));
    const key = new THREE.DirectionalLight(0xffffff, 4);
    key.position.set(3, 5, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xcab7ff, 3);
    rim.position.set(-3, -2, 1);
    scene.add(rim);
    host.append(renderer.domElement);
    host.querySelector(".sculpture-fallback").hidden = true;
    const resize = () => {
      const w = host.clientWidth,
        h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    new ResizeObserver(resize).observe(host);
    resize();
    let targetX = 0,
      targetY = 0;
    document
      .querySelector(".about-hero")
      .addEventListener("pointermove", (e) => {
        targetY = (e.clientX / innerWidth - 0.5) * 0.7;
        targetX = (e.clientY / innerHeight - 0.5) * 0.4;
      });
    let t = 0;
    renderSculpture = (dt) => {
      if (!paused) {
        t += dt;
        const scroll = Math.min(scrollY / Math.max(innerHeight, 1), 1.5);
        knot.rotation.x = t * 0.13 + scroll * 0.7 + targetX;
        knot.rotation.y = t * 0.22 + targetY + scroll * 1.4;
        knot.rotation.z = Math.sin(t * 0.2) * 0.2;
        group.position.y = Math.sin(t * 0.6) * 0.1;
        ring.rotation.z = t * 0.12;
        orb.position.set(
          Math.cos(t * 0.3) * 2.4,
          Math.sin(t * 0.3) * 0.75,
          Math.sin(t * 0.3) * 2.2,
        );
      }
      renderer.render(scene, camera);
    };
    renderSculpture(0);
    const obs = new IntersectionObserver(([entry]) => {
      host.dataset.visible = entry.isIntersecting;
    });
    obs.observe(host);
  } catch (error) {
    document.querySelector("#sculpture").dataset.fallback = "true";
    console.warn("3D unavailable; static artwork is active.");
  }
}
sculpture();
function physics() {
  if (!window.Matter) {
    document.querySelector("#physics-stage").innerHTML =
      "<p class=physics-unavailable>IMAGE · PDF · VIDEO · AUDIO · DESIGN</p>";
    document.querySelector("#shuffle").disabled = true;
    return;
  }
  const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint } = Matter;
  const stage = document.querySelector("#physics-stage"),
    engine = Engine.create({ gravity: { x: 0, y: 0.9 } });
  let w = stage.clientWidth,
    h = stage.clientHeight;
  let walls = [];
  function bounds() {
    Composite.remove(engine.world, walls);
    w = stage.clientWidth;
    h = stage.clientHeight;
    walls = [
      Bodies.rectangle(w / 2, h + 40, w + 100, 80, { isStatic: true }),
      Bodies.rectangle(-40, h / 2, 80, h * 4, { isStatic: true }),
      Bodies.rectangle(w + 40, h / 2, 80, h * 4, { isStatic: true }),
    ];
    Composite.add(engine.world, walls);
  }
  bounds();
  const labels = [
    "IMAGE ↗",
    "PDF +",
    "MAKE IT.",
    "PLAY ✳",
    "AUDIO ≋",
    "DESIGN ◐",
    "VIDEO ▷",
    "모음",
    "LESS WORK",
    "MORE FLOW",
  ];
  const colors = [
    "#c6b9fa",
    "#d9fa67",
    "#f1efea",
    "#efa788",
    "#c6b9fa",
    "#b2d3bc",
  ];
  let pieces = labels.map((label, i) => {
    const width = innerWidth < 650 ? 120 + (i % 3) * 15 : 155 + (i % 3) * 25,
      height = innerWidth < 650 ? 55 : 70;
    const el = document.createElement("div");
    el.className = "physics-chip";
    el.textContent = label;
    el.style.width = width + "px";
    el.style.height = height + "px";
    el.style.background = colors[i % colors.length];
    stage.append(el);
    const body = Bodies.rectangle(
      40 + ((i % 4) * w) / 4,
      -100 - Math.floor(i / 4) * 90,
      width,
      height,
      {
        chamfer: { radius: height / 2 - 1 },
        restitution: 0.65,
        friction: 0.2,
        angle: (i % 2 ? 1 : -1) * 0.2,
      },
    );
    Composite.add(engine.world, body);
    return { el, body, width, height };
  });
  const mouse = Mouse.create(stage);
  const mc = MouseConstraint.create(engine, {
    mouse,
    constraint: { stiffness: 0.15, render: { visible: false } },
  });
  Composite.add(engine.world, mc);
  stage.removeEventListener("wheel", mouse.mousewheel);
  stage.removeEventListener("mousewheel", mouse.mousewheel);
  stage.removeEventListener("DOMMouseScroll", mouse.mousewheel);
  stage.removeEventListener("touchstart", mouse.mousedown);
  stage.removeEventListener("touchmove", mouse.mousemove);
  stage.removeEventListener("touchend", mouse.mouseup);
  stage.addEventListener(
    "touchstart",
    (e) => {
      if (e.target.closest(".physics-chip")) mouse.mousedown(e);
    },
    { passive: false },
  );
  stage.addEventListener(
    "touchmove",
    (e) => {
      if (mouse.button === 0) mouse.mousemove(e);
    },
    { passive: false },
  );
  stage.addEventListener(
    "touchend",
    (e) => {
      if (mouse.button === 0) mouse.mouseup(e);
    },
    { passive: false },
  );
  let active = false;
  new IntersectionObserver(([e]) => (active = e.isIntersecting)).observe(stage);
  const paint = () =>
    pieces.forEach(({ el, body, width, height }) => {
      el.style.transform = `translate(${body.position.x - width / 2}px,${body.position.y - height / 2}px) rotate(${body.angle}rad)`;
    });
  if (reduced) {
    pieces.forEach(({ body }, i) =>
      Body.setPosition(body, {
        x: 70 + (i % Math.max(2, Math.floor(w / 170))) * 150,
        y: h - 40 - Math.floor(i / Math.max(2, Math.floor(w / 170))) * 60,
      }),
    );
    paint();
  }
  syncPhysics = (dt) => {
    if (!active || paused) return;
    Engine.update(engine, Math.min(dt * 1000, 1000 / 30));
    paint();
  };
  scatter = () => {
    pieces.forEach(({ body }, i) => {
      Body.setPosition(body, {
        x: 60 + Math.random() * Math.max(1, w - 120),
        y: 40 + (i % 3) * 50,
      });
      Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 8,
        y: -Math.random() * 8,
      });
      Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.18);
    });
    if (paused) {
      for (let i = 0; i < 120; i++) Engine.update(engine, 1000 / 60);
      paint();
    }
  };
  new ResizeObserver(() => {
    bounds();
    pieces.forEach(({ body }) => {
      if (body.position.x > w - 20) Body.setPosition(body, { x: w / 2, y: 60 });
    });
    paint();
  }).observe(stage);
}
physics();
document.querySelector("#shuffle").onclick = () => scatter();
let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (visible) {
    if (document.querySelector("#sculpture").dataset.visible !== "false")
      renderSculpture(dt);
    syncPhysics(dt);
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
