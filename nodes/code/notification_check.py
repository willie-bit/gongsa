"""
알림 조건 판별 Code 노드 (대안용)
==================================
If/Else 노드 대신 Code 노드로 알림 조건을 판별할 때 사용합니다.
format_output 노드에 이미 is_high_value 판별이 포함되어 있으므로,
이 노드는 추가적인 알림 조건이 필요한 경우에만 사용하세요.

[사용 시나리오]
- 고액 계약 외에 추가 알림 조건이 있는 경우
- 알림 수신자를 동적으로 결정해야 하는 경우
- 여러 채널(이메일, Slack, Teams 등)로 분기해야 하는 경우

[노드 설정]
- 노드 타입: Code
- 언어: Python3
- 입력 변수:
    is_high_value (Boolean)    ← format_output 노드의 is_high_value
    construction_type (String) ← format_analysis 노드의 construction_type
    estimated_budget (String)  ← format_analysis 노드의 estimated_budget
    result_json (String)       ← format_output 노드의 result_json
- 출력 변수:
    should_notify (Boolean)       - 알림 발송 여부
    notification_level (String)   - 알림 등급 (긴급/일반/정보)
    notification_channels (String) - 알림 채널 목록 (쉼표 구분)
    notification_message (String) - 알림 메시지 본문
"""

import json


def main(
    is_high_value: bool,
    construction_type: str,
    estimated_budget: str,
    result_json: str
) -> dict:
    """알림 조건을 종합 판별하고 알림 메시지를 구성합니다."""

    should_notify = False
    notification_level = "정보"
    channels = []

    # ── 조건 1: 고액 계약 ──
    if is_high_value:
        should_notify = True
        notification_level = "긴급"
        channels.extend(["slack", "email"])

    # ── 조건 2: 특수 공종 (항상 알림) ──
    special_types = ["기계", "전기", "소방", "가스"]
    if any(st in construction_type for st in special_types):
        should_notify = True
        if notification_level != "긴급":
            notification_level = "일반"
        if "email" not in channels:
            channels.append("email")

    # ── 알림 메시지 구성 ──
    if should_notify:
        try:
            result = json.loads(result_json)
            vendor_count = result.get("metadata", {}).get(
                "recommended_vendor_count", 0
            )
            top_vendor_name = "미정"
            recs = result.get("recommendation", {}).get("recommendations", [])
            if recs:
                top_vendor_name = recs[0].get("company_name", "미정")
        except (json.JSONDecodeError, KeyError):
            vendor_count = 0
            top_vendor_name = "미정"

        message = (
            f"[{notification_level}] 구매요청 분석 완료\n"
            f"공사 종류: {construction_type}\n"
            f"예상 금액: {estimated_budget}\n"
            f"추천 업체 수: {vendor_count}개\n"
            f"1순위 업체: {top_vendor_name}\n"
            f"상세 결과를 확인하세요."
        )
    else:
        message = ""

    # 채널 기본값
    if not channels:
        channels = ["none"]

    return {
        "should_notify": should_notify,
        "notification_level": notification_level,
        "notification_channels": ",".join(channels),
        "notification_message": message
    }
