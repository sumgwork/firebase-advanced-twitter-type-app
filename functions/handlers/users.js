const { db, admin } = require("../util/admin");
const config = require("../util/config");
const firebase = require("firebase");
const BusBoy = require("busboy");
const path = require("path");
const os = require("os");
const fs = require("fs");
const { validateSignup, validateLogin } = require("../util/validations");
// Initialize Firebase
firebase.initializeApp(config);

exports.signup = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  };

  const { errors, valid } = validateSignup(newUser);

  if (!valid) {
    return res.status(404).json(errors);
  }

  const noImg = "noimg.png";

  let token, userId;
  // Validate data
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        // User already exists
        return res.status(400).json({
          handle: "This handle is already taken",
        });
      } else {
        // Create the user
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then((data) => {
      // User is created, create access token
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then((idToken) => {
      token = idToken;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
        userId,
      };
      return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({
        token,
      });
    })
    .catch((err) => {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        return res.status(500).json({ email: "Email is already in use" });
      }
      return res.status(500).json({ error: err.message });
    });
};

exports.login = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  const { errors, valid } = validateLogin(user);

  if (!valid) {
    return res.status(404).json(errors);
  }

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then((data) => data.user.getIdToken())
    .then((token) => res.json({ token }))
    .catch((err) => {
      console.error(err);
      if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        return res.status(403).json({ general: "Invalid credentials!" });
      }
      return res.status(500).json({ error: err.code });
    });
};

exports.uploadImage = (req, res) => {
  const busboy = new BusBoy({
    headers: req.headers,
  });

  let imageFileName;
  let imageToBeUploaded = {};

  busboy.on("file", (_fieldname, file, filename, _encoding, mimetype) => {
    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return res.status(400).json({ error: "Wrong file type" });
    }
    // take the extension of the file
    const imageExtension = filename.split(".")[filename.split(".").length - 1];
    imageFileName = `${Math.round(
      Math.random() * 100000000
    )}.${imageExtension}`;
    const filepath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = {
      filepath,
      mimetype,
    };

    file.pipe(fs.createWriteStream(filepath));
    busboy.on("finish", () => {
      admin
        .storage()
        .bucket()
        .upload(imageToBeUploaded.filepath, {
          resumable: false,
          metadata: {
            metadata: {
              contentType: imageToBeUploaded.mimetype,
            },
          },
        })
        .then(() => {
          const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
          return db.doc(`/users/${req.user.handle}`).update({ imageUrl });
        })
        .then(() => {
          return res.json({ message: "Image uploaded successfully" });
        })
        .catch((err) => {
          return res.status(500).json({ error: err.code });
        });
    });
  });
  busboy.end(req.rawBody);
};
