package com.trading.community.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.trading.community.security.JwtAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize
                        // Endpoints that require authentication even if GET
                        .requestMatchers("/api/community/profile/me").authenticated()
                        .requestMatchers("/api/community/ideas/bookmarked").authenticated()
                        .requestMatchers("/api/community/groups/my").authenticated()
                        .requestMatchers("/api/community/groups/*/members/pending").authenticated()
                        .requestMatchers("/api/community/friends/**").authenticated()
                        .requestMatchers("/api/community/notifications/**").authenticated()
                        // Public GET endpoints
                        .requestMatchers(HttpMethod.GET, "/api/community/ideas/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/community/posts/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/community/groups/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/community/profile/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/community/followers/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/community/following/**").permitAll()
                        .requestMatchers("/api/community/health").permitAll()
                        .requestMatchers("/error").permitAll()
                        // All other endpoints require authentication
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
