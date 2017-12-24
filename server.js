
const express = require('express');
const static =  require('express-static');

let server = express();
server.listen(666);
server.use(static('src'));



