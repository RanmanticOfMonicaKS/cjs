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

//-------------------------对象删除开始-------------------------

router.get('/manage/:defaultUrl/del',function(req,res){
    var currentPage = req.params.defaultUrl;
    var params = url.parse(req.url,true);
    var targetObj = adminFunc.getTargetObj(currentPage);

    if(targetObj == Message){
        removeMessage(req,res)
    }else if(targetObj == AdminUser){
        if(params.query.uid == req.session.adminUserInfo._id){
            res.end('不能删除当前登录的管理员！');
        }else{
            Message.find({'adminAuthor' : params.query.uid},function(err,docs){
                if(err){
                    res.end(err)
                }
                if(docs && docs.length>0){
                    res.end('请清理您的评论后再删除该用户！');
                }else{
                    DbOpt.del(targetObj,req,res,"del one obj success");
                }
            });
        }
    }

});

//批量删除对象
// router.get('/manage/:defaultUrl/batchDel',function(req,res){
//     var currentPage = req.params.defaultUrl;
//     var params = url.parse(req.url,true);
//     var targetObj = adminFunc.getTargetObj(currentPage);
//     var ids = params.query.ids;
//     var idsArr = ids.split(',');
//     if(targetObj == Message || targetObj == AdminGroup || targetObj == AdminUser || targetObj == Notify){
//         res.end(settings.system_batch_delete_not_allowed);
//     }else if(targetObj == UserNotify){
//         //管理员删除系统消息
//         if(currentPage == settings.sysTemBackStageNotice[0]){
//             var nids = params.query.expandIds;
//             var nidsArr = nids.split(',');
//             if(nidsArr.length > 0){
//                 for(var i=0;i<nidsArr.length;i++){
//                     adminFunc.delNotifiesById(req,res,nidsArr[i]);
//                 }
//                 //更新消息数
//                 adminFunc.getAdminNotices(req,res,function(noticeObj){
//                     req.session.adminNotices = noticeObj;
//                     res.end('success');
//                 });
//             }
//         }
//     }else{
//         targetObj.remove({'_id':{$in: idsArr}},function(err){
//             if(err){
//                 res.end(err);
//             }else{
//                 res.end("success");
//             }
//         });

//     }

// });

//-------------------------对象删除结束-------------------------
//-------------------------对象新增开始-------------------------
router.post('/manage/:defaultUrl/addOne',function(req,res){

    var currentPage = req.params.defaultUrl;
    var targetObj = adminBean.getTargetObj(currentPage);

    if(targetObj == AdminUser){
        addOneAdminUser(req,res);
    }

});

//-------------------------对象新增结束-------------------------

//添加系统用户
function addOneAdminUser(req,res){
    var errors;
    var userName = req.body.userName;
    if(validator.isUserName(userName)){
        AdminUser.findOne({userName:req.body.userName},function(err,user){
            if(user){
                errors = "该用户名已存在！";
                res.end(errors);
            }else{
                // if(!req.body.group){
                //     errors = "请选择用户组！";
                // }
                if(errors){
                    res.end(errors)
                }else{
                    // 密码加密
                    //req.body.password = DbOpt.encrypt(req.body.password,settings.encrypt_key);
                    //req.body.group = new AdminGroup({_id : req.body.group});
                    DBOpt.addOne(AdminUser,req, res);
                }
            }
        })
    }else{
        res.end(settings.system_illegal_param)
    }

}


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