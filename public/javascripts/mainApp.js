var app = angular.module('myTestApp', ['ngRoute', 'ngCookies', 'ngResource', 'angularMoment','googlechart']).run(function($rootScope, $http, $window) {
  $rootScope.authenticated = false;
  $rootScope.currentUser = '';
  $rootScope.currentUserId = '';

  $rootScope.signout = function() {
    // $http.get('/auth/signout');
    $http.get('/api/signOut').success(function(){
      $window.location.reload();
    });

    $rootScope.authenticated = false;
    $rootScope.currentUser = '';
    $rootScope.currentUserId = '';
  }
});

app.config(function($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'bd.html',
      controller: 'bdCtrl'
    })
    .when('/list/:id', {
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
    .otherwise({ redirectTo: '/' });
});

app.factory('postService', function($resource) {
  return $resource('/api/posts/:id', null, { update: { method: 'PUT' } });
})

app.factory('userService', function($resource) {
  return $resource('/users/:id', null, { update: { method: 'PUT' } });
})
app.factory('usearchService', function($resource) {
  return $resource('/users/find/:id', null, { update: { method: 'PUT' } });
})

app.run(function($rootScope, $location, $http, postService, $cookies) {
  // console.log($cookies['TokenAuth'])

  $http.get('/auth/check/').success(function(data) {
    if (data.state == 'success') {
      $rootScope.authenticated = true;
      $rootScope.currentUser = data.user.username;
      $rootScope.currentUserId = data.user._id;
    } else {
      $rootScope.authenticated = false;
      $rootScope.currentUser = '';
      $rootScope.currentUserId = '';
    }
  });
})

app.controller('bdCtrl', function($scope, $rootScope, $compile, $http, $window){
  $scope.bdData = [];
  $rootScope.trlData = [];

  $http.get('/api/board/').success(function(data) {
    if (data.auth) {
      $window.location.href = data.url;
    }else{
      $scope.bdData = data;
    }
    // console.log($scope.trlData);
  });

})

app.controller('trlCtrl', function($scope, $rootScope, $compile, $http, $routeParams, $window) {
  var nd = new Date();

  String.prototype.toTimeFormat = function() {
    seconds = Math.floor(parseInt(this) / 1000);
    minutes = Math.floor(seconds / 60);
    hours = Math.floor(minutes / 60);
    days = Math.floor(hours / 24);

    hours = hours - (days * 24);
    minutes = minutes - (days * 24 * 60) - (hours * 60);

    r = '';

    if (days > 0) { r = r + days + ' days, '; }
    if (hours > 0) { r = r + hours + ' hours '; }
    if (minutes > 0) { r = r + minutes + ' minutes '; }
    if (seconds > 0 && minutes <1 && hours <1 && days <1) { r = r + seconds % 60 + ' seconds '; }

    return r;
  }

  $scope.trlData = [];

  $scope.toDate = function(e) {
    var s = e.substring(0, 8);
    var p = parseInt(s, 16);
    var e = p * 1000;
    var d = new Date(e);
    return d.toISOString();
  }

  $scope.currentListIndex = 0;

  var getTotalSpend = function(card, idList) {
    if (!card.actions.length)
      return "0";
    else {
      var currentList = "";
      var currentTime = new Date();
      var spendTime = 0;
      var tempSpend = "";
      var recordDate = "";
      var lastPosition = ""; // temp variable to capture very last LIST before it moved to another list
      var i = 0;
      card.actions.forEach(function(entry) {
        if (currentList !== entry.data.listAfter.id && entry.data.listAfter.id === idList) {
          tempSpend = currentTime.getTime() - new Date(entry.date).getTime();
          currentTime = new Date(entry.date);
          spendTime = parseInt(spendTime) + parseInt(tempSpend);
        } else {
          currentTime = new Date(entry.date);
        }
        lastPosition = entry.data.listBefore.id;
      });

      //calc spend time from the first time card created until moved to the second list.
      if (lastPosition === idList) {
        
        var e = card.id;
        var s = e.substring(0, 8);
        var p = parseInt(s, 16);
        var e = p * 1000;
        var d = new Date(e);

        tempSpend = currentTime.getTime() - d.getTime();
        spendTime = parseInt(spendTime) + parseInt(tempSpend);
      }

      var time = {
        orig: spendTime,
        format: spendTime.toString().toTimeFormat()
      }
      return time;
    }
  }
  
  $http.get('/api/board/list/'+$routeParams.id).success(function(data) {
    if (data.auth) {
      $window.location.href = data.url;
    }

    var listData = [];
    var dist = [];
    var allHistory = [];
    var allLabel = [];

    var stSelect = [ 'indonesia', 'vietnam' ]

    data.forEach(function(list, index){
      var nList = {
        name: list.name,
        id: list.id,
        cards: [],
        max_time: {
          orig: 0,
          format: '0'
        },
        max_history_time: {
          orig: 0,
          format: '0'
        },
        min_time: {
          orig: 1.7976931348623157E+10308,
          format: '0'
        },
        min_history_time: {
          orig: 1.7976931348623157E+10308,
          format: '0'
        },
      }
      if (list.cards.length) {
        list.cards.forEach(function(card, indexCard){
          card.history = [];
          card.label_filtered = [];
          card.label_filtered_name = [];
          var history = [];
          if (card.labels.length) {
            card.labels.forEach(function(label, indexLabel){
              if (allLabel.indexOf() < 0) {
                if (stSelect.indexOf(label.name) > -1) {
                  allLabel[label.id] = label;
                }
                card.label_filtered.push(label.id);
                card.label_filtered_name.push(label.name);
              }
            })
          }
          if (card.actions.length) {
            card.actions.forEach(function(entry,indexAction) {
              if(history.indexOf() < 0){
                history[entry.data.listAfter.id] = {
                  card_name: card.name,
                  card_id: card.id,
                  card_label: card.labels,
                  card_label_filtered: card.label_filtered,
                  card_label_filtered_name: card.label_filtered_name,
                  name: entry.data.listAfter.name,
                  id: entry.data.listAfter.id,
                  total: getTotalSpend(card, entry.data.listAfter.id)
                };
              }
              if (indexAction == card.actions.length - 1) {
                history[entry.data.listBefore.id] = {
                  card_name: card.name,
                  card_id: card.id,
                  card_label: card.labels,
                  card_label_filtered: card.label_filtered,
                  card_label_filtered_name: card.label_filtered_name,
                  name: entry.data.listBefore.name,
                  id: entry.data.listBefore.id,
                  total: getTotalSpend(card, entry.data.listBefore.id)
                };
              }
            });
            for(h in history){
              card.history.push(history[h]);
              if (dist[h]) {
                dist[h].total.orig += history[h].total.orig;
                dist[h].total.format = dist[h].total.orig.toString().toTimeFormat();
              }else{
                dist[h] = {
                  total: {
                    orig: parseInt(history[h].total.orig)
                  }
                };
              }
              // var maxhistorytime = nList.max_history_time.orig > history[h].total.orig ? nList.max_history_time.orig : history[h].total.orig;
              // var minhistorytime = nList.min_history_time.orig < history[h].total.orig ? nList.min_history_time.orig : history[h].total.orig;
              // nList.max_history_time = {
              //   orig: maxhistorytime,
              //   format: maxhistorytime.toString().toTimeFormat()
              // }
              // nList.min_history_time = {
              //   orig: minhistorytime,
              //   format: minhistorytime < (1.7976931348623157E+10308) ? minhistorytime.toString().toTimeFormat() : '0'
              // }
              // console.log(history[h]);
            }
            var maxtime = nList.max_time.orig > card.history[0].total.orig ? nList.max_time.orig : card.history[0].total.orig;
            var mintime = nList.min_time.orig < card.history[0].total.orig ? nList.min_time.orig : card.history[0].total.orig;
            nList.max_time = {
              orig: maxtime,
              format: maxtime.toString().toTimeFormat()
            }
            nList.min_time = {
              orig: mintime,
              format: mintime < (1.7976931348623157E+10308) ? mintime.toString().toTimeFormat() : '0'
            }
            card.latest = card.history[0];
          }else{
            var dd = nd - new Date(parseInt((card.id).substring(0,8),16)*1000); 

            var maxtime = nList.max_time.orig > dd ? nList.max_time.orig : dd;
            var mintime = nList.min_time.orig < dd ? nList.min_time.orig : dd;
            nList.max_time = {
              orig: maxtime,
              format: maxtime.toString().toTimeFormat()
            }
            nList.min_time = {
              orig: mintime,
              format: mintime < (1.7976931348623157E+10308) ? mintime.toString().toTimeFormat() : '0'
            }

            card.total = {
              orig: dd,
              format: dd.toString().toTimeFormat()
            }
            history[card.idList] = {
              card_name: card.name,
              card_id: card.id,
              card_label: card.labels,
              card_label_filtered: card.label_filtered,
              card_label_filtered_name: card.label_filtered_name,
              name: list.name,
              id: list.id,
              total: {
                orig: dd,
                format: dd.toString().toTimeFormat()
              }
            };
            if (dist[card.idList]) {
              dist[card.idList].total.orig += nd - new Date(parseInt((card.id).substring(0,8),16)*1000);
              dist[card.idList].total.format = dist[card.idList].total.orig.toString().toTimeFormat();
            }else{
              var thisDiff = nd - new Date(parseInt((card.id).substring(0,8),16)*1000)
              dist[card.idList] = {
                total: {
                  orig: thisDiff,
                  format: thisDiff.toString().toTimeFormat()
                }
              };
            }
            
          }
          allHistory.push(history);
          nList.cards.push(card);
        });
      }
      listData.push(nList);
    });

    listData.forEach(function(elem, index){
      listData[index].ghost = [];

      allHistory.forEach(function(hist,histIndex){
        for (h in hist){
          if (hist[h] && hist[h].id == elem.id) {
            listData[index].ghost.push(hist[h]);
            var maxhistorytime = listData[index].max_history_time.orig > hist[h].total.orig ? listData[index].max_history_time.orig : hist[h].total.orig;
            var minhistorytime = listData[index].min_history_time.orig < hist[h].total.orig ? listData[index].min_history_time.orig : hist[h].total.orig;
            listData[index].max_history_time = {
              orig: maxhistorytime,
              format: maxhistorytime.toString().toTimeFormat()
            }
            listData[index].min_history_time = {
              orig: minhistorytime,
              format: minhistorytime < (1.7976931348623157E+10308) ? minhistorytime.toString().toTimeFormat() : '0'
            }
          }
        }
      });

      if (dist[elem.id]) {
        listData[index].total = dist[elem.id].total;
        var totalList = 0;
        var totalListFormat = '';
        elem.cards.forEach(function(card, cardIndex){
          if (card.latest) {
            totalList += card.latest.total.orig;
          }else{
            totalList += nd - new Date(parseInt((card.id).substring(0,8),16)*1000);
          }
        })
        listData[index].total_list = {
          orig : totalList,
          format : totalList.toString().toTimeFormat()
        }
      }else{
        listData[index].total = {
          orig : 0,
          format : (0).toString().toTimeFormat()
        }
        listData[index].total_list = {
          orig : 0,
          format : (0).toString().toTimeFormat()
        }
      }
      var avgList = Math.round(listData[index].total_list.orig / listData[index].cards.length);
      var avgHistory = Math.round(listData[index].total.orig / listData[index].ghost.length);
      listData[index].avg_time = {
        orig: avgList,
        format: avgList.toString().toTimeFormat()
      }
      listData[index].avg_history_time = {
        orig: avgHistory,
        format: avgHistory.toString().toTimeFormat()
      }
    });

    for(l in allLabel){
      allLabel.push(allLabel[l]);
    }
    
    $scope.trlData = listData;
    // $rootScope.trlData = listData;
    $scope.labels = allLabel;

    $scope.labelSet = '';

    $scope.setLabel = function(){
      var nListData = [];

      // console.log($scope.labelSet)

      listData.forEach(function(list, listIndex){

        listData[listIndex].total = {
          orig: 0,
          format: '0'
        }
        listData[listIndex].total_list = {
          orig: 0,
          format: '0'
        }
        listData[listIndex].max_time = {
          orig: 0,
          format: '0'
        }
        listData[listIndex].max_history_time = {
          orig: 0,
          format: '0'
        }
        listData[listIndex].min_time = {
          orig: 1.7976931348623157E+10308,
          format: '0'
        }
        listData[listIndex].min_history_time = {
          orig: 1.7976931348623157E+10308,
          format: '0'
        }
        listData[listIndex].avg_time = {
          orig: 0,
          format: '0'
        }
        listData[listIndex].avg_history_time = {
          orig: 0,
          format: '0'
        }

        var countCard = 0;
        var countGhost = 0;

        if (list.cards) {
          list.cards.forEach(function(card, cardIndex){
            if (card.label_filtered.indexOf($scope.labelSet) > -1 || !$scope.labelSet) {
              countCard++;
              var created = nd - new Date(parseInt((card.id).substring(0,8),16)*1000);
              var countTotal, minTime, maxTime;
              if (card.latest) {
                countTotal = listData[listIndex].total_list.orig + card.latest.total.orig;
                minTime = listData[listIndex].min_time.orig < card.latest.total.orig ? listData[listIndex].min_time.orig : card.latest.total.orig;
                maxTime = listData[listIndex].max_time.orig > card.latest.total.orig ? listData[listIndex].max_time.orig : card.latest.total.orig;
              }else{
                countTotal = listData[listIndex].total_list.orig + created;
                minTime = listData[listIndex].min_time.orig < created ? listData[listIndex].min_time.orig : created;
                maxTime = listData[listIndex].max_time.orig > created ? listData[listIndex].max_time.orig : created;
              }
              listData[listIndex].total_list = {
                orig: countTotal,
                format: countTotal.toString().toTimeFormat()
              }

              listData[listIndex].min_time = {
                orig: minTime,
                format: minTime < (1.7976931348623157E+10308) ? minTime.toString().toTimeFormat() : '0'
              }

              listData[listIndex].max_time = {
                orig: maxTime,
                format: maxTime.toString().toTimeFormat()
              }

            }
          });
        }
        if (list.ghost) {
          list.ghost.forEach(function(card, cardIndex){
            if (card.card_label_filtered.indexOf($scope.labelSet) > -1 || !$scope.labelSet) {
              countGhost++;

              var countTotal = listData[listIndex].total_list.orig + card.total.orig;
              var minHistoryTime = listData[listIndex].min_history_time.orig < card.total.orig ? listData[listIndex].min_history_time.orig : card.total.orig;
              var maxHistoryTime = listData[listIndex].max_history_time.orig > card.total.orig ? listData[listIndex].max_history_time.orig : card.total.orig;

              listData[listIndex].total = {
                orig: countTotal,
                format: countTotal.toString().toTimeFormat()
              }
              listData[listIndex].min_history_time = {
                orig: minHistoryTime,
                format: minHistoryTime < (1.7976931348623157E+10308) ? minHistoryTime.toString().toTimeFormat() : '0'
              }
              listData[listIndex].max_history_time = {
                orig: maxHistoryTime,
                format: maxHistoryTime.toString().toTimeFormat()
              }
            }
          });
        }

        var avgTotal = listData[listIndex].total_list.orig > 0 ? listData[listIndex].total_list.orig/countCard : 0;
        var avgHistoryTotal = listData[listIndex].total.orig > 0 ? listData[listIndex].total.orig/countGhost : 0;

        listData[listIndex].avg_time = {
          orig: avgTotal,
          format: avgTotal > 0 ? avgTotal.toString().toTimeFormat() : '0'
        }
        listData[listIndex].avg_history_time = {
          orig: avgHistoryTotal,
          format: avgHistoryTotal > 0 ? avgHistoryTotal.toString().toTimeFormat() : '0'
        }

      });

      // $scope.trlData = listData;

      // console.log($scope.labelSet);
    }
    console.log(listData);
    // console.log(allLabel);

    $scope.GData = [
      ['Origin', 'Indonesia', 'Vietnam', 'Undocumented', {role: 'annotation'}]
    ];

    listData.forEach(function(list, indexList){
      var nArray = [list.name,0,0,0,''];
      var check = {indonesia:0, vietnam:0, ud:0};
      list.cards.forEach(function(card, indexCard){
        var is = 0;
        stSelect.forEach(function(e,i){
          if (card.label_filtered_name.indexOf(e) > -1) {
            nArray[i+1] += 1;
            // check[e] += 1;
            is = 1;
          }
        });
        if (!is) {
          // check.ud += 1;
          nArray[stSelect.length+1] += 1;
        }
      })
      $scope.GData.push(nArray);
    })


    // console.log($scope.GData);
    $scope.setChartParam = {
      indonesia : true,
      vietnam : true,
      undocumented : true
    }

    $scope.reChart = function(){
      $scope.GData = [
        ['Origin']
      ];
      $scope.GChartData.options.colors = [];

      if ($scope.setChartParam.indonesia) {
        $scope.GData[0].push('Indonesia');
        $scope.GChartData.options.colors.push('#EB5A46');
      }
      if ($scope.setChartParam.vietnam) {
        $scope.GData[0].push('Vietnam');
        $scope.GChartData.options.colors.push('#C377E0');
      }
      if ($scope.setChartParam.undocumented) {
        $scope.GData[0].push('Undocumented');
        $scope.GChartData.options.colors.push('#c1c1c1');
      }
      $scope.GData[0].push({role:'annotation'});

      console.log($scope.setChartParam)
      listData.forEach(function(list, indexList){
        var nArray = {name:list.name};
        nArray.indonesia = 0;
        nArray.vietnam = 0;
        nArray.undocumented = 0;
        nArray.annotation = '';

        list.cards.forEach(function(card, indexCard){
          var is = 0;
          if (card.label_filtered_name.indexOf('indonesia') > -1 || card.label_filtered_name.indexOf('vietnam') > -1) {
            is = 1;
          }
          if ($scope.setChartParam.indonesia && card.label_filtered_name.indexOf('indonesia') > -1) {
            nArray['indonesia'] +=1;
          }
          if ($scope.setChartParam.vietnam && card.label_filtered_name.indexOf('vietnam') > -1) {
            nArray['vietnam'] +=1;
          }
          if ($scope.setChartParam.undocumented && !is) {
            nArray['undocumented'] +=1;
          }
        })
        console.log(nArray)
        var arr = []
        for(i in nArray){
          if (i == 'name' || i == 'annotation') {
            arr.push(nArray[i]);
          }
          if ($scope.setChartParam.indonesia && i == 'indonesia') {
            arr.push(nArray[i]);
          }
          if ($scope.setChartParam.vietnam && i == 'vietnam') {
            arr.push(nArray[i]);
          }
          if ($scope.setChartParam.undocumented && i == 'undocumented') {
            arr.push(nArray[i]);
          }
        }

        $scope.GData.push(arr);
      })
      console.log($scope.GData);
      $scope.GChartData.data = google.visualization.arrayToDataTable($scope.GData);
    }

    $scope.showChart = function(){
      $scope.chartFlag = 1;
      var GData = google.visualization.arrayToDataTable($scope.GData);
      $scope.GChartData = {
        type : 'ColumnChart',
        data : GData,
        options : {
          legend: { position: 'top', maxLines: 3 },
          bar: { groupWidth: '75%' },
          isStacked: false,
          colors: []
        }
      }

      if ($scope.setChartParam.indonesia) {
        $scope.GData[0].push('Indonesia');
        $scope.GChartData.options.colors.push('#EB5A46');
      }
      if ($scope.setChartParam.vietnam) {
        $scope.GData[0].push('Vietnam');
        $scope.GChartData.options.colors.push('#C377E0');
      }
      if ($scope.setChartParam.undocumented) {
        $scope.GData[0].push('Undocumented');
        $scope.GChartData.options.colors.push('#c1c1c1');
      }
    }
    $scope.hideChart = function(){
      $scope.chartFlag = 0;
    }

  });
  
})

// app.directive('barCharts', function(){

// })

// app.directive('draggable', function(){
//  return{
//      // A = attribute, E = Element, C = Class and M = HTML Comment
//      restrict:'A',
//      //The link function is responsible for registering DOM listeners as well as updating the DOM.
//      link: function(scope, element, attrs) {
//        // element.sortable({
//        //   revert: true
//        // });
//        element.draggable({
//          revert: true,
//          // helper: 'clone',
//          // connectToSortable: element.closest('.commentDiv')
//        });
//      }
//  }
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
  function($scope, $rootScope, postService, $compile) {
    $scope.comments = {};
    $scope.comments = postService.query();
    $scope.newComments = { text: '', created_at: '' };

    $scope.post = function() {
      $scope.newComments.created_by = $rootScope.currentUser;
      $scope.newComments.created_at = Date.now();

      postService.save($scope.newComments, function() {
        $scope.newComments = { text: '', created_at: '' };
        $scope.comments = postService.query();
      })
    }
    $scope.editPost = function(id) {

      $('.commentItem .contentEditor').each(function(i, e) {
        var val = $(this).attr('data-prev');
        var cont = '<span class="commentContent">' + val + '</span>';
        $(this).replaceWith($compile(cont)($scope))
      })

      var dest = $('#' + id).find('.commentContent');
      var content = dest.text();
      var elem = angular.element('<textarea data-prev="' + content + '" class="form-control commentContent contentEditor" ng-keypress="checkEdit($event)">' + content + '</textarea>' +
        '');
      dest.replaceWith($compile(elem)($scope))
    }
    $scope.checkEdit = function(e) {
      if (e.which === 13) {
        var elem = e.target;
        var val = $(elem).val();
        var cid = $(elem).parents('.commentItem').attr('id');

        var newComments = { text: val, created_by: $rootScope.currentUser };

        postService.update({ id: cid }, newComments, function() {
          var cont = '<span class="commentContent">{{comment.text}}</span>';
          $(elem).replaceWith($compile(cont)($scope));
          $scope.comments = postService.query();
        })
      }
    }
    $scope.deletePost = function(id) {
      postService.delete({ id: id }, function() {
        $scope.comments = postService.query();
      })
    }
  })

app.controller('userController',
  function($scope, $rootScope, $http, userService, usearchService, $location) {
    $http.get('/auth/check/').success(function(data) {
      if (data.state == 'failure') {

      }
    });
    $scope.uSearch_param = [{
      data: [],
      log: 'or'
    }, {
      data: [],
      log: 'or'
    }];
    $scope.user_cred = { _id: '', username: '', fullname: '', email: '', password: '' };

    $scope.userList = userService.query(
      // {username:'genji'}
    );

    $scope.uSearch = function() {
      console.log($scope.uSearch_param);
      // var par = JSON.stringify($scope.uSearch_param);

      // $scope.userList = usearchService.query(par);

      $http.post('/users/find', $scope.uSearch_param).success(function(data) {
        // console.log(data)
        if (data.state == 'failure') {

        } else {
          $scope.userList = data;
        }
      });
    }

    $scope.editUser = function(id) {
      $http.get('/users/' + id).success(function(data) {
        if (data.state == 'failure') {

        } else {
          $scope.user_cred._id = data._id;
          $scope.user_cred.username = data.username;
          $scope.user_cred.fullname = data.fullname;
          $scope.user_cred.email = data.email;
          // $('#modalUserEdit').modal('show');
          $('#modalUserEdit').modal('show');
        }
      });

    }
    $scope.confirmEdit = function(id) {
      userService.update({ id: $scope.user_cred._id }, $scope.user_cred, function() {
        $scope.user_cred = { _id: '', username: '', fullname: '', email: '', password: '' };
        $scope.userList = userService.query();
        $('#modalUserEdit').modal('hide');
      })
    }
    $scope.deleteUser = function(id) {
      $('#modalUserDelete').modal('show');
      $scope.user_id = data;
    }
    $scope.confirmDelete = function() {
      userService.delete({ id: scope.user_id }, function() {
        $scope.userList = userService.query();
      })
      $scope.user_id = '';
      $scope.userList = userService.query();
      $('#modalUserEdit').modal('hide');
    }
    $scope.clearForm = function(id) {
      $('#modalUserDelete').find('input').val('');
      $scope.user_cred = { _id: '', username: '', fullname: '', email: '', password: '' };
      $scope.user_id = '';

    }
  })

app.controller('authController',
  function($scope, $rootScope, $http, $location) {
    $scope.user = { username: '', password: '' };
    $scope.error_message = '';

    $scope.login = function() {
      $http.post('/auth/login', $scope.user).success(function(data) {
        if (data.state == "success") {
          $('.modal').modal('hide');
          $scope.user = { username: '', password: '' };
          $scope.error_message = '';
          $rootScope.authenticated = true;
          $rootScope.currentUser = data.user.username;
          $rootScope.currentUserId = data.user._id;
          $location.path('/');
        } else {
          $scope.error_message = data.message;
        }
      });
      // $scope.error_message = 'login request for ' + $scope.user.username;
    }
  })
app.controller('regController',
  function($scope, $rootScope, $http, $location) {
    $scope.user = { username: '', fullname: '', email: '', password: '' };
    $scope.error_message = '';

    $scope.register = function() {
      $http.post('/auth/signup', $scope.user).success(function(data) {
        if (data.state == "success") {
          $('.modal').modal('hide');
          $scope.user = { username: '', fullname: '', email: '', password: '' };
          $scope.error_message = '';
          $rootScope.authenticated = true;
          $rootScope.currentUser = data.user.username;
          $rootScope.currentUserId = data.user._id;
          $location.path('/');
        } else {
          $scope.error_message = data.message;
        }
      });
    }
  })
