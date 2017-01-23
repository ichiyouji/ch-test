var mongoose = require('mongoose');
var User = mongoose.model('User');
var LocalStrategy   = require('passport-local').Strategy;
var bCrypt = require('bcrypt-nodejs');

module.exports = function(passport){

	// Passport needs to be able to serialize and deserialize users to support persistent login sessions
	passport.serializeUser(function(user, done) {
		console.log('serializing user:',user._id);
		return done(null, user._id);
	});

	//Desieralize user will call with the unique id provided by serializeuser
	passport.deserializeUser(function(id, done) {

		User.findById(id, function(err, user) {
			console.log('deserializing user:',user.username);
			return done(err, user);
		});
		// return done(null, users[username]);

	});

	passport.use('login', new LocalStrategy({
			passReqToCallback : true
		},
		function(req, username, password, done) { 

			User.findOne({'username': username}, function(err,user){
				
				if (err) {
					console.log(err)
					return done(err);
				}
				if (!user) {
					console.log('username ' + username + 'not found');
					return done(null, false);
				}
				if (!isValidPassword(user,password)) {
					console.log('incorrect password');
					// return done(null, false);
					var msg = {message:'incorrect password'}
					return done(null, false, msg);
				}

				return done(null, user);

			});
		}
	));

	passport.use('signup', new LocalStrategy({
			passReqToCallback : true // allows us to pass back the entire request to the callback
		},
		function(req, username, password, done) {

			User.findOne({'username': username}, function(err,user){
				
				if (err) {
					console.log('Error in SignUp: '+err);
					return done(err, false);
				}

				if (user) {
					console.log('username taken ' + username);
					return done(null, false);
				}

				var user = new User(); 

				user.username = username;
				user.fullname = req.body.fullname;
				user.email = req.body.email;
				user.password = createHash(password);

				user.save(function(err,user){
					if (err) {
						console.log('Error in Saving user: '+err);  
						return done(err, false);
					}
					
					console.log('sucessfully register' + user.username);
					return done(null, user);
				});

			});

			// console.log(users[username].username + ' Registration successful');
		})
	);
	
	var isValidPassword = function(user, password){
		return bCrypt.compareSync(password, user.password);
	};
	// Generates hash using bCrypt
	var createHash = function(password){
		return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
	};

};