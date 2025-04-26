package com.plp.security;

import com.plp.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtService jwtService, UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String requestURI = request.getRequestURI();
        logger.debug("Processing request for URI: {}", requestURI);
        
        // Skip authentication for specific public endpoints
        if (requestURI.equals("/api/auth/login") || 
            requestURI.equals("/api/auth/register") ||
            requestURI.equals("/api/auth/refresh") ||
            requestURI.startsWith("/api/notifications/") ||
            requestURI.startsWith("/socket.io/")) {
            logger.debug("Skipping authentication for public endpoint: {}", requestURI);
            filterChain.doFilter(request, response);
            return;
        }

        // Handle preflight requests
        if (request.getMethod().equals("OPTIONS")) {
            response.setStatus(HttpServletResponse.SC_OK);
            filterChain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader("Authorization");
        logger.debug("Auth header: {}", authHeader != null ? "exists" : "null");

        // If no auth header, return 401
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            logger.error("Missing or invalid Authorization header for URI: {}", requestURI);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Missing or invalid authentication token");
            return;
        }

        try {
            String jwt = authHeader.substring(7);
            String userEmail = jwtService.extractUsername(jwt);
            logger.debug("Extracted username: {} for URI: {}", userEmail, requestURI);
            
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);
                logger.debug("Loaded user details for: {} URI: {}", userEmail, requestURI);
                
                if (jwtService.isTokenValid(jwt, userDetails)) {
                    logger.debug("Token is valid for user: {} URI: {}", userEmail, requestURI);
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                    );
                    authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                    );
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    logger.debug("Authentication set in SecurityContext for user: {} URI: {}", userEmail, requestURI);
                    filterChain.doFilter(request, response);
                    return;
                } else {
                    logger.error("Token validation failed for user: {} URI: {}", userEmail, requestURI);
                }
            } else {
                logger.error("No user email in token or authentication already exists for URI: {}", requestURI);
            }
            
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Invalid or expired token");
            
        } catch (Exception e) {
            logger.error("Error processing JWT token for URI {}: {}", requestURI, e.getMessage(), e);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Invalid or expired token");
        }
    }
} 