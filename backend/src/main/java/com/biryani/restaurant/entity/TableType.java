package com.biryani.restaurant.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "table_types")
public class TableType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String labelPrefix;
    private int defaultCapacity;

    private Long restaurantId;

    public TableType() {}

    public TableType(String name, String labelPrefix, int defaultCapacity) {
        this.name = name;
        this.labelPrefix = labelPrefix;
        this.defaultCapacity = defaultCapacity;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getLabelPrefix() { return labelPrefix; }
    public void setLabelPrefix(String labelPrefix) { this.labelPrefix = labelPrefix; }
    public int getDefaultCapacity() { return defaultCapacity; }
    public void setDefaultCapacity(int defaultCapacity) { this.defaultCapacity = defaultCapacity; }
    public Long getRestaurantId() { return restaurantId; }
    public void setRestaurantId(Long restaurantId) { this.restaurantId = restaurantId; }
}
