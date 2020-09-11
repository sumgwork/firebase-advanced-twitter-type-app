const functions = require("firebase-functions");
const express = require("express");
const { getAllScreams, postOneScream } = require("./handlers/screams");
const { signup, login } = require("./handlers/users");
const AuthM = require("./middewares/Auth");
const app = express();

app.get("/scream", getAllScreams);

app.post("/scream", AuthM, postOneScream);

app.post("/signup", signup);

app.post("/login", login);

exports.api = functions.region("australia-southeast1").https.onRequest(app);
