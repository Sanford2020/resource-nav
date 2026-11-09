(function () {
  "use strict";

  const state = {
    data: null,
    resources: [],
    query: "",
    category: "all",
    subcategory: "all",
    verified: "all",
    statusKeyword: "all",
    kind: "all",
    sort: "name-asc",
  };

  const SUBCATEGORIES = {
    AI视频制作: ["模型平台", "开源本地", "教程流程", "提示词案例", "资讯对比"],
    交易分析: ["数字货币", "美股", "港股", "A股", "通用"],
  };

  const CAT_ACCENTS = [
    "#c41e3a",
    "#1a365d",
    "#d97706",
    "#0f766e",
    "#6b21a8",
    "#4d7c0f",
    "#9f1239",
    "#005f73",
  ];

  const els = {
    metaBar: document.getElementById("metaBar"),
    searchInput: document.getElementById("searchInput"),
    categoryFilters: document.getElementById("categoryFilters"),
    subcategoryFieldset: document.getElementById("subcategoryFieldset"),
    subcategoryFilters: document.getElementById("subcategoryFilters"),
    verifiedFilters: document.getElementById("verifiedFilters"),
    statusFilters: document.getElementById("statusFilters"),
    kindFilters: document.getElementById("kindFilters"),
    sortSelect: document.getElementById("sortSelect"),
    resultCount: document.getElementById("resultCount"),
    bentoHero: document.getElementById("bentoHero"),
    cardGrid: document.getElementById("cardGrid"),
    detailDrawer: document.getElementById("detailDrawer"),
    drawerBackdrop: document.getElementById("drawerBackdrop"),
    drawerPanel: document.getElementById("drawerPanel"),
    closeDrawer: document.getElementById("closeDrawer"),
    detailTitle: document.getElementById("detailTitle"),
    detailBadges: document.getElementById("detailBadges"),
    detailBody: document.getElementById("drawerBody"),
    toggleAdvanced: document.getElementById("toggleAdvanced"),
    advancedFilters: document.getElementById("advancedFilters"),
  };

  function inferKind(resource) {
    const type = (resource.type || "").toLowerCase();
    const name = (resource.name || "").toLowerCase();
    const blob = type + name;

    if (/案例|实盘|回测|策略案例|待验证/.test(blob)) return "case";
    if (/教程|方法|文章|提示词|经验|非工具|阅读|线索/.test(blob)) return "tutorial";
    if (/工具|软件|开源|插件|cli|api|平台|仓库|repo/i.test(blob)) return "tool";
    if (resource.repo || resource.website) return "tool";
    return "tutorial";
  }

  function kindLabel(kind) {
    if (kind === "tool") return "工具";
    if (kind === "case") return "案例";
    return "教程/方法";
  }

  function searchBlob(resource) {
    return [
      resource.name,
      resource.description,
      resource.scenario,
      resource.category,
      resource.subcategory,
      resource.type,
      resource.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  function parseSortKey(sort) {
    const [field, dir] = sort.split("-");
    return { field, dir: dir === "desc" ? -1 : 1 };
  }

  function compareZh(a, b) {
    return (a || "").localeCompare(b || "", "zh-Hans-CN", { sensitivity: "base" });
  }

  function sortResources(list) {
    const { field, dir } = parseSortKey(state.sort);
    return [...list].sort((x, y) => {
      let cmp = 0;
      if (field === "name") cmp = compareZh(x.name, y.name);
      else if (field === "category") cmp = compareZh(x.category, y.category) || compareZh(x.name, y.name);
      else if (field === "checkedAt") {
        const ta = Date.parse(x.checkedAt || "") || 0;
        const tb = Date.parse(y.checkedAt || "") || 0;
        cmp = ta - tb;
      }
      return cmp * dir;
    });
  }

  function filteredResources() {
    const q = state.query.trim().toLowerCase();
    return state.resources.filter((r) => {
      if (state.category !== "all" && r.category !== state.category) return false;
      if (
        state.subcategory !== "all" &&
        (r.subcategory || "") !== state.subcategory
      ) {
        return false;
      }
      if (state.verified === "true" && !r.verified) return false;
      if (state.verified === "false" && r.verified) return false;
      if (state.statusKeyword !== "all") {
        const st = (r.status || "").toString();
        if (!st.includes(state.statusKeyword)) return false;
      }
      if (state.kind !== "all" && inferKind(r) !== state.kind) return false;
      if (q && !searchBlob(r).includes(q)) return false;
      return true;
    });
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderBadges(resource) {
    const kind = inferKind(resource);
    const verifiedBadge = resource.verified
      ? '<span class="badge verified">已实测</span>'
      : '<span class="badge unverified">未实测</span>';
    return `${verifiedBadge}<span class="badge kind-${kind}">${kindLabel(kind)}</span>`;
  }

  function categoryAccent(category) {
    if (category === "AI视频制作") return "#c41e3a";
    if (category === "交易分析") return "#0f766e";
    const s = category || "未分类";
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h + s.charCodeAt(i) * (i + 3)) % CAT_ACCENTS.length;
    return CAT_ACCENTS[h];
  }

  function shortCategory(category) {
    const c = category || "未分类";
    const part = c.split(/[\/·]/)[0].trim();
    return part.length > 10 ? part.slice(0, 10) + "…" : part;
  }

  function isDefaultView() {
    return (
      !state.query.trim() &&
      state.category === "all" &&
      state.subcategory === "all" &&
      state.verified === "all" &&
      state.statusKeyword === "all" &&
      state.kind === "all"
    );
  }

  function renderCardMarkup(resource, listIndex, layout) {
    const desc = escapeHtml(resource.description || resource.scenario || "（无简述）");
    const cat = escapeHtml(resource.category || "未分类");
    const status = escapeHtml(resource.status || "");
    const accent = categoryAccent(resource.category);
    const catShort = escapeHtml(shortCategory(resource.category));
    const subcat =
      resource.subcategory && (resource.category === "AI视频制作" || resource.category === "交易分析")
        ? `<span class="card-subcat">${escapeHtml(resource.subcategory)}</span>`
        : "";
    const stagger = Math.min(listIndex, 22) * 16;
    const layoutClass =
      layout === "lead" ? " card--lead" : layout === "wide" ? " card--wide" : "";
    return `<button type="button" class="card${layoutClass}" data-index="${listIndex}" style="--cat-accent: ${accent}; --stagger: ${stagger}ms" aria-label="查看详情：${escapeHtml(
      resource.name
    )}">
      <span class="card-cat-stripe" aria-hidden="true"></span>
      <div class="card-inner">
        <span class="card-cat-label">${catShort}</span>
        <h3 class="card-title">${escapeHtml(resource.name)}</h3>
        <div class="card-meta">${subcat}${cat}${status ? " · " + status : ""}</div>
        <p class="card-desc">${desc}</p>
        <div class="badge-row">${renderBadges(resource)}</div>
      </div>
    </button>`;
  }

  function renderCards(list) {
    if (!list.length) {
      els.bentoHero.hidden = true;
      els.bentoHero.innerHTML = "";
      els.cardGrid.innerHTML =
        '<p class="empty-hint">没有匹配结果，请调整搜索或筛选项。</p>';
      return;
    }

    const showHero = isDefaultView() && list.length >= 4;
    let gridList = list;

    if (showHero) {
      const heroes = list.slice(0, 2);
      gridList = list.slice(2);
      els.bentoHero.hidden = false;
      els.bentoHero.innerHTML = heroes
        .map((r, i) => renderCardMarkup(r, i, i === 0 ? "lead" : "wide"))
        .join("");
    } else {
      els.bentoHero.hidden = true;
      els.bentoHero.innerHTML = "";
    }

    const indexOffset = showHero ? 2 : 0;
    els.cardGrid.innerHTML = gridList
      .map((r, i) => {
        const listIndex = indexOffset + i;
        const layout = i % 7 === 0 ? "wide" : "normal";
        return renderCardMarkup(r, listIndex, layout);
      })
      .join("");
  }

  function handleCardActivate(e) {
    const card = e.target.closest(".card");
    if (!card) return;
    const idx = Number(card.dataset.index);
    const resource = visibleList[idx];
    if (resource) openDetail(resource);
  }

  function collectLinks(resource) {
    const links = [];
    const add = (label, href) => {
      if (href && typeof href === "string" && href.trim()) {
        links.push({ label, href: href.trim() });
      }
    };
    add("主链接", resource.url);
    add("仓库", resource.repo);
    add("官网/文档", resource.official || resource.website || resource.officialHelp);
    add("项目页", resource.projectUrl);
    add("X 来源", resource.xSource);
    if (Array.isArray(resource.xSources)) {
      resource.xSources.forEach((u, i) => add(`X 来源 ${i + 1}`, u));
    }
    if (Array.isArray(resource.officialReferences)) {
      resource.officialReferences.forEach((u, i) => add(`官方参考 ${i + 1}`, u));
    }
    add("证据链接", resource.evidenceUrl);
    add("原文", resource.originalUrl);
    return links.filter(
      (item, idx, arr) => arr.findIndex((x) => x.href === item.href) === idx
    );
  }

  function section(title, html) {
    if (!html) return "";
    return `<section class="detail-section"><h3>${escapeHtml(title)}</h3>${html}</section>`;
  }

  function renderList(items) {
    if (!items || !items.length) return "";
    return `<ul>${items.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>`;
  }

  function openDetail(resource) {
    els.detailTitle.textContent = resource.name || "未命名";
    els.detailBadges.innerHTML = renderBadges(resource);

    const caveat = resource.verified
      ? "<p>本条标记为已实测；仍请自行核对成本、配额与适用场景。</p>"
      : "<p class=\"caveat-inline\"><strong>未运行时验证：</strong>本站仅展示整理字段与阅读范围，未代替你执行注册、付费或 API 调用。</p>";

    const links = collectLinks(resource);
    const linkHtml = links.length
      ? `<ul class="link-list">${links
          .map(
            (l) =>
              `<li><strong>${escapeHtml(l.label)}：</strong><a href="${escapeHtml(
                l.href
              )}" target="_blank" rel="noopener noreferrer">${escapeHtml(l.href)}</a></li>`
          )
          .join("")}</ul>`
      : "<p>（无外链）</p>";

    const extraFields = [];
    const skip = new Set([
      "name",
      "description",
      "scenario",
      "category",
      "subcategory",
      "type",
      "status",
      "verified",
      "cost",
      "limits",
      "officialFacts",
      "notDone",
      "readScope",
      "checkedAt",
      "url",
      "repo",
      "official",
      "website",
      "xSource",
      "xSources",
      "projectUrl",
      "officialReferences",
      "evidenceUrl",
      "originalUrl",
    ]);
    Object.keys(resource)
      .sort()
      .forEach((key) => {
        if (skip.has(key)) return;
        const val = resource[key];
        if (val === "" || val == null) return;
        if (Array.isArray(val) && !val.length) return;
        const rendered =
          Array.isArray(val) ? renderList(val) : `<p>${escapeHtml(String(val))}</p>`;
        extraFields.push(section(key, rendered));
      });

    els.detailBody.innerHTML = [
      caveat,
      section(
        "分类与类型",
        `<p>${escapeHtml(resource.category || "")}${
          resource.subcategory ? ` · ${escapeHtml(resource.subcategory)}` : ""
        }</p><p>${escapeHtml(resource.type || "")}</p>`
      ),
      section("核实状态", `<p>${escapeHtml(resource.status || "（无）")}</p>`),
      section("描述", `<p>${escapeHtml(resource.description || "（无）")}</p>`),
      section(
        "适用场景",
        Array.isArray(resource.scenarios)
          ? renderList(resource.scenarios)
          : `<p>${escapeHtml(resource.scenario || "（无）")}</p>`
      ),
      section("成本", `<p>${escapeHtml(resource.cost || "（无）")}</p>`),
      section("官方要点", renderList(resource.officialFacts)),
      section("限制与保留", renderList(resource.limits)),
      section("未执行项", `<p>${escapeHtml(resource.notDone || "（无）")}</p>`),
      section("阅读范围", `<p>${escapeHtml(resource.readScope || "（无）")}</p>`),
      section("核对时间", `<p>${escapeHtml(resource.checkedAt || "（无）")}</p>`),
      section("链接", linkHtml),
      extraFields.join(""),
    ].join("");

    els.detailDrawer.hidden = false;
    els.detailDrawer.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => els.detailDrawer.classList.add("is-open"));
    document.body.style.overflow = "hidden";
    els.closeDrawer.focus();
  }

  function closeDetail() {
    els.detailDrawer.classList.remove("is-open");
    els.detailDrawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    window.setTimeout(() => {
      els.detailDrawer.hidden = true;
    }, 200);
  }

  let visibleList = [];

  function subcategoryCounts(parent) {
    const counts = Object.create(null);
    state.resources.forEach((r) => {
      if (r.category !== parent || !r.subcategory) return;
      counts[r.subcategory] = (counts[r.subcategory] || 0) + 1;
    });
    return counts;
  }

  function renderSubcategoryChips() {
    const parent = state.category;
    const order = SUBCATEGORIES[parent];
    if (!order) {
      els.subcategoryFieldset.hidden = true;
      state.subcategory = "all";
      return;
    }

    els.subcategoryFieldset.hidden = false;
    els.subcategoryFieldset.style.setProperty("--cat-accent", categoryAccent(parent));

    const counts = subcategoryCounts(parent);
    const subs = order.filter((label) => (counts[label] || 0) > 0);
    const allActive = state.subcategory === "all" ? " is-active" : "";
    const chips = subs
      .map((label) => {
        const active = state.subcategory === label ? " is-active" : "";
        const n = counts[label];
        return `<button type="button" class="chip${active}" data-subcategory="${escapeHtml(
          label
        )}">${escapeHtml(label)}<span class="chip-count">${n}</span></button>`;
      })
      .join("");

    els.subcategoryFilters.innerHTML = `<button type="button" class="chip${allActive}" data-subcategory="all">全部子类</button>${chips}`;

    els.subcategoryFilters.querySelectorAll(".chip").forEach((chip) => {
      chip.classList.toggle("is-active", chip.dataset.subcategory === state.subcategory);
    });
  }

  function refresh() {
    renderSubcategoryChips();
    const filtered = sortResources(filteredResources());
    visibleList = filtered;
    renderCards(filtered);
    els.resultCount.textContent = `显示 ${filtered.length} / ${state.resources.length} 条`;
  }

  function bindChipRow(container, attr, stateKey) {
    container.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn || !container.contains(btn)) return;
      container.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-active"));
      btn.classList.add("is-active");
      state[stateKey] = btn.dataset[attr];
      refresh();
    });
  }

  function buildCategoryChips(categories) {
    const allBtn = `<button type="button" class="chip is-active" data-category="all">全部分类</button>`;
    const chips = categories
      .map(
        (c) =>
          `<button type="button" class="chip" data-category="${escapeHtml(c)}">${escapeHtml(c)}</button>`
      )
      .join("");
    els.categoryFilters.innerHTML = allBtn + chips;
  }

  els.categoryFilters.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn || !els.categoryFilters.contains(btn)) return;
    els.categoryFilters.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-active"));
    btn.classList.add("is-active");
    state.category = btn.dataset.category;
    state.subcategory = "all";
    refresh();
  });

  els.subcategoryFilters.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn || !els.subcategoryFilters.contains(btn)) return;
    state.subcategory = btn.dataset.subcategory;
    els.subcategoryFilters.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-active"));
    btn.classList.add("is-active");
    refresh();
  });

  async function loadData() {
    const res = await fetch("data/resources.json");
    if (!res.ok) throw new Error("无法加载 data/resources.json");
    state.data = await res.json();
    state.resources = state.data.resources || [];
    const cats = [...new Set(state.resources.map((r) => r.category).filter(Boolean))].sort((a, b) =>
      compareZh(a, b)
    );
    const aiVideo = "AI视频制作";
    const trading = "交易分析";
    const pin = cats.indexOf(aiVideo);
    if (pin > 0) {
      cats.splice(pin, 1);
      cats.unshift(aiVideo);
    }
    const pinT = cats.indexOf(trading);
    if (pinT > 0) {
      cats.splice(pinT, 1);
      const afterAll = 0;
      cats.splice(afterAll + 1, 0, trading);
    }
    buildCategoryChips(cats);

    const meta = [];
    if (state.data.checkedAt) meta.push(`数据核对：${state.data.checkedAt}`);
    if (state.data.version != null) meta.push(`版本 v${state.data.version}`);
    meta.push(`共 ${state.resources.length} 条`);
    els.metaBar.textContent = meta.join(" · ");

    refresh();
  }

  els.searchInput.addEventListener("input", () => {
    state.query = els.searchInput.value;
    refresh();
  });

  els.sortSelect.addEventListener("change", () => {
    state.sort = els.sortSelect.value;
    refresh();
  });

  bindChipRow(els.verifiedFilters, "verified", "verified");
  bindChipRow(els.statusFilters, "status", "statusKeyword");
  bindChipRow(els.kindFilters, "kind", "kind");

  els.cardGrid.addEventListener("click", handleCardActivate);
  els.bentoHero.addEventListener("click", handleCardActivate);

  els.closeDrawer.addEventListener("click", closeDetail);
  els.drawerBackdrop.addEventListener("click", closeDetail);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !els.detailDrawer.hidden) closeDetail();
  });

  els.toggleAdvanced.addEventListener("click", () => {
    const open = els.advancedFilters.hidden;
    els.advancedFilters.hidden = !open;
    els.toggleAdvanced.setAttribute("aria-expanded", String(open));
    els.toggleAdvanced.textContent = open ? "收起筛选" : "更多筛选";
  });

  loadData().catch((err) => {
    els.cardGrid.innerHTML = `<p class="empty-hint">加载失败：${escapeHtml(err.message)}</p>`;
  });
})();
