// jquery plugins

$.fn.setEditor = function(){
	console.log($(this).text());
	var content = $(this).text();
	var ed = '<textarea data-prev="'+ content +'" class="form-control commentContent contentEditor" ng-keypress="checkEdit($event, $element.target)">'+ content +'</textarea>';
	$(this).replaceWith(ed);
}