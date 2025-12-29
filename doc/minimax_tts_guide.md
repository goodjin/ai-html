# MiniMax 语音合成 (TTS) 使用指南

MiniMax 提供了业界领先的语音合成大模型，支持高度拟人化、富有情感的语音生成。为了方便开发者接入，MiniMax 提供了 **OpenAI 兼容接口**，这意味着你可以直接使用标准的 OpenAI SDK 或类似的 HTTP 请求逻辑来调用。

## 1. 接口基本信息

- **Base URL**: `https://api.minimax.chat/v1`
- **完整端点**: `https://api.minimax.chat/v1/audio/speech`
- **认证方式**: 在请求头中携带 `Authorization: Bearer <Your_API_Key>`

## 2. 请求参数 (OpenAI 兼容格式)

请求采用 `POST` 方式，内容类型为 `application/json`。

| 参数名 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| `model` | String | 是 | 模型名称。推荐使用 `speech-01` (稳定) 或 `speech-02` (最新高质量)。 |
| `input` | String | 是 | 需要转换成语音的文本内容。支持长文本。 |
| `voice` | String | 是 | 发音人 ID。具体见下方发音人列表。 |
| `response_format` | String | 否 | 返回的音频格式，如 `mp3` (默认), `wav`, `pcm` 等。 |
| `speed` | Number | 否 | 语速，范围通常为 0.25 到 4.0，默认为 1.0。 |

## 3. 推荐发音人 (Voice ID)

MiniMax 提供了丰富的音色供选择，以下是一些常用的内置音色：

| Voice ID | 描述 | 特点 |
| :--- | :--- | :--- |
| `male-qn-qingse` | 青涩青年音 | 自然、阳光 |
| `female-shaonv` | 甜美少女音 | 活泼、可爱 |
| `female-yujie` | 成熟御姐音 | 稳重、大方 |
| `presenter` | 播音员 | 商务、正式 |
| `audiobook_male_1` | 有声书男声 | 适合长文本朗读 |
| `audiobook_female_1` | 有声书女声 | 适合长文本朗读 |

## 4. 最佳实践

1. **错误处理**: 如果遇到 401 错误，请检查 API Key 是否正确；如果遇到 429 错误，说明触发了频率限制。
2. **长文本处理**: `speech-02` 模型对长文本的支持非常好，最高支持单次 20 万字符（视具体配置而定）。
3. **流式传输**: 接口支持流式返回音频数据，可以实现亚秒级的首包响应，提升用户体验。

## 5. 示例请求 (Curl)

```bash
curl https://api.minimax.chat/v1/audio/speech \
  -H "Authorization: Bearer YOUR_MINIMAX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "speech-01",
    "input": "你好，欢迎使用 MiniMax 语音合成服务。",
    "voice": "male-qn-qingse"
  }' \
  --output output.mp3
```
