const axios = require("axios");
const config = require("../config");

const algoliasearch = require("algoliasearch");

const client = algoliasearch(config.algoliaAppId, config.algoliaApiKey, {protocol: "https:"});
const index = client.initIndex("company");
index.setSettings({
  "customRanking": [
    "asc(name)",
  ],
  "relevancyStrictness": 0,
}).catch((e)=>console.log(e));

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
              offset: req.body.page * req.body.pageSize,
              limit: req.body.pageSize,
            },
          },
      )
      .catch((e) => {
        return res.status(500).json({error: e.response.data.error.message});
      });

  const companies = docs.data.filter((doc) => doc.document).map((doc) => {
    return doc.document.fields;
  });
  return res.status(200).json({companies});
};

exports.searchCompanies = async (req, res) => {
  const data = await index.search(req.body.query, {
    "attributesToRetrieve": [
      "id",
    ],
    "hitsPerPage": 10,
    "page": 0,
    "analytics": false,
    "enableABTest": false,
  }).catch((err) => {
    return res.status(500).json({error: err});
  });

  const companies = await Promise.all(
      data.hits.map(async (a) => {
        const comp = await axios
            .get(
                `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/company/${a.id}`,
            )
            .catch((err) => {
              return res.status(500).json({error: err.response.data.error.message});
            });
        return comp.data.fields;
      }),
  );
  return res.status(200).json({companies});
};

exports.editUserStarredCompanies = async (req, res) => {
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

  const fields = {};
  const mask = ["starredCompanies"];
  if (userData.credentials.starredCompanies.arrayValue.values && userData.credentials.starredCompanies.arrayValue.values
      .map((id) => id.stringValue)
      .includes(req.body.id)) {
    fields["starredCompanies"] = {arrayValue: {values:
      userData.credentials.starredCompanies.arrayValue.values.filter((id) => id.stringValue !== req.body.id),
    }};
  } else {
    fields["starredCompanies"] = {arrayValue: {values:
      [...(userData.credentials.starredCompanies.arrayValue.values ?? []), {stringValue: req.body.id}],
    }};
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
  return res.status(200).json({message: "Details added successfully"});
};
