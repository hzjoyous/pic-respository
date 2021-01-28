var http = require('http');        // HTTP服务器API
var fs = require('fs');            // 文件系统API

var path = require("path");  
var server = new http.Server();    // 创建新的HTTP服务器
var port = 8080;
server.listen(port);
server.on("request", function (req, res) {

  var url = req.url;
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
  switch (url) {
    case "/upload":
      var chunks = [];
      var size = 0;
      req.on('data', function (chunk) {
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

        console.log(stat)
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
      break;
    default:
      fs.readFile("./index.html", function (err, data) {
        if (err) {
          console.log(err);
          // HTTP 状态码: 404 : NOT FOUND
          // Content Type: text/html
          res.writeHead(404, { 'Content-Type': 'text/html' });
        } else {
          // HTTP 状态码: 200 : OK
          // Content Type: text/html
          res.writeHead(200, { 'Content-Type': 'text/html' });
          // 响应文件内容
          res.write(data.toString());
        }

        res.end();
      })
      break;
  }
});
console.log('Server running at http://127.0.0.1:8080/');
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