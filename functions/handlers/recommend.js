const {shuffle} = require("../utils/shuffle");
const axios = require("axios");
const config = require("../config");

exports.recommendUsers = async (req, res) => {
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

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

  const docs = await axios
      .post(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:runQuery`,
          {
            structuredQuery: {
              from: [
                {
                  collectionId: "users",
                },
              ],
              where: {
                fieldFilter: {
                  field: {
                    fieldPath: "id",
                  },
                  op: "NOT_EQUAL",
                  value: {
                    stringValue: req.user.userId,
                  },
                },
              },
              orderBy: [
                {
                  field: {
                    fieldPath: "id",
                  },
                  direction: "ASCENDING",
                },
              ],
            },
          },
      )
      .catch((e) => {
        return res.status(500).json({error: e.response.data});
      });

  let users = docs.data.filter((doc) => doc.document).map((doc) => {
    return doc.document.fields;
  });

  users = users.filter(
      (user) =>
        !userData.credentials.following.arrayValue.values || (userData.credentials.following.arrayValue.values && !userData.credentials.following.arrayValue.values.map((a) => a.stringValue).includes(user.id.stringValue)),
  );
  shuffle(users);
  return res.json({users: users.slice(0, 5)});
};

exports.recommendDiscuss = async (req, res) => {
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

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
                  op: "NOT_EQUAL",
                  value: {
                    stringValue: req.user.userId,
                  },
                },
              },
            },
          },
      )
      .catch((e) => {
        return res.status(500).json({error: e.response.data});
      });

  const posts = docs.data.filter((doc) => doc.document).map((doc) => {
    return doc.document.fields;
  });

  const docs2 = await axios
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
                    stringValue: req.user.userId,
                  },
                },
              },
            },
          },
      )
      .catch((e) => {
        return res.status(500).json({error: e.response.data});
      });

  const posts2 = docs2.data.filter((doc) => doc.document).map((doc) => {
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

          const user = await axios
              .get(
                  `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users/${post
                      .info.author.stringValue}`,
              )
              .catch((err) => {
                return res.status(500).json({error: err.response.data.error.message});
              });
          post.author = user.data.fields;

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

  let allPosts2 = [];
  if (posts2) {
    allPosts2 = await Promise.all(
        posts2.map(async (a) => {
          const post = {info: {...a}};
          const postId = a.id.stringValue;

          const doc = await axios
              .get(
                  `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/discuss/${postId}/replies`,
              )
              .catch((e) => {
                return res.status(500).json({error: e.response.data.error.message});
              });

          const user = await axios
              .get(
                  `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users/${post
                      .info.author.stringValue}`,
              )
              .catch((err) => {
                return res.status(500).json({error: err.response.data.error.message});
              });
          post.author = user.data.fields;

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

  //   allPosts = allPosts.filter((post) => !userData.credentials.following.arrayValue.values.map((a) => a.stringValue).includes(post.info.author.stringValue));
  shuffle(allPosts);
  allPosts = [...allPosts2, ...(allPosts.slice(0, 10))].sort((a, b) => {
    return new Date(b.info.createdAt.timestampValue) - new Date(a.info.createdAt.timestampValue);
  });
  return res.json({posts: allPosts});
};

exports.recommendSocial = async (req, res) => {
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

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

  const docs = await axios
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
                  op: "NOT_EQUAL",
                  value: {
                    stringValue: req.user.userId,
                  },
                },
              },
            },
          },
      )
      .catch((e) => {
        return res.status(500).json({error: e.response.data});
      });

  const posts = docs.data.filter((doc) => doc.document).map((doc) => {
    return doc.document.fields;
  });

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
                    stringValue: req.user.userId,
                  },
                },
              },
            },
          },
      )
      .catch((e) => {
        return res.status(500).json({error: e.response.data});
      });

  const posts2 = docs2.data.filter((doc) => doc.document).map((doc) => {
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
                  `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/social/${postId}/replies`,
              )
              .catch((e) => {
                return res.status(500).json({error: e.response.data.error.message});
              });

          const user = await axios
              .get(
                  `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users/${post
                      .info.author.stringValue}`,
              )
              .catch((err) => {
                return res.status(500).json({error: err.response.data.error.message});
              });
          post.author = user.data.fields;

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

  let allPosts2 = [];
  if (posts2) {
    allPosts2 = await Promise.all(
        posts2.map(async (a) => {
          const post = {info: {...a}};
          const postId = a.id.stringValue;

          const doc = await axios
              .get(
                  `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/social/${postId}/replies`,
              )
              .catch((e) => {
                return res.status(500).json({error: e.response.data.error.message});
              });

          const user = await axios
              .get(
                  `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users/${post
                      .info.author.stringValue}`,
              )
              .catch((err) => {
                return res.status(500).json({error: err.response.data.error.message});
              });
          post.author = user.data.fields;

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

  //   allPosts = allPosts.filter((post) => !userData.credentials.following.arrayValue.values.map((a) => a.stringValue).includes(post.info.author.stringValue));
  shuffle(allPosts);
  allPosts = [...allPosts2, ...(allPosts.slice(0, 10))].sort((a, b) => {
    return new Date(b.info.createdAt.timestampValue) - new Date(a.info.createdAt.timestampValue);
  });
  return res.json({posts: allPosts});
};

exports.recommendCompanies = async (req, res) => {
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

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

  let allComps = [];
  let tries = 0;
  while (allComps.length !== 5 && tries < 1000) {
    const docs = await axios
        .post(
            `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:runQuery`,
            {
              structuredQuery: {
                from: [
                  {
                    collectionId: "company",
                  },
                ],
                orderBy: [
                  {
                    field: {
                      fieldPath: "id",
                    },
                    direction: "ASCENDING",
                  },
                ],
                offset: Math.floor(Math.random() * 498), // 498 not included
                limit: 1,
              },
            },
        )
        .catch((e) => {
          return res.status(500).json({error: e.response.data});
        });

    const comp = docs.data.filter((doc) => doc.document).map((doc) => {
      return doc.document.fields;
    })[0];
    if (!allComps.map((a) => a.id.stringValue).includes(comp.id.stringValue) &&
    (!userData.credentials.starredCompanies.arrayValue.values ||
      (userData.credentials.starredCompanies.arrayValue.values && !userData.credentials.starredCompanies.arrayValue.values.map((a) => a.stringValue).includes(comp.id.stringValue))
    )) {
      allComps = [...allComps, comp];
    }
    tries++;
  }

  return res.json({companies: allComps});
};
