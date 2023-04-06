const axios = require("axios");
const config = require("../config");

exports.createSocialPost = async (req, res) => {
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  const errors = {};
  if (req.body.body.trim() === "") {
    errors.postBody = "Must not be empty";
  }
  if (!(Object.keys(errors).length === 0)) return res.status(400).json(errors);

  const doc = await axios
      .post(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/social`, {
        fields: {
          author: {stringValue: req.user.userId},
          body: {stringValue: req.body.body},
          vote: {integerValue: 0},
        },
      })
      .catch((err) => {
        console.log(err.response.data);
        return res.status(500).json({error: err.response.data.error.message});
      });

  const postId = doc.data.name.split("/").splice(-1)[0];
  const fields = {id: {stringValue: postId}, createdAt: {timestampValue: doc.data.createTime}};
  const mask = ["id", "createdAt"];
  await axios
      .post(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:commit`, {
        writes: [
          {
            update: {
              fields,
              name: `projects/${config.projectId}/databases/(default)/documents/social/${postId}`,
            },
            updateMask: {
              fieldPaths: mask,
            },
          },
        ],
      })
      .catch((err) => {
        console.log(err.response.data);
        return res.status(500).json({error: err.response.data.error.message});
      });

  return res.status(200).json({id: postId});
};

exports.createSocialReply = async (req, res) => {
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  const errors = {};
  if (req.body.body.trim() === "") {
    errors.replyBody = "Must not be empty";
  }
  if (!(Object.keys(errors).length === 0)) return res.status(400).json(errors);

  const doc = await axios
      .post(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/social/${req
              .params.postId}/replies`,
          {
            fields: {
              author: {stringValue: req.user.userId},
              body: {stringValue: req.body.body},
              vote: {integerValue: 0},
            },
          },
      )
      .catch((err) => {
        console.log(err.response.data);
        return res.status(500).json({error: err.response.data.error.message});
      });

  const postId = doc.data.name.split("/").splice(-1)[0];
  const fields = {id: {stringValue: postId}, createdAt: {timestampValue: doc.data.createTime}};
  const mask = ["id", "createdAt"];
  await axios
      .post(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:commit`, {
        writes: [
          {
            update: {
              fields,
              name: `projects/${config.projectId}/databases/(default)/documents/social/${req.params
                  .postId}/replies/${postId}`,
            },
            updateMask: {
              fieldPaths: mask,
            },
          },
        ],
      })
      .catch((err) => {
        console.log(err.response.data);
        return res.status(500).json({error: err.response.data.error.message});
      });

  return res.status(200).json({id: postId});
};

exports.createSocialReplyReply = async (req, res) => {
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  const errors = {};
  if (req.body.body.trim() === "") {
    errors[req.params.replyId] = "Must not be empty";
  }
  if (!(Object.keys(errors).length === 0)) return res.status(400).json(errors);

  const doc = await axios
      .post(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/social/${req
              .params.postId}/replies/${req.params.replyId}/replies`,
          {
            fields: {
              author: {stringValue: req.user.userId},
              body: {stringValue: req.body.body},
              vote: {integerValue: 0},
            },
          },
      )
      .catch((err) => {
        console.log(err.response.data);
        return res.status(500).json({error: err.response.data.error.message});
      });

  const postId = doc.data.name.split("/").splice(-1)[0];
  const fields = {id: {stringValue: postId}, createdAt: {timestampValue: doc.data.createTime}};
  const mask = ["id", "createdAt"];
  await axios
      .post(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:commit`, {
        writes: [
          {
            update: {
              fields,
              name: `projects/${config.projectId}/databases/(default)/documents/social/${req.params
                  .postId}/replies/${req.params.replyId}/replies/${postId}`,
            },
            updateMask: {
              fieldPaths: mask,
            },
          },
        ],
      })
      .catch((err) => {
        console.log(err.response.data);
        return res.status(500).json({error: err.response.data.error.message});
      });

  return res.status(200).json({id: postId});
};

exports.createSocialReplyReply2 = async (req, res) => {
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  const errors = {};
  if (req.body.body.trim() === "") {
    errors[req.params.replyId2] = "Must not be empty";
  }
  if (!(Object.keys(errors).length === 0)) return res.status(400).json(errors);

  const doc = await axios
      .post(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/social/${req
              .params.postId}/replies/${req.params.replyId}/replies`,
          {
            fields: {
              author: {stringValue: req.user.userId},
              body: {stringValue: req.body.body},
              vote: {integerValue: 0},
            },
          },
      )
      .catch((err) => {
        console.log(err.response.data);
        return res.status(500).json({error: err.response.data.error.message});
      });

  const postId = doc.data.name.split("/").splice(-1)[0];
  const fields = {id: {stringValue: postId}, createdAt: {timestampValue: doc.data.createTime}};
  const mask = ["id", "createdAt"];
  await axios
      .post(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:commit`, {
        writes: [
          {
            update: {
              fields,
              name: `projects/${config.projectId}/databases/(default)/documents/social/${req.params
                  .postId}/replies/${req.params.replyId}/replies/${postId}`,
            },
            updateMask: {
              fieldPaths: mask,
            },
          },
        ],
      })
      .catch((err) => {
        console.log(err.response.data);
        return res.status(500).json({error: err.response.data.error.message});
      });

  return res.status(200).json({id: postId});
};

exports.getAllSocialPosts = async (req, res) => {
  const docs = await axios
      .get(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/social`)
      .catch((e) => {
        return res.status(500).json({error: e.response.data.error.message});
      });

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
  if (userData.credentials.following.arrayValue.values) {
    userData.credentials.following.arrayValue.values = userData.credentials.following.arrayValue.values.map(
        (id) => id.stringValue,
    );
  }

  let allPosts = [];
  const posts = docs.data.documents;
  if (posts) {
    let desc = posts.sort((a, b) => {
      return new Date(b.createTime) - new Date(a.createTime);
    });
    desc = desc.filter((a) => a.fields.author.stringValue === req.user.userId || (userData.credentials.following.arrayValue.values && userData.credentials.following.arrayValue.values.includes(a.fields.author.stringValue)));
    allPosts = await Promise.all(
        desc.map(async (a) => {
          const post = {};
          const postId = a.fields.id.stringValue;
          const data = await axios
              .get(
                  `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/social/${postId}`,
              )
              .catch((e) => {
                return res.status(500).json({error: e.response.data.error.message});
              });
          post.info = data.data.fields;

          const user = await axios
              .get(
                  `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users/${post
                      .info.author.stringValue}`,
              )
              .catch((err) => {
                return res.status(500).json({error: err.response.data.error.message});
              });
          post.author = user.data.fields;

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
                    const docs = await Promise.all(
                        desc.map(async (a) => {
                          const author = await axios
                              .get(
                                  `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users/${a
                                      .fields.author.stringValue}`,
                              )
                              .catch((err) => {
                                return res
                                    .status(500)
                                    .json({error: err.response.data.error.message});
                              });
                          return {info: a.fields, author: author.data.fields};
                        }),
                    );
                    replies = docs;
                  }

                  const author = await axios
                      .get(
                          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users/${a
                              .fields.author.stringValue}`,
                      )
                      .catch((err) => {
                        return res.status(500).json({error: err.response.data.error.message});
                      });

                  return {info: a.fields, replies, author: author.data.fields};
                }),
            );

            post.replies = docs;
          }
          return post;
        }),
    );
  }

  return res.status(200).json({allPosts});
};

exports.getSocialPost = async (req, res) => {
  const post = {};
  const data = await axios
      .get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/social/${req
              .params.postId}`,
      )
      .catch((e) => {
        return res.status(500).json({error: e.response.data.error.message});
      });
  post.info = data.data.fields;

  const user = await axios
      .get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users/${post
              .info.author.stringValue}`,
      )
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });
  post.author = user.data.fields;

  const doc = await axios
      .get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/social/${req
              .params.postId}/replies`,
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
                  `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/social/${req
                      .params.postId}/replies/${id}/replies`,
              )
              .catch((e) => {
                return res.status(500).json({error: e.response.data.error.message});
              });

          let replies = null;
          if (rep.data.documents) {
            const desc = rep.data.documents.sort((a, b) => {
              return new Date(a.createTime) - new Date(b.createTime);
            });
            const docs = await Promise.all(
                desc.map(async (a) => {
                  const author = await axios
                      .get(
                          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users/${a
                              .fields.author.stringValue}`,
                      )
                      .catch((err) => {
                        return res.status(500).json({error: err.response.data.error.message});
                      });
                  return {info: a.fields, author: author.data.fields};
                }),
            );
            replies = docs;
          }

          const author = await axios
              .get(
                  `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users/${a
                      .fields.author.stringValue}`,
              )
              .catch((err) => {
                return res.status(500).json({error: err.response.data.error.message});
              });

          return {info: a.fields, author: author.data.fields, replies};
        }),
    );

    post.replies = docs;
  }
  return res.status(200).json({post});
};

exports.editSocialPost = async (req, res) => {
  // TODO: Allow only certain aspects to be edited and only by owner
  //   const channelDetails = validateChannelData(req.body);
  const postDetails = req.body;
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  const errors = {};
  if (req.body.body.trim() === "") {
    errors.postBody = "Must not be empty";
  }
  if (!(Object.keys(errors).length === 0)) return res.status(400).json(errors);

  const fields = {};
  const mask = [];
  for (const key in postDetails) {
    if (key) {
      fields[key] = {stringValue: postDetails[key]};
      mask.push(key);
    }
  }

  const post = {};
  const data = await axios
      .get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/social/${req
              .params.postId}`,
      )
      .catch((e) => {
        return res.status(500).json({error: e.response.data.error.message});
      });
  post.info = data.data.fields;

  if (post.info.author.stringValue !== req.user.userId) {
    return res.status(403).json({error: "Unauthorized"});
  }

  await axios
      .post(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:commit`, {
        writes: [
          {
            update: {
              fields,
              name: `projects/${config.projectId}/databases/(default)/documents/social/${req.params.postId}`,
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

exports.editSocialReply = async (req, res) => {
  // TODO: Allow only certain aspects to be edited and only by owner
  //   const channelDetails = validateChannelData(req.body);
  const replyDetails = req.body;
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  const errors = {};
  if (req.body.body.trim() === "") {
    errors[req.params.replyId] = "Must not be empty";
  }
  if (!(Object.keys(errors).length === 0)) return res.status(400).json(errors);

  const fields = {};
  const mask = [];
  for (const key in replyDetails) {
    if (key) {
      fields[key] = {stringValue: replyDetails[key]};
      mask.push(key);
    }
  }

  const post = {};
  const data = await axios
      .get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/social/${req
              .params.postId}/replies/${req.params.replyId}`,
      )
      .catch((e) => {
        return res.status(500).json({error: e.response.data.error.message});
      });
  post.info = data.data.fields;

  if (post.info.author.stringValue !== req.user.userId) {
    return res.status(403).json({error: "Unauthorized"});
  }

  await axios
      .post(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:commit`, {
        writes: [
          {
            update: {
              fields,
              name: `projects/${config.projectId}/databases/(default)/documents/social/${req.params
                  .postId}/replies/${req.params.replyId}`,
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

exports.editSocialReplyReply = async (req, res) => {
  // TODO: Allow only certain aspects to be edited and only by owner
  //   const channelDetails = validateChannelData(req.body);
  const replyDetails = req.body;
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  const errors = {};
  if (req.body.body.trim() === "") {
    errors[req.params.replyId2] = "Must not be empty";
  }
  if (!(Object.keys(errors).length === 0)) return res.status(400).json(errors);

  const fields = {};
  const mask = [];
  for (const key in replyDetails) {
    if (key) {
      fields[key] = {stringValue: replyDetails[key]};
      mask.push(key);
    }
  }

  const post = {};
  const data = await axios
      .get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/social/${req
              .params.postId}/replies/${req.params.replyId}/replies/${req.params.replyId2}`,
      )
      .catch((e) => {
        return res.status(500).json({error: e.response.data.error.message});
      });
  post.info = data.data.fields;

  if (post.info.author.stringValue !== req.user.userId) {
    return res.status(403).json({error: "Unauthorized"});
  }

  await axios
      .post(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:commit`, {
        writes: [
          {
            update: {
              fields,
              name: `projects/${config.projectId}/databases/(default)/documents/social/${req.params
                  .postId}/replies/${req.params.replyId}/replies/${req.params.replyId2}`,
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

exports.deleteSocialPost = async (req, res) => {
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  const post = {};
  const data = await axios
      .get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/social/${req
              .params.postId}`,
      )
      .catch((e) => {
        return res.status(500).json({error: e.response.data.error.message});
      });
  post.info = data.data.fields;

  if (post.info.author.stringValue !== req.user.userId) {
    return res.status(403).json({error: "Unauthorized"});
  }

  const doc = await axios
      .get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/social/${req
              .params.postId}/replies`,
      )
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });

  const messages = doc.data.documents;
  if (messages) {
    const deletes = messages.map((a) => {
      return {
        delete: `projects/${config.projectId}/databases/(default)/documents/social/${req.params
            .postId}/replies/${a.fields.id.stringValue}`,
      };
    });

    await Promise.all(
        messages.map(async (a) => {
          const id = a.fields.id.stringValue;
          const doc = await axios
              .get(
                  `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/social/${req
                      .params.postId}/replies/${id}/replies`,
              )
              .catch((err) => {
                return res.status(500).json({error: err.response.data.error.message});
              });

          const messages = doc.data.documents;
          if (messages) {
            const deletes = messages.map((a) => {
              return {
                delete: `projects/${config.projectId}/databases/(default)/documents/social/${req.params
                    .postId}/replies/${id}/replies/${a.fields.id.stringValue}`,
              };
            });

            await axios
                .post(
                    `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:commit`,
                    {
                      writes: deletes,
                    },
                )
                .catch((err) => {
                  return res.status(500).json({error: err.response.data.error.message});
                });
          }
        }),
    );

    await axios
        .post(
            `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:commit`,
            {
              writes: deletes,
            },
        )
        .catch((err) => {
          return res.status(500).json({error: err.response.data.error.message});
        });
  }

  await axios
      .delete(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/social/${req
              .params.postId}`,
      )
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });

  return res.json({message: "Post deleted"});
};

exports.deleteSocialReply = async (req, res) => {
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  const post = {};
  const data = await axios
      .get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/social/${req
              .params.postId}/replies/${req.params.replyId}`,
      )
      .catch((e) => {
        return res.status(500).json({error: e.response.data.error.message});
      });
  post.info = data.data.fields;

  if (post.info.author.stringValue !== req.user.userId) {
    return res.status(403).json({error: "Unauthorized"});
  }

  const doc = await axios
      .get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/social/${req
              .params.postId}/replies/${req.params.replyId}/replies`,
      )
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });

  const messages = doc.data.documents;
  if (messages) {
    const deletes = messages.map((a) => {
      return {
        delete: `projects/${config.projectId}/databases/(default)/documents/social/${req.params
            .postId}/replies/${req.params.replyId}/replies/${a.fields.id.stringValue}`,
      };
    });

    await axios
        .post(
            `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:commit`,
            {
              writes: deletes,
            },
        )
        .catch((err) => {
          return res.status(500).json({error: err.response.data.error.message});
        });
  }

  await axios
      .delete(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/social/${req
              .params.postId}/replies/${req.params.replyId}`,
      )
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });

  return res.json({message: "Reply deleted"});
};

exports.deleteSocialReplyReply = async (req, res) => {
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  const post = {};
  const data = await axios
      .get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/social/${req
              .params.postId}/replies/${req.params.replyId}/replies/${req.params.replyId2}`,
      )
      .catch((e) => {
        return res.status(500).json({error: e.response.data.error.message});
      });
  post.info = data.data.fields;

  if (post.info.author.stringValue !== req.user.userId) {
    return res.status(403).json({error: "Unauthorized"});
  }

  await axios
      .delete(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/social/${req
              .params.postId}/replies/${req.params.replyId}/replies/${req.params.replyId2}`,
      )
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });

  return res.json({message: "Reply Reply deleted"});
};
