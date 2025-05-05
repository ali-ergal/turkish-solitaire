let isAnimating = false;

function setAnimationState(active) {
    isAnimating = active;
}

function animateCardToSeries(card, seriesIndex) {
    if (isAnimating) return;
    setAnimationState(true);

    const cardImg = document.querySelector('#drawnCards img');
    const targetBox = document.querySelectorAll('.series-container')[seriesIndex];

    const rectFrom = cardImg.getBoundingClientRect();
    const rectTo = targetBox.getBoundingClientRect();

    const flying = document.createElement("img");
    flying.src = cardImageFile(card);
    flying.className = "flying-card";
    flying.style.position = "fixed";
    flying.style.left = rectFrom.left + "px";
    flying.style.top = rectFrom.top + "px";
    flying.style.width = cardImg.offsetWidth + "px";
    flying.style.height = cardImg.offsetHeight + "px";
    flying.style.zIndex = "1000";
    document.body.appendChild(flying);

    const dx = (rectTo.left + rectTo.width / 2) - (rectFrom.left + rectFrom.width / 2);
    const dy = (rectTo.top + rectTo.height / 2) - (rectFrom.top + rectFrom.height / 2);

    anime({
        targets: flying,
        translateX: dx,
        translateY: dy,
        scale: 1,
        opacity: 1,
        duration: 400,
        easing: "easeOutQuad",
        complete: () => {
            flying.remove();
            placeCardOnSeries(seriesIndex);
            setAnimationState(false);
        }
    });
}

function animateCardDraw(cards) {
    if (isAnimating) return;
    setAnimationState(true);

    const drawnDiv = document.getElementById("drawnCards");
    const deckEl = document.getElementById("deck");
    const deckRect = deckEl.getBoundingClientRect();
    const drawnRect = drawnDiv.getBoundingClientRect();

    const oldCards = [...drawnDiv.querySelectorAll("img")]; // Keep old cards
    const newFlyingCards = [];
    let animationsCompleted = 0;

    cards.forEach((card, i) => {
        const img = document.createElement("img");
        img.src = cardImageFile(card);
        img.alt = formatCard(card);
        img.className = "card-img";
        img.style.opacity = "0";
        img.style.position = "fixed";
        img.style.left = (deckRect.left + deckRect.width / 2 - 15) + "px";
        img.style.top = (deckRect.top + deckRect.height / 2 - 30) + "px";
        img.style.width = "100px";
        img.style.zIndex = 100 + i;
        document.body.appendChild(img);

        const finalLeft = drawnRect.left + (i === 0 ? 0 : i === 1 ? 15 : 30);
        const finalTop = drawnRect.top;

        anime({
            targets: img,
            translateX: finalLeft - parseFloat(img.style.left),
            translateY: finalTop - parseFloat(img.style.top),
            opacity: 1,
            duration: 500,
            delay: i * 150,
            easing: "easeOutExpo",
            complete: () => {
                newFlyingCards.push({ img, card });

                animationsCompleted++;

                // ✅ Wait until all cards are done flying
                if (animationsCompleted === cards.length) {
                    // Step 1: Remove old drawn cards
                    oldCards.forEach(old => old.remove());

                    // Step 2: Clean up the drawnDiv
                    drawnDiv.innerHTML = "";

                    // Step 3: Append new cards properly
                    newFlyingCards.forEach((item, idx) => {
                        const { img, card } = item;

                        img.style.position = "absolute";
                        img.style.left = "";
                        img.style.top = "";
                        img.style.transform = "none";
                        img.style.opacity = "1";
                        img.style.zIndex = "";

                        drawnDiv.appendChild(img);

                        // Set proper stacking (30px / 15px layout)
                        if (idx === 0) {
                            img.style.left = "0px";
                        } else if (idx === 1) {
                            img.style.left = "15px";
                        } else if (idx === 2) {
                            img.style.left = "30px";
                        }

                        img.addEventListener("click", () => {
                            tryAutoPlaceCard(card);
                        });
                        setAnimationState(false);
                    });
                }
            }
        });
    });
}

function animateUndoDraw(cardsToReturn, existingCards, deckRect, drawnDiv) {
    if (isAnimating) return;
    setAnimationState(true);

    const flyingBackCards = [];
    let animationsCompleted = 0;

    cardsToReturn.forEach((card, i) => {
        const img = existingCards[i];
        const fromRect = img.getBoundingClientRect();

        const flying = document.createElement("img");
        flying.src = cardImageFile(card);
        flying.className = "flying-card";
        flying.style.position = "fixed";
        flying.style.left = fromRect.left + "px";
        flying.style.top = fromRect.top + "px";
        flying.style.width = "80px";
        flying.style.height = "120px";
        flying.style.zIndex = 100 + i;
        document.body.appendChild(flying);

        const dx = (deckRect.left + deckRect.width / 2 - 35) - fromRect.left;
        const dy = (deckRect.top + deckRect.height / 2 - 55) - fromRect.top;

        anime({
            targets: flying,
            translateX: dx,
            translateY: dy,
            opacity: 0.5,
            duration: 500,
            delay: i * 150,
            easing: "easeOutExpo",
            complete: () => {
                flyingBackCards.push(flying);
                animationsCompleted++;

                if (animationsCompleted === cardsToReturn.length) {
                    flyingBackCards.forEach(card => card.remove());

                    drawnDiv.innerHTML = "";
                    drawIndex -= lastDrawCount;
                    updateUI();

                    document.getElementById("status").innerText = t("statusUndoDone", { n: 3 });
                    lastDrawCount = 0;
                    undoEnabled = false;
                    selectedCard = null;
                    setAnimationState(false);
                }
            }
        });
    });
}

function triggerWinCelebration() {
    if (window.confetti) {
        const duration = 3 * 1000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
            confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        })();
    }

    playSound("winSound");

    const cards = document.querySelectorAll(".card-img");
    cards.forEach((img, i) => {
        anime({
            targets: img,
            translateY: -600,
            rotate: 720,
            opacity: 0,
            duration: 1000,
            delay: i * 50,
            easing: "easeInQuad"
        });
    });

    setTimeout(() => {
        const modal = document.getElementById("winModal");
        const winStats = document.getElementById("winStats");
        if (modal && winStats) {
            winStats.innerText = `🏆 Kazandınız! Skor: ${score}`;
            modal.style.display = "flex";
        }
    }, 1500);
}
/*
 * anime.js v3.2.1
 * (c) 2020 Julian Garnier
 * Released under the MIT license
 * animejs.com
 */

!function(n,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):n.anime=e()}(this,function(){"use strict";var n={update:null,begin:null,loopBegin:null,changeBegin:null,change:null,changeComplete:null,loopComplete:null,complete:null,loop:1,direction:"normal",autoplay:!0,timelineOffset:0},e={duration:1e3,delay:0,endDelay:0,easing:"easeOutElastic(1, .5)",round:0},t=["translateX","translateY","translateZ","rotate","rotateX","rotateY","rotateZ","scale","scaleX","scaleY","scaleZ","skew","skewX","skewY","perspective","matrix","matrix3d"],r={CSS:{},springs:{}};function a(n,e,t){return Math.min(Math.max(n,e),t)}function o(n,e){return n.indexOf(e)>-1}function u(n,e){return n.apply(null,e)}var i={arr:function(n){return Array.isArray(n)},obj:function(n){return o(Object.prototype.toString.call(n),"Object")},pth:function(n){return i.obj(n)&&n.hasOwnProperty("totalLength")},svg:function(n){return n instanceof SVGElement},inp:function(n){return n instanceof HTMLInputElement},dom:function(n){return n.nodeType||i.svg(n)},str:function(n){return"string"==typeof n},fnc:function(n){return"function"==typeof n},und:function(n){return void 0===n},nil:function(n){return i.und(n)||null===n},hex:function(n){return/(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(n)},rgb:function(n){return/^rgb/.test(n)},hsl:function(n){return/^hsl/.test(n)},col:function(n){return i.hex(n)||i.rgb(n)||i.hsl(n)},key:function(t){return!n.hasOwnProperty(t)&&!e.hasOwnProperty(t)&&"targets"!==t&&"keyframes"!==t}};function c(n){var e=/\(([^)]+)\)/.exec(n);return e?e[1].split(",").map(function(n){return parseFloat(n)}):[]}function s(n,e){var t=c(n),o=a(i.und(t[0])?1:t[0],.1,100),u=a(i.und(t[1])?100:t[1],.1,100),s=a(i.und(t[2])?10:t[2],.1,100),f=a(i.und(t[3])?0:t[3],.1,100),l=Math.sqrt(u/o),d=s/(2*Math.sqrt(u*o)),p=d<1?l*Math.sqrt(1-d*d):0,v=1,h=d<1?(d*l-f)/p:-f+l;function g(n){var t=e?e*n/1e3:n;return t=d<1?Math.exp(-t*d*l)*(v*Math.cos(p*t)+h*Math.sin(p*t)):(v+h*t)*Math.exp(-t*l),0===n||1===n?n:1-t}return e?g:function(){var e=r.springs[n];if(e)return e;for(var t=0,a=0;;)if(1===g(t+=1/6)){if(++a>=16)break}else a=0;var o=t*(1/6)*1e3;return r.springs[n]=o,o}}function f(n){return void 0===n&&(n=10),function(e){return Math.ceil(a(e,1e-6,1)*n)*(1/n)}}var l,d,p=function(){var n=11,e=1/(n-1);function t(n,e){return 1-3*e+3*n}function r(n,e){return 3*e-6*n}function a(n){return 3*n}function o(n,e,o){return((t(e,o)*n+r(e,o))*n+a(e))*n}function u(n,e,o){return 3*t(e,o)*n*n+2*r(e,o)*n+a(e)}return function(t,r,a,i){if(0<=t&&t<=1&&0<=a&&a<=1){var c=new Float32Array(n);if(t!==r||a!==i)for(var s=0;s<n;++s)c[s]=o(s*e,t,a);return function(n){return t===r&&a===i?n:0===n||1===n?n:o(f(n),r,i)}}function f(r){for(var i=0,s=1,f=n-1;s!==f&&c[s]<=r;++s)i+=e;var l=i+(r-c[--s])/(c[s+1]-c[s])*e,d=u(l,t,a);return d>=.001?function(n,e,t,r){for(var a=0;a<4;++a){var i=u(e,t,r);if(0===i)return e;e-=(o(e,t,r)-n)/i}return e}(r,l,t,a):0===d?l:function(n,e,t,r,a){for(var u,i,c=0;(u=o(i=e+(t-e)/2,r,a)-n)>0?t=i:e=i,Math.abs(u)>1e-7&&++c<10;);return i}(r,i,i+e,t,a)}}}(),v=(l={linear:function(){return function(n){return n}}},d={Sine:function(){return function(n){return 1-Math.cos(n*Math.PI/2)}},Circ:function(){return function(n){return 1-Math.sqrt(1-n*n)}},Back:function(){return function(n){return n*n*(3*n-2)}},Bounce:function(){return function(n){for(var e,t=4;n<((e=Math.pow(2,--t))-1)/11;);return 1/Math.pow(4,3-t)-7.5625*Math.pow((3*e-2)/22-n,2)}},Elastic:function(n,e){void 0===n&&(n=1),void 0===e&&(e=.5);var t=a(n,1,10),r=a(e,.1,2);return function(n){return 0===n||1===n?n:-t*Math.pow(2,10*(n-1))*Math.sin((n-1-r/(2*Math.PI)*Math.asin(1/t))*(2*Math.PI)/r)}}},["Quad","Cubic","Quart","Quint","Expo"].forEach(function(n,e){d[n]=function(){return function(n){return Math.pow(n,e+2)}}}),Object.keys(d).forEach(function(n){var e=d[n];l["easeIn"+n]=e,l["easeOut"+n]=function(n,t){return function(r){return 1-e(n,t)(1-r)}},l["easeInOut"+n]=function(n,t){return function(r){return r<.5?e(n,t)(2*r)/2:1-e(n,t)(-2*r+2)/2}},l["easeOutIn"+n]=function(n,t){return function(r){return r<.5?(1-e(n,t)(1-2*r))/2:(e(n,t)(2*r-1)+1)/2}}}),l);function h(n,e){if(i.fnc(n))return n;var t=n.split("(")[0],r=v[t],a=c(n);switch(t){case"spring":return s(n,e);case"cubicBezier":return u(p,a);case"steps":return u(f,a);default:return u(r,a)}}function g(n){try{return document.querySelectorAll(n)}catch(n){return}}function m(n,e){for(var t=n.length,r=arguments.length>=2?arguments[1]:void 0,a=[],o=0;o<t;o++)if(o in n){var u=n[o];e.call(r,u,o,n)&&a.push(u)}return a}function y(n){return n.reduce(function(n,e){return n.concat(i.arr(e)?y(e):e)},[])}function b(n){return i.arr(n)?n:(i.str(n)&&(n=g(n)||n),n instanceof NodeList||n instanceof HTMLCollection?[].slice.call(n):[n])}function M(n,e){return n.some(function(n){return n===e})}function x(n){var e={};for(var t in n)e[t]=n[t];return e}function w(n,e){var t=x(n);for(var r in n)t[r]=e.hasOwnProperty(r)?e[r]:n[r];return t}function k(n,e){var t=x(n);for(var r in e)t[r]=i.und(n[r])?e[r]:n[r];return t}function O(n){return i.rgb(n)?(t=/rgb\((\d+,\s*[\d]+,\s*[\d]+)\)/g.exec(e=n))?"rgba("+t[1]+",1)":e:i.hex(n)?(r=n.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i,function(n,e,t,r){return e+e+t+t+r+r}),a=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(r),"rgba("+parseInt(a[1],16)+","+parseInt(a[2],16)+","+parseInt(a[3],16)+",1)"):i.hsl(n)?function(n){var e,t,r,a=/hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/g.exec(n)||/hsla\((\d+),\s*([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)\)/g.exec(n),o=parseInt(a[1],10)/360,u=parseInt(a[2],10)/100,i=parseInt(a[3],10)/100,c=a[4]||1;function s(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+6*(e-n)*t:t<.5?e:t<2/3?n+(e-n)*(2/3-t)*6:n}if(0==u)e=t=r=i;else{var f=i<.5?i*(1+u):i+u-i*u,l=2*i-f;e=s(l,f,o+1/3),t=s(l,f,o),r=s(l,f,o-1/3)}return"rgba("+255*e+","+255*t+","+255*r+","+c+")"}(n):void 0;var e,t,r,a}function C(n){var e=/[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?(%|px|pt|em|rem|in|cm|mm|ex|ch|pc|vw|vh|vmin|vmax|deg|rad|turn)?$/.exec(n);if(e)return e[1]}function P(n,e){return i.fnc(n)?n(e.target,e.id,e.total):n}function I(n,e){return n.getAttribute(e)}function D(n,e,t){if(M([t,"deg","rad","turn"],C(e)))return e;var a=r.CSS[e+t];if(!i.und(a))return a;var o=document.createElement(n.tagName),u=n.parentNode&&n.parentNode!==document?n.parentNode:document.body;u.appendChild(o),o.style.position="absolute",o.style.width=100+t;var c=100/o.offsetWidth;u.removeChild(o);var s=c*parseFloat(e);return r.CSS[e+t]=s,s}function B(n,e,t){if(e in n.style){var r=e.replace(/([a-z])([A-Z])/g,"$1-$2").toLowerCase(),a=n.style[e]||getComputedStyle(n).getPropertyValue(r)||"0";return t?D(n,a,t):a}}function T(n,e){return i.dom(n)&&!i.inp(n)&&(!i.nil(I(n,e))||i.svg(n)&&n[e])?"attribute":i.dom(n)&&M(t,e)?"transform":i.dom(n)&&"transform"!==e&&B(n,e)?"css":null!=n[e]?"object":void 0}function E(n){if(i.dom(n)){for(var e,t=n.style.transform||"",r=/(\w+)\(([^)]*)\)/g,a=new Map;e=r.exec(t);)a.set(e[1],e[2]);return a}}function F(n,e,t,r){var a,u=o(e,"scale")?1:0+(o(a=e,"translate")||"perspective"===a?"px":o(a,"rotate")||o(a,"skew")?"deg":void 0),i=E(n).get(e)||u;return t&&(t.transforms.list.set(e,i),t.transforms.last=e),r?D(n,i,r):i}function A(n,e,t,r){switch(T(n,e)){case"transform":return F(n,e,r,t);case"css":return B(n,e,t);case"attribute":return I(n,e);default:return n[e]||0}}function N(n,e){var t=/^(\*=|\+=|-=)/.exec(n);if(!t)return n;var r=C(n)||0,a=parseFloat(e),o=parseFloat(n.replace(t[0],""));switch(t[0][0]){case"+":return a+o+r;case"-":return a-o+r;case"*":return a*o+r}}function S(n,e){if(i.col(n))return O(n);if(/\s/g.test(n))return n;var t=C(n),r=t?n.substr(0,n.length-t.length):n;return e?r+e:r}function L(n,e){return Math.sqrt(Math.pow(e.x-n.x,2)+Math.pow(e.y-n.y,2))}function j(n){for(var e,t=n.points,r=0,a=0;a<t.numberOfItems;a++){var o=t.getItem(a);a>0&&(r+=L(e,o)),e=o}return r}function q(n){if(n.getTotalLength)return n.getTotalLength();switch(n.tagName.toLowerCase()){case"circle":return o=n,2*Math.PI*I(o,"r");case"rect":return 2*I(a=n,"width")+2*I(a,"height");case"line":return L({x:I(r=n,"x1"),y:I(r,"y1")},{x:I(r,"x2"),y:I(r,"y2")});case"polyline":return j(n);case"polygon":return t=(e=n).points,j(e)+L(t.getItem(t.numberOfItems-1),t.getItem(0))}var e,t,r,a,o}function H(n,e){var t=e||{},r=t.el||function(n){for(var e=n.parentNode;i.svg(e)&&i.svg(e.parentNode);)e=e.parentNode;return e}(n),a=r.getBoundingClientRect(),o=I(r,"viewBox"),u=a.width,c=a.height,s=t.viewBox||(o?o.split(" "):[0,0,u,c]);return{el:r,viewBox:s,x:s[0]/1,y:s[1]/1,w:u,h:c,vW:s[2],vH:s[3]}}function V(n,e,t){function r(t){void 0===t&&(t=0);var r=e+t>=1?e+t:0;return n.el.getPointAtLength(r)}var a=H(n.el,n.svg),o=r(),u=r(-1),i=r(1),c=t?1:a.w/a.vW,s=t?1:a.h/a.vH;switch(n.property){case"x":return(o.x-a.x)*c;case"y":return(o.y-a.y)*s;case"angle":return 180*Math.atan2(i.y-u.y,i.x-u.x)/Math.PI}}function $(n,e){var t=/[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g,r=S(i.pth(n)?n.totalLength:n,e)+"";return{original:r,numbers:r.match(t)?r.match(t).map(Number):[0],strings:i.str(n)||e?r.split(t):[]}}function W(n){return m(n?y(i.arr(n)?n.map(b):b(n)):[],function(n,e,t){return t.indexOf(n)===e})}function X(n){var e=W(n);return e.map(function(n,t){return{target:n,id:t,total:e.length,transforms:{list:E(n)}}})}function Y(n,e){var t=x(e);if(/^spring/.test(t.easing)&&(t.duration=s(t.easing)),i.arr(n)){var r=n.length;2===r&&!i.obj(n[0])?n={value:n}:i.fnc(e.duration)||(t.duration=e.duration/r)}var a=i.arr(n)?n:[n];return a.map(function(n,t){var r=i.obj(n)&&!i.pth(n)?n:{value:n};return i.und(r.delay)&&(r.delay=t?0:e.delay),i.und(r.endDelay)&&(r.endDelay=t===a.length-1?e.endDelay:0),r}).map(function(n){return k(n,t)})}function Z(n,e){var t=[],r=e.keyframes;for(var a in r&&(e=k(function(n){for(var e=m(y(n.map(function(n){return Object.keys(n)})),function(n){return i.key(n)}).reduce(function(n,e){return n.indexOf(e)<0&&n.push(e),n},[]),t={},r=function(r){var a=e[r];t[a]=n.map(function(n){var e={};for(var t in n)i.key(t)?t==a&&(e.value=n[t]):e[t]=n[t];return e})},a=0;a<e.length;a++)r(a);return t}(r),e)),e)i.key(a)&&t.push({name:a,tweens:Y(e[a],n)});return t}function G(n,e){var t;return n.tweens.map(function(r){var a=function(n,e){var t={};for(var r in n){var a=P(n[r],e);i.arr(a)&&1===(a=a.map(function(n){return P(n,e)})).length&&(a=a[0]),t[r]=a}return t.duration=parseFloat(t.duration),t.delay=parseFloat(t.delay),t}(r,e),o=a.value,u=i.arr(o)?o[1]:o,c=C(u),s=A(e.target,n.name,c,e),f=t?t.to.original:s,l=i.arr(o)?o[0]:f,d=C(l)||C(s),p=c||d;return i.und(u)&&(u=f),a.from=$(l,p),a.to=$(N(u,l),p),a.start=t?t.end:0,a.end=a.start+a.delay+a.duration+a.endDelay,a.easing=h(a.easing,a.duration),a.isPath=i.pth(o),a.isPathTargetInsideSVG=a.isPath&&i.svg(e.target),a.isColor=i.col(a.from.original),a.isColor&&(a.round=1),t=a,a})}var Q={css:function(n,e,t){return n.style[e]=t},attribute:function(n,e,t){return n.setAttribute(e,t)},object:function(n,e,t){return n[e]=t},transform:function(n,e,t,r,a){if(r.list.set(e,t),e===r.last||a){var o="";r.list.forEach(function(n,e){o+=e+"("+n+") "}),n.style.transform=o}}};function z(n,e){X(n).forEach(function(n){for(var t in e){var r=P(e[t],n),a=n.target,o=C(r),u=A(a,t,o,n),i=N(S(r,o||C(u)),u),c=T(a,t);Q[c](a,t,i,n.transforms,!0)}})}function _(n,e){return m(y(n.map(function(n){return e.map(function(e){return function(n,e){var t=T(n.target,e.name);if(t){var r=G(e,n),a=r[r.length-1];return{type:t,property:e.name,animatable:n,tweens:r,duration:a.end,delay:r[0].delay,endDelay:a.endDelay}}}(n,e)})})),function(n){return!i.und(n)})}function R(n,e){var t=n.length,r=function(n){return n.timelineOffset?n.timelineOffset:0},a={};return a.duration=t?Math.max.apply(Math,n.map(function(n){return r(n)+n.duration})):e.duration,a.delay=t?Math.min.apply(Math,n.map(function(n){return r(n)+n.delay})):e.delay,a.endDelay=t?a.duration-Math.max.apply(Math,n.map(function(n){return r(n)+n.duration-n.endDelay})):e.endDelay,a}var J=0;var K=[],U=function(){var n;function e(t){for(var r=K.length,a=0;a<r;){var o=K[a];o.paused?(K.splice(a,1),r--):(o.tick(t),a++)}n=a>0?requestAnimationFrame(e):void 0}return"undefined"!=typeof document&&document.addEventListener("visibilitychange",function(){en.suspendWhenDocumentHidden&&(nn()?n=cancelAnimationFrame(n):(K.forEach(function(n){return n._onDocumentVisibility()}),U()))}),function(){n||nn()&&en.suspendWhenDocumentHidden||!(K.length>0)||(n=requestAnimationFrame(e))}}();function nn(){return!!document&&document.hidden}function en(t){void 0===t&&(t={});var r,o=0,u=0,i=0,c=0,s=null;function f(n){var e=window.Promise&&new Promise(function(n){return s=n});return n.finished=e,e}var l,d,p,v,h,g,y,b,M=(d=w(n,l=t),p=w(e,l),v=Z(p,l),h=X(l.targets),g=_(h,v),y=R(g,p),b=J,J++,k(d,{id:b,children:[],animatables:h,animations:g,duration:y.duration,delay:y.delay,endDelay:y.endDelay}));f(M);function x(){var n=M.direction;"alternate"!==n&&(M.direction="normal"!==n?"normal":"reverse"),M.reversed=!M.reversed,r.forEach(function(n){return n.reversed=M.reversed})}function O(n){return M.reversed?M.duration-n:n}function C(){o=0,u=O(M.currentTime)*(1/en.speed)}function P(n,e){e&&e.seek(n-e.timelineOffset)}function I(n){for(var e=0,t=M.animations,r=t.length;e<r;){var o=t[e],u=o.animatable,i=o.tweens,c=i.length-1,s=i[c];c&&(s=m(i,function(e){return n<e.end})[0]||s);for(var f=a(n-s.start-s.delay,0,s.duration)/s.duration,l=isNaN(f)?1:s.easing(f),d=s.to.strings,p=s.round,v=[],h=s.to.numbers.length,g=void 0,y=0;y<h;y++){var b=void 0,x=s.to.numbers[y],w=s.from.numbers[y]||0;b=s.isPath?V(s.value,l*x,s.isPathTargetInsideSVG):w+l*(x-w),p&&(s.isColor&&y>2||(b=Math.round(b*p)/p)),v.push(b)}var k=d.length;if(k){g=d[0];for(var O=0;O<k;O++){d[O];var C=d[O+1],P=v[O];isNaN(P)||(g+=C?P+C:P+" ")}}else g=v[0];Q[o.type](u.target,o.property,g,u.transforms),o.currentValue=g,e++}}function D(n){M[n]&&!M.passThrough&&M[n](M)}function B(n){var e=M.duration,t=M.delay,l=e-M.endDelay,d=O(n);M.progress=a(d/e*100,0,100),M.reversePlayback=d<M.currentTime,r&&function(n){if(M.reversePlayback)for(var e=c;e--;)P(n,r[e]);else for(var t=0;t<c;t++)P(n,r[t])}(d),!M.began&&M.currentTime>0&&(M.began=!0,D("begin")),!M.loopBegan&&M.currentTime>0&&(M.loopBegan=!0,D("loopBegin")),d<=t&&0!==M.currentTime&&I(0),(d>=l&&M.currentTime!==e||!e)&&I(e),d>t&&d<l?(M.changeBegan||(M.changeBegan=!0,M.changeCompleted=!1,D("changeBegin")),D("change"),I(d)):M.changeBegan&&(M.changeCompleted=!0,M.changeBegan=!1,D("changeComplete")),M.currentTime=a(d,0,e),M.began&&D("update"),n>=e&&(u=0,M.remaining&&!0!==M.remaining&&M.remaining--,M.remaining?(o=i,D("loopComplete"),M.loopBegan=!1,"alternate"===M.direction&&x()):(M.paused=!0,M.completed||(M.completed=!0,D("loopComplete"),D("complete"),!M.passThrough&&"Promise"in window&&(s(),f(M)))))}return M.reset=function(){var n=M.direction;M.passThrough=!1,M.currentTime=0,M.progress=0,M.paused=!0,M.began=!1,M.loopBegan=!1,M.changeBegan=!1,M.completed=!1,M.changeCompleted=!1,M.reversePlayback=!1,M.reversed="reverse"===n,M.remaining=M.loop,r=M.children;for(var e=c=r.length;e--;)M.children[e].reset();(M.reversed&&!0!==M.loop||"alternate"===n&&1===M.loop)&&M.remaining++,I(M.reversed?M.duration:0)},M._onDocumentVisibility=C,M.set=function(n,e){return z(n,e),M},M.tick=function(n){i=n,o||(o=i),B((i+(u-o))*en.speed)},M.seek=function(n){B(O(n))},M.pause=function(){M.paused=!0,C()},M.play=function(){M.paused&&(M.completed&&M.reset(),M.paused=!1,K.push(M),C(),U())},M.reverse=function(){x(),M.completed=!M.reversed,C()},M.restart=function(){M.reset(),M.play()},M.remove=function(n){rn(W(n),M)},M.reset(),M.autoplay&&M.play(),M}function tn(n,e){for(var t=e.length;t--;)M(n,e[t].animatable.target)&&e.splice(t,1)}function rn(n,e){var t=e.animations,r=e.children;tn(n,t);for(var a=r.length;a--;){var o=r[a],u=o.animations;tn(n,u),u.length||o.children.length||r.splice(a,1)}t.length||r.length||e.pause()}return en.version="3.2.1",en.speed=1,en.suspendWhenDocumentHidden=!0,en.running=K,en.remove=function(n){for(var e=W(n),t=K.length;t--;)rn(e,K[t])},en.get=A,en.set=z,en.convertPx=D,en.path=function(n,e){var t=i.str(n)?g(n)[0]:n,r=e||100;return function(n){return{property:n,el:t,svg:H(t),totalLength:q(t)*(r/100)}}},en.setDashoffset=function(n){var e=q(n);return n.setAttribute("stroke-dasharray",e),e},en.stagger=function(n,e){void 0===e&&(e={});var t=e.direction||"normal",r=e.easing?h(e.easing):null,a=e.grid,o=e.axis,u=e.from||0,c="first"===u,s="center"===u,f="last"===u,l=i.arr(n),d=l?parseFloat(n[0]):parseFloat(n),p=l?parseFloat(n[1]):0,v=C(l?n[1]:n)||0,g=e.start||0+(l?d:0),m=[],y=0;return function(n,e,i){if(c&&(u=0),s&&(u=(i-1)/2),f&&(u=i-1),!m.length){for(var h=0;h<i;h++){if(a){var b=s?(a[0]-1)/2:u%a[0],M=s?(a[1]-1)/2:Math.floor(u/a[0]),x=b-h%a[0],w=M-Math.floor(h/a[0]),k=Math.sqrt(x*x+w*w);"x"===o&&(k=-x),"y"===o&&(k=-w),m.push(k)}else m.push(Math.abs(u-h));y=Math.max.apply(Math,m)}r&&(m=m.map(function(n){return r(n/y)*y})),"reverse"===t&&(m=m.map(function(n){return o?n<0?-1*n:-n:Math.abs(y-n)}))}return g+(l?(p-d)/y:d)*(Math.round(100*m[e])/100)+v}},en.timeline=function(n){void 0===n&&(n={});var t=en(n);return t.duration=0,t.add=function(r,a){var o=K.indexOf(t),u=t.children;function c(n){n.passThrough=!0}o>-1&&K.splice(o,1);for(var s=0;s<u.length;s++)c(u[s]);var f=k(r,w(e,n));f.targets=f.targets||n.targets;var l=t.duration;f.autoplay=!1,f.direction=t.direction,f.timelineOffset=i.und(a)?l:N(a,l),c(t),t.seek(f.timelineOffset);var d=en(f);c(d),u.push(d);var p=R(u,n);return t.delay=p.delay,t.endDelay=p.endDelay,t.duration=p.duration,t.seek(0),t.reset(),t.autoplay&&t.play(),t},t},en.easing=h,en.penner=v,en.random=function(n,e){return Math.floor(Math.random()*(e-n+1))+n},en});
/**
 * Minified by jsDelivr using Terser v5.15.1.
 * Original file: /npm/canvas-confetti@1.6.0/dist/confetti.browser.js
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
!function(t,e){!function t(e,n,a,i){var o=!!(e.Worker&&e.Blob&&e.Promise&&e.OffscreenCanvas&&e.OffscreenCanvasRenderingContext2D&&e.HTMLCanvasElement&&e.HTMLCanvasElement.prototype.transferControlToOffscreen&&e.URL&&e.URL.createObjectURL);function r(){}function l(t){var a=n.exports.Promise,i=void 0!==a?a:e.Promise;return"function"==typeof i?new i(t):(t(r,r),null)}var c,s,u,h,f,d,m,g,b,v=(u=Math.floor(1e3/60),h={},f=0,"function"==typeof requestAnimationFrame&&"function"==typeof cancelAnimationFrame?(c=function(t){var e=Math.random();return h[e]=requestAnimationFrame((function n(a){f===a||f+u-1<a?(f=a,delete h[e],t()):h[e]=requestAnimationFrame(n)})),e},s=function(t){h[t]&&cancelAnimationFrame(h[t])}):(c=function(t){return setTimeout(t,u)},s=function(t){return clearTimeout(t)}),{frame:c,cancel:s}),M=(g={},function(){if(d)return d;if(!a&&o){var e=["var CONFETTI, SIZE = {}, module = {};","("+t.toString()+")(this, module, true, SIZE);","onmessage = function(msg) {","  if (msg.data.options) {","    CONFETTI(msg.data.options).then(function () {","      if (msg.data.callback) {","        postMessage({ callback: msg.data.callback });","      }","    });","  } else if (msg.data.reset) {","    CONFETTI && CONFETTI.reset();","  } else if (msg.data.resize) {","    SIZE.width = msg.data.resize.width;","    SIZE.height = msg.data.resize.height;","  } else if (msg.data.canvas) {","    SIZE.width = msg.data.canvas.width;","    SIZE.height = msg.data.canvas.height;","    CONFETTI = module.exports.create(msg.data.canvas);","  }","}"].join("\n");try{d=new Worker(URL.createObjectURL(new Blob([e])))}catch(t){return void 0!==typeof console&&"function"==typeof console.warn&&console.warn("🎊 Could not load worker",t),null}!function(t){function e(e,n){t.postMessage({options:e||{},callback:n})}t.init=function(e){var n=e.transferControlToOffscreen();t.postMessage({canvas:n},[n])},t.fire=function(n,a,i){if(m)return e(n,null),m;var o=Math.random().toString(36).slice(2);return m=l((function(a){function r(e){e.data.callback===o&&(delete g[o],t.removeEventListener("message",r),m=null,i(),a())}t.addEventListener("message",r),e(n,o),g[o]=r.bind(null,{data:{callback:o}})}))},t.reset=function(){for(var e in t.postMessage({reset:!0}),g)g[e](),delete g[e]}}(d)}return d}),p={particleCount:50,angle:90,spread:45,startVelocity:45,decay:.9,gravity:1,drift:0,ticks:200,x:.5,y:.5,shapes:["square","circle"],zIndex:100,colors:["#26ccff","#a25afd","#ff5e7e","#88ff5a","#fcff42","#ffa62d","#ff36ff"],disableForReducedMotion:!1,scalar:1};function y(t,e,n){return function(t,e){return e?e(t):t}(t&&null!=t[e]?t[e]:p[e],n)}function w(t){return t<0?0:Math.floor(t)}function x(t){return parseInt(t,16)}function C(t){return t.map(T)}function T(t){var e=String(t).replace(/[^0-9a-f]/gi,"");return e.length<6&&(e=e[0]+e[0]+e[1]+e[1]+e[2]+e[2]),{r:x(e.substring(0,2)),g:x(e.substring(2,4)),b:x(e.substring(4,6))}}function I(t){t.width=document.documentElement.clientWidth,t.height=document.documentElement.clientHeight}function k(t){var e=t.getBoundingClientRect();t.width=e.width,t.height=e.height}function E(t,e,n,o,r){var c,s,u=e.slice(),h=t.getContext("2d"),f=l((function(e){function l(){c=s=null,h.clearRect(0,0,o.width,o.height),r(),e()}c=v.frame((function e(){!a||o.width===i.width&&o.height===i.height||(o.width=t.width=i.width,o.height=t.height=i.height),o.width||o.height||(n(t),o.width=t.width,o.height=t.height),h.clearRect(0,0,o.width,o.height),u=u.filter((function(t){return function(t,e){e.x+=Math.cos(e.angle2D)*e.velocity+e.drift,e.y+=Math.sin(e.angle2D)*e.velocity+e.gravity,e.wobble+=e.wobbleSpeed,e.velocity*=e.decay,e.tiltAngle+=.1,e.tiltSin=Math.sin(e.tiltAngle),e.tiltCos=Math.cos(e.tiltAngle),e.random=Math.random()+2,e.wobbleX=e.x+10*e.scalar*Math.cos(e.wobble),e.wobbleY=e.y+10*e.scalar*Math.sin(e.wobble);var n=e.tick++/e.totalTicks,a=e.x+e.random*e.tiltCos,i=e.y+e.random*e.tiltSin,o=e.wobbleX+e.random*e.tiltCos,r=e.wobbleY+e.random*e.tiltSin;if(t.fillStyle="rgba("+e.color.r+", "+e.color.g+", "+e.color.b+", "+(1-n)+")",t.beginPath(),"circle"===e.shape)t.ellipse?t.ellipse(e.x,e.y,Math.abs(o-a)*e.ovalScalar,Math.abs(r-i)*e.ovalScalar,Math.PI/10*e.wobble,0,2*Math.PI):function(t,e,n,a,i,o,r,l,c){t.save(),t.translate(e,n),t.rotate(o),t.scale(a,i),t.arc(0,0,1,r,l,c),t.restore()}(t,e.x,e.y,Math.abs(o-a)*e.ovalScalar,Math.abs(r-i)*e.ovalScalar,Math.PI/10*e.wobble,0,2*Math.PI);else if("star"===e.shape)for(var l=Math.PI/2*3,c=4*e.scalar,s=8*e.scalar,u=e.x,h=e.y,f=5,d=Math.PI/f;f--;)u=e.x+Math.cos(l)*s,h=e.y+Math.sin(l)*s,t.lineTo(u,h),l+=d,u=e.x+Math.cos(l)*c,h=e.y+Math.sin(l)*c,t.lineTo(u,h),l+=d;else t.moveTo(Math.floor(e.x),Math.floor(e.y)),t.lineTo(Math.floor(e.wobbleX),Math.floor(i)),t.lineTo(Math.floor(o),Math.floor(r)),t.lineTo(Math.floor(a),Math.floor(e.wobbleY));return t.closePath(),t.fill(),e.tick<e.totalTicks}(h,t)})),u.length?c=v.frame(e):l()})),s=l}));return{addFettis:function(t){return u=u.concat(t),f},canvas:t,promise:f,reset:function(){c&&v.cancel(c),s&&s()}}}function S(t,n){var a,i=!t,r=!!y(n||{},"resize"),c=y(n,"disableForReducedMotion",Boolean),s=o&&!!y(n||{},"useWorker")?M():null,u=i?I:k,h=!(!t||!s)&&!!t.__confetti_initialized,f="function"==typeof matchMedia&&matchMedia("(prefers-reduced-motion)").matches;function d(e,n,i){for(var o,r,l,c,s,h=y(e,"particleCount",w),f=y(e,"angle",Number),d=y(e,"spread",Number),m=y(e,"startVelocity",Number),g=y(e,"decay",Number),b=y(e,"gravity",Number),v=y(e,"drift",Number),M=y(e,"colors",C),p=y(e,"ticks",Number),x=y(e,"shapes"),T=y(e,"scalar"),I=function(t){var e=y(t,"origin",Object);return e.x=y(e,"x",Number),e.y=y(e,"y",Number),e}(e),k=h,S=[],F=t.width*I.x,N=t.height*I.y;k--;)S.push((o={x:F,y:N,angle:f,spread:d,startVelocity:m,color:M[k%M.length],shape:x[(c=0,s=x.length,Math.floor(Math.random()*(s-c))+c)],ticks:p,decay:g,gravity:b,drift:v,scalar:T},r=void 0,l=void 0,r=o.angle*(Math.PI/180),l=o.spread*(Math.PI/180),{x:o.x,y:o.y,wobble:10*Math.random(),wobbleSpeed:Math.min(.11,.1*Math.random()+.05),velocity:.5*o.startVelocity+Math.random()*o.startVelocity,angle2D:-r+(.5*l-Math.random()*l),tiltAngle:(.5*Math.random()+.25)*Math.PI,color:o.color,shape:o.shape,tick:0,totalTicks:o.ticks,decay:o.decay,drift:o.drift,random:Math.random()+2,tiltSin:0,tiltCos:0,wobbleX:0,wobbleY:0,gravity:3*o.gravity,ovalScalar:.6,scalar:o.scalar}));return a?a.addFettis(S):(a=E(t,S,u,n,i)).promise}function m(n){var o=c||y(n,"disableForReducedMotion",Boolean),m=y(n,"zIndex",Number);if(o&&f)return l((function(t){t()}));i&&a?t=a.canvas:i&&!t&&(t=function(t){var e=document.createElement("canvas");return e.style.position="fixed",e.style.top="0px",e.style.left="0px",e.style.pointerEvents="none",e.style.zIndex=t,e}(m),document.body.appendChild(t)),r&&!h&&u(t);var g={width:t.width,height:t.height};function b(){if(s){var e={getBoundingClientRect:function(){if(!i)return t.getBoundingClientRect()}};return u(e),void s.postMessage({resize:{width:e.width,height:e.height}})}g.width=g.height=null}function v(){a=null,r&&e.removeEventListener("resize",b),i&&t&&(document.body.removeChild(t),t=null,h=!1)}return s&&!h&&s.init(t),h=!0,s&&(t.__confetti_initialized=!0),r&&e.addEventListener("resize",b,!1),s?s.fire(n,g,v):d(n,g,v)}return m.reset=function(){s&&s.reset(),a&&a.reset()},m}function F(){return b||(b=S(null,{useWorker:!0,resize:!0})),b}n.exports=function(){return F().apply(this,arguments)},n.exports.reset=function(){F().reset()},n.exports.create=S}(function(){return void 0!==t?t:"undefined"!=typeof self?self:this||{}}(),e,!1),t.confetti=e.exports}(window,{});
//# sourceMappingURL=/sm/6de00f2697a1683b235e589897df757a94e6809643432a9e3ad259420752442d.map
const debug = false;
const suits = ["♠", "♥", "♣", "♦"];
let deck = [], drawIndex = 0, drawnCards = [], table = [], currentRoundPlacedCards = 0;
let moveCount = 0, score = 0, comboCount = 0, highScore = Number(localStorage.getItem("highScore")) || 0;
let startTime, timerInterval, selectedCard = null, completedSuits = [], lastDrawCount = 0, undoEnabled = false;
let difficultyLevel = 3, hintTimeout = null, autoHintEnabled = Number(localStorage.getItem("autoHint")), jokerUsed = false;

const seriesInfo = [
    { suit: "♥", direction: "asc", label: "As ♥", card_image: "ace_of_hearts.png" },
    { suit: "♣", direction: "asc", label: "As ♣", card_image: "ace_of_spades.png" },
    { suit: "♦", direction: "asc", label: "As ♦", card_image: "ace_of_diamonds.png" },
    { suit: "♠", direction: "asc", label: "As ♠", card_image: "ace_of_clubs.png" },
    { suit: "♥", direction: "desc", label: "Papaz ♥", card_image: "king_of_hearts.png" },
    { suit: "♣", direction: "desc", label: "Papaz ♣", card_image: "king_of_spades.png" },
    { suit: "♦", direction: "desc", label: "Papaz ♦", card_image: "ace_of_diamonds.png" },
    { suit: "♠", direction: "desc", label: "Papaz ♠", card_image: "ace_of_clubs.png" },
];

function createDeck() {
    const winModal = document.getElementById("winModal");
    if (winModal) winModal.style.display = "none";
    difficultyLevel = Number(document.getElementById("difficultySelect").value);
    deck = suits.flatMap(suit => Array.from({ length: 13 }, (_, rank) => ({ suit, rank: rank + 1, faceUp: false })));
    deck = shuffle(deck);
    drawIndex = 0;
    drawnCards = [];
    table = Array.from({ length: 8 }, () => []);
    moveCount = score = 0;
    completedSuits = [];
    jokerUsed = false;
    document.getElementById("useJoker").disabled = false;
    updateCounters();

    const toggle = document.getElementById("autoHintToggle");
    if (toggle) {
        autoHintEnabled = toggle.checked;
        localStorage.setItem("autoHint", autoHintEnabled ? "1" : "0");
    }

    updateUI();
    updateJokerButtonState();
    renderDeckStack();
    startTime = Date.now();
    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
    document.getElementById("status").innerText = "";
}

function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

function drawThree() {

    comboCount = 0;
    document.getElementById("status").innerText = "";

    if (drawIndex >= deck.length) {
        if (currentRoundPlacedCards === 0 && jokerUsed === true) {
            document.getElementById("status").innerText = t("statusGameOver", { n: 3 });
            return;
        }

        drawIndex = 0;
        currentRoundPlacedCards = 0;
        drawnCards = [];
        selectedCard = null;
        playNewTurnSound();
        updateUI();
        return;
    }

    moveCount++;
    updateCounters();

    const remaining = deck.length - drawIndex;
    const drawCount = Math.min(difficultyLevel, remaining);
    lastDrawCount = drawCount;
    undoEnabled = true;

    if (hintTimeout) clearTimeout(hintTimeout);

    if (autoHintEnabled) {
        hintTimeout = setTimeout(() => {
            showHint();
        }, 3000);
    }

    // Instead of drawing all at once, we'll animate them one by one!
    let drawAnimations = [];

    for (let i = 0; i < drawCount; i++) {
        const card = deck[drawIndex];
        card.faceUp = true;
        drawnCards.push(card);
        drawIndex++;

        // We'll delay UI update slightly
        drawAnimations.push(card);
    }

    // Now show drawn cards with animation
    animateCardDraw(drawAnimations);
    updateJokerButtonState();

    renderDeckStack();
}

function undoDraw() {

    if (!undoEnabled) {
        document.getElementById("status").innerText = t("statusUndoBlocked", { n: 3 });
        setAnimationState(false);
        return;
    }

    if (lastDrawCount === 0 || drawnCards.length < lastDrawCount) {
        document.getElementById("status").innerText = t("statusUndoNone", { n: 3 });
        setAnimationState(false);
        return;
    }

    const deckEl = document.getElementById("deck");
    const deckRect = deckEl.getBoundingClientRect();
    const drawnDiv = document.getElementById("drawnCards");
    const cardsToReturn = drawnCards.slice(-lastDrawCount);
    const existingCards = [...drawnDiv.querySelectorAll("img")];

    drawnCards.splice(-lastDrawCount, lastDrawCount);

    animateUndoDraw(cardsToReturn, existingCards, deckRect, drawnDiv);
}

function checkSuitCompletion(suit) {
    if (completedSuits.includes(suit)) return;

    const relatedSeriesIndexes = seriesInfo
        .map((s, i) => (s.suit === suit ? i : -1))
        .filter(i => i !== -1);

    const totalCards = relatedSeriesIndexes.reduce((sum, i) => sum + table[i].length, 0);

    if (totalCards === 13) {
        completedSuits.push(suit);
        score += 100;
        updateCounters();
        document.getElementById("status").innerText = `🎉 ${suit} serisi tamamlandı! +100 puan`;
    }
}

function canPlaceCardOnSeries(seriesIndex, card) {
    const { suit, direction } = seriesInfo[seriesIndex];
    const pile = table[seriesIndex];
    const top = pile[pile.length - 1];

    if (card.suit !== suit) return false;

    if (!top) {
        return direction === "asc" ? card.rank === 1 : card.rank === 13;
    } else {
        return direction === "asc"
            ? card.rank === top.rank + 1
            : card.rank === top.rank - 1;
    }
}

function placeCardOnSeries(index) {

    updateJokerButtonState();
    if (drawnCards.length === 0) return;

    if (hintTimeout) clearTimeout(hintTimeout);

    const card = drawnCards[drawnCards.length - 1];

    if (canPlaceCardOnSeries(index, card)) {
        playDropSound();

        table[index].push(card);
        undoEnabled = false;

        if (table[index].length === 13) {
            score += 100;
            document.getElementById("status").innerText = t("statusSeriesComplete", { n: 3 });
        }
        drawnCards.pop();

        const cardIndexInDeck = deck.findIndex(
            c => c.suit === card.suit && c.rank === card.rank
        );
        if (cardIndexInDeck !== -1) {
            deck.splice(cardIndexInDeck, 1);
            drawIndex--;
        }

        currentRoundPlacedCards++;

        comboCount++;
        const comboBonus = (comboCount - 1) * 5;
        score += 10 + comboBonus;
        updateCounters();

        checkSuitCompletion(card.suit);

        updateUI();

        if (table.flat().length === 52) {
            score += 500;
            updateCounters();
            const duration = Math.floor((Date.now() - startTime) / 1000);
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            saveScoreHistory(score, moveCount);
            let finalMessage = `${t("statusWin", { n: 3 })}\n${t("moveLabel", { n: 3 })}: ${moveCount}, ${t("scoreLabel", { n: 3 })}: ${score}, ${t("durationLabel", { n: 3 })}: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            markDailyCompleted(); // 👈 after a win
            if (score > highScore) {
                localStorage.setItem("highScore", score);
                highScore = score;
                finalMessage += `\n${t("statusNewRecord", { n: 3 })}`;
            }
            updateCounters();
            clearInterval(timerInterval);
            document.getElementById("status").innerText = "";

            document.querySelectorAll(".card-img").forEach((img, i) => {
                setTimeout(() => {
                    img.classList.add("win-fly");
                }, i * 50);
            });

            setTimeout(() => {
                const modal = document.getElementById("winModal");
                const winStats = document.getElementById("winStats");
                winStats.innerText = finalMessage.replaceAll("\n", "\n");
                triggerWinCelebration();
                modal.style.display = "flex";

            }, 1000);
        }
    } else {
        document.getElementById("status").innerText = t("statusCardNotAllowed", { n: 3 });
    }
}

function tryAutoPlaceCard(card) {
    let targetIndex = -1;
    for (let i = 0; i < table.length; i++) {
        if (canPlaceCardOnSeries(i, card)) {
            targetIndex = i;
            break;
        }
    }

    if (targetIndex === -1) {
        document.getElementById("status").innerText = t("statusCardNoTarget", { n: 3 });
        return;
    }

    animateCardToSeries(card, targetIndex);
}

function useJoker() {
    if (jokerUsed) {
        document.getElementById("status").innerText = t("statusJokerAlready", { n: 3 });
        return;
    }

    if (drawIndex >= deck.length) {
        document.getElementById("status").innerText = t("statusJokerEmpty", { n: 3 });
        return;
    }

    // Joker mantığı: sıradaki kartı sona taşı
    const card = deck.splice(drawIndex, 1)[0];
    deck.push(card);

    jokerUsed = true;
    document.getElementById("useJoker").disabled = true;
    document.getElementById("status").innerText = t("statusJokerUsed", { n: 3 });
    updateUI();
}

function showHint() {
    if (drawnCards.length === 0) return;

    const topCard = drawnCards[drawnCards.length - 1];
    let targetIndex = -1;

    for (let i = 0; i < table.length; i++) {
        if (canPlaceCardOnSeries(i, topCard)) {
            targetIndex = i;
            break;
        }
    }

    if (targetIndex !== -1) {
        const seriesEl = document.querySelectorAll(".series-container")[targetIndex];
        anime({
            targets: seriesEl,
            boxShadow: [
                "0 0 0px rgba(255, 255, 0, 0)",
                "0 0 20px 5px gold",
                "0 0 0px rgba(255, 255, 0, 0)"
            ],
            duration: 1000,
            easing: "easeInOutQuad"
        });
    }
}

window.addEventListener("DOMContentLoaded", createDeck);
document.getElementById("deck").addEventListener("click", drawThree);
document.getElementById("undoBtn").addEventListener("click", undoDraw);

function seededShuffle(array, seed) {
    function xmur3(str) {
        for (var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
            h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
        return function () {
            h = Math.imul(h ^ (h >>> 16), 2246822507);
            h = Math.imul(h ^ (h >>> 13), 3266489909);
            return (h ^= h >>> 16) >>> 0;
        };
    }

    function mulberry32(a) {
        return function () {
            var t = (a += 0x6d2b79f5);
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    let seedFn = xmur3(seed);
    let rand = mulberry32(seedFn());

    return array
        .map(a => [rand(), a])
        .sort((a, b) => a[0] - b[0])
        .map(a => a[1]);
}

function getTodaySeed() {
    const today = new Date();
    return today.toISOString().split("T")[0];
}

function hasPlayedDaily() {
    const today = getTodaySeed();
    return localStorage.getItem("dailyChallengeCompleted") === today;
}

function markDailyCompleted() {
    const today = getTodaySeed();
    localStorage.setItem("dailyChallengeCompleted", today);
    const btn = document.getElementById("dailyChallengeBtn");
    if (btn) {
        btn.disabled = true;
        btn.innerText = t("dailyCompleted");
    }
}

function updateDailyButtonState() {
    const btn = document.getElementById("dailyChallengeBtn");
    if (!btn) return;
    if (hasPlayedDaily()) {
        btn.disabled = true;
        btn.style.opacity = 0.5;
        btn.innerText = t("dailyCompleted");
    } else {
        btn.disabled = false;
        btn.style.opacity = 1;
        btn.innerText = t("dailyChallenge");
    }
}

function startDailyChallenge() {
    if (hasPlayedDaily()) {
        alert(t("alreadyCompleted"));
        return;
    }

    document.getElementById("mainMenu").style.display = "none";
    document.getElementById("settingsModal").style.display = "none";
    document.getElementById("deckArea").style.display = "flex";
    document.getElementById("undoWrapper").style.display = "flex";
    document.getElementById("jokerWrapper").style.display = "flex";
    document.getElementById("counters").style.display = "block";
    document.getElementById("gameArea").style.display = "flex";

    createDeck(true);
}

function createDeck(isDaily = false) {
    const winModal = document.getElementById("winModal");
    if (winModal) winModal.style.display = "none";
    difficultyLevel = Number(document.getElementById("difficultySelect")?.value || 3);
    const baseDeck = suits.flatMap(suit => Array.from({ length: 13 }, (_, rank) => ({ suit, rank: rank + 1, faceUp: false })));
    deck = isDaily ? seededShuffle(baseDeck, getTodaySeed()) : shuffle(baseDeck);

    drawIndex = 0;
    drawnCards = [];
    table = Array.from({ length: 8 }, () => []);
    moveCount = score = 0;
    completedSuits = [];
    jokerUsed = false;
    document.getElementById("useJoker").disabled = false;
    updateCounters();

    const toggle = document.getElementById("autoHintToggle");
    if (toggle) {
        autoHintEnabled = toggle.checked;
        localStorage.setItem("autoHint", autoHintEnabled ? "1" : "0");
    }

    updateUI();
    renderDeckStack();
    startTime = Date.now();
    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
    document.getElementById("status").innerText = "";
}

window.addEventListener("DOMContentLoaded", updateDailyButtonState);
const toggleDebugPanel = () => {
    const debugPanel = document.getElementById("debugPanel");
    debugPanel.style.display = debug ? "block" : "none";
};

toggleDebugPanel();

let currentLanguage = localStorage.getItem("deckoLang") || "tr";

const translations = {
  tr: {
    newGame: "🎮 Yeni Oyun",
    dailyChallenge: "🗓 Günlük Görev",
    dailyCompleted: "✅ Günlük Görev Tamamlandı",
    scoreHistory: "📊 Skor Geçmişi",
    help: "❓ Yardım",
    alreadyCompleted: "✅ Bugünün görevi zaten tamamlandı!",
    settingsTitle: "🎮 Yeni Oyun Ayarları",
    difficultyEasy: "🟢 Kolay (1 kart)",
    difficultyMedium: "🟡 Orta (2 kart)",
    difficultyHard: "🔴 Zor (3 kart)",
    autoHint: "💡 Otomatik İpucu",
    start: "✅ Başla",
    winTitle: "🏆 Tebrikler!",
    playAgain: "🔁 Tekrar Oyna",
    historyTitle: "📊 Skor Geçmişi",
    helpTitle: "❓ Oyun Kuralları",
    helpOk: "✅ Anladım",
    nicknamePrompt: "👤 Enter your Nickname",
    nicknameSave: "Kaydet",
    moveLabel: "Hamle",
    scoreLabel: "Skor",
    highScoreLabel: "Rekor",
    durationLabel: "Süre",
    noScores: "Henüz skor kaydı yok.",
    statusSeriesComplete: "🎉 {n}. seri tamamlandı! +100 puan",
    statusGameOver: "💀 Oyun bitti! Hiç kart yerleştiremedin.",
    statusWin: "Oyunu kazandınız!",
    statusNewRecord: "🎉 Yeni Rekor!",
    statusCardNotAllowed: "⛔ Bu kart bu seriye konulamaz.",
    statusUndoBlocked: "🚫 Geri alma devre dışı (kart yerleştirildi).",
    statusUndoNone: "⛔ Geri alınacak çekilmiş kart yok.",
    statusUndoDone: "↩️ Açılan kartlar geri alındı.",
    statusJokerUsed: "🃏 Joker kullanıldı! Kart sona taşındı.",
    statusJokerAlready: "❌ Joker zaten kullanıldı.",
    statusJokerEmpty: "⛔ Joker kullanılacak kart kalmadı.",
    statusCardInvalid: "❌ Bu kart geçersiz.",
    statusCardNoTarget: "❌ Bu kart için uygun bir seri yok."
  },
  en: {
    newGame: "🎮 New Game",
    dailyChallenge: "🗓 Daily Challenge",
    dailyCompleted: "✅ Challenge Completed",
    scoreHistory: "📊 Score History",
    help: "❓ Help",
    alreadyCompleted: "✅ Today's challenge already completed!",
    settingsTitle: "🎮 Game Settings",
    difficultyEasy: "🟢 Easy (1 card)",
    difficultyMedium: "🟡 Medium (2 cards)",
    difficultyHard: "🔴 Hard (3 cards)",
    autoHint: "💡 Auto Hint",
    start: "✅ Start",
    winTitle: "🏆 Congratulations!",
    playAgain: "🔁 Play Again",
    historyTitle: "📊 Score History",
    helpTitle: "❓ Game Rules",
    helpOk: "✅ Got it",
    nicknamePrompt: "👤 Enter your Nickname",
    nicknameSave: "Save",
    moveLabel: "Moves",
    scoreLabel: "Score",
    highScoreLabel: "High Score",
    durationLabel: "Duration",
    noScores: "No score records yet.",
    statusSeriesComplete: "🎉 {n}th series complete! +100 pts",
    statusGameOver: "💀 Game over! You couldn't place any cards.",
    statusWin: "You Win!",
    statusNewRecord: "🎉 New High Score!",
    statusCardNotAllowed: "⛔ This card can't be placed here.",
    statusUndoBlocked: "🚫 Undo disabled (a card was placed).",
    statusUndoNone: "⛔ No drawn cards to undo.",
    statusUndoDone: "↩️ Drawn cards returned.",
    statusJokerUsed: "🃏 Joker used! Card sent to the end.",
    statusJokerAlready: "❌ Joker already used.",
    statusJokerEmpty: "⛔ No card to use Joker on.",
    statusCardInvalid: "❌ Invalid card.",
    statusCardNoTarget: "❌ No valid series for this card."
  }
};

function t(key, params = {}) {
  let text = translations[currentLanguage][key] || key;
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(`{${k}}`, v);
  }
  return text;
}

function changeLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem("deckoLang", lang);
  updateLanguageTexts();
}

function updateLanguageTexts() {
  const $ = id => document.getElementById(id);

  $("dailyChallengeBtn").innerText = hasPlayedDaily() ? t("dailyCompleted") : t("dailyChallenge");
  document.querySelector("button[onclick='openSettingsModal()']").innerText = t("newGame");
  document.querySelector("button[onclick='showScoreHistory()']").innerText = t("scoreHistory");
  document.querySelector("button[onclick='openHelp()']").innerText = t("help");
  const selector = $("languageSelect");
  if (selector) selector.value = currentLanguage;

  $("settingsModal").querySelector("h2").innerText = t("settingsTitle");
  const options = $("difficultySelect").options;
  if (options.length >= 3) {
    options[0].text = t("difficultyEasy");
    options[1].text = t("difficultyMedium");
    options[2].text = t("difficultyHard");
  }
  const label = $("autoHintToggle").parentNode;
  if (label) label.lastChild.textContent = t("autoHint");
  $("settingsModal").querySelector("button[onclick='startGameFromModal()']").innerText = t("start");

  $("winModal").querySelector("h2").innerText = t("winTitle");
  $("winModal").querySelector("button").innerText = t("playAgain");

  $("scoreHistoryModal").querySelector("h2").innerText = t("historyTitle");

  $("helpModal").querySelector("h2").innerText = t("helpTitle");
  $("helpModal").querySelector("button").innerText = t("helpOk");

  $("nicknameModal").querySelector("h2").innerText = t("nicknamePrompt");
  $("nicknameModal").querySelector("button").innerText = t("nicknameSave");

  $("moveCounter").innerText = `${t("moveLabel")}: ${moveCount}`;
  $("scoreCounter").innerText = `${t("scoreLabel")}: ${score}`;
}

window.addEventListener("DOMContentLoaded", updateLanguageTexts);

function openHelp() {
    const modal = document.getElementById("helpModal");
    const helpContent = modal.querySelector(".help-content");
    const helpTitle = modal.querySelector("h2");
    const helpButton = modal.querySelector("button");

    const helpTexts = {
        tr: `
        <p>🃏 8 Serili oyunda amaç, tüm kartları 8 farklı seriye doğru şekilde dizmektir.</p>
        <ul style="text-align: left; padding-left: 20px;">
          <li>4 seri küçükten büyüğe (As ➡️ Papaz)</li>
          <li>4 seri büyükten küçüğe (Papaz ➡️ As)</li>
          <li>Aynı seri içinde sadece aynı tür (örneğin sadece ♥) kartlar yerleştirilebilir.</li>
          <li>Her çekimde 1, 2 veya 3 kart çekebilirsin (zorluk seçimine göre).</li>
          <li>Doğru seriye kart koyarsan puan kazanırsın.</li>
          <li>Her kart yerleştirmede 10 puan, seri tamamladığında ekstra 100 puan kazanırsın.</li>
          <li>Bir turda hiç kart yerleştiremezsen yeni deste açılır.</li>
          <li>Bir kere joker hakkın var! Çıkmayan kartı sona atabilirsin.</li>
          <li>En yüksek skoru ve en kısa sürede bitirmeye çalış!</li>
        </ul>
      `,
        en: `
        <p>🃏 The goal is to place all cards into 8 correct series.</p>
        <ul style="text-align: left; padding-left: 20px;">
          <li>4 series go ascending (Ace ➡️ King)</li>
          <li>4 series go descending (King ➡️ Ace)</li>
          <li>Only same-suit cards can be placed in a series.</li>
          <li>Each draw gives 1, 2, or 3 cards based on difficulty.</li>
          <li>Placing a card earns you points.</li>
          <li>+10 points per card placed, +100 for completing a series.</li>
          <li>If you can’t place any cards in a turn, a new draw starts.</li>
          <li>You can use one Joker to move a stuck card to the end.</li>
          <li>Try to score the most points in the shortest time!</li>
        </ul>
      `
    };

    const helpTitles = {
        tr: "❓ Oyun Kuralları",
        en: "❓ Game Rules"
    };

    const helpButtons = {
        tr: "✅ Anladım",
        en: "✅ Got it"
    };

    helpTitle.innerText = helpTitles[currentLanguage] || helpTitles.tr;
    helpContent.innerHTML = helpTexts[currentLanguage] || helpTexts.tr;
    helpButton.innerText = helpButtons[currentLanguage] || helpButtons.tr;

    modal.style.display = "flex";
}

function closeHelp() {
    document.getElementById("helpModal").style.display = "none";
}

function openSettingsModal() {
    document.getElementById("mainMenu").style.display = "none";
    document.getElementById("settingsModal").style.display = "flex";
}

function backToMainMenu() {
    document.getElementById("mainMenu").style.display = "flex";
    document.getElementById("gameArea").style.display = "none";
    document.getElementById("undoWrapper").style.display = "none";
    document.getElementById("jokerWrapper").style.display = "none";
    document.getElementById("counters").style.display = "none";
    document.getElementById("settingsModal").style.display = "none";
}

function startGameFromModal() {
    document.getElementById("deckArea").style.display = "flex";
    document.getElementById("undoWrapper").style.display = "flex";
    document.getElementById("jokerWrapper").style.display = "flex";
    document.getElementById("counters").style.display = "block";
    document.getElementById("gameArea").style.display = "flex";
    const modal = document.getElementById("settingsModal");
    if (modal) modal.style.display = "none";
    createDeck();
}

function openSettingsFromWin() {
    const winModal = document.getElementById("winModal");
    if (winModal) winModal.style.display = "none";

    const settingsModal = document.getElementById("settingsModal");
    if (settingsModal) settingsModal.style.display = "flex";
}

function openSettingsFromLoss() {
    const settingsModal = document.getElementById("settingsModal");
    if (settingsModal) settingsModal.style.display = "flex";
}

document.getElementById("homeBtn").addEventListener("click", backToMainMenu);

document.getElementById("resetBtn").addEventListener("click", () => {
    document.getElementById("settingsModal").style.display = "flex";
});
function checkNickname() {
    const nickname = localStorage.getItem('deckoNickname');
    if (!nickname) {
        document.getElementById('nicknameModal').style.display = 'block';
    } else {
        createDeck();
    }
}

function submitNickname() {
    const input = document.getElementById('nicknameInput').value.trim();
    if (input.length > 0) {
        localStorage.setItem('deckoNickname', input);
        document.getElementById('nicknameModal').style.display = 'none';
        createDeck();
    } else {
        alert('❗Please enter a valid nickname.');
    }
}

window.addEventListener("DOMContentLoaded", checkNickname);
function saveScoreHistory(score, moves) {
    let history = JSON.parse(localStorage.getItem("scoreHistory")) || [];
    const duration = Math.floor((Date.now() - startTime) / 1000); // saniye cinsinden süre
    const nickname = localStorage.getItem("deckoNickname");
    history.push({
        nickname,
        score,
        moves,
        duration, // yeni eklenen alan
        date: new Date().toLocaleString()
    });
    localStorage.setItem("scoreHistory", JSON.stringify(history));
}

function showScoreHistory() {
    const modal = document.getElementById("scoreHistoryModal");
    const tableDiv = document.getElementById("scoreHistoryTable");
    const history = JSON.parse(localStorage.getItem("scoreHistory")) || [];

    if (history.length === 0) {
        tableDiv.innerHTML = "<p>Henüz skor kaydı yok.</p>";
    } else {
        history.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.duration - b.duration;
        });
        const top10 = history.slice(0, 10);

        let html = `
          <table>
            <tr>
              <th>#</th>
              <th>Nickname</th>
              <th>Skor</th>
              <th>Hamle</th>
              <th>Süre</th>
            </tr>
        `;
        top10.forEach((h, idx) => {
            const minutes = Math.floor(h.duration / 60);
            const seconds = h.duration % 60;
            html += `
              <tr>
                <td>${idx + 1}</td>
                <td>${h.nickname}</td>   <!-- added -->
                <td>${h.score}</td>
                <td>${h.moves}</td>
                <td>${minutes}:${seconds.toString().padStart(2, '0')}</td>
              </tr>
            `;
        });
        html += "</table>";
        tableDiv.innerHTML = html;
    }

    modal.style.display = "flex";
}

function closeScoreHistory() {
    document.getElementById("scoreHistoryModal").style.display = "none";
}

function clearScoreHistory() {
    localStorage.removeItem("scoreHistory");
    showScoreHistory();
}
let soundEnabled = 0

function playSound(id) {
    if (!soundEnabled) return; // Ses kapalıysa hiçbir şey yapma

    const audio = document.getElementById(id);
    if (audio) {
        audio.currentTime = 0;
        audio.play();
    }
}

function playDropSound() {
    playSound("dropSound");
}

function playNewTurnSound() {
    playSound("newTurnSound");
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem("deckoSound", soundEnabled ? "1" : "0");
    const btn = document.getElementById("soundToggleBtn");
    if (btn) btn.innerText = soundEnabled ? "🔊" : "🔇";
}

function initializeSoundToggle() {
    const btn = document.getElementById("soundToggleBtn");
    if (btn) btn.innerText = soundEnabled ? "🔊" : "🔇";
}

document.addEventListener("DOMContentLoaded", () => {
    initializeSoundToggle();
    const btn = document.getElementById("soundToggleBtn");
    if (btn) btn.addEventListener("click", toggleSound);
});

function updateCounters() {
    const highScoreDisplay = ` (${t("highScoreLabel", { n: 3 })}: ${highScore})`;
    document.getElementById("moveCounter").innerText = `${t("moveLabel", { n: 3 })}: ${moveCount}`;
    document.getElementById("scoreCounter").innerText = `${t("scoreLabel", { n: 3 })}: ${score}${highScoreDisplay}`;
}

function cardImageFile(card) {
    const rankMap = { 1: "ace", 11: "jack", 12: "queen", 13: "king" };
    const suitMap = { "♠": "spades", "♥": "hearts", "♦": "diamonds", "♣": "clubs" };
    return `images/cards/standard/${rankMap[card.rank] || card.rank}_of_${suitMap[card.suit]}.png`;
}

function formatCard(card) {
    const names = { 1: "As", 11: "Vale", 12: "Kız", 13: "Papaz" };
    return `${names[card.rank] || card.rank}${card.suit}`;
}

function renderDeckStack() {
    const deckEl = document.getElementById("deck");
    deckEl.innerHTML = ""; // Clear existing stack

    const visibleCount = Math.min(deck.length - drawIndex, 5); // Max 5 cards visible in stack

    for (let i = 0; i < visibleCount; i++) {
        const img = document.createElement("img");
        img.src = "images/cards/standard/back.png"; // back side of the card
        img.className = "deck-card";
        img.style.position = "absolute";
        img.style.right = `${i * 2}px`; // Slight horizontal offset
        img.style.zIndex = i;
        deckEl.appendChild(img);
    }

    if (visibleCount === 0) {
        deckEl.classList.add("empty");
    } else {
        deckEl.classList.remove("empty");
    }
}

function updateJokerButtonState() {
    const btn = document.getElementById("useJoker");
    if (!btn) return;
    btn.disabled = jokerUsed || drawnCards.length > 0 || drawIndex >= deck.length;
  }

function updateUI() {
    updateJokerButtonState();

    const deckEl = document.getElementById("deck");
    if (drawIndex >= deck.length) {
        deckEl.classList.add("empty");
    } else {
        deckEl.classList.remove("empty");
    }

    const drawnDiv = document.getElementById("drawnCards");
    drawnDiv.innerHTML = "";

    if (drawnCards.length > 0) {
        const drawCount = Math.min(difficultyLevel, drawnCards.length);
        const start = drawnCards.length - drawCount;
        const visibleCards = drawnCards.slice(start);

        visibleCards.forEach((card, i) => {
            const img = document.createElement("img");
            img.src = cardImageFile(card);
            img.alt = formatCard(card);
            img.className = "card-img";
            img.style.zIndex = i + 1;

            if (i === visibleCards.length - 1) {
                img.setAttribute("draggable", "true");
                img.addEventListener("click", () => {
                    tryAutoPlaceCard(card);
                });
            }

            drawnDiv.appendChild(img);
        });
    }

    const tableDiv = document.getElementById("table");
    tableDiv.innerHTML = "";

    table.forEach((pile, index) => {
        const container = document.createElement("div");
        container.className = "series-container";

        const top = pile[pile.length - 1];
        if (top) {
            const img = document.createElement("img");
            img.src = cardImageFile(top);
            img.alt = formatCard(top);
            img.className = "card-img";
            container.appendChild(img);
            container.classList.remove("empty");
            container.removeAttribute("data-label");
        } else {
            container.classList.add("empty");

            const { suit, direction } = seriesInfo[index];
            const base = direction === "asc" ? "as" : "king";
            const suitMap = { "♠": "spades", "♥": "hearts", "♦": "diamonds", "♣": "clubs" };
            container.classList.add(`${base}-${suitMap[suit]}`);
        }

        tableDiv.appendChild(container);
    });

    if (debug) {
        const remainingDiv = document.getElementById("remainingCards");
        remainingDiv.innerHTML = "";

        deck.slice(drawIndex).forEach(card => {
            const span = document.createElement("span");
            span.textContent = formatCard(card) + " ";
            remainingDiv.appendChild(span);
        });
    }
}

function updateTimer() {
    const diff = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
}