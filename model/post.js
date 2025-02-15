const connection = require('../connection/connection');
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    user: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        }
    ],
    date: {
        type: Date,
        default: Date.now()
    },
    content:{
        type:String
    },
    likes:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user'
    }]
});


const Post = mongoose.model('post',postSchema);

module.exports = Post;