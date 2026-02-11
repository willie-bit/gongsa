# 파라미터 추출 설정

> Dify 워크플로우의 **"분석 결과 파싱" Code 노드**에 대한 설명입니다.
> `format_analysis` 노드에 해당합니다.
>
> 이 노드는 LLM이 생성한 분석 텍스트에서 구조화된 JSON 데이터를 추출하고,
> 후속 노드(업체 검색, 알림 판별)에 필요한 파라미터를 정리합니다.

## 입력 변수

| 변수명 | 소스 | 설명 |
|--------|------|------|
| `analysis_text` | `analyze_document.text` | LLM 공사내용 분석 결과 텍스트 |

## 출력 변수

| 변수명 | 타입 | 설명 |
|--------|------|------|
| `parsed_analysis` | string | 파싱된 분석 결과 JSON 문자열 |
| `construction_type` | string | 공사 종류 (건축, 토목, 기계 등) |
| `search_query` | string | Knowledge Base 검색용 쿼리 |
| `is_valid` | boolean | 파싱 성공 여부 |
| `estimated_budget` | string | 예상 금액 범위 |

## 코드

> 아래 Python 코드를 Dify의 Code 노드에 붙여넣으세요.
> 전체 코드는 `nodes/code/format_analysis.py`를 참조하세요.

## Dify 노드 구성 방법

1. 워크플로우에서 **코드(Code)** 노드를 추가합니다
2. 노드 이름을 `분석 결과 파싱`으로 설정합니다
3. 언어를 **Python3**로 선택합니다
4. 입력 변수 설정:
   - `analysis_text` → `analyze_document` 노드의 `text` 출력과 연결
5. 출력 변수 설정:
   - `parsed_analysis` (String)
   - `construction_type` (String)
   - `search_query` (String)
   - `is_valid` (Boolean)
   - `estimated_budget` (String)
6. `nodes/code/format_analysis.py`의 코드를 코드 에디터에 붙여넣습니다
