# Sanford 的资源工具导航

可分享的静态导航站：在浏览器里搜索、按分类筛选、按核实状态过滤，并点开详情查看描述、限制、成本、官方要点与来源链接。数据全部保存在仓库内，无需后端或构建步骤。

**线上地址（启用 GitHub Pages 后）：** [https://sanford2020.github.io/resource-nav/](https://sanford2020.github.io/resource-nav/)

## 站点说明

- 标题：**Sanford 的资源工具导航**
- 当前收录 **88** 条资源，数据源为 [`data/resources.json`](data/resources.json)
- 除非条目 `verified: true`，否则表示**未在本导航流程中运行时实测**，仅为阅读与字段整理
- 卡片与详情会区分 **工具**、**教程/方法**、**案例**（根据 `type` 等字段启发式标注，仍以原文为准）

## 本地预览

在项目根目录启动任意静态服务器，例如：

```bash
python3 -m http.server 8080
```

浏览器打开 `http://localhost:8080/`。请通过 HTTP 访问（不要直接用 `file://` 打开），以便 `fetch('data/resources.json')` 正常工作。

## 如何新增或修改条目

1. 编辑 [`data/resources.json`](data/resources.json) 中 `resources` 数组
2. 每条记录建议至少包含：`name`、`category`、`type`、`description`、`scenario`、`status`、`verified`、`cost`、`url`（或 `repo` / `official` 等链接字段）
3. 可选数组字段示例：`limits`、`officialFacts`、`xSources`
4. 更新顶层 `checkedAt`、`version` 或 `total`（可选，便于读者识别批次）
5. 提交并推送到 `main`；GitHub Pages 会在数分钟内刷新

**请勿**在本仓库中添加未经验证的虚构资源、盗版或绕过付费墙类内容。

## 仓库结构

```
├── index.html          # 页面入口
├── styles.css          # 样式
├── app.js              # 搜索、筛选、排序与详情抽屉
├── data/resources.json # 资源数据（唯一数据源）
├── .nojekyll           # 禁用 Jekyll，便于根目录发布
└── README.md
```

## 启用 GitHub Pages

本仓库使用 **根目录** 发布（`main` 分支，路径 `/`）。

### 通过 GitHub 网页

1. 打开仓库 **Settings → Pages**
2. **Source**：Deploy from a branch
3. **Branch**：`main`，文件夹 **`/ (root)`**
4. 保存后等待部署，访问上方线上地址

### 通过 GitHub CLI（需仓库管理员权限）

```bash
gh api repos/Sanford2020/resource-nav/pages \
  -X POST \
  -f source[branch]=main \
  -f source[path]=/
```

若 API 返回权限错误，请使用网页方式设置。

## 功能一览

| 功能 | 说明 |
|------|------|
| 关键词搜索 | 名称、描述、场景、分类、类型、状态 |
| 分类标签 | 点击分类 chip 过滤 |
| 核实筛选 | 全部 / 已实测 / 未实测 |
| 状态关键词 | 匹配 `status` 字段常用用语 |
| 内容性质 | 偏工具 / 偏教程 / 偏案例 |
| 排序 | 名称、分类、核对时间 |
| 详情抽屉 | 描述、限制、成本、官方要点、全部链接与其它 JSON 字段 |

## 许可与免责

链接与描述来自公开来源与人工整理；**不代表对第三方产品或收益的承诺**。使用前请自行阅读服务条款、付费与合规要求。
