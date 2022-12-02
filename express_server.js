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


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies.username
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
  const templateVars = {
    username: req.cookies.username
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies.username
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

app.post("/login", (req, res) => {
  const username = req.body.username;
  res.cookie("username", username);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});