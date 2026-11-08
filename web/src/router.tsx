import { createBrowserRouter, Outlet } from "react-router-dom";

import { AnalyticsTracker } from "@/components/layout/analytics-tracker";
import UserLayout from "@/layouts/user-layout";
import AssetsPage from "@/pages/assets";
import CanvasPage from "@/pages/canvas";
import CanvasProjectPage from "@/pages/canvas/project";
import ConfigPage from "@/pages/config";
import HomePage from "@/pages/home";
import ImagePage from "@/pages/image";
import NotFound from "@/pages/not-found";
import PromptsPage from "@/pages/prompts";
import VideoPage from "@/pages/video";
import { bootstrapChannels } from "@/lib/canvas-channel-bootstrap";

/**
 * ★ 这套应用挂在 svpipe 的 /canvas 子树下（127.0.0.1:8848/canvas）。
 *
 *   basename 必须写 "/canvas"：
 *     不写 → 浏览器地址栏是 /canvas/xxx 时，router 拿整段 pathname 去匹配
 *            "/" 或 "/:id"，永远匹配不上，落到 NotFound，页面显示
 *            「找不到页面」；而单开 /canvas 又被当成 "/canvas" 这条路径。
 *     写了 → router 自动剥掉这层前缀，下面的路径原样可用。
 *
 *   ★ 落点是「画布项目列表」，不是原来的营销首页：
 *     用户要的就是画布本身，让他在 /canvas 再点一次「打开画布」是白走一步。
 *     首页保留在 /home（提示词广场、工具介绍都还在）。
 *
 *   ★ 项目页路由用 "/:id"（不是 "/canvas/:id"）：
 *     这样地址栏就是干净的 /canvas/<项目id>，而不是 /canvas/canvas/<id>。
 *     静态段（/image /video /assets /prompts /config）在 ranking 上优先于
 *     动态段，不会被 ":id" 抢走。
 */
const BASENAME = "/canvas";

export const router = createBrowserRouter(
    [
        {
            element: (
                <UserLayout>
                    <AnalyticsTracker />
                    <Outlet />
                </UserLayout>
            ),
            children: [
                { path: "/", element: <CanvasPage /> },
                // ★ 上游导航栏的「画布」链接是 `/${slug}`＝"/canvas"，
                //   加了 basename 之后它就是 /canvas/canvas，这里必须留一条
                //   同名路由，否则在导航栏上点第二下会掉进 NotFound。
                { path: "/canvas", element: <CanvasPage /> },
                { path: "/:id", element: <CanvasProjectPage /> },
                { path: "/home", element: <HomePage /> },
                { path: "/image", element: <ImagePage /> },
                { path: "/video", element: <VideoPage /> },
                { path: "/assets", element: <AssetsPage /> },
                // ★ 容错别名：用户快速输入时常拼成 /assetswo 或 /asset
                { path: "/assetswo", element: <AssetsPage /> },
                { path: "/asset", element: <AssetsPage /> },
                { path: "/prompts", element: <PromptsPage /> },
                { path: "/config", element: <ConfigPage /> },
            ],
        },
        { path: "*", element: <NotFound /> },
    ],
    { basename: BASENAME },
);

// ★ 路由建好之后立刻拉一次后端渠道（H3 / Seedance 2.5 / gpt-image-2 / DeepSeek）。
//   放在这里而不是 main.tsx：路由模块本来就是应用入口，只执行一次，
//   dev 模式下热更新也不会重复触发。失败只是「没有预置渠道」，画布照常可用。
void bootstrapChannels();
