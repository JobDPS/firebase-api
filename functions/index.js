const functions = require("firebase-functions");
const app = require("express")();
const cors = require("cors");
app.use(cors());
const FBAuth = require("./utils/fbAuth");

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
  editRelation,
  deleteRelation,
} = require("./handlers/relations");

app.post("/signup", signUp);
app.post("/login", login);
app.get("/user", FBAuth, getAuthenticatedUser);
app.post("/user", FBAuth, addUserDetails);
app.get("/user/:handle", FBAuth, getUserDetails);
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
app.post("/relation", FBAuth, createRelation);
app.patch("/relation/:relationId", FBAuth, editRelation);
app.delete("/relation/:relationId", FBAuth, deleteRelation);

exports.api = functions.region("us-central1").https.onRequest(app);
