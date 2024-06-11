const express = require('express')
const { Sequelize, DataTypes } = require('sequelize')
const path = require('path')
const cors = require('cors')
const app = express()

app.use(express.json())
app.use(express.static(path.join(__dirname, 'static')))
app.use(cors())

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite'
})

const Post = sequelize.define('Post', {
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: DataTypes.STRING,
    tag: DataTypes.STRING,
    date: DataTypes.DATEONLY,
    count: DataTypes.NUMBER,
    abstract: DataTypes.STRING
})

Post.sync()

app.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, './static/index.html'))
})

//创建文章
app.post('/api/posts/', async (req, res) => {
    const { uuid, title, tag, date, count, abstract } = req.body

    try {
        const post = await Post.create({ uuid, title, tag, date, count, abstract })
        res.status(201).json({ success: true, data: post })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

//获取所有文章
app.get('/api/posts/', async (req, res) => {
    try {
        const posts = await Post.findAll()
        res.send(posts)
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

//根据id获取具体文章
app.get('/api/posts/:uuid', async (req, res) => {
    const postUUID = req.params.uuid

    try {
        const post = await Post.findOne({ where: { uuid: postUUID } })
        if (post) {
            res.send(post)
        } else {
            res.status(404).json({ success: false, message: 'Post not found' })
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})


// 根据id更新文章
app.put('/api/posts/:uuid', async (req, res) => {
    const postUUID = req.params.uuid;
    const { title, tag, date, count, abstract } = req.body;

    try {
        // 查询文章
        const post = await Post.findOne({ where: { uuid: postUUID } });
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // 更新文章
        await post.update({ title, tag, date, count, abstract });

        // 返回更新后的文章
        res.status(200).json({ success: true, data: post });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 根据id删除文章
app.delete('/api/posts/:uuid', async (req, res) => {
    const postUUID = req.params.uuid;

    try {
        const deletedCount = await Post.destroy({ where: { uuid: postUUID } });

        if (deletedCount > 0) {
            res.status(200).json({ success: true, message: 'Post deleted successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Post not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});



// //根据id更新文章
// app.put('/api/posts/:uuid', async (req, res) => {
//     const postUUID = req.params.uuid
//     const { title, tag, date, count, abstract } = req.body
//     try {
//         const post = await Post.findOne({ where: { uuid: postUUID } })
//         if (post) {
//             Post.update({
//                 title, tag, date, count, abstract
//             }, {
//                 'where': { 'uuid': postUUID }
//             })
//             const updated_post = await Post.findOne({ where: { uuid: postUUID } })
//             res.status(200).json({ success: true, data: updated_post })
//         } else {
//             res.status(404).json({ success: false, message: 'Post not found' })
//         }
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message })
//     }
// })

// //根据id删除文章
// app.delete('/api/posts/:uuid', async (req, res) => {
//     const postUUID = req.params.uuid
//     // const { title, tag, date, count, abstract } = req.body
//     try {
//         const post = await Post.findOne({ where: { uuid: postUUID } })
//         if (post) {
//             Post.destroy({
//                 'where': { 'uuid': postUUID }
//             })
//             const destroyed_post = await Post.findOne({ where: { uuid: postUUID } })
//             res.status(200).json({ success: true, data: destroyed_post })
//         } else {
//             res.status(404).json({ success: false, message: 'Post not found' })
//         }
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message })
//     }
// })

app.listen(3002, () => {
    console.log('http://localhost:3002')
})