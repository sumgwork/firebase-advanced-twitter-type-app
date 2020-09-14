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
  getAuthenticatedUserDetails,
  getUserDetails,
  markNotificationsRead,
} = require("./handlers/users");
const AuthM = require("./middewares/Auth");
const { db } = require("./util/admin");
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
app.get("/user", AuthM, getAuthenticatedUserDetails);
app.get("/user/:handle", getUserDetails);

app.get("/notifications", AuthM, markNotificationsRead);

exports.api = functions.region("australia-southeast1").https.onRequest(app);

// DB Trigger
exports.deleteNotificationsOnUnliike = functions
  .region("australia-southeast1")
  .firestore.document("likes/{id}")
  .onDelete((snapshot) => {
    db.doc(`/notifications/${snapshot.id}`)
      .delete()
      .then(() => {
        return;
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });

exports.createNotificationOnLike = functions
  .region("australia-southeast1")
  .firestore.document("likes/{id}")
  .onCreate((snapshot) => {
    db.doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then((doc) => {
        if (doc.exists) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            read: false,
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: "like",
            screamId: doc.id,
          });
        }
      })
      .then(() => {
        return;
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });

exports.createNotificationOnComment = functions
  .region("australia-southeast1")
  .firestore.document("comments/{id}")
  .onCreate((snapshot) => {
    db.doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then((doc) => {
        if (doc.exists) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            read: false,
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: "comment",
            screamId: doc.id,
          });
        }
      })
      .then(() => {
        return;
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });
