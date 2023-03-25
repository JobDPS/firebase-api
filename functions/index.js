const functions = require("firebase-functions");
const app = require("express")();
const cors = require("cors");
app.use(cors());
const FBAuth = require("./utils/fbAuth");

// const admin = require("firebase-admin");
// const algoliasearch = require("algoliasearch");
// const config = require("./config");
// admin.initializeApp(functions.config().firebase);

const {
  signUp,
  login,
  addUserDetails,
  getAuthenticatedUser,
  getUserDetails,
  // deleteUser,
  // uploadImage
} = require("./handlers/users");

const {
  createDiscussionPost,
  createDiscussionReply,
  createDiscussionReplyReply,
  createDiscussionReplyReply2,
  getDiscussionPost,
  deleteDiscussionReply,
  editDiscussionPost,
  editDiscussionReply,
  editDiscussionReplyReply,
  deleteDiscussionPost,
  deleteDiscussionReplyReply,
  getAllDiscussionPosts,
} = require("./handlers/discussionPosts");

const {
  createRelation,
  getRelations,
  getRelation,
  editRelation,
  editRelationDate,
  deleteRelation,
} = require("./handlers/relations");

const {
  createCompany,
  getRangeCompanies,
  editUserStarredCompanies,
  searchCompanies,
} = require("./handlers/companies");

app.post("/signup", signUp);
app.post("/login", login);
app.get("/user", FBAuth, getAuthenticatedUser);
app.post("/user", FBAuth, addUserDetails);
app.get("/user/:handle", FBAuth, getUserDetails); // TODO: Remove FBAuth?
// app.delete('/user', FBAuth, deleteUser);
// app.post('/user/image', FBAuth, uploadImage);

app.post("/discuss", FBAuth, createDiscussionPost);
app.post("/discuss/:postId", FBAuth, createDiscussionReply);
app.post("/discuss/:postId/replies/:replyId", FBAuth, createDiscussionReplyReply);
app.post("/discuss/:postId/replies/:replyId/replies/:replyId2", FBAuth, createDiscussionReplyReply2);

app.get("/discuss", getAllDiscussionPosts);
app.get("/discuss/:postId", getDiscussionPost);

app.patch("/discuss/:postId", FBAuth, editDiscussionPost);
app.patch("/discuss/:postId/replies/:replyId", FBAuth, editDiscussionReply);
app.patch("/discuss/:postId/replies/:replyId/replies/:replyId2", FBAuth, editDiscussionReplyReply);

app.delete("/discuss/:postId", FBAuth, deleteDiscussionPost);
app.delete("/discuss/:postId/replies/:replyId", FBAuth, deleteDiscussionReply);
app.delete("/discuss/:postId/replies/:replyId/replies/:replyId2", FBAuth, deleteDiscussionReplyReply);

app.get("/relation", FBAuth, getRelations);
app.get("/relation/:relationId", FBAuth, getRelation);
app.post("/relation", FBAuth, createRelation);
app.patch("/relation/:relationId", FBAuth, editRelation);
app.patch("/relation/:relationId/date", FBAuth, editRelationDate);
app.delete("/relation/:relationId", FBAuth, deleteRelation);

app.post("/company", getRangeCompanies);
app.post("/company/new", FBAuth, createCompany);
app.post("/company/star", FBAuth, editUserStarredCompanies);
app.post("/company/search", searchCompanies);

exports.api = functions.region("us-central1").https.onRequest(app);

// const client = algoliasearch(config.algoliaAppId, config.algoliaApiKey);
// const index = client.initIndex("company");

// exports.addData = functions.region("us-central1").https.onRequest((req, res) => {
//   admin.firestore().collection("company").get().then((docs) => {
//     const companies = [];
//     docs.forEach((doc) => {
//       const comp = doc.data();
//       comp.objectID = doc.id;
//       companies.push(comp);
//     });

//     index.saveObjects(companies, (err, content) => {
//       res.status(200).send(content);
//     });
//   });
// });
