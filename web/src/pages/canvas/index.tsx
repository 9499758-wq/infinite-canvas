import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { App, Button } from "antd";
import { Download, FileUp, Film, Sparkles, Video, RotateCcw, Flame } from "lucide-react";
import { useTranslation } from "react-i18next";

import { readZip } from "@/lib/zip";
import { setMediaBlob } from "@/services/file-storage";
import { setImageBlob } from "@/services/image-storage";
import { CanvasDeleteProjectsDialog } from "@/components/canvas/canvas-delete-projects-dialog";
import { CanvasProjectCard } from "@/components/canvas/canvas-project-card";
import type { CanvasExportFile } from "@/types/canvas-export";
import { useCanvasStore } from "@/stores/canvas/use-canvas-store";
import { useCanvasUiStore } from "@/stores/canvas/use-canvas-ui-store";
import { exportCanvasProjects } from "@/lib/canvas/canvas-export";
import { hasAgentUrlBootstrap } from "@/lib/agent/agent-url-bootstrap";
import { createWorkflowPreset, WORKFLOW_PRESETS, type WorkflowPresetId } from "@/lib/canvas/workflow-presets";
import { WorkflowMarketModal } from "@/components/canvas/workflow-market-modal";

export default function CanvasPage() {
    const { message } = App.useApp();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const inputRef = useRef<HTMLInputElement>(null);
    const autoOpenRef = useRef(false);
    const hydrated = useCanvasStore((state) => state.hydrated);
    const projects = useCanvasStore((state) => state.projects);
    const createProject = useCanvasStore((state) => state.createProject);
    const importProject = useCanvasStore((state) => state.importProject);
    const resetToIndependentWorkflows = useCanvasStore((state) => state.resetToIndependentWorkflows);
    const selectedIds = useCanvasUiStore((state) => state.selectedProjectIds);
    const setDeleteIds = useCanvasUiStore((state) => state.setDeleteProjectIds);
    const [marketOpen, setMarketOpen] = useState(false);

    const mode = searchParams.get("mode");
    const agentMode = mode === "new" || mode === "recent" || mode === "choose";
    const agentQuery = agentMode ? `?${searchParams.toString()}` : "";
    const enterProject = (id: string) => {
        const agentHash = hasAgentUrlBootstrap(window.location.hash) ? window.location.hash : "";
        navigate(`/${id}${agentQuery}${agentHash}`, { replace: Boolean(agentHash) });
    };

    const createWithPreset = (presetId: WorkflowPresetId) => {
        const meta = WORKFLOW_PRESETS.find((p) => p.id === presetId);
        const title = `${meta?.title || "独立工作流"} ${projects.length + 1}`;
        const id = createProject(title, presetId);
        enterProject(id);
    };

    const handleResetAll = () => {
        resetToIndependentWorkflows();
        message.success("已重置为三大独立专属工作流（H3、SD 2.5、Muse 各自独立）");
    };

    const importCanvas = async (file?: File) => {
        if (!file) return;
        try {
            const zip = await readZip(file);
            const projectFile = zip.get("projects.json");
            if (!projectFile) throw new Error("missing projects.json");
            const data = JSON.parse(await projectFile.text()) as CanvasExportFile;
            await Promise.all(
                data.projects.flatMap((project) =>
                    project.files.map(async (item) => {
                        const blob = zip.get(item.path);
                        if (!blob) return;
                        const typedBlob = blob.type ? blob : blob.slice(0, blob.size, item.mimeType);
                        await (item.storageKey.startsWith("image:") ? setImageBlob(item.storageKey, typedBlob) : setMediaBlob(item.storageKey, typedBlob));
                    }),
                ),
            );
            data.projects.forEach((item) => importProject(item.project));
            message.success(t("canvas.imported", { count: data.projects.length }));
        } catch {
            message.error(t("canvas.importFailed"));
        } finally {
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    useEffect(() => {
        if (!hydrated || autoOpenRef.current || (mode !== "new" && mode !== "recent")) return;
        autoOpenRef.current = true;
        enterProject(mode === "new" ? createProject("MiniMax-H3 独立视频工作流", "h3") : projects[0]?.id || createProject("MiniMax-H3 独立视频工作流", "h3"));
    }, [createProject, hydrated, mode, projects, t]);

    if (hydrated && (mode === "new" || mode === "recent")) return <main className="flex h-full items-center justify-center bg-background text-sm text-stone-500">{t("canvas.opening")}</main>;

    return (
        <main className="h-full overflow-auto bg-background text-stone-950 dark:text-stone-100">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
                <header className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-6 dark:border-stone-800">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-500">
                                模型独立专属架构
                            </span>
                            <p className="text-xs text-stone-500">各是各 · 独立运行 · 互不干扰</p>
                        </div>
                        <h1 className="mt-2 text-3xl font-semibold">独立模型生成工作流</h1>
                        <p className="mt-1 text-sm text-stone-500">
                            MiniMax-H3、Seedance 2.5、Muse 各是各的独立工作流 · 拒绝混合堆叠 · 专精专属出片
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {selectedIds.length ? (
                            <>
                                <Button disabled={!hydrated} icon={<Download className="size-4" />} onClick={() => void exportCanvasProjects(projects.filter((project) => selectedIds.includes(project.id)), `${t("canvas.title")}-${selectedIds.length}`)}>
                                    {t("canvas.exportSelected")}
                                </Button>
                                <Button disabled={!hydrated} onClick={() => setDeleteIds(selectedIds)}>
                                    {t("canvas.deleteSelected")}
                                </Button>
                            </>
                        ) : null}
                        {projects.length ? (
                            <Button disabled={!hydrated} onClick={() => setDeleteIds(projects.map((project) => project.id))}>
                                {t("canvas.deleteAll")}
                            </Button>
                        ) : null}
                        {/* 🔥 Liblib 工作流集市大按钮 */}
                        <Button
                            type="primary"
                            className="!bg-gradient-to-r !from-amber-500 via-rose-500 !to-purple-600 hover:!opacity-95 !border-0 !font-bold shadow-md shadow-rose-500/20"
                            icon={<Flame className="size-4 animate-pulse text-amber-200" />}
                            onClick={() => setMarketOpen(true)}
                        >
                            🔥 Liblib 工作流集市
                        </Button>

                        <Button disabled={!hydrated} icon={<RotateCcw className="size-4" />} onClick={handleResetAll} title="重置为独立专属项目">
                            重置为独立工作流
                        </Button>
                        <Button disabled={!hydrated} icon={<FileUp className="size-4" />} onClick={() => inputRef.current?.click()}>
                            {t("canvas.import")}
                        </Button>

                        {/* 独立专属新建按钮 */}
                        <Button
                            disabled={!hydrated}
                            type="primary"
                            className="!bg-blue-600 hover:!bg-blue-500"
                            icon={<Film className="size-4" />}
                            onClick={() => createWithPreset("h3")}
                        >
                            + 新建 H3 复刻
                        </Button>
                        <Button
                            disabled={!hydrated}
                            type="primary"
                            className="!bg-purple-600 hover:!bg-purple-500"
                            icon={<Film className="size-4" />}
                            onClick={() => createWithPreset("muse_replicate")}
                        >
                            + 新建 Muse 复刻
                        </Button>
                        <Button
                            disabled={!hydrated}
                            type="primary"
                            className="!bg-orange-500 hover:!bg-orange-400"
                            icon={<Sparkles className="size-4" />}
                            onClick={() => createWithPreset("seedance")}
                        >
                            + 新建 SD 2.5
                        </Button>
                        <Button
                            disabled={!hydrated}
                            type="primary"
                            className="!bg-pink-600 hover:!bg-pink-500"
                            icon={<Video className="size-4" />}
                            onClick={() => createWithPreset("muse")}
                        >
                            + 新建 Muse 3镜
                        </Button>
                    </div>
                </header>

                {!hydrated ? (
                    <section className="flex min-h-[360px] items-center justify-center border-y border-stone-200 text-sm text-stone-500 dark:border-stone-800">{t("canvas.loading")}</section>
                ) : projects.length ? (
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        {projects.map((project) => (
                            <CanvasProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                ) : (
                    <section className="flex flex-col items-center justify-center rounded-3xl border border-stone-200/80 bg-stone-50/50 p-10 text-center dark:border-stone-800 dark:bg-stone-900/40">
                        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-500">
                            ⚡ 选择模型进入独立专属工作流
                        </div>
                        <h2 className="mt-4 text-2xl font-bold">暂无工作流 · 点击下方启动独立模型出片</h2>
                        <p className="mt-2 max-w-lg text-sm text-stone-500">每个模型都是独立的极简专属链路，输入与成片一一对应，绝无交叉干扰</p>

                        <div className="mt-8 grid w-full max-w-4xl grid-cols-1 gap-4 text-left sm:grid-cols-3">
                            {WORKFLOW_PRESETS.map((preset) => (
                                <div
                                    key={preset.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => createWithPreset(preset.id)}
                                    className="group relative flex cursor-pointer flex-col rounded-2xl border border-stone-200 bg-background p-5 transition duration-200 hover:-translate-y-1 hover:border-blue-500 hover:shadow-xl dark:border-stone-800 dark:hover:border-blue-500"
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-stone-900 group-hover:text-blue-500 dark:text-stone-100">
                                            {preset.title}
                                        </h3>
                                        <span
                                            className="rounded-full px-2 py-0.5 text-xs font-medium"
                                            style={{
                                                backgroundColor: `${preset.accentColor}18`,
                                                color: preset.accentColor,
                                            }}
                                        >
                                            {preset.badge}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-xs text-stone-500 line-clamp-2">
                                        {preset.description}
                                    </p>
                                    <div className="mt-4 flex items-center justify-between text-xs text-stone-400">
                                        <span>4 节点专精专属链</span>
                                        <span className="font-semibold text-blue-500 group-hover:underline">立即进入 →</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    void importCanvas(file);
                }}
            />
            <CanvasDeleteProjectsDialog />

            <WorkflowMarketModal
                open={marketOpen}
                onCancel={() => setMarketOpen(false)}
                onSelectPreset={(presetId) => createWithPreset(presetId)}
            />
        </main>
    );
}
