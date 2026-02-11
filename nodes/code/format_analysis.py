"""
분석 결과 파싱 Code 노드
========================
Dify 워크플로우의 "분석 결과 파싱" Code 노드에 사용합니다.

[노드 설정]
- 노드 타입: Code
- 언어: Python3
- 입력 변수:
    analysis_text (String) ← analyze_document 노드의 text 출력
- 출력 변수:
    parsed_analysis (String)  - 파싱된 분석 결과 JSON 문자열
    construction_type (String) - 공사 종류
    search_query (String)      - Knowledge Base 검색용 쿼리
    is_valid (Boolean)         - 파싱 성공 여부
    estimated_budget (String)  - 예상 금액 범위
"""

import json
import re


def main(analysis_text: str) -> dict:
    """LLM 분석 결과에서 JSON을 추출하고 검증합니다."""
    try:
        # 1단계: JSON 블록 추출 (```json ... ``` 형태)
        json_match = re.search(r'```json\s*(.*?)\s*```', analysis_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
        else:
            # 2단계: 중괄호로 시작/끝나는 JSON 직접 추출
            json_match = re.search(r'\{.*\}', analysis_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
            else:
                # JSON을 찾을 수 없는 경우
                return {
                    "parsed_analysis": "{}",
                    "construction_type": "분석 실패",
                    "search_query": analysis_text[:200],
                    "is_valid": False,
                    "estimated_budget": "미확인"
                }

        # JSON 파싱
        parsed = json.loads(json_str)

        # 업체 검색용 쿼리 구성
        # - 공사 종류, 세부 공종, 필요 자격을 조합하여 검색 쿼리 생성
        search_parts = []
        if parsed.get("construction_type"):
            search_parts.append(parsed["construction_type"])
        for subtype in parsed.get("construction_subtypes", []):
            search_parts.append(subtype)
        for qual in parsed.get("technical_requirements", {}).get("qualifications", []):
            search_parts.append(qual)

        search_query = " ".join(search_parts) if search_parts else "일반 공사"

        # 예상 금액 추출
        estimated_budget = parsed.get("scale", {}).get(
            "estimated_budget_range", "미확인"
        )

        return {
            "parsed_analysis": json.dumps(parsed, ensure_ascii=False),
            "construction_type": parsed.get("construction_type", "미분류"),
            "search_query": search_query,
            "is_valid": True,
            "estimated_budget": estimated_budget
        }

    except (json.JSONDecodeError, AttributeError):
        return {
            "parsed_analysis": "{}",
            "construction_type": "파싱 오류",
            "search_query": analysis_text[:200],
            "is_valid": False,
            "estimated_budget": "미확인"
        }
