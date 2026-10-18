(async () => {
  const data = await moumCatalog;
  const labels = [
    ["all", "전체 도구", "grid-2x2"],
    ["fav", "즐겨찾기", "star"],
    ["img", "이미지", "image"],
    ["doc", "PDF", "files"],
    ["vid", "영상", "film"],
    ["aud", "오디오", "audio-lines"],
    ["des", "디자인", "palette"],
    ["txt", "텍스트", "type"],
    ["form", "서류 양식", "file-text"],
    ["fun", "플레이", "gamepad-2"],
  ];
  const nav = document.querySelector(".category-nav");
  const grid = document.querySelector(".library-grid");
  const query = document.querySelector("#library-query");
  const params = new URLSearchParams(location.search);
  let cat = labels.some((x) => x[0] === params.get("cat"))
    ? params.get("cat")
    : "all";
  let page = Math.max(1, parseInt(params.get("page"), 10) || 1);
  const pageSize = 12;
  query.value = params.get("q") || "";
  const favs = () => {
    try {
      const f = JSON.parse(localStorage.getItem("dg-favs") || "[]");
      return Array.isArray(f) ? f : [];
    } catch {
      return [];
    }
  };
  const fuse = window.Fuse
    ? new Fuse(data, {
        keys: [{ name: "name", weight: 2 }, "desc", "id"],
        threshold: 0.3,
        ignoreLocation: true,
      })
    : null;
  const pager = document.createElement("nav");
  pager.className = "library-pagination";
  pager.setAttribute("aria-label", "도구 목록 페이지");
  grid.after(pager);
  labels.forEach(([id, name, icon]) => {
    const b = document.createElement("button");
    b.dataset.cat = id;
    b.innerHTML = `<i data-lucide="${icon}"></i><span>${name}</span><small></small>`;
    b.onclick = () => {
      cat = id;
      page = 1;
      render();
    };
    nav.append(b);
  });
  function render() {
    const q = query.value.trim(),
      saved = favs();
    let matches = q
      ? fuse
        ? fuse.search(q).map((x) => x.item)
        : data.filter((t) =>
            (t.name + t.desc + t.id).toLowerCase().includes(q.toLowerCase()),
          )
      : data;
    matches = matches.filter(
      (t) =>
        cat === "all" || (cat === "fav" ? saved.includes(t.id) : t.cat === cat),
    );
    const pages = Math.max(1, Math.ceil(matches.length / pageSize));
    page = Math.min(page, pages);
    nav.querySelectorAll("button").forEach((b) => {
      const id = b.dataset.cat;
      b.setAttribute("aria-pressed", String(id === cat));
      b.querySelector("small").textContent =
        id === "all"
          ? data.length
          : id === "fav"
            ? data.filter((t) => saved.includes(t.id)).length
            : data.filter((t) => t.cat === id).length;
    });
    grid.replaceChildren();
    matches.slice((page - 1) * pageSize, page * pageSize).forEach((t) => {
      const card = document.createElement("article");
      card.className = "library-card";
      const a = document.createElement("a");
      a.className = "library-tool-link";
      a.href = "/tools/" + t.id + "/";
      const icon = labels.find((x) => x[0] === t.cat)?.[2] || "box";
      a.innerHTML = `<span class="tile-icon"><i data-lucide="${icon}"></i></span>`;
      const h = document.createElement("h2"),
        p = document.createElement("p");
      h.textContent = t.name;
      p.textContent = t.desc;
      a.append(h, p);
      const star = document.createElement("button");
      star.className = "library-star";
      star.setAttribute("aria-label", t.name + " 즐겨찾기");
      star.setAttribute("aria-pressed", String(saved.includes(t.id)));
      star.innerHTML = '<i data-lucide="star"></i>';
      star.onclick = () => {
        const f = favs();
        try {
          localStorage.setItem(
            "dg-favs",
            JSON.stringify(
              f.includes(t.id) ? f.filter((x) => x !== t.id) : [...f, t.id],
            ),
          );
        } catch {}
        render();
        grid.querySelector(`[data-tool="${t.id}"] .library-star`)?.focus();
      };
      card.dataset.tool = t.id;
      if (t.hot) card.classList.add("is-hot"); // 많이 찾는 도구: 은은한 빛
      card.append(a, star);
      grid.append(card);
    });
    if (!matches.length) {
      const p = document.createElement("p");
      p.className = "no-results";
      p.textContent =
        cat === "fav"
          ? "별표를 눌러 자주 쓰는 도구를 모아보세요."
          : "검색 결과가 없어요. 다른 분류나 검색어를 선택해 주세요.";
      grid.append(p);
    }
    document.querySelector("#library-count").textContent =
      `${labels.find((x) => x[0] === cat)[1]} · ${matches.length}개`;
    pager.replaceChildren();
    if (pages > 1) {
      for (let i = 0; i < pages + 2; i++) {
        const target = i === 0 ? page - 1 : i === pages + 1 ? page + 1 : i;
        const b = document.createElement("button");
        b.textContent =
          i === 0 ? "← 이전" : i === pages + 1 ? "다음 →" : String(i);
        b.disabled = target < 1 || target > pages;
        if (i === page) b.setAttribute("aria-current", "page");
        b.onclick = () => {
          page = target;
          render();
          document
            .querySelector("#library-count")
            .scrollIntoView?.({
              behavior: moumReduced ? "instant" : "smooth",
              block: "center",
            });
          pager.querySelector("[aria-current]")?.focus();
        };
        pager.append(b);
      }
    }
    const u = new URL(location.href);
    u.search = "";
    if (cat !== "all") u.searchParams.set("cat", cat);
    if (q) u.searchParams.set("q", q);
    if (page > 1) u.searchParams.set("page", page);
    history.replaceState(null, "", u);
    moumIcons();
    if (!moumReduced && window.gsap)
      gsap.fromTo(
        ".library-card",
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.025, clearProps: "all" },
      );
  }
  query.addEventListener("input", () => {
    page = 1;
    render();
  });
  document.querySelector("#clear-filter").onclick = () => {
    cat = "all";
    page = 1;
    query.value = "";
    render();
    query.focus();
  };
  render();
})();
