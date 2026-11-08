import React, { useState, useRef, useEffect, useMemo } from "react";
import { Film, Play, Pause, SkipBack, SkipForward, Download, Loader2, Volume2, Sparkles, CheckCircle, AlertCircle } from "lucide-react";
import type { CanvasNodeContext } from "@/types/canvas-plugin";
import { CanvasNodeType, type CanvasNodeData } from "@/types/canvas";

interface MergedSegmentItem {
    id: string;
    title: string;
    url: string;
    duration: number;
}

export function MergeNodeContent({ ctx }: { ctx: CanvasNodeContext }) {
    const { node, theme, getUpstream, getNode, applyOps, updateMetadata } = ctx;
    const videoRef = useRef<HTMLVideoElement | null>(null);

    // 1. 获取所有上游连入的视频节点
    const upstreamVideos = useMemo(() => {
        try {
            const upstream = typeof getUpstream === "function" ? getUpstream() : [];
            return upstream.filter((n) => n.type === CanvasNodeType.Video && Boolean(n.metadata?.content));
        } catch {
            return [];
        }
    }, [getUpstream]);

    // 2. 统一片段序列（连线优先，其次 metadata.segments 兜底）
    const segments: MergedSegmentItem[] = useMemo(() => {
        if (upstreamVideos.length > 0) {
            return upstreamVideos.map((v, idx) => ({
                id: v.id,
                title: v.title || `镜${idx + 1} · 片段`,
                url: v.metadata?.content || "",
                duration: v.metadata?.durationMs ? v.metadata.durationMs / 1000 : 10.0,
            }));
        }

        // metadata.segments 兜底
        if (Array.isArray(node.metadata?.segments) && node.metadata.segments.length > 0) {
            return (node.metadata.segments as any[]).map((s, idx) => ({
                id: s.id || `seg-${idx + 1}`,
                title: s.name || s.title || `镜${idx + 1} · 片段`,
                url: s.videoUrl || s.url || "",
                duration: s.duration || 10.0,
            }));
        }

        return [];
    }, [upstreamVideos, node.metadata?.segments]);

    // 3. 连续播放状态
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [exportPhase, setExportPhase] = useState<"idle" | "working" | "success" | "error">("idle");
    const [exportStage, setExportStage] = useState("");
    const [exportError, setExportError] = useState("");

    const currentSegment = segments[currentIndex] || null;
    const currentVideoUrl = currentSegment?.url || "";

    // 切换段落
    const handleNext = () => {
        if (currentIndex < segments.length - 1) {
            setCurrentIndex((prev) => prev + 1);
        } else {
            setCurrentIndex(0);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
        }
    };

    // 视频播放结束自动切下一段
    const handleVideoEnded = () => {
        if (currentIndex < segments.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            setTimeout(() => {
                videoRef.current?.play().catch(() => {});
            }, 100);
        } else {
            setCurrentIndex(0);
            setIsPlaying(false);
        }
    };

    // 切换视频源时自动处理播放
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.load();
            if (isPlaying) {
                videoRef.current.play().catch(() => setIsPlaying(false));
            }
        }
    }, [currentIndex]);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
        } else {
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }
    };

    // 4. 一键导出成片逻辑
    const handleExport = async () => {
        if (exportPhase === "working" || segments.length === 0) return;
        setExportPhase("working");
        setExportStage("正在准备片段文件...");
        setExportError("");

        try {
            // 1. 获取所有片段二进制
            const formData = new FormData();
            const manifestSegments: Array<{ id: string; ranges: number[][] }> = [];

            for (let i = 0; i < segments.length; i++) {
                const seg = segments[i];
                setExportStage(`正在读取片段 ${i + 1}/${segments.length}...`);
                const res = await fetch(seg.url);
                if (!res.ok) throw new Error(`读取片段失败: ${seg.title || seg.id}`);
                const blob = await res.blob();
                formData.append(`seg${i}`, blob, `seg${i}.mp4`);
                manifestSegments.push({ id: seg.id, ranges: [] });
            }

            formData.append(
                "manifest",
                JSON.stringify({
                    segments: manifestSegments,
                    sourceVolume: node.metadata?.sourceVolume ?? 1.0,
                    musicVolume: node.metadata?.musicVolume ?? 0.8,
                })
            );

            setExportStage("正在向合成导出服务提交任务...");
            const submitRes = await fetch("/local-export/export", {
                method: "POST",
                body: formData,
            });
            const submitJson = await submitRes.json();
            if (!submitJson.jobId) throw new Error(submitJson.error || "启动导出服务失败");

            // 2. 轮询合成进度
            const jobId = submitJson.jobId;
            let finalResult: any = null;

            for (let attempt = 0; attempt < 120; attempt++) {
                await new Promise((r) => setTimeout(r, 1200));
                const pollRes = await fetch(`/local-export/export/status/${jobId}`);
                const statusJson = await pollRes.json();
                if (statusJson.stage) setExportStage(statusJson.stage);

                if (statusJson.state === "done") {
                    finalResult = statusJson;
                    break;
                }
                if (statusJson.state === "error") {
                    throw new Error(statusJson.error || "FFmpeg 合成失败");
                }
            }

            if (!finalResult || !finalResult.fileUrl) throw new Error("合成超时或未返回成片地址");

            setExportStage("合成成功！正在下载并生成成片节点...");
            setExportPhase("success");

            // 3. 触发浏览器下载
            const downloadLink = document.createElement("a");
            downloadLink.href = `${finalResult.fileUrl}?dl=1`;
            downloadLink.download = finalResult.fileName || "muse_merged_master.mp4";
            document.body.appendChild(downloadLink);
            downloadLink.click();
            downloadLink.remove();

            // 4. 自动在右侧生成交付成片视频节点
            applyOps([
                {
                    type: "add_node",
                    nodeType: CanvasNodeType.Video,
                    title: `🏆 Muse 30s 完整商业成片 (${finalResult.fileName})`,
                    x: node.position.x + node.width + 80,
                    y: node.position.y,
                    width: 420,
                    height: 520,
                    metadata: {
                        content: finalResult.fileUrl,
                        localPath: finalResult.localPath,
                        status: "success",
                    },
                },
                {
                    type: "connect_nodes",
                    fromNodeId: node.id,
                    toNodeId: `node-video-auto-${Date.now()}`,
                },
            ]);

            setTimeout(() => {
                setExportPhase("idle");
            }, 3000);
        } catch (err: any) {
            setExportPhase("error");
            setExportError(err.message || String(err));
        }
    };

    return (
        <div className="flex h-full w-full flex-col overflow-hidden rounded-[22px] bg-[#14151a] text-white">
            {/* 顶栏控制条 */}
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 px-4 bg-[#1a1c23]">
                <div className="flex items-center gap-2">
                    <Film className="size-4 text-yellow-400" />
                    <span className="text-xs font-semibold text-white/90">
                        {segments.length > 0 ? `第 ${currentIndex + 1} 段 / 共 ${segments.length} 段 · ${currentSegment?.title || "片段"}` : "多段视频合成预览与导出"}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={exportPhase === "working" || segments.length === 0}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                            exportPhase === "working"
                                ? "bg-yellow-500/20 text-yellow-300"
                                : exportPhase === "success"
                                ? "bg-green-600 text-white"
                                : segments.length === 0
                                ? "bg-white/5 text-white/30 cursor-not-allowed"
                                : "bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-semibold hover:brightness-110 shadow-sm"
                        }`}
                    >
                        {exportPhase === "working" ? (
                            <>
                                <Loader2 className="size-3.5 animate-spin" />
                                <span>{exportStage || "正在合成..."}</span>
                            </>
                        ) : exportPhase === "success" ? (
                            <>
                                <CheckCircle className="size-3.5" />
                                <span>导出成功</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="size-3.5" />
                                <span>🎬 一键导出成片</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* 视频主播放区 */}
            <div className="relative min-h-0 flex-1 bg-black flex items-center justify-center">
                {currentVideoUrl ? (
                    <video
                        ref={videoRef}
                        src={currentVideoUrl}
                        className="h-full w-full object-contain"
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={handleVideoEnded}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center gap-3 p-6 text-center text-white/40">
                        <Film className="size-12 opacity-25" />
                        <span className="text-sm font-medium">还没有接入视频片段</span>
                        <span className="text-xs text-white/30 max-w-sm">
                            将 Muse 生成的 10 秒片段按顺序连线接入本节点，即可实现多段流式连续预览与一键合成 30s 商业长片
                        </span>
                    </div>
                )}

                {/* 播控浮层 */}
                {segments.length > 0 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/75 px-4 py-1.5 backdrop-blur-md border border-white/10 shadow-lg">
                        <button
                            type="button"
                            onClick={handlePrev}
                            disabled={currentIndex === 0}
                            className="rounded-full p-1 text-white/70 hover:text-white disabled:opacity-30"
                            title="上一段"
                        >
                            <SkipBack className="size-4" />
                        </button>
                        <button
                            type="button"
                            onClick={togglePlay}
                            className="flex size-7 items-center justify-center rounded-full bg-yellow-400 text-black hover:scale-105 transition"
                            title={isPlaying ? "暂停" : "连续播放"}
                        >
                            {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5 ml-0.5" />}
                        </button>
                        <button
                            type="button"
                            onClick={handleNext}
                            className="rounded-full p-1 text-white/70 hover:text-white"
                            title="下一段"
                        >
                            <SkipForward className="size-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* 错误提示条 */}
            {exportError && (
                <div className="flex items-center gap-2 bg-red-950/80 border-t border-red-800/40 px-3 py-1.5 text-xs text-red-200">
                    <AlertCircle className="size-3.5 shrink-0" />
                    <span className="truncate">合成失败: {exportError}</span>
                </div>
            )}

            {/* 底栏片段列队 */}
            <div className="h-20 shrink-0 border-t border-white/10 bg-[#16181f] px-3 py-2 overflow-x-auto thin-scrollbar">
                <div className="flex items-center gap-2 h-full">
                    {segments.length === 0 ? (
                        <div className="flex items-center justify-center w-full text-xs text-white/30">
                            支持连接最多 10 段 Muse 视频（当前 0 段）
                        </div>
                    ) : (
                        segments.map((seg, idx) => (
                            <button
                                key={seg.id}
                                type="button"
                                onClick={() => setCurrentIndex(idx)}
                                className={`flex shrink-0 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition h-full ${
                                    idx === currentIndex
                                        ? "border-yellow-400 bg-yellow-400/10 text-white"
                                        : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                                }`}
                            >
                                <span className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
                                    idx === currentIndex ? "bg-yellow-400 text-black" : "bg-white/20 text-white"
                                }`}>
                                    {idx + 1}
                                </span>
                                <div className="flex flex-col min-w-0 max-w-[120px]">
                                    <span className="truncate text-xs font-medium">{seg.title}</span>
                                    <span className="text-[10px] text-white/40">10.0s · 原生发声</span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
