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
  getUserDetailsDiscuss,
  getUserDetailsSocial,
  getUserDetailsCompanies,
  getUserDetailsFollowing,
  getUserDetailsFollowers,
  followUser,
  uploadImage,
  // deleteUser,
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

const {
  createSocialPost,
  createSocialReply,
  createSocialReplyReply,
  createSocialReplyReply2,
  getSocialPost,
  deleteSocialReply,
  editSocialPost,
  editSocialReply,
  editSocialReplyReply,
  deleteSocialPost,
  deleteSocialReplyReply,
  getAllSocialPosts,
} = require("./handlers/socialPosts");

const {
  recommendUsers,
  recommendDiscuss,
  recommendCompanies,
  recommendSocial,
} = require("./handlers/recommend");

app.post("/signup", signUp);
app.post("/login", login);
app.get("/user", FBAuth, getAuthenticatedUser);
app.post("/user", FBAuth, addUserDetails);

app.get("/user/:userId", getUserDetails);
app.get("/user/:userId/discuss", getUserDetailsDiscuss);
app.get("/user/:userId/social", getUserDetailsSocial);
app.get("/user/:userId/companies", getUserDetailsCompanies);
app.get("/user/:userId/following", getUserDetailsFollowing);
app.get("/user/:userId/followers", getUserDetailsFollowers);
app.post("/user/:userId/follow", FBAuth, followUser);

// app.delete('/user', FBAuth, deleteUser);
app.post("/user/image", FBAuth, uploadImage);

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

app.post("/social", FBAuth, createSocialPost);
app.post("/social/:postId", FBAuth, createSocialReply);
app.post("/social/:postId/replies/:replyId", FBAuth, createSocialReplyReply);
app.post("/social/:postId/replies/:replyId/replies/:replyId2", FBAuth, createSocialReplyReply2);

app.get("/social", FBAuth, getAllSocialPosts);
app.get("/social/:postId", getSocialPost);

app.patch("/social/:postId", FBAuth, editSocialPost);
app.patch("/social/:postId/replies/:replyId", FBAuth, editSocialReply);
app.patch("/social/:postId/replies/:replyId/replies/:replyId2", FBAuth, editSocialReplyReply);

app.delete("/social/:postId", FBAuth, deleteSocialPost);
app.delete("/social/:postId/replies/:replyId", FBAuth, deleteSocialReply);
app.delete("/social/:postId/replies/:replyId/replies/:replyId2", FBAuth, deleteSocialReplyReply);

app.get("/recommend/user", FBAuth, recommendUsers);
app.get("/recommend/discuss", FBAuth, recommendDiscuss);
app.get("/recommend/social", FBAuth, recommendSocial);
app.get("/recommend/company", FBAuth, recommendCompanies);

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
