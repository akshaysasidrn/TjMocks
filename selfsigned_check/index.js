// Express Version
const fs = require('fs');
const https = require('https');
const express = require('express');

const app = express();
const httpsPort = 7003;
const host = "localhost"

// @desc: Command to Generate Self-Signed Certificate ( While generate we need to provide domain as localhost, if we are testing it locally )
// openssl req -newkey rsa:2048 -nodes -keyout server.key -x509 -days 365 -out server.crt

// @desc
// For Server Verification : We need to provide 'cert', 'key' which will be provided by Certificate Authority (CA ) || Self-Sign a One
// For Client Verification : We need to provide 'ca', CA certificate who generated Client's certificate, If it is Self-Signed we should pass Client Certificate itself as CA
const sslOptions = {
    // Server SSL Certificate & its Key
    cert: fs.readFileSync('./sslFiles/server.crt'),
    key: fs.readFileSync('./sslFiles/server.key'),
    // Below mentioned CA - is for Verifying Client Authenticity
    ca: fs.readFileSync('./sslFiles/client.crt'),
    requestCert: true,
    rejectUnauthorized: true
}

const httpsServer = https.createServer(sslOptions, app);

// app.use((req, res, next) => {
//     if (req.protocol === 'http') {
//         res.redirect(301, `https://${req.headers.host}${req.url}`)
//     }
//     next();
// })

app.get('/custom/url', (req, res) => {
    console.log()
    res.send('Hello, this is a Secure Nodejs Server');
})


httpsServer.listen(httpsPort, () => {
    console.log(`Https server started on port ${httpsPort}`);
});
