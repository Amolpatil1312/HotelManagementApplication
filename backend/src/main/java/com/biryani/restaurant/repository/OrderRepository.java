package com.biryani.restaurant.repository;

import com.biryani.restaurant.entity.Order;
import com.biryani.restaurant.entity.RestaurantTable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByRestaurantTableAndStatus(RestaurantTable table, Order.OrderStatus status);
    Optional<Order> findByRestaurantTableAndStatusAndGroupName(RestaurantTable table, Order.OrderStatus status, String groupName);
    List<Order> findByStatusOrderByCreatedAtDesc(Order.OrderStatus status);
    List<Order> findByStatusAndRestaurantIdOrderByCreatedAtDesc(Order.OrderStatus status, Long restaurantId);
    List<Order> findAllByOrderByCreatedAtDesc();
}
