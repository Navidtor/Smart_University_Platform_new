package com.smartuniversity.dashboard.web;

import com.smartuniversity.dashboard.domain.SensorReading;
import com.smartuniversity.dashboard.domain.ShuttleLocation;
import com.smartuniversity.dashboard.service.DashboardService;
import com.smartuniversity.dashboard.web.dto.SensorDto;
import com.smartuniversity.dashboard.web.dto.ShuttleDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * REST API for live dashboard data (sensors and shuttle locations).
 */
@RestController
@RequestMapping("/dashboard")
@Tag(name = "Dashboard", description = "Live campus sensors and shuttle tracking")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/sensors")
    @Operation(summary = "List sensors", description = "Returns the latest sensor readings for the current tenant")
    public ResponseEntity<List<SensorDto>> getSensors(@RequestHeader(value = "X-Tenant-Id", required = false) String tenantId) {
        if (!StringUtils.hasText(tenantId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<SensorReading> readings = dashboardService.getSensors(tenantId);
        List<SensorDto> dtos = readings.stream()
                .map(r -> new SensorDto(r.getId(), r.getType(), r.getLabel(), r.getValue(), r.getUnit(), r.getUpdatedAt()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/shuttles")
    @Operation(summary = "List shuttles", description = "Returns all shuttle locations for the current tenant")
    public ResponseEntity<List<ShuttleDto>> getShuttles(@RequestHeader(value = "X-Tenant-Id", required = false) String tenantId) {
        if (!StringUtils.hasText(tenantId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<ShuttleLocation> shuttles = dashboardService.getShuttles(tenantId);
        List<ShuttleDto> dtos = shuttles.stream()
                .map(s -> new ShuttleDto(s.getId(), s.getName(), s.getLatitude(), s.getLongitude(), s.getUpdatedAt()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // Backwards-compatible singular endpoint as described in the specification.
    @GetMapping("/shuttle")
    @Operation(summary = "Get single shuttle", description = "Returns the first shuttle for the current tenant (demo convenience endpoint)")
    public ResponseEntity<ShuttleDto> getSingleShuttle(@RequestHeader(value = "X-Tenant-Id", required = false) String tenantId) {
        if (!StringUtils.hasText(tenantId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<ShuttleLocation> shuttles = dashboardService.getShuttles(tenantId);
        if (shuttles.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
        }
        ShuttleLocation s = shuttles.get(0);
        ShuttleDto dto = new ShuttleDto(s.getId(), s.getName(), s.getLatitude(), s.getLongitude(), s.getUpdatedAt());
        return ResponseEntity.ok(dto);
    }
}