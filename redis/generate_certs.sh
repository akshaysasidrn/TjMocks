#!/bin/bash
# Create a directory for the certificates
mkdir -p certs
cd certs

# Generate CA key and certificate
openssl genrsa -out ca.key 4096
openssl req -x509 -new -nodes -key ca.key -sha256 -days 1024 -out ca.crt -subj "/CN=localhost"

# Generate server key and certificate signing request (CSR)
openssl genrsa -out redis.key 2048
openssl req -new -key redis.key -out redis.csr -subj "/CN=localhost"

# Generate server certificate
openssl x509 -req -in redis.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out redis.crt -days 365 -sha256

# Generate client key and certificate signing request (CSR)
openssl genrsa -out client.key 2048
openssl req -new -key client.key -out client.csr -subj "/CN=localhost"

# Generate client certificate
openssl x509 -req -in client.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out client.crt -days 365 -sha256

# Clean up
rm *.csr ca.srl
cd ..
