import { nanoid } from "nanoid";

export type PromptSource = {
    id: string;
    name: string;
    url: string;
    homepage: string;
    enabled: boolean;
    builtIn: boolean;
};

export const PROMPT_REGISTRY_HOMEPAGE = "https://github.com/yukkcat/image-prompts";

// ★ 提示词源的地址：由**本机后端**代理，不走浏览器直连 GitHub raw。
//
//   上游原本是 `https://raw.githubusercontent.com/yukkcat/image-prompts/main/dist/sources/<id>.json`，
//   7 个源合计 1.2MB。埋点实测（web/canvas_prompt_trace.cjs）：
//
//     fetch HEADERS   0.27s   ← 响应头很快就回来了
//     json() DONE    20.5s    ← 响应体读 + 解析花了 20 秒
//
//   同样这 7 个 URL 用 curl 在本机拉，最慢 1.3s、全部 1.02s 搞定。差一个数量级。
//   用户看到的就是那句「当前共 0 条提示词」—— 而且因为 getAllPrompts 里
//   每个源都 `catch { return [] }`，错误全被吞，页面上连个报错都没有。
//
//   改成走 svpipe 的 /api/canvas/prompts（本机拉 + 本机磁盘缓存，TTL 1 小时），
//   1.2MB 走 127.0.0.1 回环是毫秒级。顺带解决了「GitHub 被墙 / 代理拦 raw 域名」
//   的场景：后端有过期也能退回旧缓存，不至于整页空白。
const PROMPT_LOCAL_BASE = "/api/canvas/prompts";

export function createPromptSource(source?: Partial<PromptSource>): PromptSource {
    return {
        id: source?.id?.trim() || nanoid(),
        name: source?.name?.trim() || "",
        url: source?.url?.trim() || "",
        homepage: source?.homepage?.trim() || "",
        enabled: source?.enabled ?? true,
        builtIn: source?.builtIn ?? false,
    };
}

export const DEFAULT_PROMPT_SOURCES: PromptSource[] = [
    registrySource("banana-prompt-quicker", "Banana Prompt Quicker", "https://glidea.github.io/banana-prompt-quicker/"),
    registrySource("davidwu-gpt-image2-prompts", "DavidWu GPT Image 2", "https://github.com/davidwuw0811-boop/awesome-gpt-image2-prompts"),
    registrySource("freestylefly-gpt-image-2", "Freestylefly GPT Image 2", "https://github.com/freestylefly/awesome-gpt-image-2"),
    registrySource("awesome-gpt-image", "Awesome GPT Image", "https://github.com/ZeroLu/awesome-gpt-image"),
    registrySource("awesome-gpt4o-image-prompts", "Awesome GPT-4o", "https://github.com/ImgEdify/Awesome-GPT4o-Image-Prompts"),
    registrySource("youmind-gpt-image-2", "YouMind GPT Image 2", "https://github.com/YouMind-OpenLab/awesome-gpt-image-2"),
    registrySource("youmind-nano-banana-pro", "YouMind Nano Banana Pro", "https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts"),
];

function registrySource(id: string, name: string, homepage: string): PromptSource {
    return { id, name, url: `${PROMPT_LOCAL_BASE}?source=${id}`, homepage, enabled: true, builtIn: true };
}
