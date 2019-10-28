var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2] || 8888

let session = {18940.154873991276: {username:'xioayu2'}}
console.log(session,'session')
var server = http.createServer(function(request, response){
  // 获取http请求路径
  var parsedUrl = url.parse(request.url, true)
  var path = request.url
  var query = ''
  if(path.indexOf('?') >= 0){ query = path.substring(path.indexOf('?')) }
  var pathNoQuery = parsedUrl.pathname
  var queryObject = parsedUrl.query
  var method = request.method

  console.log('HTTP 路径为\n' + path)
  if(path === '/'){                                 // 返回主页面
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    let body = fs.readFileSync('./index.html','utf8')

    // 如果有cookie的话显示用户名,没有cookie重定向到登录页面
    console.log(request.headers.cookie,'cookie')
    if(request.headers.cookie){
      let cookies = request.headers.cookie.split('; ')
      let cookieObj = {}
      cookies.forEach(value => {
        let temp = value.split('=')
        cookieObj[temp[0]] = temp[1]
      })
      //let username = cookieObj.username

      let username = session[cookieObj.sessionId].username

      body = body.replace('__username__',username)
      
    }else(
      response.writeHead(301, {'Location': './sign_in'})
    )

    response.write(body)
    response.end()
  }else if(path === '/sign_up' && method === 'GET'){   // 返回注册页面
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    let body = fs.readFileSync('./register.html','utf8')
    response.write(body)
    response.end()
  }else if(path === '/sign_in' && method === 'GET'){   // 返回登陆页面
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    let body = fs.readFileSync('./login.html','utf8')
    response.write(body)
    response.end()
  }else if(path === '/style.css'){
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/css;charset=utf-8')
    let style = fs.readFileSync('./style.css','utf8')
    response.write(style)
    response.end()
  }else if(path === '/sign_up' && method === 'POST'){   // 注册
    readBodyData(request).then(data => {
      let { username,password,password_confirm } = data

      // 判断数据库是否有该用户
      let users = JSON.parse(fs.readFileSync('./database.json','utf8') || "[]")
      console.log(users)
      let userExist = false
      for(i=0;i<users.length;i++){
        if(users[i].username === username){
          userExist = true
        }
      }
      console.log(userExist)
      if(userExist){
        response.statusCode = 400
        response.setHeader('Content-Type', 'application/json;charset=utf-8')
        response.write('该用户已注册,请勿重复注册')
      }else{
        users.push({username,password})
        fs.writeFileSync('./database.json',JSON.stringify(users))
        response.statusCode = 200
      }
      response.end()
    })
  }else if(path === '/sign_in' && method === 'POST'){   // 登录
    readBodyData(request).then(data=>{
      let { username,password } = data

      // 判断数据库是否有该用户
      let users = JSON.parse(fs.readFileSync('./database.json','utf8') || "[]")
      console.log(users)
      let userMatch = false
      for(i=0;i<users.length;i++){
        if(users[i].username === username && users[i].password === password){
          userMatch = true
        }
      }
      if(userMatch){
        response.statusCode = 200
        // 设置cookie
        //response.setHeader('Set-Cookie',`username=${username}`)
        //response.setHeader('Set-Cookie',[`username=${username}`,'a=123','b=456'])

        // 设置sessionId
        let sessionId = Math.random() * 100000
        response.setHeader('Set-Cookie',`sessionId=${sessionId}`)
        // 用session存储用户隐私数据
        session[sessionId] = { username,password }
      }else{
        response.setHeader('Content-Type', 'application/json;charset=utf-8')
        response.write('用户名与密码不匹配')
      }
      response.end()
    })
  }else{
    response.statusCode = 404
    response.end()
  }
})

server.listen(port)
console.log('监听 ' + port + ' 成功\n请用浏览器打开 http://localhost:' + port)

function readBodyData(request){
  return new Promise(function(resolve,reject){
    let data = ''
    request.on('data',chunk => {
      data += chunk.toString()
    })
    request.on('end', ()=>{
      
      let params = data.split('&')
      let hash = {}
      params.forEach(value => {
        let temp = value.split('=')
        hash[temp[0]] = temp[1]
      })
      resolve(hash)
    })
  })
}
