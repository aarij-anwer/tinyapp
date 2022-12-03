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
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
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

app.get("/urls", (req, res) => {
  const user = users[req.cookies.user_id];

  const templateVars = {
    urls: urlDatabase,
    user
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const URL = req.body.longURL;
  const key = generateRandomString();
  urlDatabase[key] = ensureHTTP(URL);
  res.redirect("/urls/" + key);
});

app.post("/urls/:id", (req, res) => {
  const URL = req.body.newURL;
  const key = req.params.id;
  urlDatabase[key] = ensureHTTP(URL);
  res.redirect("/urls/");

});

app.get("/urls/new", (req, res) => {
  const user = users[req.cookies.user_id];

  const templateVars = {
    user
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const user = users[req.cookies.user_id];

  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  const key = req.params.id;
  delete urlDatabase[key];
  res.redirect("/urls/");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.get("/register", (req, res) => {
  const user = users[req.cookies.user_id];
  const templateVars = {
    user
  };
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const id = generateRandomString();

  if ((!email) || (!password)) {
    console.log("400 - no email and password");
    return res.status(400).send("<p>Please enter an email and password!</p><a href=\"/register\">Go back</a>");
  }
  
  if (getUser(email)) {
    console.log("400 - user exists!");
    return res.status(400).send("<p>Email address already exists!</p><a href=\"/register\">Go back</a>");
  }

  users[id] = {
    id,
    email,
    password
  };
  console.log(users);
  res.cookie("user_id", id);
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const user = users[req.cookies.user_id];
  const templateVars = {
    user
  };
  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  console.log(email);

  if ((!email) || (!password)) {
    console.log("400 - no email and password");
    return res.status(400).send("<p>Please enter an email and password!</p><a href=\"/login\">Go back</a>");
  }
  
  const user = getUser(email);
  console.log(user);
  if (!user) {
    console.log("403 - user doesn't exist");
    return res.status(403).send("<p>User does not exist!</p><a href=\"/login\">Go back</a>");
  }
  
  if (user.password !== password) {
    console.log("403 - incorrect password!");
    return res.status(403).send("<p>Incorrect password!</p><a href=\"/login\">Go back</a>");
  }

  res.cookie("user_id", user.id);
  res.redirect("/urls");

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});