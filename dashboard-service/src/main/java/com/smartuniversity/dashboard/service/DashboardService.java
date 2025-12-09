package com.smartuniversity.dashboard.service;

import com.smartuniversity.dashboard.domain.SensorReading;
import com.smartuniversity.dashboard.domain.SensorType;
import com.smartuniversity.dashboard.domain.ShuttleLocation;
import com.smartuniversity.dashboard.repository.SensorRepository;
import com.smartuniversity.dashboard.repository.ShuttleRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Simulation of IoT sensor readings and shuttle locations backed by the dashboard database.
 */
@Service
public class DashboardService {

    private final SensorRepository sensorRepository;
    private final ShuttleRepository shuttleRepository;
    private final Random random = new Random();

    public DashboardService(SensorRepository sensorRepository, ShuttleRepository shuttleRepository) {
        this.sensorRepository = sensorRepository;
        this.shuttleRepository = shuttleRepository;
    }

    public List<SensorReading> getSensors(String tenantId) {
        List<SensorReading> sensors = sensorRepository.findAllByTenantId(tenantId);
        if (sensors.isEmpty()) {
            sensors = sensorRepository.saveAll(createDefaultSensors(tenantId));
        }
        return sensors;
    }

    public List<ShuttleLocation> getShuttles(String tenantId) {
        List<ShuttleLocation> shuttles = shuttleRepository.findAllByTenantId(tenantId);
        if (shuttles.isEmpty()) {
            shuttles = shuttleRepository.saveAll(createDefaultShuttles(tenantId));
        }
        return shuttles;
    }

    private List<SensorReading> createDefaultSensors(String tenantId) {
        Instant now = Instant.now();
        List<SensorReading> sensors = new ArrayList<>();
        sensors.add(new SensorReading(null, tenantId, SensorType.TEMPERATURE, "Lecture Hall Temp", 22.0, "°C", now));
        sensors.add(new SensorReading(null, tenantId, SensorType.HUMIDITY, "Library Humidity", 45.0, "%", now));
        sensors.add(new SensorReading(null, tenantId, SensorType.CO2, "Lab CO2", 600.0, "ppm", now));
        sensors.add(new SensorReading(null, tenantId, SensorType.ENERGY_USAGE, "Campus Energy", 120.0, "kW", now));
        return sensors;
    }

    private List<ShuttleLocation> createDefaultShuttles(String tenantId) {
        Instant now = Instant.now();
        List<ShuttleLocation> shuttles = new ArrayList<>();
        // Base position roughly in the center of a generic campus
        shuttles.add(new ShuttleLocation(null, tenantId, "Campus Shuttle A", 52.5200, 13.4050, now));
        return shuttles;
    }

    @Scheduled(fixedRateString = "${dashboard.sensors.update-interval-ms:5000}")
    public void updateSensors() {
        Instant now = Instant.now();
        List<SensorReading> sensors = sensorRepository.findAll();
        for (SensorReading sensor : sensors) {
            double delta = (random.nextDouble() - 0.5) * 2.0; // -1.0 to +1.0
            double newValue = sensor.getValue() + delta;
            // Clamp ranges roughly per type
            switch (sensor.getType()) {
                case TEMPERATURE -> newValue = clamp(newValue, 18.0, 28.0);
                case HUMIDITY -> newValue = clamp(newValue, 30.0, 70.0);
                case CO2 -> newValue = clamp(newValue, 400.0, 1200.0);
                case ENERGY_USAGE -> newValue = clamp(newValue, 50.0, 300.0);
                default -> { }
            }
            sensor.setValue(newValue);
            sensor.setUpdatedAt(now);
        }
        if (!sensors.isEmpty()) {
            sensorRepository.saveAll(sensors);
        }
    }

    @Scheduled(fixedRateString = "${dashboard.shuttle.update-interval-ms:7000}")
    public void updateShuttles() {
        Instant now = Instant.now();
        List<ShuttleLocation> shuttles = shuttleRepository.findAll();
        for (ShuttleLocation shuttle : shuttles) {
            double dLat = (random.nextDouble() - 0.5) * 0.0005;
            double dLon = (random.nextDouble() - 0.5) * 0.0005;
            shuttle.setLatitude(shuttle.getLatitude() + dLat);
            shuttle.setLongitude(shuttle.getLongitude() + dLon);
            shuttle.setUpdatedAt(now);
        }
        if (!shuttles.isEmpty()) {
            shuttleRepository.saveAll(shuttles);
        }
    }

    private double clamp(double value, double min, double max) {
        return Math.min(max, Math.max(min, value));
    }
}