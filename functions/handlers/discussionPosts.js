const axios = require("axios");
const config = require("../config");

exports.createDiscussionPost = async (req, res) => {
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  const doc = await axios
      .post(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/discuss`,
          {
            fields: {
              title: {stringValue: req.body.title},
              author: {stringValue: req.user.userId},
              body: {stringValue: req.body.body},
              // users: { arrayValue: { values: [ { stringValue: req.user.localId } ] } }
            },
          },
      )
      .catch((err) => {
        console.log(err.response.data);
        return res.status(500).json({error: err.response.data.error.message});
      });

  const postId = doc.data.name.split("/").splice(-1)[0];
  const fields = {id: {stringValue: postId}};
  const mask = ["id"];
  await axios
      .post(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:commit`, {
        writes: [
          {
            update: {
              fields,
              name: `projects/${config.projectId}/databases/(default)/documents/discuss/${postId}`,
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

exports.createDiscussionReply = async (req, res) => {
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  const doc = await axios
      .post(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/discuss/${req.params.postId}/replies`,
          {
            fields: {
              author: {stringValue: req.user.userId},
              body: {stringValue: req.body.body},
              // users: { arrayValue: { values: [ { stringValue: req.user.localId } ] } }
            },
          },
      )
      .catch((err) => {
        console.log(err.response.data);
        return res.status(500).json({error: err.response.data.error.message});
      });

  const postId = doc.data.name.split("/").splice(-1)[0];
  const fields = {id: {stringValue: postId}};
  const mask = ["id"];
  await axios
      .post(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:commit`, {
        writes: [
          {
            update: {
              fields,
              name: `projects/${config.projectId}/databases/(default)/documents/discuss/${req.params.postId}/replies/${postId}`,
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


exports.createDiscussionReplyReply = async (req, res) => {
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  const doc = await axios
      .post(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/discuss/${req.params.postId}/replies/${req.params.replyId}/replies`,
          {
            fields: {
              author: {stringValue: req.user.userId},
              body: {stringValue: req.body.body},
              // users: { arrayValue: { values: [ { stringValue: req.user.localId } ] } }
            },
          },
      )
      .catch((err) => {
        console.log(err.response.data);
        return res.status(500).json({error: err.response.data.error.message});
      });

  const postId = doc.data.name.split("/").splice(-1)[0];
  const fields = {id: {stringValue: postId}};
  const mask = ["id"];
  await axios
      .post(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:commit`, {
        writes: [
          {
            update: {
              fields,
              name: `projects/${config.projectId}/databases/(default)/documents/discuss/${req.params.postId}/replies/${req.params.replyId}/replies/${postId}`,
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

exports.getDiscussionPost = async (req, res) => {
  const post = {};
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;
  const data = await axios
      .get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/discuss/${req
              .params.postId}`,
      )
      .catch((e) => {
        return res.status(500).json({error: e.response.data.error.message});
      });
  post.info = data.data.fields;

  const doc = await axios
      .get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/discuss/${req
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
    const docs = await Promise.all(desc.map(async (a) => {
      const id = a.fields.id.stringValue;
      const rep = await axios.get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/discuss/${req.params.postId}/replies/${id}/replies`,
      )
          .catch((e) => {
            return res.status(500).json({error: e.response.data.error.message});
          });

      let replies = null;
      if (rep.data.documents) {
        const desc = rep.data.documents.sort((a, b) => {
          return new Date(a.createTime) - new Date(b.createTime);
        });
        const docs = desc.map((a)=>{
          return a.fields;
        });
        replies = docs;
      }
      return {info: a.fields, replies};
    }));

    post.replies = docs;
  }
  return res.status(200).json({post});
};

exports.editDiscussionPost = async (req, res) => {
  // TODO: Allow only certain aspects to be edited and only by owner
//   const channelDetails = validateChannelData(req.body);
  const postDetails = req.body;
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  const fields = {};
  const mask = [];
  for (const key in postDetails) {
    if (key) {
      fields[key] = {stringValue: postDetails[key]};
      mask.push(key);
    }
  }

  await axios
      .post(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:commit`, {
        writes: [
          {
            update: {
              fields,
              name: `projects/${config.projectId}/databases/(default)/documents/discuss/${req.params
                  .postId}`,
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

exports.editDiscussionReply = async (req, res) => {
  // TODO: Allow only certain aspects to be edited and only by owner
  //   const channelDetails = validateChannelData(req.body);
  const replyDetails = req.body;
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  const fields = {};
  const mask = [];
  for (const key in replyDetails) {
    if (key) {
      fields[key] = {stringValue: replyDetails[key]};
      mask.push(key);
    }
  }

  await axios
      .post(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:commit`, {
        writes: [
          {
            update: {
              fields,
              name: `projects/${config.projectId}/databases/(default)/documents/discuss/${req.params
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

exports.editDiscussionReplyReply = async (req, res) => {
  // TODO: Allow only certain aspects to be edited and only by owner
  //   const channelDetails = validateChannelData(req.body);
  const replyDetails = req.body;
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  const fields = {};
  const mask = [];
  for (const key in replyDetails) {
    if (key) {
      fields[key] = {stringValue: replyDetails[key]};
      mask.push(key);
    }
  }

  await axios
      .post(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:commit`, {
        writes: [
          {
            update: {
              fields,
              name: `projects/${config.projectId}/databases/(default)/documents/discuss/${req.params
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

exports.deleteDiscussionPost = async (req, res) => {
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  const doc = await axios
      .get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/discuss/${req
              .params.postId}/replies`,
      )
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });

  const messages = doc.data.documents;
  if (messages) {
    const deletes = messages.map((a) => {
      return {
        delete: `projects/${config.projectId}/databases/(default)/documents/discuss/${req.params
            .postId}/replies/${a.fields.id.stringValue}`,
      };
    });

    await Promise.all(messages.map(async (a) => {
      const id = a.fields.id.stringValue;
      const doc = await axios
          .get(
              `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/discuss/${req
                  .params.postId}/replies/${id}/replies`,
          )
          .catch((err) => {
            return res.status(500).json({error: err.response.data.error.message});
          });

      const messages = doc.data.documents;
      if (messages) {
        const deletes = messages.map((a) => {
          return {
            delete: `projects/${config.projectId}/databases/(default)/documents/discuss/${req.params
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
    }));

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
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/discuss/${req
              .params.postId}`,
      )
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });

  return res.json({message: "Post deleted"});
};

exports.deleteDiscussionReply = async (req, res) => {
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  const doc = await axios
      .get(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/discuss/${req
              .params.postId}/replies/${req.params.replyId}/replies`,
      )
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });

  const messages = doc.data.documents;
  if (messages) {
    const deletes = messages.map((a) => {
      return {
        delete: `projects/${config.projectId}/databases/(default)/documents/discuss/${req.params
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
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/discuss/${req
              .params.postId}/replies/${req.params.replyId}`,
      )
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });

  return res.json({message: "Reply deleted"});
};

exports.deleteDiscussionReplyReply = async (req, res) => {
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  await axios
      .delete(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/discuss/${req
              .params.postId}/replies/${req.params.replyId}/replies/${req.params.replyId2}`,
      )
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });

  return res.json({message: "Reply Reply deleted"});
};
