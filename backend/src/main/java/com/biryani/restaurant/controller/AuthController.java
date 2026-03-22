package com.biryani.restaurant.controller;

import com.biryani.restaurant.dto.AuthResponse;
import com.biryani.restaurant.dto.LoginRequest;
import com.biryani.restaurant.dto.RegisterRequest;
import com.biryani.restaurant.entity.Restaurant;
import com.biryani.restaurant.entity.User;
import com.biryani.restaurant.repository.UserRepository;
import com.biryani.restaurant.security.AuthHelper;
import com.biryani.restaurant.security.JwtUtil;
import com.biryani.restaurant.service.RestaurantSetupService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder;
    private final RestaurantSetupService restaurantSetupService;

    public AuthController(UserRepository userRepository, JwtUtil jwtUtil,
                          BCryptPasswordEncoder passwordEncoder,
                          RestaurantSetupService restaurantSetupService) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
        this.restaurantSetupService = restaurantSetupService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid credentials"));
        }

        User user = userOpt.get();
        if (!user.isActive()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Account is disabled"));
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid credentials"));
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole(), user.getRestaurantId());
        AuthResponse response = new AuthResponse(token, user.getUsername(), user.getRole(), user.getDisplayName(), user.getRestaurantId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request,
                                      @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String username = request.getUsername().trim();

        if (userRepository.existsByUsername(username)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Username already exists"));
        }

        Long restaurantId = null;

        boolean isAdminAddingStaff = false;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            String role = jwtUtil.getRoleFromToken(token);
            Long tokenRestaurantId = jwtUtil.getRestaurantIdFromToken(token);
            if ("ADMIN".equals(role) && tokenRestaurantId != null) {
                // Valid admin token — adding staff to their restaurant
                restaurantId = tokenRestaurantId;
                isAdminAddingStaff = true;
            }
            // If token is invalid/expired, fall through to new restaurant registration
        }

        if (!isAdminAddingStaff) {
            // New restaurant registration — must provide restaurantName
            String restaurantName = request.getRestaurantName();
            if (restaurantName == null || restaurantName.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Restaurant name is required"));
            }

            // Create new restaurant with default setup
            Restaurant restaurant = restaurantSetupService.createRestaurant(restaurantName.trim());
            restaurantId = restaurant.getId();
        }

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setDisplayName(request.getDisplayName());
        user.setRestaurantId(restaurantId);
        user.setActive(true);

        if (isAdminAddingStaff) {
            user.setRole(request.getRole() != null ? request.getRole() : "STAFF");
        } else {
            user.setRole("ADMIN");
        }

        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole(), user.getRestaurantId());
        AuthResponse response = new AuthResponse(token, user.getUsername(), user.getRole(), user.getDisplayName(), user.getRestaurantId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }

        String token = authHeader.substring(7);
        String username = jwtUtil.getUsernameFromToken(token);
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid token"));
        }

        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not found"));
        }

        User user = userOpt.get();
        AuthResponse response = new AuthResponse(null, user.getUsername(), user.getRole(), user.getDisplayName(), user.getRestaurantId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/has-admin")
    public ResponseEntity<?> hasAdmin() {
        // In multi-tenant mode, this always returns false to allow new restaurant registration
        // Each new registration creates its own restaurant
        Map<String, Boolean> response = new HashMap<>();
        response.put("hasAdmin", false);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id,
                                         @RequestBody Map<String, Object> updates) {
        Long restaurantId = AuthHelper.getRestaurantId();
        if (restaurantId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }

        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }

        User user = userOpt.get();
        if (!restaurantId.equals(user.getRestaurantId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied"));
        }

        if (updates.containsKey("displayName")) {
            user.setDisplayName((String) updates.get("displayName"));
        }
        if (updates.containsKey("role")) {
            user.setRole((String) updates.get("role"));
        }
        if (updates.containsKey("active")) {
            user.setActive((Boolean) updates.get("active"));
        }
        if (updates.containsKey("password")) {
            String newPassword = (String) updates.get("password");
            if (newPassword != null && !newPassword.isEmpty()) {
                user.setPassword(passwordEncoder.encode(newPassword));
            }
        }

        userRepository.save(user);

        Map<String, Object> result = new HashMap<>();
        result.put("id", user.getId());
        result.put("username", user.getUsername());
        result.put("role", user.getRole());
        result.put("displayName", user.getDisplayName());
        result.put("active", user.isActive());
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        Long restaurantId = AuthHelper.getRestaurantId();
        String username = AuthHelper.getUsername();
        if (restaurantId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }

        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }

        User user = userOpt.get();
        if (!restaurantId.equals(user.getRestaurantId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied"));
        }

        if (user.getUsername().equals(username)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Cannot delete your own account"));
        }

        userRepository.delete(user);
        return ResponseEntity.ok(Map.of("message", "User deleted"));
    }

    @GetMapping("/users")
    public ResponseEntity<?> getUsers() {
        Long restaurantId = AuthHelper.getRestaurantId();
        if (restaurantId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }

        List<User> users = userRepository.findByRestaurantId(restaurantId);
        List<Map<String, Object>> userList = users.stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("username", u.getUsername());
            map.put("role", u.getRole());
            map.put("displayName", u.getDisplayName());
            map.put("active", u.isActive());
            return map;
        }).toList();

        return ResponseEntity.ok(userList);
    }
}
