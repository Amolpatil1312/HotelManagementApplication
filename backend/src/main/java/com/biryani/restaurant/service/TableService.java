package com.biryani.restaurant.service;

import com.biryani.restaurant.entity.Order;
import com.biryani.restaurant.entity.RestaurantTable;
import com.biryani.restaurant.entity.RestaurantTable.TableStatus;
import com.biryani.restaurant.repository.OrderRepository;
import com.biryani.restaurant.repository.TableRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TableService {

    private final TableRepository tableRepository;
    private final OrderRepository orderRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public TableService(TableRepository tableRepository, OrderRepository orderRepository,
                        SimpMessagingTemplate messagingTemplate) {
        this.tableRepository = tableRepository;
        this.orderRepository = orderRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public List<Map<String, Object>> getAllTablesWithDetails(Long restaurantId) {
        List<RestaurantTable> tables = tableRepository.findByRestaurantId(restaurantId);
        List<Map<String, Object>> result = new ArrayList<>();

        for (RestaurantTable table : tables) {
            Map<String, Object> tableData = new LinkedHashMap<>();
            tableData.put("id", table.getId());
            tableData.put("tableNumber", table.getTableNumber());
            tableData.put("tableType", table.getTableType());
            tableData.put("capacity", table.getCapacity());
            tableData.put("status", table.getStatus().name());
            tableData.put("reservedBy", table.getReservedBy());
            tableData.put("occupiedSince", table.getOccupiedSince());

            // Get all active orders for this table (multiple groups)
            List<Order> activeOrders = orderRepository.findByRestaurantTableAndStatus(table, Order.OrderStatus.ACTIVE);
            if (!activeOrders.isEmpty()) {
                BigDecimal totalAmount = activeOrders.stream()
                        .map(Order::getTotalAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                int totalItems = activeOrders.stream()
                        .mapToInt(Order::getTotalItems)
                        .sum();

                tableData.put("totalAmount", totalAmount);
                tableData.put("totalItems", totalItems);
                tableData.put("groupCount", activeOrders.size());
                tableData.put("orderCreatedAt", activeOrders.get(0).getCreatedAt());

                List<Map<String, Object>> groups = activeOrders.stream().map(order -> {
                    Map<String, Object> g = new LinkedHashMap<>();
                    g.put("orderId", order.getId());
                    g.put("groupName", order.getGroupName());
                    g.put("numberOfPeople", order.getNumberOfPeople());
                    g.put("totalAmount", order.getTotalAmount());
                    g.put("totalItems", order.getTotalItems());
                    g.put("createdAt", order.getCreatedAt());
                    return g;
                }).collect(Collectors.toList());
                tableData.put("activeOrders", groups);
                tableData.put("activeOrderId", activeOrders.get(0).getId());
            }

            result.add(tableData);
        }
        return result;
    }

    public RestaurantTable updateTableStatus(Long tableId, String status, String reservedBy) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new RuntimeException("Table not found: " + tableId));

        TableStatus newStatus = TableStatus.valueOf(status);
        table.setStatus(newStatus);

        if (newStatus == TableStatus.OCCUPIED) {
            table.setOccupiedSince(LocalDateTime.now());
        } else if (newStatus == TableStatus.AVAILABLE) {
            table.setOccupiedSince(null);
            table.setReservedBy(null);
            table.setReservationTime(null);
        } else if (newStatus == TableStatus.RESERVED) {
            table.setReservedBy(reservedBy);
            table.setReservationTime(LocalDateTime.now());
        }

        table = tableRepository.save(table);
        broadcastTableUpdate(table.getRestaurantId());
        return table;
    }

    public void broadcastTableUpdate(Long restaurantId) {
        messagingTemplate.convertAndSend("/topic/tables/" + restaurantId, getAllTablesWithDetails(restaurantId));
    }
}
