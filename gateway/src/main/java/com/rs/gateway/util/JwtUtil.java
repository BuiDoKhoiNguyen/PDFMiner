package com.rs.gateway.util;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;

@Component
public class JwtUtil {
    @Value("${jwt.secret-key}")
    private String SECRET;

    public void validateToken(final String token) {
        try {
            Jwts.parserBuilder().setSigningKey(getSignKey()).build().parseClaimsJws(token);
        } catch (ExpiredJwtException e) {
            System.err.println("Token đã hết hạn: " + e.getMessage());
            throw e;
        } catch (UnsupportedJwtException e) {
            System.err.println("Token không được hỗ trợ: " + e.getMessage());
            throw e;
        } catch (MalformedJwtException e) {
            System.err.println("Token không đúng định dạng: " + e.getMessage());
            throw e;
        } catch (SignatureException e) {
            System.err.println("Lỗi chữ ký: " + e.getMessage());
            throw e;
        } catch (IllegalArgumentException e) {
            System.err.println("Lỗi đối số: " + e.getMessage());
            throw e;
        } catch (Exception e) {
            System.err.println("Lỗi không xác định: " + e.getClass().getName() + " - " + e.getMessage());
            throw e;
        }
    }

    private Key getSignKey() {
        try {
            byte[] keyBytes = Decoders.BASE64.decode(SECRET);
            return Keys.hmacShaKeyFor(keyBytes);
        } catch (Exception e) {
            System.err.println("Lỗi tạo SignKey: " + e.getMessage());
            throw e;
        }
    }
}