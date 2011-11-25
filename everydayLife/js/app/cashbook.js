;
(function(g, doc){

    var jqr, ajax, category, currency, funcKeyCodes = {
        9:1,
        27:1,
        37:1,
        38:1,
        39:1,
        40:1,
        16:1,
        13:1,
        18:1,
        17:1
    };

    $(initPage);
    function initPage(){
        jqr = {
            $body: $('body')
        }

        initAjax();

        category = new Category();
        currency = new Currency();

        Beard
        .init({
            root: 'EverydayLife/tmpls',
            debug: false
        })
        .remote('body.html', 'month.html', 'cash-record.html', 'helpers/autocomplete.html')
        .load({
            'Body.Navigate->Body.NavigateMonths': '',
            'Body.Month->Month':1,
            'Month.Record->CashRecord': 1
        })
        .ready(function(){
            category.ready(function(){
                currency.ready(function(){
                    refreshPage();
                })
            })
        })
    }

    var refreshPage = function(){
        var page = getPageInfo(), e = {};
        jqr.$body.html(Btpls.Body(page, e));

        jqr = {
            $body: jqr.$body,
            $content: $('#content')
        }


        dlg.init();

        descr = {
            pinned: false,
            $prev: false,
            toggleDescr: function($curr){
                var $p = descr.$prev, $c = $curr;
                if(!$p){
                    if($c)
                        descr.$prev = $c.fadeTo(500, 1);
                } else if($c && $p[0] === $c[0]) {
                    var dur = 500 * (1 - $p.css('opacity'));
                    $p.stop().fadeTo(dur, 1)
                } else {
                    dur = 300 * ($p.css('opacity') - 0.2);
                    $p.stop().fadeTo(dur, 0.2, function(){
                        $p.hide();
                        if($c){
                            descr.$prev = $curr.fadeTo(500, 1);
                        } else{
                            descr.$prev = null;
                        }
                    })
                }
            }
        }

        prevEdit = {
            $prev: null,
            isDirty: false,
            validate: function($m, rec){
                var year = $m.attr('data-year'), month = $m.attr('data-month');

                // validate date
                var days = utils.daysNumInMonth(month, year);
                rec.date = Number(rec.date);
                if(isNaN(rec.date) || rec.date <= 0 || rec.date > days) {
                    dlg.alert('Sorry you need to enter a valid date between (1 ~ ' + days + ')');
                    return false;
                }

                // validate category
                var cate = rec.cate.replace(/[\/\s]/g, '');
                if(!cate){
                    dlg.alert('You need to enter a non-empty category.');
                    return false;
                }

                // validate the amount
                if(isNaN(Number(rec.amount))){
                    dlg.alert('You should enter a valid amount.');
                    return false;
                }

                // validate the currency
                if(!rec.currency.match(/[a-zA-Z]+/)){
                    dlg.alert('The currency string should only contains a-z and should not be empty.');
                    return false;
                }

                return true;
            },
            parsePrev: function(newD){
                if(prevEdit.$prev){
                    var $p = prevEdit.$prev;
                    if(!newD) newD = $p.wrapData();

                    var d = $p.beardData(),
                    isDateChanged = d.date != newD.date;


                    if(!this.validate($p.closest('ul'), newD)){
                        return false;
                    }

                    SavingQueue.push(d, $p, newD);
                    $.extend(d, newD);
                    bUtils.log(SavingQueue);

                    d.mode = 'read';
                    $p.find('.ac_input').unautocomplete();

                    // insert the new record to the correct place
                    var $n = Btpls.CashRecord.$(d);
                    if(isDateChanged || d.temp){
                        var $s = $p.siblings().not('.create'), l = $s.size();
                        while(l--){
                            var $t = $s.eq(l), curr = $t.beardData();
                            if(Number(curr.date) <= Number(newD.date)){
                                $t.after($n);
                                l = -2;
                                break;
                            }
                        }
                        if(l != -2){
                            $p.parent().prepend($n);
                        }
                    } else {
                        $p.after($n);
                    }

                    $p.remove();
                    prevEdit.$prev = null;
                }
                return true;
            }
        }


        // init events of the page
        var c = {}, events = {};
        $.extend(c, events.header = {
            'month navigating // a': function(){
                var $t = $(this);
                g.location.href = '#' + $t.attr('data-year') + '-' + $t.attr('data-month');
                jqr.$content.children('.month-div')
                .each(function(){
                    $(this).data('queue').flush(true);
                })
                refreshPage();
            }
        })
        $('#header').initEvents(c);

        actions.loadMonths(e.selected, function(){

            // binding autocomplete to category text box
            $('#content > div > ul').each(function(){
                var $t = $(this);
                var year = $t.attr('data-year'), month = $t.attr('data-month');
                actions.initMonth($t, year, month);

                // load the currency list for month summary
                $t.next().children('.currency-list')
                .html(Btpls.Month.Summary.CurrencyList(currency.data, currency.def));
                currency.loadMonthExchRate(month, year, function(){
                    actions.refreshMonthSummary($t);
                });
            })
        });
    }

    var SavingQueue = function($monthDiv){
        this.pending = {};
        this.$div = $monthDiv;
    }

    // push the record to saving queue.
    SavingQueue.push = function(rec, $li, newD){
        var sq = $li.closest('.month-div').data('queue');
        if(!rec.id) {
            rec.temp = true; // mark it as new created record
        } else {
            if(rec.removed){
                for(var i in rec){
                    if(rec.hasOwnProperty(i) && i != 'id' && i != 'removed' && i != 'temp' && i != '__objid_'){
                        delete rec[i];
                    }
                }
            }
            // check if it is dirtied
            if(!newD || newD == 'skip countdown' || newD.cate != rec.cate || newD.amount != rec.amount ||
                newD.amountStr != rec.amountStr || newD.currency != rec.currency||
                newD.date != rec.date || newD.descr != rec.descr){
                if(!(rec.__objid_ in sq.pending)) sq.pending[rec.__objid_] = rec;

                $.extend(rec, newD);

                actions.refreshMonthSummary(sq.$div.children('ul'));
            }
        }
        if(newD != 'skip countdown')
            sq.countDown();
    }

    SavingQueue.prototype = {
        html: function(msg){
            var $m = this.$div.find('.month > .month-control');
            if(msg == 'saving'){
                $m.html('<div class="saving"> Auto Saving ... </div>');
            } else if(msg == 'saved'){
                var $div;
                $m.html($div = $('<div class="saved"> Change has been saved. </div>'));
                setTimeout(function(){
                    $div.fadeOut(500, function(){
                        $div.remove()
                    })
                }, 1000);
            } else {
                if($m.children('.saving').size() == 0){
                    // over writing the month control only if it is not saving
                    if(typeof msg == 'string'){
                        if(msg == 'none'){
                            $m.html('');
                        }
                    } else if(msg == 'demo'){
                        $m.html('<div class="saving"> Sorry, you cannot save the change in demo mode. </div>');
                    } else {
                        $m.html(Btpls.Month.SaveButton(msg));
                    }
                }
            }
        },
        wait: function(){
            this._wait = true;
            clearInterval(this._timer);
            if(this._sec !== false) this.html();
            bUtils.log('stop');
        },
        flush: function(onNavigate){
            if(onNavigate){
                var found = false;
                for(var i in this.pending){
                    found = true;
                    break;
                }
                if(!found) return;
            }
            var t = this;
            clearInterval(t._timer);
            t.html('demo');
            return;

            var prevPendings = t.pending;

            // saving the pending records
            ajax.record.doPost({
                records: t.pending
            }, {
                'success': function(rsp){
                    // rsp will contain the ids for the new records
                    t.html('saved');

                    for(var i in rsp.newRecs){
                        if(rsp.hasOwnProperty(i)){
                            prevPendings[i].id = rsp[i];
                            prevPendings[i].temp = false;
                        }
                    }

                    bUtils.loop(rsp.newCates, function(cate){
                        category.add(cate.id, cate.txt);
                    })
                }
            }, 'save');

            // clear the pending records
            t.pending = {}

            // clear the interval
            clearInterval(t._timer);
            t._sec = false;
        },
        countDown: function(){
            var t = this;
            this._wait = false;

            for(var i in t.pending){
                t._sec = 5;
                break;
            }
            if(t._sec === false) return;
            clearInterval(t._timer);

            this._timer = setInterval(function(){
                bUtils.log(t._sec);
                if(t._sec == 0){
                    t.flush();
                } else {
                    t.html(t._sec --);
                }
            }, 1000);
        },
        _wait: {},
        _sec: false
    }

    function getPageInfo(){
        var page = {}

        var hash = g.location.hash;
        if(!hash){
            var d = new Date();
            page.currMonth = d.getMonth() + 1;
            page.currYear = d.getFullYear();
        } else {
            var tmp = hash.substr(1).split('-');
            page.currYear = Number(tmp[0]);
            page.currMonth = Number(tmp[1]);
        }

        page.footerText = 'Beard.js DEMO';

        return page;
    }

    // descr is for showing or hiding the description
    var descr, prevEdit;

    var actions = {
        loadMonths: function(months, callback){
            ajax.record.doPost({
                months: months
            }, {
                'success': function(rsp){
                    jqr.$content.html(Btpls.Month.List(rsp));
                    jqr.$content.bindData();
                    if(callback) callback ();
                }
            }, 'loadMonths');
        },
        refreshMonthSummary: function($monthUl){
            var data, sum = {
                t: 0,
                i: 0,
                o: 0,
                weekT: 0,
                weekI: 0,
                weekO: 0,
                dayT: 0,
                dayI: 0,
                dayO: 0
            },
            month = $monthUl.attr('data-month'), year = $monthUl.attr('data-year'),
            days = utils.daysNumInMonth(month, year),
            targetCurr = $monthUl.next().find('select.currencies').val();

            data = $monthUl.children('li').not('.create').beardArray();


            // calculate the summary, need to exch to the target currency
            bUtils.loop(data, function(d){
                if(d.removed) return true;
                d.amount = Number(d.amount);
                if(isNaN(d.amount)) d.amount = 0;
                if(d.curerncy != targetCurr){
                    amount = currency.calc(d.amount, d.currency, targetCurr, year, month);
                } else {
                    var amount = d.amount;
                }
                if(d.type == 'out'){
                    sum.o += amount;
                    sum.t -= amount;
                } else {
                    sum.i += amount;
                    sum.t += amount;
                }
            })

            sum.dayI = utils.round(sum.i / days);
            sum.dayO = utils.round(sum.o / days);
            sum.dayT = utils.round(sum.t / days);

            sum.weekI = utils.round(sum.i / days * 7);
            sum.weekO = utils.round(sum.o / days * 7);
            sum.weekT = utils.round(sum.t / days * 7);

            sum.i = utils.round(sum.i);
            sum.o = utils.round(sum.o);
            sum.t = utils.round(sum.t);

            sum.currency = targetCurr;

            $monthUl.next().next().html(Btpls.Month.Summary(sum));
        },
        initMonth: function($t, year, month){
            var $div = $t.parent();
            $div.data('queue', new SavingQueue($div));

            $t.children('li.create').each(function(){
                var $t;
                actions.initEditItem($t = $(this), month, year);
                $t.children('.currency').val(currency.def);
            })

            // refresh month summary

            var events = {}, c = {};
            $.extend(c, events.hoverOnRecords = {
                'showing the description // .cash-record@mouseenter': function(){
                    var $t = $(this);
                    $t.children('.record-button').css('visibility', 'visible');
                    if(!descr.pinned){
                        delayRun('showing descr', function(){
                            descr.toggleDescr($t.children('.descr'));
                        }, 100)
                    }

                // end : showing the description
                },
                'hiding the description //.cash-record@mouseleave': function(){
                    var $t = $(this);
                    $t.children('.record-button').css('visibility', 'hidden');
                    if(!descr.pinned){
                        delayRun('hiding descr', function(){
                            descr.toggleDescr();
                        }, 100)
                    }
                // end : to hide the descr
                }
            });

            $.extend(c, events.editAndSaveRecord = {
                'flush save queue //div.month-control:has(div.save-button)': function(){
                    $(this).closest('.month-div').data('queue')
                    .flush();
                    l('flushed');
                },
                'start edit a record //li div.text': function(){
                    if(!prevEdit.parsePrev()) return;

                    var $t = $(this), $li = $t.closest('li');
                    var d = $li.beardData();
                    d.mode = 'edit';
                    var $n = Btpls.CashRecord.$(d)
                    $li.after($n).remove();
                    actions.initEditItem($n, month, year);

                    var cls = $t.attr('class').replace(/text/, '').replace(/\s/, '');
                    descr.pinned = true;
                    $n.children('.descr')
                    .show()
                    .css('opacity', 1);
                    if(cls == 'descr') {
                        cls += ' > textarea';
                    }
                    $n.find('.' + cls)
                    .focus();

                    prevEdit.$prev = $n.filter('*');

                // end of clicking on category, amount, date div text
                },
                'save edit // .edit.record-button': function(){
                    prevEdit.parsePrev();
                },
                'remove a record // .remove.record-button': function(){
                    var $t = $(this), $li = $t.closest('li');
                    var d = $li.beardData();
                    d.removed = true;
                    SavingQueue.push(d, $li);
                    $li.remove();
                },
                'create a record // .create.record-button': function(){
                    var $t = $(this), $li = $t.closest('li');
                    var d = $li.beardData(), newD = $li.wrapData(),
                    days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
                    if(!prevEdit.validate($li.closest('ul'), newD)){
                        return;
                    }

                    d.id = d.__objid_;
                    d.temp = true;
                    d.mode = 'read';
                    prevEdit.$prev = $li;

                    // appending a new entry
                    var nextDate = new Date(d.year, d.month, newD.date), $n;
                    $li.after($n = Btpls.CashRecord.$({
                        mode: 'edit',
                        type: 'out',
                        date: nextDate.getDate(),
                        day: days[nextDate.getDay()],
                        year: d.year,
                        month: d.month,
                        currency: newD.currency
                    }))
                    $li.removeClass('create');
                    prevEdit.parsePrev(newD);

                    // create a new record
                    actions.initEditItem($n, d.month, d.year);
                    $n.children('.date').focus();
                },
                'type button in or out //div.out, div.in': function(){
                    var $t = $(this), $li = $t.closest('li'), d = $li.beardData();
                    var txt = $t.html();
                    if(txt == 'out') {
                        d.type = 'in';
                        $t.html('in').attr('class', 'in');
                    } else {
                        d.type = 'out';
                        $t.html('out').attr('class', 'out');
                    }
                    if($li.is('.read')){
                        SavingQueue.push(d, $li);
                    } else if($li.is('.edit')){
                        SavingQueue.push(d, $li, 'skip countdown');
                    }
                }
            })

            $.extend(c, events.monthSummary = {
                'toggle the month summary //div.summary-toggle': function(){
                    var $t = $(this).find('span.toggle');
                    if($t.html() == '-'){
                        $t.closest('.month-summary-title').next()
                        .animate({
                            height: 'toggle',
                            opacity: 'toggle'
                        })
                        $t.html('+');
                    } else {
                        $t.closest('.month-summary-title').next()
                        .animate({
                            height: 'toggle',
                            opacity: 'toggle'
                        })
                        $t.html('-');
                    }
                },
                'change month summary def curr//select.currencies@change': function(){
                    var $ul = $(this).closest('.month-summary-title').prev();
                    actions.refreshMonthSummary($ul);
                }
            })

            $t.parent().initEvents(c);
        },
        initACCategory: function($cashRecord){


            var $t = $cashRecord.children('.category');
            if($t.is('.ac_input')){
                $t.unautocomplete()
                .unbind();
            }

            $t.keyup(function(e){
                if(!funcKeyCodes[e.keyCode]){
                    $(this).next().val('');
                }
            })
            .autocomplete(category.data, {
                width: $cashRecord.children('.category').width() + 12,
                scrollHeight: 400,
                max: 15,
                autoFill: false,
                minChars: 0,
                matchFunc: function(s, q, e){
                    if(!e.rgx){
                        if(q.charAt(0) != '/') q = '/' + q;
                        q = utils.regExpStr(q);
                        q = q.replace(/\\\//g, '[^\\/]*\\/');
                        e.rgx = new RegExp(q, 'i');
                    }

                    return e.rgx.test(s);
                },
                formatMatch: function(cate){
                    return cate.txt;
                },
                formatItem: function(cate){
                    return Btpls.AutoComplete.Category(cate);
                },
                highlight: false
            })
            .result(function(e, cate){
                $(this).next().val(cate.id);
            })
        },
        initEditItem: function($t, month, year){
            var days = utils.daysInMonth(month, year);
            var weekdays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

            actions.initACCategory($t);

            var $amount = $t.children('div.amount-cal');
            $t.children('.amount')
            .keydown(function(){
                var text = this;
                delayRun('cal amount', function(){
                    var amountStr = text.value;
                    try{
                        var amount = eval(amountStr);
                        amount = utils.round(amount);
                    } catch(e){
                        amount = '?';
                    }
                    if(typeof amount != 'number' || isNaN(amount)) amount = '?';

                    $(text).next().val(amount);
                    $amount.html(' = ' + amount);
                }, 100)
            })
            .focus(function(){
                $(this).trigger('keydown');
                $amount.show();
            })
            .blur(function(){
                $amount.hide();
            })

            $t.children('.currency')
            .keyup(function(e){
                if(!funcKeyCodes[e.keyCode]){
                    $(this).next().val('');
                }
            })
            .autocomplete(currency.data, {
                width: $t.children('.currency').width() + 12,
                scrollHeight: 400,
                autoFill: false,
                minChars: 0,
                formatItem: function(curr){
                    return Btpls.AutoComplete.Currency(curr[0]);
                },
                formatMatch: function(curr){
                    return curr[0];
                },
                formatResult: function(curr){
                    return curr[0].toUpperCase();
                },
                highlight: false
            })
            .result(function(){
                $(this).next().val('1');
            })

            $t.children('.date')
            .autocomplete(days, {
                width: $t.children('.date').width() + 12,
                scrollHeight: 400,
                autoFill: false,
                minChars: 0
            })
            .result(function(e, item){
                var d = new Date(year, month-1, this.value), day = weekdays[d.getDay()];
                $(this).next().html(day).attr('class', 'day-of-week ' + day);
            })

            $t.find('input:text, textarea')
            .focus(function(){
                // pin the description div
                var $t = $(this), $li = $t.closest('li');
                descr.toggleDescr($t.closest('li').children('.descr'));
                descr.pinned = true;

                // select all text in the focused input
                setTimeout(function(){
                    $t.select()
                }, 100)

                if($li.is('.create')){
                    prevEdit.parsePrev();
                }
                // well, we also need to pin the save button
                var sq = $t.closest('.month-div').data('queue');
                sq.wait();
                bUtils.log(sq, 'focus');
            })
            .blur(function(){

                // hide the descr div if needed
                descr.toggleDescr();

                // unpinned the descr div
                descr.pinned = false;

                var $t = $(this), sq = $t.closest('.month-div').data('queue');
                if($t.closest('li').is('.create'))
                    sq.countDown();
                bUtils.log(sq, 'blur');
            })
            .keydown(function(e){
                if(e.keyCode == 13 && e.ctrlKey){
                    $t.children('.record-button').trigger('click');
                }
            })

        }
    }

    var initAjax = function(){
        var url = Beard.appUrl() + 'EverydayLife/actions/';
        ajax = {
            record: new AjaxActions(url + 'record.php'),
            category: new AjaxActions(url + 'category.php'),
            currency: new AjaxActions(url + 'currency.php')
        }
    }

    var bUtils = Beard.utils, l = bUtils.log;

    var utils = {
        round: function(num, rdx){
            if(!rdx){
                return Math.round(num * 100) / 100;
            } else {
                return Math.round(num * Math.pow(10, rdx)) / Math.pow(10, rdx);
            }
        },
        daysInMonth: function(iMonth, iYear)
        {
            var d = 32 - new Date(iYear, iMonth - 1, 32).getDate();
            var ret = [];
            for(var i = 0; i < d; i++){
                ret.push(i+1+'');
            }
            bUtils.log(ret);
            return ret;
        },
        daysNumInMonth: function(iMonth, iYear)
        {
            return 32 - new Date(iYear, iMonth - 1, 32).getDate();
        },
        regExpStr: function(str){
            return str.replace(/([\:\$\#\?\.\!\(\)\[\]\+\-\=\~\/\\\*\{\}\^])/g, '\\$1');
        },
        regExpLen: 0,
        regExpCache: {}
    }

    var Category = function(){
        this.loading = 1;
        this._ready = [];
        var cate = this;

        ajax.category.doPost({}, {
            'success': function(rsp){
                cate.data = rsp;
                if(cate._ready.length > 0){
                    for(var i = 0, len = cate._ready.length; i < len; i++){
                        cate._ready[i]();
                    }
                    cate._ready = [];
                }
                cate.loading = 0;
            },
            'error': function(){
                alert('The server is busy, please try again later.');
            }
        }, 'loadAll');
    }

    Category.prototype = {
        ready: function(func){
            if(this.loading){
                this._ready.push(func);
            } else {
                func();
            }
        },
        finish: function(){

        },
        remove: function(id){
            bUtils.remove(this.data, function(cate){
                return cate.id == id;
            })

            ajax.category.doPost({
                id: id
            },{}, 'remove');

            delayRun('re init category', function(){
                category.reInitEvent();
            })
        },
        add: function(id, txt){

            var l = this.data.length;
            while(l--){
                if(this.data[l].id == id){
                    return;
                }
            }
            if(txt){
                txt = txt.replace(/\s?\s*\/\s*/g, '/')
                .replace(/\/\/+/g, '/')
                .replace(/^\s*/, '')
                .replace(/\s\s*$/, '');
                if(txt.charAt(0) != '/'){
                    txt = '/' + txt;
                }
            }

            this.data.unshift({
                id: id,
                txt: txt
            });

            delayRun('re init category', function(){
                category.reInitEvent();
            })
        },
        reInitEvent: function(){
            l('re init cate ac');

            jqr.$content.find('li.cash-record').not('.read')
            .each(function(){
                actions.initACCategory($(this));
            })
        }
    }

    var Currency = function(){
        this.loading = 1;
        this._ready = [];
        this.rates = {};

        var curr = this;

        ajax.currency.doPost({}, {
            'success': function(rsp){
                curr.data = rsp.curr;
                curr.def = rsp.def.toUpperCase();
                curr.person = rsp.person;
                curr.flushReady();
                curr.loading = 0;
            },
            'error': function(){
                alert('The server is busy, please try again later.');
            }
        }, 'loadAll');
    }

    Currency.prototype = {
        flushReady: function(){
            if(this._ready.length > 0){
                for(var i = 0, len = this._ready.length; i < len; i++){
                    this._ready[i]();
                }
                this._ready = [];
            }
        },
        ready: function(func){
            if(this.loading){
                this._ready.push(func);
            } else {
                func();
            }
        },
        loadMonthExchRate: function(month, year, callback){
            var curr = this;
            ajax.currency.doPost({
                month: month,
                year: year
            }, {
                'success': function(rsp){
                    if(!(year in curr.rates)){
                        curr.rates[year] = {};
                    }
                    curr.rates[year][month] = rsp;
                    if(callback) callback();
                },
                'error': function(){}
            }, 'loadMonth');
        },
        remove: function(id) {

        },
        add: function(id){},
        calc: function(amount, currFrom, currTo, year, month){
            var from = this.exch(year, month, currFrom), to = this.exch(year, month, currTo);
            return utils.round(amount * from / to);
        },
        exch: function(year, month, curr){
            curr = curr.toLowerCase();
            if(!(year in this.rates) || !(month in this.rates[year])){
                return 1;
            }
            var ret = this.rates[year][month][curr];
            if(ret) ret = Number(ret);
            if(isNaN(ret)) return 1;
            ret = utils.round(ret, 4);
            if(ret == 0){
                return 0.0001;
            }
            return ret;
        }
    }

    var dlg = {
        alert: function(msg, ok){
            this.alertOk = ok;
            this._$alert.html(msg).dialog("open");
        },
        confirm: function(msg, ok, cancel){
            this.confirmOk = ok;
            this.confirmCancel = cancel;
            this._$confirm.html(msg).dialog("open");
        },
        init: function(){
            this._$alert = $('#dlgAlert').dialog({
                autoOpen: false,
                buttons: {
                    'OK': function(){
                        $(this).dialog('close');
                        if(dlg.alertOk)
                            dlg.alertOk();
                        dlg.alertOk = null;
                    }
                },
                close: function(){
                    if(dlg.alertOk) dlg.alertOk();
                },
                'minWidth': 400,
                modal: true
            });

            this._$confirm = $('#dlgConfirm').dialog({
                autoOpen: false,
                buttons: {
                    'OK': function(){
                        $(this).dialog('close');
                        if(dlg.confirmOk) {
                            dlg.confirmOk();
                            dlg.confirmOk = null;
                        }
                    },
                    'Cancel': function(){
                        $(this).dialog('close');
                        if(dlg.confirmCancel) dlg.confirmCancel();
                        dlg.alertOk = null;
                    }
                },
                'minWidth': 400,
                close: function(){
                    if(dlg.confirmOk) dlg.confirmOk();
                },
                modal: true
            });
        },
        _$alert: null,
        _$confirm: null
    }

    g.cashbook = {
        handle: function(type, node, e){
            var $t = $(node).closest('.acCategory');
            var id = $t.attr('data-id');
            if(type == 'remove cate'){
                category.remove(id);
            } else if(type == 'remove curr'){
            }

            if (!e)
                e = window.event;

            if (e.cancelBubble)
                e.cancelBubble = true;
            else
                e.stopPropagation();
        }
    };


}(window, document))