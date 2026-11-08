// H3 出片产线 —— 把 svpipe 那套 H3 链路搬进画布。
//
// ============================================================================
// 为什么是「原生插件」而不是一段脚本插件
// ----------------------------------------------------------------------------
// 画布原先挂 H3 的方式是一段 1997 字符的 JS 脚本（lib/canvas_channels.py 里
// 那个 _SCRIPT_VIDEO_H3）：一次 HTTP 调用 + 轮询，能文生 / 首帧 / 参考图。
// 它缺的不是「能不能生成」，而是这四件事全都做不到：
//
//   · 素材桶      脚本插件拿不到「角色 15 / 场景 1 / 产品 5」这份清单，
//                 用户每换一次参考图都得自己去文件系统里找路径。
//   · 双模式分流  首尾帧和全能参考是互斥的，脚本插件只能用单选框糊过去，
//                 选错了要等后端 400 才知道。
//   · 微修改      脚本插件跑完只留一个视频 URL 在节点里，提示词 / 分辨率 /
//                 时长 / 参考素材全丢了 —— 想「改一句话重跑」得从头再填一遍。
//   · 批量化      一个节点一次只能提交一条，没有逐条回执，没有单条重试。
//
// 这四件事都要节点 UI 层的能力（ctx.updateMetadata 保参数、ctx.applyOps 生成
// 独立成片节点），脚本插件拿不到，所以改写成原生插件。
//
// ============================================================================
// 「微修改」是怎么落地的
// ----------------------------------------------------------------------------
// metadata.h3 存**全套**生成参数：
//     params: { prompt, mode, resolution, ratio, duration,
//               images[], videos[], audios[], firstFrame, lastFrame }
//     result: { taskId, file, url, pointsEst, seconds, finishedAt }
//
// 所以「再生成一次」= 把 params 原样提交，只改用户动过的那一项。
// 参考素材、时长、比例都不用重选 —— 这才是微修改，不是重做。
// 批量出的每条片子也是独立节点，各自带 params，所以每条都能单独改。
//
// ============================================================================
// 「批量化」是怎么落地的
// ----------------------------------------------------------------------------
// 面板里多行提示词，一行 = 一条片。公共参数从当前表单带过去，只有提示词不同。
// 提交前**整批预校验**（后端 validate_batch）：一条不合法就整批不提交，
// 不会出现「前 3 条跑完、75 积分已扣、第 4 条才发现参数错」的半成品状态。
// 跑完后每条成功的片子都在画布上生成独立视频节点，各自可单独微修改重跑。
//
// ============================================================================
// 状态为什么不写 metadata.status
// ----------------------------------------------------------------------------
// 画布的节点渲染器在插件 Content 之前会拦一道：
//     if (metadata.status === "loading") return <LoadingContent/>
//     if (metadata.status === "error")  return <ErrorContent onRetry={...}/>
// 那个 ErrorContent 的重试按钮走宿主 handleRetryNode —— 对非内置节点它走的是
// 「AI 生成」那一套（会弹模型配置框）。对本节点是错的。
// 所以状态单独存 metadata.h3.status，不碰内置字段。

import { definePlugin, useState, useEffect, useRef } from "@infinite-canvas/plugin-sdk";
import type {
    CanvasNodeContentProps,
    CanvasNodePanelProps,
    CanvasNodeContext,
    CanvasNodeMetadata,
} from "@infinite-canvas/plugin-sdk";

// ---------------------------------------------------------------- 常量

const API = "/api/canvas/h3";

type Mode = "text" | "frames" | "reference";

const MODE_LABEL: Record<Mode, string> = {
    text: "文生视频",
    frames: "首尾帧",
    reference: "全能参考",
};

const MODE_HINT: Record<Mode, string> = {
    text: "只有一句提示词，画面全靠模型自己造",
    frames: "一张首帧 / 一张尾帧，模型在两端之间补运动",
    reference: "给角色 / 产品 / 场景图，模型照着这些素材演",
};

type Asset = {
    id: string;
    name: string;
    kind: "image" | "video" | "audio";
    bytes: number;
    source: string;
    url: string;
};

type Bucket = {
    kind: string;
    label: string;
    icon: string;
    hint: string;
    items: Asset[];
    count: number;
};

type Caps = {
    model: string;
    resolutions: string[];
    ratios: string[];
    points_per_second: Record<string, number>;
    duration_range: [number, number];
    limits: { images: number; videos: number; audios: number; total: number; first_frame: number; last_frame: number };
    key_configured: boolean;
};

type H3Params = {
    prompt: string;
    mode: Mode;
    resolution: string;
    ratio: string;
    duration: number;
    images: string[];
    videos: string[];
    audios: string[];
    firstFrame: string;
    lastFrame: string;
};

type H3Result = {
    taskId?: string;
    file?: string;
    url?: string;
    pointsEst?: number;
    seconds?: number;
    finishedAt?: string;
    resolution?: string;
    ratio?: string;
};

type BatchItemView = {
    index: number;
    label: string;
    ok?: boolean;
    error?: string;
    prompt?: string;
    url?: string;
    pointsEst?: number;
};

type H3State = {
    params: H3Params;
    result?: H3Result;
    status?: "idle" | "running" | "success" | "error";
    error?: string;
    logs?: string[];
    jobId?: string;
    batchJobId?: string;
    batch?: { id?: string; total: number; okCount?: number; status?: string; items: BatchItemView[] };
};

const FALLBACK_CAPS: Caps = {
    model: "MiniMax-H3",
    resolutions: ["480P", "768P", "1080P", "2K", "4K"],
    ratios: ["adaptive", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"],
    points_per_second: { "480P": 5, "768P": 10, "1080P": 19, "2K": 20, "4K": 22 },
    duration_range: [4, 30],
    limits: { images: 9, videos: 3, audios: 3, total: 12, first_frame: 1, last_frame: 1 },
    key_configured: false,
};

const DEFAULT_PARAMS: H3Params = {
    prompt: "",
    mode: "text",
    resolution: "480P",
    ratio: "9:16",
    duration: 5,
    images: [],
    videos: [],
    audios: [],
    firstFrame: "",
    lastFrame: "",
};

// ---------------------------------------------------------------- 小工具

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function readState(node: { metadata?: CanvasNodeMetadata }): H3State {
    const raw = (node.metadata?.h3 || {}) as Partial<H3State>;
    const p = (raw.params || {}) as Partial<H3Params>;
    return {
        params: {
            ...DEFAULT_PARAMS,
            ...p,
            images: Array.isArray(p.images) ? p.images : [],
            videos: Array.isArray(p.videos) ? p.videos : [],
            audios: Array.isArray(p.audios) ? p.audios : [],
        },
        result: raw.result,
        status: raw.status,
        error: raw.error,
        logs: raw.logs,
        jobId: raw.jobId,
        batchJobId: raw.batchJobId,
        batch: raw.batch,
    };
}

function bytesText(n: number): string {
    if (!n) return "";
    if (n < 1024) return `${n} B`;
    if (n < 1048576) return `${(n / 1024).toFixed(0)} KB`;
    return `${(n / 1048576).toFixed(1)} MB`;
}

async function getJson<T>(url: string): Promise<T> {
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((j as { error?: string })?.error || `HTTP ${r.status}`);
    return j as T;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
    const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((j as { error?: string })?.error || `HTTP ${r.status}`);
    return j as T;
}

type JobView = { status?: string; error?: string; result?: unknown; logs?: string[] };

// 轮询一个后台任务到终态。
// ★ 为什么是轮询而不是一个长请求：H3 一条片 2~5 分钟，批量更久。
//   HTTP 连接挂三五分钟，浏览器 / 代理 / 服务线程池每一层都在赌超时，
//   而且任何一层断了用户只看到「点了没反应」，额度照烧。
async function waitJob(jobId: string, onTick: (job: JobView) => void, timeoutMs = 45 * 60 * 1000): Promise<JobView> {
    const t0 = Date.now();
    for (;;) {
        const job = await getJson<JobView>(`/api/jobs/${jobId}`);
        onTick(job);
        const st = String(job.status || "");
        if (st === "done") return job;
        if (st === "error") throw new Error(job.error || "生成失败（无详细原因）");
        if (st === "cancelled") throw new Error("任务已取消");
        if (Date.now() - t0 > timeoutMs) throw new Error("等待超时");
        await sleep(5000);
    }
}

// 面板状态 → 后端 body。
// ★ 白名单式取字段，只在「当前模式该有的东西」才带上。后端确实会拦
//   （build_request 里首尾帧与参考素材互斥是硬校验），但如果前端把
//   「切模式前选的 3 张参考图」也一起发过去，用户会收到一个莫名其妙的
//   400：他明明已经切成首尾帧了，界面上也没显示参考图。
function toBody(p: H3Params, nodeId = ""): Record<string, unknown> {
    const base: Record<string, unknown> = {
        mode: p.mode,
        resolution: p.resolution,
        ratio: p.ratio,
        duration: p.duration,
        prompt: p.prompt.trim(),
    };
    if (nodeId) base.node_id = nodeId;
    if (p.mode === "frames") {
        if (p.firstFrame) base.first_frame = p.firstFrame;
        if (p.lastFrame) base.last_frame = p.lastFrame;
    }
    if (p.mode === "reference") {
        if (p.images.length) base.images = p.images;
        if (p.videos.length) base.videos = p.videos;
        if (p.audios.length) base.audios = p.audios;
    }
    return base;
}

function estPoints(p: H3Params, caps: Caps): number {
    return (caps.points_per_second[p.resolution] || 0) * p.duration;
}

// ---------------------------------------------------------------- 样式

function useStyles(ctx: CanvasNodeContext) {
    const t = ctx.theme;
    return {
        t,
        btn: {
            padding: "5px 12px",
            borderRadius: 8,
            border: `1px solid ${t.node.stroke}`,
            background: t.toolbar.panel,
            color: t.node.text,
            cursor: "pointer",
            fontSize: 12,
            lineHeight: 1.4,
        } as const,
        btnPrimary: {
            padding: "7px 16px",
            borderRadius: 9,
            border: "none",
            background: "#2563eb",
            color: "#fff",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
        } as const,
        btnGhost: {
            padding: "4px 10px",
            borderRadius: 7,
            border: `1px solid ${t.node.stroke}`,
            background: "transparent",
            color: t.node.muted,
            cursor: "pointer",
            fontSize: 11,
        } as const,
        input: {
            width: "100%",
            boxSizing: "border-box",
            padding: "7px 9px",
            borderRadius: 8,
            border: `1px solid ${t.node.stroke}`,
            background: t.toolbar.panel,
            color: t.node.text,
            fontSize: 13,
            outline: "none",
        } as const,
        select: {
            padding: "5px 8px",
            borderRadius: 8,
            border: `1px solid ${t.node.stroke}`,
            background: t.toolbar.panel,
            color: t.node.text,
            fontSize: 12,
            outline: "none",
            cursor: "pointer",
        } as const,
        card: {
            borderRadius: 12,
            border: `1px solid ${t.node.stroke}`,
            background: t.node.fill,
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            boxShadow: "0 12px 40px rgba(0,0,0,.14)",
            // ★ 面板必须自己封顶。
            //   宿主把这个面板挂在节点下方（top-full），再用 scale(1/画布缩放)
            //   反缩放成固定 600px 宽 —— 但它**不给高度上限**，也没有
            //   「面板比窗口高就上移视口」的逻辑（measureFocusFrame 只在
            //   双击/聚焦时算一次）。
            //   实测：文生视频 397px、首尾帧 667px、全能参考 886px、
            //   再开批量+历史 1313px —— 窗口才 1000px，最后一种状态
            //   上溢 298px、下溢 15px，「提交批量」和「历史成片」根本滑不到。
            //   所以这里自己封 68vh + 内部滚动。vh 在这里是屏幕像素：
            //   外层已经用 1/scale 反缩放过，布局像素 = 屏幕像素。
            maxHeight: "68vh",
            overflowY: "auto",
            overflowX: "hidden",
        } as const,
        label: { fontSize: 11, color: t.node.muted, marginBottom: 4, display: "block" } as const,
    };
}

// ---------------------------------------------------------------- Content

function H3Content({ ctx }: CanvasNodeContentProps) {
    const st = readState(ctx.node);
    const url = st.result?.url || ctx.node.metadata?.content || "";
    const t = ctx.theme;

    if (st.status === "running") {
        const last = (st.logs || []).slice(-1)[0] || "正在出片…";
        return (
            <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 16, boxSizing: "border-box", color: t.node.text }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", border: `3px solid ${t.node.stroke}`, borderTopColor: "#2563eb", animation: "h3p-spin 1s linear infinite" }} />
                <div style={{ fontSize: 12, color: t.node.muted, textAlign: "center", lineHeight: 1.5 }}>{last}</div>
                <div style={{ fontSize: 11, color: t.node.faint }}>H3 一条片 2~5 分钟</div>
            </div>
        );
    }

    if (st.status === "error" && st.error) {
        return (
            <div style={{ height: "100%", width: "100%", padding: 14, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 8, color: t.node.text }}>
                <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>出片失败</div>
                <div onWheel={(e) => e.stopPropagation()} style={{ flex: 1, overflow: "auto", fontSize: 11, lineHeight: 1.6, color: t.node.muted, whiteSpace: "pre-wrap" }}>
                    {st.error}
                </div>
            </div>
        );
    }

    if (url) {
        return (
            <div style={{ height: "100%", width: "100%", position: "relative", display: "flex", flexDirection: "column", background: "#000", borderRadius: "inherit", overflow: "hidden" }}>
                <video
                    src={url}
                    controls
                    playsInline
                    data-canvas-no-zoom
                    data-canvas-video={ctx.node.id}
                    style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
                    onMouseDown={(e) => e.stopPropagation()}
                />
                <div style={{ position: "absolute", left: 8, bottom: 8, display: "flex", gap: 6, pointerEvents: "none" }}>
                    <span style={{ padding: "2px 7px", borderRadius: 6, background: "rgba(0,0,0,.66)", color: "#fff", fontSize: 10 }}>
                        {MODE_LABEL[st.params.mode]} · {st.result?.resolution || st.params.resolution} · {st.result?.seconds || st.params.duration}s
                    </span>
                    {st.result?.pointsEst ? (
                        <span style={{ padding: "2px 7px", borderRadius: 6, background: "rgba(0,0,0,.66)", color: "#fbbf24", fontSize: 10 }}>
                            {st.result.pointsEst} 分
                        </span>
                    ) : null}
                </div>
            </div>
        );
    }

    const sum = st.params.mode === "frames"
        ? [st.params.firstFrame, st.params.lastFrame].filter(Boolean).length
        : st.params.images.length + st.params.videos.length + st.params.audios.length;

    return (
        <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 18, boxSizing: "border-box", color: t.node.muted }}>
            <div style={{ fontSize: 26, opacity: 0.5 }}>🎬</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: t.node.text }}>{MODE_LABEL[st.params.mode]}</div>
            <div style={{ fontSize: 11, lineHeight: 1.6, textAlign: "center", maxWidth: 240, color: t.node.muted }}>
                {st.params.prompt ? st.params.prompt.slice(0, 64) + (st.params.prompt.length > 64 ? "…" : "") : "点开面板写提示词、挑素材"}
            </div>
            <div style={{ fontSize: 10, color: t.node.faint }}>
                {st.params.resolution} · {st.params.ratio} · {st.params.duration}s · 参考 {sum} 件
            </div>
        </div>
    );
}

// ---------------------------------------------------------------- 素材选择器

type Styles = ReturnType<typeof useStyles>;

function AssetPicker(props: {
    ctx: CanvasNodeContext;
    buckets: Bucket[];
    single?: boolean;
    value: string[];
    kinds: Array<"image" | "video" | "audio">;
    onChange: (next: string[]) => void;
    capacity: number;
    s: Styles;
}) {
    const { ctx, buckets, single, value, kinds, onChange, capacity, s } = props;
    const [tab, setTab] = useState(0);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState("");

    // 只留下「有这类素材」或「本来就是上传桶」的分组 —— 视频 / 音频两个桶
    // 现在是空的，但必须留着，否则连上传入口都没有。
    const usable = buckets.filter((b) => b.items.some((it) => kinds.includes(it.kind)) || b.kind === "video" || b.kind === "audio");
    const cur = usable[Math.min(tab, Math.max(0, usable.length - 1))];
    const list = cur ? cur.items.filter((it) => kinds.includes(it.kind)) : [];

    const toggle = (id: string) => {
        if (single) {
            onChange([value[0] === id ? "" : id]);
            return;
        }
        if (value.includes(id)) onChange(value.filter((v) => v !== id));
        else if (value.length >= capacity) setMsg(`最多 ${capacity} 个`);
        else onChange([...value, id]);
    };

    // 上传到 out/h3/uploads —— 不给上传入口的话「参考运镜」「参考音色」
    // 两个功能等于不存在（那两个桶现在都是空目录）。
    const upload = async (file: File) => {
        setBusy(true);
        setMsg("");
        try {
            const r = await fetch(`/api/h3/upload?name=${encodeURIComponent(file.name)}`, { method: "POST", body: file });
            const j = await r.json();
            if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
            onChange(single ? [j.id] : [...value, j.id].slice(0, capacity));
            setMsg(`已上传 ${j.name}`);
            ctx.emit("h3p-asset-uploaded", j);
        } catch (e) {
            setMsg(`上传失败：${(e as Error).message}`);
        } finally {
            setBusy(false);
        }
    };

    const accept = kinds.includes("video") ? "video/*" : kinds.includes("audio") ? "audio/*" : "image/*";

    return (
        <div data-canvas-no-zoom onMouseDown={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                {usable.map((b, i) => (
                    <button
                        key={b.kind}
                        type="button"
                        onClick={() => setTab(i)}
                        style={{
                            ...s.btn,
                            padding: "3px 9px",
                            fontSize: 11,
                            background: i === tab ? ctx.theme.toolbar.activeBg : "transparent",
                            color: i === tab ? ctx.theme.toolbar.activeText : ctx.theme.node.muted,
                            borderColor: i === tab ? ctx.theme.node.activeStroke : ctx.theme.node.stroke,
                        }}
                    >
                        {b.icon} {b.label} <span style={{ opacity: 0.6 }}>{b.items.filter((it) => kinds.includes(it.kind)).length}</span>
                    </button>
                ))}
                <label style={{ ...s.btnGhost, display: "inline-flex", alignItems: "center", gap: 4, opacity: busy ? 0.5 : 1 }}>
                    {busy ? "上传中…" : "＋ 上传"}
                    <input
                        type="file"
                        accept={accept}
                        style={{ display: "none" }}
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void upload(f);
                            e.target.value = "";
                        }}
                    />
                </label>
                {value.length ? (
                    <button type="button" style={s.btnGhost} onClick={() => onChange([])}>
                        清空（{value.length}）
                    </button>
                ) : null}
            </div>

            {cur ? (
                <div style={{ maxHeight: 172, overflow: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(66px, 1fr))", gap: 6, padding: 2 }}>
                    {list.map((it) => {
                        const on = value.includes(it.id);
                        return (
                            <button
                                key={it.id}
                                type="button"
                                title={`${it.name} · ${bytesText(it.bytes)} · ${it.source}`}
                                onClick={() => toggle(it.id)}
                                style={{
                                    position: "relative",
                                    padding: 0,
                                    border: `2px solid ${on ? "#2563eb" : ctx.theme.node.stroke}`,
                                    borderRadius: 8,
                                    overflow: "hidden",
                                    background: ctx.theme.toolbar.panel,
                                    cursor: "pointer",
                                    height: 62,
                                }}
                            >
                                {it.kind === "image" ? (
                                    <img src={it.url} alt={it.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                ) : (
                                    <span style={{ display: "grid", placeItems: "center", height: "100%", fontSize: 18, color: ctx.theme.node.muted }}>
                                        {it.kind === "video" ? "▶" : "♪"}
                                    </span>
                                )}
                                {on ? (
                                    <span style={{ position: "absolute", right: 2, top: 2, width: 15, height: 15, borderRadius: "50%", background: "#2563eb", color: "#fff", fontSize: 10, lineHeight: "15px", textAlign: "center" }}>
                                        ✓
                                    </span>
                                ) : null}
                            </button>
                        );
                    })}
                    {list.length === 0 ? (
                        <div style={{ gridColumn: "1 / -1", padding: "18px 0", textAlign: "center", fontSize: 11, color: ctx.theme.node.placeholder }}>
                            这个桶是空的 —— 用上面的「＋ 上传」放一个进来
                        </div>
                    ) : null}
                </div>
            ) : (
                <div style={{ fontSize: 11, color: ctx.theme.node.placeholder }}>没有可用的素材桶</div>
            )}

            {msg ? <div style={{ fontSize: 10, color: msg.startsWith("上传失败") ? "#dc2626" : ctx.theme.node.muted }}>{msg}</div> : null}
        </div>
    );
}

// ---------------------------------------------------------------- Panel

function H3Panel({ ctx, onClose }: CanvasNodePanelProps) {
    const s = useStyles(ctx);
    const t = ctx.theme;

    const stRef = useRef<H3State>(readState(ctx.node));
    const [st, setSt] = useState<H3State>(stRef.current);

    const [caps, setCaps] = useState<Caps>(FALLBACK_CAPS);
    const [buckets, setBuckets] = useState<Bucket[]>([]);
    const [points, setPoints] = useState<number | null>(null);
    const [clips, setClips] = useState<Array<{ name: string; url: string; bytes: number }>>([]);
    const [loadErr, setLoadErr] = useState("");
    const [batchOpen, setBatchOpen] = useState(false);
    const [batchText, setBatchText] = useState("");
    const [historyOpen, setHistoryOpen] = useState(false);

    // ★ 每次渲染都同步一次 ref。轮询回调与异步分支都靠它读最新值，
    //   否则拿到的是挂载那一刻的闭包快照（典型症状：日志永远停在第一条）。
    stRef.current = st;

    const apply = (patch: Partial<H3State>, extraMeta?: CanvasNodeMetadata) => {
        const next = { ...stRef.current, ...patch };
        stRef.current = next;
        setSt(next);
        const meta: CanvasNodeMetadata = { ...(extraMeta || {}), h3: next as unknown as Record<string, unknown> };
        ctx.updateMetadata(meta);
    };
    const patchParams = (p: Partial<H3Params>) => {
        apply({ params: { ...stRef.current.params, ...p } });
    };

    const refresh = async () => {
        try {
            const d = await getJson<{ caps: Caps; buckets: Bucket[]; points: { available_points?: number } | null; clips: Array<{ name: string; url: string; bytes: number }> }>(`${API}/state`);
            setCaps({ ...FALLBACK_CAPS, ...d.caps });
            setBuckets(d.buckets || []);
            setPoints(d.points?.available_points ?? null);
            setClips(d.clips || []);
            setLoadErr("");
        } catch (e) {
            setLoadErr((e as Error).message);
        }
    };

    useEffect(() => {
        void refresh();
        // 只跑一次：素材桶的变化用「＋上传」后手动刷新就够，
        // 每次渲染都拉一遍 20 多张缩略图的清单没必要。
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---- 单条任务轮询（关掉面板再打开能继续跟）
    useEffect(() => {
        const jid = st.jobId;
        if (!jid) return;
        let alive = true;
        (async () => {
            try {
                const job = await waitJob(jid, (j) => {
                    if (!alive) return;
                    const logs = (j.logs || []).slice(-4);
                    if (logs.length) {
                        const next = { ...stRef.current, logs };
                        stRef.current = next;
                        setSt(next);
                    }
                });
                const res = (job.result || {}) as Record<string, unknown>;
                const url = String(res.url || "");
                if (!url) throw new Error("任务完成但没有成片地址");
                const result: H3Result = {
                    taskId: String(res.task_id || ""),
                    file: String(res.file || ""),
                    url,
                    pointsEst: Number(res.points_est || 0),
                    seconds: Number(res.seconds || stRef.current.params.duration),
                    finishedAt: String(res.finished_at || ""),
                    resolution: String(res.resolution || stRef.current.params.resolution),
                    ratio: String(res.ratio || stRef.current.params.ratio),
                };
                // ★ 成片写回 metadata.content —— 这是画布的资源契约：
                //   下游节点读 content，不读我们自定义的 h3 字段。
                //   metadata.prompt 也一起写，搜索 / 列表里才看得到这条片讲什么。
                apply({ status: "success", result, error: undefined, logs: [], jobId: undefined }, { content: url, prompt: stRef.current.params.prompt });
                void refresh();
            } catch (e) {
                if (!alive) return;
                apply({ status: "error", error: (e as Error).message, jobId: undefined });
            }
        })();
        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [st.jobId]);

    // ---- 批量轮询
    useEffect(() => {
        const jid = st.batchJobId;
        if (!jid) return;
        let alive = true;
        (async () => {
            try {
                const job = await waitJob(jid, () => undefined, 90 * 60 * 1000);
                const res = (job.result || {}) as {
                    batch_id?: string;
                    total?: number;
                    ok_count?: number;
                    items?: Array<{ index: number; label: string; ok: boolean; error?: string; result?: Record<string, unknown> }>;
                };
                const items: BatchItemView[] = (res.items || []).map((it) => ({
                    index: it.index,
                    label: it.label,
                    ok: it.ok,
                    error: it.error,
                    prompt: String((it.result || {}).prompt || ""),
                    url: String((it.result || {}).url || ""),
                    pointsEst: Number((it.result || {}).points_est || 0),
                }));
                apply({
                    batchJobId: undefined,
                    batch: {
                        id: res.batch_id,
                        total: res.total || items.length,
                        okCount: res.ok_count ?? items.filter((i) => i.ok).length,
                        status: "done",
                        items,
                    },
                });
                spawnNodes(items);
                void refresh();
            } catch (e) {
                if (!alive) return;
                const prev = stRef.current.batch;
                apply({
                    batchJobId: undefined,
                    error: (e as Error).message,
                    batch: prev ? { ...prev, status: "error" } : { total: 0, status: "error", items: [] },
                });
            }
        })();
        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [st.batchJobId]);

    // 批量里每一条成功片 → 画布上一个独立节点。
    // ★ 为什么不把 N 条塞进同一个节点的列表里：
    //   用户要的是「批量 ×N」+「微修改继续生成」两件事合起来 ——
    //   批量出 8 条，然后挑其中一条改一句话重跑。
    //   只有每条都是独立节点、各自带完整 params，这件事才做得到。
    const spawnNodes = (items: BatchItemView[]) => {
        const ok = items.filter((i) => i.ok && i.url);
        if (!ok.length) return;
        const baseParams = stRef.current.params;
        ctx.applyOps(
            ok.map((it, k) => ({
                type: "add_node" as const,
                nodeType: "h3-pipeline:video",
                title: `H3 ${(it.prompt || it.label).slice(0, 12)}`,
                x: ctx.node.position.x + ctx.node.width + 90,
                y: ctx.node.position.y + k * 300,
                width: 300,
                height: 410,
                metadata: {
                    content: it.url,
                    prompt: it.prompt,
                    h3: {
                        params: { ...baseParams, prompt: it.prompt || baseParams.prompt },
                        result: { url: it.url, pointsEst: it.pointsEst },
                        status: "success",
                    } as unknown as Record<string, unknown>,
                },
            })),
        );
        ctx.emit("h3p-batch-spawned", { count: ok.length });
    };

    const submit = async (override?: Partial<H3Params>) => {
        const p = { ...stRef.current.params, ...(override || {}) };
        if (!p.prompt.trim()) {
            apply({ status: "error", error: "先写一句提示词" });
            return;
        }
        apply({ status: "running", error: undefined, logs: ["提交中…"], params: p });
        try {
            const r = await postJson<{ job?: string; points_est?: number; error?: string }>(`${API}/gen`, toBody(p, ctx.node.id));
            if (!r.job) throw new Error(r.error || "提交失败（没有 job id）");
            apply({ jobId: r.job });
        } catch (e) {
            apply({ status: "error", error: (e as Error).message });
        }
    };

    const cancel = async () => {
        const jid = stRef.current.jobId;
        if (!jid) return;
        try {
            await postJson(`/api/jobs/${jid}/cancel`, {});
        } catch {
            /* 任务可能已经结束 */
        }
    };

    const submitBatch = async () => {
        const lines = batchText.split("\n").map((x) => x.trim()).filter(Boolean);
        if (lines.length < 2) {
            apply({ error: "批量至少要两行提示词（一行 = 一条片）" });
            return;
        }
        const base = toBody(stRef.current.params, "");
        // 批量只传公共参数；提示词逐条给。mode / resolution / ratio / duration /
        // 参考素材全部沿用当前表单 —— 用户不需要为 8 条变体重选 8 次素材。
        delete base.prompt;
        apply({ error: undefined });
        try {
            const r = await postJson<{
                job?: string;
                batch_id?: string;
                total?: number;
                points_est_total?: number;
                items?: Array<{ index: number; label: string; points_est: number }>;
                error?: string;
            }>(`${API}/batch`, {
                shared: base,
                variants: lines.map((prompt, i) => ({ prompt, label: `${i + 1}. ${prompt.slice(0, 10)}` })),
            });
            if (!r.job) throw new Error(r.error || "批量提交失败");
            apply({
                batchJobId: r.job,
                batch: {
                    id: r.batch_id,
                    total: r.total || lines.length,
                    status: "running",
                    items: (r.items || []).map((it) => ({
                        index: it.index,
                        label: it.label,
                        prompt: lines[it.index],
                        pointsEst: it.points_est,
                    })),
                },
            });
        } catch (e) {
            apply({ error: (e as Error).message });
        }
    };

    const pointsNow = estPoints(st.params, caps);
    const running = st.status === "running";
    const batchRunning = Boolean(st.batchJobId);
    const canGen = caps.key_configured;

    const setChosen = (kind: "image" | "video" | "audio") => (next: string[]) =>
        patchParams(kind === "image" ? { images: next } : kind === "video" ? { videos: next } : { audios: next });

    const batchLines = batchText.split("\n").filter((x) => x.trim()).length;

    return (
        <div data-canvas-no-zoom onMouseDown={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()} style={s.card}>
            {/* 头部 */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: t.node.text }}>H3 出片</span>
                <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 20, background: t.toolbar.activeBg, color: t.toolbar.activeText }}>{caps.model}</span>
                <span style={{ flex: 1 }} />
                {points !== null ? (
                    <span title="H3 积分余额（60 秒缓存）" style={{ fontSize: 11, color: t.node.muted }}>
                        💎 {points}
                    </span>
                ) : null}
                {!canGen ? <span style={{ fontSize: 10, color: "#dc2626" }}>未配置密钥</span> : null}
                <button type="button" style={s.btnGhost} onClick={onClose}>
                    收起
                </button>
            </div>

            {loadErr ? <div style={{ fontSize: 11, color: "#dc2626" }}>状态加载失败：{loadErr}</div> : null}

            {/* 模式切换 */}
            <div style={{ display: "flex", gap: 6 }}>
                {(["text", "frames", "reference"] as Mode[]).map((m) => (
                    <button
                        key={m}
                        type="button"
                        onClick={() => patchParams({ mode: m })}
                        style={{
                            ...s.btn,
                            flex: 1,
                            background: st.params.mode === m ? t.toolbar.activeBg : "transparent",
                            color: st.params.mode === m ? t.toolbar.activeText : t.node.muted,
                            borderColor: st.params.mode === m ? t.node.activeStroke : t.node.stroke,
                            fontWeight: st.params.mode === m ? 600 : 400,
                        }}
                    >
                        {MODE_LABEL[m]}
                    </button>
                ))}
            </div>
            <div style={{ fontSize: 10, color: t.node.faint, marginTop: -6 }}>{MODE_HINT[st.params.mode]}</div>

            {/* 提示词 */}
            <div>
                <label style={s.label}>提示词</label>
                <textarea
                    value={st.params.prompt}
                    onChange={(e) => patchParams({ prompt: e.target.value })}
                    onWheel={(e) => e.stopPropagation()}
                    placeholder="一句话描述画面：谁、在哪、做什么、镜头怎么动、光怎么样"
                    style={{ ...s.input, minHeight: 84, resize: "vertical", lineHeight: 1.6 }}
                />
                {st.params.mode === "reference" && (st.params.images.length || st.params.videos.length) ? (
                    <div style={{ fontSize: 10, color: t.node.muted, marginTop: 4 }}>
                        {st.params.images.map((_, i) => `<Picture ${i + 1}>`).join("  ")}
                        {st.params.videos.length ? "  " + st.params.videos.map((_, i) => `<Video ${i + 1}>`).join(" ") : ""}
                    </div>
                ) : null}
            </div>

            {/* 素材区：按模式分流 */}
            {st.params.mode === "frames" ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                        <label style={s.label}>首帧（可选）</label>
                        <AssetPicker ctx={ctx} buckets={buckets} single value={st.params.firstFrame ? [st.params.firstFrame] : []} kinds={["image"]} capacity={1} onChange={(n) => patchParams({ firstFrame: n[0] || "" })} s={s} />
                    </div>
                    <div>
                        <label style={s.label}>尾帧（可选）</label>
                        <AssetPicker ctx={ctx} buckets={buckets} single value={st.params.lastFrame ? [st.params.lastFrame] : []} kinds={["image"]} capacity={1} onChange={(n) => patchParams({ lastFrame: n[0] || "" })} s={s} />
                    </div>
                </div>
            ) : null}

            {st.params.mode === "reference" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div>
                        <label style={s.label}>
                            参考图 <span style={{ color: t.node.faint }}>最多 {caps.limits.images} 张</span>
                        </label>
                        <AssetPicker ctx={ctx} buckets={buckets} value={st.params.images} kinds={["image"]} capacity={caps.limits.images} onChange={setChosen("image")} s={s} />
                    </div>
                    <div>
                        <label style={s.label}>
                            参考视频 <span style={{ color: t.node.faint }}>最多 {caps.limits.videos} 个 · 运镜 / 节奏</span>
                        </label>
                        <AssetPicker ctx={ctx} buckets={buckets} value={st.params.videos} kinds={["video"]} capacity={caps.limits.videos} onChange={setChosen("video")} s={s} />
                    </div>
                    <div>
                        <label style={s.label}>
                            参考音频 <span style={{ color: t.node.faint }}>最多 {caps.limits.audios} 个 · 音色 / 配乐</span>
                        </label>
                        <AssetPicker ctx={ctx} buckets={buckets} value={st.params.audios} kinds={["audio"]} capacity={caps.limits.audios} onChange={setChosen("audio")} s={s} />
                    </div>
                </div>
            ) : null}

            {/* 参数 */}
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
                <div>
                    <label style={s.label}>分辨率</label>
                    <select style={s.select} value={st.params.resolution} onChange={(e) => patchParams({ resolution: e.target.value })}>
                        {caps.resolutions.map((r) => (
                            <option key={r} value={r}>
                                {r}（{caps.points_per_second[r] || 0} 分/秒）
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label style={s.label}>比例</label>
                    <select style={s.select} value={st.params.ratio} onChange={(e) => patchParams({ ratio: e.target.value })}>
                        {caps.ratios.map((r) => (
                            <option key={r} value={r}>
                                {r}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label style={s.label}>
                        时长（{caps.duration_range[0]}~{caps.duration_range[1]}s）
                    </label>
                    <input
                        type="number"
                        min={caps.duration_range[0]}
                        max={caps.duration_range[1]}
                        value={st.params.duration}
                        onChange={(e) => patchParams({ duration: Number(e.target.value) || caps.duration_range[0] })}
                        style={{ ...s.select, width: 76 }}
                    />
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: t.node.muted }}>本次预估</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#f59e0b" }}>{pointsNow} 分</div>
                </div>
            </div>

            {/* 主动作 */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {running ? (
                    <button type="button" style={{ ...s.btnPrimary, background: "#dc2626" }} onClick={() => void cancel()}>
                        取消
                    </button>
                ) : (
                    <button type="button" style={{ ...s.btnPrimary, opacity: canGen ? 1 : 0.5 }} disabled={!canGen} onClick={() => void submit()}>
                        {st.result ? "按当前参数再生成" : "立即出片"}
                    </button>
                )}
                {st.result ? (
                    <button type="button" style={s.btn} title="把上一次的参数原样再提交一次" onClick={() => void submit()}>
                        重跑同样的
                    </button>
                ) : null}
                <button type="button" style={{ ...s.btn, marginLeft: "auto" }} onClick={() => setBatchOpen((v) => !v)}>
                    {batchOpen ? "收起批量" : "批量变体 ×N"}
                </button>
                <button type="button" style={s.btnGhost} onClick={() => setHistoryOpen((v) => !v)}>
                    {historyOpen ? "收起历史" : "历史成片"}
                </button>
            </div>

            {st.error ? (
                <div style={{ fontSize: 11, color: "#dc2626", lineHeight: 1.6, whiteSpace: "pre-wrap", maxHeight: 120, overflow: "auto" }}>{st.error}</div>
            ) : null}

            {running && st.logs?.length ? (
                <div style={{ fontSize: 10, color: t.node.faint, fontFamily: "ui-monospace, monospace", lineHeight: 1.6 }}>
                    {(st.logs || []).slice(-2).map((l, i) => (
                        <div key={i}>· {l}</div>
                    ))}
                </div>
            ) : null}

            {/* 批量 */}
            {batchOpen ? (
                <div style={{ borderTop: `1px dashed ${t.node.stroke}`, paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                    <label style={s.label}>
                        批量变体 —— 一行一条片，公共参数沿用上面（{MODE_LABEL[st.params.mode]} · {st.params.resolution} · {st.params.ratio} · {st.params.duration}s）
                    </label>
                    <textarea
                        value={batchText}
                        onChange={(e) => setBatchText(e.target.value)}
                        onWheel={(e) => e.stopPropagation()}
                        placeholder={"镜头缓慢推近，冬虫夏草礼盒放在胡桃木桌上\n手持近景，女子捧起礼盒微笑展示\n俯拍，礼盒开启，镜头环绕一周"}
                        style={{ ...s.input, minHeight: 90, resize: "vertical", lineHeight: 1.7 }}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <button type="button" style={{ ...s.btnPrimary, opacity: canGen && !batchRunning ? 1 : 0.5 }} disabled={!canGen || batchRunning} onClick={() => void submitBatch()}>
                            {batchRunning ? "批量进行中…" : `提交批量（${batchLines} 条）`}
                        </button>
                        <span style={{ fontSize: 10, color: t.node.muted }}>
                            预估合计 {batchLines * pointsNow} 分 · 一条不合法整批不提交
                        </span>
                    </div>

                    {st.batch?.items?.length ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 190, overflow: "auto" }}>
                            <div style={{ fontSize: 11, color: t.node.muted }}>
                                批次 {st.batch.id || "—"} · 成功 {st.batch.okCount ?? 0}/{st.batch.total}
                                {st.batch.status === "running" ? " · 进行中" : ""}
                            </div>
                            {st.batch.items.map((it) => (
                                <div
                                    key={it.index}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        fontSize: 11,
                                        padding: "3px 6px",
                                        borderRadius: 6,
                                        background: it.ok === true ? "rgba(22,163,74,.09)" : it.ok === false ? "rgba(220,38,38,.09)" : "transparent",
                                    }}
                                >
                                    <span style={{ width: 16, color: t.node.faint }}>{it.index + 1}</span>
                                    <span style={{ flex: 1, color: t.node.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={it.prompt || it.label}>
                                        {it.prompt || it.label}
                                    </span>
                                    {it.ok === true ? <span style={{ color: "#16a34a" }}>✓ {it.pointsEst || 0} 分</span> : null}
                                    {it.ok === false ? (
                                        <span style={{ color: "#dc2626" }} title={it.error}>
                                            失败
                                        </span>
                                    ) : null}
                                    {it.ok !== true ? (
                                        <button type="button" style={s.btnGhost} onClick={() => void submit({ prompt: it.prompt || it.label })}>
                                            单跑这条
                                        </button>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>
            ) : null}

            {/* 历史成片 */}
            {historyOpen ? (
                <div style={{ borderTop: `1px dashed ${t.node.stroke}`, paddingTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={s.label}>最近成片（点一下设为本节点结果，参数不变）</label>
                    {clips.length === 0 ? (
                        <div style={{ fontSize: 11, color: t.node.placeholder }}>还没有成片</div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px,1fr))", gap: 8, maxHeight: 200, overflow: "auto" }}>
                            {clips.map((c) => (
                                <button
                                    key={c.name}
                                    type="button"
                                    onClick={() => apply({ status: "success", result: { url: c.url, file: c.name, pointsEst: 0 }, error: undefined }, { content: c.url })}
                                    style={{ padding: 0, border: `1px solid ${t.node.stroke}`, borderRadius: 8, overflow: "hidden", background: "#000", cursor: "pointer" }}
                                    title={c.name}
                                >
                                    <video src={c.url} muted style={{ width: "100%", height: 70, objectFit: "cover", display: "block" }} />
                                    <div style={{ fontSize: 9, color: "#fff", padding: "2px 4px", background: "rgba(0,0,0,.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {c.name} · {bytesText(c.bytes)}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ) : null}

            <div style={{ display: "flex", gap: 8, fontSize: 10, color: t.node.faint, flexWrap: "wrap" }}>
                <span>参数全部存在节点里，改一项再点「再生成」即可</span>
                <span style={{ marginLeft: "auto" }}>
                    {st.params.mode === "text"
                        ? "无参考素材"
                        : st.params.mode === "frames"
                          ? `首尾帧 ${[st.params.firstFrame, st.params.lastFrame].filter(Boolean).length}/2`
                          : `参考 ${st.params.images.length + st.params.videos.length + st.params.audios.length}/12`}
                </span>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------- 插件定义

export default definePlugin({
    id: "h3-pipeline",
    name: "H3 出片产线",
    version: "1.0.0",
    description: "MiniMax-H3：素材桶 / 首尾帧与全能参考双模式 / 微修改重跑 / 批量变体",
    css: "@keyframes h3p-spin { to { transform: rotate(360deg) } }",
    nodes: [
        {
            type: "h3-pipeline:video",
            title: "H3 出片",
            icon: "🎬",
            description: "一句话 + 参考素材 → 一条片；参数存在节点里，改一句就能重跑",
            defaultSize: { width: 300, height: 410 },
            defaultMetadata: {
                h3: { params: DEFAULT_PARAMS, status: "idle" } as unknown as Record<string, unknown>,
            },
            minimapColor: "#7c3aed",
            keepAspectRatio: () => true,
            autoOpenPanel: true,
            resource: (node) => {
                const url = (node.metadata?.content as string) || "";
                return url ? { kind: "video", url } : null;
            },
            Content: H3Content,
            Panel: H3Panel,
        },
    ],
});
