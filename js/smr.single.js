/*
 * Copyright (c) 2015 simiraaaa
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */


//namespaceを定義する
//smrが定義済みの場合はsmr.single
//smrが未定義ならsmr
; (function (global, undefined) {

    "use strict";

    //smr.singleオブジェクト
    var smr = {};

    if (global.smr) {
        global.smr.single = smr;
    } else {
        global.smr = smr;
    }

    smr.global = global;


    //拡張
    //smr.Object.prototype.extendと同じ
    smr.extend = function extend(o, ex) {
        for (var k in ex) {
            o[k] = ex[k];
        }
        return o;
    };

    //安全拡張
    //smr.Object.prototype.safeとは微妙に違う
    smr.safe = function safe(o, ex) {
        for (var k in ex) {
            if (o[k] === undefined) o[k] = ex[k];
        }
        return o;
    };


    //util.js



    var util = {};

    (function (util) {


        var EQUAL = "=", AMP = "&";
        var encodeURIComponent = global.encodeURIComponent;

        util.queryString = {

            /**
             * dataオブジェクトを key eq data[key] amp key eq data[key]な感じにする
             * 
             * @param data
             * @param encode
             *            デフォルト true //falseを指定するとそのまま結合
             * @param eq
             *            デフォルト "="
             * @param amp
             *            デフォルト "&"
             * @returns
             */
            stringify: function (data, encode, eq, amp) {
                eq = eq || EQUAL;
                amp = amp || AMP;
                encode = (encode === undefined) || encode;

                var query = [];

                if (encode) {
                    for (var key in data) {
                        query[query.length] = encodeURIComponent(key) + eq + encodeURIComponent(data[key]);
                    }
                } else {
                    for (var key in data) {
                        query[query.length] = key + eq + data[key];
                    }
                }
                return query.join(amp);
            },
            /**
             * "="以外をencodeURIComponentする
             */
            encodeURINonEqual: function (s) {
                var ar = s.split(EQUAL);
                for (var i = 0, len = ar.length; i < len; ++i) {
                    ar[i] = encodeURIComponent(ar[i]);
                }
                return ar.join(EQUAL);
            },

            parse: function () {
                alert("smr.util.parse:あとで作る");
            }
        };


    })(util);


    smr.util = util;


    //ajax.js

    smr.ajax = (function () {

        var DOMParser = global.DOMParser;
        var JSON = global.JSON;
        var XMLHttpRequest = global.XMLHttpRequest;
        var CALLBACK = "callback";
        var callbackName = "smr.callbackFunctions";
        var callbackCount = 0;
        var head = null;
        var callbackFunctions = [];

        smr.callbackFunctions = callbackFunctions;

        var FormData = global.FormData;

        var DEFAULT_PARAMS = {
            type: "GET",
            async: true,
            encode: true,
            data: null,
            contentType: "application/x-www-form-urlencoded",
            charset: null,
            dataType: "text",
            responseType: null, // blob or arraybuffer
            username: null,
            password: null,
            success: function (data) {
                alert("success!!\n" + data);
            },
            error: function (data) {
                alert("error!!");
            },
            beforeSend: null,
        };

        var NOT_PARSE = function (data) {
            return data;
        };

        var PARSER_TABLE = {
            /**
             * @memberOf PARSER_TABLE
             */

            /**
             * なにもしない
             */
            undefined: NOT_PARSE,

            /**
             * なにもしない
             */
            "": NOT_PARSE,

            /**
             * なにもしない
             */
            text: NOT_PARSE,
            /**
             * XMLにparseして返す。
             *
             * @param data
             * @returns
             */
            xml: function (data) {
                return new DOMParser().parseFromString(data, "text/xml");
            },
            /**
             * divを生成しその中のinnerHTMLに追加して返す。
             */
            dom: function (data) {
                var div = document.createElement("div");
                div.innerHTML = data;
                return div;
            },

            /**
             * JSON.parseして返す
             *
             * @param data
             * @returns
             */
            json: function (data) {
                try {
                    return JSON.parse(data);
                } catch (e) {
                    console.dir(e);
                    console.dir(data);
                }
            },

            /**
             * scriptを実行する
             *
             * @param data
             * @returns
             */
            script: function (data) {
                eval(data);
                return data;
            },

            /**
             * byte配列を返す
             *
             * @param data
             * @returns {Array}
             */
            bin: function (data) {
                var bytearray = [];
                for (var i = 0, len = data.length; i < len; ++i) {
                    bytearray[i] = data.charCodeAt(i) & 0xff;
                }
                return bytearray;
            },

        };

        /**
         * @param params
         *            defaut={ <br>
         *            type : "GET",//or "POST"<br>
         *            async : true,//or false <br>
         *            encode : true,//or false dataをencodeURIComponentするかそのままか<br>
         *            data : null,//POST時に送信するデータ GET時のクエリ文字列<BR>
         *            //{key:value}の形式のオブジェクトでも指定できる<br>
         *            contentType : "application/x-www-form-urlencoded",<br>
         *            charset :
         *            null,//指定するとcontentTypeに";charset="+charsetの形式で追加される<br>
         *            dataType : "text",//受け取りたいデータのタイプ
         *            text,xml,dom,json,bin,script<br>
         *            responseType : null, // blob or arraybuffer<br>
         *            username : null,<br>
         *            password : null, <br>
         *            success : function(data) { alert("success!!\n" + data);
         *            },//成功時に実行する関数 <br>
         *            error : function(data) { alert("error!!"); },//失敗時に実行する関数<br>
         *            beforeSend : null, <br>}
         */
        var ajax = function (params) {
            for (var key in DEFAULT_PARAMS) {
                params[key] = params[key] === undefined ? DEFAULT_PARAMS[key] : params[key];
            }
            var xhr = new XMLHttpRequest();
            var parseFunc = PARSER_TABLE[params.dataType];

            if (params.charset) {
                params.contentType += ";charset=" + params.charset;
            }

            var type = params.type = params.type.toUpperCase();

            if (params.data) {
                var data = params.data;
                params.data = null;
                var qs = "";
                if (typeof data === "string") {
                    qs = params.encode ? smr.util.queryString.encodeURINonEqual(data) : data;
                } else if (!(data instanceof FormData)) {
                    qs = smr.util.queryString.stringify(data, params.encode);
                } else {
                    qs = data;
                }

                if (type === "GET") {
                    params.url += "?" + qs;
                } else if (type === "POST") {
                    params.data = qs;
                }
            }
            xhr.open(type, params.url, params.async, params.username, params.password);

            if (type === "POST" && !(params.data instanceof FormData)) {
                xhr.setRequestHeader("Content-Type", params.contentType);
            }

            if (params.responseType) {
                xhr.responseType = params.responseType;
            }

            if (params.beforeSend) {
                params.beforeSend(xhr);
            }

            if (params.password) {
                xhr.withCredentials = true;
            }

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    var stat = xhr.status;
                    // 0はローカル用?
                    if (stat === 200 || stat === 201 || stat === 0) {
                        if (xhr.responseType !== "arraybuffer" && xhr.responseType !== "blob") {
                            var data = parseFunc(xhr.responseText);
                            params.success(data);
                        } else {
                            params.success(xhr.response);
                        }
                    } else {
                        params.error(xhr.responseText);
                    }
                } else {
                    // ロード完了時以外
                }
            };

            xhr.send(params.data);

            return xhr;

        };
        ajax.load = ajax;

        /**
          * JSONPを読み込む
          *
          * @param url
          * @param callback
          *            コールバック関数
          * @param callbackKey
          *            デフォルト callback
          */
        ajax.loadJSONP = function (url, callback, callbackKey) {
            callbackKey = callbackKey || CALLBACK;
            callbackFunctions[callbackCount] = callback;
            var name = callbackName + "[" + callbackCount + "]";
            ++callbackCount;
            url += (url.indexOf("?") === -1 ? "?" : "&") + callbackKey + "=" + name;
            if (!head) {
                head = global.document.head;
            }

            var script = document.createElement("script");
            smr.extend(script, {
                type: "text/javascript",
                charset: "UTF-8",
                src: url
            });

            script.setAttribute("defer", true);
            head.appendChild(script);
            return script;
        };

        return ajax;
    })();


    //google.js

    smr.google = (function () {

        var
        //shortenerAPIのurl
        SHORTENER_URL = "https://www.googleapis.com/urlshortener/v1/url?key=",

        //ajaxのデフォルトのerrorの時の関数
        DEFAULT_ERROR_FUNCTION = function error(text) { console.error(text); },

        window = global,

        //JSON
        JSON = window.JSON,

        //APIのキー
        DEFAULT_API_KEYS = {
            short: "AIzaSyAY-kv1znRD6gmjEAlEfV2p4TFu3gTWfyc"
        };

        /*
          smr.google
        */
        var google = {

            /*
              短いURLを取得します
              
              @param params 次の形式で渡してください
                            {
                                //URLを指定
                                url : "",
    
                                //コールバック関数を指定
                                //関数の引数には短くなったURLが渡されます
                                callback: function (shortUrl) {},
                                
                                //errorの指定
                                //ajaxでerrorが発生したときの関数
                                //引数にはresponseTextが渡されます
                                //未指定の場合はこの関数になります
                                error: function (text) {console.error(text);},
    
                                //googleのAPIkeyを指定。
                                //未指定の場合このkeyになります
                                key: "AIzaSyAY-kv1znRD6gmjEAlEfV2p4TFu3gTWfyc",
    
                                //非同期か
                                //未指定でtrue
                                async: true,
                            }
    
            */
            getShortUrl: function getShortUrl(params) {
                var url = params.url || "";
                var callback = params.callback || function () { };
                var key = params.key || DEFAULT_API_KEYS.short;
                var async = (params.async === undefined) || params.async;

                return smr.ajax.load({
                    url: SHORTENER_URL + key,
                    success: function (data) {
                        return callback(data.id);
                    },
                    error: params.error || DEFAULT_ERROR_FUNCTION,
                    async: async,
                    encode: false,
                    type: "post",
                    charset: "utf-8",
                    contentType: "application/json",
                    data: JSON.stringify({ longUrl: url }),
                    dataType: "json",
                });

            }
        };


        return google;
    })();


})(this);
