package com.biryani.restaurant.controller;

import com.biryani.restaurant.entity.MenuItem;
import com.biryani.restaurant.entity.RestaurantTable;
import com.biryani.restaurant.repository.MenuItemRepository;
import com.biryani.restaurant.repository.TableRepository;
import com.biryani.restaurant.security.AuthHelper;
import com.biryani.restaurant.service.TableService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final TableRepository tableRepository;
    private final MenuItemRepository menuItemRepository;
    private final TableService tableService;

    public AdminController(TableRepository tableRepository, MenuItemRepository menuItemRepository,
                           TableService tableService) {
        this.tableRepository = tableRepository;
        this.menuItemRepository = menuItemRepository;
        this.tableService = tableService;
    }

    // ===== TABLE MANAGEMENT =====

    @GetMapping("/tables")
    public ResponseEntity<List<RestaurantTable>> getAllTables() {
        Long restaurantId = AuthHelper.getRestaurantId();
        return ResponseEntity.ok(tableRepository.findByRestaurantId(restaurantId));
    }

    @PostMapping("/tables")
    public ResponseEntity<RestaurantTable> addTable(@RequestBody RestaurantTable table) {
        Long restaurantId = AuthHelper.getRestaurantId();
        table.setId(null);
        table.setStatus(RestaurantTable.TableStatus.AVAILABLE);
        table.setRestaurantId(restaurantId);
        RestaurantTable saved = tableRepository.save(table);
        tableService.broadcastTableUpdate(restaurantId);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/tables/{id}")
    public ResponseEntity<RestaurantTable> updateTable(@PathVariable Long id,
                                                        @RequestBody Map<String, Object> updates) {
        Long restaurantId = AuthHelper.getRestaurantId();
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Table not found"));

        if (!restaurantId.equals(table.getRestaurantId())) {
            return ResponseEntity.status(403).build();
        }

        if (updates.containsKey("tableNumber")) {
            table.setTableNumber((Integer) updates.get("tableNumber"));
        }
        if (updates.containsKey("tableType")) {
            table.setTableType((String) updates.get("tableType"));
        }
        if (updates.containsKey("capacity")) {
            table.setCapacity((Integer) updates.get("capacity"));
        }

        RestaurantTable saved = tableRepository.save(table);
        tableService.broadcastTableUpdate(restaurantId);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/tables/{id}")
    public ResponseEntity<Map<String, String>> deleteTable(@PathVariable Long id) {
        Long restaurantId = AuthHelper.getRestaurantId();
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Table not found"));

        if (!restaurantId.equals(table.getRestaurantId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }

        if (table.getStatus() != RestaurantTable.TableStatus.AVAILABLE) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot delete a table that is not available"));
        }
        tableRepository.deleteById(id);
        tableService.broadcastTableUpdate(restaurantId);
        return ResponseEntity.ok(Map.of("message", "Table deleted"));
    }

    // ===== MENU MANAGEMENT =====

    @GetMapping("/menu")
    public ResponseEntity<List<MenuItem>> getAllMenuItems() {
        Long restaurantId = AuthHelper.getRestaurantId();
        return ResponseEntity.ok(menuItemRepository.findByRestaurantId(restaurantId));
    }

    @PostMapping("/menu")
    public ResponseEntity<MenuItem> addMenuItem(@RequestBody MenuItem item) {
        Long restaurantId = AuthHelper.getRestaurantId();
        item.setId(null);
        item.setAvailable(true);
        item.setRestaurantId(restaurantId);
        return ResponseEntity.ok(menuItemRepository.save(item));
    }

    @PutMapping("/menu/{id}")
    public ResponseEntity<MenuItem> updateMenuItem(@PathVariable Long id,
                                                    @RequestBody Map<String, Object> updates) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Menu item not found"));

        if (updates.containsKey("name")) {
            item.setName((String) updates.get("name"));
        }
        if (updates.containsKey("category")) {
            item.setCategory((String) updates.get("category"));
        }
        if (updates.containsKey("price")) {
            item.setPrice(new java.math.BigDecimal(updates.get("price").toString()));
        }
        if (updates.containsKey("description")) {
            item.setDescription((String) updates.get("description"));
        }
        if (updates.containsKey("imageEmoji")) {
            item.setImageEmoji((String) updates.get("imageEmoji"));
        }
        if (updates.containsKey("available")) {
            item.setAvailable((Boolean) updates.get("available"));
        }

        return ResponseEntity.ok(menuItemRepository.save(item));
    }

    @DeleteMapping("/menu/{id}")
    public ResponseEntity<Map<String, String>> deleteMenuItem(@PathVariable Long id) {
        menuItemRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Menu item deleted"));
    }
}
