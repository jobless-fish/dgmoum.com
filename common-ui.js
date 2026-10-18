(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.moumReduced = reduced;
  window.moumIcons = () => window.lucide?.createIcons();
  moumIcons();
  const curtain = document.createElement("div");
  curtain.className = "page-curtain";
  curtain.textContent = "도구모음";
  curtain.setAttribute("aria-hidden", "true");
  document.body.append(curtain);
  let arriving = false;
  try {
    arriving = sessionStorage.getItem("moum-transition") === "1";
    sessionStorage.removeItem("moum-transition");
  } catch {}
  if (arriving && !reduced && window.gsap) {
    curtain.classList.add("is-covering");
    gsap.fromTo(
      curtain,
      { yPercent: 0 },
      {
        yPercent: -100,
        duration: 0.6,
        ease: "power4.inOut",
        onComplete: () => {
          gsap.set(curtain, { yPercent: 100 });
          curtain.classList.remove("is-covering");
        },
      },
    );
  }
  let navigating = false;
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (
      !a ||
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      a.download ||
      a.target === "_blank"
    )
      return;
    const u = new URL(a.href, location.href);
    if (
      u.origin !== location.origin ||
      !["http:", "https:"].includes(u.protocol) ||
      (u.pathname === location.pathname && u.search === location.search)
    )
      return;
    if (reduced || !window.gsap) return;
    if ("onpageswap" in window) return;
    e.preventDefault();
    if (navigating) return;
    navigating = true;
    curtain.classList.add("is-covering");
    try {
      sessionStorage.setItem("moum-transition", "1");
    } catch {}
    gsap.to(curtain, {
      yPercent: 0,
      duration: 0.38,
      ease: "power3.inOut",
      onComplete: () => location.assign(u.href),
    });
  });
  addEventListener("pageshow", (e) => {
    if (e.persisted) {
      navigating = false;
      curtain.classList.remove("is-covering");
      window.gsap?.set(curtain, { yPercent: 100 });
    }
  });
  const dialog = document.createElement("dialog");
  dialog.className = "command-dialog";
  dialog.setAttribute("aria-label", "빠른 도구 검색");
  dialog.innerHTML =
    '<div class="command-head"><i data-lucide="search"></i><input type="search" aria-label="도구 검색" placeholder="무엇을 하고 싶으세요?" autocomplete="off"><button aria-label="검색 닫기">닫기</button></div><div class="command-results"><p>도구 목록을 불러오는 중…</p></div><div class="command-footer">필요한 도구를 선택하세요</div>';
  document.body.append(dialog);
  moumIcons();
  let catalog = [],
    fuse;
  const box = dialog.querySelector("input"),
    results = dialog.querySelector(".command-results");
  window.moumCatalog = fetch("/catalog.json")
    .then((r) => {
      if (!r.ok) throw Error();
      return r.json();
    })
    .then((d) => {
      catalog = d;
      fuse = window.Fuse
        ? new Fuse(d, {
            keys: [{ name: "name", weight: 2 }, "desc", "id"],
            threshold: 0.3,
            ignoreLocation: true,
          })
        : null;
      draw();
      return d;
    })
    .catch(() => {
      results.innerHTML = "<p>목록을 불러오지 못했어요. 새로고침해 주세요.</p>";
      return [];
    });
  const open = () => {
    if (!dialog.open) dialog.showModal();
    box.focus();
  };
  window.moumOpenSearch = open;
  document
    .querySelectorAll("[data-command]")
    .forEach((b) => b.addEventListener("click", open));

  dialog.querySelector("button").onclick = () => dialog.close();
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
  box.addEventListener("input", draw);
  function draw() {
    const q = box.value.trim();
    const found = q
      ? fuse
        ? fuse.search(q).map((r) => r.item)
        : catalog.filter((x) => (x.name + x.desc + x.id).includes(q))
      : catalog.filter((x) =>
          [
            "image-compress",
            "pdf-merge",
            "image-convert",
            "video-trim",
            "qr-code",
          ].includes(x.id),
        );
    results.replaceChildren();
    found.slice(0, 8).forEach((t) => {
      const a = document.createElement("a");
      a.href = "/tools/" + t.id + "/";
      a.textContent = t.name;
      const sm = document.createElement("small");
      sm.textContent = "열기 ↗";
      a.append(sm);
      results.append(a);
    });
    if (!found.length) {
      const p = document.createElement("p");
      p.textContent = "검색 결과가 없어요. 다른 작업 이름으로 찾아보세요.";
      results.append(p);
    }
  }
  dialog.addEventListener("keydown", (e) => {
    const links = [...results.querySelectorAll("a")];
    if (!links.length) return;
    const i = links.indexOf(document.activeElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      links[(i + 1) % links.length].focus();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (i <= 0) box.focus();
      else links[i - 1].focus();
    }
    if (e.key === "Enter" && document.activeElement === box) {
      e.preventDefault();
      links[0].click();
    }
  });
  if (!reduced && window.gsap) {
    document
      .querySelectorAll(".quick-card,.library-card,.about-teaser")
      .forEach((el) => {
        el.addEventListener("pointerenter", (e) => {
          if (e.pointerType === "mouse")
            gsap.to(el, { y: -5, duration: 0.45, ease: "back.out(2)" });
        });
        el.addEventListener("pointerleave", () =>
          gsap.to(el, {
            y: 0,
            rotationX: 0,
            rotationY: 0,
            duration: 0.7,
            ease: "elastic.out(1,.5)",
          }),
        );
      });
  }
})();
