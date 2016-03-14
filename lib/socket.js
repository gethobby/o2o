var Cookie = require('express/node_modules/cookie');
module.exports = function(server){
    var io = require('socket.io')(server);
    
    var idNums = {}; // 存储每个用户的回话id
    var sockets = {};    //存储用户socket
    var socketsTel={};// 存储消费者的联系方式
    var socketsName = {}; // 存储消费者的名字
    var messages = {}; // 存储每个用户向商户请求的内容
    
    var socketShops={};  //存储商家的socket
    var socketShopsName={};//存储所有商家的名字
    var socketShopsService={};// 存储商家提供的服务
    
    io.use(function(socket,next){
        console.log('socket登录验证');
        var cookie =  Cookie.parse(socket.handshake.headers.cookie);
        if(!cookie.role) return next(new Error("登录失败！"));
        socket.role = cookie.role;
        if(cookie.role==1) {
            socket.name = cookie.name_s;
            socket.service=cookie.service;
        }else{
            socket.name = cookie.name_u;
            socket.tel=cookie.tel;
        }
        next();
    });
    //普通用户房间
    io.on('connection', function (socket) {
        //每次socket请求，都会随机生成一个hash码，唯一标识某个具体的请求(也就是回话的意思)
        var id   = socket.id,
            role = socket.role;
          console.log("=========="+id+"-----"+role);
        if(role == 1){
            console.log('商家进入');
            socket.join('shop');
            console.log("商家名称："+socket.name) ;
            var user = io.sockets.adapter.rooms['user'];
            console.log(user);
            socketShops[id]=socket;
            socketShopsName[id]=socket.name;
            socketShopsService[id]=socket.service;
            //向所有用户推送该上线的商家
            socket.to('user').emit('message',{ cmd:'online',data: {id:id,name:socket.name,service:socket.service} });
        }else if(role == 2){
            console.log('用户进入');
            console.log("用户名称："+socket.name) ;
            socket.join('user');
        }

        socket.on('message',function(packet){
            var sp = packet.cmd;
            switch(sp) {
                case "online":   //接受用户上线通知，向用户发送在线(该会话中，登陆的)的商户
                    socket.send({cmd:"list",data:{names:socketShopsName,services:socketShopsService}});
                    break;
                case "chat": // 接受用户的点单
                    console.log("chat");
                    console.log(packet.data.tel);
                    // 向用户点单的商户推送消息
                    idNums[id]=id;
                    sockets[id]=socket;
                    socketsName[id]=socket.name;
                    socketsTel[id]=socket.tel;
                    messages[id] = packet.data.message;
                    
                    socketShops[packet.data.id].send({cmd: "rec", data:{
                        ids:idNums,messages:messages,names:socketsName,tels:socketsTel}});
                    break;
                case "ok":// 接受商家已经处理用户点单的信息
                    console.log("走到OK这里了");
                    console.log(packet.data.id);
                    //告知该用户,商家已经处理好点单，id为用户的id
                    sockets[packet.data.id].send({cmd:"ok",data:packet.data.message});
                    break;
            }
        });
        socket.on('disconnect',function(){
            delete socketShops[id];
            delete socketShopsName[id];
            delete socketShopsService[id] ;
            
            delete sockets[id];
            delete socketsName[id];
            delete socketsTel[id];
            
            socket.to('user').emit('message',{ cmd:'list',data:{names:socketShopsName,services:socketShopsService}  });
        });
    });
};