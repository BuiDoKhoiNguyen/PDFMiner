package com.rs.storageservice.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@Slf4j
public class S3Service {

    @Autowired
    private S3Client s3Client;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    public String uploadFile(MultipartFile file) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        
        // Tạo một key duy nhất để tránh trùng lặp
        String key = UUID.randomUUID().toString() + fileExtension;
        if (originalFilename != null) {
            key = originalFilename.substring(0, originalFilename.lastIndexOf(".")) + "_" + key;
        }
        
        Path tempFile = Files.createTempFile(null, null);
        file.transferTo(tempFile.toFile());
        
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build();

        s3Client.putObject(putObjectRequest, Paths.get(tempFile.toString()));
        Files.delete(tempFile);
        
        return String.format("https://%s.s3.amazonaws.com/%s", bucketName, key);
    }

    public byte[] downloadFile(String key) {
        try {
            Path tempFile = Files.createTempFile(null, null);
            
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            s3Client.getObject(getObjectRequest, tempFile);
            
            byte[] content = Files.readAllBytes(tempFile);
            Files.delete(tempFile);
            
            return content;
        } catch (IOException e) {
            log.error("Error downloading file from S3: {}", e.getMessage());
            throw new RuntimeException("Failed to download file from S3", e);
        }
    }

    public void deleteFile(String key) {
        DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build();
        
        s3Client.deleteObject(deleteObjectRequest);
    }
    
    public String getFileUrl(String key) {
        return String.format("https://%s.s3.amazonaws.com/%s", bucketName, key);
    }
}