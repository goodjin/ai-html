# AI-HTML 实验室

这是一个基于 AI 能力的 HTML 应用实验项目，旨在构建一些有趣且实用的前端应用，涵盖声音、图片、视频等 AI 交互功能。

## 目录结构

- `doc/`: 项目相关文档与 API 指南
- `scripts/`: 工具脚本（如数据抓取、自动化任务等）
- `src/`: 源代码
  - `html/`: HTML 页面文件
  - `js/`: JavaScript 逻辑脚本
  - `css/`: CSS 样式表
- `README.md`: 项目说明文档

## 已实现功能

### 1. AI 语音转换器 (Voice Converter)
一个综合性的语音处理工具，支持多种 AI 服务商。
- **本地模式**：基于浏览器原生的 Web Speech API。
- **云端模式**：支持 OpenAI 兼容接口。
- **智谱 AI 支持**：
  - **GLM-TTS**：高质量文字转语音。
  - **GLM-4-Voice**：端到端情感语音对话。
  - **GLM-ASR**：语音识别（语音转文字）。
- **MiniMax 支持**：高拟真度语音合成。

## 快速开始

1. 克隆项目到本地：
   ```bash
   git clone git@github.com:goodjin/ai-html.git
   ```
2. 使用本地 HTTP 服务器运行：
   ```bash
   python3 -m http.server 8000
   ```
3. 在浏览器访问 `http://localhost:8000/src/html/index.html`。

## 未来规划

- [ ] 增加基于 AI 的图像生成 (DALL-E / Stable Diffusion) 演示页面。
- [ ] 增加视频数字人生成交互。
- [ ] 增加实时音视频通话 (WebRTC) 与 GLM-Realtime 的集成。

## 许可证

MIT License
