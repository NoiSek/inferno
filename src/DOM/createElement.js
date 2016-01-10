import isSVGElement from '../util/isSVGElement';
import isMathMLElement from '../util/isMathMLElement';

function createElement(schema, domNamespace) {
	const nodeName = schema.tag.toLowerCase();
	const is = schema.attrs && schema.attrs.is;

	return domNamespace ?
		is ?
			document.createElementNS(domNamespace, nodeName, is) :
			document.createElementNS(domNamespace, nodeName) :
		is ?
			document.createElement(nodeName, is) :
			document.createElement(nodeName);
}

export default createElement;