import React, { useState, useEffect } from "react";
import { Drawer, Slider, InputNumber, Input, Select, Button, Tag, Switch, Tooltip, message } from "antd";
import { 
    Sliders, Cpu, Sparkles, Dices, Lock, Unlock, Check, Plus, 
    Layers, Settings, ShieldAlert, FileText, ChevronRight 
} from "lucide-react";
import type { CanvasNodeData } from "@/types/canvas";

export interface NodeInspectorParams {
    steps: number;
    cfg: number;
    denoise: number;
    seed: number;
    seedLocked: boolean;
    sampler: string;
    model: string;
    faceWeight: number;
    positivePrompt: string;
    negativePrompt: string;
}

const NEGATIVE_PRESETS = [
    { label: "去蜡像塑料感", text: "wax face, plastic doll, overly smooth skin, unnatural skin tone" },
    { label: "去外部生硬贴图", text: "banner overlay, pip floating window, watermark, text banner" },
    { label: "去肢体面部畸变", text: "deformed hands, bad anatomy, missing fingers, extra limbs, bad eyes" },
    { label: "去低清模糊噪点", text: "low quality, blurry, pixelated, jpeg artifacts, overexposed" },
];

export function CanvasInspectorDrawer({
    open,
    onClose,
    selectedNode,
    onUpdateNodeParams,
}: {
    open: boolean;
    onClose: () => void;
    selectedNode: CanvasNodeData | null;
    onUpdateNodeParams?: (nodeId: string, params: NodeInspectorParams) => void;
}) {
    const [params, setParams] = useState<NodeInspectorParams>({
        steps: 25,
        cfg: 7.5,
        denoise: 0.7,
        seed: 429184712,
        seedLocked: true,
        sampler: "Euler a",
        model: "MiniMax-H3 Plan v2 (RV2V)",
        faceWeight: 0.95,
        positivePrompt: "<Picture 1> 知性端庄女掌柜，双手端托白瓷漏斗沥水碗盛满金黄那曲冬虫夏草，真诚口播讲解。",
        negativePrompt: "wax face, plastic, bad hands, deformed fingers, blur, banner overlay, pip",
    });

    useEffect(() => {
        if (!selectedNode) return;
        // 如果节点有配置则继承
        const customParams = (selectedNode as any).comfyParams;
        if (customParams) {
            setParams((prev) => ({ ...prev, ...customParams }));
        }
    }, [selectedNode]);

    const handleRandomSeed = () => {
        const nextSeed = Math.floor(Math.random() * 1000000000);
        setParams((p) => ({ ...p, seed: nextSeed, seedLocked: false }));
        message.info(`🎲 已生成新随机种子: ${nextSeed}`);
    };

    const handleAddNegativePreset = (text: string) => {
        if (params.negativePrompt.includes(text)) {
            message.info("该负向提示词已在列表中");
            return;
        }
        const updated = params.negativePrompt ? `${params.negativePrompt}, ${text}` : text;
        setParams((p) => ({ ...p, negativePrompt: updated }));
        message.success("已添加负向提示词预设");
    };

    const handleApply = () => {
        if (selectedNode && onUpdateNodeParams) {
            onUpdateNodeParams(selectedNode.id, params);
        }
        message.success({ content: "🎉 节点超参数已保存并同步至 ComfyUI 拓扑！", duration: 3 });
    };

    return (
        <Drawer
            title={
                <div className="flex items-center gap-2 text-white">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                        <Sliders className="size-4" />
                    </span>
                    <div>
                        <h3 className="text-sm font-bold m-0 text-white">Liblib 节点参数精调抽屉 (Inspector)</h3>
                        <p className="text-[11px] text-stone-400 m-0 font-normal">
                            {selectedNode ? `当前节点: ${selectedNode.title || selectedNode.id}` : "未选中节点 (默认全局参数)"}
                        </p>
                    </div>
                </div>
            }
            placement="right"
            width={420}
            onClose={onClose}
            open={open}
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
            <div className="flex flex-col gap-5">
                {/* 节点摘要 */}
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs">
                    <div className="flex items-center justify-between text-stone-400">
                        <span>节点类型: <strong className="text-white font-mono">{selectedNode?.type || "ComfyNode"}</strong></span>
                        <Tag color="#10b981">ComfyUI Ready</Tag>
                    </div>
                    {selectedNode && (
                        <div className="mt-1.5 text-[11px] text-stone-400 truncate">
                            ID: <span className="font-mono text-stone-300">{selectedNode.id}</span>
                        </div>
                    )}
                </div>

                {/* 模型与调度器 */}
                <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Cpu className="size-3.5 text-emerald-400" />
                        <span>模型与采样调度 (Model & Sampler)</span>
                    </h4>

                    <div>
                        <label className="text-[11px] text-stone-400 block mb-1">主生成模型 Checkpoint</label>
                        <Select
                            value={params.model}
                            onChange={(val) => setParams((p) => ({ ...p, model: val }))}
                            className="w-full !rounded-xl"
                            options={[
                                { label: "MiniMax-H3 Plan v2 (1:1 RV2V 复刻)", value: "MiniMax-H3 Plan v2 (RV2V)" },
                                { label: "Muse Engine (10s 原生带声)", value: "Muse Engine" },
                                { label: "Seedance 2.5 (极致微距与光影)", value: "Seedance 2.5" },
                                { label: "FLUX.1-Dev (商业置景)", value: "FLUX.1-Dev" },
                                { label: "SDXL 1.0 Base", value: "SDXL 1.0" },
                            ]}
                        />
                    </div>

                    <div>
                        <label className="text-[11px] text-stone-400 block mb-1">采样算法 (Sampler)</label>
                        <Select
                            value={params.sampler}
                            onChange={(val) => setParams((p) => ({ ...p, sampler: val }))}
                            className="w-full !rounded-xl"
                            options={[
                                { label: "Euler a (标准推荐)", value: "Euler a" },
                                { label: "DPM++ 2M Karras (细节丰富)", value: "DPM++ 2M Karras" },
                                { label: "UniPC (极速生成)", value: "UniPC" },
                                { label: "DDIM", value: "DDIM" },
                            ]}
                        />
                    </div>
                </div>

                {/* 核心超参数调节滑块 */}
                <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Sliders className="size-3.5 text-blue-400" />
                        <span>生成超参数 (Generation Hyperparameters)</span>
                    </h4>

                    {/* 采样步数 Steps */}
                    <div>
                        <div className="flex items-center justify-between text-xs text-stone-300 mb-1">
                            <span>采样步数 (Steps)</span>
                            <span className="font-mono text-emerald-400">{params.steps}</span>
                        </div>
                        <Slider
                            min={10}
                            max={50}
                            value={params.steps}
                            onChange={(val) => setParams((p) => ({ ...p, steps: val }))}
                            tooltip={{ formatter: (v) => `${v} 步` }}
                        />
                    </div>

                    {/* 提示词引导系数 CFG Scale */}
                    <div>
                        <div className="flex items-center justify-between text-xs text-stone-300 mb-1">
                            <span>提示词引导系数 (CFG Scale)</span>
                            <span className="font-mono text-emerald-400">{params.cfg}</span>
                        </div>
                        <Slider
                            min={1.0}
                            max={15.0}
                            step={0.5}
                            value={params.cfg}
                            onChange={(val) => setParams((p) => ({ ...p, cfg: val }))}
                        />
                    </div>

                    {/* 重绘幅度 Denoising Strength */}
                    <div>
                        <div className="flex items-center justify-between text-xs text-stone-300 mb-1">
                            <span>重绘幅度 (Denoise)</span>
                            <span className="font-mono text-emerald-400">{params.denoise}</span>
                        </div>
                        <Slider
                            min={0.1}
                            max={1.0}
                            step={0.05}
                            value={params.denoise}
                            onChange={(val) => setParams((p) => ({ ...p, denoise: val }))}
                        />
                    </div>

                    {/* 换脸贴合权重 Face Weight */}
                    <div>
                        <div className="flex items-center justify-between text-xs text-stone-300 mb-1">
                            <span>换脸贴合权重 (InsightFace Restore)</span>
                            <span className="font-mono text-purple-400">{params.faceWeight}</span>
                        </div>
                        <Slider
                            min={0.5}
                            max={1.0}
                            step={0.01}
                            value={params.faceWeight}
                            onChange={(val) => setParams((p) => ({ ...p, faceWeight: val }))}
                        />
                    </div>

                    {/* 随机种子 Seed */}
                    <div>
                        <div className="flex items-center justify-between text-xs text-stone-300 mb-1">
                            <span>随机种子 (Seed)</span>
                            <span className="text-[10px] text-stone-500">固定种子可 100% 确定性复现</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <InputNumber
                                value={params.seed}
                                onChange={(val) => setParams((p) => ({ ...p, seed: val || 0 }))}
                                className="!flex-1 !rounded-xl"
                            />
                            <Tooltip title="生成随机种子">
                                <Button
                                    icon={<Dices className="size-4" />}
                                    onClick={handleRandomSeed}
                                    className="!rounded-xl !border-white/10 !bg-white/5 !text-stone-300"
                                />
                            </Tooltip>
                            <Tooltip title={params.seedLocked ? "已锁死种子" : "种子自由随机"}>
                                <Button
                                    icon={params.seedLocked ? <Lock className="size-4 text-emerald-400" /> : <Unlock className="size-4 text-stone-400" />}
                                    onClick={() => setParams((p) => ({ ...p, seedLocked: !p.seedLocked }))}
                                    className="!rounded-xl !border-white/10 !bg-white/5"
                                />
                            </Tooltip>
                        </div>
                    </div>
                </div>

                {/* 负向提示词词库 */}
                <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldAlert className="size-3.5 text-rose-400" />
                        <span>负向词库快捷装载 (Negative Prompts)</span>
                    </h4>

                    <div className="flex flex-wrap gap-1.5">
                        {NEGATIVE_PRESETS.map((np, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => handleAddNegativePreset(np.text)}
                                className="flex items-center gap-1 rounded-lg bg-white/5 hover:bg-white/10 px-2 py-1 text-[11px] text-stone-300 border border-white/5 transition-colors"
                            >
                                <Plus className="size-3 text-emerald-400" />
                                <span>{np.label}</span>
                            </button>
                        ))}
                    </div>

                    <Input.TextArea
                        rows={3}
                        value={params.negativePrompt}
                        onChange={(e) => setParams((p) => ({ ...p, negativePrompt: e.target.value }))}
                        className="!rounded-xl !bg-black/40 !border-white/10 !text-xs !text-stone-300 font-mono"
                        placeholder="输入负向提示词..."
                    />
                </div>

                {/* 底部保存按钮 */}
                <div className="pt-2 border-t border-white/10">
                    <Button
                        type="primary"
                        block
                        className="!h-10 !rounded-xl !bg-gradient-to-r !from-blue-600 !to-indigo-600 hover:!from-blue-500 hover:!to-indigo-500 !border-0 !text-xs !font-bold shadow-lg shadow-blue-600/20"
                        icon={<Check className="size-4" />}
                        onClick={handleApply}
                    >
                        保存并同步至节点参数
                    </Button>
                </div>
            </div>
        </Drawer>
    );
}
