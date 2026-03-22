package com.biryani.restaurant.dto;

public class AuthResponse {
    private String token;
    private String username;
    private String role;
    private String displayName;
    private Long restaurantId;

    public AuthResponse() {}

    public AuthResponse(String token, String username, String role, String displayName, Long restaurantId) {
        this.token = token;
        this.username = username;
        this.role = role;
        this.displayName = displayName;
        this.restaurantId = restaurantId;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public Long getRestaurantId() { return restaurantId; }
    public void setRestaurantId(Long restaurantId) { this.restaurantId = restaurantId; }
}
