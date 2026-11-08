import { create } from "zustand";

import type { Asset } from "@/stores/use-asset-store";

export type PublishRecord = {
    at: string;
    status: string;
    platforms: Record<string, string>;
    title: string;
};

export type PublishInfo = {
    published: boolean;
    count: number;
    last_at: string;
    last_status: string;
    platforms: Record<string, string>;
    records: PublishRecord[];
};

type PublishStore = {
    items: Record<string, PublishInfo>;
    refresh: () => Promise<number>;
};

/**
 * 资产的媒体 URL → 发布日志里的相对路径 `out/<线>/<文件>`。
 *
 * 日志存的是绝对路径（…/svpipe/out/…），资产手里是 /api/media/out%2F…
 * 两边唯一共有的形态是这个相对路径，所以统一剪成它再比对。
 * 直接拿绝对路径跟 URL 比永远对不上，而且对不上时是静默的 —— 没有一个字报错。
 */
export function mediaKeyOf(asset: Asset): string {
    const url = asset.kind === "video" ? asset.data.url : "";
    const marker = "/api/media/";
    if (!url.includes(marker)) return "";
    return url
        .slice(url.indexOf(marker) + marker.length)
        .split("/")
        .map((s) => decodeURIComponent(s))
        .join("/");
}

export const usePublishStore = create<PublishStore>()((set) => ({
    items: {},
    refresh: async () => {
        try {
            const res = await fetch("/api/publish-history");
            if (!res.ok) return 0;
            const data = await res.json();
            const items = (data.items || {}) as Record<string, PublishInfo>;
            set({ items });
            return Object.keys(items).length;
        } catch (e) {
            console.error("加载发布履历失败:", e);
            return 0;
        }
    },
}));
