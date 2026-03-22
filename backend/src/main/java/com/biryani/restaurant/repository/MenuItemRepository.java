package com.biryani.restaurant.repository;

import com.biryani.restaurant.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByCategory(String category);
    List<MenuItem> findByAvailableTrue();
    List<MenuItem> findByRestaurantId(Long restaurantId);
    List<MenuItem> findByAvailableTrueAndRestaurantId(Long restaurantId);
}
