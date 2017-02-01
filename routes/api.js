var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Post = mongoose.model('Post');
// var User = mongoose.model('User');
var bCrypt = require('bcrypt-nodejs');
var Trello = require('node-trello');
var async = require('async');
var OAuth = require('oauth');

var requestURL = 'https://trello.com/1/OAuthGetRequestToken';
var accessURL = 'https://trello.com/1/OAuthGetAccessToken';
var authorizeURL = 'https://trello.com/1/OAuthAuthorizeToken';
var appName = "TrelloX";
var loginCallback = 'https://fierce-atoll-33773.herokuapp.com/api/authTrello'
// var loginCallback = 'http://localhost:3000/api/authTrello'

var key = '52af2d4bfeaa723904bd8d01a6101acd';
var secret = 'c0b26eeb1213a94763cb1d766667cbb875a70075376dfcaaae76036a443af261';
var expiry = '1day';
var token;
var auth_secret;
var oauth = new OAuth.OAuth(requestURL,accessURL,key,secret,'1.0',loginCallback,'HMAC-SHA1');

var t;

//Used for routes that must be authenticated.
function isAuthenticated(req, res, next) {
  // if user is authenticated in the session, call the next() to call the next request handler 
  // Passport adds this method to request object. A middleware is allowed to add properties to
  // request and response objects

  //allow all get request methods
  if (req.method === "GET") {
    return next();
  }
  if (req.isAuthenticated()) {
    return next();
  }

  // if the user is not authenticated then redirect him to the login page
  return res.redirect('/#login');
};

function isAuthTrello(req,res,next){
	if (!token) {
		oauth.getOAuthRequestToken(function (error, oauth_token, oauth_secret, results) {
		  if (!error) {
				// var t = new Trello(key, oauth_token);
				auth_secret = oauth_secret
				var resp = {auth:true, url:authorizeURL+'?oauth_token='+oauth_token+'&name='+appName+'&expires='+expiry}
	  		return res.send(resp);
		    // return next();
		  }
	  	return res.redirect('/#error');
		  console.log(error);
		});
	}else{
		return next();
	}
}
router.use('/board', isAuthTrello);
router.use('/board/list/', isAuthTrello);

router.route('/board')
	.get(function(req,res){
		var listBoard = [];
    t.get('/1/members/me/boards/', {}, function(err, data) {
      if (err) {
        token = '';
      }
      return res.send(data);
    	console.log(data);
    });
	})

router.route('/authTrello')
	.get(function(req,res){
		console.log(req.query);
		oauth.getOAuthAccessToken(req.query.oauth_token, auth_secret, req.query.oauth_verifier,function (error, accessToken, accessTokenSecret, results) {
      console.log(accessToken)
      console.log(accessTokenSecret)
      t = new Trello(key,accessToken);  
      token = accessToken;
  		return res.redirect('/#/');
    })
	})

router.route('/board/list/:id')
  .get(function(req, res) {
    var listArray = [];
    t.get('/1/boards/' + req.params.id + '/lists', { cards: 'all' }, function(err, lists) {
      async.eachSeries(lists, function(list, nextList) {
        var listItem = list;
        var cards = list.cards;
        listItem.cards = [];
        async.eachSeries(cards, function(card, nextCard) {
          t.get('/1/cards/' + card.id, { actions: 'updateCard:idList' }, function(err, item) {
            listItem.cards.push(item);
            nextCard();
          });
        }, function(err) {
          listArray.push(listItem);
          nextList()
        });
      }, function(err) {
        if (err) {
        	token = '';
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
  .get(function(req, res) {

    Post.find(function(err, data) {
      if (err) {
        return res.send(500, err)
      }

      return res.send(data)
    })

    // res.send({message:'Return Test Message'})

  })
  .post(function(req, res) {

    var post = new Post();
    post.text = req.body.text;
    post.created_by = req.body.created_by;
    post.save(function(err, data) {
      if (err) {
        return res.send(500, err);
      }
      return res.json(post);
    });

    // res.send({message:'Create Test Message'})

  })

router.route('/posts/:id')
  .get(function(req, res) {
    Post.findById(req.params.id, function(err, post) {
      if (err) {
        res.send(err);
      }
      res.json(post);
    });
  })
  .put(function(req, res) {
    Post.findById(req.params.id, function(err, post) {
      if (err) {
        res.send(err);
      }

      post.created_by = req.body.created_by ? req.body.created_by : post.created_by;
      post.text = req.body.text;

      post.save(function(err, post) {
        if (err) {
          res.send(err);
        }
        res.json(post);
      });
    });
  })
  .delete(function(req, res) {
    Post.remove({
      _id: req.params.id
    }, function(err) {
      if (err) {
        res.send(err);
      }
      res.json('deleted');
    })
  })

module.exports = router;
