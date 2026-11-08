import { CheckCircle2, Copy, Download, ExternalLink, Film, Layers, Music, PencilLine, Play, RefreshCw, Search, Send, Sparkles, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { App, Button, Card, Drawer, Empty, Form, Image, Input, Modal, Pagination, Select, Space, Tag, Typography } from "antd";
import { saveAs } from "file-saver";
import { useTranslation } from "react-i18next";

import { useCopyText } from "@/hooks/use-copy-text";
import { formatBytes, readFileAsDataUrl } from "@/lib/image-utils";
import { getMediaBlob } from "@/services/file-storage";
import { getImageBlob, getImagePreviewRevision, subscribeImagePreviews, uploadImage } from "@/services/image-storage";
import { cn } from "@/lib/utils";
import { assetCoverUrl, useAssetStore, type Asset, type AssetKind, type ImageAsset } from "@/stores/use-asset-store";
import { mediaKeyOf, usePublishStore } from "@/stores/use-publish-store";
import { exportAssets, readAssetPackage } from "./asset-transfer";
import { MultiPlatformPublishModal } from "@/components/publish/multi-platform-publish-modal";

type AssetFormValues = {
    kind: AssetKind;
    title: string;
    coverUrl: string;
    tags: string[];
    source?: string;
    note?: string;
    content?: string;
};

type ImageDraft = ImageAsset["data"] | null;

const categoryTabs = [
    { key: "all", label: "🌟 全部资产" },
    { key: "published", label: "🚀 已发布成片" },
    { key: "deliverable", label: "🎬 交付成片" },
    { key: "clip", label: "🎞️ 分镜切片" },
    { key: "character", label: "👤 角色形象" },
    { key: "scene", label: "🏮 场景布景" },
    { key: "product", label: "🌿 产品道具" },
    { key: "graphic", label: "🏷️ 标题特效" },
    { key: "audio", label: "🎵 广播音频" },
    { key: "text", label: "📝 台本文本" },
] as const;

export default function AssetsPage() {
    const { message, modal } = App.useApp();
    const { t } = useTranslation();
    const copyText = useCopyText();
    const [form] = Form.useForm<AssetFormValues>();
    const coverInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const assetInputRef = useRef<HTMLInputElement>(null);

    const assets = useAssetStore((state) => state.assets);
    const addAsset = useAssetStore((state) => state.addAsset);
    const updateAsset = useAssetStore((state) => state.updateAsset);
    const removeAsset = useAssetStore((state) => state.removeAsset);
    const syncSystemAssets = useAssetStore((state) => state.syncSystemAssets);

    const [keyword, setKeyword] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [selectedTag, setSelectedTag] = useState<string>("all");
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<string>("");

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
    const [isAssetOpen, setIsAssetOpen] = useState(false);
    const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
    const [publishingAsset, setPublishingAsset] = useState<Asset | null>(null);
    const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);
    const [formKind, setFormKind] = useState<AssetKind>("text");
    const [imageDraft, setImageDraft] = useState<ImageDraft>(null);

    const publishItems = usePublishStore((state) => state.items);
    const refreshPublish = usePublishStore((state) => state.refresh);

    const coverUrl = Form.useWatch("coverUrl", form) || "";
    const title = Form.useWatch("title", form) || "";
    const tags = Form.useWatch("tags", form) || [];
    const content = Form.useWatch("content", form) || "";

    const validAssets = useMemo(() => assets.filter((asset) => asset.kind === "text" || asset.kind === "image" || asset.kind === "video"), [assets]);

    // 统计各类别资产数量
    const stats = useMemo(() => {
        let deliverable = 0, clip = 0, character = 0, scene = 0, product = 0, graphic = 0, audio = 0, text = 0;
        validAssets.forEach((a: any) => {
            const cat = a.category || a.metadata?.category;
            if (cat === "deliverable" || a.id?.startsWith("deliv_")) deliverable++;
            else if (cat === "clip" || a.id?.startsWith("shot_") || a.id?.startsWith("alive_clip_") || a.id?.startsWith("clip_")) clip++;
            else if (cat === "character" || a.id?.startsWith("chr_") || a.id?.startsWith("batch_CHR")) character++;
            else if (cat === "scene" || a.id?.startsWith("scn_") || a.id?.startsWith("batch_SCN")) scene++;
            else if (cat === "product" || a.id?.startsWith("prp_")) product++;
            else if (cat === "graphic" || a.id?.startsWith("graphic_")) graphic++;
            else if (cat === "audio" || a.id?.startsWith("audio_") || a.id?.startsWith("alive_audio_")) audio++;
            else if (cat === "text" || a.kind === "text") text++;
        });
        return { total: validAssets.length, deliverable, clip, character, scene, product, graphic, audio, text };
    }, [validAssets]);

    // 统计已发布资产数量
    const publishedCount = useMemo(() => {
        return validAssets.filter((a) => Boolean(publishItems[mediaKeyOf(a)]?.published)).length;
    }, [validAssets, publishItems]);

    // 常用工程标签
    const availableTags = useMemo(() => {
        const set = new Set<string>();
        validAssets.forEach((a) => (a.tags || []).forEach((tag) => set.add(tag)));
        return Array.from(set).slice(0, 16);
    }, [validAssets]);

    // 自动同步后端全量系统资产
    const handleSync = async (silent = false) => {
        setIsSyncing(true);
        try {
            const count = await syncSystemAssets();
            setLastSyncTime(new Date().toLocaleTimeString());
            if (!silent) {
                message.success(`已成功同步 ${count} 项系统全链路核心资产！`);
            }
        } catch (e) {
            if (!silent) message.error("同步失败，请检查网络或后端服务");
        } finally {
            setIsSyncing(false);
        }
    };

    // 首次进入自动静默同步
    useEffect(() => {
        void handleSync(true);
        void refreshPublish();
    }, []);

    /**
     * 点「发布」时的已发布拦截。
     *
     * 以前这里只有一个按钮，点下去直接开弹窗 —— 已经发过的资产也照开，
     * 用户要么重发一条、要么发完才想起来自己发过。
     * 现在有履历了：发过的先摊开事实（发过几次、最近一次什么时候、哪些平台），
     * 再让他选「不发了」还是「我知道，再发一次」。
     *
     * 返回值告诉调用方「发布面板到底开没开」：抽屉拿到 false 就不关自己，
     * 否则确认框会浮在一个刚消失的抽屉上。
     */
    const requestPublish = (asset: Asset): boolean => {
        const info = publishItems[mediaKeyOf(asset)];
        if (!info?.published) {
            setPublishingAsset(asset);
            return true;
        }
        const plat = Object.entries(info.platforms)
            .map(([k, v]) => `${k} ${v === "ok" ? "成功" : v}`)
            .join(" · ");
        modal.confirm({
            title: "这条已经发布过了",
            okText: "我知道了，不发了",
            cancelText: "仍然再发一次",
            okButtonProps: { type: "primary" },
            content: (
                <div className="space-y-1 pt-2 text-xs leading-6">
                    <div>
                        发布 <span className="font-semibold text-stone-900 dark:text-stone-100">{info.count}</span> 次，
                        最近一次 <span className="font-mono">{info.last_at}</span>
                    </div>
                    {plat && <div className="font-mono text-[11px]">{plat}</div>}
                    {info.last_status !== "ok" && (
                        <div className="text-amber-600">
                            注意：最近一次结果是「{info.last_status}」，请先到平台后台核对，不要直接重发。
                        </div>
                    )}
                    <div className="text-stone-500">
                        重发会让同一条内容在账号里出现两次。要换文案或换平台，点「仍然再发一次」进发布面板改。
                    </div>
                </div>
            ),
            onOk: () => {},
            onCancel: () => setPublishingAsset(asset),
        });
        return false;
    };

    // 组合筛选与智能置顶排序
    const filteredAssets = useMemo(() => {
        const query = keyword.trim().toLowerCase();
        const list = validAssets.filter((asset: any) => {
            const cat = asset.category || asset.metadata?.category;
            const isPub = Boolean(publishItems[mediaKeyOf(asset)]?.published);

            if (categoryFilter !== "all") {
                if (categoryFilter === "published") {
                    if (!isPub) return false;
                } else if (categoryFilter === "deliverable" && cat !== "deliverable" && !asset.id?.startsWith("deliv_")) {
                    return false;
                } else if (categoryFilter === "clip" && cat !== "clip" && !asset.id?.startsWith("shot_") && !asset.id?.startsWith("alive_clip_") && !asset.id?.startsWith("clip_")) {
                    return false;
                } else if (categoryFilter === "character" && cat !== "character" && !asset.id?.startsWith("chr_") && !asset.id?.startsWith("batch_CHR")) {
                    return false;
                } else if (categoryFilter === "scene" && cat !== "scene" && !asset.id?.startsWith("scn_") && !asset.id?.startsWith("batch_SCN")) {
                    return false;
                } else if (categoryFilter === "product" && cat !== "product" && !asset.id?.startsWith("prp_")) {
                    return false;
                } else if (categoryFilter === "graphic" && cat !== "graphic" && !asset.id?.startsWith("graphic_")) {
                    return false;
                } else if (categoryFilter === "audio" && cat !== "audio" && !asset.id?.startsWith("audio_") && !asset.id?.startsWith("alive_audio_")) {
                    return false;
                } else if (categoryFilter === "text" && cat !== "text" && asset.kind !== "text") {
                    return false;
                }
            }
            if (selectedTag !== "all" && !(asset.tags || []).includes(selectedTag)) {
                return false;
            }
            if (!query) return true;
            return assetSearchText(asset).includes(query);
        });

        // 终极置顶排序：
        // 1. 已发布的视频/作品具有最高业务完成度，绝对优先置顶展示！并且按最后发布时间降序（最新发布的排最最前面）
        // 2. 深度替换成片 deliv_alive_h3_full_person_master
        // 3. 其它带 👑 的成片
        // 4. 其余资产
        return list.sort((a, b) => {
            const aPub = publishItems[mediaKeyOf(a)];
            const bPub = publishItems[mediaKeyOf(b)];
            const aIsPub = Boolean(aPub?.published);
            const bIsPub = Boolean(bPub?.published);

            if (aIsPub && !bIsPub) return -1;
            if (!aIsPub && bIsPub) return 1;
            if (aIsPub && bIsPub) {
                const timeA = aPub?.last_at || "";
                const timeB = bPub?.last_at || "";
                if (timeA !== timeB) return timeB.localeCompare(timeA);
            }

            const aIsMaster = a.id === "deliv_alive_h3_full_person_master" || a.title?.includes("全人物深度替换");
            const bIsMaster = b.id === "deliv_alive_h3_full_person_master" || b.title?.includes("全人物深度替换");
            if (aIsMaster && !bIsMaster) return -1;
            if (!aIsMaster && bIsMaster) return 1;
            const aIsTop = a.title?.startsWith("👑");
            const bIsTop = b.title?.startsWith("👑");
            if (aIsTop && !bIsTop) return -1;
            if (!aIsTop && bIsTop) return 1;
            return 0;
        });
    }, [validAssets, keyword, categoryFilter, selectedTag, publishItems]);

    const visibleAssets = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredAssets.slice(start, start + pageSize);
    }, [filteredAssets, page, pageSize]);

    useEffect(() => {
        const maxPage = Math.max(1, Math.ceil(filteredAssets.length / pageSize));
        setPage((value) => Math.min(value, maxPage));
    }, [filteredAssets.length, pageSize]);

    const openCreate = () => {
        setEditingAsset(null);
        setImageDraft(null);
        setFormKind("text");
        form.setFieldsValue({ kind: "text", title: "", coverUrl: "", tags: [], source: t("assets.manual"), note: "", content: "" });
        setIsAssetOpen(true);
    };

    const openEdit = (asset: Asset) => {
        setEditingAsset(asset);
        setFormKind(asset.kind);
        setImageDraft(asset.kind === "image" ? asset.data : null);
        form.setFieldsValue({
            kind: asset.kind,
            title: asset.title,
            coverUrl: asset.coverUrl,
            tags: asset.tags || [],
            source: asset.source,
            note: asset.note,
            content: asset.kind === "text" ? asset.data.content : "",
        });
        setIsAssetOpen(true);
    };

    const saveAsset = async () => {
        const values = await form.validateFields();
        const base = {
            title: values.title.trim(),
            coverUrl: values.coverUrl?.trim() || (values.kind === "image" && imageDraft ? imageDraft.dataUrl : ""),
            tags: values.tags || [],
            source: values.source?.trim(),
            note: values.note?.trim(),
            metadata: editingAsset?.metadata || { source: "manual" },
        };

        if (values.kind === "text") {
            const asset = { ...base, kind: "text" as const, data: { content: (values.content || "").trim() } };
            editingAsset ? updateAsset(editingAsset.id, asset) : addAsset(asset);
        } else {
            if (!imageDraft) {
                message.error(t("assets.selectImage"));
                return;
            }
            const asset = { ...base, kind: "image" as const, data: imageDraft };
            editingAsset ? updateAsset(editingAsset.id, asset) : addAsset(asset);
        }

        message.success(editingAsset ? t("assets.updated") : t("assets.saved"));
        setIsAssetOpen(false);
    };

    const readCoverFile = async (file?: File) => {
        if (!file) return;
        const dataUrl = await readFileAsDataUrl(file);
        form.setFieldValue("coverUrl", dataUrl);
    };

    const readImageFile = async (file?: File) => {
        if (!file || !file.type.startsWith("image/")) return;
        const image = await uploadImage(file);
        const draft = { dataUrl: image.url, storageKey: image.storageKey, width: image.width, height: image.height, bytes: image.bytes, mimeType: image.mimeType };
        setImageDraft(draft);
        if (!form.getFieldValue("coverUrl")) form.setFieldValue("coverUrl", draft.dataUrl);
        if (!form.getFieldValue("title")) form.setFieldValue("title", file.name);
    };

    const copyAssetText = async (asset: Asset) => {
        if (asset.kind === "text") {
            copyText(asset.data.content, "已复制台本内容到剪贴板！");
        } else if (asset.kind === "video") {
            copyText(asset.data.url, "已复制视频在线直链地址！");
        } else if (asset.kind === "image") {
            copyText(asset.data.dataUrl || asset.coverUrl, "已复制图片在线地址！");
        }
    };

    const downloadImage = async (asset: Asset) => {
        if (asset.kind !== "image" && asset.kind !== "video") return;
        try {
            const blob = await readAssetMediaBlob(asset);
            if (!blob) {
                message.error(t("assets.downloadFailed"));
                return;
            }
            const ext = asset.data.mimeType?.split("/")[1]?.split("+")[0] || (asset.kind === "video" ? "mp4" : "png");
            saveAs(blob, `${asset.title || "asset"}.${ext}`);
        } catch {
            message.error(t("assets.downloadFailed"));
        }
    };

    const exportAllAssets = async () => {
        if (!validAssets.length) {
            message.warning(t("assets.noneToExport"));
            return;
        }
        await exportAssets(validAssets, "冬虫夏草复刻_全套系统资产包");
    };

    const importAssetZip = async (file?: File) => {
        if (!file) return;
        try {
            const importedAssets = await readAssetPackage(file);
            importedAssets.forEach((asset) => {
                const payload = { ...asset } as Record<string, unknown>;
                delete payload.id;
                delete payload.createdAt;
                delete payload.updatedAt;
                addAsset(payload as Parameters<typeof addAsset>[0]);
            });
            message.success(t("assets.imported", { count: importedAssets.length }));
        } catch {
            message.error(t("assets.importFailed"));
        } finally {
            if (assetInputRef.current) assetInputRef.current.value = "";
        }
    };

    const confirmDelete = () => {
        if (!deletingAsset) return;
        removeAsset(deletingAsset.id);
        message.success(t("assets.deleted"));
        setDeletingAsset(null);
    };

    return (
        <div className="flex h-full flex-col overflow-hidden bg-background text-stone-900 dark:text-stone-100">
            <main className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] px-6 py-6 [background-size:16px_16px] dark:bg-[radial-gradient(rgba(245,245,244,.14)_1px,transparent_1px)]">
                <div className="pb-6">
                    {/* 页面标题与一键同步中枢 */}
                    <div className="mx-auto max-w-6xl">
                        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                            <div className="text-center md:text-left">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-3xl font-bold tracking-tight text-stone-950 dark:text-stone-100">全能资产总库</h1>
                                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                        全部聚合在库
                                    </span>
                                </div>
                                <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">
                                    一站式汇聚冬虫夏草交付成片、11镜切片、出镜角色、场景布景、道具实拍、标题特效、广播母带人声与逐句台本
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <Button
                                    type="primary"
                                    icon={<RefreshCw className={cn("size-3.5", isSyncing && "animate-spin")} />}
                                    loading={isSyncing}
                                    onClick={() => void handleSync(false)}
                                    className="bg-emerald-600 hover:bg-emerald-500"
                                >
                                    ⚡ 一键同步系统全量资产
                                </Button>
                                <Button onClick={() => void exportAllAssets()}>
                                    {t("assets.export")}
                                </Button>
                                <Button onClick={() => assetInputRef.current?.click()}>
                                    {t("assets.import")}
                                </Button>
                                <Button onClick={openCreate}>
                                    + 手动新建
                                </Button>
                            </div>
                        </div>

                        {/* 资产全景统计概览胶囊 */}
                        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9">
                            <StatPill label="总资产" count={stats.total} icon={<Layers className="size-3.5 text-indigo-500" />} active={categoryFilter === "all"} onClick={() => setCategoryFilter("all")} />
                            <StatPill
                                label="🚀 已发布成片"
                                count={publishedCount}
                                icon={<CheckCircle2 className="size-3.5 text-emerald-500" />}
                                active={categoryFilter === "published"}
                                onClick={() => setCategoryFilter(categoryFilter === "published" ? "all" : "published")}
                                highlight={publishedCount > 0}
                            />
                            <StatPill label="交付成片" count={stats.deliverable} icon={<Film className="size-3.5 text-rose-500" />} active={categoryFilter === "deliverable"} onClick={() => setCategoryFilter("deliverable")} />
                            <StatPill label="分镜切片" count={stats.clip} icon={<Play className="size-3.5 text-amber-500" />} active={categoryFilter === "clip"} onClick={() => setCategoryFilter("clip")} />
                            <StatPill label="出镜角色" count={stats.character} icon={<Sparkles className="size-3.5 text-blue-500" />} active={categoryFilter === "character"} onClick={() => setCategoryFilter("character")} />
                            <StatPill label="场景布景" count={stats.scene} icon={<Layers className="size-3.5 text-emerald-500" />} active={categoryFilter === "scene"} onClick={() => setCategoryFilter("scene")} />
                            <StatPill label="产品道具" count={stats.product} icon={<Sparkles className="size-3.5 text-purple-500" />} active={categoryFilter === "product"} onClick={() => setCategoryFilter("product")} />
                            <StatPill label="广播音频" count={stats.audio} icon={<Music className="size-3.5 text-cyan-500" />} active={categoryFilter === "audio"} onClick={() => setCategoryFilter("audio")} />
                            <StatPill label="台本文本" count={stats.text} icon={<Layers className="size-3.5 text-stone-500" />} active={categoryFilter === "text"} onClick={() => setCategoryFilter("text")} />
                        </div>

                        {/* 搜索与多维分类栏 */}
                        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="w-full lg:max-w-md">
                                <Input.Search
                                    size="middle"
                                    allowClear
                                    prefix={<Search className="size-4 text-stone-400" />}
                                    value={keyword}
                                    placeholder="搜索成片、分镜、角色、场景、台本或标签..."
                                    onChange={(event) => {
                                        setPage(1);
                                        setKeyword(event.target.value);
                                    }}
                                    onSearch={(value) => {
                                        setPage(1);
                                        setKeyword(value);
                                    }}
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
                                {categoryTabs.map((tab) => (
                                    <Tag.CheckableTag
                                        key={tab.key}
                                        checked={categoryFilter === tab.key}
                                        className={cn("cursor-pointer rounded-full px-3 py-1 text-xs transition-colors", categoryFilter === tab.key && "!bg-stone-900 !text-white dark:!bg-stone-100 dark:!text-stone-900")}
                                        onChange={() => {
                                            setPage(1);
                                            setCategoryFilter(tab.key);
                                        }}
                                    >
                                        {tab.label}
                                    </Tag.CheckableTag>
                                ))}
                            </div>
                        </div>

                        {/* 快速标签筛选行 */}
                        {availableTags.length > 0 && (
                            <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-stone-200/60 pt-3 dark:border-stone-800/60">
                                <span className="text-xs text-stone-400">标签快速筛选:</span>
                                <Tag.CheckableTag
                                    checked={selectedTag === "all"}
                                    onChange={() => setSelectedTag("all")}
                                    className="cursor-pointer text-[11px]"
                                >
                                    全部标签
                                </Tag.CheckableTag>
                                {availableTags.map((tag) => (
                                    <Tag.CheckableTag
                                        key={tag}
                                        checked={selectedTag === tag}
                                        onChange={() => setSelectedTag(selectedTag === tag ? "all" : tag)}
                                        className="cursor-pointer text-[11px]"
                                    >
                                        #{tag}
                                    </Tag.CheckableTag>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 资产卡片网格列表 */}
                <div className="mx-auto flex max-w-6xl flex-col gap-6">
                    <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {visibleAssets.map((asset) => (
                            <AssetCard
                                key={asset.id}
                                asset={asset}
                                onOpen={() => setPreviewAsset(asset)}
                                onPublish={() => requestPublish(asset)}
                                onEdit={() => openEdit(asset)}
                                onCopy={copyAssetText}
                                onDownload={downloadImage}
                                onDelete={() => setDeletingAsset(asset)}
                            />
                        ))}
                    </div>

                    {!visibleAssets.length && (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 py-16 text-center dark:border-stone-800">
                            <Empty description="未找到符合筛选条件的资产" />
                            <Button
                                type="primary"
                                icon={<RefreshCw className="size-3.5" />}
                                onClick={() => void handleSync(false)}
                                className="mt-4 bg-emerald-600 hover:bg-emerald-500"
                            >
                                立即从系统拉取 42 项全链路资产
                            </Button>
                        </div>
                    )}

                    <div className="flex items-center justify-between border-t border-stone-200 pt-4 dark:border-stone-800">
                        <span className="text-xs text-stone-500">
                            显示第 {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredAssets.length)} 项，共 {filteredAssets.length} 项资产
                            {lastSyncTime && <span className="ml-2 text-stone-400">（上次同步: {lastSyncTime}）</span>}
                        </span>
                        <Pagination
                            current={page}
                            pageSize={pageSize}
                            total={filteredAssets.length}
                            showSizeChanger
                            pageSizeOptions={[12, 24, 48, 96]}
                            onChange={(nextPage, nextPageSize) => {
                                setPage(nextPage);
                                setPageSize(nextPageSize);
                            }}
                        />
                    </div>
                </div>
            </main>

            {/* 新建/编辑弹窗 */}
            <Modal title={editingAsset ? t("assets.edit") : t("assets.add")} open={isAssetOpen} width={980} onCancel={() => setIsAssetOpen(false)} onOk={() => void saveAsset()} okText={t("common.save")} cancelText={t("common.cancel")} destroyOnHidden>
                <div className="grid gap-6 pt-1 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <Form form={form} layout="vertical" requiredMark={false} initialValues={{ kind: "text", tags: [] }}>
                        <Form.Item name="kind" label={t("assets.type")}>
                            <Select
                                options={[
                                    { label: t("assets.kinds.text"), value: "text" },
                                    { label: t("assets.kinds.image"), value: "image" },
                                ]}
                                onChange={(value) => setFormKind(value)}
                            />
                        </Form.Item>
                        <Form.Item name="title" label={t("assets.fields.title")} rules={[{ required: true, message: t("assets.fields.titleRequired") }]}>
                            <Input size="large" placeholder={t("assets.fields.titlePlaceholder")} />
                        </Form.Item>
                        <Form.Item name="coverUrl" label={t("assets.fields.coverUrl")}>
                            <Space.Compact className="w-full">
                                <Input placeholder={t("assets.fields.coverPlaceholder")} />
                                <Button icon={<Upload className="size-3.5" />} onClick={() => coverInputRef.current?.click()}>
                                    {t("common.upload")}
                                </Button>
                            </Space.Compact>
                        </Form.Item>
                        <Form.Item name="tags" label={t("assets.fields.tags")}>
                            <Select mode="tags" tokenSeparators={[",", "，"]} placeholder={t("assets.fields.tagsPlaceholder")} />
                        </Form.Item>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Form.Item name="source" label={t("assets.fields.source")}>
                                <Input placeholder={t("assets.fields.sourcePlaceholder")} />
                            </Form.Item>
                            <Form.Item name="note" label={t("assets.fields.note")}>
                                <Input placeholder={t("assets.fields.optional")} />
                            </Form.Item>
                        </div>
                        {formKind === "text" ? (
                            <Form.Item name="content" label={t("assets.fields.textContent")} rules={[{ required: true, message: t("assets.fields.textRequired") }]}>
                                <Input.TextArea rows={8} placeholder={t("assets.fields.textPlaceholder")} />
                            </Form.Item>
                        ) : (
                            <Form.Item label={t("assets.fields.imageContent")} required>
                                <div className="rounded-lg border border-dashed border-stone-300 p-4 dark:border-stone-700">
                                    <Button icon={<Upload className="size-4" />} onClick={() => imageInputRef.current?.click()}>
                                        {t("assets.selectImageFile")}
                                    </Button>
                                    {imageDraft ? (
                                        <Typography.Text type="secondary" className="ml-3 text-xs">
                                            {imageDraft.width}x{imageDraft.height} · {formatBytes(imageDraft.bytes)}
                                        </Typography.Text>
                                    ) : (
                                        <Typography.Text type="secondary" className="ml-3 text-xs">
                                            {t("assets.noImageSelected")}
                                        </Typography.Text>
                                    )}
                                </div>
                            </Form.Item>
                        )}
                    </Form>
                    <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                        <Typography.Text strong>{t("assets.preview")}</Typography.Text>
                        <div className="mt-3 overflow-hidden rounded-lg border border-stone-200 bg-background dark:border-stone-800">
                            {coverUrl || imageDraft?.dataUrl ? (
                                <img src={coverUrl || imageDraft?.dataUrl} alt="" className="aspect-[4/3] w-full object-cover" />
                            ) : (
                                <div className="flex aspect-[4/3] items-center justify-center bg-stone-100 p-5 text-center text-sm text-stone-500 dark:bg-stone-900">{content || t("assets.noCover")}</div>
                            )}
                            <div className="p-4">
                                <Typography.Text strong ellipsis className="block">
                                    {title || t("assets.untitled")}
                                </Typography.Text>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {tags.length ? (
                                        tags.map((tag) => (
                                            <Tag key={tag} className="m-0">
                                                {tag}
                                            </Tag>
                                        ))
                                    ) : (
                                        <Tag className="m-0">{t("assets.untagged")}</Tag>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                        void readCoverFile(event.target.files?.[0]);
                        event.target.value = "";
                    }}
                />
                <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                        void readImageFile(event.target.files?.[0]);
                        event.target.value = "";
                    }}
                />
            </Modal>

            {/* 资产详情与全屏播放抽屉 */}
            <AssetDrawer
                asset={previewAsset}
                onClose={() => setPreviewAsset(null)}
                onPublish={(a) => requestPublish(a)}
                onCopy={copyAssetText}
                onDownload={downloadImage}
            />

            {/* 多平台一键发布中枢（抖音 · 快手 · 视频号） */}
            <MultiPlatformPublishModal
                open={Boolean(publishingAsset)}
                asset={publishingAsset}
                onClose={() => setPublishingAsset(null)}
            />

            <input ref={assetInputRef} type="file" accept="application/zip,.zip" className="hidden" onChange={(event) => void importAssetZip(event.target.files?.[0])} />

            <Modal title={t("assets.deleteTitle")} open={Boolean(deletingAsset)} onCancel={() => setDeletingAsset(null)} onOk={confirmDelete} okText={t("common.delete")} okButtonProps={{ danger: true }} cancelText={t("common.cancel")}>
                {t("assets.deleteConfirm", { name: deletingAsset?.title })}
            </Modal>
        </div>
    );
}

function StatPill({
    label,
    count,
    icon,
    active,
    highlight,
    onClick,
}: {
    label: string;
    count: number;
    icon: React.ReactNode;
    active?: boolean;
    highlight?: boolean;
    onClick?: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex flex-col items-center justify-center rounded-xl border border-stone-200/80 bg-white p-2.5 text-center shadow-xs transition hover:border-emerald-400 hover:shadow-sm dark:border-stone-800 dark:bg-stone-900",
                highlight && count > 0 && "border-emerald-300/80 bg-emerald-50/40 text-emerald-950 dark:border-emerald-700/60 dark:bg-emerald-950/20",
                active && "!border-emerald-500 !bg-emerald-50 !ring-2 !ring-emerald-500/50 dark:!bg-emerald-950/50"
            )}
        >
            <div className="flex items-center gap-1.5">
                {icon}
                <span className={cn("text-[11px] font-medium text-stone-500 dark:text-stone-400", highlight && count > 0 && "text-emerald-700 dark:text-emerald-300 font-semibold")}>
                    {label}
                </span>
            </div>
            <span className={cn("mt-1 text-base font-bold text-stone-900 dark:text-stone-100", highlight && count > 0 && "text-emerald-600 dark:text-emerald-400")}>
                {count}
            </span>
        </button>
    );
}

function AssetCard({
    asset,
    onOpen,
    onPublish,
    onEdit,
    onCopy,
    onDownload,
    onDelete
}: {
    asset: Asset;
    onOpen: () => void;
    onPublish: (asset: Asset) => void;
    onEdit: () => void;
    onCopy: (asset: Asset) => void;
    onDownload: (asset: Asset) => void;
    onDelete: () => void;
}) {
    const { t } = useTranslation();
    useSyncExternalStore(subscribeImagePreviews, getImagePreviewRevision);
    const cover = assetCoverUrl(asset);
    const summary = assetSummary(asset);
    const isVideo = asset.kind === "video";
    const isAudio = (asset as any).category === "audio" || asset.id?.startsWith("audio_");
    const publishInfo = usePublishStore((state) => state.items[mediaKeyOf(asset)]);
    const isPublished = Boolean(publishInfo?.published);

    return (
        <Card
            hoverable
            className={cn(
                "group overflow-hidden rounded-xl border border-stone-200/90 shadow-xs transition-all hover:-translate-y-0.5 hover:border-emerald-400/80 hover:shadow-md dark:border-stone-800",
                isPublished && "border-emerald-500/40 bg-gradient-to-b from-emerald-500/[0.03] to-transparent dark:border-emerald-500/40"
            )}
            styles={{ body: { padding: 0 } }}
            cover={
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-950">
                    <button type="button" className="block size-full text-left" onClick={onOpen}>
                        {cover ? (
                            <img
                                src={cover}
                                alt={asset.title}
                                className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                            />
                        ) : isAudio ? (
                            <div className="flex size-full flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-slate-900 to-black p-4 text-center text-white">
                                <Music className="size-8 text-cyan-400 animate-pulse" />
                                <span className="mt-2 text-xs font-medium text-cyan-200">广播级母带人声</span>
                            </div>
                        ) : (
                            <div className="flex size-full items-center justify-center bg-stone-100 p-5 text-center text-xs leading-5 text-stone-600 dark:bg-stone-900 dark:text-stone-300">
                                {asset.kind === "text" ? asset.data.content.slice(0, 80) : t("assets.noCover")}
                            </div>
                        )}

                        {/* 视频专属播放悬浮遮罩 */}
                        {isVideo && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-80 transition-opacity group-hover:bg-black/40 group-hover:opacity-100">
                                <div className="flex size-11 items-center justify-center rounded-full bg-white/90 text-stone-900 shadow-lg backdrop-blur-xs transition group-hover:scale-110">
                                    <Play className="size-5 fill-stone-900 ml-0.5" />
                                </div>
                            </div>
                        )}

                        {/* 来源药丸角标 */}
                        {asset.source && (
                            <div className="absolute left-2.5 top-2.5 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
                                {asset.source}
                            </div>
                        )}

                        {/* 已发布醒目高亮徽章 */}
                        {isPublished && (
                            <div
                                className="absolute right-2.5 top-2.5 z-10 flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-lg shadow-emerald-950/50 ring-2 ring-emerald-300/40 backdrop-blur-xs"
                                title={`已发布 ${publishInfo?.count} 次 · 最近 ${publishInfo?.last_at}`}
                            >
                                <span className="relative flex size-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75"></span>
                                    <span className="relative inline-flex size-2 rounded-full bg-white"></span>
                                </span>
                                <CheckCircle2 className="size-3.5 stroke-[2.5]" />
                                <span>已发布{publishInfo && publishInfo.count > 1 ? ` · ${publishInfo.count}次` : ""}</span>
                            </div>
                        )}

                        {/* 类型与时长药丸 */}
                        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
                            {isVideo && (
                                <span className="rounded-md bg-rose-600/90 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
                                    VIDEO
                                </span>
                            )}
                            <span className="rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
                                {t(`assets.kinds.${asset.kind}`)}
                            </span>
                        </div>
                    </button>
                </div>
            }
        >
            <div className="p-3.5">
                <div className="flex items-start justify-between gap-2">
                    <h2
                        onClick={onOpen}
                        className="line-clamp-1 cursor-pointer text-sm font-semibold text-stone-900 hover:text-emerald-600 dark:text-stone-100 dark:hover:text-emerald-400"
                        title={asset.title}
                    >
                        {asset.title}
                    </h2>
                </div>

                <p className="mt-1 line-clamp-2 text-xs leading-4.5 text-stone-500 dark:text-stone-400">
                    {asset.note || summary}
                </p>

                {/* 已发布分发状态横条 */}
                {isPublished && publishInfo && (
                    <div className="mt-2.5 flex flex-col gap-1 rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-2 text-[11px] text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <div className="flex items-center justify-between font-semibold">
                            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 className="size-3.5" />
                                已多平台发布
                            </span>
                            <span className="font-mono text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
                                {publishInfo.last_at ? publishInfo.last_at.slice(5, 16) : ""}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                            {Object.entries(publishInfo.platforms || {}).map(([plat, status]) => {
                                const platName = plat === "channels" ? "视频号" : plat === "kuaishou" ? "快手" : plat === "douyin" ? "抖音" : plat;
                                const isOk = status === "ok";
                                return (
                                    <span
                                        key={plat}
                                        className={cn(
                                            "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium shadow-2xs",
                                            isOk
                                                ? "bg-white/90 text-stone-800 dark:bg-stone-800 dark:text-stone-200"
                                                : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                                        )}
                                    >
                                        <span className={cn("size-1.5 rounded-full", isOk ? "bg-emerald-500" : "bg-amber-500")}></span>
                                        <span>{platName}</span>
                                        <span className={cn("text-[9px]", isOk ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600")}>
                                            {isOk ? "成功" : status}
                                        </span>
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="mt-2.5 flex flex-wrap gap-1">
                    {(asset.tags || []).slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                            #{tag}
                        </span>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-between border-t border-stone-100 px-3.5 py-2.5 dark:border-stone-800">
                <div className="flex items-center gap-1.5">
                    {isVideo ? (
                        <>
                            <Button
                                size="small"
                                type={isPublished ? "default" : "primary"}
                                icon={<Send className="size-3" />}
                                onClick={() => onPublish(asset)}
                                className={cn(
                                    "text-xs font-semibold",
                                    isPublished
                                        ? "border-emerald-500/60 text-emerald-700 hover:border-emerald-600 hover:text-emerald-800 dark:border-emerald-500/40 dark:text-emerald-300"
                                        : "bg-emerald-600 hover:bg-emerald-500"
                                )}
                            >
                                {isPublished ? "再次发布" : "发布"}
                            </Button>
                            <Button size="small" ghost icon={<Play className="size-3" />} onClick={onOpen} className="text-xs">
                                播放
                            </Button>
                        </>
                    ) : (
                        <Button size="small" type="primary" ghost onClick={onOpen} className="text-xs">
                            {t("common.view")}
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <Button
                        size="small"
                        icon={<Copy className="size-3" />}
                        onClick={() => void onCopy(asset)}
                        title={isVideo ? "复制视频直链" : "复制"}
                    />
                    {(asset.kind === "image" || asset.kind === "video") && (
                        <Button
                            size="small"
                            icon={<Download className="size-3" />}
                            onClick={() => onDownload(asset)}
                            title="下载"
                        />
                    )}
                    {asset.kind !== "video" && (
                        <Button
                            size="small"
                            icon={<PencilLine className="size-3" />}
                            onClick={onEdit}
                            title="编辑"
                        />
                    )}
                    <Button
                        size="small"
                        danger
                        icon={<Trash2 className="size-3" />}
                        onClick={onDelete}
                        title="删除"
                    />
                </div>
            </div>
        </Card>
    );
}

function AssetDrawer({
    asset,
    onClose,
    onPublish,
    onCopy,
    onDownload
}: {
    asset: Asset | null;
    onClose: () => void;
    onPublish: (asset: Asset) => boolean;
    onCopy: (asset: Asset) => void;
    onDownload: (asset: Asset) => void;
}) {
    const { t } = useTranslation();
    useSyncExternalStore(subscribeImagePreviews, getImagePreviewRevision);
    const publishInfo = usePublishStore((state) => (asset ? state.items[mediaKeyOf(asset)] : undefined));
    const isPublished = Boolean(publishInfo?.published);

    if (!asset) return null;

    const cover = asset.coverUrl || (asset.kind === "image" ? asset.data.dataUrl : "");
    const isVideo = asset.kind === "video";
    const isAudio = (asset as any).category === "audio" || asset.id?.startsWith("audio_");
    const mediaUrl = isVideo ? asset.data.url : (asset.kind === "image" ? (asset.data.dataUrl || asset.coverUrl) : "");

    return (
        <Drawer
            title={
                <div className="flex items-center gap-2">
                    <span className="font-semibold">{asset.title}</span>
                    <Tag color="cyan">{asset.source || "系统内置"}</Tag>
                    {isPublished && (
                        <Tag color="success" className="flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="size-3" />
                            已发布 ({publishInfo?.count}次)
                        </Tag>
                    )}
                </div>
            }
            open={Boolean(asset)}
            width={640}
            onClose={onClose}
        >
            <div className="space-y-6">
                {/* 视频全屏高保真播放器 */}
                {isVideo && (
                    <div className="overflow-hidden rounded-xl bg-black shadow-lg">
                        <video
                            src={asset.data.url}
                            controls
                            autoPlay
                            loop
                            className="aspect-[9/16] max-h-[500px] w-full object-contain mx-auto"
                        />
                    </div>
                )}

                {/* 已发布全网分发档案卡 */}
                {isPublished && publishInfo && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/50 p-4 shadow-xs dark:border-emerald-500/30 dark:bg-emerald-950/20">
                        <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2.5 dark:border-emerald-800/60">
                            <div className="flex items-center gap-2">
                                <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                                    <CheckCircle2 className="size-4" />
                                </span>
                                <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                                    全网发布履历
                                </span>
                                <Tag color="success" className="m-0 text-xs font-semibold">
                                    累计发布 {publishInfo.count} 次
                                </Tag>
                            </div>
                            <span className="font-mono text-xs text-stone-500 dark:text-stone-400">
                                最近一次: {publishInfo.last_at}
                            </span>
                        </div>

                        <div className="mt-3 space-y-2">
                            <div className="text-xs text-stone-500 dark:text-stone-400">已分发平台及回执核对：</div>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                {Object.entries(publishInfo.platforms || {}).map(([plat, status]) => {
                                    const meta =
                                        plat === "channels"
                                            ? { name: "微信视频号", link: "https://channels.weixin.qq.com/platform/post/list", color: "text-emerald-700 dark:text-emerald-300" }
                                            : plat === "kuaishou"
                                            ? { name: "快手创作者服务", link: "https://cp.kuaishou.com/article/manage/video", color: "text-amber-700 dark:text-amber-300" }
                                            : { name: "抖音创作者中心", link: "https://creator.douyin.com/creator-micro/content/manage", color: "text-rose-700 dark:text-rose-300" };
                                    const isOk = status === "ok";
                                    return (
                                        <div
                                            key={plat}
                                            className="flex flex-col justify-between rounded-lg border border-stone-200/80 bg-white p-2.5 text-xs shadow-2xs dark:border-stone-800 dark:bg-stone-900"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className={cn("font-medium", meta.color)}>{meta.name}</span>
                                                <span className={cn("rounded px-1.5 py-0.2 text-[10px] font-semibold", isOk ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-amber-100 text-amber-700")}>
                                                    {isOk ? "发布成功" : status}
                                                </span>
                                            </div>
                                            <a
                                                href={meta.link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-2 inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-emerald-600 dark:text-stone-400"
                                            >
                                                <span>打开后台核对</span>
                                                <ExternalLink className="size-3" />
                                            </a>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* 音频试听播放器 */}
                {isAudio && (
                    <div className="rounded-xl border border-stone-200 bg-gradient-to-r from-stone-900 to-slate-900 p-5 text-white shadow-sm dark:border-stone-800">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                                <Music className="size-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold">{asset.title}</h4>
                                <p className="text-xs text-stone-400">{asset.note || "广播级 EBU R128 (-16 LUFS) 母带音轨"}</p>
                            </div>
                        </div>
                        <audio controls src={(asset as any).url || asset.data?.url} className="mt-4 w-full" />
                    </div>
                )}

                {/* 图片高清大图展示 */}
                {asset.kind === "image" && (
                    <div className="overflow-hidden rounded-xl border border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-900">
                        <Image
                            src={assetCoverUrl(asset)}
                            preview={{ src: cover }}
                            alt={asset.title}
                            className="max-h-[480px] w-full object-contain"
                        />
                    </div>
                )}

                {/* 文本内容与台本 */}
                {asset.kind === "text" && (
                    <div className="rounded-xl border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-stone-500">完整分镜施工台本 / SRT</span>
                            <Button size="small" icon={<Copy className="size-3.5" />} onClick={() => onCopy(asset)}>
                                复制台本
                            </Button>
                        </div>
                        <Typography.Paragraph className="mt-3 whitespace-pre-wrap font-mono text-xs leading-6 text-stone-800 dark:text-stone-200">
                            {asset.data.content}
                        </Typography.Paragraph>
                    </div>
                )}

                {/* 资产详情元数据表格 */}
                <div className="rounded-xl border border-stone-200/80 p-4 dark:border-stone-800">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400">资产规格与参数</h4>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                        <div>
                            <span className="text-stone-400">所属分类：</span>
                            <span className="font-medium text-stone-800 dark:text-stone-200">
                                {(asset as any).categoryLabel || t(`assets.kinds.${asset.kind}`)}
                            </span>
                        </div>
                        <div>
                            <span className="text-stone-400">资产来源：</span>
                            <span className="font-medium text-stone-800 dark:text-stone-200">{asset.source || "系统内置"}</span>
                        </div>
                        <div className="col-span-2">
                            <span className="text-stone-400">技术说明：</span>
                            <span className="font-medium text-stone-800 dark:text-stone-200">{asset.note || "标准规格"}</span>
                        </div>
                        {mediaUrl && (
                            <div className="col-span-2">
                                <span className="text-stone-400">资源直链：</span>
                                <span className="break-all font-mono text-[11px] text-emerald-600 dark:text-emerald-400">{mediaUrl}</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-1.5 border-t border-stone-100 pt-3 dark:border-stone-800">
                        {(asset.tags || []).map((tag) => (
                            <Tag key={tag} color="blue" className="m-0">
                                #{tag}
                            </Tag>
                        ))}
                    </div>
                </div>

                {/* 底部动作按钮栏 */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                    {isVideo && (
                        <Button
                            type="primary"
                            icon={<Send className="size-4" />}
                            onClick={() => {
                                if (onPublish(asset)) onClose();
                            }}
                            className={cn(
                                "font-semibold shadow-md",
                                isPublished
                                    ? "bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white"
                                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
                            )}
                        >
                            {isPublished ? "🚀 再次发布或换平台分发" : "🚀 一键发布（抖音 · 快手 · 视频号）"}
                        </Button>
                    )}
                    {mediaUrl && (
                        <Button
                            type="primary"
                            icon={<ExternalLink className="size-4" />}
                            onClick={() => window.open(mediaUrl, "_blank")}
                            className="bg-stone-800 hover:bg-stone-700"
                        >
                            在新标签页打开播放
                        </Button>
                    )}
                    <Button icon={<Copy className="size-4" />} onClick={() => onCopy(asset)}>
                        {isVideo ? "复制视频直链" : (asset.kind === "text" ? "复制台本" : "复制地址")}
                    </Button>
                    {(asset.kind === "image" || isVideo) && (
                        <Button icon={<Download className="size-4" />} onClick={() => onDownload(asset)}>
                            {isVideo ? "下载成片文件" : "下载图片"}
                        </Button>
                    )}
                </div>
            </div>
        </Drawer>
    );
}

async function readAssetMediaBlob(asset: Extract<Asset, { kind: "image" | "video" }>) {
    const storageKey = asset.data.storageKey;
    if (storageKey) {
        const stored = asset.kind === "image" ? await getImageBlob(storageKey) : await getMediaBlob(storageKey);
        if (stored) return stored;
    }
    const url = asset.kind === "video" ? asset.data.url : asset.data.dataUrl || asset.coverUrl;
    if (!url) return null;
    const response = await fetch(url);
    return response.ok ? response.blob() : null;
}

function assetSummary(asset: Asset) {
    if (asset.kind === "text") return asset.data.content;
    return `${asset.data.width || 720}x${asset.data.height || 1280} · ${formatBytes(asset.data.bytes || 0)} · ${asset.data.mimeType || "media"}`;
}

function assetSearchText(asset: Asset) {
    return [asset.title, asset.source || "", asset.note || "", (asset.tags || []).join(" "), asset.kind === "text" ? asset.data.content : asset.data.mimeType].join(" ").toLowerCase();
}
