steal("can/util/can.js", function (can) {

	// # can.attr
	// Central location for attribute changing to occur, used to trigger an
	// `attributes` event on elements. This enables the user to do (jQuery example): `$(el).bind("attributes", function(ev) { ... })` where `ev` contains `attributeName` and `oldValue`

	// Polyfill for setImmediate (only works in IE 10+)
	var setImmediate = window.setImmediate || function (cb) {
			return setTimeout(cb, 0);
		},
		attr = {
			// Keep a reference to MutationObserver because we need to trigger
			// events for browsers that do not support it. For browsers that do support
			// it the MutationObserver is created in can/util/jquery
			MutationObserver: window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver,

			/**
			 * @property {Object.<String,(String|Boolean|function)>} can.view.attr.map
			 * @parent can.view.elements
			 *
			 *
			 * A mapping of
			 * special attributes to their JS property. For example:
			 *
			 *     "class" : "className"
			 *
			 * means get or set `element.className`. And:
			 *
			 *      "checked" : true
			 *
			 * means set `element.checked = true`.
			 *
			 *
			 * If the attribute name is not found, it's assumed to use
			 * `element.getAttribute` and `element.setAttribute`.
			 */
			map: {
				"class": "className",
				"value": "value",
				"innerText": "innerText",
				"textContent": "textContent",
				"checked": true,
				"disabled": true,
				"readonly": true,
				"required": true,
				// setter function for the src attribute
				src: function (el, val) {
					if (val == null || val === "") {
						el.removeAttribute("src");
						return null;
					} else {
						el.setAttribute("src", val);
						return val;
					}
				},
				// setter function for a style attribute
				style: function (el, val) {
					return el.style.cssText = val || "";
				}
			},
			// Elements whos default value we should set
			defaultValue: ["input", "textarea"],
			// ## attr.set
			// Set the value an attribute on an element
			set: function (el, attrName, val) {
				var oldValue;
				if (!attr.MutationObserver) {
					// Get the current value
					oldValue = attr.get(el, attrName);
				}

				var tagName = el.nodeName.toString()
					.toLowerCase(),
					// The property of `attr.map`
					prop = attr.map[attrName],
					newValue;
				if (typeof prop === "function") {
					// This is a special property call the setter
					newValue = prop(el, val);
				} else if (prop === true) {
					// This is a boolean property, set to true
					// Always set to true, setting to false is the same
					// as removing the attribute
					newValue = el[attrName] = true;

					if (attrName === "checked" && el.type === "radio") {
						if (can.inArray(tagName, attr.defaultValue) >= 0) {
							// Also set it's defaultChecked value to true
							el.defaultChecked = true;
						}
					}

				} else if (prop) {
					// Set the value as val
					newValue = el[prop] = val;
					if (prop === "value" && can.inArray(tagName, attr.defaultValue) >= 0) {
						el.defaultValue = val;
					}
				} else {
					// Fallback to using `setAttribute`
					el.setAttribute(attrName, val);
					newValue = val;
				}
				if (!attr.MutationObserver && newValue !== oldValue) {
					// Trigger the "attributes" event for this element.
					attr.trigger(el, attrName, oldValue);
				}
			},
			// ## attr.trigger
			// Trigger an "attributes" event on an element
			trigger: function (el, attrName, oldValue) {
				// Only trigger if someone has bound
				if (can.data(can.$(el), "canHasAttributesBindings")) {
					// Queue up a function to be called asynchronously
					return setImmediate(function () {
						can.trigger(el, {
							type: "attributes",
							attributeName: attrName,
							target: el,
							oldValue: oldValue,
							bubbles: false
						}, []);
					});
				}
			},
			// ## attr.get
			// Gets the value of an attribute.
			get: function (el, attrName) {
				// Default to a blank string for IE7/8
				// Try to get the attribute from the element before
				// using `getAttribute`
				return (attr.map[attrName] && el[attr.map[attrName]] ?
					el[attr.map[attrName]] :
					el.getAttribute(attrName));
			},
			// ## attr.remove
			// Removes the attribute.
			remove: function (el, attrName) {
				var oldValue;
				if (!attr.MutationObserver) {
					oldValue = attr.get(el, attrName);
				}

				var setter = attr.map[attrName];
				// A special type of attribute, call the function
				if (typeof setter === "function") {
					setter(el, undefined);
				}
				if (setter === true) {
					el[attrName] = false;
				} else if (typeof setter === "string") {
					el[setter] = "";
				} else {
					el.removeAttribute(attrName);
				}
				if (!attr.MutationObserver && oldValue != null) {
					// Trigger that the attribute has changed
					attr.trigger(el, attrName, oldValue);
				}

			},
			// ## attr.has
			has: (function () {
				// Use hasAttribute if the browser supports it,
				// otherwise check that the attribute's value is not null
				var el = document.createElement('div');
				if (el.hasAttribute) {
					return function (el, name) {
						return el.hasAttribute(name);
					};
				} else {
					return function (el, name) {
						return el.getAttribute(name) !== null;
					};
				}
			})()
		};

	return attr;

});
