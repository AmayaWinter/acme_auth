const express = require('express');
const app = express();
app.use(express.json());
const {
  models: {User, Note},
} = require('./db');
const path = require('path');
const volleyball = require('volleyball');
app.use(volleyball);

const cookieParser = require('cookie-parser');
const cookieSecret = 'adfasdfasdfasdf';
app.use(cookieParser(cookieSecret)); //use environment variable for this

const requireToken = async (req, res, next) => {
  try {
    const user = await User.byToken(req.signedCookies.token)
    req.login = {loggedIn: true, user};
    next();
  } catch (err) {
    next(err);
  }
}

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/auth', async (req, res, next) => {
  try {
    const {user, token} = await User.authenticate(req.body);
    res.cookie('token', token, {
      sameSite: 'strict',
      httpOnly: true,
      signed: true
    })
    res.send({
      loggedIn: true,
      username: user.username,
      id: user.id,
      message: "Successfully Logged In"
    })
  } catch (ex) {
    next(ex);
  }
});

app.get('/api/auth', requireToken, async (req, res, next) => {
  try {
    res.send(req.login);
  } catch (ex) {
    next(ex);
  }
});


app.get('/api/user/:id/notes', requireToken, async (req, res, next) => {
  try {
    // const user = await User.byToken(req.headers.authorization);
    res.send(await req.login.user.getNotes());
  } catch (error) {
    next(error);
  }
});

app.get('/api/auth/logout', (req, res, next) => {
  try {
    res.clearCookie('token', {
      sameSite: 'strict',
      httpOnly: true,
      signed: true
    });
    res.json({
      loggedIn: false
    })
  }
  catch(err) {

  }
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({error: err.message});
});

module.exports = app;
