const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
		minlength: 1,
		trim: true, //calls .trim() on the value to get rid of whitespace
		unique: true //note that the unique option is not a validator; we use mongoose-unique-validator to enforce it
	},
	mobile: {
		type: String,
		required: true,
		minlength: 5,
		trim: true, //calls .trim() on the value to get rid of whitespace
		unique: true //note that the unique option is not a validator; we use mongoose-unique-validator to enforce it
	},
	firstName: {
		type: String,
		required: true,
		minlength: 3
	},
	lastName: {
		type: String,
		required: true,
		minlength: 3
	},
	password: {
		type: String,
		required: true,
		minlength: 5
	}
});

//this enforces emails to be unique!
UserSchema.plugin(uniqueValidator);

//this function will be called before a document is saved
UserSchema.pre('save', function(next) {
	let user = this;

	if (!user.isModified('password')) {
		return next();
	}

	//we generate the salt using 12 rounds and then use that salt with the received password string to generate our hash
	bcrypt
		.genSalt(12)
		.then((salt) => {
			return bcrypt.hash(user.password, salt);
		})
		.then((hash) => {
			user.password = hash;
			next();
		})
		.catch((err) => next(err));
});

module.exports = mongoose.model('User', UserSchema);
