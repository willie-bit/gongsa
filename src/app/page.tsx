"use client";

import { useState, useCallback, useRef } from "react";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  upload_file_id: string;
  mimeType: string;
}

interface ErrorInfo {
  message: string;
  solution: string;
  detail?: string;
}

interface WorkflowResult {
  id: string;
  workflow_id: string;
  status: string;
  outputs: Record<string, string>;
  total_steps: number;
  total_tokens: number;
  elapsed_time: number;
  created_at: string;
  finished_at: string;
}

const ALLOWED_EXTENSIONS = [
  "txt", "md", "markdown", "pdf", "html", "xlsx", "xls", "docx", "csv",
  "eml", "msg", "pptx", "ppt", "xml", "epub",
  "jpg", "jpeg", "png", "gif", "webp", "svg",
  "mp3", "m4a", "wav", "webm", "amr",
  "mp4", "mov", "mpeg", "mpga",
];

function getFileTypeCategory(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const docTypes = ["txt", "md", "markdown", "pdf", "html", "xlsx", "xls", "docx", "csv", "eml", "msg", "pptx", "ppt", "xml", "epub"];
  const imageTypes = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
  const audioTypes = ["mp3", "m4a", "wav", "webm", "amr"];
  const videoTypes = ["mp4", "mov", "mpeg", "mpga"];

  if (docTypes.includes(ext)) return "document";
  if (imageTypes.includes(ext)) return "image";
  if (audioTypes.includes(ext)) return "audio";
  if (videoTypes.includes(ext)) return "video";
  return "custom";
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFileIcon(filename: string): string {
  const category = getFileTypeCategory(filename);
  switch (category) {
    case "document": return "doc";
    case "image": return "img";
    case "audio": return "audio";
    case "video": return "video";
    default: return "file";
  }
}

export default function Dashboard() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"blocking" | "streaming">("blocking");
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError({
        message: `지원하지 않는 파일 형식입니다: .${ext}`,
        solution: `지원 형식: ${ALLOWED_EXTENSIONS.join(", ")}`,
      });
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("user", "dashboard-user");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setError({
          message: data.message || "파일 업로드에 실패했습니다.",
          solution: data.solution || "다시 시도해주세요.",
          detail: typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail),
        });
        return;
      }

      const uploadedFile: UploadedFile = {
        id: data.id,
        name: data.name || file.name,
        size: data.size || file.size,
        type: getFileTypeCategory(file.name),
        upload_file_id: data.id,
        mimeType: data.mime_type || file.type,
      };

      setUploadedFiles((prev) => [...prev, uploadedFile]);
    } catch {
      setError({
        message: "파일 업로드 중 네트워크 오류가 발생했습니다.",
        solution: "인터넷 연결을 확인하고 다시 시도해주세요.",
      });
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        Array.from(files).forEach(uploadFile);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [uploadFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = e.dataTransfer.files;
      if (files) {
        Array.from(files).forEach(uploadFile);
      }
    },
    [uploadFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const runWorkflow = useCallback(async () => {
    if (uploadedFiles.length === 0) {
      setError({
        message: "업로드된 파일이 없습니다.",
        solution: "구매요청서 파일을 먼저 업로드해주세요.",
      });
      return;
    }

    setIsRunning(true);
    setError(null);
    setResult(null);
    setStreamingText("");

    try {
      const fileIds = uploadedFiles.map((f) => ({
        upload_file_id: f.upload_file_id,
        type: f.type,
      }));

      const response = await fetch("/api/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds, mode, user: "dashboard-user" }),
      });

      if (mode === "streaming" && response.ok) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("스트림을 읽을 수 없습니다.");
        }

        let fullText = "";
        let finalResult: WorkflowResult | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const eventData = JSON.parse(line.slice(6));

                if (eventData.event === "text_chunk") {
                  const text = eventData.data?.text || "";
                  fullText += text;
                  setStreamingText(fullText);
                } else if (eventData.event === "workflow_finished") {
                  finalResult = eventData.data as WorkflowResult;
                } else if (eventData.event === "error") {
                  setError({
                    message: eventData.message || "스트리밍 중 오류가 발생했습니다.",
                    solution: "다시 시도해주세요.",
                  });
                }
              } catch {
                // skip non-JSON lines
              }
            }
          }
        }

        if (finalResult) {
          setResult(finalResult);
        }
      } else {
        const data = await response.json();

        if (!response.ok || data.error) {
          setError({
            message: data.message || "워크플로우 실행에 실패했습니다.",
            solution: data.solution || "다시 시도해주세요.",
            detail: typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail),
          });
          return;
        }

        setResult(data);
      }
    } catch (err) {
      setError({
        message: "워크플로우 실행 중 오류가 발생했습니다.",
        solution: "네트워크 연결을 확인하고 다시 시도해주세요.",
        detail: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsRunning(false);
    }
  }, [uploadedFiles, mode]);

  const resetAll = useCallback(() => {
    setUploadedFiles([]);
    setResult(null);
    setStreamingText("");
    setError(null);
  }, []);

  const emailOutput = result?.outputs?.["이메일 최종"] || streamingText;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14,2 14,8 20,8" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">MISO 워크플로우</h1>
              <p className="text-xs text-muted">구매요청서 이메일 생성</p>
            </div>
          </div>
          <a
            href="https://gsenergy.miso.gs/module/9LxW1TUoDPGHaDkG"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted hover:text-primary transition-colors"
          >
            앱 바로가기 &rarr;
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Input */}
          <div className="space-y-6">
            {/* File Upload */}
            <section className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-sm font-semibold text-foreground mb-1">구매요청서 업로드</h2>
              <p className="text-xs text-muted mb-4">
                처리할 구매요청서 파일을 업로드해주세요
              </p>

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                  transition-all duration-200
                  ${isDragOver
                    ? "border-primary bg-drop-zone"
                    : "border-border hover:border-drop-zone-border hover:bg-drop-zone/50"
                  }
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",")}
                />
                <div className="flex flex-col items-center gap-2">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-muted">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="17,8 12,3 7,8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p className="text-sm text-muted">
                    {isUploading ? (
                      <span className="text-primary font-medium">업로드 중...</span>
                    ) : (
                      <>
                        파일을 여기에 끌어놓거나{" "}
                        <span className="text-primary font-medium">클릭하여 선택</span>
                      </>
                    )}
                  </p>
                  <p className="text-xs text-muted/70">
                    PDF, DOCX, XLSX, CSV, 이미지 등 지원
                  </p>
                </div>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between bg-background rounded-lg px-3 py-2 animate-fade-in"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex-shrink-0 w-7 h-7 rounded bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold uppercase">
                          {getFileIcon(file.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm text-foreground truncate">{file.name}</p>
                          <p className="text-xs text-muted">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="flex-shrink-0 p-1 text-muted hover:text-error transition-colors"
                        title="파일 제거"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Settings & Action */}
            <section className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4">실행 설정</h2>

              <div className="space-y-4">
                {/* Mode Selection */}
                <div>
                  <label className="text-xs font-medium text-muted mb-2 block">응답 모드</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMode("blocking")}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        mode === "blocking"
                          ? "bg-primary text-white"
                          : "bg-background text-muted border border-border hover:border-primary/30"
                      }`}
                    >
                      Blocking
                    </button>
                    <button
                      onClick={() => setMode("streaming")}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        mode === "streaming"
                          ? "bg-primary text-white"
                          : "bg-background text-muted border border-border hover:border-primary/30"
                      }`}
                    >
                      Streaming
                    </button>
                  </div>
                  <p className="text-xs text-muted mt-1.5">
                    {mode === "blocking"
                      ? "모든 처리가 완료된 후 결과를 한 번에 반환합니다."
                      : "SSE를 활용하여 결과를 실시간으로 반환합니다."}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={runWorkflow}
                    disabled={isRunning || uploadedFiles.length === 0}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      isRunning || uploadedFiles.length === 0
                        ? "bg-primary/40 text-white/70 cursor-not-allowed"
                        : "bg-primary text-white hover:bg-primary-hover active:scale-[0.98]"
                    }`}
                  >
                    {isRunning ? (
                      <>
                        <span className="inline-flex gap-0.5">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse-dot" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse-dot" style={{ animationDelay: "300ms" }} />
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse-dot" style={{ animationDelay: "600ms" }} />
                        </span>
                        처리 중
                      </>
                    ) : (
                      "워크플로우 실행"
                    )}
                  </button>
                  <button
                    onClick={resetAll}
                    disabled={isRunning}
                    className="py-2.5 px-4 rounded-lg text-sm font-medium border border-border text-muted hover:text-foreground hover:border-foreground/20 transition-all disabled:opacity-40"
                  >
                    초기화
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column - Output */}
          <div className="space-y-6">
            {/* Error Display */}
            {error && (
              <section className="bg-error-bg border border-error-border rounded-xl p-5 animate-fade-in">
                <div className="flex items-start gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-error flex-shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="12" cy="16" r="1" fill="currentColor" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-error">{error.message}</p>
                    <p className="text-sm text-error/80 mt-1">{error.solution}</p>
                    {error.detail && (
                      <details className="mt-2">
                        <summary className="text-xs text-error/60 cursor-pointer hover:text-error/80">
                          상세 정보
                        </summary>
                        <pre className="mt-1 text-xs text-error/60 bg-error/5 rounded p-2 overflow-auto max-h-32 font-mono">
                          {error.detail}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Result Display */}
            <section className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">이메일 최종 결과</h2>
                {result && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success-bg px-2 py-0.5 rounded-full border border-success-border">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                    완료
                  </span>
                )}
              </div>

              {emailOutput ? (
                <div className="animate-fade-in">
                  <div className="bg-background rounded-lg p-4 max-h-[500px] overflow-auto">
                    <pre className="text-sm text-foreground whitespace-pre-wrap break-words font-sans leading-relaxed">
                      {emailOutput}
                    </pre>
                  </div>

                  {/* Copy Button */}
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(emailOutput);
                      }}
                      className="text-xs text-muted hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      복사
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted">
                  {isRunning ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="inline-flex gap-1">
                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse-dot" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse-dot" style={{ animationDelay: "300ms" }} />
                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse-dot" style={{ animationDelay: "600ms" }} />
                      </div>
                      <p className="text-sm">워크플로우를 실행하고 있습니다...</p>
                    </div>
                  ) : (
                    <>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="mb-3 opacity-30">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <p className="text-sm">구매요청서를 업로드하고 실행하면</p>
                      <p className="text-sm">이메일 결과가 여기에 표시됩니다</p>
                    </>
                  )}
                </div>
              )}
            </section>

            {/* Metadata */}
            {result && (
              <section className="bg-card rounded-xl border border-border p-6 animate-fade-in">
                <h2 className="text-sm font-semibold text-foreground mb-3">실행 정보</h2>
                <div className="grid grid-cols-2 gap-3">
                  <MetaItem label="상태" value={result.status === "succeeded" ? "성공" : result.status} />
                  <MetaItem label="총 스텝" value={`${result.total_steps}단계`} />
                  <MetaItem label="소요 시간" value={`${result.elapsed_time?.toFixed(2) || "-"}초`} />
                  <MetaItem label="토큰 사용" value={`${result.total_tokens?.toLocaleString() || "0"}`} />
                  <MetaItem label="Workflow ID" value={result.workflow_id || "-"} mono />
                  <MetaItem label="Run ID" value={result.id || "-"} mono />
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between text-xs text-muted">
          <span>MISO Workflow Dashboard</span>
          <a
            href="https://gsenergy.miso.gs/module/9LxW1TUoDPGHaDkG"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            Powered by MISO
          </a>
        </div>
      </footer>
    </div>
  );
}

function MetaItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-background rounded-lg px-3 py-2">
      <p className="text-xs text-muted">{label}</p>
      <p className={`text-sm text-foreground mt-0.5 truncate ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </p>
    </div>
  );
}
