import isArray from '../util/isArray';
import isStringOrNumber from '../util/isStringOrNumber';
import createStaticTreeNode from './createStaticTreeNode';

/**
 *  Create static tree children
 *
 * @param {Array|String|Number|Object} children
 * @param {Object|null} parentNode
 * @param {String} domNamespace
 */

function createStaticTreeChildren(children, parentNode, domNamespace) {
	if (isArray(children)) {
		for (let i = 0; i < children.length; i++) {
			const childItem = children[i];

			if (isStringOrNumber(childItem)) {
				parentNode.appendChild(document.createTextNode(childItem));
			} else {
				createStaticTreeNode(childItem, parentNode, domNamespace);
			}
		}
	} else {
		if (isStringOrNumber(children)) {
			parentNode.textContent = children;
		} else {
			createStaticTreeNode(children, parentNode, domNamespace);
		}
	}
}

export default createStaticTreeChildren;