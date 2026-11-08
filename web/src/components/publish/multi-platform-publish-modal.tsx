import React, { useEffect, useState } from "react";
import { Alert, Button, Checkbox, Form, Input, Modal, Progress, Select, Space, Tag, Typography, message } from "antd";
import { AlertCircle, Check, CheckCircle2, Clock, Copy, ExternalLink, HelpCircle, Play, RefreshCw, Send, ShieldCheck, Sparkles, Video, Wand2, XCircle } from "lucide-react";
import { type Asset } from "@/stores/use-asset-store";
import { usePublishStore } from "@/stores/use-publish-store";
import { cn } from "@/lib/utils";

type PlatformKey = "douyin" | "kuaishou" | "tencent";

interface PlatformInfo {
    label: string;
    accounts: string[];
    has_cookie: boolean;
    home: string;
}

interface PlatformsResponse {
    ok: boolean;
    order: PlatformKey[];
    platforms: Record<PlatformKey, PlatformInfo>;
}

interface PublishResultRow {
    platform: PlatformKey;
    status: "ok" | "failed" | "unconfirmed";
    stdout?: string;
    stderr?: string;
    exit_code?: number;
    skipped?: string[];
}

interface MultiPlatformPublishModalProps {
    open: boolean;
    asset: Asset | null;
    onClose: () => void;
}

const PLATFORM_CONFIG: Record<PlatformKey, { name: string; color: string; bg: string; icon: string; desc: string }> = {
    douyin: {
        name: "抖音",
        color: "text-rose-500",
        bg: "bg-rose-500/10 border-rose-500/30",
        icon: "🎵",
        desc: "字节跳动·抖音创作者服务平台",
    },
    kuaishou: {
        name: "快手",
        color: "text-amber-500",
        bg: "bg-amber-500/10 border-amber-500/30",
        icon: "⚡",
        desc: "快手创作者服务平台",
    },
    tencent: {
        name: "视频号",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10 border-emerald-500/30",
        icon: "📹",
        desc: "微信视频号创作平台",
    },
};

export function MultiPlatformPublishModal({ open, asset, onClose }: MultiPlatformPublishModalProps) {
    const [form] = Form.useForm();
    const [platformsData, setPlatformsData] = useState<PlatformsResponse | null>(null);
    const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformKey[]>(["douyin", "kuaishou"]);
    const [isLoadingPlatforms, setIsLoadingPlatforms] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isDryRunning, setIsDryRunning] = useState(false);
    const [dryRunResult, setDryRunResult] = useState<any>(null);
    const [jobId, setJobId] = useState<string | null>(null);
    const [publishStatus, setPublishStatus] = useState<"idle" | "running" | "done" | "error" | "unconfirmed">("idle");
    const [statusLogs, setStatusLogs] = useState<string[]>([]);
    const [publishRows, setPublishRows] = useState<PublishResultRow[]>([]);
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [qrPlatform, setQrPlatform] = useState<PlatformKey>("tencent");
    const [qrStatusText, setQrStatusText] = useState("正在生成二维码...");
    const [qrFreshKey, setQrFreshKey] = useState(Date.now());
    const [copyStyle, setCopyStyle] = useState<"hot" | "pro" | "story" | "hook">("hot");
    const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [isSyncingCookies, setIsSyncingCookies] = useState(false);

    // 从本机 Chrome 同步浏览器会话
    const handleSyncBrowserCookies = async (plat: PlatformKey = "tencent") => {
        setIsSyncingCookies(true);
        try {
            const res = await fetch("/api/publish/sync-browser-cookies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ platform: plat, account: "my" }),
            });
            const data = await res.json();
            if (res.ok && data.ok) {
                message.success(`已从本机 Chrome 同步 ${plat === "tencent" ? "微信视频号" : plat} 最新登录态！`);
                // 刷新平台状态并勾选视频号
                fetch("/api/publish/platforms")
                    .then((r) => r.json())
                    .then((d) => {
                        if (d.ok) {
                            setPlatformsData(d);
                            setSelectedPlatforms((prev) => (prev.includes(plat) ? prev : [...prev, plat]));
                        }
                    });
            } else {
                message.error(`同步未完成: ${data.error || "未能获取有效会话"}`);
            }
        } catch (e: any) {
            message.error(`同步异常: ${e.message}`);
        } finally {
            setIsSyncingCookies(false);
        }
    };

    // 将前端 URL 转为后端识别的 media_id
    const resolveMediaId = (a: Asset | null): string => {
        if (!a) return "";
        const url = a.kind === "video" ? a.data.url : "";
        if (url.includes("/api/media/")) {
            const sub = url.split("/api/media/")[1];
            const parts = sub.split("/");
            const folder = decodeURIComponent(parts[0]);
            const file = decodeURIComponent(parts.slice(1).join("/"));
            return `${folder}/${file}`;
        }
        return `out/replicate_douyin_b/deliver/${a.title}.mp4`;
    };

    const mediaId = resolveMediaId(asset);

    const fetchPlatforms = () => {
        setIsLoadingPlatforms(true);
        fetch("/api/publish/platforms")
            .then((res) => res.json())
            .then((data: PlatformsResponse) => {
                if (data && data.ok) {
                    setPlatformsData(data);
                }
            })
            .catch((err) => {
                console.error("加载发布平台状态失败:", err);
            })
            .finally(() => {
                setIsLoadingPlatforms(false);
            });
    };

    // 加载平台信息
    useEffect(() => {
        if (!open) return;
        fetchPlatforms();
    }, [open]);

    const openQrModal = async (key: PlatformKey) => {
        setQrPlatform(key);
        setQrModalOpen(true);
        setQrStatusText("正在启动扫码授权通道...");
        setQrFreshKey(Date.now());
        try {
            await fetch("/api/publish-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ platform: key, account: "my" }),
            });
            setQrFreshKey(Date.now());
        } catch (e: any) {
            console.error("拉起登录失败:", e);
        }
    };

    // 二维码弹窗打开时轮询扫码状态
    useEffect(() => {
        if (!qrModalOpen) return;
        let timer: any = null;
        let active = true;

        const checkStatus = async () => {
            try {
                const res = await fetch(`/api/publish-login?platform=${qrPlatform}&account=my`);
                if (!res.ok) return;
                const data = await res.json();
                if (!active) return;
                if (data.message) {
                    setQrStatusText(data.message);
                }
                if (data.logged_in) {
                    message.success(`${PLATFORM_CONFIG[qrPlatform].name}登录成功！会话已就绪。`);
                    setQrModalOpen(false);
                    fetchPlatforms();
                    return;
                }
            } catch (e) {
                // ignore
            }
            if (active) {
                timer = setTimeout(checkStatus, 2000);
            }
        };

        timer = setTimeout(checkStatus, 1500);

        return () => {
            active = false;
            if (timer) clearTimeout(timer);
        };
    }, [qrModalOpen, qrPlatform]);

    // 初始化表单预填文案
    useEffect(() => {
        if (open && asset) {
            setPublishStatus("idle");
            setDryRunResult(null);
            setStatusLogs([]);
            setPublishRows([]);
            form.setFieldsValue({
                title: asset.title?.includes("复刻") ? "冬虫夏草怎么冲泡？1:1正宗冲泡吃法讲明白，别再泡错了！" : (asset.title || "冬虫夏草养生冲泡教学"),
                desc: "很多朋友买回去都泡错了！今天教大家西藏那曲冬虫夏草的正确冲泡方法：先流水轻冲，取3~4根放入杯中，用85度温开水闷泡10分钟，汤色金黄透亮，香气浓郁。可以反复冲泡3到4次，最后一定要把虫草嚼碎吃下，营养全部吸收一点不浪费！",
                tags: ["冬虫夏草", "虫草怎么冲泡", "养生知识", "健康滋补", "那曲冬虫夏草"],
            });
        }
    }, [open, asset, form]);

    // 平台勾选切换
    const togglePlatform = (key: PlatformKey) => {
        setSelectedPlatforms((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    };

    // AI 一键生成文案（标题、描述、标签）
    const handleGenerateCopy = async (targetField?: "all" | "title" | "desc" | "tags", overrideStyle?: string) => {
        setIsGeneratingCopy(true);
        const activeStyle = overrideStyle || copyStyle;
        const formTitle = form.getFieldValue("title");
        const domTitleInput = typeof document !== "undefined" ? (document.querySelector('input[placeholder*="爆款标题"]') as HTMLInputElement | null) : null;
        const reliableTitle = (formTitle || domTitleInput?.value || "").trim();
        try {
            const res = await fetch("/api/publish/generate-copy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    video_title: asset?.title || "",
                    current_title: reliableTitle,
                    style: activeStyle,
                    field: targetField || "all",
                }),
            });
            const data = await res.json();
            if (data && data.ok) {
                const cleanTags = (data.tags || []).map((t: string) => t.replace(/^#/, "").trim()).filter(Boolean);
                if (!targetField || targetField === "all") {
                    form.setFieldsValue({
                        title: data.title,
                        desc: data.desc,
                        tags: cleanTags,
                    });
                    const styleNameMap: Record<string, string> = {
                        hot: "🔥 爆款促单",
                        pro: "🌿 权威科普",
                        story: "🏔️ 雪山实录",
                        hook: "💡 避坑辟谣",
                    };
                    message.success(`✨ 已一键生成【${styleNameMap[data.style] || "智能"}风】成套标题与呼应文案！`);
                } else if (targetField === "title") {
                    // ★ 换标题时，自动同步更新完全咬合该标题的台本文案，杜绝标题文案脱节！
                    form.setFieldsValue({
                        title: data.title,
                        desc: data.desc,
                        tags: cleanTags,
                    });
                    message.success("✨ 已换上新标题，并同步更新了紧扣该标题的专属台本与话题！");
                } else if (targetField === "desc") {
                    form.setFieldsValue({ desc: data.desc });
                    message.success("✨ 已针对当前标题深度定制专属呼应文案！");
                } else if (targetField === "tags") {
                    form.setFieldsValue({ tags: cleanTags });
                    message.success("✨ 已刷新热门话题标签！");
                }
            } else {
                message.error("生成文案失败，请稍后重试");
            }
        } catch (e: any) {
            message.error(`生成异常: ${e.message}`);
        } finally {
            setIsGeneratingCopy(false);
        }
    };

    // 一键复制标题、文案与标签
    const handleCopyAll = () => {
        const vals = form.getFieldsValue();
        const tagStr = (vals.tags || []).map((t: string) => `#${t.replace(/^#/, "")}`).join(" ");
        const fullText = `【作品标题】\n${vals.title || ""}\n\n【视频文案】\n${vals.desc || ""}\n\n【话题标签】\n${tagStr}`;
        void navigator.clipboard.writeText(fullText);
        setIsCopied(true);
        message.success("已复制完整标题与文案到剪贴板！");
        setTimeout(() => setIsCopied(false), 2000);
    };

    // 模拟预检 (Dry Run)
    const handleDryRun = async () => {
        if (selectedPlatforms.length === 0) {
            message.warning("请至少勾选一个要发布的平台！");
            return;
        }
        const values = await form.validateFields();
        setIsDryRunning(true);
        setDryRunResult(null);
        try {
            const res = await fetch("/api/publish/multi", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    media_id: mediaId,
                    platforms: selectedPlatforms,
                    title: values.title.trim(),
                    desc: values.desc.trim(),
                    tags: values.tags || [],
                    dry: true,
                }),
            });
            const data = await res.json();
            if (res.ok && data.ok) {
                setDryRunResult(data);
                message.success("预检通过！文件绝对路径、字节数与平台白名单校验完毕。");
            } else {
                message.error(`预检未通过: ${data.detail || data.msg || "未知原因"}`);
            }
        } catch (e: any) {
            message.error(`预检请求异常: ${e.message}`);
        } finally {
            setIsDryRunning(false);
        }
    };

    // 真实一键多平台发布
    const handlePublish = async () => {
        if (selectedPlatforms.length === 0) {
            message.warning("请至少勾选一个要发布的平台！");
            return;
        }
        const values = await form.validateFields();
        setIsPublishing(true);
        setPublishStatus("running");
        setStatusLogs(["【中枢启动】正在向发布队列注册三平台多路任务..."]);
        setPublishRows([]);

        try {
            const res = await fetch("/api/publish/multi", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    media_id: mediaId,
                    platforms: selectedPlatforms,
                    title: values.title.trim(),
                    desc: values.desc.trim(),
                    tags: values.tags || [],
                    account: "my",
                    dry: false,
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                throw new Error(data.detail || data.msg || "提交发布任务失败");
            }
            const jid = data.job_id;
            setJobId(jid);
            setStatusLogs((prev) => [...prev, `任务已受理，队列单号: ${jid}，开始串行拉起自动化上传引擎...`]);

            // 轮询任务状态 (最长 6 分钟)
            const deadline = Date.now() + 6 * 60 * 1000;
            let finishedJob: any = null;

            while (Date.now() < deadline) {
                await new Promise((r) => setTimeout(r, 2000));
                const pollRes = await fetch(`/api/jobs/${jid}`);
                if (!pollRes.ok) continue;
                const pollData = await pollRes.json();
                const currentJob = pollData.job || pollData;

                if (currentJob.logs && currentJob.logs.length > 0) {
                    setStatusLogs(currentJob.logs);
                }

                if (["done", "error", "cancelled"].includes(currentJob.status)) {
                    finishedJob = currentJob;
                    break;
                }
            }

            if (!finishedJob) {
                setPublishStatus("unconfirmed");
                message.warning("发布任务处理耗时较长，请前往各平台后台核对是否已出草稿，请勿重复提交。");
                return;
            }

            if (finishedJob.status === "error") {
                setPublishStatus("unconfirmed");
                message.error(`任务执行异常: ${finishedJob.error || "未知错误"}`);
                return;
            }

            const results = (finishedJob.result && finishedJob.result.results) || [];
            setPublishRows(results);
            setPublishStatus("done");
            // 发完立刻刷一遍履历，卡片上的「已发布」角标不用等下次进页面才亮。
            void usePublishStore.getState().refresh();

            const okCount = results.filter((r: any) => r.status === "ok").length;
            const uncCount = results.filter((r: any) => r.status === "unconfirmed").length;
            if (okCount > 0) {
                message.success(`多平台发布完成！共 ${okCount} 个平台成功发布。`);
            } else if (uncCount > 0) {
                message.warning("有平台回执处于未确认状态，可能已成功发布，请去后台核对，切忌重复发布！");
            }
        } catch (e: any) {
            setPublishStatus("error");
            setStatusLogs((prev) => [...prev, `❌ 错误: ${e.message}`]);
            message.error(`发布异常: ${e.message}`);
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <Modal
            open={open}
            title={
                <div className="flex items-center gap-2 text-base font-bold">
                    <Send className="size-4 text-emerald-500" />
                    <span>多平台一键发布中枢（抖音 · 快手 · 视频号）</span>
                </div>
            }
            width={760}
            onCancel={onClose}
            footer={null}
            destroyOnHidden
        >
            <div className="space-y-5 pt-2">
                {/* 待发布视频概览卡片 */}
                {asset && (
                    <div className="flex items-center gap-3.5 rounded-xl border border-stone-200/80 bg-stone-50/80 p-3.5 dark:border-stone-800 dark:bg-stone-900/60">
                        <div className="relative aspect-[9/16] w-14 shrink-0 overflow-hidden rounded-lg bg-black shadow-xs">
                            <img src={asset.coverUrl || (asset as any).url} alt="" className="size-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Play className="size-3.5 fill-white text-white" />
                            </div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h4 className="line-clamp-1 text-sm font-semibold text-stone-900 dark:text-stone-100">{asset.title}</h4>
                                <Tag color="blue" className="m-0 text-[10px]">
                                    {asset.source || "成片"}
                                </Tag>
                            </div>
                            <p className="mt-1 text-xs text-stone-500">{asset.note || "720x1280 @ 30fps"}</p>
                            <p className="mt-0.5 truncate font-mono text-[10px] text-stone-400">Media ID: {mediaId}</p>
                        </div>
                    </div>
                )}

                {/* 平台勾选矩阵 */}
                <div>
                    <div className="flex items-center justify-between pb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">选择发布目标平台</span>
                        <Space size={8}>
                            <Button
                                size="small"
                                type="link"
                                className="p-0 text-xs"
                                onClick={() => setSelectedPlatforms(["douyin", "kuaishou", "tencent"])}
                            >
                                全选
                            </Button>
                            <span className="text-stone-300">|</span>
                            <Button size="small" type="link" className="p-0 text-xs text-stone-400" onClick={() => setSelectedPlatforms([])}>
                                清空
                            </Button>
                        </Space>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                        {(["douyin", "kuaishou", "tencent"] as PlatformKey[]).map((key) => {
                            const cfg = PLATFORM_CONFIG[key];
                            const pfInfo = platformsData?.platforms?.[key];
                            const isChecked = selectedPlatforms.includes(key);
                            const hasCookie = pfInfo ? pfInfo.has_cookie : true;

                            return (
                                <div
                                    key={key}
                                    onClick={() => togglePlatform(key)}
                                    className={cn(
                                        "flex cursor-pointer flex-col justify-between rounded-xl border p-3 transition-all",
                                        isChecked ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/50 dark:bg-emerald-950/20" : "border-stone-200 bg-white hover:border-stone-300 dark:border-stone-800 dark:bg-stone-900"
                                    )}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{cfg.icon}</span>
                                            <div>
                                                <span className="text-sm font-bold text-stone-900 dark:text-stone-100">{cfg.name}</span>
                                                <span className="block text-[11px] text-stone-400">{cfg.desc}</span>
                                            </div>
                                        </div>
                                        <Checkbox checked={isChecked} />
                                    </div>

                                    <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2 text-[11px] dark:border-stone-800/80">
                                        <div className="flex items-center gap-1">
                                            {hasCookie ? (
                                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                                    <span className="size-1.5 rounded-full bg-emerald-500" />
                                                    {key === "tencent" ? "微信会话" : "已授权登录"}
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-amber-600">
                                                    <span className="size-1.5 rounded-full bg-amber-500" />
                                                    未登录
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {key === "tencent" && (
                                                <button
                                                    type="button"
                                                    disabled={isSyncingCookies}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSyncBrowserCookies("tencent");
                                                    }}
                                                    className="rounded px-1.5 py-0.5 text-[11px] font-medium text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950/40"
                                                    title="直接从本机已登录视频号的 Chrome 提取会话"
                                                >
                                                    {isSyncingCookies ? "同步中..." : "同步Chrome"}
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openQrModal(key);
                                                }}
                                                className="rounded px-1.5 py-0.5 text-[11px] font-medium text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                                            >
                                                扫码授权
                                            </button>
                                            {pfInfo?.home && (
                                                <a
                                                    href={pfInfo.home}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex items-center gap-0.5 text-stone-400 hover:text-emerald-500"
                                                >
                                                    后台 <ExternalLink className="size-2.5" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {selectedPlatforms.includes("tencent") && (
                        <Alert
                            type="info"
                            showIcon
                            className="mt-2.5 text-xs"
                            message="视频号说明：已支持自动从本机 Chrome（虫草滋补）提取登录态。发布时将自动同步，也可点击卡片上的【同步Chrome】随时刷新。"
                        />
                    )}
                </div>

                {/* 发布文案表单 */}
                <Form form={form} layout="vertical" requiredMark={false} className="rounded-xl border border-stone-200/80 p-4 dark:border-stone-800">
                    {/* ✨ AI 一键生成文案中枢工具栏 */}
                    <div className="mb-4 rounded-xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-emerald-500/10 p-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2">
                                <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-xs">
                                    <Sparkles className="size-4 animate-pulse" />
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-stone-900 dark:text-stone-100">AI 爆款文案生成引擎</span>
                                    <span className="ml-2 text-[11px] text-stone-500">一键生成全套爆款标题、带货台本与精准话题</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="primary"
                                    icon={<Wand2 className="size-3.5" />}
                                    loading={isGeneratingCopy}
                                    onClick={() => handleGenerateCopy("all")}
                                    className="border-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 font-semibold shadow-xs hover:opacity-95"
                                >
                                    ✨ 一键生成标题与文案
                                </Button>
                                <Button
                                    size="middle"
                                    icon={isCopied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                                    onClick={handleCopyAll}
                                    title="复制标题与文案到剪贴板"
                                >
                                    {isCopied ? "已复制" : "复制"}
                                </Button>
                            </div>
                        </div>

                        {/* 风格快速切换胶囊 */}
                        <div className="mt-2.5 flex items-center gap-1.5 border-t border-purple-200/40 pt-2 dark:border-purple-900/40">
                            <span className="text-[11px] font-medium text-stone-500">文案风格：</span>
                            <div className="flex flex-wrap gap-1.5">
                                {[
                                    { key: "hot", label: "🔥 爆款促单", desc: "直击痛点·转化率高" },
                                    { key: "pro", label: "🌿 权威科普", desc: "草本药理·建立信赖" },
                                    { key: "story", label: "🏔️ 雪山实录", desc: "藏地采挖·源头真实" },
                                    { key: "hook", label: "💡 避坑辟谣", desc: "黄金3秒·引爆评论" },
                                ].map((s) => (
                                    <button
                                        key={s.key}
                                        type="button"
                                        onClick={() => {
                                            setCopyStyle(s.key as any);
                                            handleGenerateCopy("all", s.key);
                                        }}
                                        className={cn(
                                            "flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-all",
                                            copyStyle === s.key
                                                ? "bg-purple-600 text-white shadow-xs"
                                                : "bg-white/80 text-stone-600 hover:bg-white hover:text-purple-600 dark:bg-stone-800/80 dark:text-stone-300 dark:hover:bg-stone-800"
                                        )}
                                    >
                                        <span>{s.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 作品标题 */}
                    <Form.Item
                        name="title"
                        label={
                            <div className="flex w-full items-center justify-between">
                                <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">作品标题</span>
                                <button
                                    type="button"
                                    onClick={() => handleGenerateCopy("title")}
                                    className="flex items-center gap-1 text-[11px] font-medium text-purple-600 hover:underline dark:text-purple-400"
                                >
                                    <RefreshCw className={cn("size-3", isGeneratingCopy && "animate-spin")} />
                                    🎲 换个标题
                                </button>
                            </div>
                        }
                        rules={[{ required: true, message: "请输入发布标题" }]}
                    >
                        <Input size="middle" placeholder="输入吸引人的爆款标题..." maxLength={60} showCount onChange={(e) => form.setFieldsValue({ title: e.target.value })} />
                    </Form.Item>

                    {/* 文案描述 / 视频台本 */}
                    <Form.Item
                        name="desc"
                        label={
                            <div className="flex w-full items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">文案描述 / 视频台本</span>
                                    <span className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-medium text-purple-600 dark:bg-purple-900/30 dark:text-purple-300">
                                        🔗 紧扣当前标题深度呼应展开
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleGenerateCopy("desc")}
                                    className="flex items-center gap-1 text-[11px] font-medium text-purple-600 hover:underline dark:text-purple-400"
                                >
                                    <RefreshCw className={cn("size-3", isGeneratingCopy && "animate-spin")} />
                                    🎲 换段文案
                                </button>
                            </div>
                        }
                    >
                        <Input.TextArea rows={4} placeholder="输入作品详细描述、冲泡步骤与知识点..." maxLength={500} showCount />
                    </Form.Item>

                    {/* 热门话题标签 */}
                    <Form.Item
                        name="tags"
                        label={
                            <div className="flex w-full items-center justify-between">
                                <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">热门话题标签</span>
                                <button
                                    type="button"
                                    onClick={() => handleGenerateCopy("tags")}
                                    className="flex items-center gap-1 text-[11px] font-medium text-purple-600 hover:underline dark:text-purple-400"
                                >
                                    <RefreshCw className={cn("size-3", isGeneratingCopy && "animate-spin")} />
                                    🎲 刷新标签
                                </button>
                            </div>
                        }
                    >
                        <Select mode="tags" tokenSeparators={[",", "，", " "]} placeholder="输入话题标签，按回车添加..." />
                    </Form.Item>
                </Form>

                {/* 预检成功结果条 */}
                {dryRunResult && (
                    <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-3.5 text-xs text-emerald-800 dark:text-emerald-300">
                        <div className="flex items-center gap-1.5 font-semibold">
                            <ShieldCheck className="size-4 text-emerald-600" />
                            <span>预检校验 100% 通过（安全零副作用）</span>
                        </div>
                        <div className="mt-1.5 grid grid-cols-2 gap-2 text-[11px]">
                            <div>目标文件：{(dryRunResult.bytes / 1024 / 1024).toFixed(2)} MB</div>
                            <div>已校验平台：{dryRunResult.platforms?.join("、")}</div>
                        </div>
                    </div>
                )}

                {/* 实时执行进度与回执 */}
                {publishStatus !== "idle" && (
                    <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-950 p-4 font-mono text-xs text-stone-200 dark:border-stone-800">
                        <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                            <span className="font-semibold text-stone-300">🚀 多平台发布执行控制台</span>
                            <Tag color={publishStatus === "done" ? "success" : publishStatus === "running" ? "processing" : "warning"} className="m-0">
                                {publishStatus === "done" ? "已完成" : publishStatus === "running" ? "执行中" : "异常待确认"}
                            </Tag>
                        </div>

                        {/* 实时滚动日志 */}
                        <div className="max-h-32 overflow-y-auto space-y-1 text-[11px] leading-relaxed text-stone-400">
                            {statusLogs.map((log, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <span className="text-stone-600">[{idx + 1}]</span>
                                    <span>{log}</span>
                                </div>
                            ))}
                        </div>

                        {/* 逐平台回执卡片 */}
                        {publishRows.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-stone-800">
                                <span className="text-xs font-semibold text-stone-400">逐平台回执状态：</span>
                                {publishRows.map((row) => {
                                    const cfg = PLATFORM_CONFIG[row.platform];
                                    const isOk = row.status === "ok";
                                    const isFail = row.status === "failed";
                                    return (
                                        <div
                                            key={row.platform}
                                            className={cn(
                                                "flex items-center justify-between rounded-lg px-3 py-2 text-xs",
                                                isOk ? "bg-emerald-950/40 border border-emerald-800/60 text-emerald-300" : isFail ? "bg-rose-950/40 border border-rose-800/60 text-rose-300" : "bg-amber-950/40 border border-amber-800/60 text-amber-300"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>{cfg?.icon}</span>
                                                <span className="font-bold">{cfg?.name}</span>
                                                <span>{isOk ? "发布成功" : isFail ? "发布失败" : "状态未确认"}</span>
                                            </div>
                                            {platformsData?.platforms?.[row.platform]?.home && (
                                                <a
                                                    href={platformsData.platforms[row.platform].home}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-1 underline underline-offset-2 text-stone-300 hover:text-white"
                                                >
                                                    去后台核对 <ExternalLink className="size-3" />
                                                </a>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* 底部按钮栏 */}
                <div className="flex items-center justify-between border-t border-stone-200/80 pt-4 dark:border-stone-800">
                    <Button
                        icon={<ShieldCheck className="size-4" />}
                        loading={isDryRunning}
                        disabled={isPublishing}
                        onClick={handleDryRun}
                    >
                        🧪 模拟预检 (Dry Run)
                    </Button>

                    <Space size={10}>
                        <Button onClick={onClose} disabled={isPublishing}>
                            取消
                        </Button>
                        <Button
                            type="primary"
                            icon={<Send className="size-4" />}
                            loading={isPublishing}
                            onClick={handlePublish}
                            className="bg-emerald-600 hover:bg-emerald-500 font-semibold"
                        >
                            🚀 立即一键发布（所选 {selectedPlatforms.length} 平台）
                        </Button>
                    </Space>
                </div>
            </div>

            {/* 扫码授权专属弹窗 */}
            <Modal
                open={qrModalOpen}
                title={
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{PLATFORM_CONFIG[qrPlatform].icon}</span>
                        <span className="font-bold">{PLATFORM_CONFIG[qrPlatform].name} 创作者扫码登录</span>
                    </div>
                }
                width={380}
                onCancel={() => setQrModalOpen(false)}
                footer={null}
                centered
                destroyOnHidden
            >
                <div className="flex flex-col items-center justify-center p-3 text-center">
                    <div className="relative mb-3 flex size-60 items-center justify-center overflow-hidden rounded-2xl border-2 border-stone-200 bg-white p-2 shadow-inner dark:border-stone-700 dark:bg-stone-900">
                        <img
                            src={`/api/publish-qr.png?platform=${qrPlatform}&t=${qrFreshKey}`}
                            alt="登录二维码"
                            className="size-full object-contain"
                        />
                    </div>
                    <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                        {qrPlatform === "tencent" ? "请使用手机【微信】扫描上方二维码并在手机端确认" : `请使用手机【${PLATFORM_CONFIG[qrPlatform].name} App】扫码`}
                    </p>
                    <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                        {qrStatusText}
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                        <Button
                            size="small"
                            onClick={() => {
                                setQrFreshKey(Date.now());
                                openQrModal(qrPlatform);
                            }}
                        >
                            🔄 刷新二维码
                        </Button>
                        <Button size="small" type="primary" onClick={() => setQrModalOpen(false)}>
                            关闭
                        </Button>
                    </div>
                </div>
            </Modal>
        </Modal>
    );
}
