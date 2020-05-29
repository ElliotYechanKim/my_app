const express = require('express')
var template = require('./lib/template.js')
var mysql = require('mysql');
var qs = require('querystring');
var path = require('path');

const app = express()
const port = 3001

app.use(express.urlencoded());
app.use(express.json());

var db = mysql.createConnection({
  host : 'localhost',
  user : 'root',
  password : '111111',
  database : 'opentutorials'
});
db.connect();

app.get('/', function(req, res) {
  const queryData = req.query
  if(queryData.id === undefined){
    db.query(`SELECT * FROM topic`, function(error, topics){
      var title = 'Welcome';
      var description = 'Hello, Node.js';
      var list = template.list(topics);
      var html = template.HTML(title, list, `<h2>${title}</h2>${description}`, `<a href="/create">create</a>`);
      res.writeHead(200);
      res.end(html);
    });
  } else {
    db.query(`SELECT * FROM topic`, function(error, topics){
      if(error){
        throw error;
      }
      db.query(`SELECT * FROM topic LEFT JOIN author ON topic.author_id = author.id WHERE topic.id =?`, [queryData.id], function(error2, topic){
        if(error2){
          throw error2;
        }
        var title = topic[0].title;
        var description = topic[0].description;
        var list = template.list(topics);
        var html = template.HTML(title, list, 
          `<h2>${title}</h2>
          ${description}
          <p>by ${topic[0].name}</p>`, `<a href="/create">create</a>
        <a href="/update?id=${queryData.id}">update</a>
        <form action="delete_process" method="post">
          <input type="hidden" name="id" value =${queryData.id}>
          <input type="submit" value="delete">
        </form>`);
        res.writeHead(200);
        res.end(html);
      })
    });
  }
})

app.get('/create', (req, res) => {
  db.query(`SELECT * FROM topic`, function(error, topics){
    db.query(`SELECT * From author`, function(error2, authors){
      var title = 'Create';
      var list = template.list(topics);
      var html = template.HTML(title, list, `<form action="/create_process" method="post">
      <p><input type="text" name="title" placeholder="title"></p>
      <p>
        <textarea name="description" placeholder="description"></textarea>
      </p>
      <p>
        ${template.authorSelect(authors)}
      </p>
      <p>
        <input type="submit">
      </p>
      </form>`, `<a href="/create">create</a>`);
      res.writeHead(200);
      res.end(html);
    })
  });
})

app.post('/create_process', function(req, res) {
  var body = req.body;
  db.query(`INSERT INTO topic (title, description, created, author_id) VALUES(?, ?, NOW(), ?);`,
    [body.title, body.description, body.author],
    function(error, result){
      if(error){
        throw error;
      }
      res.writeHead(302, {Location: `/?id=${result.insertId}`});
      res.end();
    });
})

app.get('/update', (req, res) => {
  const queryData = req.query
  db.query(`SELECT * FROM topic`, function(error, topics){
    if(error){
      throw error;
    }
    db.query(`SELECT * FROM topic WHERE id =?`, [queryData.id], function(error2, topic){
      if(error2){
        throw error2;
      }
      db.query(`SELECT * From author`, function(error3, authors){
        var list = template.list(topics);
      var html = template.HTML(topic[0].title, list, `<form action="/update_process" method="post">
      <input type="hidden" name="id" value="${topic[0].id}">
    <p><input type="text" name="title" placeholder="title" value="${topic[0].title}"></p>
    <p>
      <textarea name="description" placeholder="description">${topic[0].description}</textarea>
    </p>
    <p>
      ${template.authorSelect(authors, topic[0].author_id)}
    <p>
      <input type="submit">
    </p>
    </form>`, `<a href="/create">create</a> <a href="/update?id=${topic[0].id}">update</a>`)
      res.writeHead(200);
      res.end(html);
      });
    });
  });
})

app.post('/update_process', function(req, res) {
  var body = req.body;
  db.query(`UPDATE topic SET title=?, description=?, author_id=? WHERE id=?`,
    [body.title, body.description, body.author, body.id],
    function(error, result){
      if(error){
        throw error;
      }
      res.writeHead(302, {Location: `/?id=${body.id}`});
      res.end();
    });
})

app.post('/delete_process', (req, res) => {
  var body = req.body;
  db.query(`DELETE FROM topic WHERE id = ?`, [body.id], function(error, result){
      if(error){
        throw error;
      }
      res.writeHead(302, {Location: `/`});
      res.end();
    });
})

app.get('*', (req, res) => {
  res.writeHead(404);
  res.end('Not Found');
})

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
