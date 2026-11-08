import { useState } from "react";
import { Check, Download, Pencil, Trash2, X, Play, Zap } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Input } from "antd";
import { useTranslation } from "react-i18next";

import { useCanvasStore, type CanvasProject } from "@/stores/canvas/use-canvas-store";
import { useCanvasUiStore } from "@/stores/canvas/use-canvas-ui-store";
import { exportCanvasProjects } from "@/lib/canvas/canvas-export";
import { hasAgentUrlBootstrap } from "@/lib/agent/agent-url-bootstrap";
import { WorkflowReplicateRunnerModal, type ReplicateModelType } from "./workflow-replicate-runner-modal";

export function CanvasProjectCard({ project }: { project: CanvasProject }) {
    const { i18n, t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [runnerOpen, setRunnerOpen] = useState(false);
    const renameProject = useCanvasStore((state) => state.renameProject);
    const selectedIds = useCanvasUiStore((state) => state.selectedProjectIds);
    const editingId = useCanvasUiStore((state) => state.editingProjectId);
    const editingTitle = useCanvasUiStore((state) => state.editingProjectTitle);
    const startEditing = useCanvasUiStore((state) => state.startEditingProject);
    const setEditingTitle = useCanvasUiStore((state) => state.setEditingProjectTitle);
    const stopEditing = useCanvasUiStore((state) => state.stopEditingProject);
    const toggleSelected = useCanvasUiStore((state) => state.toggleSelectedProjectId);
    const setDeleteIds = useCanvasUiStore((state) => state.setDeleteProjectIds);
    const editing = editingId === project.id;
    const selected = selectedIds.includes(project.id);

    const modelType: ReplicateModelType | null = project.title.includes("H3")
        ? "h3"
        : project.title.includes("Muse")
          ? "muse"
          : project.title.includes("Seedance") || project.title.includes("SD")
            ? "sd"
            : null;

    const btnTheme = modelType === "h3"
        ? { color: "#2563eb", text: "⚡ H3 独立出片" }
        : modelType === "muse"
          ? { color: "#9333ea", text: "⚡ Muse 独立复刻" }
          : modelType === "sd"
            ? { color: "#f97316", text: "⚡ SD 动作复刻" }
            : null;

    const open = () => {
        const agentHash = hasAgentUrlBootstrap(window.location.hash) ? window.location.hash : "";
        navigate(`/${project.id}${searchParams.toString() ? `?${searchParams.toString()}` : ""}${agentHash}`, { replace: Boolean(agentHash) });
    };
    const saveTitle = () => {
        renameProject(project.id, editingTitle);
        stopEditing();
    };

    return (
        <>
            <article className="group flex min-h-44 cursor-pointer flex-col justify-between rounded-2xl bg-[#f1eee8] p-5 transition hover:bg-[#ebe6dc] dark:bg-white/5 dark:hover:bg-white/10" onClick={() => !editing && open()}>
                <div className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        checked={selected}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => toggleSelected(project.id, event.target.checked)}
                        className="mt-1 size-4 accent-stone-950 dark:accent-stone-100"
                        aria-label={t("canvas.project.select", { name: project.title })}
                    />
                    {editing ? (
                        <Input className="min-w-0" value={editingTitle} onClick={(event) => event.stopPropagation()} onChange={(event) => setEditingTitle(event.target.value)} onKeyDown={(event) => event.key === "Enter" && saveTitle()} autoFocus />
                    ) : (
                        <button
                            type="button"
                            className="min-w-0 cursor-pointer text-left"
                            onClick={(event) => {
                                event.stopPropagation();
                                open();
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <h2 className="truncate text-xl font-semibold">{project.title}</h2>
                                {project.title.includes("H3") && (
                                    <span className="rounded-full bg-blue-600/10 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                                        H3 独立
                                    </span>
                                )}
                                {project.title.includes("Seedance") && (
                                    <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[11px] font-semibold text-orange-500 dark:bg-orange-500/20 dark:text-orange-400">
                                        SD 2.5 独立
                                    </span>
                                )}
                                {project.title.includes("Muse") && (
                                    <span className="rounded-full bg-pink-500/10 px-2 py-0.5 text-[11px] font-semibold text-pink-500 dark:bg-pink-500/20 dark:text-pink-400">
                                        Muse 独立
                                    </span>
                                )}
                            </div>
                            <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-400">
                                {t("canvas.project.stats", { nodes: project.nodes.length, connections: project.connections.length })} · 专属独立无干扰
                            </p>
                        </button>
                    )}
                </div>
                <div className="mt-8 flex items-end justify-between gap-3">
                    <p className="text-xs text-stone-500">{t("canvas.project.updated", { date: new Date(project.updatedAt).toLocaleString(i18n.resolvedLanguage, { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) })}</p>
                    <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                        {btnTheme && (
                            <Button
                                type="primary"
                                size="small"
                                style={{ backgroundColor: btnTheme.color, borderColor: btnTheme.color }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setRunnerOpen(true);
                                }}
                                className="font-semibold shadow-xs"
                            >
                                {btnTheme.text}
                            </Button>
                        )}
                        {editing ? (
                            <>
                                <Button type="text" size="small" shape="circle" icon={<Check className="size-4" />} onClick={saveTitle} aria-label={t("canvas.project.saveName")} />
                                <Button type="text" size="small" shape="circle" icon={<X className="size-4" />} onClick={stopEditing} aria-label={t("canvas.project.cancelRename")} />
                            </>
                        ) : (
                            <>
                                <Button type="text" size="small" shape="circle" icon={<Download className="size-4" />} onClick={() => void exportCanvasProjects([project], project.title || t("canvas.title"))} aria-label={t("canvas.project.export")} />
                                <Button type="text" size="small" shape="circle" icon={<Pencil className="size-4" />} onClick={() => startEditing(project.id, project.title)} aria-label={t("canvas.project.rename")} />
                                <Button type="text" size="small" shape="circle" icon={<Trash2 className="size-4" />} onClick={() => setDeleteIds([project.id])} aria-label={t("canvas.project.delete")} />
                            </>
                        )}
                    </div>
                </div>
            </article>

            {modelType && (
                <WorkflowReplicateRunnerModal
                    open={runnerOpen}
                    modelType={modelType}
                    onClose={() => setRunnerOpen(false)}
                />
            )}
        </>
    );
}
