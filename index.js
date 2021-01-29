const express = require('express')
const fs = require('fs');
var path = require("path");
var join = path.join;
var multer = require('multer')
const moment = require('moment');
const fse = require('fs-extra')
var exec = require('child_process').exec;

function execute(cmd) {
    exec(cmd, function (error, _stdout, _stderr) {
        if (error) {
            console.error(error);
        }
        else {
            console.log(_stdout);
        }
    });
}

const app = express()
app.use(express.static('static'))
app.use('/image', express.static('image'))

app.get('/api/imagelist', function (req, res) {
    var imageList = getJsonFiles("image")
    imageList.sort(function (item1, item2) {
        let time1 = path.basename(item1).split(".")[0];
        let time2 = path.basename(item2).split(".")[0];
        return time1 < time2 ? 1 : -1;
    });
    res.send(imageList)
})

// var upload = multer({ dest: 'tmp/' })
var storage = multer.diskStorage({
    //设置上传后文件路径，uploads文件夹会自动创建。
    destination: './image/' + moment().format('YYYYMM'),
    //给上传文件重命名，获取添加后缀名
    filename: function (req, file, cb) {
        var extname = path.extname(file.originalname)
        var dir = './image/' + moment().format('YYYYMM')
        var desiredMode = 0o2775
        fse.ensureDir(dir, err => {
            console.log(err) // => null
            // dir has now been created, including the directory it is to be placed in
        })
        fse.ensureDir(dir, desiredMode)
            .then(() => {
                console.log('success!')
            })
            .catch(err => {
                console.error(err)
            })

        fse.writeJson('./image/' + moment().format('YYYYMM') + "/" + (new Date().getTime()) + ".json",
            {
                createAt: new Date().getTime()
            }
        ).then(() => {
            console.log('success!')
        }).catch(err => {
            console.error(err)
        })

        cb(null, (new Date().getTime()) + extname);
    }
});
//添加配置文件到muler对象。
var upload = multer({
    storage: storage,
    limits: {
        //在这里设置最多能上传多少个文件，那么就不用在下面upload.array('field1', 5)设置了
        files: 1000, //一次只允许上传一个文件
    }
});

app.post('/api/upload', upload.any(), async (req, res) => {

    files = req.files.map(function (item) {
        return item.path;
    })
    res.send(files);
});

// app.get("/api/push-rep",function(rep,res){
//     execute(`git add . && git commit -m "update all" && git push`)
// })

app.listen(3000)


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
