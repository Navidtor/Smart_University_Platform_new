package com.smartuniversity.market.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartuniversity.market.domain.Order;
import com.smartuniversity.market.domain.OrderStatus;
import com.smartuniversity.market.domain.Product;
import com.smartuniversity.market.repository.OrderRepository;
import com.smartuniversity.market.repository.ProductRepository;
import com.smartuniversity.market.service.PaymentClient;
import com.smartuniversity.market.web.dto.CheckoutRequest;
import com.smartuniversity.market.web.dto.OrderItemRequest;
import com.smartuniversity.market.web.dto.PaymentResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MarketplaceControllerIntegrationTest {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ProductRepository productRepository;

        @Autowired
        private ObjectMapper objectMapper;

        @MockBean
        private RabbitTemplate rabbitTemplate;

        @MockBean
        private PaymentClient paymentClient;

        @Autowired
        private OrderRepository orderRepository;

        @BeforeEach
        void setUp() {
                orderRepository.deleteAll();
                productRepository.deleteAll();
        }

        @Test
        void createProductAndListShouldWorkForTeacher() throws Exception {
                String tenantId = "engineering";
                String teacherId = UUID.randomUUID().toString();

                // Create product
                String productJson = """
                                {
                                  "name": "Textbook",
                                  "description": "Algorithms",
                                  "price": 50.0,
                                  "stock": 10
                                }
                                """;

                mockMvc.perform(post("/market/products")
                                .header("X-Tenant-Id", tenantId)
                                .header("X-User-Id", teacherId)
                                .header("X-User-Role", "TEACHER")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(productJson))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.id", notNullValue()));

                // List products
                mockMvc.perform(get("/market/products")
                                .header("X-Tenant-Id", tenantId))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$", hasSize(1)));
        }

        @Test
        void checkoutShouldInvokeSagaAndPublishEvent() throws Exception {
                String tenantId = "engineering";
                String buyerId = UUID.randomUUID().toString();

                // Insert product directly
                Product product = new Product();
                product.setTenantId(tenantId);
                product.setSellerId(UUID.randomUUID());
                product.setName("Notebook");
                product.setDescription("A5");
                product.setPrice(BigDecimal.valueOf(5.0));
                product.setStock(100);
                product = productRepository.save(product);

                CheckoutRequest checkoutRequest = new CheckoutRequest();
                OrderItemRequest item = new OrderItemRequest();
                item.setProductId(product.getId());
                item.setQuantity(2);
                checkoutRequest.setItems(List.of(item));

                // Mock payment authorization to succeed
                PaymentResponse paymentResponse = new PaymentResponse();
                paymentResponse.setPaymentId(UUID.randomUUID());
                paymentResponse.setOrderId(UUID.randomUUID());
                paymentResponse.setStatus("AUTHORIZED");
                Mockito.when(paymentClient.authorize(eq(tenantId), any()))
                                .thenReturn(paymentResponse);

                mockMvc.perform(post("/market/orders/checkout")
                                .header("X-Tenant-Id", tenantId)
                                .header("X-User-Id", buyerId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(checkoutRequest)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.id", notNullValue()))
                                .andExpect(jsonPath("$.items[0].productId", notNullValue()));

                // Ensure we did not trigger compensation
                Mockito.verify(paymentClient, Mockito.never()).cancel(eq(tenantId), any());
        }

        @Test
        void checkoutShouldCancelOrderWhenPaymentFails() throws Exception {
                String tenantId = "engineering";
                String buyerId = UUID.randomUUID().toString();

                Product product = new Product();
                product.setTenantId(tenantId);
                product.setSellerId(UUID.randomUUID());
                product.setName("Notebook");
                product.setDescription("A5");
                product.setPrice(BigDecimal.valueOf(5.0));
                product.setStock(100);
                product = productRepository.save(product);

                CheckoutRequest checkoutRequest = new CheckoutRequest();
                OrderItemRequest item = new OrderItemRequest();
                item.setProductId(product.getId());
                item.setQuantity(1);
                checkoutRequest.setItems(List.of(item));

                // Simulate payment authorization failure via HTTP 402
                Mockito.when(paymentClient.authorize(eq(tenantId), any()))
                                .thenThrow(new RuntimeException("Payment gateway down"));

                mockMvc.perform(post("/market/orders/checkout")
                                .header("X-Tenant-Id", tenantId)
                                .header("X-User-Id", buyerId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(checkoutRequest)))
                                .andExpect(status().isPaymentRequired());

                // Orders that fail payment are marked as CANCELED by the Saga
                List<Order> orders = orderRepository.findAll();
                assertThat(orders).hasSize(1);
                assertThat(orders.get(0).getStatus()).isEqualTo(OrderStatus.CANCELED);

                Mockito.verify(paymentClient, Mockito.never()).cancel(eq(tenantId), any());
        }

        @Test
        void checkoutShouldCompensatePaymentWhenStockInsufficient() throws Exception {
                String tenantId = "engineering";
                String buyerId = UUID.randomUUID().toString();

                Product product = new Product();
                product.setTenantId(tenantId);
                product.setSellerId(UUID.randomUUID());
                product.setName("Limited Edition Notebook");
                product.setDescription("Only one left");
                product.setPrice(BigDecimal.valueOf(5.0));
                product.setStock(1);
                product = productRepository.save(product);

                CheckoutRequest checkoutRequest = new CheckoutRequest();
                OrderItemRequest item = new OrderItemRequest();
                item.setProductId(product.getId());
                item.setQuantity(2); // request more than available stock
                checkoutRequest.setItems(List.of(item));

                // Payment authorization succeeds
                PaymentResponse paymentResponse = new PaymentResponse();
                paymentResponse.setPaymentId(UUID.randomUUID());
                paymentResponse.setOrderId(UUID.randomUUID());
                paymentResponse.setStatus("AUTHORIZED");
                Mockito.when(paymentClient.authorize(eq(tenantId), any()))
                                .thenReturn(paymentResponse);

                mockMvc.perform(post("/market/orders/checkout")
                                .header("X-Tenant-Id", tenantId)
                                .header("X-User-Id", buyerId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(checkoutRequest)))
                                .andExpect(status().isConflict());

                // Saga should have canceled the order and invoked payment cancellation
                List<Order> orders = orderRepository.findAll();
                assertThat(orders).hasSize(1);
                assertThat(orders.get(0).getStatus()).isEqualTo(OrderStatus.CANCELED);

                Mockito.verify(paymentClient).cancel(eq(tenantId), any());
        }
}