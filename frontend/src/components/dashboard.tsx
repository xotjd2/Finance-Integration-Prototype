"use client";

import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  createManagedInterface,
  deleteManagedInterface,
  fetchDashboard,
  retryManagedInterface,
  updateManagedInterface,
} from "@/lib/api";
import type {
  DashboardResponse,
  DirectionType,
  IncidentItem,
  InterfaceFormValues,
  InterfaceItem,
  InterfaceStatus,
  ProtocolType,
  SeverityLevel,
} from "@/lib/types";
import {
  formatMinutes,
  formatNumber,
  formatPercent,
  getDirectionLabel,
  getProtocolLabel,
  getSeverityTone,
  getStatusTone,
} from "@/lib/utils";

const emptyForm: InterfaceFormValues = {
  name: "",
  organization: "",
  protocol: "REST_API",
  direction: "BIDIRECTIONAL",
  schedule: "실시간",
  description: "",
  endpoint: "",
  sourceSystem: "",
  targetSystem: "",
  authType: "OAuth2",
  payloadFormat: "JSON",
  retryPolicy: "10초 간격 3회 재시도",
  scheduleExpression: "realtime",
  ownerTeam: "",
  operatorNote: "",
};

export function Dashboard() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formValues, setFormValues] = useState<InterfaceFormValues>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [simulatedStatuses, setSimulatedStatuses] = useState<Record<string, InterfaceStatus>>({});
  const [simulatedIncidents, setSimulatedIncidents] = useState<IncidentItem[]>([]);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const interfaces = useMemo(() => dashboard?.interfaces ?? [], [dashboard]);
  const incidents = useMemo(() => dashboard?.incidents ?? [], [dashboard]);

  const renderedInterfaces = useMemo(
    () =>
      interfaces.map((item) =>
        simulatedStatuses[item.id] ? { ...item, status: simulatedStatuses[item.id] } : item,
      ),
    [interfaces, simulatedStatuses],
  );

  const selectedInterface = useMemo(
    () => renderedInterfaces.find((item) => item.id === selectedId) ?? renderedInterfaces[0] ?? null,
    [renderedInterfaces, selectedId],
  );

  const mergedIncidents = useMemo(
    () => [...simulatedIncidents, ...incidents].slice(0, 4),
    [incidents, simulatedIncidents],
  );

  const renderedSummary = useMemo(() => {
    const failed = renderedInterfaces.filter((item) => item.status === "FAILED").length;
    const warning = renderedInterfaces.filter((item) => item.status === "WARNING").length;
    const running = renderedInterfaces.filter((item) => item.status === "RUNNING").length;

    return {
      failed,
      warning,
      running,
      totalInterfaces: renderedInterfaces.length,
    };
  }, [renderedInterfaces]);

  useEffect(() => {
    void loadDashboard();
  }, []);

  useEffect(() => {
    if (interfaces.length === 0) {
      return;
    }

    const timer = window.setInterval(() => {
      const candidates = interfaces
        .map((item) => ({
          ...item,
          status: simulatedStatuses[item.id] ?? item.status,
        }))
        .filter((item) => item.status === "HEALTHY" || item.status === "WARNING");

      if (candidates.length === 0) {
        return;
      }

      const target = candidates[Math.floor(Math.random() * candidates.length)];
      const nextStatus: InterfaceStatus = target.status === "HEALTHY" ? "WARNING" : "FAILED";
      const nextIncident: IncidentItem = {
        severity: nextStatus === "FAILED" ? "CRITICAL" : "MEDIUM",
        title: nextStatus === "FAILED" ? "실시간 장애 감지" : "지연 경고 감지",
        detail:
          nextStatus === "FAILED"
            ? `${target.name} 인터페이스에서 처리 실패가 감지되었습니다.`
            : `${target.name} 인터페이스 응답시간이 상승해 경고 상태로 전환되었습니다.`,
        occurredAt: "방금 전",
      };

      setSimulatedStatuses((current) => ({ ...current, [target.id]: nextStatus }));
      setSimulatedIncidents((current) => [nextIncident, ...current].slice(0, 4));
    }, 10000);

    return () => window.clearInterval(timer);
  }, [interfaces, simulatedStatuses]);

  async function loadDashboard(nextSelectedId?: string, silent = false) {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const data = await fetchDashboard();
      setDashboard(data);
      setSelectedId((current) => nextSelectedId ?? current ?? data.interfaces[0]?.id ?? "");
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "데이터를 불러오지 못했습니다.");
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }

  function replaceInterfaceInDashboard(nextItem: InterfaceItem) {
    setDashboard((current) => {
      if (!current) {
        return current;
      }

      const nextInterfaces = current.interfaces.map((item) =>
        item.id === nextItem.id ? nextItem : item,
      );

      const failed = nextInterfaces.filter((item) => item.status === "FAILED").length;
      const warning = nextInterfaces.filter((item) => item.status === "WARNING").length;
      const running = nextInterfaces.filter((item) => item.status === "RUNNING").length;
      const healthy = nextInterfaces.filter((item) => item.status === "HEALTHY").length;
      const totalTransactions = nextInterfaces.reduce((sum, item) => sum + item.todayCount, 0);
      const avgLatency =
        nextInterfaces.length > 0
          ? nextInterfaces.reduce((sum, item) => sum + item.avgLatencyMs, 0) / nextInterfaces.length
          : 0;
      const avgSlaRate =
        nextInterfaces.length > 0
          ? nextInterfaces.reduce((sum, item) => sum + item.slaPercent, 0) / nextInterfaces.length
          : 0;

      return {
        ...current,
        interfaces: nextInterfaces,
        summary: {
          totalInterfaces: nextInterfaces.length,
          failed,
          warning,
          running,
          healthy,
          totalTransactions,
          avgLatency,
          avgSlaRate,
        },
      };
    });
  }

  async function handleSubmit() {
    try {
      setSubmitting(true);
      if (formMode === "create") {
        const created = await createManagedInterface(formValues);
        setFeedback(`${created.id} 인터페이스가 등록되었습니다.`);
        setFormValues(emptyForm);
        await loadDashboard(created.id, true);
      } else if (selectedInterface) {
        const updated = await updateManagedInterface(selectedInterface.id, formValues);
        replaceInterfaceInDashboard(updated);
        setFeedback(`${updated.id} 설정이 저장되었습니다.`);
        await loadDashboard(updated.id, true);
      }
      setError(null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRetry(id: string) {
    try {
      setSubmitting(true);
      const retried = await retryManagedInterface(id);
      replaceInterfaceInDashboard(retried);
      setSimulatedStatuses((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      setFeedback(`${retried.id} 재처리 완료`);
      await loadDashboard(retried.id, true);
      setError(null);
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : "재처리 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      setSubmitting(true);
      await deleteManagedInterface(id);
      setSimulatedStatuses((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      setFeedback(`${id} 인터페이스 삭제 완료`);
      setFormMode("create");
      setFormValues(emptyForm);
      await loadDashboard(undefined, true);
      setError(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "삭제 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleInputChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
  }

  const flashIncident: IncidentItem | null = mergedIncidents[0] ?? null;
  const maxPerformanceValue = Math.max(
    ...(dashboard?.performanceSeries.map((item) => item.value) ?? [1]),
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.18),_transparent_26%),linear-gradient(180deg,_#f8fafc_0%,_#eef3f8_55%,_#e5ebf3_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-6 px-4 py-5 lg:px-6">
        <section className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950 text-white shadow-[0_30px_80px_rgba(6,12,24,0.45)]">
          <div className="flex flex-col gap-8 px-6 py-6 lg:px-8 lg:py-8">
            <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1.3fr)_minmax(420px,0.9fr)] lg:items-stretch">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300">
                  Insurance Interface Command Center
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight lg:text-5xl">
                  금융 IT 인터페이스 통합관리시스템
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 lg:text-base">
                  인터페이스 등록, 설정, 모니터링, 재처리를 단일 화면에서 관리합니다.
                </p>
              </div>

              <div className="grid h-full gap-3 rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur sm:grid-cols-3">
                <LiveStat label="활성 인터페이스" value={`${renderedSummary.totalInterfaces}`} hint="운영 대상 전체" />
                <LiveStat label="오늘 처리 건수" value={formatNumber(dashboard?.summary.totalTransactions ?? 0)} hint="백엔드 집계" />
                <LiveStat label="평균 SLA" value={formatPercent(dashboard?.summary.avgSlaRate ?? 0)} hint="전체 인터페이스 평균" />
              </div>
            </div>

            <div className="grid items-stretch gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="실패" value={`${renderedSummary.failed}`} accent="red" detail="즉시 확인 필요" />
                <MetricCard label="경고" value={`${renderedSummary.warning}`} accent="amber" detail="지연 또는 누적 증가" />
                <MetricCard label="실행 중" value={`${renderedSummary.running}`} accent="sky" detail="현재 처리 진행 중" />
                <MetricCard label="평균 응답시간" value={`${Math.round(dashboard?.summary.avgLatency ?? 0)}ms`} accent="emerald" detail="전체 평균" />
              </div>

              <div className="flex min-h-[188px] flex-col rounded-[24px] border border-white/10 bg-white/6 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">장애 브리핑</p>
                    <p className="mt-1 text-xs text-slate-400">최근 장애 및 복구 현황</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getSeverityTone(flashIncident?.severity ?? "LOW")}`}>
                    {getSeverityLabel(flashIncident?.severity ?? "LOW")}
                  </span>
                </div>
                <div className="mt-4 flex-1 rounded-2xl border border-white/8 bg-slate-900/80 p-4">
                  <p className="text-sm font-semibold text-white">{flashIncident?.title ?? "데이터 로딩 중"}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{flashIncident?.detail ?? "장애 피드를 조회 중입니다."}</p>
                  <p className="mt-3 text-xs text-slate-500">{flashIncident?.occurredAt ?? "잠시만 기다려주세요"}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {feedback ? <Notice tone="success" message={feedback} /> : null}
        {error ? <Notice tone="error" message={error} /> : null}

        <section className="grid gap-6 xl:grid-cols-[1.1fr_1.3fr_0.9fr]">
          <Panel title="프로토콜 현황" subtitle="프로토콜별 운영 현황" contentClassName="h-full">
            <div className="flex h-[360px] flex-col justify-center space-y-4">
              {dashboard?.protocolBreakdown.map((item, index) => (
                <div key={`protocol-${item.label}-${index}`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className="text-slate-500">{item.value}개</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-200">
                    <div className="h-2 rounded-full bg-[linear-gradient(90deg,_#0f766e,_#38bdf8)]" style={{ width: `${item.share}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="성능 추이" subtitle="최근 구간 평균 응답시간" contentClassName="h-full">
            <div className="flex h-[360px] items-end gap-3 pt-4">
              {dashboard?.performanceSeries.map((item, index) => {
                const height = Math.max(8, (item.value / maxPerformanceValue) * 100);

                return (
                  <div key={`perf-${item.label}-${index}`} className="flex flex-1 flex-col items-center gap-3">
                    <div className="flex h-56 w-full items-end rounded-t-[18px] bg-slate-100 px-2">
                      <div className="w-full rounded-t-[14px] bg-[linear-gradient(180deg,_#0f766e,_#155e75)]" style={{ height: `${height}%` }} />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-slate-500">{item.label}</p>
                      <p className="text-sm font-semibold text-slate-800">{item.value}ms</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="운영 이력" subtitle="최근 작업 이력" contentClassName="h-full">
            <div className="h-[360px] space-y-4 overflow-y-auto pr-2">
              {dashboard?.timelineEvents.map((item, index) => (
                <div key={`${item.time}-${item.title}-${item.detail}-${index}`} className="relative pl-5">
                  <span className="absolute left-0 top-1 h-2.5 w-2.5 rounded-full bg-cyan-700" />
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{item.time}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Panel title="인터페이스 현황" subtitle="운영 인터페이스 목록">
            <div className="overflow-hidden rounded-[22px] border border-slate-200">
              <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800">
                안내: 운영 인터페이스 상태는 10초마다 임의로 변경되도록 설정되어 있습니다.
              </div>
              {refreshing ? (
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500">
                  목록을 최신 상태로 반영하는 중입니다.
                </div>
              ) : null}
              <div className="hidden grid-cols-[1.15fr_0.95fr_0.75fr_0.7fr_0.7fr_0.85fr] gap-4 bg-slate-100 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 lg:grid">
                <span className="self-center">인터페이스</span>
                <span className="self-center">대상기관</span>
                <span className="self-center">프로토콜</span>
                <span className="self-center">상태</span>
                <span className="self-center">재처리</span>
                <span className="self-center">최근 실행</span>
              </div>
              <div className="divide-y divide-slate-200 bg-white">
                {loading ? (
                  <div className="px-4 py-12 text-center text-sm text-slate-500">백엔드에서 인터페이스 목록을 불러오는 중입니다.</div>
                ) : (
                  renderedInterfaces.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedId(item.id);
                        setFormMode("edit");
                        setFormValues(toFormValues(item));
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedId(item.id);
                          setFormMode("edit");
                          setFormValues(toFormValues(item));
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className={`grid w-full gap-4 px-4 py-4 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-700 lg:grid-cols-[1.15fr_0.95fr_0.75fr_0.7fr_0.7fr_0.85fr] lg:items-center ${
                        selectedInterface?.id === item.id ? "bg-cyan-50/80" : "bg-white"
                      }`}
                    >
                      <div className="min-w-0 self-center">
                        <p className="text-sm font-semibold break-words leading-6 text-slate-900">{item.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.id} · {getDirectionLabel(item.direction)} · {item.schedule}</p>
                      </div>
                      <div className="min-w-0 self-center text-center text-sm break-words leading-6 text-slate-700">{item.organization}</div>
                      <div className="self-center text-center text-sm font-medium text-slate-700">{getProtocolLabel(item.protocol)}</div>
                      <div className="self-center text-center">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(item.status)}`}>{getStatusLabel(item.status)}</span>
                      </div>
                      <div className="self-center text-center">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleRetry(item.id);
                          }}
                          className="shrink-0 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-slate-700 transition hover:border-cyan-700 hover:text-cyan-700"
                        >
                          재처리
                        </button>
                      </div>
                      <div className="self-center text-center">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-slate-500">{item.lastRunAt}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Panel>

          <Panel title="인터페이스 상세" subtitle="상세 정보 및 운영 로그">
            {selectedInterface ? (
              <div className="space-y-5">
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{selectedInterface.id}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(selectedInterface.status)}`}>{getStatusLabel(selectedInterface.status)}</span>
                  </div>

                  <div className="mt-3">
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">{selectedInterface.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{selectedInterface.description}</p>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <KeyValue label="대상기관" value={selectedInterface.organization} />
                    <KeyValue label="프로토콜" value={getProtocolLabel(selectedInterface.protocol)} />
                    <KeyValue label="연계방향" value={getDirectionLabel(selectedInterface.direction)} />
                    <KeyValue label="실행주기" value={selectedInterface.schedule} />
                    <KeyValue label="평균 응답시간" value={`${selectedInterface.avgLatencyMs}ms`} />
                    <KeyValue label="큐 적체량" value={`${selectedInterface.queueDepth}건`} />
                    <KeyValue label="엔드포인트" value={selectedInterface.config.endpoint} />
                    <KeyValue label="운영조직" value={selectedInterface.config.ownerTeam} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <MiniStat label="금일 거래" value={formatNumber(selectedInterface.todayCount)} />
                  <MiniStat label="재시도 횟수" value={`${selectedInterface.retryCount}`} />
                  <MiniStat label="평균 처리시간" value={formatMinutes(selectedInterface.avgProcessMinutes)} />
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">운영 메모 및 로그</p>
                      <p className="mt-1 text-xs text-slate-500">최근 결과, 장애 요약, 운영 메모</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleRetry(selectedInterface.id)}
                      className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-cyan-900"
                    >
                      재처리
                    </button>
                  </div>
                  <div className="mt-4 space-y-3">
                    <LogRow label="최근 결과" value={selectedInterface.lastResult} />
                    <LogRow label="장애 요약" value={selectedInterface.errorSummary} />
                    <LogRow label="운영 메모" value={selectedInterface.operatorNote} />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">선택된 인터페이스가 없습니다.</p>
            )}
          </Panel>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Panel title="인터페이스 등록 / 설정" subtitle="신규 등록 및 설정 저장">
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormMode("create");
                  setFormValues(emptyForm);
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${formMode === "create" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600"}`}
              >
                신규 등록
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormMode("edit");
                  if (selectedInterface) {
                    setFormValues(toFormValues(selectedInterface));
                  }
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${formMode === "edit" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600"}`}
              >
                설정 수정
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="인터페이스명" name="name" value={formValues.name} onChange={handleInputChange} />
              <Field label="대상기관" name="organization" value={formValues.organization} onChange={handleInputChange} />
              <SelectField label="프로토콜" name="protocol" value={formValues.protocol} onChange={handleInputChange} options={protocolOptions} />
              <SelectField label="연계방향" name="direction" value={formValues.direction} onChange={handleInputChange} options={directionOptions} />
              <Field label="운영 주기" name="schedule" value={formValues.schedule} onChange={handleInputChange} />
              <Field label="스케줄 표현식" name="scheduleExpression" value={formValues.scheduleExpression} onChange={handleInputChange} />
              <Field label="엔드포인트 / 큐명" name="endpoint" value={formValues.endpoint} onChange={handleInputChange} />
              <Field label="인증 방식" name="authType" value={formValues.authType} onChange={handleInputChange} />
              <Field label="송신 시스템" name="sourceSystem" value={formValues.sourceSystem} onChange={handleInputChange} />
              <Field label="수신 시스템" name="targetSystem" value={formValues.targetSystem} onChange={handleInputChange} />
              <Field label="포맷" name="payloadFormat" value={formValues.payloadFormat} onChange={handleInputChange} />
              <Field label="재시도 정책" name="retryPolicy" value={formValues.retryPolicy} onChange={handleInputChange} />
              <Field label="운영 부서" name="ownerTeam" value={formValues.ownerTeam} onChange={handleInputChange} />
              <Field label="운영 메모" name="operatorNote" value={formValues.operatorNote} onChange={handleInputChange} />
              <TextAreaField label="설명" name="description" value={formValues.description} onChange={handleInputChange} className="sm:col-span-2" />
            </div>

            <div className="mt-5 flex items-center justify-between">
              <div>
                {formMode === "edit" && selectedInterface ? (
                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(selectedInterface.id)}
                    disabled={submitting}
                    className="rounded-full border border-rose-300 px-5 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
                  >
                    인터페이스 삭제
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={submitting}
                className="rounded-full bg-cyan-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-900 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {submitting ? "저장 중..." : formMode === "create" ? "인터페이스 등록" : "설정 저장"}
              </button>
            </div>
          </Panel>

          <Panel title="장애 피드" subtitle="최근 장애 및 주요 알림">
            <div className="grid gap-3 sm:grid-cols-2">
              {mergedIncidents.map((item, index) => (
                <div key={`incident-${item.title}-${item.occurredAt}-${index}`} className="rounded-[20px] border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getSeverityTone(item.severity)}`}>
                      {getSeverityLabel(item.severity)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                  <p className="mt-3 text-xs text-slate-400">{item.occurredAt}</p>
                </div>
              ))}
            </div>
          </Panel>
        </section>
      </div>

      {deleteTargetId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
            <p className="text-lg font-semibold text-slate-900">인터페이스 삭제</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              선택한 인터페이스를 삭제하시겠습니까? <br /> 삭제 후에는 목록에서 제거됩니다.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetId = deleteTargetId;
                  setDeleteTargetId(null);
                  if (targetId) {
                    await handleDelete(targetId);
                  }
                }}
                className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function toFormValues(item: InterfaceItem): InterfaceFormValues {
  return {
    name: item.name,
    organization: item.organization,
    protocol: item.protocol,
    direction: item.direction,
    schedule: item.schedule,
    description: item.description,
    endpoint: item.config.endpoint,
    sourceSystem: item.config.sourceSystem,
    targetSystem: item.config.targetSystem,
    authType: item.config.authType,
    payloadFormat: item.config.payloadFormat,
    retryPolicy: item.config.retryPolicy,
    scheduleExpression: item.config.scheduleExpression,
    ownerTeam: item.config.ownerTeam,
    operatorNote: item.operatorNote,
  };
}

function Panel({
  title,
  subtitle,
  contentClassName = "",
  children,
}: {
  title: string;
  subtitle: string;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/60 bg-white/88 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="mb-5">
        <p className="text-lg font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className={contentClassName}>{children}</div>
    </section>
  );
}

function Field({
  label,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input {...props} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-700" />
    </label>
  );
}

function TextAreaField({
  label,
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <textarea {...props} rows={4} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-700" />
    </label>
  );
}

function SelectField({
  label,
  options,
  className = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: { value: string; label: string }[]; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <select {...props} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-700">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function MetricCard({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  accent: "red" | "amber" | "sky" | "emerald";
}) {
  const accents = {
    red: "from-rose-500/20 to-red-700/5 text-rose-200",
    amber: "from-amber-400/20 to-orange-800/5 text-amber-100",
    sky: "from-sky-400/20 to-cyan-900/5 text-sky-100",
    emerald: "from-emerald-400/20 to-teal-900/5 text-emerald-100",
  };

  return (
    <div className={`rounded-[20px] border border-white/10 bg-gradient-to-br ${accents[accent]} px-4 py-4`}>
      <p className="text-sm font-medium text-slate-300">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{detail}</p>
    </div>
  );
}

function LiveStat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.24em] text-white/90">{label}</p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-white/70">{hint}</p>
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-3 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function LogRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function Notice({ tone, message }: { tone: "success" | "error"; message: string }) {
  return (
    <div className={`rounded-2xl px-4 py-3 text-sm font-medium ${tone === "success" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
      {message}
    </div>
  );
}

function getStatusLabel(status: InterfaceStatus) {
  switch (status) {
    case "HEALTHY":
      return "정상";
    case "WARNING":
      return "경고";
    case "FAILED":
      return "실패";
    case "RUNNING":
      return "실행 중";
    case "PAUSED":
      return "중지";
  }
}

function getSeverityLabel(severity: SeverityLevel) {
  switch (severity) {
    case "CRITICAL":
      return "치명";
    case "MEDIUM":
      return "주의";
    case "LOW":
      return "복구";
  }
}

const protocolOptions: { value: ProtocolType; label: string }[] = [
  { value: "REST_API", label: "REST API" },
  { value: "SOAP", label: "SOAP" },
  { value: "MQ", label: "MQ" },
  { value: "BATCH", label: "Batch" },
  { value: "SFTP", label: "SFTP" },
];

const directionOptions: { value: DirectionType; label: string }[] = [
  { value: "INBOUND", label: "수신" },
  { value: "OUTBOUND", label: "송신" },
  { value: "BIDIRECTIONAL", label: "송수신" },
];
