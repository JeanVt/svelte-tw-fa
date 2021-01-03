(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('@fortawesome/free-solid-svg-icons')) :
    typeof define === 'function' && define.amd ? define(['@fortawesome/free-solid-svg-icons'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.TwFa = factory(global.freeSolidSvgIcons));
}(this, (function (freeSolidSvgIcons) { 'use strict';

    function noop() { }
    const identity = x => x;
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.wholeText !== data)
            text.data = data;
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function slide(node, { delay = 0, duration = 400, easing = cubicOut }) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => 'overflow: hidden;' +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }

    function isDate(value) {
      return value instanceof Date || Object.prototype.toString.call(value) === '[object Date]';
    }
    function toDate(value) {
      if (isDate(value)) {
        return new Date(value.getTime());
      }

      if (value == null) {
        return new Date(NaN);
      }

      return new Date(value);
    }
    function isValidDate(value) {
      return isDate(value) && !isNaN(value.getTime());
    }
    function startOfWeek(value) {
      var firstDayOfWeek = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

      if (!(firstDayOfWeek >= 0 && firstDayOfWeek <= 6)) {
        throw new RangeError('weekStartsOn must be between 0 and 6');
      }

      var date = toDate(value);
      var day = date.getDay();
      var diff = (day + 7 - firstDayOfWeek) % 7;
      date.setDate(date.getDate() - diff);
      date.setHours(0, 0, 0, 0);
      return date;
    }
    function startOfWeekYear(value) {
      var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          _ref$firstDayOfWeek = _ref.firstDayOfWeek,
          firstDayOfWeek = _ref$firstDayOfWeek === void 0 ? 0 : _ref$firstDayOfWeek,
          _ref$firstWeekContain = _ref.firstWeekContainsDate,
          firstWeekContainsDate = _ref$firstWeekContain === void 0 ? 1 : _ref$firstWeekContain;

      if (!(firstWeekContainsDate >= 1 && firstWeekContainsDate <= 7)) {
        throw new RangeError('firstWeekContainsDate must be between 1 and 7');
      }

      var date = toDate(value);
      var year = date.getFullYear();
      var firstDateOfFirstWeek = new Date(0);

      for (var i = year + 1; i >= year - 1; i--) {
        firstDateOfFirstWeek.setFullYear(i, 0, firstWeekContainsDate);
        firstDateOfFirstWeek.setHours(0, 0, 0, 0);
        firstDateOfFirstWeek = startOfWeek(firstDateOfFirstWeek, firstDayOfWeek);

        if (date.getTime() >= firstDateOfFirstWeek.getTime()) {
          break;
        }
      }

      return firstDateOfFirstWeek;
    }
    function getWeek(value) {
      var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          _ref2$firstDayOfWeek = _ref2.firstDayOfWeek,
          firstDayOfWeek = _ref2$firstDayOfWeek === void 0 ? 0 : _ref2$firstDayOfWeek,
          _ref2$firstWeekContai = _ref2.firstWeekContainsDate,
          firstWeekContainsDate = _ref2$firstWeekContai === void 0 ? 1 : _ref2$firstWeekContai;

      var date = toDate(value);
      var firstDateOfThisWeek = startOfWeek(date, firstDayOfWeek);
      var firstDateOfFirstWeek = startOfWeekYear(date, {
        firstDayOfWeek: firstDayOfWeek,
        firstWeekContainsDate: firstWeekContainsDate
      });
      var diff = firstDateOfThisWeek.getTime() - firstDateOfFirstWeek.getTime();
      return Math.round(diff / (7 * 24 * 3600 * 1000)) + 1;
    }

    var locale = {
      months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      weekdaysMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
      firstDayOfWeek: 0,
      firstWeekContainsDate: 1
    };

    var REGEX_FORMAT = /\[([^\]]+)]|YYYY|YY?|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|m{1,2}|s{1,2}|Z{1,2}|S{1,3}|w{1,2}|x|X|a|A/g;

    function pad(val) {
      var len = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2;
      var output = "".concat(Math.abs(val));
      var sign = val < 0 ? '-' : '';

      while (output.length < len) {
        output = "0".concat(output);
      }

      return sign + output;
    }

    function formatTimezone(offset) {
      var delimeter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
      var sign = offset > 0 ? '-' : '+';
      var absOffset = Math.abs(offset);
      var hours = Math.floor(absOffset / 60);
      var minutes = absOffset % 60;
      return sign + pad(hours, 2) + delimeter + pad(minutes, 2);
    }

    var meridiem = function meridiem(h, _, isLowercase) {
      var word = h < 12 ? 'AM' : 'PM';
      return isLowercase ? word.toLocaleLowerCase() : word;
    };

    var formatFlags = {
      Y: function Y(date) {
        var y = date.getFullYear();
        return y <= 9999 ? "".concat(y) : "+".concat(y);
      },
      // Year: 00, 01, ..., 99
      YY: function YY(date) {
        return pad(date.getFullYear(), 4).substr(2);
      },
      // Year: 1900, 1901, ..., 2099
      YYYY: function YYYY(date) {
        return pad(date.getFullYear(), 4);
      },
      // Month: 1, 2, ..., 12
      M: function M(date) {
        return date.getMonth() + 1;
      },
      // Month: 01, 02, ..., 12
      MM: function MM(date) {
        return pad(date.getMonth() + 1, 2);
      },
      MMM: function MMM(date, locale) {
        return locale.monthsShort[date.getMonth()];
      },
      MMMM: function MMMM(date, locale) {
        return locale.months[date.getMonth()];
      },
      // Day of month: 1, 2, ..., 31
      D: function D(date) {
        return date.getDate();
      },
      // Day of month: 01, 02, ..., 31
      DD: function DD(date) {
        return pad(date.getDate(), 2);
      },
      // Hour: 0, 1, ... 23
      H: function H(date) {
        return date.getHours();
      },
      // Hour: 00, 01, ..., 23
      HH: function HH(date) {
        return pad(date.getHours(), 2);
      },
      // Hour: 1, 2, ..., 12
      h: function h(date) {
        var hours = date.getHours();

        if (hours === 0) {
          return 12;
        }

        if (hours > 12) {
          return hours % 12;
        }

        return hours;
      },
      // Hour: 01, 02, ..., 12
      hh: function hh() {
        var hours = formatFlags.h.apply(formatFlags, arguments);
        return pad(hours, 2);
      },
      // Minute: 0, 1, ..., 59
      m: function m(date) {
        return date.getMinutes();
      },
      // Minute: 00, 01, ..., 59
      mm: function mm(date) {
        return pad(date.getMinutes(), 2);
      },
      // Second: 0, 1, ..., 59
      s: function s(date) {
        return date.getSeconds();
      },
      // Second: 00, 01, ..., 59
      ss: function ss(date) {
        return pad(date.getSeconds(), 2);
      },
      // 1/10 of second: 0, 1, ..., 9
      S: function S(date) {
        return Math.floor(date.getMilliseconds() / 100);
      },
      // 1/100 of second: 00, 01, ..., 99
      SS: function SS(date) {
        return pad(Math.floor(date.getMilliseconds() / 10), 2);
      },
      // Millisecond: 000, 001, ..., 999
      SSS: function SSS(date) {
        return pad(date.getMilliseconds(), 3);
      },
      // Day of week: 0, 1, ..., 6
      d: function d(date) {
        return date.getDay();
      },
      // Day of week: 'Su', 'Mo', ..., 'Sa'
      dd: function dd(date, locale) {
        return locale.weekdaysMin[date.getDay()];
      },
      // Day of week: 'Sun', 'Mon',..., 'Sat'
      ddd: function ddd(date, locale) {
        return locale.weekdaysShort[date.getDay()];
      },
      // Day of week: 'Sunday', 'Monday', ...,'Saturday'
      dddd: function dddd(date, locale) {
        return locale.weekdays[date.getDay()];
      },
      // AM, PM
      A: function A(date, locale) {
        var meridiemFunc = locale.meridiem || meridiem;
        return meridiemFunc(date.getHours(), date.getMinutes(), false);
      },
      // am, pm
      a: function a(date, locale) {
        var meridiemFunc = locale.meridiem || meridiem;
        return meridiemFunc(date.getHours(), date.getMinutes(), true);
      },
      // Timezone: -01:00, +00:00, ... +12:00
      Z: function Z(date) {
        return formatTimezone(date.getTimezoneOffset(), ':');
      },
      // Timezone: -0100, +0000, ... +1200
      ZZ: function ZZ(date) {
        return formatTimezone(date.getTimezoneOffset());
      },
      // Seconds timestamp: 512969520
      X: function X(date) {
        return Math.floor(date.getTime() / 1000);
      },
      // Milliseconds timestamp: 512969520900
      x: function x(date) {
        return date.getTime();
      },
      w: function w(date, locale) {
        return getWeek(date, {
          firstDayOfWeek: locale.firstDayOfWeek,
          firstWeekContainsDate: locale.firstWeekContainsDate
        });
      },
      ww: function ww(date, locale) {
        return pad(formatFlags.w(date, locale), 2);
      }
    };

    function format(val, str) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var formatStr = str ? String(str) : 'YYYY-MM-DDTHH:mm:ss.SSSZ';
      var date = toDate(val);

      if (!isValidDate(date)) {
        return 'Invalid Date';
      }

      var locale$1 = options.locale || locale;
      return formatStr.replace(REGEX_FORMAT, function (match, p1) {
        if (p1) {
          return p1;
        }

        if (typeof formatFlags[match] === 'function') {
          return "".concat(formatFlags[match](date, locale$1));
        }

        return match;
      });
    }

    function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

    function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

    function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

    function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

    function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

    function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

    function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

    function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

    function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

    function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    var formattingTokens = /(\[[^\[]*\])|(MM?M?M?|Do|DD?|ddd?d?|w[o|w]?|YYYY|YY|a|A|hh?|HH?|mm?|ss?|S{1,3}|x|X|ZZ?|.)/g;
    var match1 = /\d/; // 0 - 9

    var match2 = /\d\d/; // 00 - 99

    var match3 = /\d{3}/; // 000 - 999

    var match4 = /\d{4}/; // 0000 - 9999

    var match1to2 = /\d\d?/; // 0 - 99

    var matchShortOffset = /[+-]\d\d:?\d\d/; // +00:00 -00:00 +0000 or -0000

    var matchSigned = /[+-]?\d+/; // -inf - inf

    var matchTimestamp = /[+-]?\d+(\.\d{1,3})?/; // 123456789 123456789.123
    // const matchWord = /[0-9]{0,256}['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFF07\uFF10-\uFFEF]{1,256}|[\u0600-\u06FF\/]{1,256}(\s*?[\u0600-\u06FF]{1,256}){1,2}/i; // Word

    var YEAR = 'year';
    var MONTH = 'month';
    var DAY = 'day';
    var HOUR = 'hour';
    var MINUTE = 'minute';
    var SECOND = 'second';
    var MILLISECOND = 'millisecond';
    var parseFlags = {};

    var addParseFlag = function addParseFlag(token, regex, callback) {
      var tokens = Array.isArray(token) ? token : [token];
      var func;

      if (typeof callback === 'string') {
        func = function func(input) {
          var value = parseInt(input, 10);
          return _defineProperty({}, callback, value);
        };
      } else {
        func = callback;
      }

      tokens.forEach(function (key) {
        parseFlags[key] = [regex, func];
      });
    };

    var escapeStringRegExp = function escapeStringRegExp(str) {
      return str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
    };

    var matchWordRegExp = function matchWordRegExp(localeKey) {
      return function (locale) {
        var array = locale[localeKey];

        if (!Array.isArray(array)) {
          throw new Error("Locale[".concat(localeKey, "] need an array"));
        }

        return new RegExp(array.map(escapeStringRegExp).join('|'));
      };
    };

    var matchWordCallback = function matchWordCallback(localeKey, key) {
      return function (input, locale) {
        var array = locale[localeKey];

        if (!Array.isArray(array)) {
          throw new Error("Locale[".concat(localeKey, "] need an array"));
        }

        var index = array.indexOf(input);

        if (index < 0) {
          throw new Error('Invalid Word');
        }

        return _defineProperty({}, key, index);
      };
    };

    addParseFlag('Y', matchSigned, YEAR);
    addParseFlag('YY', match2, function (input) {
      var year = new Date().getFullYear();
      var cent = Math.floor(year / 100);
      var value = parseInt(input, 10);
      value = (value > 68 ? cent - 1 : cent) * 100 + value;
      return _defineProperty({}, YEAR, value);
    });
    addParseFlag('YYYY', match4, YEAR);
    addParseFlag('M', match1to2, function (input) {
      return _defineProperty({}, MONTH, parseInt(input, 10) - 1);
    });
    addParseFlag('MM', match2, function (input) {
      return _defineProperty({}, MONTH, parseInt(input, 10) - 1);
    });
    addParseFlag('MMM', matchWordRegExp('monthsShort'), matchWordCallback('monthsShort', MONTH));
    addParseFlag('MMMM', matchWordRegExp('months'), matchWordCallback('months', MONTH));
    addParseFlag('D', match1to2, DAY);
    addParseFlag('DD', match2, DAY);
    addParseFlag(['H', 'h'], match1to2, HOUR);
    addParseFlag(['HH', 'hh'], match2, HOUR);
    addParseFlag('m', match1to2, MINUTE);
    addParseFlag('mm', match2, MINUTE);
    addParseFlag('s', match1to2, SECOND);
    addParseFlag('ss', match2, SECOND);
    addParseFlag('S', match1, function (input) {
      return _defineProperty({}, MILLISECOND, parseInt(input, 10) * 100);
    });
    addParseFlag('SS', match2, function (input) {
      return _defineProperty({}, MILLISECOND, parseInt(input, 10) * 10);
    });
    addParseFlag('SSS', match3, MILLISECOND);

    function matchMeridiem(locale) {
      return locale.meridiemParse || /[ap]\.?m?\.?/i;
    }

    function defaultIsPM(input) {
      return "".concat(input).toLowerCase().charAt(0) === 'p';
    }

    addParseFlag(['A', 'a'], matchMeridiem, function (input, locale) {
      var isPM = typeof locale.isPM === 'function' ? locale.isPM(input) : defaultIsPM(input);
      return {
        isPM: isPM
      };
    });

    function offsetFromString(str) {
      var _ref8 = str.match(/([+-]|\d\d)/g) || ['-', '0', '0'],
          _ref9 = _slicedToArray(_ref8, 3),
          symbol = _ref9[0],
          hour = _ref9[1],
          minute = _ref9[2];

      var minutes = parseInt(hour, 10) * 60 + parseInt(minute, 10);

      if (minutes === 0) {
        return 0;
      }

      return symbol === '+' ? -minutes : +minutes;
    }

    addParseFlag(['Z', 'ZZ'], matchShortOffset, function (input) {
      return {
        offset: offsetFromString(input)
      };
    });
    addParseFlag('x', matchSigned, function (input) {
      return {
        date: new Date(parseInt(input, 10))
      };
    });
    addParseFlag('X', matchTimestamp, function (input) {
      return {
        date: new Date(parseFloat(input) * 1000)
      };
    });
    addParseFlag('d', match1, 'weekday');
    addParseFlag('dd', matchWordRegExp('weekdaysMin'), matchWordCallback('weekdaysMin', 'weekday'));
    addParseFlag('ddd', matchWordRegExp('weekdaysShort'), matchWordCallback('weekdaysShort', 'weekday'));
    addParseFlag('dddd', matchWordRegExp('weekdays'), matchWordCallback('weekdays', 'weekday'));
    addParseFlag('w', match1to2, 'week');
    addParseFlag('ww', match2, 'week');

    function to24hour(hour, isPM) {
      if (hour !== undefined && isPM !== undefined) {
        if (isPM) {
          if (hour < 12) {
            return hour + 12;
          }
        } else if (hour === 12) {
          return 0;
        }
      }

      return hour;
    }

    function getFullInputArray(input) {
      var backupDate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new Date();
      var result = [0, 0, 1, 0, 0, 0, 0];
      var backupArr = [backupDate.getFullYear(), backupDate.getMonth(), backupDate.getDate(), backupDate.getHours(), backupDate.getMinutes(), backupDate.getSeconds(), backupDate.getMilliseconds()];
      var useBackup = true;

      for (var i = 0; i < 7; i++) {
        if (input[i] === undefined) {
          result[i] = useBackup ? backupArr[i] : result[i];
        } else {
          result[i] = input[i];
          useBackup = false;
        }
      }

      return result;
    }

    function createUTCDate() {
      var date;

      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      var y = args[0];

      if (y < 100 && y >= 0) {
        args[0] += 400;
        date = new Date(Date.UTC.apply(Date, args)); // eslint-disable-next-line no-restricted-globals

        if (isFinite(date.getUTCFullYear())) {
          date.setUTCFullYear(y);
        }
      } else {
        date = new Date(Date.UTC.apply(Date, args));
      }

      return date;
    }

    function makeParser(dateString, format, locale) {
      var tokens = format.match(formattingTokens);

      if (!tokens) {
        throw new Error();
      }

      var length = tokens.length;
      var mark = {};

      for (var i = 0; i < length; i += 1) {
        var token = tokens[i];
        var parseTo = parseFlags[token];

        if (!parseTo) {
          var word = token.replace(/^\[|\]$/g, '');

          if (dateString.indexOf(word) === 0) {
            dateString = dateString.substr(word.length);
          } else {
            throw new Error('not match');
          }
        } else {
          var regex = typeof parseTo[0] === 'function' ? parseTo[0](locale) : parseTo[0];
          var parser = parseTo[1];
          var value = (regex.exec(dateString) || [])[0];
          var obj = parser(value, locale);
          mark = _objectSpread({}, mark, {}, obj);
          dateString = dateString.replace(value, '');
        }
      }

      return mark;
    }

    function parse(str, format) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      try {
        var _options$locale = options.locale,
            _locale = _options$locale === void 0 ? locale : _options$locale,
            _options$backupDate = options.backupDate,
            backupDate = _options$backupDate === void 0 ? new Date() : _options$backupDate;

        var parseResult = makeParser(str, format, _locale);
        var year = parseResult.year,
            month = parseResult.month,
            day = parseResult.day,
            hour = parseResult.hour,
            minute = parseResult.minute,
            second = parseResult.second,
            millisecond = parseResult.millisecond,
            isPM = parseResult.isPM,
            date = parseResult.date,
            offset = parseResult.offset,
            weekday = parseResult.weekday,
            week = parseResult.week;

        if (date) {
          return date;
        }

        var inputArray = [year, month, day, hour, minute, second, millisecond];
        inputArray[3] = to24hour(inputArray[3], isPM); // check week

        if (week !== undefined && month === undefined && day === undefined) {
          // new Date(year, 3) make sure in current year
          var firstDate = startOfWeekYear(year === undefined ? backupDate : new Date(year, 3), {
            firstDayOfWeek: _locale.firstDayOfWeek,
            firstWeekContainsDate: _locale.firstWeekContainsDate
          });
          return new Date(firstDate.getTime() + (week - 1) * 7 * 24 * 3600 * 1000);
        }

        var utcDate = createUTCDate.apply(void 0, _toConsumableArray(getFullInputArray(inputArray, backupDate)));
        var offsetMilliseconds = (offset === undefined ? utcDate.getTimezoneOffset() : offset) * 60 * 1000;
        var parsedDate = new Date(utcDate.getTime() + offsetMilliseconds); // check weekday

        if (weekday !== undefined && parsedDate.getDay() !== weekday) {
          return new Date(NaN);
        }

        return parsedDate;
      } catch (e) {
        return new Date(NaN);
      }
    }

    /* node_modules/svelte-fa/src/fa.svelte generated by Svelte v3.31.1 */

    function create_if_block(ctx) {
    	let svg;
    	let g1;
    	let g0;
    	let svg_viewBox_value;

    	function select_block_type(ctx, dirty) {
    		if (typeof /*i*/ ctx[8][4] == "string") return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	return {
    		c() {
    			svg = svg_element("svg");
    			g1 = svg_element("g");
    			g0 = svg_element("g");
    			if_block.c();
    			attr(g0, "transform", /*transform*/ ctx[10]);
    			attr(g1, "transform", "translate(256 256)");
    			attr(svg, "id", /*id*/ ctx[1]);
    			attr(svg, "class", /*clazz*/ ctx[0]);
    			attr(svg, "style", /*s*/ ctx[9]);
    			attr(svg, "viewBox", svg_viewBox_value = `0 0 ${/*i*/ ctx[8][0]} ${/*i*/ ctx[8][1]}`);
    			attr(svg, "aria-hidden", "true");
    			attr(svg, "role", "img");
    			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, g1);
    			append(g1, g0);
    			if_block.m(g0, null);
    		},
    		p(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(g0, null);
    				}
    			}

    			if (dirty & /*transform*/ 1024) {
    				attr(g0, "transform", /*transform*/ ctx[10]);
    			}

    			if (dirty & /*id*/ 2) {
    				attr(svg, "id", /*id*/ ctx[1]);
    			}

    			if (dirty & /*clazz*/ 1) {
    				attr(svg, "class", /*clazz*/ ctx[0]);
    			}

    			if (dirty & /*s*/ 512) {
    				attr(svg, "style", /*s*/ ctx[9]);
    			}

    			if (dirty & /*i*/ 256 && svg_viewBox_value !== (svg_viewBox_value = `0 0 ${/*i*/ ctx[8][0]} ${/*i*/ ctx[8][1]}`)) {
    				attr(svg, "viewBox", svg_viewBox_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(svg);
    			if_block.d();
    		}
    	};
    }

    // (124:8) {:else}
    function create_else_block(ctx) {
    	let path0;
    	let path0_d_value;
    	let path0_fill_value;
    	let path0_fill_opacity_value;
    	let path1;
    	let path1_d_value;
    	let path1_fill_value;
    	let path1_fill_opacity_value;

    	return {
    		c() {
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr(path0, "d", path0_d_value = /*i*/ ctx[8][4][0]);
    			attr(path0, "fill", path0_fill_value = /*secondaryColor*/ ctx[4] || /*color*/ ctx[2] || "currentColor");

    			attr(path0, "fill-opacity", path0_fill_opacity_value = /*swapOpacity*/ ctx[7] != false
    			? /*primaryOpacity*/ ctx[5]
    			: /*secondaryOpacity*/ ctx[6]);

    			attr(path0, "transform", "translate(-256 -256)");
    			attr(path1, "d", path1_d_value = /*i*/ ctx[8][4][1]);
    			attr(path1, "fill", path1_fill_value = /*primaryColor*/ ctx[3] || /*color*/ ctx[2] || "currentColor");

    			attr(path1, "fill-opacity", path1_fill_opacity_value = /*swapOpacity*/ ctx[7] != false
    			? /*secondaryOpacity*/ ctx[6]
    			: /*primaryOpacity*/ ctx[5]);

    			attr(path1, "transform", "translate(-256 -256)");
    		},
    		m(target, anchor) {
    			insert(target, path0, anchor);
    			insert(target, path1, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*i*/ 256 && path0_d_value !== (path0_d_value = /*i*/ ctx[8][4][0])) {
    				attr(path0, "d", path0_d_value);
    			}

    			if (dirty & /*secondaryColor, color*/ 20 && path0_fill_value !== (path0_fill_value = /*secondaryColor*/ ctx[4] || /*color*/ ctx[2] || "currentColor")) {
    				attr(path0, "fill", path0_fill_value);
    			}

    			if (dirty & /*swapOpacity, primaryOpacity, secondaryOpacity*/ 224 && path0_fill_opacity_value !== (path0_fill_opacity_value = /*swapOpacity*/ ctx[7] != false
    			? /*primaryOpacity*/ ctx[5]
    			: /*secondaryOpacity*/ ctx[6])) {
    				attr(path0, "fill-opacity", path0_fill_opacity_value);
    			}

    			if (dirty & /*i*/ 256 && path1_d_value !== (path1_d_value = /*i*/ ctx[8][4][1])) {
    				attr(path1, "d", path1_d_value);
    			}

    			if (dirty & /*primaryColor, color*/ 12 && path1_fill_value !== (path1_fill_value = /*primaryColor*/ ctx[3] || /*color*/ ctx[2] || "currentColor")) {
    				attr(path1, "fill", path1_fill_value);
    			}

    			if (dirty & /*swapOpacity, secondaryOpacity, primaryOpacity*/ 224 && path1_fill_opacity_value !== (path1_fill_opacity_value = /*swapOpacity*/ ctx[7] != false
    			? /*secondaryOpacity*/ ctx[6]
    			: /*primaryOpacity*/ ctx[5])) {
    				attr(path1, "fill-opacity", path1_fill_opacity_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(path0);
    			if (detaching) detach(path1);
    		}
    	};
    }

    // (118:8) {#if typeof i[4] == 'string'}
    function create_if_block_1(ctx) {
    	let path;
    	let path_d_value;
    	let path_fill_value;

    	return {
    		c() {
    			path = svg_element("path");
    			attr(path, "d", path_d_value = /*i*/ ctx[8][4]);
    			attr(path, "fill", path_fill_value = /*color*/ ctx[2] || /*primaryColor*/ ctx[3] || "currentColor");
    			attr(path, "transform", "translate(-256 -256)");
    		},
    		m(target, anchor) {
    			insert(target, path, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*i*/ 256 && path_d_value !== (path_d_value = /*i*/ ctx[8][4])) {
    				attr(path, "d", path_d_value);
    			}

    			if (dirty & /*color, primaryColor*/ 12 && path_fill_value !== (path_fill_value = /*color*/ ctx[2] || /*primaryColor*/ ctx[3] || "currentColor")) {
    				attr(path, "fill", path_fill_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(path);
    		}
    	};
    }

    function create_fragment(ctx) {
    	let if_block_anchor;
    	let if_block = /*i*/ ctx[8][4] && create_if_block(ctx);

    	return {
    		c() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},
    		p(ctx, [dirty]) {
    			if (/*i*/ ctx[8][4]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { class: clazz = "" } = $$props;
    	let { id = "" } = $$props;
    	let { style = "" } = $$props;
    	let { icon } = $$props;
    	let { fw = false } = $$props;
    	let { flip = false } = $$props;
    	let { pull = false } = $$props;
    	let { rotate = false } = $$props;
    	let { size = false } = $$props;
    	let { color = "" } = $$props;
    	let { primaryColor = "" } = $$props;
    	let { secondaryColor = "" } = $$props;
    	let { primaryOpacity = 1 } = $$props;
    	let { secondaryOpacity = 0.4 } = $$props;
    	let { swapOpacity = false } = $$props;
    	let i;
    	let s;
    	let transform;

    	$$self.$$set = $$props => {
    		if ("class" in $$props) $$invalidate(0, clazz = $$props.class);
    		if ("id" in $$props) $$invalidate(1, id = $$props.id);
    		if ("style" in $$props) $$invalidate(11, style = $$props.style);
    		if ("icon" in $$props) $$invalidate(12, icon = $$props.icon);
    		if ("fw" in $$props) $$invalidate(13, fw = $$props.fw);
    		if ("flip" in $$props) $$invalidate(14, flip = $$props.flip);
    		if ("pull" in $$props) $$invalidate(15, pull = $$props.pull);
    		if ("rotate" in $$props) $$invalidate(16, rotate = $$props.rotate);
    		if ("size" in $$props) $$invalidate(17, size = $$props.size);
    		if ("color" in $$props) $$invalidate(2, color = $$props.color);
    		if ("primaryColor" in $$props) $$invalidate(3, primaryColor = $$props.primaryColor);
    		if ("secondaryColor" in $$props) $$invalidate(4, secondaryColor = $$props.secondaryColor);
    		if ("primaryOpacity" in $$props) $$invalidate(5, primaryOpacity = $$props.primaryOpacity);
    		if ("secondaryOpacity" in $$props) $$invalidate(6, secondaryOpacity = $$props.secondaryOpacity);
    		if ("swapOpacity" in $$props) $$invalidate(7, swapOpacity = $$props.swapOpacity);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*icon*/ 4096) {
    			 $$invalidate(8, i = icon && icon.icon || [0, 0, "", [], ""]);
    		}

    		if ($$self.$$.dirty & /*fw, pull, size, style*/ 174080) {
    			 {
    				let float;
    				let width;
    				const height = "1em";
    				let lineHeight;
    				let fontSize;
    				let textAlign;
    				let verticalAlign = "-.125em";
    				const overflow = "visible";

    				if (fw) {
    					textAlign = "center";
    					width = "1.25em";
    				}

    				if (pull) {
    					float = pull;
    				}

    				if (size) {
    					if (size == "lg") {
    						fontSize = "1.33333em";
    						lineHeight = ".75em";
    						verticalAlign = "-.225em";
    					} else if (size == "xs") {
    						fontSize = ".75em";
    					} else if (size == "sm") {
    						fontSize = ".875em";
    					} else {
    						fontSize = size.replace("x", "em");
    					}
    				}

    				const styleObj = {
    					float,
    					width,
    					height,
    					"line-height": lineHeight,
    					"font-size": fontSize,
    					"text-align": textAlign,
    					"vertical-align": verticalAlign,
    					overflow
    				};

    				let styleStr = "";

    				for (const prop in styleObj) {
    					if (styleObj[prop]) {
    						styleStr += `${prop}:${styleObj[prop]};`;
    					}
    				}

    				$$invalidate(9, s = styleStr + style);
    			}
    		}

    		if ($$self.$$.dirty & /*flip, rotate*/ 81920) {
    			 {
    				let t = "";

    				if (flip) {
    					let flipX = 1;
    					let flipY = 1;

    					if (flip == "horizontal") {
    						flipX = -1;
    					} else if (flip == "vertical") {
    						flipY = -1;
    					} else {
    						flipX = flipY = -1;
    					}

    					t += ` scale(${flipX} ${flipY})`;
    				}

    				if (rotate) {
    					t += ` rotate(${rotate} 0 0)`;
    				}

    				$$invalidate(10, transform = t);
    			}
    		}
    	};

    	return [
    		clazz,
    		id,
    		color,
    		primaryColor,
    		secondaryColor,
    		primaryOpacity,
    		secondaryOpacity,
    		swapOpacity,
    		i,
    		s,
    		transform,
    		style,
    		icon,
    		fw,
    		flip,
    		pull,
    		rotate,
    		size
    	];
    }

    class Fa extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			class: 0,
    			id: 1,
    			style: 11,
    			icon: 12,
    			fw: 13,
    			flip: 14,
    			pull: 15,
    			rotate: 16,
    			size: 17,
    			color: 2,
    			primaryColor: 3,
    			secondaryColor: 4,
    			primaryOpacity: 5,
    			secondaryOpacity: 6,
    			swapOpacity: 7
    		});
    	}
    }

    function clickOutside(node, onEventFunction) {
        const handleClick = event => {
            var path = event.composedPath();

            if (!path.includes(node)) {
                onEventFunction();
            }
        };

        document.addEventListener("click", handleClick);

        return {
            destroy() {
                document.removeEventListener("click", handleClick);
            }
        }
    }

    /* src/DatePicker.svelte generated by Svelte v3.31.1 */

    function add_css() {
    	var style = element("style");
    	style.id = "svelte-19l68in-style";
    	style.textContent = ".calendarDate.svelte-19l68in.svelte-19l68in{--tw-bg-opacity:1;background-color:rgba(249, 250, 251, var(--tw-bg-opacity))}.calendarDate.svelte-19l68in.svelte-19l68in:hover{--tw-bg-opacity:1;background-color:rgba(59, 130, 246, var(--tw-bg-opacity))}.calendarDate.svelte-19l68in.svelte-19l68in{cursor:pointer;height:1.25rem;padding:0.125rem;text-align:center}.calendarDate.svelte-19l68in.svelte-19l68in:hover{--tw-text-opacity:1;color:rgba(255, 255, 255, var(--tw-text-opacity))}.calendarDate.svelte-19l68in.svelte-19l68in{width:1.5rem}.calendarHolidayDate.svelte-19l68in.svelte-19l68in{--tw-text-opacity:1;color:rgba(244, 114, 182, var(--tw-text-opacity))}.calendarPreviousMonthDate.svelte-19l68in.svelte-19l68in{--tw-text-opacity:1;color:rgba(156, 163, 175, var(--tw-text-opacity))}.calendarSelectedDate.svelte-19l68in.svelte-19l68in{--tw-bg-opacity:1;background-color:rgba(59, 130, 246, var(--tw-bg-opacity));--tw-text-opacity:1;color:rgba(255, 255, 255, var(--tw-text-opacity))}.calendarTodayDate.svelte-19l68in.svelte-19l68in{--tw-border-opacity:1;border-color:rgba(96, 165, 250, var(--tw-border-opacity));border-radius:9999px;border-width:2px}.calendarArrowButton.svelte-19l68in.svelte-19l68in:hover{--tw-bg-opacity:1;background-color:rgba(191, 219, 254, var(--tw-bg-opacity))}.calendarArrowButton.svelte-19l68in.svelte-19l68in{--tw-border-opacity:1;border-color:rgba(30, 58, 138, var(--tw-border-opacity));--tw-border-opacity:0}.calendarArrowButton.svelte-19l68in.svelte-19l68in:hover{--tw-border-opacity:1}.calendarArrowButton.svelte-19l68in.svelte-19l68in{border-width:2px;cursor:pointer;padding:0.125rem}.tooltip.svelte-19l68in.svelte-19l68in{--tw-bg-opacity:1;background-color:rgba(239, 246, 255, var(--tw-bg-opacity));--tw-bg-opacity:0.8;--tw-border-opacity:1;border-color:rgba(191, 219, 254, var(--tw-border-opacity));border-width:2px;font-size:0.75rem;line-height:1rem;padding:0.5rem;position:absolute;top:-100%;right:-100%;width:100%}.calendar.svelte-19l68in select.svelte-19l68in{-moz-appearance:none;-webkit-appearance:none;background:none;text-align-last:center}.calendar.svelte-19l68in input.svelte-19l68in::-webkit-outer-spin-button,.calendar.svelte-19l68in input.svelte-19l68in::-webkit-inner-spin-button{-webkit-appearance:none;background:none}.calendar.svelte-19l68in input[type=number].svelte-19l68in{-moz-appearance:textfield;background:none}";
    	append(document.head, style);
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[34] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[37] = list[i];
    	child_ctx[39] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[40] = list[i];
    	child_ctx[39] = i;
    	return child_ctx;
    }

    // (251:8) {#if tooltipVisible}
    function create_if_block_1$1(ctx) {
    	let div;
    	let div_transition;
    	let current;

    	return {
    		c() {
    			div = element("div");

    			div.innerHTML = `<p>Example of input:</p> 
                <table><tr><td>Today </td><td>0 or double-click</td></tr> 
                    <tr><td>Full date </td><td>DD/MM/YYYY</td></tr> 
                    <tr><td>Partial date </td><td>DD or DD/MM</td></tr> 
                    <tr><td>Diff. from today </td><td>+n or -n</td></tr></table>`;

    			attr(div, "class", "tooltip svelte-19l68in");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { duration: 200 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { duration: 200 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};
    }

    // (263:4) {#if calendarVisible}
    function create_if_block$1(ctx) {
    	let div3;
    	let div2;
    	let div0;
    	let button0;
    	let fa0;
    	let t0;
    	let select;
    	let t1;
    	let button1;
    	let fa1;
    	let t2;
    	let button2;
    	let fa2;
    	let t3;
    	let input;
    	let t4;
    	let button3;
    	let fa3;
    	let t5;
    	let div1;
    	let t6;
    	let clickOutside_action;
    	let div2_transition;
    	let current;
    	let mounted;
    	let dispose;
    	fa0 = new Fa({ props: { icon: freeSolidSvgIcons.faChevronLeft } });
    	let each_value_2 = /*monthLabels*/ ctx[12];
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	fa1 = new Fa({ props: { icon: freeSolidSvgIcons.faChevronRight } });
    	fa2 = new Fa({ props: { icon: freeSolidSvgIcons.faChevronLeft } });
    	fa3 = new Fa({ props: { icon: freeSolidSvgIcons.faChevronRight } });
    	let each_value_1 = /*dayOfWeekLabels*/ ctx[11];
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*calendarDates*/ ctx[7];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c() {
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			button0 = element("button");
    			create_component(fa0.$$.fragment);
    			t0 = space();
    			select = element("select");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t1 = space();
    			button1 = element("button");
    			create_component(fa1.$$.fragment);
    			t2 = text("\n                    |\n                    ");
    			button2 = element("button");
    			create_component(fa2.$$.fragment);
    			t3 = space();
    			input = element("input");
    			t4 = space();
    			button3 = element("button");
    			create_component(fa3.$$.fragment);
    			t5 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t6 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(button0, "class", "calendarArrowButton svelte-19l68in");
    			attr(select, "class", "text-center w-full svelte-19l68in");
    			if (/*calendarMonth*/ ctx[6] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[25].call(select));
    			attr(button1, "class", "calendarArrowButton svelte-19l68in");
    			attr(button2, "class", "calendarArrowButton svelte-19l68in");
    			attr(input, "class", "text-center w-8 m-0 svelte-19l68in");
    			attr(input, "type", "number");
    			attr(input, "min", "1900");
    			attr(input, "max", "2500");
    			attr(button3, "class", "calendarArrowButton svelte-19l68in");
    			attr(div0, "class", "flex text-center bg-gray-50 px-1 p-0.5 border-b-2 border-blue-800");
    			attr(div1, "class", "inline-grid grid-cols-7 gap-0 font-mono ");
    			attr(div2, "class", "inline-flex flex-col border-blue-900 border-2 rounded");
    			attr(div3, "class", "calendar text-xs absolute shadow-md bg-gray-50 svelte-19l68in");
    		},
    		m(target, anchor) {
    			insert(target, div3, anchor);
    			append(div3, div2);
    			append(div2, div0);
    			append(div0, button0);
    			mount_component(fa0, button0, null);
    			append(div0, t0);
    			append(div0, select);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(select, null);
    			}

    			select_option(select, /*calendarMonth*/ ctx[6]);
    			append(div0, t1);
    			append(div0, button1);
    			mount_component(fa1, button1, null);
    			append(div0, t2);
    			append(div0, button2);
    			mount_component(fa2, button2, null);
    			append(div0, t3);
    			append(div0, input);
    			set_input_value(input, /*calendarYear*/ ctx[5]);
    			append(div0, t4);
    			append(div0, button3);
    			mount_component(fa3, button3, null);
    			append(div2, t5);
    			append(div2, div1);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div1, null);
    			}

    			append(div1, t6);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(button0, "click", /*click_handler*/ ctx[24]),
    					listen(select, "change", /*select_change_handler*/ ctx[25]),
    					listen(button1, "click", /*click_handler_1*/ ctx[26]),
    					listen(button2, "click", /*click_handler_2*/ ctx[27]),
    					listen(input, "input", /*input_input_handler_1*/ ctx[28]),
    					listen(button3, "click", /*click_handler_3*/ ctx[29]),
    					listen(div2, "introstart", /*introstart_handler*/ ctx[31]),
    					listen(div2, "introend", /*introend_handler*/ ctx[32]),
    					action_destroyer(clickOutside_action = clickOutside.call(null, div2, /*closeCalendar*/ ctx[17]))
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*monthLabels*/ 4096) {
    				each_value_2 = /*monthLabels*/ ctx[12];
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_2(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_2.length;
    			}

    			if (dirty[0] & /*calendarMonth*/ 64) {
    				select_option(select, /*calendarMonth*/ ctx[6]);
    			}

    			if (dirty[0] & /*calendarYear*/ 32 && to_number(input.value) !== /*calendarYear*/ ctx[5]) {
    				set_input_value(input, /*calendarYear*/ ctx[5]);
    			}

    			if (dirty[0] & /*dayOfWeekLabels*/ 2048) {
    				each_value_1 = /*dayOfWeekLabels*/ ctx[11];
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div1, t6);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty[0] & /*calendarDates, calendarMonth, today, dateValue, calendarDateSelected*/ 24770) {
    				each_value = /*calendarDates*/ ctx[7];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(fa0.$$.fragment, local);
    			transition_in(fa1.$$.fragment, local);
    			transition_in(fa2.$$.fragment, local);
    			transition_in(fa3.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, slide, { duration: 200 }, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			transition_out(fa0.$$.fragment, local);
    			transition_out(fa1.$$.fragment, local);
    			transition_out(fa2.$$.fragment, local);
    			transition_out(fa3.$$.fragment, local);
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, slide, { duration: 200 }, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div3);
    			destroy_component(fa0);
    			destroy_each(each_blocks_2, detaching);
    			destroy_component(fa1);
    			destroy_component(fa2);
    			destroy_component(fa3);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			if (detaching && div2_transition) div2_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    // (269:24) {#each monthLabels as monthLabel, i}
    function create_each_block_2(ctx) {
    	let option;
    	let t_value = /*monthLabel*/ ctx[40] + "";
    	let t;
    	let option_value_value;

    	return {
    		c() {
    			option = element("option");
    			t = text(t_value);
    			attr(option, "class", "text-center");
    			option.__value = option_value_value = /*i*/ ctx[39];
    			option.value = option.__value;
    		},
    		m(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(option);
    		}
    	};
    }

    // (280:20) {#each dayOfWeekLabels as dow, i}
    function create_each_block_1(ctx) {
    	let div;
    	let t_value = /*dow*/ ctx[37][0] + "";
    	let t;
    	let div_class_value;

    	return {
    		c() {
    			div = element("div");
    			t = text(t_value);
    			attr(div, "class", div_class_value = "font-bold text-center w-6 p-0.5 bg-white " + (/*i*/ ctx[39] >= 5 ? "text-red-500" : ""));
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, t);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    // (283:20) {#each calendarDates as date}
    function create_each_block(ctx) {
    	let button;
    	let t0_value = /*date*/ ctx[34].getDate() + "";
    	let t0;
    	let t1;
    	let button_class_value;
    	let mounted;
    	let dispose;

    	function click_handler_4() {
    		return /*click_handler_4*/ ctx[30](/*date*/ ctx[34]);
    	}

    	return {
    		c() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();

    			attr(button, "class", button_class_value = "calendarDate\n                            " + (isHoliday(/*date*/ ctx[34]) ? "calendarHolidayDate" : "") + "\n                            " + (/*date*/ ctx[34].getMonth() !== /*calendarMonth*/ ctx[6]
    			? "calendarPreviousMonthDate"
    			: "") + "\n                            " + (/*date*/ ctx[34].getTime() === /*today*/ ctx[13].getTime()
    			? "calendarTodayDate"
    			: "") + "\n                            " + (/*dateValue*/ ctx[1] && /*dateValue*/ ctx[1].getTime() === /*date*/ ctx[34].getTime()
    			? "calendarSelectedDate"
    			: "") + "\n                        " + " svelte-19l68in");
    		},
    		m(target, anchor) {
    			insert(target, button, anchor);
    			append(button, t0);
    			append(button, t1);

    			if (!mounted) {
    				dispose = listen(button, "click", click_handler_4);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*calendarDates*/ 128 && t0_value !== (t0_value = /*date*/ ctx[34].getDate() + "")) set_data(t0, t0_value);

    			if (dirty[0] & /*calendarDates, calendarMonth, dateValue*/ 194 && button_class_value !== (button_class_value = "calendarDate\n                            " + (isHoliday(/*date*/ ctx[34]) ? "calendarHolidayDate" : "") + "\n                            " + (/*date*/ ctx[34].getMonth() !== /*calendarMonth*/ ctx[6]
    			? "calendarPreviousMonthDate"
    			: "") + "\n                            " + (/*date*/ ctx[34].getTime() === /*today*/ ctx[13].getTime()
    			? "calendarTodayDate"
    			: "") + "\n                            " + (/*dateValue*/ ctx[1] && /*dateValue*/ ctx[1].getTime() === /*date*/ ctx[34].getTime()
    			? "calendarSelectedDate"
    			: "") + "\n                        " + " svelte-19l68in")) {
    				attr(button, "class", button_class_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(button);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	let div;
    	let label;
    	let input;
    	let t0;
    	let span;
    	let t1_value = (isHoliday(/*dateValue*/ ctx[1]) ? "Week-end" : "") + "";
    	let t1;
    	let t2;
    	let button;
    	let fa;
    	let t3;
    	let label_class_value;
    	let t4;
    	let current;
    	let mounted;
    	let dispose;
    	fa = new Fa({ props: { icon: freeSolidSvgIcons.faCalendarAlt } });
    	let if_block0 = /*tooltipVisible*/ ctx[8] && create_if_block_1$1();
    	let if_block1 = /*calendarVisible*/ ctx[9] && create_if_block$1(ctx);

    	return {
    		c() {
    			div = element("div");
    			label = element("label");
    			input = element("input");
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			button = element("button");
    			create_component(fa.$$.fragment);
    			t3 = space();
    			if (if_block0) if_block0.c();
    			t4 = space();
    			if (if_block1) if_block1.c();
    			attr(input, "id", /*id*/ ctx[2]);
    			attr(input, "placeholder", /*displayFormat*/ ctx[3]);
    			attr(input, "type", "text");
    			attr(input, "class", "p-0.5 bg-white bg-opacity-0 svelte-19l68in");
    			attr(span, "class", "absolute right-6 top-2 text-red-500 font-bold text-xs");
    			attr(button, "class", "absolute right-0 top-0 p-1 rounded cursor-pointer border-opacity-0 border-2 border-blue-900 hover:border-opacity-100 hover:bg-blue-200");
    			attr(label, "for", /*id*/ ctx[2]);
    			attr(label, "class", label_class_value = "" + (/*_class*/ ctx[4] + " relative inline-flex border-blue-900 border-2 rounded w-auto" + " svelte-19l68in"));
    			attr(div, "class", "inline-block");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, label);
    			append(label, input);
    			set_input_value(input, /*textValue*/ ctx[0]);
    			append(label, t0);
    			append(label, span);
    			append(span, t1);
    			append(label, t2);
    			append(label, button);
    			mount_component(fa, button, null);
    			append(label, t3);
    			if (if_block0) if_block0.m(label, null);
    			append(div, t4);
    			if (if_block1) if_block1.m(div, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(input, "input", /*input_input_handler*/ ctx[22]),
    					listen(input, "change", /*parseTextValue*/ ctx[15]),
    					listen(input, "focus", inputFocused),
    					listen(button, "click", /*openCalendar*/ ctx[16]),
    					listen(label, "mouseenter", /*displayTooltip*/ ctx[18]),
    					listen(label, "mouseleave", /*hideTooltip*/ ctx[19]),
    					listen(label, "dblclick", /*dblclick_handler*/ ctx[23])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (!current || dirty[0] & /*id*/ 4) {
    				attr(input, "id", /*id*/ ctx[2]);
    			}

    			if (!current || dirty[0] & /*displayFormat*/ 8) {
    				attr(input, "placeholder", /*displayFormat*/ ctx[3]);
    			}

    			if (dirty[0] & /*textValue*/ 1 && input.value !== /*textValue*/ ctx[0]) {
    				set_input_value(input, /*textValue*/ ctx[0]);
    			}

    			if ((!current || dirty[0] & /*dateValue*/ 2) && t1_value !== (t1_value = (isHoliday(/*dateValue*/ ctx[1]) ? "Week-end" : "") + "")) set_data(t1, t1_value);

    			if (/*tooltipVisible*/ ctx[8]) {
    				if (if_block0) {
    					if (dirty[0] & /*tooltipVisible*/ 256) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1$1();
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(label, null);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*id*/ 4) {
    				attr(label, "for", /*id*/ ctx[2]);
    			}

    			if (!current || dirty[0] & /*_class*/ 16 && label_class_value !== (label_class_value = "" + (/*_class*/ ctx[4] + " relative inline-flex border-blue-900 border-2 rounded w-auto" + " svelte-19l68in"))) {
    				attr(label, "class", label_class_value);
    			}

    			if (/*calendarVisible*/ ctx[9]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*calendarVisible*/ 512) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(fa.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o(local) {
    			transition_out(fa.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_component(fa);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    async function inputFocused(event) {
    	const { selectionStart, selectionEnd, value } = this;
    	this.selectionStart = 0;
    	this.selectionEnd = value.length;
    }

    function isHoliday(date) {
    	// TODO: somehow add other holidays, not only saturday/sunday
    	return date && (date.getDay() === 6 || date.getDay() === 0);
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { init = "" } = $$props;
    	let { textValue = init } = $$props;
    	let { dateValue = null } = $$props;
    	let { id = "_" + Math.random().toString(36).substr(2, 9) } = $$props;
    	let { displayFormat = "DD/MM/YYYY" } = $$props;
    	let { tooltipEnabled } = $$props;
    	let { _class } = $$props;
    	const dayOfWeekLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    	const monthLabels = [
    		"January",
    		"February",
    		"March",
    		"April",
    		"May",
    		"June",
    		"July",
    		"August",
    		"September",
    		"October",
    		"November",
    		"December"
    	];

    	const parsingFormats = ["YYYY/M/D", "DD/MM/YYYY", "D/M/YYYY", "D/M/YY", "D/M", "YYYYMMDD", "DDMM", "D"]; // TODO: allow to override the list of valid parsing formats through an exported property
    	let tooltipVisible = false;
    	let calendarVisible = false;
    	let calendarRenderFinished = false;
    	let today = new Date();
    	today.setHours(0, 0, 0, 0);
    	let calendarYear;
    	let calendarMonth;
    	let calendarDates;

    	onMount(async () => {
    		parseTextValue();
    	});

    	async function calendarDateSelected(date) {
    		$$invalidate(1, dateValue = date);
    		$$invalidate(0, textValue = format(dateValue, displayFormat));
    		closeCalendar();
    	}

    	async function parseTextValue() {
    		let matchesDiff = textValue.match("^(\\+|-)([0-9]+)(w)?");

    		if (textValue === "0") {
    			$$invalidate(1, dateValue = new Date(today));
    		} else if (matchesDiff) {
    			let sign = matchesDiff[1];
    			let diff = sign === "-" ? -matchesDiff[2] : matchesDiff[2];
    			let workingDays = matchesDiff[3] === "w"; // TODO: implement the calculation including only working days
    			$$invalidate(1, dateValue = new Date(today));
    			dateValue.setDate(new Date(dateValue.getDate() + Number(diff)));
    		} else {
    			for (let format of parsingFormats) {
    				format = format.replaceAll("-", "/").replaceAll(".", "/");
    				$$invalidate(0, textValue = textValue.replaceAll("-", "/").replaceAll(".", "/"));
    				$$invalidate(1, dateValue = parse(textValue, format));
    				if (dateValue != "Invalid Date") break;
    			}
    		}

    		if (dateValue === null || dateValue === undefined || dateValue == "Invalid Date") {
    			$$invalidate(0, textValue = "");
    			$$invalidate(1, dateValue = null);
    			$$invalidate(5, calendarYear = today.getFullYear());
    			$$invalidate(6, calendarMonth = today.getMonth());
    		} else {
    			$$invalidate(0, textValue = format(dateValue, displayFormat));
    			$$invalidate(5, calendarYear = dateValue.getFullYear());
    			$$invalidate(6, calendarMonth = dateValue.getMonth());
    		}
    	}

    	async function openCalendar() {
    		if (dateValue === null || dateValue === undefined) {
    			$$invalidate(5, calendarYear = today.getFullYear());
    			$$invalidate(6, calendarMonth = today.getMonth());
    		} else {
    			$$invalidate(5, calendarYear = dateValue.getFullYear());
    			$$invalidate(6, calendarMonth = dateValue.getMonth());
    		}

    		$$invalidate(9, calendarVisible = true);
    	}

    	async function closeCalendar() {
    		if (calendarVisible && calendarRenderFinished) $$invalidate(9, calendarVisible = false);
    	}

    	async function displayTooltip() {
    		if (!tooltipEnabled) return;
    		$$invalidate(8, tooltipVisible = true);
    		setTimeout(hideTooltip, 6000);
    	}

    	async function hideTooltip() {
    		$$invalidate(8, tooltipVisible = false);
    	}

    	function input_input_handler() {
    		textValue = this.value;
    		$$invalidate(0, textValue);
    	}

    	const dblclick_handler = () => {
    		$$invalidate(0, textValue = "0");
    		parseTextValue();
    	};

    	const click_handler = () => {
    		$$invalidate(6, calendarMonth--, calendarMonth);
    	};

    	function select_change_handler() {
    		calendarMonth = select_value(this);
    		(($$invalidate(6, calendarMonth), $$invalidate(5, calendarYear)), $$invalidate(7, calendarDates));
    	}

    	const click_handler_1 = () => {
    		$$invalidate(6, calendarMonth++, calendarMonth);
    	};

    	const click_handler_2 = () => {
    		$$invalidate(5, calendarYear--, calendarYear);
    	};

    	function input_input_handler_1() {
    		calendarYear = to_number(this.value);
    		(($$invalidate(5, calendarYear), $$invalidate(6, calendarMonth)), $$invalidate(7, calendarDates));
    	}

    	const click_handler_3 = () => {
    		$$invalidate(5, calendarYear++, calendarYear);
    	};

    	const click_handler_4 = date => calendarDateSelected(date);

    	const introstart_handler = () => {
    		$$invalidate(10, calendarRenderFinished = false);
    	};

    	const introend_handler = () => {
    		$$invalidate(10, calendarRenderFinished = true);
    	};

    	$$self.$$set = $$props => {
    		if ("init" in $$props) $$invalidate(20, init = $$props.init);
    		if ("textValue" in $$props) $$invalidate(0, textValue = $$props.textValue);
    		if ("dateValue" in $$props) $$invalidate(1, dateValue = $$props.dateValue);
    		if ("id" in $$props) $$invalidate(2, id = $$props.id);
    		if ("displayFormat" in $$props) $$invalidate(3, displayFormat = $$props.displayFormat);
    		if ("tooltipEnabled" in $$props) $$invalidate(21, tooltipEnabled = $$props.tooltipEnabled);
    		if ("_class" in $$props) $$invalidate(4, _class = $$props._class);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*calendarMonth, calendarYear, calendarDates*/ 224) {
    			 {
    				if (calendarMonth < 0) {
    					$$invalidate(6, calendarMonth += 12);
    					$$invalidate(5, calendarYear -= 1);
    				}

    				if (calendarMonth > 11) {
    					$$invalidate(6, calendarMonth -= 12);
    					$$invalidate(5, calendarYear += 1);
    				}

    				let cursorDate = new Date(calendarYear, calendarMonth, 1);

    				let daysBack = cursorDate.getDay() <= 1
    				? cursorDate.getDay() + 6
    				: cursorDate.getDay() - 1;

    				cursorDate.setDate(new Date(cursorDate.getDate() - daysBack));
    				$$invalidate(7, calendarDates = []);

    				do {
    					calendarDates.push(new Date(cursorDate));
    					cursorDate.setDate(new Date(cursorDate.getDate() + 1));
    				} while (calendarDates.length < 42);
    			}
    		}
    	};

    	return [
    		textValue,
    		dateValue,
    		id,
    		displayFormat,
    		_class,
    		calendarYear,
    		calendarMonth,
    		calendarDates,
    		tooltipVisible,
    		calendarVisible,
    		calendarRenderFinished,
    		dayOfWeekLabels,
    		monthLabels,
    		today,
    		calendarDateSelected,
    		parseTextValue,
    		openCalendar,
    		closeCalendar,
    		displayTooltip,
    		hideTooltip,
    		init,
    		tooltipEnabled,
    		input_input_handler,
    		dblclick_handler,
    		click_handler,
    		select_change_handler,
    		click_handler_1,
    		click_handler_2,
    		input_input_handler_1,
    		click_handler_3,
    		click_handler_4,
    		introstart_handler,
    		introend_handler
    	];
    }

    class DatePicker extends SvelteComponent {
    	constructor(options) {
    		super();
    		if (!document.getElementById("svelte-19l68in-style")) add_css();

    		init(
    			this,
    			options,
    			instance$1,
    			create_fragment$1,
    			safe_not_equal,
    			{
    				init: 20,
    				textValue: 0,
    				dateValue: 1,
    				id: 2,
    				displayFormat: 3,
    				tooltipEnabled: 21,
    				_class: 4
    			},
    			[-1, -1]
    		);
    	}
    }

    return DatePicker;

})));
