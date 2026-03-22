package com.biryani.restaurant.repository;

import com.biryani.restaurant.entity.RestaurantTable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TableRepository extends JpaRepository<RestaurantTable, Long> {
    Optional<RestaurantTable> findByTableNumber(Integer tableNumber);
    List<RestaurantTable> findByRestaurantId(Long restaurantId);
}
