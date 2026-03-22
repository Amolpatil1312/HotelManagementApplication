package com.biryani.restaurant.controller;

import com.biryani.restaurant.entity.MenuItem;
import com.biryani.restaurant.repository.MenuItemRepository;
import com.biryani.restaurant.security.AuthHelper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/menu")
public class MenuController {

    private final MenuItemRepository menuItemRepository;

    public MenuController(MenuItemRepository menuItemRepository) {
        this.menuItemRepository = menuItemRepository;
    }

    @GetMapping
    public ResponseEntity<List<MenuItem>> getAllMenuItems() {
        Long restaurantId = AuthHelper.getRestaurantId();
        if (restaurantId == null) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(menuItemRepository.findByAvailableTrueAndRestaurantId(restaurantId));
    }

    @GetMapping("/grouped")
    public ResponseEntity<Map<String, List<MenuItem>>> getMenuGrouped() {
        Long restaurantId = AuthHelper.getRestaurantId();
        if (restaurantId == null) {
            return ResponseEntity.ok(Map.of());
        }
        Map<String, List<MenuItem>> grouped = menuItemRepository.findByAvailableTrueAndRestaurantId(restaurantId)
                .stream()
                .collect(Collectors.groupingBy(MenuItem::getCategory));
        return ResponseEntity.ok(grouped);
    }
}
