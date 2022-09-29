const fs = require('fs');

const index = fs.readFileSync(`${__dirname}/../client.html`);
const css = fs.readFileSync(`${__dirname}/../style.css`);

// returns webpage
const getIndex = (request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/html'});
    response.write(index);
    response.end();
}

// returns css data
const getCSS = (request, repsonse) => {
    repsonse.writeHead(200, { 'Content-Type': 'text/css'});
    response.write(css);
    response.end();
}

// sends them out to server.js
module.exports = {
    getIndex,
    getCSS,
};