const axios = require("axios");
const config = require("../config");
const {validateSignupData, validateLoginData, reduceUserDetails} = require("../utils/validators");

exports.signUp = async (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    username: req.body.username,
  };

  const {errors, valid} = validateSignupData(newUser);
  if (!valid) {
    return res.status(400).json(errors);
  }

  delete axios.defaults.headers.common["Authorization"];
  let data = await axios
      .post(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${config.apiKey}`, {
        email: req.body.email,
        password: req.body.password,
        returnSecureToken: true,
      })
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });

  const token = data.data.idToken;
  //   const userId = data.data.localId;
  const refreshToken = data.data.refreshToken;
  const defaultImage = "default-pfp.png";

  data = await axios
      .post(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${config.apiKey}`, {
        idToken: token,
        displayName: req.body.username,
        photoUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/public%2F${defaultImage}?alt=media`,
      })
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });

  data = data.data;
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  await axios
      .post(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users/?documentId=${data.localId}`,
          {
            fields: {
              username: {stringValue: data.displayName},
              email: {stringValue: data.email},
              imageUrl: {stringValue: data.photoUrl},
              status: {stringValue: ""},
              //   servers: {arrayValue: {values: []}},
              // last login date? (below?)
            },
          },
      )
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });

  // TODO:
  // https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=[API_KEY]
  // (get createdAt and lastLoginAt)
  return res.status(201).json({refreshToken});
};

exports.login = async (req, res) => {
  const user = {email: req.body.email, password: req.body.password};

  const {errors, valid} = validateLoginData(user);
  if (!valid) {
    return res.status(400).json(errors);
  }

  delete axios.defaults.headers.common["Authorization"];
  const data = await axios
      .post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${config.apiKey}`, {
        ...user,
        returnSecureToken: true,
      })
      .catch((err) => {
        return res.status(500).json({error: "Invalid user details"});
      });

  return res.status(200).json({refreshToken: data.data.refreshToken});
};

exports.addUserDetails = async (req, res) => {
  const userDetails = reduceUserDetails(req.body);
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  const fields = {};
  const mask = [];
  // eslint-disable-next-line guard-for-in
  for (const key in userDetails) {
    fields[key] = {stringValue: userDetails[key]};
    mask.push(key);
  }

  await axios
      .post(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:commit`, {
        writes: [
          {
            update: {
              fields,
              name: `projects/${config.projectId}/databases/(default)/documents/users/${req.user.localId}`,
            },
            updateMask: {fieldPaths: mask},
          },
        ],
      })
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });

  return res.json({message: "Details added successfully"});
};

exports.getUserDetails = async (req, res) => {
  const userData = {};
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  const doc = await axios
      .get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users/${req
              .params.username}`,
      )
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });

  userData.credentials = doc.data.fields;
  // TODO: retrieve other info for other collections (messages, notifs, etc)
  return res.json(userData);
};

exports.getAuthenticatedUser = async (req, res) => {
  const userData = {};
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  const doc = await axios
      .get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users/${req
              .user.localId}`,
      )
      .catch((err) => {
        console.log(err);
        return res.status(500).json({error: err.response.data.error.message});
      });

  userData.credentials = doc.data.fields;
  userData.credentials.userId = req.user.userId;
  // TODO: retrieve other info for other collections (messages, notifs, etc)
  return res.json({userData, token: req.idToken, refreshToken: req.refresh_token});
};
