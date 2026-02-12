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
        solution:
          "서버의 .env.local 파일에 MISO_API_KEY를 설정해주세요.",
      },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          error: true,
          message: "파일이 전달되지 않았습니다.",
          solution: "업로드할 파일을 선택해주세요.",
        },
        { status: 400 }
      );
    }

    const user = formData.get("user") as string || "dashboard-user";

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    uploadFormData.append("user", user);

    const response = await fetch(`${API_BASE_URL}/files/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
      body: uploadFormData,
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
        message: "파일 업로드 중 오류가 발생했습니다.",
        solution:
          "네트워크 연결을 확인하고 다시 시도해주세요.",
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

  if (status === 400) {
    switch (code) {
      case "invalid_param":
        return {
          message: "잘못된 파라미터가 전달되었습니다.",
          solution: "올바른 형식의 파일을 업로드해주세요.",
        };
      case "app_unavailable":
        return {
          message: "앱 설정 정보를 사용할 수 없습니다.",
          solution: "미소 앱 설정을 확인해주세요.",
        };
      default:
        return {
          message: `요청 오류가 발생했습니다: ${errorData?.message || "알 수 없는 오류"}`,
          solution: "요청 파라미터를 확인하고 다시 시도해주세요.",
        };
    }
  }

  if (status === 500) {
    return {
      message: "서버 내부 오류가 발생했습니다.",
      solution: "잠시 후 다시 시도해주세요.",
    };
  }

  return {
    message: `오류가 발생했습니다 (HTTP ${status})`,
    solution: "API 설정을 확인하고 다시 시도해주세요.",
  };
}
