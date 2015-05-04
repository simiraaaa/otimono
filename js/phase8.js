/// <reference path="smr.js"/>
/// <reference path="smr.single.js"/>

(function (window, document, smr, undefined) {
    /* ゲーム内で共通で使用する変数 */

    //Sprite を格納する配列
    var snow_sprites = [];

    //矢印キーのコード
    var LEFT_KEY_CODE = 37;
    var RIGHT_KEY_CODE = 39;
    var key_value = 0;

    //雪の画像サイズ
    var SNOW_PIC_SIZE = 32;

    //雪の降るスピード
    var SNOW_DOWS_SPEED = 3;

    //表示する雪の数
    var DRAW_SNOW_COUNT = 6;
    var DRAW_SNOW_GAP = 55;

    //雪ダルマの画像サイズ
    var SNOW_MAN_PIC_SIZE = 80;

    //html ドキュメント上の canvas のインスタンスが格納される
    var canvas;
    // 2d コンテキストのインスタンスが格納される
    var ctx;

    //雪ダルマの Sprite オブジェクトが格納される
    var img_snow_man;

    //雪ダルマの移動量
    var PLAYER_MOVE_SPEED_R = 5;
    var PLAYER_MOVE_SPEED_L = -5;

    //画面の書き換え数をカウントする
    var loopCounter = 0;

    var requestId;

    //前回動いた時間を格納
    var bofore_animation_time = 0;

    //読み込む音
    var sounds = {
        kiin: 'sound/kiiiin1.mp3',
    };

    //音を一度でも鳴らしてあるか
    var unlocked = false;

    //Eventクラス
    var Event = smr.define({
        init: function (type, param) {
            param && this.extend(param);
            this.type = type;
        },
        clone: function (param) {
            return Event(this.type, param && this);
        }

    });



    //イベント管理のクラス

    var EventDispatcher = smr.define({
        init: function () {
            this.listeners = {};
        },

        on: function (type, func) {
            if (this.listener[type] === undefined) {
                this.listener = [];
            }
            this.listener[type].push(func);
        },

        fire: function (e) {
            e.target = this;
            var ontype = 'on' + e.type;
            this[ontype] && this[ontype](e);

            var listeners = this.listeners[e.type];
            if (listeners) {
                var copy = listeners.slice(0);
                for (var i = 0, len = copy.length; i < len; ++i) {
                    copy[i].call(this, e);
                }
            }

            return this;
        }


    });

    //音を再生するクラス
    var Sounds = (function () {
        var AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
        var context = new AudioContext();

        var Sounds = smr.define({
            superClass: EventDispatcher,

            init: function Sounds(src_or_buffer) {
                this.superInit();
                this.context = context;
                var type = typeof (src_or_buffer);

                if (type === "string") {
                    this.loaded = false;
                    this.load(src_or_buffer);
                }
                else if (type === "object") {
                    this.setup();
                    this.setBuffer(src_or_buffer);
                    this.loaded = true;
                }
                else {
                    this.setup();
                    this.loaded = false;
                }
            },

            load: function (src) {
                var self = this;
                smr.single.ajax({
                    url: src,
                    responseType: 'arraybuffer',
                    success: function (data) {
                        context.decodeAudioData(data, function (buffer) {
                            self.setup();
                            self.setBuffer(buffer);
                            self.loaded = true;
                            self.fire(Event('load'));
                        }, function error() {
                            console.warn('audio load error:' + src);
                            self.setup();
                            self.setBuffer(context.createBuffer(1, 1, 22050));
                            self.loaded = true;
                            self.fire(Event('load'));
                        });
                    }
                });
            },

            play: function (time) {
                if (this.isPlaying) { return; }
                this.isPlaying = true;

                if (time === undefined) time = 0;

                this.source.start(context.currentTime + time);

                return this;
            },

            stop: function (time) {
                if (!this.isPlaying) { return; }
                this.isPlaying = false;

                if (time === undefined) time = 0;

                this.source.stop(context.currentTime + time);
                return this;
            },

            //最低限destinationだけはconnect
            //source->gain->destination
            setup: function () {

                var source = context.createBufferSource();
                var gain = context.createGain();

                source.connect(gain);
                gain.connect(context.destination);

                this.source = source;
                this.gain = gain;
            },

            /**
            自分と同じ音が再生できるクローン
            */
            clone: function () {
                var sound = new Sounds(this.getBuffer());
                sound.setVolume(this.getVolume());
                return sound;
            },

            setVolume: function (v) {
                this.gain.gain.value = v;
                return this;
            },

            getVolume: function () {
                return this.gain.gain.value;
            },

            setLoop: function (b) {
                this.source.loop = (b === undefined) ? true : b;
                return this;
            },

            getLoop: function () {
                return this.source.loop;
            },

            setBuffer: function (buffer) {
                this.source.buffer = buffer;
                return this;
            },

            getBuffer: function () {
                return this.source.buffer;
            }


        });

        //iOSはタッチイベントとかでこれを実行すると音が鳴るようになる。
        Sounds.unlock = function () {
            var unlockBuffer = context.createBuffer(1, 1, 22050);
            var unlockSrc = context.createBufferSource();
            unlockSrc.buffer = unlockBuffer;
            unlockSrc.connect(context.destination);
            unlockSrc.start(0);
            return this;
        };

        return Sounds;

    })();




    //ゲーム内で動作する Sprite クラスの定義
    var Sprite = function (imgSrc, width, height) {
        var that = this;
        that.imageLoaded = false;
        that.imageSource = imgSrc;
        that.x = 0;
        that.y = 0;
        that.dx = 0;
        that.dy = 0;
        that.width = width;
        that.height = height;
        var _offset_x_pos = 0;

        //使用するインデックスを設定するための Setter/Getter
        var imageIndex = 0;
        Object.defineProperty(this, "index", {
            get: function () {
                return imageIndex;
            },
            set: function (val) {
                imageIndex = val;
                _offset_x_pos = width * imageIndex;
            }
        });

        //新しい image オブジェクトのインスタンスを生成
        var img = new Image();
        //image オブジェクトに画像をロード
        img.src = imgSrc;
        //画像がロードされたら
        img.onload = function () {
            that.imageLoaded = true;
            that.image = img;
        };

        //Sprite を描画すめメソッド
        that.draw = function () {
            ctx.drawImage(img, _offset_x_pos, 0, width, height, that.x, that.y, width, height);
        };
    };


    //Document の準備ができたら
    document.addEventListener("DOMContentLoaded", function () {
        var soundsLoaded = function (e) {
            this.setVolume(0.5);
            var allLoaded = true;
            for (var k in sounds) {
                if (sounds[k].loaded) continue;
                allLoaded = false;
                break;
            }
            if (allLoaded) {
                loadAssets();
                setHandlers();
            }
        };

        for (var k in sounds) {
            var s = sounds[k] = new Sounds(sounds[k]);
            s.onload = soundsLoaded;
        }
    });


    function setHandlers() {
        var key = {
            right: false,
            left: false,
        };

        //キーイベントの取得 (キーダウン)
        document.addEventListener("keydown", function (evnt) {
            if (evnt.which == LEFT_KEY_CODE) {
                key_value = PLAYER_MOVE_SPEED_L;
                key.left = true;
                key.right = false;
            } else if (evnt.which == RIGHT_KEY_CODE) {
                key_value = PLAYER_MOVE_SPEED_R;
                key.right = true;
                key.left = false;
            }
        });

        //キーイベントの取得 (キーアップ)
        document.addEventListener("keyup", function (e) {
            if (e.keyCode === RIGHT_KEY_CODE && key.right) {
                key_value = 0;
                key.right = false;
            } else if (e.keyCode === LEFT_KEY_CODE && key.left) {
                key_value = 0;
                key.left = false;
            }

        });

        //タッチした際の右クリックメニューの抑制
        document.oncontextmenu = function () { return false; }

        //Canvas へのタッチイベント設定
        canvas.addEventListener("touchstart", function (evnt) {
            //iPhoneで音が鳴るようにする
            if (!unlocked) {
                Sounds.unlock();
                unlocked = true;
            }
            if ((screen.width / 2) > evnt.touches[0].clientX) {
                key_value = PLAYER_MOVE_SPEED_L;
            } else {
                key_value = PLAYER_MOVE_SPEED_R;
            }
        });

        canvas.addEventListener("touchend", function (evnt) {
            key_value = 0;
        });

    }


    //canvas 内に使用する画像をロード
    function loadAssets() {
        //HTML エレメント上の canvas のインスタンスを取得
        canvas = document.getElementById('myCanvas');
        //2d コンテキストを取得
        ctx = canvas.getContext('2d');

        var snowInit = function () {
            this.hited = false;
        };

        for (var i = 0; i < DRAW_SNOW_COUNT; i++) {
            //雪のインスタンスを生成
            var sprite_snow = new Sprite('img/snowSP.png', SNOW_PIC_SIZE, SNOW_PIC_SIZE);
            sprite_snow.dy = SNOW_DOWS_SPEED;
            sprite_snow.dx = DRAW_SNOW_GAP;
            sprite_snow.init = snowInit;
            snow_sprites.push(sprite_snow);
            sprite_snow = null;
        }
        //雪だるまのインスタンスを生成
        img_snow_man = new Sprite('img/snow_man.png', SNOW_MAN_PIC_SIZE, SNOW_MAN_PIC_SIZE);

        img_snow_man.limit_rightPosition = getRightLimitPosition(canvas.clientWidth, img_snow_man.width);

        //画像のロードが完了したかどうかをチェックする関数
        loadCheck();
    };


    //Splite に画像がロードされたかどうかを判断
    function loadCheck() {
        if (!img_snow_man.imageLoaded) {
            //雪だるまの画像のロードが完了していなければループして待つ
            requestId = window.requestAnimationFrame(loadCheck);
        };

        var length = snow_sprites.length;
        for (var i = 0; i < length; i++) {
            var snow_sprite = snow_sprites[i];
            if (!snow_sprite.imageLoaded) {
                requestId = window.requestAnimationFrame(loadCheck);
                return;
            } else {
                snow_sprite.y = getRandomPosition(DRAW_SNOW_COUNT, -50);
                snow_sprite.x = i * snow_sprite.dx;
            }
        }

        var center_x = getCenterPostion(canvas.clientWidth, img_snow_man.width);
        img_snow_man.x = center_x;
        img_snow_man.y = 0;
        img_snow_man.y = canvas.clientHeight - img_snow_man.width;

        startScece();
    }


    //fps のコントロールコード
    function control_fps(fps) {
        var now_the_time = (new Date()).getTime() || window.performance.now();
        var renderFlag = !(((now_the_time - bofore_animation_time) < (600 / fps)) && bofore_animation_time);
        if (renderFlag) bofore_animation_time = now_the_time;
        return renderFlag;
    }



    function startScece() {
        if (control_fps(48)) {
            //canvas をクリア
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if ((img_snow_man.x < img_snow_man.limit_rightPosition && key_value > 0)
                || (img_snow_man.x >= SNOW_DOWS_SPEED && key_value < 0)) {
                //img_snow_man の x 値を増分
                img_snow_man.x += key_value;
            }

            var length = snow_sprites.length;
            for (var i = 0; i < length; i++) {
                var snow_sprite = snow_sprites[i];
                //img_snow の y 値(縦位置) が canvas からはみ出たら先頭に戻す
                if (snow_sprite.y > canvas.clientHeight) {
                    snow_sprite.y = getRandomPosition(DRAW_SNOW_COUNT, -50);
                    snow_sprite.index = 0;
                    //初期化
                    snow_sprite.init();
                } else {
                    if (loopCounter == 30 && snow_sprite.index != 2) {
                        snow_sprite.index = (snow_sprite.index == 0) ? 1 : 0;
                    }
                }

                //img_snow の y 値を増分
                snow_sprite.y += snow_sprite.dy;
                //画像を描画
                snow_sprite.draw();

                //当たり判定
                if (isHit(snow_sprite, img_snow_man)) {
                    hitJob(snow_sprite);
                };
                snow_sprite = null;
            }

            //画像を描画
            img_snow_man.draw();

            if (loopCounter == 30) { loopCounter = 0; }

            loopCounter++;

            //ループを開始
            requestId = window.requestAnimationFrame(startScece);
        } else {
            requestId = window.requestAnimationFrame(startScece);
        }
    }

    //中央の Left 位置を求める関数
    function getCenterPostion(containerWidth, itemWidth) {
        return (containerWidth / 2) - (itemWidth / 2);
    };

    //Player (雪だるまを動かせる右の限界位置)
    function getRightLimitPosition(containerWidth, itemWidth) {
        return containerWidth - itemWidth;
    }

    function getRandomPosition(colCount, delayPos) {
        return Math.floor(Math.random() * colCount) * delayPos;
    };

    //雪と雪だるまがヒットした際の処理
    function hitJob(snow_sprite) {
        ctx.font = "bold 50px";
        ctx.fillStyle = "red";
        ctx.fillText("ヒットしました", 100, 160);
        snow_sprite.index = 2;
        if (!snow_sprite.hited) {
            sounds.kiin.clone().play();
            snow_sprite.hited = true;
        }

    }

    //当たり判定
    function isHit(targetA, targetB) {
        if ((targetA.x <= targetB.x && targetA.width + targetA.x >= targetB.x)
                || (targetA.x >= targetB.x && targetB.x + targetB.width >= targetA.x)) {

            if ((targetA.y <= targetB.y && targetA.height + targetA.y >= targetB.y)
                || (targetA.y >= targetB.y && targetB.y + targetB.height >= targetA.y)) {
                return true;
            }
        }
    }

})(window, document, smr);