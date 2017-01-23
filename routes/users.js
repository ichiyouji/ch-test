var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = mongoose.model('User');
var bCrypt = require('bcrypt-nodejs');

function isAuthenticated (req, res, next) {
	if(req.method === "GET"){
		return next();
	}
	if (req.isAuthenticated()){
		return next();
	}

	return res.redirect('/');
};

var createHash = function(password){
	return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
};

var createQuery = function(elem){
	var q = {};
	console.log(elem);

	elem.forEach(function(e,i){

	})

	// Object.keys(el).map(function(objectKey, index) {
	//     var e = el[objectKey];
		
	// 	var e = JSON.parse(e);
	// 	console.log(el);
		
	// 	q.push({[e.type]:new RegExp(''+e.value+'','i')})
	// 	// console.log({[e.type]:new RegExp(''+e.value+'','i')});
	// });

	return q;
}

var createObject = function(item){
	var a = [];
	var n = {};
	item.forEach(function(e,i){
		var type = e.type ? e.type: '';
		var op = e.op ? e.op: null;
		var value = e.value ? e.value: '';
		if (op && value) {
			n = {[type]:{[op]:value}}
		}else if (value){
			n = {[type]:new RegExp(''+value+'','i')}
		}
		if (type) {
			a.push(n);
		}
	});
	return a;
}

module.exports = function(passport){
	//Register the authentication middleware
	// router.use('/', isAuthenticated);

	router.route('/')
		.get(function(req, res){
			User.find().exec(function(err, data){
				if (err) {
					return res.send(500,err)
				}
				return res.send(data)
			})
		})

	router.route('/find')
		// .get(function(req, res){
		// 	console.log(req.params)
		// 	// console.log(createQuery(req.query))
		// 	// var q = createQuery(req.query);
		// 	User.find().exec(function(err, data){
		// 	// User.find(q).exec(function(err, data){
		// 	// User.find({[req.query.label]:new RegExp('.*'+req.query.value+'.*','i')}).exec(function(err, data){
		// 		if (err) {
		// 			return res.send(500,err)
		// 		}
		// 		return res.send(data)
		// 	})
		// })
		.post(function(req, res){
			// console.log(createQuery(req.query))
			// var q = createQuery(req.body);
			// var q = User.find();

			var param = req.body;
			
			var a = {$and:[]};
			
			param.forEach(function(e,i){
				var inner = createObject(e.data);
				if (inner.length) {
					a['$and'].push({$or:inner});
					console.log(inner);
					// q[e.log](inner);
				}
			})

			// q.and(a);
			
			var q = User.find(a);
			q.exec(function(err, data){
			// User.find({[req.query.label]:new RegExp('.*'+req.query.value+'.*','i')}).exec(function(err, data){
				if (err) {
					return res.send(500,err)
				}
				return res.send(data)
			})
		})

	router.route('/:id')
		.get(function(req, res){
			User.findById(req.params.id,function(err,usr){
				if (err) {
					res.send(err);
				}			
				return res.json(usr);
			});
		})
		.put(function(req,res){
			User.findById(req.params.id, function(err, user){
				if (err) {
					res.send(err);
				}
				user.username = req.body.username ? req.body.username : user.username;
				user.fullname = req.body.fullname;
				user.email = req.body.email;
				user.password = req.body.password ? createHash(req.body.password) : user.password;
				
				user.save(function(err,user){
					if (err) {
						res.json(err);
					}
					
					res.json(user);
				});

				// res.json('sucessfully Updated');
			})
		})
		.delete(function(req, res){
			User.remove({
				_id: req.params.id
			}, function(err){
				if (err) {
					res.send(err);
				}
				res.json('deleted');
			})
		})

	return router;

}

// module.exports = router;
