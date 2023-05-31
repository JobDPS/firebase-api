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
              // email: {stringValue: data.email},
              imageUrl: {stringValue: data.photoUrl},
              status: {stringValue: ""},
              id: {stringValue: data.localId},
              relations: {arrayValue: {values: []}},
              starredCompanies: {arrayValue: {values: []}},
              following: {arrayValue: {values: []}},
              followingTimestamps: {arrayValue: {values: []}},
              followers: {arrayValue: {values: []}},
              followersTimestamps: {arrayValue: {values: []}},
              likes: {arrayValue: {values: []}},
              likesTimestamps: {arrayValue: {values: []}},
              dislikes: {arrayValue: {values: []}},
              dislikesTimestamps: {arrayValue: {values: []}},
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
              name: `projects/${config.projectId}/databases/(default)/documents/users/${req.user.userId}`,
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
  // axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  const doc = await axios
      .get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users/${req
              .params.userId}`,
      )
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });

  userData.credentials = doc.data.fields;

  return res.json({credentials: userData.credentials});
};

exports.getUserDetailsDiscuss = async (req, res) => {
  const userData = {};
  // axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  const doc = await axios
      .get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users/${req
              .params.userId}`,
      )
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });

  userData.credentials = doc.data.fields;

  const docs = await axios
      .post(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:runQuery`,
          {
            structuredQuery: {
              from: [
                {
                  collectionId: "discuss",
                },
              ],
              where: {
                fieldFilter: {
                  field: {
                    fieldPath: "author",
                  },
                  op: "EQUAL",
                  value: {
                    stringValue: req.params.userId,
                  },
                },
              },
              orderBy: [
                {
                  field: {
                    fieldPath: "createdAt",
                  },
                  direction: "DESCENDING",
                },
              ],
            },
          },
      )
      .catch((e) => {
        return res.status(500).json({error: e.response.data});
      });

  const posts = docs.data.filter((doc) => doc.document).map((doc) => {
    return doc.document.fields;
  });

  let allPosts = [];
  if (posts) {
    allPosts = await Promise.all(
        posts.map(async (a) => {
          const post = {info: {...a}};
          const postId = a.id.stringValue;

          const doc = await axios
              .get(
                  `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/discuss/${postId}/replies`,
              )
              .catch((e) => {
                return res.status(500).json({error: e.response.data.error.message});
              });

          const messages = doc.data.documents;
          post.replies = null;
          if (messages) {
            const desc = messages.sort((a, b) => {
              return new Date(a.createTime) - new Date(b.createTime);
            });
            const docs = await Promise.all(
                desc.map(async (a) => {
                  const id = a.fields.id.stringValue;
                  const rep = await axios
                      .get(
                          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/discuss/${postId}/replies/${id}/replies`,
                      )
                      .catch((e) => {
                        return res.status(500).json({error: e.response.data.error.message});
                      });

                  let replies = null;
                  if (rep.data.documents) {
                    const desc = rep.data.documents.sort((a, b) => {
                      return new Date(a.createTime) - new Date(b.createTime);
                    });
                    const docs = desc.map((a) => {
                      return {info: a.fields};
                    });
                    replies = docs;
                  }
                  return {info: a.fields, replies};
                }),
            );
            post.replies = docs;
          }
          return post;
        }),
    );
  }

  return res.json({posts: allPosts});
};

exports.getUserDetailsSocial = async (req, res) => {
  const userData = {};
  // axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  const doc = await axios
      .get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users/${req
              .params.userId}`,
      )
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });

  userData.credentials = doc.data.fields;

  const docs2 = await axios
      .post(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:runQuery`,
          {
            structuredQuery: {
              from: [
                {
                  collectionId: "social",
                },
              ],
              where: {
                fieldFilter: {
                  field: {
                    fieldPath: "author",
                  },
                  op: "EQUAL",
                  value: {
                    stringValue: req.params.userId,
                  },
                },
              },
              orderBy: [
                {
                  field: {
                    fieldPath: "createdAt",
                  },
                  direction: "DESCENDING",
                },
              ],
            },
          },
      )
      .catch((e) => {
        return res.status(500).json({error: e.response.data});
      });

  const socPosts = docs2.data.filter((doc) => doc.document).map((doc) => {
    return doc.document.fields;
  });

  let allSocPosts = [];
  if (socPosts) {
    allSocPosts = await Promise.all(
        socPosts.map(async (a) => {
          const post = {info: {...a}};
          const postId = a.id.stringValue;

          const doc = await axios
              .get(
                  `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/social/${postId}/replies`,
              )
              .catch((e) => {
                return res.status(500).json({error: e.response.data.error.message});
              });

          const messages = doc.data.documents;
          post.replies = null;
          if (messages) {
            const desc = messages.sort((a, b) => {
              return new Date(a.createTime) - new Date(b.createTime);
            });
            const docs = await Promise.all(
                desc.map(async (a) => {
                  const id = a.fields.id.stringValue;
                  const rep = await axios
                      .get(
                          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/social/${postId}/replies/${id}/replies`,
                      )
                      .catch((e) => {
                        return res.status(500).json({error: e.response.data.error.message});
                      });

                  let replies = null;
                  if (rep.data.documents) {
                    const desc = rep.data.documents.sort((a, b) => {
                      return new Date(a.createTime) - new Date(b.createTime);
                    });
                    const docs = desc.map((a) => {
                      return {info: a.fields};
                    });
                    replies = docs;
                  }
                  return {info: a.fields, replies};
                }),
            );
            post.replies = docs;
          }
          return post;
        }),
    );
  }

  return res.json({posts: allSocPosts});
};

exports.getUserDetailsCompanies = async (req, res) => {
  const userData = {};
  // axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  const doc = await axios
      .get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users/${req
              .params.userId}`,
      )
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });

  userData.credentials = doc.data.fields;

  const companyIds = userData.credentials.starredCompanies.arrayValue.values;
  let companies = [];
  if (companyIds) {
    companies = await Promise.all(
        companyIds.map(async (a) => {
          const comp = await axios
              .get(
                  `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/company/${a.stringValue}`,
              )
              .catch((err) => {
                return res.status(500).json({error: err.response.data.error.message});
              });
          return comp.data.fields;
        }),
    );
  }
  companies.sort((a, b) => a.id.stringValue.localeCompare(b.id.stringValue));
  return res.json({companies: companies});
};

exports.getUserDetailsFollowing = async (req, res) => {
  const userData = {};
  // axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  const doc = await axios
      .get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users/${req
              .params.userId}`,
      )
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });

  userData.credentials = doc.data.fields;

  const userIds = userData.credentials.following.arrayValue.values;
  let users = [];
  if (userIds) {
    users = await Promise.all(
        userIds.map(async (a) => {
          const userData = {};
          const doc = await axios
              .get(
                  `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users/${a.stringValue}`,
              )
              .catch((err) => {
                return res.status(500).json({error: err.response.data.error.message});
              });
          userData.credentials = doc.data.fields;
          return userData;
        }),
    );
  }
  users = users.map((a, idx) => {
    return {
      credentials: a.credentials,
      createdAt: userData.credentials.followingTimestamps.arrayValue.values[idx].timestampValue,
    };
  });
  users = users.sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  return res.json({following: users});
};

exports.getUserDetailsFollowers = async (req, res) => {
  const userData = {};
  // axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  const doc = await axios
      .get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users/${req
              .params.userId}`,
      )
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });

  userData.credentials = doc.data.fields;

  const userIds2 = userData.credentials.followers.arrayValue.values;
  let users2 = [];
  if (userIds2) {
    users2 = await Promise.all(
        userIds2.map(async (a) => {
          const userData = {};
          const doc = await axios
              .get(
                  `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users/${a.stringValue}`,
              )
              .catch((err) => {
                return res.status(500).json({error: err.response.data.error.message});
              });
          userData.credentials = doc.data.fields;
          return userData;
        }),
    );
  }
  users2 = users2.map((a, idx) => {
    return {
      credentials: a.credentials,
      createdAt: userData.credentials.followersTimestamps.arrayValue.values[idx].timestampValue,
    };
  });
  users2 = users2.sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  return res.json({followers: users2});
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
  return res.json({userData});
};

exports.followUser = async (req, res) => {
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  if (req.user.userId === req.params.userId) {
    return res.status(500).json({error: "Invalid request, cannot follow/unfollow self"});
  }

  const userData = {};
  const doc = await axios
      .get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users/${req
              .user.userId}`,
      )
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });
  userData.credentials = doc.data.fields;

  let fields = {};
  const mask = ["following", "followingTimestamps"];
  if (userData.credentials.following.arrayValue.values && userData.credentials.following.arrayValue.values
      .map((id) => id.stringValue)
      .includes(req.params.userId)) {
    const idx = userData.credentials.following.arrayValue.values.map((a) => a.stringValue).indexOf(req.params.userId) + 1;
    userData.credentials.following.arrayValue.values.splice(idx, 1);
    userData.credentials.followingTimestamps.arrayValue.values.splice(idx, 1);
    fields["following"] = {arrayValue: {values:
      userData.credentials.following.arrayValue.values,
    }};
    fields["followingTimestamps"] = {arrayValue: {values:
      userData.credentials.followingTimestamps.arrayValue.values,
    }};
  } else {
    fields["following"] = {arrayValue: {values:
      [...(userData.credentials.following.arrayValue.values ?? []), {stringValue: req.params.userId}],
    }};
    fields["followingTimestamps"] = {arrayValue: {values:
      [...(userData.credentials.followingTimestamps.arrayValue.values ?? []), {timestampValue: new Date()}],
    }};
  }

  await axios
      .post(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:commit`, {
        writes: [
          {
            update: {
              fields,
              name: `projects/${config.projectId}/databases/(default)/documents/users/${req.user.userId}`,
            },
            updateMask: {fieldPaths: mask},
          },
        ],
      })
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });

  const userData2 = {};
  const doc2 = await axios
      .get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users/${req
              .params.userId}`,
      )
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });
  userData2.credentials = doc2.data.fields;

  fields = {};
  const mask2 = ["followers", "followersTimestamps"];
  if (userData2.credentials.followers.arrayValue.values && userData2.credentials.followers.arrayValue.values
      .map((id) => id.stringValue)
      .includes(req.user.userId)) {
    const idx = userData2.credentials.followers.arrayValue.values.map((a) => a.stringValue).indexOf(req.user.userId) + 1;
    userData2.credentials.followers.arrayValue.values.splice(idx, 1);
    userData2.credentials.followersTimestamps.arrayValue.values.splice(idx, 1);
    fields["followers"] = {arrayValue: {values:
      userData2.credentials.followers.arrayValue.values,
    }};
    fields["followersTimestamps"] = {arrayValue: {values:
      userData2.credentials.followersTimestamps.arrayValue.values,
    }};
  } else {
    fields["followers"] = {arrayValue: {values:
      [...(userData2.credentials.followers.arrayValue.values ?? []), {stringValue: req.user.userId}],
    }};
    fields["followersTimestamps"] = {arrayValue: {values:
      [...(userData2.credentials.followersTimestamps.arrayValue.values ?? []), {timestampValue: new Date()}],
    }};
  }

  await axios
      .post(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:commit`, {
        writes: [
          {
            update: {
              fields,
              name: `projects/${config.projectId}/databases/(default)/documents/users/${req.params.userId}`,
            },
            updateMask: {fieldPaths: mask2},
          },
        ],
      })
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });
  return res.status(200).json({message: "Details added successfully"});
};

exports.uploadImage = async (req, res) => {
  const bb = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");
  const busboy = bb({headers: req.headers});
  let imageToBeUploaded = {};
  let imageFileName = "";
  busboy.on("file", (fieldname, file, fileInfo) => {
    const {filename, mimeType} = fileInfo;
    if (mimeType !== "image/jpeg" && mimeType !== "image/png") {
      return res.status(400).json({error: "Wrong file type submitted"});
    }
    if (imageFileName !== "") {
      return;
    }
    const imageExtension = filename.split(".")[filename.split(".").length - 1];
    imageFileName = `${Math.round(Math.random() * 1000000000000).toString()}.${imageExtension}`;
    const filepath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = {filepath, mimeType};
    file.pipe(fs.createWriteStream(filepath));
  });

  busboy.on("finish", async () => {
    axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

    await axios
        .post(
            `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/public%2F${imageFileName}`,
            fs.createReadStream(imageToBeUploaded.filepath),
            {headers: {"Content-Type": imageToBeUploaded.mimeType}},
        )
        .catch((e) => {
          console.log(e);
          return res.status(500).json({e});
        });

    const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/public%2F${imageFileName}?alt=media`;

    await axios.patch(
        `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users/${req
            .user.localId}?updateMask.fieldPaths=imageUrl`,
        {
          fields: {imageUrl: {stringValue: imageUrl}},
        },
    ).catch((e) => {
      return res.status(500).json({e});
    });
    return res.json({message: "Image successfully loaded"});
  });
  busboy.on("error", (e) => {
    console.log(e);
    return res.status(500).json({e});
  });

  busboy.end(req.rawBody);
};

exports.likePost = async (req, res) => {
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  // Disallow liking of own posts?

  const userData = {};
  const doc = await axios
      .get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users/${req
              .user.userId}`,
      )
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });
  userData.credentials = doc.data.fields;

  if (userData.credentials.dislikes.arrayValue.values && userData.credentials.dislikes.arrayValue.values
      .map((id) => id.stringValue)
      .includes(req.params.postId)) {
    const userData = {};
    const doc = await axios
        .get(
            `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users/${req
                .user.userId}`,
        )
        .catch((err) => {
          return res.status(500).json({error: err.response.data.error.message});
        });
    userData.credentials = doc.data.fields;

    let fields = {};
    let mask = ["dislikes", "dislikesTimestamps"];
    let idx = -1;
    if (userData.credentials.dislikes.arrayValue.values && userData.credentials.dislikes.arrayValue.values
        .map((id) => id.stringValue)
        .includes(req.params.postId)) {
      idx = userData.credentials.dislikes.arrayValue.values.map((a) => a.stringValue).indexOf(req.params.postId);
      userData.credentials.dislikes.arrayValue.values.splice(idx, 1);
      userData.credentials.dislikesTimestamps.arrayValue.values.splice(idx, 1);
      fields["dislikes"] = {arrayValue: {values:
      userData.credentials.dislikes.arrayValue.values,
      }};
      fields["dislikesTimestamps"] = {arrayValue: {values:
      userData.credentials.dislikesTimestamps.arrayValue.values,
      }};
    } else {
      fields["dislikes"] = {arrayValue: {values:
      [...(userData.credentials.dislikes.arrayValue.values ?? []), {stringValue: req.params.postId}],
      }};
      fields["dislikesTimestamps"] = {arrayValue: {values:
      [...(userData.credentials.dislikesTimestamps.arrayValue.values ?? []), {timestampValue: new Date()}],
      }};
    }

    await axios
        .post(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:commit`, {
          writes: [
            {
              update: {
                fields,
                name: `projects/${config.projectId}/databases/(default)/documents/users/${req.user.userId}`,
              },
              updateMask: {fieldPaths: mask},
            },
          ],
        })
        .catch((err) => {
          return res.status(500).json({error: err.response.data.error.message});
        });

    const post = {};
    const data = await axios
        .get(
            `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/${req.url.split("/")[1]}/${req
                .params.postId}`,
        )
        .catch((e) => {
          return res.status(500).json({error: e.response.data.error.message});
        });
    post.info = data.data.fields;

    if (idx === -1) {
      fields = {vote: {integerValue: parseInt(post.info.vote.integerValue) - 1}};
    } else {
      fields = {vote: {integerValue: parseInt(post.info.vote.integerValue) + 1}};
    }
    mask = ["vote"];

    await axios
        .post(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:commit`, {
          writes: [
            {
              update: {
                fields,
                name: `projects/${config.projectId}/databases/(default)/documents/${req.url.split("/")[1]}/${req.params.postId}`,
              },
              updateMask: {
                fieldPaths: mask,
              },
            },
          ],
        })
        .catch((err) => {
          return res.status(500).json({error: err.response.data.error.message});
        });
  }

  let fields = {};
  let mask = ["likes", "likesTimestamps"];
  let idx = -1;
  if (userData.credentials.likes.arrayValue.values && userData.credentials.likes.arrayValue.values
      .map((id) => id.stringValue)
      .includes(req.params.postId)) {
    idx = userData.credentials.likes.arrayValue.values.map((a) => a.stringValue).indexOf(req.params.postId);
    userData.credentials.likes.arrayValue.values.splice(idx, 1);
    userData.credentials.likesTimestamps.arrayValue.values.splice(idx, 1);
    fields["likes"] = {arrayValue: {values:
      userData.credentials.likes.arrayValue.values,
    }};
    fields["likesTimestamps"] = {arrayValue: {values:
      userData.credentials.likesTimestamps.arrayValue.values,
    }};
  } else {
    fields["likes"] = {arrayValue: {values:
      [...(userData.credentials.likes.arrayValue.values ?? []), {stringValue: req.params.postId}],
    }};
    fields["likesTimestamps"] = {arrayValue: {values:
      [...(userData.credentials.likesTimestamps.arrayValue.values ?? []), {timestampValue: new Date()}],
    }};
  }

  await axios
      .post(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:commit`, {
        writes: [
          {
            update: {
              fields,
              name: `projects/${config.projectId}/databases/(default)/documents/users/${req.user.userId}`,
            },
            updateMask: {fieldPaths: mask},
          },
        ],
      })
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });

  const post = {};
  const data = await axios
      .get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/${req.url.split("/")[1]}/${req
              .params.postId}`,
      )
      .catch((e) => {
        return res.status(500).json({error: e.response.data.error.message});
      });
  post.info = data.data.fields;

  if (idx === -1) {
    fields = {vote: {integerValue: parseInt(post.info.vote.integerValue) + 1}};
  } else {
    fields = {vote: {integerValue: parseInt(post.info.vote.integerValue) - 1}};
  }
  mask = ["vote"];

  await axios
      .post(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:commit`, {
        writes: [
          {
            update: {
              fields,
              name: `projects/${config.projectId}/databases/(default)/documents/${req.url.split("/")[1]}/${req.params.postId}`,
            },
            updateMask: {
              fieldPaths: mask,
            },
          },
        ],
      })
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });

  return res.status(200).json({message: "Details added successfully"});
};

exports.dislikePost = async (req, res) => {
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  // Disallow liking of own posts?

  const userData = {};
  const doc = await axios
      .get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users/${req
              .user.userId}`,
      )
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });
  userData.credentials = doc.data.fields;


  if (userData.credentials.likes.arrayValue.values && userData.credentials.likes.arrayValue.values
      .map((id) => id.stringValue)
      .includes(req.params.postId)) {
    const userData = {};
    const doc = await axios
        .get(
            `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users/${req
                .user.userId}`,
        )
        .catch((err) => {
          return res.status(500).json({error: err.response.data.error.message});
        });
    userData.credentials = doc.data.fields;

    let fields = {};
    let mask = ["likes", "likesTimestamps"];
    let idx = -1;
    if (userData.credentials.likes.arrayValue.values && userData.credentials.likes.arrayValue.values
        .map((id) => id.stringValue)
        .includes(req.params.postId)) {
      idx = userData.credentials.likes.arrayValue.values.map((a) => a.stringValue).indexOf(req.params.postId);
      userData.credentials.likes.arrayValue.values.splice(idx, 1);
      userData.credentials.likesTimestamps.arrayValue.values.splice(idx, 1);
      fields["likes"] = {arrayValue: {values:
      userData.credentials.likes.arrayValue.values,
      }};
      fields["likesTimestamps"] = {arrayValue: {values:
      userData.credentials.likesTimestamps.arrayValue.values,
      }};
    } else {
      fields["likes"] = {arrayValue: {values:
      [...(userData.credentials.likes.arrayValue.values ?? []), {stringValue: req.params.postId}],
      }};
      fields["likesTimestamps"] = {arrayValue: {values:
      [...(userData.credentials.likesTimestamps.arrayValue.values ?? []), {timestampValue: new Date()}],
      }};
    }

    await axios
        .post(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:commit`, {
          writes: [
            {
              update: {
                fields,
                name: `projects/${config.projectId}/databases/(default)/documents/users/${req.user.userId}`,
              },
              updateMask: {fieldPaths: mask},
            },
          ],
        })
        .catch((err) => {
          return res.status(500).json({error: err.response.data.error.message});
        });

    const post = {};
    const data = await axios
        .get(
            `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/${req.url.split("/")[1]}/${req
                .params.postId}`,
        )
        .catch((e) => {
          return res.status(500).json({error: e.response.data.error.message});
        });
    post.info = data.data.fields;

    if (idx === -1) {
      fields = {vote: {integerValue: parseInt(post.info.vote.integerValue) + 1}};
    } else {
      fields = {vote: {integerValue: parseInt(post.info.vote.integerValue) - 1}};
    }
    mask = ["vote"];

    await axios
        .post(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:commit`, {
          writes: [
            {
              update: {
                fields,
                name: `projects/${config.projectId}/databases/(default)/documents/${req.url.split("/")[1]}/${req.params.postId}`,
              },
              updateMask: {
                fieldPaths: mask,
              },
            },
          ],
        })
        .catch((err) => {
          return res.status(500).json({error: err.response.data.error.message});
        });
  }

  let fields = {};
  let mask = ["dislikes", "dislikesTimestamps"];
  let idx = -1;
  if (userData.credentials.dislikes.arrayValue.values && userData.credentials.dislikes.arrayValue.values
      .map((id) => id.stringValue)
      .includes(req.params.postId)) {
    idx = userData.credentials.dislikes.arrayValue.values.map((a) => a.stringValue).indexOf(req.params.postId);
    userData.credentials.dislikes.arrayValue.values.splice(idx, 1);
    userData.credentials.dislikesTimestamps.arrayValue.values.splice(idx, 1);
    fields["dislikes"] = {arrayValue: {values:
      userData.credentials.dislikes.arrayValue.values,
    }};
    fields["dislikesTimestamps"] = {arrayValue: {values:
      userData.credentials.dislikesTimestamps.arrayValue.values,
    }};
  } else {
    fields["dislikes"] = {arrayValue: {values:
      [...(userData.credentials.dislikes.arrayValue.values ?? []), {stringValue: req.params.postId}],
    }};
    fields["dislikesTimestamps"] = {arrayValue: {values:
      [...(userData.credentials.dislikesTimestamps.arrayValue.values ?? []), {timestampValue: new Date()}],
    }};
  }

  await axios
      .post(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:commit`, {
        writes: [
          {
            update: {
              fields,
              name: `projects/${config.projectId}/databases/(default)/documents/users/${req.user.userId}`,
            },
            updateMask: {fieldPaths: mask},
          },
        ],
      })
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });

  const post = {};
  const data = await axios
      .get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/${req.url.split("/")[1]}/${req
              .params.postId}`,
      )
      .catch((e) => {
        return res.status(500).json({error: e.response.data.error.message});
      });
  post.info = data.data.fields;

  if (idx === -1) {
    fields = {vote: {integerValue: parseInt(post.info.vote.integerValue) - 1}};
  } else {
    fields = {vote: {integerValue: parseInt(post.info.vote.integerValue) + 1}};
  }
  mask = ["vote"];

  await axios
      .post(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:commit`, {
        writes: [
          {
            update: {
              fields,
              name: `projects/${config.projectId}/databases/(default)/documents/${req.url.split("/")[1]}/${req.params.postId}`,
            },
            updateMask: {
              fieldPaths: mask,
            },
          },
        ],
      })
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });

  return res.status(200).json({message: "Details added successfully"});
};
