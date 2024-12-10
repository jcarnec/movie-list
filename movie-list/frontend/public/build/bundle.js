
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
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop$1;
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append$1(target, node) {
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
    function to_number(value) {
        return value === '' ? null : +value;
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
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
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
    /**
     * Schedules a callback to run immediately before the component is unmounted.
     *
     * Out of `onMount`, `beforeUpdate`, `afterUpdate` and `onDestroy`, this is the
     * only one that runs inside a server-side component.
     *
     * https://svelte.dev/docs#run-time-svelte-ondestroy
     */
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
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
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
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
        else if (callback) {
            callback();
        }
    }

    function bind$1(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
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
        append$1(target, node);
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
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
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
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier} [start]
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
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
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let started = false;
            const values = [];
            let pending = 0;
            let cleanup = noop$1;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop$1;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (started) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            started = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
                // We need to set this to false because callbacks can still happen despite having unsubscribed:
                // Callbacks might already be placed in the queue which doesn't know it should no longer
                // invoke this derived store.
                started = false;
            };
        });
    }

    const movieCount = writable(null);

    const selectedMovie = writable(null);
    const scrollY = writable(0);
    const containerHeight = writable(0);
    const viewportHeight = writable(1500);
    const startY = writable(0);
    const queryCount = writable(0);
    const transitionCount = writable(0);
    const runningQuery = writable(false);
    const itemHeight = writable(85);
    const firstVisibleIndex = derived(
      [scrollY, itemHeight],
      ([$scrollY, $itemHeight]) => {
        return Math.floor($scrollY / $itemHeight);
      }
    );

    const allowQueryMutex = writable(true);

    // Default values
    const DEFAULT_TITLE = '';
    const DEFAULT_YEAR = null;
    const DEFAULT_MIN_REVIEWS = null;
    const DEFAULT_MAX_REVIEWS = null;
    const DEFAULT_PERSON = { name: '', id: null, castOrCrew: null };
    const DEFAULT_LANGUAGES = [];
    const DEFAULT_SELECTED_GENRES = [];
    const DEFAULT_SELECTED_VIEW_TYPE_VERBS = [];

    const DEFAULT_MIN_POPULARITY = null;
    const DEFAULT_MAX_POPULARITY = null;
    const DEFAULT_MIN_VOTE_AVERAGE = null;
    const DEFAULT_MAX_VOTE_AVERAGE = null;
    const DEFAULT_MIN_RUNTIME = null;
    const DEFAULT_MAX_RUNTIME = null;

    const selectedPerson = writable(DEFAULT_PERSON);
    const selectedLanguages = writable([]);
    const selectedGenres = writable(DEFAULT_SELECTED_GENRES);
    const selectedViewTypeVerbs = writable(DEFAULT_SELECTED_VIEW_TYPE_VERBS);
    const minYear = writable('2014');
    const minReviewCount = writable(50);
    const maxReviewCount = writable(DEFAULT_MAX_REVIEWS);
    const selectedTitle = writable('');

    const minPopularity = writable(DEFAULT_MIN_POPULARITY);
    const maxPopularity = writable(DEFAULT_MAX_POPULARITY);
    const minVoteAverage = writable(DEFAULT_MIN_VOTE_AVERAGE);
    const maxVoteAverage = writable(DEFAULT_MAX_VOTE_AVERAGE);
    const minRuntime = writable(DEFAULT_MIN_RUNTIME);
    const maxRuntime = writable(DEFAULT_MAX_RUNTIME);


    const lastAppendedID = writable(null);
    const lastPrependedID = writable(null);

    const currentSelectedPerson = writable(get_store_value(selectedPerson));
    const currentMinYear = writable(get_store_value(minYear));
    const currentMinReviewCount = writable(get_store_value(minReviewCount));
    const currentMaxReviewCount = writable(get_store_value(maxReviewCount));
    const currentSelectedTitle = writable(get_store_value(selectedTitle));


    const currentMinPopularity = writable(get_store_value(minPopularity));
    const currentMaxPopularity = writable(get_store_value(maxPopularity));
    const currentMinVoteAverage = writable(get_store_value(minVoteAverage));
    const currentMaxVoteAverage = writable(get_store_value(maxVoteAverage));
    const currentMinRuntime = writable(get_store_value(minRuntime));
    const currentMaxRuntime = writable(get_store_value(maxRuntime));

    const castAndCrew = writable(null);


    selectedPerson.subscribe(value => currentSelectedPerson.set(value));
    minYear.subscribe(value => currentMinYear.set(value));
    minReviewCount.subscribe(value => currentMinReviewCount.set(value));
    maxReviewCount.subscribe(value => currentMaxReviewCount.set(value));
    minPopularity.subscribe(value => currentMinPopularity.set(value));
    maxPopularity.subscribe(value => currentMaxPopularity.set(value));
    minVoteAverage.subscribe(value => currentMinVoteAverage.set(value));
    maxVoteAverage.subscribe(value => currentMaxVoteAverage.set(value));
    minRuntime.subscribe(value => currentMinRuntime.set(value));
    maxRuntime.subscribe(value => currentMaxRuntime.set(value));

    selectedTitle.subscribe(value => currentSelectedTitle.set(value) );

    function logChange(newValue) {
      console.log('log change', newValue);
    }

    selectedPerson.subscribe(logChange);
    selectedMovie.subscribe(logChange);


    selectedMovie.subscribe((value) => {
      if(value && value.title) {
        currentSelectedTitle.set(value.title);
      }
    });

    const LANGUAGEINFO = {
      en: {
        flag: "🇬🇧", // English flag
        name: "English", // Language name
        color: "#FF5733", // Orange color
      },
      fr: {
        flag: "🇫🇷",
        name: "French",
        color: "#3498DB", // Blue color
      },
      es: {
        flag: "🇪🇸",
        name: "Spanish",
        color: "#F1C40F", // Yellow color
      },
      de: {
        flag: "🇩🇪",
        name: "German",
        color: "#2ECC71", // Green color
      },
      ja: {
        flag: "🇯🇵",
        name: "Japanese",
        color: "#9B59B6", // Purple color
      },
      it: {
        flag: "🇮🇹",
        name: "Italian",
        color: "#E74C3C", // Red color
      },
      hi: {
        flag: "🇮🇳",
        name: "Hindi",
        color: "#FF9933", // Saffron color
      },
      et: {
        flag: "🇪🇪",
        name: "Estonian",
        color: "#00ADEF", // Blue color
      },
      bn: {
        flag: "🇧🇩",
        name: "Bengali",
        color: "#006A4E", // Green color
      },
      cs: {
        flag: "🇨🇿",
        name: "Czech",
        color: "#D7141A", // Red color
      },
      sv: {
        flag: "🇸🇪",
        name: "Swedish",
        color: "#006AA7", // Blue color
      },
      pl: {
        flag: "🇵🇱",
        name: "Polish",
        color: "#DC143C", // Crimson color
      },
      fa: {
        flag: "🇮🇷",
        name: "Persian (Farsi)",
        color: "#DAA520", // Goldenrod color
      },
      ru: {
        flag: "🇷🇺",
        name: "Russian",
        color: "#C0392B", // Dark Red color
      },
      tr: {
        flag: "🇹🇷",
        name: "Turkish",
        color: "#E30A17", // Red color
      },
      sh: {
        flag: "🇷🇸",
        name: "Serbo-Croatian",
        color: "#4B0082", // Indigo color
      },
      ga: {
        flag: "🇮🇪",
        name: "Irish (Gaeilge)",
        color: "#009A44", // Green color
      },
      hu: {
        flag: "🇭🇺",
        name: "Hungarian",
        color: "#C8102E", // Red color
      },
      pt: {
        flag: "🇵🇹",
        name: "Portuguese",
        color: "#1ABC9C", // Teal color
      },
      zh: {
        flag: "🇨🇳",
        name: "Chinese",
        color: "#16A085", // Jade Green color
      },
      ar: {
        flag: "🇸🇦",
        name: "Arabic",
        color: "#2980B9", // Royal Blue color
      },
      da: {
        flag: "🇩🇰",
        name: "Danish",
        color: "#C60C30", // Red color
      },
      uk: {
        flag: "🇺🇦",
        name: "Ukrainian",
        color: "#0057B7", // Blue color
      },
      ro: {
        flag: "🇷🇴",
        name: "Romanian",
        color: "#FFD700", // Yellow color
      },
      no: {
        flag: "🇳🇴",
        name: "Norwegian",
        color: "#BA0C2F", // Red color
      },
      fi: {
        flag: "🇫🇮",
        name: "Finnish",
        color: "#003580", // Blue color
      },
      hr: {
        flag: "🇭🇷",
        name: "Croatian",
        color: "#FF0000", // Red color
      },
      el: {
        flag: "🇬🇷",
        name: "Greek",
        color: "#0D5EAF", // Blue color
      },
      nl: {
        flag: "🇳🇱",
        name: "Dutch",
        color: "#21468B", // Blue color
      },
      sk: {
        flag: "🇸🇰",
        name: "Slovak",
        color: "#0B4EA2", // Blue color
      },
      id: {
        flag: "🇮🇩",
        name: "Indonesian",
        color: "#E74C3C", // Red color
      },
      td: {
        flag: "🇹🇩",
        name: "Chadian",
        color: "#FFCC00", // Yellow color
      },
      cl: {
        flag: "🇨🇱",
        name: "Chilean",
        color: "#D52B1E", // Red color
      },
      sr: {
        flag: "🇷🇸",
        name: "Serbian",
        color: "#4B0082", // Indigo color
      },
      ko: {
        flag: "🇰🇷",
        name: "Korean",
        color: "#2ECC71", // Green color
      },
      ur: {
        flag: "🇵🇰",
        name: "Urdu",
        color: "#006A4E", // Dark Green color
      },
      cn: {
        flag: "🇨🇳",
        name: "Simplified Chinese",
        color: "#E74C3C", // Red color
      },
      he: {
        flag: "🇮🇱",
        name: "Hebrew",
        color: "#3498DB", // Blue color
      },
      az: {
        flag: "🇦🇿",
        name: "Azerbaijani",
        color: "#00BFFF", // Deep Sky Blue color
      },
      bg: {
        flag: "🇧🇬",
        name: "Bulgarian",
        color: "#D32F2F", // Red color
      },
      sl: {
        flag: "🇸🇮",
        name: "Slovenian",
        color: "#C8102E", // Red color
      },
      lv: {
        flag: "🇱🇻",
        name: "Latvian",
        color: "#9B2335", // Dark Red color
      },
      wo: {
        flag: "🇸🇳",
        name: "Wolof",
        color: "#FFCC00", // Yellow color
      },
      mo: {
        flag: "🇲🇩",
        name: "Moldovan",
        color: "#0033A0", // Blue color
      },
      ln: {
        flag: "🇨🇬",
        name: "Lingala",
        color: "#FF4500", // Orange Red color
      },
      vi: {
        flag: "🇻🇳",
        name: "Vietnamese",
        color: "#DA291C", // Red color
      },
      th: {
        flag: "🇹🇭",
        name: "Thai",
        color: "#0066CC", // Blue color
      },
      my: {
        flag: "🇲🇲",
        name: "Burmese",
        color: "#FFD700", // Yellow color
      },
      tl: {
        flag: "🇵🇭",
        name: "Tagalog",
        color: "#0038A8", // Blue color
      },
      ms: {
        flag: "🇲🇾",
        name: "Malay",
        color: "#FFCC00", // Yellow color
      },
      ta: {
        flag: "🇱🇰",
        name: "Tamil",
        color: "#800000", // Maroon color
      },
      mr: {
        flag: "🇮🇳",
        name: "Marathi",
        color: "#FF6600", // Orange color
      },
      pa: {
        flag: "🇮🇳",
        name: "Punjabi",
        color: "#FF9933", // Saffron color
      },
      yo: {
        flag: "🇳🇬",
        name: "Yoruba",
        color: "#32CD32", // Lime Green color
      },
      ha: {
        flag: "🇳🇬",
        name: "Hausa",
        color: "#008000", // Green color
      },
      sw: {
        flag: "🇹🇿",
        name: "Swahili",
        color: "#00A550", // Green color
      },
      am: {
        flag: "🇪🇹",
        name: "Amharic",
        color: "#DA291C", // Red color
      },
      om: {
        flag: "🇪🇹",
        name: "Oromo",
        color: "#FFCC00", // Yellow color
      },
      ig: {
        flag: "🇳🇬",
        name: "Igbo",
        color: "#008000", // Green color
      },
      rw: {
        flag: "🇷🇼",
        name: "Kinyarwanda",
        color: "#FFD700", // Yellow color
      },
      ts: {
        flag: "🇿🇦",
        name: "Tsonga",
        color: "#FF9933", // Saffron color
      },
      xh: {
        flag: "🇿🇦",
        name: "Xhosa",
        color: "#000000", // Black color
      },
      zu: {
        flag: "🇿🇦",
        name: "Zulu",
        color: "#008080", // Teal color
      },
      tn: {
        flag: "🇧🇼",
        name: "Tswana",
        color: "#00BFFF", // Deep Sky Blue color
      },
      kg: {
        flag: "🇨🇬",
        name: "Kongo",
        color: "#FF4500", // Orange Red color
      },
      ne: {
        flag: "🇳🇵",
        name: "Nepali",
        color: "#DC143C", // Crimson
      },
      ps: {
        flag: "🇦🇫",
        name: "Pashto",
        color: "#1C1C1C", // Charcoal
      },
      si: {
        flag: "🇱🇰",
        name: "Sinhala",
        color: "#FFCC33", // Yellow
      },
      ti: {
        flag: "🇪🇷",
        name: "Tigrinya",
        color: "#8B0000", // Dark Red
      },
      mi: {
        flag: "🇳🇿",
        name: "Maori",
        color: "#000080", // Navy Blue
      },
      mn: {
        flag: "🇲🇳",
        name: "Mongolian",
        color: "#0033A0", // Blue
      },
      km: {
        flag: "🇰🇭",
        name: "Khmer",
        color: "#CC0000", // Red
      },
      lo: {
        flag: "🇱🇦",
        name: "Lao",
        color: "#0033CC", // Blue
      },
      ka: {
        flag: "🇬🇪",
        name: "Georgian",
        color: "#E74C3C", // Red
      },
      be: {
        flag: "🇧🇾",
        name: "Belarusian",
        color: "#FFD700", // Yellow color
      },
      ca: {
        flag: "🇪🇸",
        name: "Catalan",
        color: "#F39C12", // Orange color
      },
      eu: {
        flag: "🇪🇸",
        name: "Basque",
        color: "#2980B9", // Blue color
      },
      gl: {
        flag: "🇪🇸",
        name: "Galician",
        color: "#1ABC9C", // Teal color
      },
      is: {
        flag: "🇮🇸",
        name: "Icelandic",
        color: "#0033CC", // Blue color
      },
      sq: {
        flag: "🇦🇱",
        name: "Albanian",
        color: "#E41B17", // Red color
      },
      bs: {
        flag: "🇧🇦",
        name: "Bosnian",
        color: "#007FFF", // Azure Blue color
      },
      mk: {
        flag: "🇲🇰",
        name: "Macedonian",
        color: "#D20000", // Red color
      },
      mt: {
        flag: "🇲🇹",
        name: "Maltese",
        color: "#FF4500", // Orange Red color
      },
      cy: {
        flag: "🏴",
        name: "Welsh",
        color: "#228B22", // Forest Green color
      },
      sc: {
        flag: "🇮🇹",
        name: "Sardinian",
        color: "#DC143C", // Crimson color
      },
      gsw: {
        flag: "🇨🇭",
        name: "Swiss German",
        color: "#FF0000", // Red color
      },
      br: {
        flag: "🇫🇷",
        name: "Breton",
        color: "#2F4F4F", // Dark Slate Grey color
      },
    };

    function getLanguageFlag(language) {
      if (LANGUAGEINFO[language]) {
        return LANGUAGEINFO[language].flag;
      } else {
        console.log(`Language flag not supported for: ${language}`);
        return undefined;
      }
    }

    function getLanguageName(language) {
      if (LANGUAGEINFO[language]) {
        return LANGUAGEINFO[language].name;
      } else {
        console.log(`Language name not supported for: ${language}`);
        return undefined;
      }
    }

    function getLanguageColor(language) {
      if (LANGUAGEINFO[language]) {
        return LANGUAGEINFO[language].color;
      } else {
        console.log(`Language color not supported for: ${language}`);
        return undefined;
      }
    }

    const genreEmojiDict = {
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
      "TV Movie": "📺",
    };

    const verbEmojiDict = {
      viewed: "📑",
      interested: "🧐",
      seen: "📺",
      loved: "🫶",
    };

    /* src/components/InputWithClear.svelte generated by Svelte v3.59.2 */

    const file$c = "src/components/InputWithClear.svelte";

    // (28:2) {#if bindValue != defaultValue && defaultValue != null}
    function create_if_block$b(ctx) {
    	let button;
    	let svg;
    	let path;
    	let button_aria_label_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "d", "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z");
    			attr_dev(path, "clip-rule", "evenodd");
    			add_location(path, file$c, 44, 8, 1618);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "h-5 w-5");
    			attr_dev(svg, "viewBox", "0 0 20 20");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "aria-hidden", "true");
    			add_location(svg, file$c, 37, 6, 1447);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "absolute inset-y-0 right-2 flex items-center p-0 text-gray-500 hover:text-gray-700 focus:outline-none");
    			attr_dev(button, "aria-label", button_aria_label_value = "Clear " + /*label*/ ctx[2]);
    			add_location(button, file$c, 28, 4, 1159);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, svg);
    			append_dev(svg, path);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[9], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*label*/ 4 && button_aria_label_value !== (button_aria_label_value = "Clear " + /*label*/ ctx[2])) {
    				attr_dev(button, "aria-label", button_aria_label_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$b.name,
    		type: "if",
    		source: "(28:2) {#if bindValue != defaultValue && defaultValue != null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let div;
    	let input;
    	let t0;
    	let label_1;
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;
    	let if_block = /*bindValue*/ ctx[0] != /*defaultValue*/ ctx[3] && /*defaultValue*/ ctx[3] != null && create_if_block$b(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t0 = space();
    			label_1 = element("label");
    			t1 = text(/*label*/ ctx[2]);
    			t2 = space();
    			if (if_block) if_block.c();
    			attr_dev(input, "id", /*id*/ ctx[1]);
    			attr_dev(input, "class", "block rounded-t-lg px-2.5 pb-1.5 pt-4 w-full text-sm text-gray-900 bg-gray-50 dark:bg-gray-700 border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer pr-8");
    			attr_dev(input, "placeholder", " ");
    			add_location(input, file$c, 13, 2, 274);
    			attr_dev(label_1, "for", /*id*/ ctx[1]);
    			attr_dev(label_1, "class", "absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-3 scale-75 top-3 z-10 origin-[0] start-2.5 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto");
    			add_location(label_1, file$c, 21, 2, 682);
    			attr_dev(div, "class", "relative");
    			add_location(div, file$c, 12, 0, 249);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			set_input_value(input, /*bindValue*/ ctx[0]);
    			append_dev(div, t0);
    			append_dev(div, label_1);
    			append_dev(label_1, t1);
    			append_dev(div, t2);
    			if (if_block) if_block.m(div, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[8]),
    					listen_dev(
    						input,
    						"blur",
    						function () {
    							if (is_function(/*onBlur*/ ctx[4])) /*onBlur*/ ctx[4].apply(this, arguments);
    						},
    						false,
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						input,
    						"keydown",
    						function () {
    							if (is_function(/*onKeydown*/ ctx[5])) /*onKeydown*/ ctx[5].apply(this, arguments);
    						},
    						false,
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*id*/ 2) {
    				attr_dev(input, "id", /*id*/ ctx[1]);
    			}

    			if (dirty & /*bindValue*/ 1 && input.value !== /*bindValue*/ ctx[0]) {
    				set_input_value(input, /*bindValue*/ ctx[0]);
    			}

    			if (dirty & /*label*/ 4) set_data_dev(t1, /*label*/ ctx[2]);

    			if (dirty & /*id*/ 2) {
    				attr_dev(label_1, "for", /*id*/ ctx[1]);
    			}

    			if (/*bindValue*/ ctx[0] != /*defaultValue*/ ctx[3] && /*defaultValue*/ ctx[3] != null) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$b(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('InputWithClear', slots, []);
    	let { id = "" } = $$props;
    	let { label = "" } = $$props;
    	let { type = "text" } = $$props;
    	let { bindValue } = $$props;
    	let { defaultValue = "" } = $$props;
    	let { onBlur } = $$props;
    	let { onKeydown } = $$props;
    	let { onClear } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (bindValue === undefined && !('bindValue' in $$props || $$self.$$.bound[$$self.$$.props['bindValue']])) {
    			console.warn("<InputWithClear> was created without expected prop 'bindValue'");
    		}

    		if (onBlur === undefined && !('onBlur' in $$props || $$self.$$.bound[$$self.$$.props['onBlur']])) {
    			console.warn("<InputWithClear> was created without expected prop 'onBlur'");
    		}

    		if (onKeydown === undefined && !('onKeydown' in $$props || $$self.$$.bound[$$self.$$.props['onKeydown']])) {
    			console.warn("<InputWithClear> was created without expected prop 'onKeydown'");
    		}

    		if (onClear === undefined && !('onClear' in $$props || $$self.$$.bound[$$self.$$.props['onClear']])) {
    			console.warn("<InputWithClear> was created without expected prop 'onClear'");
    		}
    	});

    	const writable_props = [
    		'id',
    		'label',
    		'type',
    		'bindValue',
    		'defaultValue',
    		'onBlur',
    		'onKeydown',
    		'onClear'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<InputWithClear> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		bindValue = this.value;
    		$$invalidate(0, bindValue);
    	}

    	const click_handler = () => {
    		$$invalidate(0, bindValue = defaultValue);
    		if (onClear) onClear();
    	};

    	$$self.$$set = $$props => {
    		if ('id' in $$props) $$invalidate(1, id = $$props.id);
    		if ('label' in $$props) $$invalidate(2, label = $$props.label);
    		if ('type' in $$props) $$invalidate(7, type = $$props.type);
    		if ('bindValue' in $$props) $$invalidate(0, bindValue = $$props.bindValue);
    		if ('defaultValue' in $$props) $$invalidate(3, defaultValue = $$props.defaultValue);
    		if ('onBlur' in $$props) $$invalidate(4, onBlur = $$props.onBlur);
    		if ('onKeydown' in $$props) $$invalidate(5, onKeydown = $$props.onKeydown);
    		if ('onClear' in $$props) $$invalidate(6, onClear = $$props.onClear);
    	};

    	$$self.$capture_state = () => ({
    		id,
    		label,
    		type,
    		bindValue,
    		defaultValue,
    		onBlur,
    		onKeydown,
    		onClear
    	});

    	$$self.$inject_state = $$props => {
    		if ('id' in $$props) $$invalidate(1, id = $$props.id);
    		if ('label' in $$props) $$invalidate(2, label = $$props.label);
    		if ('type' in $$props) $$invalidate(7, type = $$props.type);
    		if ('bindValue' in $$props) $$invalidate(0, bindValue = $$props.bindValue);
    		if ('defaultValue' in $$props) $$invalidate(3, defaultValue = $$props.defaultValue);
    		if ('onBlur' in $$props) $$invalidate(4, onBlur = $$props.onBlur);
    		if ('onKeydown' in $$props) $$invalidate(5, onKeydown = $$props.onKeydown);
    		if ('onClear' in $$props) $$invalidate(6, onClear = $$props.onClear);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		bindValue,
    		id,
    		label,
    		defaultValue,
    		onBlur,
    		onKeydown,
    		onClear,
    		type,
    		input_input_handler,
    		click_handler
    	];
    }

    class InputWithClear extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {
    			id: 1,
    			label: 2,
    			type: 7,
    			bindValue: 0,
    			defaultValue: 3,
    			onBlur: 4,
    			onKeydown: 5,
    			onClear: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "InputWithClear",
    			options,
    			id: create_fragment$c.name
    		});
    	}

    	get id() {
    		throw new Error("<InputWithClear>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<InputWithClear>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<InputWithClear>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<InputWithClear>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<InputWithClear>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<InputWithClear>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bindValue() {
    		throw new Error("<InputWithClear>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bindValue(value) {
    		throw new Error("<InputWithClear>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get defaultValue() {
    		throw new Error("<InputWithClear>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set defaultValue(value) {
    		throw new Error("<InputWithClear>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onBlur() {
    		throw new Error("<InputWithClear>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onBlur(value) {
    		throw new Error("<InputWithClear>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onKeydown() {
    		throw new Error("<InputWithClear>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onKeydown(value) {
    		throw new Error("<InputWithClear>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onClear() {
    		throw new Error("<InputWithClear>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onClear(value) {
    		throw new Error("<InputWithClear>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/GenreMenu.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1$2 } = globals;
    const file$b = "src/components/GenreMenu.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (44:2) {#if genres.length > 0}
    function create_if_block_1$6(ctx) {
    	let div1;
    	let h6;
    	let t1;
    	let div0;
    	let each_value_1 = /*genres*/ ctx[0];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$4(get_each_context_1$4(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h6 = element("h6");
    			h6.textContent = "Selected Genres:";
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h6, "class", "text-lg font-semibold mb-2");
    			add_location(h6, file$b, 45, 6, 928);
    			attr_dev(div0, "class", "flex flex-wrap gap-2 mb-2");
    			add_location(div0, file$b, 46, 6, 995);
    			add_location(div1, file$b, 44, 4, 916);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h6);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div0, null);
    				}
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selectedGenres, genres, genreEmojiDict*/ 5) {
    				each_value_1 = /*genres*/ ctx[0];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$4(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$6.name,
    		type: "if",
    		source: "(44:2) {#if genres.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (48:8) {#each genres as genre}
    function create_each_block_1$4(ctx) {
    	let div;
    	let span2;
    	let span0;
    	let t0_value = /*genreEmojiDict*/ ctx[2][/*genre*/ ctx[7]] + "";
    	let t0;
    	let t1;
    	let t2_value = /*genre*/ ctx[7] + "";
    	let t2;
    	let t3;
    	let button;
    	let svg;
    	let path;
    	let t4;
    	let span1;
    	let t6;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[3](/*genre*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			span2 = element("span");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = space();
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t4 = space();
    			span1 = element("span");
    			span1.textContent = "Remove badge";
    			t6 = space();
    			attr_dev(span0, "class", "text-lg mr-1");
    			add_location(span0, file$b, 58, 14, 1482);
    			attr_dev(path, "stroke", "currentColor");
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "stroke-width", "2");
    			attr_dev(path, "d", "m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6");
    			add_location(path, file$b, 73, 18, 2130);
    			attr_dev(svg, "class", "w-2 h-2");
    			attr_dev(svg, "aria-hidden", "true");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 14 14");
    			add_location(svg, file$b, 66, 16, 1897);
    			attr_dev(span1, "class", "sr-only");
    			add_location(span1, file$b, 81, 16, 2420);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "inline-flex items-center p-1 ms-2 text-sm text-blue-400 bg-transparent rounded-sm group-hover:bg-blue-200 group-hover:text-blue-900 ");
    			attr_dev(button, "data-dismiss-target", "#badge-dismiss-blue");
    			attr_dev(button, "aria-label", "Remove");
    			add_location(button, file$b, 60, 14, 1576);
    			attr_dev(span2, "id", "badge-dismiss-blue");
    			attr_dev(span2, "class", "inline-flex items-center px-2 py-1 me-2 text-sm font-medium text-blue-800 bg-blue-100 rounded cursor-pointer");
    			add_location(span2, file$b, 49, 12, 1109);
    			attr_dev(div, "class", "group");
    			add_location(div, file$b, 48, 10, 1077);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span2);
    			append_dev(span2, span0);
    			append_dev(span0, t0);
    			append_dev(span2, t1);
    			append_dev(span2, t2);
    			append_dev(span2, t3);
    			append_dev(span2, button);
    			append_dev(button, svg);
    			append_dev(svg, path);
    			append_dev(button, t4);
    			append_dev(button, span1);
    			append_dev(div, t6);

    			if (!mounted) {
    				dispose = listen_dev(span2, "click", click_handler, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*genres*/ 1 && t0_value !== (t0_value = /*genreEmojiDict*/ ctx[2][/*genre*/ ctx[7]] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*genres*/ 1 && t2_value !== (t2_value = /*genre*/ ctx[7] + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$4.name,
    		type: "each",
    		source: "(48:8) {#each genres as genre}",
    		ctx
    	});

    	return block;
    }

    // (92:2) {#if unselectedGenres.length > 0}
    function create_if_block$a(ctx) {
    	let div1;
    	let h6;
    	let t1;
    	let div0;
    	let each_value = /*unselectedGenres*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h6 = element("h6");
    			h6.textContent = "Available Genres:";
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h6, "class", "text-lg font-semibold mb-2");
    			add_location(h6, file$b, 93, 6, 2652);
    			attr_dev(div0, "class", "flex flex-wrap gap-2");
    			add_location(div0, file$b, 94, 6, 2720);
    			add_location(div1, file$b, 92, 4, 2640);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h6);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div0, null);
    				}
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selectedGenres, unselectedGenres, genreEmojiDict*/ 6) {
    				each_value = /*unselectedGenres*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$6(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$6(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$a.name,
    		type: "if",
    		source: "(92:2) {#if unselectedGenres.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (96:8) {#each unselectedGenres as genre}
    function create_each_block$6(ctx) {
    	let div;
    	let span1;
    	let span0;
    	let t0_value = /*genreEmojiDict*/ ctx[2][/*genre*/ ctx[7]] + "";
    	let t0;
    	let t1;
    	let t2_value = /*genre*/ ctx[7] + "";
    	let t2;
    	let t3;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[4](/*genre*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			span1 = element("span");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = space();
    			attr_dev(span0, "class", "text-lg mr-1");
    			add_location(span0, file$b, 106, 14, 3187);
    			attr_dev(span1, "id", "badge-dark");
    			attr_dev(span1, "class", "inline-flex items-center px-2 py-1 me-2 text-sm font-medium text-black bg-gray-200 hover:bg-gray-300 rounded");
    			add_location(span1, file$b, 97, 12, 2825);
    			add_location(div, file$b, 96, 10, 2807);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span1);
    			append_dev(span1, span0);
    			append_dev(span0, t0);
    			append_dev(span1, t1);
    			append_dev(span1, t2);
    			append_dev(div, t3);

    			if (!mounted) {
    				dispose = listen_dev(span1, "click", click_handler_1, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*unselectedGenres*/ 2 && t0_value !== (t0_value = /*genreEmojiDict*/ ctx[2][/*genre*/ ctx[7]] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*unselectedGenres*/ 2 && t2_value !== (t2_value = /*genre*/ ctx[7] + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$6.name,
    		type: "each",
    		source: "(96:8) {#each unselectedGenres as genre}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let div;
    	let t;
    	let if_block0 = /*genres*/ ctx[0].length > 0 && create_if_block_1$6(ctx);
    	let if_block1 = /*unselectedGenres*/ ctx[1].length > 0 && create_if_block$a(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div, "class", "genre-menu my-3");
    			add_location(div, file$b, 41, 0, 829);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t);
    			if (if_block1) if_block1.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*genres*/ ctx[0].length > 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$6(ctx);
    					if_block0.c();
    					if_block0.m(div, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*unselectedGenres*/ ctx[1].length > 0) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$a(ctx);
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let unselectedGenres;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('GenreMenu', slots, []);

    	const genreEmojiDict = {
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

    	let allGenres = Object.keys(genreEmojiDict);
    	let genres = [];

    	const unsubscribe = selectedGenres.subscribe(value => {
    		$$invalidate(0, genres = value);
    	});

    	onDestroy(() => {
    		unsubscribe();
    	});

    	const writable_props = [];

    	Object_1$2.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<GenreMenu> was created with unknown prop '${key}'`);
    	});

    	const click_handler = genre => {
    		selectedGenres.update(genres => genres.filter(g => g !== genre));
    	};

    	const click_handler_1 = genre => {
    		selectedGenres.update(genres => genres = [...genres, genre]);
    	};

    	$$self.$capture_state = () => ({
    		selectedGenres,
    		onDestroy,
    		genreEmojiDict,
    		allGenres,
    		genres,
    		unsubscribe,
    		unselectedGenres
    	});

    	$$self.$inject_state = $$props => {
    		if ('allGenres' in $$props) $$invalidate(5, allGenres = $$props.allGenres);
    		if ('genres' in $$props) $$invalidate(0, genres = $$props.genres);
    		if ('unselectedGenres' in $$props) $$invalidate(1, unselectedGenres = $$props.unselectedGenres);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*genres*/ 1) {
    			// Compute unselected genres
    			$$invalidate(1, unselectedGenres = allGenres.filter(genre => !genres.includes(genre)));
    		}
    	};

    	return [genres, unselectedGenres, genreEmojiDict, click_handler, click_handler_1];
    }

    class GenreMenu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GenreMenu",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src/components/SaveMenu.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1$1 } = globals;
    const file$a = "src/components/SaveMenu.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (23:2) {#if verbs.length > 0}
    function create_if_block_1$5(ctx) {
    	let div1;
    	let h6;
    	let t1;
    	let div0;
    	let each_value_1 = /*verbs*/ ctx[0];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$3(get_each_context_1$3(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h6 = element("h6");
    			h6.textContent = "Selected Save Types:";
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h6, "class", "text-lg font-semibold mb-2");
    			add_location(h6, file$a, 24, 6, 563);
    			attr_dev(div0, "class", "flex flex-wrap gap-2 mb-2");
    			add_location(div0, file$a, 25, 6, 634);
    			add_location(div1, file$a, 23, 4, 551);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h6);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div0, null);
    				}
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selectedViewTypeVerbs, verbs, verbEmojiDict*/ 1) {
    				each_value_1 = /*verbs*/ ctx[0];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$3(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$5.name,
    		type: "if",
    		source: "(23:2) {#if verbs.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (27:8) {#each verbs as verb}
    function create_each_block_1$3(ctx) {
    	let div;
    	let span2;
    	let span0;
    	let t0_value = verbEmojiDict[/*verb*/ ctx[6]] + "";
    	let t0;
    	let t1;
    	let t2_value = /*verb*/ ctx[6] + "";
    	let t2;
    	let t3;
    	let button;
    	let svg;
    	let path;
    	let t4;
    	let span1;
    	let t6;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[2](/*verb*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			span2 = element("span");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = space();
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t4 = space();
    			span1 = element("span");
    			span1.textContent = "Remove badge";
    			t6 = space();
    			attr_dev(span0, "class", "text-lg mr-1");
    			add_location(span0, file$a, 37, 14, 1123);
    			attr_dev(path, "stroke", "currentColor");
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "stroke-width", "2");
    			attr_dev(path, "d", "m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6");
    			add_location(path, file$a, 52, 18, 1768);
    			attr_dev(svg, "class", "w-2 h-2");
    			attr_dev(svg, "aria-hidden", "true");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 14 14");
    			add_location(svg, file$a, 45, 16, 1535);
    			attr_dev(span1, "class", "sr-only");
    			add_location(span1, file$a, 60, 16, 2058);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "inline-flex items-center p-1 ms-2 text-sm text-blue-400 bg-transparent rounded-sm group-hover:bg-blue-200 group-hover:text-blue-900 ");
    			attr_dev(button, "data-dismiss-target", "#badge-dismiss-blue");
    			attr_dev(button, "aria-label", "Remove");
    			add_location(button, file$a, 39, 14, 1214);
    			attr_dev(span2, "id", "badge-dismiss-blue");
    			attr_dev(span2, "class", "inline-flex items-center px-2 py-1 me-2 text-sm font-medium text-blue-800 bg-blue-100 rounded cursor-pointer");
    			add_location(span2, file$a, 28, 12, 746);
    			attr_dev(div, "class", "group");
    			add_location(div, file$a, 27, 10, 714);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span2);
    			append_dev(span2, span0);
    			append_dev(span0, t0);
    			append_dev(span2, t1);
    			append_dev(span2, t2);
    			append_dev(span2, t3);
    			append_dev(span2, button);
    			append_dev(button, svg);
    			append_dev(svg, path);
    			append_dev(button, t4);
    			append_dev(button, span1);
    			append_dev(div, t6);

    			if (!mounted) {
    				dispose = listen_dev(span2, "click", click_handler, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*verbs*/ 1 && t0_value !== (t0_value = verbEmojiDict[/*verb*/ ctx[6]] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*verbs*/ 1 && t2_value !== (t2_value = /*verb*/ ctx[6] + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$3.name,
    		type: "each",
    		source: "(27:8) {#each verbs as verb}",
    		ctx
    	});

    	return block;
    }

    // (71:2) {#if unselectedVerbs.length > 0}
    function create_if_block$9(ctx) {
    	let div1;
    	let h6;
    	let t1;
    	let div0;
    	let each_value = /*unselectedVerbs*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h6 = element("h6");
    			h6.textContent = "Available Save Types:";
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h6, "class", "text-lg font-semibold mb-2");
    			add_location(h6, file$a, 72, 6, 2288);
    			attr_dev(div0, "class", "flex flex-wrap gap-2");
    			add_location(div0, file$a, 73, 6, 2360);
    			add_location(div1, file$a, 71, 4, 2276);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h6);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div0, null);
    				}
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selectedViewTypeVerbs, unselectedVerbs, verbEmojiDict*/ 2) {
    				each_value = /*unselectedVerbs*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$9.name,
    		type: "if",
    		source: "(71:2) {#if unselectedVerbs.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (75:8) {#each unselectedVerbs as verb}
    function create_each_block$5(ctx) {
    	let div;
    	let span1;
    	let span0;
    	let t0_value = verbEmojiDict[/*verb*/ ctx[6]] + "";
    	let t0;
    	let t1;
    	let t2_value = /*verb*/ ctx[6] + "";
    	let t2;
    	let t3;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[3](/*verb*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			span1 = element("span");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = space();
    			attr_dev(span0, "class", "text-lg mr-1");
    			add_location(span0, file$a, 83, 14, 2782);
    			attr_dev(span1, "id", "badge-dark");
    			attr_dev(span1, "class", "inline-flex items-center px-2 py-1 me-2 text-sm font-medium text-black bg-gray-200 hover:bg-gray-300 rounded");
    			add_location(span1, file$a, 76, 12, 2463);
    			add_location(div, file$a, 75, 10, 2445);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span1);
    			append_dev(span1, span0);
    			append_dev(span0, t0);
    			append_dev(span1, t1);
    			append_dev(span1, t2);
    			append_dev(div, t3);

    			if (!mounted) {
    				dispose = listen_dev(span1, "click", click_handler_1, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*unselectedVerbs*/ 2 && t0_value !== (t0_value = verbEmojiDict[/*verb*/ ctx[6]] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*unselectedVerbs*/ 2 && t2_value !== (t2_value = /*verb*/ ctx[6] + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(75:8) {#each unselectedVerbs as verb}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div;
    	let t;
    	let if_block0 = /*verbs*/ ctx[0].length > 0 && create_if_block_1$5(ctx);
    	let if_block1 = /*unselectedVerbs*/ ctx[1].length > 0 && create_if_block$9(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div, "class", "genre-menu my-3");
    			add_location(div, file$a, 20, 0, 466);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t);
    			if (if_block1) if_block1.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*verbs*/ ctx[0].length > 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$5(ctx);
    					if_block0.c();
    					if_block0.m(div, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*unselectedVerbs*/ ctx[1].length > 0) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$9(ctx);
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let unselectedVerbs;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SaveMenu', slots, []);
    	let allVerbs = Object.keys(verbEmojiDict);
    	let verbs = [];

    	const unsubscribe = selectedViewTypeVerbs.subscribe(value => {
    		$$invalidate(0, verbs = value);
    	});

    	onDestroy(() => {
    		unsubscribe();
    	});

    	const writable_props = [];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SaveMenu> was created with unknown prop '${key}'`);
    	});

    	const click_handler = verb => {
    		selectedViewTypeVerbs.update(verbs => verbs.filter(v => v !== verb));
    	};

    	const click_handler_1 = verb => {
    		selectedViewTypeVerbs.update(verbs => [...verbs, verb]);
    	};

    	$$self.$capture_state = () => ({
    		selectedViewTypeVerbs,
    		onDestroy,
    		verbEmojiDict,
    		allVerbs,
    		verbs,
    		unsubscribe,
    		unselectedVerbs
    	});

    	$$self.$inject_state = $$props => {
    		if ('allVerbs' in $$props) $$invalidate(4, allVerbs = $$props.allVerbs);
    		if ('verbs' in $$props) $$invalidate(0, verbs = $$props.verbs);
    		if ('unselectedVerbs' in $$props) $$invalidate(1, unselectedVerbs = $$props.unselectedVerbs);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*verbs*/ 1) {
    			// Compute unselected verbs
    			$$invalidate(1, unselectedVerbs = allVerbs.filter(verb => !verbs.includes(verb)));
    		}
    	};

    	return [verbs, unselectedVerbs, click_handler, click_handler_1];
    }

    class SaveMenu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SaveMenu",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    // clickOutside.js
    function clickOutside(node, callback) {
      function handleClick(event) {
        if (!node.contains(event.target)) {
          callback();
        }
      }

      document.addEventListener("click", handleClick, true);

      return {
        destroy() {
          document.removeEventListener("click", handleClick, true);
        }
      };
    }

    /* src/components/LanguageSelect.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1 } = globals;
    const file$9 = "src/components/LanguageSelect.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    // (39:4) {#if $selectedLanguages.length > 0}
    function create_if_block_1$4(ctx) {
    	let div1;
    	let h6;
    	let t1;
    	let div0;
    	let each_value_1 = /*$selectedLanguages*/ ctx[3];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h6 = element("h6");
    			h6.textContent = "Selected Languages:";
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h6, "class", "text-lg font-semibold mb-2");
    			add_location(h6, file$9, 40, 8, 1101);
    			attr_dev(div0, "class", "flex flex-wrap gap-2 mb-2");
    			add_location(div0, file$9, 41, 8, 1173);
    			add_location(div1, file$9, 39, 6, 1087);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h6);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div0, null);
    				}
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selectedLanguages, $selectedLanguages, getLanguageName, getLanguageFlag*/ 8) {
    				each_value_1 = /*$selectedLanguages*/ ctx[3];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(39:4) {#if $selectedLanguages.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (43:10) {#each $selectedLanguages as language}
    function create_each_block_1$2(ctx) {
    	let div;
    	let span2;
    	let span0;
    	let t0_value = getLanguageFlag(/*language*/ ctx[14]) + "";
    	let t0;
    	let t1;
    	let t2_value = getLanguageName(/*language*/ ctx[14]) + "";
    	let t2;
    	let t3;
    	let button;
    	let svg;
    	let path;
    	let t4;
    	let span1;
    	let t6;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[6](/*language*/ ctx[14]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			span2 = element("span");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = space();
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t4 = space();
    			span1 = element("span");
    			span1.textContent = "Remove badge";
    			t6 = space();
    			attr_dev(span0, "class", "text-lg mr-1");
    			add_location(span0, file$9, 53, 16, 1711);
    			attr_dev(path, "stroke", "currentColor");
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "stroke-width", "2");
    			attr_dev(path, "d", "m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6");
    			add_location(path, file$9, 68, 20, 2412);
    			attr_dev(svg, "class", "w-2 h-2");
    			attr_dev(svg, "aria-hidden", "true");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 14 14");
    			add_location(svg, file$9, 61, 18, 2165);
    			attr_dev(span1, "class", "sr-only");
    			add_location(span1, file$9, 76, 18, 2718);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "inline-flex items-center p-1 ms-2 text-sm text-blue-400 bg-transparent rounded-sm group-hover:bg-blue-200 group-hover:text-blue-900");
    			attr_dev(button, "data-dismiss-target", "#badge-dismiss-blue");
    			attr_dev(button, "aria-label", "Remove");
    			add_location(button, file$9, 55, 16, 1833);
    			attr_dev(span2, "id", "badge-dismiss-blue");
    			attr_dev(span2, "class", "inline-flex items-center px-2 py-1 me-2 text-sm font-medium text-blue-800 bg-blue-100 rounded cursor-pointer");
    			add_location(span2, file$9, 44, 14, 1308);
    			attr_dev(div, "class", "group");
    			add_location(div, file$9, 43, 12, 1274);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span2);
    			append_dev(span2, span0);
    			append_dev(span0, t0);
    			append_dev(span2, t1);
    			append_dev(span2, t2);
    			append_dev(span2, t3);
    			append_dev(span2, button);
    			append_dev(button, svg);
    			append_dev(svg, path);
    			append_dev(button, t4);
    			append_dev(button, span1);
    			append_dev(div, t6);

    			if (!mounted) {
    				dispose = listen_dev(span2, "click", click_handler, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*$selectedLanguages*/ 8 && t0_value !== (t0_value = getLanguageFlag(/*language*/ ctx[14]) + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*$selectedLanguages*/ 8 && t2_value !== (t2_value = getLanguageName(/*language*/ ctx[14]) + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(43:10) {#each $selectedLanguages as language}",
    		ctx
    	});

    	return block;
    }

    // (110:2) {#if isDropdownOpen}
    function create_if_block$8(ctx) {
    	let div2;
    	let div1;
    	let label;
    	let t1;
    	let div0;
    	let input;
    	let t2;
    	let ul;
    	let clickOutside_action;
    	let mounted;
    	let dispose;
    	let each_value = /*filteredLanguages*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			label = element("label");
    			label.textContent = "Search";
    			t1 = space();
    			div0 = element("div");
    			input = element("input");
    			t2 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(label, "for", "input-group-search");
    			attr_dev(label, "class", "sr-only");
    			add_location(label, file$9, 116, 8, 3822);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "id", "input-group-search");
    			attr_dev(input, "placeholder", "Search language");
    			attr_dev(input, "class", "block w-full p-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white");
    			attr_dev(input, "autocomplete", "off");
    			add_location(input, file$9, 118, 10, 3909);
    			add_location(div0, file$9, 117, 8, 3893);
    			attr_dev(div1, "class", "p-3");
    			add_location(div1, file$9, 115, 6, 3796);
    			attr_dev(ul, "class", "h-48 px-3 pb-3 overflow-y-auto text-sm text-gray-700 dark:text-gray-200");
    			add_location(ul, file$9, 128, 6, 4346);
    			attr_dev(div2, "class", "absolute z-10 mt-2 w-60 bg-white rounded-lg shadow dark:bg-gray-700");
    			add_location(div2, file$9, 111, 4, 3639);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, label);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*$searchQuery*/ ctx[0]);
    			append_dev(div2, t2);
    			append_dev(div2, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(ul, null);
    				}
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[8]),
    					action_destroyer(clickOutside_action = clickOutside.call(null, div2, /*clickOutside_function*/ ctx[10]))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$searchQuery*/ 1 && input.value !== /*$searchQuery*/ ctx[0]) {
    				set_input_value(input, /*$searchQuery*/ ctx[0]);
    			}

    			if (dirty & /*filteredLanguages, LANGUAGEINFO, $selectedLanguages, toggleLanguageSelection*/ 44) {
    				each_value = /*filteredLanguages*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (clickOutside_action && is_function(clickOutside_action.update) && dirty & /*isDropdownOpen*/ 2) clickOutside_action.update.call(null, /*clickOutside_function*/ ctx[10]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(110:2) {#if isDropdownOpen}",
    		ctx
    	});

    	return block;
    }

    // (132:8) {#each filteredLanguages as languageCode}
    function create_each_block$4(ctx) {
    	let li;
    	let div;
    	let input;
    	let input_id_value;
    	let input_checked_value;
    	let t0;
    	let label;
    	let t1_value = LANGUAGEINFO[/*languageCode*/ ctx[11]].name + "";
    	let t1;
    	let label_for_value;
    	let t2;
    	let mounted;
    	let dispose;

    	function change_handler() {
    		return /*change_handler*/ ctx[9](/*languageCode*/ ctx[11]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			div = element("div");
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(input, "id", input_id_value = "checkbox-" + /*languageCode*/ ctx[11]);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "class", "w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:bg-gray-600 dark:border-gray-500");
    			input.checked = input_checked_value = /*$selectedLanguages*/ ctx[3].includes(/*languageCode*/ ctx[11]);
    			add_location(input, file$9, 136, 14, 4655);
    			attr_dev(label, "for", label_for_value = "checkbox-" + /*languageCode*/ ctx[11]);
    			attr_dev(label, "class", "ml-2 text-sm font-medium text-gray-900 dark:text-gray-300");
    			add_location(label, file$9, 145, 14, 5117);
    			attr_dev(div, "class", "flex items-center px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600");
    			add_location(div, file$9, 133, 12, 4523);
    			add_location(li, file$9, 132, 10, 4506);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div);
    			append_dev(div, input);
    			append_dev(div, t0);
    			append_dev(div, label);
    			append_dev(label, t1);
    			append_dev(li, t2);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", change_handler, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*filteredLanguages*/ 4 && input_id_value !== (input_id_value = "checkbox-" + /*languageCode*/ ctx[11])) {
    				attr_dev(input, "id", input_id_value);
    			}

    			if (dirty & /*$selectedLanguages, filteredLanguages*/ 12 && input_checked_value !== (input_checked_value = /*$selectedLanguages*/ ctx[3].includes(/*languageCode*/ ctx[11]))) {
    				prop_dev(input, "checked", input_checked_value);
    			}

    			if (dirty & /*filteredLanguages*/ 4 && t1_value !== (t1_value = LANGUAGEINFO[/*languageCode*/ ctx[11]].name + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*filteredLanguages*/ 4 && label_for_value !== (label_for_value = "checkbox-" + /*languageCode*/ ctx[11])) {
    				attr_dev(label, "for", label_for_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(132:8) {#each filteredLanguages as languageCode}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let button;
    	let t1;
    	let svg;
    	let path;
    	let t2;
    	let mounted;
    	let dispose;
    	let if_block0 = /*$selectedLanguages*/ ctx[3].length > 0 && create_if_block_1$4(ctx);
    	let if_block1 = /*isDropdownOpen*/ ctx[1] && create_if_block$8(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			button = element("button");
    			t1 = text("Filter By Language\n    ");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t2 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div0, "class", "language-menu my-3");
    			add_location(div0, file$9, 36, 2, 979);
    			attr_dev(path, "stroke", "currentColor");
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "stroke-width", "2");
    			attr_dev(path, "d", "M1 1l4 4 4-4");
    			add_location(path, file$9, 99, 6, 3403);
    			attr_dev(svg, "class", "w-2.5 h-2.5 ml-3");
    			attr_dev(svg, "aria-hidden", "true");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 10 6");
    			add_location(svg, file$9, 92, 4, 3246);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800");
    			add_location(button, file$9, 86, 2, 2895);
    			add_location(div1, file$9, 35, 0, 971);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div1, t0);
    			append_dev(div1, button);
    			append_dev(button, t1);
    			append_dev(button, svg);
    			append_dev(svg, path);
    			append_dev(div1, t2);
    			if (if_block1) if_block1.m(div1, null);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[7], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$selectedLanguages*/ ctx[3].length > 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$4(ctx);
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*isDropdownOpen*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$8(ctx);
    					if_block1.c();
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let filteredLanguages;
    	let $searchQuery;
    	let $selectedLanguages;
    	validate_store(selectedLanguages, 'selectedLanguages');
    	component_subscribe($$self, selectedLanguages, $$value => $$invalidate(3, $selectedLanguages = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('LanguageSelect', slots, []);
    	let isDropdownOpen = false;
    	let searchQuery = writable("");
    	validate_store(searchQuery, 'searchQuery');
    	component_subscribe($$self, searchQuery, value => $$invalidate(0, $searchQuery = value));

    	function toggleLanguageSelection(languageCode) {
    		if ($selectedLanguages.includes(languageCode)) {
    			selectedLanguages.update(languages => languages.filter(lang => lang !== languageCode));
    		} else {
    			selectedLanguages.update(languages => [...languages, languageCode]);
    		}

    		setTimeout(
    			() => {
    				set_store_value(searchQuery, $searchQuery = "", $searchQuery);
    				$$invalidate(1, isDropdownOpen = false);
    			},
    			100
    		);
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<LanguageSelect> was created with unknown prop '${key}'`);
    	});

    	const click_handler = language => {
    		selectedLanguages.update(languages => languages.filter(g => g !== language));
    	};

    	const click_handler_1 = () => $$invalidate(1, isDropdownOpen = !isDropdownOpen);

    	function input_input_handler() {
    		$searchQuery = this.value;
    		searchQuery.set($searchQuery);
    	}

    	const change_handler = languageCode => {
    		toggleLanguageSelection(languageCode);
    	};

    	const clickOutside_function = () => $$invalidate(1, isDropdownOpen = false);

    	$$self.$capture_state = () => ({
    		selectedLanguages,
    		LANGUAGEINFO,
    		getLanguageFlag,
    		getLanguageName,
    		writable,
    		onMount,
    		onDestroy,
    		clickOutside,
    		isDropdownOpen,
    		searchQuery,
    		toggleLanguageSelection,
    		filteredLanguages,
    		$searchQuery,
    		$selectedLanguages
    	});

    	$$self.$inject_state = $$props => {
    		if ('isDropdownOpen' in $$props) $$invalidate(1, isDropdownOpen = $$props.isDropdownOpen);
    		if ('searchQuery' in $$props) $$invalidate(4, searchQuery = $$props.searchQuery);
    		if ('filteredLanguages' in $$props) $$invalidate(2, filteredLanguages = $$props.filteredLanguages);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$searchQuery*/ 1) {
    			$$invalidate(2, filteredLanguages = Object.keys(LANGUAGEINFO).filter(languageCode => LANGUAGEINFO[languageCode].name.toLowerCase().includes($searchQuery.toLowerCase())));
    		}
    	};

    	return [
    		$searchQuery,
    		isDropdownOpen,
    		filteredLanguages,
    		$selectedLanguages,
    		searchQuery,
    		toggleLanguageSelection,
    		click_handler,
    		click_handler_1,
    		input_input_handler,
    		change_handler,
    		clickOutside_function
    	];
    }

    class LanguageSelect extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LanguageSelect",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/components/RangeInput.svelte generated by Svelte v3.59.2 */

    const file$8 = "src/components/RangeInput.svelte";

    // (34:4) {#if bindValueStart != defaultValueStart && defaultValueStart != null}
    function create_if_block_1$3(ctx) {
    	let button;
    	let svg;
    	let path;
    	let button_aria_label_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "d", "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z");
    			attr_dev(path, "clip-rule", "evenodd");
    			add_location(path, file$8, 50, 10, 1884);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "w-5 h-5");
    			attr_dev(svg, "viewBox", "0 0 20 20");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "aria-hidden", "true");
    			add_location(svg, file$8, 43, 8, 1699);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none");
    			attr_dev(button, "aria-label", button_aria_label_value = "Clear " + /*labelStart*/ ctx[3]);
    			add_location(button, file$8, 34, 6, 1372);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, svg);
    			append_dev(svg, path);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[14], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*labelStart*/ 8 && button_aria_label_value !== (button_aria_label_value = "Clear " + /*labelStart*/ ctx[3])) {
    				attr_dev(button, "aria-label", button_aria_label_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(34:4) {#if bindValueStart != defaultValueStart && defaultValueStart != null}",
    		ctx
    	});

    	return block;
    }

    // (79:4) {#if bindValueEnd != defaultValueEnd && defaultValueEnd != null}
    function create_if_block$7(ctx) {
    	let button;
    	let svg;
    	let path;
    	let button_aria_label_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "d", "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z");
    			attr_dev(path, "clip-rule", "evenodd");
    			add_location(path, file$8, 95, 10, 3698);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "w-5 h-5");
    			attr_dev(svg, "viewBox", "0 0 20 20");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "aria-hidden", "true");
    			add_location(svg, file$8, 88, 8, 3513);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none");
    			attr_dev(button, "aria-label", button_aria_label_value = "Clear " + /*labelEnd*/ ctx[4]);
    			add_location(button, file$8, 79, 6, 3196);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, svg);
    			append_dev(svg, path);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[16], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*labelEnd*/ 16 && button_aria_label_value !== (button_aria_label_value = "Clear " + /*labelEnd*/ ctx[4])) {
    				attr_dev(button, "aria-label", button_aria_label_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(79:4) {#if bindValueEnd != defaultValueEnd && defaultValueEnd != null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div2;
    	let div0;
    	let input0;
    	let input0_id_value;
    	let t0;
    	let label0;
    	let t1;
    	let label0_for_value;
    	let t2;
    	let t3;
    	let span;
    	let t5;
    	let div1;
    	let input1;
    	let input1_id_value;
    	let t6;
    	let label1;
    	let t7;
    	let label1_for_value;
    	let t8;
    	let mounted;
    	let dispose;
    	let if_block0 = /*bindValueStart*/ ctx[0] != /*defaultValueStart*/ ctx[5] && /*defaultValueStart*/ ctx[5] != null && create_if_block_1$3(ctx);
    	let if_block1 = /*bindValueEnd*/ ctx[1] != /*defaultValueEnd*/ ctx[6] && /*defaultValueEnd*/ ctx[6] != null && create_if_block$7(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			input0 = element("input");
    			t0 = space();
    			label0 = element("label");
    			t1 = text(/*labelStart*/ ctx[3]);
    			t2 = space();
    			if (if_block0) if_block0.c();
    			t3 = space();
    			span = element("span");
    			span.textContent = "to";
    			t5 = space();
    			div1 = element("div");
    			input1 = element("input");
    			t6 = space();
    			label1 = element("label");
    			t7 = text(/*labelEnd*/ ctx[4]);
    			t8 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(input0, "id", input0_id_value = `${/*id*/ ctx[2]}-start`);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "placeholder", " ");
    			attr_dev(input0, "class", "block w-full px-2.5 pb-1.5 pt-4 text-sm text-gray-900 bg-gray-50 border-0 border-b-2 border-gray-300 rounded-t-lg appearance-none dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-0 focus:border-blue-600 peer pr-8");
    			add_location(input0, file$8, 18, 4, 464);
    			attr_dev(label0, "for", label0_for_value = `${/*id*/ ctx[2]}-start`);
    			attr_dev(label0, "class", "absolute top-3 left-2.5 z-10 text-sm text-gray-500 origin-[0] scale-75 transform -translate-y-3 duration-300 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-blue-600 dark:text-gray-400 dark:peer-focus:text-blue-500");
    			add_location(label0, file$8, 27, 4, 907);
    			attr_dev(div0, "class", "relative w-full");
    			add_location(div0, file$8, 17, 2, 430);
    			attr_dev(span, "class", "text-gray-500");
    			add_location(span, file$8, 60, 2, 2231);
    			attr_dev(input1, "id", input1_id_value = `${/*id*/ ctx[2]}-end`);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "placeholder", " ");
    			attr_dev(input1, "class", "block w-full px-2.5 pb-1.5 pt-4 text-sm text-gray-900 bg-gray-50 border-0 border-b-2 border-gray-300 rounded-t-lg appearance-none dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-0 focus:border-blue-600 peer pr-8");
    			add_location(input1, file$8, 63, 4, 2306);
    			attr_dev(label1, "for", label1_for_value = `${/*id*/ ctx[2]}-end`);
    			attr_dev(label1, "class", "absolute top-3 left-2.5 z-10 text-sm text-gray-500 origin-[0] scale-75 transform -translate-y-3 duration-300 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-blue-600 dark:text-gray-400 dark:peer-focus:text-blue-500");
    			add_location(label1, file$8, 72, 4, 2741);
    			attr_dev(div1, "class", "relative w-full");
    			add_location(div1, file$8, 62, 2, 2272);
    			attr_dev(div2, "class", "flex items-center space-x-4");
    			add_location(div2, file$8, 16, 0, 386);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, input0);
    			set_input_value(input0, /*bindValueStart*/ ctx[0]);
    			append_dev(div0, t0);
    			append_dev(div0, label0);
    			append_dev(label0, t1);
    			append_dev(div0, t2);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div2, t3);
    			append_dev(div2, span);
    			append_dev(div2, t5);
    			append_dev(div2, div1);
    			append_dev(div1, input1);
    			set_input_value(input1, /*bindValueEnd*/ ctx[1]);
    			append_dev(div1, t6);
    			append_dev(div1, label1);
    			append_dev(label1, t7);
    			append_dev(div1, t8);
    			if (if_block1) if_block1.m(div1, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[13]),
    					listen_dev(
    						input0,
    						"blur",
    						function () {
    							if (is_function(/*onBlurStart*/ ctx[7])) /*onBlurStart*/ ctx[7].apply(this, arguments);
    						},
    						false,
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						input0,
    						"keydown",
    						function () {
    							if (is_function(/*onKeydownStart*/ ctx[9])) /*onKeydownStart*/ ctx[9].apply(this, arguments);
    						},
    						false,
    						false,
    						false,
    						false
    					),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[15]),
    					listen_dev(
    						input1,
    						"blur",
    						function () {
    							if (is_function(/*onBlurEnd*/ ctx[8])) /*onBlurEnd*/ ctx[8].apply(this, arguments);
    						},
    						false,
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						input1,
    						"keydown",
    						function () {
    							if (is_function(/*onKeydownEnd*/ ctx[10])) /*onKeydownEnd*/ ctx[10].apply(this, arguments);
    						},
    						false,
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*id*/ 4 && input0_id_value !== (input0_id_value = `${/*id*/ ctx[2]}-start`)) {
    				attr_dev(input0, "id", input0_id_value);
    			}

    			if (dirty & /*bindValueStart*/ 1 && to_number(input0.value) !== /*bindValueStart*/ ctx[0]) {
    				set_input_value(input0, /*bindValueStart*/ ctx[0]);
    			}

    			if (dirty & /*labelStart*/ 8) set_data_dev(t1, /*labelStart*/ ctx[3]);

    			if (dirty & /*id*/ 4 && label0_for_value !== (label0_for_value = `${/*id*/ ctx[2]}-start`)) {
    				attr_dev(label0, "for", label0_for_value);
    			}

    			if (/*bindValueStart*/ ctx[0] != /*defaultValueStart*/ ctx[5] && /*defaultValueStart*/ ctx[5] != null) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$3(ctx);
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*id*/ 4 && input1_id_value !== (input1_id_value = `${/*id*/ ctx[2]}-end`)) {
    				attr_dev(input1, "id", input1_id_value);
    			}

    			if (dirty & /*bindValueEnd*/ 2 && to_number(input1.value) !== /*bindValueEnd*/ ctx[1]) {
    				set_input_value(input1, /*bindValueEnd*/ ctx[1]);
    			}

    			if (dirty & /*labelEnd*/ 16) set_data_dev(t7, /*labelEnd*/ ctx[4]);

    			if (dirty & /*id*/ 4 && label1_for_value !== (label1_for_value = `${/*id*/ ctx[2]}-end`)) {
    				attr_dev(label1, "for", label1_for_value);
    			}

    			if (/*bindValueEnd*/ ctx[1] != /*defaultValueEnd*/ ctx[6] && /*defaultValueEnd*/ ctx[6] != null) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$7(ctx);
    					if_block1.c();
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('RangeInput', slots, []);
    	let { id = "" } = $$props;
    	let { labelStart = "" } = $$props;
    	let { labelEnd = "" } = $$props;
    	let { bindValueStart } = $$props;
    	let { bindValueEnd } = $$props;
    	let { defaultValueStart = "" } = $$props;
    	let { defaultValueEnd = "" } = $$props;
    	let { onBlurStart } = $$props;
    	let { onBlurEnd } = $$props;
    	let { onKeydownStart } = $$props;
    	let { onKeydownEnd } = $$props;
    	let { onClearStart } = $$props;
    	let { onClearEnd } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (bindValueStart === undefined && !('bindValueStart' in $$props || $$self.$$.bound[$$self.$$.props['bindValueStart']])) {
    			console.warn("<RangeInput> was created without expected prop 'bindValueStart'");
    		}

    		if (bindValueEnd === undefined && !('bindValueEnd' in $$props || $$self.$$.bound[$$self.$$.props['bindValueEnd']])) {
    			console.warn("<RangeInput> was created without expected prop 'bindValueEnd'");
    		}

    		if (onBlurStart === undefined && !('onBlurStart' in $$props || $$self.$$.bound[$$self.$$.props['onBlurStart']])) {
    			console.warn("<RangeInput> was created without expected prop 'onBlurStart'");
    		}

    		if (onBlurEnd === undefined && !('onBlurEnd' in $$props || $$self.$$.bound[$$self.$$.props['onBlurEnd']])) {
    			console.warn("<RangeInput> was created without expected prop 'onBlurEnd'");
    		}

    		if (onKeydownStart === undefined && !('onKeydownStart' in $$props || $$self.$$.bound[$$self.$$.props['onKeydownStart']])) {
    			console.warn("<RangeInput> was created without expected prop 'onKeydownStart'");
    		}

    		if (onKeydownEnd === undefined && !('onKeydownEnd' in $$props || $$self.$$.bound[$$self.$$.props['onKeydownEnd']])) {
    			console.warn("<RangeInput> was created without expected prop 'onKeydownEnd'");
    		}

    		if (onClearStart === undefined && !('onClearStart' in $$props || $$self.$$.bound[$$self.$$.props['onClearStart']])) {
    			console.warn("<RangeInput> was created without expected prop 'onClearStart'");
    		}

    		if (onClearEnd === undefined && !('onClearEnd' in $$props || $$self.$$.bound[$$self.$$.props['onClearEnd']])) {
    			console.warn("<RangeInput> was created without expected prop 'onClearEnd'");
    		}
    	});

    	const writable_props = [
    		'id',
    		'labelStart',
    		'labelEnd',
    		'bindValueStart',
    		'bindValueEnd',
    		'defaultValueStart',
    		'defaultValueEnd',
    		'onBlurStart',
    		'onBlurEnd',
    		'onKeydownStart',
    		'onKeydownEnd',
    		'onClearStart',
    		'onClearEnd'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<RangeInput> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		bindValueStart = to_number(this.value);
    		$$invalidate(0, bindValueStart);
    	}

    	const click_handler = () => {
    		$$invalidate(0, bindValueStart = defaultValueStart);
    		if (onClearStart) onClearStart();
    	};

    	function input1_input_handler() {
    		bindValueEnd = to_number(this.value);
    		$$invalidate(1, bindValueEnd);
    	}

    	const click_handler_1 = () => {
    		$$invalidate(1, bindValueEnd = defaultValueEnd);
    		if (onClearEnd) onClearEnd();
    	};

    	$$self.$$set = $$props => {
    		if ('id' in $$props) $$invalidate(2, id = $$props.id);
    		if ('labelStart' in $$props) $$invalidate(3, labelStart = $$props.labelStart);
    		if ('labelEnd' in $$props) $$invalidate(4, labelEnd = $$props.labelEnd);
    		if ('bindValueStart' in $$props) $$invalidate(0, bindValueStart = $$props.bindValueStart);
    		if ('bindValueEnd' in $$props) $$invalidate(1, bindValueEnd = $$props.bindValueEnd);
    		if ('defaultValueStart' in $$props) $$invalidate(5, defaultValueStart = $$props.defaultValueStart);
    		if ('defaultValueEnd' in $$props) $$invalidate(6, defaultValueEnd = $$props.defaultValueEnd);
    		if ('onBlurStart' in $$props) $$invalidate(7, onBlurStart = $$props.onBlurStart);
    		if ('onBlurEnd' in $$props) $$invalidate(8, onBlurEnd = $$props.onBlurEnd);
    		if ('onKeydownStart' in $$props) $$invalidate(9, onKeydownStart = $$props.onKeydownStart);
    		if ('onKeydownEnd' in $$props) $$invalidate(10, onKeydownEnd = $$props.onKeydownEnd);
    		if ('onClearStart' in $$props) $$invalidate(11, onClearStart = $$props.onClearStart);
    		if ('onClearEnd' in $$props) $$invalidate(12, onClearEnd = $$props.onClearEnd);
    	};

    	$$self.$capture_state = () => ({
    		id,
    		labelStart,
    		labelEnd,
    		bindValueStart,
    		bindValueEnd,
    		defaultValueStart,
    		defaultValueEnd,
    		onBlurStart,
    		onBlurEnd,
    		onKeydownStart,
    		onKeydownEnd,
    		onClearStart,
    		onClearEnd
    	});

    	$$self.$inject_state = $$props => {
    		if ('id' in $$props) $$invalidate(2, id = $$props.id);
    		if ('labelStart' in $$props) $$invalidate(3, labelStart = $$props.labelStart);
    		if ('labelEnd' in $$props) $$invalidate(4, labelEnd = $$props.labelEnd);
    		if ('bindValueStart' in $$props) $$invalidate(0, bindValueStart = $$props.bindValueStart);
    		if ('bindValueEnd' in $$props) $$invalidate(1, bindValueEnd = $$props.bindValueEnd);
    		if ('defaultValueStart' in $$props) $$invalidate(5, defaultValueStart = $$props.defaultValueStart);
    		if ('defaultValueEnd' in $$props) $$invalidate(6, defaultValueEnd = $$props.defaultValueEnd);
    		if ('onBlurStart' in $$props) $$invalidate(7, onBlurStart = $$props.onBlurStart);
    		if ('onBlurEnd' in $$props) $$invalidate(8, onBlurEnd = $$props.onBlurEnd);
    		if ('onKeydownStart' in $$props) $$invalidate(9, onKeydownStart = $$props.onKeydownStart);
    		if ('onKeydownEnd' in $$props) $$invalidate(10, onKeydownEnd = $$props.onKeydownEnd);
    		if ('onClearStart' in $$props) $$invalidate(11, onClearStart = $$props.onClearStart);
    		if ('onClearEnd' in $$props) $$invalidate(12, onClearEnd = $$props.onClearEnd);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		bindValueStart,
    		bindValueEnd,
    		id,
    		labelStart,
    		labelEnd,
    		defaultValueStart,
    		defaultValueEnd,
    		onBlurStart,
    		onBlurEnd,
    		onKeydownStart,
    		onKeydownEnd,
    		onClearStart,
    		onClearEnd,
    		input0_input_handler,
    		click_handler,
    		input1_input_handler,
    		click_handler_1
    	];
    }

    class RangeInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			id: 2,
    			labelStart: 3,
    			labelEnd: 4,
    			bindValueStart: 0,
    			bindValueEnd: 1,
    			defaultValueStart: 5,
    			defaultValueEnd: 6,
    			onBlurStart: 7,
    			onBlurEnd: 8,
    			onKeydownStart: 9,
    			onKeydownEnd: 10,
    			onClearStart: 11,
    			onClearEnd: 12
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RangeInput",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get id() {
    		throw new Error("<RangeInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<RangeInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelStart() {
    		throw new Error("<RangeInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelStart(value) {
    		throw new Error("<RangeInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelEnd() {
    		throw new Error("<RangeInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelEnd(value) {
    		throw new Error("<RangeInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bindValueStart() {
    		throw new Error("<RangeInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bindValueStart(value) {
    		throw new Error("<RangeInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bindValueEnd() {
    		throw new Error("<RangeInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bindValueEnd(value) {
    		throw new Error("<RangeInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get defaultValueStart() {
    		throw new Error("<RangeInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set defaultValueStart(value) {
    		throw new Error("<RangeInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get defaultValueEnd() {
    		throw new Error("<RangeInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set defaultValueEnd(value) {
    		throw new Error("<RangeInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onBlurStart() {
    		throw new Error("<RangeInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onBlurStart(value) {
    		throw new Error("<RangeInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onBlurEnd() {
    		throw new Error("<RangeInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onBlurEnd(value) {
    		throw new Error("<RangeInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onKeydownStart() {
    		throw new Error("<RangeInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onKeydownStart(value) {
    		throw new Error("<RangeInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onKeydownEnd() {
    		throw new Error("<RangeInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onKeydownEnd(value) {
    		throw new Error("<RangeInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onClearStart() {
    		throw new Error("<RangeInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onClearStart(value) {
    		throw new Error("<RangeInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onClearEnd() {
    		throw new Error("<RangeInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onClearEnd(value) {
    		throw new Error("<RangeInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/SelectedPersonCard.svelte generated by Svelte v3.59.2 */
    const file$7 = "src/components/SelectedPersonCard.svelte";

    // (7:4) {#if person && person.id}
    function create_if_block$6(ctx) {
    	let div0;
    	let t1;
    	let div2;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t2;
    	let div1;
    	let p0;
    	let t3_value = /*person*/ ctx[0].data.name + "";
    	let t3;
    	let t4;
    	let p1;
    	let t5;
    	let t6_value = /*person*/ ctx[0].data.known_for_department + "";
    	let t6;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div0.textContent = "Movies with:";
    			t1 = space();
    			div2 = element("div");
    			img = element("img");
    			t2 = space();
    			div1 = element("div");
    			p0 = element("p");
    			t3 = text(t3_value);
    			t4 = space();
    			p1 = element("p");
    			t5 = text("Known for: ");
    			t6 = text(t6_value);
    			add_location(div0, file$7, 7, 6, 159);

    			if (!src_url_equal(img.src, img_src_value = /*person*/ ctx[0].data.profile_path
    			? "https://image.tmdb.org/t/p/w185" + /*person*/ ctx[0].data.profile_path
    			: "https://via.placeholder.com/48")) attr_dev(img, "src", img_src_value);

    			attr_dev(img, "alt", img_alt_value = /*person*/ ctx[0].data.name);
    			attr_dev(img, "class", "rounded-full object-cover");
    			set_style(img, "width", "96px");
    			set_style(img, "height", "96px");
    			add_location(img, file$7, 9, 8, 265);
    			attr_dev(p0, "class", "text-sm font-semibold");
    			add_location(p0, file$7, 18, 10, 603);
    			attr_dev(p1, "class", "text-xs text-gray-500");
    			add_location(p1, file$7, 21, 10, 693);
    			attr_dev(div1, "class", "ml-2");
    			add_location(div1, file$7, 17, 8, 574);
    			attr_dev(div2, "class", "flex items-center p-2 items-center profile-container");
    			add_location(div2, file$7, 8, 6, 190);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, img);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, p0);
    			append_dev(p0, t3);
    			append_dev(div1, t4);
    			append_dev(div1, p1);
    			append_dev(p1, t5);
    			append_dev(p1, t6);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*person*/ 1 && !src_url_equal(img.src, img_src_value = /*person*/ ctx[0].data.profile_path
    			? "https://image.tmdb.org/t/p/w185" + /*person*/ ctx[0].data.profile_path
    			: "https://via.placeholder.com/48")) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*person*/ 1 && img_alt_value !== (img_alt_value = /*person*/ ctx[0].data.name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*person*/ 1 && t3_value !== (t3_value = /*person*/ ctx[0].data.name + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*person*/ 1 && t6_value !== (t6_value = /*person*/ ctx[0].data.known_for_department + "")) set_data_dev(t6, t6_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(7:4) {#if person && person.id}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div;
    	let if_block = /*person*/ ctx[0] && /*person*/ ctx[0].id && create_if_block$6(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "card");
    			add_location(div, file$7, 5, 0, 104);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*person*/ ctx[0] && /*person*/ ctx[0].id) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$6(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let person;
    	let $selectedPerson;
    	validate_store(selectedPerson, 'selectedPerson');
    	component_subscribe($$self, selectedPerson, $$value => $$invalidate(1, $selectedPerson = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SelectedPersonCard', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SelectedPersonCard> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ selectedPerson, person, $selectedPerson });

    	$$self.$inject_state = $$props => {
    		if ('person' in $$props) $$invalidate(0, person = $$props.person);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$selectedPerson*/ 2) {
    			$$invalidate(0, person = $selectedPerson);
    		}
    	};

    	return [person, $selectedPerson];
    }

    class SelectedPersonCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SelectedPersonCard",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/components/Header.svelte generated by Svelte v3.59.2 */
    const file$6 = "src/components/Header.svelte";

    // (81:12) {:else}
    function create_else_block$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("No movies!");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(81:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (79:12) {#if $movieCount > 0}
    function create_if_block$5(ctx) {
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text(/*$movieCount*/ ctx[0]);
    			t1 = text(" movies!");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$movieCount*/ 1) set_data_dev(t0, /*$movieCount*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(79:12) {#if $movieCount > 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div17;
    	let div16;
    	let div15;
    	let h5;
    	let t1;
    	let div1;
    	let div0;
    	let h3;
    	let t2;
    	let button;
    	let t4;
    	let form;
    	let div2;
    	let selectedperoncard;
    	let t5;
    	let div3;
    	let inputwithclear0;
    	let updating_bindValue;
    	let t6;
    	let div4;
    	let inputwithclear1;
    	let updating_bindValue_1;
    	let t7;
    	let div5;
    	let inputwithclear2;
    	let updating_bindValue_2;
    	let t8;
    	let div6;
    	let inputwithclear3;
    	let updating_bindValue_3;
    	let t9;
    	let div7;
    	let inputwithclear4;
    	let updating_bindValue_4;
    	let t10;
    	let div8;
    	let inputwithclear5;
    	let updating_bindValue_5;
    	let t11;
    	let div9;
    	let inputwithclear6;
    	let updating_bindValue_6;
    	let t12;
    	let div10;
    	let inputwithclear7;
    	let updating_bindValue_7;
    	let t13;
    	let div11;
    	let inputwithclear8;
    	let updating_bindValue_8;
    	let t14;
    	let div12;
    	let languageselect;
    	let t15;
    	let div13;
    	let genremenu;
    	let t16;
    	let div14;
    	let savemenu;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*$movieCount*/ ctx[0] > 0) return create_if_block$5;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);
    	selectedperoncard = new SelectedPersonCard({ $$inline: true });

    	function inputwithclear0_bindValue_binding(value) {
    		/*inputwithclear0_bindValue_binding*/ ctx[14](value);
    	}

    	let inputwithclear0_props = {
    		id: "person-input",
    		label: "Person",
    		defaultValue: "",
    		onBlur: /*func*/ ctx[12],
    		onKeydown: handleKeydown,
    		onClear: /*func_1*/ ctx[13]
    	};

    	if (/*$currentSelectedPerson*/ ctx[1].name !== void 0) {
    		inputwithclear0_props.bindValue = /*$currentSelectedPerson*/ ctx[1].name;
    	}

    	inputwithclear0 = new InputWithClear({
    			props: inputwithclear0_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind$1(inputwithclear0, 'bindValue', inputwithclear0_bindValue_binding));

    	function inputwithclear1_bindValue_binding(value) {
    		/*inputwithclear1_bindValue_binding*/ ctx[17](value);
    	}

    	let inputwithclear1_props = {
    		id: "title-input",
    		label: "Title",
    		defaultValue: /*$selectedTitle*/ ctx[3] !== DEFAULT_TITLE
    		? "show_clear"
    		: null,
    		onBlur: /*func_2*/ ctx[15],
    		onKeydown: handleKeydown,
    		onClear: /*func_3*/ ctx[16]
    	};

    	if (/*$currentSelectedTitle*/ ctx[2] !== void 0) {
    		inputwithclear1_props.bindValue = /*$currentSelectedTitle*/ ctx[2];
    	}

    	inputwithclear1 = new InputWithClear({
    			props: inputwithclear1_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind$1(inputwithclear1, 'bindValue', inputwithclear1_bindValue_binding));

    	function inputwithclear2_bindValue_binding(value) {
    		/*inputwithclear2_bindValue_binding*/ ctx[19](value);
    	}

    	let inputwithclear2_props = {
    		id: "year-input",
    		label: "Year",
    		defaultValue: null,
    		onBlur: /*func_4*/ ctx[18],
    		onKeydown: handleKeydown,
    		onClear: null
    	};

    	if (/*$currentMinYear*/ ctx[4] !== void 0) {
    		inputwithclear2_props.bindValue = /*$currentMinYear*/ ctx[4];
    	}

    	inputwithclear2 = new InputWithClear({
    			props: inputwithclear2_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind$1(inputwithclear2, 'bindValue', inputwithclear2_bindValue_binding));

    	function inputwithclear3_bindValue_binding(value) {
    		/*inputwithclear3_bindValue_binding*/ ctx[22](value);
    	}

    	let inputwithclear3_props = {
    		id: "min-review-input",
    		label: "Min Reviews",
    		defaultValue: DEFAULT_MIN_REVIEWS,
    		onBlur: /*func_5*/ ctx[20],
    		onKeydown: handleKeydown,
    		onClear: /*func_6*/ ctx[21]
    	};

    	if (/*$currentMinReviewCount*/ ctx[5] !== void 0) {
    		inputwithclear3_props.bindValue = /*$currentMinReviewCount*/ ctx[5];
    	}

    	inputwithclear3 = new InputWithClear({
    			props: inputwithclear3_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind$1(inputwithclear3, 'bindValue', inputwithclear3_bindValue_binding));

    	function inputwithclear4_bindValue_binding(value) {
    		/*inputwithclear4_bindValue_binding*/ ctx[25](value);
    	}

    	let inputwithclear4_props = {
    		id: "max-review-input",
    		label: "Max Reviews",
    		defaultValue: DEFAULT_MAX_REVIEWS,
    		onBlur: /*func_7*/ ctx[23],
    		onKeydown: handleKeydown,
    		onClear: /*func_8*/ ctx[24]
    	};

    	if (/*$currentMaxReviewCount*/ ctx[6] !== void 0) {
    		inputwithclear4_props.bindValue = /*$currentMaxReviewCount*/ ctx[6];
    	}

    	inputwithclear4 = new InputWithClear({
    			props: inputwithclear4_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind$1(inputwithclear4, 'bindValue', inputwithclear4_bindValue_binding));

    	function inputwithclear5_bindValue_binding(value) {
    		/*inputwithclear5_bindValue_binding*/ ctx[27](value);
    	}

    	let inputwithclear5_props = {
    		id: "min-runtime-input",
    		label: "Min Runtime",
    		defaultValue: null,
    		onBlur: /*func_9*/ ctx[26],
    		onKeydown: handleKeydown,
    		onClear: null
    	};

    	if (/*$currentMinRuntime*/ ctx[7] !== void 0) {
    		inputwithclear5_props.bindValue = /*$currentMinRuntime*/ ctx[7];
    	}

    	inputwithclear5 = new InputWithClear({
    			props: inputwithclear5_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind$1(inputwithclear5, 'bindValue', inputwithclear5_bindValue_binding));

    	function inputwithclear6_bindValue_binding(value) {
    		/*inputwithclear6_bindValue_binding*/ ctx[29](value);
    	}

    	let inputwithclear6_props = {
    		id: "max-runtime-input",
    		label: "Max Runtime",
    		defaultValue: null,
    		onBlur: /*func_10*/ ctx[28],
    		onKeydown: handleKeydown,
    		onClear: null
    	};

    	if (/*$currentMaxRuntime*/ ctx[8] !== void 0) {
    		inputwithclear6_props.bindValue = /*$currentMaxRuntime*/ ctx[8];
    	}

    	inputwithclear6 = new InputWithClear({
    			props: inputwithclear6_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind$1(inputwithclear6, 'bindValue', inputwithclear6_bindValue_binding));

    	function inputwithclear7_bindValue_binding(value) {
    		/*inputwithclear7_bindValue_binding*/ ctx[31](value);
    	}

    	let inputwithclear7_props = {
    		id: "min-vote-average-input",
    		label: "Min Vote Average",
    		defaultValue: null,
    		onBlur: /*func_11*/ ctx[30],
    		onKeydown: handleKeydown,
    		onClear: null
    	};

    	if (/*$currentMinVoteAverage*/ ctx[9] !== void 0) {
    		inputwithclear7_props.bindValue = /*$currentMinVoteAverage*/ ctx[9];
    	}

    	inputwithclear7 = new InputWithClear({
    			props: inputwithclear7_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind$1(inputwithclear7, 'bindValue', inputwithclear7_bindValue_binding));

    	function inputwithclear8_bindValue_binding(value) {
    		/*inputwithclear8_bindValue_binding*/ ctx[33](value);
    	}

    	let inputwithclear8_props = {
    		id: "max-vote-average-input",
    		label: "Max Vote Average",
    		defaultValue: null,
    		onBlur: /*func_12*/ ctx[32],
    		onKeydown: handleKeydown,
    		onClear: null
    	};

    	if (/*$currentMaxVoteAverage*/ ctx[10] !== void 0) {
    		inputwithclear8_props.bindValue = /*$currentMaxVoteAverage*/ ctx[10];
    	}

    	inputwithclear8 = new InputWithClear({
    			props: inputwithclear8_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind$1(inputwithclear8, 'bindValue', inputwithclear8_bindValue_binding));
    	languageselect = new LanguageSelect({ $$inline: true });
    	genremenu = new GenreMenu({ $$inline: true });
    	savemenu = new SaveMenu({ $$inline: true });

    	const block = {
    		c: function create() {
    			div17 = element("div");
    			div16 = element("div");
    			div15 = element("div");
    			h5 = element("h5");
    			h5.textContent = "Filter Options";
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			h3 = element("h3");
    			if_block.c();
    			t2 = space();
    			button = element("button");
    			button.textContent = "Reset Filters";
    			t4 = space();
    			form = element("form");
    			div2 = element("div");
    			create_component(selectedperoncard.$$.fragment);
    			t5 = space();
    			div3 = element("div");
    			create_component(inputwithclear0.$$.fragment);
    			t6 = space();
    			div4 = element("div");
    			create_component(inputwithclear1.$$.fragment);
    			t7 = space();
    			div5 = element("div");
    			create_component(inputwithclear2.$$.fragment);
    			t8 = space();
    			div6 = element("div");
    			create_component(inputwithclear3.$$.fragment);
    			t9 = space();
    			div7 = element("div");
    			create_component(inputwithclear4.$$.fragment);
    			t10 = space();
    			div8 = element("div");
    			create_component(inputwithclear5.$$.fragment);
    			t11 = space();
    			div9 = element("div");
    			create_component(inputwithclear6.$$.fragment);
    			t12 = space();
    			div10 = element("div");
    			create_component(inputwithclear7.$$.fragment);
    			t13 = space();
    			div11 = element("div");
    			create_component(inputwithclear8.$$.fragment);
    			t14 = space();
    			div12 = element("div");
    			create_component(languageselect.$$.fragment);
    			t15 = space();
    			div13 = element("div");
    			create_component(genremenu.$$.fragment);
    			t16 = space();
    			div14 = element("div");
    			create_component(savemenu.$$.fragment);
    			attr_dev(h5, "class", "text-xl font-bold");
    			add_location(h5, file$6, 73, 6, 2049);
    			attr_dev(h3, "class", "font-semibold");
    			add_location(h3, file$6, 77, 10, 2219);
    			attr_dev(div0, "class", "mt-6 text-center");
    			add_location(div0, file$6, 76, 8, 2178);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "btn btn-primary mt-2");
    			add_location(button, file$6, 86, 8, 2419);
    			attr_dev(div1, "class", "flex justify-between");
    			add_location(div1, file$6, 75, 6, 2135);
    			add_location(div2, file$6, 97, 8, 2670);
    			add_location(div3, file$6, 100, 8, 2749);
    			attr_dev(div4, "class", "form-control");
    			add_location(div4, file$6, 125, 8, 3473);
    			attr_dev(div5, "class", "form-control");
    			add_location(div5, file$6, 143, 8, 4052);
    			add_location(div6, file$6, 156, 8, 4427);
    			attr_dev(div7, "class", "form-control");
    			add_location(div7, file$6, 172, 8, 4955);
    			attr_dev(div8, "class", "form-control");
    			add_location(div8, file$6, 198, 8, 5812);
    			attr_dev(div9, "class", "form-control");
    			add_location(div9, file$6, 211, 8, 6202);
    			attr_dev(div10, "class", "form-control");
    			add_location(div10, file$6, 224, 8, 6597);
    			attr_dev(div11, "class", "form-control");
    			add_location(div11, file$6, 237, 8, 7010);
    			add_location(div12, file$6, 249, 8, 7389);
    			add_location(div13, file$6, 254, 8, 7491);
    			add_location(div14, file$6, 259, 8, 7572);
    			attr_dev(form, "class", "space-y-4");
    			add_location(form, file$6, 94, 6, 2595);
    			attr_dev(div15, "class", "card-body svelte-o2b4kb");
    			add_location(div15, file$6, 72, 4, 2019);
    			attr_dev(div16, "class", "card w-80 bg-base-200 shadow-xl m-6");
    			add_location(div16, file$6, 71, 2, 1965);
    			attr_dev(div17, "class", "h-screen overflow-y-auto custom-scrollbar svelte-o2b4kb");
    			add_location(div17, file$6, 70, 0, 1907);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div17, anchor);
    			append_dev(div17, div16);
    			append_dev(div16, div15);
    			append_dev(div15, h5);
    			append_dev(div15, t1);
    			append_dev(div15, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h3);
    			if_block.m(h3, null);
    			append_dev(div1, t2);
    			append_dev(div1, button);
    			append_dev(div15, t4);
    			append_dev(div15, form);
    			append_dev(form, div2);
    			mount_component(selectedperoncard, div2, null);
    			append_dev(form, t5);
    			append_dev(form, div3);
    			mount_component(inputwithclear0, div3, null);
    			append_dev(form, t6);
    			append_dev(form, div4);
    			mount_component(inputwithclear1, div4, null);
    			append_dev(form, t7);
    			append_dev(form, div5);
    			mount_component(inputwithclear2, div5, null);
    			append_dev(form, t8);
    			append_dev(form, div6);
    			mount_component(inputwithclear3, div6, null);
    			append_dev(form, t9);
    			append_dev(form, div7);
    			mount_component(inputwithclear4, div7, null);
    			append_dev(form, t10);
    			append_dev(form, div8);
    			mount_component(inputwithclear5, div8, null);
    			append_dev(form, t11);
    			append_dev(form, div9);
    			mount_component(inputwithclear6, div9, null);
    			append_dev(form, t12);
    			append_dev(form, div10);
    			mount_component(inputwithclear7, div10, null);
    			append_dev(form, t13);
    			append_dev(form, div11);
    			mount_component(inputwithclear8, div11, null);
    			append_dev(form, t14);
    			append_dev(form, div12);
    			mount_component(languageselect, div12, null);
    			append_dev(form, t15);
    			append_dev(form, div13);
    			mount_component(genremenu, div13, null);
    			append_dev(form, t16);
    			append_dev(form, div14);
    			mount_component(savemenu, div14, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*resetFilters*/ ctx[11], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(h3, null);
    				}
    			}

    			const inputwithclear0_changes = {};

    			if (!updating_bindValue && dirty[0] & /*$currentSelectedPerson*/ 2) {
    				updating_bindValue = true;
    				inputwithclear0_changes.bindValue = /*$currentSelectedPerson*/ ctx[1].name;
    				add_flush_callback(() => updating_bindValue = false);
    			}

    			inputwithclear0.$set(inputwithclear0_changes);
    			const inputwithclear1_changes = {};

    			if (dirty[0] & /*$selectedTitle*/ 8) inputwithclear1_changes.defaultValue = /*$selectedTitle*/ ctx[3] !== DEFAULT_TITLE
    			? "show_clear"
    			: null;

    			if (dirty[0] & /*$currentSelectedTitle*/ 4) inputwithclear1_changes.onClear = /*func_3*/ ctx[16];

    			if (!updating_bindValue_1 && dirty[0] & /*$currentSelectedTitle*/ 4) {
    				updating_bindValue_1 = true;
    				inputwithclear1_changes.bindValue = /*$currentSelectedTitle*/ ctx[2];
    				add_flush_callback(() => updating_bindValue_1 = false);
    			}

    			inputwithclear1.$set(inputwithclear1_changes);
    			const inputwithclear2_changes = {};

    			if (!updating_bindValue_2 && dirty[0] & /*$currentMinYear*/ 16) {
    				updating_bindValue_2 = true;
    				inputwithclear2_changes.bindValue = /*$currentMinYear*/ ctx[4];
    				add_flush_callback(() => updating_bindValue_2 = false);
    			}

    			inputwithclear2.$set(inputwithclear2_changes);
    			const inputwithclear3_changes = {};
    			if (dirty[0] & /*$currentMinReviewCount*/ 32) inputwithclear3_changes.onClear = /*func_6*/ ctx[21];

    			if (!updating_bindValue_3 && dirty[0] & /*$currentMinReviewCount*/ 32) {
    				updating_bindValue_3 = true;
    				inputwithclear3_changes.bindValue = /*$currentMinReviewCount*/ ctx[5];
    				add_flush_callback(() => updating_bindValue_3 = false);
    			}

    			inputwithclear3.$set(inputwithclear3_changes);
    			const inputwithclear4_changes = {};
    			if (dirty[0] & /*$currentMaxReviewCount*/ 64) inputwithclear4_changes.onClear = /*func_8*/ ctx[24];

    			if (!updating_bindValue_4 && dirty[0] & /*$currentMaxReviewCount*/ 64) {
    				updating_bindValue_4 = true;
    				inputwithclear4_changes.bindValue = /*$currentMaxReviewCount*/ ctx[6];
    				add_flush_callback(() => updating_bindValue_4 = false);
    			}

    			inputwithclear4.$set(inputwithclear4_changes);
    			const inputwithclear5_changes = {};

    			if (!updating_bindValue_5 && dirty[0] & /*$currentMinRuntime*/ 128) {
    				updating_bindValue_5 = true;
    				inputwithclear5_changes.bindValue = /*$currentMinRuntime*/ ctx[7];
    				add_flush_callback(() => updating_bindValue_5 = false);
    			}

    			inputwithclear5.$set(inputwithclear5_changes);
    			const inputwithclear6_changes = {};

    			if (!updating_bindValue_6 && dirty[0] & /*$currentMaxRuntime*/ 256) {
    				updating_bindValue_6 = true;
    				inputwithclear6_changes.bindValue = /*$currentMaxRuntime*/ ctx[8];
    				add_flush_callback(() => updating_bindValue_6 = false);
    			}

    			inputwithclear6.$set(inputwithclear6_changes);
    			const inputwithclear7_changes = {};

    			if (!updating_bindValue_7 && dirty[0] & /*$currentMinVoteAverage*/ 512) {
    				updating_bindValue_7 = true;
    				inputwithclear7_changes.bindValue = /*$currentMinVoteAverage*/ ctx[9];
    				add_flush_callback(() => updating_bindValue_7 = false);
    			}

    			inputwithclear7.$set(inputwithclear7_changes);
    			const inputwithclear8_changes = {};

    			if (!updating_bindValue_8 && dirty[0] & /*$currentMaxVoteAverage*/ 1024) {
    				updating_bindValue_8 = true;
    				inputwithclear8_changes.bindValue = /*$currentMaxVoteAverage*/ ctx[10];
    				add_flush_callback(() => updating_bindValue_8 = false);
    			}

    			inputwithclear8.$set(inputwithclear8_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(selectedperoncard.$$.fragment, local);
    			transition_in(inputwithclear0.$$.fragment, local);
    			transition_in(inputwithclear1.$$.fragment, local);
    			transition_in(inputwithclear2.$$.fragment, local);
    			transition_in(inputwithclear3.$$.fragment, local);
    			transition_in(inputwithclear4.$$.fragment, local);
    			transition_in(inputwithclear5.$$.fragment, local);
    			transition_in(inputwithclear6.$$.fragment, local);
    			transition_in(inputwithclear7.$$.fragment, local);
    			transition_in(inputwithclear8.$$.fragment, local);
    			transition_in(languageselect.$$.fragment, local);
    			transition_in(genremenu.$$.fragment, local);
    			transition_in(savemenu.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(selectedperoncard.$$.fragment, local);
    			transition_out(inputwithclear0.$$.fragment, local);
    			transition_out(inputwithclear1.$$.fragment, local);
    			transition_out(inputwithclear2.$$.fragment, local);
    			transition_out(inputwithclear3.$$.fragment, local);
    			transition_out(inputwithclear4.$$.fragment, local);
    			transition_out(inputwithclear5.$$.fragment, local);
    			transition_out(inputwithclear6.$$.fragment, local);
    			transition_out(inputwithclear7.$$.fragment, local);
    			transition_out(inputwithclear8.$$.fragment, local);
    			transition_out(languageselect.$$.fragment, local);
    			transition_out(genremenu.$$.fragment, local);
    			transition_out(savemenu.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div17);
    			if_block.d();
    			destroy_component(selectedperoncard);
    			destroy_component(inputwithclear0);
    			destroy_component(inputwithclear1);
    			destroy_component(inputwithclear2);
    			destroy_component(inputwithclear3);
    			destroy_component(inputwithclear4);
    			destroy_component(inputwithclear5);
    			destroy_component(inputwithclear6);
    			destroy_component(inputwithclear7);
    			destroy_component(inputwithclear8);
    			destroy_component(languageselect);
    			destroy_component(genremenu);
    			destroy_component(savemenu);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function handleKeydown(event) {
    	if (event.key === "Enter") {
    		event.target.blur();
    	}
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $movieCount;
    	let $currentSelectedPerson;
    	let $currentSelectedTitle;
    	let $selectedTitle;
    	let $currentMinYear;
    	let $currentMinReviewCount;
    	let $currentMaxReviewCount;
    	let $currentMinRuntime;
    	let $currentMaxRuntime;
    	let $currentMinVoteAverage;
    	let $currentMaxVoteAverage;
    	validate_store(movieCount, 'movieCount');
    	component_subscribe($$self, movieCount, $$value => $$invalidate(0, $movieCount = $$value));
    	validate_store(currentSelectedPerson, 'currentSelectedPerson');
    	component_subscribe($$self, currentSelectedPerson, $$value => $$invalidate(1, $currentSelectedPerson = $$value));
    	validate_store(currentSelectedTitle, 'currentSelectedTitle');
    	component_subscribe($$self, currentSelectedTitle, $$value => $$invalidate(2, $currentSelectedTitle = $$value));
    	validate_store(selectedTitle, 'selectedTitle');
    	component_subscribe($$self, selectedTitle, $$value => $$invalidate(3, $selectedTitle = $$value));
    	validate_store(currentMinYear, 'currentMinYear');
    	component_subscribe($$self, currentMinYear, $$value => $$invalidate(4, $currentMinYear = $$value));
    	validate_store(currentMinReviewCount, 'currentMinReviewCount');
    	component_subscribe($$self, currentMinReviewCount, $$value => $$invalidate(5, $currentMinReviewCount = $$value));
    	validate_store(currentMaxReviewCount, 'currentMaxReviewCount');
    	component_subscribe($$self, currentMaxReviewCount, $$value => $$invalidate(6, $currentMaxReviewCount = $$value));
    	validate_store(currentMinRuntime, 'currentMinRuntime');
    	component_subscribe($$self, currentMinRuntime, $$value => $$invalidate(7, $currentMinRuntime = $$value));
    	validate_store(currentMaxRuntime, 'currentMaxRuntime');
    	component_subscribe($$self, currentMaxRuntime, $$value => $$invalidate(8, $currentMaxRuntime = $$value));
    	validate_store(currentMinVoteAverage, 'currentMinVoteAverage');
    	component_subscribe($$self, currentMinVoteAverage, $$value => $$invalidate(9, $currentMinVoteAverage = $$value));
    	validate_store(currentMaxVoteAverage, 'currentMaxVoteAverage');
    	component_subscribe($$self, currentMaxVoteAverage, $$value => $$invalidate(10, $currentMaxVoteAverage = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Header', slots, []);

    	function resetFilters() {
    		selectedLanguages.set(DEFAULT_LANGUAGES);
    		selectedGenres.set(DEFAULT_SELECTED_GENRES);
    		minYear.set(DEFAULT_YEAR);
    		minReviewCount.set(DEFAULT_MIN_REVIEWS);
    		maxReviewCount.set(DEFAULT_MAX_REVIEWS);
    		selectedPerson.set({ name: "", id: null, castOrCrew: null });
    		currentSelectedPerson.set({ name: "", id: null, castOrCrew: null });
    		currentMinYear.set(DEFAULT_YEAR);
    		currentMinReviewCount.set(DEFAULT_MIN_REVIEWS);
    		currentMaxReviewCount.set(DEFAULT_MAX_REVIEWS);
    		currentSelectedTitle.set(DEFAULT_TITLE);
    		selectedTitle.set(DEFAULT_TITLE);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	const func = e => selectedPerson.set({
    		name: e.target.value,
    		id: null,
    		castOrCrew: null
    	});

    	const func_1 = () => {
    		selectedPerson.set({ name: "", id: null, castOrCrew: null });
    		currentSelectedPerson.set({ name: "", id: null, castOrCrew: null });
    	};

    	function inputwithclear0_bindValue_binding(value) {
    		if ($$self.$$.not_equal($currentSelectedPerson.name, value)) {
    			$currentSelectedPerson.name = value;
    			currentSelectedPerson.set($currentSelectedPerson);
    		}
    	}

    	const func_2 = e => selectedTitle.set(e.target.value);

    	const func_3 = () => {
    		set_store_value(currentSelectedTitle, $currentSelectedTitle = DEFAULT_TITLE, $currentSelectedTitle);
    		selectedTitle.set(DEFAULT_TITLE);
    	};

    	function inputwithclear1_bindValue_binding(value) {
    		$currentSelectedTitle = value;
    		currentSelectedTitle.set($currentSelectedTitle);
    	}

    	const func_4 = e => minYear.set(e.target.value);

    	function inputwithclear2_bindValue_binding(value) {
    		$currentMinYear = value;
    		currentMinYear.set($currentMinYear);
    	}

    	const func_5 = e => minReviewCount.set(e.target.value);

    	const func_6 = () => {
    		set_store_value(currentMinReviewCount, $currentMinReviewCount = DEFAULT_MIN_REVIEWS, $currentMinReviewCount);
    		minReviewCount.set(DEFAULT_MIN_REVIEWS);
    	};

    	function inputwithclear3_bindValue_binding(value) {
    		$currentMinReviewCount = value;
    		currentMinReviewCount.set($currentMinReviewCount);
    	}

    	const func_7 = e => maxReviewCount.set(e.target.value);

    	const func_8 = () => {
    		set_store_value(currentMaxReviewCount, $currentMaxReviewCount = DEFAULT_MAX_REVIEWS, $currentMaxReviewCount);
    		maxReviewCount.set(DEFAULT_MAX_REVIEWS);
    	};

    	function inputwithclear4_bindValue_binding(value) {
    		$currentMaxReviewCount = value;
    		currentMaxReviewCount.set($currentMaxReviewCount);
    	}

    	const func_9 = e => minRuntime.set(e.target.value);

    	function inputwithclear5_bindValue_binding(value) {
    		$currentMinRuntime = value;
    		currentMinRuntime.set($currentMinRuntime);
    	}

    	const func_10 = e => maxRuntime.set(e.target.value);

    	function inputwithclear6_bindValue_binding(value) {
    		$currentMaxRuntime = value;
    		currentMaxRuntime.set($currentMaxRuntime);
    	}

    	const func_11 = e => minVoteAverage.set(e.target.value);

    	function inputwithclear7_bindValue_binding(value) {
    		$currentMinVoteAverage = value;
    		currentMinVoteAverage.set($currentMinVoteAverage);
    	}

    	const func_12 = e => maxVoteAverage.set(e.target.value);

    	function inputwithclear8_bindValue_binding(value) {
    		$currentMaxVoteAverage = value;
    		currentMaxVoteAverage.set($currentMaxVoteAverage);
    	}

    	$$self.$capture_state = () => ({
    		selectedLanguages,
    		selectedGenres,
    		minYear,
    		minReviewCount,
    		maxReviewCount,
    		selectedPerson,
    		currentSelectedPerson,
    		currentMinYear,
    		currentMinReviewCount,
    		currentMaxReviewCount,
    		currentSelectedTitle,
    		selectedTitle,
    		DEFAULT_LANGUAGES,
    		DEFAULT_MAX_REVIEWS,
    		DEFAULT_MIN_REVIEWS,
    		DEFAULT_PERSON,
    		DEFAULT_SELECTED_GENRES,
    		DEFAULT_TITLE,
    		DEFAULT_YEAR,
    		DEFAULT_MIN_POPULARITY,
    		DEFAULT_MAX_POPULARITY,
    		minPopularity,
    		maxPopularity,
    		minRuntime,
    		maxRuntime,
    		minVoteAverage,
    		maxVoteAverage,
    		currentMinPopularity,
    		currentMaxPopularity,
    		currentMinRuntime,
    		currentMaxRuntime,
    		currentMinVoteAverage,
    		currentMaxVoteAverage,
    		movieCount,
    		LANGUAGEINFO,
    		InputWithClear,
    		GenreMenu,
    		SaveMenu,
    		LanguageSelect,
    		RangeInput,
    		SelectedPeronCard: SelectedPersonCard,
    		handleKeydown,
    		resetFilters,
    		$movieCount,
    		$currentSelectedPerson,
    		$currentSelectedTitle,
    		$selectedTitle,
    		$currentMinYear,
    		$currentMinReviewCount,
    		$currentMaxReviewCount,
    		$currentMinRuntime,
    		$currentMaxRuntime,
    		$currentMinVoteAverage,
    		$currentMaxVoteAverage
    	});

    	return [
    		$movieCount,
    		$currentSelectedPerson,
    		$currentSelectedTitle,
    		$selectedTitle,
    		$currentMinYear,
    		$currentMinReviewCount,
    		$currentMaxReviewCount,
    		$currentMinRuntime,
    		$currentMaxRuntime,
    		$currentMinVoteAverage,
    		$currentMaxVoteAverage,
    		resetFilters,
    		func,
    		func_1,
    		inputwithclear0_bindValue_binding,
    		func_2,
    		func_3,
    		inputwithclear1_bindValue_binding,
    		func_4,
    		inputwithclear2_bindValue_binding,
    		func_5,
    		func_6,
    		inputwithclear3_bindValue_binding,
    		func_7,
    		func_8,
    		inputwithclear4_bindValue_binding,
    		func_9,
    		inputwithclear5_bindValue_binding,
    		func_10,
    		inputwithclear6_bindValue_binding,
    		func_11,
    		inputwithclear7_bindValue_binding,
    		func_12,
    		inputwithclear8_bindValue_binding
    	];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    // src/stores/persistentStore.js

    function persistentStore(key, initialValue) {
        if (typeof localStorage === 'undefined') {
            return writable(initialValue);
        }

        const storedValue = localStorage.getItem(key);
        const data = storedValue ? JSON.parse(storedValue) : initialValue;

        const store = writable(data);

        store.subscribe((value) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.error(`Error setting localStorage key "${key}":`, e);
            }
        });

        return store;
    }

    const history = persistentStore('history', {
        viewedMoviesDict: {},
    });

    history.subscribe((n) => {
        console.log('history store',n);
    });

    function addMovie(movie, verb = 'seen') {
        history.update(n => {
            n.viewedMoviesDict[movie.id] = verb;
            const updatedDict = { ...n.viewedMoviesDict };
            return { ...n, viewedMoviesDict: updatedDict };
        });
    }

    function movieIsPresent(movie) {
        return (get_store_value(history).viewedMoviesDict[movie.id] || false);
    }

    function getMovieViewedType(movie) {
        return get_store_value(history).viewedMoviesDict[movie.id] || null;
    }

    function getAllRelevantIDs(verbs) {
        const viewedMoviesDict = get_store_value(history).viewedMoviesDict;
        return Object.entries(viewedMoviesDict)
            .filter(([id, verb]) => verbs.includes(verb))
            .map(([id]) => id);
    }

    // src/stores/windowWidthStore.js

    function createWindowWidthStore() {
      // Initialize the store with the current window width or a default value
      const isClient = typeof window !== 'undefined';
      const initialWidth = isClient ? window.innerWidth : 0;
      const { subscribe, set } = writable(initialWidth);

      // Update the store whenever the window is resized
      if (isClient) {
        const handleResize = () => {
          console.log('handling resize', window.innerWidth);
          set(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);

        // Optionally, update the store on initial load
        handleResize();

        // Clean up the event listener when no longer needed
        // Note: In a real application, you might want to handle cleanup differently
        // depending on your store's lifecycle requirements.
      }

      return {
        subscribe,
      };
    }

    const windowWidth = createWindowWidthStore();

    const isNarrow = derived(windowWidth, ($windowWidth) => $windowWidth <= 1300);

    function createAsyncStore() {
      const store = writable({});
      const { subscribe, update } = store;

      async function load(key, asyncFunction, ...args) {
        if (typeof asyncFunction !== 'function') {
          throw new Error('Provided asyncFunction is not a function');
        }

        if (!key) {
          throw new Error('A unique key must be provided for each operation');
        }

        // Prevent duplicate operations
        update((state) => {
          if (state[key]?.status === 'loading') {
            throw new Error(`Operation with key "${key}" is already in progress`);
          }
          return state;
        });

        // Initialize the state for this operation
        update((state) => ({
          ...state,
          [key]: { status: 'loading', error: null, data: null },
        }));

        try {
          const data = await asyncFunction(...args);
          // Update the state with the data
          update((state) => ({
            ...state,
            [key]: { status: 'success', error: null, data },
          }));
        } catch (error) {
          // Update the state with the error
          update((state) => ({
            ...state,
            [key]: { status: 'error', error, data: null },
          }));
        }
      }

      function remove(key) {
        update((state) => {
          const { [key]: _, ...rest } = state;
          return rest;
        });
      }

      function getOperation(key) {
        let previous = {};
        return derived(
          store,
          ($store, set) => {
            const current = $store[key] || { status: null, error: null, data: null };

            // Only update if any of the values have changed
            if (
              current.status !== previous.status ||
              current.error !== previous.error ||
              current.data !== previous.data
            ) {
              previous = { ...current };
              set(current);
            }
          },
          { status: null, error: null, data: null } // Initial value
        );
      }

      return {
        subscribe,
        load,
        remove,
        getOperation,
      };
    }

    const asyncStore = createAsyncStore();

    /* src/components/MovieItem.svelte generated by Svelte v3.59.2 */

    const { console: console_1$2 } = globals;
    const file$5 = "src/components/MovieItem.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[31] = list[i];
    	return child_ctx;
    }

    // (151:4) {:else}
    function create_else_block$1(ctx) {
    	let div;
    	let span;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t = text(/*languageFlag*/ ctx[6]);
    			attr_dev(span, "class", "flag mx-1 cursor-pointer transition-transform duration-200 hover:scale-150 z-10 text-l");
    			add_location(span, file$5, 152, 8, 4311);
    			attr_dev(div, "class", "flex items-center");
    			add_location(div, file$5, 151, 6, 4271);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t);

    			if (!mounted) {
    				dispose = listen_dev(span, "click", /*click_handler_1*/ ctx[24], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*languageFlag*/ 64) set_data_dev(t, /*languageFlag*/ ctx[6]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(151:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (136:4) {#if !isEnglish}
    function create_if_block_2$1(ctx) {
    	let div;
    	let span;
    	let t0;
    	let t1;
    	let t2_value = /*movie*/ ctx[0].originalTitle + "";
    	let t2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = text(/*languageFlag*/ ctx[6]);
    			t1 = space();
    			t2 = text(t2_value);
    			attr_dev(span, "class", "flag mx-1 cursor-pointer transition-transform duration-200 hover:scale-150 z-10 text-l");
    			add_location(span, file$5, 139, 8, 3912);
    			attr_dev(div, "class", "flex items-center text-gray-500 whitespace-nowrap overflow-hidden overflow-ellipsis");
    			add_location(div, file$5, 136, 6, 3791);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);

    			if (!mounted) {
    				dispose = listen_dev(span, "click", /*click_handler*/ ctx[23], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*languageFlag*/ 64) set_data_dev(t0, /*languageFlag*/ ctx[6]);
    			if (dirty[0] & /*movie*/ 1 && t2_value !== (t2_value = /*movie*/ ctx[0].originalTitle + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(136:4) {#if !isEnglish}",
    		ctx
    	});

    	return block;
    }

    // (173:6) {#each movie.genres as genre}
    function create_each_block$3(ctx) {
    	let div;
    	let t0_value = genreEmojiDict[/*genre*/ ctx[31]] + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler_2(...args) {
    		return /*click_handler_2*/ ctx[25](/*genre*/ ctx[31], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", "emoji cursor-pointer transition-transform duration-200 hover:scale-150 z-10 text-xl");
    			add_location(div, file$5, 173, 8, 4896);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler_2, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*movie*/ 1 && t0_value !== (t0_value = genreEmojiDict[/*genre*/ ctx[31]] + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(173:6) {#each movie.genres as genre}",
    		ctx
    	});

    	return block;
    }

    // (215:29) 
    function create_if_block_1$2(ctx) {
    	let div4;
    	let div1;
    	let div0;
    	let t1;
    	let t2_value = /*movie*/ ctx[0].voteAverage.toFixed(1) + "";
    	let t2;
    	let t3;
    	let div3;
    	let div2;
    	let t5;
    	let t6_value = /*movie*/ ctx[0].voteCount + "";
    	let t6;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "⭐";
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = space();
    			div3 = element("div");
    			div2 = element("div");
    			div2.textContent = "👥";
    			t5 = space();
    			t6 = text(t6_value);
    			attr_dev(div0, "class", "emoji text-md cursor-pointer transition-transform duration-200 hover:scale-150 z-10 mr-1 text-lg");
    			add_location(div0, file$5, 217, 10, 6558);
    			attr_dev(div1, "class", "font-bold mb-1 flex flex-row justify-center items-center");
    			add_location(div1, file$5, 216, 8, 6477);
    			attr_dev(div2, "class", "text-md cursor-pointer transition-transform duration-200 hover:scale-150 z-10 mr-1 text-lg");
    			add_location(div2, file$5, 236, 10, 7199);
    			attr_dev(div3, "class", "emoji font-bold mr-1 flex flex-row justify-center items-center");
    			set_style(div3, "color", /*barColor*/ ctx[2]);
    			add_location(div3, file$5, 228, 8, 6932);
    			attr_dev(div4, "class", "text-xs text-center");
    			add_location(div4, file$5, 215, 6, 6435);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div1);
    			append_dev(div1, div0);
    			append_dev(div1, t1);
    			append_dev(div1, t2);
    			append_dev(div4, t3);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div3, t5);
    			append_dev(div3, t6);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*click_handler_4*/ ctx[27], false, false, false, false),
    					listen_dev(div3, "click", /*click_handler_5*/ ctx[28], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*movie*/ 1 && t2_value !== (t2_value = /*movie*/ ctx[0].voteAverage.toFixed(1) + "")) set_data_dev(t2, t2_value);
    			if (dirty[0] & /*movie*/ 1 && t6_value !== (t6_value = /*movie*/ ctx[0].voteCount + "")) set_data_dev(t6, t6_value);

    			if (dirty[0] & /*barColor*/ 4) {
    				set_style(div3, "color", /*barColor*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(215:29) ",
    		ctx
    	});

    	return block;
    }

    // (196:4) {#if movieViewedType && movieViewedType != "ignored"}
    function create_if_block$4(ctx) {
    	let div;
    	let t_value = verbEmojiDict[/*movieViewedType*/ ctx[4]] + "";
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "status-button flex items-center justify-center w-8 h-8 text-white rounded cursor-pointer shadow-md text-xl");
    			toggle_class(div, "bg-gray-500", /*movieViewedType*/ ctx[4] === "viewed");
    			toggle_class(div, "hover:bg-gray-700", /*movieViewedType*/ ctx[4] === "viewed");
    			toggle_class(div, "bg-green-500", /*movieViewedType*/ ctx[4] === "interested");
    			toggle_class(div, "hover:bg-green-700", /*movieViewedType*/ ctx[4] === "interested");
    			toggle_class(div, "bg-blue-500", /*movieViewedType*/ ctx[4] === "seen");
    			toggle_class(div, "hover:bg-blue-700", /*movieViewedType*/ ctx[4] === "seen");
    			toggle_class(div, "bg-red-500", /*movieViewedType*/ ctx[4] === "loved");
    			toggle_class(div, "hover:bg-red-700", /*movieViewedType*/ ctx[4] === "loved");
    			add_location(div, file$5, 196, 6, 5611);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler_3*/ ctx[26], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*movieViewedType*/ 16 && t_value !== (t_value = verbEmojiDict[/*movieViewedType*/ ctx[4]] + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*movieViewedType*/ 16) {
    				toggle_class(div, "bg-gray-500", /*movieViewedType*/ ctx[4] === "viewed");
    			}

    			if (dirty[0] & /*movieViewedType*/ 16) {
    				toggle_class(div, "hover:bg-gray-700", /*movieViewedType*/ ctx[4] === "viewed");
    			}

    			if (dirty[0] & /*movieViewedType*/ 16) {
    				toggle_class(div, "bg-green-500", /*movieViewedType*/ ctx[4] === "interested");
    			}

    			if (dirty[0] & /*movieViewedType*/ 16) {
    				toggle_class(div, "hover:bg-green-700", /*movieViewedType*/ ctx[4] === "interested");
    			}

    			if (dirty[0] & /*movieViewedType*/ 16) {
    				toggle_class(div, "bg-blue-500", /*movieViewedType*/ ctx[4] === "seen");
    			}

    			if (dirty[0] & /*movieViewedType*/ 16) {
    				toggle_class(div, "hover:bg-blue-700", /*movieViewedType*/ ctx[4] === "seen");
    			}

    			if (dirty[0] & /*movieViewedType*/ 16) {
    				toggle_class(div, "bg-red-500", /*movieViewedType*/ ctx[4] === "loved");
    			}

    			if (dirty[0] & /*movieViewedType*/ 16) {
    				toggle_class(div, "hover:bg-red-700", /*movieViewedType*/ ctx[4] === "loved");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(196:4) {#if movieViewedType && movieViewedType != \\\"ignored\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div10;
    	let div0;
    	let t0_value = /*movie*/ ctx[0].getReleaseDateString() + "";
    	let t0;
    	let div0_class_value;
    	let t1;
    	let div3;
    	let div2;
    	let div1;
    	let div1_style_value;
    	let t2;
    	let div5;
    	let t3;
    	let div4;
    	let t4_value = /*movie*/ ctx[0].title + "";
    	let t4;
    	let t5;
    	let div7;
    	let div6;
    	let t6;
    	let div8;
    	let t7;
    	let div9;
    	let t8_value = /*movie*/ ctx[0].generateHourString() + "";
    	let t8;
    	let div10_id_value;
    	let div10_class_value;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (!/*isEnglish*/ ctx[7]) return create_if_block_2$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let each_value = /*movie*/ ctx[0].genres;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	function select_block_type_1(ctx, dirty) {
    		if (/*movieViewedType*/ ctx[4] && /*movieViewedType*/ ctx[4] != "ignored") return create_if_block$4;
    		if (/*isHoveringOver*/ ctx[3]) return create_if_block_1$2;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1 && current_block_type_1(ctx);

    	const block = {
    		c: function create() {
    			div10 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			t2 = space();
    			div5 = element("div");
    			if_block0.c();
    			t3 = space();
    			div4 = element("div");
    			t4 = text(t4_value);
    			t5 = space();
    			div7 = element("div");
    			div6 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t6 = space();
    			div8 = element("div");
    			if (if_block1) if_block1.c();
    			t7 = space();
    			div9 = element("div");
    			t8 = text(t8_value);
    			attr_dev(div0, "class", div0_class_value = "flex-none mx-3 text-center text-sm " + /*fontWeightDate*/ ctx[5] + " svelte-1r3vfvx");
    			add_location(div0, file$5, 112, 2, 3015);
    			attr_dev(div1, "class", "custom-bar h-full rounded-full");

    			attr_dev(div1, "style", div1_style_value = "width: " + /*movie*/ ctx[0].voteAverage * 10 * /*$barSize*/ ctx[12] + "%; background-color: " + /*barColor*/ ctx[2] + "; " + (/*$transitioning*/ ctx[13]
    			? 'transition: width 1s;'
    			: ''));

    			add_location(div1, file$5, 122, 6, 3387);
    			attr_dev(div2, "class", "custom-bar-container relative w-full h-8 bg-gray-200 overflow-hidden rounded-full");
    			toggle_class(div2, "bg-gray-300", /*movieViewedType*/ ctx[4] && /*movieViewedType*/ ctx[4] != "ignored");
    			add_location(div2, file$5, 118, 4, 3200);
    			attr_dev(div3, "class", "flex-grow w-4/12 px-2");
    			add_location(div3, file$5, 117, 2, 3160);
    			attr_dev(div4, "class", "flex items-center text-base");
    			add_location(div4, file$5, 164, 4, 4663);
    			attr_dev(div5, "class", "flex flex-col flex-grow w-4/12 py-2 pl-2");
    			add_location(div5, file$5, 133, 2, 3681);
    			attr_dev(div6, "class", "grid grid-cols-3 gap-x-1");
    			add_location(div6, file$5, 171, 4, 4813);
    			attr_dev(div7, "class", "flex-none w-16");
    			add_location(div7, file$5, 170, 2, 4780);
    			attr_dev(div8, "class", "flex-none w-1/12 text-center flex items-center justify-center");
    			add_location(div8, file$5, 194, 2, 5471);
    			attr_dev(div9, "class", "flex-none w-1/12 text-center text-sm");
    			add_location(div9, file$5, 248, 2, 7463);
    			attr_dev(div10, "id", div10_id_value = /*movie*/ ctx[0].id);

    			attr_dev(div10, "class", div10_class_value = "movie-item flex items-center border-t border-gray-300 overflow-hidden cursor-pointer transition-shadow duration-1000 rounded-md " + (/*$updateMoviesAsyncRequest*/ ctx[9].status == 'loading'
    			? 'animate-pulse'
    			: '') + " svelte-1r3vfvx");

    			set_style(div10, "transform", "translateX(-50%) translateY(" + (/*index*/ ctx[1] * /*$itemHeight*/ ctx[10] - /*$scrollY*/ ctx[11] % /*$itemHeight*/ ctx[10]) + "px)");
    			set_style(div10, "height", /*$itemHeight*/ ctx[10] + "px");
    			set_style(div10, "position", "absolute");
    			set_style(div10, "left", "50%");
    			set_style(div10, "width", "calc(100% - 2rem)");
    			toggle_class(div10, "selected", /*$selectedMovie*/ ctx[8] && /*$selectedMovie*/ ctx[8].id == /*movie*/ ctx[0].id);
    			add_location(div10, file$5, 97, 0, 2386);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div0);
    			append_dev(div0, t0);
    			append_dev(div10, t1);
    			append_dev(div10, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div10, t2);
    			append_dev(div10, div5);
    			if_block0.m(div5, null);
    			append_dev(div5, t3);
    			append_dev(div5, div4);
    			append_dev(div4, t4);
    			append_dev(div10, t5);
    			append_dev(div10, div7);
    			append_dev(div7, div6);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div6, null);
    				}
    			}

    			append_dev(div10, t6);
    			append_dev(div10, div8);
    			if (if_block1) if_block1.m(div8, null);
    			append_dev(div10, t7);
    			append_dev(div10, div9);
    			append_dev(div9, t8);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div10, "click", /*handleBarClick*/ ctx[18], false, false, false, false),
    					listen_dev(div10, "mouseenter", /*handleMouseEnter*/ ctx[15], false, false, false, false),
    					listen_dev(div10, "mouseleave", /*handleMouseLeave*/ ctx[16], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*movie*/ 1 && t0_value !== (t0_value = /*movie*/ ctx[0].getReleaseDateString() + "")) set_data_dev(t0, t0_value);

    			if (dirty[0] & /*fontWeightDate*/ 32 && div0_class_value !== (div0_class_value = "flex-none mx-3 text-center text-sm " + /*fontWeightDate*/ ctx[5] + " svelte-1r3vfvx")) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			if (dirty[0] & /*movie, $barSize, barColor, $transitioning*/ 12293 && div1_style_value !== (div1_style_value = "width: " + /*movie*/ ctx[0].voteAverage * 10 * /*$barSize*/ ctx[12] + "%; background-color: " + /*barColor*/ ctx[2] + "; " + (/*$transitioning*/ ctx[13]
    			? 'transition: width 1s;'
    			: ''))) {
    				attr_dev(div1, "style", div1_style_value);
    			}

    			if (dirty[0] & /*movieViewedType*/ 16) {
    				toggle_class(div2, "bg-gray-300", /*movieViewedType*/ ctx[4] && /*movieViewedType*/ ctx[4] != "ignored");
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div5, t3);
    				}
    			}

    			if (dirty[0] & /*movie*/ 1 && t4_value !== (t4_value = /*movie*/ ctx[0].title + "")) set_data_dev(t4, t4_value);

    			if (dirty[0] & /*$selectedGenres, movie*/ 16385) {
    				each_value = /*movie*/ ctx[0].genres;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div6, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if (if_block1) if_block1.d(1);
    				if_block1 = current_block_type_1 && current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div8, null);
    				}
    			}

    			if (dirty[0] & /*movie*/ 1 && t8_value !== (t8_value = /*movie*/ ctx[0].generateHourString() + "")) set_data_dev(t8, t8_value);

    			if (dirty[0] & /*movie*/ 1 && div10_id_value !== (div10_id_value = /*movie*/ ctx[0].id)) {
    				attr_dev(div10, "id", div10_id_value);
    			}

    			if (dirty[0] & /*$updateMoviesAsyncRequest*/ 512 && div10_class_value !== (div10_class_value = "movie-item flex items-center border-t border-gray-300 overflow-hidden cursor-pointer transition-shadow duration-1000 rounded-md " + (/*$updateMoviesAsyncRequest*/ ctx[9].status == 'loading'
    			? 'animate-pulse'
    			: '') + " svelte-1r3vfvx")) {
    				attr_dev(div10, "class", div10_class_value);
    			}

    			if (dirty[0] & /*index, $itemHeight, $scrollY*/ 3074) {
    				set_style(div10, "transform", "translateX(-50%) translateY(" + (/*index*/ ctx[1] * /*$itemHeight*/ ctx[10] - /*$scrollY*/ ctx[11] % /*$itemHeight*/ ctx[10]) + "px)");
    			}

    			if (dirty[0] & /*$itemHeight*/ 1024) {
    				set_style(div10, "height", /*$itemHeight*/ ctx[10] + "px");
    			}

    			if (dirty[0] & /*$updateMoviesAsyncRequest, $selectedMovie, movie*/ 769) {
    				toggle_class(div10, "selected", /*$selectedMovie*/ ctx[8] && /*$selectedMovie*/ ctx[8].id == /*movie*/ ctx[0].id);
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div10);
    			if_block0.d();
    			destroy_each(each_blocks, detaching);

    			if (if_block1) {
    				if_block1.d();
    			}

    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let isEnglish;
    	let languageColor;
    	let languageFlag;
    	let languageName;
    	let fontWeightDate;
    	let movieViewedType;
    	let $selectedMovie;
    	let $updateMoviesAsyncRequest;
    	let $itemHeight;
    	let $scrollY;
    	let $barSize;
    	let $transitioning;
    	let $selectedGenres;
    	validate_store(selectedMovie, 'selectedMovie');
    	component_subscribe($$self, selectedMovie, $$value => $$invalidate(8, $selectedMovie = $$value));
    	validate_store(itemHeight, 'itemHeight');
    	component_subscribe($$self, itemHeight, $$value => $$invalidate(10, $itemHeight = $$value));
    	validate_store(scrollY, 'scrollY');
    	component_subscribe($$self, scrollY, $$value => $$invalidate(11, $scrollY = $$value));
    	validate_store(selectedGenres, 'selectedGenres');
    	component_subscribe($$self, selectedGenres, $$value => $$invalidate(14, $selectedGenres = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('MovieItem', slots, []);
    	let { movie } = $$props;
    	let { index } = $$props;
    	let { barColor } = $$props;
    	let { newYear } = $$props;
    	let isHoveringOver = false;

    	function handleMouseEnter() {
    		$$invalidate(3, isHoveringOver = true);
    	}

    	function handleMouseLeave() {
    		$$invalidate(3, isHoveringOver = false);
    	}

    	isNarrow.subscribe(n => {
    		console.log("screen-width", n);
    	});

    	history.subscribe(n => {
    		$$invalidate(4, movieViewedType = getMovieViewedType(movie));
    	});

    	function handleViewTypeClick() {
    		if (movieViewedType == "viewed") {
    			addMovie(movie, "interested");
    		} else if (movieViewedType == "interested") {
    			addMovie(movie, "seen");
    		} else if (movieViewedType == "seen") {
    			addMovie(movie, "loved");
    		} else if (movieViewedType == "loved") {
    			addMovie(movie, "ignored");
    		} else if (movieViewedType == "ignored") {
    			addMovie(movie, "viewed");
    		}
    	}

    	function handleBarClick() {
    		if ($selectedMovie && $selectedMovie.id == movie.id) {
    			handleViewTypeClick();
    		}

    		selectedMovie.set(movie);
    	}

    	const updateMoviesAsyncRequest = asyncStore.getOperation("update-movies");
    	validate_store(updateMoviesAsyncRequest, 'updateMoviesAsyncRequest');
    	component_subscribe($$self, updateMoviesAsyncRequest, value => $$invalidate(9, $updateMoviesAsyncRequest = value));
    	let barSize = writable(0.2);
    	validate_store(barSize, 'barSize');
    	component_subscribe($$self, barSize, value => $$invalidate(12, $barSize = value));
    	let transitioning = writable(false);
    	validate_store(transitioning, 'transitioning');
    	component_subscribe($$self, transitioning, value => $$invalidate(13, $transitioning = value));

    	setTimeout(
    		() => {
    			barSize.set(1);
    			transitioning.set(true);
    		},
    		25
    	);

    	setTimeout(
    		() => {
    			transitioning.set(false);
    		},
    		50
    	);

    	$$self.$$.on_mount.push(function () {
    		if (movie === undefined && !('movie' in $$props || $$self.$$.bound[$$self.$$.props['movie']])) {
    			console_1$2.warn("<MovieItem> was created without expected prop 'movie'");
    		}

    		if (index === undefined && !('index' in $$props || $$self.$$.bound[$$self.$$.props['index']])) {
    			console_1$2.warn("<MovieItem> was created without expected prop 'index'");
    		}

    		if (barColor === undefined && !('barColor' in $$props || $$self.$$.bound[$$self.$$.props['barColor']])) {
    			console_1$2.warn("<MovieItem> was created without expected prop 'barColor'");
    		}

    		if (newYear === undefined && !('newYear' in $$props || $$self.$$.bound[$$self.$$.props['newYear']])) {
    			console_1$2.warn("<MovieItem> was created without expected prop 'newYear'");
    		}
    	});

    	const writable_props = ['movie', 'index', 'barColor', 'newYear'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<MovieItem> was created with unknown prop '${key}'`);
    	});

    	const click_handler = e => {
    		e.stopPropagation();
    		selectedLanguages.set([movie.originalLanguage]);
    	};

    	const click_handler_1 = e => {
    		e.stopPropagation();
    		selectedLanguages.set([movie.originalLanguage]);
    	};

    	const click_handler_2 = (genre, e) => {
    		e.stopPropagation();

    		if ($selectedGenres.includes(genre)) {
    			selectedGenres.update(genres => genres.filter(g => g !== genre));
    		} else {
    			selectedGenres.update(genres => [...genres, genre]);
    		}
    	};

    	const click_handler_3 = e => {
    		e.stopPropagation();
    		handleViewTypeClick();
    	};

    	const click_handler_4 = e => {
    		e.stopPropagation();
    		minVoteAverage.set(movie.voteAverage.toFixed(1));
    	};

    	const click_handler_5 = e => {
    		e.stopPropagation();
    		minReviewCount.set(movie.voteCount);
    	};

    	$$self.$$set = $$props => {
    		if ('movie' in $$props) $$invalidate(0, movie = $$props.movie);
    		if ('index' in $$props) $$invalidate(1, index = $$props.index);
    		if ('barColor' in $$props) $$invalidate(2, barColor = $$props.barColor);
    		if ('newYear' in $$props) $$invalidate(22, newYear = $$props.newYear);
    	};

    	$$self.$capture_state = () => ({
    		selectedMovie,
    		scrollY,
    		itemHeight,
    		selectedLanguages,
    		selectedGenres,
    		minPopularity,
    		minVoteAverage,
    		transitionCount,
    		minReviewCount,
    		addMovie,
    		getMovieViewedType,
    		movieIsPresent,
    		getLanguageColor,
    		getLanguageFlag,
    		getLanguageName,
    		genreEmojiDict,
    		verbEmojiDict,
    		history,
    		onMount,
    		isNarrow,
    		get: get_store_value,
    		writable,
    		derived,
    		asyncStore,
    		tick,
    		movie,
    		index,
    		barColor,
    		newYear,
    		isHoveringOver,
    		handleMouseEnter,
    		handleMouseLeave,
    		handleViewTypeClick,
    		handleBarClick,
    		updateMoviesAsyncRequest,
    		barSize,
    		transitioning,
    		movieViewedType,
    		fontWeightDate,
    		languageName,
    		languageFlag,
    		languageColor,
    		isEnglish,
    		$selectedMovie,
    		$updateMoviesAsyncRequest,
    		$itemHeight,
    		$scrollY,
    		$barSize,
    		$transitioning,
    		$selectedGenres
    	});

    	$$self.$inject_state = $$props => {
    		if ('movie' in $$props) $$invalidate(0, movie = $$props.movie);
    		if ('index' in $$props) $$invalidate(1, index = $$props.index);
    		if ('barColor' in $$props) $$invalidate(2, barColor = $$props.barColor);
    		if ('newYear' in $$props) $$invalidate(22, newYear = $$props.newYear);
    		if ('isHoveringOver' in $$props) $$invalidate(3, isHoveringOver = $$props.isHoveringOver);
    		if ('barSize' in $$props) $$invalidate(20, barSize = $$props.barSize);
    		if ('transitioning' in $$props) $$invalidate(21, transitioning = $$props.transitioning);
    		if ('movieViewedType' in $$props) $$invalidate(4, movieViewedType = $$props.movieViewedType);
    		if ('fontWeightDate' in $$props) $$invalidate(5, fontWeightDate = $$props.fontWeightDate);
    		if ('languageName' in $$props) languageName = $$props.languageName;
    		if ('languageFlag' in $$props) $$invalidate(6, languageFlag = $$props.languageFlag);
    		if ('languageColor' in $$props) languageColor = $$props.languageColor;
    		if ('isEnglish' in $$props) $$invalidate(7, isEnglish = $$props.isEnglish);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*movie*/ 1) {
    			$$invalidate(7, isEnglish = movie.originalLanguage === "en");
    		}

    		if ($$self.$$.dirty[0] & /*movie*/ 1) {
    			languageColor = getLanguageColor(movie.originalLanguage);
    		}

    		if ($$self.$$.dirty[0] & /*movie*/ 1) {
    			$$invalidate(6, languageFlag = getLanguageFlag(movie.originalLanguage));
    		}

    		if ($$self.$$.dirty[0] & /*movie*/ 1) {
    			languageName = getLanguageName(movie.originalLanguage);
    		}

    		if ($$self.$$.dirty[0] & /*newYear*/ 4194304) {
    			$$invalidate(5, fontWeightDate = newYear ? "font-bold" : "font-normal");
    		}

    		if ($$self.$$.dirty[0] & /*movie*/ 1) {
    			$$invalidate(4, movieViewedType = getMovieViewedType(movie));
    		}
    	};

    	return [
    		movie,
    		index,
    		barColor,
    		isHoveringOver,
    		movieViewedType,
    		fontWeightDate,
    		languageFlag,
    		isEnglish,
    		$selectedMovie,
    		$updateMoviesAsyncRequest,
    		$itemHeight,
    		$scrollY,
    		$barSize,
    		$transitioning,
    		$selectedGenres,
    		handleMouseEnter,
    		handleMouseLeave,
    		handleViewTypeClick,
    		handleBarClick,
    		updateMoviesAsyncRequest,
    		barSize,
    		transitioning,
    		newYear,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5
    	];
    }

    class MovieItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$5,
    			create_fragment$5,
    			safe_not_equal,
    			{
    				movie: 0,
    				index: 1,
    				barColor: 2,
    				newYear: 22
    			},
    			null,
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MovieItem",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get movie() {
    		throw new Error("<MovieItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set movie(value) {
    		throw new Error("<MovieItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<MovieItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<MovieItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get barColor() {
    		throw new Error("<MovieItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set barColor(value) {
    		throw new Error("<MovieItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get newYear() {
    		throw new Error("<MovieItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set newYear(value) {
    		throw new Error("<MovieItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
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
        this.adult = data.adult === 'true';
        this.homepage = data.homepage;
        this.imdbId = data.imdb_id;
        this.originalLanguage = data.original_language;
        this.status = data.status;
        this.tagline = data.tagline;
        this.budget = data.budget;
        this.revenue = data.revenue;
        this.belongsToCollection = data.belongs_to_collection;
        this.genres = data.genres.map((genre) => genre.name);
        this.spokenLanguages = data.spoken_languages.map(
          (lang) => lang.english_name
        );
        this.productionCountries = data.production_countries.map(
          (country) => country.name
        );
        this.productionCompanies = data.production_companies.map(
          (company) => company.name
        );
        this.reviews = data.reviews;
        this.videos = data.videos;
        this.similar = data.similar;
        this.images = data.images;
        // this.keywords = data?.keywords[0]?.keywords.map(
        //   (keyword) => keyword.name
        // );
        this.keywords = [];
        this.preloadPosterImage();
      }

      getFormattedReleaseDate() {
        return this.releaseDate.toLocaleDateString();
      }

      getFormattedMonthYear() {
        return this.releaseDate.toLocaleString('default', {
          month: 'numeric',
          year: 'numeric',
        });
      }

      getReleaseDateString() {
        return this.releaseDate.toLocaleString('default', {
            month: 'numeric',
            year: 'numeric',
        });

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

      preloadPosterImage() {
        const img = new Image();
        img.src = this.getPosterUrl();
        img.onload = () => {
          this.posterImage = img; // Store the loaded image
        };
        img.onerror = (error) => {
        };
      }


      generateHourString() {
        let hours = Math.floor(this.runtime / 60);
        let minutes = this.runtime % 60;
        if(hours) {
          return `${hours}h ${minutes}m`;
        } else {
          return `${minutes}m`;
        }
      }
    }

    function setVoteCountIndexAndColor(movies) {
      movies.sort((a, b) => b.voteCount - a.voteCount);

      movies.forEach((movie, index) => {
        movie.voteCountIndex = index + 1;
      });

      movies.sort((a, b) => a.releaseDate - b.releaseDate);

      movies.forEach((movie, index) => {
        movie.color = getColor(movie.voteCountIndex, movies.length);
        movie.isNewYear =
          index == 0 ||
          new Date(movies[index - 1].releaseDate).getYear() !=
            new Date(movies[index].releaseDate).getYear();
      });

      return movies;
    }

    function getColor(voteCountIndex, numberOfMovies) {
      let gradients = [
        // grey
        // red
        [255, 0, 0],
        [169, 169, 169],
      ];

      const numGradients = gradients.length - 1;

      // Safely calculate the ratio
      let ratio = 0;
      if (numberOfMovies > 0) {
        ratio = voteCountIndex / numberOfMovies;
      }

      // Clamp the ratio between 0 and 1
      const ratioClamped = Math.min(Math.max(ratio, 0), 1);

      // Determine which two colors to blend based on the ratio
      const scaledRatio = ratioClamped * numGradients;
      const gradientIndex = Math.min(Math.floor(scaledRatio), numGradients - 1);
      const localRatio = scaledRatio - gradientIndex;

      // Get colors for blending
      const c1 = gradients[gradientIndex];
      const c2 = gradients[gradientIndex + 1];

      // Interpolate between c1 and c2
      const color = [
        Math.floor(c1[0] + localRatio * (c2[0] - c1[0])),
        Math.floor(c1[1] + localRatio * (c2[1] - c1[1])),
        Math.floor(c1[2] + localRatio * (c2[2] - c1[2])),
      ];

      return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
    }

    async function queryDatabase(movies, append = "new", date = null) {
      if (get_store_value(runningQuery)) {
        return movies;
      }

      runningQuery.set(true);

      // let target = '13.60.6.138'
      let target = 'localhost';
      
      let url = `http://${target}:3000/movies`;
      console.log(url);

      let body = {
        originalLanguages: get_store_value(selectedLanguages),
        genres: get_store_value(selectedGenres),
        minReviewCount: get_store_value(minReviewCount),
        maxReviewCount: get_store_value(maxReviewCount),
        minRuntime: get_store_value(minRuntime),
        maxRuntime: get_store_value(maxRuntime),
        minPopularity: get_store_value(minPopularity),
        maxPopularity: get_store_value(maxPopularity),
        minVoteAverage: get_store_value(minVoteAverage),
        maxVoteAverage: get_store_value(maxVoteAverage),
        minYear: get_store_value(minYear),
        person: get_store_value(selectedPerson),
        type: append,
        title: get_store_value(selectedTitle),
      };

      if (get_store_value(selectedViewTypeVerbs) && get_store_value(selectedViewTypeVerbs).length > 0) {
        body["ids"] = getAllRelevantIDs(get_store_value(selectedViewTypeVerbs));
      }

      if (append == "append") {
        body["date"] = date || movies[movies.length - 1].releaseDate;
      } else if (append == "prepend") {
        body["date"] = date || movies[0].releaseDate;
      } else {
        body["date"] = null;
      }

      console.log('getting result');
      let res = await axios$1({
        method: "post",
        url: url,
        data: body,
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log('res', res);

      let movieResponse = res.data.movies;

      if (append == "new") {
        movieCount.set(res.data.count);
      }

      let newMovies = movieResponse.map((movie) => new Movie(movie));

      runningQuery.set(false);

      return newMovies;
    }

    async function handleScroll(event, movies) {
      let movieListDiv = document.querySelector(".movie-list");
      let cursorPositionX = event.clientX;
      let cursorPositionY = event.clientY;
      if (movieListDiv) {
        let rect = movieListDiv.getBoundingClientRect();

        if (!(cursorPositionY > rect.top && cursorPositionY < rect.bottom)) {
          return movies;
        } else if (!(cursorPositionX > rect.left && cursorPositionX < rect.right)) {
          return movies;
        }
      }

      const delta = event.deltaY || event.touches[0].clientY - get_store_value(startY);
      scrollY.update((n) => Math.max(0, n + delta));

      startY.set(event.touches ? event.touches[0].clientY : startY);

      currentMinYear.set(
        movies.length > 0 && get_store_value(firstVisibleIndex) < movies.length
          ? movies[get_store_value(firstVisibleIndex)].getReleaseYear().toString()
          : ""
      );

      movies = await checkAppendPrepend(movies);

      movies = setVoteCountIndexAndColor(movies);

      event.preventDefault();

      return movies;
    }

    function handleTouchStart(event) {
      startY.set(event.touches[0].clientY);
    }

    async function append(movies) {
      console.log("appending");
      let newMovies = await queryDatabase(movies, "append");
      movies = [...movies, ...newMovies];
      containerHeight.set(movies.length * get_store_value(itemHeight));
      queryCount.update((n) => n + 1);

      return movies;
    }

    async function prependAfterFailure() {
      console.log("prepending after failure");
      let prependDate = get_store_value(minYear);
      let newMovies = await queryDatabase([], "prepend", prependDate);
      let movies = [...newMovies];
      scrollY.update((n) => (newMovies.length - 1) * get_store_value(itemHeight));
      containerHeight.set(movies.length * get_store_value(itemHeight));
      queryCount.update((n) => n + 1);

      return movies;
    }

    async function prepend(movies) {
      console.log("prepending");
      let prependDate = null;

      if (!movies || movies.length == 0) {
        prependDate = get_store_value(currentMinYear);
      }

      let newMovies = await queryDatabase(movies, "prepend", prependDate);
      movies = [...newMovies, ...movies];
      scrollY.update((n) => newMovies.length * get_store_value(itemHeight));
      containerHeight.set(movies.length * get_store_value(itemHeight));
      queryCount.update((n) => n + 1);

      return movies;
    }

    async function checkAppendPrepend(movies) {
      if (
        movies.length > 0 &&
        movies.length - get_store_value(firstVisibleIndex) < 30 &&
        !get_store_value(runningQuery)
      ) {
        if (
          get_store_value(lastAppendedID) == null ||
          movies[movies.length - 1].id != get_store_value(lastAppendedID)
        ) {
          lastAppendedID.set(movies[movies.length - 1].id);
          movies = await append(movies);
        }
      }

      if (
        movies.length > 0 &&
        get_store_value(firstVisibleIndex) == 0 &&
        !get_store_value(runningQuery) &&
        new Date(movies[0].releaseDate) > new Date("12/31/1902")
      ) {
        if (get_store_value(lastPrependedID) == null || movies[0].id != get_store_value(lastPrependedID)) {
          lastPrependedID.set(movies[0].id);
          movies = await prepend(movies);
        }
      }

      return movies;
    }

    function getVisibleMovies(movies) {
      const startIndex = Math.floor(get_store_value(scrollY) / get_store_value(itemHeight));
      const endIndex = Math.min(
        movies.length,
        Math.ceil((get_store_value(scrollY) + get_store_value(viewportHeight)) / get_store_value(itemHeight))
      );
      return movies.slice(startIndex, endIndex);
    }

    async function queryMovies(movies) {
      movies = await queryDatabase(movies, "new");
      scrollY.set(0);
      if (movies && movies.length !== 0) {
        currentMinYear.set(
          movies.length > 0 ? movies[0].getReleaseYear().toString() : ""
        );
        movies = setVoteCountIndexAndColor(movies);
        containerHeight.set(movies.length * get_store_value(itemHeight));
      }
      queryCount.update((n) => n + 1);
      return movies;
    }

    function personSelected(personQuery) {
      allowQueryMutex.set(false);
      selectedPerson.set(personQuery);
      minReviewCount.set(DEFAULT_MIN_REVIEWS);
      maxReviewCount.set(DEFAULT_MAX_REVIEWS);
      minYear.set(DEFAULT_YEAR);
      selectedTitle.set(DEFAULT_TITLE);
      selectedGenres.set(DEFAULT_SELECTED_GENRES);
      selectedLanguages.set(DEFAULT_LANGUAGES);
      allowQueryMutex.set(true);
    }

    function personToPersonQuery(person) {
      return {
        id: person.id,
        name: person.name,
        castOrCrew: person.character ? "cast" : "crew",
        data: person,
      };
    }

    async function getCredits(movie) {
      castAndCrew.set(null);
      if (movie) {
        let credits = await queryCredits(movie);
        if (credits) {
          castAndCrew.set(getTopCastAndCrew(credits.credits[0]));
        }
      }
    }

    async function queryCredits(movie) {
      let target = 'localhost';
      let url = `http://${target}:3000/credits/${movie.id}`;
      let res = await axios$1({
        method: "get",
        url: url,
        headers: {
          "Content-Type": "application/json",
        }
      });

      return res.data;
    }

    function getTopCastAndCrew(credits, numMembers = 5) {
        const result = {
            director: null,
            cast: [],
            crew: []
        };

        if (!credits) {
            return result;
        }

        // Find the director from the crew
        const director = credits.crew.find(member => member.job === 'Director');
        if (director) {
            result.director = director;
        }

        // Sort cast and crew by popularity
        const sortedCast = credits.cast.sort((a, b) => b.popularity - a.popularity);
        const sortedCrew = credits.crew.sort((a, b) => b.popularity - a.popularity);

        // Get top N cast and crew members (excluding the director if already included)
        result.cast = sortedCast.slice(0, numMembers);
        result.crew = sortedCrew
            .filter(member => member.job !== 'Director' && isInterestingCrewMember(member))
        // must contain writer, producer, music, cinematographer, editor, production designer, costume designer
            .slice(0, numMembers);


        console.log('cast and crew result', result);
        return result;
    }

    function isInterestingCrewMember(member) {
        const interestingJobs = ['Writer',  'Music', 'Cinematography', 'Editor', 'Production Design', 'Costume Design', 'Novel', 'Photography', 'Screenplay', 'Book', 'Art Direction'];
        for (let job of interestingJobs) {
            if (member.job.includes(job)) {
                return true;
            }
        }
        return false;
    }

    /* src/components/MovieList.svelte generated by Svelte v3.59.2 */

    const { console: console_1$1 } = globals;
    const file$4 = "src/components/MovieList.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	child_ctx[4] = i;
    	return child_ctx;
    }

    // (26:2) {:else}
    function create_else_block(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			add_location(div, file$4, 26, 2, 729);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop$1,
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(26:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (17:2) {#if movies.length > 0}
    function create_if_block$3(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = getVisibleMovies(/*movies*/ ctx[0]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(target, anchor);
    				}
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*getVisibleMovies, movies*/ 1) {
    				each_value = getVisibleMovies(/*movies*/ ctx[0]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(17:2) {#if movies.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (18:4) {#each getVisibleMovies(movies) as movie, index}
    function create_each_block$2(ctx) {
    	let movieitem;
    	let current;

    	movieitem = new MovieItem({
    			props: {
    				movie: /*movie*/ ctx[2],
    				index: /*index*/ ctx[4],
    				barColor: /*movie*/ ctx[2].color,
    				newYear: /*movie*/ ctx[2].isNewYear
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(movieitem.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(movieitem, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const movieitem_changes = {};
    			if (dirty & /*movies*/ 1) movieitem_changes.movie = /*movie*/ ctx[2];
    			if (dirty & /*movies*/ 1) movieitem_changes.barColor = /*movie*/ ctx[2].color;
    			if (dirty & /*movies*/ 1) movieitem_changes.newYear = /*movie*/ ctx[2].isNewYear;
    			movieitem.$set(movieitem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(movieitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(movieitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(movieitem, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(18:4) {#each getVisibleMovies(movies) as movie, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$3, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*movies*/ ctx[0].length > 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			set_style(div, "user-select", "none");
    			add_location(div, file$4, 15, 0, 468);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('MovieList', slots, []);
    	let { movies } = $$props;
    	const updateMoviesAsyncRequest = asyncStore.getOperation('update-movies');

    	updateMoviesAsyncRequest.subscribe(async n => {
    		console.log('updateMoviesAsyncRequest', n);
    	});

    	$$self.$$.on_mount.push(function () {
    		if (movies === undefined && !('movies' in $$props || $$self.$$.bound[$$self.$$.props['movies']])) {
    			console_1$1.warn("<MovieList> was created without expected prop 'movies'");
    		}
    	});

    	const writable_props = ['movies'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<MovieList> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('movies' in $$props) $$invalidate(0, movies = $$props.movies);
    	};

    	$$self.$capture_state = () => ({
    		MovieItem,
    		queryCount,
    		scrollY,
    		itemHeight,
    		getVisibleMovies,
    		getColor,
    		asyncStore,
    		movies,
    		updateMoviesAsyncRequest
    	});

    	$$self.$inject_state = $$props => {
    		if ('movies' in $$props) $$invalidate(0, movies = $$props.movies);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [movies];
    }

    class MovieList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { movies: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MovieList",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get movies() {
    		throw new Error("<MovieList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set movies(value) {
    		throw new Error("<MovieList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/MovieOnHoverDetails.svelte generated by Svelte v3.59.2 */
    const file$3 = "src/components/MovieOnHoverDetails.svelte";

    // (6:2) {#if $selectedMovie}
    function create_if_block$2(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let div0;
    	let h2;
    	let t1_value = /*$selectedMovie*/ ctx[0].title + "";
    	let t1;
    	let t2;
    	let p0;
    	let strong0;
    	let t4;
    	let t5_value = /*$selectedMovie*/ ctx[0].voteAverage + "";
    	let t5;
    	let t6;
    	let t7_value = /*$selectedMovie*/ ctx[0].voteCount + "";
    	let t7;
    	let t8;
    	let t9;
    	let p1;
    	let strong1;
    	let t11;
    	let t12_value = /*$selectedMovie*/ ctx[0].popularity + "";
    	let t12;
    	let t13;
    	let p2;
    	let strong2;
    	let t15;
    	let t16_value = /*$selectedMovie*/ ctx[0].generateHourString() + "";
    	let t16;
    	let t17;
    	let p3;
    	let strong3;
    	let t19;
    	let t20_value = /*$selectedMovie*/ ctx[0].overview + "";
    	let t20;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			h2 = element("h2");
    			t1 = text(t1_value);
    			t2 = space();
    			p0 = element("p");
    			strong0 = element("strong");
    			strong0.textContent = "Rating:";
    			t4 = space();
    			t5 = text(t5_value);
    			t6 = text(" (");
    			t7 = text(t7_value);
    			t8 = text(")");
    			t9 = space();
    			p1 = element("p");
    			strong1 = element("strong");
    			strong1.textContent = "Popularity:";
    			t11 = space();
    			t12 = text(t12_value);
    			t13 = space();
    			p2 = element("p");
    			strong2 = element("strong");
    			strong2.textContent = "Runtime:";
    			t15 = space();
    			t16 = text(t16_value);
    			t17 = space();
    			p3 = element("p");
    			strong3 = element("strong");
    			strong3.textContent = "Description:";
    			t19 = space();
    			t20 = text(t20_value);

    			if (!src_url_equal(img.src, img_src_value = /*$selectedMovie*/ ctx[0].posterImage
    			? /*$selectedMovie*/ ctx[0].posterImage.src
    			: /*$selectedMovie*/ ctx[0].getPosterUrl())) attr_dev(img, "src", img_src_value);

    			attr_dev(img, "alt", img_alt_value = /*$selectedMovie*/ ctx[0].title);
    			attr_dev(img, "class", "svelte-18l4o9f");
    			add_location(img, file$3, 7, 6, 157);
    			attr_dev(h2, "class", "svelte-18l4o9f");
    			add_location(h2, file$3, 12, 8, 351);
    			add_location(strong0, file$3, 14, 10, 405);
    			add_location(p0, file$3, 13, 8, 391);
    			add_location(strong1, file$3, 17, 10, 523);
    			add_location(p1, file$3, 16, 8, 509);
    			add_location(strong2, file$3, 20, 10, 615);
    			add_location(p2, file$3, 19, 8, 601);
    			add_location(strong3, file$3, 23, 10, 714);
    			add_location(p3, file$3, 22, 8, 700);
    			attr_dev(div0, "class", "movie-info svelte-18l4o9f");
    			add_location(div0, file$3, 11, 6, 318);
    			attr_dev(div1, "class", "movie-item svelte-18l4o9f");
    			add_location(div1, file$3, 6, 4, 126);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, h2);
    			append_dev(h2, t1);
    			append_dev(div0, t2);
    			append_dev(div0, p0);
    			append_dev(p0, strong0);
    			append_dev(p0, t4);
    			append_dev(p0, t5);
    			append_dev(p0, t6);
    			append_dev(p0, t7);
    			append_dev(p0, t8);
    			append_dev(div0, t9);
    			append_dev(div0, p1);
    			append_dev(p1, strong1);
    			append_dev(p1, t11);
    			append_dev(p1, t12);
    			append_dev(div0, t13);
    			append_dev(div0, p2);
    			append_dev(p2, strong2);
    			append_dev(p2, t15);
    			append_dev(p2, t16);
    			append_dev(div0, t17);
    			append_dev(div0, p3);
    			append_dev(p3, strong3);
    			append_dev(p3, t19);
    			append_dev(p3, t20);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$selectedMovie*/ 1 && !src_url_equal(img.src, img_src_value = /*$selectedMovie*/ ctx[0].posterImage
    			? /*$selectedMovie*/ ctx[0].posterImage.src
    			: /*$selectedMovie*/ ctx[0].getPosterUrl())) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*$selectedMovie*/ 1 && img_alt_value !== (img_alt_value = /*$selectedMovie*/ ctx[0].title)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*$selectedMovie*/ 1 && t1_value !== (t1_value = /*$selectedMovie*/ ctx[0].title + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*$selectedMovie*/ 1 && t5_value !== (t5_value = /*$selectedMovie*/ ctx[0].voteAverage + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*$selectedMovie*/ 1 && t7_value !== (t7_value = /*$selectedMovie*/ ctx[0].voteCount + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*$selectedMovie*/ 1 && t12_value !== (t12_value = /*$selectedMovie*/ ctx[0].popularity + "")) set_data_dev(t12, t12_value);
    			if (dirty & /*$selectedMovie*/ 1 && t16_value !== (t16_value = /*$selectedMovie*/ ctx[0].generateHourString() + "")) set_data_dev(t16, t16_value);
    			if (dirty & /*$selectedMovie*/ 1 && t20_value !== (t20_value = /*$selectedMovie*/ ctx[0].overview + "")) set_data_dev(t20, t20_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(6:2) {#if $selectedMovie}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let if_block = /*$selectedMovie*/ ctx[0] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "movie-horizontal svelte-18l4o9f");
    			add_location(div, file$3, 4, 0, 68);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$selectedMovie*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $selectedMovie;
    	validate_store(selectedMovie, 'selectedMovie');
    	component_subscribe($$self, selectedMovie, $$value => $$invalidate(0, $selectedMovie = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('MovieOnHoverDetails', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<MovieOnHoverDetails> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ selectedMovie, $selectedMovie });
    	return [$selectedMovie];
    }

    class MovieOnHoverDetails extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MovieOnHoverDetails",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/MovieDetails.svelte generated by Svelte v3.59.2 */
    const file$2 = "src/components/MovieDetails.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[26] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[29] = list[i];
    	return child_ctx;
    }

    // (92:2) {#if $selectedMovie}
    function create_if_block_1$1(ctx) {
    	let div3;
    	let div0;
    	let button0;
    	let t2;
    	let button1;
    	let t5;
    	let button2;
    	let t8;
    	let button3;
    	let t11;
    	let div2;
    	let show_if = /*$selectedMovie*/ ctx[0].posterImage || /*$selectedMovie*/ ctx[0].getPosterUrl();
    	let t12;
    	let div1;
    	let h2;
    	let t13_value = /*$selectedMovie*/ ctx[0].title + "";
    	let t13;
    	let t14;
    	let i;
    	let t15;
    	let t16;
    	let t17;
    	let t18;
    	let t19;
    	let t20;
    	let t21;
    	let t22;
    	let mounted;
    	let dispose;
    	let if_block0 = show_if && create_if_block_12(ctx);
    	let if_block1 = /*$selectedMovie*/ ctx[0].originalLanguage !== "en" && /*$selectedMovie*/ ctx[0].originalTitle && create_if_block_11(ctx);
    	let if_block2 = /*$selectedMovie*/ ctx[0].genres && /*$selectedMovie*/ ctx[0].genres.length > 0 && create_if_block_10(ctx);
    	let if_block3 = /*$selectedMovie*/ ctx[0].releaseDate && create_if_block_9(ctx);
    	let if_block4 = /*$selectedMovie*/ ctx[0].voteAverage && /*$selectedMovie*/ ctx[0].voteCount && create_if_block_8(ctx);
    	let if_block5 = /*$selectedMovie*/ ctx[0].popularity && create_if_block_7(ctx);
    	let if_block6 = /*$selectedMovie*/ ctx[0].runtime && create_if_block_6(ctx);
    	let if_block7 = /*$selectedMovie*/ ctx[0].overview && create_if_block_5(ctx);
    	let if_block8 = /*$castAndCrew*/ ctx[5] && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = `Viewed ${verbEmojiDict["viewed"]}`;
    			t2 = space();
    			button1 = element("button");
    			button1.textContent = `Interested ${verbEmojiDict["interested"]}`;
    			t5 = space();
    			button2 = element("button");
    			button2.textContent = `Seen It ${verbEmojiDict["seen"]}`;
    			t8 = space();
    			button3 = element("button");
    			button3.textContent = `Loved It! ${verbEmojiDict["loved"]}`;
    			t11 = space();
    			div2 = element("div");
    			if (if_block0) if_block0.c();
    			t12 = space();
    			div1 = element("div");
    			h2 = element("h2");
    			t13 = text(t13_value);
    			t14 = space();
    			i = element("i");
    			t15 = space();
    			if (if_block1) if_block1.c();
    			t16 = space();
    			if (if_block2) if_block2.c();
    			t17 = space();
    			if (if_block3) if_block3.c();
    			t18 = space();
    			if (if_block4) if_block4.c();
    			t19 = space();
    			if (if_block5) if_block5.c();
    			t20 = space();
    			if (if_block6) if_block6.c();
    			t21 = space();
    			if (if_block7) if_block7.c();
    			t22 = space();
    			if (if_block8) if_block8.c();
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "py-2.5 px-5 text-sm font-medium focus:outline-none border rounded-l-lg");
    			toggle_class(button0, "border-gray-200", /*selectedButton*/ ctx[3] !== "viewed");
    			toggle_class(button0, "text-gray-900", /*selectedButton*/ ctx[3] !== "viewed");
    			toggle_class(button0, "bg-white", /*selectedButton*/ ctx[3] !== "viewed");
    			toggle_class(button0, "hover:bg-gray-100", /*selectedButton*/ ctx[3] !== "viewed");
    			toggle_class(button0, "hover:text-blue-700", /*selectedButton*/ ctx[3] !== "viewed");
    			toggle_class(button0, "focus:ring-4", /*selectedButton*/ ctx[3] !== "viewed");
    			toggle_class(button0, "focus:ring-gray-100", /*selectedButton*/ ctx[3] !== "viewed");
    			toggle_class(button0, "bg-gray-500", /*selectedButton*/ ctx[3] === "viewed");
    			toggle_class(button0, "text-white", /*selectedButton*/ ctx[3] === "viewed");
    			toggle_class(button0, "border-gray-500", /*selectedButton*/ ctx[3] === "viewed");
    			toggle_class(button0, "hover:bg-gray-600", /*selectedButton*/ ctx[3] === "viewed");
    			toggle_class(button0, "focus:ring-gray-300", /*selectedButton*/ ctx[3] === "viewed");
    			toggle_class(button0, "shadow-md", /*selectedButton*/ ctx[3] === "viewed");
    			add_location(button0, file$2, 100, 8, 2376);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "py-2.5 px-5 text-sm font-medium focus:outline-none border border-l-0 rounded-none");
    			toggle_class(button1, "border-gray-200", /*selectedButton*/ ctx[3] !== "interested");
    			toggle_class(button1, "text-gray-900", /*selectedButton*/ ctx[3] !== "interested");
    			toggle_class(button1, "bg-white", /*selectedButton*/ ctx[3] !== "interested");
    			toggle_class(button1, "hover:bg-gray-100", /*selectedButton*/ ctx[3] !== "interested");
    			toggle_class(button1, "hover:text-blue-700", /*selectedButton*/ ctx[3] !== "interested");
    			toggle_class(button1, "focus:ring-4", /*selectedButton*/ ctx[3] !== "interested");
    			toggle_class(button1, "focus:ring-gray-100", /*selectedButton*/ ctx[3] !== "interested");
    			toggle_class(button1, "bg-green-500", /*selectedButton*/ ctx[3] === "interested");
    			toggle_class(button1, "text-white", /*selectedButton*/ ctx[3] === "interested");
    			toggle_class(button1, "border-green-500", /*selectedButton*/ ctx[3] === "interested");
    			toggle_class(button1, "hover:bg-green-600", /*selectedButton*/ ctx[3] === "interested");
    			toggle_class(button1, "focus:ring-green-300", /*selectedButton*/ ctx[3] === "interested");
    			toggle_class(button1, "shadow-md", /*selectedButton*/ ctx[3] === "interested");
    			add_location(button1, file$2, 122, 8, 3462);
    			attr_dev(button2, "type", "button");
    			attr_dev(button2, "class", "py-2.5 px-5 text-sm font-medium focus:outline-none border border-l-0 rounded-none");
    			toggle_class(button2, "border-gray-200", /*selectedButton*/ ctx[3] !== "seen");
    			toggle_class(button2, "text-gray-900", /*selectedButton*/ ctx[3] !== "seen");
    			toggle_class(button2, "bg-white", /*selectedButton*/ ctx[3] !== "seen");
    			toggle_class(button2, "hover:bg-gray-100", /*selectedButton*/ ctx[3] !== "seen");
    			toggle_class(button2, "hover:text-blue-700", /*selectedButton*/ ctx[3] !== "seen");
    			toggle_class(button2, "focus:ring-4", /*selectedButton*/ ctx[3] !== "seen");
    			toggle_class(button2, "focus:ring-gray-100", /*selectedButton*/ ctx[3] !== "seen");
    			toggle_class(button2, "bg-blue-500", /*selectedButton*/ ctx[3] === "seen");
    			toggle_class(button2, "text-white", /*selectedButton*/ ctx[3] === "seen");
    			toggle_class(button2, "border-blue-500", /*selectedButton*/ ctx[3] === "seen");
    			toggle_class(button2, "hover:bg-blue-600", /*selectedButton*/ ctx[3] === "seen");
    			toggle_class(button2, "focus:ring-blue-300", /*selectedButton*/ ctx[3] === "seen");
    			toggle_class(button2, "shadow-md", /*selectedButton*/ ctx[3] === "seen");
    			add_location(button2, file$2, 144, 8, 4624);
    			attr_dev(button3, "type", "button");
    			attr_dev(button3, "class", "py-2.5 px-5 text-sm font-medium focus:outline-none border border-l-0 rounded-r-lg");
    			toggle_class(button3, "border-gray-200", /*selectedButton*/ ctx[3] !== "loved");
    			toggle_class(button3, "text-gray-900", /*selectedButton*/ ctx[3] !== "loved");
    			toggle_class(button3, "bg-white", /*selectedButton*/ ctx[3] !== "loved");
    			toggle_class(button3, "hover:bg-gray-100", /*selectedButton*/ ctx[3] !== "loved");
    			toggle_class(button3, "hover:text-blue-700", /*selectedButton*/ ctx[3] !== "loved");
    			toggle_class(button3, "focus:ring-4", /*selectedButton*/ ctx[3] !== "loved");
    			toggle_class(button3, "focus:ring-gray-100", /*selectedButton*/ ctx[3] !== "loved");
    			toggle_class(button3, "bg-red-500", /*selectedButton*/ ctx[3] === "loved");
    			toggle_class(button3, "text-white", /*selectedButton*/ ctx[3] === "loved");
    			toggle_class(button3, "border-red-500", /*selectedButton*/ ctx[3] === "loved");
    			toggle_class(button3, "hover:bg-red-600", /*selectedButton*/ ctx[3] === "loved");
    			toggle_class(button3, "focus:ring-red-300", /*selectedButton*/ ctx[3] === "loved");
    			toggle_class(button3, "shadow-md", /*selectedButton*/ ctx[3] === "loved");
    			add_location(button3, file$2, 166, 8, 5690);
    			attr_dev(div0, "class", "flex justify-center p-4");
    			attr_dev(div0, "role", "group");
    			attr_dev(div0, "aria-label", "Status buttons");
    			add_location(div0, file$2, 94, 6, 2227);
    			attr_dev(i, "class", "fab fa-youtube youtube-icon transition-colors duration-300 group-hover:text-red-500");
    			add_location(i, file$2, 216, 12, 7832);
    			attr_dev(h2, "class", "text-2xl font-bold text-blue-600 cursor-pointer group");
    			add_location(h2, file$2, 207, 10, 7528);
    			attr_dev(div1, "class", "p-6");
    			add_location(div1, file$2, 206, 8, 7500);
    			attr_dev(div2, "class", "flex flex-col items-center");
    			add_location(div2, file$2, 188, 6, 6747);
    			attr_dev(div3, "class", "bg-base-200 card shadow-lg mb-4");
    			add_location(div3, file$2, 92, 4, 2140);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t2);
    			append_dev(div0, button1);
    			append_dev(div0, t5);
    			append_dev(div0, button2);
    			append_dev(div0, t8);
    			append_dev(div0, button3);
    			append_dev(div3, t11);
    			append_dev(div3, div2);
    			if (if_block0) if_block0.m(div2, null);
    			append_dev(div2, t12);
    			append_dev(div2, div1);
    			append_dev(div1, h2);
    			append_dev(h2, t13);
    			append_dev(h2, t14);
    			append_dev(h2, i);
    			append_dev(div1, t15);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div1, t16);
    			if (if_block2) if_block2.m(div1, null);
    			append_dev(div1, t17);
    			if (if_block3) if_block3.m(div1, null);
    			append_dev(div1, t18);
    			if (if_block4) if_block4.m(div1, null);
    			append_dev(div1, t19);
    			if (if_block5) if_block5.m(div1, null);
    			append_dev(div1, t20);
    			if (if_block6) if_block6.m(div1, null);
    			append_dev(div1, t21);
    			if (if_block7) if_block7.m(div1, null);
    			append_dev(div1, t22);
    			if (if_block8) if_block8.m(div1, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[9], false, false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[10], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[11], false, false, false, false),
    					listen_dev(button3, "click", /*click_handler_3*/ ctx[12], false, false, false, false),
    					listen_dev(h2, "click", /*click_handler_5*/ ctx[14], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button0, "border-gray-200", /*selectedButton*/ ctx[3] !== "viewed");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button0, "text-gray-900", /*selectedButton*/ ctx[3] !== "viewed");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button0, "bg-white", /*selectedButton*/ ctx[3] !== "viewed");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button0, "hover:bg-gray-100", /*selectedButton*/ ctx[3] !== "viewed");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button0, "hover:text-blue-700", /*selectedButton*/ ctx[3] !== "viewed");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button0, "focus:ring-4", /*selectedButton*/ ctx[3] !== "viewed");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button0, "focus:ring-gray-100", /*selectedButton*/ ctx[3] !== "viewed");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button0, "bg-gray-500", /*selectedButton*/ ctx[3] === "viewed");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button0, "text-white", /*selectedButton*/ ctx[3] === "viewed");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button0, "border-gray-500", /*selectedButton*/ ctx[3] === "viewed");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button0, "hover:bg-gray-600", /*selectedButton*/ ctx[3] === "viewed");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button0, "focus:ring-gray-300", /*selectedButton*/ ctx[3] === "viewed");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button0, "shadow-md", /*selectedButton*/ ctx[3] === "viewed");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button1, "border-gray-200", /*selectedButton*/ ctx[3] !== "interested");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button1, "text-gray-900", /*selectedButton*/ ctx[3] !== "interested");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button1, "bg-white", /*selectedButton*/ ctx[3] !== "interested");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button1, "hover:bg-gray-100", /*selectedButton*/ ctx[3] !== "interested");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button1, "hover:text-blue-700", /*selectedButton*/ ctx[3] !== "interested");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button1, "focus:ring-4", /*selectedButton*/ ctx[3] !== "interested");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button1, "focus:ring-gray-100", /*selectedButton*/ ctx[3] !== "interested");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button1, "bg-green-500", /*selectedButton*/ ctx[3] === "interested");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button1, "text-white", /*selectedButton*/ ctx[3] === "interested");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button1, "border-green-500", /*selectedButton*/ ctx[3] === "interested");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button1, "hover:bg-green-600", /*selectedButton*/ ctx[3] === "interested");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button1, "focus:ring-green-300", /*selectedButton*/ ctx[3] === "interested");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button1, "shadow-md", /*selectedButton*/ ctx[3] === "interested");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button2, "border-gray-200", /*selectedButton*/ ctx[3] !== "seen");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button2, "text-gray-900", /*selectedButton*/ ctx[3] !== "seen");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button2, "bg-white", /*selectedButton*/ ctx[3] !== "seen");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button2, "hover:bg-gray-100", /*selectedButton*/ ctx[3] !== "seen");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button2, "hover:text-blue-700", /*selectedButton*/ ctx[3] !== "seen");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button2, "focus:ring-4", /*selectedButton*/ ctx[3] !== "seen");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button2, "focus:ring-gray-100", /*selectedButton*/ ctx[3] !== "seen");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button2, "bg-blue-500", /*selectedButton*/ ctx[3] === "seen");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button2, "text-white", /*selectedButton*/ ctx[3] === "seen");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button2, "border-blue-500", /*selectedButton*/ ctx[3] === "seen");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button2, "hover:bg-blue-600", /*selectedButton*/ ctx[3] === "seen");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button2, "focus:ring-blue-300", /*selectedButton*/ ctx[3] === "seen");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button2, "shadow-md", /*selectedButton*/ ctx[3] === "seen");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button3, "border-gray-200", /*selectedButton*/ ctx[3] !== "loved");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button3, "text-gray-900", /*selectedButton*/ ctx[3] !== "loved");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button3, "bg-white", /*selectedButton*/ ctx[3] !== "loved");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button3, "hover:bg-gray-100", /*selectedButton*/ ctx[3] !== "loved");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button3, "hover:text-blue-700", /*selectedButton*/ ctx[3] !== "loved");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button3, "focus:ring-4", /*selectedButton*/ ctx[3] !== "loved");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button3, "focus:ring-gray-100", /*selectedButton*/ ctx[3] !== "loved");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button3, "bg-red-500", /*selectedButton*/ ctx[3] === "loved");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button3, "text-white", /*selectedButton*/ ctx[3] === "loved");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button3, "border-red-500", /*selectedButton*/ ctx[3] === "loved");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button3, "hover:bg-red-600", /*selectedButton*/ ctx[3] === "loved");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button3, "focus:ring-red-300", /*selectedButton*/ ctx[3] === "loved");
    			}

    			if (dirty[0] & /*selectedButton*/ 8) {
    				toggle_class(button3, "shadow-md", /*selectedButton*/ ctx[3] === "loved");
    			}

    			if (dirty[0] & /*$selectedMovie*/ 1) show_if = /*$selectedMovie*/ ctx[0].posterImage || /*$selectedMovie*/ ctx[0].getPosterUrl();

    			if (show_if) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_12(ctx);
    					if_block0.c();
    					if_block0.m(div2, t12);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty[0] & /*$selectedMovie*/ 1 && t13_value !== (t13_value = /*$selectedMovie*/ ctx[0].title + "")) set_data_dev(t13, t13_value);

    			if (/*$selectedMovie*/ ctx[0].originalLanguage !== "en" && /*$selectedMovie*/ ctx[0].originalTitle) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_11(ctx);
    					if_block1.c();
    					if_block1.m(div1, t16);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*$selectedMovie*/ ctx[0].genres && /*$selectedMovie*/ ctx[0].genres.length > 0) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_10(ctx);
    					if_block2.c();
    					if_block2.m(div1, t17);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*$selectedMovie*/ ctx[0].releaseDate) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block_9(ctx);
    					if_block3.c();
    					if_block3.m(div1, t18);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (/*$selectedMovie*/ ctx[0].voteAverage && /*$selectedMovie*/ ctx[0].voteCount) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);
    				} else {
    					if_block4 = create_if_block_8(ctx);
    					if_block4.c();
    					if_block4.m(div1, t19);
    				}
    			} else if (if_block4) {
    				if_block4.d(1);
    				if_block4 = null;
    			}

    			if (/*$selectedMovie*/ ctx[0].popularity) {
    				if (if_block5) {
    					if_block5.p(ctx, dirty);
    				} else {
    					if_block5 = create_if_block_7(ctx);
    					if_block5.c();
    					if_block5.m(div1, t20);
    				}
    			} else if (if_block5) {
    				if_block5.d(1);
    				if_block5 = null;
    			}

    			if (/*$selectedMovie*/ ctx[0].runtime) {
    				if (if_block6) {
    					if_block6.p(ctx, dirty);
    				} else {
    					if_block6 = create_if_block_6(ctx);
    					if_block6.c();
    					if_block6.m(div1, t21);
    				}
    			} else if (if_block6) {
    				if_block6.d(1);
    				if_block6 = null;
    			}

    			if (/*$selectedMovie*/ ctx[0].overview) {
    				if (if_block7) {
    					if_block7.p(ctx, dirty);
    				} else {
    					if_block7 = create_if_block_5(ctx);
    					if_block7.c();
    					if_block7.m(div1, t22);
    				}
    			} else if (if_block7) {
    				if_block7.d(1);
    				if_block7 = null;
    			}

    			if (/*$castAndCrew*/ ctx[5]) {
    				if (if_block8) {
    					if_block8.p(ctx, dirty);
    				} else {
    					if_block8 = create_if_block_2(ctx);
    					if_block8.c();
    					if_block8.m(div1, null);
    				}
    			} else if (if_block8) {
    				if_block8.d(1);
    				if_block8 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (if_block4) if_block4.d();
    			if (if_block5) if_block5.d();
    			if (if_block6) if_block6.d();
    			if (if_block7) if_block7.d();
    			if (if_block8) if_block8.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(92:2) {#if $selectedMovie}",
    		ctx
    	});

    	return block;
    }

    // (190:8) {#if $selectedMovie.posterImage || $selectedMovie.getPosterUrl()}
    function create_if_block_12(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");

    			if (!src_url_equal(img.src, img_src_value = /*$selectedMovie*/ ctx[0].posterImage
    			? /*$selectedMovie*/ ctx[0].posterImage.src
    			: /*$selectedMovie*/ ctx[0].getPosterUrl())) attr_dev(img, "src", img_src_value);

    			attr_dev(img, "class", "w-[350px] transition-shadow duration-200 ease-in-out cursor-pointer blue-glow");
    			attr_dev(img, "alt", img_alt_value = /*$selectedMovie*/ ctx[0].title);
    			add_location(img, file$2, 191, 12, 6925);
    			attr_dev(div, "class", "flex-shrink-0 poster m-2.5 svelte-gr4476");
    			add_location(div, file$2, 190, 10, 6872);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);

    			if (!mounted) {
    				dispose = listen_dev(img, "click", /*click_handler_4*/ ctx[13], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$selectedMovie*/ 1 && !src_url_equal(img.src, img_src_value = /*$selectedMovie*/ ctx[0].posterImage
    			? /*$selectedMovie*/ ctx[0].posterImage.src
    			: /*$selectedMovie*/ ctx[0].getPosterUrl())) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty[0] & /*$selectedMovie*/ 1 && img_alt_value !== (img_alt_value = /*$selectedMovie*/ ctx[0].title)) {
    				attr_dev(img, "alt", img_alt_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_12.name,
    		type: "if",
    		source: "(190:8) {#if $selectedMovie.posterImage || $selectedMovie.getPosterUrl()}",
    		ctx
    	});

    	return block;
    }

    // (221:10) {#if $selectedMovie.originalLanguage !== "en" && $selectedMovie.originalTitle}
    function create_if_block_11(ctx) {
    	let div;
    	let span;
    	let t0_value = getLanguageFlag(/*$selectedMovie*/ ctx[0].originalLanguage) + "";
    	let t0;
    	let t1;
    	let h4;
    	let t2_value = /*$selectedMovie*/ ctx[0].originalTitle + "";
    	let t2;
    	let t3;
    	let i;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			h4 = element("h4");
    			t2 = text(t2_value);
    			t3 = space();
    			i = element("i");
    			attr_dev(span, "class", "mx-2 cursor-pointer transition-transform duration-200 hover:scale-150 z-10 text-2xl");
    			add_location(span, file$2, 222, 14, 8127);
    			attr_dev(i, "class", "fab fa-youtube youtube-icon transition-colors duration-300 group-hover:text-red-500");
    			add_location(i, file$2, 238, 16, 8813);
    			attr_dev(h4, "class", "text-lg text-gray-500 cursor-pointer group");
    			add_location(h4, file$2, 229, 14, 8468);
    			attr_dev(div, "class", "flex items-center mb-2");
    			add_location(div, file$2, 221, 12, 8076);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(div, t1);
    			append_dev(div, h4);
    			append_dev(h4, t2);
    			append_dev(h4, t3);
    			append_dev(h4, i);

    			if (!mounted) {
    				dispose = [
    					listen_dev(span, "click", /*click_handler_6*/ ctx[15], false, false, false, false),
    					listen_dev(h4, "click", /*click_handler_7*/ ctx[16], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$selectedMovie*/ 1 && t0_value !== (t0_value = getLanguageFlag(/*$selectedMovie*/ ctx[0].originalLanguage) + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*$selectedMovie*/ 1 && t2_value !== (t2_value = /*$selectedMovie*/ ctx[0].originalTitle + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_11.name,
    		type: "if",
    		source: "(221:10) {#if $selectedMovie.originalLanguage !== \\\"en\\\" && $selectedMovie.originalTitle}",
    		ctx
    	});

    	return block;
    }

    // (245:10) {#if $selectedMovie.genres && $selectedMovie.genres.length > 0}
    function create_if_block_10(ctx) {
    	let p;
    	let strong;
    	let t1;
    	let span;
    	let each_value_2 = /*$selectedMovie*/ ctx[0].genres;
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			p = element("p");
    			strong = element("strong");
    			strong.textContent = "Genre:";
    			t1 = space();
    			span = element("span");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(strong, file$2, 246, 14, 9107);
    			attr_dev(span, "class", "flex items-center flex-wrap");
    			add_location(span, file$2, 247, 14, 9145);
    			add_location(p, file$2, 245, 12, 9089);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, strong);
    			append_dev(p, t1);
    			append_dev(p, span);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(span, null);
    				}
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$selectedMovie, $selectedGenres*/ 17) {
    				each_value_2 = /*$selectedMovie*/ ctx[0].genres;
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(span, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_10.name,
    		type: "if",
    		source: "(245:10) {#if $selectedMovie.genres && $selectedMovie.genres.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (249:16) {#each $selectedMovie.genres as genre}
    function create_each_block_2(ctx) {
    	let span;
    	let p0;
    	let t0_value = genreEmojiDict[/*genre*/ ctx[29]] + "";
    	let t0;
    	let t1;
    	let p1;
    	let t2_value = /*genre*/ ctx[29] + "";
    	let t2;
    	let t3;
    	let mounted;
    	let dispose;

    	function click_handler_8() {
    		return /*click_handler_8*/ ctx[17](/*genre*/ ctx[29]);
    	}

    	const block = {
    		c: function create() {
    			span = element("span");
    			p0 = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			p1 = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			attr_dev(p0, "class", "text-xl cursor-pointer transition-transform duration-200 mr-1 hover:scale-150 z-10");
    			add_location(p0, file$2, 250, 20, 9319);
    			attr_dev(p1, "class", "m-0");
    			add_location(p1, file$2, 264, 20, 9967);
    			attr_dev(span, "class", "flex items-center mr-4");
    			add_location(span, file$2, 249, 18, 9261);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, p0);
    			append_dev(p0, t0);
    			append_dev(span, t1);
    			append_dev(span, p1);
    			append_dev(p1, t2);
    			append_dev(span, t3);

    			if (!mounted) {
    				dispose = listen_dev(p0, "click", click_handler_8, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*$selectedMovie*/ 1 && t0_value !== (t0_value = genreEmojiDict[/*genre*/ ctx[29]] + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*$selectedMovie*/ 1 && t2_value !== (t2_value = /*genre*/ ctx[29] + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(249:16) {#each $selectedMovie.genres as genre}",
    		ctx
    	});

    	return block;
    }

    // (271:10) {#if $selectedMovie.releaseDate}
    function create_if_block_9(ctx) {
    	let p;
    	let strong;
    	let t1;
    	let t2_value = /*$selectedMovie*/ ctx[0].getFormattedReleaseDate() + "";
    	let t2;

    	const block = {
    		c: function create() {
    			p = element("p");
    			strong = element("strong");
    			strong.textContent = "Release Date:";
    			t1 = space();
    			t2 = text(t2_value);
    			add_location(strong, file$2, 272, 14, 10172);
    			add_location(p, file$2, 271, 12, 10154);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, strong);
    			append_dev(p, t1);
    			append_dev(p, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$selectedMovie*/ 1 && t2_value !== (t2_value = /*$selectedMovie*/ ctx[0].getFormattedReleaseDate() + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(271:10) {#if $selectedMovie.releaseDate}",
    		ctx
    	});

    	return block;
    }

    // (277:10) {#if $selectedMovie.voteAverage && $selectedMovie.voteCount}
    function create_if_block_8(ctx) {
    	let div1;
    	let strong;
    	let t1;
    	let div0;
    	let t3;
    	let t4_value = /*$selectedMovie*/ ctx[0].voteAverage.toFixed(1) + "";
    	let t4;
    	let t5;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			strong = element("strong");
    			strong.textContent = "Rating:";
    			t1 = space();
    			div0 = element("div");
    			div0.textContent = "⭐";
    			t3 = space();
    			t4 = text(t4_value);
    			t5 = text(" / 10");
    			add_location(strong, file$2, 278, 14, 10418);
    			attr_dev(div0, "class", "emoji text-lg cursor-pointer transition-transform duration-200 hover:scale-150 z-10 mx-1");
    			add_location(div0, file$2, 279, 14, 10457);
    			attr_dev(div1, "class", "flex flex-row");
    			add_location(div1, file$2, 277, 12, 10376);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, strong);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div1, t3);
    			append_dev(div1, t4);
    			append_dev(div1, t5);

    			if (!mounted) {
    				dispose = listen_dev(div0, "click", /*click_handler_9*/ ctx[18], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$selectedMovie*/ 1 && t4_value !== (t4_value = /*$selectedMovie*/ ctx[0].voteAverage.toFixed(1) + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(277:10) {#if $selectedMovie.voteAverage && $selectedMovie.voteCount}",
    		ctx
    	});

    	return block;
    }

    // (291:10) {#if $selectedMovie.popularity}
    function create_if_block_7(ctx) {
    	let div1;
    	let strong;
    	let t1;
    	let div0;
    	let t3;
    	let t4_value = /*$selectedMovie*/ ctx[0].voteCount + "";
    	let t4;
    	let t5;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			strong = element("strong");
    			strong.textContent = "Review Count:";
    			t1 = space();
    			div0 = element("div");
    			div0.textContent = "👥";
    			t3 = space();
    			t4 = text(t4_value);
    			t5 = text(" reviews");
    			add_location(strong, file$2, 292, 14, 10950);
    			attr_dev(div0, "class", "emoji text-lg cursor-pointer transition-transform duration-200 hover:scale-150 z-10 mx-1");
    			add_location(div0, file$2, 294, 14, 10996);
    			attr_dev(div1, "class", "flex flex-row");
    			add_location(div1, file$2, 291, 12, 10908);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, strong);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div1, t3);
    			append_dev(div1, t4);
    			append_dev(div1, t5);

    			if (!mounted) {
    				dispose = listen_dev(div0, "click", /*click_handler_10*/ ctx[19], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$selectedMovie*/ 1 && t4_value !== (t4_value = /*$selectedMovie*/ ctx[0].voteCount + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(291:10) {#if $selectedMovie.popularity}",
    		ctx
    	});

    	return block;
    }

    // (307:10) {#if $selectedMovie.runtime}
    function create_if_block_6(ctx) {
    	let p;
    	let strong;
    	let t1;
    	let t2_value = /*$selectedMovie*/ ctx[0].generateHourString() + "";
    	let t2;

    	const block = {
    		c: function create() {
    			p = element("p");
    			strong = element("strong");
    			strong.textContent = "Runtime:";
    			t1 = space();
    			t2 = text(t2_value);
    			add_location(strong, file$2, 308, 14, 11441);
    			add_location(p, file$2, 307, 12, 11423);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, strong);
    			append_dev(p, t1);
    			append_dev(p, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$selectedMovie*/ 1 && t2_value !== (t2_value = /*$selectedMovie*/ ctx[0].generateHourString() + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(307:10) {#if $selectedMovie.runtime}",
    		ctx
    	});

    	return block;
    }

    // (313:10) {#if $selectedMovie.overview}
    function create_if_block_5(ctx) {
    	let p;
    	let strong;
    	let t1;
    	let t2_value = /*$selectedMovie*/ ctx[0].overview + "";
    	let t2;

    	const block = {
    		c: function create() {
    			p = element("p");
    			strong = element("strong");
    			strong.textContent = "Description:";
    			t1 = space();
    			t2 = text(t2_value);
    			add_location(strong, file$2, 314, 14, 11622);
    			add_location(p, file$2, 313, 12, 11604);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, strong);
    			append_dev(p, t1);
    			append_dev(p, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$selectedMovie*/ 1 && t2_value !== (t2_value = /*$selectedMovie*/ ctx[0].overview + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(313:10) {#if $selectedMovie.overview}",
    		ctx
    	});

    	return block;
    }

    // (319:10) {#if $castAndCrew}
    function create_if_block_2(ctx) {
    	let t;
    	let if_block1_anchor;
    	let if_block0 = /*$castAndCrew*/ ctx[5].cast && /*$castAndCrew*/ ctx[5].cast.length > 0 && create_if_block_4(ctx);
    	let if_block1 = /*$castAndCrew*/ ctx[5].crew && /*$castAndCrew*/ ctx[5].crew.length > 0 && create_if_block_3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*$castAndCrew*/ ctx[5].cast && /*$castAndCrew*/ ctx[5].cast.length > 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					if_block0.m(t.parentNode, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*$castAndCrew*/ ctx[5].crew && /*$castAndCrew*/ ctx[5].crew.length > 0) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_3(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(319:10) {#if $castAndCrew}",
    		ctx
    	});

    	return block;
    }

    // (320:12) {#if $castAndCrew.cast && $castAndCrew.cast.length > 0}
    function create_if_block_4(ctx) {
    	let p;
    	let strong;
    	let t1;
    	let ul;
    	let each_value_1 = /*$castAndCrew*/ ctx[5].cast;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			p = element("p");
    			strong = element("strong");
    			strong.textContent = "Cast:";
    			t1 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(strong, file$2, 321, 16, 11869);
    			attr_dev(p, "class", "mt-4");
    			add_location(p, file$2, 320, 14, 11836);
    			add_location(ul, file$2, 323, 14, 11925);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, strong);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(ul, null);
    				}
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$castAndCrew*/ 32) {
    				each_value_1 = /*$castAndCrew*/ ctx[5].cast;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(320:12) {#if $castAndCrew.cast && $castAndCrew.cast.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (325:16) {#each $castAndCrew.cast as cast}
    function create_each_block_1$1(ctx) {
    	let li;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let span;
    	let t1_value = /*cast*/ ctx[26].name + "";
    	let t1;
    	let t2;
    	let t3_value = /*cast*/ ctx[26].character + "";
    	let t3;
    	let t4;
    	let mounted;
    	let dispose;

    	function click_handler_11() {
    		return /*click_handler_11*/ ctx[20](/*cast*/ ctx[26]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			img = element("img");
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = text("as ");
    			t3 = text(t3_value);
    			t4 = space();

    			if (!src_url_equal(img.src, img_src_value = /*cast*/ ctx[26].profile_path
    			? "https://image.tmdb.org/t/p/w185" + /*cast*/ ctx[26].profile_path
    			: "https://via.placeholder.com/48")) attr_dev(img, "src", img_src_value);

    			attr_dev(img, "alt", img_alt_value = /*cast*/ ctx[26].name);
    			attr_dev(img, "class", "rounded-full object-cover");
    			set_style(img, "width", "32px");
    			set_style(img, "height", "32px");
    			add_location(img, file$2, 331, 20, 12279);
    			attr_dev(span, "class", "text-blue-600 pr-1");
    			add_location(span, file$2, 339, 20, 12663);
    			attr_dev(li, "class", "cursor-pointer hover:bg-gray-100 p-2 transition-colors duration-200 flex space-x-2");
    			add_location(li, file$2, 325, 18, 11998);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, img);
    			append_dev(li, t0);
    			append_dev(li, span);
    			append_dev(span, t1);
    			append_dev(li, t2);
    			append_dev(li, t3);
    			append_dev(li, t4);

    			if (!mounted) {
    				dispose = listen_dev(li, "click", click_handler_11, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*$castAndCrew*/ 32 && !src_url_equal(img.src, img_src_value = /*cast*/ ctx[26].profile_path
    			? "https://image.tmdb.org/t/p/w185" + /*cast*/ ctx[26].profile_path
    			: "https://via.placeholder.com/48")) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty[0] & /*$castAndCrew*/ 32 && img_alt_value !== (img_alt_value = /*cast*/ ctx[26].name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty[0] & /*$castAndCrew*/ 32 && t1_value !== (t1_value = /*cast*/ ctx[26].name + "")) set_data_dev(t1, t1_value);
    			if (dirty[0] & /*$castAndCrew*/ 32 && t3_value !== (t3_value = /*cast*/ ctx[26].character + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(325:16) {#each $castAndCrew.cast as cast}",
    		ctx
    	});

    	return block;
    }

    // (345:12) {#if $castAndCrew.crew && $castAndCrew.crew.length > 0}
    function create_if_block_3(ctx) {
    	let p;
    	let strong;
    	let t1;
    	let ul;
    	let each_value = /*$castAndCrew*/ ctx[5].crew;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			p = element("p");
    			strong = element("strong");
    			strong.textContent = "Crew:";
    			t1 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(strong, file$2, 346, 16, 12935);
    			attr_dev(p, "class", "mt-4");
    			add_location(p, file$2, 345, 14, 12902);
    			add_location(ul, file$2, 348, 14, 12991);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, strong);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(ul, null);
    				}
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$castAndCrew*/ 32) {
    				each_value = /*$castAndCrew*/ ctx[5].crew;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(345:12) {#if $castAndCrew.crew && $castAndCrew.crew.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (350:16) {#each $castAndCrew.crew as crew}
    function create_each_block$1(ctx) {
    	let li;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let span;
    	let t1_value = /*crew*/ ctx[23].name + "";
    	let t1;
    	let t2;
    	let t3_value = /*crew*/ ctx[23].job + "";
    	let t3;
    	let t4;
    	let mounted;
    	let dispose;

    	function click_handler_12() {
    		return /*click_handler_12*/ ctx[21](/*crew*/ ctx[23]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			img = element("img");
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = text(": ");
    			t3 = text(t3_value);
    			t4 = space();

    			if (!src_url_equal(img.src, img_src_value = /*crew*/ ctx[23].profile_path
    			? "https://image.tmdb.org/t/p/w185" + /*crew*/ ctx[23].profile_path
    			: "https://via.placeholder.com/48")) attr_dev(img, "src", img_src_value);

    			attr_dev(img, "alt", img_alt_value = /*crew*/ ctx[23].name);
    			attr_dev(img, "class", "rounded-full object-cover");
    			set_style(img, "width", "32px");
    			set_style(img, "height", "32px");
    			add_location(img, file$2, 356, 20, 13345);
    			attr_dev(span, "class", "text-blue-600");
    			add_location(span, file$2, 364, 20, 13729);
    			attr_dev(li, "class", "cursor-pointer hover:bg-gray-100 p-2 transition-colors duration-200 flex space-x-2");
    			add_location(li, file$2, 350, 18, 13064);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, img);
    			append_dev(li, t0);
    			append_dev(li, span);
    			append_dev(span, t1);
    			append_dev(li, t2);
    			append_dev(li, t3);
    			append_dev(li, t4);

    			if (!mounted) {
    				dispose = listen_dev(li, "click", click_handler_12, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*$castAndCrew*/ 32 && !src_url_equal(img.src, img_src_value = /*crew*/ ctx[23].profile_path
    			? "https://image.tmdb.org/t/p/w185" + /*crew*/ ctx[23].profile_path
    			: "https://via.placeholder.com/48")) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty[0] & /*$castAndCrew*/ 32 && img_alt_value !== (img_alt_value = /*crew*/ ctx[23].name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty[0] & /*$castAndCrew*/ 32 && t1_value !== (t1_value = /*crew*/ ctx[23].name + "")) set_data_dev(t1, t1_value);
    			if (dirty[0] & /*$castAndCrew*/ 32 && t3_value !== (t3_value = /*crew*/ ctx[23].job + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(350:16) {#each $castAndCrew.crew as crew}",
    		ctx
    	});

    	return block;
    }

    // (376:2) {#if showModal}
    function create_if_block$1(ctx) {
    	let div1;
    	let div0;
    	let span;
    	let t1;
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			span = element("span");
    			span.textContent = "×";
    			t1 = space();
    			img = element("img");
    			attr_dev(span, "class", "absolute top-2 right-6 text-white text-3xl font-bold cursor-pointer");
    			add_location(span, file$2, 381, 8, 14156);
    			if (!src_url_equal(img.src, img_src_value = /*fullImageUrl*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Full Image");
    			attr_dev(img, "class", "w-full h-auto");
    			add_location(img, file$2, 385, 8, 14312);
    			attr_dev(div0, "class", "relative w-4/5 max-w-xl");
    			add_location(div0, file$2, 380, 6, 14110);
    			attr_dev(div1, "class", "fixed inset-0 z-50 overflow-hidden bg-black bg-opacity-50 flex items-center justify-center");
    			add_location(div1, file$2, 376, 4, 13960);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, span);
    			append_dev(div0, t1);
    			append_dev(div0, img);

    			if (!mounted) {
    				dispose = [
    					listen_dev(span, "click", /*closeModal*/ ctx[7], false, false, false, false),
    					listen_dev(div1, "click", /*closeModal*/ ctx[7], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*fullImageUrl*/ 4 && !src_url_equal(img.src, img_src_value = /*fullImageUrl*/ ctx[2])) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(376:2) {#if showModal}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let t;
    	let if_block0 = /*$selectedMovie*/ ctx[0] && create_if_block_1$1(ctx);
    	let if_block1 = /*showModal*/ ctx[1] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div, "id", "movie-details-div");
    			attr_dev(div, "class", "h-screen overflow-y-auto container mx-auto p-6 custom-scrollbar leading-8 svelte-gr4476");
    			add_location(div, file$2, 87, 0, 1997);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t);
    			if (if_block1) if_block1.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (/*$selectedMovie*/ ctx[0]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					if_block0.m(div, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*showModal*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function openYoutubeSearchUrl(title, year) {
    	window.open(`https://www.youtube.com/results?search_query=${title} (${year}) trailer`);
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let selectedButton;
    	let $selectedMovie;
    	let $selectedGenres;
    	let $castAndCrew;
    	validate_store(selectedMovie, 'selectedMovie');
    	component_subscribe($$self, selectedMovie, $$value => $$invalidate(0, $selectedMovie = $$value));
    	validate_store(selectedGenres, 'selectedGenres');
    	component_subscribe($$self, selectedGenres, $$value => $$invalidate(4, $selectedGenres = $$value));
    	validate_store(castAndCrew, 'castAndCrew');
    	component_subscribe($$self, castAndCrew, $$value => $$invalidate(5, $castAndCrew = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('MovieDetails', slots, []);
    	let showModal = false;
    	let fullImageUrl = "";

    	function getOrSetMovieViewedType(movie) {
    		if (movie) {
    			let type = null;
    			type = getMovieViewedType(movie);

    			if (!type) {
    				addMovie(movie, "ignored");
    				return "ignored";
    			} else {
    				return type;
    			}
    		}
    	}

    	function openImageModal(imageUrl) {
    		$$invalidate(2, fullImageUrl = imageUrl);
    		$$invalidate(1, showModal = true);
    	}

    	function closeModal() {
    		$$invalidate(1, showModal = false);
    	}

    	function handleButtonClick(buttonType) {
    		if (buttonType == selectedButton) {
    			addMovie($selectedMovie, "ignored");
    		} else {
    			addMovie($selectedMovie, buttonType);
    		}
    	}

    	history.subscribe(n => {
    		if ($selectedMovie) {
    			$$invalidate(3, selectedButton = getMovieViewedType($selectedMovie));
    		}
    	});

    	// if selected movie changes scroll the movie details to the top
    	onMount(() => {
    		selectedMovie.subscribe(n => {
    			document.getElementById("movie-details-div").scrollTo(0, 0);
    		});
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<MovieDetails> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => handleButtonClick("viewed");
    	const click_handler_1 = () => handleButtonClick("interested");
    	const click_handler_2 = () => handleButtonClick("seen");
    	const click_handler_3 = () => handleButtonClick("loved");

    	const click_handler_4 = () => openImageModal($selectedMovie.posterImage
    	? $selectedMovie.posterImage.src
    	: $selectedMovie.getPosterUrl());

    	const click_handler_5 = () => openYoutubeSearchUrl($selectedMovie.title, $selectedMovie.getReleaseYear());
    	const click_handler_6 = () => selectedLanguages.set([$selectedMovie.originalLanguage]);
    	const click_handler_7 = () => openYoutubeSearchUrl($selectedMovie.originalTitle, $selectedMovie.getReleaseYear());

    	const click_handler_8 = genre => {
    		if ($selectedGenres.includes(genre)) {
    			selectedGenres.update(genres => genres.filter(g => g !== genre));
    		} else {
    			selectedGenres.update(genres => [...genres, genre]);
    		}
    	};

    	const click_handler_9 = () => {
    		minVoteAverage.set($selectedMovie.voteAverage.toFixed(1));
    	};

    	const click_handler_10 = () => {
    		minReviewCount.set($selectedMovie.voteCount);
    	};

    	const click_handler_11 = cast => {
    		personSelected(personToPersonQuery(cast));
    	};

    	const click_handler_12 = crew => {
    		personSelected(personToPersonQuery(crew));
    	};

    	$$self.$capture_state = () => ({
    		allowQueryMutex,
    		minYear,
    		selectedMovie,
    		selectedPerson,
    		DEFAULT_LANGUAGES,
    		DEFAULT_MAX_REVIEWS,
    		DEFAULT_MIN_REVIEWS,
    		DEFAULT_PERSON,
    		DEFAULT_SELECTED_GENRES,
    		DEFAULT_TITLE,
    		DEFAULT_YEAR,
    		selectedTitle,
    		minReviewCount,
    		maxReviewCount,
    		selectedGenres,
    		selectedLanguages,
    		minPopularity,
    		minVoteAverage,
    		castAndCrew,
    		genreEmojiDict,
    		getLanguageFlag,
    		verbEmojiDict,
    		MovieOnHoverDetails,
    		onMount,
    		addMovie,
    		getMovieViewedType,
    		history,
    		personSelected,
    		personToPersonQuery,
    		showModal,
    		fullImageUrl,
    		getOrSetMovieViewedType,
    		openImageModal,
    		closeModal,
    		openYoutubeSearchUrl,
    		handleButtonClick,
    		selectedButton,
    		$selectedMovie,
    		$selectedGenres,
    		$castAndCrew
    	});

    	$$self.$inject_state = $$props => {
    		if ('showModal' in $$props) $$invalidate(1, showModal = $$props.showModal);
    		if ('fullImageUrl' in $$props) $$invalidate(2, fullImageUrl = $$props.fullImageUrl);
    		if ('selectedButton' in $$props) $$invalidate(3, selectedButton = $$props.selectedButton);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*$selectedMovie*/ 1) {
    			$$invalidate(3, selectedButton = getOrSetMovieViewedType($selectedMovie));
    		}
    	};

    	return [
    		$selectedMovie,
    		showModal,
    		fullImageUrl,
    		selectedButton,
    		$selectedGenres,
    		$castAndCrew,
    		openImageModal,
    		closeModal,
    		handleButtonClick,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		click_handler_8,
    		click_handler_9,
    		click_handler_10,
    		click_handler_11,
    		click_handler_12
    	];
    }

    class MovieDetails extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MovieDetails",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/CastAndCrewCard.svelte generated by Svelte v3.59.2 */
    const file$1 = "src/components/CastAndCrewCard.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (12:2) {#if $castAndCrew}
    function create_if_block(ctx) {
    	let div0;
    	let h2;
    	let t1;
    	let t2;
    	let div1;
    	let t3;
    	let if_block = /*director*/ ctx[1] && create_if_block_1(ctx);
    	let each_value_1 = /*castList*/ ctx[3];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*crewList*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Cast & Crew";
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t3 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h2, "class", "text-lg font-semibold");
    			add_location(h2, file$1, 13, 6, 415);
    			set_style(div0, "flex", "1");
    			set_style(div0, "align-content", "center");
    			add_location(div0, file$1, 12, 4, 365);
    			attr_dev(div1, "class", "grid grid-cols-5 gap-2");
    			set_style(div1, "flex", "4");
    			add_location(div1, file$1, 39, 4, 1273);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h2);
    			append_dev(div0, t1);
    			if (if_block) if_block.m(div0, null);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				if (each_blocks_1[i]) {
    					each_blocks_1[i].m(div1, null);
    				}
    			}

    			append_dev(div1, t3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div1, null);
    				}
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*director*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*personSelected, personToPersonQuery, castList*/ 8) {
    				each_value_1 = /*castList*/ ctx[3];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div1, t3);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*personSelected, personToPersonQuery, crewList*/ 4) {
    				each_value = /*crewList*/ ctx[2];
    				validate_each_argument(each_value);
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
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (if_block) if_block.d();
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(12:2) {#if $castAndCrew}",
    		ctx
    	});

    	return block;
    }

    // (16:6) {#if director}
    function create_if_block_1(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let div0;
    	let p0;
    	let t1_value = /*director*/ ctx[1].name + "";
    	let t1;
    	let t2;
    	let p1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			p0 = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			p1.textContent = "Director";

    			if (!src_url_equal(img.src, img_src_value = /*director*/ ctx[1].profile_path
    			? "https://image.tmdb.org/t/p/w185" + /*director*/ ctx[1].profile_path
    			: "https://via.placeholder.com/48")) attr_dev(img, "src", img_src_value);

    			attr_dev(img, "alt", img_alt_value = /*director*/ ctx[1].name);
    			attr_dev(img, "class", "rounded-full object-cover");
    			set_style(img, "width", "96px");
    			set_style(img, "height", "96px");
    			add_location(img, file$1, 22, 10, 728);
    			attr_dev(p0, "class", "text-sm font-semibold");
    			add_location(p0, file$1, 31, 12, 1075);
    			attr_dev(p1, "class", "text-xs text-gray-500");
    			add_location(p1, file$1, 34, 12, 1168);
    			attr_dev(div0, "class", "ml-2");
    			add_location(div0, file$1, 30, 10, 1044);
    			attr_dev(div1, "class", "flex items-center p-2 items-center profile-container svelte-otglj");
    			add_location(div1, file$1, 16, 8, 532);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(p0, t1);
    			append_dev(div0, t2);
    			append_dev(div0, p1);

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", /*click_handler*/ ctx[4], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*director*/ 2 && !src_url_equal(img.src, img_src_value = /*director*/ ctx[1].profile_path
    			? "https://image.tmdb.org/t/p/w185" + /*director*/ ctx[1].profile_path
    			: "https://via.placeholder.com/48")) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*director*/ 2 && img_alt_value !== (img_alt_value = /*director*/ ctx[1].name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*director*/ 2 && t1_value !== (t1_value = /*director*/ ctx[1].name + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(16:6) {#if director}",
    		ctx
    	});

    	return block;
    }

    // (41:6) {#each castList as person}
    function create_each_block_1(ctx) {
    	let div2;
    	let div1;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let div0;
    	let p0;
    	let t1_value = /*person*/ ctx[7].name + "";
    	let t1;
    	let t2;
    	let p1;
    	let t3_value = /*person*/ ctx[7].character + "";
    	let t3;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[5](/*person*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			p0 = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			t3 = text(t3_value);

    			if (!src_url_equal(img.src, img_src_value = /*person*/ ctx[7].profile_path
    			? "https://image.tmdb.org/t/p/w185" + /*person*/ ctx[7].profile_path
    			: "https://via.placeholder.com/48")) attr_dev(img, "src", img_src_value);

    			attr_dev(img, "alt", img_alt_value = /*person*/ ctx[7].name);
    			attr_dev(img, "class", "rounded-full object-cover");
    			set_style(img, "width", "48px");
    			set_style(img, "height", "48px");
    			add_location(img, file$1, 48, 12, 1588);
    			attr_dev(p0, "class", "text-sm font-semibold truncate");
    			add_location(p0, file$1, 57, 14, 1967);
    			attr_dev(p1, "class", "text-xs text-gray-500 truncate");
    			add_location(p1, file$1, 58, 14, 2041);
    			attr_dev(div0, "class", "ml-2");
    			set_style(div0, "width", "50%");
    			add_location(div0, file$1, 56, 12, 1914);
    			attr_dev(div1, "class", "flex items-center p-2 profile-container svelte-otglj");
    			add_location(div1, file$1, 47, 10, 1522);
    			add_location(div2, file$1, 41, 8, 1367);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(p0, t1);
    			append_dev(div0, t2);
    			append_dev(div0, p1);
    			append_dev(p1, t3);

    			if (!mounted) {
    				dispose = listen_dev(div2, "click", click_handler_1, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*castList*/ 8 && !src_url_equal(img.src, img_src_value = /*person*/ ctx[7].profile_path
    			? "https://image.tmdb.org/t/p/w185" + /*person*/ ctx[7].profile_path
    			: "https://via.placeholder.com/48")) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*castList*/ 8 && img_alt_value !== (img_alt_value = /*person*/ ctx[7].name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*castList*/ 8 && t1_value !== (t1_value = /*person*/ ctx[7].name + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*castList*/ 8 && t3_value !== (t3_value = /*person*/ ctx[7].character + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(41:6) {#each castList as person}",
    		ctx
    	});

    	return block;
    }

    // (65:6) {#each crewList as person}
    function create_each_block(ctx) {
    	let div2;
    	let div1;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let div0;
    	let p0;
    	let t1_value = /*person*/ ctx[7].name + "";
    	let t1;
    	let t2;
    	let p1;
    	let t3_value = /*person*/ ctx[7].job + "";
    	let t3;
    	let t4;
    	let mounted;
    	let dispose;

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[6](/*person*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			p0 = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			t3 = text(t3_value);
    			t4 = space();

    			if (!src_url_equal(img.src, img_src_value = /*person*/ ctx[7].profile_path
    			? "https://image.tmdb.org/t/p/w185" + /*person*/ ctx[7].profile_path
    			: "https://via.placeholder.com/48")) attr_dev(img, "src", img_src_value);

    			attr_dev(img, "alt", img_alt_value = /*person*/ ctx[7].name);
    			attr_dev(img, "class", "rounded-full object-cover");
    			set_style(img, "width", "48px");
    			set_style(img, "height", "48px");
    			add_location(img, file$1, 72, 12, 2434);
    			attr_dev(p0, "class", "text-sm font-semibold truncate");
    			add_location(p0, file$1, 81, 14, 2813);
    			attr_dev(p1, "class", "text-xs text-gray-500 truncate");
    			add_location(p1, file$1, 82, 14, 2887);
    			attr_dev(div0, "class", "ml-2");
    			set_style(div0, "width", "50%");
    			add_location(div0, file$1, 80, 12, 2760);
    			attr_dev(div1, "class", "flex items-center p-2 profile-container svelte-otglj");
    			add_location(div1, file$1, 71, 10, 2368);
    			add_location(div2, file$1, 65, 8, 2213);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(p0, t1);
    			append_dev(div0, t2);
    			append_dev(div0, p1);
    			append_dev(p1, t3);
    			append_dev(div2, t4);

    			if (!mounted) {
    				dispose = listen_dev(div2, "click", click_handler_2, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*crewList*/ 4 && !src_url_equal(img.src, img_src_value = /*person*/ ctx[7].profile_path
    			? "https://image.tmdb.org/t/p/w185" + /*person*/ ctx[7].profile_path
    			: "https://via.placeholder.com/48")) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*crewList*/ 4 && img_alt_value !== (img_alt_value = /*person*/ ctx[7].name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*crewList*/ 4 && t1_value !== (t1_value = /*person*/ ctx[7].name + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*crewList*/ 4 && t3_value !== (t3_value = /*person*/ ctx[7].job + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(65:6) {#each crewList as person}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let if_block = /*$castAndCrew*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "flex flex-row justify-evenly w-full p-3");
    			add_location(div, file$1, 10, 0, 286);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$castAndCrew*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let castList;
    	let crewList;
    	let director;
    	let $castAndCrew;
    	validate_store(castAndCrew, 'castAndCrew');
    	component_subscribe($$self, castAndCrew, $$value => $$invalidate(0, $castAndCrew = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CastAndCrewCard', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CastAndCrewCard> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		personSelected(personToPersonQuery(director));
    	};

    	const click_handler_1 = person => {
    		personSelected(personToPersonQuery(person));
    	};

    	const click_handler_2 = person => {
    		personSelected(personToPersonQuery(person));
    	};

    	$$self.$capture_state = () => ({
    		castAndCrew,
    		get: get_store_value,
    		personSelected,
    		personToPersonQuery,
    		director,
    		crewList,
    		castList,
    		$castAndCrew
    	});

    	$$self.$inject_state = $$props => {
    		if ('director' in $$props) $$invalidate(1, director = $$props.director);
    		if ('crewList' in $$props) $$invalidate(2, crewList = $$props.crewList);
    		if ('castList' in $$props) $$invalidate(3, castList = $$props.castList);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$castAndCrew*/ 1) {
    			$$invalidate(3, castList = $castAndCrew?.cast);
    		}

    		if ($$self.$$.dirty & /*$castAndCrew*/ 1) {
    			$$invalidate(2, crewList = $castAndCrew?.crew);
    		}

    		if ($$self.$$.dirty & /*$castAndCrew*/ 1) {
    			$$invalidate(1, director = $castAndCrew?.director);
    		}
    	};

    	return [
    		$castAndCrew,
    		director,
    		crewList,
    		castList,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class CastAndCrewCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CastAndCrewCard",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.59.2 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let div0;
    	let header;
    	let t0;
    	let div2;
    	let div1;
    	let castandcrewcard;
    	let t1;
    	let movielist;
    	let t2;
    	let div3;
    	let moviedetails;
    	let current;
    	header = new Header({ $$inline: true });
    	castandcrewcard = new CastAndCrewCard({ $$inline: true });

    	movielist = new MovieList({
    			props: {
    				itemHeight,
    				viewportHeight,
    				movies: /*movies*/ ctx[0]
    			},
    			$$inline: true
    		});

    	moviedetails = new MovieDetails({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			create_component(header.$$.fragment);
    			t0 = space();
    			div2 = element("div");
    			div1 = element("div");
    			create_component(castandcrewcard.$$.fragment);
    			t1 = space();
    			create_component(movielist.$$.fragment);
    			t2 = space();
    			div3 = element("div");
    			create_component(moviedetails.$$.fragment);
    			attr_dev(div0, "class", "flex-shrink-0 basis-[10%]");
    			add_location(div0, file, 140, 2, 3821);
    			attr_dev(div1, "class", "sliding-div bg-base-200 rounded-b-lg svelte-vvrpn7");
    			toggle_class(div1, "slide-in", /*showSlidingDiv*/ ctx[1]);
    			add_location(div1, file, 144, 4, 3972);
    			attr_dev(div2, "class", "movie-list flex-grow basis-[80%] h-screen relative overflow-hidden");
    			add_location(div2, file, 143, 2, 3887);
    			attr_dev(div3, "class", "flex-shrink-0 basis-[10%]");
    			add_location(div3, file, 150, 2, 4229);
    			attr_dev(main, "class", "flex");
    			add_location(main, file, 139, 0, 3799);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			mount_component(header, div0, null);
    			append_dev(main, t0);
    			append_dev(main, div2);
    			append_dev(div2, div1);
    			mount_component(castandcrewcard, div1, null);
    			append_dev(div2, t1);
    			mount_component(movielist, div2, null);
    			append_dev(main, t2);
    			append_dev(main, div3);
    			mount_component(moviedetails, div3, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*showSlidingDiv*/ 2) {
    				toggle_class(div1, "slide-in", /*showSlidingDiv*/ ctx[1]);
    			}

    			const movielist_changes = {};
    			if (dirty & /*movies*/ 1) movielist_changes.movies = /*movies*/ ctx[0];
    			movielist.$set(movielist_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(castandcrewcard.$$.fragment, local);
    			transition_in(movielist.$$.fragment, local);
    			transition_in(moviedetails.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(castandcrewcard.$$.fragment, local);
    			transition_out(movielist.$$.fragment, local);
    			transition_out(moviedetails.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    			destroy_component(castandcrewcard);
    			destroy_component(movielist);
    			destroy_component(moviedetails);
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

    function instance($$self, $$props, $$invalidate) {
    	let $allowQueryMutex;
    	let $maxVoteAverage;
    	let $minVoteAverage;
    	let $maxPopularity;
    	let $minPopularity;
    	let $maxRuntime;
    	let $minRuntime;
    	let $selectedViewTypeVerbs;
    	let $selectedTitle;
    	let $selectedGenres;
    	let $selectedLanguages;
    	let $selectedPerson;
    	let $maxReviewCount;
    	let $minReviewCount;
    	let $minYear;
    	let $selectedMovie;
    	validate_store(allowQueryMutex, 'allowQueryMutex');
    	component_subscribe($$self, allowQueryMutex, $$value => $$invalidate(2, $allowQueryMutex = $$value));
    	validate_store(maxVoteAverage, 'maxVoteAverage');
    	component_subscribe($$self, maxVoteAverage, $$value => $$invalidate(3, $maxVoteAverage = $$value));
    	validate_store(minVoteAverage, 'minVoteAverage');
    	component_subscribe($$self, minVoteAverage, $$value => $$invalidate(4, $minVoteAverage = $$value));
    	validate_store(maxPopularity, 'maxPopularity');
    	component_subscribe($$self, maxPopularity, $$value => $$invalidate(5, $maxPopularity = $$value));
    	validate_store(minPopularity, 'minPopularity');
    	component_subscribe($$self, minPopularity, $$value => $$invalidate(6, $minPopularity = $$value));
    	validate_store(maxRuntime, 'maxRuntime');
    	component_subscribe($$self, maxRuntime, $$value => $$invalidate(7, $maxRuntime = $$value));
    	validate_store(minRuntime, 'minRuntime');
    	component_subscribe($$self, minRuntime, $$value => $$invalidate(8, $minRuntime = $$value));
    	validate_store(selectedViewTypeVerbs, 'selectedViewTypeVerbs');
    	component_subscribe($$self, selectedViewTypeVerbs, $$value => $$invalidate(9, $selectedViewTypeVerbs = $$value));
    	validate_store(selectedTitle, 'selectedTitle');
    	component_subscribe($$self, selectedTitle, $$value => $$invalidate(10, $selectedTitle = $$value));
    	validate_store(selectedGenres, 'selectedGenres');
    	component_subscribe($$self, selectedGenres, $$value => $$invalidate(11, $selectedGenres = $$value));
    	validate_store(selectedLanguages, 'selectedLanguages');
    	component_subscribe($$self, selectedLanguages, $$value => $$invalidate(12, $selectedLanguages = $$value));
    	validate_store(selectedPerson, 'selectedPerson');
    	component_subscribe($$self, selectedPerson, $$value => $$invalidate(13, $selectedPerson = $$value));
    	validate_store(maxReviewCount, 'maxReviewCount');
    	component_subscribe($$self, maxReviewCount, $$value => $$invalidate(14, $maxReviewCount = $$value));
    	validate_store(minReviewCount, 'minReviewCount');
    	component_subscribe($$self, minReviewCount, $$value => $$invalidate(15, $minReviewCount = $$value));
    	validate_store(minYear, 'minYear');
    	component_subscribe($$self, minYear, $$value => $$invalidate(16, $minYear = $$value));
    	validate_store(selectedMovie, 'selectedMovie');
    	component_subscribe($$self, selectedMovie, $$value => $$invalidate(17, $selectedMovie = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let movies = [];

    	async function updateMovies() {
    		if ($allowQueryMutex) {
    			transitionCount.update(n => n + 1);
    			let new_movies = await queryMovies(movies);
    			new_movies = await queryMovies(new_movies);

    			if (!new_movies || new_movies.length == 0) {
    				new_movies = await prependAfterFailure();
    			} else {
    				new_movies = await prepend(new_movies);
    			}

    			console.log("new_movies", new_movies);
    			new_movies = setVoteCountIndexAndColor(new_movies);
    			console.log("new_movies 2", new_movies);
    			$$invalidate(0, movies = [...new_movies]);
    		} else {
    			console.log("query blocked by mutex");
    		}
    	}

    	onMount(async () => {
    		document.addEventListener("wheel", async event => {
    			$$invalidate(0, movies = await handleScroll(event, movies));
    		}); // Mouse wheel scroll

    		document.addEventListener("touchmove", async event => {
    			$$invalidate(0, movies = await handleScroll(event, movies));
    		}); // Touch scroll

    		document.addEventListener("touchstart", event => handleTouchStart(event)); // Touch start
    		handleResize();
    		window.addEventListener("resize", handleResize);

    		return () => {
    			document.addEventListener("wheel", async event => {
    				$$invalidate(0, movies = await handleScroll(event, movies));
    			}); // Mouse wheel scroll

    			document.addEventListener("touchmove", async event => {
    				$$invalidate(0, movies = await handleScroll(event, movies));
    			}); // Touch scroll

    			document.addEventListener("touchstart", event => handleTouchStart(event)); // Touch start
    			window.removeEventListener("resize", handleResize);
    		};
    	});

    	let showLeftSidebar = false;
    	let showRightSidebar = false;
    	let smallScreen = true;

    	function handleResize() {
    		smallScreen = window.matchMedia("(max-width: 639px)").matches;

    		if (!smallScreen) {
    			showLeftSidebar = true;
    			showRightSidebar = true;
    		} else {
    			showLeftSidebar = false;
    			showRightSidebar = false;
    		}
    	}

    	// New reactive variable to control slide-in
    	let showSlidingDiv = false;

    	onMount(() => {
    		// Trigger the slide-in after the component mounts
    		$$invalidate(1, showSlidingDiv = true);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		tick,
    		Header,
    		MovieList,
    		MovieDetails,
    		checkAppendPrepend,
    		handleScroll,
    		handleTouchStart,
    		prepend,
    		prependAfterFailure,
    		queryMovies,
    		setVoteCountIndexAndColor,
    		getCredits,
    		queryCount,
    		scrollY,
    		selectedMovie,
    		itemHeight,
    		viewportHeight,
    		minReviewCount,
    		maxReviewCount,
    		maxRuntime,
    		minRuntime,
    		selectedPerson,
    		minYear,
    		selectedLanguages,
    		selectedGenres,
    		selectedTitle,
    		currentMinYear,
    		allowQueryMutex,
    		selectedViewTypeVerbs,
    		minPopularity,
    		maxPopularity,
    		minVoteAverage,
    		maxVoteAverage,
    		transitionCount,
    		asyncStore,
    		CastAndCrewCard,
    		get: get_store_value,
    		movies,
    		updateMovies,
    		showLeftSidebar,
    		showRightSidebar,
    		smallScreen,
    		handleResize,
    		showSlidingDiv,
    		$allowQueryMutex,
    		$maxVoteAverage,
    		$minVoteAverage,
    		$maxPopularity,
    		$minPopularity,
    		$maxRuntime,
    		$minRuntime,
    		$selectedViewTypeVerbs,
    		$selectedTitle,
    		$selectedGenres,
    		$selectedLanguages,
    		$selectedPerson,
    		$maxReviewCount,
    		$minReviewCount,
    		$minYear,
    		$selectedMovie
    	});

    	$$self.$inject_state = $$props => {
    		if ('movies' in $$props) $$invalidate(0, movies = $$props.movies);
    		if ('showLeftSidebar' in $$props) showLeftSidebar = $$props.showLeftSidebar;
    		if ('showRightSidebar' in $$props) showRightSidebar = $$props.showRightSidebar;
    		if ('smallScreen' in $$props) smallScreen = $$props.smallScreen;
    		if ('showSlidingDiv' in $$props) $$invalidate(1, showSlidingDiv = $$props.showSlidingDiv);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$selectedMovie*/ 131072) {
    			// Reactive statement to update movies when selectedPerson, minYear, or castOrCrewQuery changes
    			asyncStore.load("get-credits", getCredits, $selectedMovie);
    		}

    		if ($$self.$$.dirty & /*$minYear, $minReviewCount, $maxReviewCount, $selectedPerson, $selectedLanguages, $selectedGenres, $selectedTitle, $allowQueryMutex, $selectedViewTypeVerbs, $minRuntime, $maxRuntime, $minPopularity, $maxPopularity, $minVoteAverage, $maxVoteAverage*/ 131068) {
    			asyncStore.load("update-movies", updateMovies, ($maxVoteAverage));
    		}
    	};

    	return [
    		movies,
    		showSlidingDiv,
    		$allowQueryMutex,
    		$maxVoteAverage,
    		$minVoteAverage,
    		$maxPopularity,
    		$minPopularity,
    		$maxRuntime,
    		$minRuntime,
    		$selectedViewTypeVerbs,
    		$selectedTitle,
    		$selectedGenres,
    		$selectedLanguages,
    		$selectedPerson,
    		$maxReviewCount,
    		$minReviewCount,
    		$minYear,
    		$selectedMovie
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

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
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
