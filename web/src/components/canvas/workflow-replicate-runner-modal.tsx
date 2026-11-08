import { useState, useEffect, useRef } from "react";
import { Modal, Button, Tag, Progress, message } from "antd";
import { Play, CheckCircle2, Loader2, Sparkles, Film, Send, Download, RefreshCw, Terminal } from "lucide-react";
import { MultiPlatformPublishModal } from "@/components/publish/multi-platform-publish-modal";

export type ReplicateModelType = "h3" | "muse" | "sd";

interface WorkflowReplicateRunnerModalProps {
    open: boolean;
    modelType: ReplicateModelType;
    onClose: () => void;
    onSuccess?: (result: { url: string; model: string; size: number }) => void;
}

const MODEL_INFO: Record<ReplicateModelType, {
    title: string;
    badge: string;
    color: string;
    desc: string;
    targetTitle: string;
    sizeEst: string;
}> = {
    h3: {
        title: "ComfyUI × MiniMax-H3 · 1:1 爆款复刻执行器 (RV2V 管线)",
        badge: "⚡ Queue Prompt",
        color: "#10b981",
        desc: "GitHub ComfyUI RV2V 规范：8 镜毫秒级音画解耦 · 人物B正脸锁定 · InsightFace 逐帧无抖动替换 · EBUR128母带 · 交付 52.2MB 1080P 满血成片",
        targetTitle: "冬虫夏草_鲜草是活的吗_1to1复刻_人物B_H3原生发声.mp4",
        sizeEst: "52.2 MB · 58.00s · 1080x1920",
    },
    muse: {
        title: "Muse · 1:1 独立爆款复刻流水线",
        badge: "Muse 专属产线",
        color: "#9333ea",
        desc: "基于 Muse 视觉与原生声画引擎：11 镜逐镜切片组装 · 56px 原版字幕烧制 · EBU R128 音频归一化 · 交付 15.4MB 满血成片",
        targetTitle: "冬虫夏草_1to1复刻_人物B_Muse原生发声",
        sizeEst: "15.44 MB · 62.87s",
    },
    sd: {
        title: "Seedance 2.5 · 换人动作复刻流水线",
        badge: "SD 2.5 专属产线",
        color: "#f97316",
        desc: "官方直连高速通道：手势舞/动作复刻 · 自营女掌柜角色锁定 · 11 刀硬切对齐 · 交付 14.9MB 满血成片",
        targetTitle: "冬虫夏草_1to1复刻_SD25_逐镜_成片",
        sizeEst: "14.93 MB · 62.87s",
    },
};

export function WorkflowReplicateRunnerModal({
    open,
    modelType,
    onClose,
    onSuccess,
}: WorkflowReplicateRunnerModalProps) {
    const info = MODEL_INFO[modelType] || MODEL_INFO.muse;
    const [running, setRunning] = useState(false);
    const [jobId, setJobId] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
    const [deliverUrl, setDeliverUrl] = useState<string>("");
    const [publishOpen, setPublishOpen] = useState(false);
    const logEndRef = useRef<HTMLDivElement>(null);
    const pollTimerRef = useRef<number | null>(null);

    // 弹窗打开时先探测现有成片
    useEffect(() => {
        if (!open) {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            return;
        }
        setStatus("idle");
        setLogs([]);
        setDeliverUrl("");
        setJobId(null);

        // 探测后端当前已有状态
        fetch("/api/canvas/replicate/status")
            .then((r) => r.json())
            .then((data) => {
                const cur = data[modelType];
                if (cur && cur.ready && cur.url) {
                    setDeliverUrl(cur.url);
                    setStatus("done");
                    setLogs([`✨ 检测到当前已就绪的 ${info.badge} 交付成片：${cur.filename}`, `📦 规格：${cur.size_mb} MB | 时长：${cur.duration}s`]);
                }
            })
            .catch(() => {});
    }, [open, modelType]);

    // 日志自动滚动到底部
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const startExecution = async () => {
        try {
            setRunning(true);
            setStatus("running");
            setLogs([`🚀 正在向调度中枢提交 ${info.badge} 执行请求...`]);
            setDeliverUrl("");

            const res = await fetch("/api/canvas/replicate/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ model: modelType }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (!data.ok || !data.job_id) throw new Error(data.error || "未能获取任务ID");

            const jid = data.job_id;
            setJobId(jid);

            // 开始轮询日志
            const timer = window.setInterval(async () => {
                try {
                    const pollRes = await fetch(`/api/jobs/${jid}`);
                    if (!pollRes.ok) return;
                    const job = await pollRes.json();
                    if (Array.isArray(job.logs) && job.logs.length) {
                        setLogs(job.logs);
                    }
                    if (job.status === "done") {
                        clearInterval(timer);
                        setRunning(false);
                        setStatus("done");
                        const finalUrl = job.result?.url || "";
                        setDeliverUrl(finalUrl);
                        message.success(`🎉 ${info.title} 执行出片完成！`);
                        if (onSuccess) onSuccess(job.result);
                    } else if (job.status === "error") {
                        clearInterval(timer);
                        setRunning(false);
                        setStatus("error");
                        message.error(`执行失败: ${job.error || "未知异常"}`);
                    }
                } catch (e) {
                    console.error("Poll job error:", e);
                }
            }, 1000);

            pollTimerRef.current = timer;
        } catch (e: any) {
            setRunning(false);
            setStatus("error");
            message.error(`提交失败: ${e.message}`);
        }
    };

    return (
        <>
            <Modal
                open={open}
                onCancel={onClose}
                footer={null}
                width={780}
                centered
                destroyOnClose
                title={
                    <div className="flex items-center gap-2.5">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Film className="size-4" />
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-base text-stone-900 dark:text-stone-100">{info.title}</span>
                                <Tag color={info.color} className="font-medium">{info.badge}</Tag>
                            </div>
                            <p className="text-xs text-stone-500 font-normal mt-0.5">{info.desc}</p>
                        </div>
                    </div>
                }
            >
                <div className="space-y-4 py-2">
                    {/* 执行控制与状态卡片 */}
                    <div className="rounded-xl border border-stone-200/80 bg-stone-50/60 p-4 dark:border-stone-800 dark:bg-stone-900/40">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <div className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                                    目标交付产物：{info.targetTitle}
                                </div>
                                <div className="text-xs text-stone-500 mt-1">
                                    规格标准：720x1280 (9:16) · 30fps · 1886帧精确对齐 · 预估体积 {info.sizeEst}
                                </div>
                            </div>
                            <Button
                                type="primary"
                                size="large"
                                loading={running}
                                onClick={startExecution}
                                style={{ backgroundColor: info.color, borderColor: info.color }}
                                className="font-medium shadow-sm hover:opacity-90"
                            >
                                {running ? "ComfyUI 节点管线全力执行中..." : status === "done" ? (modelType === "h3" ? "⚡ Queue Prompt (重新排队执行)" : "⚡ 重新运行独立复刻") : (modelType === "h3" ? "⚡ Queue Prompt (ComfyUI 排队执行)" : "⚡ 立即启动独立出片")}
                            </Button>
                        </div>

                        {running && (
                            <div className="mt-4 space-y-2">
                                <div className="flex justify-between text-xs text-stone-500">
                                    <span>分镜检验 / 音画合流 / 字幕压制进行中</span>
                                    <span className="animate-pulse text-primary font-mono">Running...</span>
                                </div>
                                <Progress percent={logs.length ? Math.min(95, logs.length * 15) : 10} status="active" strokeColor={info.color} showInfo={false} />
                            </div>
                        )}
                    </div>

                    {/* 实时执行终端日志 */}
                    <div className="rounded-xl border border-stone-800 bg-[#0d1117] p-3 text-xs font-mono text-stone-300">
                        <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-2 text-stone-400">
                            <span className="inline-flex items-center gap-1.5 font-semibold text-stone-300">
                                <Terminal className="size-3.5" />
                                调度引擎实时输出控制台 {jobId ? `(#${jobId})` : ""}
                            </span>
                            <span className="text-[11px] text-stone-500">
                                {status === "done" ? "✓ 任务已完成" : status === "running" ? "● 运行中" : "就绪"}
                            </span>
                        </div>
                        <div className="h-44 overflow-y-auto space-y-1.5 text-[12px] leading-relaxed scrollbar-thin scrollbar-thumb-stone-700">
                            {logs.length === 0 ? (
                                <div className="text-stone-500 italic py-8 text-center">点击上方「立即启动独立出片」按钮，后台将自动调起专属模型复刻引擎</div>
                            ) : (
                                logs.map((line, idx) => (
                                    <div key={idx} className={line.includes("🎉") || line.includes("✓") || line.includes("完成") ? "text-emerald-400" : line.includes("Error") || line.includes("失败") ? "text-rose-400" : "text-stone-300"}>
                                        {line}
                                    </div>
                                ))
                            )}
                            <div ref={logEndRef} />
                        </div>
                    </div>

                    {/* 成品就绪展示与一键发布 */}
                    {deliverUrl && (
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/50 p-4 dark:border-emerald-500/20 dark:bg-emerald-950/20">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                                        <CheckCircle2 className="size-6" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-emerald-950 dark:text-emerald-200">
                                            {info.targetTitle}.mp4 已就绪！
                                        </div>
                                        <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
                                            母带画质音画 100% 对齐，可直接在线播放、本地下载或同步分发
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                        type="default"
                                        icon={<Download className="size-3.5" />}
                                        href={deliverUrl}
                                        target="_blank"
                                        download
                                    >
                                        下载成片
                                    </Button>
                                    <Button
                                        type="primary"
                                        icon={<Send className="size-3.5" />}
                                        style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
                                        onClick={() => setPublishOpen(true)}
                                        className="font-medium"
                                    >
                                        🚀 一键发布三平台
                                    </Button>
                                </div>
                            </div>

                            {/* 视频预览区 */}
                            <div className="mt-3 overflow-hidden rounded-lg border border-stone-200 bg-black dark:border-stone-800">
                                <video
                                    src={deliverUrl}
                                    controls
                                    playsInline
                                    className="max-h-72 w-full object-contain mx-auto"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* 三平台发布弹窗联动 */}
            {deliverUrl && (
                <MultiPlatformPublishModal
                    open={publishOpen}
                    asset={{
                        id: `deliv_${modelType}`,
                        title: info.targetTitle,
                        name: info.targetTitle,
                        kind: "video",
                        url: deliverUrl,
                        coverUrl: deliverUrl.replace(".mp4", ".jpg"),
                        category: "deliverable",
                        tags: ["交付成片", "1:1复刻", modelType.toUpperCase()],
                        data: { url: deliverUrl, width: 720, height: 1280, bytes: 0, mimeType: "video/mp4" },
                    } as any}
                    onClose={() => setPublishOpen(false)}
                />
            )}
        </>
    );
}
