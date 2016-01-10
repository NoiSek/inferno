import isSVGElement from '../util/isSVGElement';
import isMathMLElement from '../util/isMathMLElement';

function getNamespace(schema, domNamespace, parentNode) {
	const MathNamespace = 'http://www.w3.org/1998/Math/MathML';
	const SVGNamespace = 'http://www.w3.org/2000/svg';
	const nodeName = schema.tag.toLowerCase();
	const xmlns = schema.attrs && schema.attrs.xmlns;

	if (domNamespace === undefined) {
		if (xmlns) {
			domNamespace = xmlns;
		} else {
			switch (nodeName) {
				case 'svg':
					domNamespace = SVGNamespace;
					break;
				case 'math':
					domNamespace = MathNamespace;
					break;
				default:
					// Edge case. In case a namespace element are wrapped inside a non-namespace element, it will inherit wrong namespace.
					// E.g. <div><svg><svg></div> - will not work
					if (parentNode) { // only used by static children
						// check only for top-level element for both mathML and SVG
						if (nodeName === 'svg' && (parentNode.namespaceURI !== SVGNamespace)) {
							domNamespace = SVGNamespace;
						} else if (nodeName === 'math' && (parentNode.namespaceURI !== MathNamespace)) {
							domNamespace = MathNamespace;
						}
					} else if (isSVGElement(nodeName)) {
						domNamespace = SVGNamespace;
					} else if (isMathMLElement(nodeName)) {
						domNamespace = MathNamespace;
					}
			}
		}
	}

	return domNamespace;
}

export default getNamespace;