---
name: audio-transcription
description: Add audio upload, transcription, and transcript display to a web app. TRIGGER when user wants to add speech-to-text, build audio transcription feature, or integrate Whisper into their app. DO NOT TRIGGER when user just needs to transcribe a local file once (use a CLI tool instead).
tags: [backend, workflow, transcription, speech-to-text, audio-processing]
version: 1.0.0
languages: all
user-invocable: true
allowed-tools: "Read, Write, Edit, Bash, Grep"
---

# 音訊轉錄整合

在 Web App 中完整實現音訊上傳 → 語音辨識 → 逐字稿顯示的功能。

**何時使用**：需要在應用中加入語音轉文字功能、建立音檔上傳和轉錄流程，或整合 OpenAI Whisper / faster-whisper。

**不使用此技能**：只是想一次性轉錄本地音檔用於個人使用（改用 CLI 工具）。

## 核心架構

三層構成：
1. **後端 API**：處理音檔上傳、轉錄、結果儲存
2. **轉錄引擎**：faster-whisper（本地，5 倍快速）→ openai-whisper（備選）→ OpenAI API（無 GPU）
3. **前端**：音檔上傳、進度追蹤、逐字稿編輯

## 後端設定

### 環境檢查

```bash
# 檢查可用的轉錄引擎
python3 -c "import faster_whisper; print('faster-whisper available')" 2>/dev/null || \
python3 -c "import whisper; print('openai-whisper available')" 2>/dev/null || \
echo "no local engine — will use OpenAI API"

# 檢查 ffmpeg（處理多種音訊格式）
command -v ffmpeg &>/dev/null && echo "ffmpeg available" || echo "missing"
```

### 依賴安裝

根據選擇的引擎安裝對應套件：

```bash
# 最佳選擇：faster-whisper（4–5 倍更快）
pip install faster-whisper

# 備選：openai-whisper（更相容但較慢）
pip install openai-whisper

# API 調用（不需本地 GPU）
pip install openai

# 音檔處理
pip install python-multipart pydantic

# 系統依賴（Linux/WSL2）
sudo apt-get install ffmpeg
```

## FastAPI 實現

### 轉錄服務模組

建立 `services/transcription.py`：

```python
import os
import tempfile
import asyncio
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


class TranscriptionEngine:
    """統一的轉錄引擎介面——自動選擇可用的後端。"""

    def __init__(self):
        self.engine_type = self._detect_engine()
        if self.engine_type == "faster_whisper":
            from faster_whisper import WhisperModel
            self.model = WhisperModel("base", device="cpu", compute_type="int8")
        elif self.engine_type == "whisper":
            import whisper
            self.model = whisper.load_model("base")

    def _detect_engine(self) -> str:
        """優先順序：faster-whisper → whisper → OpenAI API"""
        try:
            import faster_whisper
            logger.info("Using faster-whisper engine")
            return "faster_whisper"
        except ImportError:
            pass

        try:
            import whisper
            logger.info("Using openai-whisper engine")
            return "whisper"
        except ImportError:
            pass

        logger.info("Using OpenAI API engine (requires OPENAI_API_KEY)")
        return "openai_api"

    async def transcribe(self, file_path: str) -> dict:
        """轉錄音檔並返回結果。"""
        return await asyncio.to_thread(self._transcribe_sync, file_path)

    def _transcribe_sync(self, file_path: str) -> dict:
        """同步轉錄——處理所有三種引擎。"""
        if self.engine_type == "faster_whisper":
            return self._transcribe_faster_whisper(file_path)
        elif self.engine_type == "whisper":
            return self._transcribe_whisper(file_path)
        else:
            return self._transcribe_openai_api(file_path)

    def _transcribe_faster_whisper(self, file_path: str) -> dict:
        """faster-whisper 實現."""
        try:
            segments, info = self.model.transcribe(file_path, language="zh")
            transcript = " ".join(s.text.strip() for s in segments)
            return {
                "success": True,
                "transcript": transcript,
                "duration": info.duration,
                "language": info.language or "unknown",
                "engine": "faster-whisper",
            }
        except Exception as e:
            logger.error(f"faster-whisper error: {e}")
            return {"success": False, "error": str(e)}

    def _transcribe_whisper(self, file_path: str) -> dict:
        """openai-whisper 實現."""
        try:
            result = self.model.transcribe(file_path, language="zh")
            return {
                "success": True,
                "transcript": result["text"],
                "duration": 0,
                "language": result.get("language", "unknown"),
                "engine": "openai-whisper",
            }
        except Exception as e:
            logger.error(f"openai-whisper error: {e}")
            return {"success": False, "error": str(e)}

    def _transcribe_openai_api(self, file_path: str) -> dict:
        """OpenAI API 實現——需要 OPENAI_API_KEY 環境變數。"""
        try:
            import openai

            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                return {
                    "success": False,
                    "error": "OPENAI_API_KEY environment variable not set",
                }

            client = openai.OpenAI(api_key=api_key)
            with open(file_path, "rb") as f:
                result = client.audio.transcriptions.create(
                    model="whisper-1", file=f, language="zh"
                )
            return {
                "success": True,
                "transcript": result.text,
                "duration": 0,
                "language": "zh",
                "engine": "openai-api",
            }
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return {"success": False, "error": str(e)}


# 全域引擎實例
_engine = None


def get_engine() -> TranscriptionEngine:
    """懶加載轉錄引擎。"""
    global _engine
    if _engine is None:
        _engine = TranscriptionEngine()
    return _engine
```

### FastAPI 路由

在 `routers/transcription.py` 中添加：

```python
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from pydantic import BaseModel
import tempfile
import os
from services.transcription import get_engine

router = APIRouter(prefix="/api/transcribe", tags=["transcription"])

class TranscriptResponse(BaseModel):
    transcript: str
    duration: float
    language: str
    engine: str


@router.post("/upload", response_model=TranscriptResponse)
async def upload_and_transcribe(audio: UploadFile = File(...)):
    """上傳音檔並進行轉錄。"""
    # 驗證檔案類型
    allowed_types = {
        "audio/mpeg",
        "audio/wav",
        "audio/mp4",
        "audio/webm",
        "audio/ogg",
        "audio/flac",
        "audio/x-m4a",
    }
    if audio.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"不支援的音檔格式：{audio.content_type}。" 
                   f"支援：{', '.join(allowed_types)}"
        )

    # 驗證檔案大小（最多 25MB）
    content = await audio.read()
    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="音檔超過 25MB")

    # 寫入臨時檔案
    suffix = os.path.splitext(audio.filename or "audio.mp3")[1] or ".mp3"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        engine = get_engine()
        result = await engine.transcribe(tmp_path)
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])

        return TranscriptResponse(
            transcript=result["transcript"],
            duration=result["duration"],
            language=result["language"],
            engine=result["engine"],
        )
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


@router.post("/batch")
async def batch_transcribe(
    files: list[UploadFile] = File(...), background_tasks: BackgroundTasks = None
):
    """批次轉錄多個音檔（非同步背景處理）。"""
    # 簡化實現：立即返回，背景處理
    job_id = f"job_{os.urandom(8).hex()}"
    
    # 實際應用應將任務排隊並儲存到 DB
    background_tasks.add_task(_process_batch, files, job_id)
    
    return {"job_id": job_id, "status": "queued", "file_count": len(files)}


async def _process_batch(files: list[UploadFile], job_id: str):
    """背景處理批次轉錄。"""
    engine = get_engine()
    results = []
    for audio in files:
        content = await audio.read()
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        try:
            result = await engine.transcribe(tmp_path)
            results.append({
                "filename": audio.filename,
                "success": result.get("success", False),
                "transcript": result.get("transcript", ""),
                "error": result.get("error"),
            })
        finally:
            os.unlink(tmp_path)
    
    # 實際應用應將結果儲存到 DB，並通知客戶端
    # db.save_batch_result(job_id, results)
```

## React/Next.js 前端實現

### 音檔上傳組件

建立 `components/AudioUpload.tsx`：

```tsx
"use client";
import React, { useRef, useState } from "react";

interface AudioUploadProps {
  onTranscript: (transcript: string, metadata: any) => void;
  onError?: (error: string) => void;
}

export function AudioUpload({ onTranscript, onError }: AudioUploadProps) {
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    // 驗證檔案大小（25MB）
    if (file.size > 25 * 1024 * 1024) {
      const err = `檔案過大（${(file.size / 1024 / 1024).toFixed(1)}MB）——上限 25MB`;
      setErrorMsg(err);
      onError?.(err);
      return;
    }

    setStatus("uploading");
    setProgress(0);
    setErrorMsg("");

    const form = new FormData();
    form.append("audio", file);

    try {
      // 使用 XMLHttpRequest 以追蹤上傳進度
      const response = await uploadWithProgress(form);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || response.statusText);
      }

      setStatus("done");
      onTranscript(data.transcript, {
        duration: data.duration,
        language: data.language,
        engine: data.engine,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "轉錄失敗";
      setErrorMsg(msg);
      setStatus("error");
      onError?.(msg);
    }
  }

  function uploadWithProgress(form: FormData): Promise<Response> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setStatus("uploading");
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener("load", () => {
        setStatus("processing");
        // 完整回應包含轉錄結果
        if (xhr.status === 200) {
          resolve(
            new Response(xhr.responseText, {
              status: xhr.status,
              statusText: xhr.statusText,
            })
          );
        } else {
          reject(
            new Response(xhr.responseText, {
              status: xhr.status,
              statusText: xhr.statusText,
            })
          );
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("網路錯誤"));
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("已取消"));
      });

      xhr.open("POST", "/api/transcribe/upload");
      xhr.send(form);
    });
  }

  return (
    <div className="max-w-lg mx-auto p-6 border border-slate-200 rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700">
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        disabled={status === "uploading" || status === "processing"}
      />

      <div className="space-y-4">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={status === "uploading" || status === "processing"}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium 
                     hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed 
                     transition-colors"
        >
          {status === "uploading"
            ? `上傳中… ${progress}%`
            : status === "processing"
              ? "轉錄中…"
              : "選擇音檔"}
        </button>

        {status === "uploading" && (
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {status === "done" && (
          <p className="text-green-600 font-medium text-center">✓ 轉錄成功</p>
        )}

        {status === "error" && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-200">
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 逐字稿編輯器

建立 `components/TranscriptEditor.tsx`：

```tsx
"use client";
import { useState, useCallback } from "react";

interface TranscriptEditorProps {
  initial: string;
  onSave?: (text: string) => Promise<void>;
}

export function TranscriptEditor({ initial, onSave }: TranscriptEditorProps) {
  const [text, setText] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave?.(text);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  }, [text, onSave]);

  return (
    <div className="max-w-4xl mx-auto space-y-3">
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSaved(false);
        }}
        placeholder="轉錄結果將顯示在此…"
        className="w-full min-h-64 p-4 border border-slate-300 dark:border-slate-600 
                   rounded-lg font-mono text-sm resize-none 
                   bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {wordCount} 字 · {text.length} 字元
        </span>

        <div className="flex gap-2 items-center">
          {saved && <span className="text-xs text-green-600 font-medium">✓ 已儲存</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg 
                       hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed 
                       transition-colors font-medium"
          >
            {saving ? "儲存中…" : "儲存逐字稿"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 完整頁面整合

在 Next.js 應用中（如 `app/transcribe/page.tsx`）：

```tsx
"use client";
import { useState } from "react";
import { AudioUpload } from "@/components/AudioUpload";
import { TranscriptEditor } from "@/components/TranscriptEditor";

export default function TranscribePage() {
  const [transcript, setTranscript] = useState("");
  const [metadata, setMetadata] = useState(null);

  const handleTranscript = (text: string, meta: any) => {
    setTranscript(text);
    setMetadata(meta);
  };

  const handleSave = async (text: string) => {
    // 實際應用應將逐字稿儲存到後端
    const response = await fetch("/api/transcribe/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript: text, ...metadata }),
    });
    if (!response.ok) throw new Error("Save failed");
  };

  return (
    <main className="py-12 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-12">音訊轉錄工具</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-semibold mb-4">1. 上傳音檔</h2>
            <AudioUpload onTranscript={handleTranscript} />
            {metadata && (
              <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-600 dark:text-slate-400">
                <p>引擎：{metadata.engine}</p>
                <p>語言：{metadata.language}</p>
                <p>長度：{metadata.duration.toFixed(1)}s</p>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">2. 編輯逐字稿</h2>
            {transcript ? (
              <TranscriptEditor initial={transcript} onSave={handleSave} />
            ) : (
              <div className="p-8 border-2 border-dashed border-slate-300 rounded-lg text-center text-slate-500">
                上傳音檔後，逐字稿將出現在此
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
```

## 常見問題與解決方案

| 問題 | 原因 | 解決方案 |
|------|------|--------|
| `ffmpeg not found` | 缺少音檔處理工具 | `sudo apt-get install ffmpeg`（Linux/WSL2）|
| 轉錄很慢 | 使用了 openai-whisper 或較大模型 | 改用 `faster-whisper` 或用 `tiny` 模型 |
| 上傳超時 | 大檔案上傳時間過長 | 增加 FastAPI `timeout` 或分塊上傳 |
| 中文辨識差 | 未指定語言 | 在轉錄時加 `language="zh"` 參數 |
| 記憶體溢出 | GPU 記憶體不足 | 用 `device="cpu", compute_type="int8"` |
| `OPENAI_API_KEY` 錯誤 | 未設定環境變數 | 匯出 `export OPENAI_API_KEY=sk-...` 或寫入 `.env` |
| 前端上傳卡住 | CORS 政策限制 | 後端需要設定 `CORSMiddleware` 允許前端原點 |

## 調試與監控

### 啟用詳細日誌

```python
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("services.transcription")
```

### 性能基準

在筆記本電腦（Intel i7, 16GB RAM）上的典型耗時：

| 引擎 | 模型 | 1 分鐘音檔 | 備註 |
|------|------|-----------|------|
| faster-whisper | base | 8–12s | 推薦 |
| openai-whisper | base | 40–60s | 較慢 |
| OpenAI API | whisper-1 | 2–5s | 需付費 + 網路延遲 |

### 批次轉錄優化

對於多個音檔，使用 `batch` 端點和背景處理可顯著提升吞吐量：

```python
# 錯誤：阻塞等待每個檔案
for file in files:
    result = transcribe(file)  # 串列化

# 正確：並行處理
async def process_batch_parallel(files):
    tasks = [transcribe(f) for f in files]
    results = await asyncio.gather(*tasks)
```

## 後續擴展

- **用戶管理**：支援多用戶轉錄歷史
- **逐字稿編輯儲存**：建立 DB schema 儲存版本歷史
- **即時字幕**：串流音檔邊播邊轉錄（WebSocket）
- **AI 總結**：轉錄後自動摘要要點
- **多語言**：支援自動語言偵測
