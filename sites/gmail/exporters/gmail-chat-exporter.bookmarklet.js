javascript:(
function(){
   var basicUrl = '';
	var results;
	var chatLinks = [];
   
   function getHTML(url, callback){
      window.setTimeout(function(){
			var xhReq = new XMLHttpRequest();
			xhReq.open("GET", url, true); 
			xhReq.onreadystatechange = function(){
				if (xhReq.readyState != 4){ return; }
				try{
					callback(xhReq.responseText);
				}catch(e){}
			};
			xhReq.send(null);
		}, Math.floor(Math.random() * 11) * 300);
   }
	function getQueryString(a){
		var startIndex = a.href.indexOf('?');
		
		if (startIndex >= 0){
			return a.href.substr(startIndex);
		}else{
			return '';
		}
	}
   function setBasicUrl(callback){
      if (document.URL.indexOf('mail/h/') > 0){
         callback(document.URL.split('?')[0]);
      }else{
         getHTML("?ui=html&amp;zy=a", function(html){
            var toFind = '<base href="';
            var startIndex = html.indexOf(toFind);
            var endIndex = html.indexOf('"', startIndex + toFind.length);
            
				basicUrl = html.substring(startIndex + toFind.length, endIndex);
            callback();
         });
      }
   }
	function fetchChatSummaryLinks(url, callback){
		getHTML(url, function(html){
         var anchors;
			var nextUrl = '';

			writeTemp(html);
			anchors = results.document.getElementsByTagName('a');
			
			for (var i = 0, len = anchors.length; i < len; ++i){
				if (anchors[i].href.indexOf('?&v=c&s=q&q=') >= 0){
					chatLinks.push(basicUrl + getQueryString(anchors[i]));
				}else if(anchors[i].innerHTML.indexOf('Older ') >= 0){
					nextUrl = basicUrl + getQueryString(anchors[i]);
				}
			}
			
			if (nextUrl.length > 0){
				fetchChatSummaryLinks(nextUrl, callback);
			}else{
				callback();
			}
      });
	}
	function fetchNextChat(callback){
		getHTML(chatLinks.pop(), function(html){
			try{
				writeTemp(html);
				var date = results.document.getElementsByClassName('msg')[0].parentNode.parentNode.parentNode.parentNode.getElementsByTagName('td')[1].innerHTML;
				writeChat(date + '<br />' + results.document.getElementsByClassName('msg')[0].innerHTML + '<br /><br />');
			}catch(e){}
			
			if (chatLinks.length > 0){
				fetchNextChat(callback);
			}else{
				callback();
			}
      });
	}
	function writeChat(txt){
		results.document.getElementById('chatexporter_Chats').innerHTML += txt;
	}
	function writeStatus(txt){
		results.document.title = txt;
	}
	function writeTemp(txt){
		var start = txt.indexOf('<body');
		var end = txt.indexOf('>', start);
		
		txt = txt.substr(end + 1);
		txt = txt.replace(/<\/body>/g, '');
		txt = txt.replace(/<\/html>/g, '');
		results.document.getElementById('chatexporter_Temp').innerHTML = txt;
	}
	
	setBasicUrl(function(){
		var contact = prompt("Enter the name of the contact", "");
		var qs = '?s=q&q=' + '"chat with ' + contact + '"' + '&nvp_site_mail=Search+Mail';
		
		results = window.open("about:blank", "Chats");
		results.document.write("<html><body><div id='chatexporter_Chats'></div><div id='chatexporter_Temp' style='display:none'></div></body></html>");
		results.document.close();		
		writeStatus('Fetching summaries...');
		fetchChatSummaryLinks(basicUrl + qs, function(){
			writeStatus('Fetching ' + chatLinks.length + ' chats...');
			
			if (chatLinks.length > 0){
				fetchNextChat(function(){
					writeStatus('Chats with ' + contact);
				});
			}else{
				writeStatus('No results.');
				writeChat('No results.');
			}
		});
   });
})();