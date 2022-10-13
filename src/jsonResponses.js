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
    let taskNumber = 1;

    while (bodyObject[`task${taskNumber}`] !== undefined) {
      // error if empty task
      if (bodyObject[`task${taskNumber}`] === '') {
        responseJSON.message = 'Do not leave any empty tasks!';
        responseJSON.id = 'missingParams';
        return respondJSON(request, response, 400, responseJSON);
      }

      users[bodyObject.name][`task${taskNumber}`] = bodyObject[`task${taskNumber}`];

      // error if empty deadline
      if (bodyObject[`deadline${taskNumber}`] === '') {
        responseJSON.message = 'Make sure to record the due date!';
        responseJSON.id = 'missingParams';
        return respondJSON(request, response, 400, responseJSON);
      }

      users[bodyObject.name][`deadline${taskNumber}`] = bodyObject[`deadline${taskNumber}`];

      taskNumber++;
    }

    // changes message if new user was created
    if (responseCode === 201) {
      responseJSON.message = 'Created Successfully';
      return respondJSON(request, response, responseCode, responseJSON);
    }

    // writes different message if user has been updated
    responseJSON.message = `User ${users[bodyObject.name].name} has been updated accordingly.`;
    return respondJSON(request, response, responseCode, responseJSON);
  });
};

// getUsers methods -----------------------------------------
const getUsers = (request, response, params) => {
  // default json message, unchanged if data is missing
  const responseJSON = {
    message: 'Name and Password are both required.',
  };

  // check that both the required fields are submitted
  if (!params.username || !params.password) {
    responseJSON.id = 'missingParams';
    return respondJSON(request, response, 400, responseJSON);
  }

  let found = false;

  // checks to see if username is in user list
  if (users[params.username]) {
    found = true;
  }

  // if user was not found, say so
  if (!found) {
    responseJSON.message = 'User with that name not found.';
    responseJSON.id = 'badRequest';
    return respondJSON(request, response, 400, responseJSON);
  }

  // otherwise, continue with password
  if (users[params.username].password !== params.password) {
    found = false;
  }

  // if incorrect password, say so
  if (!found) {
    responseJSON.message = 'Incorrect Password';
    responseJSON.id = 'unauthorized';
    return respondJSON(request, response, 401, responseJSON);
  }

  // otherwise, return information
  const userData = users[params.username];
  const responseJSONuser = { userData };
  console.log(responseJSONuser);
  return respondJSON(request, response, 200, responseJSONuser);
};

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
  getUsers,
  getUsersMeta,
  notFound,
  notFoundMeta,
};
