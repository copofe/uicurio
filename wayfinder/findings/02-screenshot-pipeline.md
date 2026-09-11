# Research: 02-screenshot-pipeline —— 自动截图管线选型（wayfinder 票 02）

> 执行说明：与票 01 相同，因 researcher 子代理工具注册故障改由主管主会话代跑。取证时间 2026-09-11。

## Summary（定稿）

**本地 Playwright 脚本 + sharp 转 WebP（主）/ AVIF（可选档）+ 图入 git 仓库（`assets/shots/<slug>.webp`）**；脚本双入口：全量批跑（扫 `data/items/`）与单条补拍（`-- <slug>`）；云截图 API 仅作零安装备选，不进主路。

一句话理由：截图是本地可算的事，边际成本应为零；100+ 张 × <150KB 的量级离「需要对象存储/云服务」的门槛还很远，入库反而换来版本化、可评审、可回滚。

## Findings

### 1. 手段对比

| | 本地 Playwright | 云截图 API（以 ScreenshotOne 为例） |
| --- | --- | --- |
| 成本 | 免费（Apache-2.0，Node 依赖） | 免费档 **100 张/月**，付费档另计（官方 FAQ） |
| 质量/可控 | 视口、等待、裁切、逐项参数全可控 | 参数化程度高但黑盒 |
| 维护面 | 依赖升级 + 无头浏览器二进制更新 | 零维护，但引入外部依赖与配额心智 |
| 批量 | 无限 | 受配额限制 |

Sources: [Playwright Screenshots](https://playwright.dev/docs/screenshots) · [ScreenshotOne Pricing/FAQ](https://screenshotone.com/pricing/)

### 2. 拍摄策略（对「动效组件站」的针对性）

- **视口**：1280×800（16:10）× `deviceScaleFactor: 2` → 2560×1600 视网膜底图；只截首屏（`clip` 或默认视口），**不用 `fullPage`**——封面要的是构图，不是长图。
- **等待**：`goto(url, { waitUntil: 'networkidle' })` + 固定延时让入场动画到稳态（Playwright 官方定义 networkidle = 500ms 无网络请求）；banner 轮播类截哪一帧无通用解，脚本留 **per-item 可覆盖的等待/延时参数**（数据文件里 `screenshot: { delay, waitMs }` 覆盖默认值）。
- 置信度说明：networkidle 语义为官方文档；「延时到稳态」对各类动效站的有效性属施工期实测项（见 Missing evidence）。

### 3. 产物

- **sharp** 官方确认支持 WebP / AVIF 输出（按扩展名推断或 `toFormat`），默认剥离元数据。Source: [sharp API: Output](https://sharp.pixelplumbing.com/api-output/)
- 主格式 **WebP quality ~80**，单张目标 <150KB；AVIF 作可选增强档（构建产物再决定是否双出）。
- 命名 `<slug>.webp`，与票 03 数据模型的 `assets/shots/<slug>` 约定对齐。

### 4. 存放：git 仓库内（现在），R2 是量级触发而非默认

- 100+ 条 × <150KB ≈ **<15MB** 总量：CF Pages 免费档 20,000 文件 / 25 MiB 单文件（票 01 取证）毫无压力；git diff 可评审、回滚、离线。
- R2 免费档（10 GB 存储、egress 免费，官方）：当收藏到 ~1000 张量级或出现视频素材时再迁移——**天平远未到**。
- PNG 直出被否：同构图体积大 5-10 倍，仓库与构建产物双亏。

### 5. 入口设计

```bash
npm run shots            # 全量：遍历 data/items/*.json，跳过已有且未过期的
npm run shots -- <slug>  # 单条：新增/重拍一个
```

单一脚本（Playwright + sharp 组合）两个入口，自动入库管线（票 06）直接调用单条入口。

## 被否清单（一项一句话）

- **云截图 API 主路**：按张计费/配额制，本地可算的事背第三方依赖不划算。
- **R2 现在上**：15MB 量级用对象存储是杀鸡用牛刀，且丢掉版本化。
- **PNG 直出 / 不压缩**：体积失控，仓库和构建双输。
- **全页截图**：封面要构图不要长图，首屏裁切即可。

## Missing evidence

- 各类动效站（轮播/3D/鼠标跟随）在无头渲染下的稳态时刻需施工期逐类实测调参；per-item 覆盖参数即为兜底设计。
- AVIF 编码在 sharp 下的耗时（约为 WebP 数倍）未实测，若批跑过慢可降级只出 WebP。
