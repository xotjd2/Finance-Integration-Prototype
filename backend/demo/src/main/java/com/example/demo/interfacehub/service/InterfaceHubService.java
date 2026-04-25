package com.example.demo.interfacehub.service;

import com.example.demo.interfacehub.api.DashboardResponse;
import com.example.demo.interfacehub.api.DashboardSummary;
import com.example.demo.interfacehub.api.InterfaceUpsertRequest;
import com.example.demo.interfacehub.model.DirectionType;
import com.example.demo.interfacehub.model.Incident;
import com.example.demo.interfacehub.model.InterfaceConfig;
import com.example.demo.interfacehub.model.InterfaceStatus;
import com.example.demo.interfacehub.model.ManagedInterface;
import com.example.demo.interfacehub.model.PerformancePoint;
import com.example.demo.interfacehub.model.ProtocolSummary;
import com.example.demo.interfacehub.model.ProtocolType;
import com.example.demo.interfacehub.model.SeverityLevel;
import com.example.demo.interfacehub.model.TimelineEvent;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class InterfaceHubService {

    private final Map<String, ManagedInterface> interfaces = new LinkedHashMap<>();
    private final List<Incident> incidents = new ArrayList<>();
    private final List<TimelineEvent> timelineEvents = new ArrayList<>();
    private final AtomicInteger sequence = new AtomicInteger(7);

    @PostConstruct
    void init() {
        interfaces.put("INT-001", new ManagedInterface(
                "INT-001",
                "금감원 지급여력 보고 배치",
                "금융감독원",
                ProtocolType.BATCH,
                DirectionType.OUTBOUND,
                "매일 22:00",
                InterfaceStatus.HEALTHY,
                99.2,
                99.5,
                118,
                8.5,
                1240,
                1,
                0,
                "14분 전",
                "정상 완료",
                "배치 파일 전송 및 수신 확인 완료",
                "월말 집중 구간에는 파일 생성시간 모니터링 강화 필요",
                "재무 건전성 관련 집계 데이터를 생성하고 감독기관 제출 파일을 전송하는 배치 인터페이스",
                new InterfaceConfig("/fss/reporting/rbc", "재무시스템", "금감원", "VPN 인증", "CSV", "실패 시 2회 재전송", "0 0 22 * * *", "감독보고운영팀")
        ));
        interfaces.put("INT-002", new ManagedInterface(
                "INT-002",
                "제휴 병원 실손청구 API",
                "메디파트너 네트워크",
                ProtocolType.REST_API,
                DirectionType.BIDIRECTIONAL,
                "실시간",
                InterfaceStatus.WARNING,
                96.8,
                97.4,
                342,
                1.2,
                4832,
                12,
                7,
                "2분 전",
                "응답 지연 감지",
                "제휴사 API 응답시간 상승으로 SLA 임계치 근접",
                "피크 시간대 재시도 간격 10초 유지, 서킷브레이커 전환 검토",
                "실손 청구 접수와 결과 회신을 실시간으로 처리하는 외부 병원 연계 REST 인터페이스",
                new InterfaceConfig("/partner/hospital/claims", "청구시스템", "병원중계허브", "OAuth2", "JSON", "10초 간격 3회 재시도", "realtime", "대외연계운영팀")
        ));
        interfaces.put("INT-003", new ManagedInterface(
                "INT-003",
                "신용평가사 고객정보 조회",
                "KCB 제휴센터",
                ProtocolType.SOAP,
                DirectionType.INBOUND,
                "실시간",
                InterfaceStatus.RUNNING,
                98.7,
                98.9,
                214,
                0.8,
                3218,
                5,
                3,
                "방금 전",
                "정상 처리 중",
                "인증 토큰 갱신 정책 정상 적용",
                "심사 피크 구간에서 세션 만료 예외 로그 확인 중",
                "보험 인수 심사 단계에서 고객 신용정보를 조회하는 SOAP 인터페이스",
                new InterfaceConfig("/credit/kcb/customer", "인수심사시스템", "KCB", "인증서", "XML", "실패 시 즉시 재호출", "realtime", "신용심사플랫폼팀")
        ));
        interfaces.put("INT-004", new ManagedInterface(
                "INT-004",
                "은행 자동이체 결과 MQ 수신",
                "국민은행",
                ProtocolType.MQ,
                DirectionType.INBOUND,
                "5분 주기",
                InterfaceStatus.FAILED,
                91.4,
                93.1,
                486,
                3.4,
                1984,
                17,
                29,
                "6분 전",
                "MQ 적체로 실패",
                "채널 응답 지연으로 ACK 누락. 재처리 후보 29건 대기",
                "지점 수납 마감 시간대에 큐 depth 급증. 임계치 자동 확장 필요",
                "은행 자동이체 처리 결과를 MQ 메시지로 수신해 수납 상태를 반영하는 인터페이스",
                new InterfaceConfig("KB.AUTO.DEBIT.RESULT", "수납관리시스템", "KB MQ HUB", "채널키", "MQ 메시지", "5분 간격 재처리", "0 */5 * * * *", "수납채널운영팀")
        ));
        interfaces.put("INT-005", new ManagedInterface(
                "INT-005",
                "대리점 수수료 정산 파일 송수신",
                "영업대리점 채널",
                ProtocolType.SFTP,
                DirectionType.BIDIRECTIONAL,
                "매일 19:30",
                InterfaceStatus.HEALTHY,
                99.6,
                99.7,
                132,
                5.8,
                640,
                0,
                0,
                "33분 전",
                "정상 완료",
                "파일 checksum 검증 완료",
                "월초 정산일에는 파일 크기 증가로 전송시간 변동 가능",
                "채널 수수료 정산 데이터 파일을 SFTP로 교환하는 일 배치성 인터페이스",
                new InterfaceConfig("/sftp/agency/settlement", "정산시스템", "영업대리점", "계정키", "TXT", "실패 시 담당자 승인 후 재전송", "30 19 * * * *", "채널정산운영팀")
        ));
        interfaces.put("INT-006", new ManagedInterface(
                "INT-006",
                "보험금 심사 OCR 결과 API",
                "문서AI 제휴사",
                ProtocolType.REST_API,
                DirectionType.INBOUND,
                "실시간",
                InterfaceStatus.HEALTHY,
                99.1,
                99.0,
                167,
                0.9,
                2841,
                2,
                1,
                "1분 전",
                "정상 완료",
                "문서 판독률 안정 구간 유지",
                "서류 이미지 대용량 업로드 시 응답시간만 모니터링하면 충분",
                "OCR 처리 완료 결과를 받아 보험금 심사 시스템으로 전달하는 실시간 인터페이스",
                new InterfaceConfig("/ocr/results", "보험금심사시스템", "문서AI", "Bearer Token", "JSON", "실패 시 DLQ 적재", "realtime", "AI심사운영팀")
        ));

        incidents.add(new Incident(SeverityLevel.CRITICAL, "자동이체 결과 MQ 적체", "국민은행 수신 채널에서 ACK 누락이 발생해 29건이 대기 중입니다. 운영자 즉시 재처리 권고.", "6분 전"));
        incidents.add(new Incident(SeverityLevel.MEDIUM, "실손청구 API 지연", "제휴 병원 응답시간이 평균 340ms 수준으로 상승했습니다. SLA 임계치 350ms 근접.", "12분 전"));
        incidents.add(new Incident(SeverityLevel.LOW, "감독기관 배치 정상 완료", "지급여력 보고 배치가 예정 시간 내 완료되었습니다. 파일 무결성 검증도 통과했습니다.", "14분 전"));

        timelineEvents.add(new TimelineEvent("14:10", "재처리 정책 반영", "실손청구 인터페이스의 재시도 간격을 5초에서 10초로 상향해 외부 응답 지연을 흡수"));
        timelineEvents.add(new TimelineEvent("13:52", "금감원 보고 배치 성공", "배치 파일 생성, 전송, 수신 확인이 모두 완료되어 운영 승인 상태로 전환"));
        timelineEvents.add(new TimelineEvent("13:41", "MQ 경고 임계치 초과", "은행 자동이체 큐 depth가 20건을 넘어 경고를 발행하고 운영자 확인 대기 상태로 전환"));
    }

    public DashboardResponse getDashboard() {
        List<ManagedInterface> items = getInterfaces();
        int failed = countByStatus(items, InterfaceStatus.FAILED);
        int warning = countByStatus(items, InterfaceStatus.WARNING);
        int running = countByStatus(items, InterfaceStatus.RUNNING);
        int healthy = countByStatus(items, InterfaceStatus.HEALTHY);
        int totalTransactions = items.stream().mapToInt(ManagedInterface::todayCount).sum();
        double avgLatency = items.stream().mapToInt(ManagedInterface::avgLatencyMs).average().orElse(0);
        double avgSla = items.stream().mapToDouble(ManagedInterface::slaPercent).average().orElse(0);

        DashboardSummary summary = new DashboardSummary(items.size(), failed, warning, running, healthy, totalTransactions, avgLatency, avgSla);
        return new DashboardResponse(summary, items, List.copyOf(incidents), buildProtocolSummary(items), buildPerformanceSeries(items), List.copyOf(timelineEvents));
    }

    public List<ManagedInterface> getInterfaces() {
        return interfaces.values().stream()
                .sorted(Comparator.comparingInt(item -> statusRank(item.status())))
                .toList();
    }

    public ManagedInterface createInterface(InterfaceUpsertRequest request) {
        String id = "INT-%03d".formatted(sequence.getAndIncrement());
        ManagedInterface item = new ManagedInterface(
                id,
                request.name(),
                request.organization(),
                ProtocolType.valueOf(request.protocol()),
                DirectionType.valueOf(request.direction()),
                request.schedule(),
                InterfaceStatus.PAUSED,
                100.0,
                100.0,
                0,
                0.0,
                0,
                0,
                0,
                "미실행",
                "등록 완료",
                "초기 등록 상태",
                defaultText(request.operatorNote(), "오퍼레이터 메모 미등록"),
                request.description(),
                new InterfaceConfig(
                        request.endpoint(),
                        request.sourceSystem(),
                        request.targetSystem(),
                        request.authType(),
                        request.payloadFormat(),
                        request.retryPolicy(),
                        request.scheduleExpression(),
                        request.ownerTeam()
                )
        );
        interfaces.put(id, item);
        timelineEvents.add(0, new TimelineEvent("방금 전", "신규 인터페이스 등록", id + " " + request.name() + " 인터페이스가 운영 목록에 추가됨"));
        return item;
    }

    public ManagedInterface retry(String id) {
        ManagedInterface current = requireInterface(id);
        ManagedInterface updated = new ManagedInterface(
                current.id(),
                current.name(),
                current.organization(),
                current.protocol(),
                current.direction(),
                current.schedule(),
                InterfaceStatus.HEALTHY,
                Math.min(99.9, current.successRate() + 1.5),
                Math.min(99.9, current.slaPercent() + 0.7),
                Math.max(120, current.avgLatencyMs() - 85),
                Math.max(0.7, current.avgProcessMinutes() - 0.9),
                current.todayCount(),
                current.retryCount() + 1,
                Math.max(0, current.queueDepth() - 18),
                "방금 전",
                "정상 복구",
                "재처리 성공. 운영 안정화 상태",
                current.operatorNote(),
                current.description(),
                current.config()
        );
        interfaces.put(id, updated);
        incidents.add(0, new Incident(SeverityLevel.LOW, "재처리 완료", id + " 인터페이스가 재처리 후 정상 상태로 복구되었습니다.", "방금 전"));
        timelineEvents.add(0, new TimelineEvent("방금 전", "실패 건 재처리", id + " 인터페이스를 운영자가 재처리하여 정상 복구"));
        return updated;
    }

    public ManagedInterface updateConfig(String id, InterfaceUpsertRequest request) {
        ManagedInterface current = requireInterface(id);
        ManagedInterface updated = new ManagedInterface(
                current.id(),
                request.name(),
                request.organization(),
                ProtocolType.valueOf(request.protocol()),
                DirectionType.valueOf(request.direction()),
                request.schedule(),
                current.status(),
                current.successRate(),
                current.slaPercent(),
                current.avgLatencyMs(),
                current.avgProcessMinutes(),
                current.todayCount(),
                current.retryCount(),
                current.queueDepth(),
                current.lastRunAt(),
                current.lastResult(),
                current.errorSummary(),
                defaultText(request.operatorNote(), current.operatorNote()),
                request.description(),
                new InterfaceConfig(
                        request.endpoint(),
                        request.sourceSystem(),
                        request.targetSystem(),
                        request.authType(),
                        request.payloadFormat(),
                        request.retryPolicy(),
                        request.scheduleExpression(),
                        request.ownerTeam()
                )
        );
        interfaces.put(id, updated);
        timelineEvents.add(0, new TimelineEvent("방금 전", "설정 변경 반영", id + " 인터페이스 설정이 업데이트되어 운영 화면에 반영"));
        return updated;
    }

    public void deleteInterface(String id) {
        ManagedInterface removed = interfaces.remove(id);
        if (removed == null) {
            throw new IllegalArgumentException("Interface not found: " + id);
        }
        timelineEvents.add(0, new TimelineEvent("방금 전", "인터페이스 삭제", id + " " + removed.name() + " 인터페이스가 운영 목록에서 제거됨"));
        incidents.add(0, new Incident(SeverityLevel.LOW, "인터페이스 삭제", id + " 인터페이스가 운영 목록에서 삭제되었습니다.", "방금 전"));
    }

    private ManagedInterface requireInterface(String id) {
        ManagedInterface item = interfaces.get(id);
        if (item == null) {
            throw new IllegalArgumentException("Interface not found: " + id);
        }
        return item;
    }

    private List<ProtocolSummary> buildProtocolSummary(List<ManagedInterface> items) {
        int total = Math.max(items.size(), 1);
        return List.of(ProtocolType.values()).stream()
                .map(protocol -> {
                    long count = items.stream().filter(item -> item.protocol() == protocol).count();
                    String label = switch (protocol) {
                        case REST_API -> "REST API";
                        case SOAP -> "SOAP";
                        case MQ -> "MQ";
                        case BATCH -> "Batch";
                        case SFTP -> "SFTP";
                    };
                    return new ProtocolSummary(label, (int) count, (int) Math.round((count * 100.0) / total));
                })
                .filter(summary -> summary.value() > 0)
                .toList();
    }

    private List<PerformancePoint> buildPerformanceSeries(List<ManagedInterface> items) {
        int base = (int) Math.round(items.stream().mapToInt(ManagedInterface::avgLatencyMs).average().orElse(180));
        return List.of(
                new PerformancePoint("09:00", Math.max(90, base - 34)),
                new PerformancePoint("10:00", Math.max(100, base - 12)),
                new PerformancePoint("11:00", Math.max(110, base + 4)),
                new PerformancePoint("12:00", Math.max(120, base + 22)),
                new PerformancePoint("13:00", Math.max(130, base + 11)),
                new PerformancePoint("14:00", Math.max(140, base + 38))
        );
    }

    private int countByStatus(List<ManagedInterface> items, InterfaceStatus status) {
        return (int) items.stream().filter(item -> item.status() == status).count();
    }

    private int statusRank(InterfaceStatus status) {
        return switch (status) {
            case FAILED -> 0;
            case WARNING -> 1;
            case RUNNING -> 2;
            case HEALTHY -> 3;
            case PAUSED -> 4;
        };
    }

    private String defaultText(String candidate, String fallback) {
        return candidate == null || candidate.isBlank() ? fallback : candidate;
    }
}
