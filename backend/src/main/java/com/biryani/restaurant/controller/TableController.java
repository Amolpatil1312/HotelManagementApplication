package com.biryani.restaurant.controller;

import com.biryani.restaurant.entity.RestaurantTable;
import com.biryani.restaurant.security.AuthHelper;
import com.biryani.restaurant.service.TableService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tables")
public class TableController {

    private final TableService tableService;

    public TableController(TableService tableService) {
        this.tableService = tableService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllTables() {
        Long restaurantId = AuthHelper.getRestaurantId();
        return ResponseEntity.ok(tableService.getAllTablesWithDetails(restaurantId));
    }

    @PutMapping("/{tableId}/status")
    public ResponseEntity<RestaurantTable> updateStatus(
            @PathVariable Long tableId,
            @RequestBody Map<String, String> request) {
        String status = request.get("status");
        String reservedBy = request.get("reservedBy");
        return ResponseEntity.ok(tableService.updateTableStatus(tableId, status, reservedBy));
    }
}
