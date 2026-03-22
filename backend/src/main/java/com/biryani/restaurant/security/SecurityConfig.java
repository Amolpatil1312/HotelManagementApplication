package com.biryani.restaurant.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .headers(headers -> headers.frameOptions(frame -> frame.disable()))
            .authorizeHttpRequests(auth -> auth
                // Allow CORS preflight
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Public endpoints
                .requestMatchers("/api/auth/login", "/api/auth/has-admin", "/api/auth/register").permitAll()
                .requestMatchers("/ws/**").permitAll()
                .requestMatchers("/h2-console/**").permitAll()
                // Static resources
                .requestMatchers("/", "/index.html", "/assets/**", "/favicon.ico", "/*.js", "/*.css", "/*.png", "/*.svg", "/*.ico").permitAll()
                .requestMatchers("/login", "/register", "/kitchen", "/admin", "/setup", "/table/**").permitAll()
                // Admin only endpoints
                .requestMatchers(HttpMethod.PUT, "/api/config").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/config/categories/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/config/categories/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/config/categories/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/config/table-types/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/config/table-types/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/config/table-types/**").hasRole("ADMIN")
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/auth/users").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/auth/users/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/auth/users/**").hasRole("ADMIN")
                // Authenticated endpoints
                .requestMatchers("/api/orders/**").authenticated()
                .requestMatchers("/api/tables/**").authenticated()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public BCryptPasswordEncoder bCryptPasswordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
