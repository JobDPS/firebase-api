const axios = require("axios");
const config = require("../config");

exports.createRelation = async (req, res) => {
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  const errors = {};
  if (req.body.id.trim() === "") {
    errors.relationCompany = "Must not be empty";
  }
  if (!(Object.keys(errors).length === 0)) return res.status(400).json(errors);

  const doc = await axios
      .post(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/relation`,
          {
            fields: {
              companyId: {stringValue: req.body.id},
              stage: {integerValue: -1},
              status: {integerValue: 0},
              notes: {stringValue: ""},
              starred: {integerValue: 0},
              dates: {
                arrayValue: {
                  values: [
                    {stringValue: ""},
                    {stringValue: ""},
                    {stringValue: ""},
                    {stringValue: ""},
                    {stringValue: ""},
                    {stringValue: ""},
                  ],
                },
              },
            },
          },
      )
      .catch((err) => {
        console.log(err.response.data);
        return res.status(500).json({error: err.response.data.error.message});
      });

  const postId = doc.data.name.split("/").splice(-1)[0];
  let fields = {id: {stringValue: postId}, createdAt: {timestampValue: doc.data.createTime}};
  const mask = ["id", "createdAt"];
  await axios
      .post(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:commit`, {
        writes: [
          {
            update: {
              fields,
              name: `projects/${config.projectId}/databases/(default)/documents/relation/${postId}`,
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

  const userData = {};
  const doc2 = await axios
      .get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users/${req
              .user.userId}`,
      )
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });
  userData.credentials = doc2.data.fields;

  fields = {};
  const mask2 = ["relations"];
  fields["relations"] = {
    arrayValue: {
      values: [...(userData.credentials.relations.arrayValue.values ?? []), {stringValue: postId}],
    },
  };
  await axios
      .post(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:commit`, {
        writes: [
          {
            update: {
              fields,
              name: `projects/${config.projectId}/databases/(default)/documents/users/${req.user.localId}`,
            },
            updateMask: {fieldPaths: mask2},
          },
        ],
      })
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });

  return res.status(200).json({id: postId});
};

exports.getRelations = async (req, res) => {
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  const docs = await axios
      .get(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/relation`)
      .catch((e) => {
        return res.status(500).json({error: e.response.data.error.message});
      });

  let allRelations = [];
  const posts = docs.data.documents;
  if (posts) {
    const desc = posts.sort((a, b) => {
      return new Date(a.createTime) - new Date(b.createTime);
    });
    allRelations = await Promise.all(
        desc.map(async (a) => {
          const post = {};
          const postId = a.fields.id.stringValue;
          const data = await axios
              .get(
                  `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/relation/${postId}`,
              )
              .catch((e) => {
                return res.status(500).json({error: e.response.data.error.message});
              });
          post.info = data.data.fields;

          const comp = await axios
              .get(
                  `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/company/${post
                      .info.companyId.stringValue}`,
              )
              .catch((err) => {
                return res.status(500).json({error: err.response.data.error.message});
              });
          post.company = comp.data.fields;

          return post;
        }),
    );
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

  allRelations = allRelations.filter(
      (relation) =>
        userData.credentials.relations.arrayValue.values.filter(
            (id) => id.stringValue === relation.info.id.stringValue,
        ).length > 0,
  );

  return res.status(200).json({allRelations});
};

exports.getRelation = async (req, res) => {
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  const relation = {};
  const postId = req.params.relationId;
  const data = await axios
      .get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/relation/${postId}`,
      )
      .catch((e) => {
        return res.status(500).json({error: e.response.data.error.message});
      });
  relation.info = data.data.fields;

  const comp = await axios
      .get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/company/${relation
              .info.companyId.stringValue}`,
      )
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });
  relation.company = comp.data.fields;

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

  if (
    userData.credentials.relations.arrayValue.values.filter((id) => id.stringValue === relation.info.id.stringValue)
        .length === 0
  ) {
    return res.status(403).json({error: "Unauthorized"});
  }

  return res.status(200).json({relation});
};

exports.editRelation = async (req, res) => {
  // TODO: Allow only certain aspects to be edited and only by owner
  //   const channelDetails = validateChannelData(req.body);
  const postDetails = req.body;
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  //   const errors = {};
  //   if (req.body.body.trim() === "") {
  //     errors.postBody = "Must not be empty";
  //   }
  //   if (req.body.title.trim() === "") {
  //     errors.postTitle = "Must not be empty";
  //   }
  //   if (!(Object.keys(errors).length === 0)) return res.status(400).json(errors);

  const fields = {};
  const mask = [];
  for (const key in postDetails) {
    if (key) {
      switch (typeof postDetails[key]) {
        case "number":
          fields[key] = {integerValue: postDetails[key]};
          break;
        case "string":
          fields[key] = {stringValue: postDetails[key]};
          break;
      }
      mask.push(key);
    }
  }

  await axios
      .post(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:commit`, {
        writes: [
          {
            update: {
              fields,
              name: `projects/${config.projectId}/databases/(default)/documents/relation/${req.params
                  .relationId}`,
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

exports.editRelationDate = async (req, res) => {
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  const post = {};
  const postId = req.params.relationId;
  const data = await axios
      .get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/relation/${postId}`,
      )
      .catch((e) => {
        return res.status(500).json({error: e.response.data.error.message});
      });
  post.info = data.data.fields;
  post.info.dates.arrayValue.values[req.body.index] = {stringValue: req.body.newDate};

  const fields = {};
  const mask = ["dates"];
  fields["dates"] = post.info.dates;

  await axios
      .post(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:commit`, {
        writes: [
          {
            update: {
              fields,
              name: `projects/${config.projectId}/databases/(default)/documents/relation/${req.params
                  .relationId}`,
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

exports.deleteRelation = async (req, res) => {
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

  if (
    userData.credentials.relations.arrayValue.values.filter((id) => id.stringValue === req
        .params.relationId)
        .length === 0
  ) {
    return res.status(403).json({error: "Unauthorized"});
  }

  await axios
      .delete(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/relation/${req
              .params.relationId}`,
      )
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });

  const fields = {};
  const mask = ["relations"];
  fields["relations"] = {
    arrayValue: {
      values: userData.credentials.relations.arrayValue.values.filter(
          (id) => id.stringValue !== req.params.relationId,
      ),
    },
  };
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
  return res.json({message: "Relation deleted"});
};
