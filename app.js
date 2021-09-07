const express = require('express');
const app = express();
app.use(express.json());
const {
  models: { User, Note },
} = require('./db');
const path = require('path');
const volleyball = require('volleyball');
app.use(volleyball);

const requireToken = async (req, res, next) => {
  try {
    console.log(req.headers.authorization);
    const user = await User.byToken(req.headers.authorization)
    req.user = user;
    next();
  }
  catch(err) {
    next(err);
  }
}


app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/auth', async (req, res, next) => {
  try {
    res.send({ token: await User.authenticate(req.body) });
  } catch (ex) {
    next(ex);
  }
});

app.get('/api/auth', requireToken, async (req, res, next) => {
  try {
    res.send(req.user);
  } catch (ex) {
    next(ex);
  }
});


app.get('/api/user/:id/notes', requireToken, async (req, res, next) => {
  try {
    // const user = await User.byToken(req.headers.authorization);
    res.send(await req.user.getNotes());
  } catch (error) {
    next(error);
  }
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
