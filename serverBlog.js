const express = require("express");
const { Sequelize, DataTypes } = require("sequelize");
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
  storage: "database.sqlite",
});

const Post = sequelize.define("Post", {
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tag: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  count: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  abstract: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  file_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

const User = sequelize.define("User", {
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

User.sync();
Post.sync();

//前端路由
app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "./static/index.html"));
});

app.get("/posts/:uuid", async (req, res) => {
  res.sendFile(path.join(__dirname, "./static/post.html"));
});

app.get("/admin/login", async (req, res) => {
  res.sendFile(path.join(__dirname, "./static/login.html"));
});

app.get("/admin/draw", async (req, res) => {
  res.sendFile(path.join(__dirname, "./static/draw.html"));
})

app.get("/admin/update/:uuid", async (req, res) => {
  res.sendFile(path.join(__dirname, "./static/update.html"));
});

app.get("/admin", async (req, res) => {
  res.sendFile(path.join(__dirname, "./static/admin.html"));
});

//保存文章路由


//根据uuid获取对应的内容
app.get("/api/posts/:uuid/content", async (req, res) => {
  const uuid = req.params.uuid;
  try {
    const post = await Post.findOne({ where: { uuid: uuid } });
    const filePath = path.join(__dirname, "./posts/" + post.file_name);
    const content = await fs.readFile(filePath, 'utf8');
    res.send(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).send('Post not found');
    } else {
      res.status(500).send('server error');
    }
  }

});

//注册用户
app.post("/api/register", async (req, res) => {
  try {
    let { username, password, key } = req.body;
    if (key != "5615") {
      return res.status(401).json({ success: false, message: "key error" });
    }
    password = bcrypt.hashSync(password, 10);
    const user = await User.create({ username, password });
    // jwt.sign({ username }, jwtKey, { expiresIn: "7d" }, (err, token) => {
    //   if (err) {
    //     res.status(500).json({ success: false, message: "JWT signing error" });
    //   } else {
    //     res.status(201).json({ username, message: "register success",token});
    //   }
    // });
    res.status(201).json({ username, message: "register success" });
  } catch (error) {
    res.status(500).json({ success: false, message: "server error" });
  }
});

//登录
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { username: username } });
    if (!user) {
      return res.status(404).json({ success: false, message: "user not found" });
    }
    if (await bcrypt.compare(password, user.password)) {
      jwt.sign({ username }, jwtKey, { expiresIn: "7d" }, (err, token) => {
        if (err) {
          res.status(500).json({ success: false, message: "JWT signing error" });
        } else {
          res.json({ username, message: "login success", token });
        }
      });
    } else {
      res.json({ username, message: "login failed" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "server error" });
  }
});

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
    res.json({ success: false, message: "Failed to authenticate token." });
  }
};

//创建文章
app.post("/api/posts/", authenticateToken, async (req, res) => {
  const { title, tag, date, count, abstract, file_name, markdown_source } = req.body;
  try {
    const post = await Post.create({ title, tag, date, count, abstract, file_name });
    const filePath = path.join(__dirname, './posts/', file_name);
    await fs.writeFile(filePath, markdown_source, 'utf8');
    res.status(201).json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

//获取所有文章
app.get("/api/posts/", async (req, res) => {
  try {
    const posts = await Post.findAll();
    res.send(posts);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

//根据id获取具体文章
app.get("/api/posts/:uuid", async (req, res) => {
  const postUUID = req.params.uuid;
  try {
    //查询文章是否存在
    const post = await Post.findOne({ where: { uuid: postUUID } });
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }
    //返回文章
    res.send(post);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 根据id更新文章
app.put("/api/posts/:uuid", authenticateToken, async (req, res) => {
  const postUUID = req.params.uuid;
  const { title, tag, date, count, abstract, file_name, markdown_source } = req.body;
  try {
    // 查询文章
    const post = await Post.findOne({ where: { uuid: postUUID } });
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }
    //获取数据库中存在的文件名
    const oldFileName = post.file_name;
    // 更新文章
    await post.update({ title, tag, date, count, abstract, file_name });
    //如果文件重命名，则修改文件名，并写入新内容
    const oldFilePath = path.join(__dirname, './posts/', oldFileName);
    const newFilePath = path.join(__dirname, './posts/', file_name);
    if (oldFileName !== file_name) {
      await fs.rename(oldFilePath, newFilePath);
    }
    await fs.writeFile(newFilePath, markdown_source, 'utf8');
    // 返回更新后的文章
    res.status(200).json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 根据uuid删除文章
app.delete("/api/posts/:uuid", authenticateToken, async (req, res) => {
  const postUUID = req.params.uuid;
  try {
    const post = await Post.findOne({ where: { uuid: postUUID } });
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }
    
    //删除文件（本质上是移动到deleted文件夹
    try {
      await fs.rename(path.join(__dirname, './posts/', post.file_name), path.join(__dirname, './posts/deleted/', post.uuid+"_"+post.file_name));
    } catch (renameError) {
      console.error('Failed to move file:', renameError);
      return res.status(500).json({ success: false, message: "Failed to move file: " + renameError.message })
    }

    //删除对应数据库数据
    const deletedCount = await Post.destroy({ where: { uuid: postUUID } });
    if (deletedCount > 0) {
      res.status(200).json({ success: true, message: "Post deleted successfully" });
    } else {
      res.status(404).json({ success: false, message: "Failed to delete post from database" });
    }
  } catch (error) {
    console.error('Error deleting post:', error);  
    res.status(500).json({ success: false, message: "An error occurred while deleting the post: " + error.message });
  }
});

app.listen(3002, () => {
  console.log("http://localhost:3002");
});
