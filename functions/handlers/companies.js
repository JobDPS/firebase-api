const axios = require("axios");
const config = require("../config");

exports.createCompany = async (req, res) => {
  axios.defaults.headers.common["Authorization"] = `Bearer ${req.idToken}`;

  const errors = {};
  if (req.body.name.trim() === "") {
    errors.companyName = "Must not be empty";
  }
  if (req.body.domain.trim() === "") {
    errors.companyDomain = "Must not be empty";
  }
  if (!(Object.keys(errors).length === 0)) return res.status(400).json(errors);

  const doc = await axios
      .post(
          `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/company`,
          {
            fields: {
              name: {stringValue: req.body.name},
              domain: {stringValue: req.body.domain},
              founded: {integerValue: req.body.founded},
              industry: {stringValue: req.body.industry},
              country: {stringValue: req.body.country},
              link: {stringValue: req.body.link},
              size: {stringValue: req.body.size},
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
              name: `projects/${config.projectId}/databases/(default)/documents/company/${postId}`,
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

exports.getRangeCompanies = async (req, res) => {
  const docs = await axios
      .get(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/company`)
      .catch((e) => {
        return res.status(500).json({error: e.response.data.error.message});
      });

  let companies = [];
  const posts = docs.data.documents;
  if (posts) {
    const desc = posts.sort((a, b) => {
      return new Date(a.createTime) - new Date(b.createTime);
    });
    companies = await Promise.all(
        desc.map(async (a) => {
          const post = {};
          const postId = a.fields.id.stringValue;
          const data = await axios
              .get(
                  `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/company/${postId}`,
              )
              .catch((e) => {
                return res.status(500).json({error: e.response.data.error.message});
              });
          post.info = data.data.fields;
          return post;
        }),
    );
  }

  companies = companies.slice(req.body.page * 10, (req.body.page + 1) * 10);
  return res.status(200).json({companies});
};
