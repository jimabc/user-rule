javascript:
(function(){
    var MAX_TIMEOUT_MILLISECONDS = 1500,
        MIN_TIMEOUT_MILLISECONDS = 500,
        basicUrl = '',
        chatLinks = [],
        // Workaround for the basic version of Gmail limiting the chat results.
        checkForMore = true,
        resultWindow;
        
    // Main
    (function(){
        // Get the url to the basic html version of Gmail
        getBasicUrl(function(url){
            var contact = prompt("Enter the name of the contact", ""),
                qs = '?s=q&q=' + '"chat with ' + contact + '"' + '&nvp_site_mail=Search+Mail';
            
            basicUrl = url;
            
            resultWindow = window.open("about:blank", "Chats");
            resultWindow.document.write("<html><body><div id='chatexporter_Chats'></div><div id='chatexporter_Temp' style='display:none'></div></body></html>");
            resultWindow.document.close();
            
            writeStatus('Searching...');
            
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
    
    function fetchChatSummaryLinks(url, callback){
        getHtmlWithDelay(url, getFetchDelay(), function(html){
            var anchors = [],
                nextUrl = '';

            writeTemp(html);
            anchors = resultWindow.document.getElementsByTagName('a');

            for (var i = 0, len = anchors.length; i < len; ++i){
                if (anchors[i].href.indexOf('?&v=c&s=q&q=') >= 0){
                    chatLinks.push(basicUrl + getQueryString(anchors[i]));
                    checkForMore = true;
                }else if(anchors[i].innerHTML.indexOf('Older ') >= 0){
                    nextUrl = basicUrl + getQueryString(anchors[i]);
                }
            }

            // The basic html version of Gmail limits the number of 
            // chat search results.  The workaround is to manually 
            // increment the querystring's page result index.
            if (nextUrl.length === 0 && checkForMore){
                var index = url.indexOf('&st=');

                if (index > 0){
                    nextUrl = url.substr(0, index) + '&st=' + chatLinks.length;
                }else{
                    nextUrl = url.href + '&st=' + chatLinks.length;
                }
                
                checkForMore = false;
            }

            if (nextUrl.length > 0){
                fetchChatSummaryLinks(nextUrl, callback);
            }else{
                callback();
            }
        });
    };
    function fetchNextChat(callback){
        getHtmlWithDelay(chatLinks.pop(), getFetchDelay(), function(html){
            try{
                writeTemp(html);
                var date = resultWindow.document.getElementsByClassName('msg')[0].parentNode.parentNode.parentNode.parentNode.getElementsByTagName('td')[1].innerHTML;
                writeChat(date + '<br />' + resultWindow.document.getElementsByClassName('msg')[0].innerHTML + '<br /><br />');
            }catch(e){}

            if (chatLinks.length > 0){
                fetchNextChat(callback);
            }else{
                callback();
            }
        });
    };
    
    // Output
    function writeChat(txt){
        resultWindow.document.getElementById('chatexporter_Chats').innerHTML += txt;
    };
    function writeStatus(txt){
        resultWindow.document.title = txt;
    };
    function writeTemp(txt){
        var start = txt.indexOf('<body');
        var end = txt.indexOf('>', start);

        txt = txt.substr(end + 1);
        txt = txt.replace(/<\/body>/g, '');
        txt = txt.replace(/<\/html>/g, '');
        resultWindow.document.getElementById('chatexporter_Temp').innerHTML = txt;
    };
    
    // Utilities
    function getBasicUrl(callback){
        getHtml("?ui=html&amp;zy=a", function(html){
            var toFind = '<base href="';
            var startIndex = html.indexOf(toFind);
            var endIndex = html.indexOf('"', startIndex + toFind.length);

            callback(html.substring(startIndex + toFind.length, endIndex));
        });
    };
    function getFetchDelay(){
        return randomInt(MIN_TIMEOUT_MILLISECONDS, MAX_TIMEOUT_MILLISECONDS);
    };
    function getHtml(url, callback){
        var xhReq = new XMLHttpRequest();
        xhReq.open("GET", url, true); 
        xhReq.onreadystatechange = function(){
            if (xhReq.readyState != 4){ 
                return;
            }
            
            try{
                callback(xhReq.responseText);
            }catch(e){}
        };
        xhReq.send(null);
    };
    function getHtmlWithDelay(url, delay, callback){
        window.setTimeout(function(){
            getHtml(url, callback);
        }, delay);
    };
    function getQueryString(a){
        var startIndex = a.href.indexOf('?');

        if (startIndex >= 0){
            return a.href.substr(startIndex);
        }else{
            return '';
        }
    };
    function randomInt(from, to){
        return Math.floor(Math.random() * (to - from + 1) + from);
    };	
})();