package com.biryani.restaurant.repository;

import com.biryani.restaurant.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    boolean existsByRole(String role);
    boolean existsByRoleAndRestaurantId(String role, Long restaurantId);
    List<User> findByRestaurantId(Long restaurantId);
}
