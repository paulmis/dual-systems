const express = require('express');
const http = require("http");
const bodyParser = require('body-parser');
const app = express();

const port = 8080
const server = http.createServer(app).listen(port);
app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile('/public/page.html', {root: __dirname })
});