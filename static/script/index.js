function template(post_title, post_abstract ,post_tag, post_date, post_count) {
    let template = `
        <p class="title">${post_title}</p>
        <p class="abstract">${post_abstract}</p>
        <div class="meta">
            <p class="tag">${post_tag}</p>
            <div class="right">
                <p class="date">${post_date}</p>
                <p class="count">${post_count}</p>
            </div>
        </div>
    `
    return template
}

const posts_div = document.createElement('div')
posts_div.setAttribute('id', 'posts')

async function getPosts() {
    const res = await fetch('./api/posts/')
    const posts = await res.json()
    posts.forEach(post => {
        // 对文章元素命名
        const title = post.title
        const tag = post.tag
        const date = post.date
        const count = post.count
        const abstract = post.abstract
        const uuid = post.uuid

        let post_a = document.createElement('a')
        let post_div = document.createElement('div')

        post_div.setAttribute('class', 'post')
        post_div.innerHTML = template(title, abstract ,tag, date, count)

        post_a.setAttribute('href','posts/'+uuid)
        post_a.appendChild(post_div)

        posts_div.appendChild(post_a)
        document.body.appendChild(posts_div)
    });
}
getPosts()