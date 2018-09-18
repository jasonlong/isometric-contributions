// ==UserScript==
// @name         Github Isometric Contributions
// @namespace    https://github.com/jasonlong/isometric-contributions
// @version      1.0.20
// @description  User Script for rendering an isometric pixel art version of your GitHub contribution graph.
// @icon         https://raw.githubusercontent.com/jasonlong/isometric-contributions/master/chrome/icon-128.png
// @author       jasonlong
// @include      https://github.com/*
// @homepageURL  https://github.com/jasonlong/isometric-contributions
// @supportURL   https://github.com/jasonlong/isometric-contributions/issues
// @require      https://cdn.rawgit.com/jasonlong/isometric-contributions/master/chrome/jquery.min.js
// @require      https://cdn.rawgit.com/jasonlong/isometric-contributions/master/chrome/obelisk.min.js
// @grant        none
// ==/UserScript==

var isoCss = (function(){/*
.ic-toggle {
  position: relative;
  top: 0px;
  right: 10px;
  float: right;
  margin-left: 20px;
}

.ic-toggle.ic-with-lock {
  right: 24px;
}

.ic-toggle .tooltipped {
  top: 0 ! important;
  right: 0 ! important;
  float: none ! important;
}

.ic-toggle-option {
  height: 32px;
  font-size: 10px;
  background-color: transparent;
  background-repeat: no-repeat;
  background-position: 50% 50%;
  background-size: 9px 11px;
  border: solid 1px #d5d5d5;
}

.ic-toggle-option:hover {
  background-color: #eee;
}

.ic-toggle .ic-toggle-option:first-child {
  padding: 2px 13px 2px 10px;
  border-right: 0;
  border-top-left-radius: 3px;
  border-bottom-left-radius: 3px;
}

.ic-toggle .ic-toggle-option:last-child {
  padding: 2px 10px 2px 13px;
  border-left: 0;
  border-top-right-radius: 3px;
  border-bottom-right-radius: 3px;
}

.ic-toggle-option.active {
  background-color: #035dd2;
  border-color: #035dd2;
}

.ic-toggle-option.active.tooltipped:focus::before,
.ic-toggle-option.active.tooltipped:focus::after {
  display: none;
}

.ic-toggle-option.squares {
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAWCAYAAADNX8xBAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyNpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDIxIDc5LjE1NDkxMSwgMjAxMy8xMC8yOS0xMTo0NzoxNiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChNYWNpbnRvc2gpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjQ5MEI3NkE2QUQzRjExRTM5NzQ1QzFFMDFGOUU0RUFBIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjQ5MEI3NkE3QUQzRjExRTM5NzQ1QzFFMDFGOUU0RUFBIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NDkwQjc2QTRBRDNGMTFFMzk3NDVDMUUwMUY5RTRFQUEiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6NDkwQjc2QTVBRDNGMTFFMzk3NDVDMUUwMUY5RTRFQUEiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6aGpWeAAAAO0lEQVR42mL8//8/AzUAy6xZs/CalJaWxgiiCaljYqASGDVoKBrESK0ESTUXjabsUYOGZ8qmmkEAAQYAsZ0Wv1c4rIwAAAAASUVORK5CYII=);
}

.ic-toggle-option.squares.active {
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAWCAYAAADNX8xBAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyNpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDIxIDc5LjE1NDkxMSwgMjAxMy8xMC8yOS0xMTo0NzoxNiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChNYWNpbnRvc2gpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjkyRjY4NTMzQUQzRTExRTM5NzQ1QzFFMDFGOUU0RUFBIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjkyRjY4NTM0QUQzRTExRTM5NzQ1QzFFMDFGOUU0RUFBIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6OTJGNjg1MzFBRDNFMTFFMzk3NDVDMUUwMUY5RTRFQUEiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6OTJGNjg1MzJBRDNFMTFFMzk3NDVDMUUwMUY5RTRFQUEiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6wggErAAAAOUlEQVR42mJgoBJg/A8EeBUAAYgmpI6JWi4aNWgoGsQCTCaziEpwRKobTdmjBo2mbJwpmyoGAQQYACwoFZH07rnMAAAAAElFTkSuQmCC);
}

.ic-toggle-option.cubes {
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAWCAYAAADNX8xBAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyNpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDIxIDc5LjE1NDkxMSwgMjAxMy8xMC8yOS0xMTo0NzoxNiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChNYWNpbnRvc2gpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjkyRjY4NTJGQUQzRTExRTM5NzQ1QzFFMDFGOUU0RUFBIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjkyRjY4NTMwQUQzRTExRTM5NzQ1QzFFMDFGOUU0RUFBIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6OTJGNjg1MkRBRDNFMTFFMzk3NDVDMUUwMUY5RTRFQUEiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6OTJGNjg1MkVBRDNFMTFFMzk3NDVDMUUwMUY5RTRFQUEiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6sSajGAAABpklEQVR42syUv07CUBTG2wYTFwwTE1FjGAzxAUCewBcQ0ZiwUDb/TBoeAHVSN9vURYwSH8AngOADQHRwUBcHNDHpwmBav0u+m9wU2mLi4El+3HLud0577z336JZlaSGmg3XQ4P86uAO+KjJNczQaIUnyoANaYIm06MtPCggmWgA3oAsKylgI+G6pHUuU5BKeQBm8gA1QBA+kSJ+cE9qGbdvJ0T5gj04xVkAKuEx4BoYhy54Fu9yzOfAFrhL42aPAA/vgUos28YIT8AFsfsCOEVimA/ogF5EoR42j7rF8EBPX/Coh7IF7vk1air4eNR5j+mqib7ANMjwVUUNrYADOyYA+nZoMY0Sslgh89jtY5QmJMpgX61fm38AWaMfVkbQO66Sq+Kr0tacpyKA5vBI+n0MtLtHU9qeJxDGugAuQ/kVsmjEi1jN4PT5BDTyDQ14DLeKKHFBbY2xFJGqCLDgCMxwfQYk1o/anEueOFW0WPakp98jlJVxmi1hU+o9OZH+Sc0JbRxJ30ma/gs1A/5Gm+srUxp6a2n+GRO1P433Z9/3/VUc/AgwABC9r2yOgRiMAAAAASUVORK5CYII=);
}

.ic-toggle-option.cubes.active {
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAWCAYAAADNX8xBAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyNpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDIxIDc5LjE1NDkxMSwgMjAxMy8xMC8yOS0xMTo0NzoxNiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChNYWNpbnRvc2gpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjkyRjY4NTJCQUQzRTExRTM5NzQ1QzFFMDFGOUU0RUFBIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjkyRjY4NTJDQUQzRTExRTM5NzQ1QzFFMDFGOUU0RUFBIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6MzMxMEU4QzJBRDI0MTFFMzk3NDVDMUUwMUY5RTRFQUEiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6OTJGNjg1MkFBRDNFMTFFMzk3NDVDMUUwMUY5RTRFQUEiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4zDy6UAAAB60lEQVR42rRUsUsCYRS/EwKXOCHIMahAcJMaHNprDEFdI/ob1MVNLmiJWryxAmsMlyZJTkJwiKaWqyAQLFAiLsg66673s++T787zpKEHP/x87/f73ffuHU9yHEeaAJmQJTwwZFnOxRvFBJMkoemMR5PVphotEE65yjCM51QqdQ7gLBieMe6Y0SxBtW37A6xut2vmcrlaKBQqEGURwBk51MBhXBVabrRPyVcU+/2+pWlaS1GUPSqtEmShBRk51Mrlcou4n8wQ2gOJ35UStqqqNSJvEGYmDQE1wjq40HC95PNCbwnxgGnGGccVQ6N2u/1Sr9cN4Qn4vSBEBIMIy9m8A2igHRl1Op0nuu52LBY78UxngP4ZBuI0wYUGWpcR618h5NPpdLXX6715r49cJpOpggMuNL5GwgtdIuyWSiWdm+CMHGFZ5AYaCYZreG0Azn4cbhSSAoLqV35nvwg0+lPYv/FNT9QI896r89Z82gJXgxYGUrFYvDRN8519G5hUgRAOMEItz7gOtPDApZLRaPSwUqncWJb1xQwf+f4RjIb7idUccKGBFh58OmHCZiKRONZ1/c6zf8bOjUbjHlxomFbyjnuOsOOzf1z7CRxwp25Icf+gBUDcT34bUg4YKGorhC32/4hwjWdL/xk/AgwA7kGg+q2lp1UAAAAASUVORK5CYII=);
}

.ic-squares #isometric-contributions,
.ic-squares .ic-contributions-wrapper {
  display: none;
}

.ic-cubes .calendar-graph,
.ic-cubes .contrib-details,
.ic-cubes .contrib-footer {
  display: none;
}

.ic-cubes.show-2d .calendar-graph,
.ic-cubes.show-2d .contrib-footer {
  display: block;
}

.ic-cubes #contributions-calendar {
  min-height: 3px;
  border-top: 0;
}

.ic-contributions-wrapper {
  position: relative;
}

.ic-stats-block {
  position: absolute;
}

.ic-stats-top {
  top: 30px;
  left: 420px;
}

.ic-stats-bottom {
  top: 265px;
  left: 20px;
}

.ic-stats-table {
  display: table;
}

.ic-stats-row {
  display: table-row;
}

.ic-stats-label {
  display: table-cell;
  padding-bottom: 20px;
  font-size: 14px;
  color: #777;
  text-align: right;
  vertical-align: bottom;
}

.ic-stats-count {
  display: block;
  font-size: 40px;
  font-weight: bold;
  line-height: 38px;
  color: #1e6823;
}

.ic-stats-meta {
  display: table-cell;
  padding-bottom: 20px;
  padding-left: 8px;
  text-align: left;
  vertical-align: bottom;
}

.ic-stats-total-meta {
  vertical-align: middle;
}

.ic-stats-average {
  font-weight: bold;
  color: #24292e;
}

.ic-stats-unit {
  display: block;
  font-size: 15px;
}

.ic-stats-date {
  display: block;
  color: #999;
}

.ic-footer {
  position: absolute;
  top: 450px;
  left: 20px;
  font-size: 11px;
  color: #999;
}

.ic-footer a {
  color: #777;
}
*/}).toString().slice(15).slice(0, -4);

window.addEventListener('load', function(){
    var style = document.createElement('style');
    style.appendChild(document.createTextNode(""));
    document.head.appendChild(style);
    isoCss.split('\n\n').forEach((v, i) => style.sheet.insertRule(v, i));
});


// Generated by CoffeeScript 1.10.0
var Iso;

Iso = (function() {
    var COLORS, averageCount, bestDay, contributionsBox, dateOptions, dateWithYearOptions, firstDay, lastDay, maxCount, yearTotal;

    COLORS = [new obelisk.CubeColor().getByHorizontalColor(0xebedf0), new obelisk.CubeColor().getByHorizontalColor(0xc6e48b), new obelisk.CubeColor().getByHorizontalColor(0x7bc96f), new obelisk.CubeColor().getByHorizontalColor(0x239a3b), new obelisk.CubeColor().getByHorizontalColor(0x196127)];

    yearTotal = 0;

    averageCount = 0;

    maxCount = 0;

    bestDay = null;

    firstDay = null;

    lastDay = null;

    contributionsBox = null;

    dateOptions = {
        month: "short",
        day: "numeric"
    };

    dateWithYearOptions = {
        month: "short",
        day: "numeric",
        year: "numeric"
    };

    function Iso(target) {
        var graphContainer, observer;
        if (target) {
            graphContainer = ($('.js-contribution-graph')).parent()[0];
            if (graphContainer) {
                observer = new MutationObserver((function(_this) {
                    return function(mutations) {
                        var isGraphAdded;
                        isGraphAdded = mutations.find(function(mutation) {
                            return [].find.call(mutation.addedNodes, function(node) {
                                return node.className === "js-contribution-graph";
                            });
                        });
                        if (isGraphAdded) {
                            return _this.generateIsometricChart();
                        }
                    };
                })(this));
                observer.observe(graphContainer, {
                    childList: true
                });
            }
            this.getSettings((function(_this) {
                return function() {
                    return _this.generateIsometricChart();
                };
            })(this));
        }
    }

    Iso.prototype.getSettings = function(callback) {
        var ref, ref1;
        if ((typeof chrome !== "undefined" && chrome !== null ? chrome.storage : void 0) != null) {
            return chrome.storage.local.get(['toggleSetting', 'show2DSetting'], (function(_this) {
                return function(arg) {
                    var show2DSetting, toggleSetting;
                    toggleSetting = arg.toggleSetting, show2DSetting = arg.show2DSetting;
                    _this.toggleSetting = toggleSetting != null ? toggleSetting : 'cubes';
                    _this.show2DSetting = show2DSetting != null ? show2DSetting : 'no';
                    return callback();
                };
            })(this));
        } else {
            this.toggleSetting = (ref = localStorage.toggleSetting) != null ? ref : 'cubes';
            this.show2DSetting = (ref1 = localStorage.show2DSetting) != null ? ref1 : 'no';
            return callback();
        }
    };

    Iso.prototype.persistSetting = function(key, value, callback) {
        var obj;
        if (callback == null) {
            callback = function() {};
        }
        if ((typeof chrome !== "undefined" && chrome !== null ? chrome.storage : void 0) != null) {
            obj = {};
            obj[key] = value;
            return chrome.storage.local.set(obj, callback);
        } else {
            localStorage[key] = value;
            return callback();
        }
    };

    Iso.prototype.generateIsometricChart = function() {
        this.resetValues();
        this.initUI();
        this.loadStats();
        return this.renderIsometricChart();
    };

    Iso.prototype.resetValues = function() {
        yearTotal = 0;
        averageCount = 0;
        maxCount = 0;
        bestDay = null;
        firstDay = null;
        lastDay = null;
        return contributionsBox = null;
    };

    Iso.prototype.initUI = function() {
        var htmlFooter, htmlToggle, insertLocation;
        ($('<div class="ic-contributions-wrapper"></div>')).insertBefore($('.js-calendar-graph'));
        ($('<canvas id="isometric-contributions" width="720" height="470"></canvas>')).appendTo('.ic-contributions-wrapper');
        contributionsBox = $('.js-contribution-graph');
        insertLocation = ($('.js-contribution-graph')).find('h2');
        htmlToggle = "<span class=\"ic-toggle\">\n  <a href=\"#\" class=\"ic-toggle-option tooltipped tooltipped-nw squares\" data-ic-option=\"squares\" aria-label=\"Normal chart view\"></a>\n  <a href=\"#\" class=\"ic-toggle-option tooltipped tooltipped-nw cubes\" data-ic-option=\"cubes\" aria-label=\"Isometric chart view\"></a>\n</span>";
        ($(htmlToggle)).insertBefore(insertLocation);
        htmlFooter = "<span class=\"ic-footer\">\n  <a href=\"#\" class=\"ic-2d-toggle\">Show normal chart below ▾</a>\n</span>";
        ($(htmlFooter)).appendTo($('.ic-contributions-wrapper'));
        return this.observeToggle();
    };

    Iso.prototype.observeToggle = function() {
        var self;
        self = this;
        ($('.ic-toggle-option')).click(function(e) {
            var option;
            e.preventDefault();
            option = ($(this)).data('ic-option');
            if (option === 'squares') {
                (contributionsBox.removeClass('ic-cubes')).addClass('ic-squares');
            } else {
                (contributionsBox.removeClass('ic-squares')).addClass('ic-cubes');
            }
            ($('.ic-toggle-option')).removeClass('active');
            ($(this)).addClass('active');
            self.persistSetting("toggleSetting", option);
            return self.toggleSetting = option;
        });
        ($(".ic-toggle-option." + this.toggleSetting)).addClass('active');
        contributionsBox.addClass("ic-" + this.toggleSetting);
        ($('.ic-2d-toggle')).click(function(e) {
            e.preventDefault();
            if (contributionsBox.hasClass('show-2d')) {
                ($(this)).text('Show normal chart ▾');
                contributionsBox.removeClass('show-2d');
                self.persistSetting("show2DSetting", 'no');
                return self.show2DSetting = 'no';
            } else {
                ($(this)).text('Hide normal chart ▴');
                contributionsBox.addClass('show-2d');
                self.persistSetting("show2DSetting", 'yes');
                return self.show2DSetting = 'yes';
            }
        });
        if (this.show2DSetting === "yes") {
            contributionsBox.addClass('show-2d');
            return ($('.ic-2d-toggle')).text('Hide normal chart ▴');
        } else {
            contributionsBox.removeClass('show-2d');
            return ($('.ic-2d-toggle')).text('Show normal chart ▾');
        }
    };

    Iso.prototype.loadStats = function() {
        var contribColumns, countTotal, currentDayCount, currentStreakEnd, currentStreakStart, d, dateBest, dateFirst, dateLast, datesCurrent, datesLongest, datesTotal, dayDifference, days, i, j, len, longestStreakEnd, longestStreakStart, streakCurrent, streakLongest, tempStreak, tempStreakStart;
        streakLongest = 0;
        streakCurrent = 0;
        tempStreak = 0;
        tempStreakStart = null;
        longestStreakStart = null;
        longestStreakEnd = null;
        currentStreakStart = null;
        currentStreakEnd = null;
        datesCurrent = null;
        contribColumns = $('.contrib-column');
        days = $('.js-calendar-graph rect.day');
        days.each(function(d) {
            var currentDayCount, tempStreakEnd;
            currentDayCount = ($(this)).data('count');
            yearTotal += currentDayCount;
            if (d === 0) {
                firstDay = ($(this)).data('date');
            }
            if (d === days.length - 1) {
                lastDay = ($(this)).data('date');
            }
            if (currentDayCount > maxCount) {
                bestDay = ($(this)).data('date');
                maxCount = currentDayCount;
            }
            if (currentDayCount > 0) {
                if (tempStreak === 0) {
                    tempStreakStart = ($(this)).data('date');
                }
                tempStreak++;
                if (tempStreak >= streakLongest) {
                    longestStreakStart = tempStreakStart;
                    longestStreakEnd = ($(this)).data('date');
                    return streakLongest = tempStreak;
                }
            } else {
                tempStreak = 0;
                tempStreakStart = null;
                return tempStreakEnd = null;
            }
        });
        days = ($('.js-calendar-graph rect.day')).get().reverse();
        currentStreakEnd = days[0].getAttribute('data-date');
        for (i = j = 0, len = days.length; j < len; i = ++j) {
            d = days[i];
            currentDayCount = parseInt(d.getAttribute('data-count'), 10);
            if (i === 0 && currentDayCount === 0) {
                currentStreakEnd = days[1].getAttribute('data-date');
                continue;
            }
            if (currentDayCount > 0) {
                streakCurrent++;
                currentStreakStart = d.getAttribute('data-date');
            } else {
                break;
            }
        }
        if (streakCurrent > 0) {
            currentStreakStart = this.formatDateString(currentStreakStart, dateOptions);
            currentStreakEnd = this.formatDateString(currentStreakEnd, dateOptions);
            datesCurrent = currentStreakStart + " — " + currentStreakEnd;
        } else {
            datesCurrent = "No current streak";
        }
        countTotal = yearTotal.toLocaleString();
        dateFirst = this.formatDateString(firstDay, dateWithYearOptions);
        dateLast = this.formatDateString(lastDay, dateWithYearOptions);
        datesTotal = dateFirst + " — " + dateLast;
        dayDifference = this.datesDayDifference(firstDay, lastDay);
        averageCount = this.precisionRound(yearTotal / dayDifference, 2);
        dateBest = this.formatDateString(bestDay, dateOptions);
        if (!dateBest) {
            dateBest = 'No activity found';
        }
        longestStreakStart = this.formatDateString(longestStreakStart, dateOptions);
        longestStreakEnd = this.formatDateString(longestStreakEnd, dateOptions);
        datesLongest = longestStreakStart + " — " + longestStreakEnd;
        this.renderTopStats(countTotal, averageCount, datesTotal, maxCount, dateBest);
        return this.renderBottomStats(streakLongest, datesLongest, streakCurrent, datesCurrent);
    };

    Iso.prototype.renderTopStats = function(countTotal, averageCount, datesTotal, maxCount, dateBest) {
        var html;
        html = "<div class=\"ic-stats-block ic-stats-top\">\n  <span class=\"ic-stats-table\">\n    <span class=\"ic-stats-row\">\n      <span class=\"ic-stats-label\">1 year total\n        <span class=\"ic-stats-count\">" + countTotal + "</span>\n        <span class=\"ic-stats-average\">" + averageCount + "</span> per day\n      </span>\n      <span class=\"ic-stats-meta ic-stats-total-meta\">\n        <span class=\"ic-stats-unit\">contributions</span>\n        <span class=\"ic-stats-date\">" + datesTotal + "</span>\n      </span>\n    </span>\n    <span class=\"ic-stats-row\">\n      <span class=\"ic-stats-label\">Busiest day\n        <span class=\"ic-stats-count\">" + maxCount + "</span>\n      </span>\n      <span class=\"ic-stats-meta\">\n        <span class=\"ic-stats-unit\">contributions</span>\n          <span class=\"ic-stats-date\">" + dateBest + "</span>\n        </span>\n      </span>\n    </span>\n  </span>\n</div>";
        return ($(html)).appendTo($('.ic-contributions-wrapper'));
    };

    Iso.prototype.renderBottomStats = function(streakLongest, datesLongest, streakCurrent, datesCurrent) {
        var html;
        html = "<div class=\"ic-stats-block ic-stats-bottom\">\n  <span class=\"ic-stats-table\">\n    <span class=\"ic-stats-row\">\n      <span class=\"ic-stats-label\">Longest streak\n        <span class=\"ic-stats-count\">" + streakLongest + "</span>\n      </span>\n      <span class=\"ic-stats-meta\">\n        <span class=\"ic-stats-unit\">days</span>\n        <span class=\"ic-stats-date\">" + datesLongest + "</span>\n      </span>\n    </span>\n    <span class=\"ic-stats-row\">\n      <span class=\"ic-stats-label\">Current streak\n        <span class=\"ic-stats-count\">" + streakCurrent + "</span>\n      </span>\n      <span class=\"ic-stats-meta\">\n        <span class=\"ic-stats-unit\">days</span>\n        <span class=\"ic-stats-date\">" + datesCurrent + "</span>\n      </span>\n    </span>\n  </span>\n</div>";
        return ($(html)).appendTo($('.ic-contributions-wrapper'));
    };

    Iso.prototype.renderIsometricChart = function() {
        var GH_OFFSET, MAX_HEIGHT, SIZE, canvas, contribCount, pixelView, point, self;
        SIZE = 10;
        GH_OFFSET = 12;
        MAX_HEIGHT = 100;
        canvas = document.getElementById('isometric-contributions');
        point = new obelisk.Point(110, 110);
        pixelView = new obelisk.PixelView(canvas, point);
        contribCount = null;
        self = this;
        return ($('.js-calendar-graph g > g')).each(function(g) {
            var x;
            x = parseInt(((($(this)).attr('transform')).match(/(\d+)/))[0] / (GH_OFFSET + 1));
            return (($(this)).find('rect')).each(function(r) {
                var color, cube, cubeHeight, dimension, fill, p3d, y;
                r = ($(this)).get(0);
                y = parseInt((($(this)).attr('y')) / GH_OFFSET);
                fill = ($(this)).attr('fill');
                contribCount = parseInt(($(this)).data('count'));
                cubeHeight = 3;
                if (maxCount > 0) {
                    cubeHeight += parseInt(MAX_HEIGHT / maxCount * contribCount);
                }
                dimension = new obelisk.CubeDimension(SIZE, SIZE, cubeHeight);
                color = self.getSquareColor(fill);
                cube = new obelisk.Cube(dimension, color, false);
                p3d = new obelisk.Point3D(SIZE * x, SIZE * y, 0);
                return pixelView.renderObject(cube, p3d);
            });
        });
    };

    Iso.prototype.getSquareColor = function(fill) {
        var color;
        return color = (function() {
            switch (fill.toLowerCase()) {
                case 'rgb(235, 237, 240)':
                case '#ebedf0':
                    return COLORS[0];
                case 'rgb(198, 228, 139)':
                case '#c6e48b':
                    return COLORS[1];
                case 'rgb(123, 201, 111)':
                case '#7bc96f':
                    return COLORS[2];
                case 'rgb(35, 154, 59)':
                case '#239a3b':
                    return COLORS[3];
                case 'rgb(25, 97, 39)':
                case '#196127':
                    return COLORS[4];
                default:
                    if (fill.indexOf('#') !== -1) {
                        return new obelisk.CubeColor().getByHorizontalColor(parseInt('0x' + fill.replace("#", "")));
                    }
            }
        })();
    };

    Iso.prototype.formatDateString = function(dateStr, options) {
        var date, dateParts;
        date = null;
        if (dateStr) {
            dateParts = dateStr.split('-');
            date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 0, 0, 0).toLocaleDateString('en-US', options);
        }
        return date;
    };

    Iso.prototype.datesDayDifference = function(dateStr1, dateStr2) {
        var date1, date2, dateParts, diffDays, timeDiff;
        diffDays = null;
        date1 = null;
        date2 = null;
        if (dateStr1) {
            dateParts = dateStr1.split('-');
            date1 = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 0, 0, 0);
        }
        if (dateStr2) {
            dateParts = dateStr2.split('-');
            date2 = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 0, 0, 0);
        }
        if (dateStr1 && dateStr2) {
            timeDiff = Math.abs(date2.getTime() - date1.getTime());
            diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
        }
        return diffDays;
    };

    Iso.prototype.precisionRound = function(number, precision) {
        var factor;
        factor = Math.pow(10, precision);
        return Math.round(number * factor) / factor;
    };

    return Iso;

})();

$(function() {
    var iso, target;
    target = document.querySelector('.js-calendar-graph');
    return iso = new Iso(target);
});
