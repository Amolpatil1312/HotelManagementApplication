package com.biryani.restaurant.repository;

import com.biryani.restaurant.entity.TableType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TableTypeRepository extends JpaRepository<TableType, Long> {
    List<TableType> findByRestaurantId(Long restaurantId);
}
