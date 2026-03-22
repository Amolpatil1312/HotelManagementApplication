package com.biryani.restaurant.dto;

import java.util.List;

public class AddItemsRequest {
    private List<OrderItemRequest> items;

    public List<OrderItemRequest> getItems() { return items; }
    public void setItems(List<OrderItemRequest> items) { this.items = items; }
}
