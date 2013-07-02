/*! © Microsoft. All rights reserved. */
//js\RuntimeInit.js
(function (global) {
	global.Blend = global.Blend || { };
	global._BlendGlobal = global;
})(this);


//js\Blend.js
/// These functions provide the WinJS functionality of defining Namespace.
/// Also adds Blend to the global namespace.

(function baseInit(global, undefined) {
	"use strict";

	function initializeProperties(target, members) {
		var keys = Object.keys(members);
		var properties;
		var i, len;
		for (i = 0, len = keys.length; i < len; i++) {
			var key = keys[i];
			var enumerable = key.charCodeAt(0) !== /*_*/95;
			var member = members[key];
			if (member && typeof member === "object") {
				if (member.value !== undefined || typeof member.get === "function" || typeof member.set === "function") {
					if (member.enumerable === undefined) {
						member.enumerable = enumerable;
					}
					properties = properties || {};
					properties[key] = member;
					continue;
				}
			}
			if (!enumerable) {
				properties = properties || {};
				properties[key] = { value: member, enumerable: enumerable, configurable: true, writable: true };
				continue;
			}
			target[key] = member;
		}
		if (properties) {
			Object.defineProperties(target, properties);
		}
	};

	(function (Blend) {
		Blend.Namespace = Blend.Namespace || {};

		function defineWithParent(parentNamespace, name, members) {
			/// <summary locid="Blend.Namespace.defineWithParent">
			/// Defines a new namespace with the specified name under the specified parent namespace.
			/// </summary>
			/// <param name="parentNamespace" type="Object" locid="Blend.Namespace.defineWithParent_p:parentNamespace">
			/// The parent namespace.
			/// </param>
			/// <param name="name" type="String" locid="Blend.Namespace.defineWithParent_p:name">
			/// The name of the new namespace.
			/// </param>
			/// <param name="members" type="Object" locid="Blend.Namespace.defineWithParent_p:members">
			/// The members of the new namespace.
			/// </param>
			/// <returns type="Object" locid="Blend.Namespace.defineWithParent_returnValue">
			/// The newly-defined namespace.
			/// </returns>
			var currentNamespace = parentNamespace,
				namespaceFragments = name.split(".");

			for (var i = 0, len = namespaceFragments.length; i < len; i++) {
				var namespaceName = namespaceFragments[i];
				if (!currentNamespace[namespaceName]) {
					Object.defineProperty(currentNamespace, namespaceName,
					{ value: {}, writable: false, enumerable: true, configurable: true }
					);
				}
				currentNamespace = currentNamespace[namespaceName];
			}

			if (members) {
				initializeProperties(currentNamespace, members);
			}

			return currentNamespace;
		}

		function define(name, members) {
			/// <summary locid="Blend.Namespace.define">
			/// Defines a new namespace with the specified name.
			/// </summary>
			/// <param name="name" type="String" locid="Blend.Namespace.define_p:name">
			/// The name of the namespace. This could be a dot-separated name for nested namespaces.
			/// </param>
			/// <param name="members" type="Object" locid="Blend.Namespace.define_p:members">
			/// The members of the new namespace.
			/// </param>
			/// <returns type="Object" locid="Blend.Namespace.define_returnValue">
			/// The newly-defined namespace.
			/// </returns>

			return defineWithParent(global, name, members);
		}

		// Establish members of the "Blend.Namespace" namespace
		Object.defineProperties(Blend.Namespace, {
			defineWithParent: { value: defineWithParent, writable: true, enumerable: true, configurable: true },

			define: { value: define, writable: true, enumerable: true, configurable: true },

			initializeProperties: { value: initializeProperties, writable: true, enumerable: true, configurable: true },
		});
	})(global.Blend);
})(_BlendGlobal);

//js\Class.js
/// These functions provide the WinJS functionality of defining a Class and deriving from a Class

/// <reference path="Blend.js" />
/// <reference path="Util.js" />
(function (Blend) {
	"use strict";

	function processMetadata(metadata, thisClass, baseClass) {
		// Adds property metadata to a class (if it has been specified). Includes metadata defined for base
		// class first (which may be overridden by metadata for this class).
		//
		// Example metadata:
		//
		// 	{
		// 		name: { type: String, required: true },
		// 		animations: { type: Array, elementType: Animations.SelectorAnimation }
		// 	}
		//
		// "type" follows the rules for JavaScript intellisense comments. It should always be specified.
		// "elementType" should be specified if "type" is "Array".
		// "required" defaults to "false".

		var classMetadata = {};
		var hasMetadata = false;

		if (baseClass && baseClass._metadata) {
			hasMetadata = true;
			Blend.Namespace.initializeProperties(classMetadata, baseClass._metadata);
		}

		if (metadata) {
			hasMetadata = true;
			Blend.Namespace.initializeProperties(classMetadata, metadata);
		}
		
		if (hasMetadata) {
			Object.defineProperty(thisClass, "_metadata", { value: classMetadata, enumerable: false });
		}
	}

	function define(constructor, instanceMembers, staticMembers, metadata) {
		/// <summary locid="Blend.Class.define">
		/// Defines a class using the given constructor and the specified instance members.
		/// </summary>
		/// <param name="constructor" type="Function" locid="Blend.Class.define_p:constructor">
		/// A constructor function that is used to instantiate this class.
		/// </param>
		/// <param name="instanceMembers" type="Object" locid="Blend.Class.define_p:instanceMembers">
		/// The set of instance fields, properties, and methods made available on the class.
		/// </param>
		/// <param name="staticMembers" type="Object" locid="Blend.Class.define_p:staticMembers">
		/// The set of static fields, properties, and methods made available on the class.
		/// </param>
		/// <param name="metadata" type="Object" locid="Blend.Class.define_p:metadata">
		/// Metadata describing the class's properties. This metadata is used to validate JSON data, and so is
		/// only useful for types that can appear in JSON. 
		/// </param>
		/// <returns type="Function" locid="Blend.Class.define_returnValue">
		/// The newly-defined class.
		/// </returns>
		constructor = constructor || function () { };
		if (instanceMembers) {
			Blend.Namespace.initializeProperties(constructor.prototype, instanceMembers);
		}
		if (staticMembers) {
			Blend.Namespace.initializeProperties(constructor, staticMembers);
		}
		processMetadata(metadata, constructor);
		return constructor;
	}

	function derive(baseClass, constructor, instanceMembers, staticMembers, metadata) {
		/// <summary locid="Blend.Class.derive">
		/// Creates a sub-class based on the supplied baseClass parameter, using prototypal inheritance.
		/// </summary>
		/// <param name="baseClass" type="Function" locid="Blend.Class.derive_p:baseClass">
		/// The class to inherit from.
		/// </param>
		/// <param name="constructor" type="Function" locid="Blend.Class.derive_p:constructor">
		/// A constructor function that is used to instantiate this class.
		/// </param>
		/// <param name="instanceMembers" type="Object" locid="Blend.Class.derive_p:instanceMembers">
		/// The set of instance fields, properties, and methods to be made available on the class.
		/// </param>
		/// <param name="staticMembers" type="Object" locid="Blend.Class.derive_p:staticMembers">
		/// The set of static fields, properties, and methods to be made available on the class.
		/// </param>
		/// <param name="metadata" type="Object" locid="Blend.Class.derive_p:metadata">
		/// Metadata describing the class's properties. This metadata is used to validate JSON data, and so is
		/// only useful for types that can appear in JSON. 
		/// </param>
		/// <returns type="Function" locid="Blend.Class.derive_returnValue">
		/// The newly-defined class.
		/// </returns>
		if (baseClass) {
			constructor = constructor || function () { };
			var basePrototype = baseClass.prototype;
			constructor.prototype = Object.create(basePrototype);
			Object.defineProperty(constructor.prototype, "constructor", { value: constructor, writable: true, configurable: true, enumerable: true });
			if (instanceMembers) {
				Blend.Namespace.initializeProperties(constructor.prototype, instanceMembers);
			}
			if (staticMembers) {
				Blend.Namespace.initializeProperties(constructor, staticMembers);
			}
			processMetadata(metadata, constructor, baseClass);
			return constructor;
		} else {
			return define(constructor, instanceMembers, staticMembers, metadata);
		}
	}

	function mix(constructor) {
		/// <summary locid="Blend.Class.mix">
		/// Defines a class using the given constructor and the union of the set of instance members
		/// specified by all the mixin objects. The mixin parameter list is of variable length.
		/// </summary>
		/// <param name="constructor" locid="Blend.Class.mix_p:constructor">
		/// A constructor function that is used to instantiate this class.
		/// </param>
		/// <returns type="Function" locid="Blend.Class.mix_returnValue">
		/// The newly-defined class.
		/// </returns>

		constructor = constructor || function () { };
		var i, len;
		for (i = 1, len = arguments.length; i < len; i++) {
			Blend.Namespace.initializeProperties(constructor.prototype, arguments[i]);
		}
		return constructor;
	}

	// Establish members of "Blend.Class" namespace
	Blend.Namespace.define("Blend.Class", {
		define: define,
		derive: derive,
		mix: mix

	});
})(_BlendGlobal.Blend);

//js\Resources.js

/// <reference path="Blend.js" />

(function (Blend) {
	Blend.Namespace.defineWithParent(Blend, "Resources",
	{
		getString: function (resourceId) {
			/// <summary locid="Blend.Resources.getString">
			/// Retrieves the resource string that has the specified resource id.
			/// </summary>
			/// <param name="resourceId" type="Number" locid="Blend.Resources.getString._p:resourceId">
			/// The resource id of the string to retrieve.
			/// </param>
			/// <returns type="Object" locid="Blend.Resources.getString_returnValue">
			/// An object that can contain these properties:
			/// 
			/// value:
			/// The value of the requested string. This property is always present.
			/// 
			/// empty:
			/// A value that specifies whether the requested string wasn't found.
			/// If its true, the string wasn't found. If its false or undefined,
			/// the requested string was found.
			/// 
			/// lang:
			/// The language of the string, if specified. This property is only present
			/// for multi-language resources.
			/// 
			/// </returns>

			// Temporary string handling - these strings will be moved into a resource file once we have that
			// sorted out.
			var strings =
			{
				"Blend.Util.JsonUnexpectedProperty": "Property \"{0}\" is not expected for {1}.",
				"Blend.Util.JsonTypeMismatch": "{0}.{1}: Found type: {2}; Expected type: {3}.",
				"Blend.Util.JsonPropertyMissing": "Required property \"{0}.{1}\" is missing or invalid.",
				"Blend.Util.JsonArrayTypeMismatch": "{0}.{1}[{2}]: Found type: {3}; Expected type: {4}.",
				"Blend.Util.JsonArrayElementMissing": "{0}.{1}[{2}] is missing or invalid.",
				"Blend.Util.JsonEnumValueNotString": "{0}.{1}: Found type: {2}; Expected type: String (choice of: {3}).",
				"Blend.Util.JsonInvalidEnumValue": "{0}.{1}: Invalid value. Found: {2}; Expected one of: {3}.",
				"Blend.Util.NoMetadataForType": "No property metadata found for type {0}.",
				"Blend.Util.NoTypeMetadataForProperty": "No type metadata specified for {0}.{1}.",
				"Blend.Util.NoElementTypeMetadataForArrayProperty": "No element type metadata specified for {0}.{1}[].",
				"Blend.Resources.MalformedFormatStringInput": "Malformed, did you mean to escape your '{0}'?",
				"Blend.ActionTrees.JsonNotArray": "ActionTrees JSON data must be an array ({0}).",
				"Blend.ActionTrees.JsonDuplicateActionTreeName": "Duplicate action tree name \"{0}\" ({1}).",
			};

			var result = strings[resourceId];
			return result ? { value: result } : { value: resourceId, empty: true };
		},

		formatString: function (string) {
			/// <summary>
			/// Formats a string replacing tokens in the form {n} with specified parameters. For example,
			/// 'Blend.Resources.formatString("I have {0} fingers.", 10)' would return "I have 10 fingers".
			/// </summary>
			/// <param name="string">
			/// The string to format.
			/// </param>
			var args = arguments;
			if (args.length > 1) {
				string = string.replace(/({{)|(}})|{(\d+)}|({)|(})/g, function (unused, left, right, index, illegalLeft, illegalRight) {
					if (illegalLeft || illegalRight) {
						throw Blend.Resources.formatString(Blend.Resources.getString("Blend.Resources.MalformedFormatStringInput").value, illegalLeft || illegalRight);
					}
					return (left && "{") || (right && "}") || args[(index | 0) + 1];
				});
			}
			return string;
		}
	});

})(_BlendGlobal.Blend);

//js\Util.js

/// <reference path="Blend.js" />
/// <reference path="Resources.js" />

(function (Blend, global) {
	"use strict";

	/// Blend.Util namespace provides utility functions for the Blend's javascript runtime.
	Blend.Namespace.define("Blend.Util", {
		_loadFileXmlHttpRequest: null,
		_dataKey: "_msBlendDataKey",

		markSupportedForProcessing: {
			value: function (func) {
				/// <summary locid="WinJS.Utilities.markSupportedForProcessing">
				/// Marks a function as being compatible with declarative processing, such as WinJS.UI.processAll
				/// or WinJS.Binding.processAll.
				/// </summary>
				/// <param name="func" type="Function" locid="WinJS.Utilities.markSupportedForProcessing_p:func">
				/// The function to be marked as compatible with declarative processing.
				/// </param>
				/// <returns type="Function" locid="WinJS.Utilities.markSupportedForProcessing_returnValue">
				/// The input function.
				/// </returns>

				func.supportedForProcessing = true;
				return func;
			},
			configurable: false,
			writable: false,
			enumerable: true
		},

		data: function (element) {
			/// <summary locid="Blend.Util.data">
			/// Gets the data value associated with the specified element.
			/// </summary>
			/// <param name="element" type="HTMLElement" locid="Blend.Util.data_p:element">
			/// The element.
			/// </param>
			/// <returns type="Object" locid="Blend.Util.data_returnValue">
			/// The value associated with the element.
			/// </returns>

			if (!element[Blend.Util._dataKey]) {
				element[Blend.Util._dataKey] = {};
			}
			return element[Blend.Util._dataKey];
		},

		loadFile: function (file) {
			/// <summary locid="Blend.Util.loadFile">
			/// returns the string content of the file whose path is specified in the argument.
			/// </summary>
			/// <param name="file" type="Function" locid="Blend.Util.define_p:file">
			/// The file path
			/// </param>
			/// <returns type="string" locid="Blend.Util.define_returnValue">
			/// The string content of the file.
			/// </returns>
			if (!Blend.Util._loadFileXmlHttpRequest) {
				Blend.Util._loadFileXmlHttpRequest = new XMLHttpRequest();
			}

			if (Blend.Util._loadFileXmlHttpRequest) {
				try {
					Blend.Util._loadFileXmlHttpRequest.open("GET", file, false);
				} catch (e) {
					if (document.location.protocol === "file:") {
						// IE's XMLHttpRequest object won't allow access to local file system, so use ActiveX control instead
						Blend.Util._loadFileXmlHttpRequest = new ActiveXObject("Msxml2.XMLHTTP");
						Blend.Util._loadFileXmlHttpRequest.open("GET", file, false);
					}
				}

				if (Blend.Util._loadFileXmlHttpRequest.overrideMimeType) {
					Blend.Util._loadFileXmlHttpRequest.overrideMimeType("text/plain");
				}
				Blend.Util._loadFileXmlHttpRequest.send(null);
				return Blend.Util._loadFileXmlHttpRequest.responseText;
			}

			return "";
		},

		parseJson: function (configBlock, instance) {
			/// <summary locid="Blend.Util.parseJson">
			/// Parses the configBlock and if valid instance is passed, the parsed values 
			/// are set as properties on the instance.
			/// </summary>
			/// <param name="configBlock" type="Object" locid="Blend.Util.parseJson_p:configBlock">
			/// The configBlock (JSON) structure.
			/// </param>
			/// <param name="instance" type="object" locid="Blend.Util.define_parseJson:instance">
			/// The instance whose properties are set based on the configBlock.
			/// </param>
			/// <returns type="object" locid="Blend.Util.define_returnValue">
			/// The instance created based on the config block.
			/// </returns>
			try {
				var parseResult = JSON.parse(configBlock, Blend.Util.jsonReviver);
				if (instance) {
					for (var propertyName in parseResult) {
						if (propertyName !== "type") {
							instance[propertyName] = parseResult[propertyName];
						}
					}
					return instance;
				} else {
					return parseResult;
				}
			}
			catch (e) {
				return parseResult;
			}
		},

		jsonReviver: function (key, value) {
			/// <summary locid="Blend.Util.jsonReviver">
			/// This is a function that will be called for every key and value at every level of the final result during JSON.Parse method while parsing the JSON data structure. 
			/// Each value will be replaced by the result of the reviver function. This can be used to reform generic objects into instances of pseudoclasses.
			/// </summary>
			/// <param name="key" type="object" locid="Blend.Util.define_p:key">
			/// The current key that is being parsed by the JSON parser.
			/// </param>
			/// <param name="value" type="object" locid="Blend.Util.define_p:value">
			/// The current value of the key being parsed by the JSON parser.
			/// </param>
			/// <returns type="object" locid="Blend.Util.define_returnValue">
			/// The actual pseudo class that represents the value of the key.
			/// </returns>
			if (value && typeof value === "object") {
				if (value.type) {
					var Type = value.type.split(".").reduce(function (previousValue, currentValue) {
						return previousValue ? previousValue[currentValue] : null;
					}, global);
					// Check if type is not null and it is a function (constructor)
					if (Type && typeof Type === "function") {
						return convertObjectToType(value, Type);
					}
				}
			}
			return value;
		},

		reportError: function (error) {
			/// <summary locid="Blend.Util.reportError">
			/// Reports an error (to the console currently) using the specified string resource and a
			/// variable length list of substitutions.
			/// </summary>
			/// <param name="error" type="String" locid="Blend.Util.reportError_p:error">
			/// A unique error identifer. Should be in the form "[namespace].[identifier]". The error
			/// message displayed includes this identifier, and the string returned by looking it up in
			/// the string resource table (if such a string exists).
			/// </param>

			var errorResource = Blend.Resources.getString(error);
			if (!errorResource.empty) {
				var args = Array.prototype.slice.call(arguments, 0);
				args[0] = errorResource.value;
				error += ": " + Blend.Resources.formatString.apply(null, args);
			}

			// TODO: 'tbarham' DEVDIV2:462848 - Temporarily disabling this JsCop rule until we decide on our final error handling approach.
			/// <disable>JS2043.RemoveDebugCode</disable>
			console.error(error);
			/// <enable>JS2043.RemoveDebugCode</enable>
		},

		reportWarning: function (error) {
			/// <summary locid="Blend.Util.reportError">
			/// Reports a warning (to the console currently) using the specified string resource and a
			/// variable length list of substitutions.
			/// </summary>
			/// <param name="error" type="String" locid="Blend.Util.reportError_p:error">
			/// A unique error identifer. Should be in the form "[namespace].[identifier]". The error
			/// message displayed includes this identifier, and the string returned by looking it up in
			/// the string resource table (if such a string exists).
			/// </param>
			var errorResource = Blend.Resources.getString(error);
			if (!errorResource.empty) {
				var args = Array.prototype.slice.call(arguments, 0);
				args[0] = errorResource.value;
				error += ": " + Blend.Resources.formatString.apply(null, args);
			}

			// TODO: 'tbarham' DEVDIV2:462848 - Temporarily disabling this JsCop rule until we decide on our final error handling approach.
			/// <disable>JS2043.RemoveDebugCode</disable>
			console.warn(error);
			/// <enable>JS2043.RemoveDebugCode</enable>
		},

		outputDebugMessage: function (debugTxt) {
			// Temporarily disable this JsCop rule until we decide how we will handle debug messages
			/// <disable>JS2043.RemoveDebugCode</disable>
			console.log(debugTxt);
			/// <enable>JS2043.RemoveDebugCode</enable>
		}
	});

	function convertObjectToType(genericObject, Type) {
		// Helper function to convert a generic JavaScript object to the specified type. Validates properties if
		// the type provides metadata.

		var typedObject = new Type();
		var metadata = Type._metadata;

		if (!metadata) {
			Blend.Util.reportWarning("Blend.Util.NoMetadataForType", getObjectTypeDescription(typedObject));
		}

		for (var propertyName in genericObject) {
			if (propertyName !== "type") {
				var propertyValue = genericObject[propertyName];
				setProperty(typedObject, propertyName, propertyValue, metadata);
			}
		}

		// Verify we have all required properties
		if (metadata) {
			for (var requiredPropertyName in metadata) {
				if (metadata[requiredPropertyName].required && !typedObject[requiredPropertyName]) {
					Blend.Util.reportError("Blend.Util.JsonPropertyMissing", getObjectTypeDescription(typedObject), requiredPropertyName);
					return null;
				}
			}
		}

		return typedObject;
	}

	function setProperty(object, propertyName, propertyValue, metadata) {
		if (!metadata) {
			metadata = object.constructor._metadata;
		}

		var propertyMetadata = metadata ? metadata[propertyName] : null;
		var requiredType = propertyMetadata ? propertyMetadata.type : null;

		if (requiredType) {
			var validatedValue = validatedPropertyValue(object, propertyName, propertyValue, requiredType, propertyMetadata.elementType);
			if (validatedValue) {
				// Type matches, so just set it
				object[propertyName] = validatedValue;
			}
		} else {
			// We either don't have metadata at all (in which case we've displayed an error already,
			// have metadata but it doesn't define this property (in which case we treat it as an
			// unexpected property) or the property's metadata does not define its type (in which case
			// we consider the metadata malformed). Display appropriate errors for the latter two scenarios.
			if (metadata) {
				if (propertyMetadata) {
					Blend.Util.reportWarning("Blend.Util.NoTypeMetadataForProperty", getObjectTypeDescription(object.constructor), propertyName);
				} else {
					Blend.Util.reportWarning("Blend.Util.JsonUnexpectedProperty", propertyName, getObjectTypeDescription(object.constructor));
				}
			}

			// Regardless, we set the property to whatever value we have.
			object[propertyName] = propertyValue;
		}
	}

	function validatedPropertyValue(parent, propertyName, propertyValue, requiredPropertyType, requiredElementType) {
		// Validates a property value is of the required type. If not, converts if possible. Returns null if not
		// able to convert.

		if (!propertyValue) {
			return null;
		}

		if (typeof requiredPropertyType === "function") {
			if (!(propertyValue instanceof requiredPropertyType) &&
				(requiredPropertyType !== String || typeof propertyValue !== "string") &&
				(requiredPropertyType !== Number || typeof propertyValue !== "number")) {

				// Coerce item to type if possible
				if (typeof requiredPropertyType === "function" && propertyValue.constructor === Object) {
					return convertObjectToType(propertyValue, requiredPropertyType);
				}

				// Otherwise see if type has a converter
				if (requiredPropertyType.converter) {
					var convertedPropertyValue = requiredPropertyType.converter.convertFrom(propertyValue);
					if (convertedPropertyValue) {
						return convertedPropertyValue;
					}
				}

				Blend.Util.reportError("Blend.Util.JsonTypeMismatch", getObjectTypeDescription(parent), propertyName, getObjectTypeDescription(propertyValue), getObjectTypeDescription(requiredPropertyType));
				return null;
			}

			if (requiredPropertyType === Array) {
				if (requiredElementType) {
					for (var i = 0; i < propertyValue.length; i++) {
						var validatedValue = validatedPropertyValue(parent, propertyName, propertyValue[i], requiredElementType);
						if (validatedValue) {
							propertyValue[i] = validatedValue;
						} else {
							if (propertyValue[i]) {
								Blend.Util.reportError("Blend.Util.JsonArrayTypeMismatch", getObjectTypeDescription(parent), propertyName, i, getObjectTypeDescription(propertyValue[i]), getObjectTypeDescription(requiredElementType));
							} else {
								Blend.Util.reportError("Blend.Util.JsonArrayElementMissing", getObjectTypeDescription(parent), propertyName, i);
							}
							return null;
						}
					}
				} else {
					Blend.Util.reportWarning("Blend.Util.NoElementTypeMetadataForArrayProperty", getObjectTypeDescription(parent), propertyName);
				}
			}
			return propertyValue;
		} else if (typeof requiredPropertyType === "object") {
			// Assume required type is an enumeration

			var keys = Object.keys(requiredPropertyType);

			if (!(typeof propertyValue === "string")) {
				Blend.Util.reportError("Blend.Util.JsonEnumValueNotString", getObjectTypeDescription(parent), propertyName, getObjectTypeDescription(propertyValue), keys);
				return null;
			}

			if (keys.indexOf(propertyValue) === -1) {
				Blend.Util.reportError("Blend.Util.JsonInvalidEnumValue", getObjectTypeDescription(parent), propertyName, propertyValue, keys);
				return null;
			}

			return requiredPropertyType[propertyValue];
		} else {
			// Temporary exception to catch cases we're not handling
			throw new Error("Not handling type " + requiredPropertyType + " when validating against metadata");
		}
	}

	function getObjectTypeDescription(object) {
		// Helper function to display a friendly type description from its constructor function (requires the
		// constructor function be named) - used for error messages.

		var type;
		if (typeof object === "function") {
			type = object;
		} else {
			type = object.constructor;
		}

		var result = type.toString().match(/function (.{1,})\(/);
		if (result && result.length > 1) {
			// For readability sake, if the constructor function name ends in '_ctor', remove that.
			result = result[1];
			var pos = result.length - 5;
			if (result.indexOf("_ctor", pos) !== -1) {
				result = result.substring(0, pos);
			}
		} else {
			result = "(unknown type)";
		}

		return result;
	}
})(_BlendGlobal.Blend, _BlendGlobal);

//js\Actions\ActionBase.js

(function (Blend) {
	"use strict";

	Blend.Namespace.defineWithParent(Blend, "Actions", {
		/// <summary locid="Blend.Actions.ActionBase">
		/// The base class for all actions performed by Blend Actions runtime.
		/// </summary>
		/// <name locid="Blend.Actions.ActionBase_name">ActionBase</name>
		ActionBase: Blend.Class.define(
			function ActionBase_ctor() {
				/// <summary locid="Blend.Actions.ActionBase.constructor">
				/// Initializes a new instance of Blend.Behaviors.ActionBase that defines an action.
				/// </summary>
			},
			{
				actionTree: null,

				/// <field type="Blend.Actions.ActionBase.targetSelector">
				/// Gets or sets the target property for AddClassAction.
				/// </field>
				targetSelector: null,

				attach: function (element) {
					/// <summary locid="Blend.Actions.ActionBase.attach">
					/// Attaches the action with the element (typically the target)
					/// </summary>
					/// <param name="element" type="Object" domElement="true" locid="Blend.Actions.ActionBase.attach_p:element">
					/// The element on which the action is attached. If there is no target specified on the action, the attached element is the target of the action
					/// </param>
					if (this.attachImpl) {
						this.attachImpl(element);
					}
				},

				execute: function () {
					/// <summary locid="Blend.Actions.ActionBase.execute">
					/// Executes the action.
					/// </summary>
				}
			}
		)
	});
})(_BlendGlobal.Blend);

//js\Actions\Actions.js

(function (Blend) {
	"use strict";

	Blend.Namespace.defineWithParent(Blend, "Actions", {
		_element: null,

		getState: function () {
			/// <summary locid="Blend.Actions.getState">
			/// Gets requested state from the correct scope.  Assumes first parameter is the scope element for element scope.
			/// </summary>
			var element = this.getElement();
			if (!element) {
				Blend.Util.outputDebugMessage("Why is there no scope element?");
			}

			var data = Blend.Util.data(element);

			if (!data.blendActionState) {
				data.blendActionState = {};
			}
			return data.blendActionState;
		},

		setElement: function (element) {
			/// <summary locid="Blend.Actions.setElement">
			/// Sets the _element property to the value thats passed in, so that EventAdapter actions can set the scopeElement for this ActionTree
			/// </summary>
			/// <param name="element" type="HTMLElement" domElement="true" locid="Blend.Actions.setElement_p:element">
			/// The actual element to set for the action tree.
			/// </param>
			this._element = element;
		},

		getElement: function () {
			/// <summary locid="Blend.Actions.getElement">
			/// Returns the _element property for actions to consume
			/// </summary>
			return this._element;
		},

		setArguments: function (callArgs) {
			/// <summary locid="Blend.Actions.setArguments">
			/// Sets the arguments for the actions to use. The actions can call "getArguments" to retrieve the arguments.
			/// </summary>
			/// <param name="callArgs" type="object" locid="Blend.Behaviors.Blend.Actions.setArguments_p:callArgs">
			/// The arguments object for the actions to consume.
			/// </param>
			var elementBlendActionState = Blend.Actions.getState();
			elementBlendActionState.arguments = elementBlendActionState.arguments || {};
			elementBlendActionState = elementBlendActionState.arguments;
			// Set the arguments into the element state, so that actions can get them as and when needed.
			elementBlendActionState["arguments"] = callArgs;
		},

		getArguments: function () {
			/// <summary locid="Blend.Actions.getArguments">
			/// Returns the arguments for the actions to consume.
			/// </summary>
			var elementBlendActionState = Blend.Actions.getState();
			if (!elementBlendActionState) {
				Blend.Util.outputDebugMessage("Why is there no scope element action state?");
			}

			elementBlendActionState = elementBlendActionState.arguments;
			if (!elementBlendActionState) {
				Blend.Util.outputDebugMessage("Why is there no scope element action state with arguments object?");
			}

			var actionArguments = elementBlendActionState["arguments"];
			if (!actionArguments) {
				Blend.Util.outputDebugMessage("Why are there no arguments stored?");
			}

			return actionArguments;
		}
	});
})(_BlendGlobal.Blend);

//js\Actions\RemoveElementsAction.js

(function (Blend) {
	"use strict";

	Blend.Namespace.defineWithParent(Blend, "Actions", {
		/// <summary locid="Blend.Actions.RemoveElementsAction">
		/// Concrete implementation of RemoveElementsAction, which removes all the elements refered to by elementsToRemove selector property
		/// </summary>
		/// <name locid="Blend.Actions.RemoveElementsAction">RemoveElementsAction</name>
		RemoveElementsAction: Blend.Class.derive(Blend.Actions.ActionBase,
			function RemoveElementsAction_ctor() {
				/// <summary locid="Blend.Actions.RemoveElementsAction.constructor">
				/// Initializes a new instance of Blend.Actions.RemoveElementsAction that defines RemoveElementsAction.
				/// </summary>
			},
			{
				/// <field type="Blend.Actions.RemoveElementsAction.elementsToRemove">
				/// Gets or sets the elementsToRemove property for RemoveElementsAction.
				/// </field>
				elementsToRemove: "",

				execute: function () {
					msWriteProfilerMark("Blend.Actions.RemoveElementsAction:execute,StartTM");

					/// <summary locid="Blend.Actions.RemoveChildrenAction.execute">
					/// Executes the action when the action tree is triggered.
					/// </summary>
					function executeFunc(element) {
						element.parentNode.removeChild(element);
					}

					// If no target is set, then its the element on which the action was fired.
					if (!this.elementsToRemove) {
						this.elementsToRemove = Blend.Actions.getElement();
					}

					if (typeof this.elementsToRemove !== "object") {
						Array.prototype.forEach.call(document.querySelectorAll(this.elementsToRemove), function (actualTarget) { executeFunc(actualTarget); }, this);
					} else {
						executeFunc(this.elementsToRemove);
					}

					msWriteProfilerMark("Blend.Actions.RemoveElementsAction:execute,StopTM");

				}
			},
			{ /* static members empty */ },
			{
				// Property Meta-data (for JSON parsing)
				elementsToRemove: { type: String }
			}
		)
	});
})(Blend);

//js\Actions\RemoveChildrenAction.js

(function (Blend) {
	"use strict";

	Blend.Namespace.defineWithParent(Blend, "Actions", {
		/// <summary locid="Blend.Actions.RemoveChildrenAction">
		/// Concrete implementation of RemoveChildrenAction, which removes all the children of the elements refered to by parentElement selector property
		/// </summary>
		/// <name locid="Blend.Actions.RemoveChildrenAction">RemoveChildrenAction</name>
		RemoveChildrenAction: Blend.Class.derive(Blend.Actions.ActionBase,
			function RemoveChildrenAction_ctor() {
				/// <summary locid="Blend.Actions.RemoveChildrenAction.constructor">
				/// Initializes a new instance of Blend.Actions.RemoveChildrenAction that defines RemoveChildrenAction.
				/// </summary>
			},
			{
				/// <field type="Blend.Actions.RemoveChildrenAction.parentElement">
				/// Gets or sets the parentElement property for RemoveChildrenAction.
				/// </field>
				parentElement: "",

				execute: function () {
					msWriteProfilerMark("Blend.Actions.RemoveClassAction:execute,StartTM");

					/// <summary locid="Blend.Actions.RemoveChildrenAction.execute">
					/// Executes the action when the action tree is triggered.
					/// </summary>
					function executeFunc(element) {
						while (element.hasChildNodes()) {
							element.removeChild(element.lastChild);
						}
					}

					// If no target is set, then its the element on which the action was fired.
					if (!this.parentElement) {
						this.parentElement = Blend.Actions.getElement();
					}

					if (typeof this.parentElement !== "object") {
						Array.prototype.forEach.call(document.querySelectorAll(this.parentElement), function (actualTarget) { executeFunc(actualTarget); }, this);
					} else {
						executeFunc(this.parentElement);
					}

					msWriteProfilerMark("Blend.Actions.RemoveChildrenAction:execute,StopTM");

				}
			},
			{ /* static members empty */ },
			{
				// Property Meta-data (for JSON parsing)
				parentElement: { type: String }
			}
		)
	});
})(Blend);

//js\Actions\ToggleClassAction.js

(function (Blend) {
	"use strict";

	Blend.Namespace.defineWithParent(Blend, "Actions", {
		/// <summary locid="Blend.Actions.ToggleClassAction">
		/// Concrete implementation of ToggleClassAction, which toggles the class attribute of the element specific by the element property.
		/// </summary>
		/// <name locid="Blend.Actions.ToggleClassAction">ToggleClassAction</name>
		ToggleClassAction: Blend.Class.derive(Blend.Actions.ActionBase,
			function ToggleClassAction_ctor() {
				/// <summary locid="Blend.Actions.ToggleClassAction.constructor">
				/// Initializes a new instance of Blend.Actions.ToggleClassAction that defines ToggleClassAction.
				/// </summary>
			},
			{
				/// <field type="Blend.Actions.ToggleClassAction.className">
				/// Gets or sets the className property for ToggleClassAction.
				/// </field>
				className: "",

				execute: function () {
					/// <summary locid="Blend.Actions.ToggleClassAction.execute">
					/// Executes the action when the action tree is triggered.
					/// </summary>
					msWriteProfilerMark("Blend.Actions.ToggleClassAction:execute,StartTM");
					function executeFunc(element, action) {
						var currentClassValue = element.className;
						var className = action.className;

						if (!currentClassValue || currentClassValue.indexOf(className) === -1) {
							// If the class is not found, add it
							if (!currentClassValue) {
								element.className = className;
							} else {
								element.className += " " + className;
							}
						} else {
							// Otherwise, remove the class.
							element.className = element.className.replace(className, "");
						}
					}
					if (this.targetSelector) {
						Array.prototype.forEach.call(document.querySelectorAll(this.targetSelector), function (actualTarget) { executeFunc(actualTarget, this); }, this);
					} else {
						executeFunc(Blend.Actions.getElement(), this);
					}

					msWriteProfilerMark("Blend.Actions.ToggleClassAction:execute,StopTM");
				}
			},
			{ /* static members empty */ },
			{
				// Property Meta-data (for JSON parsing)
				className: { type: String },
				targetSelector: { type: String }
			}
		)
	});
})(Blend);

//js\Actions\AddClassAction.js

(function (Blend) {
	"use strict";

	Blend.Namespace.defineWithParent(Blend, "Actions", {
		/// <summary locid="Blend.Actions.AddClassAction">
		/// Concrete implementation of AddClassAction, which modifies the class attribute of the element specific by the element property.
		/// </summary>
		/// <name locid="Blend.Actions.AddClassAction">AddClassAction</name>
		AddClassAction: Blend.Class.derive(Blend.Actions.ActionBase,
			function AddClassAction_ctor() {
				/// <summary locid="Blend.Actions.AddClassAction.constructor">
				/// Initializes a new instance of Blend.Actions.AddClassAction that defines AddClassAction.
				/// </summary>
			},
			{
				/// <field type="Blend.Actions.AddClassAction.className">
				/// Gets or sets the className property for AddClassAction.
				/// </field>
				className: "",

				execute: function () {
					/// <summary locid="Blend.Actions.AddClassAction.execute">
					/// Executes the action when the action tree is triggered.
					/// </summary>
					msWriteProfilerMark("Blend.Actions.AddClassAction:execute,StartTM");

					function executeFunc(element, action) {
						var currentClassValue = element.className;
						var classToAdd = action.className;

						if (currentClassValue.indexOf(classToAdd) === -1) {
							if ((currentClassValue === null) || (currentClassValue === "")) {
								element.className = classToAdd;
							} else {
								element.className += " " + classToAdd;
							}
						}
					}
					if (this.targetSelector) {
						Array.prototype.forEach.call(document.querySelectorAll(this.targetSelector), function (actualTarget) { executeFunc(actualTarget, this); }, this);
					} else {
						executeFunc(Blend.Actions.getElement(), this);
					}

					msWriteProfilerMark("Blend.Actions.AddClassAction:execute,StopTM");
				}
			},
			{ /* static members empty */ },
			{
				// Property Meta-data (for JSON parsing)
				className: { type: String},
				targetSelector: { type: String }
			}
		)
	});
})(Blend);

//js\Actions\RemoveClassAction.js

(function (Blend) {
	"use strict";

	Blend.Namespace.defineWithParent(Blend, "Actions", {
		/// <summary locid="Blend.Actions.RemoveClassAction">
		/// Concrete implementation of RemoveClassAction, which modifies the class attribute of the element specific by the element property.
		/// </summary>
		/// <name locid="Blend.Actions.RemoveClassAction">RemoveClassAction</name>
		RemoveClassAction: Blend.Class.derive(Blend.Actions.ActionBase,
			function RemoveClassAction_ctor() {
				/// <summary locid="Blend.Actions.RemoveClassAction.constructor">
				/// Initializes a new instance of Blend.Actions.RemoveClassAction that defines RemoveClassAction.
				/// </summary>
			},
			{
				/// <field type="Blend.Actions.RemoveClassAction.className">
				/// Gets or sets the className property for RemoveClassAction.
				/// </field>
				className: "",

				execute: function () {
					msWriteProfilerMark("Blend.Actions.RemoveClassAction:execute,StartTM");

					/// <summary locid="Blend.Actions.RemoveClassAction.execute">
					/// Executes the action when the action tree is triggered.
					/// </summary>
					function executeFunc(element, action) {
						var classAttribute = element.className;
						var classToRemove = action.className;
						var classes = classAttribute.split(" ");

						// If there is no class attribute return
						if (classes.length === 0) {
							return;
						}

						var newClasses = [];

						for (var i = 0; i < classes.length; i++) {
							if (classes[i] === classToRemove) {
								// This element has the required class, so don't add it to our newClasses collection
								continue;
							}
							newClasses.push(classes[i]);
						}

						var newClassAttribute = "";
						if (newClasses.length > 0) {
							if (newClasses.length === 1) {
								newClassAttribute = newClasses[0];
							} else {
								newClassAttribute = newClasses.join(" "); /* Join the array contents using the space as separator */
							}
						}

						element.className = newClassAttribute;
					}
					if (this.targetSelector) {
						Array.prototype.forEach.call(document.querySelectorAll(this.targetSelector), function (actualTarget) { executeFunc(actualTarget, this); }, this);
					} else {
						executeFunc(Blend.Actions.getElement(), this);
					}

					msWriteProfilerMark("Blend.Actions.RemoveClassAction:execute,StopTM");

				}
			},
			{ /* static members empty */ },
			{
				// Property Meta-data (for JSON parsing)
				className: { type: String},
				targetSelector: { type: String }
			}
		)
	});
})(Blend);

//js\Actions\SetHTMLAttributeAction.js

(function (Blend) {
	"use strict";

	Blend.Namespace.defineWithParent(Blend, "Actions", {
		/// <summary locid="Blend.Actions.SetHTMLAttributeAction">
		/// Concrete implementation of SetHTMLAttributeAction, which sets the attribute to the attribute value on elements refered to by targetSelector property.
		/// </summary>
		/// <name locid="Blend.Actions.SetHTMLAttributeAction">SetHTMLAttributeAction</name>
		SetHTMLAttributeAction: Blend.Class.derive(Blend.Actions.ActionBase,
			function SetHTMLAttributeAction_ctor() {
				/// <summary locid="Blend.Actions.SetHTMLAttributeAction.constructor">
				/// Initializes a new instance of Blend.Actions.SetHTMLAttributeAction that defines SetHTMLAttributeAction.
				/// </summary>
			},
			{
				/// <field type="Blend.Actions.SetHTMLAttributeAction.targetSelector">
				/// Gets or sets the targetSelector property for SetHTMLAttributeAction.
				/// </field>
				targetSelector: "",

				/// <field type="Blend.Actions.SetHTMLAttributeAction.attribute">
				/// Gets or sets the attribute property for SetHTMLAttributeAction.
				/// </field>
				attribute: "",

				/// <field type="Blend.Actions.SetHTMLAttributeAction.attributeValue">
				/// Gets or sets the attributeValue property for SetHTMLAttributeAction.
				/// </field>
				attributeValue: "",

				execute: function () {
					msWriteProfilerMark("Blend.Actions.SetHTMLAttributeAction:execute,StartTM");

					/// <summary locid="Blend.Actions.SetHTMLAttributeAction.execute">
					/// Executes the action when the action tree is triggered.
					/// </summary>
					function executeFunc(element, action) {
						element.setAttribute(action.attribute, action.attributeValue);
					}
					if (this.targetSelector) {
						Array.prototype.forEach.call(document.querySelectorAll(this.targetSelector), function (actualTarget) { executeFunc(actualTarget, this); }, this);
					} else {
						executeFunc(Blend.Actions.getElement(), this);
					}

					msWriteProfilerMark("Blend.Actions.SetHTMLAttributeAction:execute,StopTM");

				}
			},
			{ /* static members empty */ },
			{
				// Property Meta-data (for JSON parsing)
				targetSelector: { type: String },
				attribute: { type: String },
				attributeValue: { type: String }
			}
		)
	});
})(Blend);

//js\Actions\SetStyleAction.js

(function (Blend) {
	"use strict";

	Blend.Namespace.defineWithParent(Blend, "Actions", {
		/// <summary locid="Blend.Actions.SetStyleAction">
		/// Concrete implementation of SetStyleAction, which sets the styleProperty to the styleValue on elements refered to by targetSelector property.
		/// </summary>
		/// <name locid="Blend.Actions.SetStyleAction">SetStyleAction</name>
		SetStyleAction: Blend.Class.derive(Blend.Actions.ActionBase,
			function SetStyleAction_ctor() {
				/// <summary locid="Blend.Actions.SetStyleAction.constructor">
				/// Initializes a new instance of Blend.Actions.SetStyleAction that defines SetStyleAction.
				/// </summary>
			},
			{
				/// <field type="Blend.Actions.SetStyleAction.targetSelector">
				/// Gets or sets the targetSelector property for SetStyleAction.
				/// </field>
				targetSelector: "",

				/// <field type="Blend.Actions.SetStyleAction.styleProperty">
				/// Gets or sets the styleProperty property for SetStyleAction.
				/// </field>
				styleProperty: "",

				/// <field type="Blend.Actions.SetStyleAction.styleValue">
				/// Gets or sets the styleValue property for SetStyleAction.
				/// </field>
				styleValue: "",

				execute: function () {
					msWriteProfilerMark("Blend.Actions.SetStyleAction:execute,StartTM");

					/// <summary locid="Blend.Actions.SetStyleAction.execute">
					/// Executes the action when the action tree is triggered.
					/// </summary>
					function executeFunc(element, action) {
						element.style[action.styleProperty] = action.styleValue;
					}
					if (this.targetSelector) {
						Array.prototype.forEach.call(document.querySelectorAll(this.targetSelector), function (actualTarget) { executeFunc(actualTarget, this); }, this);
					} else {
						executeFunc(Blend.Actions.getElement(), this);
					}

					msWriteProfilerMark("Blend.Actions.SetStyleAction:execute,StopTM");

				}
			},
			{ /* static members empty */ },
			{
				// Property Meta-data (for JSON parsing)
				targetSelector: { type: String },
				styleProperty: { type: String },
				styleValue: { type: String }
			}
		)
	});
})(Blend);

//js\Actions\LoadPageAction.js

(function (Blend, global) {
	"use strict";

	Blend.Namespace.defineWithParent(Blend, "Actions", {
		/// <summary locid="Blend.Actions.LoadPageAction">
		/// Concrete implementation of LoadPageAction, which loads the page and adds it to the element pointed by targetSelector property.
		/// </summary>
		/// <name locid="Blend.Actions.LoadPageAction">LoadPageAction</name>
		LoadPageAction: Blend.Class.derive(Blend.Actions.ActionBase,
			function LoadPageAction_ctor() {
				/// <summary locid="Blend.Actions.LoadPageAction.constructor">
				/// Initializes a new instance of Blend.Actions.LoadPageAction that defines LoadPageAction.
				/// </summary>
			},
			{
				/// <field type="Blend.Actions.LoadPageAction.targetSelector">
				/// Gets or sets the targetSelector property for LoadPageAction.
				/// </field>
				targetSelector: "",

				/// <field type="Blend.Actions.LoadPageAction.page">
				/// Gets or sets the page property for LoadPageAction.
				/// </field>
				page: "",

				/// <field type="Blend.Behaviors.LoadPageAction.pageLoaded">
				/// The list of actions to fire when the page is loaded.
				/// </field>
				pageLoaded: "",


				execute: function () {
					msWriteProfilerMark("Blend.Actions.LoadPageAction:execute,StartTM");

					function clearChildren(element) {
						while (element.hasChildNodes()) {
							element.removeChild(element.lastChild);
						}
					}

					/// <summary locid="Blend.Actions.LoadPageAction.execute">
					/// Executes the action when the action tree is triggered.
					/// </summary>
					function executeFunc(element, action) {
						clearChildren(element);
						var originalElement = element;
						var originalAction = action;

						var hasWinRT = !!global.Windows;
						if (hasWinRT) {
							WinJS.UI.Fragments.render(action.page, element).done(
								function () {
									// Call WinJS.UI.processAll to process the  behaviors for the newly loaded page.
									WinJS.UI.processAll(originalElement);

									// Set the element to the source of the event
									Blend.Actions.setElement(originalElement);

									// Call execute on each action in the array and pass in the behavior, source, and a set of source specific variables
									if (originalAction.pageLoaded) {
										originalAction.pageLoaded.forEach(function (pageLoadedAction) {
											pageLoadedAction.execute(originalAction);
										});
									}
								},
								function (error) {
									// Eat up the error
								}
							);
						}
					}
					if (this.targetSelector) {
						Array.prototype.forEach.call(document.querySelectorAll(this.targetSelector), function (actualTarget) { executeFunc(actualTarget, this); }, this);
					} else {
						executeFunc(Blend.Actions.getElement(), this);
					}

					msWriteProfilerMark("Blend.Actions.LoadPageAction:execute,StopTM");

				}
			},
			{ /* static members empty */ },
			{
				// Property Meta-data (for JSON parsing)
				targetSelector: { type: String },
				page: { type: String },
				pageLoaded: { type: Array, elementType: Blend.Actions.ActionBase }
			}
		)
	});
})(_BlendGlobal.Blend, _BlendGlobal);

//js\ActionTree\ActionTree.js

(function (Blend, global) {
	"use strict";

	Blend.Namespace.defineWithParent(Blend, "ActionTree", {
		// Namespace singletons 
		currentActionTree: null,
		actionTrees: null,

		getNamespacedObject: function (name, defaultNs) {
			/// <summary locid="Blend.ActionTree.getNamespacedObject">
			/// Gets an object deep in a namespace tree with a default if not in string.
			/// </summary>
			/// <param name="name" type="String" locid="Blend.ActionTree.getNamespacedObject_p:name">
			/// The name of the function to find in the namespace.
			/// </param>
			/// <param name="defaultNs" type="String" locid="Blend.ActionTree.getNamespacedObject_p:defaultNs">
			/// The name of the default namespace
			/// </param>
			/// <returns type="Object" locid="Blend.ActionTree.getNamespacedObject_returnValue">
			/// A namespace object
			/// </returns>
			var ns = defaultNs || global;
			return ns[name];
		},

		setNamespacedObject: function (name, value, defaultNs) {
			/// <summary locid="Blend.ActionTree.setNamespacedObject">
			/// Sets an object deep in a namespace tree with a with absolute or relative positioning and a default if not in string.
			/// </summary>
			/// <param name="name" type="String" locid="Blend.ActionTree.setNamespacedObject_p:name">
			/// The name of the function to store in the namespace.
			/// </param>
			/// <param name="value" type="String" locid="Blend.ActionTree.setNamespacedObject_p:value">
			/// The name of the function to store in the namespace
			/// </param>
			/// <param name="defaultNs" type="String" locid="Blend.ActionTree.setNamespacedObject_p:defaultNs">
			/// The name of the default namespace
			/// </param>
			var ns = defaultNs || global;
			ns[name] = value;
		},

		registerActionTree: function (name, func) {
			/// <summary locid="Blend.ActionTree.registerActionTree">
			/// Registers the name and the function in the global (window) namespace.
			/// </summary>
			/// <param name="name" type="String" locid="Blend.ActionTree.registerActionTree_p:name">
			/// The name of the function (which is the root of the action tree).
			/// </param>
			/// <param name="func" type="Function" locid="Blend.ActionTree.registerActionTree_p:func">
			/// The function object to register.
			/// </param>
			Blend.ActionTree.setNamespacedObject(name, func);
		},

		createActionTreeFunction: function (actionRoot) {
			/// <summary locid="Blend.ActionTree.createActionTreeFunction">
			/// Creats action tree root function for the input JSON object.
			/// </summary>
			/// <param name="actionRoot" type="Object" locid="Blend.ActionTree.createActionTreeFunction_p:actionRoot">
			/// The root of the action tree.
			/// </param>
			/// <returns type="Function" locid="Blend.ActionTree.createActionTreeFunction_returnValue">
			/// The newly-defined function for the root action tree.
			/// </returns>

			return Blend.Util.markSupportedForProcessing(function () {
				return Blend.ActionTree.executeAction(actionRoot, arguments);
			});
		},

		createAndRegisterActionTree: function (name, actionRoot) {
			/// <summary locid="Blend.ActionTree.createAndRegisterActionTree">
			/// Creates action tree root function for the input JSON object and registers it in the global namespace.
			/// </summary>
			/// <param name="name" type="String" locid="Blend.ActionTree.createAndRegisterActionTree_p:name">
			/// The root of the action tree.
			/// </param>
			/// <param name="actionRoot" type="Object" locid="Blend.ActionTree.createAndRegisterActionTree_p:actionRoot">
			/// The root JSON object of the action tree.
			/// </param>
			this.registerActionTree(name, this.createActionTreeFunction(actionRoot));
		},

		executeAction: function (actionRoot, argSet) {
			/// <summary locid="Blend.ActionTree.executeAction">
			/// Executes the action tree root function with the arguments passed in the argSet.
			/// </summary>
			/// <param name="actionRoot" type="Object" locid="Blend.ActionTree.executeAction_p:actionRoot">
			/// The root of the action tree.
			/// </param>
			/// <param name="argSet" type="Object" locid="Blend.ActionTree.createAndRegisterActionTree_p:argSet">
			/// The arguments for the root function of the action tree.
			/// </param>
			msWriteProfilerMark("Blend.ActionTree:executeAction,StartTM");
			var callArgs = argSet;

			// If the passed in object is Action, call execute on it
			if (actionRoot instanceof Blend.Actions.ActionBase) {
				// Set the root-actionTree for the action
				actionRoot.actionTree = this.currentActionTree;
				// Call execute on the action itself
				return actionRoot.execute.apply(actionRoot, callArgs);
			}

			this.currentActionTree = actionRoot;
			var actions = actionRoot.actions;

			// If the object is an array of actions, take each action object and call execute action.
			if (Array.isArray(actions)) {
				// Get the currentTarget from the "event" object passed as the 0th object in the arguments list.
				if (callArgs[0] instanceof Event) {
					// Set the element for all the actions, using the 'currentTarget' property of the 'Event' object
					var scopeElement = callArgs[0].currentTarget;
					Blend.Actions.setElement(scopeElement);
					// Set the arguments for the actions to consume.
					Blend.Actions.setArguments(callArgs);
				} 

				// Call individual actions.
				for (var actionIndex = 0, actionLength = actions.length; actionIndex < actionLength; actionIndex++) {
					// Set the root-actionTree for the action
					actions[actionIndex].actionTree = this.currentActionTree;
					Blend.ActionTree.executeAction(actions[actionIndex], callArgs);
				}
			}
			msWriteProfilerMark("Blend.ActionTree:executeAction,StopTM");
		}
	});
})(_BlendGlobal.Blend, _BlendGlobal);

//js\Behaviors\BehaviorBase.js

(function (Blend) {
	"use strict";

	Blend.Namespace.defineWithParent(Blend, "Behaviors", {
		/// <summary locid="Blend.Behaviors.BehaviorBase">
		/// The base class for all behaviors.
		/// </summary>
		/// <name locid="Blend.Behaviors.BehaviorBase_name">BehaviorBase</name>
		BehaviorBase: Blend.Class.define(
			function BehaviorBase_ctor(configBlock, attachment) {
				/// <summary locid="Blend.Behaviors.BehaviorBase.constructor">
				/// Initializes a new instance of Blend.Behaviors.BehaviorBase that defines a behavior.
				/// </summary>
				/// <param name="configBlock" type="string" locid="Blend.Behaviors.BehaviorBase.constructor_p:configBlock">
				/// Construct the object properties based on the config block.
				/// </param>
				/// <param name="attachment" type="object" locid="Blend.Behaviors.BehaviorBase.constructor_p:attachment">
				/// Attachment of the behavior.
				/// </param>

				if (configBlock) {
					Blend.Util.parseJson(configBlock, this);
				}
				this._attachment = null;
				if (attachment) {
					this.attach(attachment);
				}
			},
			{
				attach: function (element) {
					/// <summary locid="Blend.Behaviors.BehaviorBase.attach">
					/// Attaches the action with the element (typically the source)
					/// </summary>
					/// <param name="element" type="object" domElement="true" locid="Blend.Behaviors.BehaviorBase.attach_p:element">
					/// The element on which the behavior is attached.
					/// </param>
					this._attachment = element;
					Blend.Behaviors.addBehaviorInstance(element, this);
					if (this._attachImpl) {
						this._attachImpl(element);
					}
				},

				detach: function () {
					/// <summary locid="Blend.Behaviors.BehaviorBase.detach">
					/// Detaches the behavior
					/// </summary>
					if (this._attachment) {
						// Remove attachment from Blend.Behaviors._behaviorInstances
						var behaviorInstances = Blend.Behaviors.getBehaviorInstances(this._attachment);
						if (behaviorInstances) {
							var pos = behaviorInstances.indexOf(this);
							if (pos > -1) {
								behaviorInstances.splice(pos, 1);
							}
						}
					}
					if (this._detachImpl) {
						this._detachImpl();
					}

					this._attachment = null;
				},
			}
		)
	});
})(Blend);

//js\Behaviors\SelectorSourcedBehavior.js

(function (Blend) {
	"use strict";

	Blend.Namespace.defineWithParent(Blend, "Behaviors", {
		/// <summary locid="Blend.Behaviors.SelectorSourcedBehavior">
		/// The base class for all behaviors with selectors.
		/// </summary>
		/// <name locid="Blend.SelectorSourcedBehavior_name">SelectorSourcedBehavior</name>
		SelectorSourcedBehavior: Blend.Class.derive(Blend.Behaviors.BehaviorBase,
			function SelectorSourcedBehavior_ctor(configBlock, attachment) {
				/// <summary locid="Blend.Behaviors.SelectorSourcedBehavior.constructor">
				/// Initializes a new instance of Blend.Behaviors.SelectorSourcedBehavior that defines a selector sourced behavior.
				/// </summary>
				/// <param name="configBlock" type="string" locid="Blend.Behaviors.SelectorSourcedBehavior.constructor_p:configBlock">
				/// Construct the object properties based on the config block.
				/// </param>
				/// <param name="attachment" type="object" locid="Blend.Behaviors.SelectorSourcedBehavior.constructor_p:attachment">
				/// Attachment of the behavior.
				/// </param>
				Blend.Behaviors.BehaviorBase.call(this, configBlock, attachment);
			},
			{
				_sourceSelector: "",
				sourceSelector: {
					get: function () {
						/// <summary locid="Blend.Behaviors.SelectorSourcedBehavior.sourceSelector.get">
						/// Returns the sourceSelector property on the SelectorSourcedBehaviorBase
						/// </summary>
						/// <returns type="string" locid="Blend.Behaviors.SelectorSourcedBehavior.sourceSelector_returnValue">The value of the sourceSelector property.</returns>

						return this._sourceSelector;
					},
					set: function (value) {
						/// <summary locid="Blend.Behaviors.SelectorSourcedBehavior.sourceSelector">
						/// Sets the value of the sourceSelector property. This will find all the elements with the specified sourceSelector and apply the Behavior to these elements.
						/// </summary>
						/// <param name="value" type="string" locid="Blend.Behaviors.SelectorSourcedBehavior.sourceSelector.set_p:value">
						/// The value of the sourceSelector property.
						/// </param>

						var that = this;

						if (value !== this._sourceSelector) {
							this._sourceSelector = value;
						}

						if (this._sources) {
							// Remove existing sources if any are present
							for (var source in this._sources) {
								that.removeSource(this._sources[source]);
							}
						}

						// Fire CSS Selector and find anything under the whole document which matches the value and add it to the list of sources
						Array.prototype.forEach.call(document.querySelectorAll(value), function (element) {
							that.addSource(element);
						});
					}
				},

				addSource: function (source) {
					/// <summary locid="Blend.Behaviors.SelectorSourcedBehavior.addSource">
					///  Adds source to the given SelectorSourcedBehavior, this is the source of the behavior.
					/// </summary>
					/// <param name="source" type="Object" domElement="true" locid="Blend.Behaviors.SelectorSourcedBehavior.addSource_p:source">
					/// The source for the behavior in the SelectorSourcedBehavior
					/// </param>


					// Allow sub-classes to wire up relevant listeners (or add classes, attributes etc) to element, should check if its defined before calling
					if (this._addSourceImpl) {
						this._addSourceImpl(source);
					}

					// Add to list of sources
					if (!this._sources) {
						this._sources = {};
					}

					// Use the uniqueID to uniquely identify each source in our collection
					this._sources[source.uniqueID] = source;
				},

				removeSource: function (source) {
					/// <summary locid="Blend.Behaviors.SelectorSourcedBehavior.removeSource">
					///  Removes the source of the given SelectorSourcedBehavior.
					/// </summary>
					/// <param name="source" type="object" domElement="true" locid="Blend.Behaviors.SelectorSourcedBehavior.removeSource_p:source">
					/// The source for the SelectorSourcedBehavior
					/// </param>


					// Allow sub-classes to disconnect event listeners (or remove classes, attributes etc) on element
					this._removeSourceImpl(source);

					// Remove from source list
					delete this._sources[source.id];
				},

				detach: function () {
					/// <summary locid="Blend.Behaviors.SelectorSourcedBehavior.detach">
					///  Cleans up the SelectorSourcedBehavior by removing the sources, detaching it from the attached element and removing itself from the Blend.Behaviors._behaviorInstances
					/// </summary>


					// Remove and cleanup all sources
					for (var source in this._sources) {
						this.removeSource(this._sources[source]);
					}

					if (this._attachment) {
						// Remove attachment from Blend.Behaviors._behaviorInstances
						var behaviorInstances = Blend.Behaviors.getBehaviorInstances(this._attachment);
						if (behaviorInstances) {
							var pos = behaviorInstances.indexOf(this);
							if (pos > -1) {
								behaviorInstances.splice(pos, 1);
							}
						}
					}

					// Allow sub-classes to clean up, should check if its defined before calling
					if (this._detachImpl) {
						this._detachImpl(this._attachment);
					}
				},
			},
			{ /* static members empty */ },
			{
				// Property Meta-data (for JSON parsing)
				sourceSelector: { type: String }
			}
		)
	});
})(Blend);

//js\Behaviors\TimerBehavior.js

(function (Blend) {
	"use strict";

	Blend.Namespace.defineWithParent(Blend, "Behaviors", {
		/// <summary locid="Blend.Behaviors.TimerBehavior">
		/// Concrete implementation of TimerBehavior, which listen for timer tick and fires actions if specified.
		/// </summary>
		/// <name locid="Blend.Behaviors.TimerBehavior">TimerBehavior</name>
		TimerBehavior: Blend.Class.derive(Blend.Behaviors.BehaviorBase,
			function TimerBehavior_ctor(configBlock, attachment) {
				/// <summary locid="Blend.Behaviors.TimerBehavior.constructor">
				/// Initializes a new instance of Blend.Behaviors.TimerBehavior and fires actions when the timer ticks.
				/// </summary>
				this._timerIdPerAttachment = {};
				Blend.Behaviors.BehaviorBase.call(this, configBlock, attachment);
			},
			{
				_count: 0,
				_timerIdPerAttachment: null,
				totalTicks: 10,
				millisecondsPerTick: 1000,

				_attachImpl: function (attachment) {
					/// <summary locid="Blend.Behaviors.TimerBehavior._attachImpl">
					/// Attaches the TimerBehavior with the element and sets source if there is no _sourceselector set
					/// </summary>
					/// <param name="attachment" type="object" domElement="true" locid="Blend.Behaviors.TimerBehavior._attachImpl_p:attachment">
					/// The element on which the behavior is attached. If there is no source specified on the behavior, the attached-element is the source of the behavior
					/// </param>

					// Attach all the actions to the attachment element, this will set the target on the actions if not already set.
					var that = this;

					if (this.triggeredActions) {
						this.triggeredActions.forEach(function (action) {
							action.attach(attachment);
						});
					}

					if (!this._timerIdPerAttachment[attachment.uniqueID]) {
						this._timerIdPerAttachment[attachment.uniqueID] = window.setInterval(function () { tickHandler(that, attachment); }, this.millisecondsPerTick);
					}
				},

				_detachImpl: function (attachment) {
					/// <summary locid="Blend.Behaviors.TimerBehavior._detachImpl">
					/// Detaches the TimerBehavior
					/// </summary>
					/// <param name="attachment" type="object" domElement="true" locid="Blend.Behaviors.TimerBehavior._attachImpl_p:attachment">
					/// The element on which the behavior is attached. If there is no source specified on the behavior, the attached-element is the source of the behavior
					/// </param>
					if (attachment) {
						this._clearTimerForAttachment(attachment.uniqueID);
						delete this._timerIdPerAttachment[attachment.uniqueID];
					} else {
						for (var uniqueId in this._timerIdPerAttachment) {
							this._clearTimerForAttachment(uniqueId);
						}
						this._timerIdPerAttachment = {};
					}
				},

				_clearTimerForAttachment: function (uniqueId) {
					var timerId = this._timerIdPerAttachment[uniqueId];
					window.clearInterval(timerId);
				},
				
				/// <field type="Blend.Behaviors.TimerBehavior.triggeredActions">
				/// The list of actions to fire when timer ticks
				/// </field>
				triggeredActions: "",

				execute: function (attachment) {
					/// <summary locid="Blend.Behaviors.TimerBehavior.execute">
					/// Executes the actions when timer ticks
					/// </summary>
					/// <param name="attachment" type="object" domElement="true" locid="Blend.Behaviors.TimerBehavior.execute_p:attachment">
					/// The element on which the behavior is attached. If there is no source specified on the behavior, the attached-element is the source of the behavior
					/// </param>
					this.executeActions(attachment);
				},

				executeActions: function (attachment) {
					/// <param name="attachment" type="object" domElement="true" locid="Blend.Behaviors.TimerBehavior.executeActions_p:attachment">
					/// The element on which the behavior is attached. If there is no source specified on the behavior, the attached-element is the source of the behavior
					/// </param>

					// Set attachment so that actions can use it.
					Blend.Actions.setElement(attachment);

					// Call execute on each action in the array and pass in the behavior, source, and a set of source specific variables
					if (this.triggeredActions) {
						this.triggeredActions.forEach(function (action) {
							action.execute(this);
						});
					}
				}
			},
			{ /* static members empty */ },
			{
				// Property Meta-data (for JSON parsing)
				totalTicks: { type: Number },
				millisecondsPerTick: { type: Number },
				triggeredActions: { type: Array, elementType: Blend.Actions.ActionBase }
			}
		)
	});

	function  tickHandler (timerBehavior, attachment) {
		if (timerBehavior._count !== Number.POSITIVE_INFINITY) {
			if (timerBehavior._count < timerBehavior.totalTicks) {
				timerBehavior._count++;
				timerBehavior.execute(attachment);
			} else {
				timerBehavior._detachImpl(attachment);
			}
		} else { /* Always call the triggered action on tick if infinite */
			timerBehavior.execute(attachment);
		}
	}
})(Blend);

//js\Behaviors\EventTriggerBehavior.js

(function (Blend) {
	"use strict";

	Blend.Namespace.defineWithParent(Blend, "Behaviors", {
		/// <summary locid="Blend.Behaviors.EventTriggerBehavior">
		/// Concrete implementation of EventTriggerBehavior, which listen for an event on the source element and fires actions if specified.
		/// </summary>
		/// <name locid="Blend.Behaviors.EventTriggerBehavior">EventTriggerBehavior</name>
		EventTriggerBehavior: Blend.Class.derive(Blend.Behaviors.SelectorSourcedBehavior,
			function EventTriggerBehavior_ctor(configBlock, attachment) {
				/// <summary locid="Blend.Behaviors.EventTriggerBehavior.constructor">
				/// Initializes a new instance of Blend.Behaviors.EventTriggerBehavior that defines an event and fires actions when the event is triggered.
				/// </summary>

				Blend.Behaviors.SelectorSourcedBehavior.call(this, configBlock, attachment);
			},
			{
				_eventListener: null,
				_attachImpl: function (attachment) {
					/// <summary locid="Blend.Behaviors.EventTriggerBehavior._attachImpl">
					/// Attaches the EventTriggerBehavior with the element and sets source if there is no _sourceselector set
					/// </summary>
					/// <param name="attachment" type="object" domElement="true" locid="Blend.Behaviors.EventTriggerBehavior._attachImpl_p:attachment">
					/// The element on which the behavior is attached. If there is no source specified on the behavior, the attached-element is the source of the behavior
					/// </param>


					// Attach all the actions to the attachment element, this will set the target on the actions if not already set.
					if (this.triggeredActions) {
						this.triggeredActions.forEach(function (action) {
							action.attach(attachment);
						});
					}

					// Add sources to the behavior. For EventTriggerBehavior, this will set the EventHandler for the event on the source specified.
					if (!this._sources) {
						this._addSourceImpl(attachment);
					}
				},

				_detachImpl: function (attachment) {
					/// <summary locid="Blend.Behaviors.EventTriggerBehavior._detachImpl">
					/// Detaches a behavior from the attached element
					/// </summary>
					/// <param name="behavior" type="object" locid="Blend.Behaviors.EventTriggerBehavior._detachImpl_p:attachment">
					/// The attached element for this behavior
					/// </param>

					if (!this._sources) {
						this._removeSourceImpl(attachment);
					}
				},

				_addSourceImpl: function (source) {
					/// <summary locid="Blend.Behaviors.EventTriggerBehavior._addSourceImpl">
					/// attaches the EventTriggerBehavior with the element (typically the source)
					/// </summary>
					/// <param name="source" type="object" domElement="true" locid="Blend.Behaviors.EventTriggerBehavior._addSourceImpl_p:source">
					/// The element on which the behavior is attached. If there is no source specified on the behavior, the attached-element is the source of the behavior
					/// </param>


					var that = this;
					// If the event is "load" event, fire it now since we initialize our behaviors runtime on load (which has already fired)
					if (this.event) {
						if (this.event === "load") {
							// Simulate the arguments and pass it on to the action that we manually fire.
							that.execute(source, Blend.Actions.getArguments());
						}
						that._eventListener = function (event) { that.execute(source, event); };
						source.addEventListener(this.event, that._eventListener, false);
					}
				},

				_removeSourceImpl: function (source) {
					/// <summary locid="Blend.Behaviors.EventTriggerBehavior._removeSourceImpl">
					/// Removes the event listener for the source as its going away.
					/// </summary>
					/// <param name="source" type="object" domElement="true" locid="Blend.Behaviors.EventTriggerBehavior._addSourceImpl_p:source">
					/// The source of the behavior.
					/// </param>
					if (source) {
						source.removeEventListener(this.event, this._eventListener);
					}
				},

				_event: null,
				event: {
					get: function () {
						/// <summary locid="Blend.Behaviors.EventTriggerBehavior.event.get">
						/// Returns the event property on the EventTriggerBehavior
						/// </summary>
						/// <returns type="Object" locid="Blend.Behaviors.EventTriggerBehavior.event_returnValue">The value of the event property.</returns>
						return this._event;
					},
					set: function (value) {
						/// <summary locid="Blend.Behaviors.EventTriggerBehavior.event.set">
						/// Sets the value of the event property.
						/// </summary>
						/// <param name="value" type="Object" locid="Blend.Behaviors.EventTriggerBehavior.event.set_p:value">
						/// The value of the event property.
						/// </param>
						var that = this;

						if (value !== this._event) {

							// Remove the old handler
							if (this._event) {
								// Fire CSS Selector and find anything under the whole document which matches the value and add it to the list of sources
								Array.prototype.forEach.call(document.querySelectorAll(this.sourceSelector), function (element) {
									that._removeSourceImpl(element);
								});
							}

							// Set the new handler
							this._event = value;

							// Fire CSS Selector and find anything under the whole document which matches the value and add it to the list of sources
							if (this.sourceSelector !== "") {
								Array.prototype.forEach.call(document.querySelectorAll(this.sourceSelector), function (element) {
									that._addSourceImpl(element);
								});
							}
						}
					}
				},

				/// <field type="Blend.Behaviors.EventTriggerBehavior.triggeredActions">
				/// The list of actions to fire when the event is triggered
				/// </field>
				triggeredActions: "",

				execute: function (source, eventArgs) {
					/// <summary locid="Blend.Behaviors.EventTriggerBehavior.execute">
					/// Executes the behavior when the trigger event is invoked. This calls all the actions in the actionlist.
					/// </summary>
					/// <param name="source" type="object" domElement="true" locid="Blend.Behaviors.EventTriggerBehavior.execute_p:source">
					/// The source on which the event is fired.
					/// </param>
					/// <param name="eventArgs" type="object" locid="Blend.Behaviors.EventTriggerBehavior.execute_p:eventArgs">
					/// The event arguments passed to the action list for this behavior.
					/// </param>

					this.executeActions(source, eventArgs);
				},

				executeActions: function (source, callArgs) {
					/// <summary locid="Blend.Behaviors.EventTriggerBehavior.triggerActions">
					/// Triggers all the actions defined on this event trigger behavior for the source that is passed in.
					/// </summary>
					/// <param name="source" type="object" domElement="true" locid="Blend.Behaviors.EventTriggerBehavior.executeActions_p:source">
					/// The source for the event in the EventTriggerBehavior
					/// </param>
					/// <param name="callArgs" type="object" locid="Blend.Behaviors.EventTriggerBehavior.executeActions_p:callArgs">
					/// The event arguments passed to the action list for this behavior.
					/// </param>


					// Set the element to the source of the event
					Blend.Actions.setElement(source);

					// Set the arguments for the actions to consume
					Blend.Actions.setArguments(callArgs);

					// Call execute on each action in the array and pass in the behavior, source, and a set of source specific variables
					if (this.triggeredActions) {
						this.triggeredActions.forEach(function (action) {
							action.execute(this);
						});
					}
				}
			},
			{ /* static members empty */ },
			{
				// Property Meta-data (for JSON parsing)
				event: { type: String },
				triggeredActions: { type: Array, elementType: Blend.Actions.ActionBase }
			}
		)
	});
})(Blend);

//js\Behaviors\RequestAnimationFrameBehavior.js

(function (Blend) {
	"use strict";

	Blend.Namespace.defineWithParent(Blend, "Behaviors", {
		/// <summary locid="Blend.Behaviors.RequestAnimationFrameBehavior">
		/// Concrete implementation of RequestAnimationFrameBehavior, which listen for timer tick and fires actions if specified.
		/// </summary>
		/// <name locid="Blend.Behaviors.RequestAnimationFrameBehavior">RequestAnimationFrameBehavior</name>
		RequestAnimationFrameBehavior: Blend.Class.derive(Blend.Behaviors.BehaviorBase,
			function RequestAnimationFrameBehavior_ctor(configBlock, attachment) {
				/// <summary locid="Blend.Behaviors.RequestAnimationFrameBehavior.constructor">
				/// Initializes a new instance of Blend.Behaviors.RequestAnimationFrameBehavior
				/// </summary>
				this._requestPerAttachment = {};
				Blend.Behaviors.BehaviorBase.call(this, configBlock, attachment);
			},
			{
				/// <field type="Blend.Behaviors.RequestAnimationFrameBehavior.triggeredActions">
				/// The list of actions to fire when the event is triggered
				/// </field>
				triggeredActions: "",
				_requestPerAttachment: null,

				_attachImpl: function (attachment) {
					/// <summary locid="Blend.Behaviors.RequestAnimationFrameBehavior._attachImpl">
					/// Attaches the RequestAnimationFrameBehavior with the element
					/// </summary>
					/// <param name="attachment" type="object" domElement="true" locid="Blend.Behaviors.RequestAnimationFrameBehavior._attachImpl_p:attachment">
					/// The element on which the behavior is attached. If there is no source specified on the behavior, the attached-element is the source of the behavior
					/// </param>

					if (this.triggeredActions) {
						this.triggeredActions.forEach(function (action) {
							action.attach(attachment);
						});
					}
					var that = this;
					if (!this._requestPerAttachment[attachment.uniqueID]) {
						this._requestPerAttachment[attachment.uniqueID] = window.requestAnimationFrame(function () { callBack(that, attachment); });
					}
				},

				_detachImpl: function (attachment) {
					/// <summary locid="Blend.Behaviors.RequestAnimationFrameBehavior._detachImpl">
					/// Detaches the RequestAnimationFrameBehavior
					/// </summary>
					/// <param name="attachment" type="object" domElement="true" locid="Blend.Behaviors.RequestAnimationFrameBehavior._attachImpl_p:attachment">
					/// The element on which the behavior is attached. If there is no source specified on the behavior, the attached-element is the source of the behavior
					/// </param>
					if (attachment) {
						this._cancelRequestsForAttachment(attachment.uniqueID);
						delete this._requestPerAttachment[attachment.uniqueID];
					} else {
						for (var uniqueId in this._requestPerAttachment) {
							this._cancelRequestsForAttachment(uniqueId);
						}
						this._requestPerAttachment = {};
					}
				},

				_cancelRequestsForAttachment: function (uniqueId) {
					var requestId = this._requestPerAttachment[uniqueId];
					window.cancelAnimationFrame(requestId);
				},

				execute: function (attachment) {
					/// <summary locid="Blend.Behaviors.RequestAnimationFrameBehavior.execute">
					/// Executes the actions when timer ticks
					/// </summary>
					/// <param name="attachment" type="object" domElement="true" locid="Blend.Behaviors.RequestAnimationFrameBehavior.execute_p:attachment">
					/// The element on which the behavior is attached. If there is no source specified on the behavior, the attached-element is the source of the behavior
					/// </param>
					this.executeActions(attachment);
				},

				executeActions: function (attachment) {
					// Set attachment so that actions can use it.
					Blend.Actions.setElement(attachment);

					// Call execute on each action in the array and pass in the behavior, source, and a set of source specific variables
					if (this.triggeredActions) {
						this.triggeredActions.forEach(function (action) {
							action.execute(this);
						});
					}
				}
			},
			{ /* static members empty */ },
			{
				// Property Meta-data (for JSON parsing)
				triggeredActions: { type: Array, elementType: Blend.Actions.ActionBase }
			}
		)
	});

	function callBack (requestAnimationFrameBehavior, attachment) {
		// Call the actions
		requestAnimationFrameBehavior.execute(attachment);

		// Cancel the request for the attached element.
		requestAnimationFrameBehavior._detachImpl(attachment);

		// Call the requestAnimationFrame at animation frame per second.
		requestAnimationFrameBehavior._requestPerAttachment[attachment.uniqueID] = window.requestAnimationFrame(function () { callBack(requestAnimationFrameBehavior, attachment); });
	}
})(Blend);

//js\Behaviors\Behaviors.js
// ActionTree runtime for Blend

/// <reference path="../Blend.js" />
/// <reference path="../Util.js" />
(function (Blend, global) {
	"use strict";
	var _behaviorInstances = {};
	var _elementsWithBehaviors = [];

	// For a blank document, process all the behaviors, when the document is loaded.
	global.document.addEventListener("DOMContentLoaded", function () { processAllImpl(document); }, false);

	// This function will process the ActionTree and the [data-blend-behavior] attribute
	function processActions() {
		/*hardcoded actionlist json file*/
		var actionListFileName = "js/actionList.json";
		try {
			var actionListDef = Blend.Util.loadFile(actionListFileName);
			var actionTreeList = JSON.parse(actionListDef, Blend.Util.jsonReviver);

			if (!actionTreeList) {
				return;
			}

			if (!Array.isArray(actionTreeList)) {
				Blend.Util.reportError("Blend.ActionTrees.JsonNotArray", actionListDef);
				return;
			}

			Blend.ActionTree.actionTrees = Blend.ActionTree.actionTrees || {};

			for (var i = 0; i < actionTreeList.length; i++) {
				var actionTree = actionTreeList[i];
				if (!actionTree) {
					continue;
				}

				// Note that metadata enforces presence of name property during JSON parsing (animation won't
				// be created if it doesn't have a name). When there are duplicates, later version overrides
				// earlier version.
				var actionTreeName = actionTree.name;
				// Add each actionTree to the dictionary with name as the key.
				Blend.ActionTree.actionTrees[actionTreeName] = actionTree;
			}

			// For each action tree, create and register the name in the global namespace.
			for (var name in Blend.ActionTree.actionTrees) {
				Blend.ActionTree.createAndRegisterActionTree(name, Blend.ActionTree.actionTrees[name]);
			}
		} catch (e) {
			// We don't require the actionList file to be present, so we don't generate an error here.
		}
	}

	// WinJs.UI.ProcessAll calls Blend.Behaviors.processAll.
	var hasWinRT = !!global.Windows;
	if (hasWinRT) {
		var originalProcessAll = WinJS.UI.processAll;
		WinJS.UI.processAll = behaviorsProcessAll;
	}

	// This makes sure that the behaviors defined within the fragments are initialized before the fragment is loaded.
	function behaviorsProcessAll(rootElement) {
		Blend.Behaviors.processAll(rootElement);
		return originalProcessAll.call(this, rootElement);
	}

	// Attaching behaviors and actions for the given element
	function attach(element) {
		msWriteProfilerMark("Blend.Behaviors:attach,StartTM");
		var behaviorAttribute = element.getAttribute("data-blend-behavior");
		if (behaviorAttribute) {
			if (Blend.ActionTree.actionTrees) {
				var behaviors = Blend.ActionTree.actionTrees[behaviorAttribute];
				if (!behaviors) {
					behaviors = Blend.Util.parseJson(behaviorAttribute);
				}
				// If we get valid behaviors object, parse it.
				if (behaviors) {
					var behaviorCollection = behaviors.behaviors;
					for (var behaviorCollectionIndex = 0; behaviorCollectionIndex < behaviorCollection.length; behaviorCollectionIndex++) {
						var behavior = behaviorCollection[behaviorCollectionIndex];
						behavior.attach(element);
					}
					_elementsWithBehaviors.push(element);
				}
			}
		}
		msWriteProfilerMark("Blend.Behaviors:attach,StopTM");
	}

	// Detach the existing behavior from the element
	function detach(currentElement) {
		if (_elementsWithBehaviors) {
			var pos = _elementsWithBehaviors.indexOf(currentElement);
			if (pos > -1) {
				var behaviorInstancesForElement = Blend.Behaviors.getBehaviorInstances(currentElement);
				var behaviorInstancesForElementCopy = behaviorInstancesForElement.slice();
				if (behaviorInstancesForElementCopy) {
					behaviorInstancesForElementCopy.forEach(function (behavior) {
						behavior.detach();
					});
				}
				_elementsWithBehaviors.splice(pos, 1);
			}
		}
	}
	// Actual process all implementation for Behaviors, this goes through the elements
	// having data-blend-behavior attribute and calls create on each element.
	function processAllImpl(rootElement) {
		msWriteProfilerMark("Blend.Behaviors:processAll,StartTM");

		msWriteProfilerMark("Blend.Behaviors:processActions,StartTM");
		// ProcessActions first, if any
		processActions();
		msWriteProfilerMark("Blend.Behaviors:processActions,StopTM");

		// Process the [data-blend-behavior] attribute.
		rootElement = rootElement || document;
		var selector = "[data-blend-behavior]";
		// Find elements with the above attribute and attach associated behavior.
		Array.prototype.forEach.call(rootElement.querySelectorAll(selector), function (element) {
			// First detach the existing behavior
			detach(element);
			// Now attach the new behavior
			attach(element);
		});

		msWriteProfilerMark("Blend.Behaviors:processAll,StopTM");
	}

	// Establish members of "Blend.Behaviors" namespace
	Blend.Namespace.defineWithParent(Blend, "Behaviors", {
		processAll: function (rootElement) {
			/// <summary locid="Blend.Behaviors.processAll">
			/// Applies declarative behavior binding to all elements, starting at the specified root element.
			/// </summary>
			/// <param name="rootElement" type="Object" domElement="true" locid="Blend.Behaviors.processAll_p:rootElement">
			/// The element at which to start processing the data-blend-behavior attribute
			/// If this parameter is not specified, the binding is applied to the entire document.
			/// </param>
			processAllImpl(rootElement);
		},

		getBehaviorInstances: function (element) {
			/// <summary locid="Blend.Behaviors.getBehaviorInstances">
			/// returns an array of behaviorInstances attached to the given element.
			/// </summary>
			/// <param name="element" type="object" domElement="true" locid="Blend.Behaviors.getBehaviorInstances_p:element">
			/// The element for which the behavior instances are obtained.
			/// </param>
			/// <returns type="Array" locid="Blend.Behaviors.getBehaviorInstances_returnValue">The array of behavior instances attached to the element.</returns>

			if (_behaviorInstances && element) {
				return _behaviorInstances[element.uniqueID];
			}
		},

		addBehaviorInstance: function (element, behaviorInstance) {
			/// <summary locid="Blend.Behaviors.addBehaviorInstance">
			/// sets the array of behavior instance to the element.
			/// </summary>
			/// <param name="element" type="object" domElement="true" locid="Blend.Behaviors.addBehaviorInstance_p:element">
			/// The element for which the behavior instance is set.
			/// </param>
			/// <param name="behaviorInstance" type="object" locid="Blend.Behaviors.addBehaviorInstance_p:behaviorInstance">
			/// The current behavior instance to be added for the given element
			/// </param>

			var currentBehaviors = Blend.Behaviors.getBehaviorInstances(element) || (_behaviorInstances[element.uniqueID] = []);
			currentBehaviors.push(behaviorInstance);
		}
	});
})(_BlendGlobal.Blend, _BlendGlobal);



// SIG // Begin signature block
// SIG // MIIawwYJKoZIhvcNAQcCoIIatDCCGrACAQExCzAJBgUr
// SIG // DgMCGgUAMGcGCisGAQQBgjcCAQSgWTBXMDIGCisGAQQB
// SIG // gjcCAR4wJAIBAQQQEODJBs441BGiowAQS9NQkAIBAAIB
// SIG // AAIBAAIBAAIBADAhMAkGBSsOAwIaBQAEFBFV67lMgUxk
// SIG // AmqR7Sg5/dWzCEA8oIIVgjCCBMMwggOroAMCAQICEzMA
// SIG // AAAz5SeGow5KKoAAAAAAADMwDQYJKoZIhvcNAQEFBQAw
// SIG // dzELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjEhMB8GA1UEAxMYTWlj
// SIG // cm9zb2Z0IFRpbWUtU3RhbXAgUENBMB4XDTEzMDMyNzIw
// SIG // MDgyM1oXDTE0MDYyNzIwMDgyM1owgbMxCzAJBgNVBAYT
// SIG // AlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQH
// SIG // EwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29y
// SIG // cG9yYXRpb24xDTALBgNVBAsTBE1PUFIxJzAlBgNVBAsT
// SIG // Hm5DaXBoZXIgRFNFIEVTTjpGNTI4LTM3NzctOEE3NjEl
// SIG // MCMGA1UEAxMcTWljcm9zb2Z0IFRpbWUtU3RhbXAgU2Vy
// SIG // dmljZTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC
// SIG // ggEBAMreyhkPH5ZWgl/YQjLUCG22ncDC7Xw4q1gzrWuB
// SIG // ULiIIQpdr5ctkFrHwy6yTNRjdFj938WJVNALzP2chBF5
// SIG // rKMhIm0z4K7eJUBFkk4NYwgrizfdTwdq3CrPEFqPV12d
// SIG // PfoXYwLGcD67Iu1bsfcyuuRxvHn/+MvpVz90e+byfXxX
// SIG // WC+s0g6o2YjZQB86IkHiCSYCoMzlJc6MZ4PfRviFTcPa
// SIG // Zh7Hc347tHYXpqWgoHRVqOVgGEFiOMdlRqsEFmZW6vmm
// SIG // y0LPXVRkL4H4zzgADxBr4YMujT5I7ElWSuyaafTLDxD7
// SIG // BzRKYmwBjW7HIITKXNFjmR6OXewPpRZIqmveIS8CAwEA
// SIG // AaOCAQkwggEFMB0GA1UdDgQWBBQAWBs+7cXxBpO+MT02
// SIG // tKwLXTLwgTAfBgNVHSMEGDAWgBQjNPjZUkZwCu1A+3b7
// SIG // syuwwzWzDzBUBgNVHR8ETTBLMEmgR6BFhkNodHRwOi8v
// SIG // Y3JsLm1pY3Jvc29mdC5jb20vcGtpL2NybC9wcm9kdWN0
// SIG // cy9NaWNyb3NvZnRUaW1lU3RhbXBQQ0EuY3JsMFgGCCsG
// SIG // AQUFBwEBBEwwSjBIBggrBgEFBQcwAoY8aHR0cDovL3d3
// SIG // dy5taWNyb3NvZnQuY29tL3BraS9jZXJ0cy9NaWNyb3Nv
// SIG // ZnRUaW1lU3RhbXBQQ0EuY3J0MBMGA1UdJQQMMAoGCCsG
// SIG // AQUFBwMIMA0GCSqGSIb3DQEBBQUAA4IBAQAC/+OMA+rv
// SIG // fji5uXyfO1KDpPojONQDuGpZtergb4gD9G9RapU6dYXo
// SIG // HNwHxU6dG6jOJEcUJE81d7GcvCd7j11P/AaLl5f5KZv3
// SIG // QB1SgY52SAN+8psXt67ZWyKRYzsyXzX7xpE8zO8OmYA+
// SIG // BpE4E3oMTL4z27/trUHGfBskfBPcCvxLiiAFHQmJkTkH
// SIG // TiFO3mx8cLur8SCO+Jh4YNyLlM9lvpaQD6CchO1ctXxB
// SIG // oGEtvUNnZRoqgtSniln3MuOj58WNsiK7kijYsIxTj2hH
// SIG // R6HYAbDxYRXEF6Et4zpsT2+vPe7eKbBEy8OSZ7oAzg+O
// SIG // Ee/RAoIxSZSYnVFIeK0d1kC2MIIE7DCCA9SgAwIBAgIT
// SIG // MwAAALARrwqL0Duf3QABAAAAsDANBgkqhkiG9w0BAQUF
// SIG // ADB5MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGlu
// SIG // Z3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMV
// SIG // TWljcm9zb2Z0IENvcnBvcmF0aW9uMSMwIQYDVQQDExpN
// SIG // aWNyb3NvZnQgQ29kZSBTaWduaW5nIFBDQTAeFw0xMzAx
// SIG // MjQyMjMzMzlaFw0xNDA0MjQyMjMzMzlaMIGDMQswCQYD
// SIG // VQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4G
// SIG // A1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0
// SIG // IENvcnBvcmF0aW9uMQ0wCwYDVQQLEwRNT1BSMR4wHAYD
// SIG // VQQDExVNaWNyb3NvZnQgQ29ycG9yYXRpb24wggEiMA0G
// SIG // CSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDor1yiIA34
// SIG // KHy8BXt/re7rdqwoUz8620B9s44z5lc/pVEVNFSlz7SL
// SIG // qT+oN+EtUO01Fk7vTXrbE3aIsCzwWVyp6+HXKXXkG4Un
// SIG // m/P4LZ5BNisLQPu+O7q5XHWTFlJLyjPFN7Dz636o9UEV
// SIG // XAhlHSE38Cy6IgsQsRCddyKFhHxPuRuQsPWj/ov0DJpO
// SIG // oPXJCiHiquMBNkf9L4JqgQP1qTXclFed+0vUDoLbOI8S
// SIG // /uPWenSIZOFixCUuKq6dGB8OHrbCryS0DlC83hyTXEmm
// SIG // ebW22875cHsoAYS4KinPv6kFBeHgD3FN/a1cI4Mp68fF
// SIG // SsjoJ4TTfsZDC5UABbFPZXHFAgMBAAGjggFgMIIBXDAT
// SIG // BgNVHSUEDDAKBggrBgEFBQcDAzAdBgNVHQ4EFgQUWXGm
// SIG // WjNN2pgHgP+EHr6H+XIyQfIwUQYDVR0RBEowSKRGMEQx
// SIG // DTALBgNVBAsTBE1PUFIxMzAxBgNVBAUTKjMxNTk1KzRm
// SIG // YWYwYjcxLWFkMzctNGFhMy1hNjcxLTc2YmMwNTIzNDRh
// SIG // ZDAfBgNVHSMEGDAWgBTLEejK0rQWWAHJNy4zFha5TJoK
// SIG // HzBWBgNVHR8ETzBNMEugSaBHhkVodHRwOi8vY3JsLm1p
// SIG // Y3Jvc29mdC5jb20vcGtpL2NybC9wcm9kdWN0cy9NaWND
// SIG // b2RTaWdQQ0FfMDgtMzEtMjAxMC5jcmwwWgYIKwYBBQUH
// SIG // AQEETjBMMEoGCCsGAQUFBzAChj5odHRwOi8vd3d3Lm1p
// SIG // Y3Jvc29mdC5jb20vcGtpL2NlcnRzL01pY0NvZFNpZ1BD
// SIG // QV8wOC0zMS0yMDEwLmNydDANBgkqhkiG9w0BAQUFAAOC
// SIG // AQEAMdduKhJXM4HVncbr+TrURE0Inu5e32pbt3nPApy8
// SIG // dmiekKGcC8N/oozxTbqVOfsN4OGb9F0kDxuNiBU6fNut
// SIG // zrPJbLo5LEV9JBFUJjANDf9H6gMH5eRmXSx7nR2pEPoc
// SIG // sHTyT2lrnqkkhNrtlqDfc6TvahqsS2Ke8XzAFH9IzU2y
// SIG // RPnwPJNtQtjofOYXoJtoaAko+QKX7xEDumdSrcHps3Om
// SIG // 0mPNSuI+5PNO/f+h4LsCEztdIN5VP6OukEAxOHUoXgSp
// SIG // Rm3m9Xp5QL0fzehF1a7iXT71dcfmZmNgzNWahIeNJDD3
// SIG // 7zTQYx2xQmdKDku/Og7vtpU6pzjkJZIIpohmgjCCBbww
// SIG // ggOkoAMCAQICCmEzJhoAAAAAADEwDQYJKoZIhvcNAQEF
// SIG // BQAwXzETMBEGCgmSJomT8ixkARkWA2NvbTEZMBcGCgmS
// SIG // JomT8ixkARkWCW1pY3Jvc29mdDEtMCsGA1UEAxMkTWlj
// SIG // cm9zb2Z0IFJvb3QgQ2VydGlmaWNhdGUgQXV0aG9yaXR5
// SIG // MB4XDTEwMDgzMTIyMTkzMloXDTIwMDgzMTIyMjkzMlow
// SIG // eTELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjEjMCEGA1UEAxMaTWlj
// SIG // cm9zb2Z0IENvZGUgU2lnbmluZyBQQ0EwggEiMA0GCSqG
// SIG // SIb3DQEBAQUAA4IBDwAwggEKAoIBAQCycllcGTBkvx2a
// SIG // YCAgQpl2U2w+G9ZvzMvx6mv+lxYQ4N86dIMaty+gMuz/
// SIG // 3sJCTiPVcgDbNVcKicquIEn08GisTUuNpb15S3GbRwfa
// SIG // /SXfnXWIz6pzRH/XgdvzvfI2pMlcRdyvrT3gKGiXGqel
// SIG // cnNW8ReU5P01lHKg1nZfHndFg4U4FtBzWwW6Z1KNpbJp
// SIG // L9oZC/6SdCnidi9U3RQwWfjSjWL9y8lfRjFQuScT5EAw
// SIG // z3IpECgixzdOPaAyPZDNoTgGhVxOVoIoKgUyt0vXT2Pn
// SIG // 0i1i8UU956wIAPZGoZ7RW4wmU+h6qkryRs83PDietHdc
// SIG // pReejcsRj1Y8wawJXwPTAgMBAAGjggFeMIIBWjAPBgNV
// SIG // HRMBAf8EBTADAQH/MB0GA1UdDgQWBBTLEejK0rQWWAHJ
// SIG // Ny4zFha5TJoKHzALBgNVHQ8EBAMCAYYwEgYJKwYBBAGC
// SIG // NxUBBAUCAwEAATAjBgkrBgEEAYI3FQIEFgQU/dExTtMm
// SIG // ipXhmGA7qDFvpjy82C0wGQYJKwYBBAGCNxQCBAweCgBT
// SIG // AHUAYgBDAEEwHwYDVR0jBBgwFoAUDqyCYEBWJ5flJRP8
// SIG // KuEKU5VZ5KQwUAYDVR0fBEkwRzBFoEOgQYY/aHR0cDov
// SIG // L2NybC5taWNyb3NvZnQuY29tL3BraS9jcmwvcHJvZHVj
// SIG // dHMvbWljcm9zb2Z0cm9vdGNlcnQuY3JsMFQGCCsGAQUF
// SIG // BwEBBEgwRjBEBggrBgEFBQcwAoY4aHR0cDovL3d3dy5t
// SIG // aWNyb3NvZnQuY29tL3BraS9jZXJ0cy9NaWNyb3NvZnRS
// SIG // b290Q2VydC5jcnQwDQYJKoZIhvcNAQEFBQADggIBAFk5
// SIG // Pn8mRq/rb0CxMrVq6w4vbqhJ9+tfde1MOy3XQ60L/svp
// SIG // LTGjI8x8UJiAIV2sPS9MuqKoVpzjcLu4tPh5tUly9z7q
// SIG // QX/K4QwXaculnCAt+gtQxFbNLeNK0rxw56gNogOlVuC4
// SIG // iktX8pVCnPHz7+7jhh80PLhWmvBTI4UqpIIck+KUBx3y
// SIG // 4k74jKHK6BOlkU7IG9KPcpUqcW2bGvgc8FPWZ8wi/1wd
// SIG // zaKMvSeyeWNWRKJRzfnpo1hW3ZsCRUQvX/TartSCMm78
// SIG // pJUT5Otp56miLL7IKxAOZY6Z2/Wi+hImCWU4lPF6H0q7
// SIG // 0eFW6NB4lhhcyTUWX92THUmOLb6tNEQc7hAVGgBd3TVb
// SIG // Ic6YxwnuhQ6MT20OE049fClInHLR82zKwexwo1eSV32U
// SIG // jaAbSANa98+jZwp0pTbtLS8XyOZyNxL0b7E8Z4L5UrKN
// SIG // MxZlHg6K3RDeZPRvzkbU0xfpecQEtNP7LN8fip6sCvsT
// SIG // J0Ct5PnhqX9GuwdgR2VgQE6wQuxO7bN2edgKNAltHIAx
// SIG // H+IOVN3lofvlRxCtZJj/UBYufL8FIXrilUEnacOTj5XJ
// SIG // jdibIa4NXJzwoq6GaIMMai27dmsAHZat8hZ79haDJLmI
// SIG // z2qoRzEvmtzjcT3XAH5iR9HOiMm4GPoOco3Boz2vAkBq
// SIG // /2mbluIQqBC0N1AI1sM9MIIGBzCCA++gAwIBAgIKYRZo
// SIG // NAAAAAAAHDANBgkqhkiG9w0BAQUFADBfMRMwEQYKCZIm
// SIG // iZPyLGQBGRYDY29tMRkwFwYKCZImiZPyLGQBGRYJbWlj
// SIG // cm9zb2Z0MS0wKwYDVQQDEyRNaWNyb3NvZnQgUm9vdCBD
// SIG // ZXJ0aWZpY2F0ZSBBdXRob3JpdHkwHhcNMDcwNDAzMTI1
// SIG // MzA5WhcNMjEwNDAzMTMwMzA5WjB3MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSEwHwYDVQQDExhNaWNyb3NvZnQgVGltZS1T
// SIG // dGFtcCBQQ0EwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAw
// SIG // ggEKAoIBAQCfoWyx39tIkip8ay4Z4b3i48WZUSNQrc7d
// SIG // GE4kD+7Rp9FMrXQwIBHrB9VUlRVJlBtCkq6YXDAm2gBr
// SIG // 6Hu97IkHD/cOBJjwicwfyzMkh53y9GccLPx754gd6udO
// SIG // o6HBI1PKjfpFzwnQXq/QsEIEovmmbJNn1yjcRlOwhtDl
// SIG // KEYuJ6yGT1VSDOQDLPtqkJAwbofzWTCd+n7Wl7PoIZd+
// SIG // +NIT8wi3U21StEWQn0gASkdmEScpZqiX5NMGgUqi+YSn
// SIG // EUcUCYKfhO1VeP4Bmh1QCIUAEDBG7bfeI0a7xC1Un68e
// SIG // eEExd8yb3zuDk6FhArUdDbH895uyAc4iS1T/+QXDwiAL
// SIG // AgMBAAGjggGrMIIBpzAPBgNVHRMBAf8EBTADAQH/MB0G
// SIG // A1UdDgQWBBQjNPjZUkZwCu1A+3b7syuwwzWzDzALBgNV
// SIG // HQ8EBAMCAYYwEAYJKwYBBAGCNxUBBAMCAQAwgZgGA1Ud
// SIG // IwSBkDCBjYAUDqyCYEBWJ5flJRP8KuEKU5VZ5KShY6Rh
// SIG // MF8xEzARBgoJkiaJk/IsZAEZFgNjb20xGTAXBgoJkiaJ
// SIG // k/IsZAEZFgltaWNyb3NvZnQxLTArBgNVBAMTJE1pY3Jv
// SIG // c29mdCBSb290IENlcnRpZmljYXRlIEF1dGhvcml0eYIQ
// SIG // ea0WoUqgpa1Mc1j0BxMuZTBQBgNVHR8ESTBHMEWgQ6BB
// SIG // hj9odHRwOi8vY3JsLm1pY3Jvc29mdC5jb20vcGtpL2Ny
// SIG // bC9wcm9kdWN0cy9taWNyb3NvZnRyb290Y2VydC5jcmww
// SIG // VAYIKwYBBQUHAQEESDBGMEQGCCsGAQUFBzAChjhodHRw
// SIG // Oi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpL2NlcnRzL01p
// SIG // Y3Jvc29mdFJvb3RDZXJ0LmNydDATBgNVHSUEDDAKBggr
// SIG // BgEFBQcDCDANBgkqhkiG9w0BAQUFAAOCAgEAEJeKw1wD
// SIG // RDbd6bStd9vOeVFNAbEudHFbbQwTq86+e4+4LtQSooxt
// SIG // YrhXAstOIBNQmd16QOJXu69YmhzhHQGGrLt48ovQ7DsB
// SIG // 7uK+jwoFyI1I4vBTFd1Pq5Lk541q1YDB5pTyBi+FA+mR
// SIG // KiQicPv2/OR4mS4N9wficLwYTp2OawpylbihOZxnLcVR
// SIG // DupiXD8WmIsgP+IHGjL5zDFKdjE9K3ILyOpwPf+FChPf
// SIG // wgphjvDXuBfrTot/xTUrXqO/67x9C0J71FNyIe4wyrt4
// SIG // ZVxbARcKFA7S2hSY9Ty5ZlizLS/n+YWGzFFW6J1wlGys
// SIG // OUzU9nm/qhh6YinvopspNAZ3GmLJPR5tH4LwC8csu89D
// SIG // s+X57H2146SodDW4TsVxIxImdgs8UoxxWkZDFLyzs7BN
// SIG // Z8ifQv+AeSGAnhUwZuhCEl4ayJ4iIdBD6Svpu/RIzCzU
// SIG // 2DKATCYqSCRfWupW76bemZ3KOm+9gSd0BhHudiG/m4LB
// SIG // J1S2sWo9iaF2YbRuoROmv6pH8BJv/YoybLL+31HIjCPJ
// SIG // Zr2dHYcSZAI9La9Zj7jkIeW1sMpjtHhUBdRBLlCslLCl
// SIG // eKuzoJZ1GtmShxN1Ii8yqAhuoFuMJb+g74TKIdbrHk/J
// SIG // mu5J4PcBZW+JC33Iacjmbuqnl84xKf8OxVtc2E0bodj6
// SIG // L54/LlUWa8kTo/0xggStMIIEqQIBATCBkDB5MQswCQYD
// SIG // VQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4G
// SIG // A1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0
// SIG // IENvcnBvcmF0aW9uMSMwIQYDVQQDExpNaWNyb3NvZnQg
// SIG // Q29kZSBTaWduaW5nIFBDQQITMwAAALARrwqL0Duf3QAB
// SIG // AAAAsDAJBgUrDgMCGgUAoIHGMBkGCSqGSIb3DQEJAzEM
// SIG // BgorBgEEAYI3AgEEMBwGCisGAQQBgjcCAQsxDjAMBgor
// SIG // BgEEAYI3AgEVMCMGCSqGSIb3DQEJBDEWBBRO1OphmjZW
// SIG // CUTm4AdVLxiHbJMBRjBmBgorBgEEAYI3AgEMMVgwVqAq
// SIG // gCgAQgBsAGUAbgBkAC4AUgB1AG4AdABpAG0AZQAuADEA
// SIG // LgAwAC4AagBzoSiAJmh0dHA6Ly9leHByZXNzaW9uL2Js
// SIG // ZW5kLnJ1bnRpbWUuMS4wLmpzMA0GCSqGSIb3DQEBAQUA
// SIG // BIIBACL6eV5FAjuvtSHbrWvF+umLxiAZBB7ycyMaffy2
// SIG // 8/SlAZRp91kX3rZGARONig/3EFuoSf6vylknjTQHzn9Y
// SIG // OjplVLXtxWz2WSXFfgtBAawPEXr6xshC4pqbXJikOLoc
// SIG // cyl430PZgcpFnAzcDQUHvruap/nyBR53ChthoPFufaIT
// SIG // ARJ7nQFDpK/rzQlZ9/BzZr+hXDlLykCmPHsApenbv6kK
// SIG // 5n8GmnepA0vf1JyXLqn2AoWZ6O8cl6vE9tDrD0ocp11X
// SIG // ibgU4lfhdNtSqF3ENTSy3K4wxBU68Y2sx/E8L6pkpHBa
// SIG // l1skr0+g8kojShqLcjzrpvUHGSoloDGjeB/CnzuhggIo
// SIG // MIICJAYJKoZIhvcNAQkGMYICFTCCAhECAQEwgY4wdzEL
// SIG // MAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24x
// SIG // EDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jv
// SIG // c29mdCBDb3Jwb3JhdGlvbjEhMB8GA1UEAxMYTWljcm9z
// SIG // b2Z0IFRpbWUtU3RhbXAgUENBAhMzAAAAM+UnhqMOSiqA
// SIG // AAAAAAAzMAkGBSsOAwIaBQCgXTAYBgkqhkiG9w0BCQMx
// SIG // CwYJKoZIhvcNAQcBMBwGCSqGSIb3DQEJBTEPFw0xMzA2
// SIG // MTIyMTM3MjdaMCMGCSqGSIb3DQEJBDEWBBTs+wlM6iAO
// SIG // C3EvUmTFAgRZgaPg7TANBgkqhkiG9w0BAQUFAASCAQB0
// SIG // gjWf90bkUPR3FRoV5R42enzQ81SaBy9xnPUUV80ZsIjd
// SIG // APleKkerNcaZNysOTRpAuGKgbusKn0xJWBTZ//2eBGqE
// SIG // B1Ki8XdWQtQ/jjzzcpW+ox7M3+9o8Yh4b77xs4E7mfr1
// SIG // ox04dTu2/P7a8Ut0xFWDSR1UilCt0nlNk7HVuR3T8dtz
// SIG // RwIKQ+uJppTJiZT9jdE2OOAo0f9i6SnqEDhimXoNFfu6
// SIG // hBrdy0Jz8Nkosx/pZZ1DedqLpyJvJ3qhZxC9my4KsFlp
// SIG // +w9ZMYOL7crlPqDylsBcU7yCs6Mleu+tjO56qtiAaiVt
// SIG // CczzDwoMYTLEhzPMNwQFwQGKAhFZbSO8
// SIG // End signature block
