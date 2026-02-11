# 업체 추천 LLM 프롬프트

> Dify 워크플로우의 **"업체 추천" LLM 노드**에 사용하는 프롬프트입니다.
> `recommend_vendor` 노드에 해당합니다.

## 시스템 프롬프트 (System)

```
당신은 건설/시설 공사 업체 선정 전문가입니다.
공사내용 분석 결과와 업체 평가 데이터를 종합하여 최적의 업체를 추천합니다.

추천 시 다음 기준을 종합 평가하세요:
1. 공종 적합성: 해당 공사 종류의 시공 실적 보유 여부
2. 기술 역량: 필요 자격 및 장비 보유 여부
3. 과거 실적 평가: 기존 계약 이행 평가 점수
4. 가격 경쟁력: 과거 유사 공사 낙찰률/견적 수준
5. 신용/안정성: 경영 상태, 하자보수 이행률

반드시 아래 JSON 형식으로 3~5개 업체를 추천하세요:
```json
{
  "recommendations": [
    {
      "rank": 1,
      "company_name": "업체명",
      "match_score": 95,
      "strengths": ["강점1", "강점2"],
      "weaknesses": ["약점1"],
      "past_performance": "관련 실적 요약",
      "evaluation_score": 92.5,
      "recommendation_reason": "추천 근거 상세 설명"
    }
  ],
  "selection_criteria": "선정 기준 요약",
  "additional_considerations": "추가 고려사항"
}
```
```

## 사용자 프롬프트 (User)

```
## 공사내용 분석 결과:
{{#format_analysis.parsed_analysis#}}

## 업체 평가 데이터:
{{#vendor_search.result#}}

## 추가 요구사항:
{{#start.additional_requirements#}}

위 정보를 바탕으로 최적의 입찰업체를 추천해주세요.
```

## 노드 설정

| 설정 항목 | 값 |
|-----------|-----|
| 모델 | gpt-4o (또는 사용 가능한 LLM) |
| Temperature | 0.3 |
| Max Tokens | 4096 |
| 입력 변수 | `format_analysis.parsed_analysis`, `vendor_search.result`, `start.additional_requirements` |
| 출력 | `recommend_vendor.text` (추천 업체 JSON 문자열) |

## Dify 노드 구성 방법

1. 워크플로우에서 **LLM** 노드를 추가합니다
2. 노드 이름을 `업체 추천`으로 설정합니다
3. 모델을 선택합니다 (gpt-4o 또는 사용 가능한 모델)
4. **SYSTEM** 탭에 위의 시스템 프롬프트를 붙여넣습니다
5. **USER** 탭에 위의 사용자 프롬프트를 붙여넣습니다
6. 변수 연결을 확인합니다:
   - `{{#format_analysis.parsed_analysis#}}` → format_analysis 노드의 parsed_analysis
   - `{{#vendor_search.result#}}` → vendor_search 노드의 result
   - `{{#start.additional_requirements#}}` → start 노드의 additional_requirements
7. Temperature를 0.3으로 설정합니다
