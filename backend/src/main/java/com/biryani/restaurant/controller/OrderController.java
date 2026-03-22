package com.biryani.restaurant.controller;

import com.biryani.restaurant.dto.AddItemsRequest;
import com.biryani.restaurant.dto.OrderRequest;
import com.biryani.restaurant.entity.Order;
import com.biryani.restaurant.entity.OrderItem;
import com.biryani.restaurant.security.AuthHelper;
import com.biryani.restaurant.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createOrder(@RequestBody OrderRequest request) {
        Long restaurantId = AuthHelper.getRestaurantId();
        Order order = orderService.createOrder(request, restaurantId);
        return ResponseEntity.ok(orderService.getOrderDetails(order.getId()));
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<Map<String, Object>> getOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(orderService.getOrderDetails(orderId));
    }

    @PostMapping("/{orderId}/items")
    public ResponseEntity<Map<String, Object>> addItems(
            @PathVariable Long orderId,
            @RequestBody AddItemsRequest request) {
        Order order = orderService.addItemsToExistingOrder(orderId, request);
        return ResponseEntity.ok(orderService.getOrderDetails(order.getId()));
    }

    @PutMapping("/items/{itemId}/status")
    public ResponseEntity<OrderItem> updateItemStatus(
            @PathVariable Long itemId,
            @RequestBody Map<String, String> request) {
        return ResponseEntity.ok(orderService.updateItemStatus(itemId, request.get("status")));
    }

    @PostMapping("/{orderId}/complete")
    public ResponseEntity<Map<String, Object>> completeOrder(@PathVariable Long orderId) {
        Order order = orderService.completeOrder(orderId);
        return ResponseEntity.ok(orderService.getOrderDetails(order.getId()));
    }

    @GetMapping("/table/{tableId}/active")
    public ResponseEntity<?> getActiveOrdersForTable(@PathVariable Long tableId) {
        List<Order> orders = orderService.getActiveOrdersForTable(tableId);
        if (!orders.isEmpty()) {
            List<Map<String, Object>> orderDetails = orders.stream()
                    .map(o -> orderService.getOrderDetails(o.getId()))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(orderDetails);
        }
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/kitchen")
    public ResponseEntity<List<Map<String, Object>>> getKitchenOrders() {
        Long restaurantId = AuthHelper.getRestaurantId();
        return ResponseEntity.ok(orderService.getKitchenOrders(restaurantId));
    }
}
