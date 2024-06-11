const express = require("express");
const { Sequelize, DataTypes, Op } = require("sequelize");
const bcrypt = require("@node-rs/bcrypt");
const path = require("path");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
const fs = require("fs").promises
const jwtKey = "ILOVEYOU";

app.use(express.json());
app.use(express.static(path.join(__dirname, "static")));
app.use(cors());

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "databaseQQZone.sqlite",
});

const Post = sequelize.define("Post", {
  post_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  account: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  created_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  comment: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  like: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  share: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

const Comment = sequelize.define("Comment", {
  comment_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  post_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  account: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  created_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  comment: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  like: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  share: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

const User = sequelize.define("User", {
  user_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  account: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

const Like = sequelize.define("Like", {
  like_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  post_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  account: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

User.sync();
Post.sync();
Comment.sync();
Like.sync();


//验证中间件？
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);
  try {
    await jwt.verify(token, jwtKey);
    // const decoded = await jwt.verify(token, jwtKey); //验证token的有效性，返回一个对象
    // req.user = decoded; // 可以将解码后的用户信息附加到req上，之后可直接通过req获取信息，如用户名
    next();
  } catch (err) {
    res.json({ message: "Failed to authenticate token." });
  }
};

app.post('/api/register', async (req, res) => {
  try {
    const { username, account, password } = req.body;
    const user = await User.create({ username, account, password });
    jwt.sign({ account }, jwtKey, { expiresIn: "7d" }, (err, token) => {
      if (err) {
        res.status(200).json({ code: "0", message: "JWT signing error" });
      } else {
        res.status(200).json({ code: "1", account, token, username });
      }
    });
  } catch (error) {
    res.status(200).json({ code: "0" });
  }
})

app.post('/api/post', authenticateToken, async (req, res) => {
  try {
    const { account, content, created_date, username } = req.body;
    const post = await Post.create({ account, username, content, created_date });
    if (post) {
      res.status(200).json({ code: "1" })
    } else {
      res.status(200).json({ code: "0" })
    }
  } catch (error) {
    res.status(500).json({ code: "0" })
  }
})

app.post('/api/comment', authenticateToken, async (req, res) => {
  try {
    const { account, content, created_date, post_id, username } = req.body;
    // req.header
    const comment_item = await Comment.create({ account, username, content, created_date, post_id });
    const post_item = await Post.increment('comment', { where: { post_id: post_id } });
    if (comment_item && post_item) {
      res.status(200).json({ code: "1" })
    } else {
      res.status(200).json({ code: "0" })
    }
  } catch (error) {
    res.status(500).json({ code: "0" })
  }
})

app.get('/api/comments/:uuid', authenticateToken, async (req, res) => {
  const uuid = req.params.uuid;
  // req.header
  const comments = await Comment.findAll({
    order: [
      ['created_date', 'DESC']
    ], where: { post_id: uuid }
  });
  if (comments) {
    res.status(200).send(comments)
    // res.status(200).json({ code: "1" })
  }
})

app.get("/api/posts/:account", async (req, res) => {
  try {
    const account = req.params.account;
    const posts = await Post.findAll({ where: { account: account } });
    res.send(posts);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/posts/", async (req, res) => {
  try {
    const posts = await Post.findAll({
      order: [
        ['created_date', 'DESC']
      ]
    });
    res.send(posts);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete("/api/post/:id", async (req, res) => {
  try {
    const post_id = req.params.id
    const delete_post = await Post.destroy({ where: { post_id: post_id } })
    const delete_like = await Like.destroy({ where: { post_id: post_id } })
    const delete_comment = await Comment.destroy({ where: { post_id: post_id } })
    if (delete_post) {
      res.status(200).json({ code: "1" })
    } else {
      res.status(200).json({ code: "0" })
    }
  } catch (error) {
    res.status(500).json({ code: "0" })
  }
});

app.put("/api/post/:id", async (req, res) => {
  try {
    const post_id = req.params.id
    const content = req.body.content
    const update_post = await Post.update({ "content": content }, { where: { post_id: post_id } })
    if (update_post) {
      res.status(200).json({ code: "1" })
    } else {
      res.status(200).json({ code: "0" })
    }
  } catch (error) {
    res.status(500).json({ code: "0" })
  }
});

app.get("/api/search/:content", async (req, res) => {
  try {
    const content = req.params.content
    // 使用%作为通配符，%content%会匹配任何包含content的数据  
    const posts = await Post.findAll({
      where: {
        content: {
          [Op.like]: `%${content}%`
        }
      }
    })
    res.send(posts)
  } catch (error) {
    res.status(500).json({ code: "0" })
  }
});

app.post("/api/post/addshare/:id", async (req, res) => {
  try {
    const post_id = req.params.id
    const addshare_item = await Post.increment('share', { where: { post_id: post_id } })
    if (addshare_item) {
      res.status(200).json({ code: "1" })
    } else {
      res.status(200).json({ code: "0" })
    }
  } catch (error) {
    res.status(500).json({ code: "0" })
  }
});

app.post("/api/post/addlike/:id", async (req, res) => {
  try {
    const post_id = req.params.id
    const { account } = req.body
    const like_item = await Like.findOne({ where: { post_id: post_id, account: account } })
    if (like_item) {
      res.status(200).json({ code: "0" })
    } else {
      await Like.create({ post_id, account })
      await Post.increment('like', { where: { post_id: post_id } })
      res.status(200).json({ code: "1" })
    }
  } catch (error) {
    res.status(500).json({ code: "0" })
  }
})

app.post("/api/post/removelike/:id", async (req, res) => {
  try {
    const post_id = req.params.id
    const { account } = req.body
    await Like.destroy({ where: { post_id: post_id, account: account } })
    await Post.decrement('like', { where: { post_id: post_id } })
    res.status(200).json({ code: "1" })
  } catch (error) {
    res.status(500).json({ code: "0" })
  }
})

app.get("/api/post/:post_id", async (req, res) => {
  const post_id = req.params.post_id;
  try {
    const post = await Post.findOne({ where: { post_id: post_id } });
    res.send(post);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/like/:account", async (req, res) => {
  try {
    const account = req.params.account;
    const likes = await Like.findAll({ attributes: ['post_id'], where: { account: account }, raw: true });
    const postIds = likes.map(like => like.post_id);
    console.log(postIds)
    const post_list = await Promise.all(postIds.map(postId => Post.findOne({ where: { post_id: postId } })))
    const like_list = []
    res.send(post_list);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { account, password } = req.body;
    const user = await User.findOne({ where: { account: account } });
    const username = user.username;
    if (user && user.password === password) {
      jwt.sign({ account }, jwtKey, { expiresIn: "7d" }, (err, token) => {
        if (err) {
          res.status(200).json({ code: '0', message: "JWT signing error" });
        } else {
          res.status(200).json({ code: '1', username, account, token });
        }
      });
    } else {
      res.status(200).json({ code: '0' })
    }
  } catch (error) {
    res.status(200).json({ code: '0' });
  }
})


app.listen(3002, () => {
  console.log("http://localhost:3002");
});
