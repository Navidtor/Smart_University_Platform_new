package com.smartuniversity.booking.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartuniversity.booking.domain.Resource;
import com.smartuniversity.booking.repository.ReservationRepository;
import com.smartuniversity.booking.repository.ResourceRepository;
import com.smartuniversity.booking.web.dto.CreateReservationRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BookingControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private Resource resource;
    private final String tenantId = "engineering";
    private final String userId = UUID.randomUUID().toString();

    @BeforeEach
    void setUp() {
        // Clear reservations first to avoid FK violations when wiping resources
        reservationRepository.deleteAll();
        resourceRepository.deleteAll();

        Resource res = new Resource();
        res.setTenantId(tenantId);
        res.setName("Room 101");
        res.setType("CLASSROOM");
        res.setCapacity(30);
        resource = resourceRepository.save(res);
    }

    @Test
    void listResourcesShouldReturnResourcesForTenant() throws Exception {
        mockMvc.perform(get("/booking/resources")
                .header("X-Tenant-Id", tenantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", notNullValue()))
                .andExpect(jsonPath("$[0].name").value("Room 101"));
    }

    @Test
    void createReservationShouldPreventOverbooking() throws Exception {
        Instant start = Instant.parse("2024-01-01T10:00:00Z");
        Instant end = Instant.parse("2024-01-01T11:00:00Z");

        CreateReservationRequest first = new CreateReservationRequest();
        first.setResourceId(resource.getId());
        first.setStartTime(start);
        first.setEndTime(end);

        CreateReservationRequest overlapping = new CreateReservationRequest();
        overlapping.setResourceId(resource.getId());
        overlapping.setStartTime(start.plusSeconds(600)); // 10 minutes later, still overlapping
        overlapping.setEndTime(end.plusSeconds(600));

        // First reservation should succeed
        mockMvc.perform(post("/booking/reservations")
                .header("X-Tenant-Id", tenantId)
                .header("X-User-Id", userId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(first)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()));

        // Second overlapping reservation should be rejected with 409
        mockMvc.perform(post("/booking/reservations")
                .header("X-Tenant-Id", tenantId)
                .header("X-User-Id", userId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(overlapping)))
                .andExpect(status().isConflict());
    }

    @Test
    void concurrentReservationAttemptsShouldOnlyAllowOneSuccess() throws Exception {
        Instant start = Instant.parse("2024-01-01T12:00:00Z");
        Instant end = Instant.parse("2024-01-01T13:00:00Z");

        CreateReservationRequest request = new CreateReservationRequest();
        request.setResourceId(resource.getId());
        request.setStartTime(start);
        request.setEndTime(end);

        String json = objectMapper.writeValueAsString(request);

        ExecutorService executor = Executors.newFixedThreadPool(2);
        List<Callable<Integer>> tasks = new ArrayList<>();
        for (int i = 0; i < 2; i++) {
            tasks.add(() -> mockMvc.perform(post("/booking/reservations")
                    .header("X-Tenant-Id", tenantId)
                    .header("X-User-Id", userId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json))
                    .andReturn()
                    .getResponse()
                    .getStatus());
        }

        int success = 0;
        int conflict = 0;
        try {
            for (var future : executor.invokeAll(tasks)) {
                int status = future.get();
                if (status == HttpStatus.CREATED.value()) {
                    success++;
                } else if (status == HttpStatus.CONFLICT.value()) {
                    conflict++;
                }
            }
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException(e);
        } finally {
            executor.shutdownNow();
        }

        // With pessimistic locking, exactly one request should succeed and the other
        // should see a conflict.
        assertThat(success).isEqualTo(1);
        assertThat(conflict).isEqualTo(1);
    }
}