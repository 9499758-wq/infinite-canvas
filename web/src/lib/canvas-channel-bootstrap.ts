/**
 * 从 svpipe 后端拉取「已经配好的模型渠道」，装进画布的配置里。
 *
 * 为什么要有这一步
 * ---------------
 * 这套开源画布（basketikun/infinite-canvas）本身默认指向 api.openai.com，
 * 渠道、密钥、模型全是空的。用户打开 /canvas 看到的是「什么都选不了」——
 * 那正是「很多功能都空着」的另一种形态。
 *
 * 而 svpipe 这边早就有 14 条跑通过的通道（H3 / Seedance 2.5 ×4 /
 * gpt-image-2 ×2 / Muse / Kling / Seedream / DeepSeek……），
 * 每条的协议差异都写在 lib/canvas_channels.py 里生成成了 JS 脚本。
 * 这里只负责把它灌进 zustand 的配置 store。
 *
 * 三条原则
 * -------
 * 1) **只在缺的时候填**。用户自己在「配置」页改过的渠道、密钥、模型，
 *    一律不动 —— 启动时把用户的设置覆盖掉是最不能接受的行为。
 * 2) **缺一条补一条**。后端加了新通道，刷新页面就自动出现，不用清缓存。
 * 3) **失败不影响画布**。后端没起、接口报错，都只是「没有预置渠道」，
 *    画布本身照常可用（用户还能手填）。
 */
import { CONFIG_STORE_KEY, modelOptionsFromChannels, normalizeChannelModels, useConfigStore, type AiConfig, type ModelChannel } from "@/stores/use-config-store";

type ServerPayload = {
    channels?: ModelChannel[];
    defaults?: { imageModel?: string; videoModel?: string; textModel?: string; audioModel?: string };
    count?: number;
};

const ENDPOINT = "/api/canvas/channels";

function encode(channelId: string, model: string) {
    return `${channelId}::${model}`;
}

/** 把后端渠道合并进当前配置。返回是否发生了改动。 */
function mergeChannels(config: AiConfig, payload: ServerPayload): AiConfig | null {
    const incoming = (payload.channels || []).filter((c) => c && c.id && Array.isArray(c.models) && c.models.length);
    if (!incoming.length) return null;

    // ★ 先拆掉上游自带的占位渠道。它是 `default` + api.openai.com + 空密钥，
    //   模型表里挂着 gpt-image-2 / grok-imagine-video / gpt-4o-mini-tts。
    //   留着它的后果很具体：defaultConfig 把 imageModel 写死成
    //   "default::gpt-image-2"、videoModel 写死成 "default::grok-imagine-video"，
    //   于是用户第一次打开画布，选中视频模型就是一个**没有密钥的通道**，
    //   点生成必报「API Key 未配置」—— 而真正能跑的 H3 就排在它后面。
    //   本人已经配好后端渠道的场景下，这个空壳只会误导，一律移除。
    //   （只在它有密钥时保留：那是用户自己填的，不能动。）
    const cleaned = (config.channels || []).filter(
        (c) => !(c.id === "default" && !c.apiKey.trim() && /api\.openai\.com/i.test(c.baseUrl)),
    );
    const existing = cleaned;
    const known = new Set(existing.map((c) => c.id));
    const missing = incoming.filter((c) => !known.has(c.id));

    // ★ 一条都不缺就不动 —— 否则每次刷新都会把用户手动改过的 baseUrl /
    //   模型列表重置回服务端版本，改动白做。
    if (!missing.length && existing.length === (config.channels || []).length) return null;

    const channels = [
        ...existing,
        ...missing.map((c) => ({
            ...c,
            apiFormat: "openai" as const,
            models: normalizeChannelModels(c.models),
        })),
    ];

    const models = modelOptionsFromChannels(channels);
    const pick = (capability: "image" | "video" | "text" | "audio", current: string, fallback = "") => {
        // ★ 判据是「这条通道有没有密钥」，不是「这个模型名在不在列表里」。
        //   名字在、但通道空密钥 → 选中它等于选中一个必失败的动作。
        const usable = (value: string) => {
            if (!value) return false;
            const id = value.split("::")[0];
            const channel = channels.find((c) => c.id === id);
            return Boolean(channel && channel.apiKey.trim() && channel.models.some((m) => `${id}::${m.name}` === value));
        };
        if (usable(current)) return current;
        const fromServer = (payload.defaults || {})[`${capability}Model` as const] || "";
        if (usable(fromServer)) return fromServer;
        const first = channels
            .filter((c) => c.apiKey.trim())
            .flatMap((c) => c.models.filter((m) => m.capability === capability).map((m) => `${c.id}::${m.name}`))[0];
        return first || fallback;
    };

    return {
        ...config,
        channels,
        models,
        baseUrl: config.baseUrl || channels[0]?.baseUrl || "",
        // 单通道模式的 apiKey 也顺手补上，否则「配置」页顶部那块是空的
        apiKey: config.apiKey || channels[0]?.apiKey || "",
        imageModel: pick("image", config.imageModel, config.model),
        videoModel: pick("video", config.videoModel),
        textModel: pick("text", config.textModel),
        audioModel: config.audioModel || payload.defaults?.audioModel || "",
        model: pick("image", config.model, config.imageModel),
    };
}

/**
 * 拉一次后端渠道并合并。幂等：没有缺失渠道时什么都不做。
 * ★ 不 await 在渲染之前 —— 画布要能立刻打开，渠道晚半秒到位没关系。
 */
export async function bootstrapChannels(): Promise<void> {
    try {
        const res = await fetch(ENDPOINT, { headers: { Accept: "application/json" } });
        if (!res.ok) return;
        const payload = (await res.json()) as ServerPayload;
        const store = useConfigStore.getState();
        const next = mergeChannels(store.config, payload);
        if (!next) return;
        store.updateConfig("channels", next.channels);
        store.updateConfig("models", next.models);
        if (next.imageModel !== store.config.imageModel) store.updateConfig("imageModel", next.imageModel);
        if (next.videoModel !== store.config.videoModel) store.updateConfig("videoModel", next.videoModel);
        if (next.textModel !== store.config.textModel) store.updateConfig("textModel", next.textModel);
        if (next.model && next.model !== store.config.model) store.updateConfig("model", next.model);
        if (next.baseUrl && next.baseUrl !== store.config.baseUrl) store.updateConfig("baseUrl", next.baseUrl);
        if (next.apiKey && next.apiKey !== store.config.apiKey) store.updateConfig("apiKey", next.apiKey);
        // persist 中间件会在 set 之后自己写 localStorage，这里不用手动存。
        void CONFIG_STORE_KEY;
    } catch {
        // 后端没起 / 接口缺失 → 静默跳过，画布照常能用
    }
}
