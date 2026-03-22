package com.biryani.restaurant.repository;

import com.biryani.restaurant.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByOrderIdOrderByOrderedAtDesc(Long orderId);
    List<OrderItem> findByStatusInOrderByOrderedAtAsc(List<OrderItem.ItemStatus> statuses);
}
