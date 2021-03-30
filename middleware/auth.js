"use strict";

/** Middleware for handling req authorization for routes. */

const jwt = require("jsonwebtoken");
const express = require("express");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");


/** Middleware: Authenticate user. */

function authenticateJWT(req, res, next) {
  try {
    const tokenFromBody = req.body._token;
    const payload = jwt.verify(tokenFromBody, SECRET_KEY);
    res.locals.user = payload;
    console.log("in payload", payload);
    return next();
  } catch (err) {
    console.log(res.locals.user);
    // error in this middleware isn't error -- continue on
    return next();
  }
}

/** Middleware: Requires user is authenticated. */

function ensureLoggedIn(req, res, next) {
  try {
    if (!res.locals.user) {
      throw new UnauthorizedError();
    } else {
      console.log("in logged in!!!")
      return next();
    }
  } catch (err) {
    return next(err);
  }
}

/** Middleware: Requires user is user for route. */

function ensureCorrectUser(req, res, next) {
  try {
    if (!res.locals.user ||
        res.locals.user.username !== req.params.username) {
      throw new UnauthorizedError();
    } else {
      console.log(res.locals.user, req.params.username);
      return next();
    }
  } catch (err) {
    return next(err);
  }
}


module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureCorrectUser,
};
