const query = require('querystring');

// user data, will get reset if heroku or node shut down
const users = {};

// JSON Responders ------------------------------------------
const respondJSON = (request, response, statusCode, object) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  response.writeHead(statusCode, headers);
  response.write(JSON.stringify(object));
  response.end();
};

// sends only status code with metadata
const respondJSONmeta = (request, response, statusCode) => {
  response.writeHead(statusCode, { 'Content-Type': 'application/json' });
  response.end();
};

// addUser & parseBody ---------------------------------------

// takes in user input and turns it into readable data
const parseBody = (request, response, handler) => {
  const body = [];

  // possible error handler
  request.on('error', (err) => {
    console.dir(err);
    response.statusCode = 400;
    response.end();
  });

  request.on('data', (chunk) => {
    console.log(chunk);
    body.push(chunk);
  });

  request.on('end', () => {
    const bodyString = Buffer.concat(body).toString();
    const bodyObject = query.parse(bodyString);
    console.log(bodyObject);
    handler(bodyObject);
  });
};

const addUser = (request, response) => {
  parseBody(request, response, (bodyObject) => {
    // default json message, unchanged if data is missing
    const responseJSON = {
      message: 'Name and Password are both required.',
    };

    // check that both the required fields are submitted
    if (!bodyObject.name || !bodyObject.password) {
      responseJSON.id = 'missingParams';
      return respondJSONmeta(request, response, 400);
    }

    // defaults status code to 204 for update cases
    let responseCode = 204;

    // if new user, checks for matching name and password
    // may not be completely foolproof
    if (!users[bodyObject.name] && !users[bodyObject.password]) {
      responseCode = 201;
      users[bodyObject.name] = {};
    }

    // once expanded to full project scope,
    // may benefit to assign parameters in separate method
    users[bodyObject.name].name = bodyObject.name;
    users[bodyObject.name].password = bodyObject.password;

    // task information
    // try and manage this dynamically
    // handle empty tasks
    /*
    users[bodyObject.name].task1 = bodyObject.task1;
    users[bodyObject.name].dl1 = bodyObject.dl1;
    users[bodyObject.name].task2 = bodyObject.task2;
    users[bodyObject.name].dl2 = bodyObject.dl2;
    users[bodyObject.name].task3 = bodyObject.task3;
    users[bodyObject.name].dl3 = bodyObject.dl3;
    users[bodyObject.name].task4 = bodyObject.task4;
    users[bodyObject.name].dl4 = bodyObject.dl4;
    users[bodyObject.name].task5 = bodyObject.task5;
    users[bodyObject.name].dl5 = bodyObject.dl5;
    */

    // changes message if new user was created
    if (responseCode === 201) {
      responseJSON.message = 'Created Successfully';
      return respondJSONmeta(request, response, responseCode);
    }

    // writes different message if user has been updated
    responseJSON.message = `User ${users[bodyObject.name].name} has been updated accordingly.`;
    return respondJSONmeta(request, response, responseCode);
  });
};

// getUsers methods -----------------------------------------

// /!\ identical to getUsers from http api ii, but causes a direct download now
// for debugging purposes, should just display a whole user list when traveled to
const userList = (request, response) => {
  const responseJSON = {
    users,
  };

  respondJSON(request, response, 200, responseJSON);
};

const getUsers = (request, response) => {
  parseBody(request, response, (bodyObject) => {
    // default json message, unchanged if data is missing
    const responseJSON = {
      message: 'Name and Password are both required.',
    };

    // check that both the required fields are submitted
    if (!bodyObject.name || !bodyObject.password) {
      responseJSON.id = 'missingParams';
      return respondJSON(request, response, 400, responseJSON);
    }

    let i = 0;
    let found = false;
    while (users[i]) {
      // checks to see if username is in user list
      if (users[i].name === bodyObject.name) {
        found = true;
        break;
      }
      i++;
    }

    // if user was not found, say so
    if (!found) {
      responseJSON.message = 'User with that name not found.';
      responseJSON.id = 'badRequest';
      return respondJSON(request, response, 400, responseJSON);
    }

    // otherwise, continue with password
    if (users[i].password !== bodyObject.password) {
      found = false;
    }

    // if incorrect password, say so
    if (!found) {
      responseJSON.message = 'Incorrect Password';
      responseJSON.id = 'unauthorized';
      return respondJSON(request, response, 401, responseJSON);
    }

    // otherwise, return information
    const responseJSONuser = users[i];
    return respondJSON(request, response, 200, responseJSONuser);
  });
};

// will assess later
// may not be needed if whole user info should be returned
const getUsersMeta = (request, response) => {
  respondJSONmeta(request, response, 200);
};

// notFound methods -----------------------------------------
const notFound = (request, response) => {
  const responseJSON = {
    message: 'The page you are looking for could not be found.',
    id: 'notFound',
  };

  respondJSON(request, response, 404, responseJSON);
};

const notFoundMeta = (request, response) => {
  respondJSONmeta(request, response, 404);
};

// sending to server.js
module.exports = {
  addUser,
  userList,
  getUsers,
  getUsersMeta,
  notFound,
  notFoundMeta,
};
