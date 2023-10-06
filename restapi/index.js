const LocalStrategy = require('passport-local').Strategy;
const bodyParser = require('body-parser');
const crypto = require('crypto');
const express = require('express');
const fs = require('fs');
const https = require('https');
const morgan = require('morgan');
const oauth2orize = require('oauth2orize');
const passport = require('passport');
const session = require('express-session');

const app = express();
const port = process.env.HTTP_PORT || 3001;
const sslPort = process.env.HTTPS_PORT || 3443;
const clientVerificationSslPort = process.env.CLIENT_VERIF_HTTPS_PORT || 3444;
const redirectUri = process.env.REDIRECT_URI || 'http://localhost:8082/oauth2/authorize';

// Add morgan middleware to log incoming request details
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
app.use((req, res, next) => {
  // Log incoming request details
  console.log('Incoming Request:');
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Headers:', req.headers);
  console.log('Query Parameters:', req.query);
  console.log('Body:', req.body);

  const oldSend = res.send;
  res.send = function (data) {
    // Log outgoing response details
    console.log('Outgoing Response:');
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.getHeaders());
    console.log('Response Data:', data);

    oldSend.apply(res, arguments);
  };
  next();
});

// Parse request bodies as JSON
app.use(bodyParser.json());

// Initialize session support
app.use(session({ secret: 'oauth2-secret', resave: true, saveUninitialized: true }));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// GET endpoint
app.get('/api/get', (req, res) => {
  const requestObject = {
    method: req.method,
    url: req.originalUrl,
    headers: req.headers
  };

  res.json({ message: 'GET request successful', request: requestObject });
});

// POST endpoint
app.post('/api/post', (req, res) => {
  const requestObject = {
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    body: req.body
  };

  res.json({ message: 'POST request successful', request: requestObject });
});

// PUT endpoint
app.put('/api/put', (req, res) => {
  const requestObject = {
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    body: req.body
  };

  res.json({ message: 'PUT request successful', request: requestObject });
});

// PATCH endpoint
app.patch('/api/patch', (req, res) => {
  const requestObject = {
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    body: req.body
  };

  res.json({ message: 'PATCH request successful', request: requestObject });
});

// DELETE endpoint
app.delete('/api/delete', (req, res) => {
  const requestObject = {
    method: req.method,
    url: req.originalUrl,
    headers: req.headers
  };

  res.json({ message: 'DELETE request successful', request: requestObject });
});

// Mock user database
const users = [
  { id: 1, username: 'admin', password: 'password' },
  { id: 2, username: 'user', password: 'password' }
];

// Mock client application database
const clients = [
  { id: 'client1', secret: 'client1secret', name: 'Client Application 1', redirectUri },
  { id: 'client2', secret: 'client2secret', name: 'Client Application 2', redirectUri }
];

// OAuth 2.0 server
const server = oauth2orize.createServer();

// Serializes a user into a session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserializes a user from a session
passport.deserializeUser((id, done) => {
  const user = users.find((user) => user.id === id);
  done(null, user);
});

// Strategy to authenticate users using their username and password
passport.use(new LocalStrategy((username, password, done) => {
  const user = users.find((user) => user.username === username && user.password === password);
  if (user) {
    return done(null, user);
  } else {
    return done(null, false, { message: 'Invalid username or password' });
  }
}));

// Authorization endpoint
app.post('/oauth/authorize', (req, res, next) => {
  // Check if client application is registered and valid
  const clientId = req.query.client_id;
  const client = clients.find((client) => client.id === clientId);
  if (!client) {
    return res.status(401).send('Invalid client application');
  }

  // Generate authorization code
  const code = crypto.randomBytes(16).toString('hex');

  // Save authorization code to the client application for later use
  // In a real application, you would persist this information to a database
  client.authorizationCode = code;

  // Redirect to the client application with the authorization code
  const redirectUri = client.redirectUri + '?code=' + code;
  return res.redirect(redirectUri);
});

// Authorization endpoint
app.get('/oauth/authorize', (req, res, next) => {
  // Check if client application is registered and valid
  const clientId = req.query.client_id;
  const client = clients.find((client) => client.id === clientId);
  if (!client) {
    return res.status(401).send('Invalid client application');
  }

  // Generate authorization code
  const code = crypto.randomBytes(16).toString('hex');

  // Save authorization code to the client application for later use
  // In a real application, you would persist this information to a database
  client.authorizationCode = code;

  // Redirect to the client application with the authorization code
  const redirectUri = client.redirectUri + '?code=' + code;
  return res.redirect(redirectUri);
});

// Token endpoint
app.post('/oauth/token', (req, res) => {
  // Extract the required fields from the request body
  const { code, client_id, client_secret, grant_type, redirect_uri } = req.body;

  // Validate the required fields
  if (!code || !client_id || !client_secret || !grant_type || !redirect_uri) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  // Check if the client application is registered and valid
  const client = clients.find((client) => client.id === client_id && client.secret === client_secret);
  if (!client) {
    return res.status(401).json({ error: 'Invalid client application' });
  }

  // Verify the grant type
  if (grant_type !== 'authorization_code') {
    return res.status(400).json({ error: 'Invalid grant type' });
  }

  // Verify the redirect URI
  if (redirect_uri !== client.redirectUri) {
    return res.status(400).json({ error: 'Invalid redirect URI' });
  }

  // Generate and return the access token and refresh token
  const access_token = crypto.randomBytes(16).toString('hex');
  const refresh_token = crypto.randomBytes(16).toString('hex');

  res.json({ access_token, refresh_token });
});

app.post('/login',
  passport.authenticate('local', { successRedirect: '/oauth/authorize', failureRedirect: '/login', session: true })
);

// Basic Auth endpoint
app.get('/api/basic-auth', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.status(401).send('Basic Auth failed');
    return;
  }

  const encodedCredentials = authHeader.substring(6);
  const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString();
  const [username, password] = decodedCredentials.split(':');

  if (username === 'admin' && password === 'password') {
    const requestObject = {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers
    };

    res.json({ message: 'Basic Auth request successful', request: requestObject });
  } else {
    res.status(401).send('Basic Auth failed');
  }
});

// Bearer Token Auth endpoint
app.get('/api/bearer-auth', (req, res) => {
  const { authorization } = req.headers;
  if (authorization && authorization.startsWith('Bearer ')) {
    const token = authorization.substring(7);
    if (token === 'secret-token') {
      const requestObject = {
        method: req.method,
        url: req.originalUrl,
        headers: req.headers
      };

      res.json({ message: 'Bearer Token Auth request successful', request: requestObject });
    } else {
      res.status(401).send('Bearer Token Auth failed');
    }
  } else {
    res.status(401).send('Bearer Token Auth failed');
  }
});

// OAuth 2.0 Bearer Auth endpoint
app.get('/api/oauth2-bearer-auth', isAuthenticated, (req, res) => {
  const requestObject = {
    method: req.method,
    url: req.originalUrl,
    headers: req.headers
  };

  res.json({ message: 'OAuth 2.0 Bearer Auth request successful', request: requestObject });
});

// Custom middleware to check if a user is authenticated
function isAuthenticated(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.status(401).send('Unauthorized');
  }
}

// Start the server
app.listen(port, () => {
  console.log(`HTTP Server is running on http://localhost:${port}`);
});

// HTTPS server setup

// Command to Generate Self-Signed Certificate ( While generate we need to provide domain as localhost, if we are testing it locally )
// openssl req -newkey rsa:2048 -nodes -keyout server.key -x509 -days 365 -out server.crt
//
// For Server Verification : We need to provide 'cert', 'key' which will be provided by Certificate Authority (CA ) || Self-Sign a One
// At ToolJet restapi server for CA field we would the have to give this server.crt
//
// For Client Verification : We need to provide 'ca', CA certificate who generated Client's certificate, If it is Self-Signed we should pass Client Certificate itself as CA
const sslOptions = {
  // Server SSL Certificate & its Key
  cert: fs.readFileSync('./sslFiles/server.crt'),
  key: fs.readFileSync('./sslFiles/server.key'),
  // Below mentioned CA - is for Verifying Client Authenticity
  ca: fs.readFileSync('./sslFiles/client.crt'),
  // requestCert: true,
  rejectUnauthorized: true
}

const httpsServer = https.createServer(sslOptions, app);
httpsServer.listen(sslPort, () => {
  console.log(`HTTPS Server is running on https://localhost:${sslPort}`);
});


const clientVerficationSslOptions = {
  cert: fs.readFileSync('./sslFiles/server.crt'),
  key: fs.readFileSync('./sslFiles/server.key'),
  ca: fs.readFileSync('./sslFiles/client.crt'),
  requestCert: true,
  rejectUnauthorized: true
}
// The client certificate verification is done at the SSL layer, so if the client
// doesn't provide a valid client certificate, the connection won't reach this handler.
// If the connection reaches here, it means the client certificate was verified successfully.
const httpsClientVerificationServer = https.createServer(clientVerficationSslOptions, app);
httpsClientVerificationServer.listen(clientVerificationSslPort, () => {
  console.log(`HTTPS Client verification server is running on https://localhost:${clientVerificationSslPort}`);
});
