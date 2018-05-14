const express = require('express');
const request = require('request');
const cheerio = require('cheerio');
const http = require('https');
const url = require('url');
const fs = require('fs');

const app = express();
// 去除空格回车等
function replaceText(text) {
  return text.replace(/\n/g, "").replace(/\s/g, "");
}
// 拼接query信息
function handleQuery(params) {
  let query = '';
  Object.keys(params).forEach((key, index) => {
    query += `${index === 0 ? '?' : '&'}${key}=${params[key]}`;
  });
  return query;
}
// 时间函数
function getDate() {
  const date = new Date();
  const year = date.getFullYear();
  const moth = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minute = date.getMinutes();
  const seconds = date.getSeconds();
  return `${year}${moth}${day}${hours}${minute}${seconds}`;
};
// 百度请求
const queryParams = {
  tn: 'resultjson_com',
  catename: 'pcindexhot',
  ipn: 'rj',
  ct: 201326592,
  is: '',
  fp: 'result',
  queryWord: '',
  cl: 2,
  lm: -1,
  ie: 'utf-8',
  oe: 'utf-8',
  adpicid: '',
  st: -1,
  z: '',
  ic: 0,
  word: 'pcindexhot',
  face: 0,
  istype: 2,
  qc: '',
  nc: 1,
  fr: '',
  pn: 0,
  rn: 30
};

// 渲染图片
const renderImage = (data) => {
  let html = `<h2>共计 : ${data.length - 1}张图片</h2>`;
  data.map((item) => {
    if (item.middleURL) {
      html += `<img style="width: 300px; height: 300px;" src=${item.middleURL} />`;
    }
  });
  let $ = cheerio.load(`<div class="img">${html}<div>`);
  return $('.img').html();
};
app.get('/', function (req, res) {
  const reptileUrl = "https://www.jianshu.com/";
  request(reptileUrl, function (error, response, body) {
    const date = getDate();
    if (!error && response.statusCode == 200) {
      // 等待 code
      let $ = cheerio.load(body);
      /**
       * 存放数据容器
       * @type {Array}
       */
      let data = [];
      $('#list-container .note-list li').each(function (i, elem) {
        let _this = $(elem);
        data.push({
          id: _this.attr('data-note-id'),
          slug: _this.find('.title').attr('href').replace(/\/p\//, ""),
          author: {
            slug: _this.find('.avatar').attr('href').replace(/\/u\//, ""),
            avatar: _this.find('.avatar img').attr('src'),
            nickname: replaceText(_this.find('.blue-link').text()),
            sharedTime: _this.find('.time').attr('data-shared-at')
          },
          title: replaceText(_this.find('.title').text()),
          abstract: replaceText(_this.find('.abstract').text()),
          thumbnails: _this.find('.wrap-img img').attr('src'),
          collection_tag: replaceText(_this.find('.collection-tag').text()),
          reads_count: replaceText(_this.find('.ic-list-read').parent().text()) * 1,
          comments_count: replaceText(_this.find('.ic-list-comments').parent().text()) * 1,
          likes_count: replaceText(_this.find('.ic-list-like').parent().text()) * 1
        });
      });
      console.log('开始获取数据')
      const container = $('#list-container').html();
      res.send(container);
      // 生成数据
      fs.writeFile(__dirname + `/data/article${date}.json`, JSON.stringify({
        status: 0,
        data: data
      }), function (err) {
        if (err) throw err;
      });
      console.log('写入完成');
    }
  });
})
app.get('/image', function (req, res) {
  const query = req.query;
  const params = handleQuery({ ...queryParams, ...query});
  const reptileUrl = `https://image.baidu.com/search/acjson${params}`;
  console.log('reptileUrl---->', reptileUrl);
  http.get(reptileUrl, (resp) => {
    let data = '';  //接口数据
    resp.on('data', (chunk) => {
      data += chunk;    //拼接数据块  
    });
    resp.on('end', function () {
      const date = getDate();
      // 生成数据
      if (data) {
        let json = JSON.parse(data); //解析json
        res.send(renderImage(json.data));
        // 生成数据
        fs.writeFile(__dirname + `/data/image${date}.json`, JSON.stringify({
          status: 0,
          data: json
        }), function (err) {
          if (err) throw err;
        });
        console.log('写入完成');
      } else {
        res.send('数据获取错误: ' + data);
      }
    })
  }).on('error', () =>
    console.log('获取数据出错!')
  );
})
const port = 3333;
const openUrl = `http://localhost:${port}`;
app.listen(port, err => {
  if (err) console.error(`==> 😭  OMG!!! ${err}`);
  console.log(`==> 打开 ${openUrl}, 开始获取检书的数据`);
});