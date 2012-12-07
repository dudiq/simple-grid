/**
 * Modified alphanumeric jquery plugin for other languages
 * fixed regexp, and corrected events
 * 04.12.09
 */
(function($){
	$.fn.alphanumeric = function(p) {
		p = $.extend({
			repl: ""
		  }, p);

        var replaceIt = function (input, newtxt) {
            var ret = "";
            if (newtxt == ""){
                ret = $(input).val();
            } else{
                ret = $(input).val().substring(0, input.selectionStart)+
                      newtxt+
                      $(input).val().substring(input.selectionEnd)
            }
            return ret;
        }

		return this.each(function(){
            var self = this;
            var sets = function (ev){
                var obj = ev.data.self;
                var cMatch = false;
                var allowKeys = [8,9,27,35,36,37,38,39,40,46];
                //keyCode of Esc, backspace, home, end, left, right, etc...
                var val = $(obj).val();
                var re = new RegExp(p.repl);
                if (p.match != undefined){
                    re = new RegExp(p.match, 'g');
                    cMatch = true;
                }
                var testVal = val.replace(re, '') + "";
                if (cMatch){
                    testVal = (val.match(re) != null) ? val.match(re)[0] : "";
                }
                
                

                if (ev != undefined && ev.manual == undefined){
                    var isAllow = false;
                    var charCode = null;
                    if (!ev.charCode) charCode = String.fromCharCode(ev.which);
                        else charCode = String.fromCharCode(ev.charCode);

                    var testChar = charCode.replace(re, "");
                    if (cMatch){
                        testChar = (charCode.match(re) == null) ? "" : charCode.match(re)[0];
                        if (testChar == "" && charCode.replace(re, "") == "-") {
                            testChar = "-";//fix only "-"
                        }
                        if (testChar == "" && charCode.replace(re, "") == ".") {
                            testChar = ".";//fix only "-"
                        }
                    }
                    var replVal = replaceIt(self, testChar);
                    if (cMatch){
                        var newReplVal = (replVal.match(re) == null) ? isAllow = true : replVal.match(re)[0];
                        if (replVal != newReplVal){
                            isAllow = true;
                        }
                        if (replVal == "-"){
                            isAllow = false;
                        }
                        replVal = newReplVal;
                    } else {
                        replVal = replVal.replace(re, '');
                    }

                    var testInt = replVal - 0;
                    //var testInt = testVal - 0 + testChar - 0 ;
                    if (!isNaN(testInt)){
                        if ((p.min != undefined && testVal != "" && parseInt(testInt) < p.min) ||
                            (p.max != undefined && testVal != "" && parseInt(testInt) > p.max)
                            ) {
                            isAllow = true;
                        }
                    }
                    if (p.maxChars != undefined && p.maxChars != ""){
                        testChar = '';
                        if (!isNaN(p.maxChars) && testVal.length < p.maxChars){
                            testChar = 'true';
                            isAllow = false;
                        } else {
                            testVal = testVal.substring(0, p.maxChars);
                            $(obj).val(testVal);
                        }
                    }
                    
                    if (testChar == ''){
                        //check key codes, if testChar passed
                        var keyCode = ev.keyCode;
                        isAllow = true;
                        for (var i in allowKeys){
                            if (keyCode == allowKeys[i])
                                isAllow = false;
                        }
                    }
                    if (isAllow){
                        ev.preventDefault();
                    }

                }
            }
            
            $(this).unbind('keypress click change keyup', sets);
            
            sets({data: {self: self}, manual: true});
            $(this).bind('keypress click change keyup', {self: self}, sets);
          
        });
	};

	$.fn.numericParse = function(p) {
		var match = "^\\s*[+-]?\\d*";// + - int numbers
        if (p != undefined && p.isFloat != undefined && p.isFloat == true){
            match = "^\\s*[+-]?\\d+(\\.?)\\d*";// + - float numbers
        }

        if (p != undefined && p.isPercent != undefined && p.isPercent == true){
            match = undefined;
            var allow = /[\D\.,]+/g;
            p = $.extend({
                repl: allow,
                min: 0,
                max: 100
            }, p);
        }
		p = $.extend({
			match: match
		  }, p);	
		return this.each (function(){
            $(this).alphanumeric(p);
        });	
	};

	$.fn.alpha = function(p) {
		var allow = /[\d]+/g;
		p = $.extend({
			repl: allow
		  }, p);
		return this.each (function(){
            $(this).alphanumeric(p);
        }
		);
	};

	$.fn.maxChars = function(maxChars) {
		var allow = "";
		var p = {maxChars: maxChars, repl: allow};

		return this.each (function(){
            $(this).alphanumeric(p);
        }
		);
	};

})(jQuery);
