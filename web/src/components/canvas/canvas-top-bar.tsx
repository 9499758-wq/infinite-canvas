import { useEffect, useRef, useState } from "react";
import { 
    BookOpen, Bot, CheckCircle2, Cpu, Download, FileJson, Film, Flame, 
    Home, Images, Layers, Menu, PanelLeftClose, PanelLeftOpen, Play, Plus, 
    Redo2, SlidersHorizontal, Sparkles, Trash2, Undo2, Upload, Video, FolderDown 
} from "lucide-react";
import { Button, Dropdown, Modal, Tag, Tooltip, message } from "antd";
import { useTranslation } from "react-i18next";

import { UserStatusActions } from "@/components/layout/user-status-actions";
import { canvasThemes } from "@/lib/canvas-theme";
import { useCanvasSidePanelStore } from "@/stores/use-canvas-side-panel-store";
import { useThemeStore } from "@/stores/use-theme-store";
import { DOCS_URL } from "@/constant/env";
import { WORKFLOW_PRESETS, type WorkflowPresetId } from "@/lib/canvas/workflow-presets";
import { GlobalQueueDock } from "./global-queue-dock";

export function CanvasTopBar({
    title,
    titleDraft,
    isTitleEditing,
    onTitleDraftChange,
    onStartTitleEditing,
    onFinishTitleEditing,
    onCancelTitleEditing,
    canUndo,
    canRedo,
    onHome,
    onProjects,
    onCreateProject,
    onDeleteProject,
    onExportProject,
    onImportImage,
    onOpenPlugins,
    onUndo,
    onRedo,
    onApplyWorkflow,
    onRunReplicate,
    onOpenMarket,
    onOpenInspector,
    onOpenComfyImporter,
    onOpenDeliverPlayer,
    onRunGlobalPipeline,
    isRunningWorkflow = false,
    currentModelType = "h3",
    agentOpen,
    compactAgentStatus,
    onToggleAgent,
}: {
    title: string;
    titleDraft: string;
    isTitleEditing: boolean;
    onTitleDraftChange: (value: string) => void;
    onStartTitleEditing: () => void;
    onFinishTitleEditing: () => void;
    onCancelTitleEditing: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onHome: () => void;
    onProjects: () => void;
    onCreateProject: () => void;
    onDeleteProject: () => void;
    onExportProject: () => void;
    onImportImage: () => void;
    onOpenPlugins: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onApplyWorkflow?: (presetId: WorkflowPresetId) => void;
    onRunReplicate?: (model: "h3" | "muse" | "sd") => void;
    onOpenMarket?: () => void;
    onOpenInspector?: () => void;
    onOpenComfyImporter?: () => void;
    onOpenDeliverPlayer?: () => void;
    onRunGlobalPipeline?: () => void;
    isRunningWorkflow?: boolean;
    currentModelType?: "h3" | "muse" | "sd";
    agentOpen: boolean;
    compactAgentStatus: { connected: boolean; enabled: boolean; activity: string };
    onToggleAgent: () => void;
}) {
    const colorTheme = useThemeStore((state) => state.theme);
    const { t } = useTranslation();
    const theme = canvasThemes[colorTheme];
    const titleRef = useRef<HTMLDivElement>(null);
    const [shortcutsOpen, setShortcutsOpen] = useState(false);
    const [comfyModalOpen, setComfyModalOpen] = useState(false);
    const [comfyLoading, setComfyLoading] = useState(false);
    const [comfyStatus, setComfyStatus] = useState<any>(null);
    const sidePanelOpen = useCanvasSidePanelStore((state) => state.panelOpen);
    const toggleSidePanel = useCanvasSidePanelStore((state) => state.togglePanel);

    const handleExportComfyWorkflow = async () => {
        try {
            message.loading({ content: "正在导出 ComfyUI 原生标准 JSON 工作流...", key: "comfy_export" });
            const res = await fetch("/api/canvas/comfy/export");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "h3_alive_cordyceps_1to1_comfy_workflow.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            message.success({ content: "🎉 已成功导出 ComfyUI 原生工作流 JSON！可直接拖入 ComfyUI 执行", key: "comfy_export", duration: 4 });
        } catch (e: any) {
            message.error({ content: `导出失败: ${e.message}`, key: "comfy_export" });
        }
    };

    const handleOpenComfyStatus = async () => {
        setComfyModalOpen(true);
        setComfyLoading(true);
        try {
            const res = await fetch("/api/canvas/comfy/status");
            const data = await res.json();
            setComfyStatus(data);
        } catch (e: any) {
            console.error("Fetch comfy status error:", e);
        } finally {
            setComfyLoading(false);
        }
    };

    useEffect(() => {
        if (!isTitleEditing) return;
        const close = (event: PointerEvent) => {
            if (!titleRef.current?.contains(event.target as Node)) onFinishTitleEditing();
        };
        document.addEventListener("pointerdown", close, true);
        return () => document.removeEventListener("pointerdown", close, true);
    }, [isTitleEditing, onFinishTitleEditing]);

    return (
        <>
            <div className="pointer-events-none absolute left-0 right-0 top-0 z-50 flex h-16 items-center justify-between pl-1 pr-4">
                <div className="pointer-events-auto flex min-w-0 items-center gap-2">
                    <Tooltip title={sidePanelOpen ? t("canvas.collapsePanel") : t("canvas.expandPanel")}>
                        <button
                            type="button"
                            onClick={toggleSidePanel}
                            aria-label={sidePanelOpen ? t("canvas.collapsePanel") : t("canvas.expandPanel")}
                            className="grid size-7 place-items-center rounded-full transition hover:bg-black/5 dark:hover:bg-white/10"
                            style={{ color: theme.node.text }}
                        >
                            {sidePanelOpen ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
                        </button>
                    </Tooltip>
                    <Dropdown
                        trigger={["click"]}
                        menu={{
                            items: [
                                { key: "home", icon: <Home className="size-4" />, label: t("canvas.home"), onClick: onHome },
                                { key: "docs", icon: <BookOpen className="size-4" />, label: t("canvas.docs"), onClick: () => window.open(DOCS_URL, "_blank", "noopener,noreferrer") },
                                { key: "projects", icon: <Images className="size-4" />, label: t("canvas.projects"), onClick: onProjects },
                                { type: "divider" },
                                { key: "new", icon: <Plus className="size-4" />, label: t("canvas.create"), onClick: onCreateProject },
                                { key: "delete", danger: true, icon: <Trash2 className="size-4" />, label: t("canvas.deleteCurrent"), onClick: onDeleteProject },
                                { type: "divider" },
                                { key: "import", icon: <Upload className="size-4" />, label: t("canvas.importAsset"), onClick: onImportImage },
                                { key: "export", icon: <Download className="size-4" />, label: t("canvas.exportCurrent"), onClick: onExportProject },
                                { type: "divider" },
                                { key: "undo", disabled: !canUndo, icon: <Undo2 className="size-4" />, label: <MenuLabel text={t("canvas.undo")} shortcut="⌘ Z" />, onClick: onUndo },
                                { key: "redo", disabled: !canRedo, icon: <Redo2 className="size-4" />, label: <MenuLabel text={t("canvas.redo")} shortcut="⌘ ⇧ Z / ⌘ Y" />, onClick: onRedo },
                            ],
                        }}
                    >
                        <button type="button" className="grid size-7 place-items-center rounded-full transition hover:bg-black/5 dark:hover:bg-white/10" style={{ color: theme.node.text }} aria-label={t("canvas.openMenu")}>
                            <Menu className="size-4" />
                        </button>
                    </Dropdown>

                    <div ref={titleRef} className="flex min-w-0 items-center gap-2">
                        {isTitleEditing ? (
                            <input
                                autoFocus
                                value={titleDraft}
                                onChange={(event) => onTitleDraftChange(event.target.value)}
                                onBlur={onFinishTitleEditing}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") onFinishTitleEditing();
                                    if (event.key === "Escape") onCancelTitleEditing();
                                }}
                                className="max-w-[280px] bg-transparent p-0 text-left text-lg font-semibold tracking-normal outline-none"
                                style={{ color: theme.node.text }}
                            />
                        ) : (
                            <button
                                type="button"
                                className="max-w-[280px] truncate border-b border-dashed border-transparent text-left text-lg font-semibold tracking-normal transition hover:border-current"
                                onDoubleClick={onStartTitleEditing}
                                title={t("canvas.renameHint")}
                            >
                                {title}
                            </button>
                        )}
                    </div>

                    {/* 🔥 LiblibAI 工作流集市按钮 */}
                    {onOpenMarket && (
                        <Button
                            size="small"
                            className="!h-7 !rounded-lg !px-2.5 !text-xs !font-bold transition-all hover:scale-105 shadow-sm"
                            style={{
                                background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                                borderColor: "transparent",
                                color: "#ffffff",
                            }}
                            icon={<Flame className="size-3.5 fill-current text-amber-200 animate-pulse" />}
                            onClick={onOpenMarket}
                        >
                            🔥 Liblib 工作流集市
                        </Button>
                    )}

                    {/* 🎬 58s 终极纯净成片快捷检视 */}
                    {onOpenDeliverPlayer && (
                        <Button
                            size="small"
                            className="!h-7 !rounded-lg !px-2.5 !text-xs !font-semibold transition-all hover:scale-105 border border-emerald-500/30"
                            style={{
                                background: theme.toolbar.panel,
                                color: "#10b981",
                            }}
                            icon={<Film className="size-3.5 text-emerald-400" />}
                            onClick={onOpenDeliverPlayer}
                        >
                            🎬 58s 终极成片检视
                        </Button>
                    )}

                    {/* ComfyUI 深度整合中枢 */}
                    <Dropdown
                        trigger={["click"]}
                        menu={{
                            items: [
                                {
                                    key: "comfy_header",
                                    disabled: true,
                                    label: <span className="text-xs font-semibold text-emerald-500">🧩 ComfyUI 深度整合中枢 (RV2V 精髓)</span>,
                                },
                                {
                                    key: "import_comfy_json",
                                    icon: <Upload className="size-4 text-emerald-400" />,
                                    label: (
                                        <div className="flex flex-col py-0.5">
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <span>导入外部 ComfyUI 工作流 JSON</span>
                                                <span className="rounded bg-emerald-500/10 px-1 py-0.5 text-[10px] text-emerald-600 font-normal">支持拖拽/粘贴</span>
                                            </div>
                                            <span className="text-xs text-stone-400">将 Liblib/ComfyUI 导出的 JSON 直接铺满画布</span>
                                        </div>
                                    ),
                                    onClick: onOpenComfyImporter,
                                },
                                {
                                    key: "export_comfy_json",
                                    icon: <FileJson className="size-4 text-emerald-500" />,
                                    label: (
                                        <div className="flex flex-col py-0.5">
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <span>导出 ComfyUI 原生工作流 JSON</span>
                                                <span className="rounded bg-emerald-500/10 px-1 py-0.5 text-[10px] text-emerald-600 font-normal">标准12节点</span>
                                            </div>
                                            <span className="text-xs text-stone-400">可直接拖入原生 ComfyUI 或云端运行</span>
                                        </div>
                                    ),
                                    onClick: handleExportComfyWorkflow,
                                },
                                {
                                    key: "view_comfy_status",
                                    icon: <Cpu className="size-4 text-blue-500" />,
                                    label: (
                                        <div className="flex flex-col py-0.5">
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <span>ComfyUI 运行环境与模型状态</span>
                                                <span className="rounded bg-blue-500/10 px-1 py-0.5 text-[10px] text-blue-600 font-normal">CoreML / MPS</span>
                                            </div>
                                            <span className="text-xs text-stone-400">检测 inswapper_128 与 H3 API 状态</span>
                                        </div>
                                    ),
                                    onClick: handleOpenComfyStatus,
                                },
                                {
                                    type: "divider",
                                },
                                {
                                    key: "load_h3_comfy_preset",
                                    icon: <Film className="size-4 text-purple-500" />,
                                    label: (
                                        <div className="flex flex-col py-0.5">
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <span>载入 H3 RV2V 1:1 复刻管线预设</span>
                                                <span className="rounded bg-purple-500/10 px-1 py-0.5 text-[10px] text-purple-600 font-normal">49.8MB 纯净满血</span>
                                            </div>
                                            <span className="text-xs text-stone-400">在画布中铺开 12 节点 RV2V 完整拓扑</span>
                                        </div>
                                    ),
                                    onClick: () => onApplyWorkflow && onApplyWorkflow("h3"),
                                },
                            ],
                        }}
                    >
                        <Button
                            size="small"
                            className="!h-7 !rounded-lg !px-2.5 !text-xs !font-medium"
                            style={{
                                background: theme.toolbar.panel,
                                borderColor: "#10b981",
                                color: "#10b981",
                            }}
                            icon={<Sparkles className="size-3.5 text-emerald-500 animate-pulse" />}
                        >
                            🧩 ComfyUI
                        </Button>
                    </Dropdown>

                    {onApplyWorkflow && (
                        <Dropdown
                            trigger={["click"]}
                            menu={{
                                items: [
                                    {
                                        key: "header",
                                        disabled: true,
                                        label: <span className="text-xs font-semibold text-stone-400">⚡ 切换独立专属工作流（各是各）</span>,
                                    },
                                    {
                                        key: "h3",
                                        icon: <Film className="size-4 text-blue-600" />,
                                        label: (
                                            <div className="flex flex-col py-0.5">
                                                <div className="flex items-center gap-1.5 font-medium">
                                                    <span>ComfyUI × MiniMax-H3 (RV2V 复刻)</span>
                                                    <span className="rounded bg-blue-600/10 px-1 py-0.5 text-[10px] text-blue-600 font-normal">49.8MB 纯净满血</span>
                                                </div>
                                                <span className="text-xs text-stone-400">12 节点标准管线 · 1:1 换人换声成片</span>
                                            </div>
                                        ),
                                        onClick: () => onApplyWorkflow("h3"),
                                    },
                                    {
                                        key: "seedance",
                                        icon: <Sparkles className="size-4 text-amber-500" />,
                                        label: (
                                            <div className="flex flex-col py-0.5">
                                                <div className="flex items-center gap-1.5 font-medium">
                                                    <span>Seedance 2.5 独立工作流</span>
                                                    <span className="rounded bg-amber-500/10 px-1 py-0.5 text-[10px] text-amber-500 font-normal">商业高质</span>
                                                </div>
                                                <span className="text-xs text-stone-400">官方直连 · 丝滑动态微距与光影出片</span>
                                            </div>
                                        ),
                                        onClick: () => onApplyWorkflow("seedance"),
                                    },
                                    {
                                        key: "muse",
                                        icon: <Video className="size-4 text-pink-500" />,
                                        label: (
                                            <div className="flex flex-col py-0.5">
                                                <div className="flex items-center gap-1.5 font-medium">
                                                    <span>Muse 原生带声独立流</span>
                                                    <span className="rounded bg-pink-500/10 px-1 py-0.5 text-[10px] text-pink-500 font-normal">原生发声</span>
                                                </div>
                                                <span className="text-xs text-stone-400">原生带声 · 10s 动态微距与口播成片</span>
                                            </div>
                                        ),
                                        onClick: () => onApplyWorkflow("muse"),
                                    },
                                ],
                            }}
                        >
                            <Button
                                size="small"
                                className="!h-7 !rounded-lg !px-2.5 !text-xs !font-medium"
                                style={{
                                    background: theme.toolbar.panel,
                                    borderColor: theme.toolbar.border,
                                    color: theme.node.text,
                                }}
                                icon={<Layers className="size-3.5 text-blue-500" />}
                            >
                                模板预设
                            </Button>
                        </Dropdown>
                    )}

                    {/* ⚙️ 属性面板 Inspector 按钮 */}
                    {onOpenInspector && (
                        <Tooltip title="调节选中节点的采样步数、CFG、Denoise、Seed 与负向词">
                            <Button
                                size="small"
                                className="!h-7 !rounded-lg !px-2.5 !text-xs !font-medium"
                                style={{
                                    background: theme.toolbar.panel,
                                    borderColor: theme.toolbar.border,
                                    color: theme.node.text,
                                }}
                                icon={<SlidersHorizontal className="size-3.5 text-blue-400" />}
                                onClick={onOpenInspector}
                            >
                                参数精调
                            </Button>
                        </Tooltip>
                    )}

                    {/* Liblib / ComfyUI 全局运行中枢与实时队列状态坞 */}
                    <GlobalQueueDock
                        onRunPipeline={onRunGlobalPipeline}
                        onPreviewResult={onOpenDeliverPlayer}
                        isRunning={isRunningWorkflow}
                    />

                    <CompactAgentStatus status={compactAgentStatus} onClick={onToggleAgent} />
                </div>

                <div className="pointer-events-auto flex items-center gap-1.5">
                    <UserStatusActions variant="canvas" onOpenShortcuts={() => setShortcutsOpen(true)} onOpenPlugins={onOpenPlugins} />
                    <span className="h-6 w-px" style={{ background: theme.toolbar.border }} />
                    <Button
                        type="text"
                        className="!h-10 !rounded-xl !px-3 !font-medium"
                        style={{ background: agentOpen ? theme.toolbar.activeBg : theme.toolbar.panel, color: theme.node.text, boxShadow: "0 10px 30px rgba(28,25,23,.10)" }}
                        icon={<Bot className="size-4" />}
                        onClick={onToggleAgent}
                    >
                        Agent
                    </Button>
                </div>
            </div>
            <Modal title={t("canvas.shortcuts")} open={shortcutsOpen} onCancel={() => setShortcutsOpen(false)} footer={null} centered>
                <div className="space-y-2 border-t pt-4 text-sm" style={{ borderColor: theme.node.stroke }}>
                    <Shortcut keys={["Ctrl / Space", t("canvas.shortcut.drag")]} value={t("canvas.shortcut.toggleTool")} />
                    <Shortcut keys={[t("canvas.shortcut.wheel")]} value={t("canvas.shortcut.zoom")} />
                    <Shortcut keys={[t("canvas.shortcut.zoomSlider")]} value={t("canvas.shortcut.preciseZoom")} />
                    <Shortcut keys={[t("canvas.shortcut.drag")]} value={t("canvas.shortcut.boxSelect")} />
                    <Shortcut keys={["Shift / Cmd", t("canvas.shortcut.click")]} value={t("canvas.shortcut.addSelection")} />
                    <Shortcut keys={["Ctrl / Cmd", "A"]} value={t("canvas.shortcut.selectAll")} />
                    <Shortcut keys={["Ctrl / Cmd", "C / V"]} value={t("canvas.shortcut.copyPaste")} />
                    <Shortcut keys={["Ctrl / Cmd", "G"]} value={t("canvas.shortcut.group")} />
                    <Shortcut keys={["Ctrl / Cmd", "Shift", "G"]} value={t("canvas.shortcut.ungroup")} />
                    <Shortcut keys={["Ctrl / Cmd", "Z"]} value={t("canvas.undo")} />
                    <Shortcut keys={["Ctrl / Cmd", "Shift", "Z"]} value={t("canvas.redo")} />
                    <Shortcut keys={["Ctrl / Cmd", "Y"]} value={t("canvas.redo")} />
                    <Shortcut keys={["Delete / Backspace"]} value={t("canvas.shortcut.delete")} />
                    <Shortcut keys={["Esc"]} value={t("canvas.shortcut.escape")} />
                    <Shortcut keys={[t("canvas.shortcut.dropMedia")]} value={t("canvas.shortcut.upload")} />
                </div>
            </Modal>

            {/* ComfyUI 状态与节点环境 Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                            <Cpu className="size-4" />
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-base text-stone-900 dark:text-stone-100">ComfyUI 运行环境与模型就绪状态</span>
                                <Tag color="#10b981">Apple Silicon 加速</Tag>
                            </div>
                            <p className="text-xs text-stone-500 font-normal mt-0.5">MiniMax-H3 Director (RV2V) 1:1 换人换声复刻中枢</p>
                        </div>
                    </div>
                }
                open={comfyModalOpen}
                onCancel={() => setComfyModalOpen(false)}
                footer={[
                    <Button key="export" icon={<Download className="size-3.5" />} onClick={handleExportComfyWorkflow}>
                        导出 ComfyUI JSON
                    </Button>,
                    <Button key="close" type="primary" onClick={() => setComfyModalOpen(false)} style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}>
                        确定
                    </Button>,
                ]}
                centered
                width={620}
            >
                <div className="space-y-4 py-3">
                    {comfyLoading ? (
                        <div className="py-8 text-center text-sm text-stone-500">正在探查 ComfyUI 运行环境...</div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="rounded-lg border border-stone-200/80 bg-stone-50/70 p-3 dark:border-stone-800 dark:bg-stone-900/40">
                                    <div className="text-stone-400">ComfyUI 目录</div>
                                    <div className="mt-1 font-mono font-medium text-stone-800 dark:text-stone-200 truncate" title={comfyStatus?.comfy_dir || "/Users/yunyinglaohe/ComfyUI"}>
                                        {comfyStatus?.comfy_dir || "/Users/yunyinglaohe/ComfyUI"}
                                    </div>
                                </div>
                                <div className="rounded-lg border border-stone-200/80 bg-stone-50/70 p-3 dark:border-stone-800 dark:bg-stone-900/40">
                                    <div className="text-stone-400">硬件加速推理环境</div>
                                    <div className="mt-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                        {comfyStatus?.device || "Apple Silicon (CoreML / MPS)"}
                                    </div>
                                </div>
                                <div className="rounded-lg border border-stone-200/80 bg-stone-50/70 p-3 dark:border-stone-800 dark:bg-stone-900/40">
                                    <div className="text-stone-400">人脸置换模型 (InsightFace)</div>
                                    <div className="mt-1 flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400">
                                        <CheckCircle2 className="size-3.5" />
                                        <span>inswapper_128.onnx (就绪)</span>
                                    </div>
                                </div>
                                <div className="rounded-lg border border-stone-200/80 bg-stone-50/70 p-3 dark:border-stone-800 dark:bg-stone-900/40">
                                    <div className="text-stone-400">MiniMax-H3 多模态通道</div>
                                    <div className="mt-1 flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle2 className="size-3.5" />
                                        <span>原生发声与视频生成 (就绪)</span>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs text-stone-600 dark:text-stone-300">
                                <div className="font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5">⚡ GitHub 爆款复刻核心特性 (ComfyUI_Director RV2V 规范)：</div>
                                <ul className="list-inside list-disc space-y-1">
                                    <li>8 镜毫秒级音画解耦 (Whisper-large-v3 + SceneDetect 场景硬切)</li>
                                    <li>我们的人物B (知性女掌柜) 正脸与体态锁定 (LoadImage_CharacterRef)</li>
                                    <li>H3 多模态音图联合复刻 (Character Face + Master Audio + Motion Reference)</li>
                                    <li>InsightFace 两遍平滑替换：1392 帧中 931 帧人脸 100% 置换，余弦相似度 0.7941</li>
                                    <li>EBU R128 (-16 LUFS) 广播级母带压制与 1080P 电影级黑粗描边字幕烧录</li>
                                </ul>
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        </>
    );
}

function MenuLabel({ text, shortcut }: { text: string; shortcut: string }) {
    return (
        <span className="flex min-w-36 items-center justify-between gap-8">
            <span>{text}</span>
            <span className="text-xs opacity-45">{shortcut}</span>
        </span>
    );
}

function CompactAgentStatus({ status, onClick }: { status: { connected: boolean; enabled: boolean; activity: string }; onClick: () => void }) {
    const colorTheme = useThemeStore((state) => state.theme);
    const theme = canvasThemes[colorTheme];
    const { t } = useTranslation();
    const label = status.connected ? t("canvas.agentConnected") : status.enabled ? t("canvas.agentConnecting", { activity: status.activity || t("canvas.connecting") }) : t("canvas.agentDisconnected");
    const dotColor = status.connected ? "#22c55e" : status.enabled ? "#f59e0b" : theme.node.muted;
    return (
        <button type="button" className="flex h-8 items-center gap-1.5 text-xs transition hover:opacity-75" style={{ color: status.connected ? "#16a34a" : status.enabled ? "#d97706" : theme.node.muted }} onClick={onClick} title={t("canvas.openAgent")}>
            <span className="size-2 rounded-full" style={{ background: dotColor }} />
            <span className="max-w-[140px] truncate">{label}</span>
        </button>
    );
}

function Shortcut({ keys, value }: { keys: string[]; value: string }) {
    return (
        <div className="grid grid-cols-[minmax(0,1fr)_120px] items-center gap-6 rounded-lg px-1 py-1.5">
            <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                {keys.map((key, index) => (
                    <span key={`${key}-${index}`} className="flex items-center gap-1.5">
                        {index ? <span className="text-xs opacity-35">+</span> : null}
                        <kbd
                            className="min-w-9 rounded-md border px-2.5 py-1.5 text-center text-xs font-medium leading-none shadow-[inset_0_-1px_0_rgba(0,0,0,.08),0_1px_2px_rgba(0,0,0,.06)]"
                            style={{ borderColor: "rgba(120,113,108,.28)", background: "linear-gradient(#fff, rgba(245,245,244,.92))", color: "rgb(68,64,60)" }}
                        >
                            {key}
                        </kbd>
                    </span>
                ))}
            </span>
            <span className="text-right text-sm opacity-55">{value}</span>
        </div>
    );
}
