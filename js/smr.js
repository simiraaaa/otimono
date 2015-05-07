/*
 * Copyright (c) 2014 simiraaaa
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */

/**
 * @namespace smr
 */
var smr = smr || {};

(function(smr, Object, undefined) {

    Object.defineProperty(smr, "global", {
        value : (window || global || this),
        writable : false,
        configurable : false,
        enumerable : true
    });

    "use strict";

    var Array=smr.global.Array;

    var errorOutputConsole = smr.global.onerror = function(msg, url, line, col, error) {
        console.error(error.stack);
    };

    var errorOutputAlert = function(msg, url, line, col, error) {
        alert(error.stack);
    };
    var noname = {
        /**
         * @memberOf noname
         */
        className : " < noname > ",
        count : 0
    };
    /**
     * getDescriptor. 1bit目 enumerable. 2bit目 writable. 3bit目 configurable.
     */
    var getDescriptor = function(value, desc) {
        if (desc === undefined) {
            desc = 1;
        }
        return {
            value : value,
            enumerable : ((desc & 1) === 1),
            writable : ((desc & 2) === 2),
            configurable : ((desc & 4) === 4)
        };
    };


    var superInit = function() {
        this
            ._classTree[this._initCount++]
            .prototype
            .init
            .apply(this, arguments);
    };

    /**
     * @name defineProperty
     * @menber smr
     * @param name
     *            プロパティ名
     * @param value
     *            値
     * @param desc
     *            descriptor 3ビットで指定 未指定で1
     */
    Object.defineProperty(smr, "defineProperty", {
        value : function(name, value, desc) {
            Object.defineProperty(this, name, getDescriptor(value, desc));
            return this;
        },
        writable : false,
        configurable : false,
        enumerable : true
    });

    /**
     * smr以外がcallで使えるようにcallでsmr.definePropertyを呼ぶ. 速度は普通より3倍遅い程度
     */
    smr.defineProperty("defineProperties", function() {
        for ( var i = 0, l = arguments.length; i < l;) {
            smr.defineProperty.call(this, arguments[i++], arguments[i++], arguments[i++]);
        }
        return this;
    });

    smr.defineProperty("forin",function(){
      var o=arguments[0];
      var f=arguments[1];
      var len = arguments.length;
      if(len===2){
        for(var k in o){
          f(k,o[k]);
        }
      }else{
        for(var k in o){
          arguments[0]=k;
          arguments[1]=o[k];
          f.apply(null,arguments);
        }
      }
    });

    smr.defineProperty("definePackage", function(name, prop, desc) {
        if (typeof name === "string") {
            name = smr.using(name);
        }
        var pack = name;
        var args = [];
        desc = desc === undefined ? 1 : desc;
        for ( var key in prop) {
          smr.defineProperty.call(pack,key,prop[key],desc);
        }
        return pack;
    });

    smr.defineProperty("definePackages", function(name, prop, desc) {
        var pack = smr.using(name);
        desc = desc === undefined ? 1 : desc;
        for ( var key in prop) {
            smr.definePackage(name + "." + key, prop[key], desc);
        }
        return pack;
    });

    // smrに追加するプロパティ
    var regexp = {
        /**
         * @memberOf smr.regexp
         */
        _pathSplit : /[\[,\.\/]|::/,
        _optimize : /[　\s\]]/,

        /**
         * 引数が"sm r .r e g exp[a]::b/c,d"だったら "smr.regexp[a::b/c,d"を返す
         *
         * @param str
         */
        optimization : function(str) {
            return str.split(this._optimize).join("");
        },

        /**
         * 引数が"sm r .r e g exp[a]::b/c,d"だったら "sm r .r e g exp.a].b.c.d"を返す
         *
         * @param str
         */
        pathSplitter : function(str) {
            return str.split(this._pathSplit);
        },

        /**
         * 引数が"sm r .r e g exp[a]::b/c,d"だったら "smr.regexp.a.b.c.d"を返す
         *
         * @param str
         */
        classPath : function(str) {
            return this.pathSplitter(this.optimization(str)).join(".");
        },

        /**
         * 引数が"sm r .r e g exp[a]::b/c,_[ d]" だったら"d"を返す
         *
         * @param str
         */
        className : function(str) {
            var ar = this.pathSplitter(str);
            return this.optimization(ar[ar.length - 1]);
        }
    };
    var smrprop = {
        /**
         * @memberOf smr
         */

        /**
         * エラーが出たときアラートする
         */
        onerrorAlert : function() {
            smr.global.onerror = errorOutputAlert;
        },
        /**
         * エラーが出た時の表示をコンソールにする
         */
        offerrorAlert : function() {
            smr.global.onerror = errorOutputConsole;
        },

        /**
         * accessorをひとつ定義する
         */
        accessor : function(slf, name, desc) {
            Object.defineProperty(slf, name, {
                enumerable : true,
                configurable : false,
                get : desc["get"],
                set : desc["set"]
            });
            return slf;
        },

        /**
         * accessorを複数定義する<br>
         * 第一引数に定義したいクラスのprototype<br>
         * 第二匹数以降は"アクセサ名",{get:func,set:func}を交互に
         */
        accessors : function() {
            var slf = arguments[0];
            for ( var i = 1, l = arguments.length; i < l;) {
                smr.accessor(slf, arguments[i++], arguments[i++]);
            }
            return slf;
        },

        defineAccessors : function(slf,prop) {
          for(var key in prop){
            smr.accessor(slf,key,prop[key]);
          }
          return slf;
        },


        setter: function(slf,name,setter){
          Object.defineProperty(slf,name,{
            enumerable : true,
            configurable : false,
            set : setter
          });
          return slf;
        },
        defineSetters : function(slf,prop){
          for(var key in prop){
            smr.setter(slf,key,prop[key]);
          }
          return slf;
        },

        getter: function(slf,name,getter){
          Object.defineProperty(slf,name,{
            enumerable : true,
            configurable : false,
            get : getter
          });
          return slf;
        },

        defineGetters : function(slf,prop){
          for(var key in prop){
            smr.getter(slf,key,prop[key]);
          }
          return slf;
        },


        /**
         * tmlib.jsを参考に<br>
         * 変数名を文字列で参照<br>
         * もし未定義かbooleanに変換したときfalseになる場合<br>
         * 削除変更不可のオブジェクトを定義して返す。
         */
        using : function(ns) {
            if (smr.classes[ns]) {
                return smr.classes[ns];
            }

            // ]空白を消してから,./::[のどれかでスプリット
            // array[?]にも対応
            var path = regexp.pathSplitter(regexp.optimization(ns));
            var current = smr.global;

            for ( var i = 0, len = path.length; i < len; ++i) {
                var dir = path[i];
                current = current[dir] || (smr.defineProperty.call(current, dir, {})[dir]);
            }

            // キャッシュ
            smr.defineProperty.call(smr.classes, ns, current);

            return current;
        },

        /**
         * クラスを定義する<br>
         * 第一引数にクラス名、第二引数にプロパティ<br>
         * クラス名を省略して、第一引数にプロパティを設定することもできる。
         */
        define : function(name, prp) {

            var isNoname = false;

            if (typeof name !== "string") {
                prp = name;
                name = false;
            }

            if (name) {
                name = regexp.classPath(name);
            } else {
                isNoname = true;
                name = "smr." + noname.className + "." + noname.count;
            }
            var _className = regexp.className(name);

            prp.superClass = prp.superClass || smr.Object;
            prp.init = prp.init || function() {};
            prp._initCount = 0;

            var _classTree = {
                0 : prp.superClass
            };
            for ( var i = 0, temp; temp = _classTree[i].prototype.superClass;) {
                _classTree[++i] = temp;
            }
            prp._classTree = _classTree;

            // superClassは文字列でも指定できる。
            if (typeof prp.superClass === "string") {
                prp.superClass = smr.using(prp.superClass);
            }

            // var _extend = false;
            prp.superInit = superInit;

            // クラスを作る
            var cls_ = function(arg) {
                this.init.apply(this, arg);
            };
            
            /*
            インスタンスを生成します
            */
            var _cls = function() {
                return new cls_(arguments);
            };

            // 継承
            _cls.prototype = Object.create(prp.superClass.prototype, (function() {
                var o = {};
                
                // prototypeのメソッドは全て列挙されず、削除更新不可
                // メソッドじゃないのは列挙されて削除不可
                for ( var k in prp) {
                    var isFn = (typeof prp[k] === 'function');
                    o[k] = {
                        value : prp[k],
                        writable : /*(!isFn)*/true,
                        enumerable : (!isFn),
                        configurable : false
                    };
                }

                // フルパスsmr.using(_path)で使える。
                o._path = getDescriptor(name, 0);
                // 最後の部分だけ
                o._className = getDescriptor(_className, 0);

                // constructorがスーパークラスに上書きされてるから.
                o.constructor = getDescriptor(_cls, 2);

                return o;
            })());

            // tmlib.jsでも使えるようにする
            smr.defineProperty.call(_cls, "_class", true, 0);
            smr.defineProperty.call(cls_, "_class", true, 0);
            smr.defineProperty.call(_cls.prototype.init, "owner", _cls, 0);

            cls_.prototype = _cls.prototype;

            if (isNoname) {
                smr[noname.className][noname.count++] = _cls;
            } else {
                var ns = name.substring(0, name.lastIndexOf("."));
                ns = ns ? smr.using(ns) : smr.global;
                smr.defineProperty.call(ns, _className, _cls);
            }

            // キャッシュ
            smr.defineProperty.call(smr.classes, name, _cls);

            return _cls;
        }

    };

    smr.classes = {};
    smr[noname.className] = [];

    smr.definePackage(smr, smrprop);
    smr.definePackage("smr.regexp", regexp);

    /**
     *
     * オブジェクトのラッパークラス いろいろ増えてく予定
     *
     * @class smr.Object
     * @extends Object
     *
     */
    smr.define("smr.Object", {
        /**
         * @memberOf smr.Object
         */
        superClass : Object,
        init : function(o) {
            if (o) {
                this.add(o);
            }
        },
        /**
         * 引数のオブジェクトのプロパティで同名のプロパティを上書きする
         *
         * @name add
         */
        add : function(o) {
            for ( var k in o) {
                this[k] = o[k];
            }
            return this;
        },
        /**
         * プロパティがない場合に追加
         *
         * @param o
         * @returns {smr.Object}
         */
        addIfNotHave : function(o) {
            for ( var k in o) {
                if (this.has(k)) {
                    continue;
                }
                this[k] = o[k];
            }
            return this;
        },


        /**
         * 引数のオブジェクトのプロパティで同名のプロパティを上書きする
         * addの別名
         * 将来的にはaddはなくしたい
         * @name extend
         */
        extend: function (o) {
            return this.add(o);
        },
        /**
         * プロパティがない場合に追加
         * addIfNotHaveの別名
         * @param o
         * @returns {smr.Object}
         */
        safe: function (o) {
            return this.addIfNotHave(o);
        },

        /**
         * メソッドを配列に渡した順番に実行する. 普通に実行するより5倍ぐらい遅い. 引数が一つでも配列で渡す.
         *
         * @param ar
         *            ["methodName",[引数,引数,引数],"methodName2",[引数],
         *            "methodName3", [(引数がない場合空の配列)]]
         */
        invoke : function(ar) {
            if (typeof ar === 'string') {
                ar = arguments;
            }
            for ( var i = 0, l = ar.length; i < l;) {
                this[ar[i++]].apply(this, ar[i++]);
            }
        },
        /**
         * forIn tmlibの$forIn オブジェクトをループで回す
         */
        forIn : function(fn, self) {
            self = self || this;

            Object.keys(this).forEach(function(key, index) {
                var value = this[key];

                fn.call(self, key, value, index);
            }, this);

            return this;
        },
        /**
         * keys 列挙可能なキーを配列で返す.
         */
        keys : function() {
            return Object.keys(this);
        },

        /**
         * has そのプロパティを持っているか.(そのキーで参照できるかどうかではない)
         */
        has : function(k) {
            return this.hasOwnProperty(k);
        },

        /**
         * 自分のコンストラクターとinstanceが一致するか
         *
         * @param o
         * @returns {Boolean}
         */
        isInstance : function(o) {
            return (o instanceof this.constructor);
        }

    });

})(smr, ({}).constructor);
