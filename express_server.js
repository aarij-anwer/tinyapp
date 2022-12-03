/////////////////////////////////////////////////////////////////////////////
//  Dependencies
/////////////////////////////////////////////////////////////////////////////
const express = require('express');
const cookieParser = require('cookie-parser');

/////////////////////////////////////////////////////////////////////////////
//  Middleware
/////////////////////////////////////////////////////////////////////////////
const app = express();
const PORT = 8080;
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


/////////////////////////////////////////////////////////////////////////////
//  DB
/////////////////////////////////////////////////////////////////////////////

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "qutoof",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aarij",
  }
};

const users = {
  aarij: {
    id: "aarij",
    email: "aarij.anwer@gmail.com",
    password: "1234",
  },
  qutoof: {
    id: "qutoof",
    email: "admin@qutoofacademy.com",
    password: "1234",
  },
  maha: {
    id: "maha",
    email: "maha@maha.com",
    password: "maha",
  },
};

/////////////////////////////////////////////////////////////////////////////
//  Helper Functions
/////////////////////////////////////////////////////////////////////////////

//returns a random character from a to z
const pickRandomChar = function() {
  //get a number between 97 and 122, corresponding to the ASCII characters a-z in lowercsae
  let number = Math.round(Math.random() * (122 - 97) + 97);
  return String.fromCharCode(number);
};

//returns a random integer from 0 to 9
const pickRandomNum = function() {
  return Math.round(Math.random() * 9);
};

//returns a string of 6 random alphanumeric characters
const generateRandomString = function() {
  let answer = "";
  
  for (let i = 0; i < 6; i++) {
    if (Math.random() > 0.5) {
      answer += pickRandomChar();
    } else {
      answer += pickRandomNum();
    }
  }
  return answer;
};

const urlsForUser = function(userID) {
  let urlObject;
  let answer = {};

  for (const id in urlDatabase) {
    if (urlDatabase[id].userID === userID) {
      urlObject = {
        longURL: urlDatabase[id].longURL,
        userID
      };
      answer[id] = urlObject;
    }
  }
  return answer;
};

//if URL doesn't have http:// prefixed, adds http:// and returns the new URL, otherwise returns URL
const ensureHTTP = function(URL) {
  let answer;
  if (URL.search("http://") === 0) {
    answer = URL;
  } else {
    answer = "http://" + URL;
  }
  return answer;
};

//returns user object for user in DB with `email`, null otherwise
const getUser = function(email) {
  for (const id in users) {
    if (email === users[id].email) {
      return users[id];
    }
  }
  return null;
};

const correctUser = function(userObject,urlObject) {
  return urlObject.userID === userObject.id;
};

/////////////////////////////////////////////////////////////////////////////
//  Routes
/////////////////////////////////////////////////////////////////////////////
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// Route for displaying all the URLs
app.get("/urls", (req, res) => {
  const user = users[req.cookies.user_id];
  let templateVars = {};

  console.log(user);

  if (user) {
    templateVars = {
      urls: urlsForUser(user.id),
      user
    };
  } else {
    templateVars = {
      urls: "",
      user
    };
  }
  res.render("urls_index", templateVars);
});

// Route for creating a new URL and adding it to DB, only allowed for logged in users
app.post("/urls", (req, res) => {
  const user = users[req.cookies.user_id];

  if (user) {
    //user is logged in
    const URL = req.body.longURL;
    const key = generateRandomString();
    const urlObject = {
      longURL: ensureHTTP(URL),
      userID: user.id
    };
    urlDatabase[key] = urlObject;

    console.log(urlDatabase);
    res.redirect("/urls/" + key);
  } else {
    res.status(401).send("<p>You are not logged in. To create a URL, you need to login or register.</p><p>Click <a href=\"/login\">here</a> to login.");
  }
});

// Route for editing an existing URL from the DB
app.post("/urls/:id", (req, res) => {
  const URL = req.body.newURL;
  const user = users[req.cookies.user_id];
  const urlID = req.params.id;
  const urlObject = urlDatabase[urlID];

  if (!user) {
    //user is not logged in
    res.status(401).send("<p>You are not logged in. To create a URL, you need to login or register.</p><p>Click <a href=\"/login\">here</a> to login.");

  } else if (!urlObject) {
    //incorrect URL ID was sent by the client
    res.status(404).send("<p>The URL is not found. </p><p>Click <a href=\"/urls\">here</a> to go back.");

  } else if (!correctUser(user,urlObject)) {
    //user is trying to access URLs that they did not create
    res.status(403).send("<p>You are not allowed to view this URL. You can only view your own URLs. </p><p>Click <a href=\"/urls\">here</a> to go back.");

  } else {
    // everything is good!
    const urlObject = {
      longURL: ensureHTTP(URL),
      userID: user.id
    };
    urlDatabase[urlID] = urlObject;
    console.log(urlDatabase);
    res.redirect("/urls/");
  }
});

// Route for viewing the create URL form, only allowed for logged in users
app.get("/urls/new", (req, res) => {
  const user = users[req.cookies.user_id];

  const templateVars = {
    user
  };
  if (user) {
    //user is logged in
    res.render("urls_new", templateVars);
  } else {
    //user is not logged in
    res.redirect("/login");
  }
});

// Route for displaying an individual short URL
app.get("/urls/:id", (req, res) => {
  const user = users[req.cookies.user_id];
  const urlID = req.params.id;
  const urlObject = urlDatabase[urlID];

  if (!user) {
    //user is not logged in
    res.status(401).send("<p>You are not logged in. To create a URL, you need to login or register.</p><p>Click <a href=\"/login\">here</a> to login.");

  } else if (!urlObject) {
    //incorrect URL ID was sent by the client
    res.status(404).send("<p>The URL is not found. </p><p>Click <a href=\"/urls\">here</a> to go back.");

  } else if (!correctUser(user,urlObject)) {
    //user is trying to access URLs that they did not create
    res.status(403).send("<p>You are not allowed to view this URL. You can only view your own URLs. </p><p>Click <a href=\"/urls\">here</a> to go back.");

  } else {
    // everything is good!

    const templateVars = {
      id: urlID,
      longURL: urlObject.longURL,
      user
    };
    res.render("urls_show", templateVars);
  }
});

// Route for redirecting from short URL `id` to actual URL
app.get("/u/:id", (req, res) => {
  const urlID = req.params.id;
  const urlObject = urlDatabase[urlID];
 
  if (!urlObject) {
    //incorrect ID was passed by client for redirection
    res.status(404).send(`<p>URL for ${req.params.id} doesn't exist!</p><a href="/urls">Go back</a>`);
  } else {

    const longURL = urlObject.longURL;
    const user = users[req.cookies.user_id];

    if (!user) {
      //user is not logged in
      res.status(401).send("<p>You are not logged in. To create a URL, you need to login or register.</p><p>Click <a href=\"/login\">here</a> to login.");

    } else if (!correctUser(user,urlObject)) {
      //user is trying to access URLs that they did not create
      res.status(403).send("<p>You are not allowed to view this URL. You can only view your own URLs. </p><p>Click <a href=\"/urls\">here</a> to go back.");

    } else if (!longURL) {
      //incorrect URL
      res.status(404).send(`<p>URL for ${req.params.id} doesn't exist!</p><a href="/urls">Go back</a>`);

    } else {
      res.redirect(longURL);
    }
  }
});

// Route for delete
app.post("/urls/:id/delete", (req, res) => {
  const user = users[req.cookies.user_id];
  const urlID = req.params.id;
  const urlObject = urlDatabase[urlID];

  if (!user) {
    //user is not logged in
    res.status(401).send("<p>You are not logged in. To create a URL, you need to login or register.</p><p>Click <a href=\"/login\">here</a> to login.");

  } else if (!urlObject) {
    //incorrect URL ID was sent by the client
    res.status(404).send("<p>The URL is not found. </p><p>Click <a href=\"/urls\">here</a> to go back.");

  } else if (!correctUser(user,urlObject)) {
    //user is trying to access URLs that they did not create
    res.status(403).send("<p>You are not allowed to delete this URL. You can only view your own URLs. </p><p>Click <a href=\"/urls\">here</a> to go back.");

  } else {
    // everything is good!
    delete urlDatabase[urlID];
    res.redirect("/urls");
  }
});

// Route for logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

// Route for displaying registration page
app.get("/register", (req, res) => {
  const user = users[req.cookies.user_id];
  const templateVars = {
    user
  };
  if (user) {
    //user is logged in
    res.redirect("/urls");
  } else {
    res.render("urls_register", templateVars);
  }
});

// Route for submitting registration
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const id = generateRandomString();

  if ((!email) || (!password)) {
    //no email and/or password provided
    return res.status(400).send("<p>Please enter an email and password!</p><a href=\"/register\">Go back</a>");
  }
  
  if (getUser(email)) {
    //user already exists
    return res.status(400).send("<p>Email address already exists!</p><a href=\"/register\">Go back</a>");
  }

  //everything is good
  users[id] = {
    id,
    email,
    password
  };
  console.log(users);
  res.cookie("user_id", id);
  res.redirect("/urls");
});

// Route for viewing login page
app.get("/login", (req, res) => {
  const user = users[req.cookies.user_id];
  const templateVars = {
    user
  };
  if (user) {
    //user is already logged in
    res.redirect("/urls");
  } else {
    //user is not logged in
    res.render("urls_login", templateVars);
  }
});

// Route for submitting and logging in
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  console.log(email);

  if ((!email) || (!password)) {
    //no email and/or password provided
    return res.status(400).send("<p>Please enter an email and password!</p><a href=\"/login\">Go back</a>");
  }
  
  const user = getUser(email);
  console.log(user);
  if (!user) {
    //user does not exist
    return res.status(403).send("<p>User does not exist!</p><a href=\"/login\">Go back</a>");
  }
  
  if (user.password !== password) {
    //incorrect password
    return res.status(403).send("<p>Incorrect password!</p><a href=\"/login\">Go back</a>");
  }

  res.cookie("user_id", user.id);
  res.redirect("/urls");

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});