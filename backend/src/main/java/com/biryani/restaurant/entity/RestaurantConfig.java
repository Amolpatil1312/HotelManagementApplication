package com.biryani.restaurant.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "restaurant_config")
public class RestaurantConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String restaurantName;
    private String subtitle;
    private String logoEmoji;
    private String ownerName;
    private String address;
    private String city;
    private String phone;
    private String gstin;
    private String currencySymbol;
    private double tax1Rate;
    private String tax1Label;
    private double tax2Rate;
    private String tax2Label;
    private String thankYouMessage;
    private String receiptFooter;
    private boolean setupComplete;

    private Long restaurantId;

    public RestaurantConfig() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRestaurantName() { return restaurantName; }
    public void setRestaurantName(String restaurantName) { this.restaurantName = restaurantName; }
    public String getSubtitle() { return subtitle; }
    public void setSubtitle(String subtitle) { this.subtitle = subtitle; }
    public String getLogoEmoji() { return logoEmoji; }
    public void setLogoEmoji(String logoEmoji) { this.logoEmoji = logoEmoji; }
    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getGstin() { return gstin; }
    public void setGstin(String gstin) { this.gstin = gstin; }
    public String getCurrencySymbol() { return currencySymbol; }
    public void setCurrencySymbol(String currencySymbol) { this.currencySymbol = currencySymbol; }
    public double getTax1Rate() { return tax1Rate; }
    public void setTax1Rate(double tax1Rate) { this.tax1Rate = tax1Rate; }
    public String getTax1Label() { return tax1Label; }
    public void setTax1Label(String tax1Label) { this.tax1Label = tax1Label; }
    public double getTax2Rate() { return tax2Rate; }
    public void setTax2Rate(double tax2Rate) { this.tax2Rate = tax2Rate; }
    public String getTax2Label() { return tax2Label; }
    public void setTax2Label(String tax2Label) { this.tax2Label = tax2Label; }
    public String getThankYouMessage() { return thankYouMessage; }
    public void setThankYouMessage(String thankYouMessage) { this.thankYouMessage = thankYouMessage; }
    public String getReceiptFooter() { return receiptFooter; }
    public void setReceiptFooter(String receiptFooter) { this.receiptFooter = receiptFooter; }
    public boolean isSetupComplete() { return setupComplete; }
    public void setSetupComplete(boolean setupComplete) { this.setupComplete = setupComplete; }
    public Long getRestaurantId() { return restaurantId; }
    public void setRestaurantId(Long restaurantId) { this.restaurantId = restaurantId; }
}
