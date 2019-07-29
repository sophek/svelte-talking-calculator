
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
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
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function set_style(node, key, value) {
        node.style.setProperty(key, value);
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
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
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
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
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
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
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
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
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
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
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /*
    object-assign
    (c) Sindre Sorhus
    @license MIT
    */
    /* eslint-disable no-unused-vars */
    var getOwnPropertySymbols = Object.getOwnPropertySymbols;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var propIsEnumerable = Object.prototype.propertyIsEnumerable;

    function toObject(val) {
    	if (val === null || val === undefined) {
    		throw new TypeError('Object.assign cannot be called with null or undefined');
    	}

    	return Object(val);
    }

    function shouldUseNative() {
    	try {
    		if (!Object.assign) {
    			return false;
    		}

    		// Detect buggy property enumeration order in older V8 versions.

    		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
    		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
    		test1[5] = 'de';
    		if (Object.getOwnPropertyNames(test1)[0] === '5') {
    			return false;
    		}

    		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
    		var test2 = {};
    		for (var i = 0; i < 10; i++) {
    			test2['_' + String.fromCharCode(i)] = i;
    		}
    		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
    			return test2[n];
    		});
    		if (order2.join('') !== '0123456789') {
    			return false;
    		}

    		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
    		var test3 = {};
    		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
    			test3[letter] = letter;
    		});
    		if (Object.keys(Object.assign({}, test3)).join('') !==
    				'abcdefghijklmnopqrst') {
    			return false;
    		}

    		return true;
    	} catch (err) {
    		// We don't expect any of the above to throw, but better to be safe.
    		return false;
    	}
    }

    var objectAssign = shouldUseNative() ? Object.assign : function (target, source) {
    	var from;
    	var to = toObject(target);
    	var symbols;

    	for (var s = 1; s < arguments.length; s++) {
    		from = Object(arguments[s]);

    		for (var key in from) {
    			if (hasOwnProperty.call(from, key)) {
    				to[key] = from[key];
    			}
    		}

    		if (getOwnPropertySymbols) {
    			symbols = getOwnPropertySymbols(from);
    			for (var i = 0; i < symbols.length; i++) {
    				if (propIsEnumerable.call(from, symbols[i])) {
    					to[symbols[i]] = from[symbols[i]];
    				}
    			}
    		}
    	}

    	return to;
    };

    function _stripInsignificantZeros(str, decimal) {
      const parts = str.split(decimal);
      const integerPart = parts[0];
      const decimalPart = parts[1].replace(/0+$/, '');

      if (decimalPart.length > 0) {
        return integerPart + decimal + decimalPart;
      }

      return integerPart;
    }

    /**
     * The library's settings configuration object.
     *
     * Contains default parameters for currency and number formatting
     */
    const settings = {
      symbol: '$',        // default currency symbol is '$'
      format: '%s%v',     // controls output: %s = symbol, %v = value (can be object, see docs)
      decimal: '.',       // decimal point separator
      thousand: ',',      // thousands separator
      precision: 2,       // decimal places
      grouping: 3,        // digit grouping (not implemented yet)
      stripZeros: false,  // strip insignificant zeros from decimal part
      fallback: 0         // value returned on unformat() failure
    };

    /**
     * Check and normalise the value of precision (must be positive integer)
     */
    function _checkPrecision(val, base) {
      val = Math.round(Math.abs(val));
      return isNaN(val) ? base : val;
    }

    /**
     * Implementation of toFixed() that treats floats more like decimals
     *
     * Fixes binary rounding issues (eg. (0.615).toFixed(2) === '0.61') that present
     * problems for accounting- and finance-related software.
     *
     * ```js
     *  (0.615).toFixed(2);           // "0.61" (native toFixed has rounding issues)
     *  accounting.toFixed(0.615, 2); // "0.62"
     * ```
     *
     * @method toFixed
     * @for accounting
     * @param {Float}   value         The float to be treated as a decimal number.
     * @param {Number} [precision=2] The number of decimal digits to keep.
     * @return {String} The given number transformed into a string with the given precission
     */
    function toFixed(value, precision) {
      precision = _checkPrecision(precision, settings.precision);
      const power = Math.pow(10, precision);

      // Multiply up by precision, round accurately, then divide and use native toFixed():
      return (Math.round((value + 1e-8) * power) / power).toFixed(precision);
    }

    /**
     * Format a number, with comma-separated thousands and custom precision/decimal places
     * Alias: `accounting.format()`
     *
     * Localise by overriding the precision and thousand / decimal separators
     *
     * ```js
     * accounting.formatNumber(5318008);              // 5,318,008
     * accounting.formatNumber(9876543.21, { precision: 3, thousand: " " }); // 9 876 543.210
     * ```
     *
     * @method formatNumber
     * @for accounting
     * @param {Number}        number The number to be formatted.
     * @param {Object}        [opts={}] Object containing all the options of the method.
     * @return {String} The given number properly formatted.
      */
    function formatNumber(number, opts = {}) {
      // Resursively format arrays:
      if (Array.isArray(number)) {
        return number.map((val) => formatNumber(val, opts));
      }

      // Build options object from second param (if object) or all params, extending defaults:
      opts = objectAssign({},
        settings,
        opts
      );

      // Do some calc:
      const negative = number < 0 ? '-' : '';
      const base = parseInt(toFixed(Math.abs(number), opts.precision), 10) + '';
      const mod = base.length > 3 ? base.length % 3 : 0;

      // Format the number:
      const formatted = negative +
        (mod ? base.substr(0, mod) + opts.thousand : '') +
          base.substr(mod).replace(/(\d{3})(?=\d)/g, '$1' + opts.thousand) +
            (opts.precision > 0 ? opts.decimal + toFixed(Math.abs(number), opts.precision).split('.')[1] : '');

      return opts.stripZeros ? _stripInsignificantZeros(formatted, opts.decimal) : formatted;
    }

    /* src/components/Calculator.svelte generated by Svelte v3.6.9 */

    const file = "src/components/Calculator.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.key = list[i];
    	return child_ctx;
    }

    // (242:10) {#each keys as key}
    function create_each_block(ctx) {
    	var button, t0_value = ctx.key, t0, t1, button_class_value, dispose;

    	return {
    		c: function create() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			attr(button, "class", button_class_value = "" + (ctx.operatorString(ctx.key) === '' ? 'button is-primary' : 'button is-warning') + " svelte-b3hhef");
    			add_location(button, file, 242, 12, 4915);
    			dispose = listen(button, "click", ctx.operatorString(ctx.key) === '' ? ctx.append(ctx.key) : ctx.functionFactory(ctx.key));
    		},

    		m: function mount(target, anchor) {
    			insert(target, button, anchor);
    			append(button, t0);
    			append(button, t1);
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(button);
    			}

    			dispose();
    		}
    	};
    }

    function create_fragment(ctx) {
    	var div8, div7, div1, div0, h2, t1, div3, div2, h1, t2, t3, div6, div5, div4;

    	var each_value = ctx.keys;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			div8 = element("div");
    			div7 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Svelte Talking Calculator";
    			t1 = space();
    			div3 = element("div");
    			div2 = element("div");
    			h1 = element("h1");
    			t2 = text(ctx.display);
    			t3 = space();
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr(h2, "class", "svelte-b3hhef");
    			add_location(h2, file, 230, 8, 4612);
    			attr(div0, "class", "column");
    			set_style(div0, "padding-bottom", "20px");
    			add_location(div0, file, 229, 6, 4555);
    			attr(div1, "class", "columns");
    			add_location(div1, file, 228, 4, 4527);
    			attr(h1, "class", "display svelte-b3hhef");
    			add_location(h1, file, 235, 8, 4732);
    			attr(div2, "class", "column");
    			add_location(div2, file, 234, 6, 4703);
    			attr(div3, "class", "columns");
    			add_location(div3, file, 233, 4, 4675);
    			attr(div4, "class", "keypad svelte-b3hhef");
    			add_location(div4, file, 240, 8, 4852);
    			attr(div5, "class", "column");
    			add_location(div5, file, 239, 6, 4823);
    			attr(div6, "class", "columns");
    			add_location(div6, file, 238, 4, 4795);
    			attr(div7, "class", "column");
    			add_location(div7, file, 227, 2, 4502);
    			attr(div8, "class", "columns calculator svelte-b3hhef");
    			add_location(div8, file, 226, 0, 4467);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div8, anchor);
    			append(div8, div7);
    			append(div7, div1);
    			append(div1, div0);
    			append(div0, h2);
    			append(div7, t1);
    			append(div7, div3);
    			append(div3, div2);
    			append(div2, h1);
    			append(h1, t2);
    			append(div7, t3);
    			append(div7, div6);
    			append(div6, div5);
    			append(div5, div4);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div4, null);
    			}
    		},

    		p: function update(changed, ctx) {
    			if (changed.display) {
    				set_data(t2, ctx.display);
    			}

    			if (changed.operatorString || changed.keys) {
    				each_value = ctx.keys;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div4, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div8);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	

      //TextToSpeech.talk("Hello Beautiful World!");
      let previous = null;
      let display = 0;
      let operator = null;
      let operatorClicked = false;
      let decimalCount = 0;

      const keys = [
        "AC",
        "+/-",
        "%",
        "÷",
        7,
        8,
        9,
        "x",
        4,
        5,
        6,
        "-",
        1,
        2,
        3,
        "+",
        0,
        ".",
        "Del",
        "="
      ];

      const sign = () => {
        $$invalidate('display', display =
          display < 0
            ? (display = display - display * 2)
            : (display = display - display * 2)); $$invalidate('display', display);
      };

      const percent = () => {
        $$invalidate('display', display = display / 100);
      };

      const append = number => () => {
        //sayIt(number);

        //Check if there is a decimal, if so increase the decimal count
        if (display.toString().indexOf(".") > -1) {
          decimalCount += 1;
        }
        //If there is a decimal and the next number is a decimal just return true
        if (decimalCount > 1 && number === ".") {
          return;
        }

        if (operatorClicked === true) {
          $$invalidate('display', display = "");
          operatorClicked = false;
        }
        $$invalidate('display', display = display === 0 ? (display = number) : "" + display + number); $$invalidate('display', display);
        console.log("operatorClicked", operatorClicked);
      };

      const functionFactory = func => () => {
        if (func !== "AC") {
          sayIt(formatNumber(display));
        }

        let operatorAction = "";
        switch (func) {
          case "AC":
            operatorAction = clear();
            break;
          case "+":
            operatorAction = add();
            sayIt("plus");
            break;
          case "x":
            operatorAction = multiply();
            sayIt("times");
            break;
          case "÷":
            operatorAction = divide();
            sayIt("divided by");
            break;
          case "-":
            operatorAction = subtract();
            sayIt("subtract");
            break;
          case "=":
            sayIt("equals");
            operatorAction = equal();
            break;
          case "Del":
            operatorAction = back();
            break;
          case "%":
            sayIt("percent");
            operatorAction = percent();
            break;
          case "+/-":
            operatorAction = sign();
            break;
          default:
            operatorAction = "";
        }
        if (operatorAction !== "") {
          decimalCount = 0;
        }
        return operatorAction;
      };

      const divide = () => {
        operator = (a, b) => a / b;
        previous = display;
        operatorClicked = true;
      };

      const back = () => {
        $$invalidate('display', display = display.slice(0, -1));
      };

      const multiply = () => {
        operator = (a, b) => a * b;
        previous = display;
        operatorClicked = true;
      };

      const subtract = () => {
        operator = (a, b) => a - b;
        previous = display;
        operatorClicked = true;
      };

      const add = () => {
        console.log("add");
        operator = (a, b) => a + b;
        previous = display;
        operatorClicked = true;
      };

      const equal = () => {
        console.log("equal");
        $$invalidate('display', display = operator(Number(previous), Number(display)));
        sayIt(formatNumber(display));
        previous = null;
        operatorClicked = true;
      };

      const clear = () => { const $$result = (display = ""); $$invalidate('display', display); return $$result; };

      const operatorString = operator => {
        if (operator === ".") {
          return "";
        }
        return isNaN(operator) ? operator : "";
      };

      const sayIt = phrase => {
        if ("speechSynthesis" in window) {
          var msg = new SpeechSynthesisUtterance(phrase.replace(".00", ""));
          window.speechSynthesis.speak(msg);
        }
      };

      onMount(async () => {
        // const res = await fetch(
        //   `https://jsonplaceholder.typicode.com/photos?_limit=20`
        // );
        // photos = await res.json();
        // console.log(photos);
      });

    	return {
    		display,
    		keys,
    		append,
    		functionFactory,
    		operatorString
    	};
    }

    class Calculator extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, []);
    	}
    }

    /* src/App.svelte generated by Svelte v3.6.9 */

    function create_fragment$1(ctx) {
    	var current;

    	var calculator = new Calculator({ $$inline: true });

    	return {
    		c: function create() {
    			calculator.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(calculator, target, anchor);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(calculator.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(calculator.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(calculator, detaching);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { name } = $$props;

    	const writable_props = ['name'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('name' in $$props) $$invalidate('name', name = $$props.name);
    	};

    	return { name };
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["name"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.name === undefined && !('name' in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
