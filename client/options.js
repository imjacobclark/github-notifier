document.getElementById("addProject").addEventListener("click", function(e){
	var url = 'http://github.com/' + document.querySelector(".org").value + '/' + document.querySelector(".repo").value + '/pulls' ;

	chrome.storage.sync.set({'url': url});

	e.preventDefault();
});