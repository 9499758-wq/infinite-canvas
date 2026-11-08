import React, { useState } from "react";
import { Modal, Input, Button, Upload, Tag, message } from "antd";
import { UploadCloud, FileJson, Check, Sparkles, AlertCircle, Copy } from "lucide-react";
import { CanvasNodeType, type CanvasNodeData, type CanvasConnection } from "@/types/canvas";

export function ComfyJsonImporterModal({
    open,
    onCancel,
    onImportWorkflow,
}: {
    open: boolean;
    onCancel: () => void;
    onImportWorkflow: (nodes: CanvasNodeData[], connections: CanvasConnection[]) => void;
}) {
    const [jsonText, setJsonText] = useState("");
    const [parsing, setParsing] = useState(false);

    const handleLoadSample = async () => {
        try {
            message.loading({ content: "正在获取官方标准 1:1 复刻 ComfyUI 工作流 JSON...", key: "load_sample" });
            const res = await fetch("/api/canvas/comfy/export");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setJsonText(JSON.stringify(data, null, 2));
            message.success({ content: "🎉 已成功载入官方 12 节点 H3 爆款复刻工作流 JSON！", key: "load_sample" });
        } catch (e: any) {
            message.error({ content: `获取失败: ${e.message}`, key: "load_sample" });
        }
    };

    const handleParseAndImport = () => {
        if (!jsonText.trim()) {
            message.warning("请先粘贴或上传 ComfyUI JSON 内容");
            return;
        }

        try {
            setParsing(true);
            const parsed = JSON.parse(jsonText);
            const rawNodes = parsed.nodes || [];
            if (!Array.isArray(rawNodes) || rawNodes.length === 0) {
                // 如果是 prompt 格式 (key-value 节点对象)
                throw new Error("检测到该 JSON 为 ComfyUI Prompt 纯字典格式，请提供带 nodes/links 的完整工作流 JSON");
            }

            const canvasNodes: CanvasNodeData[] = [];
            const canvasConnections: CanvasConnection[] = [];

            // 转换节点
            rawNodes.forEach((node: any, idx: number) => {
                const nodeType = node.type || "ComfyNode";
                const pos = Array.isArray(node.pos) ? { x: node.pos[0] + 500, y: node.pos[1] + 500 } : { x: 100 + idx * 360, y: 200 };
                const size = Array.isArray(node.size) ? { width: node.size[0] || 320, height: node.size[1] || 240 } : { width: 320, height: 240 };
                const title = node.properties?.["Node name for S&R"] || node.title || `${nodeType} (#${node.id})`;

                let mappedType = CanvasNodeType.Config;
                if (nodeType.toLowerCase().includes("video")) mappedType = CanvasNodeType.Video;
                else if (nodeType.toLowerCase().includes("image")) mappedType = CanvasNodeType.Image;
                else if (nodeType.toLowerCase().includes("audio") || nodeType.toLowerCase().includes("whisper")) mappedType = CanvasNodeType.Audio;
                else if (nodeType.toLowerCase().includes("text") || nodeType.toLowerCase().includes("prompt")) mappedType = CanvasNodeType.Text;

                canvasNodes.push({
                    id: `comfy_${node.id}`,
                    type: mappedType,
                    title: `🧩 ${title}`,
                    x: pos.x,
                    y: pos.y,
                    width: size.width,
                    height: size.height,
                    content: JSON.stringify(node.widgets_values || node.properties || {}, null, 2),
                    metadata: {
                        comfyId: node.id,
                        comfyType: node.type,
                        inputs: node.inputs,
                        outputs: node.outputs,
                    },
                } as any);
            });

            // 转换连线 (links: [link_id, from_node, from_slot, to_node, to_slot, type])
            const rawLinks = parsed.links || [];
            rawLinks.forEach((link: any) => {
                if (Array.isArray(link) && link.length >= 5) {
                    const [linkId, fromNode, fromSlot, toNode, toSlot] = link;
                    canvasConnections.push({
                        id: `link_${linkId}`,
                        fromNodeId: `comfy_${fromNode}`,
                        toNodeId: `comfy_${toNode}`,
                        fromHandle: `out_${fromSlot}`,
                        toHandle: `in_${toSlot}`,
                    });
                }
            });

            onImportWorkflow(canvasNodes, canvasConnections);
            onCancel();
            message.success({
                content: `🎉 成功解析并导入 ComfyUI 原生工作流！共 ${canvasNodes.length} 个节点，${canvasConnections.length} 条连接拓扑`,
                duration: 4,
            });
        } catch (e: any) {
            message.error(`解析失败: ${e.message}`);
        } finally {
            setParsing(false);
        }
    };

    return (
        <Modal
            title={
                <div className="flex items-center gap-2 text-white">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                        <FileJson className="size-4" />
                    </span>
                    <div>
                        <h3 className="text-sm font-bold m-0 text-white">导入 ComfyUI 原生工作流 JSON</h3>
                        <p className="text-[11px] text-stone-400 m-0 font-normal">
                            支持从 LiblibAI / ComfyUI / GitHub 导出的任意标准工作流文件
                        </p>
                    </div>
                </div>
            }
            open={open}
            onCancel={onCancel}
            footer={[
                <Button key="sample" onClick={handleLoadSample} className="!rounded-xl !border-emerald-500/30 !text-emerald-400">
                    载入官方 12 节点示例
                </Button>,
                <Button key="cancel" onClick={onCancel} className="!rounded-xl">
                    取消
                </Button>,
                <Button
                    key="import"
                    type="primary"
                    loading={parsing}
                    onClick={handleParseAndImport}
                    className="!rounded-xl !bg-emerald-600 !border-0 font-semibold"
                    icon={<Check className="size-3.5" />}
                >
                    立即解析并铺满画布
                </Button>,
            ]}
            width={760}
            centered
            styles={{
                content: {
                    background: "#0c0e14",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "20px",
                    color: "#f3f4f6",
                },
                header: {
                    background: "#11141c",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                },
            }}
        >
            <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs text-stone-400">
                    <span>支持标准 ComfyUI Node Graph JSON（包含 nodes 数组和 links 数组）</span>
                    <Upload
                        beforeUpload={(file) => {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                setJsonText((e.target?.result as string) || "");
                                message.success(`已读取文件: ${file.name}`);
                            };
                            reader.readAsText(file);
                            return false;
                        }}
                        showUploadList={false}
                        accept=".json"
                    >
                        <Button size="small" icon={<UploadCloud className="size-3.5" />} className="!rounded-lg !border-white/10 !bg-white/5 !text-stone-300">
                            选择本地 .json 文件
                        </Button>
                    </Upload>
                </div>

                <Input.TextArea
                    rows={12}
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    placeholder="在此粘贴 ComfyUI 工作流 JSON 内容，或者点击上方按钮上传 .json 文件..."
                    className="!rounded-xl !bg-black/60 !border-white/10 !text-xs !text-emerald-300 font-mono"
                />
            </div>
        </Modal>
    );
}
