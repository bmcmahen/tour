/**
 * Module dependencies
 */

var Tip = require('tip');
var shortcuts = require('shortcuts');
var classes = require('classes');
var events = require('events');
var emitter = require('emitter');
var template = require('./template.html');
var domify = require('domify');

/**
 * Expose Tour
 */

module.exports = Tour;

/**
 * Tour Constructor
 */

function Tour() {
  if (!(this instanceof Tour)) return new Tour();
  this.steps = [];
  this.showing = false;
}

emitter(Tour.prototype);

/**
 * Add a new step
 *
 * @param {String|Element} html
 * @param {Element} target
 */

Tour.prototype.add = function (html, target) {

  var el = this.render(html);

  var tip = new Tip(el);
  tip.effect('fade');
  tip.position('left');
  tip.on('hiding', this.onhide.bind(this));

  var step = {
    target: target,
    tip: tip,
    i : this.steps.length
  };

  this.emit('added', step);
  this.steps.push(step);
  return this;
};

/**
 * Render content of a tip.
 *
 * You can overwrite this to provide your
 * custom rendering logic.
 *
 * @param  {String|Element} html
 * @return {Element}
 */

Tour.prototype.render = function(html) {
  var el = domify(template);
  var content = el.querySelector('.Tour-tip-content');
  if (typeof html == 'string') {
    html = domify(html);
  }
  content.appendChild(html);
  return el;
};

/**
 * Show a particular step by index
 *
 * @param  {Int} i
 * @return {Tour}
 */

Tour.prototype.show = function (i) {
  var next = this.steps[i];
  if (!next) throw new Error('Step not found.');

  // add a 'Tour-last' class to last step
  if (i === this.steps.length - 1) {
    var inner = next.tip.el.querySelector('.tip-inner');
    classes(inner).add('Tour-last');
  }

  // show tip
  next.tip.show(next.target);
  next.tip.el.querySelector('.Tour').focus();

  // hide previous
  if (this.showing) {
    this.next = next;
    this.showing.tip.hide();
  } else {
    this.bind();
  }

  // add 'Tour-showing' class to target
  this.showing = next;
  classes(next.target).add('Tour-showing');
  delete this.next;

  return this;
};

/**
 * Show next step
 *
 * @return {Tour}
 */

Tour.prototype.showNext = function() {
  if (!this.showing) return;
  if (this.showing.i + 1 >= this.steps.length) {
    return this.end();
  }
  this.show(this.showing.i + 1);
  return this;
};

/**
 * Show prev step
 *
 * @return {Tour}
 */

Tour.prototype.showPrev = function () {
  if (!this.showing) return;
  if (this.showing.i - 1 < 0) {
    return this.end();
  }
  this.show(this.showing.i - 1);
  return this;
};

/**
 * End our tour
 *
 * @return {Tour}
 */

Tour.prototype.end = function () {
  this.showing.tip.hide();
  return this;
};

/**
 * Start our tour at 0
 *
 * @return {Tour}
 */

Tour.prototype.start = function() {
  this.show(0);
  return this;
};

/**
 * Bind events.
 *
 * @return {Tour}
 */

Tour.prototype.bind = function() {
  this.shortcuts = shortcuts(document, this);
  this.shortcuts.bind('left', 'showPrev');
  this.shortcuts.bind('right', 'showNext');
  this.shortcuts.bind('esc', 'end');
  this.events = events(document, this);
  setTimeout(function(){
    this.events.bind('touchstart', 'onclick');
    this.events.bind('click', 'onclick');
    this.events.bind('click [data-tour-next]', 'showNext');
    this.events.bind('click [data-tour-prev]', 'showPrev');
    this.events.bind('click [data-tour-end]', 'end');
  }.bind(this), 0);
  return this;
};

/**
 * Unbind events.
 *
 * @return {Tour}
 */

Tour.prototype.unbind = function() {
  this.shortcuts.unbind();
  this.events.unbind();
};

/**
 * On document click, check if we should close
 * our tour.
 *
 * @param  {Event} e
 */

Tour.prototype.onclick = function(e) {
  if (!this.showing.tip.el.contains(e.target)) {
    this.end();
  }
};

/**
 * onhide event
 */

Tour.prototype.onhide = function() {
  if (this.showing) {
    classes(this.showing.target).remove('Tour-showing');
  }
  if (!this.next) {
    this.showing = false;
    this.unbind();
  }
};

/**
 * Use a plugin
 *
 * @param  {Function} plugin
 * @param  {Object} options
 * @return {Tour}
 */

Tour.prototype.use = function(plugin, options) {
  plugin(this, options);
  return this;
};
