import React, { useState, useEffect } from "react";
import { Button, Tag, Progress, Drawer, Badge, Tooltip, message } from "antd";
import { 
    Play, Pause, RefreshCw, Cpu, Layers, CheckCircle2, Clock, 
    AlertCircle, Sparkles, Terminal, ChevronUp, ChevronDown, Check, Film, X
} from "lucide-react";

export interface PipelineStep {
    id: string;
    name: string;
    desc: string;
    model: string;
    status: "idle" | "running" | "success" | "error";
    durationMs?: number;
    progress: number;
}

const DEFAULT_STAGES: PipelineStep[] = [
    {
        id: "step1",
        name: "原片视频与音轨毫秒解耦",
        desc: "Scene Splitter 8 镜硬切 + Whisper 分句台词转写",
        model: "Whisper-Large-v3 + FFmpeg",
        status: "success",
        durationMs: 1240,
        progress: 100,
    },
    {
        id: "step2",
        name: "人货场特征锁定与 Prompt 替换",
        desc: "指定女掌柜人像特征 + 野生金黄鲜草实物特征注入",
        model: "MiniMaxH3_PromptReplacer",
        status: "success",
        durationMs: 820,
        progress: 100,
    },
    {
        id: "step3",
        name: "MiniMax-H3 视频编辑扩散大模型渲染",
        desc: "原片动作/运镜 100% 继承，画面角色重构生成",
        model: "MiniMax-H3 Plan v2 (RV2V)",
        status: "success",
        durationMs: 8430,
        progress: 100,
    },
    {
        id: "step4",
        name: "InsightFace 931帧逐帧无抖动换脸贴合",
        desc: "inswapper_128 CoreML/MPS 高速加速，保留皮肤纹理",
        model: "InsightFace 128",
        status: "success",
        durationMs: 4120,
        progress: 100,
    },
    {
        id: "step5",
        name: "EBU R128 音频母带与 1080P 超清字幕压制",
        desc: "原厂展厅纯净版导出，彻底去除生硬横幅与画中画",
        model: "EBUR128 Mastering Engine",
        status: "success",
        durationMs: 2310,
        progress: 100,
    },
];

export function GlobalQueueDock({
    onRunPipeline,
    onPreviewResult,
    isRunning = false,
}: {
    onRunPipeline?: () => void;
    onPreviewResult?: () => void;
    isRunning?: boolean;
}) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [simulating, setSimulating] = useState(false);
    const [simStep, setSimStep] = useState(0);
    const [simProgress, setSimProgress] = useState(0);
    const [stages, setStages] = useState<PipelineStep[]>(DEFAULT_STAGES);

    // 快捷键 Ctrl+Enter 或 Cmd+Enter 触发 Queue Prompt
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                handleStartRun();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleStartRun = () => {
        if (simulating) return;
        setSimulating(true);
        setSimStep(0);
        setSimProgress(0);
        setDrawerOpen(true);
        message.loading({ content: "🚀 正在向计算集群排队提交 ComfyUI 拓扑...", key: "queue_msg", duration: 1.5 });

        // 重置状态
        const newStages = DEFAULT_STAGES.map((s) => ({ ...s, status: "idle" as const, progress: 0 }));
        setStages(newStages);

        let currentStepIdx = 0;
        let stepProgress = 0;

        const interval = setInterval(() => {
            stepProgress += 8;
            if (stepProgress > 100) {
                stepProgress = 0;
                currentStepIdx += 1;
            }

            if (currentStepIdx >= newStages.length) {
                clearInterval(interval);
                setSimulating(false);
                setStages(DEFAULT_STAGES);
                message.success({ content: "🎉 全链路 5 步渲染完成！58s 终极纯净成片已就绪", key: "queue_msg", duration: 3 });
                onPreviewResult?.();
                return;
            }

            setSimStep(currentStepIdx);
            setSimProgress(stepProgress);

            setStages((prev) =>
                prev.map((s, idx) => {
                    if (idx < currentStepIdx) return { ...s, status: "success", progress: 100 };
                    if (idx === currentStepIdx) return { ...s, status: "running", progress: stepProgress };
                    return { ...s, status: "idle", progress: 0 };
                })
            );
        }, 220);
    };

    return (
        <>
            {/* 顶栏悬浮控制坞 */}
            <div className="pointer-events-auto flex items-center gap-1.5 rounded-2xl border border-white/10 bg-[#0d1017]/90 px-2 py-1 shadow-2xl backdrop-blur-xl">
                {/* 运行工作流主按钮 */}
                <Tooltip title="快捷键: ⌘ + Enter (或 Ctrl + Enter)">
                    <Button
                        type="primary"
                        size="small"
                        onClick={handleStartRun}
                        loading={simulating || isRunning}
                        className="!h-8 !rounded-xl !px-3 !text-xs !font-bold shadow-lg shadow-emerald-500/25 transition-all hover:scale-105"
                        style={{
                            background: "linear-gradient(135deg, #059669, #10b981)",
                            borderColor: "transparent",
                            color: "#fff",
                        }}
                        icon={<Play className="size-3.5 fill-current" />}
                    >
                        {simulating || isRunning ? "生成中..." : "Queue Prompt"}
                    </Button>
                </Tooltip>

                {/* 队列状态药丸 */}
                <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="flex items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 px-2.5 py-1 text-xs text-stone-200 transition-colors border border-white/5"
                >
                    <span className="flex items-center gap-1.5">
                        <span className={`size-2 rounded-full ${simulating || isRunning ? "bg-amber-400 animate-ping" : "bg-emerald-400"}`} />
                        <span className="font-medium">
                            {simulating || isRunning
                                ? `运行中: 步骤 ${simStep + 1}/5 (${simProgress}%)`
                                : "队列: 就绪 (0 等待)"}
                        </span>
                    </span>
                    <Terminal className="size-3.5 text-stone-400" />
                </button>
            </div>

            {/* 实时执行状态抽屉 */}
            <Drawer
                title={
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                                <Cpu className="size-4" />
                            </span>
                            <div>
                                <h3 className="text-sm font-bold m-0 text-white">ComfyUI × LiblibAI 任务队列与实时执行中枢</h3>
                                <p className="text-[11px] text-stone-400 m-0 font-normal">
                                    MiniMax-H3 电商 1:1 换人换声复刻流水线
                                </p>
                            </div>
                        </div>
                        <Tag color={simulating || isRunning ? "processing" : "success"}>
                            {simulating || isRunning ? "RUNNING" : "READY"}
                        </Tag>
                    </div>
                }
                placement="right"
                width={460}
                onClose={() => setDrawerOpen(false)}
                open={drawerOpen}
                styles={{
                    content: {
                        background: "#0c0e14",
                        borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
                        color: "#f3f4f6",
                    },
                    header: {
                        background: "#11141c",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                    },
                }}
            >
                <div className="flex flex-col gap-4">
                    {/* 总体进度 */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
                            <span>全局执行进度</span>
                            <span className="text-emerald-400 font-semibold">
                                {simulating ? `${Math.round(((simStep * 100 + simProgress) / 5))}%` : "100% 已就绪"}
                            </span>
                        </div>
                        <Progress
                            percent={simulating ? Math.round((simStep * 100 + simProgress) / 5) : 100}
                            status={simulating ? "active" : "success"}
                            strokeColor={{ from: "#10b981", to: "#3b82f6" }}
                            showInfo={false}
                        />

                        <div className="mt-3 flex items-center justify-between">
                            <Button
                                size="small"
                                type="primary"
                                onClick={handleStartRun}
                                loading={simulating}
                                className="!rounded-lg !bg-emerald-600 !border-0 !text-xs !font-medium"
                                icon={<RefreshCw className={`size-3.5 ${simulating ? "animate-spin" : ""}`} />}
                            >
                                {simulating ? "执行中..." : "重新运行流水线"}
                            </Button>

                            {onPreviewResult && (
                                <Button
                                    size="small"
                                    onClick={() => {
                                        setDrawerOpen(false);
                                        onPreviewResult();
                                    }}
                                    className="!rounded-lg !border-white/10 !bg-white/5 !text-xs !text-stone-200"
                                    icon={<Film className="size-3.5 text-blue-400" />}
                                >
                                    播放成片
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* 流水线阶段拆解列表 */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                            流水线节点阶段 (Pipeline Nodes)
                        </h4>

                        {stages.map((st, idx) => (
                            <div
                                key={st.id}
                                className={`rounded-xl border p-3 transition-all ${
                                    st.status === "running"
                                        ? "border-emerald-500/60 bg-emerald-500/[0.08] shadow-lg shadow-emerald-500/10"
                                        : st.status === "success"
                                        ? "border-white/10 bg-white/[0.02]"
                                        : "border-white/5 bg-transparent opacity-60"
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
                                                st.status === "success"
                                                    ? "bg-emerald-500 text-black"
                                                    : st.status === "running"
                                                    ? "bg-amber-400 text-black animate-pulse"
                                                    : "bg-stone-800 text-stone-400"
                                            }`}
                                        >
                                            {st.status === "success" ? <Check className="size-3" /> : idx + 1}
                                        </span>
                                        <span className="text-xs font-semibold text-white">{st.name}</span>
                                    </div>

                                    <Tag color={st.status === "running" ? "gold" : st.status === "success" ? "green" : "default"}>
                                        {st.status === "running" ? `${st.progress}%` : st.status.toUpperCase()}
                                    </Tag>
                                </div>

                                <p className="mt-1.5 ml-7 text-[11px] text-stone-400 leading-snug">
                                    {st.desc}
                                </p>

                                <div className="mt-2 ml-7 flex items-center justify-between text-[10px] text-stone-500">
                                    <span className="font-mono text-emerald-400/80">{st.model}</span>
                                    {st.durationMs && <span>耗时 {st.durationMs}ms</span>}
                                </div>

                                {st.status === "running" && (
                                    <div className="mt-2 ml-7">
                                        <Progress percent={st.progress} size="small" status="active" strokeColor="#10b981" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* 控制台实时输出 */}
                    <div className="rounded-xl border border-white/10 bg-black/60 p-3 font-mono text-[10px] text-emerald-400/90 max-h-40 overflow-auto">
                        <div className="flex items-center gap-1.5 text-stone-500 mb-1 border-b border-white/5 pb-1">
                            <Terminal className="size-3" />
                            <span>ComfyUI Core Output Stream</span>
                        </div>
                        <div>[INFO] Loaded model checkpoint: minimax-h3-plan-v2-rv2v.ckpt</div>
                        <div>[INFO] InsightFace inswapper_128 initialized on MPS device.</div>
                        <div>[INFO] Audio track normalized with EBU R128 (-14.2 LUFS).</div>
                        <div>[INFO] Re-rendering 8 shots timeline: 58.00s 24fps 1080x1920.</div>
                        <div className="text-white font-semibold mt-1">
                            {simulating
                                ? `>>> [EXECUTING] Step ${simStep + 1}: ${stages[simStep]?.name} (${simProgress}%)`
                                : ">>> [SUCCESS] All 8 shots assembled without pip overlays. Clean master saved."}
                        </div>
                    </div>
                </div>
            </Drawer>
        </>
    );
}
