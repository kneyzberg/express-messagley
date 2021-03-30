"use strict";

const Router = require("express").Router;
const router = new Router();

const jwt = require("jsonwebtoken");

const User = require("../models/user");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");


/** POST /login: {username, password} => {token} */

router.post("/login", async function(req, res, next) {
  let { username, password } = req.body;
  if(await User.authenticate(username, password)) {
    let _token = jwt.sign({ username }, SECRET_KEY);
    return res.json({ _token });
  } 
  throw new UnauthorizedError("Invalid login credentials");
});



/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */

router.post("/register", async function(req, res, next) {
  let { username } = await User.register(req.body);
  let _token = jwt.sign({ username }, SECRET_KEY);
  return res.json({ _token });
});

module.exports = router;