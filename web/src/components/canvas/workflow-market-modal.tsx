import React, { useState } from "react";
import { Modal, Tag, Button, Input, Segmented, Badge, Tooltip, message } from "antd";
import { 
    Flame, Sparkles, Film, Video, Search, Play, Download, Copy, Check, 
    Layers, Cpu, ExternalLink, ArrowRight, Eye, Star, Share2, HelpCircle 
} from "lucide-react";
import type { WorkflowPresetId } from "@/lib/canvas/workflow-presets";

export interface WorkflowItem {
    id: WorkflowPresetId | string;
    title: string;
    author: string;
    avatar: string;
    category: "replicate" | "ecommerce" | "product" | "upscale";
    coverUrl: string;
    videoPreviewUrl?: string;
    badges: string[];
    runsCount: string;
    rating: string;
    nodesCount: number;
    description: string;
    models: string[];
    pipelineStages: string[];
}

const MARKET_WORKFLOWS: WorkflowItem[] = [
    {
        id: "h3",
        title: "MiniMax-H3 × ComfyUI · 1:1 抖音爆款深度音画复刻 (鲜草是活的吗？会咬人吗？)",
        author: "ComfyUI Official Lab",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=comfy_h3",
        category: "replicate",
        coverUrl: "/api/media/out%2Freplicate_alive_cordyceps%2Fdeliver/%E5%86%AC%E8%99%AB%E5%A4%8F%E8%8D%89_%E9%B2%9C%E8%8D%89%E6%98%AF%E6%B4%BB%E7%9A%84%E5%90%97_1to1%E5%A4%8D%E5%88%BB_%E8%80%81%E5%AD%97%E5%8F%B7%E5%B1%95%E5%8E%85%E5%8E%9F%E7%94%9F%E5%A4%A7%E7%89%87_%E7%BA%AF%E5%87%80%E7%89%88.jpg",
        videoPreviewUrl: "/api/media/out%2Freplicate_alive_cordyceps%2Fdeliver/%E5%86%AC%E8%99%AB%E5%A4%8F%E8%8D%89_%E9%B2%9C%E8%8D%89%E6%98%AF%E6%B4%BB%E7%9A%84%E5%90%97_1to1%E5%A4%8D%E5%88%BB_%E8%80%81%E5%AD%97%E5%8F%B7%E5%B1%95%E5%8E%85%E5%8E%9F%E7%94%9F%E5%A4%A7%E7%89%87_%E7%BA%AF%E5%87%80%E7%89%88.mp4",
        badges: ["🔥 Liblib 热度 Top 1", "58s 终极纯净版", "100% 深度换人"],
        runsCount: "5.2k",
        rating: "99.4%",
        nodesCount: 12,
        description: "对标 LiblibAI 与 ComfyUI 顶级实战流：以原片动作/运镜为底模，通过 MiniMaxH3_ECommerce_PromptReplacer 将人物替换为指定女掌柜、产品替换为正宗野生金黄鲜草，声音采用 EBU R128 母带标准，全片 8 镜连贯统一，无缝替换！",
        models: ["MiniMax-H3 Plan v2 (RV2V)", "Whisper-Large-v3", "InsightFace 128", "EBU R128 Master"],
        pipelineStages: [
            "原片动作运镜解耦 (Scene Split)",
            "人货场特征锁定 (Prompt Replacer)",
            "H3 视频编辑扩散大模型渲染",
            "InsightFace 逐帧平滑换脸",
            "母带音频与 1080P 电影级字幕压制"
        ],
    },
    {
        id: "ecommerce_face_swap",
        title: "电商带货模特 1:1 动态换人换脸工作流 (InsightFace + OpenPose + H3 扩散重绘)",
        author: "E-Commerce Master",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=ecommerce_face",
        category: "ecommerce",
        coverUrl: "/api/media/out%2Freplicate_alive_cordyceps%2Fref/user_specified_person.jpg",
        badges: ["电商必用", "零磨皮蜡像感", "发丝自然"],
        runsCount: "3.8k",
        rating: "98.9%",
        nodesCount: 10,
        description: "告别生硬贴片与蜡像磨皮！利用骨骼姿态 ControlNet 与 H3 视频底层扩散特征，输入任意带货模特正脸，即可无缝迁移到目标口播视频中，面部微表情、眨眼与唇形高度自然对齐。",
        models: ["InsightFace (inswapper_128)", "ControlNet OpenPose", "MiniMax-H3"],
        pipelineStages: [
            "模特五官高维向量提取",
            "视频关键帧人脸检测与跟踪",
            "光影色温直方图自适应匹配",
            "泊松无缝融合与边缘羽化"
        ],
    },
    {
        id: "product_commercial_stage",
        title: "核心实物产品置景与真实商用光影工作流 (FLUX.1 + 商业柔光 + 接触阴影)",
        author: "Studio Lighting Pro",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=lighting_pro",
        category: "product",
        coverUrl: "/api/media/out%2Freplicate_alive_cordyceps%2Fref/user_specified_product.jpg",
        badges: ["商用级渲染", "真实景深漫射", "产品守恒"],
        runsCount: "2.9k",
        rating: "98.1%",
        nodesCount: 8,
        description: "用于电商核心实物锁定与高档置景。将白底商品图（如白瓷沥水碗盛满金黄冬虫夏草）自动置入古朴红木老字号药斋或现代轻奢展厅，生成物理级接触阴影与焦外浅景深光斑。",
        models: ["FLUX.1-Dev", "BiRefNet 智能抠图", "ControlNet Depth"],
        pipelineStages: [
            "BiRefNet 发丝级白底抠图",
            "场景光照法线估计",
            "扩散背景环境生成",
            "接触阴影与漫反射合成"
        ],
    },
    {
        id: "upscale_4k_restore",
        title: "发丝级 4K 电影超清超分修复工作流 (RealESRGAN 4x + Topaz 级超清去噪)",
        author: "Cinema Ultra Lab",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=upscale_4k",
        category: "upscale",
        coverUrl: "/api/media/out%2Freplicate_alive_cordyceps%2Fdeliver/%E7%A0%B4%E5%A3%81%E8%B6%85%E7%BB%86%E7%B2%89%E5%86%B2%E6%B8%A9%E6%B0%B4%E5%BE%AE%E8%B7%9D.jpg",
        badges: ["4K 电影画质", "微距质感增强", "超细颗粒感"],
        runsCount: "4.6k",
        rating: "99.5%",
        nodesCount: 7,
        description: "将 720P/1080P 素材一键重构为 4K 发丝级超清质感。针对冬虫夏草环纹、草头绒毛、人体皮肤微毛孔进行针对性细节增强，告别塑料感模糊。",
        models: ["RealESRGAN_x4plus", "CodeFormer Face Enhance", "Film Grain Re-inject"],
        pipelineStages: [
            "输入视频去噪与伪影去除",
            "4x 潜空间超分辨率重建",
            "面部与道具微结构细节补充",
            "电影级胶片微噪点注入"
        ],
    },
    {
        id: "wild_replicate",
        title: "野生冬虫夏草高原形成记 · 秒级音画解耦与 H3-Muse 双轨复刻",
        author: "Wild Nature Studio",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=wild_nature",
        category: "replicate",
        coverUrl: "/api/media/out%2Freplicate_alive_cordyceps%2Fdeliver/%E5%A5%B3%E6%8E%8C%E6%9F%9C4500%E7%B1%B3%E9%9B%AA%E5%B1%B1%E7%8E%B0%E5%9C%BA.jpg",
        badges: ["4 条满血成片", "7 镜时序音画", "雪山实景"],
        runsCount: "2.1k",
        rating: "97.6%",
        nodesCount: 9,
        description: "基于抖音爆款《野生冬虫夏草高原形成记》：7 镜时序音画拆解，支持 H3 多模态音图复刻与 Muse 纯文本生视频双轨并行对比，全渠道矩阵分发。",
        models: ["MiniMax-H3", "Muse", "Seedance 2.5"],
        pipelineStages: [
            "7 镜时序镜头分割",
            "高原雪山环境提示词构建",
            "多模型画风对比测试",
            "成片快速导出交付"
        ],
    },
    {
        id: "muse_replicate",
        title: "Muse 原生带声 10s 标准切片多段合成复刻工作流 (冲泡教学 11 镜分镜链)",
        author: "Muse Audio Labs",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=muse_lab",
        category: "replicate",
        coverUrl: "/api/media/out%2Freplicate_douyin_b%2Fref/person_torso.jpg",
        badges: ["Muse 原生带声", "11 镜精准切片", "16.2MB 成片"],
        runsCount: "2.4k",
        rating: "98.2%",
        nodesCount: 11,
        description: "专为 Muse 10 秒原生发声定制：11 镜毫秒级精准分镜链，痛点抓人/核心干货/吃法促单，支持分段预览与一键导出 1080P 商业大片。",
        models: ["Muse Engine (vid-muse)", "FFmpeg Smart Stitcher"],
        pipelineStages: [
            "精准台词分段 (10s 窗口)",
            "Muse 原生带声视频生成",
            "多段无缝拼接与音频淡入淡出",
            "统一压制 1080P 交付片"
        ],
    },
];

export function WorkflowMarketModal({
    open,
    onCancel,
    onSelectPreset,
    onPreviewDeliver,
}: {
    open: boolean;
    onCancel: () => void;
    onSelectPreset: (presetId: WorkflowPresetId) => void;
    onPreviewDeliver?: (videoUrl: string) => void;
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [jsonDetailModalOpen, setJsonDetailModalOpen] = useState(false);
    const [selectedWorkflowForJson, setSelectedWorkflowForJson] = useState<WorkflowItem | null>(null);

    const filteredWorkflows = MARKET_WORKFLOWS.filter((wf) => {
        const matchesCategory = selectedCategory === "all" || wf.category === selectedCategory;
        const matchesQuery = 
            wf.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            wf.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            wf.models.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesQuery;
    });

    const handleApplyWorkflow = (wf: WorkflowItem) => {
        onSelectPreset(wf.id as WorkflowPresetId);
        onCancel();
        message.success({
            content: `🎉 已成功克隆【${wf.title.slice(0, 24)}...】到无限画布！包含 ${wf.nodesCount} 个节点`,
            duration: 4,
        });
    };

    const handleViewJson = (wf: WorkflowItem) => {
        setSelectedWorkflowForJson(wf);
        setJsonDetailModalOpen(true);
    };

    return (
        <>
            <Modal
                open={open}
                onCancel={onCancel}
                footer={null}
                width={1240}
                centered
                destroyOnClose
                styles={{
                    content: {
                        background: "#0c0e14",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        borderRadius: "24px",
                        boxShadow: "0 25px 80px rgba(0, 0, 0, 0.75)",
                        padding: "24px 32px",
                        color: "#f3f4f6",
                    },
                }}
            >
                {/* 顶部 Hero 区域 */}
                <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-lg shadow-rose-500/25">
                                <Flame className="size-6 animate-pulse" />
                            </span>
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <h2 className="text-xl font-bold tracking-tight text-white m-0">
                                        LiblibAI 风格工作流集市 · 模型与灵感广场
                                    </h2>
                                    <Tag color="#10b981" className="!rounded-full !px-2.5 !border-0 !text-xs font-semibold">
                                        ComfyUI 云端直通
                                    </Tag>
                                </div>
                                <p className="text-xs text-stone-400 mt-1 mb-0">
                                    深度集成 MiniMax-H3 / Muse / Seedance / FLUX · 爆款 1:1 动态音画复刻 · 电商人物与实物替换 · 一键整套克隆到画布
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Input
                                placeholder="搜索模型、工作流、节点算法..."
                                prefix={<Search className="size-4 text-stone-400" />}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="!w-72 !rounded-xl !bg-white/5 !border-white/10 !text-stone-200 placeholder:text-stone-500 hover:!border-white/20 focus:!border-emerald-500"
                            />
                        </div>
                    </div>

                    {/* 分类切换器 */}
                    <div className="flex items-center justify-between">
                        <Segmented
                            value={selectedCategory}
                            onChange={(val) => setSelectedCategory(val as string)}
                            options={[
                                { label: "🔥 全部精选", value: "all" },
                                { label: "🎬 爆款 1:1 音画复刻", value: "replicate" },
                                { label: "👗 电商模特换人换脸", value: "ecommerce" },
                                { label: "💎 核心实物商业置景", value: "product" },
                                { label: "✨ 4K 电影超清修复", value: "upscale" },
                            ]}
                            className="!rounded-xl !bg-white/5 !p-1 text-stone-300"
                        />

                        <div className="flex items-center gap-2 text-xs text-stone-400">
                            <span>共收录 <strong className="text-emerald-400 font-semibold">{filteredWorkflows.length}</strong> 套工业级工作流</span>
                        </div>
                    </div>
                </div>

                {/* 工作流卡片瀑布流 */}
                <div className="grid max-h-[68vh] grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 overflow-y-auto pr-1">
                    {filteredWorkflows.map((wf) => (
                        <div
                            key={wf.id}
                            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:bg-white/[0.06] hover:shadow-2xl hover:shadow-emerald-500/10"
                        >
                            {/* 封面与高光 */}
                            <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/40">
                                <img
                                    src={wf.coverUrl}
                                    alt={wf.title}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    onError={(e) => {
                                        (e.target as HTMLElement).style.display = "none";
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                                {/* 徽章 */}
                                <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                                    {wf.badges.map((b, i) => (
                                        <span
                                            key={i}
                                            className={`rounded-md px-2 py-0.5 text-[10px] font-medium backdrop-blur-md ${
                                                i === 0
                                                    ? "bg-rose-500/80 text-white"
                                                    : "bg-black/60 text-stone-200 border border-white/15"
                                            }`}
                                        >
                                            {b}
                                        </span>
                                    ))}
                                </div>

                                {/* 右上角节点数 */}
                                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
                                    <Cpu className="size-3" />
                                    <span>{wf.nodesCount} 节点拓扑</span>
                                </div>

                                {/* 视频实机快速预览按钮 */}
                                {wf.videoPreviewUrl && onPreviewDeliver && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onPreviewDeliver(wf.videoPreviewUrl!);
                                        }}
                                        className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 rounded-lg bg-emerald-500/90 px-2.5 py-1 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition-all hover:bg-emerald-400 hover:scale-105"
                                    >
                                        <Play className="size-3.5 fill-current" />
                                        <span>播放成片</span>
                                    </button>
                                )}

                                {/* 底部热度数据 */}
                                <div className="absolute bottom-2.5 left-2.5 flex items-center gap-3 text-[11px] text-stone-300">
                                    <span className="flex items-center gap-1">
                                        <Eye className="size-3 text-stone-400" />
                                        {wf.runsCount}
                                    </span>
                                    <span className="flex items-center gap-1 text-amber-400">
                                        <Star className="size-3 fill-current" />
                                        {wf.rating}
                                    </span>
                                </div>
                            </div>

                            {/* 卡片正文 */}
                            <div className="flex flex-1 flex-col p-4">
                                <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-emerald-400 transition-colors">
                                    {wf.title}
                                </h3>

                                <p className="mt-2 text-xs text-stone-400 line-clamp-3 leading-relaxed">
                                    {wf.description}
                                </p>

                                {/* 模型标签 */}
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {wf.models.map((m, i) => (
                                        <span
                                            key={i}
                                            className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-stone-300 border border-white/5"
                                        >
                                            {m}
                                        </span>
                                    ))}
                                </div>

                                {/* 流水线关键链路预览 */}
                                <div className="mt-3.5 rounded-xl bg-white/[0.02] border border-white/5 p-2.5">
                                    <div className="text-[10px] font-semibold text-stone-400 mb-1.5 flex items-center gap-1">
                                        <Layers className="size-3 text-blue-400" />
                                        <span>标准执行链路 (Pipeline)</span>
                                    </div>
                                    <div className="flex flex-col gap-1 text-[11px] text-stone-300">
                                        {wf.pipelineStages.slice(0, 3).map((st, i) => (
                                            <div key={i} className="flex items-center gap-1.5 truncate">
                                                <span className="size-1 rounded-full bg-emerald-500" />
                                                <span className="truncate">{st}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 底部操作栏 */}
                                <div className="mt-4 flex items-center gap-2 pt-2 border-t border-white/5">
                                    <Button
                                        type="primary"
                                        className="!flex-1 !h-8 !rounded-xl !bg-gradient-to-r !from-emerald-600 !to-teal-500 hover:!from-emerald-500 hover:!to-teal-400 !border-0 !text-xs !font-semibold shadow-md shadow-emerald-600/20"
                                        icon={<Sparkles className="size-3.5" />}
                                        onClick={() => handleApplyWorkflow(wf)}
                                    >
                                        立即克隆到画布
                                    </Button>

                                    <Tooltip title="查看 ComfyUI JSON 拓扑">
                                        <Button
                                            className="!h-8 !w-8 !rounded-xl !border-white/10 !bg-white/5 !text-stone-300 hover:!bg-white/10 hover:!border-white/20 p-0 flex items-center justify-center"
                                            onClick={() => handleViewJson(wf)}
                                        >
                                            <Copy className="size-3.5" />
                                        </Button>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Modal>

            {/* 查看工作流 JSON Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2 text-white">
                        <Cpu className="size-4 text-emerald-400" />
                        <span>ComfyUI 标准工作流拓扑结构</span>
                    </div>
                }
                open={jsonDetailModalOpen}
                onCancel={() => setJsonDetailModalOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setJsonDetailModalOpen(false)} className="!rounded-xl">
                        关闭
                    </Button>,
                    <Button
                        key="copy"
                        type="primary"
                        icon={<Copy className="size-3.5" />}
                        className="!rounded-xl !bg-emerald-600 !border-0"
                        onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(selectedWorkflowForJson, null, 2));
                            message.success("工作流配置已复制到剪贴板！");
                        }}
                    >
                        复制 JSON
                    </Button>,
                ]}
                width={700}
                centered
                styles={{
                    content: {
                        background: "#11141c",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "20px",
                        color: "#fff",
                    },
                }}
            >
                {selectedWorkflowForJson && (
                    <div className="mt-3 space-y-3">
                        <div className="flex items-center justify-between text-xs text-stone-400">
                            <span>工作流名称: <strong className="text-white">{selectedWorkflowForJson.title}</strong></span>
                            <span>节点数: <strong className="text-emerald-400">{selectedWorkflowForJson.nodesCount}</strong></span>
                        </div>
                        <pre className="max-h-96 overflow-auto rounded-xl bg-black/60 p-3.5 text-xs text-emerald-300 font-mono border border-white/5">
                            {JSON.stringify(
                                {
                                    id: selectedWorkflowForJson.id,
                                    version: "1.2.0-liblib",
                                    nodes_count: selectedWorkflowForJson.nodesCount,
                                    models: selectedWorkflowForJson.models,
                                    pipeline: selectedWorkflowForJson.pipelineStages,
                                    description: selectedWorkflowForJson.description,
                                },
                                null,
                                2
                            )}
                        </pre>
                    </div>
                )}
            </Modal>
        </>
    );
}
