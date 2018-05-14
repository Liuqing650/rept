const express = require('express');
const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');

const app = express();
const reptileUrl = "https://www.jianshu.com/";
// 去除空格回车等
function replaceText(text) {
  return text.replace(/\n/g, "").replace(/\s/g, "");
}
app.get('/', function (req, res) {
  request(reptileUrl, function (error, response, body) {
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
      fs.writeFile(__dirname + '/data/article.json', JSON.stringify({
        status: 0,
        data: data
      }), function (err) {
        if (err) throw err;
      });
      console.log('写入完成');
    }
  });
})
const port = 3333;
const openUrl = `http://localhost:${port}`;
app.listen(port, err => {
  if (err) console.error(`==> 😭  OMG!!! ${err}`);
  console.log(`==> 打开 ${openUrl}, 开始获取检书的数据`);
});