# Redis TLS Setup

A simple setup for running Redis with TLS encryption using Docker.
This setup is for demonstration purposes. 

## Purpose

This project demonstrates how to:
- Generate SSL certificates for Redis
- Run Redis with TLS encryption enabled
- Connect to Redis securely using TLS

## Quick Start

1. Generate certificates:
   ```
   ./generate_certs.sh
   ```

2. Start Redis:
   ```
   docker-compose up -d
   ```

3. Connect to Redis:
   - Insecure TLS: `localhost:6379`
   - Secure TLS with CA: `localhost:6380`

## Testing

Run the test suite:
```
npm install
npm test
```

