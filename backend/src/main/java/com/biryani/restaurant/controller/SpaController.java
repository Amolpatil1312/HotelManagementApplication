package com.biryani.restaurant.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaController {

    @RequestMapping(value = {"/", "/kitchen", "/table/{id}", "/admin", "/setup", "/login", "/register"})
    public String forward() {
        return "forward:/index.html";
    }
}
