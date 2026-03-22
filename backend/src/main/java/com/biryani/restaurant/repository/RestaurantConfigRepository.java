package com.biryani.restaurant.repository;

import com.biryani.restaurant.entity.RestaurantConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RestaurantConfigRepository extends JpaRepository<RestaurantConfig, Long> {
    Optional<RestaurantConfig> findByRestaurantId(Long restaurantId);
}
