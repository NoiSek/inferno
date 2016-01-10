import isVoid from '../util/isVoid';
import isStringOrNumber from '../util/isStringOrNumber';
import createElement from './createElement';
import getNamespace from './getNamespace';
import createStaticTreeChildren from './createStaticTreeChildren';
import createStaticAttributes from './createStaticAttributes';

/**
 *  Create static tree node
 *
 * @param {Object} node
 * @param {Object|null} parentNode
 * @param {String} domNamespace
 */

function createStaticTreeNode(node, parentNode, domNamespace) {

	if (!isVoid(node)) {

		let domNode;

		if (isStringOrNumber(node)) {
			domNode = document.createTextNode(node);
		} else {

			const { tag, text, children, attrs } = node;

			if (tag) {

				domNamespace = getNamespace(node, domNamespace, parentNode);
				domNode = createElement(node, domNamespace);

				if (isStringOrNumber(text)) {
					domNode.textContent = text;
				} else 	if (!isVoid(children)) {
					createStaticTreeChildren(children, domNode, domNamespace);
				}

				if (!isVoid(attrs)) {
					createStaticAttributes(node, domNode);
				}

			} else if (node.text) {
				domNode = document.createTextNode(text);
			}
		}

		if (domNode){
			if (parentNode) {
				parentNode.appendChild(domNode);
			} else {
				return domNode;
			}
		}
	}
}

export default createStaticTreeNode;