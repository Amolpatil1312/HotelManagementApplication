package com.biryani.restaurant.controller;

import com.biryani.restaurant.entity.Category;
import com.biryani.restaurant.entity.RestaurantConfig;
import com.biryani.restaurant.entity.TableType;
import com.biryani.restaurant.repository.CategoryRepository;
import com.biryani.restaurant.repository.RestaurantConfigRepository;
import com.biryani.restaurant.repository.TableTypeRepository;
import com.biryani.restaurant.security.AuthHelper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/config")
public class ConfigController {

    private final RestaurantConfigRepository configRepository;
    private final CategoryRepository categoryRepository;
    private final TableTypeRepository tableTypeRepository;

    public ConfigController(RestaurantConfigRepository configRepository,
                            CategoryRepository categoryRepository,
                            TableTypeRepository tableTypeRepository) {
        this.configRepository = configRepository;
        this.categoryRepository = categoryRepository;
        this.tableTypeRepository = tableTypeRepository;
    }

    // ===== RESTAURANT CONFIG =====

    @GetMapping
    public ResponseEntity<RestaurantConfig> getConfig() {
        Long restaurantId = AuthHelper.getRestaurantId();
        if (restaurantId == null) {
            return ResponseEntity.notFound().build();
        }
        return configRepository.findByRestaurantId(restaurantId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping
    public ResponseEntity<RestaurantConfig> updateConfig(@RequestBody RestaurantConfig updates) {
        Long restaurantId = AuthHelper.getRestaurantId();
        if (restaurantId == null) {
            return ResponseEntity.notFound().build();
        }

        RestaurantConfig config = configRepository.findByRestaurantId(restaurantId)
                .orElseThrow(() -> new RuntimeException("Config not found"));

        if (updates.getRestaurantName() != null) config.setRestaurantName(updates.getRestaurantName());
        if (updates.getSubtitle() != null) config.setSubtitle(updates.getSubtitle());
        if (updates.getLogoEmoji() != null) config.setLogoEmoji(updates.getLogoEmoji());
        if (updates.getOwnerName() != null) config.setOwnerName(updates.getOwnerName());
        if (updates.getAddress() != null) config.setAddress(updates.getAddress());
        if (updates.getCity() != null) config.setCity(updates.getCity());
        if (updates.getPhone() != null) config.setPhone(updates.getPhone());
        if (updates.getGstin() != null) config.setGstin(updates.getGstin());
        if (updates.getCurrencySymbol() != null) config.setCurrencySymbol(updates.getCurrencySymbol());
        if (updates.getTax1Label() != null) config.setTax1Label(updates.getTax1Label());
        config.setTax1Rate(updates.getTax1Rate());
        if (updates.getTax2Label() != null) config.setTax2Label(updates.getTax2Label());
        config.setTax2Rate(updates.getTax2Rate());
        if (updates.getThankYouMessage() != null) config.setThankYouMessage(updates.getThankYouMessage());
        if (updates.getReceiptFooter() != null) config.setReceiptFooter(updates.getReceiptFooter());
        config.setSetupComplete(updates.isSetupComplete());

        return ResponseEntity.ok(configRepository.save(config));
    }

    // ===== CATEGORIES =====

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getCategories() {
        Long restaurantId = AuthHelper.getRestaurantId();
        if (restaurantId == null) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(categoryRepository.findByRestaurantIdOrderByDisplayOrderAsc(restaurantId));
    }

    @PostMapping("/categories")
    public ResponseEntity<Category> addCategory(@RequestBody Category category) {
        Long restaurantId = AuthHelper.getRestaurantId();
        category.setId(null);
        category.setRestaurantId(restaurantId);
        return ResponseEntity.ok(categoryRepository.save(category));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<Category> updateCategory(@PathVariable Long id, @RequestBody Category updates) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        if (updates.getName() != null) category.setName(updates.getName());
        if (updates.getEmoji() != null) category.setEmoji(updates.getEmoji());
        category.setDisplayOrder(updates.getDisplayOrder());
        return ResponseEntity.ok(categoryRepository.save(category));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Map<String, String>> deleteCategory(@PathVariable Long id) {
        categoryRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Category deleted"));
    }

    // ===== TABLE TYPES =====

    @GetMapping("/table-types")
    public ResponseEntity<List<TableType>> getTableTypes() {
        Long restaurantId = AuthHelper.getRestaurantId();
        if (restaurantId == null) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(tableTypeRepository.findByRestaurantId(restaurantId));
    }

    @PostMapping("/table-types")
    public ResponseEntity<TableType> addTableType(@RequestBody TableType tableType) {
        Long restaurantId = AuthHelper.getRestaurantId();
        tableType.setId(null);
        tableType.setRestaurantId(restaurantId);
        return ResponseEntity.ok(tableTypeRepository.save(tableType));
    }

    @PutMapping("/table-types/{id}")
    public ResponseEntity<TableType> updateTableType(@PathVariable Long id, @RequestBody TableType updates) {
        TableType tableType = tableTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Table type not found"));
        if (updates.getName() != null) tableType.setName(updates.getName());
        if (updates.getLabelPrefix() != null) tableType.setLabelPrefix(updates.getLabelPrefix());
        tableType.setDefaultCapacity(updates.getDefaultCapacity());
        return ResponseEntity.ok(tableTypeRepository.save(tableType));
    }

    @DeleteMapping("/table-types/{id}")
    public ResponseEntity<Map<String, String>> deleteTableType(@PathVariable Long id) {
        tableTypeRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Table type deleted"));
    }
}
