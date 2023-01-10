const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
	content: String,
	hyperLink: String,
	author: String,
	type: {
		type: String,
		default: "Post"
	},
	Status: {
		type: String,
		default: "Not started"
	}
});

const postModel = mongoose.model("posts", postSchema);

module.exports = postModel;
