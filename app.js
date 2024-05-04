
const express = require ('express');
const ejs = require ('ejs');
const mongoose = require ('mongoose');
const bodyParser = require ('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const { Collection } = require('mongodb');
const mongoDbSession = require('connect-mongodb-session')(session);
//const { AutoEncryptionLoggerLevel } = require('mongodb');
const app = express();
const todos = [];
app.set ('view engine','ejs')
app.use (bodyParser.urlencoded({extended:true}));

//mongoose connection
mongoose.connect('mongodb+srv://sudheerramoju:sudheerramoju123@cluster0.jmrdvoi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0').then(() =>{
console.log('mongo db is connected');
})

//setup our sessions
const store =new mongoDbSession({
  uri: 'mongodb+srv://sudheerramoju:sudheerramoju123@cluster0.jmrdvoi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
  Collection:'sessions',
})
app.use(session({
  secret: 'this is the secret',
  resave: false,
  saveUninitialized: false,
  store: store,
}))



//Schema
const todoSchema = new mongoose.Schema({
  title: {type: String, required:true},
  desc: {type: String, required:true},
  addedBy: {type: String, required:true},
  isCompleted:{type:Boolean,default:false}
})

const userSchema = new mongoose.Schema({
  name:{type: String, required:true},
  email:{type: String, unique:true,required:true},
  password:{type: String, required:true}

})

//model
const Todos = mongoose.model('todos',todoSchema)
const Users = mongoose.model('users',userSchema)


//middlewares

const isAuth = (req,res, next)=>{
  if(req.session.isAuth){
    next()
  }
  else{
    res.redirect('/login')
  }
}

//routes
app.get('/',(req,res) =>{
  res.render('index')
})

app.get('/dashboard',isAuth,async(req,res) =>{
  let todos =await Todos.find({addedBy:req.session.authUser.email});
  res.render('dashboard',{todos:todos})
})

app.get('/login',(req,res) =>{
  res.render('login');
})

app.get('/register',(req,res) =>{
  res.render('register');
})

app.post('/add-user',async(req,res) =>{
  let {name,email,password} = req.body;
  let data = new Users ({
    name: name,
    email: email,
    password:await bcrypt.hash(password,10)  
  })
  data.save();
  res.redirect('/login')
})

app.post('/auth',async(req,res) =>{
  let {email,password} = req.body;
  let user = await Users.findOne({email:email});
  //console.log(user)  
  if(user != null){//it means user exits
      let isPasswordValid = await bcrypt.compare(password, user.password);
      //console.log(isPasswordValid);
      if (isPasswordValid){
        req.session.isAuth = true;
        req.session.authUser = user;
        res.redirect('/dashboard');
      }
      else{
        res.send('wrong usernamd and password')
      }
  }
  else{
        res.send('wrong usernamd and password')

  }
})

app.get('/logout', (req,res)=>{
  req.session.destroy();
  res.redirect('/');
})


app.get('/delete/:id',isAuth,async(req,res) =>{
  const id = req.params.id;
  let data = await Todos.findByIdAndDelete(id);
  res.redirect('/dashboard');
})

app.get('/completed/:id',isAuth,async(req,res) =>{
  const id = req.params.id;
  const data = await Todos.findByIdAndUpdate(id, {isCompleted:true});
  res.redirect('/dashboard');
})

app.get('/not-completed/:id',isAuth,async(req,res) =>{
  const id = req.params.id;
  const data = await Todos.findByIdAndUpdate(id, {isCompleted:false});
  res.redirect('/dashboard');
})


app.post('/create-task', isAuth, (req,res) =>{
let task = req.body.task;
let desc = req.body.desc;
let data = new Todos({
  title: task,
  desc: desc,
  addedBy: req.session.authUser.email,
})
// todos.push(task);
data.save();
res.redirect('/dashboard');
})

app.listen(8000, ()=>{
  console.log('server is on port 8000')
})