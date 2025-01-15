// Create web server
var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');

var comments = [];

var server = http.createServer(function(req, res) {
  var urlParsed = url.parse(req.url);

  console.log(urlParsed);

  if (urlParsed.pathname == '/echo' && urlParsed.query) {
    var params = qs.parse(urlParsed.query);

    console.log(params);

    res.end(params.message);
  } else {
    console.log('urlParsed.pathname: ' + urlParsed.pathname);

    switch (urlParsed.pathname) {
      case '/':
        sendFile("index.html", res);
        break;

      case '/comments':
        if (req.method == 'POST') {
          servComments(req, res);
        } else {
          sendFile("comments.json", res);
        }
        break;

      default:
        res.statusCode = 404;
        res.end('Not found');
    }
  }
});

function servComments(req, res) {
  var body = '';

  req.on('readable', function() {
    body += req.read();

    if (body.length > 1e4) {
      res.statusCode = 413;
      res.end('Your message is too big for me');
    }
  });

  req.on('end', function() {
    try {
      body = JSON.parse(body);
    } catch(e) {
      res.statusCode = 400;
      res.end('Bad Request');
      return;
    }

    comments.push(body.message);

    var commentsToWrite = JSON.stringify(comments);

    fs.writeFile('comments.json', commentsToWrite, function(err) {
      if (err) {
        console.error(err);
        res.statusCode = 500;
        res.end('Internal Server Error');
        return;
      }

      res.end('OK');
    });
  });
}

function sendFile(fileName, res) {
  var fileStream = fs.createReadStream(fileName);

  fileStream
    .on('error', function() {
      res.statusCode = 500;
      res.end('Server Error');
    })
    .pipe(res);
}

server.listen(1337, '