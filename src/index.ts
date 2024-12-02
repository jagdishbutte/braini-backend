import express from "express";
import jwt from "jsonwebtoken";
import { contentModel, LinkModel, userModel } from "./db";
import { JWT_PASSWORD } from "./config";
import { userMiddleware } from "./middleware";
import { random } from "./utils";

const app = express();
app.use(express.json());

app.post("/api/v1/signup", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  try {
    await userModel.create({
      username: username,
      password: password,
    });

    res.json({
      message: "Signed up successfully",
    });
  } catch (error) {
    res.status(401).json({
      message: "User already exists",
    });
  }
});

app.post("/api/v1/signin", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  const existingUser = await userModel.findOne({
    username,
    password,
  });

  if (existingUser) {
    const token = jwt.sign(
      {
        id: existingUser._id,
      },
      JWT_PASSWORD
    );

    res.json(token);
  } else {
    res.status(403).json({
      message: "Incorrect Credentials",
    });
  }
});

app.post("/api/v1/content", userMiddleware, async (req, res) => {
  const link = req.body.link;
  const type = req.body.type;

  await contentModel.create({
    link,
    type,
    userId: req.userId,
    tags: [],
  });

  res.json({
    message: "Content created",
  });
});

app.get("/api/v1/content", userMiddleware, async (req, res) => {
  const userId = req.userId;
  const content = await contentModel
    .find({
      userId: userId,
    })
    .populate("userId", "username");

  res.json({
    content,
  });
});

app.delete("/api/v1/content", userMiddleware, async (req, res) => {
  const contentId = req.body.contentId;

  if (!contentId) {
    res.status(400).json({ message: "Content ID is required" });
    return;
  }

  const result = await contentModel.deleteMany({
    _id: contentId,
    userId: req.userId,
  });

  if (result.deletedCount === 0) {
    res.status(404).json({ message: "Content not found or unauthorized" });
  } else {
    res.json({ message: "Deleted" });
  }
});

app.post("/api/v1/share", userMiddleware, async (req, res) => {
  const share = req.body.share;
  if (share) {
    const existingLink = await LinkModel.findOne({
      userId: req.userId,
    });

    if (existingLink) {
      res.json({
        hash: existingLink.hash,
      });
      return;
    }
    const hash = random(10);
    await LinkModel.create({
      userId: req.userId,
      hash: hash,
    });

    res.json({
      hash,
    });
  } else {
    await LinkModel.deleteOne({
      userId: req.userId,
    });

    res.json({
      message: "Removed link",
    });
  }
});

app.get("/api/v1/share/:shareLink", async (req, res) => {
  const hash = req.params.shareLink;

  const link = await LinkModel.findOne({
    hash,
  });

  if (!link) {
    res.status(411).json({
      message: "Sorry incorrect input",
    });
    return;
  }
  // userId
  const content = await contentModel.find({
    userId: link.userId,
  });

  console.log(link);
  const user = await userModel.findOne({
    _id: link.userId,
  });

  if (!user) {
    res.status(411).json({
      message: "user not found, error should ideally not happen",
    });
    return;
  }

  res.json({
    username: user.username,
    content: content,
  });
});

app.listen(3000, () => {
  console.log("App running on port 3000");
});
