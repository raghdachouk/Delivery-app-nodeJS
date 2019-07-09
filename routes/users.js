const express = require('express');
const bcrypt = require('bcryptjs');
// const SinchClient = require('sinch-rtc');
const User = require('../models/user');
const authy = require('authy')('1jT7utwiQOibjkJqCgV5idCotxS7TbCq');
const router = express.Router();

// const sinchClient = new SinchClient({
// 	applicationKey: '3d216899-e87d-465b-83b7-50da8f77022d'
// });
//util function to check if a string is a valid email address
const isEmail = (email) => {
	if (typeof email !== 'string') {
		return false;
	}
	const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

	return emailRegex.test(email);
};

router.post('/register', async (req, res) => {
	try {
		const { email, password, mobile, firstName, lastName } = req.body;

		if (typeof password !== 'string') {
			throw new Error('Password must be a string.');
		}
		const user = new User({ firstName, lastName, email, password, mobile });
		const persistedUser = await user.save();
		//res.status(201).send(res);
		res.status(201).json({
			success: true,
			message: 'User Registration Successful',
			detail: 'Successfully registered new user'
		});
	} catch (err) {
		res.status(400).json({
			errors: [
				{
					success: false,
					title: 'Registration Error',
					detail: 'Something went wrong during registration process.',
					errorMessage: err.message
				}
			]
		});
	}
});
router.post('/signIn', async (req, res) => {
	try {
		const { mobile, password } = req.body;

		if (typeof password !== 'string') {
			return res.status(400).json({
				errors: [
					{
						success: false,
						message: 'Bad Request',
						detail: 'Password must be a string'
					}
				]
			});
		}
		//queries database to find a user with the received email
		const user = await User.findOne({ mobile });
		if (!user) {
			throw new Error();
		}

		//using bcrypt to compare passwords
		const passwordValidated = await bcrypt.compare(password, user.password);
		if (!passwordValidated) {
			res.status(400).json({
				success: false,
				message: 'votre mot de passe est incorrect!'
			});
		} else
			res.json({
				message: 'Login Successful',
				success: true,
				detail: 'Successfully validated user credentials'
			});
	} catch (err) {
		res.status(401).json({
			errors: [
				{
					success: false,
					message: 'Invalid Credentials',
					detail: 'Check email and password combination',
					errorMessage: err.message
				}
			]
		});
	}
});
// router.get('/signout', function(req, res, next) {
// 	if (req.session) {
// 		// delete session object
// 		req.session.destroy(function(err) {
// 			if (err) {
// 				return next(err);
// 			} else {
// 				return res.redirect('/');
// 			}
// 		});
// 	}
// });
router.post('/sendVerificationCode', async (req, res) => {
	try {
		var { mobile, countryCode } = req.body;
		const phone = `${countryCode}${mobile}`;
		const user = await User.findOne({ mobile: phone });
		if (user)
			res.status(200).json({
				isUser: true,
				success: true,
				message: 'votre numéro de téléphone est déjà utilisé'
			});
		else {
			authy.phones().verification_start(mobile, countryCode, { via: 'sms', code_length: '4' }, function(err, result) {
				if (err) {
					res.status(400).json({
						success: false,
						message: 'Invalid Credentials'
					});
					console.log(err);
				} else {
					//res.status(201).send(result);
					res.status(200).json({
						isUser: false,
						success: true,
						message: 'votre code de vérification a été envoyer'
					});
				}
			});
		}
	} catch (err) {
		res.status(401).json({
			errors: [
				{
					title: 'Invalid Credentials',
					detail: 'Check your phone number',
					errorMessage: err.message
				}
			]
		});
	}
});
router.post('/verifyCode', async (req, res) => {
	const { code, mobile, countryCode } = req.body;
	authy.phones().verification_check(mobile, countryCode, code, function(err, result) {
		if (err) {
			// invalid token

			res.status(400).json({
				success: false,
				message: 'votre code est incorrect'
			});
		} else {
			res.status(200).json({
				success: true,
				message: 'votre code est correct'
			});
		}
	});
});

router.post('/checkEmail', async (req, res) => {
	const { email } = req.body;
	const user = await User.findOne({ email });
	if (!isEmail(email))
		res.status(400).json({
			success: false,
			message: 'Votre Email est incorrect'
		});
	else {
		if (user)
			res.status(400).json({
				success: false,
				message: 'Email est déjà exist'
			});
		else
			res.status(200).json({
				success: true,
				message: 'Successfully validated email credentials'
			});
	}
});
module.exports = router;
