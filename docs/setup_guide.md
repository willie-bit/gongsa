# Dify 워크플로우 설정 가이드

## 사전 준비

- Dify 계정 및 워크스페이스
- LLM 모델 API 키 설정 (OpenAI, Anthropic 등)
- (선택) Slack Webhook URL 또는 이메일 API
- (선택) Google Drive API 인증 정보

---

## 1단계: Knowledge Base 생성

1. Dify 좌측 메뉴에서 **Knowledge** 클릭
2. **Create Knowledge** 클릭
3. 이름: `업체 평가 데이터`
4. `knowledge_base/vendor_evaluation.csv` 파일 업로드
5. 인덱싱 설정:
   - Segmentation: **Automatic**
   - Indexing mode: **High Quality** (Embedding 모델 사용)
6. 생성 완료 후 **Dataset ID**를 복사해 둡니다

> Dataset ID는 Knowledge 페이지 URL에서 확인 가능합니다:
> `https://your-dify.com/knowledge/{DATASET_ID}`

---

## 2단계: 워크플로우 생성

### 방법 A: DSL 파일 Import (권장)

1. Dify 좌측 메뉴에서 **Studio** 클릭
2. **Create from DSL** 선택
3. `workflow/purchase_analysis.yml` 파일 업로드
4. Import 후 아래 항목을 수정:
   - Knowledge Retrieval 노드의 `dataset_id` → 1단계에서 복사한 ID
   - LLM 노드의 모델 → 사용 가능한 모델로 변경
   - HTTP 노드의 URL → 실제 API 엔드포인트로 변경

### 방법 B: 수동 구성

아래 순서대로 노드를 추가합니다.

---

## 3단계: 노드별 수동 구성

### 노드 1 - 시작 (Start)

워크플로우 생성 시 자동으로 추가됩니다.

**입력 변수 추가:**

| 변수명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| `purchase_request` | File | Y | 구매요청서 (PDF, DOCX, HWP) |
| `additional_requirements` | Text Input | N | 추가 요구사항 |

파일 타입 제한: `.pdf`, `.docx`, `.doc`, `.hwp`

---

### 노드 2 - 문서 텍스트 추출 (Document Extractor)

1. **Document Extractor** 노드 추가
2. 입력 파일: `start` 노드의 `purchase_request` 변수 선택
3. 출력: `doc_extractor.text` (추출된 텍스트)

---

### 노드 3 - 공사내용 분석 (LLM)

1. **LLM** 노드 추가
2. 모델 선택 (gpt-4o 등)
3. `nodes/prompts/analyze_document.md`의 프롬프트를 복사하여 설정
4. Temperature: **0.2**
5. Max Tokens: **4096**

---

### 노드 4 - 분석 결과 파싱 (Code)

1. **Code** 노드 추가
2. 언어: **Python3**
3. `nodes/code/format_analysis.py`의 코드를 전체 복사하여 붙여넣기
4. 입력 변수 설정:
   - `analysis_text` (String) → `analyze_document` 노드의 `text`
5. 출력 변수 설정:
   - `parsed_analysis` (String)
   - `construction_type` (String)
   - `search_query` (String)
   - `is_valid` (Boolean)
   - `estimated_budget` (String)

---

### 노드 5 - 업체 평가 데이터 검색 (Knowledge Retrieval)

1. **Knowledge Retrieval** 노드 추가
2. Query 변수: `format_analysis` 노드의 `search_query`
3. Knowledge Base 선택: 1단계에서 생성한 `업체 평가 데이터`
4. 설정:
   - Top K: **10**
   - Score Threshold: **0.5**
   - Retrieval Mode: **Multiple Recall**

---

### 노드 6 - 업체 추천 (LLM)

1. **LLM** 노드 추가
2. 모델 선택 (gpt-4o 등)
3. `nodes/prompts/recommend_vendor.md`의 프롬프트를 복사하여 설정
4. Temperature: **0.3**
5. Max Tokens: **4096**

---

### 노드 7 - 최종 결과 포맷팅 (Code)

1. **Code** 노드 추가
2. 언어: **Python3**
3. `nodes/code/format_output.py`의 코드를 전체 복사하여 붙여넣기
4. 입력 변수 설정:
   - `analysis_json` (String) → `format_analysis.parsed_analysis`
   - `recommendation_text` (String) → `recommend_vendor.text`
   - `construction_type` (String) → `format_analysis.construction_type`
   - `estimated_budget` (String) → `format_analysis.estimated_budget`
5. 출력 변수 설정:
   - `result_json` (String)
   - `is_high_value` (Boolean)
   - `top_vendor` (String)

---

### 노드 8 - 고액 계약 확인 (If/Else)

1. **If/Else** 노드 추가
2. 조건 설정:
   - Variable: `format_output.is_high_value`
   - Operator: **is**
   - Value: `true`
3. IF (참): → 알림 발송 노드로 연결
4. ELSE (거짓): → 결과 저장 노드로 연결

> 더 복잡한 조건이 필요하면 `nodes/code/notification_check.py`를 Code 노드로 사용하세요.

---

### 노드 9-A - 알림 발송 (HTTP Request) [선택]

1. **HTTP Request** 노드 추가
2. 설정:

**Slack Webhook 방식:**
| 항목 | 값 |
|------|-----|
| Method | POST |
| URL | `https://hooks.slack.com/services/YOUR/WEBHOOK/URL` |
| Content-Type | application/json |

Body:
```json
{
  "text": "*고액 계약 알림*\n공사 종류: {{#format_analysis.construction_type#}}\n예상 금액: {{#format_analysis.estimated_budget#}}\n추천 1순위: {{#format_output.top_vendor#}}"
}
```

**이메일 API 방식 (SendGrid 등):**
| 항목 | 값 |
|------|-----|
| Method | POST |
| URL | `https://api.sendgrid.com/v3/mail/send` |
| Authorization | Bearer YOUR_API_KEY |

---

### 노드 9-B - 결과 저장 (HTTP Request) [선택]

외부 저장소 API를 호출하여 결과를 저장합니다. 환경에 맞게 설정하세요.

---

### 노드 10 - 종료 (End)

1. **End** 노드 추가
2. 출력 변수:
   - `result` (String) → `format_output.result_json`

---

## 4단계: 노드 연결

모든 노드를 아래 순서로 연결합니다:

```
시작 → 문서 추출 → 공사내용 분석 → 분석 결과 파싱 → 업체 검색 → 업체 추천 → 결과 포맷팅 → 조건 분기
  ├─ [고액] → 알림 발송 → 결과 저장 → 종료
  └─ [일반] → 결과 저장 → 종료
```

---

## 5단계: 테스트

1. 워크플로우 우측 상단 **Preview** 클릭
2. 테스트용 구매요청서 PDF 업로드
3. 각 노드의 실행 결과를 확인
4. 최종 출력 JSON이 올바른지 검증

---

## 출력 JSON 구조 예시

```json
{
  "status": "success",
  "generated_at": "2026-02-11 10:30:00",
  "analysis": {
    "construction_type": "건축",
    "construction_subtypes": ["철근콘크리트", "리모델링"],
    "scale": {
      "estimated_budget_range": "5억 ~ 8억",
      "area": "연면적 2,000㎡",
      "duration": "6개월"
    },
    "technical_requirements": {
      "qualifications": ["종합건설업면허"],
      "special_equipment": ["타워크레인"],
      "skill_level": "상"
    },
    "location": "서울시 강남구",
    "work_items": ["구조보강", "내부 인테리어", "설비 교체"],
    "summary": "서울 강남 소재 사무실 건물 리모델링 공사로..."
  },
  "recommendation": {
    "recommendations": [
      {
        "rank": 1,
        "company_name": "한양건설",
        "match_score": 95,
        "strengths": ["리모델링 실적 다수", "높은 평가점수"],
        "evaluation_score": 92.5,
        "recommendation_reason": "..."
      }
    ],
    "selection_criteria": "공종 적합성, 과거 실적, 평가 점수 종합"
  },
  "metadata": {
    "construction_type": "건축",
    "estimated_budget": "5억 ~ 8억",
    "is_high_value_contract": true,
    "recommended_vendor_count": 3
  }
}
```
