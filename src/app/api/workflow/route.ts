import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.MISO_API_BASE_URL || "https://api.holdings.miso.gs/ext/v1";
const API_KEY = process.env.MISO_API_KEY || "";

export async function POST(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      {
        error: true,
        message: "MISO_API_KEY 환경변수가 설정되지 않았습니다.",
        solution: "서버의 .env.local 파일에 MISO_API_KEY를 설정해주세요.",
      },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { fileIds, mode = "blocking", user = "dashboard-user" } = body;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json(
        {
          error: true,
          message: "업로드된 파일이 없습니다.",
          solution: "구매요청서 파일을 먼저 업로드해주세요.",
        },
        { status: 400 }
      );
    }

    const purchaseRequestFiles = fileIds.map(
      (file: { upload_file_id: string; type: string }) => ({
        type: file.type,
        transfer_method: "local_file",
        upload_file_id: file.upload_file_id,
      })
    );

    const requestBody = {
      inputs: {
        purchase_request: purchaseRequestFiles,
      },
      files: [],
      mode,
      user,
    };

    if (mode === "streaming") {
      const response = await fetch(`${API_BASE_URL}/workflows/run`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = getErrorMessage(response.status, errorData);
        return NextResponse.json(
          {
            error: true,
            message: errorMessage.message,
            solution: errorMessage.solution,
            detail: errorData,
          },
          { status: response.status }
        );
      }

      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
          } finally {
            controller.close();
            reader.releaseLock();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Blocking mode
    const response = await fetch(`${API_BASE_URL}/workflows/run`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = getErrorMessage(response.status, errorData);
      return NextResponse.json(
        {
          error: true,
          message: errorMessage.message,
          solution: errorMessage.solution,
          detail: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: true,
        message: "워크플로우 실행 중 오류가 발생했습니다.",
        solution: "네트워크 연결을 확인하고 다시 시도해주세요.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

function getErrorMessage(
  status: number,
  errorData: Record<string, unknown>
): { message: string; solution: string } {
  const code = errorData?.code as string;
  const msg = (errorData?.message as string) || "";

  if (status === 400) {
    switch (code) {
      case "invalid_param":
        if (msg.toLowerCase().includes("not published")) {
          return {
            message: "앱이 아직 발행되지 않았습니다.",
            solution:
              "미소 앱 편집화면에서 저장 버튼을 눌러 앱을 발행해주세요.",
          };
        }
        return {
          message: `잘못된 파라미터가 전달되었습니다: ${msg}`,
          solution: "입력값을 확인하고 다시 시도해주세요.",
        };
      case "app_unavailable":
        return {
          message: "앱 설정 정보를 사용할 수 없습니다.",
          solution: "미소 앱 설정을 확인해주세요.",
        };
      case "provider_not_initialize":
        return {
          message: "사용 가능한 모델 인증 정보가 없습니다.",
          solution: "미소에서 모델 제공자 인증 정보를 설정해주세요.",
        };
      case "provider_quota_exceeded":
        return {
          message: "모델 호출 쿼터가 초과되었습니다.",
          solution: "쿼터를 확인하거나 잠시 후 다시 시도해주세요.",
        };
      case "model_currently_not_support":
        return {
          message: "현재 모델을 사용할 수 없습니다.",
          solution: "미소에서 다른 모델을 선택해주세요.",
        };
      case "workflow_request_error":
        return {
          message: `워크플로우 실행에 실패했습니다: ${msg}`,
          solution: "워크플로우 설정을 확인하고 다시 시도해주세요.",
        };
      default:
        return {
          message: `요청 오류가 발생했습니다: ${msg || "알 수 없는 오류"}`,
          solution: "요청 파라미터를 확인하고 다시 시도해주세요.",
        };
    }
  }

  if (status === 500) {
    return {
      message: "서버 내부 오류가 발생했습니다.",
      solution: "잠시 후 다시 시도해주세요. 문제가 지속되면 관리자에게 문의하세요.",
    };
  }

  return {
    message: `오류가 발생했습니다 (HTTP ${status})`,
    solution: "API 설정을 확인하고 다시 시도해주세요.",
  };
}
