package com.plp.service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.SignatureException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private static final Logger logger = LoggerFactory.getLogger(JwtService.class);
    private static final SignatureAlgorithm SIGNATURE_ALGORITHM = SignatureAlgorithm.HS256;

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration;

    private Key getSigningKey() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String extractUsername(String token) {
        try {
            return extractClaim(token, Claims::getSubject);
        } catch (Exception e) {
            logger.error("Error extracting username from token: {}", e.getMessage());
            return null;
        }
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        try {
            String token = Jwts
                    .builder()
                    .setClaims(extraClaims)
                    .setSubject(userDetails.getUsername())
                    .setIssuedAt(new Date(System.currentTimeMillis()))
                    .setExpiration(new Date(System.currentTimeMillis() + expiration))
                    .signWith(getSigningKey(), SIGNATURE_ALGORITHM)
                    .compact();
            logger.debug("Generated token for user: {}", userDetails.getUsername());
            return token;
        } catch (Exception e) {
            logger.error("Error generating token for user {}: {}", userDetails.getUsername(), e.getMessage());
            throw e;
        }
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            boolean isValid = (username != null && username.equals(userDetails.getUsername())) && !isTokenExpired(token);
            if (!isValid) {
                logger.debug("Token validation failed - Username match: {}, Not expired: {}", 
                    username != null && username.equals(userDetails.getUsername()), 
                    !isTokenExpired(token));
            }
            return isValid;
        } catch (ExpiredJwtException e) {
            logger.error("Token expired for user: {}", userDetails.getUsername());
            return false;
        } catch (SignatureException e) {
            logger.error("Invalid JWT signature for user: {}", userDetails.getUsername());
            return false;
        } catch (MalformedJwtException e) {
            logger.error("Invalid JWT token for user: {}", userDetails.getUsername());
            return false;
        } catch (UnsupportedJwtException e) {
            logger.error("Unsupported JWT token for user: {}", userDetails.getUsername());
            return false;
        } catch (Exception e) {
            logger.error("Error validating token for user {}: {}", userDetails.getUsername(), e.getMessage());
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
        try {
            return extractExpiration(token).before(new Date());
        } catch (Exception e) {
            logger.error("Error checking token expiration: {}", e.getMessage());
            return true;
        }
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        try {
            return Jwts
                    .parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (Exception e) {
            logger.error("Error extracting claims from token: {}", e.getMessage());
            throw e;
        }
    }
} 