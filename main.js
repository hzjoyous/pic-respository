var http = require('http');        // HTTP服务器API
var fs = require('fs');            // 文件系统API
var url = require("url");

var path = require("path");
var join = path.join;

var server = new http.Server();    // 创建新的HTTP服务器
var MIME_TYPE = {
  "css": "text/css",
  "gif": "image/gif",
  "html": "text/html",
  "ico": "image/x-icon",
  "jpeg": "image/jpeg",
  "jpg": "image/jpeg",
  "js": "text/javascript",
  "json": "application/json",
  "pdf": "application/pdf",
  "png": "image/png",
  "svg": "image/svg+xml",
  "swf": "application/x-shockwave-flash",
  "tiff": "image/tiff",
  "txt": "text/plain",
  "wav": "audio/x-wav",
  "wma": "audio/x-ms-wma",
  "wmv": "video/x-ms-wmv",
  "xml": "text/xml"
};
Date.prototype.format = function (fmt) {
  var o = {
    "M+": this.getMonth() + 1,                 //月份 
    "d+": this.getDate(),                    //日 
    "h+": this.getHours(),                   //小时 
    "m+": this.getMinutes(),                 //分 
    "s+": this.getSeconds(),                 //秒 
    "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
    "S": this.getMilliseconds()             //毫秒 
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  }
  for (var k in o) {
    if (new RegExp("(" + k + ")").test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    }
  }
  return fmt;
}


function mkdirsSync(dirname) {
  if (fs.existsSync(dirname)) {
    return true;
  } else {
    if (mkdirsSync(path.dirname(dirname))) {
      fs.mkdirSync(dirname);
      return true;
    }
  }
}

var port = 8080;
server.listen(port);
server.on("request", function (req, res) {
  var url = req.url;
  switch (url) {
    case "/upload":
      upload(req, res);
      break;
    case "/uploadShow":
      uploadShow(req, res)
      break;

    case "/upload2":
      upload2(req, res)
      break;

    case "/imagelist":
      res.writeHead(200, { 'Content-Type': 'application/json' });

      var imageList = getJsonFiles("image");
      var imageListJson = JSON.stringify(imageList);
      // 响应文件内容
      // res.write(imageListJson);
      res.end(imageListJson);
      break;
    default:
      showIndex(req, res);
      break;
  }
});
console.log('Server running at http://127.0.0.1:8080/');


function uploadShow(req, res) {
  var chunks = [];
  var size = 0;
  req.on('data', function (chunk) {
    chunks.push(chunk);
    size += chunk.length;
  })
  req.on("end", function () {
    var buffer = Buffer.concat(chunks, size);
    console.log(buffer.toString())

    var rems = [];

    //根据\r\n分离数据和报头
    for (var i = 0; i < buffer.length; i++) {
      var v = buffer[i];
      var v2 = buffer[i + 1];
      if (v == 13 && v2 == 10) {
        rems.push(i);
      }
    }

    //图片信息
    var picmsg_1 = buffer.slice(rems[0] + 2, rems[1]).toString();
    console.log(picmsg_1);
    var filename = picmsg_1.match(/filename=".*"/g)[0].split('"')[1];
    console.log(filename)
    var dirPath = './image/' + (new Date().format("yyyyMMdd"));
    var haveDir = false
    try {
      var stat = fs.statSync(dirPath);
      haveDir = stat.isDirectory();
    } catch (error) {
      console.log("组目录不存在，准备创建");
    }

    if (!haveDir) {
      mkdirsSync(dirPath);
      console.log("组目录创建成功");
    }

    // console.log(stat)
    var index = filename.lastIndexOf(".");
    //获取后缀
    var ext = filename.substr(index + 1);

    var filePath = dirPath + "/" + (new Date().getTime()) + "." + ext;
    //图片数据
    var nbuf = buffer.slice(rems[3] + 2, rems[rems.length - 2]);

    var imageObj = {
      createAt: new Date().getTime(),
      fileName: filename
    };

    var imageObjStr = JSON.stringify(imageObj)
    var imageObjStrFilePath = dirPath + "/" + (new Date().getTime()) + ".json";

    fs.writeFileSync(filePath, nbuf);
    fs.writeFileSync(imageObjStrFilePath, imageObjStr);
    console.log("保存" + filename + "成功");

    res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
    res.end('<div id="path">' + filePath + '</div>');
  })
}
function upload2(req, res) {
  var chunks = [];
  var size = 0;
  req.on('data', function (chunk) {
    console.log(chunk)
    chunks.push(chunk);
    size += chunk.length;
  });
  req.on("end", function () {
    var buffer = Buffer.concat(chunks, size);
    console.log(buffer)
    res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
    res.end('<div id="path">a</div>');
  })
}

function upload(req, res) {
  var chunks = [];
  var size = 0;
  req.on('data', function (chunk) {
    console.log(chunk)
    chunks.push(chunk);
    size += chunk.length;
  });

  req.on("end", function () {
    var buffer = Buffer.concat(chunks, size);
    if (!size) {
      res.writeHead(404);
      res.end('');
      return;
    }

    var rems = [];

    //根据\r\n分离数据和报头
    for (var i = 0; i < buffer.length; i++) {
      var v = buffer[i];
      var v2 = buffer[i + 1];
      if (v == 13 && v2 == 10) {
        rems.push(i);
      }
    }

    //图片信息
    var picmsg_1 = buffer.slice(rems[0] + 2, rems[1]).toString();
    console.log(picmsg_1);
    var filename = picmsg_1.match(/filename=".*"/g)[0].split('"')[1];

    var dirPath = './image/' + (new Date().format("yyyyMMdd"));

    var haveDir = false
    try {
      var stat = fs.statSync(dirPath);
      haveDir = stat.isDirectory();
    } catch (error) {
      console.log("组目录不存在，准备创建");
    }

    if (!haveDir) {
      mkdirsSync(dirPath);
      console.log("组目录创建成功");
    }

    // console.log(stat)
    var index = filename.lastIndexOf(".");
    //获取后缀
    var ext = filename.substr(index + 1);

    var filePath = dirPath + "/" + (new Date().getTime()) + "." + ext;
    //图片数据
    var nbuf = buffer.slice(rems[3] + 2, rems[rems.length - 2]);

    var imageObj = {
      createAt: new Date().getTime(),
      fileName: filename
    };

    var imageObjStr = JSON.stringify(imageObj)
    var imageObjStrFilePath = dirPath + "/" + (new Date().getTime()) + ".json";

    fs.writeFileSync(filePath, nbuf);
    fs.writeFileSync(imageObjStrFilePath, imageObjStr);
    console.log("保存" + filename + "成功");

    res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
    res.end('<div id="path">' + filePath + '</div>');
  });
}

function showIndex(req, res) {

  req.setEncoding("utf8");

  var pathname = url.parse(req.url).pathname;
  var ext = path.extname(pathname)
  ext = ext ? ext.slice(1) : 'unknown';
  var contentType = MIME_TYPE[ext] || "text/html";
  var isStaticFile = false
  try {
    if (req.url !== "/") {
      fs.statSync("." + req.url);
      isStaticFile = true
    }
  } catch (err) {
    isStaticFile = false
  }
  var waitReadFile = './index.html';
  if (isStaticFile) {
    var waitReadFile = "." + req.url;
  }

  fs.readFile(waitReadFile, "binary", function (err, data) {
    if (err) {

      res.writeHead(404, { 'Content-Type': 'text/html' });
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.write(data.toString(), "binary");
    }
    res.end();
  })
}

function getJsonFiles(jsonPath) {
  let jsonFiles = [];
  function findJsonFile(path) {
    let files = fs.readdirSync(path);
    files.forEach(function (item, index) {
      let fPath = join(path, item);
      let stat = fs.statSync(fPath);
      if (stat.isDirectory() === true) {
        findJsonFile(fPath);
      }
      if (stat.isFile() === true) {
        var filename = fPath
        var index = filename.lastIndexOf(".");
        //获取后缀
        var ext = filename.substr(index + 1);
        if (ext !== "json") {
          jsonFiles.push(fPath);
        }
      }
    });
  }
  findJsonFile(jsonPath);
  return jsonFiles
}
