# Mock REST API Server Documentation

## Overview

This Mock REST API Server is designed for testing and development purposes. It provides simulated endpoints for various HTTP methods and supports authentication methods like OAuth 2.0, Basic Authentication, and Bearer Token Authentication. The server can run on both HTTP and HTTPS protocols, and it includes request logging for debugging purposes.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Endpoints](#endpoints)
    - [GET Request](#get-request)
    - [POST Request](#post-request)
    - [PUT Request](#put-request)
    - [PATCH Request](#patch-request)
    - [DELETE Request](#delete-request)
    - [OAuth 2.0 Authorization](#oauth-20-authorization)
    - [Basic Authentication](#basic-authentication)
    - [Bearer Token Authentication](#bearer-token-authentication)
  - [HTTPS Configuration](#https-configuration)

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

## Usage

### Endpoints

#### GET Request

Send a GET request to `/api/get` to receive a mock response for a successful GET request.

#### POST Request

Send a POST request to `/api/post` with a JSON body to receive a mock response for a successful POST request.

#### PUT Request

Send a PUT request to `/api/put` with a JSON body to receive a mock response for a successful PUT request.

#### PATCH Request

Send a PATCH request to `/api/patch` with a JSON body to receive a mock response for a successful PATCH request.

#### DELETE Request

Send a DELETE request to `/api/delete` to receive a mock response for a successful DELETE request.

#### OAuth 2.0 Authorization

- **Authorization Endpoint**: `/oauth/authorize`
  - To obtain an authorization code, make a GET or POST request to this endpoint with appropriate client credentials.
  
- **Token Endpoint**: `/oauth/token`
  - Exchange the authorization code for an access token by making a POST request to this endpoint with the code and client credentials.

#### Basic Authentication

Send a GET request to `/api/basic-auth` with HTTP Basic Authentication credentials to receive a mock response for a successful authentication.

#### Bearer Token Authentication

Send a GET request to `/api/bearer-auth` with a bearer token in the Authorization header to receive a mock response for a successful authentication.

### HTTPS Configuration

The server supports HTTPS for secure communications. It uses self-signed certificates for server and client verification.

- **Server SSL Certificate & Key**: Provided in the `sslFiles` directory.
- **Client Certificate Authority (CA)**: The client's certificate is used as the CA for client verification.

**Note**: Ensure to update the `server.crt` file with the appropriate CA information if using a custom CA for client verification.

## HTTPS Client Verification

A separate HTTPS server is set up for client verification. This server requires clients to provide a valid client certificate for authentication. If a client certificate is successfully verified, the connection is allowed, and requests are processed.

### Server Configuration

- **Server SSL Certificate & Key**: Provided in the `sslFiles` directory.
- **Client Certificate Authority (CA)**: The client's certificate is used as the CA for client verification.
- **Request Verification**: The server's configuration includes `requestCert: true`, ensuring that clients must provide a certificate for authentication.

---

Feel free to modify this server script to fit your specific testing needs. 
