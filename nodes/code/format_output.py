"""
최종 결과 포맷팅 Code 노드
==========================
Dify 워크플로우의 "최종 결과 포맷팅" Code 노드에 사용합니다.
분석 결과와 업체 추천 결과를 통합하여 최종 JSON을 생성합니다.

[노드 설정]
- 노드 타입: Code
- 언어: Python3
- 입력 변수:
    analysis_json (String)       ← format_analysis 노드의 parsed_analysis
    recommendation_text (String) ← recommend_vendor 노드의 text
    construction_type (String)   ← format_analysis 노드의 construction_type
    estimated_budget (String)    ← format_analysis 노드의 estimated_budget
- 출력 변수:
    result_json (String)   - 최종 통합 결과 JSON 문자열
    is_high_value (Boolean) - 고액 계약 여부 (알림 조건)
    top_vendor (String)     - 1순위 추천 업체명
"""

import json
import re
from datetime import datetime


def main(
    analysis_json: str,
    recommendation_text: str,
    construction_type: str,
    estimated_budget: str
) -> dict:
    """분석 결과와 추천 결과를 최종 JSON으로 통합합니다."""

    # ── 1. 분석 결과 파싱 ──
    try:
        analysis = json.loads(analysis_json)
    except json.JSONDecodeError:
        analysis = {"error": "분석 결과 파싱 실패"}

    # ── 2. 추천 결과 파싱 ──
    try:
        json_match = re.search(
            r'```json\s*(.*?)\s*```', recommendation_text, re.DOTALL
        )
        if json_match:
            recommendation = json.loads(json_match.group(1))
        else:
            json_match = re.search(r'\{.*\}', recommendation_text, re.DOTALL)
            if json_match:
                recommendation = json.loads(json_match.group(0))
            else:
                recommendation = {
                    "error": "추천 결과 파싱 실패",
                    "raw": recommendation_text[:500]
                }
    except (json.JSONDecodeError, AttributeError):
        recommendation = {"error": "추천 결과 파싱 실패"}

    # ── 3. 고액 계약 여부 판별 ──
    is_high_value = _check_high_value(estimated_budget)

    # ── 4. 1순위 업체명 추출 ──
    recommendations_list = recommendation.get("recommendations", [])
    if recommendations_list:
        top_vendor = recommendations_list[0].get("company_name", "해당없음")
    else:
        top_vendor = "추천 업체 없음"

    # ── 5. 최종 결과 조합 ──
    final_result = {
        "status": "success",
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "analysis": analysis,
        "recommendation": recommendation,
        "metadata": {
            "construction_type": construction_type,
            "estimated_budget": estimated_budget,
            "is_high_value_contract": is_high_value,
            "recommended_vendor_count": len(recommendations_list)
        }
    }

    return {
        "result_json": json.dumps(final_result, ensure_ascii=False, indent=2),
        "is_high_value": is_high_value,
        "top_vendor": top_vendor
    }


def _check_high_value(budget_str: str) -> bool:
    """
    예상 금액 문자열에서 고액 계약 여부를 판별합니다.
    기준: 1억원 이상이면 고액 계약으로 분류
    """
    cleaned = budget_str.replace(",", "").replace(" ", "")

    # "억" 단위 포함 시 고액
    if "억" in cleaned:
        return True

    # 숫자만 추출하여 금액 판별
    numbers = re.findall(r'[\d.]+', cleaned)
    for num_str in numbers:
        try:
            num = float(num_str)
            # "만" 단위에서 10000만원 = 1억
            if "만" in cleaned and num >= 10000:
                return True
            # 원 단위에서 1억 = 100,000,000
            if num >= 100000000:
                return True
        except ValueError:
            continue

    return False
