#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kafka Consumer for Document Processing

This script consumes messages from a Kafka topic containing document information,
processes documents using the document processing service, and handles error scenarios.

Environment variables:
    KAFKA_BOOTSTRAP_SERVERS: Kafka server address(es)
    KAFKA_GROUP_ID: Consumer group ID 
    DOCUMENT_SERVICE_URL: URL of the document service
"""

from kafka import KafkaConsumer
from kafka.errors import KafkaError, CommitFailedError
import json
import os
import time
import requests
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("kafka_consumer")

# Load environment variables
load_dotenv()

# Kafka configuration
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
KAFKA_GROUP_ID = os.getenv("KAFKA_GROUP_ID", "document-process-group")
KAFKA_TOPIC = "file-uploaded"
DOCUMENT_SERVICE_URL = os.getenv("DOCUMENT_SERVICE_URL", "http://document-service:8080")

# Configure the consumer
logger.info(f"Starting Kafka consumer for topic: {KAFKA_TOPIC}")

def start_consumer():
    try:
        # Add additional configuration parameters for more robust handling
        consumer = KafkaConsumer(
            KAFKA_TOPIC,
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            group_id=KAFKA_GROUP_ID,
            auto_offset_reset='earliest',
            # Change to auto commit with interval to avoid manual commit issues
            enable_auto_commit=True,
            auto_commit_interval_ms=5000,  # Commit every 5 seconds
            # Add session timeout and heartbeat configuration
            session_timeout_ms=30000,  # 30 seconds session timeout
            heartbeat_interval_ms=10000,  # 10 seconds heartbeat interval
            # Maximum poll interval helps prevent consumer group rebalances
            max_poll_interval_ms=300000,  # 5 minutes max poll interval
            # Deserializers for message value and key
            value_deserializer=lambda x: json.loads(x.decode('utf-8')),
            key_deserializer=lambda x: x.decode('utf-8') if x else None,
        )
        
        print(f"Successfully connected to Kafka on {KAFKA_BOOTSTRAP_SERVERS}")
        
        # Process messages
        for message in consumer:
            try:
                print(f"Received message: {message.key}")
                document_data = message.value
                document_id = message.key
                
                # Process the document
                process_document(document_id, document_data)
                
                # We don't need to manually commit anymore as auto-commit is enabled
                # This avoids the CommitFailedError issue
                
            except Exception as e:
                print(f"Error processing message: {str(e)}")
                # Continue processing other messages even if one fails
                
    except Exception as e:
        print(f"Failed to connect to Kafka: {str(e)}")
        print("Retrying in 10 seconds...")
        time.sleep(10)
        start_consumer()

def process_document(document_id, document_data):
    """Process the document data from Kafka"""
    try:
        # Call the document-process endpoint
        headers = {'Content-Type': 'application/json'}
        document_data['documentId'] = document_id  # Ensure document ID is set
        
        # Sử dụng localhost vì consumer và server chạy trên cùng một máy
        local_process_url = "http://localhost:8000/process-document"
        
        print(f"Sending document {document_id} to processing endpoint: {local_process_url}")
        
        # Add timeout to the request to prevent hanging indefinitely
        response = requests.post(
            local_process_url,
            json=document_data,
            headers=headers,
            timeout=300  # 60 second timeout
        )
        
        if response.status_code == 200:
            print(f"Document {document_id} processed successfully")
            return True
        else:
            print(f"Error processing document {document_id}: Status {response.status_code}, Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print(f"Timeout while processing document {document_id}")
        return False
    except requests.exceptions.ConnectionError:
        print(f"Connection error while processing document {document_id}. Server might be down.")
        return False
    except Exception as e:
        print(f"Unexpected error in document processing: {str(e)}")
        return False

if __name__ == "__main__":
    # Start the consumer with better error handling
    while True:
        try:
            start_consumer()
        except KeyboardInterrupt:
            print("Consumer stopped by user")
            break
        except Exception as e:
            print(f"Consumer stopped due to error: {str(e)}")
            print("Restarting consumer in 10 seconds...")
            time.sleep(10)
