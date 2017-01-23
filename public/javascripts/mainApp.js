var app = angular.module('myTestApp',['ngRoute','ngResource','angularMoment']).run(function($rootScope,$http){
	$rootScope.authenticated = false;
	$rootScope.currentUser = '';
	$rootScope.currentUserId = '';

	$rootScope.signout = function(){
		$http.get('/auth/signout');

		$rootScope.authenticated = false;
		$rootScope.currentUser = '';
		$rootScope.currentUserId = '';
	}
});

app.config(function($routeProvider){
	$routeProvider
		.when('/', {
			templateUrl: 'trl.html',
			controller: 'trlCtrl'
		})
		.when('/users', {
			templateUrl: 'users.html',
			controller: 'userController'
		})
		.when('/login', {
			templateUrl: 'login.html',
			controller: 'authController'
		})
		.when('/register', {
			templateUrl: 'reg.html',
			controller: 'regController'
		})
		.otherwise({redirectTo:'/'});
});

app.factory('postService', function($resource){
	return $resource('/api/posts/:id', null, {update:{method:'PUT'}});
})

app.factory('userService', function($resource){
	return $resource('/users/:id', null, {update:{method:'PUT'}});
})
app.factory('usearchService', function($resource){
	return $resource('/users/find/:id', null, {update:{method:'PUT'}});
})

app.run(function($rootScope, $location, $http, postService){
	$http.get('/auth/check/').success(function (data) {
	    if (data.state == 'success') {
	        $rootScope.authenticated = true;
	        $rootScope.currentUser = data.user.username;
	        $rootScope.currentUserId = data.user._id;
	    }
	    else {
	        $rootScope.authenticated = false;
	        $rootScope.currentUser = '';
	        $rootScope.currentUserId = '';
	    }
	}); 
})

app.controller('trlCtrl', function($scope, $compile, $http){
	$scope.trlData = [];
	$scope.toDate = function(e){
		var s = e.substring(0,8);
		var p = parseInt(s,16);
		var e = p*1000;
		var d = new Date(e);
		// console.log(s+', '+p+', '+e+', '+d);
		return d.toISOString();
	}
	$http.get('/api/trl/').success(function (data) {
	    $scope.trlData = data;
	    console.log($scope.trlData);
	}); 
})

// app.directive('draggable', function(){
// 	return{
// 	    // A = attribute, E = Element, C = Class and M = HTML Comment
// 	    restrict:'A',
// 	    //The link function is responsible for registering DOM listeners as well as updating the DOM.
// 	    link: function(scope, element, attrs) {
// 	      // element.sortable({
// 	      //   revert: true
// 	      // });
// 	      element.draggable({
// 	        revert: true,
// 	        // helper: 'clone',
// 	        // connectToSortable: element.closest('.commentDiv')
// 	      });
// 	    }
// 	}
// })

// app.directive('droppable', function($compile){
// 	return{
// 	    restrict: 'A',
// 	    link: function($scope,element,attrs){
// 	      //This makes an element Droppable
// 	      element.droppable({
// 	        drop:function(event,ui) {
// 	          var dragIndex = angular.element(ui.draggable).data('index'),
// 	              dragEl = angular.element(ui.draggable).parent(),
// 	              dropEl = angular.element(this);
// 	          if (dragEl.data('index') != dropEl.data('index')) {
// 	          	var temp = {};
// 	          	$scope.trlData.map(function(e,i, arr){
// 	          		var elem = e;
// 	          		if (elem.id == dragEl.data('index')) {
// 	          			elem.cards.map(function(card, index, arr){
// 	          				if (card.id == dragIndex) {
// 	          					temp = card;
// 	          					arr.splice(index,1);
// 	          				}
// 	          			});
// 	          		}
// 	          		arr[i] = elem;
// 	          	})
// 	          	$scope.trlData.map(function(e,i, arr){
// 	          		var elem = e;
// 	          		if (elem.id == dropEl.data('index')) {
// 	          			elem.cards.push(temp);
// 	          		}
// 	          		arr[i] = elem;
// 	          	})
// 	          }
// 	          $scope.$apply();
// 	        }
// 	      });
// 	    }
// 	}
// })

app.controller('cmtCtrl',
	function($scope, $rootScope, postService, $compile){
		$scope.comments = {};
		$scope.comments = postService.query();
		$scope.newComments = {text:'', created_at:''};

		$scope.post = function(){
			$scope.newComments.created_by = $rootScope.currentUser;
			$scope.newComments.created_at = Date.now();

			postService.save($scope.newComments,function(){
				$scope.newComments = {text:'', created_at:''};
				$scope.comments = postService.query();
			})
		}
		$scope.editPost = function(id){

        	$('.commentItem .contentEditor').each(function(i,e){
        		var val = $(this).attr('data-prev');
				var cont = '<span class="commentContent">'+val+'</span>';
        		$(this).replaceWith($compile(cont)($scope))
        	})

        	var dest = $('#'+id).find('.commentContent');
        	var content = dest.text();
			var elem = angular.element('<textarea data-prev="'+ content +'" class="form-control commentContent contentEditor" ng-keypress="checkEdit($event)">'+ content +'</textarea>'+
				'');
			dest.replaceWith($compile(elem)($scope))
		}
		$scope.checkEdit = function(e){
			if (e.which === 13){
				var elem = e.target;
				var val = $(elem).val();
				var cid = $(elem).parents('.commentItem').attr('id');

				var newComments = {text:val, created_by:$rootScope.currentUser};
				
				postService.update({id : cid},newComments,function(){
					var cont = '<span class="commentContent">{{comment.text}}</span>';
					$(elem).replaceWith($compile(cont)($scope));
					$scope.comments = postService.query();
				})
			}
		}
		$scope.deletePost = function(id){
			postService.delete({id : id},function(){
					$scope.comments = postService.query();
			})
		}
	})

app.controller('userController',
	function($scope, $rootScope, $http, userService, usearchService, $location){
		$http.get('/auth/check/').success(function (data) {
	    	if (data.state == 'failure') {

	    	}
		});
		$scope.uSearch_param = [
			{
				data:[],
				log:'or'
			},
			{
				data:[],
				log:'or'
			}
		];
    	$scope.user_cred = {_id:'',username:'',fullname:'',email:'',password:''};

		$scope.userList = userService.query(
			// {username:'genji'}
		);

		$scope.uSearch = function(){
			console.log($scope.uSearch_param);
			// var par = JSON.stringify($scope.uSearch_param);

			// $scope.userList = usearchService.query(par);

			$http.post('/users/find',$scope.uSearch_param).success(function (data) {
					// console.log(data)
		    	if (data.state == 'failure') {

		    	}else{
					$scope.userList = data;
		    	}
			});
		}

		$scope.editUser = function(id){
			$http.get('/users/'+id).success(function (data) {
		    	if (data.state == 'failure') {

		    	}else{
			    	$scope.user_cred._id = data._id;
			    	$scope.user_cred.username = data.username;
			    	$scope.user_cred.fullname = data.fullname;
			    	$scope.user_cred.email = data.email;
			    	// $('#modalUserEdit').modal('show');
			    	$('#modalUserEdit').modal('show');
		    	}
			});
			
		}
		$scope.confirmEdit = function(id){			
			userService.update({id : $scope.user_cred._id},$scope.user_cred,function(){
				$scope.user_cred = {_id:'',username:'',fullname:'',email:'',password:''};
				$scope.userList = userService.query();
			    $('#modalUserEdit').modal('hide');
			})
		}
		$scope.deleteUser = function(id){
			$('#modalUserDelete').modal('show');
	    	$scope.user_id = data;
		}
		$scope.confirmDelete = function(){
			userService.delete({id : scope.user_id},function(){
				$scope.userList = userService.query();
			})
	    	$scope.user_id = '';
			$scope.userList = userService.query();
		    $('#modalUserEdit').modal('hide');
		}
		$scope.clearForm = function(id){
			$('#modalUserDelete').find('input').val('');
			$scope.user_cred = {_id:'',username:'',fullname:'',email:'',password:''};
	    	$scope.user_id = '';

		}
	})

app.controller('authController',
	function($scope, $rootScope, $http, $location){
		$scope.user = {username:'', password:''};
		$scope.error_message = '';

		$scope.login = function(){
			$http.post('/auth/login',$scope.user).success(function(data){
				if (data.state == "success") {
					$('.modal').modal('hide');
					$scope.user = {username:'', password:''};
					$scope.error_message = '';
					$rootScope.authenticated = true;
					$rootScope.currentUser = data.user.username;
					$rootScope.currentUserId = data.user._id;
					$location.path('/');
				}
				else{
					$scope.error_message = data.message;
				}
			});
			// $scope.error_message = 'login request for ' + $scope.user.username;
		}
	})
app.controller('regController',
	function($scope, $rootScope, $http, $location){
		$scope.user = {username:'', fullname:'', email:'', password:''};
		$scope.error_message = '';

		$scope.register = function(){
			$http.post('/auth/signup',$scope.user).success(function(data){
				if (data.state == "success") {
					$('.modal').modal('hide');
					$scope.user = {username:'', fullname:'', email:'', password:''};
					$scope.error_message = '';
					$rootScope.authenticated = true;
					$rootScope.currentUser = data.user.username;
					$rootScope.currentUserId = data.user._id;
					$location.path('/');
				}else{
					$scope.error_message = data.message;
				}
			});
		}
	})