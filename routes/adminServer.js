var express = require('express');
var router = express.Router();
router.caseSensitive = true;
var url = require('url');
//站点配置
var settings = require("../settings");
//数据校验
var validator = require('validator');
//对象管理
var adminBean = require('./adminBean');
//数据操作
var DBOpt = require('../models/DBOpt');
//后台管理用户
var AdminUser = require('../models/AdminUser');

/*跳转到到登录页面*/
router.get("/login", function(req, res, net){
	res.render('admin/login');
});
//管理主界面
router.get('/manage', function(req, res) {
    res.render('admin/homePage', setPageInfo(req,res,settings.SYSTEMMANAGE));
});
//人员管理界面
router.get('/manage/userMge', function(req, res) {
    res.render('admin/userMge', setPageInfo(req,res,settings.adminUsersList));
});

/*处理登录请求*/
router.post('/doLogin', function(req, res){
	var userName = req.body.userName;
	var password = req.body.password;
	if(true){
		if(validator.isUserName(userName) && validator.isPsd(password)){
            //验证用户名密码
            AdminUser.findOne({'userName': userName, 'password': password}).exec(function(err, user){
                if(err){
                    res.end(err);
                }
                if(user){
                    req.session.adminlogined = true;
                    req.session.adminUserInfo = user;
                    res.end("success");
                }else{
                    console.log("登录失败");
                    res.end("用户名或密码错误"); 
                }
            });
		}
	}else{
		console.log("登录失败");
		res.end("用户名或密码错误");
	}
});

// 管理员退出
router.get('/logout', function(req, res) {
    req.session.adminlogined = false;
    req.session.adminPower = '';
    req.session.adminUserInfo = '';
    res.redirect("/admin");
});

//-------------------------对象列表查询开始(带分页)-------------------------------

router.get('/manage/getDocumentList/:defaultUrl',function(req,res){
    var targetObj = adminBean.getTargetObj(req.params.defaultUrl);
    var params = url.parse(req.url,true);
    var keywords = params.query.searchKey;
    var area = params.query.area;
    var keyPr = [];
    keyPr = adminBean.setQueryByArea(req,keyPr,targetObj,area);
    DBOpt.pagination(targetObj,req, res,keyPr);

});


//-------------------------对象列表查询结束(带分页)-------------------------------



function setPageInfo(req,res,module){

    var searchKey = '';
    //area是为了独立查询一个表其中的部分数据而设立的参数
    var area = '';
    if(req.url){
        var params = url.parse(req.url,true);
        searchKey = params.query.searchKey;
        area = req.query.area;
    }

    return {
        siteInfo : module[1],
        bigCategory : module[0],
        searchKey : searchKey,
        area : area,
        currentLink : req.originalUrl,
        layout : 'admin/index'
    }

}
module.exports = router;