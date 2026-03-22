package com.biryani.restaurant.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "restaurant_tables")
public class RestaurantTable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer tableNumber;

    @Column(nullable = false)
    private String tableType; // FAMILY or GENERAL

    @Column(nullable = false)
    private Integer capacity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TableStatus status = TableStatus.AVAILABLE;

    private String reservedBy;
    private LocalDateTime reservationTime;
    private LocalDateTime occupiedSince;

    private Long restaurantId;

    public enum TableStatus {
        AVAILABLE, OCCUPIED, RESERVED, CLEANING, WAITING_FOR_BILL
    }

    public RestaurantTable() {}

    public RestaurantTable(Integer tableNumber, String tableType, Integer capacity) {
        this.tableNumber = tableNumber;
        this.tableType = tableType;
        this.capacity = capacity;
        this.status = TableStatus.AVAILABLE;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Integer getTableNumber() { return tableNumber; }
    public void setTableNumber(Integer tableNumber) { this.tableNumber = tableNumber; }
    public String getTableType() { return tableType; }
    public void setTableType(String tableType) { this.tableType = tableType; }
    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }
    public TableStatus getStatus() { return status; }
    public void setStatus(TableStatus status) { this.status = status; }
    public String getReservedBy() { return reservedBy; }
    public void setReservedBy(String reservedBy) { this.reservedBy = reservedBy; }
    public LocalDateTime getReservationTime() { return reservationTime; }
    public void setReservationTime(LocalDateTime reservationTime) { this.reservationTime = reservationTime; }
    public LocalDateTime getOccupiedSince() { return occupiedSince; }
    public void setOccupiedSince(LocalDateTime occupiedSince) { this.occupiedSince = occupiedSince; }
    public Long getRestaurantId() { return restaurantId; }
    public void setRestaurantId(Long restaurantId) { this.restaurantId = restaurantId; }
}
