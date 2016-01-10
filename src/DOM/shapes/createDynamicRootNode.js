import isArray from '../../util/isArray';
import isVoid from '../../util/isVoid';
import isStringOrNumber from '../../util/isStringOrNumber';
import { recycle } from '../recycling';
import { getValueWithIndex, removeValueTree } from '../../core/variables';
import { addDOMDynamicAttributes, updateDOMDynamicAttributes, clearListeners } from '../addAttributes';
import recreateRootNode from '../recreateRootNode';
import updateAndAppendDynamicChildren from '../../shared/updateAndAppendDynamicChildren';
import appendText from '../../util/appendText';
import removeChild from '../../core/removeChild';
import replaceChild from '../../core/replaceChild';
import { updateKeyed, updateNonKeyed } from '../domMutate';
import { ROOT_WITH_DYNAMIC_TEXT, ROOT_DYNAMIC_TEXT, ROOT_DYNAMIC_CHILD } from '../bits';

export default function createDynamicRootNode( templateNode, valueIndex, dynamicAttrs, recyclingEnabled) {
	let keyedChildren = true;
	let childNodeList = [];
	const node = {
		pool: [],
		keyedPool: [],
		overrideItem: null,
		create(item, treeLifecycle, context) {
			let domNode;

			if (recyclingEnabled) {
				domNode = recycle(node, item);
				if (domNode) {
					return domNode;
				}
			}

			domNode = templateNode.node.cloneNode(false);

			const value = getValueWithIndex(item, valueIndex);

			switch(templateNode.type) {

				case ROOT_DYNAMIC_TEXT:
					if (!isVoid(value)) {
						if (isStringOrNumber(value)) {
							domNode.nodeValue = value;
						}
					}
					break;
				case ROOT_WITH_DYNAMIC_TEXT:

					if (!isVoid(value)) {

						if (value === '') {
							domNode.appendChild(document.createTextNode(''));
						} else {
							domNode.textContent = value;
						}
					}
					if (dynamicAttrs) {
						addDOMDynamicAttributes( item, domNode, dynamicAttrs, node);
					}

					break;

				case ROOT_DYNAMIC_CHILD:

					if (!isVoid(value)) {
						if (isArray(value)) {
							for (let i = 0; i < value.length; i++) {
								const childItem = value[i];
								// catches edge case where we e.g. have [null, null, null] as a starting point
								if (!isVoid(childItem) && typeof childItem === 'object') {
									const tree = childItem && childItem.tree;

									if (tree) {
										const childNode = childItem.tree.dom.create(childItem, treeLifecycle, context);

										if (childItem.key === undefined) {
											keyedChildren = false;
										}
										childNodeList.push(childNode);
										domNode.appendChild(childNode);
									}
								} else if (isStringOrNumber(childItem)) {
									const textNode = document.createTextNode(childItem);

									domNode.appendChild(textNode);
									childNodeList.push(textNode);
									keyedChildren = false;
								}
							}
						} else if (typeof value === 'object') {
							const tree = value && value.tree;

							if (tree) {
								domNode.appendChild(value.tree.dom.create(value, treeLifecycle, context));
							}

						} else if (isStringOrNumber(value)) {
							domNode.textContent = value;
						}
					}
					if (dynamicAttrs) {
						addDOMDynamicAttributes(item, domNode, dynamicAttrs, node);
					}

					break;
			}

			item.rootNode = domNode;
			return domNode;
		},
		update(lastItem, nextItem, treeLifecycle, context) {

			if (node !== lastItem.tree.dom) {
				recreateRootNode(lastItem, nextItem, node, treeLifecycle);
			} else {

				const domNode = lastItem.rootNode;

				nextItem.rootNode = domNode;
				nextItem.id = lastItem.id;

				const nextValue = getValueWithIndex(nextItem, valueIndex);
				const lastValue = getValueWithIndex(lastItem, valueIndex);

				switch(templateNode.type) {

					case ROOT_DYNAMIC_TEXT:

						if (nextValue !== lastValue) {
							if (isStringOrNumber(nextValue)) {
								domNode.nodeValue = nextValue;
							}
						}
						break;

					case ROOT_WITH_DYNAMIC_TEXT:

						if (nextValue !== lastValue) {
							if (isVoid(nextValue)) {
								if (isVoid(lastValue)) {
									domNode.firstChild.nodeValue = '';
								} else {
									domNode.textContent = '';
								}
							} else {

								if (isVoid(lastValue)) {
									domNode.textContent = nextValue;
								} else {
									domNode.firstChild.nodeValue = nextValue;
								}
							}
						}

						if (!isVoid( dynamicAttrs)) {
							updateDOMDynamicAttributes(lastItem, nextItem, domNode, dynamicAttrs);
						}
						break;

					case ROOT_DYNAMIC_CHILD:
						if (nextValue && isVoid(lastValue)) {
							if (typeof nextValue === 'object') {
								if (isArray(nextValue)) {
									updateAndAppendDynamicChildren(domNode, nextValue);
								} else {
									recreateRootNode(lastItem, nextItem, node, treeLifecycle, context);
								}
							} else {
								domNode.appendChild(document.createTextNode(nextValue));
							}
						} else if (lastValue && isVoid(nextValue)) {
							if (isArray(lastValue)) {
								for (let i = 0; i < lastValue.length; i++) {
									if (!isVoid(domNode.childNodes[i])) {
										domNode.removeChild(domNode.childNodes[i]);
									} else {
										removeChild(domNode);
									}
								}
							} else {
								removeChild(domNode);
							}
						} else if (nextValue !== lastValue) {
							if (isStringOrNumber(nextValue)) {
								appendText(domNode, nextValue);
							} else if (isVoid(nextValue)) {
								if (domNode !== null) {
									replaceChild(domNode, document.createTextNode(''));
								}
								// if we update from undefined, we will have an array with zero length.
								// If we check if it's an array, it will throw 'x' is undefined.
							} else if (isArray(nextValue)) {
								if (isArray(lastValue)) {
									if (keyedChildren) {
										updateKeyed(nextValue, lastValue, domNode, null, treeLifecycle, context);
									} else {
										updateNonKeyed(nextValue, lastValue, childNodeList, domNode, null, treeLifecycle, context);
									}
								} else {
									updateNonKeyed(nextValue, [], childNodeList, domNode, null, treeLifecycle, context);
								}
							} else if (typeof nextValue === 'object') {
								// Sometimes 'nextValue' can be an empty array or nothing at all, then it will
								// throw ': nextValue.tree is undefined'.
								const tree = nextValue && nextValue.tree;
								if (!isVoid(tree)) {
									if (!isVoid(lastValue)) {
										// If we update from 'null', there will be no 'tree', and the code will throw.
										const oldTree = lastValue && lastValue.tree;

										if (!isVoid(oldTree)) {
											tree.dom.update(lastValue, nextValue, treeLifecycle, context);
										} else {
											recreateRootNode(lastItem, nextItem, node, treeLifecycle, context);
										}
									} else {
										replaceChild(domNode, tree.dom.create(nextValue, treeLifecycle, context));
									}
								} else {
									// Edge case! If we update from e.g object literal - {} - from a existing value, the
									// value will not be unset
									removeChild(domNode);
								}
							}
						}
						if (dynamicAttrs) {
							updateDOMDynamicAttributes(lastItem, nextItem, domNode, dynamicAttrs);
						}
						break;
				}
			}
		},
		remove(item, treeLifecycle) {

			switch(templateNode.type) {
				case ROOT_WITH_DYNAMIC_TEXT:
					if (dynamicAttrs) {
						clearListeners(item, item.rootNode, dynamicAttrs);
					}

					break;
				case ROOT_DYNAMIC_CHILD:
					removeValueTree(getValueWithIndex(item, valueIndex), treeLifecycle);
					if (dynamicAttrs) {
						clearListeners(item, item.rootNode, dynamicAttrs);
					}
					break;
			}
		}
	};

	return node;
}
