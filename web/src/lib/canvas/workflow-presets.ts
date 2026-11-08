import { CanvasNodeType, type CanvasConnection, type CanvasNodeData } from "@/types/canvas";

export type WorkflowPresetId = "alive_replicate" | "wild_replicate" | "fresh_replicate" | "h3" | "seedance" | "muse" | "muse_replicate";

export interface WorkflowPresetMeta {
    id: WorkflowPresetId;
    title: string;
    badge: string;
    description: string;
    icon: string;
    accentColor: string;
    models: string[];
}

export const WORKFLOW_PRESETS: WorkflowPresetMeta[] = [
    {
        id: "alive_replicate",
        title: "抖音爆款秒级深度音画拆解与双轨复刻 · 鲜草是活的吗？会咬人吗？ (H3多模态音图复刻 vs Muse纯文字生视频)",
        badge: "最新爆款 · 4条实机成片",
        description: "基于抖音爆款《鲜草是活的吗？会咬人吗？》秒级深度解耦拆解：8镜音画彻底拆开 · 藏族姑娘拉姆与知性女掌柜双人设 · H3音图复刻 vs Muse纯文字生视频 · 全渠道一键发布",
        icon: "Film",
        accentColor: "#ec4899",
        models: ["MiniMax-H3 (30s+58s)", "Muse (30s+58s)"],
    },
    {
        id: "wild_replicate",
        title: "抖音爆款秒级深度音画拆解与双轨复刻 · 野生冬虫夏草高原形成记 (H3多模态音图复刻 vs Muse纯文字生视频)",
        badge: "全新爆款 · 4条满血成片",
        description: "基于抖音爆款《正宗野生虫草来源高原地区》深度秒级拆解：7镜时序音画彻底拆开 · H3人物图+音频+提示词复刻 vs Muse纯文字Prompt生视频 · 全渠道一键发布",
        icon: "Film",
        accentColor: "#f59e0b",
        models: ["MiniMax-H3 (30s+48s)", "Muse (30s+48s)"],
    },
    {
        id: "fresh_replicate",
        title: "爆款秒级深度音画拆解与H3-Muse双轨复刻 · 新鲜虫草 (H3多模态音图复刻 vs Muse纯文字生视频)",
        badge: "3大模型 · 6条满血交付",
        description: "基于抖音爆款《六种新鲜虫草吃法》深度复刻：MiniMax-H3 / Muse / Seedance 2.5 各输出 33s卡点版 + 52s深度版，7镜切片·母带声画·一键矩阵化分发",
        icon: "Film",
        accentColor: "#10b981",
        models: ["MiniMax-H3 (33s+52s)", "Muse (33s+52s)", "Seedance 2.5 (33s+52s)"],
    },
    {
        id: "h3",
        title: "ComfyUI × MiniMax-H3 · 1:1 爆款复刻工作流 (鲜草是活的吗？会咬人吗？ · 用户指定图一人物 + 图二产品)",
        badge: "ComfyUI 深度整合 · 满血成片",
        description: "GitHub 开源爆款复刻精髓深度整合：ComfyUI 12 节点电商管线 · LoadVideo / Whisper / EBUR128 / LoadImage_UserPerson / LoadImage_UserProduct / H3 RV2V 多模态驱动 / InsightFace 逐帧替换 · 交付 1080P 满血成片 · 支持一键导出/运行 ComfyUI JSON",
        icon: "Film",
        accentColor: "#2563eb",
        models: ["ComfyUI Director (RV2V)", "MiniMax-H3 多模态", "InsightFace (inswapper_128)"],
    },
    {
        id: "muse_replicate",
        title: "Muse · 1:1 爆款复刻工作流 (冬虫夏草 · 人物B · 11镜标准分镜链)",
        badge: "Muse 1:1 复刻 · 16.2MB",
        description: "基于 Muse 视觉与原生声画引擎 1:1 复刻原版抖音冲泡教学：62.9 秒 · 11 镜精准刀口 · 多段合成导出 · 交付 16.2MB 满血成片",
        icon: "Video",
        accentColor: "#9333ea",
        models: ["Muse 出片 (vid-muse 11 镜标准分镜)"],
    },
    {
        id: "seedance",
        title: "Seedance 2.5 独立视频工作流",
        badge: "商业高质出片",
        description: "官方直连高速通道，擅长极致动态微距、光影质感与丝滑流畅的电商产品视觉呈现",
        icon: "Sparkles",
        accentColor: "#f97316",
        models: ["Seedance 2.5 (vid-seedance-25-bd)"],
    },
    {
        id: "muse",
        title: "Muse 原生带声独立工作流 (冬虫夏草 · 30秒 3 镜标准分镜链)",
        badge: "原生发声 · 选段合成",
        description: "专为 Muse 10 秒原生发声定制：3 镜精准秒级台词 · 痛点抓人/核心干货/吃法促单 · 专属合成预览与一键导出 30s 商业成片",
        icon: "Video",
        accentColor: "#ec4899",
        models: ["Muse 出片 (vid-muse 10s 原生发声)"],
    },
];

// 1:1 复刻全套资产路径（通过 /api/media/ 静态分发）
const REPLICATE_ORIG_VIDEO = "/api/media/out%2Freplicate_douyin_b/orig_douyin_master.mp4";
const REPLICATE_PERSON_IMG = "/api/media/out%2Freplicate_douyin_b%2Fref/person_torso.jpg";
const REPLICATE_FINAL_VIDEO = "/api/media/out%2Freplicate_douyin_b%2Fdeliver/%E5%86%AC%E8%99%AB%E5%A4%8F%E8%8D%89_1to1%E5%A4%8D%E5%88%BB_%E4%BA%BA%E7%89%A9B_H3%E5%8E%9F%E7%94%9F%E5%8F%91%E5%A3%B0.mp4";
const REPLICATE_MUSE_FINAL_VIDEO = "/api/media/out%2Freplicate_douyin_b%2Fdeliver/%E5%86%AC%E8%99%AB%E5%A4%8F%E8%8D%89_1to1%E5%A4%8D%E5%88%BB_%E4%BA%BA%E7%89%A9B_Muse%E5%8E%9F%E7%94%9F%E5%8F%91%E5%A3%B0.mp4";

// 鲜草是活的吗 1:1 H3 专属复刻资产（用户指定图一人物 100% 替换 + 图二产品实物锁定）
const ALIVE_H3_ORIG_VIDEO = "/api/media/out%2Freplicate_alive_cordyceps%2Forig/orig_master.mp4";
const ALIVE_H3_PERSON_IMG = "/api/media/out%2Freplicate_alive_cordyceps%2Fref/user_specified_person.jpg";
const ALIVE_H3_PRODUCT_IMG = "/api/media/out%2Freplicate_alive_cordyceps%2Fref/user_specified_product.jpg";
const ALIVE_H3_NEW_BG_IMG = "/api/media/out%2Freplicate_alive_cordyceps%2Fref/new_apothecary_background.webp";
const ALIVE_H3_AUDIO_TRACK = "/api/media/out%2Freplicate_alive_cordyceps%2F_perfect_h3/master_voice_person_b_58s.wav";
const ALIVE_H3_FINAL_VIDEO = "/api/media/out%2Freplicate_alive_cordyceps%2Fdeliver/%E5%86%AC%E8%99%AB%E5%A4%8F%E8%8D%89_%E9%B2%9C%E8%8D%89%E6%98%AF%E6%B4%BB%E7%9A%84%E5%90%97_1to1%E5%A4%8D%E5%88%BB_%E5%85%A8%E4%BA%BA%E7%89%A9%E6%A8%A1%E5%9E%8B%E7%BA%A7%E6%B7%B1%E5%BA%A6%E6%9B%BF%E6%8D%A2_H3%E5%8E%9F%E7%94%9F%E5%A4%A7%E7%89%87.mp4";
const ALIVE_H3_CLEAN_VIDEO = "/api/media/out%2Freplicate_alive_cordyceps%2Fdeliver/%E5%86%AC%E8%99%AB%E5%A4%8F%E8%8D%89_%E9%B2%9C%E8%8D%89%E6%98%AF%E6%B4%BB%E7%9A%84%E5%90%97_1to1%E5%A4%8D%E5%88%BB_%E8%80%81%E5%AD%97%E5%8F%B7%E5%B1%95%E5%8E%85%E5%8E%9F%E7%94%9F%E5%A4%A7%E7%89%87_%E7%BA%AF%E5%87%80%E7%89%88.mp4";
const ALIVE_H3_OFFICIAL_RECAST_VIDEO = "/api/media/out%2Freplicate_alive_cordyceps%2Fdeliver/%E5%86%AC%E8%99%AB%E5%A4%8F%E8%8D%89_%E9%B2%9C%E8%8D%89%E6%98%AF%E6%B4%BB%E7%9A%84%E5%90%97_ComfyUI%E5%AE%98%E6%96%B94%E5%B1%82%E8%AF%AD%E6%B3%95%E5%AE%9E%E6%B5%8B_%E4%BA%BA%E7%89%A9%E6%9B%BF%E6%8D%A2%E7%9B%B4%E5%87%BA%E7%94%9F%E7%89%87_H3%E5%8E%9F%E7%94%9F.mp4";
const ALIVE_H3_SIDE_BY_SIDE_IMG = "/api/media/out%2Freplicate_alive_cordyceps%2Fdeliver/%E4%B8%89%E8%81%94%E5%AF%B9%E6%AF%94_%E5%8E%9F%E7%89%87%E6%8B%89%E5%A7%86vs%E6%8C%87%E5%AE%9A%E5%9B%BE%E4%B8%80%E6%8E%8C%E6%9F%9Cvs%E5%AE%98%E6%96%B9H3%E6%8D%A2%E4%BA%BA%E5%AE%9E%E6%9C%BA%E7%BB%93%E6%9E%9C.jpg";

const ALIVE_H3_8_SHOTS_SCRIPT = `【MiniMax-H3 × ComfyUI 电商人物与产品深度替换施工图】
★ 全片 58.00 秒 · 8 刀硬切 · 人物 100% 锁定为我们的人（<Picture 1> 知性女掌柜）
★ 电商核心实物产品 100% 守恒（<Picture 2> 西藏那曲金黄野生鲜草 + 白瓷漏斗沥水碗）
★ 音频驱动口型与发声（<Audio 1> master_voice_person_b_58s.wav · EBU R128 -16 LUFS）

镜01 [00.00s ~ 05.00s | 5.00s | 35字]:
  运镜：人物B知性女掌柜中近景口播发问
  台词：有人问鲜草是不是活的？放到嘴里它会不会咬我呀？到底是谁告诉你们这些的呀！
  Prompt: Replace person in <Video 1> with the elegant female shopkeeper in <Picture 1>. Replace any generic item with the white ceramic colander bowl of genuine golden fresh cordyceps in <Picture 2>. She delivers the opening comedic hook facing camera with lip-sync strictly driven by <Audio 1>. Commercial studio lighting, 8k uhd.

镜02 [05.00s ~ 11.00s | 6.00s | 39字]:
  运镜：人物B微笑并结合手势展示产品耐心科普
  台词：鲜草可不是活的昆虫哟！刚挖出时水分足活性高，绝对不咬人，只有我们咬它！
  Prompt: The woman in <Picture 1> smiles warmly, gesturing with hands to showcase the golden fresh cordyceps in <Picture 2> towards the camera, explaining cordyceps nature. Macro product fidelity.

镜03 [11.00s ~ 19.00s | 8.00s | 40字]:
  运镜：西藏那曲海拔4000米高原雪山与冻土草甸实景微距
  台词：今天带你们到海拔四千多米的高原现场，看看刚从冻土里挖出来的鲜草长啥样！
  Prompt: Preserve alpine snowmountain background of <Video 1>, extreme macro close-up of authentic fresh golden cordyceps in <Picture 2> emerging from damp alpine frozen soil with fine circular striations.

镜04 [19.00s ~ 28.00s | 9.00s | 39字]:
  运镜：软毛刷在高原清泉水下刷洗鲜草泥土特写
  台词：在雪山脚下吃鲜草没那么多讲究，用软毛刷轻轻把泥刷掉，清泉一冲原汁原味！
  Prompt: Hands gently brushing fresh cordyceps in <Picture 2> with a soft brush under crystal mountain spring water, natural water splashes over the golden caterpillar surface, perfectly matching the physical flow of <Video 1>.

镜05 [28.00s ~ 37.00s | 9.00s | 41字]:
  运镜：人物B手持鲜草尝吃开玩笑幽默互动
  台词：我现在就吃一根给你们看……哎呀它咬我！哈哈开玩笑的，嚼起来像新鲜蘑菇回甘！
  Prompt: The woman in <Picture 1> holds a single golden fresh cordyceps from <Picture 2>, brings it to mouth, makes playful expression pretending to be bitten, laughs heartily and describes the crisp mushroom-like sweet taste.

镜06 [37.00s ~ 46.00s | 9.00s | 40字]:
  运镜：人物B细致指着草头与虫体对比科普
  台词：记住吃虫草一定要从草头到虫身整根吃，草头清凉虫身温润，营养全面吸收！
  Prompt: The woman in <Picture 1> points from dark-brown stroma head to golden caterpillar body with 4 pairs of abdominal legs on <Picture 2>, explaining balanced nutritional value.

镜07 [46.00s ~ 52.00s | 6.00s | 37字]:
  运镜：鲜草超细破壁研磨金黄细粉与冲水微距
  台词：马上就要到一年一度鲜草季了，实在不敢生吃的朋友，打成超细粉冲温水喝！
  Prompt: Fresh cordyceps ground into ultra-fine golden herbal powder, spooned into warm water with gentle swirl, commercial e-commerce 4K macro lens lighting.

镜08 [52.00s ~ 58.00s | 6.00s | 26字]:
  运镜：人物B真诚致意微笑收尾，招手求关注促单
  台词：点个关注，跟着掌柜带你吃上真正西藏那曲源头高品质野生鲜虫草！
  Prompt: The female shopkeeper in <Picture 1> holds the white bowl in <Picture 2>, smiling sincerely and giving friendly follow-and-shop gesture towards camera, professional e-commerce CTA hook.`;

// 新鲜虫草 · 六种吃法 多模型独立复刻产物直链
const FRESH_ORIG_VIDEO = "/api/media/out%2Freplicate_fresh_cordyceps%2Forig/orig_douyin_master.mp4";
const FRESH_H3_33S_VIDEO = "/api/media/out%2Freplicate_fresh_cordyceps%2Fdeliver/%E6%96%B0%E9%B2%9C%E8%99%AB%E8%8D%89_%E5%85%AD%E7%A7%8D%E5%90%83%E6%B3%95_H3%E5%8E%9F%E7%94%9F%E5%8F%91%E5%A3%B0_%E7%9F%A5%E6%80%A7%E5%A5%B3%E6%8E%8C%E6%9F%9C_33s%E5%8D%A1%E7%82%B9%E7%89%88.mp4";
const FRESH_H3_52S_VIDEO = "/api/media/out%2Freplicate_fresh_cordyceps%2Fdeliver/%E6%96%B0%E9%B2%9C%E8%99%AB%E8%8D%89_%E5%85%AD%E7%A7%8D%E5%90%83%E6%B3%95_H3%E5%8E%9F%E7%94%9F%E5%8F%91%E5%A3%B0_%E9%AB%98%E5%8E%9F%E6%8E%8C%E6%9F%9C_52s%E6%B7%B1%E5%BA%A6%E7%89%88.mp4";
const FRESH_MUSE_33S_VIDEO = "/api/media/out%2Freplicate_fresh_cordyceps%2Fdeliver/%E6%96%B0%E9%B2%9C%E8%99%AB%E8%8D%89_%E5%85%AD%E7%A7%8D%E5%90%83%E6%B3%95_Muse%E5%8E%9F%E7%94%9F%E5%8F%91%E5%A3%B0_%E7%9F%A5%E6%80%A7%E5%A5%B3%E6%8E%8C%E6%9F%9C_33s%E5%8D%A1%E7%82%B9%E7%89%88.mp4";
const FRESH_MUSE_52S_VIDEO = "/api/media/out%2Freplicate_fresh_cordyceps%2Fdeliver/%E6%96%B0%E9%B2%9C%E8%99%AB%E8%8D%89_%E5%85%AD%E7%A7%8D%E5%90%83%E6%B3%95_Muse%E5%8E%9F%E7%94%9F%E5%8F%91%E5%A3%B0_%E5%8E%9F%E6%9C%A8%E8%8C%B6%E5%B8%AD_52s%E6%B7%B1%E5%BA%A6%E7%89%88.mp4";
const FRESH_SD_33S_VIDEO = "/api/media/out%2Freplicate_fresh_cordyceps%2Fdeliver/%E6%96%B0%E9%B2%9C%E8%99%AB%E8%8D%89_%E5%85%AD%E7%A7%8D%E5%90%83%E6%B3%95_SD25%E5%8A%A8%E4%BD%9C%E5%A4%8D%E5%88%BB_%E7%9F%A5%E6%80%A7%E5%A5%B3%E6%8E%8C%E6%9F%9C_33s%E5%8D%A1%E7%82%B9%E7%89%88.mp4";
const FRESH_SD_52S_VIDEO = "/api/media/out%2Freplicate_fresh_cordyceps%2Fdeliver/%E6%96%B0%E9%B2%9C%E8%99%AB%E8%8D%89_%E5%85%AD%E7%A7%8D%E5%90%83%E6%B3%95_SD25%E5%8A%A8%E4%BD%9C%E5%A4%8D%E5%88%BB_%E7%8E%B0%E4%BB%A3%E5%8D%9A%E4%B8%BB_52s%E6%B7%B1%E5%BA%A6%E7%89%88.mp4";


// 全新爆款：正宗野生冬虫夏草 · 高原4000米神奇形成记 产物直链
const WILD_ORIG_VIDEO = "/api/media/out%2Freplicate_wild_cordyceps%2Forig/orig_master.mp4";
const WILD_H3_30S_VIDEO = "/api/media/out%2Freplicate_wild_cordyceps%2Fdeliver/%E9%87%8E%E7%94%9F%E5%86%AC%E8%99%AB%E5%A4%8F%E8%8D%89_%E7%A5%9E%E5%A5%87%E5%BD%A2%E6%88%90_H3%E5%8E%9F%E7%94%9F%E5%8F%91%E5%A3%B0_%E7%9F%A5%E6%80%A7%E5%A5%B3%E6%8E%8C%E6%9F%9C_30s%E5%8D%A1%E7%82%B9%E7%89%88.mp4";
const WILD_H3_48S_VIDEO = "/api/media/out%2Freplicate_wild_cordyceps%2Fdeliver/%E9%87%8E%E7%94%9F%E5%86%AC%E8%99%AB%E5%A4%8F%E8%8D%89_%E7%A5%9E%E5%A5%87%E5%BD%A2%E6%88%90_H3%E5%8E%9F%E7%94%9F%E5%8F%91%E5%A3%B0_%E9%AB%98%E5%8E%9F%E5%B0%8F%E5%93%A5_48s%E6%B7%B1%E5%BA%A6%E7%89%88.mp4";
const WILD_MUSE_30S_VIDEO = "/api/media/out%2Freplicate_wild_cordyceps%2Fdeliver/%E9%87%8E%E7%94%9F%E5%86%AC%E8%99%AB%E5%A4%8F%E8%8D%89_%E7%A5%9E%E5%A5%87%E5%BD%A2%E6%88%90_Muse%E5%8E%9F%E7%94%9F%E5%8F%91%E5%A3%B0_%E7%9F%A5%E6%80%A7%E5%A5%B3%E6%8E%8C%E6%9F%9C_30s%E5%8D%A1%E7%82%B9%E7%89%88.mp4";
const WILD_MUSE_48S_VIDEO = "/api/media/out%2Freplicate_wild_cordyceps%2Fdeliver/%E9%87%8E%E7%94%9F%E5%86%AC%E8%99%AB%E5%A4%8F%E8%8D%89_%E7%A5%9E%E5%A5%87%E5%BD%A2%E6%88%90_Muse%E5%8E%9F%E7%94%9F%E5%8F%91%E5%A3%B0_%E9%9B%AA%E5%9F%9F%E9%AB%98%E5%8E%9F_48s%E6%B7%B1%E5%BA%A6%E7%89%88.mp4";

// 7 镜新鲜虫草分镜台本与施工图文本
const FRESH_7_SHOTS_SCRIPT = `【新鲜虫草 · 六种吃法 1:1 独立爆款复刻施工图】
总长：33.68 秒 (卡点版) / 52.20 秒 (深度版) | 分镜数：7 镜 | 帧率：30 fps | 画幅：9:16
原版抖音链接：https://v.douyin.com/ZY0D5Ne0v8w/ (ID: 7638072987895643643)

镜01 [ 0.00s ~  3.60s | 时长 3.60s]:
  运镜：西藏那曲雪山与鲜虫草特写引入，金黄饱满，真菌子座挺拔
  台词：带你解锁新鲜冬虫夏草的六种经典吃法！

镜02 [ 3.60s ~  9.70s | 时长 6.10s]:
  运镜：吃法一·流水轻刷后的鲜虫草，直接送入口中咀嚼，菌香四溢
  台词：第一种，直接生吃，原汁原味，感受大自然的馈赠；

镜03 [ 9.70s ~ 15.10s | 时长 5.40s]:
  运镜：吃法二·透明玻璃盏中，85度温水冲泡，配长白山西洋参和宁夏枸杞，茶汤渐金
  台词：第二种，温水冲泡，搭配西洋参和枸杞，清香回甘；

镜04 [15.10s ~ 21.00s | 时长 5.90s]:
  运镜：吃法三·白瓷炖盅隔水蒸蛋，金黄蛋羹上铺两根鲜虫草，热气升腾嫩滑如布丁
  台词：第三种，鲜草蒸蛋，蛋香与草香交融，嫩滑可口；

镜05 [21.00s ~ 25.00s | 时长 4.00s]:
  运镜：吃法四·紫砂砂锅文火慢煨排骨鲜草汤，汤清澈明亮，肉香草香交融
  台词：第四种，煲排骨汤，慢火细炖，汤鲜味美；

镜06 [25.00s ~ 29.30s | 时长 4.30s]:
  运镜：吃法五·玻璃密封酒坛中纯粮白酒浸润鲜草，草色金黄透亮，醇香弥漫
  台词：第五种，纯粮白酒浸泡，滋补醇厚；

镜07 [29.30s ~ 33.68s | 时长 4.38s]:
  运镜：吃法六·砂锅慢熬小米白米浓稠粥，出锅前撒入切段鲜草，晨起温润养胃
  台词：第六种，文火煲粥，温润养人。六种吃法，滋养全家！`;

// 11 镜真实分镜台本与施工图文本
const REPLICATE_11_SHOTS_SCRIPT = `【冬虫夏草冲泡教学 · 1:1 复刻分镜施工图】
总长：62.87 秒 | 分镜数：11 镜 | 帧率：30 fps | 画幅：9:16

镜01 [ 0.00s ~  3.67s | 生成4s | 目标22字]:
  运镜：黄色标题卡「虫草 怎么冲泡」+ 人物在台面前开口
  台词：虫草到底应该怎么冲泡，今天一条视频，跟你讲明白，首先。

镜02 [ 3.67s ~  9.47s | 生成5s | 目标24字]:
  运镜：水龙头下冲洗，手在流水里翻动虫草
  台词：第一步就是冲洗，虫草表面有很多折皱，这种纹理容易藏灰。

镜03 [ 9.47s ~ 13.57s | 生成4s | 目标19字]:
  运镜：冲完放台面上，口播切近
  台词：所以一定要在流水下面冲洗，不能泡在水盆里。

镜04 [13.57s ~ 17.63s | 生成4s | 目标22字]:
  运镜：电热水壶/温度相关动作
  台词：但冲洗的时候时间千万不能太长，泡久了会把虫草泡发。

镜05 [17.63s ~ 19.43s | 生成4s | 目标8字]:
  运镜：短促插入镜（<2s，快切）
  台词：营养全部流失掉了。

镜06 [19.43s ~ 31.43s | 生成12s | 目标55字]:
  运镜：长口播段（上半）：注入水 / 盖盖 / 静置
  台词：第二步，这是刚刚洗好的虫草，放到杯子里面，加六十到八十度的水。很多人觉得水越烫越容易泡开，其实不对，水温太高反而破坏虫草本身。

镜07 [31.43s ~ 36.87s | 生成5s | 目标31字]:
  运镜：长口播段（下半）：汤色变化 / 口感说明
  台词：六十到八十度的水温是比较合适的，盖上盖子焖十到十五分钟，就可以喝了。

镜08 [36.87s ~ 39.37s | 生成4s | 目标10字]:
  运镜：过渡：黑底圆形抠像卡「泡完的虫草千万别扔掉」
  台词：泡完的虫草千万别扔掉。

镜09 [39.37s ~ 46.97s | 生成7s | 目标39字]:
  运镜：近景：手里捏着泡开的虫草，指着草头与虫体
  台词：嚼着吃，泡水只是释放了一部分风味，大部分的营养还留在虫体里面，整根都吃掉，一点都不浪费。

镜10 [46.97s ~ 60.60s | 生成13s | 目标64字]:
  运镜：长口播段 13.63s：整根吃 / 别揪草头 / 别反复回冲
  台词：记住草头和虫体要一起吃。有人只吃虫体不吃草头，觉得草头没有什么用处。其实虫体偏温、草头偏凉，两者搭配才能平衡，分开吃要么会上火要么效果就打折。

镜11 [60.60s ~ 62.87s | 生成4s | 目标10字]:
  运镜：收尾：放下杯子 / 看向镜头
  台词：你泡虫草的方式对了吗？`;

const DEFAULT_IMAGE_URL = "/refs/cordyceps_shopkeeper_9x16.jpg";
const DEFAULT_SEEDANCE_VIDEO = "/item1_origin_presenter_master.mp4";
const DEFAULT_MUSE_VIDEO = "/muse_whitebowl_19s.mp4";

// Muse 专属 10 秒 3 镜标准分镜与合成资产
const MUSE_SEG1_VIDEO = "/api/media/out%2F%E5%8F%A3%E6%92%AD%E4%B8%89%E6%AE%B5/seg1.mp4";
const MUSE_SEG2_VIDEO = "/api/media/out%2F%E5%8F%A3%E6%92%AD%E4%B8%89%E6%AE%B5/seg2.mp4";
const MUSE_SEG3_VIDEO = "/api/media/out%2F%E5%8F%A3%E6%92%AD%E4%B8%89%E6%AE%B5/seg3.mp4";
const MUSE_FINAL30_VIDEO = "/api/media/out%2F%E5%8F%A3%E6%92%AD%E4%B8%89%E6%AE%B5/final30.mp4";

/**
 * 构造生成工作流预设节点与连线
 */
export function createWorkflowPreset(
    presetId: WorkflowPresetId = "h3",
    offset: { x: number; y: number } = { x: 0, y: 0 },
): { nodes: CanvasNodeData[]; connections: CanvasConnection[] } {
    const ts = Date.now().toString(36);
    const rand = () => Math.random().toString(36).slice(2, 6);
    const nid = (type: string) => `node-${type}-${ts}-${rand()}`;
    const cid = () => `conn-${ts}-${rand()}`;

    // ---------------- 0.0 全新爆款：鲜草是活的吗？会咬人吗？ (8镜秒级解耦双轨复刻) ----------------
    if (presetId === "alive_replicate") {
        const origVideoId = nid("video");
        const decomposerId = nid("text");

        // 8 镜台词与画面节点 ID
        const ash01ScriptId = nid("text"); const ash01VisualId = nid("text");
        const ash02ScriptId = nid("text"); const ash02VisualId = nid("text");
        const ash03ScriptId = nid("text"); const ash03VisualId = nid("text");
        const ash04ScriptId = nid("text"); const ash04VisualId = nid("text");
        const ash05ScriptId = nid("text"); const ash05VisualId = nid("text");
        const ash06ScriptId = nid("text"); const ash06VisualId = nid("text");
        const ash07ScriptId = nid("text"); const ash07VisualId = nid("text");
        const ash08ScriptId = nid("text"); const ash08VisualId = nid("text");

        // H3 专属支线（多模态：人物+音频+提示词）
        const h3PersonRefId = nid("image");
        const h3EngineId = nid("config");
        const delivH3_30Id = nid("video");
        const delivH3_58Id = nid("video");

        // Muse 专属支线（纯文字：Text-to-Video 纯 Prompt，无图无视）
        const musePromptHubId = nid("text");
        const museEngineId = nid("config");
        const museSyncId = nid("text");
        const delivMuse_30Id = nid("video");
        const delivMuse_58Id = nid("video");

        // 发布中枢
        const publishHubId = nid("config");

        const nodes: CanvasNodeData[] = [
            // ── 第 1 栏：爆款源视频 (X = offset.x - 1100) ──
            {
                id: origVideoId,
                type: CanvasNodeType.Video,
                title: "🎬 抖音爆款《鲜草是活的吗？会咬人吗？》(58.00s)",
                position: { x: offset.x - 1100, y: offset.y - 100 },
                width: 320,
                height: 250,
                metadata: {
                    content: "/api/media/out%2Freplicate_alive_cordyceps%2Forig/orig_master.mp4",
                    status: "success",
                    naturalWidth: 1080,
                    naturalHeight: 1920,
                    posterUrl: "/api/media/out%2Freplicate_alive_cordyceps%2Forig/orig_master.jpg",
                },
            },
            {
                id: decomposerId,
                type: CanvasNodeType.Text,
                title: "🔬 秒级深度解耦拆解中枢 (8 镜时序)",
                position: { x: offset.x - 1100, y: offset.y + 200 },
                width: 320,
                height: 380,
                metadata: {
                    content: `【秒级解耦核心判据】
原片时长: 58.00s · 1080x1920 @ 24fps
音画完全解耦为独立通道:
• 8 镜台词音频切片 (含 Xiaoyi 藏族姑娘 / Xiaoxiao 女掌柜)
• 8 镜独立画面视觉 Prompt

[分镜时序账本]:
镜01 [0.0~5.0s] 黄金钩子·趣味发问
镜02 [5.0~11.0s] 破除误区·实物科普
镜03 [11.0~19.0s] 原产探访·4500m雪山
镜04 [19.0~28.0s] 现场清洗·道地质朴
镜05 [28.0~37.0s] 现场生吃·幽默整蛊
镜06 [37.0~46.0s] 吃法讲究·草虫同吃
镜07 [46.0~52.0s] 替代吃法·研磨冲服
镜08 [52.0~58.0s] 真诚背书·关注转化`,
                    status: "success",
                },
            },

            // ── 第 2 栏：8 镜台词音频切片 (X = offset.x - 700) ──
            {
                id: ash01ScriptId,
                type: CanvasNodeType.Text,
                title: "🎙️ 镜01 音频切片 (0.0~5.0s)",
                position: { x: offset.x - 700, y: offset.y - 300 },
                width: 280,
                height: 140,
                metadata: {
                    content: "【台词音频 5.0s】有人问鲜草是不是活的？放到嘴里它会不会咬我呀？到底是谁告诉你们这些的呀！\n• 对应切片: ash01_voice_a.mp3",
                    status: "success",
                },
            },
            {
                id: ash02ScriptId,
                type: CanvasNodeType.Text,
                title: "🎙️ 镜02 音频切片 (5.0~11.0s)",
                position: { x: offset.x - 700, y: offset.y - 140 },
                width: 280,
                height: 140,
                metadata: {
                    content: "【台词音频 6.0s】鲜草可不是活的昆虫哟！它只是刚挖出来的时候水分足、活性高，绝对不会咬人，只有我们咬它！\n• 对应切片: ash02_voice_a.mp3",
                    status: "success",
                },
            },
            {
                id: ash03ScriptId,
                type: CanvasNodeType.Text,
                title: "🎙️ 镜03 音频切片 (11.0~19.0s)",
                position: { x: offset.x - 700, y: offset.y + 20 },
                width: 280,
                height: 140,
                metadata: {
                    content: "【台词音频 8.0s】今天带你们到海拔四千多米的高原现场，看看刚从冻土里挖出来的新鲜冬虫夏草到底长什么样！\n• 对应切片: ash03_voice_a.mp3",
                    status: "success",
                },
            },
            {
                id: ash04ScriptId,
                type: CanvasNodeType.Text,
                title: "🎙️ 镜04 音频切片 (19.0~28.0s)",
                position: { x: offset.x - 700, y: offset.y + 180 },
                width: 280,
                height: 140,
                metadata: {
                    content: "【台词音频 9.0s】在雪山脚下吃鲜草没那么多讲究，用软毛刷轻轻把泥土刷掉，清泉水一冲，干干净净，原汁原味！\n• 对应切片: ash04_voice_a.mp3",
                    status: "success",
                },
            },
            {
                id: ash05ScriptId,
                type: CanvasNodeType.Text,
                title: "🎙️ 镜05 音频切片 (28.0~37.0s)",
                position: { x: offset.x - 700, y: offset.y + 340 },
                width: 280,
                height: 140,
                metadata: {
                    content: "【台词音频 9.0s】我现在就吃一根给你们看……哎呀它咬我！哈哈开玩笑的，嚼起来像新鲜蘑菇，满口菌香回甘！\n• 对应切片: ash05_voice_a.mp3",
                    status: "success",
                },
            },
            {
                id: ash06ScriptId,
                type: CanvasNodeType.Text,
                title: "🎙️ 镜06 音频切片 (37.0~46.0s)",
                position: { x: offset.x - 700, y: offset.y + 500 },
                width: 280,
                height: 140,
                metadata: {
                    content: "【台词音频 9.0s】记住吃虫草一定要从草头到虫身整根吃，草头清凉，虫身温润，两者搭配营养才能全部吸收！\n• 对应切片: ash06_voice_a.mp3",
                    status: "success",
                },
            },
            {
                id: ash07ScriptId,
                type: CanvasNodeType.Text,
                title: "🎙️ 镜07 音频切片 (46.0~52.0s)",
                position: { x: offset.x - 700, y: offset.y + 660 },
                width: 280,
                height: 140,
                metadata: {
                    content: "【台词音频 6.0s】马上就要到一年一度的鲜草季了，实在不敢生吃的朋友，打成超细粉泡温水喝，吸收更直接！\n• 对应切片: ash07_voice_a.mp3",
                    status: "success",
                },
            },
            {
                id: ash08ScriptId,
                type: CanvasNodeType.Text,
                title: "🎙️ 镜08 音频切片 (52.0~58.0s)",
                position: { x: offset.x - 700, y: offset.y + 820 },
                width: 280,
                height: 140,
                metadata: {
                    content: "【台词音频 6.0s】点个关注，跟着拉姆带你吃上真正西藏那曲源头高品质野生鲜虫草！\n• 对应切片: ash08_voice_a.mp3",
                    status: "success",
                },
            },

            // ── 第 3 栏：8 镜画面视觉 Prompt (X = offset.x - 380) ──
            {
                id: ash01VisualId,
                type: CanvasNodeType.Text,
                title: "🖼️ 镜01 画面 Prompt",
                position: { x: offset.x - 380, y: offset.y - 300 },
                width: 300,
                height: 140,
                metadata: {
                    content: "Medium close-up portrait of lovely Tibetan girl with healthy alpine flush cheeks and colorful braided hair. Holding small transparent glass vial containing fresh golden cordyceps, authentic indoor tapestry background.",
                    status: "success",
                },
            },
            {
                id: ash02VisualId,
                type: CanvasNodeType.Text,
                title: "🖼️ 镜02 画面 Prompt",
                position: { x: offset.x - 380, y: offset.y - 140 },
                width: 300,
                height: 140,
                metadata: {
                    content: "Extreme macro close-up of single plump fresh wild cordyceps held gently between two fingers. Distinct ring patterns on golden-brown worm body, four clear pairs of abdominal legs, studio lighting 4k.",
                    status: "success",
                },
            },
            {
                id: ash03VisualId,
                type: CanvasNodeType.Text,
                title: "🖼️ 镜03 画面 Prompt",
                position: { x: offset.x - 380, y: offset.y + 20 },
                width: 300,
                height: 140,
                metadata: {
                    content: "Wide angle scenic drone view sweeping over vast Nagqu alpine meadow on Tibetan Plateau, snow-clad mountain peaks in background under azure sky, golden sunlight, documentary 4k.",
                    status: "success",
                },
            },
            {
                id: ash04VisualId,
                type: CanvasNodeType.Text,
                title: "🖼️ 镜04 画面 Prompt",
                position: { x: offset.x - 380, y: offset.y + 180 },
                width: 300,
                height: 140,
                metadata: {
                    content: "Close-up of hands gently brushing damp peat soil off freshly harvested cordyceps using soft bamboo brush, rinsing in clear splashing mountain stream water, vibrant golden worm body, macro 4k.",
                    status: "success",
                },
            },
            {
                id: ash05VisualId,
                type: CanvasNodeType.Text,
                title: "🖼️ 镜05 画面 Prompt",
                position: { x: offset.x - 380, y: offset.y + 340 },
                width: 300,
                height: 140,
                metadata: {
                    content: "Medium cinematic portrait of expressive Tibetan girl wearing straw sunhat against snow mountain backdrop, taking a bite of fresh cordyceps, comical surprised face as prank, then laughing warmly.",
                    status: "success",
                },
            },
            {
                id: ash06VisualId,
                type: CanvasNodeType.Text,
                title: "🖼️ 镜06 画面 Prompt",
                position: { x: offset.x - 380, y: offset.y + 500 },
                width: 300,
                height: 140,
                metadata: {
                    content: "Scientific macro documentary tracking shot of authentic wild Tibetan cordyceps, smooth camera glide from dark grass tip down through golden segmented worm body, elegant textures.",
                    status: "success",
                },
            },
            {
                id: ash07VisualId,
                type: CanvasNodeType.Text,
                title: "🖼️ 镜07 画面 Prompt",
                position: { x: offset.x - 380, y: offset.y + 660 },
                width: 300,
                height: 140,
                metadata: {
                    content: "Cinematic close-up of modern electric herb grinder opening to reveal fluffy golden cordyceps powder, soft particles floating in atmospheric golden beam of light, clean aesthetic 4k.",
                    status: "success",
                },
            },
            {
                id: ash08VisualId,
                type: CanvasNodeType.Text,
                title: "🖼️ 镜08 画面 Prompt",
                position: { x: offset.x - 380, y: offset.y + 820 },
                width: 300,
                height: 140,
                metadata: {
                    content: "Portrait medium shot of smiling Tibetan girl host looking directly into lens with friendly inviting eye contact and welcoming hand gesture, golden hour sunlight framing silhouette, snow mountains.",
                    status: "success",
                },
            },

            // ── 第 4 栏上部：H3 多模态音图复刻支线 (X = offset.x + 20) ──
            {
                id: h3PersonRefId,
                type: CanvasNodeType.Image,
                title: "👤 H3 角色参考 (藏族拉姆 & 知性掌柜)",
                position: { x: offset.x + 20, y: offset.y - 300 },
                width: 280,
                height: 240,
                metadata: {
                    content: "/api/media/out%2Freplicate_alive_cordyceps%2Fdeliver/%E5%86%AC%E8%99%AB%E5%A4%8F%E8%8D%89_%E9%B2%9C%E8%8D%89%E6%98%AF%E6%B4%BB%E7%9A%84%E5%90%97_H3%E5%8E%9F%E7%94%9F%E5%8F%91%E5%A3%B0_%E8%97%8F%E6%97%8F%E5%A7%91%E5%A8%98%E6%8B%89%E5%A7%86_30s%E5%8D%A1%E7%82%B9%E7%89%88.jpg",
                    status: "success",
                },
            },
            {
                id: h3EngineId,
                type: CanvasNodeType.Config,
                title: "⚡ MiniMax-H3 多模态音图调度器",
                position: { x: offset.x + 20, y: offset.y - 30 },
                width: 280,
                height: 180,
                metadata: {
                    content: `MiniMax-H3 音图联合生成配置:
• 输入: 角色参考图 + 8镜单句音频 + 提示词
• 角色姿态锁定: 纯朴藏族拉姆 / 知性女掌柜
• 唇形发音对齐: 动态自适应唇形驱动
• 输出双版本: 30s卡点版 + 58s深度版`,
                    status: "success",
                },
            },
            {
                id: delivH3_30Id,
                type: CanvasNodeType.Video,
                title: "🎬 [成片1] H3 原生发声·藏族拉姆 (30s卡点版)",
                position: { x: offset.x + 350, y: offset.y - 320 },
                width: 320,
                height: 240,
                metadata: {
                    content: "/api/media/out%2Freplicate_alive_cordyceps%2Fdeliver/%E5%86%AC%E8%99%AB%E5%A4%8F%E8%8D%89_%E9%B2%9C%E8%8D%89%E6%98%AF%E6%B4%BB%E7%9A%84%E5%90%97_H3%E5%8E%9F%E7%94%9F%E5%8F%91%E5%A3%B0_%E8%97%8F%E6%97%8F%E5%A7%91%E5%A8%98%E6%8B%89%E5%A7%86_30s%E5%8D%A1%E7%82%B9%E7%89%88.mp4",
                    posterUrl: "/api/media/out%2Freplicate_alive_cordyceps%2Fdeliver/%E5%86%AC%E8%99%AB%E5%A4%8F%E8%8D%89_%E9%B2%9C%E8%8D%89%E6%98%AF%E6%B4%BB%E7%9A%84%E5%90%97_H3%E5%8E%9F%E7%94%9F%E5%8F%91%E5%A3%B0_%E8%97%8F%E6%97%8F%E5%A7%91%E5%A8%98%E6%8B%89%E5%A7%86_30s%E5%8D%A1%E7%82%B9%E7%89%88.jpg",
                    status: "success",
                },
            },
            {
                id: delivH3_58Id,
                type: CanvasNodeType.Video,
                title: "🎬 [成片2] H3 原生发声·知性女掌柜 (58s深度版)",
                position: { x: offset.x + 350, y: offset.y - 50 },
                width: 320,
                height: 240,
                metadata: {
                    content: "/api/media/out%2Freplicate_alive_cordyceps%2Fdeliver/%E5%86%AC%E8%99%AB%E5%A4%8F%E8%8D%89_%E9%B2%9C%E8%8D%89%E6%98%AF%E6%B4%BB%E7%9A%84%E5%90%97_H3%E5%8E%9F%E7%94%9F%E5%8F%91%E5%A3%B0_%E7%9F%A5%E6%80%A7%E5%A5%B3%E6%8E%8C%E6%9F%9C_58s%E6%B7%B1%E5%BA%A6%E7%89%88.mp4",
                    posterUrl: "/api/media/out%2Freplicate_alive_cordyceps%2Fdeliver/%E5%86%AC%E8%99%AB%E5%A4%8F%E8%8D%89_%E9%B2%9C%E8%8D%89%E6%98%AF%E6%B4%BB%E7%9A%84%E5%90%97_H3%E5%8E%9F%E7%94%9F%E5%8F%91%E5%A3%B0_%E7%9F%A5%E6%80%A7%E5%A5%B3%E6%8E%8C%E6%9F%9C_58s%E6%B7%B1%E5%BA%A6%E7%89%88.jpg",
                    status: "success",
                },
            },

            // ── 第 4 栏下部：Muse 纯文字驱动生视频支线 (X = offset.x + 20) ──
            {
                id: musePromptHubId,
                type: CanvasNodeType.Text,
                title: "📝 Muse 纯文字生视频转录器",
                position: { x: offset.x + 20, y: offset.y + 220 },
                width: 280,
                height: 180,
                metadata: {
                    content: `【Muse 纯文字驱动规范】
• 针对 Muse 不支持传图传视频的硬限制
• 画面视觉解耦为 4K 电影感 Text-to-Video Prompts
• 纯文字驱动出片，不依赖任何首帧入参
• 后期与母带音频、字幕音画对齐剪辑`,
                    status: "success",
                },
            },
            {
                id: museEngineId,
                type: CanvasNodeType.Config,
                title: "⚡ Muse 官方纯文字出片引擎",
                position: { x: offset.x + 20, y: offset.y + 430 },
                width: 280,
                height: 150,
                metadata: {
                    content: `Muse 原生生成通道:
• 驱动方式: Pure Text-to-Video
• 编码: H.264 · 24fps
• 画面风格: 4K 纪实摄影级微距
• 渲染节点: 美区代理自动轮转`,
                    status: "success",
                },
            },
            {
                id: museSyncId,
                type: CanvasNodeType.Text,
                title: "✂️ 音画对齐剪辑器 (母带+字幕)",
                position: { x: offset.x + 20, y: offset.y + 610 },
                width: 280,
                height: 160,
                metadata: {
                    content: `剪辑与合流规范:
• 音频: EBU R128 标准母带 (-16 LUFS)
• 字幕: PIL 纯白黑描边电影级字幕
• 刀口对齐: 毫秒级分镜精准卡点`,
                    status: "success",
                },
            },
            {
                id: delivMuse_30Id,
                type: CanvasNodeType.Video,
                title: "🎬 [成片3] Muse 原生发声·藏族拉姆 (30s卡点版)",
                position: { x: offset.x + 350, y: offset.y + 240 },
                width: 320,
                height: 240,
                metadata: {
                    content: "/api/media/out%2Freplicate_alive_cordyceps%2Fdeliver/%E5%86%AC%E8%99%AB%E5%A4%8F%E8%8D%89_%E9%B2%9C%E8%8D%89%E6%98%AF%E6%B4%BB%E7%9A%84%E5%90%97_Muse%E5%8E%9F%E7%94%9F%E5%8F%91%E5%A3%B0_%E8%97%8F%E6%97%8F%E5%A7%91%E5%A8%98%E6%8B%89%E5%A7%86_30s%E5%8D%A1%E7%82%B9%E7%89%88.mp4",
                    posterUrl: "/api/media/out%2Freplicate_alive_cordyceps%2Fdeliver/%E5%86%AC%E8%99%AB%E5%A4%8F%E8%8D%89_%E9%B2%9C%E8%8D%89%E6%98%AF%E6%B4%BB%E7%9A%84%E5%90%97_Muse%E5%8E%9F%E7%94%9F%E5%8F%91%E5%A3%B0_%E8%97%8F%E6%97%8F%E5%A7%91%E5%A8%98%E6%8B%89%E5%A7%86_30s%E5%8D%A1%E7%82%B9%E7%89%88.jpg",
                    status: "success",
                },
            },
            {
                id: delivMuse_58Id,
                type: CanvasNodeType.Video,
                title: "🎬 [成片4] Muse 原生发声·雪域草甸 (58s深度版)",
                position: { x: offset.x + 350, y: offset.y + 510 },
                width: 320,
                height: 240,
                metadata: {
                    content: "/api/media/out%2Freplicate_alive_cordyceps%2Fdeliver/%E5%86%AC%E8%99%AB%E5%A4%8F%E8%8D%89_%E9%B2%9C%E8%8D%89%E6%98%AF%E6%B4%BB%E7%9A%84%E5%90%97_Muse%E5%8E%9F%E7%94%9F%E5%8F%91%E5%A3%B0_%E9%9B%AA%E5%9F%9F%E8%8D%89%E7%94%B8_58s%E6%B7%B1%E5%BA%A6%E7%89%88.mp4",
                    posterUrl: "/api/media/out%2Freplicate_alive_cordyceps%2Fdeliver/%E5%86%AC%E8%99%AB%E5%A4%8F%E8%8D%89_%E9%B2%9C%E8%8D%89%E6%98%AF%E6%B4%BB%E7%9A%84%E5%90%97_Muse%E5%8E%9F%E7%94%9F%E5%8F%91%E5%A3%B0_%E9%9B%AA%E5%9F%9F%E8%8D%89%E7%94%B8_58s%E6%B7%B1%E5%BA%A6%E7%89%88.jpg",
                    status: "success",
                },
            },

            // ── 第 5 栏：全渠道一键发布中枢 (X = offset.x + 750) ──
            {
                id: publishHubId,
                type: CanvasNodeType.Config,
                title: "🚀 全渠道一键发布中枢 (抖音 · 视频号 · 快手)",
                position: { x: offset.x + 750, y: offset.y + 100 },
                width: 300,
                height: 380,
                metadata: {
                    content: `【多平台一键发布控制台】
支持平台:
✓ 抖音 (Douyin Web / Cookie 扫码直发)
✓ 微信视频号 (Sph 自动打标)
✓ 快手 (Kwai 一键排期)

[自动化发布参数]:
• 标题: 鲜草是活的吗？会咬人吗？
• 话题: #冬虫夏草 #新鲜虫草 #藏族姑娘 #那曲拉姆
• 挂车: 梦境西藏那曲高品质鲜虫草
• 策略: 4条矩阵号错峰排期 (早/中/晚)`,
                    status: "success",
                },
            },
        ];

        const connections: CanvasConnection[] = [
            // 原片 -> 拆解中枢
            { id: cid(), from: origVideoId, to: decomposerId },

            // 拆解中枢 -> 8 镜台词音频
            { id: cid(), from: decomposerId, to: ash01ScriptId },
            { id: cid(), from: decomposerId, to: ash02ScriptId },
            { id: cid(), from: decomposerId, to: ash03ScriptId },
            { id: cid(), from: decomposerId, to: ash04ScriptId },
            { id: cid(), from: decomposerId, to: ash05ScriptId },
            { id: cid(), from: decomposerId, to: ash06ScriptId },
            { id: cid(), from: decomposerId, to: ash07ScriptId },
            { id: cid(), from: decomposerId, to: ash08ScriptId },

            // 拆解中枢 -> 8 镜画面 Prompt
            { id: cid(), from: decomposerId, to: ash01VisualId },
            { id: cid(), from: decomposerId, to: ash02VisualId },
            { id: cid(), from: decomposerId, to: ash03VisualId },
            { id: cid(), from: decomposerId, to: ash04VisualId },
            { id: cid(), from: decomposerId, to: ash05VisualId },
            { id: cid(), from: decomposerId, to: ash06VisualId },
            { id: cid(), from: decomposerId, to: ash07VisualId },
            { id: cid(), from: decomposerId, to: ash08VisualId },

            // H3 支线接线
            { id: cid(), from: h3PersonRefId, to: h3EngineId },
            { id: cid(), from: ash01ScriptId, to: h3EngineId },
            { id: cid(), from: ash01VisualId, to: h3EngineId },
            { id: cid(), from: h3EngineId, to: delivH3_30Id },
            { id: cid(), from: h3EngineId, to: delivH3_58Id },

            // Muse 支线接线
            { id: cid(), from: ash01VisualId, to: musePromptHubId },
            { id: cid(), from: musePromptHubId, to: museEngineId },
            { id: cid(), from: museEngineId, to: museSyncId },
            { id: cid(), from: ash01ScriptId, to: museSyncId },
            { id: cid(), from: museSyncId, to: delivMuse_30Id },
            { id: cid(), from: museSyncId, to: delivMuse_58Id },

            // 成片 -> 发布中枢
            { id: cid(), from: delivH3_30Id, to: publishHubId },
            { id: cid(), from: delivH3_58Id, to: publishHubId },
            { id: cid(), from: delivMuse_30Id, to: publishHubId },
            { id: cid(), from: delivMuse_58Id, to: publishHubId },
        ];

        return { nodes, connections };
    }

    // ---------------- 0. 全新爆款：正宗野生冬虫夏草 · 高原4000米神奇形成记 ----------------
    if (presetId === "wild_replicate") {
        const origVideoId = nid("video");
        const decomposerId = nid("text");

        // 7 镜台词与画面节点 ID
        const wsh01ScriptId = nid("text"); const wsh01VisualId = nid("text");
        const wsh02ScriptId = nid("text"); const wsh02VisualId = nid("text");
        const wsh03ScriptId = nid("text"); const wsh03VisualId = nid("text");
        const wsh04ScriptId = nid("text"); const wsh04VisualId = nid("text");
        const wsh05ScriptId = nid("text"); const wsh05VisualId = nid("text");
        const wsh06ScriptId = nid("text"); const wsh06VisualId = nid("text");
        const wsh07ScriptId = nid("text"); const wsh07VisualId = nid("text");

        // H3 专属支线（多模态：人物+音频+提示词）
        const h3PersonRefId = nid("image");
        const h3EngineId = nid("config");
        const delivH3_30Id = nid("video");
        const delivH3_48Id = nid("video");

        // Muse 专属支线（纯文字：Text-to-Video 纯 Prompt，无图无视）
        const musePromptHubId = nid("text");
        const museEngineId = nid("config");
        const museSyncId = nid("text");
        const delivMuse_30Id = nid("video");
        const delivMuse_48Id = nid("video");

        // 发布中枢
        const publishHubId = nid("config");

        const nodes: CanvasNodeData[] = [
            // ── 第 1 栏：爆款源视频 (X = offset.x - 1100) ──
            {
                id: origVideoId,
                type: CanvasNodeType.Video,
                title: "🎬 抖音爆款《正宗野生虫草·来源高原海拔4000多米》(29.97s)",
                position: { x: offset.x - 1100, y: offset.y - 100 },
                width: 320,
                height: 250,
                metadata: {
                    content: WILD_ORIG_VIDEO,
                    status: "success",
                    naturalWidth: 576,
                    naturalHeight: 1024,
                    durationMs: 29970,
                },
            },

            // ── 第 2 栏：秒级音画解耦拆解中枢 (X = offset.x - 720) ──
            {
                id: decomposerId,
                type: CanvasNodeType.Text,
                title: "🔬 秒级音画深度解耦中枢 (精确到0.01秒 · 画面与台词双向拆开)",
                position: { x: offset.x - 720, y: offset.y - 380 },
                width: 340,
                height: 800,
                metadata: {
                    content: "【野生冬虫夏草形成记 · 秒级音画解耦拆解中枢】\n" +
                             "• 样本原片：https://v.douyin.com/g09aREc5b9g/ (29.97s)\n" +
                             "• 核心解耦：彻底将【台词音频切片】与【画面视觉Prompt】独立拆开\n\n" +
                             "• 双轨模型特性匹配：\n" +
                             "  1. H3 专属产线：支持人物参考图+分镜音频+提示词联合提交，执行多模态音画复刻\n" +
                             "  2. Muse 专属产线：不支持图片和视频，纯文字 Prompt 驱动 Text-to-Video 生成，再音画对齐剪辑！",
                    status: "success",
                    fontSize: 12,
                },
            },

            // ── 第 3 栏：7 镜台词与音频切片 (X = offset.x - 340) ──
            {
                id: wsh01ScriptId,
                type: CanvasNodeType.Text,
                title: "🎙️ 镜01 · 台词音频 [0.0s~3.5s / 3.5s]",
                position: { x: offset.x - 340, y: offset.y - 380 },
                width: 300,
                height: 100,
                metadata: { content: "「在青藏高原海拔4000米的土壤里，存在一种神秘的真菌孢子；」\n• 音频：wsh01_voice_a.mp3 (3.5s)", status: "success", fontSize: 11 },
            },
            {
                id: wsh02ScriptId,
                type: CanvasNodeType.Text,
                title: "🎙️ 镜02 · 台词音频 [3.5s~7.5s / 4.0s]",
                position: { x: offset.x - 340, y: offset.y - 265 },
                width: 300,
                height: 100,
                metadata: { content: "「它会悄悄寄生于蝙蝠蛾幼虫体内，吸取其天地养分；」\n• 音频：wsh02_voice_a.mp3 (4.0s)", status: "success", fontSize: 11 },
            },
            {
                id: wsh03ScriptId,
                type: CanvasNodeType.Text,
                title: "🎙️ 镜03 · 台词音频 [7.5s~11.5s / 4.0s]",
                position: { x: offset.x - 340, y: offset.y - 150 },
                width: 300,
                height: 100,
                metadata: { content: "「寒冬来临，幼虫休眠并保持僵而不死，这就是“冬虫”；」\n• 音频：wsh03_voice_a.mp3 (4.0s)", status: "success", fontSize: 11 },
            },
            {
                id: wsh04ScriptId,
                type: CanvasNodeType.Text,
                title: "🎙️ 镜04 · 台词音频 [11.5s~16.5s / 5.0s]",
                position: { x: offset.x - 340, y: offset.y - 35 },
                width: 300,
                height: 100,
                metadata: { content: "「等到春天来临，冰雪融化，菌丝开始苏醒生长，破土冒出地面；」\n• 音频：wsh04_voice_a.mp3 (5.0s)", status: "success", fontSize: 11 },
            },
            {
                id: wsh05ScriptId,
                type: CanvasNodeType.Text,
                title: "🎙️ 镜05 · 台词音频 [16.5s~21.5s / 5.0s]",
                position: { x: offset.x - 340, y: offset.y + 80 },
                width: 300,
                height: 100,
                metadata: { content: "「此时幼虫躯壳与真菌草头融为一体，化作冬虫夏草；」\n• 音频：wsh05_voice_a.mp3 (5.0s)", status: "success", fontSize: 11 },
            },
            {
                id: wsh06ScriptId,
                type: CanvasNodeType.Text,
                title: "🎙️ 镜06 · 台词音频 [21.5s~25.5s / 4.0s]",
                position: { x: offset.x - 340, y: offset.y + 195 },
                width: 300,
                height: 100,
                metadata: { content: "「冬天是虫，夏天是草，吸尽雪域灵气，自古便是滋补极品；」\n• 音频：wsh06_voice_a.mp3 (4.0s)", status: "success", fontSize: 11 },
            },
            {
                id: wsh07ScriptId,
                type: CanvasNodeType.Text,
                title: "🎙️ 镜07 · 台词音频 [25.5s~30.0s / 4.5s]",
                position: { x: offset.x - 340, y: offset.y + 310 },
                width: 300,
                height: 100,
                metadata: { content: "「认准西藏海拔4000米正宗野生冬虫夏草，原产地直发！」\n• 音频：wsh07_voice_a.mp3 (4.5s)", status: "success", fontSize: 11 },
            },

            // ── 第 4 栏：7 镜画面与视觉Prompt (X = offset.x - 20) ──
            {
                id: wsh01VisualId,
                type: CanvasNodeType.Text,
                title: "🖼️ 镜01 · 画面Prompt (高原土壤与孢子)",
                position: { x: offset.x - 20, y: offset.y - 380 },
                width: 320,
                height: 100,
                metadata: { content: "【视觉Prompt】西藏高原海拔4000米草甸，晨光穿透黑土，金色孢子微粒漫射纯净光芒，宏大推入超微距", status: "success", fontSize: 11 },
            },
            {
                id: wsh02VisualId,
                type: CanvasNodeType.Text,
                title: "🖼️ 镜02 · 画面Prompt (潜伏寄生微观)",
                position: { x: offset.x - 20, y: offset.y - 265 },
                width: 320,
                height: 100,
                metadata: { content: "【视觉Prompt】植物根系间天然蝙蝠蛾幼虫在泥土中蠕动，轻微菌丝温润附着，生物奇妙共生微观摄影", status: "success", fontSize: 11 },
            },
            {
                id: wsh03VisualId,
                type: CanvasNodeType.Text,
                title: "🖼️ 镜03 · 画面Prompt (冬虫休眠冻土)",
                position: { x: offset.x - 20, y: offset.y - 150 },
                width: 320,
                height: 100,
                metadata: { content: "【视觉Prompt】白雪皑皑的高原冻土剖面，下方泥层中静静蛰伏金黄饱满幼虫，环纹细密坚实，凝结微霜", status: "success", fontSize: 11 },
            },
            {
                id: wsh04VisualId,
                type: CanvasNodeType.Text,
                title: "🖼️ 镜04 · 画面Prompt (春暖草头破土)",
                position: { x: offset.x - 20, y: offset.y - 35 },
                width: 320,
                height: 100,
                metadata: { content: "【视觉Prompt】春日初阳融化积雪，润湿黑土中深褐色细长子座破土而出，草尖雪水露珠折射耀眼晨光", status: "success", fontSize: 11 },
            },
            {
                id: wsh05VisualId,
                type: CanvasNodeType.Text,
                title: "🖼️ 镜05 · 画面Prompt (采挖出土特写)",
                position: { x: offset.x - 20, y: offset.y + 80 },
                width: 320,
                height: 100,
                metadata: { content: "【视觉Prompt】藏族采草人轻柔起开松软黑土，一根饱满金黄挺拔的天然鲜草完整展露，虫草一体泥香清新", status: "success", fontSize: 11 },
            },
            {
                id: wsh06VisualId,
                type: CanvasNodeType.Text,
                title: "🖼️ 镜06 · 画面Prompt (掌柜沥水碗展示)",
                position: { x: offset.x - 20, y: offset.y + 195 },
                width: 320,
                height: 100,
                metadata: { content: "【视觉Prompt】知性女掌柜素雅旗袍，双手端托白瓷漏斗沥水碗，正宗那曲鲜草整齐码放，红木博古架百叶暖光", status: "success", fontSize: 11 },
            },
            {
                id: wsh07VisualId,
                type: CanvasNodeType.Text,
                title: "🖼️ 镜07 · 画面Prompt (掌柜真诚口播背书)",
                position: { x: offset.x - 20, y: offset.y + 310 },
                width: 320,
                height: 100,
                metadata: { content: "【视觉Prompt】知性女掌柜真诚微笑直视镜头口播致意，双手优雅叠放，背景老字号典雅暖光，单反级光学质感", status: "success", fontSize: 11 },
            },

            // ── 第 5 栏 上层：H3 专属多模态复刻产线 (人物+音频+提示词) ──
            {
                id: h3PersonRefId,
                type: CanvasNodeType.Image,
                title: "👤 H3 专属人物素材 · 知性旗袍女掌柜 (4K商业级)",
                position: { x: offset.x + 340, y: offset.y - 380 },
                width: 280,
                height: 150,
                metadata: {
                    content: "/api/media/out%2Freplicate_fresh_cordyceps%2Fdeliver/%E6%96%B0%E9%87%8A%E8%99%AB%E8%8D%89_%E5%85%AD%E7%A7%8D%E5%90%83%E6%B3%95_H3%E5%8E%9F%E7%94%9F%E5%8F%91%E5%A3%B0_%E7%9F%A5%E6%80%A7%E5%A5%B3%E6%8E%8C%E6%9F%9C_33s%E5%8D%A1%E7%82%B9%E7%89%88.jpg",
                    status: "success",
                },
            },
            {
                id: h3EngineId,
                type: CanvasNodeType.Config,
                title: "⚡ MiniMax-H3 多模态音画复刻中枢",
                position: { x: offset.x + 650, y: offset.y - 380 },
                width: 320,
                height: 200,
                metadata: {
                    generationMode: "video",
                    model: "vid-h3::wild-multimodal-replicate",
                    status: "success",
                    prompt: "【H3 核心能力】：\n• 提交【女掌柜人物图 + 7 镜单句音频 + 画面Prompt】\n• 保证女掌柜姿态锁死、唇形同步与雪域微距质感\n• 输出：30s 卡点科普版 + 48s 深度源头版",
                },
            },
            {
                id: delivH3_30Id,
                type: CanvasNodeType.Video,
                title: "🏆 H3 · 30s 卡点科普版 (知性女掌柜 · 2.4MB)",
                position: { x: offset.x + 1000, y: offset.y - 380 },
                width: 280,
                height: 200,
                metadata: { content: WILD_H3_30S_VIDEO, status: "success", naturalWidth: 576, naturalHeight: 1024, durationMs: 29970 },
            },
            {
                id: delivH3_48Id,
                type: CanvasNodeType.Video,
                title: "🏆 H3 · 48s 深度源头版 (高原采草小哥 · 2.3MB)",
                position: { x: offset.x + 1300, y: offset.y - 380 },
                width: 280,
                height: 200,
                metadata: { content: WILD_H3_48S_VIDEO, status: "success", naturalWidth: 576, naturalHeight: 1024, durationMs: 48000 },
            },

            // ── 第 5 栏 下层：Muse 专属纯文字生视频产线 (纯Prompt驱动，无图无视) ──
            {
                id: musePromptHubId,
                type: CanvasNodeType.Text,
                title: "📝 Muse 专属纯文字提示词专配中枢 (Text-to-Video)",
                position: { x: offset.x + 340, y: offset.y + 20 },
                width: 280,
                height: 200,
                metadata: {
                    content: "【Muse 核心规则】：\n• Muse 不支持提交视频和图片输入！\n• 必须把解耦的画面转换为超详尽 4K 电影质感纯文字生视频 Prompt！\n• 包含高原光影、微焦距、材质反光，100% 纯文字驱动生成",
                    status: "success",
                    fontSize: 12,
                },
            },
            {
                id: museEngineId,
                type: CanvasNodeType.Config,
                title: "🎨 Muse 纯文字生视频渲染核 (Text-to-Video)",
                position: { x: offset.x + 650, y: offset.y + 20 },
                width: 320,
                height: 200,
                metadata: {
                    generationMode: "video",
                    model: "vid-muse::wild-text-to-video",
                    status: "success",
                    prompt: "【Muse 纯文字驱动】：\n• 接收 7 镜纯文字生视频 Prompt，调用本地 muse-cli 渲染分镜\n• 无任何图片或视频依附，纯文字直接生出 9:16 商业级镜头",
                },
            },
            {
                id: museSyncId,
                type: CanvasNodeType.Text,
                title: "✂️ Muse 音画对齐剪辑器 (PIL字幕 + 母带音频对齐)",
                position: { x: offset.x + 1000, y: offset.y + 20 },
                width: 280,
                height: 200,
                metadata: {
                    content: "【Muse 后期音画对齐剪辑】：\n• 将 Muse 纯文字生成的独立分镜视频片段，与上游拆解出的 7 镜台词音频切片（voice_a/voice_b）精确定点缝合；\n• 叠加 PIL 纯白黑描边电影级字幕，EBU R128 (-16 LUFS) 响度对齐。",
                    status: "success",
                    fontSize: 12,
                },
            },
            {
                id: delivMuse_30Id,
                type: CanvasNodeType.Video,
                title: "🏆 Muse · 30s 卡点科普版 (知性女掌柜 · 2.4MB)",
                position: { x: offset.x + 1300, y: offset.y - 80 },
                width: 280,
                height: 200,
                metadata: { content: WILD_MUSE_30S_VIDEO, status: "success", naturalWidth: 576, naturalHeight: 1024, durationMs: 29970 },
            },
            {
                id: delivMuse_48Id,
                type: CanvasNodeType.Video,
                title: "🏆 Muse · 48s 深度源头版 (雪域高原草甸 · 2.3MB)",
                position: { x: offset.x + 1300, y: offset.y + 140 },
                width: 280,
                height: 200,
                metadata: { content: WILD_MUSE_48S_VIDEO, status: "success", naturalWidth: 576, naturalHeight: 1024, durationMs: 48000 },
            },

            // ── 第 6 栏：多平台一键发布中枢 ──
            {
                id: publishHubId,
                type: CanvasNodeType.Config,
                title: "🚀 全渠道多平台一键发布中枢 (抖音 · 视频号 · 快手)",
                position: { x: offset.x + 1620, y: offset.y - 120 },
                width: 320,
                height: 420,
                metadata: {
                    status: "success",
                    prompt: "【全渠道一键发布中枢】\n• 平台一：抖音 (Douyin) - 话题 #正宗野生虫草 #来源高原地区 #海拔4000多米的高原地区\n• 平台二：微信视频号 (Channels) - 高清长视频/进店私域挂载\n• 平台三：快手 (Kuaishou) - 高互动同城/滋补类目热榜\n• 状态：H3 与 Muse 双轨成片已全部挂载，支持一键批量推送或草稿同步",
                },
            },
        ];

        const connections: CanvasConnection[] = [
            // 原片到拆解中枢
            { id: cid(), fromNodeId: origVideoId, toNodeId: decomposerId },

            // 拆解中枢连到 7 镜台词音频
            { id: cid(), fromNodeId: decomposerId, toNodeId: wsh01ScriptId },
            { id: cid(), fromNodeId: decomposerId, toNodeId: wsh02ScriptId },
            { id: cid(), fromNodeId: decomposerId, toNodeId: wsh03ScriptId },
            { id: cid(), fromNodeId: decomposerId, toNodeId: wsh04ScriptId },
            { id: cid(), fromNodeId: decomposerId, toNodeId: wsh05ScriptId },
            { id: cid(), fromNodeId: decomposerId, toNodeId: wsh06ScriptId },
            { id: cid(), fromNodeId: decomposerId, toNodeId: wsh07ScriptId },

            // 拆解中枢连到 7 镜画面Prompt
            { id: cid(), fromNodeId: decomposerId, toNodeId: wsh01VisualId },
            { id: cid(), fromNodeId: decomposerId, toNodeId: wsh02VisualId },
            { id: cid(), fromNodeId: decomposerId, toNodeId: wsh03VisualId },
            { id: cid(), fromNodeId: decomposerId, toNodeId: wsh04VisualId },
            { id: cid(), fromNodeId: decomposerId, toNodeId: wsh05VisualId },
            { id: cid(), fromNodeId: decomposerId, toNodeId: wsh06VisualId },
            { id: cid(), fromNodeId: decomposerId, toNodeId: wsh07VisualId },

            // H3 产线接线：人物素材 + 台词音频 + 画面Prompt -> H3 多模态调度核
            { id: cid(), fromNodeId: h3PersonRefId, toNodeId: h3EngineId },
            { id: cid(), fromNodeId: wsh01VisualId, toNodeId: h3EngineId },
            { id: cid(), fromNodeId: wsh01ScriptId, toNodeId: h3EngineId },
            { id: cid(), fromNodeId: h3EngineId, toNodeId: delivH3_30Id },
            { id: cid(), fromNodeId: h3EngineId, toNodeId: delivH3_48Id },

            // Muse 产线接线：画面Prompt -> Muse 纯文字提示词中枢 -> Muse 渲染核 -> 音画剪辑器 (接入台词音频) -> Muse 成片
            { id: cid(), fromNodeId: wsh04VisualId, toNodeId: musePromptHubId },
            { id: cid(), fromNodeId: wsh05VisualId, toNodeId: musePromptHubId },
            { id: cid(), fromNodeId: musePromptHubId, toNodeId: museEngineId },
            { id: cid(), fromNodeId: museEngineId, toNodeId: museSyncId },
            { id: cid(), fromNodeId: wsh04ScriptId, toNodeId: museSyncId },
            { id: cid(), fromNodeId: museSyncId, toNodeId: delivMuse_30Id },
            { id: cid(), fromNodeId: museSyncId, toNodeId: delivMuse_48Id },

            // 发布中枢接线
            { id: cid(), fromNodeId: delivH3_30Id, toNodeId: publishHubId },
            { id: cid(), fromNodeId: delivH3_48Id, toNodeId: publishHubId },
            { id: cid(), fromNodeId: delivMuse_30Id, toNodeId: publishHubId },
            { id: cid(), fromNodeId: delivMuse_48Id, toNodeId: publishHubId },
        ];

        return { nodes, connections };
    }

    // ---------------- 1. ComfyUI × MiniMax-H3 · 1:1 爆款电商人物与背景全域替换工作流 (鲜草是活的吗？会咬人吗？) ----------------
    if (presetId === "h3") {
        const loadVideoId = nid("comfy-load-video");
        const loadFaceId = nid("comfy-load-face-ref");
        const loadProductId = nid("comfy-load-product-ref");
        const loadBgId = nid("comfy-load-bg-ref");
        const dwposeId = nid("comfy-dwpose-extractor");
        const mattingId = nid("comfy-birefnet-matting");
        const whisperId = nid("comfy-whisper-transcribe");
        const audioMasterId = nid("comfy-ebur128-master");
        const planV2DirectorId = nid("comfy-h3-planv2-director");
        const h3EngineId = nid("comfy-h3-actor-engine");
        const icLightId = nid("comfy-ic-light-harmonizer");
        const deliverCleanId = nid("comfy-videoplayer-clean-deliver");
        const deliverOfficialV2VId = nid("comfy-videoplayer-official-v2v");
        const sideBySideId = nid("comfy-image-side-by-side");
        const publisherId = nid("comfy-multiplatform-publisher");

        const nodes: CanvasNodeData[] = [
            // ── 第 1 列：4 大多模态资产输入源 (X = offset.x - 840) ──
            {
                id: loadVideoId,
                type: CanvasNodeType.Video,
                title: "🧩 ComfyUI::VHS_LoadVideo (<Video 1> 爆款原片底模)",
                position: { x: offset.x - 840, y: offset.y - 380 },
                width: 340,
                height: 240,
                metadata: {
                    content: ALIVE_H3_ORIG_VIDEO,
                    status: "success",
                    naturalWidth: 1080,
                    naturalHeight: 1920,
                    durationMs: 58000,
                    comfyNode: "VHS_LoadVideo",
                    comfyOutputs: ["[VIDEO_FRAMES] -> DWPose / BiRefNet / PlanV2", "[AUDIO] -> Whisper"],
                    comfyProps: "58.00s · 1392帧 · 24fps · 那曲拉姆雪山带货原视频母本",
                },
            },
            {
                id: loadFaceId,
                type: CanvasNodeType.Image,
                title: "🧩 ComfyUI::LoadImage (<Picture 1> 用户指定图一人物真身)",
                position: { x: offset.x - 840, y: offset.y - 100 },
                width: 340,
                height: 240,
                metadata: {
                    content: ALIVE_H3_PERSON_IMG,
                    status: "success",
                    naturalWidth: 720,
                    naturalHeight: 1280,
                    comfyNode: "LoadImage_CharacterRef",
                    comfyOutputs: ["[CHARACTER_ID] -> PlanV2 Director & MiniMax-H3"],
                    comfyProps: "<Subject 1>: 知性端庄东方女掌柜 | 浅米色干练西服 | 单反光学质感 | 绝非磨皮塑料假人",
                },
            },
            {
                id: loadProductId,
                type: CanvasNodeType.Image,
                title: "🧩 ComfyUI::LoadImage (<Picture 2> 用户指定图二鲜草实物)",
                position: { x: offset.x - 840, y: offset.y + 180 },
                width: 340,
                height: 240,
                metadata: {
                    content: ALIVE_H3_PRODUCT_IMG,
                    status: "success",
                    naturalWidth: 849,
                    naturalHeight: 1024,
                    comfyNode: "LoadImage_ProductRef",
                    comfyOutputs: ["[PRODUCT_REF] -> PlanV2 Director"],
                    comfyProps: "<Subject 2>: 西藏那曲新鲜冬虫夏草白瓷漏斗沥水碗实物 | 饱满挺拔金黄 | 腹足与细密环纹",
                },
            },
            {
                id: loadBgId,
                type: CanvasNodeType.Image,
                title: "🧩 ComfyUI::LoadImage (<Background> 新中式高档老字号实体展厅)",
                position: { x: offset.x - 840, y: offset.y + 460 },
                width: 340,
                height: 240,
                metadata: {
                    content: ALIVE_H3_NEW_BG_IMG,
                    status: "success",
                    naturalWidth: 1080,
                    naturalHeight: 1920,
                    comfyNode: "LoadImage_NewSceneBackground",
                    comfyOutputs: ["[NEW_BACKGROUND] -> PlanV2 & IC-Light"],
                    comfyProps: "场景：红木通顶药柜与暖光柔和展台 | 彻底置换原片荒凉雪山背景",
                },
            },

            // ── 第 2 列：时序与多模态解耦集群 (X = offset.x - 460) ──
            {
                id: dwposeId,
                type: CanvasNodeType.Config,
                title: "🧩 ComfyUI::DWPose_Extractor (动作骨骼与手势解耦)",
                position: { x: offset.x - 460, y: offset.y - 380 },
                width: 380,
                height: 220,
                metadata: {
                    generationMode: "video",
                    status: "success",
                    prompt: "【DWPose / ControlNet OpenPose 动作解耦中枢】\n• 提取原片 58s 头部晃动、手持白瓷碗轨迹、咬草整蛊微表情与说话口形\n• 剥离藏袍像素：丢弃原片拉姆深色藏袍与面部皮肤，仅保留骨骼向量\n• 核心价值：以纯动作骨骼驱动新人物，杜绝任何廉价磨皮感！",
                    comfyNode: "DWPose_OpenPoseExtractor",
                },
            },
            {
                id: mattingId,
                type: CanvasNodeType.Config,
                title: "🧩 ComfyUI::BiRefNet_Matting (发丝级视频主体抠图)",
                position: { x: offset.x - 460, y: offset.y - 120 },
                width: 380,
                height: 220,
                metadata: {
                    generationMode: "video",
                    status: "success",
                    prompt: "【BiRefNet SOTA 视频发丝级前景抠图】\n• Model: BiRefNet-general (时序稳定超清版)\n• 任务：提取人体与道具 Alpha 遮罩，剥离原片雪山背景\n• 边缘羽化：自适应亚像素抗锯齿，杜绝换背景抠图白边",
                    comfyNode: "BiRefNet_SubjectMatting",
                },
            },
            {
                id: whisperId,
                type: CanvasNodeType.Text,
                title: "🧩 ComfyUI::WhisperAudioTranscribe (毫秒级台词分句)",
                position: { x: offset.x - 460, y: offset.y + 140 },
                width: 380,
                height: 220,
                metadata: {
                    content: "【Whisper-large-v3 毫秒级语音对齐】\n• 00:00 -> 00:05: 有人问鲜草是不是活的？放到嘴里它会不会咬我呀？到底是谁告诉你们这些的呀！\n• 00:05 -> 00:11: 鲜草可不是活的昆虫哟！刚挖出时水分足活性高，绝对不咬人，只有我们咬它！\n• 00:11 -> 00:19: 今天带你们到海拔四千多米的高原现场，看看刚从冻土里挖出来的鲜草长啥样！\n• 00:19 -> 00:28: 在雪山脚下吃鲜草没那么多讲究，用软毛刷轻轻把泥刷掉，清泉一冲原汁原味！\n• 00:28 -> 00:37: 我现在就吃一根给你们看……哎呀它咬我！哈哈开玩笑的，嚼起来像新鲜蘑菇回甘！\n• 00:37 -> 00:46: 记住吃虫草一定要从草头到虫身整根吃，草头清凉虫身温润，营养全面吸收！\n• 00:46 -> 00:52: 马上就要到一年一度鲜草季了，实在不敢生吃的朋友，打成超细粉冲温水喝！\n• 00:52 -> 00:58: 点个关注，跟着掌柜带你吃上真正西藏那曲源头高品质野生鲜虫草！",
                    status: "success",
                    fontSize: 12,
                    comfyNode: "WhisperAudioTranscribe",
                },
            },
            {
                id: audioMasterId,
                type: CanvasNodeType.Text,
                title: "🧩 ComfyUI::EBUR128_AudioMastering (标普广播级母带)",
                position: { x: offset.x - 460, y: offset.y + 400 },
                width: 380,
                height: 220,
                metadata: {
                    content: "【EBU R128 (-16.0 LUFS) 广播级母带压制】\n• 音频文件：master_voice_person_b_58s.wav (48kHz, 24-bit PCM)\n• 音色人设：20多岁东方知性女掌柜标准普通话，咬字温润真诚\n• 真实生理呼吸：保留 0.35s 换气气口与轻微停顿，绝无生硬AI机械感",
                    status: "success",
                    fontSize: 12,
                    comfyNode: "EBUR128_AudioMastering",
                },
            },

            // ── 第 3 列：GitHub 官方 ComfyUI-MiniMax-H3 4层标准提示词中枢 (X = offset.x - 40) ──
            {
                id: planV2DirectorId,
                type: CanvasNodeType.Text,
                title: "🧩 ComfyUI::MiniMaxH3_PlanV2_OfficialDirector (GitHub官方4层提示词标准)",
                position: { x: offset.x - 40, y: offset.y - 380 },
                width: 460,
                height: 700,
                metadata: {
                    content: "【GitHub 开源 ethanfel/ComfyUI-MiniMax-H3-Guide 官方 Plan v2 标准】\n\n### Layer 1: subject_definitions\n- <Subject 1>: Young elegant East Asian female store owner in her 20s, wearing light beige tailored new-Chinese business suit, delicate makeup, gentle and confident smile. Tied to <Picture 1>.\n- <Subject 2>: Authentic fresh Tibet Nagqu Cordyceps sinensis in white porcelain funnel bowl, plump golden caterpillar body with dense annular rings, four distinct pairs of abdominal legs, dark brown stroma head. Tied to <Picture 2>.\n- <Video 1>: 58-second master source video of Tibetan girl presenting cordyceps.\n\n### Layer 2: summary\n[video editing] The target video is an edited version of <Video 1>. The Tibetan girl in <Video 1> is completely replaced with <Subject 1>. The product held in hands is completely replaced with <Subject 2>. The background is transformed into a luxurious authentic Chinese herbal medicine apothecary showroom with rosewood cabinets and warm cinematic ambient lighting.\n\n### Layer 3: retention_analysis\n- fully_preserved: The character's body gestures, hand motion holding the bowl, head nod, lip-sync cadence, playful biting motion in shot 05, and overall comedic and educational pacing.\n- partially_preserved: The actor identity, face, hairstyle and clothing are replaced by <Subject 1>; the snow mountain background is replaced by the apothecary interior.\n\n### Layer 4: detailed_description\nShot 01-08 continuous flow: <Subject 1> faces camera, holding <Subject 2> steadily. Speech cadence matches audio perfectly. In shot 05, she playfully pretends to be bitten by the fresh grass, then bursts into a genuine sweet smile, explaining its mushroom-like crisp taste. Ultra-detailed skin pores, no plastic smoothing, professional commercial masterwork.",
                    status: "success",
                    fontSize: 12,
                    comfyNode: "MiniMaxH3_PlanV2_Director",
                    comfyProps: "官方 4 层标准架构：subject_definitions -> summary ([video editing]) -> retention_analysis -> detailed_description",
                },
            },

            // ── 第 4 列：MiniMax-H3 原生生成与光影重塑 (X = offset.x + 460) ──
            {
                id: h3EngineId,
                type: CanvasNodeType.Config,
                title: "🧩 ComfyUI::MiniMax_H3_GenerativeActorEngine (原生换人·绝非磨皮)",
                position: { x: offset.x + 460, y: offset.y - 380 },
                width: 380,
                height: 340,
                metadata: {
                    generationMode: "video",
                    model: "MiniMax-H3::VideoEditing_PlanV2",
                    status: "success",
                    prompt: "【MiniMax-H3 官方视频编辑引擎 (Video Editing Native)】\n★ 核心原理：[video editing] 引导底层扩散模型重绘主体，直接以 <Subject 1>（图一女掌柜）为特征锚点重构每一帧人物！\n★ 背景置换：消除原片雪山荒凉感，融入老字号红木展厅！\n★ 动作继承：原片抬手、指点、假装咬草整蛊动作 100% 毫秒对齐！\n★ 绝非磨皮：单反级光学质感，发丝根根分明，面部微表情栩栩如生！",
                },
            },
            {
                id: icLightId,
                type: CanvasNodeType.Config,
                title: "🧩 ComfyUI::IC_Light_RelightingHarmonizer (光影矢量重塑与融合)",
                position: { x: offset.x + 460, y: offset.y + 20 },
                width: 380,
                height: 300,
                metadata: {
                    generationMode: "video",
                    status: "success",
                    prompt: "【IC-Light 环境光矢量重塑与边缘融合】\n• Light Vector: 对齐老字号展厅暖光侧逆光光源与自然漫反射\n• Edge Feathering: 3px 亚像素自适应羽化，消除人物贴纸感与边缘生硬白边\n• Color Bleed: 人物皮肤色温与暖木色博古架场景实现光学级溢色融合",
                },
            },

            // ── 第 5 列：交付成片与质检对比播放集群 (X = offset.x + 880 ~ +1320) ──
            {
                id: deliverCleanId,
                type: CanvasNodeType.Video,
                title: "🏆【纯净版·终极1:1复刻】冬虫夏草·鲜草是活的吗？(无横幅无贴片·58s大片)",
                position: { x: offset.x + 880, y: offset.y - 380 },
                width: 400,
                height: 480,
                metadata: {
                    content: ALIVE_H3_CLEAN_VIDEO,
                    status: "success",
                    naturalWidth: 1080,
                    naturalHeight: 1920,
                    durationMs: 58000,
                    comfyNode: "VideoPlayer_CleanDeliver",
                    comfyProps: "👑 终极纯净版：1080x1920 24fps · 46.1 MB · 彻底去除任何顶部大横幅与画中画贴片 · 图一知性女掌柜真身全长 58 秒连贯大片",
                },
            },
            {
                id: deliverOfficialV2VId,
                type: CanvasNodeType.Video,
                title: "⚡【ComfyUI 官方4层语法实测】原片拉姆1:1深度替换图一女掌柜 (H3原生直出)",
                position: { x: offset.x + 1320, y: offset.y - 380 },
                width: 360,
                height: 480,
                metadata: {
                    content: ALIVE_H3_OFFICIAL_RECAST_VIDEO,
                    status: "success",
                    naturalWidth: 768,
                    naturalHeight: 1344,
                    durationMs: 5170,
                    comfyNode: "VideoPlayer_OfficialRecast",
                    comfyProps: "⚡ 官方单镜直出实测：Task 01a1ba80 · 动作骨骼100%继承 · 脸部深度替换为图一知性女性面容 · 绝无后道拼接",
                },
            },
            {
                id: sideBySideId,
                type: CanvasNodeType.Image,
                title: "🔬【三联对比质检】原片拉姆 vs 指定图一女掌柜 vs 官方H3换人实机帧",
                position: { x: offset.x + 880, y: offset.y + 140 },
                width: 400,
                height: 340,
                metadata: {
                    content: ALIVE_H3_SIDE_BY_SIDE_IMG,
                    status: "success",
                    naturalWidth: 1920,
                    naturalHeight: 1080,
                    comfyNode: "Image_SideBySideComparison",
                    comfyProps: "三联质检：左侧原片拉姆 vs 中间指定图一掌柜真身 vs 右侧H3换人实机帧 · 面容与动作精准映射",
                },
            },
            {
                id: publisherId,
                type: CanvasNodeType.Config,
                title: "🚀 ComfyUI::MultiPlatformPublisher (全渠道矩阵发布)",
                position: { x: offset.x + 1320, y: offset.y + 140 },
                width: 360,
                height: 340,
                metadata: {
                    generationMode: "video",
                    status: "success",
                    prompt: "【全渠道一键矩阵分发中枢】\n• 抖音 (Douyin Open Platform) - 带货挂载：西藏那曲野生鲜草50根精装礼盒\n• 微信视频号 (Channels) - 原画 1080P 高清无损分发\n• 快手 (Kuaishou) - 同步发布，标题：鲜草是活的吗？会咬人吗？\n• 话题标签：#冬虫夏草 #新鲜虫草 #那曲鲜草 #滋补养生 #实体老字号",
                },
            },
        ];

        const connections: CanvasConnection[] = [
            // 输入源连出
            { id: cid(), fromNodeId: loadVideoId, toNodeId: dwposeId },
            { id: cid(), fromNodeId: loadVideoId, toNodeId: mattingId },
            { id: cid(), fromNodeId: loadVideoId, toNodeId: whisperId },
            { id: cid(), fromNodeId: loadVideoId, toNodeId: planV2DirectorId },

            { id: cid(), fromNodeId: loadFaceId, toNodeId: planV2DirectorId },
            { id: cid(), fromNodeId: loadFaceId, toNodeId: h3EngineId },

            { id: cid(), fromNodeId: loadProductId, toNodeId: planV2DirectorId },

            { id: cid(), fromNodeId: loadBgId, toNodeId: planV2DirectorId },
            { id: cid(), fromNodeId: loadBgId, toNodeId: icLightId },

            // 解耦与音频连出
            { id: cid(), fromNodeId: dwposeId, toNodeId: planV2DirectorId },
            { id: cid(), fromNodeId: mattingId, toNodeId: h3EngineId },
            { id: cid(), fromNodeId: audioMasterId, toNodeId: planV2DirectorId },
            { id: cid(), fromNodeId: audioMasterId, toNodeId: deliverCleanId },

            // 官方 4 层提示词中枢 -> MiniMax-H3 生成引擎
            { id: cid(), fromNodeId: planV2DirectorId, toNodeId: h3EngineId },

            // H3 引擎 -> IC-Light 光影重塑
            { id: cid(), fromNodeId: h3EngineId, toNodeId: icLightId },

            // 最终产物分发
            { id: cid(), fromNodeId: icLightId, toNodeId: deliverCleanId },
            { id: cid(), fromNodeId: h3EngineId, toNodeId: deliverOfficialV2VId },
            { id: cid(), fromNodeId: deliverOfficialV2VId, toNodeId: sideBySideId },
            { id: cid(), fromNodeId: deliverCleanId, toNodeId: publisherId },
        ];

        return { nodes, connections };
    }

    // ---------------- 2. Seedance 2.5 独立工作流 ----------------
    if (presetId === "seedance") {
        const promptId = nid("text-prompt");
        const imageId = nid("img-firstframe");
        const configId = nid("cfg-sd25");
        const outId = nid("vid-sd25-out");

        const nodes: CanvasNodeData[] = [
            {
                id: promptId,
                type: CanvasNodeType.Text,
                title: "✍️ 提示词 · 商业图生视频",
                position: { x: offset.x - 420, y: offset.y - 70 },
                width: 330,
                height: 240,
                metadata: {
                    content: "极简新中式茶室内，知性东亚女掌柜双手平托纯白陶瓷漏斗沥水碗，碗中金黄冬虫夏草根根饱满，微距缓慢向前推镜，单反级写实光影",
                    status: "idle",
                    fontSize: 13,
                },
            },
            {
                id: imageId,
                type: CanvasNodeType.Image,
                title: "🖼️ 9:16 高清参考母图",
                position: { x: offset.x - 420, y: offset.y + 200 },
                width: 330,
                height: 240,
                metadata: {
                    content: DEFAULT_IMAGE_URL,
                    status: "success",
                    naturalWidth: 720,
                    naturalHeight: 1280,
                },
            },
            {
                id: configId,
                type: CanvasNodeType.Config,
                title: "🎥 Seedance 2.5 官方直连（商业出片）",
                position: { x: offset.x - 20, y: offset.y + 50 },
                width: 380,
                height: 230,
                metadata: {
                    generationMode: "video",
                    model: "vid-seedance-25-bd::seedance-2.5-bd",
                    seconds: "5",
                    size: "9:16",
                    status: "idle",
                },
            },
            {
                id: outId,
                type: CanvasNodeType.Video,
                title: "🎥 Seedance 2.5 生成视频成片",
                position: { x: offset.x + 420, y: offset.y + 50 },
                width: 410,
                height: 230,
                metadata: {
                    content: DEFAULT_SEEDANCE_VIDEO,
                    status: "success",
                    naturalWidth: 720,
                    naturalHeight: 1280,
                    durationMs: 5000,
                },
            },
        ];

        const connections: CanvasConnection[] = [
            { id: cid(), fromNodeId: promptId, toNodeId: configId },
            { id: cid(), fromNodeId: imageId, toNodeId: configId },
            { id: cid(), fromNodeId: configId, toNodeId: outId },
        ];

        return { nodes, connections };
    }

    // ---------------- 3. Muse 原生带声独立工作流 (30秒 3 镜标准分镜工业流水线) ----------------
    if (presetId === "muse") {
        const masterImgId = nid("img-master");
        const prompt1Id = nid("text-p1");
        const vid1Id = nid("vid-seg1");
        const prompt2Id = nid("text-p2");
        const vid2Id = nid("vid-seg2");
        const prompt3Id = nid("text-p3");
        const vid3Id = nid("vid-seg3");
        const mergeId = nid("node-merge");
        const finalVidId = nid("vid-final30");

        const nodes: CanvasNodeData[] = [
            // 1. 首帧母图 (形象与场景锚点，双手自然叠放，不拿白瓷碗)
            {
                id: masterImgId,
                type: CanvasNodeType.Image,
                title: "🖼️ 9:16 高清人物首帧母图 (形象与场景锚点)",
                position: { x: offset.x - 920, y: offset.y - 120 },
                width: 320,
                height: 480,
                metadata: {
                    content: DEFAULT_IMAGE_URL,
                    status: "success",
                    naturalWidth: 1152,
                    naturalHeight: 2048,
                },
            },

            // 2. 镜 1 组：0~10s 痛点抓人
            {
                id: prompt1Id,
                type: CanvasNodeType.Text,
                title: "✍️ 镜1提示词 · 0~10s 痛点抓人 (34字)",
                position: { x: offset.x - 550, y: offset.y - 280 },
                width: 330,
                height: 230,
                metadata: {
                    content: `[强制执行] 直接生成视频，不要回复任何解释文字。严格在 10 秒内完整说完这句台词：\n"经常熬夜、精力跟不上的朋友，别盲目跟风。正宗西藏那曲高海拔头采冬虫夏草，先看色泽和环纹。"`,
                    status: "idle",
                    fontSize: 13,
                },
            },
            {
                id: vid1Id,
                type: CanvasNodeType.Video,
                title: "📹 镜1 · 痛点抓人 (10.0s 原生发声)",
                position: { x: offset.x - 180, y: offset.y - 280 },
                width: 340,
                height: 230,
                metadata: {
                    content: MUSE_SEG1_VIDEO,
                    status: "success",
                    naturalWidth: 720,
                    naturalHeight: 1280,
                    durationMs: 10000,
                },
            },

            // 3. 镜 2 组：10~20s 核心干货
            {
                id: prompt2Id,
                type: CanvasNodeType.Text,
                title: "✍️ 镜2提示词 · 10~20s 核心干货 (36字)",
                position: { x: offset.x - 550, y: offset.y },
                width: 330,
                height: 230,
                metadata: {
                    content: `[强制执行] 直接生成视频，不要回复任何解释文字。严格在 10 秒内完整说完这句台词：\n"虫体饱满金黄，环纹细密，腹部四对足清晰明显，草头短于虫体，这种才是高营养密度的原生态好草。"`,
                    status: "idle",
                    fontSize: 13,
                },
            },
            {
                id: vid2Id,
                type: CanvasNodeType.Video,
                title: "📹 镜2 · 核心干货 (10.0s 原生发声)",
                position: { x: offset.x - 180, y: offset.y },
                width: 340,
                height: 230,
                metadata: {
                    content: MUSE_SEG2_VIDEO,
                    status: "success",
                    naturalWidth: 720,
                    naturalHeight: 1280,
                    durationMs: 10000,
                },
            },

            // 4. 镜 3 组：20~30s 吃法促单
            {
                id: prompt3Id,
                type: CanvasNodeType.Text,
                title: "✍️ 镜3提示词 · 20~30s 吃法促单 (36字)",
                position: { x: offset.x - 550, y: offset.y + 280 },
                width: 330,
                height: 230,
                metadata: {
                    content: `[强制执行] 直接生成视频，不要回复任何解释文字。严格在 10 秒内完整说完这句台词：\n"每天早晨温水冲泡或者文火慢炖两根，坚持一个月，精气神自然充沛，认准那曲核心产区原产地直发。"`,
                    status: "idle",
                    fontSize: 13,
                },
            },
            {
                id: vid3Id,
                type: CanvasNodeType.Video,
                title: "📹 镜3 · 吃法促单 (10.0s 原生发声)",
                position: { x: offset.x - 180, y: offset.y + 280 },
                width: 340,
                height: 230,
                metadata: {
                    content: MUSE_SEG3_VIDEO,
                    status: "success",
                    naturalWidth: 720,
                    naturalHeight: 1280,
                    durationMs: 10000,
                },
            },

            // 5. 突破 10s 限制的核心武器：多段选段合成与成片导出节点 (CanvasNodeType.Merge)
            {
                id: mergeId,
                type: CanvasNodeType.Merge,
                title: "🎬 多段视频合成预览与成片导出 (突破 10s 限制)",
                position: { x: offset.x + 210, y: offset.y - 120 },
                width: 640,
                height: 520,
                metadata: {
                    status: "idle",
                    segments: [
                        { id: "seg-1", name: "镜1 · 痛点抓人", videoUrl: MUSE_SEG1_VIDEO, duration: 10.0, selected: true },
                        { id: "seg-2", name: "镜2 · 核心干货", videoUrl: MUSE_SEG2_VIDEO, duration: 10.0, selected: true },
                        { id: "seg-3", name: "镜3 · 吃法促单", videoUrl: MUSE_SEG3_VIDEO, duration: 10.0, selected: true },
                    ],
                    targetWidth: 720,
                    targetHeight: 1280,
                    fps: 30,
                },
            },

            // 6. 最终商业成片播放器
            {
                id: finalVidId,
                type: CanvasNodeType.Video,
                title: "🏆 最终交付成片 · 30秒无缝高质口播 (29.2s)",
                position: { x: offset.x + 900, y: offset.y - 120 },
                width: 390,
                height: 520,
                metadata: {
                    content: MUSE_FINAL30_VIDEO,
                    status: "success",
                    naturalWidth: 720,
                    naturalHeight: 1280,
                    durationMs: 29200,
                },
            },
        ];

        const connections: CanvasConnection[] = [
            // 母图形象与场景锁入各分镜
            { id: cid(), fromNodeId: masterImgId, toNodeId: vid1Id },
            { id: cid(), fromNodeId: masterImgId, toNodeId: vid2Id },
            { id: cid(), fromNodeId: masterImgId, toNodeId: vid3Id },
            // 分镜秒级提示词输入各分镜视频生成
            { id: cid(), fromNodeId: prompt1Id, toNodeId: vid1Id },
            { id: cid(), fromNodeId: prompt2Id, toNodeId: vid2Id },
            { id: cid(), fromNodeId: prompt3Id, toNodeId: vid3Id },
            // 三段 10s 视频流入合成导出节点
            { id: cid(), fromNodeId: vid1Id, toNodeId: mergeId },
            { id: cid(), fromNodeId: vid2Id, toNodeId: mergeId },
            { id: cid(), fromNodeId: vid3Id, toNodeId: mergeId },
            // 合成导出节点输出交付最终成片
            { id: cid(), fromNodeId: mergeId, toNodeId: finalVidId },
        ];

        return { nodes, connections };
    }

    // ---------------- 4. Muse 1:1 爆款复刻工作流 (冬虫夏草 · 11镜标准分镜链) ----------------
    if (presetId === "muse_replicate") {
        const origVideoId = nid("vid-orig-master");
        const personImgId = nid("img-person-b");
        const anchorAudioId = nid("aud-anchor-b");
        const scriptPlanId = nid("text-11shots-plan");
        const museEngineId = nid("cfg-muse-engine");
        const mergeNodeId = nid("node-merge-11shots");
        const subAlignId = nid("cfg-sub-align");
        const finalDeliverId = nid("vid-final-deliver");

        const nodes: CanvasNodeData[] = [
            // 左列 1：爆款参考原片 (抖音 62.9s)
            {
                id: origVideoId,
                type: CanvasNodeType.Video,
                title: "🎬 爆款参考原片 (抖音 62.9s · 11 刀硬切)",
                position: { x: offset.x - 620, y: offset.y - 280 },
                width: 320,
                height: 230,
                metadata: {
                    content: REPLICATE_ORIG_VIDEO,
                    status: "success",
                    naturalWidth: 576,
                    naturalHeight: 1024,
                    durationMs: 62867,
                },
            },
            // 左列 2：人物B 形象锁定
            {
                id: personImgId,
                type: CanvasNodeType.Image,
                title: "👤 人物B 形象锁定 (薄荷绿棕条纹针织衫)",
                position: { x: offset.x - 620, y: offset.y - 20 },
                width: 320,
                height: 230,
                metadata: {
                    content: REPLICATE_PERSON_IMG,
                    status: "success",
                    naturalWidth: 720,
                    naturalHeight: 1280,
                },
            },
            // 左列 3：音色锚点 (anchor.wav)
            {
                id: anchorAudioId,
                type: CanvasNodeType.Text,
                title: "🎙️ 2.12s 原生音色锚点 (anchor.wav)",
                position: { x: offset.x - 620, y: offset.y + 240 },
                width: 320,
                height: 210,
                metadata: {
                    content: "【Muse 原生发声音色锚点】\n文件：out/replicate_douyin_b/_h3/speak_test/anchor.wav (2.12s)\n人设：20多岁东亚知性女性，标准普通话自然发音，真人口唇同步驱动。\n分离人声：orig_vocal_track.wav",
                    status: "success",
                    fontSize: 12,
                },
            },
            // 中左列：11 镜分镜施工图总控
            {
                id: scriptPlanId,
                type: CanvasNodeType.Text,
                title: "📋 11 镜分镜施工图 (时间轴 · 台词字数 · 运镜)",
                position: { x: offset.x - 260, y: offset.y - 280 },
                width: 440,
                height: 730,
                metadata: {
                    content: REPLICATE_11_SHOTS_SCRIPT,
                    status: "idle",
                    fontSize: 12,
                },
            },
            // 中右列 1：Muse 逐镜原生发声调度渲染
            {
                id: museEngineId,
                type: CanvasNodeType.Config,
                title: "📹 Muse 11 镜逐镜渲染与声画调度 (vid-muse)",
                position: { x: offset.x + 220, y: offset.y - 280 },
                width: 380,
                height: 210,
                metadata: {
                    generationMode: "video",
                    model: "vid-muse::muse-replicate",
                    seconds: "62.9",
                    size: "9:16",
                    vquality: "720P",
                    status: "success",
                },
            },
            // 中右列 2：MuseCanvas 专属合成导出节点
            {
                id: mergeNodeId,
                type: CanvasNodeType.Merge,
                title: "🎬 11 镜选段无缝合成与成片导出 (Merge Node)",
                position: { x: offset.x + 220, y: offset.y - 40 },
                width: 380,
                height: 240,
                metadata: {
                    status: "idle",
                    targetWidth: 720,
                    targetHeight: 1280,
                    fps: 30,
                    segments: [
                        { id: "sh-01", name: "镜01 · 开场冲泡 (3.67s)", videoUrl: "/api/media/out%2Freplicate_douyin%2F_shots/p_sh01.mp4", duration: 3.67 },
                        { id: "sh-02", name: "镜02 · 流水冲洗 (5.80s)", videoUrl: "/api/media/out%2Freplicate_douyin%2F_shots/p_sh02.mp4", duration: 5.80 },
                        { id: "sh-03", name: "镜03 · 切近口播 (4.10s)", videoUrl: "/api/media/out%2Freplicate_douyin%2F_shots/p_sh03.mp4", duration: 4.10 },
                        { id: "sh-04", name: "镜04 · 勿泡太久 (4.06s)", videoUrl: "/api/media/out%2Freplicate_douyin%2F_shots/p_sh04.mp4", duration: 4.06 },
                        { id: "sh-05", name: "镜05 · 营养流失 (1.80s)", videoUrl: "/api/media/out%2Freplicate_douyin%2F_shots/p_sh05.mp4", duration: 1.80 },
                        { id: "sh-06", name: "镜06 · 温水冲泡 (12.0s)", videoUrl: "/api/media/out%2Freplicate_douyin%2F_shots/p_sh06.mp4", duration: 12.00 },
                        { id: "sh-07", name: "镜07 · 焖泡时间 (5.44s)", videoUrl: "/api/media/out%2Freplicate_douyin%2F_shots/p_sh07.mp4", duration: 5.44 },
                        { id: "sh-08", name: "镜08 · 切勿扔掉 (2.50s)", videoUrl: "/api/media/out%2Freplicate_douyin%2F_shots/p_sh08.mp4", duration: 2.50 },
                        { id: "sh-09", name: "镜09 · 虫体营养 (7.60s)", videoUrl: "/api/media/out%2Freplicate_douyin%2F_shots/p_sh09.mp4", duration: 7.60 },
                        { id: "sh-10", name: "镜10 · 阴阳平衡 (13.6s)", videoUrl: "/api/media/out%2Freplicate_douyin%2F_shots/p_sh10.mp4", duration: 13.63 },
                        { id: "sh-11", name: "镜11 · 收尾发问 (2.27s)", videoUrl: "/api/media/out%2Freplicate_douyin%2F_shots/p_sh11.mp4", duration: 2.27 },
                    ],
                },
            },
            // 中右列 3：逐句字幕精准对齐 & 标题卡烧制
            {
                id: subAlignId,
                type: CanvasNodeType.Config,
                title: "🔤 逐句字幕精准对齐 & 标题卡烧制 (muse_sub_align)",
                position: { x: offset.x + 220, y: offset.y + 230 },
                width: 380,
                height: 220,
                metadata: {
                    generationMode: "video",
                    status: "success",
                    prompt: "字幕样式：42px 纯白字黑描边（无底条）\n标题卡：开场 0~3.67s 烧制原版 1:1 黄色粗体「虫草」标题卡",
                },
            },
            // 右列：最终交付成片播放器 (Muse 引擎 · 16.2 MB · 62.9s)
            {
                id: finalDeliverId,
                type: CanvasNodeType.Video,
                title: "🏆 最终交付成片 · 冬虫夏草 1:1 复刻 (Muse 引擎 · 16.2MB · 62.9s)",
                position: { x: offset.x + 640, y: offset.y - 120 },
                width: 420,
                height: 480,
                metadata: {
                    content: REPLICATE_MUSE_FINAL_VIDEO,
                    status: "success",
                    naturalWidth: 720,
                    naturalHeight: 1280,
                    durationMs: 62867,
                },
            },
        ];

        const connections: CanvasConnection[] = [
            { id: cid(), fromNodeId: origVideoId, toNodeId: scriptPlanId },
            { id: cid(), fromNodeId: personImgId, toNodeId: museEngineId },
            { id: cid(), fromNodeId: anchorAudioId, toNodeId: museEngineId },
            { id: cid(), fromNodeId: scriptPlanId, toNodeId: museEngineId },
            { id: cid(), fromNodeId: museEngineId, toNodeId: mergeNodeId },
            { id: cid(), fromNodeId: mergeNodeId, toNodeId: subAlignId },
            { id: cid(), fromNodeId: scriptPlanId, toNodeId: subAlignId },
            { id: cid(), fromNodeId: subAlignId, toNodeId: finalDeliverId },
        ];

        return { nodes, connections };
    }

    if (presetId === "fresh_replicate") {
        const origVideoId = nid();
        const decomposerId = nid();

        // 7 镜台词与画面节点 ID
        const sh01ScriptId = nid(); const sh01VisualId = nid();
        const sh02ScriptId = nid(); const sh02VisualId = nid();
        const sh03ScriptId = nid(); const sh03VisualId = nid();
        const sh04ScriptId = nid(); const sh04VisualId = nid();
        const sh05ScriptId = nid(); const sh05VisualId = nid();
        const sh06ScriptId = nid(); const sh06VisualId = nid();
        const sh07ScriptId = nid(); const sh07VisualId = nid();

        // H3 专属支线（多模态：人物+音频+提示词）
        const h3PersonRefId = nid();
        const h3EngineId = nid();
        const delivH3_33Id = nid();
        const delivH3_52Id = nid();

        // Muse 专属支线（纯文字：Text-to-Video 纯 Prompt，无图无视）
        const musePromptHubId = nid();
        const museEngineId = nid();
        const museSyncId = nid();
        const delivMuse_33Id = nid();
        const delivMuse_52Id = nid();

        // 发布中枢
        const publishHubId = nid();

        const nodes: CanvasNodeData[] = [
            // ── 第 1 栏：爆款源视频 (X = offset.x - 1100) ──
            {
                id: origVideoId,
                type: CanvasNodeType.Video,
                title: "🎬 抖音爆款原版标杆《带你解锁六种新鲜虫草的吃法！》(33.68s)",
                position: { x: offset.x - 1100, y: offset.y - 100 },
                width: 320,
                height: 250,
                metadata: {
                    content: FRESH_ORIG_VIDEO,
                    status: "success",
                    naturalWidth: 576,
                    naturalHeight: 1024,
                    durationMs: 33680,
                },
            },

            // ── 第 2 栏：秒级音画解耦拆解中枢 (X = offset.x - 720) ──
            {
                id: decomposerId,
                type: CanvasNodeType.Text,
                title: "🔬 秒级音画深度解耦中枢 (精确到0.01秒 · 画面与台词双向拆开)",
                position: { x: offset.x - 720, y: offset.y - 380 },
                width: 340,
                height: 800,
                metadata: {
                    content: "【爆款视频秒级深度音画拆解引擎】\n" +
                             "• 拆解原则：以 0.01 秒精度完成 7 镜全时序切分\n" +
                             "• 核心解耦：彻底将【台词音频】与【画面视觉Prompt】独立拆开\n\n" +
                             "• 双轨模型特性匹配：\n" +
                             "  1. H3 专属产线：支持人物参考图+分镜音频+提示词联合提交，执行多模态音画复刻\n" +
                             "  2. Muse 专属产线：不支持图片和视频，纯文字 Prompt 驱动 Text-to-Video 生成，再音画对齐剪辑！",
                    status: "success",
                    fontSize: 12,
                },
            },

            // ── 第 3 栏：7 镜台词与音频切片 (X = offset.x - 340) ──
            {
                id: sh01ScriptId,
                type: CanvasNodeType.Text,
                title: "🎙️ 镜01 · 台词音频 [0.0s~3.6s / 3.6s]",
                position: { x: offset.x - 340, y: offset.y - 380 },
                width: 300,
                height: 100,
                metadata: { content: "「带你解锁新鲜冬虫夏草的六种经典吃法！」\n• 音频切片：sh01_voice_a.mp3 (3.6s)", status: "success", fontSize: 11 },
            },
            {
                id: sh02ScriptId,
                type: CanvasNodeType.Text,
                title: "🎙️ 镜02 · 台词音频 [3.6s~9.7s / 6.1s]",
                position: { x: offset.x - 340, y: offset.y - 265 },
                width: 300,
                height: 100,
                metadata: { content: "「第一种，直接生吃，原汁原味，感受大自然的馈赠；」\n• 音频切片：sh02_voice_a.mp3 (6.1s)", status: "success", fontSize: 11 },
            },
            {
                id: sh03ScriptId,
                type: CanvasNodeType.Text,
                title: "🎙️ 镜03 · 台词音频 [9.7s~15.1s / 5.4s]",
                position: { x: offset.x - 340, y: offset.y - 150 },
                width: 300,
                height: 100,
                metadata: { content: "「第二种，温水冲泡，搭配西洋参和枸杞，清香回甘；」\n• 音频切片：sh03_voice_a.mp3 (5.4s)", status: "success", fontSize: 11 },
            },
            {
                id: sh04ScriptId,
                type: CanvasNodeType.Text,
                title: "🎙️ 镜04 · 台词音频 [15.1s~21.0s / 5.9s]",
                position: { x: offset.x - 340, y: offset.y - 35 },
                width: 300,
                height: 100,
                metadata: { content: "「第三种，鲜草蒸蛋，蛋香与草香交融，嫩滑可口；」\n• 音频切片：sh04_voice_a.mp3 (5.9s)", status: "success", fontSize: 11 },
            },
            {
                id: sh05ScriptId,
                type: CanvasNodeType.Text,
                title: "🎙️ 镜05 · 台词音频 [21.0s~25.0s / 4.0s]",
                position: { x: offset.x - 340, y: offset.y + 80 },
                width: 300,
                height: 100,
                metadata: { content: "「第四种，煲排骨汤，慢火细炖，汤鲜味美；」\n• 音频切片：sh05_voice_a.mp3 (4.0s)", status: "success", fontSize: 11 },
            },
            {
                id: sh06ScriptId,
                type: CanvasNodeType.Text,
                title: "🎙️ 镜06 · 台词音频 [25.0s~29.3s / 4.3s]",
                position: { x: offset.x - 340, y: offset.y + 195 },
                width: 300,
                height: 100,
                metadata: { content: "「第五种，纯粮白酒浸泡，滋补醇厚；」\n• 音频切片：sh06_voice_a.mp3 (4.3s)", status: "success", fontSize: 11 },
            },
            {
                id: sh07ScriptId,
                type: CanvasNodeType.Text,
                title: "🎙️ 镜07 · 台词音频 [29.3s~33.7s / 4.4s]",
                position: { x: offset.x - 340, y: offset.y + 310 },
                width: 300,
                height: 100,
                metadata: { content: "「第六种，文火煲粥，温润养人。六种吃法，滋养全家！」\n• 音频切片：sh07_voice_a.mp3 (4.4s)", status: "success", fontSize: 11 },
            },

            // ── 第 4 栏：7 镜画面与视觉Prompt (X = offset.x - 20) ──
            {
                id: sh01VisualId,
                type: CanvasNodeType.Text,
                title: "🖼️ 镜01 · 画面Prompt (开场引入)",
                position: { x: offset.x - 20, y: offset.y - 380 },
                width: 320,
                height: 100,
                metadata: { content: "【视觉Prompt】知性女掌柜素雅新中式旗袍，老字号茶斋百叶暖光，双手自然优雅，真诚微笑面对镜头开场口播", status: "success", fontSize: 11 },
            },
            {
                id: sh02VisualId,
                type: CanvasNodeType.Text,
                title: "🖼️ 镜02 · 画面Prompt (原味生吃)",
                position: { x: offset.x - 20, y: offset.y - 265 },
                width: 320,
                height: 100,
                metadata: { content: "【视觉Prompt】清冽泉水细流，软毛刷轻柔刷去新鲜冬虫夏草泥沙，水珠晶莹剔透，手持鲜草放入口中细细嚼服", status: "success", fontSize: 11 },
            },
            {
                id: sh03VisualId,
                type: CanvasNodeType.Text,
                title: "🖼️ 镜03 · 画面Prompt (温水冲泡)",
                position: { x: offset.x - 20, y: offset.y - 150 },
                width: 320,
                height: 100,
                metadata: { content: "【视觉Prompt】素雅茶台白瓷盏，85度温水冲泡鲜草与枸杞，热气袅袅升腾，茶汤泛起琥珀金黄", status: "success", fontSize: 11 },
            },
            {
                id: sh04VisualId,
                type: CanvasNodeType.Text,
                title: "🖼️ 镜04 · 画面Prompt (鲜草蒸蛋)",
                position: { x: offset.x - 20, y: offset.y - 35 },
                width: 320,
                height: 100,
                metadata: { content: "【视觉Prompt】双耳白瓷青花炖盅鲜草蒸蛋羹，表面金黄如镜，一勺舀起布丁般细腻弹嫩，蛋香草香弥漫", status: "success", fontSize: 11 },
            },
            {
                id: sh05VisualId,
                type: CanvasNodeType.Text,
                title: "🖼️ 镜05 · 画面Prompt (煲排骨汤)",
                position: { x: offset.x - 20, y: offset.y + 80 },
                width: 320,
                height: 100,
                metadata: { content: "【视觉Prompt】古朴黑砂锅文火微沸慢煨排骨鲜草汤，金黄鲜草沸腾翻滚，油花晶莹，滚滚热气升腾", status: "success", fontSize: 11 },
            },
            {
                id: sh06VisualId,
                type: CanvasNodeType.Text,
                title: "🖼️ 镜06 · 画面Prompt (纯粮泡酒)",
                position: { x: offset.x - 20, y: offset.y + 195 },
                width: 320,
                height: 100,
                metadata: { content: "【视觉Prompt】无铅水晶密封酒坛，清澈高度纯粮白酒浸泡数十根金黄鲜草，侧光穿透折射纯净琥珀金光", status: "success", fontSize: 11 },
            },
            {
                id: sh07VisualId,
                type: CanvasNodeType.Text,
                title: "🖼️ 镜07 · 画面Prompt (文火熬粥)",
                position: { x: offset.x - 20, y: offset.y + 310 },
                width: 320,
                height: 100,
                metadata: { content: "【视觉Prompt】粗陶砂锅熬煮浓稠金黄小米鲜草粥，米油浓稠发亮，木勺轻舀，晨光熹微温暖养胃治愈", status: "success", fontSize: 11 },
            },

            // ── 第 5 栏 上层：H3 专属多模态复刻产线 (人物+音频+提示词) ──
            {
                id: h3PersonRefId,
                type: CanvasNodeType.Image,
                title: "👤 H3 专属人物素材 · 知性旗袍女掌柜 (4K商业级)",
                position: { x: offset.x + 340, y: offset.y - 380 },
                width: 280,
                height: 150,
                metadata: {
                    content: "/api/media/out%2Freplicate_fresh_cordyceps%2Fdeliver/%E6%96%B0%E9%87%8A%E8%99%AB%E8%8D%89_%E5%85%AD%E7%A7%8D%E5%90%83%E6%B3%95_H3%E5%8E%9F%E7%94%9F%E5%8F%91%E5%A3%B0_%E7%9F%A5%E6%80%A7%E5%A5%B3%E6%8E%8C%E6%9F%9C_33s%E5%8D%A1%E7%82%B9%E7%89%88.jpg",
                    status: "success",
                },
            },
            {
                id: h3EngineId,
                type: CanvasNodeType.Config,
                title: "⚡ MiniMax-H3 多模态音画复刻中枢",
                position: { x: offset.x + 650, y: offset.y - 380 },
                width: 320,
                height: 200,
                metadata: {
                    generationMode: "video",
                    model: "vid-h3::multimodal-replicate",
                    status: "success",
                    prompt: "【H3 核心能力】：\n• 支持同时提交【人物参考图 + 分镜人声音频 + 画面提示词】！\n• 支持图生图、视频复刻、角色姿态锁死与唇形同步匹配\n• 调度：33s 卡点快剪版 + 52s 深度讲解版",
                },
            },
            {
                id: delivH3_33Id,
                type: CanvasNodeType.Video,
                title: "🏆 H3 · 33s 卡点快剪版 (知性女掌柜 · 7.24MB)",
                position: { x: offset.x + 1000, y: offset.y - 380 },
                width: 280,
                height: 200,
                metadata: { content: FRESH_H3_33S_VIDEO, status: "success", naturalWidth: 576, naturalHeight: 1024, durationMs: 33660 },
            },
            {
                id: delivH3_52Id,
                type: CanvasNodeType.Video,
                title: "🏆 H3 · 52s 深度讲解版 (高原采草小哥 · 12.2MB)",
                position: { x: offset.x + 1300, y: offset.y - 380 },
                width: 280,
                height: 200,
                metadata: { content: FRESH_H3_52S_VIDEO, status: "success", naturalWidth: 576, naturalHeight: 1024, durationMs: 52230 },
            },

            // ── 第 5 栏 下层：Muse 专属纯文字生视频产线 (纯Prompt驱动，无图无视) ──
            {
                id: musePromptHubId,
                type: CanvasNodeType.Text,
                title: "📝 Muse 专属纯文字提示词专配中枢 (Text-to-Video)",
                position: { x: offset.x + 340, y: offset.y + 20 },
                width: 280,
                height: 200,
                metadata: {
                    content: "【Muse 核心规则】：\n• Muse 不支持提交视频和图片输入！\n• 必须把解耦的画面转换为超详尽 4K 电影质感纯文字生视频 Prompt！\n• 包含镜头光影、景深微距、材质细节，100% 纯文字驱动生成",
                    status: "success",
                    fontSize: 12,
                },
            },
            {
                id: museEngineId,
                type: CanvasNodeType.Config,
                title: "🎨 Muse 纯文字生视频渲染核 (Text-to-Video)",
                position: { x: offset.x + 650, y: offset.y + 20 },
                width: 320,
                height: 200,
                metadata: {
                    generationMode: "video",
                    model: "vid-muse::text-to-video",
                    status: "success",
                    prompt: "【Muse 纯文字驱动】：\n• 接收 7 镜纯文字生视频 Prompt，调用本地 muse-cli 渲染分镜\n• 无任何图片或视频依附，纯文字直接生出 9:16 商业级镜头",
                },
            },
            {
                id: museSyncId,
                type: CanvasNodeType.Text,
                title: "✂️ Muse 音画对齐剪辑器 (PIL字幕 + 母带音频对齐)",
                position: { x: offset.x + 1000, y: offset.y + 20 },
                width: 280,
                height: 200,
                metadata: {
                    content: "【Muse 后期音画对齐剪辑】：\n• 将 Muse 纯文字生成的独立分镜视频片段，与上游拆解出的 7 镜台词音频切片（voice_a/voice_b）精确定点缝合；\n• 叠加 PIL 纯白黑描边电影级字幕，EBU R128 (-16 LUFS) 响度对齐。",
                    status: "success",
                    fontSize: 12,
                },
            },
            {
                id: delivMuse_33Id,
                type: CanvasNodeType.Video,
                title: "🏆 Muse · 33s 卡点快剪版 (知性女掌柜 · 7.77MB)",
                position: { x: offset.x + 1300, y: offset.y - 80 },
                width: 280,
                height: 200,
                metadata: { content: FRESH_MUSE_33S_VIDEO, status: "success", naturalWidth: 576, naturalHeight: 1024, durationMs: 33660 },
            },
            {
                id: delivMuse_52Id,
                type: CanvasNodeType.Video,
                title: "🏆 Muse · 52s 深度讲解版 (新中式原木茶席 · 11.8MB)",
                position: { x: offset.x + 1300, y: offset.y + 140 },
                width: 280,
                height: 200,
                metadata: { content: FRESH_MUSE_52S_VIDEO, status: "success", naturalWidth: 576, naturalHeight: 1024, durationMs: 52200 },
            },

            // ── 第 6 栏：多平台一键发布中枢 ──
            {
                id: publishHubId,
                type: CanvasNodeType.Config,
                title: "🚀 全渠道多平台一键发布中枢 (抖音 · 视频号 · 快手)",
                position: { x: offset.x + 1620, y: offset.y - 120 },
                width: 320,
                height: 420,
                metadata: {
                    status: "success",
                    prompt: "【全渠道一键发布中枢】\n• 平台一：抖音 (Douyin) - 话题 #鲜虫草 #冬虫夏草 #六种吃法\n• 平台二：微信视频号 (Channels) - 高清长视频/进店私域挂载\n• 平台三：快手 (Kuaishou) - 高互动同城/滋补类目热榜\n• 状态：H3 与 Muse 双轨成片已全部挂载，支持一键批量推送或草稿同步",
                },
            },
        ];

        const connections: CanvasConnection[] = [
            // 原片到拆解中枢
            { id: cid(), fromNodeId: origVideoId, toNodeId: decomposerId },

            // 拆解中枢连到 7 镜台词音频
            { id: cid(), fromNodeId: decomposerId, toNodeId: sh01ScriptId },
            { id: cid(), fromNodeId: decomposerId, toNodeId: sh02ScriptId },
            { id: cid(), fromNodeId: decomposerId, toNodeId: sh03ScriptId },
            { id: cid(), fromNodeId: decomposerId, toNodeId: sh04ScriptId },
            { id: cid(), fromNodeId: decomposerId, toNodeId: sh05ScriptId },
            { id: cid(), fromNodeId: decomposerId, toNodeId: sh06ScriptId },
            { id: cid(), fromNodeId: decomposerId, toNodeId: sh07ScriptId },

            // 拆解中枢连到 7 镜画面Prompt
            { id: cid(), fromNodeId: decomposerId, toNodeId: sh01VisualId },
            { id: cid(), fromNodeId: decomposerId, toNodeId: sh02VisualId },
            { id: cid(), fromNodeId: decomposerId, toNodeId: sh03VisualId },
            { id: cid(), fromNodeId: decomposerId, toNodeId: sh04VisualId },
            { id: cid(), fromNodeId: decomposerId, toNodeId: sh05VisualId },
            { id: cid(), fromNodeId: decomposerId, toNodeId: sh06VisualId },
            { id: cid(), fromNodeId: decomposerId, toNodeId: sh07VisualId },

            // H3 产线接线：人物素材 + 台词音频 + 画面Prompt -> H3 多模态调度核
            { id: cid(), fromNodeId: h3PersonRefId, toNodeId: h3EngineId },
            { id: cid(), fromNodeId: sh01VisualId, toNodeId: h3EngineId },
            { id: cid(), fromNodeId: sh01ScriptId, toNodeId: h3EngineId },
            { id: cid(), fromNodeId: h3EngineId, toNodeId: delivH3_33Id },
            { id: cid(), fromNodeId: h3EngineId, toNodeId: delivH3_52Id },

            // Muse 产线接线：画面Prompt -> Muse 纯文字提示词中枢 -> Muse 渲染核 -> 音画剪辑器 (接入台词音频) -> Muse 成片
            { id: cid(), fromNodeId: sh04VisualId, toNodeId: musePromptHubId },
            { id: cid(), fromNodeId: sh05VisualId, toNodeId: musePromptHubId },
            { id: cid(), fromNodeId: musePromptHubId, toNodeId: museEngineId },
            { id: cid(), fromNodeId: museEngineId, toNodeId: museSyncId },
            { id: cid(), fromNodeId: sh04ScriptId, toNodeId: museSyncId },
            { id: cid(), fromNodeId: museSyncId, toNodeId: delivMuse_33Id },
            { id: cid(), fromNodeId: museSyncId, toNodeId: delivMuse_52Id },

            // 发布中枢接线
            { id: cid(), fromNodeId: delivH3_33Id, toNodeId: publishHubId },
            { id: cid(), fromNodeId: delivH3_52Id, toNodeId: publishHubId },
            { id: cid(), fromNodeId: delivMuse_33Id, toNodeId: publishHubId },
            { id: cid(), fromNodeId: delivMuse_52Id, toNodeId: publishHubId },
        ];

        return { nodes, connections };
    }

    // 默认走 h3 独立工作流
    return createWorkflowPreset("h3", offset);
}

/**
 * 产生初始的独立工作流项目
 */
export function createInitialProjects() {
    const now = new Date().toISOString();
    const presets: Array<{ id: WorkflowPresetId; title: string }> = [
        { id: "alive_replicate", title: "抖音爆款秒级深度音画拆解与双轨复刻 · 鲜草是活的吗？会咬人吗？ (H3多模态音图复刻 vs Muse纯文字生视频)" },
        { id: "wild_replicate", title: "抖音爆款秒级深度音画拆解与双轨复刻 · 野生冬虫夏草高原形成记 (H3多模态音图复刻 vs Muse纯文字生视频)" },
        { id: "fresh_replicate", title: "爆款秒级深度音画拆解与H3-Muse双轨复刻 · 新鲜虫草 (H3多模态音图复刻 vs Muse纯文字生视频)" },
        { id: "h3", title: "MiniMax-H3 · 1:1 爆款复刻工作流 (冬虫夏草 · 鲜草是活的吗？会咬人吗？ · 人物B)" },
        { id: "muse_replicate", title: "Muse · 1:1 爆款复刻工作流 (冬虫夏草 · 人物B · 11镜标准分镜链)" },
        { id: "seedance", title: "Seedance 2.5 独立视频工作流" },
        { id: "muse", title: "Muse 原生带声独立工作流 (冬虫夏草 · 30秒 3 镜标准分镜链)" },
    ];

    return presets.map((p) => {
        const flow = createWorkflowPreset(p.id);
        const viewport = p.id === "fresh_replicate"
            ? { x: 380, y: 220, k: 0.48 }
            : p.id === "h3" || p.id === "muse_replicate"
                ? { x: 220, y: 200, k: 0.62 }
                : p.id === "muse"
                    ? { x: 400, y: 160, k: 0.52 }
                    : { x: 320, y: 220, k: 0.85 };
        return {
            id: `proj-${p.id}`,
            title: p.title,
            createdAt: now,
            updatedAt: now,
            nodes: flow.nodes,
            connections: flow.connections,
            chatSessions: [],
            activeChatId: null,
            backgroundMode: "lines" as const,
            showImageInfo: false,
            viewport,
        };
    });
}
