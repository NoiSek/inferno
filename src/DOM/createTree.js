import isArray from '../util/isArray';
import isVoid from '../util/isVoid';
import isStringOrNumber from '../util/isStringOrNumber';
import createStaticRootNodes from './shapes/createStaticRootNodes';
import createDynamicRootNode from './shapes/createDynamicRootNode';
import createDynamicNode from './shapes/createDynamicNode';
import createNodeWithStaticChild from './shapes/nodeWithStaticChild';
import createNodeWithComponent from './shapes/nodeWithComponent';
import createRootNodeWithComponent from './shapes/rootNodeWithComponent';
import createRootNodeWithDynamicSubTreeForChildren from './shapes/rootNodeWithDynamicSubTreeForChildren';
import createNodeWithDynamicSubTreeForChildren from './shapes/nodeWithDynamicSubTreeForChildren';
import dynamicNode from './shapes/dynamicNode';
import { ObjectTypes } 	from '../core/variables';
import { addDOMStaticAttributes } from './addAttributes';
import { isRecyclingEnabled } from './recycling';
import createNode from './shapes/createNode';
import createElement from './createElement';
import getNamespace from './getNamespace';
import createStaticAttributes from './createStaticAttributes';
import createStaticTreeChildren from './createStaticTreeChildren';
import createStaticTreeNode from './createStaticTreeNode';

import { ROOT_STATIC_CHILD,
	ROOT_STATIC_NODE,
	ROOT_WITH_DYNAMIC_TEXT,
	ROOT_DYNAMIC_TEXT,
	ROOT_VOID_NODE,
	ROOT_DYNAMIC_CHILD,
	DYNAMIC_TEXT_NODE,
	DYNAMIC_CHILD_NODE,
	VOID_NODE,
	STATIC_NODE } from './bits';

const recyclingEnabled = isRecyclingEnabled();

function createDOMTree(schema, isRoot, dynamicNodeMap, domNamespace) {

	const dynamicFlags = dynamicNodeMap.get(schema);

	let node;
	let templateNode;

	if (!dynamicFlags) {
		templateNode = createStaticTreeNode(schema, null, domNamespace, schema);

		if (templateNode) {

			if (isRoot) {
				node = createStaticRootNodes({ node: templateNode, type: ROOT_STATIC_NODE }, recyclingEnabled);
			} else {
				node = createNode({ node: templateNode, type: STATIC_NODE });
			}
		}

	} else {

		const { TEXT, NODE,  ATTRS, CHILDREN } = dynamicFlags;

		if (NODE === true) {
			node = dynamicNode(schema.index, domNamespace);
		} else {

			const { tag, text } = schema;

			if (tag) {
				if (tag.type === ObjectTypes.VARIABLE) {
					const lastAttrs = schema.attrs;
					const attrs = { ...lastAttrs };
					const children = schema.children;

					if (children) {
						if (isArray(children)) {
							if (children.length > 1) {
								attrs.children = [];
								for (let i = 0; i < children.length; i++) {
									const childNode = children[i];

									attrs.children.push(createDOMTree(childNode, false, dynamicNodeMap, domNamespace));
								}
							} else if (children.length === 1) {
								attrs.children = createDOMTree(children[0], false, dynamicNodeMap, domNamespace);
							}
						} else {
							attrs.children = createDOMTree(children, false, dynamicNodeMap, domNamespace);
						}
					}
					if (isRoot) {
						return createRootNodeWithComponent(tag.index, attrs, children, domNamespace, recyclingEnabled);
					} else {
						return createNodeWithComponent(tag.index, attrs, children, domNamespace);
					}
				} else {

					domNamespace = getNamespace(schema, domNamespace, null);
					templateNode = createElement(schema, domNamespace);

					const attrs = schema.attrs;
					let dynamicAttrs = null;

					if (!isVoid(attrs)) {
						if (ATTRS === true) {
							dynamicAttrs = attrs;
						} else if (ATTRS !== false) {
							dynamicAttrs = ATTRS;
							createStaticAttributes(schema, templateNode, dynamicAttrs);
						} else {
							createStaticAttributes(schema, templateNode);
						}
					}

					const children = schema.children;

					if (!isVoid(text)) {

						if (dynamicFlags.TEXT === true) {

							if (isRoot) {
								node = createDynamicRootNode({ node: templateNode, type: ROOT_WITH_DYNAMIC_TEXT }, text.index, dynamicAttrs, recyclingEnabled);
							} else {
								node = createDynamicNode({ node: templateNode, type: DYNAMIC_TEXT_NODE }, text.index, dynamicAttrs);
							}
						} else {
							if (isStringOrNumber(text)) {
								templateNode.textContent = text;
							}

							if (isRoot) {
								node = createStaticRootNodes( { node: templateNode, type: ROOT_STATIC_CHILD }, dynamicAttrs, recyclingEnabled);
							} else {
								node = createNodeWithStaticChild({ node: templateNode }, dynamicAttrs);
							}
						}
					} else {
						if (!isVoid(children)) {
							if (children.type === ObjectTypes.VARIABLE) {
								if (isRoot) {
									node = createDynamicRootNode(
										{ node: templateNode, type: ROOT_DYNAMIC_CHILD }, children.index, dynamicAttrs, recyclingEnabled
									);
								} else {
									node = createDynamicNode(
										{ node: templateNode, type: DYNAMIC_CHILD_NODE }, children.index, dynamicAttrs
									);
								}
							} else if (CHILDREN === true) {
								let subTreeForChildren = [];

								if (typeof children === 'object') {
									if (isArray(children)) {
										for (let i = 0; i < children.length; i++) {
											const childItem = children[i];

											subTreeForChildren.push(createDOMTree(childItem, false, dynamicNodeMap));
										}
									} else {
										subTreeForChildren = createDOMTree(children, false, dynamicNodeMap);
									}
								}
								if (isRoot) {
									node = createRootNodeWithDynamicSubTreeForChildren(
										{ node: templateNode }, subTreeForChildren, dynamicAttrs, recyclingEnabled
									);
								} else {
									node = createNodeWithDynamicSubTreeForChildren(
										{ node: templateNode }, subTreeForChildren, dynamicAttrs
									);
								}
							} else if (isStringOrNumber(children)) {
								templateNode.textContent = children;
								if (isRoot) {
									node = createStaticRootNodes({ node: templateNode, type: ROOT_STATIC_CHILD }, dynamicAttrs, recyclingEnabled);
								} else {
									node = createNodeWithStaticChild({ node: templateNode }, dynamicAttrs);
								}
							} else {
								const childNodeDynamicFlags = dynamicNodeMap.get(children);

								if (childNodeDynamicFlags === undefined) {
									createStaticTreeChildren(children, templateNode);

									if (isRoot) {
										node = createStaticRootNodes({ node: templateNode, type: ROOT_STATIC_CHILD }, dynamicAttrs, recyclingEnabled);
									} else {
										node = createNodeWithStaticChild({ node: templateNode }, dynamicAttrs);
									}
								}
							}
						} else {
							if (isRoot) {
								node = createStaticRootNodes({ node: templateNode, type: ROOT_VOID_NODE }, dynamicAttrs, recyclingEnabled);
							} else {
								node = createNode({ node: templateNode, type: VOID_NODE }, dynamicAttrs);
							}
						}
					}
				}
			} else if (text) {
				node = createDynamicRootNode({ node: document.createTextNode(''), type: ROOT_DYNAMIC_TEXT }, text.index);
			}
		}
	}
	return node;
}

export default createDOMTree;