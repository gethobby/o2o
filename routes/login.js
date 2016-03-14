var express = require('express');
var router = express.Router();
var fs = require('fs');
    
/* GET home page. */
router.get('/', function(req, res,next) {
  res.render('login.html', { title: 'Login' });
});
router.post('/', function(req, res,next) {
        //事先预加载注册用户       
        var data = fs.readFileSync("users.json","utf-8");
        var users = JSON.parse(data);
        console.log('用户登录中，判断用户类型，跳转相应页面~');
        var name = req.body.name ;
        var user = users[name];
        if(user && user.pwd_s == req.body.pwd && "1" == req.body.role){
            // 设置商家cookie
            res.cookie('name_s',name);
            res.cookie('role',req.body.role);
            res.cookie('service',user.service);
            res.redirect('/shops'); // 转到商家页面
        }else if(user && user.pwd_u == req.body.pwd && "2" == req.body.role){
            // 设置消费者cookie
            res.cookie('name_u',name);
            res.cookie('role',req.body.role);
            res.cookie('tel',user.tel);
            console.log(user.tel);
            res.redirect('/list'); //转到消费者页面
        }
        else{
            res.sendStatus(404);
        }
});
module.exports = router;
