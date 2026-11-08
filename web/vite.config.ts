import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

import { parseChangelog } from "./src/lib/release";

const webDir = dirname(fileURLToPath(import.meta.url));
const localVersion = readFileSync(resolve(webDir, "../VERSION"), "utf8").trim() || "dev";
const localChangelog = readFileSync(resolve(webDir, "../CHANGELOG.md"), "utf8");

// ★ base 必须是同一个值，manifest 生成时要用它拼插件路径。
//   之前这里是写死的 "/canvas/"，但清单里的插件条目是写死的 "/plugins/x.js" ——
//   两边不一致，后果很具体：
//     · 应用挂在 /canvas/ 下，loader 按清单去拉 /plugins/h3-pipeline.js
//     · 而 /plugins/* 是**五阶段工作台的根路径**，那边回的是 index.html
//     · 于是插件源码变成 <!doctype html>…，evaluatePluginSource 报
//       SyntaxError: Unexpected token '<'，插件"被发现了但加载失败"
//   这条错误在控制台里长得像"插件写坏了"，实际是路径拼错了。
const APP_BASE = process.env.VITE_BASE || "/canvas/";
const pluginsBase = `${APP_BASE.replace(/\/+$/, "")}/plugins`;

// Expose plugins/index.json with local plugin files from public/plugins.
// The frontend can discover and list them when enabled; development reads the directory live, while builds emit a static registry.
function localPluginsManifest(): Plugin {
    const pluginsDir = resolve(webDir, "public/plugins");
    // 条目带 base 前缀：/canvas/plugins/h3-pipeline.js，不是 /plugins/h3-pipeline.js
    const listLocalPlugins = () => {
        try {
            return readdirSync(pluginsDir)
                .filter((file) => file.endsWith(".js"))
                .sort()
                .map((file) => `${pluginsBase}/${file}`);
        } catch {
            return [];
        }
    };
    return {
        name: "local-plugins-manifest",
        configureServer(server) {
            // 开发态挂两条：带 base 的（应用真正请求的那条）和不带的（老路径兜底）
            const handler: Parameters<typeof server.middlewares.use>[1] = (_req, res) => {
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(listLocalPlugins()));
            };
            server.middlewares.use(`${pluginsBase}/index.json`, handler);
            server.middlewares.use("/plugins/index.json", handler);
        },
        generateBundle() {
            this.emitFile({ type: "asset", fileName: "plugins/index.json", source: JSON.stringify(listLocalPlugins()) });
        },
    };
}

// ★ base 必须改成 "/canvas/"：这套应用挂在 svpipe 的同源服务下，
//   入口是 127.0.0.1:8848/canvas。如果还是 "/"，构建出来的 js/css 会去请求
//   根路径的 /assets/xxx.js，而那里是五阶段工作台的地盘 —— 两个应用互相覆盖。
//   VITE_BASE 仍可覆盖（比如将来挂到别的子目录），默认给 /canvas/。
export default defineConfig({
    base: process.env.VITE_BASE || "/canvas/",
    plugins: [react(), localPluginsManifest()],
    resolve: {
        alias: {
            "@": resolve(webDir, "src"),
        },
    },
    define: {
        __APP_VERSION__: JSON.stringify(localVersion),
        __APP_RELEASES__: JSON.stringify(parseChangelog(localChangelog)),
    },
});
