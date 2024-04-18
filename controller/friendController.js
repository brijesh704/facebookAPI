const { connections } = require("mongoose");
const User = require("../module/user");
const userValidationSchema = require("../helper/validation_schema");
const bcrypt = require("bcrypt");

exports.createUser = async (req, res, next) => {
  try {
    const { error } = userValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const newUser = await User.create(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
};

exports.loginUser = async (req, res, next) => {
  try {
    const { usernameOrEmail, password } = req.body;

    const user = await User.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({ message: "Login successful" });
  } catch (error) {
    next(error);
  }
};

exports.getFriends = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    // console.log(userId, "useeesesese");

    const user = await User.findById(userId).populate("friends");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const friends = user.friends;

    res.json({ friends });
  } catch (error) {
    next(error);
  }
};

exports.sendFriendRequest = async (req, res, next) => {
  try {
    const { senderId, receiverId } = req.body;

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      return res.status(404).json({ error: "User not found" });
    }

    if (
      sender.friends.includes(receiverId) ||
      receiver.friends.includes(senderId)
    ) {
      return res.status(400).json({ error: "Users are already friends" });
    }

    if (receiver.blockedUsers.includes(senderId)) {
      return res.status(400).json({ error: "Receiver has blocked the sender" });
    }

    const friendRequest = {
      fromUser: senderId,
      toUser: receiverId,
      status: "pending",
    };

    await User.findByIdAndUpdate(senderId, {
      $push: { friendRequests: friendRequest },
    });

    await User.findByIdAndUpdate(receiverId, {
      $push: { friendRequests: friendRequest },
    });

    res.status(200).json({ message: "Friend request sent successfully" });
  } catch (error) {
    next(error);
  }
};

exports.listIncomingFriendRequests = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const user = await User.findById(userId).populate({
      path: "friendRequests",
      options: {
        sort: { createdAt: -1 },
        skip: (page - 1) * limit,
        limit: limit,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const friendRequests = user.friendRequests;
    res.json({ friendRequests });
  } catch (error) {
    next(error);
  }
};

exports.responseToFriendRequest = async (req, res, next) => {
  try {
    const { requestId, action } = req.body;
    const userId = req.params.userId;
    console.log(requestId, "req idddddd");

    const user = await User.findById(userId);
    console.log(user, "userrrrrr");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the friend request
    const friendRequest = user.friendRequests.find(
      (request) => request._id.toString() === requestId
    );

    if (!friendRequest) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    let sender;
    switch (action) {
      case "accept":
        friendRequest.status = "accepted";

        user.friends.push(friendRequest.fromUser);
        sender = await User.findById(friendRequest.fromUser);
        sender.friends.push(userId);

        await sender.save();

        // Remove friend request
        user.friendRequests = user.friendRequests.filter(
          (request) => request.fromUser.toString() !== sender._id.toString()
        );
        sender.friendRequests = sender.friendRequests.filter(
          (request) => request.toUser.toString() !== userId
        );

        await Promise.all([user.save(), sender.save()]);
        return res.json({ message: "Friend request accepted" });

      case "reject":
        // Update status to rejected
        friendRequest.status = "rejected";

        sender = await User.findById(friendRequest.fromUser);
        if (!sender) {
          return res.status(404).json({ error: "Sender not found" });
        }

        // Remove friend request
        user.friendRequests = user.friendRequests.filter(
          (request) => request.fromUser.toString() !== sender._id.toString()
        );
        sender.friendRequests = sender.friendRequests.filter(
          (request) => request.toUser.toString() !== userId
        );

        await Promise.all([user.save(), sender.save()]);

        return res.json({ message: "Friend request rejected" });

      case "block":
        // Push sender's ID to blockedUsers array of the receiver
        sender = await User.findById(friendRequest.fromUser);
        if (!sender) {
          return res.status(404).json({ error: "Sender not found" });
        }

        user.blockedUsers.push(friendRequest.fromUser);
        await user.save();

        // Remove friend request
        user.friendRequests = user.friendRequests.filter(
          (request) => request.fromUser.toString() !== sender._id.toString()
        );
        sender.friendRequests = sender.friendRequests.filter(
          (request) => request.toUser.toString() !== userId
        );
        await Promise.all([user.save(), sender.save()]);
        return res.json({ message: "User blocked" });

      default:
        return res.status(400).json({ error: "Invalid action" });
    }
  } catch (error) {
    next(error);
  }
};
