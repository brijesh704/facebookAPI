const express = require("express");
const router = express.Router();
const {
  createUser,
  loginUser,
  getFriends,
  sendFriendRequest,
  listIncomingFriendRequests,
  responseToFriendRequest,
} = require("../controller/friendController");

// Routes
router.post("/createUser", createUser);
router.post("/loginUser", loginUser);
router.get("/friends/:userId", getFriends);
router.post("/sendFriendRequest", sendFriendRequest);
router.get("/friends-request/:userId", listIncomingFriendRequests);
router.put("/respondToFriendRequest/:userId", responseToFriendRequest);

module.exports = router;
