var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Post = mongoose.model('Post');
// var User = mongoose.model('User');
var bCrypt = require('bcrypt-nodejs');
var Trello = require('node-trello');
var async = require('async');
//Used for routes that must be authenticated.
function isAuthenticated (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler 
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects

	//allow all get request methods
	if(req.method === "GET"){
		return next();
	}
	if (req.isAuthenticated()){
		return next();
	}

	// if the user is not authenticated then redirect him to the login page
	return res.redirect('/#login');
};

router.route('/trl')
	.get(function(req,res){
		var Trello = require('node-trello');
			var async = require('async');

			var listArray = [];
			var t = new Trello('52af2d4bfeaa723904bd8d01a6101acd','c0e7b0d4185faa441c89000d867b36bd98b3335ceb5cbc43c5cf0a7842c24abc');
			  t.get('/1/members/me/boards/',{}, function(err, data) {
			    async.eachSeries(data,function(board,nextBoard){
			    	if (board.name == 'Recruitment 2017') {
			        t.get('/1/boards/'+board.id+'/lists',{cards:'all'}, function(err, lists) {
                async.eachSeries(lists,function(list, nextList){
                  var listItem = list;
                  var cards = list.cards;
                  listItem.cards = [];
                  async.eachSeries(cards, function(card, nextCard){
                    t.get('/1/cards/'+card.id,{actions:'updateCard:idList'}, function(err, item){
                      listItem.cards.push(item);
                      nextCard();
                    });
                  },function(err){
                    listArray.push(listItem);
                    nextList()
                  });
              },function(err){
                nextBoard();
              });    
            });
			    	}else{
			    		nextBoard();
			    	}
			    }, function(err){
			    	if (err) {
			    		return res.send(err);
			    	}
			    	return res.send(listArray);
			    });
			  }); 
	})

//Register the authentication middleware
// router.use('/users', isAuthenticated);
router.use('/posts', isAuthenticated);

router.route('/posts')
	.get(function(req, res){

		Post.find(function(err, data){
			if (err) {
				return res.send(500,err)
			}
			
			return res.send(data)
		})

		// res.send({message:'Return Test Message'})

	})
	.post(function(req, res){

		var post = new Post();
		post.text = req.body.text;
		post.created_by = req.body.created_by;
		post.save(function(err, data){
			if (err) {
				return res.send(500,err);
			}
			return res.json(post);
		});

		// res.send({message:'Create Test Message'})

	})

router.route('/posts/:id')
	.get(function(req, res){
		Post.findById(req.params.id, function(err,post){
			if (err) {
				res.send(err);
			}			
			res.json(post);
		});
	})
	.put(function(req, res){
		Post.findById(req.params.id, function(err, post){
			if(err){
				res. send(err);
			}

			post.created_by = req.body.created_by ? req.body.created_by : post.created_by;
			post.text = req.body.text;

			post.save(function(err,post){
				if (err) {
					res.send(err);
				}
				res.json(post);
			});
		});
	})
	.delete(function(req, res){
		Post.remove({
			_id: req.params.id
		}, function(err){
			if (err) {
				res.send(err);
			}
			res.json('deleted');
		})
	})

module.exports = router;