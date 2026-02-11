# 구매요청 자동 분석 및 업체 추천 시스템

Dify 워크플로우 기반의 구매요청서 자동 분석 및 최적 업체 추천 시스템입니다.

## 워크플로우 개요

```
[시작] → [문서 추출] → [공사내용 분석(LLM)] → [파라미터 추출] → [업체 검색(Knowledge)] → [업체 추천(LLM)] → [조건 분기] → [알림 발송] → [결과 포맷팅] → [종료]
```

## 프로젝트 구조

```
gongsa/
├── workflow/
│   └── purchase_analysis.yml       # Dify 워크플로우 DSL (import용)
├── nodes/
│   ├── code/
│   │   ├── format_analysis.py      # 분석 결과 포맷팅 Code 노드
│   │   ├── format_output.py        # 최종 출력 JSON 포맷팅 Code 노드
│   │   └── notification_check.py   # 알림 조건 판별 Code 노드
│   └── prompts/
│       ├── analyze_document.md     # 공사내용 분석 LLM 프롬프트
│       ├── parameter_extract.md    # 파라미터 추출 설정
│       └── recommend_vendor.md     # 업체 추천 LLM 프롬프트
├── knowledge_base/
│   └── vendor_evaluation.csv       # 업체 평가 데이터 샘플 (Knowledge Base 업로드용)
└── docs/
    └── setup_guide.md              # Dify 설정 가이드
```

## 입력/출력

### 입력
| 이름 | 형식 | 설명 |
|------|------|------|
| purchase_request | file | 구매요청서 문서 (PDF, DOCX) |
| additional_requirements | text | 추가 요구사항 (선택) |

### 출력
| 이름 | 형식 | 설명 |
|------|------|------|
| result | json | 공사 분석 + 추천 업체 + 선정 근거 |

## 설정 방법

1. Dify에서 새 워크플로우 생성
2. `workflow/purchase_analysis.yml`을 DSL로 import하거나, 각 노드를 수동으로 구성
3. `knowledge_base/vendor_evaluation.csv`를 Knowledge Base에 업로드
4. HTTP 요청 노드의 API 엔드포인트를 실제 환경에 맞게 수정
5. 상세 설정은 `docs/setup_guide.md` 참조
