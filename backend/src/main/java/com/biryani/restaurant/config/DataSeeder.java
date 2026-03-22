package com.biryani.restaurant.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    @Override
    public void run(String... args) {
        // In multi-tenant mode, each restaurant gets its default data during registration
        // via RestaurantSetupService. No global seeding needed.
        System.out.println("=== Multi-tenant mode: data is created per-restaurant during registration ===");
    }
}
