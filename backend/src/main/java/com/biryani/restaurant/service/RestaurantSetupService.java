package com.biryani.restaurant.service;

import com.biryani.restaurant.entity.*;
import com.biryani.restaurant.repository.*;
import org.springframework.stereotype.Service;

@Service
public class RestaurantSetupService {

    private final RestaurantRepository restaurantRepository;
    private final RestaurantConfigRepository configRepository;
    private final CategoryRepository categoryRepository;
    private final TableTypeRepository tableTypeRepository;

    public RestaurantSetupService(RestaurantRepository restaurantRepository,
                                   RestaurantConfigRepository configRepository,
                                   CategoryRepository categoryRepository,
                                   TableTypeRepository tableTypeRepository) {
        this.restaurantRepository = restaurantRepository;
        this.configRepository = configRepository;
        this.categoryRepository = categoryRepository;
        this.tableTypeRepository = tableTypeRepository;
    }

    public Restaurant createRestaurant(String name) {
        Restaurant restaurant = new Restaurant(name);
        restaurant = restaurantRepository.save(restaurant);

        createDefaultConfig(restaurant.getId(), name);
        createDefaultCategories(restaurant.getId());
        createDefaultTableTypes(restaurant.getId());

        return restaurant;
    }

    private void createDefaultConfig(Long restaurantId, String name) {
        RestaurantConfig config = new RestaurantConfig();
        config.setRestaurantId(restaurantId);
        config.setRestaurantName(name);
        config.setSubtitle("Restaurant Management System");
        config.setLogoEmoji("\uD83C\uDF7D\uFE0F");
        config.setOwnerName("");
        config.setAddress("");
        config.setCity("");
        config.setPhone("");
        config.setGstin("");
        config.setCurrencySymbol("\u20B9");
        config.setTax1Rate(2.5);
        config.setTax1Label("CGST");
        config.setTax2Rate(2.5);
        config.setTax2Label("SGST");
        config.setThankYouMessage("Thank you! Visit again \uD83D\uDE4F");
        config.setReceiptFooter("Powered by Restaurant POS");
        config.setSetupComplete(false);
        configRepository.save(config);
    }

    private void createDefaultCategories(Long restaurantId) {
        saveCategory(restaurantId, "STARTERS", "\uD83C\uDF72", 1);
        saveCategory(restaurantId, "MAIN COURSE", "\uD83C\uDF5B", 2);
        saveCategory(restaurantId, "BEVERAGES", "\uD83E\uDD64", 3);
        saveCategory(restaurantId, "DESSERTS", "\uD83C\uDF70", 4);
    }

    private void saveCategory(Long restaurantId, String name, String emoji, int order) {
        Category cat = new Category(name, emoji, order);
        cat.setRestaurantId(restaurantId);
        categoryRepository.save(cat);
    }

    private void createDefaultTableTypes(Long restaurantId) {
        TableType family = new TableType("FAMILY", "F", 8);
        family.setRestaurantId(restaurantId);
        tableTypeRepository.save(family);

        TableType general = new TableType("GENERAL", "T", 4);
        general.setRestaurantId(restaurantId);
        tableTypeRepository.save(general);
    }
}
