(async () => {
  if (!moumReduced && window.gsap) {
    gsap.from(".welcome h1,.welcome p,.micro", {
      y: 22,
      opacity: 0,
      duration: 0.8,
      stagger: 0.08,
      ease: "power3.out",
    });
    gsap.from(".quick-card", {
      y: 35,
      opacity: 0,
      duration: 0.8,
      stagger: 0.06,
      ease: "back.out(1.2)",
      clearProps: "transform",
    });
    gsap.to(".teaser-orbit b", {
      rotation: 360,
      duration: 30,
      repeat: -1,
      ease: "none",
    });
  }
  const data = await moumCatalog;
  let recent = [];
  try {
    recent = JSON.parse(localStorage.getItem("moum-recent") || "[]");
  } catch {}
  if (!Array.isArray(recent)) return;
  recent = recent
    .slice(0, 4)
    .map((id) => data.find((x) => x.id === id))
    .filter(Boolean);
  if (recent.length) {
    document.querySelector("#recent-strip").hidden = false;
    recent.forEach((t) => {
      const a = document.createElement("a");
      a.href = "/tools/" + t.id + "/";
      a.textContent = t.name + " ↗";
      document.querySelector("#recent-links").append(a);
    });
  }
})();
