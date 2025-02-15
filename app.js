const cookieParser = require('cookie-parser');
const express = require('express');
// const router = require('./router/router');
const User = require('./model/user')
const Post = require('./model/post');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const crypto = require('crypto');
const app = express();
const multer = require('multer')



// multer
const storage = multer.diskStorage({
    destination: (req,file,cb)=>{
        cb(null,'./public/images/uploads');
    },
    filename: (req,file,cb)=>{
        crypto.randomBytes(12,(err,bytes)=>{
            const fn = bytes.toString('hex')+path.extname(file.originalname);
            cb(null,fn) ;
        })
    }

});
const upload = multer({storage:storage});




app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname,'public')))
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.render('login');
});

app.get('/post',isLoggedIn,async(req, res) => {
    let user = await User.findOne({email:req.user.email}).populate('posts');
    res.render('post',{ user });
});

app.get('/index', (req, res) => {
    res.render('index');
});
app.get('/update/:id',isLoggedIn,async (req, res) => {
    let post = await Post.findOne({_id:req.params.id}).populate('user');
    res.render('update',{post});
});
app.get('/profile/upload',isLoggedIn,async (req, res) => {
    res.render('uploads');
});
app.post('/uploads',isLoggedIn,upload.single("picture"),async (req, res) => {
    let user = await User.findOne({email:req.user.email})
    user.image = req.file.filename
    await user.save();
    res.redirect('/post')
});
app.get('/exists', (req, res) => {
    res.render('exists');
});

app.post('/register', async (req, res) => {
    let { name, username, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(500).redirect('/exists');
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            let user = await User.create({ name, username, email, password: hash });
            let token = jwt.sign({ email }, "khan",{expiresIn:'1h'});
            res.cookie("token", token);
            res.redirect('/post');
        })
    })
}

)
app.get('/like/:id', isLoggedIn, async (req, res) => {
    let post = await Post.findOne({_id:req.params.id}).populate('user');
    if(post.likes.indexOf(req.user.userid)===-1){
        post.likes.push(req.user.userid);
    }else{
        post.likes.splice(post.likes.indexOf(req.user.userid),1);
    }
    await post.save();
    res.redirect('/post');
})
app.post('/update/:id', isLoggedIn, async (req, res) => {
    let post = await Post.findOneAndUpdate({_id:req.params.id},{content:req.body.content})
    res.redirect('/post');
})
app.post('/login', async (req, res) => {
    let { email, password } = req.body;
    let user = await User.findOne({ email });
    if (!user) return res.status(500).send('Something Went Wrong')
    bcrypt.compare(password, user.password, (err, result) => {
        let token = jwt.sign({email},"khan");
        res.cookie('token',token)
        if (result) res.status(201).redirect('/post');
        else return res.redirect('/');
    })
});


app.get('/logout',(req,res)=>{
    res.cookie("token","");
    res.redirect('/');
})


// post
app.post('/post',isLoggedIn,async(req, res) => {
    let user = await User.findOne({email:req.user.email});
    let {content} = req.body;


    let post = await Post.create({
        user:user._id,
        content:content
    })


    user.posts.push(post._id);
    user.save();
    res.redirect('/post');
});

// update

// middleware


function isLoggedIn(req, res, next) {
    if (req.cookies.token === "") res.redirect('/');
    else {
        let data = jwt.verify(req.cookies.token, "khan");
        req.user = data;
        next();
    }
}

app.listen(3000);