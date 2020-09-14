const { user } = require("firebase-functions/lib/providers/auth");

const isEmpty = (string) => string.trim() === "";

const isEmail = (email) => {
  const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return email.match(emailRegEx);
};

const validateSignup = (newUser) => {
  let errors = {};

  if (isEmpty(newUser.email)) {
    errors.email = "Must not be empty";
  } else if (!isEmail(newUser.email)) {
    errors.email = "Invalid";
  }

  if (isEmpty(newUser.password)) {
    errors.password = "Must not be empty";
  }

  if (newUser.password !== newUser.confirmPassword) {
    errors.confirmPassword = "Passwords don't match";
  }

  if (isEmpty(newUser.handle)) {
    errors.handle = "Must not be empty";
  }

  return { errors, valid: !Object.keys(errors).length };
};

const validateLogin = (user) => {
  let errors = {};

  if (isEmpty(user.email)) {
    errors.email = "Must not be empty";
  } else if (!isEmail(user.email)) {
    errors.email = "Invalid";
  }

  if (isEmpty(user.password)) {
    errors.password = "Must not be empty";
  }
  return { errors, valid: !Object.keys(errors).length };
};

const reduceUserDetails = (data) => {
  let userDetails = {};

  if (!isEmpty(data.bio.trim())) {
    userDetails.bio = data.bio;
  }
  if (!isEmpty(data.website.trim())) {
    if (data.website.trim().substring(0, 4) !== "http") {
      userDetails.website = `http://${data.website.trim()}`;
    } else {
      userDetails.website = data.website;
    }
  }
  if (!isEmpty(data.location.trim())) {
    userDetails.location = data.location;
  }

  return userDetails;
};

module.exports = { validateSignup, validateLogin, reduceUserDetails };
