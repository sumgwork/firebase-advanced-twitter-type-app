const functions = require("firebase-functions");
const express = require("express");
const {
  getAllScreams,
  postOneScream,
  getOneScream,
  postComment,
  likeScream,
  unlikeScream,
  deleteScream,
} = require("./handlers/screams");
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
app.get("/scream/:screamId", getOneScream);
app.post("/scream/:screamId/comment", AuthM, postComment);
app.delete("/scream/:screamId", AuthM, deleteScream);
app.post("/scream/:screamId/like", AuthM, likeScream);
app.post("/scream/:screamId/unlike", AuthM, unlikeScream);
app.post("/scream", AuthM, postOneScream);

app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", AuthM, uploadImage);
app.post("/user", AuthM, addUserDetails);
app.get("/user", AuthM, getUserDetails);

exports.api = functions.region("australia-southeast1").https.onRequest(app);
