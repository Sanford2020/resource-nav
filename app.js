(function () {
  "use strict";

  const state = {
    data: null,
    resources: [],
    query: "",
    category: "all",
    verified: "all",
    statusKeyword: "all",
    kind: "all",
    sort: "name-asc",
  };

  const els = {
    metaBar: document.getElementById("metaBar"),
    searchInput: document.getElementById("searchInput"),
    categoryFilters: document.getElementById("categoryFilters"),
    verifiedFilters: document.getElementById("verifiedFilters"),
    statusFilters: document.getElementById("statusFilters"),
    kindFilters: document.getElementById("kindFilters"),
    sortSelect: document.getElementById("sortSelect"),
    resultCount: document.getElementById("resultCount"),
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

  function renderCards(list) {
    if (!list.length) {
      els.cardGrid.innerHTML =
        '<div class="empty-state"><p class="empty-title">没有匹配结果</p><p class="result-count">试试换个关键词，或把筛选重置为「全部」。</p></div>';
      return;
    }
    els.cardGrid.innerHTML = list
      .map((r, index) => {
        const kind = inferKind(r);
        const desc = escapeHtml(r.description || r.scenario || "（无简述）");
        const cat = escapeHtml(r.category || "未分类");
        const status = escapeHtml(r.status || "");
        const stagger = Math.min(index, 24) * 28;
        return `<button type="button" class="card card-kind-${kind}" data-index="${index}" style="--stagger:${stagger}ms" aria-label="查看详情：${escapeHtml(
          r.name
        )}">
          <span class="card-sheen" aria-hidden="true"></span>
          <span class="card-rail" aria-hidden="true"></span>
          <h3 class="card-title">${escapeHtml(r.name)}</h3>
          <div class="card-meta"><span class="card-cat">${cat}</span>${status ? '<span class="dot">·</span><span>' + status + "</span>" : ""}</div>
          <p class="card-desc">${desc}</p>
          <div class="badge-row">${renderBadges(r)}</div>
        </button>`;
      })
      .join("");
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
      section("分类与类型", `<p>${escapeHtml(resource.category || "")}</p><p>${escapeHtml(resource.type || "")}</p>`),
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
    }, 320);
  }

  let visibleList = [];

  function refresh() {
    const filtered = sortResources(filteredResources());
    visibleList = filtered;
    renderCards(filtered);
    els.resultCount.innerHTML = `<span class="count-chip">显示 <strong>${filtered.length}</strong> / ${state.resources.length} 条</span>`;
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
    els.categoryFilters.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      els.categoryFilters.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-active"));
      btn.classList.add("is-active");
      state.category = btn.dataset.category;
      refresh();
    });
  }

  async function loadData() {
    const res = await fetch("data/resources.json");
    if (!res.ok) throw new Error("无法加载 data/resources.json");
    state.data = await res.json();
    state.resources = state.data.resources || [];
    const cats = [...new Set(state.resources.map((r) => r.category).filter(Boolean))].sort((a, b) =>
      compareZh(a, b)
    );
    buildCategoryChips(cats);

    const parts = [];
    if (state.data.checkedAt) parts.push(`<span class="meta-pill">数据核对 ${escapeHtml(state.data.checkedAt)}</span>`);
    if (state.data.version != null) parts.push(`<span class="meta-pill">版本 v${escapeHtml(String(state.data.version))}</span>`);
    parts.push(`<span class="meta-pill meta-pill-accent">共 ${state.resources.length} 条</span>`);
    els.metaBar.innerHTML = parts.join("");

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

  els.cardGrid.addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    if (!card) return;
    const idx = Number(card.dataset.index);
    const resource = visibleList[idx];
    if (resource) openDetail(resource);
  });

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
    els.cardGrid.innerHTML = `<p class="result-count">加载失败：${escapeHtml(err.message)}</p>`;
  });
})();
