package com.smartuniversity.payment.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartuniversity.payment.domain.PaymentStatus;
import com.smartuniversity.payment.web.dto.PaymentAuthorizationRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.UUID;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PaymentControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private final String tenantId = "engineering";

    @Test
    void authorizeAndCancelPaymentLifecycle() throws Exception {
        PaymentAuthorizationRequest request = new PaymentAuthorizationRequest();
        request.setOrderId(UUID.randomUUID());
        request.setUserId(UUID.randomUUID());
        request.setAmount(BigDecimal.valueOf(100.00));

        // Authorize
        String responseBody = mockMvc.perform(post("/payment/payments/authorize")
                        .header("X-Tenant-Id", tenantId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.paymentId", notNullValue()))
                .andExpect(jsonPath("$.status", is(PaymentStatus.AUTHORIZED.name())))
                .andReturn()
                .getResponse()
                .getContentAsString();

        var node = objectMapper.readTree(responseBody);
        String orderId = node.get("orderId").asText();

        // Cancel
        mockMvc.perform(post("/payment/payments/cancel/{orderId}", orderId)
                        .header("X-Tenant-Id", tenantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is(PaymentStatus.CANCELED.name())));
    }
}