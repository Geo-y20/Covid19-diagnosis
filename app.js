// initialize required utilities
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dbControl = require(__dirname+'/controllers/dbController.js');
const app = express();
app.listen(9999);
app.set('view engine', 'pug');
app.set('views', __dirname+'/views');
app.use(cookieParser());
app.use(express.static(__dirname+'/public'));
app.use(express.urlencoded({extended:true}));
//app.use(express.json());
const formidable = require('formidable');


const maxAge = 100*24*60*60; // in seconds
const createToken = (id)=>{
    return jwt.sign({id}, "Nagy@16-Aug-1995__&&__Haroon@06-Jan-1999", {expiresIn: maxAge});  
};
const verifyToken = (req_tok)=>{
    try{
        var req_data = jwt.verify(req_tok, "Nagy@16-Aug-1995__&&__Haroon@06-Jan-1999");
        return req_data
    }catch{
        return 0;
    }  
};

// GET requests
app.get('/', (req, res)=>{
    res.render('home', {title:'Home', cssFile:'home'});
});
app.get('/about', (req, res)=>{
    res.render('about', {title:'About us', cssFile:'about'});
});
app.get('/login', (req, res)=>{
    var req_tok = req.cookies.jwt;
    if(req_tok){
        var req_data = verifyToken(req_tok);
        if(req_data == 0){
            res.render('login', {title:'Log In', cssFile:'login'});
        }else{
            res.redirect('/home');
        }
    }else{
        res.render('login', {title:'Log In', cssFile:'login'});
    }
});
app.get('/signup_d', (req, res)=>{
    res.render('signup_d', {title:'Doctor Sign Up', cssFile:'signup'});
});
app.get('/signup_p', (req, res)=>{
    res.render('signup_p', {title:'Patient Sign Up', cssFile:'signup'});
});
app.get('/home', async(req, res)=>{
    var req_tok = req.cookies.jwt;
    if(req_tok){
        var req_data = verifyToken(req_tok);
        if(req_data == 0){
            res.redirect('/login');
        }else{
            var user = await dbControl.searchUser(req_data.id);
            if(user.state==1){
                if(user.entity=='d'){
                    res.render('home_d', {title:'Welcome',cssFile:'home_d'});
                }else{
                    res.render('home_p', {title:'Welcome',cssFile:'home_p'});
                }
            }else{
                res.redirect('/login');
            }
        }
    }else{
        res.redirect('/login');
    }
});
app.get('/result', (req, res)=>{
    var req_tok = req.cookies.jwt;
    if(req_tok){

    }else{
        res.redirect('/login');
    }
    res.render('result', {title:'Test Result', cssFile:'result'});
});



// POST requests
app.post('/login', async (req, res)=>{
    var {username, password} = req.body;
    var user = await dbControl.searchUser(username);    
    if(user.state==1){
        var auth = bcrypt.compareSync(password, user.stored_password);
        if(auth){
            var token = createToken(username);
            await res.cookie('jwt', token, {maxAge:maxAge*1000});
            res.redirect('/home');
        } else{
            // TODO: handle incorrect password
        }
    } else{
        // TODO: handle incorrect username
    }
});
app.post('/signup_d', async(req, res)=>{
    var {username, password} = req.body;
    var user = await dbControl.searchUser(username);
    if(user.state==1){
        //TODO: handle username already exists
    }
    else{
        var salt = bcrypt.genSaltSync();
        password = bcrypt.hashSync(password, salt);
        await dbControl.addUser({
            username: username, 
            password:password, 
            entity:'d'
        });
        var token = await createToken(username);
        await res.cookie('jwt', token, {maxAge:maxAge*1000});
        await res.redirect('/home');
    }
});
app.post('/signup_p', async(req, res)=>{
    var username = req.body.username;
    var password = req.body.password;
    var hypertension = req.body.hypertension||'No';
    var diabetes = req.body.diabetes||'No';
    var user = await dbControl.searchUser(username);
    if(user.state==1){
        //TODO: handle username already exists
    }
    else{
        var salt = bcrypt.genSaltSync();
        password = bcrypt.hashSync(password, salt);
        await dbControl.addUser({
            username: username, 
            password:password, 
            entity:'p', 
            hypertension:hypertension, 
            diabetes:diabetes
        });
        var token = await createToken(username);
        await res.cookie('jwt', token, {maxAge:maxAge*1000});
        await res.redirect('/home');
    }
});
app.post('/scan', async(req, res)=>{
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      console.log(fields);
      console.log(files);
    });
    res.redirect('/result');
});


// 404 page
app.use((req, res)=>{
    res.status(404).render('404', {title:'Page Not found', cssFile:'404'});
});