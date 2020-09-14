const functions = require("firebase-functions");
const express = require("express");
const { getAllScreams, postOneScream } = require("./handlers/screams");
const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getUserDetails,
} = require("./handlers/users");
const AuthM = require("./middewares/Auth");
const app = express();

app.get("/scream", getAllScreams);
app.post("/scream", AuthM, postOneScream);

app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", AuthM, uploadImage);
app.post("/user", AuthM, addUserDetails);
app.get("/user", AuthM, getUserDetails);

exports.api = functions.region("australia-southeast1").https.onRequest(app);
