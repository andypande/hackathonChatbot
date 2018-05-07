module.exports = {
	"title": "Structured Content LiveEngage",
	"description": "Generate Structured Content for LiveEngage",
	"definitions": {
		"actions": {
			"navigate": {
				"type": "object",
				"properties": {
					"type": {
						"type": "string"
					},
					"lo": {
						"type": ["number", "string"]
					},
					"la": {
						"type": ["number", "string"]
					}
				},
				"required": ["type", "lo", "la"]
			},
			"link": {
				"type": "object",
				"properties": {
					"type": {
						"type": "string"
					},
					"uri": {
						"type": "string"
					},
					"ios": {
						"type": "string"
					},
					"android": {
						"type": "string"
					},
					"web": {
						"type": "string"
					}
				},
				"required": ["type", "uri"]
			},
			"publishText": {
				"type": "object",
				"properties": {
					"type": {
						"type": "string"
					},
					"text": {
						"type": "string"
					}
				},
				"required": ["type", "text"]
			}
		},
		"elements": {
			"text": {
				"type": "object",
				"description": "text element",
				"properties": {
					"type": {
						"type": "string"
					},
					"text": {
						"type": "string"
					},
					"tooltip": {
						"type": "string"
					},
					"rtl": {
						"type": "boolean"
					}
				},
				"required": ["type", "text"]
			},
			"button": {
				"type": "object",
				"description": "button element",
				"properties": {
					"type": {
						"type": "string"
					},
					"title": {
						"type": "string"
					},
					"click": {
						"type": "object",
						"properties": {
							"metadata": {
								"type": "array"
							},
							"actions": {
								"type": "array",
								"items": {
									"anyOf": [{
											"title": "navigate",
											"$ref": "#/definitions/actions/navigate"
										},
										{
											"title": "link",
											"$ref": "#/definitions/actions/link"
										},
										{
											"title": "publishText",
											"$ref": "#/definitions/actions/publishText"
										}
									]
								}
							}
						}
					}
				},
				"required": ["type", "title"]
			},
			"map": {
				"type": "object",
				"description": "maps element",
				"properties": {
					"type": {
						"type": "string"
					},
					"lo": {
						"type": ["number", "string"]
					},
					"la": {
						"type": ["number", "string"]
					},
					"tooltip": {
						"type": "string"
					},
					"click": {
						"type": "object",
						"properties": {
							"metadata": {
								"type": "array"
							},
							"actions": {
								"type": "array",
								"items": {
									"anyOf": [{
											"title": "navigate",
											"$ref": "#/definitions/actions/navigate"
										},
										{
											"title": "link",
											"$ref": "#/definitions/actions/link"
										},
										{
											"title": "publishText",
											"$ref": "#/definitions/actions/publishText"
										}
									]
								}
							}
						}
					}
				},
				"required": ["type", "lo", "la"]
			},
			"image": {
				"type": "object",
				"description": "image element",
				"properties": {
					"type": {
						"type": "string"
					},
					"url": {
						"type": "string"
					},
					"caption": {
						"type": "string"
					},
					"tooltip": {
						"type": "string"
					},
					"rtl": {
						"type": "string"
					},
					"click": {
						"type": "object",
						"properties": {
							"metadata": {
								"type": "array"
							},
							"actions": {
								"type": "array",
								"items": {
									"anyOf": [{
											"title": "navigate",
											"$ref": "#/definitions/actions/navigate"
										},
										{
											"title": "link",
											"$ref": "#/definitions/actions/link"
										},
										{
											"title": "publishText",
											"$ref": "#/definitions/actions/publishText"
										}
									]
								}
							}
						}
					}
				},
				"required": ["type", "url"]
			},
			"layout": {
				"type": "object",
				"description": "layout element",
				"properties": {
					"type": {
						"enum": ["vertical", "horizontal"]
					},
					"elements": {
						"type": "array",
						"items": {

							"anyOf": [{
								"title": "layout",
								"$ref": "#/definitions/elements/layout"
							},
							{
								"title": "image",
								"$ref": "#/definitions/elements/image"
							},
							{
								"title": "button",
								"$ref": "#/definitions/elements/button"
							},
							{
								"title": "text",
								"$ref": "#/definitions/elements/text"
							},
							{
								"title": "map",
								"$ref": "#/definitions/elements/map"
							}
							]
						}
					}
				},
				"required": ["type", "elements"]
			}
		}
	},
	"type": "object",
	"oneOf": [{
			"title": "layout",
			"$ref": "#/definitions/elements/layout"
		},
		{
			"title": "image",
			"$ref": "#/definitions/elements/image"
		},
		{
			"title": "button",
			"$ref": "#/definitions/elements/button"
		},
		{
			"title": "text",
			"$ref": "#/definitions/elements/text"
		},
		{
			"title": "map",
			"$ref": "#/definitions/elements/map"
		}
	]

};