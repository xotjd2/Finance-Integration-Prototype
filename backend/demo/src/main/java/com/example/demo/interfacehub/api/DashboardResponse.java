package com.example.demo.interfacehub.api;

import com.example.demo.interfacehub.model.Incident;
import com.example.demo.interfacehub.model.ManagedInterface;
import com.example.demo.interfacehub.model.PerformancePoint;
import com.example.demo.interfacehub.model.ProtocolSummary;
import com.example.demo.interfacehub.model.TimelineEvent;

import java.util.List;

public record DashboardResponse(
        DashboardSummary summary,
        List<ManagedInterface> interfaces,
        List<Incident> incidents,
        List<ProtocolSummary> protocolBreakdown,
        List<PerformancePoint> performanceSeries,
        List<TimelineEvent> timelineEvents
) {
}
