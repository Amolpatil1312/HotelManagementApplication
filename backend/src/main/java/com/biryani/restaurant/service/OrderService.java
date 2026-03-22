package com.biryani.restaurant.service;

import com.biryani.restaurant.dto.AddItemsRequest;
import com.biryani.restaurant.dto.OrderItemRequest;
import com.biryani.restaurant.dto.OrderRequest;
import com.biryani.restaurant.entity.*;
import com.biryani.restaurant.entity.OrderItem.ItemStatus;
import com.biryani.restaurant.entity.RestaurantTable.TableStatus;
import com.biryani.restaurant.repository.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final TableRepository tableRepository;
    private final MenuItemRepository menuItemRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final TableService tableService;

    public OrderService(OrderRepository orderRepository, OrderItemRepository orderItemRepository,
                        TableRepository tableRepository, MenuItemRepository menuItemRepository,
                        SimpMessagingTemplate messagingTemplate, TableService tableService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.tableRepository = tableRepository;
        this.menuItemRepository = menuItemRepository;
        this.messagingTemplate = messagingTemplate;
        this.tableService = tableService;
    }

    @Transactional
    public Order createOrder(OrderRequest request, Long restaurantId) {
        RestaurantTable table = tableRepository.findById(request.getTableId())
                .orElseThrow(() -> new RuntimeException("Table not found"));

        String groupName = request.getGroupName();
        if (groupName == null || groupName.isBlank()) {
            List<Order> activeOrders = orderRepository.findByRestaurantTableAndStatus(table, Order.OrderStatus.ACTIVE);
            groupName = "Group " + (activeOrders.size() + 1);
        }

        Optional<Order> existingGroup = orderRepository.findByRestaurantTableAndStatusAndGroupName(
                table, Order.OrderStatus.ACTIVE, groupName);
        if (existingGroup.isPresent()) {
            throw new RuntimeException("This table already has an active order for '" + groupName + "'. Add items to existing order instead.");
        }

        Order order = new Order();
        order.setRestaurantTable(table);
        order.setWaiterName(request.getWaiterName());
        order.setGroupName(groupName);
        order.setNumberOfPeople(request.getNumberOfPeople() > 0 ? request.getNumberOfPeople() : 1);
        order.setCreatedAt(LocalDateTime.now());
        order.setRestaurantId(restaurantId);
        order = orderRepository.save(order);

        addItemsToOrder(order, request.getItems());

        table.setStatus(TableStatus.OCCUPIED);
        if (table.getOccupiedSince() == null) {
            table.setOccupiedSince(LocalDateTime.now());
        }
        tableRepository.save(table);

        order = orderRepository.findById(order.getId()).orElseThrow();

        broadcastKitchenUpdate(restaurantId);
        tableService.broadcastTableUpdate(restaurantId);

        return order;
    }

    @Transactional
    public Order addItemsToExistingOrder(Long orderId, AddItemsRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (order.getStatus() != Order.OrderStatus.ACTIVE) {
            throw new RuntimeException("Cannot add items to a non-active order");
        }

        addItemsToOrder(order, request.getItems());
        order = orderRepository.findById(orderId).orElseThrow();

        Long restaurantId = order.getRestaurantId();
        broadcastKitchenUpdate(restaurantId);
        tableService.broadcastTableUpdate(restaurantId);

        return order;
    }

    private void addItemsToOrder(Order order, List<OrderItemRequest> items) {
        for (OrderItemRequest itemReq : items) {
            MenuItem menuItem = menuItemRepository.findById(itemReq.getMenuItemId())
                    .orElseThrow(() -> new RuntimeException("Menu item not found: " + itemReq.getMenuItemId()));

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setMenuItemId(menuItem.getId());
            orderItem.setItemName(menuItem.getName());
            orderItem.setCategory(menuItem.getCategory());
            orderItem.setPrice(menuItem.getPrice());
            orderItem.setQuantity(itemReq.getQuantity());
            orderItem.setSpecialInstructions(itemReq.getSpecialInstructions());
            orderItem.setOrderedAt(LocalDateTime.now());
            orderItemRepository.save(orderItem);
        }
    }

    @Transactional
    public OrderItem updateItemStatus(Long itemId, String status) {
        OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Order item not found"));

        item.setStatus(ItemStatus.valueOf(status));
        item = orderItemRepository.save(item);

        Order order = item.getOrder();
        order = orderRepository.findById(order.getId()).orElseThrow();
        boolean allServedInOrder = order.getItems().stream()
                .allMatch(i -> i.getStatus() == ItemStatus.SERVED);

        if (allServedInOrder) {
            RestaurantTable table = order.getRestaurantTable();
            List<Order> activeOrders = orderRepository.findByRestaurantTableAndStatus(table, Order.OrderStatus.ACTIVE);
            boolean allGroupsServed = activeOrders.stream().allMatch(o ->
                o.getItems().stream().allMatch(i -> i.getStatus() == ItemStatus.SERVED)
            );

            if (allGroupsServed) {
                table.setStatus(TableStatus.WAITING_FOR_BILL);
                tableRepository.save(table);
            }
        }

        Long restaurantId = order.getRestaurantId();
        broadcastKitchenUpdate(restaurantId);
        tableService.broadcastTableUpdate(restaurantId);

        return item;
    }

    @Transactional
    public Order completeOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        order.setStatus(Order.OrderStatus.COMPLETED);
        order.setCompletedAt(LocalDateTime.now());
        order = orderRepository.save(order);

        RestaurantTable table = order.getRestaurantTable();
        List<Order> remainingActive = orderRepository.findByRestaurantTableAndStatus(table, Order.OrderStatus.ACTIVE);

        if (remainingActive.isEmpty()) {
            table.setStatus(TableStatus.CLEANING);
            table.setOccupiedSince(null);
            tableRepository.save(table);
        }

        Long restaurantId = order.getRestaurantId();
        broadcastKitchenUpdate(restaurantId);
        tableService.broadcastTableUpdate(restaurantId);

        return order;
    }

    public Order getOrderById(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
    }

    public List<Order> getActiveOrdersForTable(Long tableId) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new RuntimeException("Table not found"));
        return orderRepository.findByRestaurantTableAndStatus(table, Order.OrderStatus.ACTIVE);
    }

    public List<Map<String, Object>> getKitchenOrders(Long restaurantId) {
        List<Order> activeOrders = orderRepository.findByStatusAndRestaurantIdOrderByCreatedAtDesc(
                Order.OrderStatus.ACTIVE, restaurantId);
        List<Map<String, Object>> kitchenOrders = new ArrayList<>();

        for (Order order : activeOrders) {
            boolean hasKitchenItems = order.getItems().stream()
                    .anyMatch(item -> item.getStatus() != ItemStatus.SERVED);
            if (!hasKitchenItems) continue;

            Map<String, Object> orderData = new LinkedHashMap<>();
            orderData.put("orderId", order.getId());
            orderData.put("tableNumber", order.getRestaurantTable().getTableNumber());
            orderData.put("tableType", order.getRestaurantTable().getTableType());
            orderData.put("groupName", order.getGroupName());
            orderData.put("waiterName", order.getWaiterName());
            orderData.put("createdAt", order.getCreatedAt());

            List<Map<String, Object>> itemsList = order.getItems().stream()
                    .filter(item -> item.getStatus() != ItemStatus.SERVED)
                    .map(item -> {
                        Map<String, Object> itemData = new LinkedHashMap<>();
                        itemData.put("id", item.getId());
                        itemData.put("itemName", item.getItemName());
                        itemData.put("category", item.getCategory());
                        itemData.put("quantity", item.getQuantity());
                        itemData.put("specialInstructions", item.getSpecialInstructions());
                        itemData.put("status", item.getStatus().name());
                        itemData.put("orderedAt", item.getOrderedAt());
                        return itemData;
                    })
                    .collect(Collectors.toList());

            orderData.put("items", itemsList);
            kitchenOrders.add(orderData);
        }

        return kitchenOrders;
    }

    public Map<String, Object> getOrderDetails(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", order.getId());
        result.put("tableNumber", order.getRestaurantTable().getTableNumber());
        result.put("tableType", order.getRestaurantTable().getTableType());
        result.put("tableId", order.getRestaurantTable().getId());
        result.put("groupName", order.getGroupName());
        result.put("numberOfPeople", order.getNumberOfPeople());
        result.put("status", order.getStatus().name());
        result.put("waiterName", order.getWaiterName());
        result.put("createdAt", order.getCreatedAt());
        result.put("completedAt", order.getCompletedAt());
        result.put("totalAmount", order.getTotalAmount());
        result.put("totalItems", order.getTotalItems());

        List<Map<String, Object>> items = order.getItems().stream()
                .map(item -> {
                    Map<String, Object> itemData = new LinkedHashMap<>();
                    itemData.put("id", item.getId());
                    itemData.put("itemName", item.getItemName());
                    itemData.put("category", item.getCategory());
                    itemData.put("price", item.getPrice());
                    itemData.put("quantity", item.getQuantity());
                    itemData.put("specialInstructions", item.getSpecialInstructions());
                    itemData.put("status", item.getStatus().name());
                    itemData.put("orderedAt", item.getOrderedAt());
                    return itemData;
                })
                .collect(Collectors.toList());

        result.put("items", items);
        return result;
    }

    private void broadcastKitchenUpdate(Long restaurantId) {
        messagingTemplate.convertAndSend("/topic/kitchen/" + restaurantId, getKitchenOrders(restaurantId));
    }
}
