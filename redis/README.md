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
   - TLS with client authentication: `localhost:6381`

## Certificate and Key Locations

After running `generate_certs.sh`, you can find the certificates and keys in the `certs` directory:

- CA Certificate: `certs/ca.crt`
- CA Key: `certs/ca.key`
- Redis Server Certificate: `certs/redis.crt`
- Redis Server Key: `certs/redis.key`
- Client Certificate: `certs/client.crt`
- Client Key: `certs/client.key`

## Testing

Run the test suite:
```
npm install
npm test
```

## Connecting to Redis

### Insecure TLS (port 6379)
- No certificate validation
- Use this for testing purposes only

### Secure TLS with CA (port 6380)
- Requires CA certificate for validation
- Use `certs/ca.crt` as the CA certificate

### TLS with Client Authentication (port 6381)
- Requires CA certificate, client certificate, and client key
- Use `certs/ca.crt` as the CA certificate
- Use `certs/client.crt` as the client certificate
- Use `certs/client.key` as the client key

## Security Note

This setup is for demonstration and testing purposes. In a production environment, ensure proper security measures are in place and use trusted certificates.
