
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop$1() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
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
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop$1;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
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
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value == null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function select_option(select, value, mounting) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        if (!mounting || value !== undefined) {
            select.selectedIndex = -1; // no option should be selected
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked');
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
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
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
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
        seen_callbacks.clear();
        set_current_component(saved_component);
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
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
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
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop$1,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
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
            mount_component(component, options.target, options.anchor, options.customElement);
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
            this.$destroy = noop$1;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop$1;
            }
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

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=} start
     */
    function writable(value, start = noop$1) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop$1) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop$1;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0 && stop) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    function bind(fn, thisArg) {
      return function wrap() {
        return fn.apply(thisArg, arguments);
      };
    }

    // utils is a library of generic helper functions non-specific to axios

    const {toString} = Object.prototype;
    const {getPrototypeOf} = Object;

    const kindOf = (cache => thing => {
        const str = toString.call(thing);
        return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
    })(Object.create(null));

    const kindOfTest = (type) => {
      type = type.toLowerCase();
      return (thing) => kindOf(thing) === type
    };

    const typeOfTest = type => thing => typeof thing === type;

    /**
     * Determine if a value is an Array
     *
     * @param {Object} val The value to test
     *
     * @returns {boolean} True if value is an Array, otherwise false
     */
    const {isArray} = Array;

    /**
     * Determine if a value is undefined
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if the value is undefined, otherwise false
     */
    const isUndefined = typeOfTest('undefined');

    /**
     * Determine if a value is a Buffer
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a Buffer, otherwise false
     */
    function isBuffer(val) {
      return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
        && isFunction(val.constructor.isBuffer) && val.constructor.isBuffer(val);
    }

    /**
     * Determine if a value is an ArrayBuffer
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is an ArrayBuffer, otherwise false
     */
    const isArrayBuffer = kindOfTest('ArrayBuffer');


    /**
     * Determine if a value is a view on an ArrayBuffer
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
     */
    function isArrayBufferView(val) {
      let result;
      if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
        result = ArrayBuffer.isView(val);
      } else {
        result = (val) && (val.buffer) && (isArrayBuffer(val.buffer));
      }
      return result;
    }

    /**
     * Determine if a value is a String
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a String, otherwise false
     */
    const isString = typeOfTest('string');

    /**
     * Determine if a value is a Function
     *
     * @param {*} val The value to test
     * @returns {boolean} True if value is a Function, otherwise false
     */
    const isFunction = typeOfTest('function');

    /**
     * Determine if a value is a Number
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a Number, otherwise false
     */
    const isNumber = typeOfTest('number');

    /**
     * Determine if a value is an Object
     *
     * @param {*} thing The value to test
     *
     * @returns {boolean} True if value is an Object, otherwise false
     */
    const isObject = (thing) => thing !== null && typeof thing === 'object';

    /**
     * Determine if a value is a Boolean
     *
     * @param {*} thing The value to test
     * @returns {boolean} True if value is a Boolean, otherwise false
     */
    const isBoolean = thing => thing === true || thing === false;

    /**
     * Determine if a value is a plain Object
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a plain Object, otherwise false
     */
    const isPlainObject = (val) => {
      if (kindOf(val) !== 'object') {
        return false;
      }

      const prototype = getPrototypeOf(val);
      return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in val) && !(Symbol.iterator in val);
    };

    /**
     * Determine if a value is a Date
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a Date, otherwise false
     */
    const isDate = kindOfTest('Date');

    /**
     * Determine if a value is a File
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a File, otherwise false
     */
    const isFile = kindOfTest('File');

    /**
     * Determine if a value is a Blob
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a Blob, otherwise false
     */
    const isBlob = kindOfTest('Blob');

    /**
     * Determine if a value is a FileList
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a File, otherwise false
     */
    const isFileList = kindOfTest('FileList');

    /**
     * Determine if a value is a Stream
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a Stream, otherwise false
     */
    const isStream = (val) => isObject(val) && isFunction(val.pipe);

    /**
     * Determine if a value is a FormData
     *
     * @param {*} thing The value to test
     *
     * @returns {boolean} True if value is an FormData, otherwise false
     */
    const isFormData = (thing) => {
      let kind;
      return thing && (
        (typeof FormData === 'function' && thing instanceof FormData) || (
          isFunction(thing.append) && (
            (kind = kindOf(thing)) === 'formdata' ||
            // detect form-data instance
            (kind === 'object' && isFunction(thing.toString) && thing.toString() === '[object FormData]')
          )
        )
      )
    };

    /**
     * Determine if a value is a URLSearchParams object
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a URLSearchParams object, otherwise false
     */
    const isURLSearchParams = kindOfTest('URLSearchParams');

    const [isReadableStream, isRequest, isResponse, isHeaders] = ['ReadableStream', 'Request', 'Response', 'Headers'].map(kindOfTest);

    /**
     * Trim excess whitespace off the beginning and end of a string
     *
     * @param {String} str The String to trim
     *
     * @returns {String} The String freed of excess whitespace
     */
    const trim = (str) => str.trim ?
      str.trim() : str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');

    /**
     * Iterate over an Array or an Object invoking a function for each item.
     *
     * If `obj` is an Array callback will be called passing
     * the value, index, and complete array for each item.
     *
     * If 'obj' is an Object callback will be called passing
     * the value, key, and complete object for each property.
     *
     * @param {Object|Array} obj The object to iterate
     * @param {Function} fn The callback to invoke for each item
     *
     * @param {Boolean} [allOwnKeys = false]
     * @returns {any}
     */
    function forEach(obj, fn, {allOwnKeys = false} = {}) {
      // Don't bother if no value provided
      if (obj === null || typeof obj === 'undefined') {
        return;
      }

      let i;
      let l;

      // Force an array if not already something iterable
      if (typeof obj !== 'object') {
        /*eslint no-param-reassign:0*/
        obj = [obj];
      }

      if (isArray(obj)) {
        // Iterate over array values
        for (i = 0, l = obj.length; i < l; i++) {
          fn.call(null, obj[i], i, obj);
        }
      } else {
        // Iterate over object keys
        const keys = allOwnKeys ? Object.getOwnPropertyNames(obj) : Object.keys(obj);
        const len = keys.length;
        let key;

        for (i = 0; i < len; i++) {
          key = keys[i];
          fn.call(null, obj[key], key, obj);
        }
      }
    }

    function findKey(obj, key) {
      key = key.toLowerCase();
      const keys = Object.keys(obj);
      let i = keys.length;
      let _key;
      while (i-- > 0) {
        _key = keys[i];
        if (key === _key.toLowerCase()) {
          return _key;
        }
      }
      return null;
    }

    const _global = (() => {
      /*eslint no-undef:0*/
      if (typeof globalThis !== "undefined") return globalThis;
      return typeof self !== "undefined" ? self : (typeof window !== 'undefined' ? window : global)
    })();

    const isContextDefined = (context) => !isUndefined(context) && context !== _global;

    /**
     * Accepts varargs expecting each argument to be an object, then
     * immutably merges the properties of each object and returns result.
     *
     * When multiple objects contain the same key the later object in
     * the arguments list will take precedence.
     *
     * Example:
     *
     * ```js
     * var result = merge({foo: 123}, {foo: 456});
     * console.log(result.foo); // outputs 456
     * ```
     *
     * @param {Object} obj1 Object to merge
     *
     * @returns {Object} Result of all merge properties
     */
    function merge(/* obj1, obj2, obj3, ... */) {
      const {caseless} = isContextDefined(this) && this || {};
      const result = {};
      const assignValue = (val, key) => {
        const targetKey = caseless && findKey(result, key) || key;
        if (isPlainObject(result[targetKey]) && isPlainObject(val)) {
          result[targetKey] = merge(result[targetKey], val);
        } else if (isPlainObject(val)) {
          result[targetKey] = merge({}, val);
        } else if (isArray(val)) {
          result[targetKey] = val.slice();
        } else {
          result[targetKey] = val;
        }
      };

      for (let i = 0, l = arguments.length; i < l; i++) {
        arguments[i] && forEach(arguments[i], assignValue);
      }
      return result;
    }

    /**
     * Extends object a by mutably adding to it the properties of object b.
     *
     * @param {Object} a The object to be extended
     * @param {Object} b The object to copy properties from
     * @param {Object} thisArg The object to bind function to
     *
     * @param {Boolean} [allOwnKeys]
     * @returns {Object} The resulting value of object a
     */
    const extend = (a, b, thisArg, {allOwnKeys}= {}) => {
      forEach(b, (val, key) => {
        if (thisArg && isFunction(val)) {
          a[key] = bind(val, thisArg);
        } else {
          a[key] = val;
        }
      }, {allOwnKeys});
      return a;
    };

    /**
     * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
     *
     * @param {string} content with BOM
     *
     * @returns {string} content value without BOM
     */
    const stripBOM = (content) => {
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      return content;
    };

    /**
     * Inherit the prototype methods from one constructor into another
     * @param {function} constructor
     * @param {function} superConstructor
     * @param {object} [props]
     * @param {object} [descriptors]
     *
     * @returns {void}
     */
    const inherits = (constructor, superConstructor, props, descriptors) => {
      constructor.prototype = Object.create(superConstructor.prototype, descriptors);
      constructor.prototype.constructor = constructor;
      Object.defineProperty(constructor, 'super', {
        value: superConstructor.prototype
      });
      props && Object.assign(constructor.prototype, props);
    };

    /**
     * Resolve object with deep prototype chain to a flat object
     * @param {Object} sourceObj source object
     * @param {Object} [destObj]
     * @param {Function|Boolean} [filter]
     * @param {Function} [propFilter]
     *
     * @returns {Object}
     */
    const toFlatObject = (sourceObj, destObj, filter, propFilter) => {
      let props;
      let i;
      let prop;
      const merged = {};

      destObj = destObj || {};
      // eslint-disable-next-line no-eq-null,eqeqeq
      if (sourceObj == null) return destObj;

      do {
        props = Object.getOwnPropertyNames(sourceObj);
        i = props.length;
        while (i-- > 0) {
          prop = props[i];
          if ((!propFilter || propFilter(prop, sourceObj, destObj)) && !merged[prop]) {
            destObj[prop] = sourceObj[prop];
            merged[prop] = true;
          }
        }
        sourceObj = filter !== false && getPrototypeOf(sourceObj);
      } while (sourceObj && (!filter || filter(sourceObj, destObj)) && sourceObj !== Object.prototype);

      return destObj;
    };

    /**
     * Determines whether a string ends with the characters of a specified string
     *
     * @param {String} str
     * @param {String} searchString
     * @param {Number} [position= 0]
     *
     * @returns {boolean}
     */
    const endsWith = (str, searchString, position) => {
      str = String(str);
      if (position === undefined || position > str.length) {
        position = str.length;
      }
      position -= searchString.length;
      const lastIndex = str.indexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
    };


    /**
     * Returns new array from array like object or null if failed
     *
     * @param {*} [thing]
     *
     * @returns {?Array}
     */
    const toArray = (thing) => {
      if (!thing) return null;
      if (isArray(thing)) return thing;
      let i = thing.length;
      if (!isNumber(i)) return null;
      const arr = new Array(i);
      while (i-- > 0) {
        arr[i] = thing[i];
      }
      return arr;
    };

    /**
     * Checking if the Uint8Array exists and if it does, it returns a function that checks if the
     * thing passed in is an instance of Uint8Array
     *
     * @param {TypedArray}
     *
     * @returns {Array}
     */
    // eslint-disable-next-line func-names
    const isTypedArray = (TypedArray => {
      // eslint-disable-next-line func-names
      return thing => {
        return TypedArray && thing instanceof TypedArray;
      };
    })(typeof Uint8Array !== 'undefined' && getPrototypeOf(Uint8Array));

    /**
     * For each entry in the object, call the function with the key and value.
     *
     * @param {Object<any, any>} obj - The object to iterate over.
     * @param {Function} fn - The function to call for each entry.
     *
     * @returns {void}
     */
    const forEachEntry = (obj, fn) => {
      const generator = obj && obj[Symbol.iterator];

      const iterator = generator.call(obj);

      let result;

      while ((result = iterator.next()) && !result.done) {
        const pair = result.value;
        fn.call(obj, pair[0], pair[1]);
      }
    };

    /**
     * It takes a regular expression and a string, and returns an array of all the matches
     *
     * @param {string} regExp - The regular expression to match against.
     * @param {string} str - The string to search.
     *
     * @returns {Array<boolean>}
     */
    const matchAll = (regExp, str) => {
      let matches;
      const arr = [];

      while ((matches = regExp.exec(str)) !== null) {
        arr.push(matches);
      }

      return arr;
    };

    /* Checking if the kindOfTest function returns true when passed an HTMLFormElement. */
    const isHTMLForm = kindOfTest('HTMLFormElement');

    const toCamelCase = str => {
      return str.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g,
        function replacer(m, p1, p2) {
          return p1.toUpperCase() + p2;
        }
      );
    };

    /* Creating a function that will check if an object has a property. */
    const hasOwnProperty = (({hasOwnProperty}) => (obj, prop) => hasOwnProperty.call(obj, prop))(Object.prototype);

    /**
     * Determine if a value is a RegExp object
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a RegExp object, otherwise false
     */
    const isRegExp = kindOfTest('RegExp');

    const reduceDescriptors = (obj, reducer) => {
      const descriptors = Object.getOwnPropertyDescriptors(obj);
      const reducedDescriptors = {};

      forEach(descriptors, (descriptor, name) => {
        let ret;
        if ((ret = reducer(descriptor, name, obj)) !== false) {
          reducedDescriptors[name] = ret || descriptor;
        }
      });

      Object.defineProperties(obj, reducedDescriptors);
    };

    /**
     * Makes all methods read-only
     * @param {Object} obj
     */

    const freezeMethods = (obj) => {
      reduceDescriptors(obj, (descriptor, name) => {
        // skip restricted props in strict mode
        if (isFunction(obj) && ['arguments', 'caller', 'callee'].indexOf(name) !== -1) {
          return false;
        }

        const value = obj[name];

        if (!isFunction(value)) return;

        descriptor.enumerable = false;

        if ('writable' in descriptor) {
          descriptor.writable = false;
          return;
        }

        if (!descriptor.set) {
          descriptor.set = () => {
            throw Error('Can not rewrite read-only method \'' + name + '\'');
          };
        }
      });
    };

    const toObjectSet = (arrayOrString, delimiter) => {
      const obj = {};

      const define = (arr) => {
        arr.forEach(value => {
          obj[value] = true;
        });
      };

      isArray(arrayOrString) ? define(arrayOrString) : define(String(arrayOrString).split(delimiter));

      return obj;
    };

    const noop = () => {};

    const toFiniteNumber = (value, defaultValue) => {
      return value != null && Number.isFinite(value = +value) ? value : defaultValue;
    };

    const ALPHA = 'abcdefghijklmnopqrstuvwxyz';

    const DIGIT = '0123456789';

    const ALPHABET = {
      DIGIT,
      ALPHA,
      ALPHA_DIGIT: ALPHA + ALPHA.toUpperCase() + DIGIT
    };

    const generateString = (size = 16, alphabet = ALPHABET.ALPHA_DIGIT) => {
      let str = '';
      const {length} = alphabet;
      while (size--) {
        str += alphabet[Math.random() * length|0];
      }

      return str;
    };

    /**
     * If the thing is a FormData object, return true, otherwise return false.
     *
     * @param {unknown} thing - The thing to check.
     *
     * @returns {boolean}
     */
    function isSpecCompliantForm(thing) {
      return !!(thing && isFunction(thing.append) && thing[Symbol.toStringTag] === 'FormData' && thing[Symbol.iterator]);
    }

    const toJSONObject = (obj) => {
      const stack = new Array(10);

      const visit = (source, i) => {

        if (isObject(source)) {
          if (stack.indexOf(source) >= 0) {
            return;
          }

          if(!('toJSON' in source)) {
            stack[i] = source;
            const target = isArray(source) ? [] : {};

            forEach(source, (value, key) => {
              const reducedValue = visit(value, i + 1);
              !isUndefined(reducedValue) && (target[key] = reducedValue);
            });

            stack[i] = undefined;

            return target;
          }
        }

        return source;
      };

      return visit(obj, 0);
    };

    const isAsyncFn = kindOfTest('AsyncFunction');

    const isThenable = (thing) =>
      thing && (isObject(thing) || isFunction(thing)) && isFunction(thing.then) && isFunction(thing.catch);

    // original code
    // https://github.com/DigitalBrainJS/AxiosPromise/blob/16deab13710ec09779922131f3fa5954320f83ab/lib/utils.js#L11-L34

    const _setImmediate = ((setImmediateSupported, postMessageSupported) => {
      if (setImmediateSupported) {
        return setImmediate;
      }

      return postMessageSupported ? ((token, callbacks) => {
        _global.addEventListener("message", ({source, data}) => {
          if (source === _global && data === token) {
            callbacks.length && callbacks.shift()();
          }
        }, false);

        return (cb) => {
          callbacks.push(cb);
          _global.postMessage(token, "*");
        }
      })(`axios@${Math.random()}`, []) : (cb) => setTimeout(cb);
    })(
      typeof setImmediate === 'function',
      isFunction(_global.postMessage)
    );

    const asap = typeof queueMicrotask !== 'undefined' ?
      queueMicrotask.bind(_global) : ( typeof process !== 'undefined' && process.nextTick || _setImmediate);

    // *********************

    var utils$1 = {
      isArray,
      isArrayBuffer,
      isBuffer,
      isFormData,
      isArrayBufferView,
      isString,
      isNumber,
      isBoolean,
      isObject,
      isPlainObject,
      isReadableStream,
      isRequest,
      isResponse,
      isHeaders,
      isUndefined,
      isDate,
      isFile,
      isBlob,
      isRegExp,
      isFunction,
      isStream,
      isURLSearchParams,
      isTypedArray,
      isFileList,
      forEach,
      merge,
      extend,
      trim,
      stripBOM,
      inherits,
      toFlatObject,
      kindOf,
      kindOfTest,
      endsWith,
      toArray,
      forEachEntry,
      matchAll,
      isHTMLForm,
      hasOwnProperty,
      hasOwnProp: hasOwnProperty, // an alias to avoid ESLint no-prototype-builtins detection
      reduceDescriptors,
      freezeMethods,
      toObjectSet,
      toCamelCase,
      noop,
      toFiniteNumber,
      findKey,
      global: _global,
      isContextDefined,
      ALPHABET,
      generateString,
      isSpecCompliantForm,
      toJSONObject,
      isAsyncFn,
      isThenable,
      setImmediate: _setImmediate,
      asap
    };

    /**
     * Create an Error with the specified message, config, error code, request and response.
     *
     * @param {string} message The error message.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [config] The config.
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     *
     * @returns {Error} The created error.
     */
    function AxiosError(message, code, config, request, response) {
      Error.call(this);

      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      } else {
        this.stack = (new Error()).stack;
      }

      this.message = message;
      this.name = 'AxiosError';
      code && (this.code = code);
      config && (this.config = config);
      request && (this.request = request);
      if (response) {
        this.response = response;
        this.status = response.status ? response.status : null;
      }
    }

    utils$1.inherits(AxiosError, Error, {
      toJSON: function toJSON() {
        return {
          // Standard
          message: this.message,
          name: this.name,
          // Microsoft
          description: this.description,
          number: this.number,
          // Mozilla
          fileName: this.fileName,
          lineNumber: this.lineNumber,
          columnNumber: this.columnNumber,
          stack: this.stack,
          // Axios
          config: utils$1.toJSONObject(this.config),
          code: this.code,
          status: this.status
        };
      }
    });

    const prototype$1 = AxiosError.prototype;
    const descriptors = {};

    [
      'ERR_BAD_OPTION_VALUE',
      'ERR_BAD_OPTION',
      'ECONNABORTED',
      'ETIMEDOUT',
      'ERR_NETWORK',
      'ERR_FR_TOO_MANY_REDIRECTS',
      'ERR_DEPRECATED',
      'ERR_BAD_RESPONSE',
      'ERR_BAD_REQUEST',
      'ERR_CANCELED',
      'ERR_NOT_SUPPORT',
      'ERR_INVALID_URL'
    // eslint-disable-next-line func-names
    ].forEach(code => {
      descriptors[code] = {value: code};
    });

    Object.defineProperties(AxiosError, descriptors);
    Object.defineProperty(prototype$1, 'isAxiosError', {value: true});

    // eslint-disable-next-line func-names
    AxiosError.from = (error, code, config, request, response, customProps) => {
      const axiosError = Object.create(prototype$1);

      utils$1.toFlatObject(error, axiosError, function filter(obj) {
        return obj !== Error.prototype;
      }, prop => {
        return prop !== 'isAxiosError';
      });

      AxiosError.call(axiosError, error.message, code, config, request, response);

      axiosError.cause = error;

      axiosError.name = error.name;

      customProps && Object.assign(axiosError, customProps);

      return axiosError;
    };

    // eslint-disable-next-line strict
    var httpAdapter = null;

    /**
     * Determines if the given thing is a array or js object.
     *
     * @param {string} thing - The object or array to be visited.
     *
     * @returns {boolean}
     */
    function isVisitable(thing) {
      return utils$1.isPlainObject(thing) || utils$1.isArray(thing);
    }

    /**
     * It removes the brackets from the end of a string
     *
     * @param {string} key - The key of the parameter.
     *
     * @returns {string} the key without the brackets.
     */
    function removeBrackets(key) {
      return utils$1.endsWith(key, '[]') ? key.slice(0, -2) : key;
    }

    /**
     * It takes a path, a key, and a boolean, and returns a string
     *
     * @param {string} path - The path to the current key.
     * @param {string} key - The key of the current object being iterated over.
     * @param {string} dots - If true, the key will be rendered with dots instead of brackets.
     *
     * @returns {string} The path to the current key.
     */
    function renderKey(path, key, dots) {
      if (!path) return key;
      return path.concat(key).map(function each(token, i) {
        // eslint-disable-next-line no-param-reassign
        token = removeBrackets(token);
        return !dots && i ? '[' + token + ']' : token;
      }).join(dots ? '.' : '');
    }

    /**
     * If the array is an array and none of its elements are visitable, then it's a flat array.
     *
     * @param {Array<any>} arr - The array to check
     *
     * @returns {boolean}
     */
    function isFlatArray(arr) {
      return utils$1.isArray(arr) && !arr.some(isVisitable);
    }

    const predicates = utils$1.toFlatObject(utils$1, {}, null, function filter(prop) {
      return /^is[A-Z]/.test(prop);
    });

    /**
     * Convert a data object to FormData
     *
     * @param {Object} obj
     * @param {?Object} [formData]
     * @param {?Object} [options]
     * @param {Function} [options.visitor]
     * @param {Boolean} [options.metaTokens = true]
     * @param {Boolean} [options.dots = false]
     * @param {?Boolean} [options.indexes = false]
     *
     * @returns {Object}
     **/

    /**
     * It converts an object into a FormData object
     *
     * @param {Object<any, any>} obj - The object to convert to form data.
     * @param {string} formData - The FormData object to append to.
     * @param {Object<string, any>} options
     *
     * @returns
     */
    function toFormData(obj, formData, options) {
      if (!utils$1.isObject(obj)) {
        throw new TypeError('target must be an object');
      }

      // eslint-disable-next-line no-param-reassign
      formData = formData || new (FormData)();

      // eslint-disable-next-line no-param-reassign
      options = utils$1.toFlatObject(options, {
        metaTokens: true,
        dots: false,
        indexes: false
      }, false, function defined(option, source) {
        // eslint-disable-next-line no-eq-null,eqeqeq
        return !utils$1.isUndefined(source[option]);
      });

      const metaTokens = options.metaTokens;
      // eslint-disable-next-line no-use-before-define
      const visitor = options.visitor || defaultVisitor;
      const dots = options.dots;
      const indexes = options.indexes;
      const _Blob = options.Blob || typeof Blob !== 'undefined' && Blob;
      const useBlob = _Blob && utils$1.isSpecCompliantForm(formData);

      if (!utils$1.isFunction(visitor)) {
        throw new TypeError('visitor must be a function');
      }

      function convertValue(value) {
        if (value === null) return '';

        if (utils$1.isDate(value)) {
          return value.toISOString();
        }

        if (!useBlob && utils$1.isBlob(value)) {
          throw new AxiosError('Blob is not supported. Use a Buffer instead.');
        }

        if (utils$1.isArrayBuffer(value) || utils$1.isTypedArray(value)) {
          return useBlob && typeof Blob === 'function' ? new Blob([value]) : Buffer.from(value);
        }

        return value;
      }

      /**
       * Default visitor.
       *
       * @param {*} value
       * @param {String|Number} key
       * @param {Array<String|Number>} path
       * @this {FormData}
       *
       * @returns {boolean} return true to visit the each prop of the value recursively
       */
      function defaultVisitor(value, key, path) {
        let arr = value;

        if (value && !path && typeof value === 'object') {
          if (utils$1.endsWith(key, '{}')) {
            // eslint-disable-next-line no-param-reassign
            key = metaTokens ? key : key.slice(0, -2);
            // eslint-disable-next-line no-param-reassign
            value = JSON.stringify(value);
          } else if (
            (utils$1.isArray(value) && isFlatArray(value)) ||
            ((utils$1.isFileList(value) || utils$1.endsWith(key, '[]')) && (arr = utils$1.toArray(value))
            )) {
            // eslint-disable-next-line no-param-reassign
            key = removeBrackets(key);

            arr.forEach(function each(el, index) {
              !(utils$1.isUndefined(el) || el === null) && formData.append(
                // eslint-disable-next-line no-nested-ternary
                indexes === true ? renderKey([key], index, dots) : (indexes === null ? key : key + '[]'),
                convertValue(el)
              );
            });
            return false;
          }
        }

        if (isVisitable(value)) {
          return true;
        }

        formData.append(renderKey(path, key, dots), convertValue(value));

        return false;
      }

      const stack = [];

      const exposedHelpers = Object.assign(predicates, {
        defaultVisitor,
        convertValue,
        isVisitable
      });

      function build(value, path) {
        if (utils$1.isUndefined(value)) return;

        if (stack.indexOf(value) !== -1) {
          throw Error('Circular reference detected in ' + path.join('.'));
        }

        stack.push(value);

        utils$1.forEach(value, function each(el, key) {
          const result = !(utils$1.isUndefined(el) || el === null) && visitor.call(
            formData, el, utils$1.isString(key) ? key.trim() : key, path, exposedHelpers
          );

          if (result === true) {
            build(el, path ? path.concat(key) : [key]);
          }
        });

        stack.pop();
      }

      if (!utils$1.isObject(obj)) {
        throw new TypeError('data must be an object');
      }

      build(obj);

      return formData;
    }

    /**
     * It encodes a string by replacing all characters that are not in the unreserved set with
     * their percent-encoded equivalents
     *
     * @param {string} str - The string to encode.
     *
     * @returns {string} The encoded string.
     */
    function encode$1(str) {
      const charMap = {
        '!': '%21',
        "'": '%27',
        '(': '%28',
        ')': '%29',
        '~': '%7E',
        '%20': '+',
        '%00': '\x00'
      };
      return encodeURIComponent(str).replace(/[!'()~]|%20|%00/g, function replacer(match) {
        return charMap[match];
      });
    }

    /**
     * It takes a params object and converts it to a FormData object
     *
     * @param {Object<string, any>} params - The parameters to be converted to a FormData object.
     * @param {Object<string, any>} options - The options object passed to the Axios constructor.
     *
     * @returns {void}
     */
    function AxiosURLSearchParams(params, options) {
      this._pairs = [];

      params && toFormData(params, this, options);
    }

    const prototype = AxiosURLSearchParams.prototype;

    prototype.append = function append(name, value) {
      this._pairs.push([name, value]);
    };

    prototype.toString = function toString(encoder) {
      const _encode = encoder ? function(value) {
        return encoder.call(this, value, encode$1);
      } : encode$1;

      return this._pairs.map(function each(pair) {
        return _encode(pair[0]) + '=' + _encode(pair[1]);
      }, '').join('&');
    };

    /**
     * It replaces all instances of the characters `:`, `$`, `,`, `+`, `[`, and `]` with their
     * URI encoded counterparts
     *
     * @param {string} val The value to be encoded.
     *
     * @returns {string} The encoded value.
     */
    function encode(val) {
      return encodeURIComponent(val).
        replace(/%3A/gi, ':').
        replace(/%24/g, '$').
        replace(/%2C/gi, ',').
        replace(/%20/g, '+').
        replace(/%5B/gi, '[').
        replace(/%5D/gi, ']');
    }

    /**
     * Build a URL by appending params to the end
     *
     * @param {string} url The base of the url (e.g., http://www.google.com)
     * @param {object} [params] The params to be appended
     * @param {?object} options
     *
     * @returns {string} The formatted url
     */
    function buildURL(url, params, options) {
      /*eslint no-param-reassign:0*/
      if (!params) {
        return url;
      }
      
      const _encode = options && options.encode || encode;

      const serializeFn = options && options.serialize;

      let serializedParams;

      if (serializeFn) {
        serializedParams = serializeFn(params, options);
      } else {
        serializedParams = utils$1.isURLSearchParams(params) ?
          params.toString() :
          new AxiosURLSearchParams(params, options).toString(_encode);
      }

      if (serializedParams) {
        const hashmarkIndex = url.indexOf("#");

        if (hashmarkIndex !== -1) {
          url = url.slice(0, hashmarkIndex);
        }
        url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
      }

      return url;
    }

    class InterceptorManager {
      constructor() {
        this.handlers = [];
      }

      /**
       * Add a new interceptor to the stack
       *
       * @param {Function} fulfilled The function to handle `then` for a `Promise`
       * @param {Function} rejected The function to handle `reject` for a `Promise`
       *
       * @return {Number} An ID used to remove interceptor later
       */
      use(fulfilled, rejected, options) {
        this.handlers.push({
          fulfilled,
          rejected,
          synchronous: options ? options.synchronous : false,
          runWhen: options ? options.runWhen : null
        });
        return this.handlers.length - 1;
      }

      /**
       * Remove an interceptor from the stack
       *
       * @param {Number} id The ID that was returned by `use`
       *
       * @returns {Boolean} `true` if the interceptor was removed, `false` otherwise
       */
      eject(id) {
        if (this.handlers[id]) {
          this.handlers[id] = null;
        }
      }

      /**
       * Clear all interceptors from the stack
       *
       * @returns {void}
       */
      clear() {
        if (this.handlers) {
          this.handlers = [];
        }
      }

      /**
       * Iterate over all the registered interceptors
       *
       * This method is particularly useful for skipping over any
       * interceptors that may have become `null` calling `eject`.
       *
       * @param {Function} fn The function to call for each interceptor
       *
       * @returns {void}
       */
      forEach(fn) {
        utils$1.forEach(this.handlers, function forEachHandler(h) {
          if (h !== null) {
            fn(h);
          }
        });
      }
    }

    var InterceptorManager$1 = InterceptorManager;

    var transitionalDefaults = {
      silentJSONParsing: true,
      forcedJSONParsing: true,
      clarifyTimeoutError: false
    };

    var URLSearchParams$1 = typeof URLSearchParams !== 'undefined' ? URLSearchParams : AxiosURLSearchParams;

    var FormData$1 = typeof FormData !== 'undefined' ? FormData : null;

    var Blob$1 = typeof Blob !== 'undefined' ? Blob : null;

    var platform$1 = {
      isBrowser: true,
      classes: {
        URLSearchParams: URLSearchParams$1,
        FormData: FormData$1,
        Blob: Blob$1
      },
      protocols: ['http', 'https', 'file', 'blob', 'url', 'data']
    };

    const hasBrowserEnv = typeof window !== 'undefined' && typeof document !== 'undefined';

    const _navigator = typeof navigator === 'object' && navigator || undefined;

    /**
     * Determine if we're running in a standard browser environment
     *
     * This allows axios to run in a web worker, and react-native.
     * Both environments support XMLHttpRequest, but not fully standard globals.
     *
     * web workers:
     *  typeof window -> undefined
     *  typeof document -> undefined
     *
     * react-native:
     *  navigator.product -> 'ReactNative'
     * nativescript
     *  navigator.product -> 'NativeScript' or 'NS'
     *
     * @returns {boolean}
     */
    const hasStandardBrowserEnv = hasBrowserEnv &&
      (!_navigator || ['ReactNative', 'NativeScript', 'NS'].indexOf(_navigator.product) < 0);

    /**
     * Determine if we're running in a standard browser webWorker environment
     *
     * Although the `isStandardBrowserEnv` method indicates that
     * `allows axios to run in a web worker`, the WebWorker will still be
     * filtered out due to its judgment standard
     * `typeof window !== 'undefined' && typeof document !== 'undefined'`.
     * This leads to a problem when axios post `FormData` in webWorker
     */
    const hasStandardBrowserWebWorkerEnv = (() => {
      return (
        typeof WorkerGlobalScope !== 'undefined' &&
        // eslint-disable-next-line no-undef
        self instanceof WorkerGlobalScope &&
        typeof self.importScripts === 'function'
      );
    })();

    const origin = hasBrowserEnv && window.location.href || 'http://localhost';

    var utils = /*#__PURE__*/Object.freeze({
        __proto__: null,
        hasBrowserEnv: hasBrowserEnv,
        hasStandardBrowserEnv: hasStandardBrowserEnv,
        hasStandardBrowserWebWorkerEnv: hasStandardBrowserWebWorkerEnv,
        navigator: _navigator,
        origin: origin
    });

    var platform = {
      ...utils,
      ...platform$1
    };

    function toURLEncodedForm(data, options) {
      return toFormData(data, new platform.classes.URLSearchParams(), Object.assign({
        visitor: function(value, key, path, helpers) {
          if (platform.isNode && utils$1.isBuffer(value)) {
            this.append(key, value.toString('base64'));
            return false;
          }

          return helpers.defaultVisitor.apply(this, arguments);
        }
      }, options));
    }

    /**
     * It takes a string like `foo[x][y][z]` and returns an array like `['foo', 'x', 'y', 'z']
     *
     * @param {string} name - The name of the property to get.
     *
     * @returns An array of strings.
     */
    function parsePropPath(name) {
      // foo[x][y][z]
      // foo.x.y.z
      // foo-x-y-z
      // foo x y z
      return utils$1.matchAll(/\w+|\[(\w*)]/g, name).map(match => {
        return match[0] === '[]' ? '' : match[1] || match[0];
      });
    }

    /**
     * Convert an array to an object.
     *
     * @param {Array<any>} arr - The array to convert to an object.
     *
     * @returns An object with the same keys and values as the array.
     */
    function arrayToObject(arr) {
      const obj = {};
      const keys = Object.keys(arr);
      let i;
      const len = keys.length;
      let key;
      for (i = 0; i < len; i++) {
        key = keys[i];
        obj[key] = arr[key];
      }
      return obj;
    }

    /**
     * It takes a FormData object and returns a JavaScript object
     *
     * @param {string} formData The FormData object to convert to JSON.
     *
     * @returns {Object<string, any> | null} The converted object.
     */
    function formDataToJSON(formData) {
      function buildPath(path, value, target, index) {
        let name = path[index++];

        if (name === '__proto__') return true;

        const isNumericKey = Number.isFinite(+name);
        const isLast = index >= path.length;
        name = !name && utils$1.isArray(target) ? target.length : name;

        if (isLast) {
          if (utils$1.hasOwnProp(target, name)) {
            target[name] = [target[name], value];
          } else {
            target[name] = value;
          }

          return !isNumericKey;
        }

        if (!target[name] || !utils$1.isObject(target[name])) {
          target[name] = [];
        }

        const result = buildPath(path, value, target[name], index);

        if (result && utils$1.isArray(target[name])) {
          target[name] = arrayToObject(target[name]);
        }

        return !isNumericKey;
      }

      if (utils$1.isFormData(formData) && utils$1.isFunction(formData.entries)) {
        const obj = {};

        utils$1.forEachEntry(formData, (name, value) => {
          buildPath(parsePropPath(name), value, obj, 0);
        });

        return obj;
      }

      return null;
    }

    /**
     * It takes a string, tries to parse it, and if it fails, it returns the stringified version
     * of the input
     *
     * @param {any} rawValue - The value to be stringified.
     * @param {Function} parser - A function that parses a string into a JavaScript object.
     * @param {Function} encoder - A function that takes a value and returns a string.
     *
     * @returns {string} A stringified version of the rawValue.
     */
    function stringifySafely(rawValue, parser, encoder) {
      if (utils$1.isString(rawValue)) {
        try {
          (parser || JSON.parse)(rawValue);
          return utils$1.trim(rawValue);
        } catch (e) {
          if (e.name !== 'SyntaxError') {
            throw e;
          }
        }
      }

      return (encoder || JSON.stringify)(rawValue);
    }

    const defaults = {

      transitional: transitionalDefaults,

      adapter: ['xhr', 'http', 'fetch'],

      transformRequest: [function transformRequest(data, headers) {
        const contentType = headers.getContentType() || '';
        const hasJSONContentType = contentType.indexOf('application/json') > -1;
        const isObjectPayload = utils$1.isObject(data);

        if (isObjectPayload && utils$1.isHTMLForm(data)) {
          data = new FormData(data);
        }

        const isFormData = utils$1.isFormData(data);

        if (isFormData) {
          return hasJSONContentType ? JSON.stringify(formDataToJSON(data)) : data;
        }

        if (utils$1.isArrayBuffer(data) ||
          utils$1.isBuffer(data) ||
          utils$1.isStream(data) ||
          utils$1.isFile(data) ||
          utils$1.isBlob(data) ||
          utils$1.isReadableStream(data)
        ) {
          return data;
        }
        if (utils$1.isArrayBufferView(data)) {
          return data.buffer;
        }
        if (utils$1.isURLSearchParams(data)) {
          headers.setContentType('application/x-www-form-urlencoded;charset=utf-8', false);
          return data.toString();
        }

        let isFileList;

        if (isObjectPayload) {
          if (contentType.indexOf('application/x-www-form-urlencoded') > -1) {
            return toURLEncodedForm(data, this.formSerializer).toString();
          }

          if ((isFileList = utils$1.isFileList(data)) || contentType.indexOf('multipart/form-data') > -1) {
            const _FormData = this.env && this.env.FormData;

            return toFormData(
              isFileList ? {'files[]': data} : data,
              _FormData && new _FormData(),
              this.formSerializer
            );
          }
        }

        if (isObjectPayload || hasJSONContentType ) {
          headers.setContentType('application/json', false);
          return stringifySafely(data);
        }

        return data;
      }],

      transformResponse: [function transformResponse(data) {
        const transitional = this.transitional || defaults.transitional;
        const forcedJSONParsing = transitional && transitional.forcedJSONParsing;
        const JSONRequested = this.responseType === 'json';

        if (utils$1.isResponse(data) || utils$1.isReadableStream(data)) {
          return data;
        }

        if (data && utils$1.isString(data) && ((forcedJSONParsing && !this.responseType) || JSONRequested)) {
          const silentJSONParsing = transitional && transitional.silentJSONParsing;
          const strictJSONParsing = !silentJSONParsing && JSONRequested;

          try {
            return JSON.parse(data);
          } catch (e) {
            if (strictJSONParsing) {
              if (e.name === 'SyntaxError') {
                throw AxiosError.from(e, AxiosError.ERR_BAD_RESPONSE, this, null, this.response);
              }
              throw e;
            }
          }
        }

        return data;
      }],

      /**
       * A timeout in milliseconds to abort a request. If set to 0 (default) a
       * timeout is not created.
       */
      timeout: 0,

      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-XSRF-TOKEN',

      maxContentLength: -1,
      maxBodyLength: -1,

      env: {
        FormData: platform.classes.FormData,
        Blob: platform.classes.Blob
      },

      validateStatus: function validateStatus(status) {
        return status >= 200 && status < 300;
      },

      headers: {
        common: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': undefined
        }
      }
    };

    utils$1.forEach(['delete', 'get', 'head', 'post', 'put', 'patch'], (method) => {
      defaults.headers[method] = {};
    });

    var defaults$1 = defaults;

    // RawAxiosHeaders whose duplicates are ignored by node
    // c.f. https://nodejs.org/api/http.html#http_message_headers
    const ignoreDuplicateOf = utils$1.toObjectSet([
      'age', 'authorization', 'content-length', 'content-type', 'etag',
      'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
      'last-modified', 'location', 'max-forwards', 'proxy-authorization',
      'referer', 'retry-after', 'user-agent'
    ]);

    /**
     * Parse headers into an object
     *
     * ```
     * Date: Wed, 27 Aug 2014 08:58:49 GMT
     * Content-Type: application/json
     * Connection: keep-alive
     * Transfer-Encoding: chunked
     * ```
     *
     * @param {String} rawHeaders Headers needing to be parsed
     *
     * @returns {Object} Headers parsed into an object
     */
    var parseHeaders = rawHeaders => {
      const parsed = {};
      let key;
      let val;
      let i;

      rawHeaders && rawHeaders.split('\n').forEach(function parser(line) {
        i = line.indexOf(':');
        key = line.substring(0, i).trim().toLowerCase();
        val = line.substring(i + 1).trim();

        if (!key || (parsed[key] && ignoreDuplicateOf[key])) {
          return;
        }

        if (key === 'set-cookie') {
          if (parsed[key]) {
            parsed[key].push(val);
          } else {
            parsed[key] = [val];
          }
        } else {
          parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
        }
      });

      return parsed;
    };

    const $internals = Symbol('internals');

    function normalizeHeader(header) {
      return header && String(header).trim().toLowerCase();
    }

    function normalizeValue(value) {
      if (value === false || value == null) {
        return value;
      }

      return utils$1.isArray(value) ? value.map(normalizeValue) : String(value);
    }

    function parseTokens(str) {
      const tokens = Object.create(null);
      const tokensRE = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
      let match;

      while ((match = tokensRE.exec(str))) {
        tokens[match[1]] = match[2];
      }

      return tokens;
    }

    const isValidHeaderName = (str) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(str.trim());

    function matchHeaderValue(context, value, header, filter, isHeaderNameFilter) {
      if (utils$1.isFunction(filter)) {
        return filter.call(this, value, header);
      }

      if (isHeaderNameFilter) {
        value = header;
      }

      if (!utils$1.isString(value)) return;

      if (utils$1.isString(filter)) {
        return value.indexOf(filter) !== -1;
      }

      if (utils$1.isRegExp(filter)) {
        return filter.test(value);
      }
    }

    function formatHeader(header) {
      return header.trim()
        .toLowerCase().replace(/([a-z\d])(\w*)/g, (w, char, str) => {
          return char.toUpperCase() + str;
        });
    }

    function buildAccessors(obj, header) {
      const accessorName = utils$1.toCamelCase(' ' + header);

      ['get', 'set', 'has'].forEach(methodName => {
        Object.defineProperty(obj, methodName + accessorName, {
          value: function(arg1, arg2, arg3) {
            return this[methodName].call(this, header, arg1, arg2, arg3);
          },
          configurable: true
        });
      });
    }

    class AxiosHeaders {
      constructor(headers) {
        headers && this.set(headers);
      }

      set(header, valueOrRewrite, rewrite) {
        const self = this;

        function setHeader(_value, _header, _rewrite) {
          const lHeader = normalizeHeader(_header);

          if (!lHeader) {
            throw new Error('header name must be a non-empty string');
          }

          const key = utils$1.findKey(self, lHeader);

          if(!key || self[key] === undefined || _rewrite === true || (_rewrite === undefined && self[key] !== false)) {
            self[key || _header] = normalizeValue(_value);
          }
        }

        const setHeaders = (headers, _rewrite) =>
          utils$1.forEach(headers, (_value, _header) => setHeader(_value, _header, _rewrite));

        if (utils$1.isPlainObject(header) || header instanceof this.constructor) {
          setHeaders(header, valueOrRewrite);
        } else if(utils$1.isString(header) && (header = header.trim()) && !isValidHeaderName(header)) {
          setHeaders(parseHeaders(header), valueOrRewrite);
        } else if (utils$1.isHeaders(header)) {
          for (const [key, value] of header.entries()) {
            setHeader(value, key, rewrite);
          }
        } else {
          header != null && setHeader(valueOrRewrite, header, rewrite);
        }

        return this;
      }

      get(header, parser) {
        header = normalizeHeader(header);

        if (header) {
          const key = utils$1.findKey(this, header);

          if (key) {
            const value = this[key];

            if (!parser) {
              return value;
            }

            if (parser === true) {
              return parseTokens(value);
            }

            if (utils$1.isFunction(parser)) {
              return parser.call(this, value, key);
            }

            if (utils$1.isRegExp(parser)) {
              return parser.exec(value);
            }

            throw new TypeError('parser must be boolean|regexp|function');
          }
        }
      }

      has(header, matcher) {
        header = normalizeHeader(header);

        if (header) {
          const key = utils$1.findKey(this, header);

          return !!(key && this[key] !== undefined && (!matcher || matchHeaderValue(this, this[key], key, matcher)));
        }

        return false;
      }

      delete(header, matcher) {
        const self = this;
        let deleted = false;

        function deleteHeader(_header) {
          _header = normalizeHeader(_header);

          if (_header) {
            const key = utils$1.findKey(self, _header);

            if (key && (!matcher || matchHeaderValue(self, self[key], key, matcher))) {
              delete self[key];

              deleted = true;
            }
          }
        }

        if (utils$1.isArray(header)) {
          header.forEach(deleteHeader);
        } else {
          deleteHeader(header);
        }

        return deleted;
      }

      clear(matcher) {
        const keys = Object.keys(this);
        let i = keys.length;
        let deleted = false;

        while (i--) {
          const key = keys[i];
          if(!matcher || matchHeaderValue(this, this[key], key, matcher, true)) {
            delete this[key];
            deleted = true;
          }
        }

        return deleted;
      }

      normalize(format) {
        const self = this;
        const headers = {};

        utils$1.forEach(this, (value, header) => {
          const key = utils$1.findKey(headers, header);

          if (key) {
            self[key] = normalizeValue(value);
            delete self[header];
            return;
          }

          const normalized = format ? formatHeader(header) : String(header).trim();

          if (normalized !== header) {
            delete self[header];
          }

          self[normalized] = normalizeValue(value);

          headers[normalized] = true;
        });

        return this;
      }

      concat(...targets) {
        return this.constructor.concat(this, ...targets);
      }

      toJSON(asStrings) {
        const obj = Object.create(null);

        utils$1.forEach(this, (value, header) => {
          value != null && value !== false && (obj[header] = asStrings && utils$1.isArray(value) ? value.join(', ') : value);
        });

        return obj;
      }

      [Symbol.iterator]() {
        return Object.entries(this.toJSON())[Symbol.iterator]();
      }

      toString() {
        return Object.entries(this.toJSON()).map(([header, value]) => header + ': ' + value).join('\n');
      }

      get [Symbol.toStringTag]() {
        return 'AxiosHeaders';
      }

      static from(thing) {
        return thing instanceof this ? thing : new this(thing);
      }

      static concat(first, ...targets) {
        const computed = new this(first);

        targets.forEach((target) => computed.set(target));

        return computed;
      }

      static accessor(header) {
        const internals = this[$internals] = (this[$internals] = {
          accessors: {}
        });

        const accessors = internals.accessors;
        const prototype = this.prototype;

        function defineAccessor(_header) {
          const lHeader = normalizeHeader(_header);

          if (!accessors[lHeader]) {
            buildAccessors(prototype, _header);
            accessors[lHeader] = true;
          }
        }

        utils$1.isArray(header) ? header.forEach(defineAccessor) : defineAccessor(header);

        return this;
      }
    }

    AxiosHeaders.accessor(['Content-Type', 'Content-Length', 'Accept', 'Accept-Encoding', 'User-Agent', 'Authorization']);

    // reserved names hotfix
    utils$1.reduceDescriptors(AxiosHeaders.prototype, ({value}, key) => {
      let mapped = key[0].toUpperCase() + key.slice(1); // map `set` => `Set`
      return {
        get: () => value,
        set(headerValue) {
          this[mapped] = headerValue;
        }
      }
    });

    utils$1.freezeMethods(AxiosHeaders);

    var AxiosHeaders$1 = AxiosHeaders;

    /**
     * Transform the data for a request or a response
     *
     * @param {Array|Function} fns A single function or Array of functions
     * @param {?Object} response The response object
     *
     * @returns {*} The resulting transformed data
     */
    function transformData(fns, response) {
      const config = this || defaults$1;
      const context = response || config;
      const headers = AxiosHeaders$1.from(context.headers);
      let data = context.data;

      utils$1.forEach(fns, function transform(fn) {
        data = fn.call(config, data, headers.normalize(), response ? response.status : undefined);
      });

      headers.normalize();

      return data;
    }

    function isCancel(value) {
      return !!(value && value.__CANCEL__);
    }

    /**
     * A `CanceledError` is an object that is thrown when an operation is canceled.
     *
     * @param {string=} message The message.
     * @param {Object=} config The config.
     * @param {Object=} request The request.
     *
     * @returns {CanceledError} The created error.
     */
    function CanceledError(message, config, request) {
      // eslint-disable-next-line no-eq-null,eqeqeq
      AxiosError.call(this, message == null ? 'canceled' : message, AxiosError.ERR_CANCELED, config, request);
      this.name = 'CanceledError';
    }

    utils$1.inherits(CanceledError, AxiosError, {
      __CANCEL__: true
    });

    /**
     * Resolve or reject a Promise based on response status.
     *
     * @param {Function} resolve A function that resolves the promise.
     * @param {Function} reject A function that rejects the promise.
     * @param {object} response The response.
     *
     * @returns {object} The response.
     */
    function settle(resolve, reject, response) {
      const validateStatus = response.config.validateStatus;
      if (!response.status || !validateStatus || validateStatus(response.status)) {
        resolve(response);
      } else {
        reject(new AxiosError(
          'Request failed with status code ' + response.status,
          [AxiosError.ERR_BAD_REQUEST, AxiosError.ERR_BAD_RESPONSE][Math.floor(response.status / 100) - 4],
          response.config,
          response.request,
          response
        ));
      }
    }

    function parseProtocol(url) {
      const match = /^([-+\w]{1,25})(:?\/\/|:)/.exec(url);
      return match && match[1] || '';
    }

    /**
     * Calculate data maxRate
     * @param {Number} [samplesCount= 10]
     * @param {Number} [min= 1000]
     * @returns {Function}
     */
    function speedometer(samplesCount, min) {
      samplesCount = samplesCount || 10;
      const bytes = new Array(samplesCount);
      const timestamps = new Array(samplesCount);
      let head = 0;
      let tail = 0;
      let firstSampleTS;

      min = min !== undefined ? min : 1000;

      return function push(chunkLength) {
        const now = Date.now();

        const startedAt = timestamps[tail];

        if (!firstSampleTS) {
          firstSampleTS = now;
        }

        bytes[head] = chunkLength;
        timestamps[head] = now;

        let i = tail;
        let bytesCount = 0;

        while (i !== head) {
          bytesCount += bytes[i++];
          i = i % samplesCount;
        }

        head = (head + 1) % samplesCount;

        if (head === tail) {
          tail = (tail + 1) % samplesCount;
        }

        if (now - firstSampleTS < min) {
          return;
        }

        const passed = startedAt && now - startedAt;

        return passed ? Math.round(bytesCount * 1000 / passed) : undefined;
      };
    }

    /**
     * Throttle decorator
     * @param {Function} fn
     * @param {Number} freq
     * @return {Function}
     */
    function throttle(fn, freq) {
      let timestamp = 0;
      let threshold = 1000 / freq;
      let lastArgs;
      let timer;

      const invoke = (args, now = Date.now()) => {
        timestamp = now;
        lastArgs = null;
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        fn.apply(null, args);
      };

      const throttled = (...args) => {
        const now = Date.now();
        const passed = now - timestamp;
        if ( passed >= threshold) {
          invoke(args, now);
        } else {
          lastArgs = args;
          if (!timer) {
            timer = setTimeout(() => {
              timer = null;
              invoke(lastArgs);
            }, threshold - passed);
          }
        }
      };

      const flush = () => lastArgs && invoke(lastArgs);

      return [throttled, flush];
    }

    const progressEventReducer = (listener, isDownloadStream, freq = 3) => {
      let bytesNotified = 0;
      const _speedometer = speedometer(50, 250);

      return throttle(e => {
        const loaded = e.loaded;
        const total = e.lengthComputable ? e.total : undefined;
        const progressBytes = loaded - bytesNotified;
        const rate = _speedometer(progressBytes);
        const inRange = loaded <= total;

        bytesNotified = loaded;

        const data = {
          loaded,
          total,
          progress: total ? (loaded / total) : undefined,
          bytes: progressBytes,
          rate: rate ? rate : undefined,
          estimated: rate && total && inRange ? (total - loaded) / rate : undefined,
          event: e,
          lengthComputable: total != null,
          [isDownloadStream ? 'download' : 'upload']: true
        };

        listener(data);
      }, freq);
    };

    const progressEventDecorator = (total, throttled) => {
      const lengthComputable = total != null;

      return [(loaded) => throttled[0]({
        lengthComputable,
        total,
        loaded
      }), throttled[1]];
    };

    const asyncDecorator = (fn) => (...args) => utils$1.asap(() => fn(...args));

    var isURLSameOrigin = platform.hasStandardBrowserEnv ?

    // Standard browser envs have full support of the APIs needed to test
    // whether the request URL is of the same origin as current location.
      (function standardBrowserEnv() {
        const msie = platform.navigator && /(msie|trident)/i.test(platform.navigator.userAgent);
        const urlParsingNode = document.createElement('a');
        let originURL;

        /**
        * Parse a URL to discover its components
        *
        * @param {String} url The URL to be parsed
        * @returns {Object}
        */
        function resolveURL(url) {
          let href = url;

          if (msie) {
            // IE needs attribute set twice to normalize properties
            urlParsingNode.setAttribute('href', href);
            href = urlParsingNode.href;
          }

          urlParsingNode.setAttribute('href', href);

          // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
          return {
            href: urlParsingNode.href,
            protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
            host: urlParsingNode.host,
            search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
            hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
            hostname: urlParsingNode.hostname,
            port: urlParsingNode.port,
            pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
              urlParsingNode.pathname :
              '/' + urlParsingNode.pathname
          };
        }

        originURL = resolveURL(window.location.href);

        /**
        * Determine if a URL shares the same origin as the current location
        *
        * @param {String} requestURL The URL to test
        * @returns {boolean} True if URL shares the same origin, otherwise false
        */
        return function isURLSameOrigin(requestURL) {
          const parsed = (utils$1.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
          return (parsed.protocol === originURL.protocol &&
              parsed.host === originURL.host);
        };
      })() :

      // Non standard browser envs (web workers, react-native) lack needed support.
      (function nonStandardBrowserEnv() {
        return function isURLSameOrigin() {
          return true;
        };
      })();

    var cookies = platform.hasStandardBrowserEnv ?

      // Standard browser envs support document.cookie
      {
        write(name, value, expires, path, domain, secure) {
          const cookie = [name + '=' + encodeURIComponent(value)];

          utils$1.isNumber(expires) && cookie.push('expires=' + new Date(expires).toGMTString());

          utils$1.isString(path) && cookie.push('path=' + path);

          utils$1.isString(domain) && cookie.push('domain=' + domain);

          secure === true && cookie.push('secure');

          document.cookie = cookie.join('; ');
        },

        read(name) {
          const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
          return (match ? decodeURIComponent(match[3]) : null);
        },

        remove(name) {
          this.write(name, '', Date.now() - 86400000);
        }
      }

      :

      // Non-standard browser env (web workers, react-native) lack needed support.
      {
        write() {},
        read() {
          return null;
        },
        remove() {}
      };

    /**
     * Determines whether the specified URL is absolute
     *
     * @param {string} url The URL to test
     *
     * @returns {boolean} True if the specified URL is absolute, otherwise false
     */
    function isAbsoluteURL(url) {
      // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
      // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
      // by any combination of letters, digits, plus, period, or hyphen.
      return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
    }

    /**
     * Creates a new URL by combining the specified URLs
     *
     * @param {string} baseURL The base URL
     * @param {string} relativeURL The relative URL
     *
     * @returns {string} The combined URL
     */
    function combineURLs(baseURL, relativeURL) {
      return relativeURL
        ? baseURL.replace(/\/?\/$/, '') + '/' + relativeURL.replace(/^\/+/, '')
        : baseURL;
    }

    /**
     * Creates a new URL by combining the baseURL with the requestedURL,
     * only when the requestedURL is not already an absolute URL.
     * If the requestURL is absolute, this function returns the requestedURL untouched.
     *
     * @param {string} baseURL The base URL
     * @param {string} requestedURL Absolute or relative URL to combine
     *
     * @returns {string} The combined full path
     */
    function buildFullPath(baseURL, requestedURL) {
      if (baseURL && !isAbsoluteURL(requestedURL)) {
        return combineURLs(baseURL, requestedURL);
      }
      return requestedURL;
    }

    const headersToObject = (thing) => thing instanceof AxiosHeaders$1 ? { ...thing } : thing;

    /**
     * Config-specific merge-function which creates a new config-object
     * by merging two configuration objects together.
     *
     * @param {Object} config1
     * @param {Object} config2
     *
     * @returns {Object} New object resulting from merging config2 to config1
     */
    function mergeConfig(config1, config2) {
      // eslint-disable-next-line no-param-reassign
      config2 = config2 || {};
      const config = {};

      function getMergedValue(target, source, caseless) {
        if (utils$1.isPlainObject(target) && utils$1.isPlainObject(source)) {
          return utils$1.merge.call({caseless}, target, source);
        } else if (utils$1.isPlainObject(source)) {
          return utils$1.merge({}, source);
        } else if (utils$1.isArray(source)) {
          return source.slice();
        }
        return source;
      }

      // eslint-disable-next-line consistent-return
      function mergeDeepProperties(a, b, caseless) {
        if (!utils$1.isUndefined(b)) {
          return getMergedValue(a, b, caseless);
        } else if (!utils$1.isUndefined(a)) {
          return getMergedValue(undefined, a, caseless);
        }
      }

      // eslint-disable-next-line consistent-return
      function valueFromConfig2(a, b) {
        if (!utils$1.isUndefined(b)) {
          return getMergedValue(undefined, b);
        }
      }

      // eslint-disable-next-line consistent-return
      function defaultToConfig2(a, b) {
        if (!utils$1.isUndefined(b)) {
          return getMergedValue(undefined, b);
        } else if (!utils$1.isUndefined(a)) {
          return getMergedValue(undefined, a);
        }
      }

      // eslint-disable-next-line consistent-return
      function mergeDirectKeys(a, b, prop) {
        if (prop in config2) {
          return getMergedValue(a, b);
        } else if (prop in config1) {
          return getMergedValue(undefined, a);
        }
      }

      const mergeMap = {
        url: valueFromConfig2,
        method: valueFromConfig2,
        data: valueFromConfig2,
        baseURL: defaultToConfig2,
        transformRequest: defaultToConfig2,
        transformResponse: defaultToConfig2,
        paramsSerializer: defaultToConfig2,
        timeout: defaultToConfig2,
        timeoutMessage: defaultToConfig2,
        withCredentials: defaultToConfig2,
        withXSRFToken: defaultToConfig2,
        adapter: defaultToConfig2,
        responseType: defaultToConfig2,
        xsrfCookieName: defaultToConfig2,
        xsrfHeaderName: defaultToConfig2,
        onUploadProgress: defaultToConfig2,
        onDownloadProgress: defaultToConfig2,
        decompress: defaultToConfig2,
        maxContentLength: defaultToConfig2,
        maxBodyLength: defaultToConfig2,
        beforeRedirect: defaultToConfig2,
        transport: defaultToConfig2,
        httpAgent: defaultToConfig2,
        httpsAgent: defaultToConfig2,
        cancelToken: defaultToConfig2,
        socketPath: defaultToConfig2,
        responseEncoding: defaultToConfig2,
        validateStatus: mergeDirectKeys,
        headers: (a, b) => mergeDeepProperties(headersToObject(a), headersToObject(b), true)
      };

      utils$1.forEach(Object.keys(Object.assign({}, config1, config2)), function computeConfigValue(prop) {
        const merge = mergeMap[prop] || mergeDeepProperties;
        const configValue = merge(config1[prop], config2[prop], prop);
        (utils$1.isUndefined(configValue) && merge !== mergeDirectKeys) || (config[prop] = configValue);
      });

      return config;
    }

    var resolveConfig = (config) => {
      const newConfig = mergeConfig({}, config);

      let {data, withXSRFToken, xsrfHeaderName, xsrfCookieName, headers, auth} = newConfig;

      newConfig.headers = headers = AxiosHeaders$1.from(headers);

      newConfig.url = buildURL(buildFullPath(newConfig.baseURL, newConfig.url), config.params, config.paramsSerializer);

      // HTTP basic authentication
      if (auth) {
        headers.set('Authorization', 'Basic ' +
          btoa((auth.username || '') + ':' + (auth.password ? unescape(encodeURIComponent(auth.password)) : ''))
        );
      }

      let contentType;

      if (utils$1.isFormData(data)) {
        if (platform.hasStandardBrowserEnv || platform.hasStandardBrowserWebWorkerEnv) {
          headers.setContentType(undefined); // Let the browser set it
        } else if ((contentType = headers.getContentType()) !== false) {
          // fix semicolon duplication issue for ReactNative FormData implementation
          const [type, ...tokens] = contentType ? contentType.split(';').map(token => token.trim()).filter(Boolean) : [];
          headers.setContentType([type || 'multipart/form-data', ...tokens].join('; '));
        }
      }

      // Add xsrf header
      // This is only done if running in a standard browser environment.
      // Specifically not if we're in a web worker, or react-native.

      if (platform.hasStandardBrowserEnv) {
        withXSRFToken && utils$1.isFunction(withXSRFToken) && (withXSRFToken = withXSRFToken(newConfig));

        if (withXSRFToken || (withXSRFToken !== false && isURLSameOrigin(newConfig.url))) {
          // Add xsrf header
          const xsrfValue = xsrfHeaderName && xsrfCookieName && cookies.read(xsrfCookieName);

          if (xsrfValue) {
            headers.set(xsrfHeaderName, xsrfValue);
          }
        }
      }

      return newConfig;
    };

    const isXHRAdapterSupported = typeof XMLHttpRequest !== 'undefined';

    var xhrAdapter = isXHRAdapterSupported && function (config) {
      return new Promise(function dispatchXhrRequest(resolve, reject) {
        const _config = resolveConfig(config);
        let requestData = _config.data;
        const requestHeaders = AxiosHeaders$1.from(_config.headers).normalize();
        let {responseType, onUploadProgress, onDownloadProgress} = _config;
        let onCanceled;
        let uploadThrottled, downloadThrottled;
        let flushUpload, flushDownload;

        function done() {
          flushUpload && flushUpload(); // flush events
          flushDownload && flushDownload(); // flush events

          _config.cancelToken && _config.cancelToken.unsubscribe(onCanceled);

          _config.signal && _config.signal.removeEventListener('abort', onCanceled);
        }

        let request = new XMLHttpRequest();

        request.open(_config.method.toUpperCase(), _config.url, true);

        // Set the request timeout in MS
        request.timeout = _config.timeout;

        function onloadend() {
          if (!request) {
            return;
          }
          // Prepare the response
          const responseHeaders = AxiosHeaders$1.from(
            'getAllResponseHeaders' in request && request.getAllResponseHeaders()
          );
          const responseData = !responseType || responseType === 'text' || responseType === 'json' ?
            request.responseText : request.response;
          const response = {
            data: responseData,
            status: request.status,
            statusText: request.statusText,
            headers: responseHeaders,
            config,
            request
          };

          settle(function _resolve(value) {
            resolve(value);
            done();
          }, function _reject(err) {
            reject(err);
            done();
          }, response);

          // Clean up request
          request = null;
        }

        if ('onloadend' in request) {
          // Use onloadend if available
          request.onloadend = onloadend;
        } else {
          // Listen for ready state to emulate onloadend
          request.onreadystatechange = function handleLoad() {
            if (!request || request.readyState !== 4) {
              return;
            }

            // The request errored out and we didn't get a response, this will be
            // handled by onerror instead
            // With one exception: request that using file: protocol, most browsers
            // will return status as 0 even though it's a successful request
            if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
              return;
            }
            // readystate handler is calling before onerror or ontimeout handlers,
            // so we should call onloadend on the next 'tick'
            setTimeout(onloadend);
          };
        }

        // Handle browser request cancellation (as opposed to a manual cancellation)
        request.onabort = function handleAbort() {
          if (!request) {
            return;
          }

          reject(new AxiosError('Request aborted', AxiosError.ECONNABORTED, config, request));

          // Clean up request
          request = null;
        };

        // Handle low level network errors
        request.onerror = function handleError() {
          // Real errors are hidden from us by the browser
          // onerror should only fire if it's a network error
          reject(new AxiosError('Network Error', AxiosError.ERR_NETWORK, config, request));

          // Clean up request
          request = null;
        };

        // Handle timeout
        request.ontimeout = function handleTimeout() {
          let timeoutErrorMessage = _config.timeout ? 'timeout of ' + _config.timeout + 'ms exceeded' : 'timeout exceeded';
          const transitional = _config.transitional || transitionalDefaults;
          if (_config.timeoutErrorMessage) {
            timeoutErrorMessage = _config.timeoutErrorMessage;
          }
          reject(new AxiosError(
            timeoutErrorMessage,
            transitional.clarifyTimeoutError ? AxiosError.ETIMEDOUT : AxiosError.ECONNABORTED,
            config,
            request));

          // Clean up request
          request = null;
        };

        // Remove Content-Type if data is undefined
        requestData === undefined && requestHeaders.setContentType(null);

        // Add headers to the request
        if ('setRequestHeader' in request) {
          utils$1.forEach(requestHeaders.toJSON(), function setRequestHeader(val, key) {
            request.setRequestHeader(key, val);
          });
        }

        // Add withCredentials to request if needed
        if (!utils$1.isUndefined(_config.withCredentials)) {
          request.withCredentials = !!_config.withCredentials;
        }

        // Add responseType to request if needed
        if (responseType && responseType !== 'json') {
          request.responseType = _config.responseType;
        }

        // Handle progress if needed
        if (onDownloadProgress) {
          ([downloadThrottled, flushDownload] = progressEventReducer(onDownloadProgress, true));
          request.addEventListener('progress', downloadThrottled);
        }

        // Not all browsers support upload events
        if (onUploadProgress && request.upload) {
          ([uploadThrottled, flushUpload] = progressEventReducer(onUploadProgress));

          request.upload.addEventListener('progress', uploadThrottled);

          request.upload.addEventListener('loadend', flushUpload);
        }

        if (_config.cancelToken || _config.signal) {
          // Handle cancellation
          // eslint-disable-next-line func-names
          onCanceled = cancel => {
            if (!request) {
              return;
            }
            reject(!cancel || cancel.type ? new CanceledError(null, config, request) : cancel);
            request.abort();
            request = null;
          };

          _config.cancelToken && _config.cancelToken.subscribe(onCanceled);
          if (_config.signal) {
            _config.signal.aborted ? onCanceled() : _config.signal.addEventListener('abort', onCanceled);
          }
        }

        const protocol = parseProtocol(_config.url);

        if (protocol && platform.protocols.indexOf(protocol) === -1) {
          reject(new AxiosError('Unsupported protocol ' + protocol + ':', AxiosError.ERR_BAD_REQUEST, config));
          return;
        }


        // Send the request
        request.send(requestData || null);
      });
    };

    const composeSignals = (signals, timeout) => {
      let controller = new AbortController();

      let aborted;

      const onabort = function (cancel) {
        if (!aborted) {
          aborted = true;
          unsubscribe();
          const err = cancel instanceof Error ? cancel : this.reason;
          controller.abort(err instanceof AxiosError ? err : new CanceledError(err instanceof Error ? err.message : err));
        }
      };

      let timer = timeout && setTimeout(() => {
        onabort(new AxiosError(`timeout ${timeout} of ms exceeded`, AxiosError.ETIMEDOUT));
      }, timeout);

      const unsubscribe = () => {
        if (signals) {
          timer && clearTimeout(timer);
          timer = null;
          signals.forEach(signal => {
            signal &&
            (signal.removeEventListener ? signal.removeEventListener('abort', onabort) : signal.unsubscribe(onabort));
          });
          signals = null;
        }
      };

      signals.forEach((signal) => signal && signal.addEventListener && signal.addEventListener('abort', onabort));

      const {signal} = controller;

      signal.unsubscribe = unsubscribe;

      return [signal, () => {
        timer && clearTimeout(timer);
        timer = null;
      }];
    };

    var composeSignals$1 = composeSignals;

    const streamChunk = function* (chunk, chunkSize) {
      let len = chunk.byteLength;

      if (!chunkSize || len < chunkSize) {
        yield chunk;
        return;
      }

      let pos = 0;
      let end;

      while (pos < len) {
        end = pos + chunkSize;
        yield chunk.slice(pos, end);
        pos = end;
      }
    };

    const readBytes = async function* (iterable, chunkSize, encode) {
      for await (const chunk of iterable) {
        yield* streamChunk(ArrayBuffer.isView(chunk) ? chunk : (await encode(String(chunk))), chunkSize);
      }
    };

    const trackStream = (stream, chunkSize, onProgress, onFinish, encode) => {
      const iterator = readBytes(stream, chunkSize, encode);

      let bytes = 0;
      let done;
      let _onFinish = (e) => {
        if (!done) {
          done = true;
          onFinish && onFinish(e);
        }
      };

      return new ReadableStream({
        async pull(controller) {
          try {
            const {done, value} = await iterator.next();

            if (done) {
             _onFinish();
              controller.close();
              return;
            }

            let len = value.byteLength;
            if (onProgress) {
              let loadedBytes = bytes += len;
              onProgress(loadedBytes);
            }
            controller.enqueue(new Uint8Array(value));
          } catch (err) {
            _onFinish(err);
            throw err;
          }
        },
        cancel(reason) {
          _onFinish(reason);
          return iterator.return();
        }
      }, {
        highWaterMark: 2
      })
    };

    const isFetchSupported = typeof fetch === 'function' && typeof Request === 'function' && typeof Response === 'function';
    const isReadableStreamSupported = isFetchSupported && typeof ReadableStream === 'function';

    // used only inside the fetch adapter
    const encodeText = isFetchSupported && (typeof TextEncoder === 'function' ?
        ((encoder) => (str) => encoder.encode(str))(new TextEncoder()) :
        async (str) => new Uint8Array(await new Response(str).arrayBuffer())
    );

    const test = (fn, ...args) => {
      try {
        return !!fn(...args);
      } catch (e) {
        return false
      }
    };

    const supportsRequestStream = isReadableStreamSupported && test(() => {
      let duplexAccessed = false;

      const hasContentType = new Request(platform.origin, {
        body: new ReadableStream(),
        method: 'POST',
        get duplex() {
          duplexAccessed = true;
          return 'half';
        },
      }).headers.has('Content-Type');

      return duplexAccessed && !hasContentType;
    });

    const DEFAULT_CHUNK_SIZE = 64 * 1024;

    const supportsResponseStream = isReadableStreamSupported &&
      test(() => utils$1.isReadableStream(new Response('').body));


    const resolvers = {
      stream: supportsResponseStream && ((res) => res.body)
    };

    isFetchSupported && (((res) => {
      ['text', 'arrayBuffer', 'blob', 'formData', 'stream'].forEach(type => {
        !resolvers[type] && (resolvers[type] = utils$1.isFunction(res[type]) ? (res) => res[type]() :
          (_, config) => {
            throw new AxiosError(`Response type '${type}' is not supported`, AxiosError.ERR_NOT_SUPPORT, config);
          });
      });
    })(new Response));

    const getBodyLength = async (body) => {
      if (body == null) {
        return 0;
      }

      if(utils$1.isBlob(body)) {
        return body.size;
      }

      if(utils$1.isSpecCompliantForm(body)) {
        return (await new Request(body).arrayBuffer()).byteLength;
      }

      if(utils$1.isArrayBufferView(body) || utils$1.isArrayBuffer(body)) {
        return body.byteLength;
      }

      if(utils$1.isURLSearchParams(body)) {
        body = body + '';
      }

      if(utils$1.isString(body)) {
        return (await encodeText(body)).byteLength;
      }
    };

    const resolveBodyLength = async (headers, body) => {
      const length = utils$1.toFiniteNumber(headers.getContentLength());

      return length == null ? getBodyLength(body) : length;
    };

    var fetchAdapter = isFetchSupported && (async (config) => {
      let {
        url,
        method,
        data,
        signal,
        cancelToken,
        timeout,
        onDownloadProgress,
        onUploadProgress,
        responseType,
        headers,
        withCredentials = 'same-origin',
        fetchOptions
      } = resolveConfig(config);

      responseType = responseType ? (responseType + '').toLowerCase() : 'text';

      let [composedSignal, stopTimeout] = (signal || cancelToken || timeout) ?
        composeSignals$1([signal, cancelToken], timeout) : [];

      let finished, request;

      const onFinish = () => {
        !finished && setTimeout(() => {
          composedSignal && composedSignal.unsubscribe();
        });

        finished = true;
      };

      let requestContentLength;

      try {
        if (
          onUploadProgress && supportsRequestStream && method !== 'get' && method !== 'head' &&
          (requestContentLength = await resolveBodyLength(headers, data)) !== 0
        ) {
          let _request = new Request(url, {
            method: 'POST',
            body: data,
            duplex: "half"
          });

          let contentTypeHeader;

          if (utils$1.isFormData(data) && (contentTypeHeader = _request.headers.get('content-type'))) {
            headers.setContentType(contentTypeHeader);
          }

          if (_request.body) {
            const [onProgress, flush] = progressEventDecorator(
              requestContentLength,
              progressEventReducer(asyncDecorator(onUploadProgress))
            );

            data = trackStream(_request.body, DEFAULT_CHUNK_SIZE, onProgress, flush, encodeText);
          }
        }

        if (!utils$1.isString(withCredentials)) {
          withCredentials = withCredentials ? 'include' : 'omit';
        }

        // Cloudflare Workers throws when credentials are defined
        // see https://github.com/cloudflare/workerd/issues/902
        const isCredentialsSupported = "credentials" in Request.prototype; 
        request = new Request(url, {
          ...fetchOptions,
          signal: composedSignal,
          method: method.toUpperCase(),
          headers: headers.normalize().toJSON(),
          body: data,
          duplex: "half",
          credentials: isCredentialsSupported ? withCredentials : undefined
        });

        let response = await fetch(request);

        const isStreamResponse = supportsResponseStream && (responseType === 'stream' || responseType === 'response');

        if (supportsResponseStream && (onDownloadProgress || isStreamResponse)) {
          const options = {};

          ['status', 'statusText', 'headers'].forEach(prop => {
            options[prop] = response[prop];
          });

          const responseContentLength = utils$1.toFiniteNumber(response.headers.get('content-length'));

          const [onProgress, flush] = onDownloadProgress && progressEventDecorator(
            responseContentLength,
            progressEventReducer(asyncDecorator(onDownloadProgress), true)
          ) || [];

          response = new Response(
            trackStream(response.body, DEFAULT_CHUNK_SIZE, onProgress, () => {
              flush && flush();
              isStreamResponse && onFinish();
            }, encodeText),
            options
          );
        }

        responseType = responseType || 'text';

        let responseData = await resolvers[utils$1.findKey(resolvers, responseType) || 'text'](response, config);

        !isStreamResponse && onFinish();

        stopTimeout && stopTimeout();

        return await new Promise((resolve, reject) => {
          settle(resolve, reject, {
            data: responseData,
            headers: AxiosHeaders$1.from(response.headers),
            status: response.status,
            statusText: response.statusText,
            config,
            request
          });
        })
      } catch (err) {
        onFinish();

        if (err && err.name === 'TypeError' && /fetch/i.test(err.message)) {
          throw Object.assign(
            new AxiosError('Network Error', AxiosError.ERR_NETWORK, config, request),
            {
              cause: err.cause || err
            }
          )
        }

        throw AxiosError.from(err, err && err.code, config, request);
      }
    });

    const knownAdapters = {
      http: httpAdapter,
      xhr: xhrAdapter,
      fetch: fetchAdapter
    };

    utils$1.forEach(knownAdapters, (fn, value) => {
      if (fn) {
        try {
          Object.defineProperty(fn, 'name', {value});
        } catch (e) {
          // eslint-disable-next-line no-empty
        }
        Object.defineProperty(fn, 'adapterName', {value});
      }
    });

    const renderReason = (reason) => `- ${reason}`;

    const isResolvedHandle = (adapter) => utils$1.isFunction(adapter) || adapter === null || adapter === false;

    var adapters = {
      getAdapter: (adapters) => {
        adapters = utils$1.isArray(adapters) ? adapters : [adapters];

        const {length} = adapters;
        let nameOrAdapter;
        let adapter;

        const rejectedReasons = {};

        for (let i = 0; i < length; i++) {
          nameOrAdapter = adapters[i];
          let id;

          adapter = nameOrAdapter;

          if (!isResolvedHandle(nameOrAdapter)) {
            adapter = knownAdapters[(id = String(nameOrAdapter)).toLowerCase()];

            if (adapter === undefined) {
              throw new AxiosError(`Unknown adapter '${id}'`);
            }
          }

          if (adapter) {
            break;
          }

          rejectedReasons[id || '#' + i] = adapter;
        }

        if (!adapter) {

          const reasons = Object.entries(rejectedReasons)
            .map(([id, state]) => `adapter ${id} ` +
              (state === false ? 'is not supported by the environment' : 'is not available in the build')
            );

          let s = length ?
            (reasons.length > 1 ? 'since :\n' + reasons.map(renderReason).join('\n') : ' ' + renderReason(reasons[0])) :
            'as no adapter specified';

          throw new AxiosError(
            `There is no suitable adapter to dispatch the request ` + s,
            'ERR_NOT_SUPPORT'
          );
        }

        return adapter;
      },
      adapters: knownAdapters
    };

    /**
     * Throws a `CanceledError` if cancellation has been requested.
     *
     * @param {Object} config The config that is to be used for the request
     *
     * @returns {void}
     */
    function throwIfCancellationRequested(config) {
      if (config.cancelToken) {
        config.cancelToken.throwIfRequested();
      }

      if (config.signal && config.signal.aborted) {
        throw new CanceledError(null, config);
      }
    }

    /**
     * Dispatch a request to the server using the configured adapter.
     *
     * @param {object} config The config that is to be used for the request
     *
     * @returns {Promise} The Promise to be fulfilled
     */
    function dispatchRequest(config) {
      throwIfCancellationRequested(config);

      config.headers = AxiosHeaders$1.from(config.headers);

      // Transform request data
      config.data = transformData.call(
        config,
        config.transformRequest
      );

      if (['post', 'put', 'patch'].indexOf(config.method) !== -1) {
        config.headers.setContentType('application/x-www-form-urlencoded', false);
      }

      const adapter = adapters.getAdapter(config.adapter || defaults$1.adapter);

      return adapter(config).then(function onAdapterResolution(response) {
        throwIfCancellationRequested(config);

        // Transform response data
        response.data = transformData.call(
          config,
          config.transformResponse,
          response
        );

        response.headers = AxiosHeaders$1.from(response.headers);

        return response;
      }, function onAdapterRejection(reason) {
        if (!isCancel(reason)) {
          throwIfCancellationRequested(config);

          // Transform response data
          if (reason && reason.response) {
            reason.response.data = transformData.call(
              config,
              config.transformResponse,
              reason.response
            );
            reason.response.headers = AxiosHeaders$1.from(reason.response.headers);
          }
        }

        return Promise.reject(reason);
      });
    }

    const VERSION = "1.7.5";

    const validators$1 = {};

    // eslint-disable-next-line func-names
    ['object', 'boolean', 'number', 'function', 'string', 'symbol'].forEach((type, i) => {
      validators$1[type] = function validator(thing) {
        return typeof thing === type || 'a' + (i < 1 ? 'n ' : ' ') + type;
      };
    });

    const deprecatedWarnings = {};

    /**
     * Transitional option validator
     *
     * @param {function|boolean?} validator - set to false if the transitional option has been removed
     * @param {string?} version - deprecated version / removed since version
     * @param {string?} message - some message with additional info
     *
     * @returns {function}
     */
    validators$1.transitional = function transitional(validator, version, message) {
      function formatMessage(opt, desc) {
        return '[Axios v' + VERSION + '] Transitional option \'' + opt + '\'' + desc + (message ? '. ' + message : '');
      }

      // eslint-disable-next-line func-names
      return (value, opt, opts) => {
        if (validator === false) {
          throw new AxiosError(
            formatMessage(opt, ' has been removed' + (version ? ' in ' + version : '')),
            AxiosError.ERR_DEPRECATED
          );
        }

        if (version && !deprecatedWarnings[opt]) {
          deprecatedWarnings[opt] = true;
          // eslint-disable-next-line no-console
          console.warn(
            formatMessage(
              opt,
              ' has been deprecated since v' + version + ' and will be removed in the near future'
            )
          );
        }

        return validator ? validator(value, opt, opts) : true;
      };
    };

    /**
     * Assert object's properties type
     *
     * @param {object} options
     * @param {object} schema
     * @param {boolean?} allowUnknown
     *
     * @returns {object}
     */

    function assertOptions(options, schema, allowUnknown) {
      if (typeof options !== 'object') {
        throw new AxiosError('options must be an object', AxiosError.ERR_BAD_OPTION_VALUE);
      }
      const keys = Object.keys(options);
      let i = keys.length;
      while (i-- > 0) {
        const opt = keys[i];
        const validator = schema[opt];
        if (validator) {
          const value = options[opt];
          const result = value === undefined || validator(value, opt, options);
          if (result !== true) {
            throw new AxiosError('option ' + opt + ' must be ' + result, AxiosError.ERR_BAD_OPTION_VALUE);
          }
          continue;
        }
        if (allowUnknown !== true) {
          throw new AxiosError('Unknown option ' + opt, AxiosError.ERR_BAD_OPTION);
        }
      }
    }

    var validator = {
      assertOptions,
      validators: validators$1
    };

    const validators = validator.validators;

    /**
     * Create a new instance of Axios
     *
     * @param {Object} instanceConfig The default config for the instance
     *
     * @return {Axios} A new instance of Axios
     */
    class Axios {
      constructor(instanceConfig) {
        this.defaults = instanceConfig;
        this.interceptors = {
          request: new InterceptorManager$1(),
          response: new InterceptorManager$1()
        };
      }

      /**
       * Dispatch a request
       *
       * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
       * @param {?Object} config
       *
       * @returns {Promise} The Promise to be fulfilled
       */
      async request(configOrUrl, config) {
        try {
          return await this._request(configOrUrl, config);
        } catch (err) {
          if (err instanceof Error) {
            let dummy;

            Error.captureStackTrace ? Error.captureStackTrace(dummy = {}) : (dummy = new Error());

            // slice off the Error: ... line
            const stack = dummy.stack ? dummy.stack.replace(/^.+\n/, '') : '';
            try {
              if (!err.stack) {
                err.stack = stack;
                // match without the 2 top stack lines
              } else if (stack && !String(err.stack).endsWith(stack.replace(/^.+\n.+\n/, ''))) {
                err.stack += '\n' + stack;
              }
            } catch (e) {
              // ignore the case where "stack" is an un-writable property
            }
          }

          throw err;
        }
      }

      _request(configOrUrl, config) {
        /*eslint no-param-reassign:0*/
        // Allow for axios('example/url'[, config]) a la fetch API
        if (typeof configOrUrl === 'string') {
          config = config || {};
          config.url = configOrUrl;
        } else {
          config = configOrUrl || {};
        }

        config = mergeConfig(this.defaults, config);

        const {transitional, paramsSerializer, headers} = config;

        if (transitional !== undefined) {
          validator.assertOptions(transitional, {
            silentJSONParsing: validators.transitional(validators.boolean),
            forcedJSONParsing: validators.transitional(validators.boolean),
            clarifyTimeoutError: validators.transitional(validators.boolean)
          }, false);
        }

        if (paramsSerializer != null) {
          if (utils$1.isFunction(paramsSerializer)) {
            config.paramsSerializer = {
              serialize: paramsSerializer
            };
          } else {
            validator.assertOptions(paramsSerializer, {
              encode: validators.function,
              serialize: validators.function
            }, true);
          }
        }

        // Set config.method
        config.method = (config.method || this.defaults.method || 'get').toLowerCase();

        // Flatten headers
        let contextHeaders = headers && utils$1.merge(
          headers.common,
          headers[config.method]
        );

        headers && utils$1.forEach(
          ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
          (method) => {
            delete headers[method];
          }
        );

        config.headers = AxiosHeaders$1.concat(contextHeaders, headers);

        // filter out skipped interceptors
        const requestInterceptorChain = [];
        let synchronousRequestInterceptors = true;
        this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
          if (typeof interceptor.runWhen === 'function' && interceptor.runWhen(config) === false) {
            return;
          }

          synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;

          requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
        });

        const responseInterceptorChain = [];
        this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
          responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
        });

        let promise;
        let i = 0;
        let len;

        if (!synchronousRequestInterceptors) {
          const chain = [dispatchRequest.bind(this), undefined];
          chain.unshift.apply(chain, requestInterceptorChain);
          chain.push.apply(chain, responseInterceptorChain);
          len = chain.length;

          promise = Promise.resolve(config);

          while (i < len) {
            promise = promise.then(chain[i++], chain[i++]);
          }

          return promise;
        }

        len = requestInterceptorChain.length;

        let newConfig = config;

        i = 0;

        while (i < len) {
          const onFulfilled = requestInterceptorChain[i++];
          const onRejected = requestInterceptorChain[i++];
          try {
            newConfig = onFulfilled(newConfig);
          } catch (error) {
            onRejected.call(this, error);
            break;
          }
        }

        try {
          promise = dispatchRequest.call(this, newConfig);
        } catch (error) {
          return Promise.reject(error);
        }

        i = 0;
        len = responseInterceptorChain.length;

        while (i < len) {
          promise = promise.then(responseInterceptorChain[i++], responseInterceptorChain[i++]);
        }

        return promise;
      }

      getUri(config) {
        config = mergeConfig(this.defaults, config);
        const fullPath = buildFullPath(config.baseURL, config.url);
        return buildURL(fullPath, config.params, config.paramsSerializer);
      }
    }

    // Provide aliases for supported request methods
    utils$1.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, config) {
        return this.request(mergeConfig(config || {}, {
          method,
          url,
          data: (config || {}).data
        }));
      };
    });

    utils$1.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      /*eslint func-names:0*/

      function generateHTTPMethod(isForm) {
        return function httpMethod(url, data, config) {
          return this.request(mergeConfig(config || {}, {
            method,
            headers: isForm ? {
              'Content-Type': 'multipart/form-data'
            } : {},
            url,
            data
          }));
        };
      }

      Axios.prototype[method] = generateHTTPMethod();

      Axios.prototype[method + 'Form'] = generateHTTPMethod(true);
    });

    var Axios$1 = Axios;

    /**
     * A `CancelToken` is an object that can be used to request cancellation of an operation.
     *
     * @param {Function} executor The executor function.
     *
     * @returns {CancelToken}
     */
    class CancelToken {
      constructor(executor) {
        if (typeof executor !== 'function') {
          throw new TypeError('executor must be a function.');
        }

        let resolvePromise;

        this.promise = new Promise(function promiseExecutor(resolve) {
          resolvePromise = resolve;
        });

        const token = this;

        // eslint-disable-next-line func-names
        this.promise.then(cancel => {
          if (!token._listeners) return;

          let i = token._listeners.length;

          while (i-- > 0) {
            token._listeners[i](cancel);
          }
          token._listeners = null;
        });

        // eslint-disable-next-line func-names
        this.promise.then = onfulfilled => {
          let _resolve;
          // eslint-disable-next-line func-names
          const promise = new Promise(resolve => {
            token.subscribe(resolve);
            _resolve = resolve;
          }).then(onfulfilled);

          promise.cancel = function reject() {
            token.unsubscribe(_resolve);
          };

          return promise;
        };

        executor(function cancel(message, config, request) {
          if (token.reason) {
            // Cancellation has already been requested
            return;
          }

          token.reason = new CanceledError(message, config, request);
          resolvePromise(token.reason);
        });
      }

      /**
       * Throws a `CanceledError` if cancellation has been requested.
       */
      throwIfRequested() {
        if (this.reason) {
          throw this.reason;
        }
      }

      /**
       * Subscribe to the cancel signal
       */

      subscribe(listener) {
        if (this.reason) {
          listener(this.reason);
          return;
        }

        if (this._listeners) {
          this._listeners.push(listener);
        } else {
          this._listeners = [listener];
        }
      }

      /**
       * Unsubscribe from the cancel signal
       */

      unsubscribe(listener) {
        if (!this._listeners) {
          return;
        }
        const index = this._listeners.indexOf(listener);
        if (index !== -1) {
          this._listeners.splice(index, 1);
        }
      }

      /**
       * Returns an object that contains a new `CancelToken` and a function that, when called,
       * cancels the `CancelToken`.
       */
      static source() {
        let cancel;
        const token = new CancelToken(function executor(c) {
          cancel = c;
        });
        return {
          token,
          cancel
        };
      }
    }

    var CancelToken$1 = CancelToken;

    /**
     * Syntactic sugar for invoking a function and expanding an array for arguments.
     *
     * Common use case would be to use `Function.prototype.apply`.
     *
     *  ```js
     *  function f(x, y, z) {}
     *  var args = [1, 2, 3];
     *  f.apply(null, args);
     *  ```
     *
     * With `spread` this example can be re-written.
     *
     *  ```js
     *  spread(function(x, y, z) {})([1, 2, 3]);
     *  ```
     *
     * @param {Function} callback
     *
     * @returns {Function}
     */
    function spread(callback) {
      return function wrap(arr) {
        return callback.apply(null, arr);
      };
    }

    /**
     * Determines whether the payload is an error thrown by Axios
     *
     * @param {*} payload The value to test
     *
     * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
     */
    function isAxiosError(payload) {
      return utils$1.isObject(payload) && (payload.isAxiosError === true);
    }

    const HttpStatusCode = {
      Continue: 100,
      SwitchingProtocols: 101,
      Processing: 102,
      EarlyHints: 103,
      Ok: 200,
      Created: 201,
      Accepted: 202,
      NonAuthoritativeInformation: 203,
      NoContent: 204,
      ResetContent: 205,
      PartialContent: 206,
      MultiStatus: 207,
      AlreadyReported: 208,
      ImUsed: 226,
      MultipleChoices: 300,
      MovedPermanently: 301,
      Found: 302,
      SeeOther: 303,
      NotModified: 304,
      UseProxy: 305,
      Unused: 306,
      TemporaryRedirect: 307,
      PermanentRedirect: 308,
      BadRequest: 400,
      Unauthorized: 401,
      PaymentRequired: 402,
      Forbidden: 403,
      NotFound: 404,
      MethodNotAllowed: 405,
      NotAcceptable: 406,
      ProxyAuthenticationRequired: 407,
      RequestTimeout: 408,
      Conflict: 409,
      Gone: 410,
      LengthRequired: 411,
      PreconditionFailed: 412,
      PayloadTooLarge: 413,
      UriTooLong: 414,
      UnsupportedMediaType: 415,
      RangeNotSatisfiable: 416,
      ExpectationFailed: 417,
      ImATeapot: 418,
      MisdirectedRequest: 421,
      UnprocessableEntity: 422,
      Locked: 423,
      FailedDependency: 424,
      TooEarly: 425,
      UpgradeRequired: 426,
      PreconditionRequired: 428,
      TooManyRequests: 429,
      RequestHeaderFieldsTooLarge: 431,
      UnavailableForLegalReasons: 451,
      InternalServerError: 500,
      NotImplemented: 501,
      BadGateway: 502,
      ServiceUnavailable: 503,
      GatewayTimeout: 504,
      HttpVersionNotSupported: 505,
      VariantAlsoNegotiates: 506,
      InsufficientStorage: 507,
      LoopDetected: 508,
      NotExtended: 510,
      NetworkAuthenticationRequired: 511,
    };

    Object.entries(HttpStatusCode).forEach(([key, value]) => {
      HttpStatusCode[value] = key;
    });

    var HttpStatusCode$1 = HttpStatusCode;

    /**
     * Create an instance of Axios
     *
     * @param {Object} defaultConfig The default config for the instance
     *
     * @returns {Axios} A new instance of Axios
     */
    function createInstance(defaultConfig) {
      const context = new Axios$1(defaultConfig);
      const instance = bind(Axios$1.prototype.request, context);

      // Copy axios.prototype to instance
      utils$1.extend(instance, Axios$1.prototype, context, {allOwnKeys: true});

      // Copy context to instance
      utils$1.extend(instance, context, null, {allOwnKeys: true});

      // Factory for creating new instances
      instance.create = function create(instanceConfig) {
        return createInstance(mergeConfig(defaultConfig, instanceConfig));
      };

      return instance;
    }

    // Create the default instance to be exported
    const axios = createInstance(defaults$1);

    // Expose Axios class to allow class inheritance
    axios.Axios = Axios$1;

    // Expose Cancel & CancelToken
    axios.CanceledError = CanceledError;
    axios.CancelToken = CancelToken$1;
    axios.isCancel = isCancel;
    axios.VERSION = VERSION;
    axios.toFormData = toFormData;

    // Expose AxiosError class
    axios.AxiosError = AxiosError;

    // alias for CanceledError for backward compatibility
    axios.Cancel = axios.CanceledError;

    // Expose all/spread
    axios.all = function all(promises) {
      return Promise.all(promises);
    };

    axios.spread = spread;

    // Expose isAxiosError
    axios.isAxiosError = isAxiosError;

    // Expose mergeConfig
    axios.mergeConfig = mergeConfig;

    axios.AxiosHeaders = AxiosHeaders$1;

    axios.formToJSON = thing => formDataToJSON(utils$1.isHTMLForm(thing) ? new FormData(thing) : thing);

    axios.getAdapter = adapters.getAdapter;

    axios.HttpStatusCode = HttpStatusCode$1;

    axios.default = axios;

    // this module should only have a default export
    var axios$1 = axios;

    /* src/App.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1, console: console_1, document: document_1 } = globals;
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[67] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[70] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[73] = list[i];
    	child_ctx[75] = i;
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[73] = list[i];
    	child_ctx[75] = i;
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[77] = list[i];
    	child_ctx[75] = i;
    	return child_ctx;
    }

    function get_each_context_5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[73] = list[i];
    	child_ctx[75] = i;
    	return child_ctx;
    }

    function get_each_context_6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[73] = list[i];
    	child_ctx[75] = i;
    	return child_ctx;
    }

    function get_each_context_7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[73] = list[i];
    	child_ctx[75] = i;
    	return child_ctx;
    }

    function get_each_context_8(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[77] = list[i];
    	child_ctx[75] = i;
    	return child_ctx;
    }

    // (425:12) {#if movies.length > 0 && getFirstVisibleIndex($scrollY) < movies.length && movies[getFirstVisibleIndex($scrollY)]}
    function create_if_block_6(ctx) {
    	let label;
    	let t1;
    	let textarea;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			label = element("label");
    			label.textContent = "Year:";
    			t1 = space();
    			textarea = element("textarea");
    			attr_dev(label, "for", "year");
    			add_location(label, file, 427, 14, 11306);
    			add_location(textarea, file, 428, 14, 11352);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, textarea, anchor);
    			set_input_value(textarea, /*$year*/ ctx[9]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[39]),
    					listen_dev(textarea, "change", /*change_handler*/ ctx[40], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$year*/ 512) {
    				set_input_value(textarea, /*$year*/ ctx[9]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(textarea);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(425:12) {#if movies.length > 0 && getFirstVisibleIndex($scrollY) < movies.length && movies[getFirstVisibleIndex($scrollY)]}",
    		ctx
    	});

    	return block;
    }

    // (471:12) {#each Object.keys(genreEmojiDict) as genre, index}
    function create_each_block_8(ctx) {
    	let div1;
    	let div0;
    	let input;
    	let t0;
    	let label;
    	let t1_value = /*genreEmojiDict*/ ctx[28][/*genre*/ ctx[77]] + " " + /*genre*/ ctx[77] + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	function change_handler_1(...args) {
    		return /*change_handler_1*/ ctx[45](/*genre*/ ctx[77], ...args);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "id", /*genre*/ ctx[77]);
    			attr_dev(input, "name", /*genre*/ ctx[77]);
    			input.value = /*genre*/ ctx[77];
    			add_location(input, file, 473, 18, 13238);
    			set_style(div0, "padding-right", "10px");
    			add_location(div0, file, 472, 16, 13186);
    			set_style(label, "display", "inline");
    			attr_dev(label, "for", /*genre*/ ctx[77]);
    			add_location(label, file, 489, 16, 13827);
    			set_style(div1, "display", "flex");
    			add_location(div1, file, 471, 14, 13141);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, input);
    			append_dev(div1, t0);
    			append_dev(div1, label);
    			append_dev(label, t1);
    			append_dev(div1, t2);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", change_handler_1, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_8.name,
    		type: "each",
    		source: "(471:12) {#each Object.keys(genreEmojiDict) as genre, index}",
    		ctx
    	});

    	return block;
    }

    // (646:10) {:else}
    function create_else_block_2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Loading...";
    			add_location(p, file, 646, 12, 20645);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(646:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (500:10) {#if movies.length > 0}
    function create_if_block_2(ctx) {
    	let div5;
    	let div0;
    	let svg0;
    	let t0;
    	let div1;
    	let svg1;
    	let t1;
    	let div2;
    	let svg2;
    	let t2;
    	let div3;
    	let svg3;
    	let t3;
    	let div4;
    	let svg4;
    	let each_value_7 = /*getVisibleMovies*/ ctx[31](/*$queryCount*/ ctx[11], /*$scrollY*/ ctx[8], viewportHeight);
    	validate_each_argument(each_value_7);
    	let each_blocks_4 = [];

    	for (let i = 0; i < each_value_7.length; i += 1) {
    		each_blocks_4[i] = create_each_block_7(get_each_context_7(ctx, each_value_7, i));
    	}

    	let each_value_6 = /*getVisibleMovies*/ ctx[31](/*$queryCount*/ ctx[11], /*$scrollY*/ ctx[8], viewportHeight);
    	validate_each_argument(each_value_6);
    	let each_blocks_3 = [];

    	for (let i = 0; i < each_value_6.length; i += 1) {
    		each_blocks_3[i] = create_each_block_6(get_each_context_6(ctx, each_value_6, i));
    	}

    	let each_value_5 = /*getVisibleMovies*/ ctx[31](/*$queryCount*/ ctx[11], /*$scrollY*/ ctx[8], viewportHeight);
    	validate_each_argument(each_value_5);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_5.length; i += 1) {
    		each_blocks_2[i] = create_each_block_5(get_each_context_5(ctx, each_value_5, i));
    	}

    	let each_value_3 = /*getVisibleMovies*/ ctx[31](/*$queryCount*/ ctx[11], /*$scrollY*/ ctx[8], viewportHeight);
    	validate_each_argument(each_value_3);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_1[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	let each_value_2 = /*getVisibleMovies*/ ctx[31](/*$queryCount*/ ctx[11], /*$scrollY*/ ctx[8], viewportHeight);
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div0 = element("div");
    			svg0 = svg_element("svg");

    			for (let i = 0; i < each_blocks_4.length; i += 1) {
    				each_blocks_4[i].c();
    			}

    			t0 = space();
    			div1 = element("div");
    			svg1 = svg_element("svg");

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].c();
    			}

    			t1 = space();
    			div2 = element("div");
    			svg2 = svg_element("svg");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t2 = space();
    			div3 = element("div");
    			svg3 = svg_element("svg");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t3 = space();
    			div4 = element("div");
    			svg4 = svg_element("svg");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(svg0, "width", "100%");
    			attr_dev(svg0, "height", /*containerHeight*/ ctx[5]);
    			attr_dev(svg0, "class", "svelte-a7vkie");
    			add_location(svg0, file, 502, 16, 14244);
    			set_style(div0, "flex", "1");
    			add_location(div0, file, 501, 14, 14206);
    			attr_dev(svg1, "width", "100%");
    			attr_dev(svg1, "height", /*containerHeight*/ ctx[5]);
    			attr_dev(svg1, "class", "svelte-a7vkie");
    			add_location(svg1, file, 529, 16, 15343);
    			set_style(div1, "flex", "1");
    			add_location(div1, file, 528, 14, 15305);
    			attr_dev(svg2, "width", "100%");
    			attr_dev(svg2, "height", /*containerHeight*/ ctx[5]);
    			attr_dev(svg2, "class", "svelte-a7vkie");
    			add_location(svg2, file, 558, 16, 16595);
    			attr_dev(div2, "class", "movie-bar svelte-a7vkie");
    			add_location(div2, file, 557, 14, 16555);
    			attr_dev(svg3, "width", "100%");
    			attr_dev(svg3, "height", /*containerHeight*/ ctx[5]);
    			attr_dev(svg3, "class", "svelte-a7vkie");
    			add_location(svg3, file, 594, 16, 18218);
    			attr_dev(div3, "class", "genre-column svelte-a7vkie");
    			add_location(div3, file, 593, 14, 18175);
    			attr_dev(svg4, "width", "100%");
    			attr_dev(svg4, "height", /*containerHeight*/ ctx[5]);
    			attr_dev(svg4, "class", "svelte-a7vkie");
    			add_location(svg4, file, 622, 16, 19479);
    			attr_dev(div4, "class", "year-column svelte-a7vkie");
    			add_location(div4, file, 621, 14, 19437);
    			attr_dev(div5, "class", "movie-column svelte-a7vkie");
    			add_location(div5, file, 500, 12, 14141);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			append_dev(div0, svg0);

    			for (let i = 0; i < each_blocks_4.length; i += 1) {
    				if (each_blocks_4[i]) {
    					each_blocks_4[i].m(svg0, null);
    				}
    			}

    			append_dev(div5, t0);
    			append_dev(div5, div1);
    			append_dev(div1, svg1);

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				if (each_blocks_3[i]) {
    					each_blocks_3[i].m(svg1, null);
    				}
    			}

    			append_dev(div5, t1);
    			append_dev(div5, div2);
    			append_dev(div2, svg2);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				if (each_blocks_2[i]) {
    					each_blocks_2[i].m(svg2, null);
    				}
    			}

    			append_dev(div5, t2);
    			append_dev(div5, div3);
    			append_dev(div3, svg3);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				if (each_blocks_1[i]) {
    					each_blocks_1[i].m(svg3, null);
    				}
    			}

    			append_dev(div5, t3);
    			append_dev(div5, div4);
    			append_dev(div4, svg4);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(svg4, null);
    				}
    			}

    			/*div5_binding*/ ctx[51](div5);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$scrollY, handleBarClick, $queryCount*/ 1073744128 | dirty[1] & /*getVisibleMovies*/ 1) {
    				each_value_7 = /*getVisibleMovies*/ ctx[31](/*$queryCount*/ ctx[11], /*$scrollY*/ ctx[8], viewportHeight);
    				validate_each_argument(each_value_7);
    				let i;

    				for (i = 0; i < each_value_7.length; i += 1) {
    					const child_ctx = get_each_context_7(ctx, each_value_7, i);

    					if (each_blocks_4[i]) {
    						each_blocks_4[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_4[i] = create_each_block_7(child_ctx);
    						each_blocks_4[i].c();
    						each_blocks_4[i].m(svg0, null);
    					}
    				}

    				for (; i < each_blocks_4.length; i += 1) {
    					each_blocks_4[i].d(1);
    				}

    				each_blocks_4.length = each_value_7.length;
    			}

    			if (dirty[0] & /*containerHeight*/ 32) {
    				attr_dev(svg0, "height", /*containerHeight*/ ctx[5]);
    			}

    			if (dirty[0] & /*$scrollY, handleBarClick, $queryCount*/ 1073744128 | dirty[1] & /*getVisibleMovies*/ 1) {
    				each_value_6 = /*getVisibleMovies*/ ctx[31](/*$queryCount*/ ctx[11], /*$scrollY*/ ctx[8], viewportHeight);
    				validate_each_argument(each_value_6);
    				let i;

    				for (i = 0; i < each_value_6.length; i += 1) {
    					const child_ctx = get_each_context_6(ctx, each_value_6, i);

    					if (each_blocks_3[i]) {
    						each_blocks_3[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_3[i] = create_each_block_6(child_ctx);
    						each_blocks_3[i].c();
    						each_blocks_3[i].m(svg1, null);
    					}
    				}

    				for (; i < each_blocks_3.length; i += 1) {
    					each_blocks_3[i].d(1);
    				}

    				each_blocks_3.length = each_value_6.length;
    			}

    			if (dirty[0] & /*containerHeight*/ 32) {
    				attr_dev(svg1, "height", /*containerHeight*/ ctx[5]);
    			}

    			if (dirty[0] & /*$scrollY, handleBarClick, $queryCount, width*/ 1073744144 | dirty[1] & /*getVisibleMovies*/ 1) {
    				each_value_5 = /*getVisibleMovies*/ ctx[31](/*$queryCount*/ ctx[11], /*$scrollY*/ ctx[8], viewportHeight);
    				validate_each_argument(each_value_5);
    				let i;

    				for (i = 0; i < each_value_5.length; i += 1) {
    					const child_ctx = get_each_context_5(ctx, each_value_5, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_5(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(svg2, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_5.length;
    			}

    			if (dirty[0] & /*containerHeight*/ 32) {
    				attr_dev(svg2, "height", /*containerHeight*/ ctx[5]);
    			}

    			if (dirty[0] & /*$scrollY, handleBarClick, $queryCount, genreEmojiDict*/ 1342179584 | dirty[1] & /*getVisibleMovies*/ 1) {
    				each_value_3 = /*getVisibleMovies*/ ctx[31](/*$queryCount*/ ctx[11], /*$scrollY*/ ctx[8], viewportHeight);
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_3(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(svg3, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_3.length;
    			}

    			if (dirty[0] & /*containerHeight*/ 32) {
    				attr_dev(svg3, "height", /*containerHeight*/ ctx[5]);
    			}

    			if (dirty[0] & /*$scrollY, handleBarClick, $queryCount*/ 1073744128 | dirty[1] & /*getVisibleMovies*/ 1) {
    				each_value_2 = /*getVisibleMovies*/ ctx[31](/*$queryCount*/ ctx[11], /*$scrollY*/ ctx[8], viewportHeight);
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(svg4, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}

    			if (dirty[0] & /*containerHeight*/ 32) {
    				attr_dev(svg4, "height", /*containerHeight*/ ctx[5]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			destroy_each(each_blocks_4, detaching);
    			destroy_each(each_blocks_3, detaching);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			/*div5_binding*/ ctx[51](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(500:10) {#if movies.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (504:18) {#each getVisibleMovies($queryCount, $scrollY, viewportHeight) as movie, index}
    function create_each_block_7(ctx) {
    	let g;
    	let circle0;
    	let circle0_r_value;
    	let circle1;
    	let circle1_r_value;
    	let g_transform_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[46](/*movie*/ ctx[73]);
    	}

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			circle0 = svg_element("circle");
    			circle1 = svg_element("circle");
    			attr_dev(circle0, "cx", "0");
    			attr_dev(circle0, "cy", "50");
    			attr_dev(circle0, "r", circle0_r_value = Math.sqrt(/*movie*/ ctx[73].budget / 1000000) * 2);
    			attr_dev(circle0, "fill", "none");
    			attr_dev(circle0, "stroke", "red");
    			add_location(circle0, file, 510, 22, 14701);
    			attr_dev(circle1, "cx", "0");
    			attr_dev(circle1, "cy", "50");
    			attr_dev(circle1, "r", circle1_r_value = Math.sqrt(/*movie*/ ctx[73].revenue / 1000000) * 2);
    			attr_dev(circle1, "fill", "none");
    			attr_dev(circle1, "stroke", "green");
    			add_location(circle1, file, 517, 22, 14958);
    			attr_dev(g, "transform", g_transform_value = "translate(0, " + (/*index*/ ctx[75] * itemHeight - /*$scrollY*/ ctx[8] % itemHeight) + ")");
    			add_location(g, file, 504, 20, 14406);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			append_dev(g, circle0);
    			append_dev(g, circle1);

    			if (!mounted) {
    				dispose = listen_dev(g, "click", click_handler, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*$queryCount, $scrollY*/ 2304 && circle0_r_value !== (circle0_r_value = Math.sqrt(/*movie*/ ctx[73].budget / 1000000) * 2)) {
    				attr_dev(circle0, "r", circle0_r_value);
    			}

    			if (dirty[0] & /*$queryCount, $scrollY*/ 2304 && circle1_r_value !== (circle1_r_value = Math.sqrt(/*movie*/ ctx[73].revenue / 1000000) * 2)) {
    				attr_dev(circle1, "r", circle1_r_value);
    			}

    			if (dirty[0] & /*$scrollY*/ 256 && g_transform_value !== (g_transform_value = "translate(0, " + (/*index*/ ctx[75] * itemHeight - /*$scrollY*/ ctx[8] % itemHeight) + ")")) {
    				attr_dev(g, "transform", g_transform_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_7.name,
    		type: "each",
    		source: "(504:18) {#each getVisibleMovies($queryCount, $scrollY, viewportHeight) as movie, index}",
    		ctx
    	});

    	return block;
    }

    // (531:18) {#each getVisibleMovies($queryCount, $scrollY, viewportHeight) as movie, index}
    function create_each_block_6(ctx) {
    	let g;
    	let foreignObject;
    	let div1;
    	let div0;
    	let t;
    	let foreignObject_width_value;
    	let g_transform_value;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[47](/*movie*/ ctx[73]);
    	}

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			foreignObject = svg_element("foreignObject");
    			div1 = element("div");
    			div0 = document_1.createElementNS("http://www.w3.org/1999/xhtml", "div");
    			t = space();
    			set_style(div0, "background-color", getColorCountry(/*movie*/ ctx[73].originalLanguage));
    			attr_dev(div0, "xmlns", "http://www.w3.org/1999/xhtml");
    			attr_dev(div0, "class", "bar-div svelte-a7vkie");
    			add_location(div0, file, 544, 26, 16071);
    			set_style(div1, "display", "flex");
    			set_style(div1, "height", "100%");
    			add_location(div1, file, 543, 24, 16003);
    			attr_dev(foreignObject, "x", "0");
    			attr_dev(foreignObject, "y", "0");
    			attr_dev(foreignObject, "height", "100");
    			attr_dev(foreignObject, "width", foreignObject_width_value = 10 * /*movie*/ ctx[73].runtime / 60);
    			add_location(foreignObject, file, 537, 22, 15785);
    			attr_dev(g, "transform", g_transform_value = "translate(0, " + (/*index*/ ctx[75] * itemHeight - /*$scrollY*/ ctx[8] % itemHeight) + ")");
    			add_location(g, file, 531, 20, 15505);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			append_dev(g, foreignObject);
    			append_dev(foreignObject, div1);
    			append_dev(div1, div0);
    			append_dev(div1, t);

    			if (!mounted) {
    				dispose = listen_dev(g, "click", click_handler_1, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*$queryCount, $scrollY*/ 2304) {
    				set_style(div0, "background-color", getColorCountry(/*movie*/ ctx[73].originalLanguage));
    			}

    			if (dirty[0] & /*$queryCount, $scrollY*/ 2304 && foreignObject_width_value !== (foreignObject_width_value = 10 * /*movie*/ ctx[73].runtime / 60)) {
    				attr_dev(foreignObject, "width", foreignObject_width_value);
    			}

    			if (dirty[0] & /*$scrollY*/ 256 && g_transform_value !== (g_transform_value = "translate(0, " + (/*index*/ ctx[75] * itemHeight - /*$scrollY*/ ctx[8] % itemHeight) + ")")) {
    				attr_dev(g, "transform", g_transform_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_6.name,
    		type: "each",
    		source: "(531:18) {#each getVisibleMovies($queryCount, $scrollY, viewportHeight) as movie, index}",
    		ctx
    	});

    	return block;
    }

    // (579:28) {#if movie.originalLanguage !== "en"}
    function create_if_block_5(ctx) {
    	let p;
    	let span;
    	let t0_value = /*movie*/ ctx[73].originalLanguage + "";
    	let t0;
    	let t1_value = /*movie*/ ctx[73].originalTitle + "";
    	let t1;

    	const block = {
    		c: function create() {
    			p = document_1.createElementNS("http://www.w3.org/1999/xhtml", "p");
    			span = document_1.createElementNS("http://www.w3.org/1999/xhtml", "span");
    			t0 = text(t0_value);
    			t1 = text(t1_value);
    			set_style(span, "font-weight", "bold");
    			set_style(span, "font-size", "25px");
    			set_style(span, "padding-right", "10px");
    			add_location(span, file, 580, 32, 17669);
    			add_location(p, file, 579, 30, 17633);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, span);
    			append_dev(span, t0);
    			append_dev(p, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$queryCount, $scrollY*/ 2304 && t0_value !== (t0_value = /*movie*/ ctx[73].originalLanguage + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*$queryCount, $scrollY*/ 2304 && t1_value !== (t1_value = /*movie*/ ctx[73].originalTitle + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(579:28) {#if movie.originalLanguage !== \\\"en\\\"}",
    		ctx
    	});

    	return block;
    }

    // (560:18) {#each getVisibleMovies($queryCount, $scrollY, viewportHeight) as movie, index}
    function create_each_block_5(ctx) {
    	let g;
    	let foreignObject;
    	let div1;
    	let div0;
    	let p;
    	let t0_value = /*movie*/ ctx[73].title + "";
    	let t0;
    	let t1;
    	let foreignObject_width_value;
    	let g_transform_value;
    	let mounted;
    	let dispose;
    	let if_block = /*movie*/ ctx[73].originalLanguage !== "en" && create_if_block_5(ctx);

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[48](/*movie*/ ctx[73]);
    	}

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			foreignObject = svg_element("foreignObject");
    			div1 = element("div");
    			div0 = document_1.createElementNS("http://www.w3.org/1999/xhtml", "div");
    			p = document_1.createElementNS("http://www.w3.org/1999/xhtml", "p");
    			t0 = text(t0_value);
    			if (if_block) if_block.c();
    			t1 = space();
    			add_location(p, file, 577, 28, 17516);
    			set_style(div0, "background-color", /*movie*/ ctx[73].color);
    			attr_dev(div0, "xmlns", "http://www.w3.org/1999/xhtml");
    			attr_dev(div0, "class", "bar-div svelte-a7vkie");
    			add_location(div0, file, 572, 26, 17277);
    			set_style(div1, "display", "flex");
    			set_style(div1, "height", "100%");
    			add_location(div1, file, 571, 24, 17209);
    			attr_dev(foreignObject, "x", "0");
    			attr_dev(foreignObject, "y", "0");
    			attr_dev(foreignObject, "height", "100");
    			attr_dev(foreignObject, "width", foreignObject_width_value = /*width*/ ctx[4] * (/*movie*/ ctx[73].voteAverage / 10));
    			add_location(foreignObject, file, 565, 22, 16984);
    			attr_dev(g, "transform", g_transform_value = "translate(0, " + (/*index*/ ctx[75] * itemHeight - /*$scrollY*/ ctx[8] % itemHeight) + ")");
    			add_location(g, file, 560, 20, 16757);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			append_dev(g, foreignObject);
    			append_dev(foreignObject, div1);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			append_dev(p, t0);
    			if (if_block) if_block.m(div0, null);
    			append_dev(div1, t1);

    			if (!mounted) {
    				dispose = listen_dev(g, "click", click_handler_2, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*$queryCount, $scrollY*/ 2304 && t0_value !== (t0_value = /*movie*/ ctx[73].title + "")) set_data_dev(t0, t0_value);

    			if (/*movie*/ ctx[73].originalLanguage !== "en") {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_5(ctx);
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty[0] & /*$queryCount, $scrollY*/ 2304) {
    				set_style(div0, "background-color", /*movie*/ ctx[73].color);
    			}

    			if (dirty[0] & /*width, $queryCount, $scrollY*/ 2320 && foreignObject_width_value !== (foreignObject_width_value = /*width*/ ctx[4] * (/*movie*/ ctx[73].voteAverage / 10))) {
    				attr_dev(foreignObject, "width", foreignObject_width_value);
    			}

    			if (dirty[0] & /*$scrollY*/ 256 && g_transform_value !== (g_transform_value = "translate(0, " + (/*index*/ ctx[75] * itemHeight - /*$scrollY*/ ctx[8] % itemHeight) + ")")) {
    				attr_dev(g, "transform", g_transform_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_5.name,
    		type: "each",
    		source: "(560:18) {#each getVisibleMovies($queryCount, $scrollY, viewportHeight) as movie, index}",
    		ctx
    	});

    	return block;
    }

    // (607:24) {:else}
    function create_else_block_1(ctx) {
    	let text_1;
    	let t_value = /*genreEmojiDict*/ ctx[28][/*genre*/ ctx[77]] + "";
    	let t;

    	const block = {
    		c: function create() {
    			text_1 = svg_element("text");
    			t = text(t_value);
    			attr_dev(text_1, "x", 16 * (/*index*/ ctx[75] + 1));
    			attr_dev(text_1, "y", 50);
    			attr_dev(text_1, "font-size", "13");
    			attr_dev(text_1, "fill", "gray");
    			attr_dev(text_1, "opacity", "0.2");
    			add_location(text_1, file, 608, 26, 18995);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, text_1, anchor);
    			append_dev(text_1, t);
    		},
    		p: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(text_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(607:24) {:else}",
    		ctx
    	});

    	return block;
    }

    // (603:24) {#if movie.genres.includes(genre)}
    function create_if_block_4(ctx) {
    	let text_1;
    	let t_value = /*genreEmojiDict*/ ctx[28][/*genre*/ ctx[77]] + "";
    	let t;

    	const block = {
    		c: function create() {
    			text_1 = svg_element("text");
    			t = text(t_value);
    			attr_dev(text_1, "x", 16 * (/*index*/ ctx[75] + 1));
    			attr_dev(text_1, "y", 50);
    			attr_dev(text_1, "font-size", "13");
    			add_location(text_1, file, 603, 26, 18744);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, text_1, anchor);
    			append_dev(text_1, t);
    		},
    		p: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(text_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(603:24) {#if movie.genres.includes(genre)}",
    		ctx
    	});

    	return block;
    }

    // (602:22) {#each Object.keys(genreEmojiDict) as genre, index}
    function create_each_block_4(ctx) {
    	let show_if;
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (dirty[0] & /*$queryCount, $scrollY*/ 2304) show_if = null;
    		if (show_if == null) show_if = !!/*movie*/ ctx[73].genres.includes(/*genre*/ ctx[77]);
    		if (show_if) return create_if_block_4;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type_1(ctx, [-1, -1, -1]);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx, dirty)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(602:22) {#each Object.keys(genreEmojiDict) as genre, index}",
    		ctx
    	});

    	return block;
    }

    // (596:18) {#each getVisibleMovies($queryCount, $scrollY, viewportHeight) as movie, index}
    function create_each_block_3(ctx) {
    	let g;
    	let g_transform_value;
    	let mounted;
    	let dispose;
    	let each_value_4 = Object.keys(/*genreEmojiDict*/ ctx[28]);
    	validate_each_argument(each_value_4);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
    	}

    	function click_handler_3() {
    		return /*click_handler_3*/ ctx[49](/*movie*/ ctx[73]);
    	}

    	const block = {
    		c: function create() {
    			g = svg_element("g");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(g, "transform", g_transform_value = "translate(0, " + (/*index*/ ctx[75] * itemHeight - /*$scrollY*/ ctx[8] % itemHeight) + ")");
    			add_location(g, file, 596, 20, 18380);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(g, null);
    				}
    			}

    			if (!mounted) {
    				dispose = listen_dev(g, "click", click_handler_3, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*genreEmojiDict, $queryCount, $scrollY*/ 268437760 | dirty[1] & /*getVisibleMovies*/ 1) {
    				each_value_4 = Object.keys(/*genreEmojiDict*/ ctx[28]);
    				validate_each_argument(each_value_4);
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4(ctx, each_value_4, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(g, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_4.length;
    			}

    			if (dirty[0] & /*$scrollY*/ 256 && g_transform_value !== (g_transform_value = "translate(0, " + (/*index*/ ctx[75] * itemHeight - /*$scrollY*/ ctx[8] % itemHeight) + ")")) {
    				attr_dev(g, "transform", g_transform_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(596:18) {#each getVisibleMovies($queryCount, $scrollY, viewportHeight) as movie, index}",
    		ctx
    	});

    	return block;
    }

    // (636:22) {:else}
    function create_else_block(ctx) {
    	let text_1;
    	let t_value = /*movie*/ ctx[73].getFormattedMonthYear() + "";
    	let t;

    	const block = {
    		c: function create() {
    			text_1 = svg_element("text");
    			t = text(t_value);
    			attr_dev(text_1, "x", "10");
    			attr_dev(text_1, "y", "50");
    			attr_dev(text_1, "font-size", "10");
    			add_location(text_1, file, 636, 24, 20347);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, text_1, anchor);
    			append_dev(text_1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$queryCount, $scrollY*/ 2304 && t_value !== (t_value = /*movie*/ ctx[73].getFormattedMonthYear() + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(text_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(636:22) {:else}",
    		ctx
    	});

    	return block;
    }

    // (632:22) {#if getVisibleMovies($queryCount, $scrollY, viewportHeight)[index - 1] && getVisibleMovies($queryCount, $scrollY, viewportHeight)[index - 1].getReleaseYear() !== movie.getReleaseYear()}
    function create_if_block_3(ctx) {
    	let text_1;
    	let t_value = /*movie*/ ctx[73].getFormattedMonthYear() + "";
    	let t;

    	const block = {
    		c: function create() {
    			text_1 = svg_element("text");
    			t = text(t_value);
    			attr_dev(text_1, "x", "10");
    			attr_dev(text_1, "y", "50");
    			attr_dev(text_1, "font-size", "18");
    			attr_dev(text_1, "font-style", "bold");
    			add_location(text_1, file, 632, 24, 20149);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, text_1, anchor);
    			append_dev(text_1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$queryCount, $scrollY*/ 2304 && t_value !== (t_value = /*movie*/ ctx[73].getFormattedMonthYear() + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(text_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(632:22) {#if getVisibleMovies($queryCount, $scrollY, viewportHeight)[index - 1] && getVisibleMovies($queryCount, $scrollY, viewportHeight)[index - 1].getReleaseYear() !== movie.getReleaseYear()}",
    		ctx
    	});

    	return block;
    }

    // (624:18) {#each getVisibleMovies($queryCount, $scrollY, viewportHeight) as movie, index}
    function create_each_block_2(ctx) {
    	let g;
    	let show_if;
    	let g_transform_value;
    	let mounted;
    	let dispose;

    	function select_block_type_2(ctx, dirty) {
    		if (dirty[0] & /*$queryCount, $scrollY*/ 2304) show_if = null;
    		if (show_if == null) show_if = !!(/*getVisibleMovies*/ ctx[31](/*$queryCount*/ ctx[11], /*$scrollY*/ ctx[8], viewportHeight)[/*index*/ ctx[75] - 1] && /*getVisibleMovies*/ ctx[31](/*$queryCount*/ ctx[11], /*$scrollY*/ ctx[8], viewportHeight)[/*index*/ ctx[75] - 1].getReleaseYear() !== /*movie*/ ctx[73].getReleaseYear());
    		if (show_if) return create_if_block_3;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_2(ctx, [-1, -1, -1]);
    	let if_block = current_block_type(ctx);

    	function click_handler_4() {
    		return /*click_handler_4*/ ctx[50](/*movie*/ ctx[73]);
    	}

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			if_block.c();
    			attr_dev(g, "transform", g_transform_value = "translate(0, " + (/*index*/ ctx[75] * itemHeight - /*$scrollY*/ ctx[8] % itemHeight) + ")");
    			add_location(g, file, 624, 20, 19641);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			if_block.m(g, null);

    			if (!mounted) {
    				dispose = listen_dev(g, "click", click_handler_4, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (current_block_type === (current_block_type = select_block_type_2(ctx, dirty)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(g, null);
    				}
    			}

    			if (dirty[0] & /*$scrollY*/ 256 && g_transform_value !== (g_transform_value = "translate(0, " + (/*index*/ ctx[75] * itemHeight - /*$scrollY*/ ctx[8] % itemHeight) + ")")) {
    				attr_dev(g, "transform", g_transform_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(624:18) {#each getVisibleMovies($queryCount, $scrollY, viewportHeight) as movie, index}",
    		ctx
    	});

    	return block;
    }

    // (651:10) {#if $selectedMovie}
    function create_if_block(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let h2;
    	let t1_value = /*$selectedMovie*/ ctx[0].title + "";
    	let t1;
    	let t2;
    	let t3;
    	let p0;
    	let strong0;
    	let t5;
    	let t6_value = /*$selectedMovie*/ ctx[0].overview + "";
    	let t6;
    	let t7;
    	let p1;
    	let strong1;
    	let t9;
    	let t10_value = /*$selectedMovie*/ ctx[0].genres.join(", ") + "";
    	let t10;
    	let t11;
    	let p2;
    	let strong2;
    	let t13;
    	let t14_value = /*$selectedMovie*/ ctx[0].keywords.join(", ") + "";
    	let t14;
    	let t15;
    	let p3;
    	let strong3;
    	let t17;
    	let t18_value = /*$selectedMovie*/ ctx[0].getFormattedReleaseDate() + "";
    	let t18;
    	let t19;
    	let p4;
    	let strong4;
    	let t21_value = ` ${/*$selectedMovie*/ ctx[0].voteAverage} (${/*$selectedMovie*/ ctx[0].voteCount})` + "";
    	let t21;
    	let t22;
    	let p5;
    	let strong5;
    	let t24_value = ` ${/*$selectedMovie*/ ctx[0].popularity}` + "";
    	let t24;
    	let t25;
    	let p6;
    	let strong6;
    	let t27_value = ` ${generateHourString(/*$selectedMovie*/ ctx[0].runtime)}` + "";
    	let t27;
    	let t28;
    	let p7;
    	let strong7;
    	let t30;
    	let t31;
    	let p8;
    	let strong8;
    	let t33;
    	let mounted;
    	let dispose;
    	let if_block = /*$selectedMovie*/ ctx[0].originalLanguage !== "en" && create_if_block_1(ctx);
    	let each_value_1 = /*$selectedMovie*/ ctx[0].topNcast;
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*$selectedMovie*/ ctx[0].topNcrew;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t0 = space();
    			h2 = element("h2");
    			t1 = text(t1_value);
    			t2 = space();
    			if (if_block) if_block.c();
    			t3 = space();
    			p0 = element("p");
    			strong0 = element("strong");
    			strong0.textContent = "Description:";
    			t5 = space();
    			t6 = text(t6_value);
    			t7 = space();
    			p1 = element("p");
    			strong1 = element("strong");
    			strong1.textContent = "Genre:";
    			t9 = space();
    			t10 = text(t10_value);
    			t11 = space();
    			p2 = element("p");
    			strong2 = element("strong");
    			strong2.textContent = "Keywords:";
    			t13 = space();
    			t14 = text(t14_value);
    			t15 = space();
    			p3 = element("p");
    			strong3 = element("strong");
    			strong3.textContent = "Release Date:";
    			t17 = space();
    			t18 = text(t18_value);
    			t19 = space();
    			p4 = element("p");
    			strong4 = element("strong");
    			strong4.textContent = "Rating:";
    			t21 = text(t21_value);
    			t22 = space();
    			p5 = element("p");
    			strong5 = element("strong");
    			strong5.textContent = "Popularity:";
    			t24 = text(t24_value);
    			t25 = space();
    			p6 = element("p");
    			strong6 = element("strong");
    			strong6.textContent = "Runtime:";
    			t27 = text(t27_value);
    			t28 = space();
    			p7 = element("p");
    			strong7 = element("strong");
    			strong7.textContent = "Cast:";
    			t30 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t31 = space();
    			p8 = element("p");
    			strong8 = element("strong");
    			strong8.textContent = "Crew:";
    			t33 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (!src_url_equal(img.src, img_src_value = /*$selectedMovie*/ ctx[0].getPosterUrl())) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*$selectedMovie*/ ctx[0].title);
    			attr_dev(img, "class", "svelte-a7vkie");
    			add_location(img, file, 652, 14, 20793);
    			attr_dev(h2, "class", "link svelte-a7vkie");
    			add_location(h2, file, 656, 14, 20924);
    			add_location(strong0, file, 678, 17, 21664);
    			add_location(p0, file, 678, 14, 21661);
    			add_location(strong1, file, 679, 17, 21741);
    			add_location(p1, file, 679, 14, 21738);
    			add_location(strong2, file, 681, 16, 21838);
    			add_location(p2, file, 680, 14, 21818);
    			add_location(strong3, file, 685, 16, 21971);
    			add_location(p3, file, 684, 14, 21951);
    			add_location(strong4, file, 689, 16, 22114);
    			add_location(p4, file, 688, 14, 22094);
    			add_location(strong5, file, 693, 16, 22273);
    			add_location(p5, file, 692, 14, 22253);
    			add_location(strong6, file, 696, 16, 22388);
    			add_location(p6, file, 695, 14, 22368);
    			add_location(strong7, file, 700, 16, 22534);
    			add_location(p7, file, 699, 14, 22514);
    			add_location(strong8, file, 708, 16, 22836);
    			add_location(p8, file, 707, 14, 22816);
    			add_location(div, file, 651, 12, 20773);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t0);
    			append_dev(div, h2);
    			append_dev(h2, t1);
    			append_dev(div, t2);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t3);
    			append_dev(div, p0);
    			append_dev(p0, strong0);
    			append_dev(p0, t5);
    			append_dev(p0, t6);
    			append_dev(div, t7);
    			append_dev(div, p1);
    			append_dev(p1, strong1);
    			append_dev(p1, t9);
    			append_dev(p1, t10);
    			append_dev(div, t11);
    			append_dev(div, p2);
    			append_dev(p2, strong2);
    			append_dev(p2, t13);
    			append_dev(p2, t14);
    			append_dev(div, t15);
    			append_dev(div, p3);
    			append_dev(p3, strong3);
    			append_dev(p3, t17);
    			append_dev(p3, t18);
    			append_dev(div, t19);
    			append_dev(div, p4);
    			append_dev(p4, strong4);
    			append_dev(p4, t21);
    			append_dev(div, t22);
    			append_dev(div, p5);
    			append_dev(p5, strong5);
    			append_dev(p5, t24);
    			append_dev(div, t25);
    			append_dev(div, p6);
    			append_dev(p6, strong6);
    			append_dev(p6, t27);
    			append_dev(div, t28);
    			append_dev(div, p7);
    			append_dev(p7, strong7);
    			append_dev(p7, t30);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				if (each_blocks_1[i]) {
    					each_blocks_1[i].m(p7, null);
    				}
    			}

    			append_dev(div, t31);
    			append_dev(div, p8);
    			append_dev(p8, strong8);
    			append_dev(p8, t33);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(p8, null);
    				}
    			}

    			if (!mounted) {
    				dispose = listen_dev(h2, "click", /*click_handler_5*/ ctx[52], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$selectedMovie*/ 1 && !src_url_equal(img.src, img_src_value = /*$selectedMovie*/ ctx[0].getPosterUrl())) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty[0] & /*$selectedMovie*/ 1 && img_alt_value !== (img_alt_value = /*$selectedMovie*/ ctx[0].title)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty[0] & /*$selectedMovie*/ 1 && t1_value !== (t1_value = /*$selectedMovie*/ ctx[0].title + "")) set_data_dev(t1, t1_value);

    			if (/*$selectedMovie*/ ctx[0].originalLanguage !== "en") {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(div, t3);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty[0] & /*$selectedMovie*/ 1 && t6_value !== (t6_value = /*$selectedMovie*/ ctx[0].overview + "")) set_data_dev(t6, t6_value);
    			if (dirty[0] & /*$selectedMovie*/ 1 && t10_value !== (t10_value = /*$selectedMovie*/ ctx[0].genres.join(", ") + "")) set_data_dev(t10, t10_value);
    			if (dirty[0] & /*$selectedMovie*/ 1 && t14_value !== (t14_value = /*$selectedMovie*/ ctx[0].keywords.join(", ") + "")) set_data_dev(t14, t14_value);
    			if (dirty[0] & /*$selectedMovie*/ 1 && t18_value !== (t18_value = /*$selectedMovie*/ ctx[0].getFormattedReleaseDate() + "")) set_data_dev(t18, t18_value);
    			if (dirty[0] & /*$selectedMovie*/ 1 && t21_value !== (t21_value = ` ${/*$selectedMovie*/ ctx[0].voteAverage} (${/*$selectedMovie*/ ctx[0].voteCount})` + "")) set_data_dev(t21, t21_value);
    			if (dirty[0] & /*$selectedMovie*/ 1 && t24_value !== (t24_value = ` ${/*$selectedMovie*/ ctx[0].popularity}` + "")) set_data_dev(t24, t24_value);
    			if (dirty[0] & /*$selectedMovie*/ 1 && t27_value !== (t27_value = ` ${generateHourString(/*$selectedMovie*/ ctx[0].runtime)}` + "")) set_data_dev(t27, t27_value);

    			if (dirty[0] & /*setCast, $selectedMovie*/ 134217729) {
    				each_value_1 = /*$selectedMovie*/ ctx[0].topNcast;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(p7, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty[0] & /*setCrew, $selectedMovie*/ 67108865) {
    				each_value = /*$selectedMovie*/ ctx[0].topNcrew;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(p8, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(651:10) {#if $selectedMovie}",
    		ctx
    	});

    	return block;
    }

    // (667:14) {#if $selectedMovie.originalLanguage !== "en"}
    function create_if_block_1(ctx) {
    	let h4;
    	let t_value = /*$selectedMovie*/ ctx[0].originalTitle + "";
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			t = text(t_value);
    			attr_dev(h4, "class", "link svelte-a7vkie");
    			add_location(h4, file, 667, 16, 21297);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h4, anchor);
    			append_dev(h4, t);

    			if (!mounted) {
    				dispose = listen_dev(h4, "click", /*click_handler_6*/ ctx[53], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$selectedMovie*/ 1 && t_value !== (t_value = /*$selectedMovie*/ ctx[0].originalTitle + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h4);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(667:14) {#if $selectedMovie.originalLanguage !== \\\"en\\\"}",
    		ctx
    	});

    	return block;
    }

    // (702:16) {#each $selectedMovie.topNcast as cast}
    function create_each_block_1(ctx) {
    	let p;
    	let t0_value = /*cast*/ ctx[70].name + "";
    	let t0;
    	let t1;
    	let t2_value = /*cast*/ ctx[70].character + "";
    	let t2;
    	let t3;
    	let mounted;
    	let dispose;

    	function click_handler_7() {
    		return /*click_handler_7*/ ctx[54](/*cast*/ ctx[70]);
    	}

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = text(" as ");
    			t2 = text(t2_value);
    			t3 = space();
    			attr_dev(p, "class", "blue-text svelte-a7vkie");
    			add_location(p, file, 702, 18, 22631);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(p, t3);

    			if (!mounted) {
    				dispose = listen_dev(p, "click", click_handler_7, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*$selectedMovie*/ 1 && t0_value !== (t0_value = /*cast*/ ctx[70].name + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*$selectedMovie*/ 1 && t2_value !== (t2_value = /*cast*/ ctx[70].character + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(702:16) {#each $selectedMovie.topNcast as cast}",
    		ctx
    	});

    	return block;
    }

    // (710:16) {#each $selectedMovie.topNcrew as crew}
    function create_each_block(ctx) {
    	let p;
    	let t0_value = /*crew*/ ctx[67].name + "";
    	let t0;
    	let t1;
    	let t2_value = /*crew*/ ctx[67].job + "";
    	let t2;
    	let t3;
    	let mounted;
    	let dispose;

    	function click_handler_8() {
    		return /*click_handler_8*/ ctx[55](/*crew*/ ctx[67]);
    	}

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = text(": ");
    			t2 = text(t2_value);
    			t3 = space();
    			attr_dev(p, "class", "blue-text svelte-a7vkie");
    			add_location(p, file, 710, 18, 22933);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(p, t3);

    			if (!mounted) {
    				dispose = listen_dev(p, "click", click_handler_8, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*$selectedMovie*/ 1 && t0_value !== (t0_value = /*crew*/ ctx[67].name + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*$selectedMovie*/ 1 && t2_value !== (t2_value = /*crew*/ ctx[67].job + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(710:16) {#each $selectedMovie.topNcrew as crew}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div14;
    	let div13;
    	let div9;
    	let div6;
    	let div0;
    	let show_if = /*movies*/ ctx[7].length > 0 && /*getFirstVisibleIndex*/ ctx[32](/*$scrollY*/ ctx[8]) < /*movies*/ ctx[7].length && /*movies*/ ctx[7][/*getFirstVisibleIndex*/ ctx[32](/*$scrollY*/ ctx[8])];
    	let t0;
    	let div3;
    	let div1;
    	let label0;
    	let t2;
    	let textarea0;
    	let t3;
    	let div2;
    	let label1;
    	let t5;
    	let textarea1;
    	let t6;
    	let div4;
    	let label2;
    	let t8;
    	let textarea2;
    	let t9;
    	let div5;
    	let label3;
    	let t11;
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let option3;
    	let option4;
    	let option5;
    	let option6;
    	let t19;
    	let div8;
    	let label4;
    	let t21;
    	let div7;
    	let t22;
    	let div12;
    	let div10;
    	let t23;
    	let div11;
    	let mounted;
    	let dispose;
    	let if_block0 = show_if && create_if_block_6(ctx);
    	let each_value_8 = Object.keys(/*genreEmojiDict*/ ctx[28]);
    	validate_each_argument(each_value_8);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_8.length; i += 1) {
    		each_blocks[i] = create_each_block_8(get_each_context_8(ctx, each_value_8, i));
    	}

    	function select_block_type(ctx, dirty) {
    		if (/*movies*/ ctx[7].length > 0) return create_if_block_2;
    		return create_else_block_2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block1 = current_block_type(ctx);
    	let if_block2 = /*$selectedMovie*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div14 = element("div");
    			div13 = element("div");
    			div9 = element("div");
    			div6 = element("div");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div3 = element("div");
    			div1 = element("div");
    			label0 = element("label");
    			label0.textContent = "Min number of reviews:";
    			t2 = space();
    			textarea0 = element("textarea");
    			t3 = space();
    			div2 = element("div");
    			label1 = element("label");
    			label1.textContent = "Max number of reviews:";
    			t5 = space();
    			textarea1 = element("textarea");
    			t6 = space();
    			div4 = element("div");
    			label2 = element("label");
    			label2.textContent = "Person:";
    			t8 = space();
    			textarea2 = element("textarea");
    			t9 = space();
    			div5 = element("div");
    			label3 = element("label");
    			label3.textContent = "Language:";
    			t11 = space();
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "English";
    			option1 = element("option");
    			option1.textContent = "French";
    			option2 = element("option");
    			option2.textContent = "Spanish";
    			option3 = element("option");
    			option3.textContent = "German";
    			option4 = element("option");
    			option4.textContent = "Japanese";
    			option5 = element("option");
    			option5.textContent = "Italian";
    			option6 = element("option");
    			option6.textContent = "All";
    			t19 = space();
    			div8 = element("div");
    			label4 = element("label");
    			label4.textContent = "Genre:";
    			t21 = space();
    			div7 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t22 = space();
    			div12 = element("div");
    			div10 = element("div");
    			if_block1.c();
    			t23 = space();
    			div11 = element("div");
    			if (if_block2) if_block2.c();
    			attr_dev(div0, "class", "year-input svelte-a7vkie");
    			add_location(div0, file, 422, 10, 10977);
    			attr_dev(label0, "for", "minReviewCount");
    			add_location(label0, file, 439, 14, 11696);
    			add_location(textarea0, file, 440, 14, 11769);
    			attr_dev(div1, "class", "minReviewCount-input");
    			add_location(div1, file, 438, 12, 11647);
    			attr_dev(label1, "for", "maxReviewCount");
    			add_location(label1, file, 443, 14, 11900);
    			add_location(textarea1, file, 444, 14, 11973);
    			attr_dev(div2, "class", "maxReviewCount-input");
    			add_location(div2, file, 442, 12, 11851);
    			attr_dev(div3, "class", "min-max svelte-a7vkie");
    			add_location(div3, file, 437, 10, 11613);
    			attr_dev(label2, "for", "Person");
    			add_location(label2, file, 448, 12, 12088);
    			add_location(textarea2, file, 449, 12, 12136);
    			add_location(div4, file, 447, 10, 12070);
    			attr_dev(label3, "for", "language");
    			add_location(label3, file, 453, 12, 12410);
    			option0.__value = "en";
    			option0.value = option0.__value;
    			add_location(option0, file, 455, 14, 12516);
    			option1.__value = "fr";
    			option1.value = option1.__value;
    			add_location(option1, file, 456, 14, 12566);
    			option2.__value = "es";
    			option2.value = option2.__value;
    			add_location(option2, file, 457, 14, 12615);
    			option3.__value = "de";
    			option3.value = option3.__value;
    			add_location(option3, file, 458, 14, 12665);
    			option4.__value = "ja";
    			option4.value = option4.__value;
    			add_location(option4, file, 459, 14, 12714);
    			option5.__value = "it";
    			option5.value = option5.__value;
    			add_location(option5, file, 460, 14, 12765);
    			option6.__value = "all";
    			option6.value = option6.__value;
    			add_location(option6, file, 461, 14, 12815);
    			if (/*$selectedLanguage*/ ctx[3] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[44].call(select));
    			add_location(select, file, 454, 12, 12462);
    			attr_dev(div5, "class", "language-input svelte-a7vkie");
    			add_location(div5, file, 451, 10, 12218);
    			attr_dev(div6, "class", "form svelte-a7vkie");
    			add_location(div6, file, 421, 8, 10948);
    			attr_dev(label4, "for", "genre");
    			add_location(label4, file, 468, 10, 12989);
    			attr_dev(div7, "class", "genre-selection svelte-a7vkie");
    			add_location(div7, file, 469, 10, 13033);
    			attr_dev(div8, "class", "genre-menu svelte-a7vkie");
    			add_location(div8, file, 466, 8, 12911);
    			attr_dev(div9, "class", "header svelte-a7vkie");
    			add_location(div9, file, 417, 6, 10833);
    			attr_dev(div10, "class", "movie-list svelte-a7vkie");
    			add_location(div10, file, 498, 8, 14070);
    			attr_dev(div11, "class", "movie-details svelte-a7vkie");
    			add_location(div11, file, 649, 8, 20702);
    			attr_dev(div12, "class", "body svelte-a7vkie");
    			add_location(div12, file, 497, 6, 14043);
    			attr_dev(div13, "class", "header-body svelte-a7vkie");
    			add_location(div13, file, 416, 4, 10801);
    			attr_dev(div14, "class", "parent-div svelte-a7vkie");
    			add_location(div14, file, 415, 2, 10772);
    			add_location(main, file, 414, 0, 10763);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div14);
    			append_dev(div14, div13);
    			append_dev(div13, div9);
    			append_dev(div9, div6);
    			append_dev(div6, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div6, t0);
    			append_dev(div6, div3);
    			append_dev(div3, div1);
    			append_dev(div1, label0);
    			append_dev(div1, t2);
    			append_dev(div1, textarea0);
    			set_input_value(textarea0, /*$minReviewCount*/ ctx[2]);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div2, label1);
    			append_dev(div2, t5);
    			append_dev(div2, textarea1);
    			set_input_value(textarea1, /*$maxReviewCount*/ ctx[1]);
    			append_dev(div6, t6);
    			append_dev(div6, div4);
    			append_dev(div4, label2);
    			append_dev(div4, t8);
    			append_dev(div4, textarea2);
    			set_input_value(textarea2, /*$selectedPersonName*/ ctx[10]);
    			append_dev(div6, t9);
    			append_dev(div6, div5);
    			append_dev(div5, label3);
    			append_dev(div5, t11);
    			append_dev(div5, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			append_dev(select, option3);
    			append_dev(select, option4);
    			append_dev(select, option5);
    			append_dev(select, option6);
    			select_option(select, /*$selectedLanguage*/ ctx[3], true);
    			append_dev(div9, t19);
    			append_dev(div9, div8);
    			append_dev(div8, label4);
    			append_dev(div8, t21);
    			append_dev(div8, div7);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div7, null);
    				}
    			}

    			append_dev(div13, t22);
    			append_dev(div13, div12);
    			append_dev(div12, div10);
    			if_block1.m(div10, null);
    			append_dev(div12, t23);
    			append_dev(div12, div11);
    			if (if_block2) if_block2.m(div11, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(textarea0, "input", /*textarea0_input_handler*/ ctx[41]),
    					listen_dev(textarea1, "input", /*textarea1_input_handler*/ ctx[42]),
    					listen_dev(textarea2, "input", /*textarea2_input_handler*/ ctx[43]),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[44])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*movies, $scrollY*/ 384) show_if = /*movies*/ ctx[7].length > 0 && /*getFirstVisibleIndex*/ ctx[32](/*$scrollY*/ ctx[8]) < /*movies*/ ctx[7].length && /*movies*/ ctx[7][/*getFirstVisibleIndex*/ ctx[32](/*$scrollY*/ ctx[8])];

    			if (show_if) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_6(ctx);
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty[0] & /*$minReviewCount*/ 4) {
    				set_input_value(textarea0, /*$minReviewCount*/ ctx[2]);
    			}

    			if (dirty[0] & /*$maxReviewCount*/ 2) {
    				set_input_value(textarea1, /*$maxReviewCount*/ ctx[1]);
    			}

    			if (dirty[0] & /*$selectedPersonName*/ 1024) {
    				set_input_value(textarea2, /*$selectedPersonName*/ ctx[10]);
    			}

    			if (dirty[0] & /*$selectedLanguage*/ 8) {
    				select_option(select, /*$selectedLanguage*/ ctx[3]);
    			}

    			if (dirty[0] & /*genreEmojiDict, selectedGenres*/ 268451840) {
    				each_value_8 = Object.keys(/*genreEmojiDict*/ ctx[28]);
    				validate_each_argument(each_value_8);
    				let i;

    				for (i = 0; i < each_value_8.length; i += 1) {
    					const child_ctx = get_each_context_8(ctx, each_value_8, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_8(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div7, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_8.length;
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div10, null);
    				}
    			}

    			if (/*$selectedMovie*/ ctx[0]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block(ctx);
    					if_block2.c();
    					if_block2.m(div11, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			destroy_each(each_blocks, detaching);
    			if_block1.d();
    			if (if_block2) if_block2.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const itemHeight = 100; // Height of each movie item
    const viewportHeight = 1000; // Adjust based on your viewport

    function openYoutubeSearchUrl(title, year) {
    	console.log("opening_window");
    	window.open(`https://www.youtube.com/results?search_query=${title} (${year}) trailer`);
    }

    function generateHourString(time) {
    	let hours = Math.floor(time / 60);
    	let minutes = time % 60;
    	return `${hours}:${minutes}`;
    }

    function getColorCountry(language) {
    	if (language === "en") {
    		return "blue";
    	} else if (language === "fr") {
    		return "red";
    	} else if (language === "es") {
    		return "yellow";
    	} else if (language === "de") {
    		return "green";
    	} else if (language === "ja") {
    		return "purple";
    	} else if (language === "it") {
    		return "orange";
    	} else {
    		return "black";
    	}
    }

    function instance($$self, $$props, $$invalidate) {
    	let $selectedMovie;
    	let $scrollY;
    	let $year;
    	let $castId;
    	let $crewId;
    	let $minYear;
    	let $maxReviewCount;
    	let $minReviewCount;
    	let $selectedGenres;
    	let $selectedLanguage;
    	let $runningQuery;
    	let $firstVisibleIndex;
    	let $selectedPerson;
    	let $selectedPersonName;
    	let $queryCount;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let width = 100; // Default width
    	let scrollY = writable(0); // Scroll position
    	validate_store(scrollY, 'scrollY');
    	component_subscribe($$self, scrollY, value => $$invalidate(8, $scrollY = value));
    	let containerHeight = 0; // Height of the scroll container
    	let movieColumn;
    	let selectedLanguage = writable("all");
    	validate_store(selectedLanguage, 'selectedLanguage');
    	component_subscribe($$self, selectedLanguage, value => $$invalidate(3, $selectedLanguage = value));
    	let selectedGenres = writable([]);
    	validate_store(selectedGenres, 'selectedGenres');
    	component_subscribe($$self, selectedGenres, value => $$invalidate(36, $selectedGenres = value));
    	let minYear = writable("");
    	validate_store(minYear, 'minYear');
    	component_subscribe($$self, minYear, value => $$invalidate(35, $minYear = value));
    	let year = writable("");
    	validate_store(year, 'year');
    	component_subscribe($$self, year, value => $$invalidate(9, $year = value));
    	let minReviewCount = writable(10);
    	validate_store(minReviewCount, 'minReviewCount');
    	component_subscribe($$self, minReviewCount, value => $$invalidate(2, $minReviewCount = value));
    	let maxReviewCount = writable();
    	validate_store(maxReviewCount, 'maxReviewCount');
    	component_subscribe($$self, maxReviewCount, value => $$invalidate(1, $maxReviewCount = value));
    	let queryCount = writable(0);
    	validate_store(queryCount, 'queryCount');
    	component_subscribe($$self, queryCount, value => $$invalidate(11, $queryCount = value));
    	let crewId = writable(0);
    	validate_store(crewId, 'crewId');
    	component_subscribe($$self, crewId, value => $$invalidate(34, $crewId = value));
    	let castId = writable(0);
    	validate_store(castId, 'castId');
    	component_subscribe($$self, castId, value => $$invalidate(33, $castId = value));
    	let selectedPerson = writable(null);
    	validate_store(selectedPerson, 'selectedPerson');
    	component_subscribe($$self, selectedPerson, value => $$invalidate(38, $selectedPerson = value));
    	let selectedPersonName = writable(null);
    	validate_store(selectedPersonName, 'selectedPersonName');
    	component_subscribe($$self, selectedPersonName, value => $$invalidate(10, $selectedPersonName = value));
    	let firstVisibleIndex = writable(0);
    	validate_store(firstVisibleIndex, 'firstVisibleIndex');
    	component_subscribe($$self, firstVisibleIndex, value => $$invalidate(37, $firstVisibleIndex = value));
    	let runningQuery = writable(false);
    	validate_store(runningQuery, 'runningQuery');
    	component_subscribe($$self, runningQuery, value => $$invalidate(57, $runningQuery = value));

    	function setCrew(p) {
    		castId.set(0);
    		crewId.set(p.id);
    		console.log(p.id);
    		selectedPerson.set(p);
    	}

    	function setCast(p) {
    		crewId.set(0);
    		castId.set(p.id);
    		console.log(p.id);
    		selectedPerson.set(p);
    	}

    	async function queryDatabase(append = false, date = null) {
    		console.log(append);
    		runningQuery.set(true);
    		let url = "http://localhost:3000/movies";

    		let body = {
    			originalLanguage: $selectedLanguage,
    			genres: $selectedGenres,
    			minReviewCount: parseInt($minReviewCount),
    			maxReviewCount: parseInt($maxReviewCount),
    			minYear: parseInt($minYear),
    			crewId: parseInt($crewId),
    			castId: parseInt($castId),
    			type: append,
    			date
    		};

    		let res = await axios$1({
    			method: "post",
    			url,
    			data: body,
    			headers: { "Content-Type": "application/json" }
    		});

    		let movieResponse = res.data;
    		let newMovies = movieResponse.map(movie => new Movie(movie));

    		if (append == "append") {
    			$$invalidate(7, movies = [...movies, ...newMovies]);
    		} else if (append == "prepend") {
    			$$invalidate(7, movies = [...newMovies, ...movies]);
    			scrollY.update(n => n + newMovies.length * itemHeight);
    		} else if (append == "new") {
    			$$invalidate(7, movies = newMovies);
    			scrollY.update(n => 0);

    			set_store_value(
    				year,
    				$year = movies.length > 0
    				? movies[0].getReleaseYear().toString()
    				: "",
    				$year
    			);

    			await checkAppendPrepend();
    		}

    		getPopularityIndexAndColor(movies);
    		$$invalidate(5, containerHeight = movies.length * itemHeight);
    		queryCount.update(n => n + 1);
    		runningQuery.set(false);
    	}

    	function getPopularityIndexAndColor(movies) {
    		movies.sort((a, b) => b.popularity - a.popularity);

    		movies.forEach((movie, index) => {
    			movie.popularityIndex = index + 1;
    		});

    		movies.sort((a, b) => a.releaseDate - b.releaseDate);

    		movies.forEach((movie, index) => {
    			movie.color = getColor(movie.popularityIndex);
    		});
    	}

    	function updateWidth() {
    		$$invalidate(4, width = document.querySelector(".movie-bar").clientWidth);
    	}

    	async function checkAppendPrepend() {
    		if (movies.length > 0 && movies.length - $firstVisibleIndex < 15 && !$runningQuery) {
    			await queryDatabase("append", movies[movies.length - 1].releaseDate);
    		}

    		if (movies.length > 0 && $firstVisibleIndex == 0 && !$runningQuery && new Date(movies[0].releaseDate) > new Date("12/31/1902")) {
    			console.log("hello");
    			await queryDatabase("prepend", movies[0].releaseDate);
    		}
    	}

    	async function handleScroll(event) {
    		let movieListDiv = document.querySelector(".movie-list");
    		let cursorPositionX = event.clientX;
    		let cursorPositionY = event.clientY;
    		let rect = movieListDiv.getBoundingClientRect();

    		if (!(cursorPositionY > rect.top && cursorPositionY < rect.bottom)) {
    			return;
    		} else if (!(cursorPositionX > rect.left && cursorPositionX < rect.right)) {
    			return;
    		}

    		const delta = event.deltaY || event.touches[0].clientY - startY;
    		scrollY.update(n => Math.max(0, Math.min(containerHeight - viewportHeight, n + delta)));
    		startY = event.touches ? event.touches[0].clientY : startY;

    		set_store_value(
    			year,
    			$year = movies.length > 0 && getFirstVisibleIndex($scrollY) < movies.length
    			? movies[getFirstVisibleIndex($scrollY)].getReleaseYear().toString()
    			: "",
    			$year
    		);

    		await checkAppendPrepend();
    		event.preventDefault();
    	}

    	let startY = 0;

    	function handleTouchStart(event) {
    		startY = event.touches[0].clientY;
    	}

    	class Movie {
    		constructor(data) {
    			this.id = data.id;
    			this.title = data.title;
    			this.originalTitle = data.original_title;
    			this.overview = data.overview;
    			this.releaseDate = new Date(data.release_date);
    			this.runtime = data.runtime;
    			this.voteAverage = data.vote_average;
    			this.voteCount = data.vote_count;
    			this.popularity = data.popularity;
    			this.posterPath = data.poster_path;
    			this.backdropPath = data.backdrop_path;
    			this.adult = data.adult === "true";
    			this.homepage = data.homepage;
    			this.imdbId = data.imdb_id;
    			this.originalLanguage = data.original_language;
    			this.status = data.status;
    			this.tagline = data.tagline;
    			this.budget = data.budget;
    			this.revenue = data.revenue;
    			this.belongsToCollection = data.belongs_to_collection;
    			this.genres = data.genres.map(genre => genre.name);
    			this.spokenLanguages = data.spoken_languages.map(lang => lang.english_name);
    			this.productionCountries = data.production_countries.map(country => country.name);
    			this.productionCompanies = data.production_companies.map(company => company.name);
    			this.reviews = data.reviews;
    			this.videos = data.videos;
    			this.similar = data.similar;
    			this.images = data.images;
    			this.keywords = data?.keywords[0]?.keywords.map(keyword => keyword.name);
    			this.cast = data?.credits?.cast;
    			this.topNcast = data?.credits?.cast.sort((a, b) => b.popularity - a.popularity).slice(0, 10);
    			this.crew = data?.credits?.crew;

    			this.topNcrew = data?.credits?.crew.sort((a, b) => {
    				if (a.job === "Director") {
    					return -1;
    				} else if (b.job === "Director") {
    					return 1;
    				}

    				return b.popularity - a.popularity;
    			}).slice(0, 10);
    		}

    		getFormattedReleaseDate() {
    			return this.releaseDate.toLocaleDateString();
    		}

    		getFormattedMonthYear() {
    			return this.releaseDate.toLocaleString("default", { month: "numeric", year: "numeric" });
    		}

    		getReleaseYear() {
    			return this.releaseDate.getFullYear();
    		}

    		getPosterUrl() {
    			return `https://image.tmdb.org/t/p/w500${this.posterPath}`;
    		}

    		getBackdropUrl() {
    			return `https://image.tmdb.org/t/p/w1280${this.backdropPath}`;
    		}
    	}

    	let movies = [];

    	let genreEmojiDict = {
    		Documentary: "📚",
    		Adventure: "🧗",
    		"Science Fiction": "👽",
    		Comedy: "😂",
    		Fantasy: "🧙",
    		Horror: "👻",
    		Drama: "🎭",
    		History: "🏰",
    		War: "⚔️",
    		Romance: "❤️",
    		Thriller: "😱",
    		Crime: "🔪",
    		Action: "💥",
    		Mystery: "🕵️‍♂️",
    		Music: "🎵",
    		Family: "👨‍👩‍👧‍👦",
    		Animation: "🎨",
    		Western: "🤠",
    		"TV Movie": "📺"
    	};

    	let selectedMovie = writable(null);
    	validate_store(selectedMovie, 'selectedMovie');
    	component_subscribe($$self, selectedMovie, value => $$invalidate(0, $selectedMovie = value));

    	onMount(async () => {
    		// axios
    		await queryDatabase();

    		await tick(); // Wait for the DOM to update

    		if (movieColumn) {
    			updateWidth();
    		}

    		window.addEventListener("resize", updateWidth); // Update on resize
    		document.addEventListener("wheel", handleScroll); // Mouse wheel scroll
    		document.addEventListener("touchmove", handleScroll); // Touch scroll
    		document.addEventListener("touchstart", handleTouchStart); // Touch start

    		return () => {
    			window.removeEventListener("resize", updateWidth); // Cleanup on component destroy
    			document.removeEventListener("wheel", handleScroll);
    			document.removeEventListener("touchmove", handleScroll);
    			document.removeEventListener("touchstart", handleTouchStart);
    		};
    	});

    	function getColor(popularityIndex) {
    		const ratio = popularityIndex / movies.length;

    		// get color between blue and gold
    		let c1 = [0, 0, 255];

    		let c2 = [255, 215, 0];

    		let color = [
    			Math.floor(c2[0] + ratio * (c1[0] - c2[0])),
    			Math.floor(c2[1] + ratio * (c1[1] - c2[1])),
    			Math.floor(c2[2] + ratio * (c1[2] - c2[2]))
    		];

    		return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
    	}

    	function handleBarClick(movie) {
    		selectedMovie.set(movie);
    	}

    	function getVisibleMovies(queryCount, scrollY, viewportHeight) {
    		const startIndex = Math.floor(scrollY / itemHeight);
    		const endIndex = Math.min(movies.length, Math.ceil((scrollY + viewportHeight) / itemHeight));
    		return movies.slice(startIndex, endIndex);
    	}

    	function getFirstVisibleIndex(scrollY) {
    		let fvi = Math.floor(scrollY / itemHeight);
    		firstVisibleIndex.set(fvi);
    		return Math.floor(fvi);
    	}

    	function scrollToYear(e) {
    		const year = e.target.value;
    		const index = movies.findIndex(movie => movie.getReleaseYear() === parseInt(year));

    		if (index !== -1) {
    			scrollY.update(() => index * itemHeight);
    		}
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function textarea_input_handler() {
    		$year = this.value;
    		year.set($year);
    	}

    	const change_handler = e => {
    		minYear.set(e.target.value);
    		console.log("in here");
    	};

    	function textarea0_input_handler() {
    		$minReviewCount = this.value;
    		minReviewCount.set($minReviewCount);
    	}

    	function textarea1_input_handler() {
    		$maxReviewCount = this.value;
    		maxReviewCount.set($maxReviewCount);
    	}

    	function textarea2_input_handler() {
    		$selectedPersonName = this.value;
    		selectedPersonName.set($selectedPersonName);
    	}

    	function select_change_handler() {
    		$selectedLanguage = select_value(this);
    		selectedLanguage.set($selectedLanguage);
    	}

    	const change_handler_1 = (genre, e) => {
    		if (e.target.checked) {
    			selectedGenres.update(genres => [...genres, genre]);
    		} else {
    			selectedGenres.update(genres => genres.filter(g => g !== genre));
    		}
    	};

    	const click_handler = movie => handleBarClick(movie);
    	const click_handler_1 = movie => handleBarClick(movie);
    	const click_handler_2 = movie => handleBarClick(movie);
    	const click_handler_3 = movie => handleBarClick(movie);
    	const click_handler_4 = movie => handleBarClick(movie);

    	function div5_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			movieColumn = $$value;
    			$$invalidate(6, movieColumn);
    		});
    	}

    	const click_handler_5 = e => openYoutubeSearchUrl($selectedMovie.title, $selectedMovie.getReleaseYear());
    	const click_handler_6 = e => openYoutubeSearchUrl($selectedMovie.originalTitle, $selectedMovie.getReleaseYear());
    	const click_handler_7 = cast => setCast(cast);
    	const click_handler_8 = crew => setCrew(crew);

    	$$self.$capture_state = () => ({
    		onMount,
    		tick,
    		writable,
    		axios: axios$1,
    		width,
    		scrollY,
    		containerHeight,
    		itemHeight,
    		viewportHeight,
    		movieColumn,
    		selectedLanguage,
    		selectedGenres,
    		minYear,
    		year,
    		minReviewCount,
    		maxReviewCount,
    		queryCount,
    		crewId,
    		castId,
    		selectedPerson,
    		selectedPersonName,
    		firstVisibleIndex,
    		runningQuery,
    		setCrew,
    		setCast,
    		queryDatabase,
    		openYoutubeSearchUrl,
    		getPopularityIndexAndColor,
    		updateWidth,
    		generateHourString,
    		checkAppendPrepend,
    		handleScroll,
    		startY,
    		handleTouchStart,
    		Movie,
    		movies,
    		genreEmojiDict,
    		selectedMovie,
    		getColor,
    		getColorCountry,
    		handleBarClick,
    		getVisibleMovies,
    		getFirstVisibleIndex,
    		scrollToYear,
    		$selectedMovie,
    		$scrollY,
    		$year,
    		$castId,
    		$crewId,
    		$minYear,
    		$maxReviewCount,
    		$minReviewCount,
    		$selectedGenres,
    		$selectedLanguage,
    		$runningQuery,
    		$firstVisibleIndex,
    		$selectedPerson,
    		$selectedPersonName,
    		$queryCount
    	});

    	$$self.$inject_state = $$props => {
    		if ('width' in $$props) $$invalidate(4, width = $$props.width);
    		if ('scrollY' in $$props) $$invalidate(12, scrollY = $$props.scrollY);
    		if ('containerHeight' in $$props) $$invalidate(5, containerHeight = $$props.containerHeight);
    		if ('movieColumn' in $$props) $$invalidate(6, movieColumn = $$props.movieColumn);
    		if ('selectedLanguage' in $$props) $$invalidate(13, selectedLanguage = $$props.selectedLanguage);
    		if ('selectedGenres' in $$props) $$invalidate(14, selectedGenres = $$props.selectedGenres);
    		if ('minYear' in $$props) $$invalidate(15, minYear = $$props.minYear);
    		if ('year' in $$props) $$invalidate(16, year = $$props.year);
    		if ('minReviewCount' in $$props) $$invalidate(17, minReviewCount = $$props.minReviewCount);
    		if ('maxReviewCount' in $$props) $$invalidate(18, maxReviewCount = $$props.maxReviewCount);
    		if ('queryCount' in $$props) $$invalidate(19, queryCount = $$props.queryCount);
    		if ('crewId' in $$props) $$invalidate(20, crewId = $$props.crewId);
    		if ('castId' in $$props) $$invalidate(21, castId = $$props.castId);
    		if ('selectedPerson' in $$props) $$invalidate(22, selectedPerson = $$props.selectedPerson);
    		if ('selectedPersonName' in $$props) $$invalidate(23, selectedPersonName = $$props.selectedPersonName);
    		if ('firstVisibleIndex' in $$props) $$invalidate(24, firstVisibleIndex = $$props.firstVisibleIndex);
    		if ('runningQuery' in $$props) $$invalidate(25, runningQuery = $$props.runningQuery);
    		if ('startY' in $$props) startY = $$props.startY;
    		if ('movies' in $$props) $$invalidate(7, movies = $$props.movies);
    		if ('genreEmojiDict' in $$props) $$invalidate(28, genreEmojiDict = $$props.genreEmojiDict);
    		if ('selectedMovie' in $$props) $$invalidate(29, selectedMovie = $$props.selectedMovie);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[1] & /*$selectedPerson*/ 128) {
    			set_store_value(selectedPersonName, $selectedPersonName = $selectedPerson?.name, $selectedPersonName);
    		}

    		if ($$self.$$.dirty[0] & /*$selectedLanguage, $minReviewCount, $maxReviewCount*/ 14 | $$self.$$.dirty[1] & /*$selectedGenres, $minYear, $crewId, $castId*/ 60) {
    			queryDatabase("new", null);
    		}

    		if ($$self.$$.dirty[1] & /*$firstVisibleIndex*/ 64) {
    			console.log($firstVisibleIndex);
    		}

    		if ($$self.$$.dirty[0] & /*$selectedMovie*/ 1) {
    			console.log($selectedMovie);
    		}
    	};

    	return [
    		$selectedMovie,
    		$maxReviewCount,
    		$minReviewCount,
    		$selectedLanguage,
    		width,
    		containerHeight,
    		movieColumn,
    		movies,
    		$scrollY,
    		$year,
    		$selectedPersonName,
    		$queryCount,
    		scrollY,
    		selectedLanguage,
    		selectedGenres,
    		minYear,
    		year,
    		minReviewCount,
    		maxReviewCount,
    		queryCount,
    		crewId,
    		castId,
    		selectedPerson,
    		selectedPersonName,
    		firstVisibleIndex,
    		runningQuery,
    		setCrew,
    		setCast,
    		genreEmojiDict,
    		selectedMovie,
    		handleBarClick,
    		getVisibleMovies,
    		getFirstVisibleIndex,
    		$castId,
    		$crewId,
    		$minYear,
    		$selectedGenres,
    		$firstVisibleIndex,
    		$selectedPerson,
    		textarea_input_handler,
    		change_handler,
    		textarea0_input_handler,
    		textarea1_input_handler,
    		textarea2_input_handler,
    		select_change_handler,
    		change_handler_1,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		div5_binding,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		click_handler_8
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {}, null, [-1, -1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
