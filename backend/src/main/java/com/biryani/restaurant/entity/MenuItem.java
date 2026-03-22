package com.biryani.restaurant.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "menu_items")
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String category; // BIRYANI, THALI, DRINKS, EXTRAS

    @Column(nullable = false)
    private BigDecimal price;

    private String description;
    private boolean available = true;
    private String imageEmoji;

    private Long restaurantId;

    public MenuItem() {}

    public MenuItem(String name, String category, BigDecimal price, String description, String imageEmoji) {
        this.name = name;
        this.category = category;
        this.price = price;
        this.description = description;
        this.imageEmoji = imageEmoji;
        this.available = true;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }
    public String getImageEmoji() { return imageEmoji; }
    public void setImageEmoji(String imageEmoji) { this.imageEmoji = imageEmoji; }
    public Long getRestaurantId() { return restaurantId; }
    public void setRestaurantId(Long restaurantId) { this.restaurantId = restaurantId; }
}
