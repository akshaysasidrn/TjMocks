const express = require('express');
const { ApolloServer, gql, AuthenticationError } = require('apollo-server-express');
const crypto = require('crypto');
const morgan = require('morgan');


// Mock user database
const users = [
  { id: 1, username: 'admin', password: 'password' },
  { id: 2, username: 'user', password: 'password' }
];

// Mock client application database
const clients = [
  { id: 'client1', secret: 'client1secret', name: 'Client Application 1', redirectUri: 'http://localhost:8082/oauth2/authorize' },
  { id: 'client2', secret: 'client2secret', name: 'Client Application 2', redirectUri: 'http://localhost:8082/oauth2/authorize' }
];

// Mock authorization 
// Custom authentication middleware for OAuth2
function oauth2AuthenticationMiddleware(req) {
  // Get the access token from the request headers
  const accessToken = req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : '';

  // Validate the access token
  if (!isValidAccessToken(accessToken)) {
    throw new AuthenticationError('Invalid or missing access token');
  }
}


// GraphQL schema
const typeDefs = gql`
  type Query {
    publicData: String!
    protectedData: String!
  }
`;

// Resolvers
const resolvers = {
  Query: {
    publicData: () => {
      return 'Public data that is accessible to all';
    },
    protectedData: (parent, args, context) => {
      if (!context.req.headers.authorization) {
        throw new AuthenticationError('Missing authorization header');
      }

      const authHeader = context.req.headers.authorization;
      if (authHeader.startsWith('Bearer')) {
        if (!isValidAccessToken(authHeader.replace('Bearer ', ''))) {
          throw new AuthenticationError('Invalid or missing access token');
        }
      } else if (authHeader.startsWith('Basic')) {
        if (!isValidBasicAuthCredentials(authHeader.replace('Basic ', ''))) {
          throw new AuthenticationError('Invalid or missing Basic Auth credentials');
        }
      } else {
        throw new AuthenticationError('Unsupported authentication mechanism');
      }

      return 'Protected data that requires authentication';
    },
  },
};

// Validate the access token (replace with your own validation logic)
function isValidAccessToken(token) {
  // Add your access token validation logic here
  return token === 'secret-token';
}

// Validate the Basic Auth credentials (replace with your own validation logic)
function isValidBasicAuthCredentials(credentials) {
  const decodedCredentials = Buffer.from(credentials, 'base64').toString();
  const [username, password] = decodedCredentials.split(':');
  const user = users.find((user) => user.username === username && user.password === password);
  return !!user;
}

// Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    return { req };
  },
});

// Express app
const app = express();
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
app.use(express.json());

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
  const access_token = 'secret-token'
  const refresh_token = crypto.randomBytes(16).toString('hex');

  res.json({ access_token, refresh_token });
});

// Start the server
async function startServer() {
  await server.start();
  server.applyMiddleware({ app });
  
  // Specify other server configurations and middleware
  
  const port = 3001;
  app.listen(port, () => {
    console.log(`GraphQL server is running on http://localhost:${port}`);
  });
}

startServer();
