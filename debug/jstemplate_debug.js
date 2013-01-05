/*!
  * jstemplate: a light & fast js tamplate engine
  * License MIT (c) 岑安
  * 
  * Modify by azrael @ 2012/9/28
  */

;(function (name, definition) {
    if (typeof define == 'function') define(definition);
    else if (typeof module != 'undefined') module.exports = definition();
    else this[name] = definition();
})('jstemplate', function () {

    var context = this,
        global = typeof window != 'undefined' ? window : {},
        _cache = {},
        vars = 'var ',
        varsInTpl,
        codeArr = ''.trim ?
        ['ret = "";', 'ret +=', ';', 'ret;']
        :['ret = [];', 'ret.push("', '")', 'ret.join("");'],
        keys = ('break,case,catch,continue,debugger,default,delete,do,else,false,finally,for,function,if'
            + ',in,instanceof,new,null,return,switch,this,throw,true,try,typeof,var,void,while,with'
            // Reserved words
            + ',abstract,boolean,byte,char,class,const,double,enum,export,extends,final,float,goto'
            + ',implements,import,int,interface,long,native,package,private,protected,public,short'
            + ',static,super,synchronized,throws,transient,volatile'
            
            // ECMA 5 - use strict
            + ',arguments,let,yield').split(','),
        keyMap = {};
        
    for (var i = 0, len = keys.length; i < len; i ++) {
        keyMap[keys[i]] = 1;
    }
    
    // 源模版字符串分析，根据开启关闭tag简单化 
    function _getCompileFn (source) {
        var openArr = source.split(jstemplate.openTag),
            tmpCode = '';
        
        console.log('split by openTag: \n' + openArr);
            
        for (var i = 0, len = openArr.length; i < len; i ++) {
            var c = openArr[i],
                cArr = c.split(jstemplate.closeTag);
            if (cArr.length == 1) {
                tmpCode += _html(cArr[0]); // 简单字符串拼接
            } else {
                tmpCode += _js(cArr[0]);
                tmpCode += cArr[1] ? _html(cArr[1]) : '';
            }
        }
    
        var code = vars + codeArr[0] + tmpCode + 'return ' + codeArr[3];
        var fn = new Function('$data', '$getValue', code);
        
        return fn;
    }
    
    function _html (s) {
        s = s
        .replace(/('|"|\\)/g, '\\$1')
        .replace(/\r/g, '\\r')
        .replace(/\n/g, '\\n');
        
        s = codeArr[1] + '"' + s + '"' + codeArr[2];
        
        return s + '\n';
    }
    
    function _js (s) {
        // 带=号的，证明是key，否则直接当作js语句拼起来
        if (/^=/.test(s)) {
            s = codeArr[1] + s.substring(1).replace(/[\s;]*$/, '') + codeArr[2];
        }
        //把js语句中的 变量 提取出来做声明
        dealWithVars(s);
        
        return s + '\n';
    }
    
    function dealWithVars (s) {
        console.log('before filter:\n' + s);
        s = s.replace(/\/\*.*?\*\/|'[^']*'|"[^"]*"|\.[\$\w]+/g, ''); // 过滤[注释],[字符串],[属性值]
        console.log('after filter:\n' + s);
        
        var sarr = s.split(/[^\$\w\d]+/); //按非identify分割，剩下[数字],[关键字],[变量]
        console.log(sarr)
        for (var i = 0, len = sarr.length; i < len; i ++) {
            var c = sarr[i];
            if (!c || keyMap[c] || /^\d/.test(c)) {
                continue;
            }
            if (!varsInTpl[c]) {
                vars += (c + '= $getValue("' + c + '", $data),');
                varsInTpl[c] = 1;
            }
        }
    }
    
    function getValue (v, $data){
        return $data.hasOwnProperty(v) ? $data[v] : global[v];
    }

    function jstemplate (id, source, data) {
        if (typeof arguments[1] == 'object' && arguments[2] == undefined) {
            data = source;
            source = id;
            id = null;
        }
        return (id && _cache[id]) ? _cache[id](data, getValue) : jstemplate.compile(id, source, data);
    }
    
    jstemplate.compile = function (id, source, data) {
        vars = 'var ';
        varsInTpl = {};
        
        var compileFn = _getCompileFn(source);
        if (id) { 
            _cache[id] = compileFn;
        }
        console.log('compileFn: \n' + compileFn)
        return compileFn(data, getValue);
    }
    
    jstemplate.openTag = '<%';
    jstemplate.closeTag = '%>';
    
    context.jstemplate = jstemplate;
    return jstemplate;
  
});